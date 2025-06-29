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

        // === UI CREATION (Prefixed IDs: fbcmf-mc-*) ===
        const controlPanelId = 'fbcmf-mc-control';
        const createControlUI = () => {
            const existing = document.getElementById(controlPanelId);
            if (existing) existing.remove();

            const controlDiv = context.DOMUtils.createElement('div', { id: controlPanelId });
            controlDiv.innerHTML = `
                <div id="fbcmf-mc-toggle" title="${t('title')}">⚙️</div>
                <div id="fbcmf-mc-panel" style="display: none;">
                    <h3>${t('title')}</h3>
                    <div class="fbcmf-mc-section">
                        <h4>${t('appearance')}</h4>
                        <label>${t('columns')}: <span id="fbcmf-mc-columns-value">${currentSettings.columnCount}</span>
                            <input type="range" id="fbcmf-mc-columns" min="1" max="6" value="${currentSettings.columnCount}">
                        </label>
                        <label>${t('gap')}: <span id="fbcmf-mc-gap-value">${currentSettings.columnGap}</span>
                            <input type="range" id="fbcmf-mc-gap" min="10" max="50" value="${currentSettings.columnGap}">
                        </label>
                        <label>${t('height')}: <span id="fbcmf-mc-height-value">${currentSettings.maxPostHeight}</span>
                            <input type="range" id="fbcmf-mc-height" min="50" max="100" value="${currentSettings.maxPostHeight}">
                        </label>
                        <label>${t('sidebar')}: <span id="fbcmf-mc-sidebar-value">${currentSettings.sidebarWidth}</span>
                            <input type="range" id="fbcmf-mc-sidebar" min="50" max="200" value="${currentSettings.sidebarWidth}">
                        </label>
                    </div>
                    <div class="fbcmf-mc-section">
                        <label class="fbcmf-mc-checkbox">
                            <input type="checkbox" id="fbcmf-mc-enable" ${currentSettings.enabled ? 'checked' : ''}>
                            ${t('enable')}
                        </label>
                    </div>
                    <div class="fbcmf-mc-buttons">
                        <button id="fbcmf-mc-save">${t('save')}</button>
                        <button id="fbcmf-mc-reset">${t('reset')}</button>
                        <button id="fbcmf-mc-close">${t('close')}</button>
                    </div>
                    <div id="fbcmf-mc-status-message" style="margin-top:10px; text-align:center;"></div>
                </div>
            `;

            GM_addStyle(`
#${controlPanelId} { position: fixed; top: 100px; right: 20px; z-index: 9998; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
#${controlPanelId} #${'fbcmf-mc-toggle'} { /* Prefixed */
    width: 40px; height: 40px; background: #1877f2; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; cursor: pointer; font-size: 18px; box-shadow: 0 2px 8px rgba(24, 119, 242, 0.3);
    transition: all 0.3s ease;
}
#${controlPanelId} #${'fbcmf-mc-toggle'}:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(24, 119, 242, 0.5); }
#${controlPanelId} #${'fbcmf-mc-panel'} { /* Prefixed */
    position: absolute; right: 50px; top: 0; width: 300px; background: white; border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15); padding: 20px; border: 1px solid #e4e6ea;
}
#${controlPanelId} #${'fbcmf-mc-panel'} h3 { margin: 0 0 15px 0; color: #1c1e21; font-size: 16px; font-weight: 600; }
#${controlPanelId} #${'fbcmf-mc-panel'} h4 { margin: 15px 0 10px 0; color: #65676b; font-size: 14px; font-weight: 500; }
#${controlPanelId} .fbcmf-mc-section { margin-bottom: 15px; } /* Class can be less specific if unique */
#${controlPanelId} #${'fbcmf-mc-panel'} label { display: block; margin-bottom: 12px; color: #1c1e21; font-size: 14px; }
#${controlPanelId} #${'fbcmf-mc-panel'} input[type="range"] { width: 100%; margin-top: 5px; }
#${controlPanelId} .fbcmf-mc-checkbox { display: flex; align-items: center; gap: 8px; }
#${controlPanelId} .fbcmf-mc-buttons { display: flex; gap: 8px; margin-top: 15px; }
#${controlPanelId} .fbcmf-mc-buttons button {
    flex: 1; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 14px; font-weight: 500; transition: background-color 0.2s;
}
#${controlPanelId} #fbcmf-mc-save { background: #42b883; color: white; } /* Prefixed ID */
#${controlPanelId} #fbcmf-mc-save:hover { background: #369870; }
#${controlPanelId} #fbcmf-mc-reset { background: #f23030; color: white; } /* Prefixed ID */
#${controlPanelId} #fbcmf-mc-reset:hover { background: #d92626; }
#${controlPanelId} #fbcmf-mc-close { background: #e4e6ea; color: #1c1e21; } /* Prefixed ID */
#${controlPanelId} #fbcmf-mc-close:hover { background: #d8dadf; }
#${controlPanelId} #fbcmf-mc-status-message.success { color: green; }
#${controlPanelId} #fbcmf-mc-status-message.error { color: red; }
            `);
            document.body.appendChild(controlDiv);
            attachControlEvents(controlDiv);
        };

        let previewStyle = null;
        const updatePreview = debounce(() => {
            const panel = document.getElementById('fbcmf-mc-panel');
            if (!panel) return; // Panel might not exist yet or was removed

            const tempSettings = { // Read directly from inputs for preview
                columnCount: parseInt(panel.querySelector('#fbcmf-mc-columns').value),
                columnGap: parseInt(panel.querySelector('#fbcmf-mc-gap').value),
                maxPostHeight: parseInt(panel.querySelector('#fbcmf-mc-height').value),
                sidebarWidth: parseInt(panel.querySelector('#fbcmf-mc-sidebar').value),
                enabled: panel.querySelector('#fbcmf-mc-enable').checked,
                language: currentSettings.language // Language doesn't change in preview
            };
            if (previewStyle) previewStyle.remove();
            previewStyle = document.createElement('style');
            // Temporarily use tempSettings for CSS generation for preview
            const originalCurrentSettings = currentSettings;
            currentSettings = tempSettings; // Temporarily swap for generateCSS
            previewStyle.textContent = generateCSS();
            currentSettings = originalCurrentSettings; // Restore
            document.head.appendChild(previewStyle);
        }, 200);

        const showStatusMessage = (message, type = "success", duration = 2000) => {
            const statusEl = document.getElementById('fbcmf-mc-status-message');
            if (statusEl) {
                statusEl.textContent = message;
                statusEl.className = type;
                setTimeout(() => statusEl.textContent = '', duration);
            }
        };

        const saveCurrentSettings = async () => {
            const panel = document.getElementById('fbcmf-mc-panel');
            if (!panel) return;

            const newModuleSettings = {
                multiColumn_columnCount: parseInt(panel.querySelector('#fbcmf-mc-columns').value),
                multiColumn_columnGap: parseInt(panel.querySelector('#fbcmf-mc-gap').value),
                multiColumn_maxPostHeight: parseInt(panel.querySelector('#fbcmf-mc-height').value),
                multiColumn_sidebarWidth: parseInt(panel.querySelector('#fbcmf-mc-sidebar').value),
                multiColumn_enabled: panel.querySelector('#fbcmf-mc-enable').checked,
                multiColumn_language: currentSettings.language // Assuming language is not changed by this UI panel directly
            };

            if (context.saveSettings) {
                try {
                    const success = await context.saveSettings(newModuleSettings);
                    if (success) {
                        console.log(`${SCRIPT_NAME}: Settings saved via context.`);
                        showStatusMessage(t('savedMessage'), 'success');
                        applyStyles(); // Re-apply main styles based on new saved settings
                        // UIManager might reload the page, this module shouldn't force it.
                    } else {
                        console.warn(`${SCRIPT_NAME}: Failed to save settings via context.`);
                        showStatusMessage('Save failed (framework)', 'error');
                    }
                } catch (e) {
                    console.error(`${SCRIPT_NAME}: Error saving settings:`, e);
                    showStatusMessage('Save error: ' + e.message, 'error');
                }
            } else {
                console.error(`${SCRIPT_NAME}: context.saveSettings is not available.`);
                showStatusMessage('Save function unavailable', 'error');
            }
        };

        const resetSettingsToModuleDefaults = async () => { // Renamed to avoid conflict
            // Construct an object with prefixed keys from MODULE_DEFAULTS
            const moduleDefaultsToSave = {};
            for (const key in MODULE_DEFAULTS) {
                moduleDefaultsToSave[`multiColumn_${key.replace('multiColumn_', '')}`] = MODULE_DEFAULTS[key];
            }

            if (context.saveSettings) {
                try {
                    const success = await context.saveSettings(moduleDefaultsToSave);
                    if (success) {
                        console.log(`${SCRIPT_NAME}: Settings reset to module defaults via context.`);
                        // Update UI elements to reflect these defaults
                        const panel = document.getElementById('fbcmf-mc-panel');
                        if (panel) {
                            panel.querySelector('#fbcmf-mc-columns').value = MODULE_DEFAULTS.multiColumn_columnCount;
                            panel.querySelector('#fbcmf-mc-gap').value = MODULE_DEFAULTS.multiColumn_columnGap;
                            panel.querySelector('#fbcmf-mc-height').value = MODULE_DEFAULTS.multiColumn_maxPostHeight;
                            panel.querySelector('#fbcmf-mc-sidebar').value = MODULE_DEFAULTS.multiColumn_sidebarWidth;
                            panel.querySelector('#fbcmf-mc-enable').checked = MODULE_DEFAULTS.multiColumn_enabled;
                            // Update value displays
                            ['columns', 'gap', 'height', 'sidebar'].forEach(s => {
                                panel.querySelector(`#fbcmf-mc-${s}-value`).textContent = panel.querySelector(`#fbcmf-mc-${s}`).value;
                            });
                        }
                        applyStyles(); // Re-apply styles with new defaults
                        showStatusMessage('Settings reset to defaults!', 'success');
                    } else {
                         showStatusMessage('Reset failed (framework)', 'error');
                    }
                } catch (e) {
                    console.error(`${SCRIPT_NAME}: Error resetting settings:`, e);
                    showStatusMessage('Reset error: ' + e.message, 'error');
                }
            }
        };

        function attachControlEvents(controlDiv) {
            const toggle = controlDiv.querySelector('#fbcmf-mc-toggle');
            const panel = controlDiv.querySelector('#fbcmf-mc-panel');
            const closeBtn = controlDiv.querySelector('#fbcmf-mc-close');

            toggle.addEventListener('click', () => panel.style.display = panel.style.display === 'none' ? 'block' : 'none');
            closeBtn.addEventListener('click', () => panel.style.display = 'none');

            ['columns', 'gap', 'height', 'sidebar'].forEach(setting => {
                const input = controlDiv.querySelector(`#fbcmf-mc-${setting}`);
                const valueDisplay = controlDiv.querySelector(`#fbcmf-mc-${setting}-value`);
                input.addEventListener('input', debounce(() => {
                    valueDisplay.textContent = input.value;
                    updatePreview();
                }, 100));
            });
            controlDiv.querySelector('#fbcmf-mc-enable').addEventListener('change', updatePreview);
            controlDiv.querySelector('#fbcmf-mc-save').addEventListener('click', saveCurrentSettings);
            controlDiv.querySelector('#fbcmf-mc-reset').addEventListener('click', resetSettingsToModuleDefaults);
        }

        // === MAIN STYLE APPLICATION ===
        let mainStyle = null;
        const applyStyles = () => {
            if (mainStyle) mainStyle.remove();
            if (previewStyle) { previewStyle.remove(); previewStyle = null; } // Clear preview

            const css = generateCSS(); // Uses reactive currentSettings
            if (css) {
                mainStyle = document.createElement("style");
                mainStyle.id = "fbcmf-mc-main-styles";
                mainStyle.textContent = css;
                (document.querySelector("head") || document.documentElement).appendChild(mainStyle);
            }
             console.log(`${SCRIPT_NAME}: Styles applied. Enabled: ${currentSettings.enabled}`);
        };

        // === INITIALIZATION ===
        const init = () => {
            applyStyles();
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createControlUI);
            } else {
                setTimeout(createControlUI, 1000); // Delay for FB's dynamic loading
            }

            let lastUrl = location.href;
            const observer = new MutationObserver(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    setTimeout(() => {
                        applyStyles(); // Re-apply styles on navigation
                        if (!document.getElementById(controlPanelId)) createControlUI();
                    }, 500);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Listen for global settings changes to re-apply styles if 'enabled' status changed
            document.addEventListener('fbcmf:settings-saved', (event) => {
                if (event.detail) {
                    // Check if relevant settings for this module changed
                    const newEnabledState = event.detail.multiColumn_enabled;
                    if (newEnabledState !== undefined && newEnabledState !== currentSettings.enabled) {
                        console.log(`${SCRIPT_NAME}: 'enabled' state changed globally, re-applying styles.`);
                        applyStyles(); // This will use the new settings from context
                    }
                    // Could also update language for 't' function if panel is open and language changed
                    const panel = document.getElementById('fbcmf-mc-panel');
                    if (panel && panel.style.display === 'block' && event.detail.language && event.detail.language !== currentSettings.language) {
                       // If language changed, one might want to redraw the panel or update texts
                       // For simplicity, a page reload by UIManager would handle this.
                       // Or, if panel is open, force re-creation or text updates.
                       console.log(`${SCRIPT_NAME}: Global language changed. Panel might need manual refresh if open.`);
                    }
                }
            });
            console.log(`${SCRIPT_NAME} v${VERSION} initialized`);
        };
        init();
    }
    FBCMF.registerModule('FacebookMultiColumnEnhanced', FacebookMultiColumnEnhancedModule);
})();
