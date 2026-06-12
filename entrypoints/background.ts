import { fetchAndCacheSkills } from '../utils/githubFetcher';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  const triggerPopup = async () => {
    try {
      await browser.action.openPopup();
    } catch (err) {
      console.error('[Background] Failed to open popup natively:', err);
    }
  };

  // Fetch skills when extension is installed or updated
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      try {
        await browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html' as any) });
      } catch (err) {
        console.error('[Background] Failed to open onboarding tab:', err);
      }
    }

    if (details.reason === 'install' || details.reason === 'update') {
      console.log('[Background] Fetching skills cache...');
      try {
        await fetchAndCacheSkills();
        console.log('[Background] Skills cached successfully');
      } catch (err) {
        console.error('[Background] Failed to cache skills:', err);
      }
    }

    // Create right-click context menu
    try {
      browser.contextMenus.create({
        id: "open-agentic",
        title: "Open Agentic Clipboard",
        contexts: ["page", "selection", "action"]
      });
    } catch (err) {
      console.warn('[Background] Context menu creation skipped/failed:', err);
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

  // Context menu click handler
  browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'open-agentic') {
      triggerPopup();
    }
  });

  // Omnibox activation handler
  if (browser.omnibox !== undefined) {
    browser.omnibox.onInputEntered.addListener(() => {
      triggerPopup();
    });
  }
});