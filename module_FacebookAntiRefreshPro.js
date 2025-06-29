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

        // === UI COMPONENTS (Prefixed IDs, uses context.DOMUtils if preferred) ===
        const ui = {
            elements: {},
            panelId: 'fbcmf-ar-panel',
            createPanel: () => {
                if (document.getElementById(ui.panelId)) return; // Avoid duplicates

                const panel = context.DOMUtils.createElement('div', { id: ui.panelId });
                // InnerHTML structure needs to be updated with prefixed IDs
                panel.innerHTML = `
                    <div class="fbcmf-ar-header">
                        <span class="fbcmf-ar-title">${t('title')}</span>
                        <div class="fbcmf-ar-status ${CONFIG.enabled ? 'enabled' : 'disabled'}">
                            ${CONFIG.enabled ? t('enabled') : t('disabled')}
                        </div>
                        <button class="fbcmf-ar-toggle">⚙️</button>
                        <button class="fbcmf-ar-minimize">−</button>
                    </div>
                    <div class="fbcmf-ar-content" style="display: none;">
                        <div class="fbcmf-ar-stats">
                            <div><strong>${t('stats')}:</strong></div>
                            <div>${t('blockedCount')}: <span id="fbcmf-ar-blocked-count">${stats.blockedRequests}</span></div>
                            <div>${t('uptime')}: <span id="fbcmf-ar-uptime">${stats.getUptime()}</span></div>
                        </div>
                        <div class="fbcmf-ar-controls">
                            <label>
                                <input type="checkbox" id="fbcmf-ar-enable-toggle" ${CONFIG.enabled ? 'checked' : ''}>
                                ${t('enabled')}
                            </label>
                            <label>
                                ${t('language')}:
                                <select id="fbcmf-ar-lang-select">
                                    <option value="vi" ${CONFIG.lang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
                                    <option value="en" ${CONFIG.lang === 'en' ? 'selected' : ''}>English</option>
                                </select>
                            </label>
                            <label>
                                ${t('blockLevel')}:
                                <select id="fbcmf-ar-block-level">
                                    <option value="low" ${CONFIG.blockLevel === 'low' ? 'selected' : ''}>${t('low')}</option>
                                    <option value="medium" ${CONFIG.blockLevel === 'medium' ? 'selected' : ''}>${t('medium')}</option>
                                    <option value="high" ${CONFIG.blockLevel === 'high' ? 'selected' : ''}>${t('high')}</option>
                                </select>
                            </label>
                            <label>
                                ${t('inactivityTime')}:
                                <input type="number" id="fbcmf-ar-inactivity-time" value="${CONFIG.inactivityTime / 1000}" min="10" max="300">
                            </label>
                            <label>
                                <input type="checkbox" id="fbcmf-ar-notifications-toggle" ${CONFIG.showNotifications ? 'checked' : ''}>
                                ${t('notifications')}
                            </label>
                            <label>
                                <input type="checkbox" id="fbcmf-ar-debug-toggle" ${CONFIG.debug ? 'checked' : ''}>
                                ${t('debug')}
                            </label>
                        </div>
                        <div class="fbcmf-ar-buttons">
                            <button id="fbcmf-ar-save-btn">${t('save')}</button>
                            // Reset button might be redundant if save causes reload via UIManager
                            // <button id="fbcmf-ar-reset-btn">${t('reset')}</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(panel);
                ui.elements.panel = panel;
                ui.attachEvents();
                ui.updateStatus(); // Initial status update
            },

            attachEvents: () => {
                const panel = ui.elements.panel;
                if (!panel) return;

                panel.querySelector('.fbcmf-ar-toggle').addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); fbAntiRefresh.toggleSettings();
                });
                panel.querySelector('.fbcmf-ar-minimize').addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); fbAntiRefresh.minimize();
                });
                panel.querySelector('#fbcmf-ar-save-btn').addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation(); fbAntiRefresh.saveSettings();
                });
                // panel.querySelector('#fbcmf-ar-reset-btn')?.addEventListener('click', (e) => { // Optional if kept
                //     e.preventDefault(); e.stopPropagation(); fbAntiRefresh.resetSettings();
                // });
                panel.querySelector('#fbcmf-ar-enable-toggle').addEventListener('change', () => {
                    // Directly update status display, actual save happens on "Save" button
                    ui.updateStatus(panel.querySelector('#fbcmf-ar-enable-toggle').checked);
                });

                // Draggable panel (copied, ensure it works with prefixed classes)
                let isDragging = false, startX, startY, startLeft, startTop;
                const header = panel.querySelector('.fbcmf-ar-header');
                header.addEventListener('mousedown', (e) => {
                    if (e.target.classList.contains('fbcmf-ar-toggle') || e.target.classList.contains('fbcmf-ar-minimize')) return;
                    isDragging = true;
                    startX = e.clientX; startY = e.clientY;
                    startLeft = panel.offsetLeft; startTop = panel.offsetTop;
                    const onMouseMove = (ev) => {
                        if (!isDragging) return;
                        panel.style.left = (startLeft + ev.clientX - startX) + 'px';
                        panel.style.top = (startTop + ev.clientY - startY) + 'px';
                    };
                    const onMouseUp = () => {
                        isDragging = false;
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });
            },

            updateStatus: (isManuallyEnabled) => { // isManuallyEnabled is for immediate UI feedback before save
                const statusEl = ui.elements.panel?.querySelector('.fbcmf-ar-status');
                if (statusEl) {
                    const currentEnabledState = typeof isManuallyEnabled === 'boolean' ? isManuallyEnabled : CONFIG.enabled;
                    statusEl.textContent = currentEnabledState ? t('enabled') : t('disabled');
                    statusEl.className = `fbcmf-ar-status ${currentEnabledState ? 'enabled' : 'disabled'}`;
                }
            },

            updateStats: () => {
                const blockedElement = document.getElementById('fbcmf-ar-blocked-count');
                const uptimeElement = document.getElementById('fbcmf-ar-uptime');
                if (blockedElement) blockedElement.textContent = stats.blockedRequests;
                if (uptimeElement) uptimeElement.textContent = stats.getUptime();
            },

            showNotification: (message, type = 'info') => {
                if (!CONFIG.showNotifications) return;
                const notification = context.DOMUtils.createElement('div', {
                    className: `fbcmf-ar-notification ${type}`,
                    textContent: message
                });
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }
        };

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

        // === CSS STYLES (Prefixed, uses GM_addStyle) ===
        const loadStyles = () => {
            GM_addStyle(`
                #${ui.panelId} { /* Prefixed ID */
                    position: fixed; top: 20px; right: 20px; width: 320px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    z-index: 999998; /* Slightly below main settings if needed */
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px; color: white; user-select: none;
                    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
                }
                .${ui.panelId} .fbcmf-ar-header { /* Prefixed class based on panel ID for scoping */
                    padding: 12px 16px; background: rgba(255,255,255,0.1);
                    border-radius: 12px 12px 0 0; display: flex;
                    justify-content: space-between; align-items: center; cursor: move;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .${ui.panelId} .fbcmf-ar-title { font-weight: 600; font-size: 13px; }
                .${ui.panelId} .fbcmf-ar-status { padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
                .${ui.panelId} .fbcmf-ar-status.enabled { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
                .${ui.panelId} .fbcmf-ar-status.disabled { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
                .${ui.panelId} .fbcmf-ar-toggle, .${ui.panelId} .fbcmf-ar-minimize {
                    background: rgba(255,255,255,0.1); border: none; color: white;
                    width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
                    font-size: 12px; transition: background 0.2s ease;
                }
                .${ui.panelId} .fbcmf-ar-toggle:hover, .${ui.panelId} .fbcmf-ar-minimize:hover { background: rgba(255,255,255,0.2); }
                .${ui.panelId} .fbcmf-ar-content { padding: 16px; }
                .${ui.panelId} .fbcmf-ar-stats { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 12px; line-height: 1.6; }
                .${ui.panelId} .fbcmf-ar-controls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
                .${ui.panelId} .fbcmf-ar-controls label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
                .${ui.panelId} .fbcmf-ar-controls input[type="checkbox"] { margin-left: 8px; }
                .${ui.panelId} .fbcmf-ar-controls select, .${ui.panelId} .fbcmf-ar-controls input[type="number"] {
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                    color: white; padding: 6px 8px; border-radius: 4px; font-size: 12px; width: 80px;
                }
                .${ui.panelId} .fbcmf-ar-controls select option { background: #333; color: white; }
                .${ui.panelId} .fbcmf-ar-buttons { display: flex; gap: 8px; }
                .${ui.panelId} .fbcmf-ar-buttons button {
                    flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                    color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer;
                    font-size: 12px; transition: background 0.2s ease;
                }
                .${ui.panelId} .fbcmf-ar-buttons button:hover { background: rgba(255,255,255,0.2); }
                .fbcmf-ar-notification { /* Global, can be less specific if no other module uses this */
                    position: fixed; top: 80px; right: 20px; background: #333; color: white;
                    padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 1000000; font-size: 13px; opacity: 1; transition: opacity 0.3s ease;
                    max-width: 280px;
                }
                .fbcmf-ar-notification.success { background: #22c55e; }
                .fbcmf-ar-notification.warning { background: #f59e0b; }
                .fbcmf-ar-notification.error { background: #ef4444; }
            `);
        };

        // === MAIN FUNCTIONALITY OBJECT ===
        const fbAntiRefresh = {
            init: () => {
                if (!security.validateOrigin()) {
                    logger.error('Invalid origin, aborting Anti-Refresh module');
                    return;
                }
                logger.log(`Initializing Anti-Refresh Pro Module v${CONFIG.version}...`);
                loadStyles(); // Load CSS

                fbAntiRefresh.setupVisibilityOverrides();
                fbAntiRefresh.setupEventBlocking();
                fbAntiRefresh.setupFetchInterception();
                fbAntiRefresh.setupActivityTracking();
                fbAntiRefresh.setupHistoryBlocking();
                fbAntiRefresh.setupUI();
                fbAntiRefresh.removeMetaRefresh();

                logger.log(t('active'));
                if (CONFIG.enabled) ui.showNotification(t('active'), 'success');

                setInterval(() => { ui.updateStats(); }, 60000);

                // Listen for global settings changes if UI needs refresh (e.g. language)
                document.addEventListener('fbcmf:settings-saved', (event) => {
                    if (event.detail) {
                        // Check if language changed, if so, recreate panel for new labels
                        // This is a simple way; a more complex UI would update text in place.
                        const oldLang = CONFIG.lang; // This will still be old value before getSetting re-evaluates
                        const newLang = event.detail.antiRefresh_lang;
                        if (newLang && oldLang !== newLang) {
                            logger.log('Language changed, re-rendering Anti-Refresh UI.');
                            if (ui.elements.panel) {
                                ui.elements.panel.remove();
                                ui.elements.panel = null; // Clear reference
                            }
                            ui.createPanel(); // Recreate with new language
                        } else {
                           ui.updateStatus(); // Update status based on potentially changed 'enabled' state
                        }
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
                            stats.increment('blockedRequests');
                            ui.updateStats();
                            ui.showNotification(t('blocked'), 'warning');
                            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
                        }
                    }
                    return originalFetch.apply(this, args);
                };
            },
            setupActivityTracking: () => { /* ... original code ... */ },
            setupHistoryBlocking: () => { /* ... original code ... */ },
            removeMetaRefresh: () => { /* ... original code ... */ },

            setupUI: () => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', ui.createPanel);
                } else {
                    ui.createPanel();
                }
            },

            // --- UI Methods (Modified for FBCMF) ---
            toggleSettings: () => {
                const content = ui.elements.panel?.querySelector('.fbcmf-ar-content');
                if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
            },
            minimize: () => {
                const panel = ui.elements.panel;
                if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            },
            saveSettings: async () => {
                if (!context.saveSettings) {
                    logger.error("context.saveSettings not available!");
                    ui.showNotification("Error: Cannot save settings.", "error");
                    return;
                }
                const panel = ui.elements.panel;
                if (!panel) return;

                const newModuleSettings = {
                    antiRefresh_enabled: panel.querySelector('#fbcmf-ar-enable-toggle').checked,
                    antiRefresh_lang: panel.querySelector('#fbcmf-ar-lang-select').value,
                    antiRefresh_blockLevel: panel.querySelector('#fbcmf-ar-block-level').value,
                    antiRefresh_inactivityTime: parseInt(panel.querySelector('#fbcmf-ar-inactivity-time').value) * 1000,
                    antiRefresh_showNotifications: panel.querySelector('#fbcmf-ar-notifications-toggle').checked,
                    antiRefresh_debug: panel.querySelector('#fbcmf-ar-debug-toggle').checked
                };

                logger.log("Saving Anti-Refresh settings:", newModuleSettings);
                try {
                    const success = await context.saveSettings(newModuleSettings); // Save only its own settings
                    if (success) {
                        ui.showNotification(t('settingsSaved'), 'success');
                        // SettingsManager/UIManager might reload the page, so this module doesn't need to explicitly.
                        // If language changed, the 'fbcmf:settings-saved' listener will handle UI refresh or recreate.
                        ui.updateStatus(); // Reflect changes immediately in this module's UI
                    } else {
                        ui.showNotification("Save failed (framework)", "error");
                    }
                } catch (e) {
                    logger.error("Error saving Anti-Refresh settings:", e);
                    ui.showNotification("Save error: " + e.message, "error");
                }
            },
            // resetSettings: () => { // This would require more complex interaction with SettingsManager
            //     logger.warn("Resetting settings for Anti-Refresh is not fully implemented via FBCMF individual reset. Use global reset or re-save defaults.");
            //     // To implement properly, would need to save MODULE_DEFAULTS via context.saveSettings
            // }
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
