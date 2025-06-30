

/**
 * Module: SettingsManager (Adapted for Chrome Extension - Manifest V3)
 * Purpose: Provides API for storing/retrieving settings using chrome.storage.local, supports import/export.
 * Requires: "storage" permission in manifest.json.
 */
function SettingsManagerModuleFactory(FBCMF_CORE) { // Accept FBCMF_CORE if it's needed for direct FBCMF.settings update
  // This module will be registered with an instance of FBCMF.
  // It's wrapped in a factory to be consistent if we decide to pass FBCMF_CORE instance.
  // For now, it assumes FBCMF_CORE.settings will be updated by the core after this module returns its API.

  return async (ctx) => { // ctx is the context from FBCMF_INSTANCE
    const storageKey = 'fbcmf-settings'; // Key for chrome.storage.local
    const defaults = {
      blockSponsored: true,
    blockSuggested: true,
    blockReels: true,
    blockGIFs: true,
    blockKeywords: false,
    expandNewsFeed: true,
    verbosity: 'normal',
    language: 'vi',
    blockedKeywords: [],
    // Add other potential default settings here if needed
    theme: 'light', // Default theme from UIManager
    videoAdBlocker: false,
    showAllComments: false,
    autoDetectComments: false,
    notifyComments: false,
    scrollComments: false,
    hideAnonymous: false,
    autoSortChrono: false,
    autoSuggestKeywords: false,
    geminiApiKey: '',

    // Defaults for FacebookAntiRefreshPro module
    antiRefresh_enabled: true,
    antiRefresh_debug: false,
    antiRefresh_lang: 'vi', // Default language 'vi' or 'en'
    antiRefresh_inactivityTime: 60000, // milliseconds
    antiRefresh_historyBlockTime: 120000, // milliseconds
    antiRefresh_showNotifications: true,
    antiRefresh_blockLevel: 'medium', // 'low', 'medium', 'high'

    // Defaults for FacebookMultiColumnEnhanced module
    multiColumn_columnCount: 3,
    multiColumn_columnGap: 20, // px
    multiColumn_maxPostHeight: 70, // vh %
    multiColumn_sidebarWidth: 60, // px
    multiColumn_enabled: true,
    multiColumn_language: 'vi', // This could also default to global language if desired
  };

    // Asynchronous function to load settings from chrome.storage.local
    async function load() {
      try {
        // chrome.storage.local.get returns an object like { [storageKey]: value }
        const result = await chrome.storage.local.get(storageKey);
        const raw = result[storageKey]; // Get the stringified JSON
        const loadedSettings = raw ? JSON.parse(raw) : {};
        const finalSettings = { ...defaults, ...loadedSettings };

        // Use FBCMF_CORE.context for logging if verbosity is set, otherwise console.log directly
        // This check is a bit tricky as ctx.settings might not be populated when load() is first called by this module itself.
        // For now, will rely on FBCMF_CORE's context potentially being available or a direct console log.
        if ((ctx && ctx.settings?.verbosity === 'verbose') || FBCMF_CORE?.context?.settings?.verbosity === 'verbose') {
           console.log('[FBCMF Settings] Settings loaded from chrome.storage:', finalSettings);
        } else {
           // console.log('[FBCMF Settings] Settings loaded (standard verbosity).'); // Optional basic log
        }
        return finalSettings;
      } catch (e) {
        console.error('[FBCMF Settings] Error loading settings from chrome.storage.local:', e);
        return { ...defaults }; // Return defaults in case of error
      }
    }

    // Asynchronous function to save settings to chrome.storage.local
    async function save(newSettings) {
      try {
        // Get current settings state (either from FBCMF_CORE instance or load fresh)
        // This ensures we merge with the most up-to-date settings before saving.
        const currentStoredSettings = await load(); // Load fresh to avoid race conditions if FBCMF_CORE.settings isn't updated yet
        const dataToSave = { ...currentStoredSettings, ...newSettings };

        for (const key in dataToSave) {
          if (dataToSave[key] === undefined) {
             dataToSave[key] = defaults[key];
          }
        }

        await chrome.storage.local.set({ [storageKey]: JSON.stringify(dataToSave) });

        // Update the FBCMF_CORE instance's settings immediately if FBCMF_CORE is available
        if (FBCMF_CORE) {
            FBCMF_CORE.settings = dataToSave;
            if (FBCMF_CORE.context) FBCMF_CORE.context.settings = dataToSave; // also update context
        }

        if ((ctx && ctx.settings?.verbosity === 'verbose') || FBCMF_CORE?.context?.settings?.verbosity === 'verbose') {
          console.log('[FBCMF Settings] Settings saved to chrome.storage:', dataToSave);
        }
        document.dispatchEvent(new CustomEvent('fbcmf:settings-saved', { detail: dataToSave }));
        return true;
      } catch (e) {
        console.error('[FBCMF Settings] Error saving settings to chrome.storage.local:', e);
        return false;
      }
    }

    // Export settings (remains synchronous, exports current state from FBCMF_CORE if available)
    function exportSettings() {
      // It should export the *current effective settings* which FBCMF_CORE holds
      const settingsToExport = FBCMF_CORE ? FBCMF_CORE.settings : (ctx.settings || defaults);
      return JSON.stringify(settingsToExport, null, 2);
    }

    // Import settings (becomes asynchronous due to save call)
    async function importSettings(jsonStr) {
      try {
        const obj = JSON.parse(jsonStr);
        // Before saving, ensure we are merging with defaults to not miss any new default keys
        const settingsToImport = { ...defaults, ...obj };
        const success = await save(settingsToImport);
        if (success) {
          // Alerting from content script is fine.
          alert('✅ Settings imported successfully. Page will reload to apply all changes.');
          location.reload();
        } else {
           alert('❌ Error saving imported settings.');
        }
      } catch (e) {
        console.error('[FBCMF Settings] Error importing settings:', e);
        alert('❌ Error importing settings. Check JSON format and console.');
      }
    }

    // --- Initialization within the module ---
    // This part is crucial: settings are loaded and become the initial FBCMF_CORE.settings
    console.log('[SettingsManager] Initializing and loading settings for FBCMF_CORE...');
    const initialSettings = await load();
    // The FBCMF_CORE init process will take these initialSettings and populate its own FBCMF_CORE.settings and ctx.settings.
    console.log('[SettingsManager] Initial settings loaded from chrome.storage:', initialSettings);

    // The API returned will be merged into FBCMF_CORE's context.
    // FBCMF_CORE.settings will be the single source of truth after init.
    return {
        loadSettings: load, // Function to explicitly reload settings if needed
        saveSettings: save, // Function to save settings
        exportSettings: exportSettings,
        importSettings: importSettings,
        getCurrentSettings: () => initialSettings // Provides the settings loaded at module init. FBCMF_CORE.settings is the live one.
                                                  // Or, more accurately: () => FBCMF_CORE.settings if FBCMF_CORE is passed and guaranteed to be updated.
                                                  // For now, this returns the settings as loaded when this module was initialized.
                                                  // The core framework will ensure FBCMF_INSTANCE.settings and context.settings are the live ones.
    };
  };
}

