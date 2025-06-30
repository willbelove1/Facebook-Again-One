/**
 * Module: blockSponsored (Fixed Version 2025)
 * Mục đích: Nhận diện bài đăng được tài trợ với độ chính xác cao - CHỈ TRÊN TRANG CHỦ
 * Fixed: Syntax errors và performance issues, chỉ hoạt động trên news feed
 * Cập nhật: Không hoạt động trên trang cá nhân để tránh ẩn bài viết thường
 * Adapted for FBCMF Extension (Manifest V3)
 */
async function BlockSponsoredModule({ DOMUtils, settings, FilterRegistry }) { // Renamed and accept ctx components
  'use strict';

  // Early exit if dependencies are missing or feature is disabled
  if (!FilterRegistry) {
    console.error('[FBCMF BlockSponsored] FilterRegistry is not available. Module cannot function.');
    return;
  }
  // Settings might not be fully populated when this module function is defined,
  // but they will be when FilterRegistry.register calls the filter function.
  // The init() function below will check settings.blockSponsored before activating.

  // Helper: Check if the current page is the Facebook homepage
  function isHomePage() {
    const url = new URL(window.location.href);
    if (url.hostname !== 'www.facebook.com' && url.hostname !== 'facebook.com' && url.hostname !== 'web.facebook.com') return false;
    const path = url.pathname;
    if (path.length > 1 && path !== '/') return false; // Only root path
    if (url.searchParams.has('id') || (url.searchParams.has('sk') && url.searchParams.get('sk') !== 'h_chr')) {
      return false; // Avoid profile pages or specific 'sk' views other than news feed
    }
    return true;
  }

  let isActive = false; // Module's operational state
  let urlObserver = null; // For MutationObserver
  const sponsoredCache = new WeakMap(); // Cache for detected posts
  // const confirmedAds = []; // For debug logging, can be re-enabled if needed with FBCMF_SponsoredDebug
  // const manuallyHiddenPosts = new WeakMap(); // For debug logging

  const SPONSORED_PATTERNS = {
    vietnamese: ['đượctàitrợ', 'được tài trợ', 'tài trợ', 'quảng cáo', 'sponsored'],
    english: ['sponsored', 'paidpartnership', 'paid partnership', 'advertisement', 'promoted', 'ad', 'commercial', 'marketing'],
    regex: [/sponsored/i, /tài\s*trợ/i, /quảng\s*cáo/i, /được\s*tài\s*trợ/i, /paid\s*partnership/i]
  };

  const SPONSORED_SELECTORS = [
    '[aria-label*="Sponsored"]', '[aria-label*="Được tài trợ"]', '[aria-label*="quảng cáo"]',
    '[aria-label*="Why am I seeing this ad"]', '[aria-label*="Tại sao tôi thấy quảng cáo này"]',
    '[data-testid*="sponsored"]',
    // jQuery :contains is not standard, will handle manually if needed or use XPath
    // For simplicity, relying on aria-labels and direct text checks first.
    // 'span:contains("Sponsored")', 'span:contains("Được tài trợ")' // These need special handling
  ];

  // Standardized logging through FBCMF context if available, or console
  function log(message, level = 'info') { // Default to info for less noise
    const effectiveSettings = settings || (typeof FBCMF !== 'undefined' && FBCMF.settings); // Access settings via closure or global FBCMF if needed early
    if (effectiveSettings?.verbosity === 'verbose' || level === 'error' || level === 'warn') {
      console[level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log')](`[FBCMF BlockSponsored] ${message}`);
    }
  }

  function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[\s\u00A0\u2000-\u200B\u2028\u2029]/g, '').replace(/[^\w]/g, '');
  }

  function checkTextPatterns(text) {
    if (!text) return false;
    const normalized = normalizeText(text);
    const originalLower = text.toLowerCase();
    for (const langKey in SPONSORED_PATTERNS) {
      if (langKey === 'regex') {
        for (const pattern of SPONSORED_PATTERNS.regex) {
          if (pattern.test(originalLower)) return true;
        }
      } else {
        for (const pattern of SPONSORED_PATTERNS[langKey]) {
          if (normalized.includes(normalizeText(pattern))) return true;
        }
      }
    }
    return false;
  }

  // Function to check a single post for sponsored content
  function isPostSponsored(postNode) {
    if (!isActive || !isHomePage()) return false;
    if (!postNode || !(postNode instanceof Element)) return false;
    if (sponsoredCache.has(postNode)) return sponsoredCache.get(postNode);

    let result = false;
    try {
      // Check selectors
      for (const selector of SPONSORED_SELECTORS) {
        if (postNode.querySelector(selector)) {
          result = true;
          break;
        }
      }
      // Check for text "Sponsored" or "Được tài trợ" in spans (more robustly)
      if (!result) {
          const spans = DOMUtils.query('span', postNode); // Use DOMUtils from context
          for (const span of spans.slice(0, 15)) { // Check first few spans for performance
              const textContent = span.textContent || "";
              if (textContent.trim() === "Sponsored" || textContent.trim() === "Được tài trợ") {
                  result = true;
                  break;
              }
          }
      }
      // Check aria-labels
      if (!result) {
        const ariaElements = DOMUtils.query('[aria-label]', postNode);
        for (const el of ariaElements) {
          if (checkTextPatterns(el.getAttribute('aria-label'))) {
            result = true;
            break;
          }
        }
      }
      // Check text content of specific header-like elements
      if (!result) {
        const headerSelectors = ['h3', 'h4', 'h5', '[role="link"][tabindex="0"]', '[data-testid*="story-header"]', '[data-testid*="post-header"]'];
        for (const selector of headerSelectors) {
          const headers = DOMUtils.query(selector, postNode);
          for (const header of headers) {
            if (checkTextPatterns(header.textContent)) {
              result = true;
              break;
            }
          }
          if (result) break;
        }
      }
    } catch (e) {
      log(`Error during sponsored check: ${e.message}`, 'error');
      result = false;
    }
    sponsoredCache.set(postNode, result);
    if (result) log('Sponsored post detected.', 'verbose');
    return result;
  }

  // Removed setupHideButtonListeners and checkForAdConfirmation for simplicity in this refactor.
  // These were for advanced logging/confirmation and can be added back if FBCMF_SponsoredDebug is re-integrated.

  function handleUrlChangeInternal() { // Renamed to avoid conflict if other modules use same name
    const wasActive = isActive;
    // Access settings through the closure `settings` passed to the module
    const shouldBeActive = isHomePage() && settings?.blockSponsored;
    
    if (shouldBeActive && !wasActive) {
      log('Homepage detected - Activating BlockSponsored.', 'verbose');
      isActive = true;
    } else if (!shouldBeActive && wasActive) {
      log('Left homepage - Pausing BlockSponsored.', 'verbose');
      isActive = false;
    }
  }

  function setupUrlObserverInternal() { // Renamed
    if (urlObserver) return; // Already set up
    window.addEventListener('popstate', handleUrlChangeInternal);
    urlObserver = new MutationObserver(handleUrlChangeInternal);
    urlObserver.observe(document.documentElement, { childList: true, subtree: true }); // Observe root for URL changes
    log('URL observer set up.', 'verbose');
  }

  // Initialization logic for this module
  function moduleInit() {
    // Check settings again, as they might have loaded/changed by the time init is called
    if (!settings?.blockSponsored) {
      log('Feature "blockSponsored" is disabled in settings. Module will not activate.', 'info');
      isActive = false;
      if (urlObserver) { // Disconnect observer if feature is turned off
          urlObserver.disconnect();
          window.removeEventListener('popstate', handleUrlChangeInternal);
          urlObserver = null;
      }
      return;
    }

    log('Module init called. Setting up URL observer and initial state.', 'verbose');
    setupUrlObserverInternal();
    handleUrlChangeInternal(); // Initial check

    // Register with FilterRegistry
    FilterRegistry.register('blockSponsored', (postNode) => {
      // The 'settings' object available here is the one from the FBCMF context, updated by SettingsManager
      if (settings.blockSponsored && isPostSponsored(postNode)) {
        return 'Sponsored Content (Hidden by FBCMF)';
      }
      return '';
    });

    log('Filter registered with FilterRegistry.', 'verbose');
  }

  function moduleDestroy() {
    isActive = false;
    if (urlObserver) {
      urlObserver.disconnect();
      urlObserver = null;
    }
    window.removeEventListener('popstate', handleUrlChangeInternal);
    // Un-register from FilterRegistry if a method exists, or this module just stops returning true.
    // For now, FilterRegistry doesn't have unregister. The check `settings.blockSponsored` handles disabling.
    log('Module destroyed (or disabled).', 'verbose');
  }

  // --- Module's main initialization call ---
  // This will be effectively called by FBCMF core after all modules are loaded and ctx is ready.
  // The module should not run its full init until FBCMF core says so,
  // but it needs to register its filter. The activation logic (URL observing) can be in init.

  // The actual initialization of URL observation and state will be triggered by FBCMF core calling moduleInit.
  // The registration of the filter function happens when this module function is executed by FBCMF.
  if (FilterRegistry) {
     moduleInit(); // Call moduleInit to register filter and set up listeners
  } else {
     log("FilterRegistry not available at the time of BlockSponsored module definition. Filter not registered.", "error");
  }

  // Return an API for the module if needed (e.g., for manual triggering or stats)
  // For now, its primary action is through FilterRegistry.
  return {
    // publicMethod: () => { ... }
    // No public methods strictly needed by other modules for now.
    // Debug capabilities were removed for this refactor pass.
  };
}
