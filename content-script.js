// content-script.js - Main entry point for FBCMF Extension on Facebook pages

(async () => {
  'use strict';

  console.log('[FBCMF ContentScript] Initializing...');

  // Ensure FBCMF Core and modules are loaded (simulating a bundle)
  // In a real build process, these would be imported or concatenated.
  // We assume createFBCMF, SettingsManagerModuleFactory, UIManager module, etc.
  // are available in this scope when this script is part of content_bundle.js

  if (typeof createFBCMF !== 'function') {
    console.error('[FBCMF ContentScript] createFBCMF is not defined. Core framework missing.');
    return;
  }

  // Create an instance of the FBCMF framework
  const FBCMF = createFBCMF();

  // Register essential modules first
  // SettingsManager
  if (typeof SettingsManagerModuleFactory === 'function') {
    FBCMF.registerModule('SettingsManager', SettingsManagerModuleFactory(FBCMF)); // Pass FBCMF if it needs to update FBCMF.settings directly
  } else {
    console.error('[FBCMF ContentScript] SettingsManagerModuleFactory is not defined.');
    // Cannot proceed without settings manager in the current FBCMF design
    return;
  }

  // Register other core and feature modules
  // These would also be factories or directly callable module functions in a bundled environment
  // For now, assuming they become available globally or are wrapped similarly to SettingsManager

  // Example: UIManager (assuming UIManagerModule function is globally available from its file)
  if (typeof UIManagerModule !== 'undefined') { // Assuming UIManagerModule is the function from module_UIManager_test_final.js
    FBCMF.registerModule('UIManager', UIManagerModule);
  } else {
    console.warn('[FBCMF ContentScript] UIManagerModule not found. UI will be unavailable.');
  }

  // Example: FilterRegistry (assuming FilterRegistryModule function)
  if (typeof FilterRegistryModule !== 'undefined') {
    FBCMF.registerModule('FilterRegistry', FilterRegistryModule);
  } else {
    console.warn('[FBCMF ContentScript] FilterRegistryModule not found.');
  }

  // Example: FacebookAntiRefreshPro (assuming FacebookAntiRefreshProModule function)
  if (typeof FacebookAntiRefreshProModule !== 'undefined') {
    FBCMF.registerModule('FacebookAntiRefreshPro', FacebookAntiRefreshProModule);
  } else {
    console.warn('[FBCMF ContentScript] FacebookAntiRefreshProModule not found.');
  }

  // Example: FacebookMultiColumnEnhanced (assuming FacebookMultiColumnEnhancedModule function)
  if (typeof FacebookMultiColumnEnhancedModule !== 'undefined') {
    FBCMF.registerModule('FacebookMultiColumnEnhanced', FacebookMultiColumnEnhancedModule);
  } else {
    console.warn('[FBCMF ContentScript] FacebookMultiColumnEnhancedModule not found.');
  }

  // Register other existing modules (placeholders, assuming their functions are available)
  const otherModuleNames = [
      'BlockSponsoredModule', 'BlockSuggestedModule', 'BlockReelsModule',
      'BlockKeywordsModule', 'BlockGIFsModule', 'MutationObserverModule',
      'FeedExpanderModule', 'DialogPositionModule', 'LanguageModule',
      'VideoAdBlockerModule', 'ReelVideoControlsModule', 'LogoutButtonModule',
      'CommentsHelperModule', 'AIModule'
      // Add more module names if they exist as distinct functions/factories
  ];

  otherModuleNames.forEach(moduleName => {
      if (typeof window[moduleName] === 'function') { // A common way userscripts expose modules
          FBCMF.registerModule(moduleName.replace('Module',''), window[moduleName]);
      } else if (typeof eval(moduleName) === 'function') { // Fallback for functions not on window
          try {
            FBCMF.registerModule(moduleName.replace('Module',''), eval(moduleName));
          } catch(e){
            // console.warn(`[FBCMF ContentScript] Module function ${moduleName} not found or not a function.`);
          }
      } else {
          // console.warn(`[FBCMF ContentScript] Module function ${moduleName} not found.`);
      }
  });


  // DOM Readiness check before initializing FBCMF
  // The 'run_at': 'document_idle' in manifest.json helps, but an extra check or delay can be robust.
  const ensureDOMReady = async () => {
    if (document.readyState === 'loading') {
      console.log('[FBCMF ContentScript] DOM is loading, waiting for DOMContentLoaded.');
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    } else if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
      console.log('[FBCMF ContentScript] DOM not interactive/complete, waiting for window load.');
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }
    // Optional small delay for SPAs like Facebook to settle further after initial load events
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[FBCMF ContentScript] DOM is ready/settled.');
  };

  try {
    await ensureDOMReady();
    console.log('[FBCMF ContentScript] Attempting to initialize FBCMF core...');
    await FBCMF.init(); // Initialize the framework
    console.log('[FBCMF ContentScript] FBCMF initialized successfully.');
  } catch (error) {
    console.error('[FBCMF ContentScript] Error initializing FBCMF:', error);
  }

})();
