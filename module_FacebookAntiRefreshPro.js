// FBCMF Module: Facebook Anti-Refresh Pro
(function() {
    'use strict';

    window.FBCMF = window.FBCMF || {};
    FBCMF.registerModule = FBCMF.registerModule || function(name, initFn) {
        if (!FBCMF.modules) FBCMF.modules = new Map();
        FBCMF.modules.set(name, initFn);
    };

    async function FacebookAntiRefreshProModule(context) {
        // --- Default settings for this module (will be merged by SettingsManager) ---
        // These are conceptual defaults here; actual defaults live in SettingsManager.
        const MODULE_DEFAULTS = {
            antiRefresh_enabled: true,
            antiRefresh_debug: false,
            antiRefresh_lang: 'vi',
            antiRefresh_inactivityTime: 60000, // ms
            antiRefresh_historyBlockTime: 120000, // ms
            antiRefresh_showNotifications: true,
            antiRefresh_blockLevel: 'medium' // low, medium, high
        };

        // --- Get settings from context ---
        // Helper to get a specific setting, falling back to module default if not in global settings
        const getSetting = (key) => {
            const fullKey = `antiRefresh_${key}`;
            return context.settings && context.settings[fullKey] !== undefined ? context.settings[fullKey] : MODULE_DEFAULTS[`antiRefresh_${key}`];
        };

        const CONFIG = {
            get version() { return '2.0_FBCMF'; }, // Version identifier for framework
            get debug() { return getSetting('debug'); },
            get enabled() { return getSetting('enabled'); },
            get lang() { return getSetting('lang'); },
            get inactivityTime() { return getSetting('inactivityTime'); },
            get historyBlockTime() { return getSetting('historyBlockTime'); },
            get showNotifications() { return getSetting('showNotifications'); },
            get blockLevel() { return getSetting('blockLevel'); }
        };

        const LANG = {
            vi: {
                title: 'FB Chống Tải Lại (FBCMF)',
                enabled: 'Kích hoạt',
                disabled: 'Tắt',
                settings: 'Cài đặt',
                language: 'Ngôn ngữ',
                blockLevel: 'Mức độ chặn',
                low: 'Thấp',
                medium: 'Trung bình',
                high: 'Cao',
                inactivityTime: 'TGian không hoạt động (giây)',
                notifications: 'Thông báo',
                debug: 'Debug',
                save: 'Lưu',
                reset: 'Đặt lại', // Reset will be handled by SettingsManager or a full page reload after save
                blocked: 'Đã chặn yêu cầu tải lại',
                active: 'Bảo vệ đang hoạt động',
                stats: 'Thống kê',
                blockedCount: 'Lần chặn',
                uptime: 'Thời gian hoạt động',
                settingsSaved: 'Cài đặt Anti-Refresh đã lưu!'
            },
            en: {
                title: 'FB Anti-Refresh (FBCMF)',
                enabled: 'Enabled',
                disabled: 'Disabled',
                settings: 'Settings',
                language: 'Language',
                blockLevel: 'Block Level',
                low: 'Low',
                medium: 'Medium',
                high: 'High',
                inactivityTime: 'Inactivity Time (seconds)',
                notifications: 'Notifications',
                debug: 'Debug',
                save: 'Save',
                reset: 'Reset',
                blocked: 'Blocked refresh request',
                active: 'Protection active',
                stats: 'Statistics',
                blockedCount: 'Blocked',
                uptime: 'Uptime',
                settingsSaved: 'Anti-Refresh settings saved!'
            }
        };

        const t = (key) => LANG[CONFIG.lang]?.[key] || LANG.en[key] || key;

        // === SECURITY & PERFORMANCE (Copied, minor adjustments if needed) ===
        const security = {
            validateOrigin: () => {
                return window.location.hostname.includes('facebook.com');
            },
            sanitizeInput: (input) => {
                if (typeof input !== 'string') return '';
                return input.replace(/[<>'"&]/g, '');
            },
            rateLimiter: {
                calls: new Map(),
                isAllowed: (key, limit = 10, window = 1000) => {
                    const now = Date.now();
                    const calls = security.rateLimiter.calls.get(key) || [];
                    const recent = calls.filter(time => now - time < window);
                    if (recent.length >= limit) return false;
                    recent.push(now);
                    security.rateLimiter.calls.set(key, recent);
                    return true;
                }
            }
        };

        // === ENHANCED LOGGING (Copied, uses CONFIG.debug) ===
        const logger = {
            prefix: '[FB Anti-Refresh Pro (FBCMF)]',
            log: (...args) => {
                if (CONFIG.debug) console.log(logger.prefix, ...args);
            },
            warn: (...args) => {
                console.warn(logger.prefix, ...args);
            },
            error: (...args) => {
                console.error(logger.prefix, ...args);
            },
            performance: (label, fn) => {
                if (!CONFIG.debug) return fn();
                const start = performance.now();
                const result = fn();
                const end = performance.now();
                logger.log(`${label}: ${(end - start).toFixed(2)}ms`);
                return result;
            }
        };

        // === STATISTICS (Needs GM_getValue/setValue for persistence across sessions if desired, or reset per session) ===
        // For now, let's make stats session-based or remove GM_ calls for simplicity with FBCMF
        // Or, if stats persistence is crucial, SettingsManager could be extended for this.
        // For this integration, making them session-based to avoid direct GM_ calls.
        const stats = {
            startTime: Date.now(),
            blockedRequests: 0, // Session-based
            increment: (key) => {
                stats[key] = (stats[key] || 0) + 1;
                // GM_setValue(key, stats[key]); // Removed for FBCMF integration
            },
            getUptime: () => {
                const uptime = Date.now() - stats.startTime;
                const hours = Math.floor(uptime / 3600000);
                const minutes = Math.floor((uptime % 3600000) / 60000);
                return `${hours}h ${minutes}m`;
            }
        };

        // === UI COMPONENTS (REMOVED as UI is now in UIManager) ===
        // const ui = { ... }

        // Minimal showNotification function if still needed, or rely on UIManager for all user feedback
        const showNotification = (message, type = 'info') => {
            // This module no longer creates its own panel, so direct notifications might need
            // a global notification system if UIManager doesn't cover all cases.
            // For now, keeping it simple and assuming UIManager handles primary feedback.
            // If this module *must* show its own (e.g. for blocked requests), it needs a simple mechanism.
            if (!CONFIG.showNotifications) return;

            // A very basic notification, could be improved or centralized
            const notification = context.DOMUtils.createElement('div', {
                className: `fbcmf-ar-notification-module ${type}`, // Use a distinct class
                textContent: message,
                style: { // Basic styling, ideally use GM_addStyle for this if kept
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    padding: '10px',
                    background: type === 'error' ? '#ffdddd' : (type === 'warning' ? '#fff3cd' : '#ddffdd'),
                    border: `1px solid ${type === 'error' ? 'red' : (type === 'warning' ? '#ffeeba' : 'green')}`,
                    borderRadius: '5px',
                    zIndex: '1000001', // Ensure it's above most things
                    color: '#333'
                }
            });
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 500); // Faster removal
            }, 2500);
            logger.log(`Notification: ${message} (type: ${type})`);
        };

        // Stats update is also removed as its display was part of the old UI
        // const updateStats = () => { ... }


        // === ENHANCED BLOCKING LOGIC (Copied, uses CONFIG) ===
        const blocker = {
            lastActivity: { time: Date.now() },
            getBlockEndpoints: () => {
                const levels = {
                    low: ['/ajax/home/generic.php', '/ajax/pagelet/generic.php/HomeStream'],
                    medium: ['/ajax/home/generic.php', '/ajax/pagelet/generic.php/HomeStream', '/ajax/ticker_stream.php', '/api/graphql/', '/ajax/bootloader-endpoint/'],
                    high: ['/ajax/home/generic.php', '/ajax/pagelet/generic.php/HomeStream', '/ajax/ticker_stream.php', '/api/graphql/', '/ajax/bootloader-endpoint/', '/ajax/webstorage/process_set.php', '/ajax/presence/update.php']
                };
                return levels[CONFIG.blockLevel] || levels.medium;
            },
            shouldBlock: (url) => {
                if (!CONFIG.enabled) return false;
                if (!security.validateOrigin()) return false;
                const timeSinceActivity = Date.now() - blocker.lastActivity.time;
                const endpoints = blocker.getBlockEndpoints();
                const isRefreshRequest = endpoints.some(endpoint => url.includes(endpoint));
                return isRefreshRequest && timeSinceActivity > CONFIG.inactivityTime;
            },
            updateActivity: () => {
                blocker.lastActivity.time = Date.now();
            }
        };

        // === CSS STYLES (REMOVED - No longer has its own panel) ===
        // const loadStyles = () => { ... GM_addStyle ... };

        // === MAIN FUNCTIONALITY OBJECT ===
        const fbAntiRefresh = {
            init: () => {
                if (!security.validateOrigin()) {
                    logger.error('Invalid origin, aborting Anti-Refresh module');
                    return;
                }
                logger.log(`Initializing Anti-Refresh Pro Module v${CONFIG.version}...`);
                // loadStyles(); // REMOVED: No custom panel CSS needed now

                fbAntiRefresh.setupVisibilityOverrides();
                fbAntiRefresh.setupEventBlocking();
                fbAntiRefresh.setupFetchInterception();
                fbAntiRefresh.setupActivityTracking();
                fbAntiRefresh.setupHistoryBlocking();
                // fbAntiRefresh.setupUI(); // REMOVED: UI is now part of UIManager
                fbAntiRefresh.removeMetaRefresh();

                logger.log(t('active'));
                // The module's own notification for "active" might be redundant if UIManager handles all.
                // However, specific operational notifications (like "blocked request") can remain.
                if (CONFIG.enabled && CONFIG.showNotifications) { // Check showNotifications as well
                    showNotification(t('active'), 'success');
                }

                // setInterval(() => { ui.updateStats(); }, 60000); // REMOVED: No stats panel to update

                // Listen for global settings changes.
                // The main purpose of this listener was to update its own UI (language, status).
                // Since its UI is gone, this listener's role changes.
                // It might still be useful if the module needs to re-initialize parts of its logic
                // based on settings changes that don't require a full page reload.
                // For now, language for notifications is set at init, and UIManager handles reloads.
                document.addEventListener('fbcmf:settings-saved', (event) => {
                    if (event.detail && CONFIG.debug) {
                        logger.log('Global settings saved. AntiRefreshPro received event.');
                        // Potentially re-evaluate CONFIG values if needed, though getters handle this.
                        // Example: if a core behavior, not just UI, depended on language directly.
                    }
                });
            },

            // --- Core Logic (Copied, ensure CONFIG is reactive via getters) ---
            setupVisibilityOverrides: () => { /* ... original code ... */ },
            setupEventBlocking: () => { /* ... original code ... */ },
            setupFetchInterception: () => {
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    const [url] = args;
                    if (typeof url === 'string' && url.includes('facebook.com')) {
                        if (!security.rateLimiter.isAllowed('fetch', 50, 1000)) {
                            logger.warn('Rate limit exceeded for fetch requests');
                            return Promise.resolve(new Response('{}', { status: 429, headers: { 'Content-Type': 'application/json' } }));
                        }
                        if (blocker.shouldBlock(url)) { // blocker uses CONFIG.enabled
                            logger.log(t('blocked'), url);
                            stats.increment('blockedRequests'); // Keep internal stat if needed for logic, though not displayed
                            // ui.updateStats(); // REMOVED
                            showNotification(t('blocked'), 'warning'); // Use the module's own notification
                            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
                        }
                    }
                    return originalFetch.apply(this, args);
                };
            },
            setupActivityTracking: () => { /* ... original code ... */ },
            setupHistoryBlocking: () => { /* ... original code ... */ },
            removeMetaRefresh: () => { /* ... original code ... */ },

            // setupUI: () => { ... } // REMOVED

            // --- UI Methods (REMOVED) ---
            // toggleSettings: () => { ... },
            // minimize: () => { ... },
            // saveSettings: async () => { ... } // Saving is now handled by UIManager
        };

        // --- Copy original methods to fbAntiRefresh object that don't need context directly or use CONFIG ---
        fbAntiRefresh.setupVisibilityOverrides = function() {
            logger.performance('Visibility Override', () => {
                try {
                    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
                    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
                    document.hasFocus = () => true; // Simpler override
                    logger.log('Visibility API overridden');
                } catch (e) { logger.warn('Could not override visibility API:', e); }
            });
        };

        fbAntiRefresh.setupEventBlocking = function() {
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (!CONFIG.enabled) return originalAddEventListener.call(this, type, listener, options);
                const blockedEvents = ['visibilitychange', 'webkitvisibilitychange', 'mozvisibilitychange'];
                if (blockedEvents.includes(type)) {
                    logger.log(`Blocked event listener: ${type}`); return;
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
            try { // Override window focus events
                Object.defineProperty(window, 'onblur', { configurable: true, get: () => null, set: () => {} });
                Object.defineProperty(window, 'onfocus', { configurable: true, get: () => null, set: () => {} });
            } catch (e) { logger.warn('Could not override window focus events:', e); }
        };

        fbAntiRefresh.setupActivityTracking = function() {
            ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'].forEach(event => {
                document.addEventListener(event, () => { blocker.updateActivity(); }, { passive: true, capture: true });
            });
        };

        fbAntiRefresh.setupHistoryBlocking = function() {
            const originalPushState = history.pushState;
            history.pushState = function(...args) {
                if (!CONFIG.enabled) return originalPushState.apply(this, args);
                const timeSinceActivity = Date.now() - blocker.lastActivity.time;
                if (timeSinceActivity > CONFIG.historyBlockTime) { // Uses CONFIG
                    logger.log('Blocked history.pushState due to inactivity'); return;
                }
                return originalPushState.apply(this, args);
            };
        };

        fbAntiRefresh.removeMetaRefresh = function() {
            const runRemove = () => {
                document.querySelectorAll('meta[http-equiv="refresh"]').forEach(tag => {
                    tag.remove(); logger.log('Removed meta refresh tag');
                });
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runRemove);
            else runRemove();
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.tagName === 'META' && node.getAttribute('http-equiv') === 'refresh') {
                        node.remove(); logger.log('Removed dynamically added meta refresh tag');
                    }
                }));
            });
            observer.observe(document.head || document.documentElement, { childList: true, subtree: true });
        };


        // === INITIALIZE MODULE ===
        fbAntiRefresh.init();

        // Expose minimal API to context if needed by other modules (optional)
        // return {
        //    apiMethod: () => {}
        // };
    }

    // Register the module with FBCMF
    FBCMF.registerModule('FacebookAntiRefreshPro', FacebookAntiRefreshProModule);

})();

// Ensure original methods that were part of fbAntiRefresh are defined within the module scope
// For example, if setupVisibilityOverrides was defined outside the module scope, it needs to be included or refactored.
// For this adaptation, I've moved them into the module function or made them part of the fbAntiRefresh object.
