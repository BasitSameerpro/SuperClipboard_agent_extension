import { fetchAndCacheSkills } from '../utils/githubFetcher';

export default defineBackground(() => {
  // Fetch skills when extension is installed or updated
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install' || details.reason === 'update') {
      console.log('[Background] Fetching skills cache...');
      try {
        await fetchAndCacheSkills();
        console.log('[Background] Skills cached successfully');
      } catch (err) {
        console.error('[Background] Failed to cache skills:', err);
      }
    }
  });

  // Fetch skills when browser starts
  browser.runtime.onStartup.addListener(async () => {
    console.log('[Background] Browser started, refreshing skills cache...');
    try {
      await fetchAndCacheSkills();
      console.log('[Background] Skills refreshed');
    } catch (err) {
      console.error('[Background] Failed to refresh skills:', err);
    }
  });

  // Handle messages from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPopup') {
      console.log('[Background] Opening popup via content script request');
      const actionApi = browser.action || (globalThis as any).chrome?.action;
      if (actionApi && actionApi.openPopup) {
        actionApi.openPopup().catch((err: any) => {
          console.error('[Background] Failed to open popup using Action API:', err);
        });
      } else {
        const browserActionApi = browser.browserAction || (globalThis as any).chrome?.browserAction;
        if (browserActionApi && browserActionApi.openPopup) {
          browserActionApi.openPopup().catch((err: any) => {
            console.error('[Background] Failed to open popup using BrowserAction API:', err);
          });
        } else {
          console.error('[Background] openPopup API not found in action or browserAction');
        }
      }
    }
  });
});