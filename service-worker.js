// Facebook Cleaner One Extension - Service Worker
// Manifest V3

console.log("FBCMF Service Worker started.");

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("FBCMF Extension installed or updated:", details);

  // On first install, SettingsManager in the content script will populate full defaults.
  // This service worker block can ensure that a basic settings structure exists,
  // preventing errors if the service worker tries to access settings before a content script has run.
  // However, for this project, SettingsManager is robust enough to create defaults.
  // This block is more of a safeguard or for settings exclusively managed by the service worker.
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    try {
      const key = 'fbcmf-settings';
      const result = await chrome.storage.local.get(key);
      if (!result[key]) {
        console.log("FBCMF SW: No settings found. Content script's SettingsManager will initialize defaults.");
        // Optionally, set extremely minimal structural defaults if service worker needs them before content script runs.
        // For now, relying on SettingsManager in content script for full default setup.
        // const minimalDefaults = { version: "1.0.0" }; // Example
        // await chrome.storage.local.set({ [key]: JSON.stringify(minimalDefaults) });
      }
    } catch (e) {
      console.error("FBCMF SW: Error during onInstalled storage check:", e);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Log received messages for debugging purposes.
  if (message && message.action) {
    console.log(`[FBCMF SW] Received message: Action - ${message.action}, From - ${sender.tab ? 'Tab ID ' + sender.tab.id : 'Extension'}`);
  } else {
    console.log("[FBCMF SW] Received a message (no action specified):", message, "from sender:", sender);
  }

  // Example: Handling a specific action
  // if (message.action === "getServiceWorkerStatus") {
  //   sendResponse({ status: "active", version: chrome.runtime.getManifest().version });
  //   return true; // Keep message channel open for async response (if needed)
  // }

  // By default, if sendResponse is not called or not called asynchronously, return false or undefined.
  return false;
});

// Other potential service worker logic:
// - Handling alarms for periodic tasks (chrome.alarms API)
// - Managing complex declarativeNetRequest rulesets
// - Handling chrome.notifications API calls if modules message for it
// - Acting as a central communication hub if multiple extension components need to coordinate
//   beyond what chrome.storage.onChanged can provide.

console.log("FBCMF Service Worker listeners attached.");
