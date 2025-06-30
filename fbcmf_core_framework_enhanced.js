

/**
 * FBCMF - Facebook Cleaner Modular Framework (Core)
 * Kiến trúc mở rộng (Extensible Architecture) cho các module gắn thêm
 * Phiên bản: 1.3.0 (Delegates settings to SettingsManager using GM Storage)
 */
// FBCMF - Facebook Cleaner Modular Framework (Core)
// Adapted for Manifest V3 Chrome Extension
// Phiên bản: 2.0.0 (Extension Adaptation)

// This function will be called by content_bundle.js to create and initialize the framework instance.
function createFBCMF() {
  'use strict';

  const FBCMF_INSTANCE = {
    modules: new Map(),
    settings: {}, // Will be populated by SettingsManager
    context: {},
    initialized: false,

    registerModule(name, moduleFn) {
      if (typeof moduleFn !== 'function') {
        console.warn(`[FBCMF] Module "${name}" is not a valid function.`);
        return;
      }
      this.modules.set(name, moduleFn);
      // console.log(`[FBCMF] Module "${name}" registered.`); // Logging verbosity depends on settings
    },

    async init() {
      // DOM readiness check (setTimeout might not be ideal in content scripts if they are terminated/re-injected)
      // For extensions, content scripts are typically injected when DOM is ready or idle.
      // This check is more of a safeguard.
      if (!document.head || !document.body) {
        console.warn('[FBCMF] DOM not ready, retrying init in 1s. This might indicate an issue with script injection timing.');
        // In an extension context, rather than setTimeout, the injection timing itself should be managed.
        // However, for minimal changes now:
        if (!this.initTimeout) { // Prevent multiple timeouts
            this.initTimeout = setTimeout(() => {
                delete this.initTimeout; // Clear before retry
                this.init();
            }, 1000);
        }
        return;
      }
      
      if (this.initialized) {
        console.log('[FBCMF] Framework already initialized.');
        return;
      }
      
      console.log('[FBCMF] 🚀 Initializing Core Framework (Extension Version)...');

      this.context = {
        DOMUtils: this.DOMUtils,
        injectCSS: this.injectCSS.bind(this), // Bind `this` for injectCSS to access FBCMF_INSTANCE context if needed
        // SettingsManager will populate settings and its API (saveSettings, loadSettings etc.)
      };
      console.log('[FBCMF] Initial context created.');

      const settingsManagerName = 'SettingsManager';
      if (this.modules.has(settingsManagerName)) {
        try {
          console.log(`[FBCMF] Initializing core module: "${settingsManagerName}"...`);
          const settingsAPI = await this.modules.get(settingsManagerName)(this.context); // Pass context
          
          if (settingsAPI && typeof settingsAPI === 'object') {
            Object.assign(this.context, settingsAPI); // Merge SettingsManager API into context
            this.context.settings = settingsAPI.getCurrentSettings ? settingsAPI.getCurrentSettings() : {};
            this.settings = this.context.settings; // Keep top-level FBCMF_INSTANCE.settings in sync
            console.log(`[FBCMF] ✅ Core module "${settingsManagerName}" loaded. Context updated.`);
            if (this.context.settings?.verbosity === 'verbose') {
               console.log('[FBCMF] Verbose logging enabled.');
               console.log('[FBCMF] Context keys after SettingsManager:', Object.keys(this.context));
            }
          } else {
             console.error(`[FBCMF] ❌ Core module "${settingsManagerName}" did not return a valid API object.`);
             this.context.settings = {}; // Ensure context.settings exists
             this.settings = {};
          }
        } catch (e) {
          console.error(`[FBCMF] ❌ Core module "${settingsManagerName}" initialization failed:`, e);
          this.context.settings = {};
          this.settings = {};
        }
      } else {
        console.error(`[FBCMF] ❌ CRITICAL: Core module "${settingsManagerName}" not found. Settings cannot be loaded.`);
        return; // Cannot proceed without settings manager
      }

      const coreModulesOrder = ['FilterRegistry', 'UIManager']; // Define order for other core modules
      for (const coreName of coreModulesOrder) {
        if (this.modules.has(coreName)) {
          try {
            if (this.context.settings?.verbosity === 'verbose') {
               console.log(`[FBCMF] Initializing core module: "${coreName}"...`);
            }
            const result = await this.modules.get(coreName)(this.context); // Pass context
            if (result && typeof result === 'object') {
              this.context[coreName] = result; // Add module's returned API to context
               if (this.context.settings?.verbosity === 'verbose') {
                  console.log(`[FBCMF] Added API for "${coreName}" to context.`);
               }
            }
             if (this.context.settings?.verbosity === 'verbose') {
                console.log(`[FBCMF] ✅ Core module "${coreName}" loaded.`);
             }
          } catch (e) {
            console.error(`[FBCMF] ❌ Core module "${coreName}" initialization failed:`, e);
          }
        } else {
          console.warn(`[FBCMF] Core module "${coreName}" not found.`);
        }
      }
      
      for (const [name, moduleFn] of this.modules.entries()) {
        if (name !== settingsManagerName && !coreModulesOrder.includes(name)) {
          try {
             if (this.context.settings?.verbosity === 'verbose') {
                console.log(`[FBCMF] Initializing module: "${name}"...`);
             }
            const result = await moduleFn(this.context); // Pass context
            if (result && typeof result === 'object') {
              this.context[name] = result; // Add module's returned API to context
               if (this.context.settings?.verbosity === 'verbose') {
                  console.log(`[FBCMF] Added API for "${name}" to context.`);
               }
            }
            if (this.context.settings?.verbosity === 'verbose') {
                console.log(`[FBCMF] ✅ Module "${name}" loaded.`);
            }
          } catch (e) {
            console.error(`[FBCMF] ❌ Module "${name}" initialization failed:`, e);
          }
        }
      }

      this.initialized = true;
      console.log('[FBCMF] ✅ All modules initialized.');
      
      // Dispatch event on document for inter-script communication if needed by other non-FBCMF scripts on the page
      // For communication within the extension (e.g., to service worker or popup), use chrome.runtime.sendMessage
      document.dispatchEvent(new CustomEvent('fbcmf:framework-initialized', { detail: { version: "2.0.0" } }));
    },

    // CSS Injection utility for modules
    injectCSS(cssString, styleId) {
      if (!styleId || !cssString) {
        console.warn('[FBCMF Core] injectCSS: Missing styleId or CSS string.');
        return;
      }
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      if (styleElement.textContent !== cssString) { // Only update if changed
        styleElement.textContent = cssString;
        if (this.context?.settings?.verbosity === 'verbose') {
            console.log(`[FBCMF Core] Injected/Updated CSS for ID: ${styleId}`);
        }
      }
    },

    DOMUtils: {
      query(selector, contextNode = document) {
        return Array.from(contextNode.querySelectorAll(selector));
      },
      hideElement(el, reason = 'hidden') {
        if (!el || el.dataset.fbcmfHidden) return;
        el.dataset.fbcmfHidden = reason;
        // In extensions, direct style manipulation is fine. Consider classes for more complex states.
        el.style.transition = 'opacity 0.3s ease-out'; // Added ease-out
        el.style.opacity = '0.1'; // More subtle hiding
        setTimeout(() => { if (el && el.style.opacity === '0.1') el.style.display = 'none'; }, 300);
      },
      createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attributes)) {
          if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
          } else if (key === 'className' || key === 'class') { // Allow 'class' as well
            element.className = value;
          } else if (key === 'innerHTML') {
            element.innerHTML = value;
          } else if (key === 'textContent') {
            element.textContent = value;
          } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
          } else {
            element.setAttribute(key, value);
          }
        }
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            element.appendChild(child);
          } else if (child) { // Handle DocumentFragment from createRangeInput
             element.appendChild(child);
          }
        });
        return element;
      }
    },
    
    cleanFeed() {
       if (this.context.settings?.verbosity === 'verbose') {
          console.log('[FBCMF] Attempting to clean feed...');
       }
      if (!this.context || !this.context.settings) {
          console.warn('[FBCMF] Cannot clean feed: Context or settings not available.');
          return false;
      }

      if (this.context.MutationObserver && typeof this.context.MutationObserver.processNewPosts === 'function') {
         if (this.context.settings?.verbosity === 'verbose') {
             console.log('[FBCMF] Using MutationObserver.processNewPosts() for feed cleaning.');
         }
        this.context.MutationObserver.processNewPosts(); 
        return true;
      }
      
      if (this.context.FilterRegistry && typeof this.context.FilterRegistry.apply === 'function') {
         if (this.context.settings?.verbosity === 'verbose') {
             console.log('[FBCMF] Fallback: Cleaning manually with FilterRegistry.');
         }
        const domUtils = this.DOMUtils; // Use instance's DOMUtils
        const posts = domUtils.query('div[role="article"], div[role="feed"] > div'); // Example selectors
        let hiddenCount = 0;
        
        posts.forEach(post => {
          const reason = this.context.FilterRegistry.apply(post, this.context.settings);
          if (reason) {
            domUtils.hideElement(post, reason);
            hiddenCount++;
          }
        });
        
         if (this.context.settings?.verbosity === 'verbose') {
            console.log(`[FBCMF] Manually hid ${hiddenCount} posts via FilterRegistry.`);
         }
        return hiddenCount > 0;
      }
      
      console.warn('[FBCMF] Cannot clean feed: Neither MutationObserver nor FilterRegistry are properly initialized in context.');
      return false;
    }
  };

  return FBCMF_INSTANCE;
}

// Remove the self-executing part and direct window.FBCMF assignment.
// The content_bundle.js will call createFBCMF() and manage its instance.
// (function () { ... })(); // This IIFE is removed.
// if (!window.__FBCMF_SKIP_INIT__) { ... } // This auto-init logic is removed.

