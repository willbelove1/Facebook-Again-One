// FBCMF Module: Facebook Multi-Column Enhanced
(function() {
    'use strict';

    window.FBCMF = window.FBCMF || {};
    FBCMF.registerModule = FBCMF.registerModule || function(name, initFn) {
        if (!FBCMF.modules) FBCMF.modules = new Map();
        FBCMF.modules.set(name, initFn);
    };

    async function FacebookMultiColumnEnhancedModule(context) {
        const SCRIPT_NAME = 'FB_MultiColumn_Enhanced (FBCMF)';
        const VERSION = '20250627.1_FBCMF';

        // --- Default settings for this module ---
        // These are conceptual here; actual defaults live in SettingsManager.
        const MODULE_DEFAULTS = {
            multiColumn_columnCount: 3,
            multiColumn_columnGap: 20,
            multiColumn_maxPostHeight: 70, // Assuming this is percentage for vh
            multiColumn_sidebarWidth: 60,
            multiColumn_enabled: true,
            multiColumn_language: 'vi' // Should ideally sync with global FBCMF language
        };

        // --- Settings Management ---
        // Helper to get a specific setting
        const getSetting = (key, defaultValue) => {
            const fullKey = `multiColumn_${key}`;
            // Provide module-specific default if not found in global settings from SettingsManager
            return context.settings && context.settings[fullKey] !== undefined ? context.settings[fullKey] : defaultValue;
        };

        let currentSettings = {
            get columnCount() { return getSetting('columnCount', MODULE_DEFAULTS.multiColumn_columnCount); },
            get columnGap() { return getSetting('columnGap', MODULE_DEFAULTS.multiColumn_columnGap); },
            get maxPostHeight() { return getSetting('maxPostHeight', MODULE_DEFAULTS.multiColumn_maxPostHeight); },
            get sidebarWidth() { return getSetting('sidebarWidth', MODULE_DEFAULTS.multiColumn_sidebarWidth); },
            get enabled() { return getSetting('enabled', MODULE_DEFAULTS.multiColumn_enabled); },
            // Language might be better sourced from global context.settings.language if available and consistent
            get language() { return getSetting('language', context.settings?.language || MODULE_DEFAULTS.multiColumn_language); }
        };

        const translations = {
            vi: {
                title: 'Cài đặt FB Đa Cột (FBCMF)',
                columns: 'Số cột',
                gap: 'Khoảng cách (px)',
                height: 'Chiều cao bài viết (%)',
                sidebar: 'Độ rộng thanh bên (px)',
                enable: 'Bật Đa Cột',
                save: 'Lưu',
                reset: 'Đặt lại', // Will be handled by saving defaults
                close: 'Đóng',
                performance: 'Hiệu suất',
                appearance: 'Giao diện',
                savedMessage: 'Cài đặt Đa Cột đã lưu!'
            },
            en: {
                title: 'FB Multi-Column Settings (FBCMF)',
                columns: 'Columns',
                gap: 'Gap (px)',
                height: 'Post Height (%)',
                sidebar: 'Sidebar Width (px)',
                enable: 'Enable Multi-Column',
                save: 'Save',
                reset: 'Reset',
                close: 'Close',
                performance: 'Performance',
                appearance: 'Appearance',
                savedMessage: 'Multi-Column settings saved!'
            }
        };

        const t = (key) => translations[currentSettings.language]?.[key] || translations.en[key] || key;

        // CSP-safe inline styles prevention & Debounce (copied)
        const safeCSS = (css) => css.replace(/javascript:/gi, '').replace(/expression\(/gi, '');
        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func(...args); };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        // === CSS GENERATION (Uses currentSettings, which are reactive getters) ===
        const generateCSS = () => {
            if (!currentSettings.enabled) return '';
            // Use Math.max/min directly with currentSettings properties
            const colCount = Math.max(1, Math.min(6, currentSettings.columnCount));
            const colGap = Math.max(10, Math.min(50, currentSettings.columnGap));
            const postHeight = Math.max(50, Math.min(100, currentSettings.maxPostHeight));
            const sidebarW = Math.max(50, Math.min(200, currentSettings.sidebarWidth));

            return safeCSS(`
/* === Facebook Multi-Column Enhanced v${VERSION} (FBCMF) === */
:root {
    --fbcmf-mc-columns: ${colCount};
    --fbcmf-mc-gap: ${colGap}px;
    --fbcmf-mc-height: ${postHeight}vh;
    --fbcmf-mc-sidebar: ${sidebarW}px;
}
/* Main container optimization */
.x1ceravr.xq1tmr.xvue9z.x193iq5w, .x1xwk8fm.x193iq5w, .xsfy40s.x1miatn0.x9f619 {
    width: calc(100% - var(--fbcmf-mc-sidebar)); margin-right: -30px; contain: layout style paint;
}
/* Homepage container */
.x1iyjqo2.x1r8uery { max-width: 100%; }
/* Left sidebar optimization */
.xxzkxad.x9e5oc1, .xh78kpn.xcoz2nd.x2bj2ny, .x1vjfegm.x2lah0s.xeuugli {
    max-width: var(--fbcmf-mc-sidebar); min-width: var(--fbcmf-mc-sidebar);
    position: sticky; top: 0; z-index: 10; contain: layout;
}
/* Multi-column layout */
.x6o7n8i>div>div, .x1xwk8fm.x193iq5w {
    display: flex; flex-wrap: wrap; gap: var(--fbcmf-mc-gap);
    justify-content: flex-start; align-content: flex-start; contain: layout style paint;
}
/* Post sizing with performance */
.x6o7n8i>div>div>.x1lliihq, .x1xwk8fm.x193iq5w>div {
    width: calc((100% - (var(--fbcmf-mc-gap) * (var(--fbcmf-mc-columns) - 1))) / var(--fbcmf-mc-columns));
    max-height: var(--fbcmf-mc-height); overflow-y: auto; overflow-x: hidden;
    scrollbar-width: thin; contain: layout; transform: translateZ(0);
}
/* Scrollbar styling */
.x6o7n8i>div>div>.x1lliihq::-webkit-scrollbar, .x1xwk8fm.x193iq5w>div::-webkit-scrollbar { width: 6px; }
.x6o7n8i>div>div>.x1lliihq::-webkit-scrollbar-thumb, .x1xwk8fm.x193iq5w>div::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.2); border-radius: 3px;
}
/* Hide unnecessary elements */
.x1daaz14.x1t2pt76, .xwib8y2.x1y1aw1k.xwya9rg, .xq1tmr.xvue9z>.x1yztbdb, footer { display: none !important; }
/* Responsive adjustments */
@media (max-width: 1200px) { :root { --fbcmf-mc-columns: ${Math.max(1, colCount - 1)}; } }
@media (max-width: 900px) { :root { --fbcmf-mc-columns: 2; } }
@media (max-width: 600px) { :root { --fbcmf-mc-columns: 1; } }
            `);
        };

        // === UI CREATION & RELATED LOGIC (REMOVED as UI is now in UIManager) ===
        // const controlPanelId = 'fbcmf-mc-control';
        // const createControlUI = () => { ... };
        // const attachControlEvents = (controlDiv) => { ... };
        // let previewStyle = null;
        // const updatePreview = debounce(() => { ... }, 200);
        // const showStatusMessage = (message, type = "success", duration = 2000) => { ... };
        // const saveCurrentSettings = async () => { ... }; // Saving is now handled by UIManager
        // const resetSettingsToModuleDefaults = async () => { ... }; // Resetting is now handled by UIManager (by saving defaults)


        // === MAIN STYLE APPLICATION (Retained) ===
        let mainStyle = null;
        const applyStyles = () => {
            if (mainStyle) mainStyle.remove();
            // if (previewStyle) { previewStyle.remove(); previewStyle = null; } // previewStyle is removed

            const css = generateCSS(); // Uses reactive currentSettings
            if (css) {
                mainStyle = document.createElement("style");
                mainStyle.id = "fbcmf-mc-main-styles"; // Keep a unique ID for this style element
                mainStyle.textContent = css;
                (document.querySelector("head") || document.documentElement).appendChild(mainStyle);
            }
            if(context.settings?.verbosity === 'verbose') { // Check verbosity from context
                 console.log(`${SCRIPT_NAME}: Styles applied. MultiColumn Enabled: ${currentSettings.enabled}`);
            }
        };

        // === INITIALIZATION ===
        const init = () => {
            applyStyles(); // Apply styles on init

            // No longer creates its own UI panel
            // if (document.readyState === 'loading') { ... } else { ... }

            let lastUrl = location.href;
            const observer = new MutationObserver(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    setTimeout(() => {
                        applyStyles(); // Re-apply styles on navigation
                        // No longer checks for its own control panel:
                        // if (!document.getElementById(controlPanelId)) createControlUI();
                    }, 500);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Listen for global settings changes to re-apply styles if relevant settings changed
            document.addEventListener('fbcmf:settings-saved', (event) => {
                if (event.detail) {
                    // Check if any multiColumn settings relevant to CSS generation have changed
                    let relevantChange = false;
                    const mceKeys = ['multiColumn_enabled', 'multiColumn_columnCount', 'multiColumn_columnGap', 'multiColumn_maxPostHeight', 'multiColumn_sidebarWidth'];
                    for (const key of mceKeys) {
                        if (event.detail[key] !== undefined && event.detail[key] !== context.settings[key]) {
                             // A small nuance: context.settings might not be updated yet if this event fires before FBCMF core updates it.
                             // However, currentSettings getter will fetch the new value from the *actual* context.settings object.
                             // So, comparing event.detail[key] with the *previous* value of currentSettings[key.replace('multiColumn_','')] would be more accurate
                             // For simplicity here, we assume that if a multiColumn_ key is in event.detail, it implies a change we should react to.
                            relevantChange = true;
                            break;
                        }
                    }

                    if (relevantChange) {
                        if(context.settings?.verbosity === 'verbose') {
                            console.log(`${SCRIPT_NAME}: Relevant MultiColumn settings changed globally, re-applying styles.`);
                        }
                        applyStyles(); // This will use the new settings from context via currentSettings getters
                    }
                }
            });
            console.log(`${SCRIPT_NAME} v${VERSION} initialized`);
        };
        init();
    }
    FBCMF.registerModule('FacebookMultiColumnEnhanced', FacebookMultiColumnEnhancedModule);
})();
