/**
 * Module: FilterRegistry
 * Purpose: Extensible structure for registering and applying post filters.
 * Adapted for FBCMF Extension (Manifest V3)
 */
async function FilterRegistryModule(ctx) { // Changed to a named async function
  'use strict';
  // No need to check for window.FBCMF here, this function will be called by FBCMF core.

  console.log('[FBCMF FilterRegistry] Initializing...');
  const filters = new Map();

  const register = (name, filterFn) => {
    if (typeof filterFn === 'function') {
      filters.set(name, filterFn);
      if (ctx.settings?.verbosity === 'verbose') { // Check verbosity through ctx
        console.log(`[FBCMF FilterRegistry] Registered filter: ${name}`);
      }
    } else {
      console.warn(`[FBCMF FilterRegistry] ❌ Filter "${name}" is not a valid function.`);
    }
  };

  const apply = (post, settings) => {
    // Ensure settings object is available
    if (!settings) {
        if (ctx.settings?.verbosity === 'verbose') {
            console.warn('[FBCMF FilterRegistry] Apply called without settings object.');
        }
        return '';
    }
    for (const [name, fn] of filters.entries()) {
      // Check if the specific filter is enabled in settings.
      // The setting key might be, e.g., `blockSponsored` which corresponds to a filter name.
      // Or, it could be a more generic settings structure like `settings.filters.blockSponsored`.
      // For now, assuming direct match like `settings[name_of_filter_feature]` e.g. settings['blockSponsored']
      if (settings[name] === true || (typeof settings[name] === 'object' && settings[name]?.enabled === true) ) {
        const reason = fn(post, settings); // Pass full settings to filter function
        if (reason) return reason;
      }
    }
    return '';
  };

  // The API for this module will be returned and merged into the FBCMF context by the core.
  const filterRegistryAPI = {
    register,
    apply,
    list: () => Array.from(filters.keys())
  };

  // No longer assign to window.FilterRegistry
  // ctx.FilterRegistry will be assigned by FBCMF core if this module returns an object.

  console.log('[FBCMF FilterRegistry] ✅ Ready.');
  return filterRegistryAPI; // Return the API
}
