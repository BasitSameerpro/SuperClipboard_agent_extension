import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('%c[Agentic Clipboard] CONTENT SCRIPT INJECTED!', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    
    let floatBtn: HTMLDivElement | null = null;

    // Function to create the floating button
    const createButton = () => {
      // 1. Destroy any ghost buttons from previous SPA navigations
      const existingBtn = document.getElementById('agentic-float-btn');
      if (existingBtn) existingBtn.remove();

      floatBtn = document.createElement('div');
      floatBtn.id = 'agentic-float-btn';
      floatBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      `;
      floatBtn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #0a0a0a;
        color: #ffffff;
        border: 1px solid #333;
        display: none; /* INVISIBLE BY DEFAULT */
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        transition: all 0.2s ease;
      `;

      floatBtn.addEventListener('mouseenter', () => {
        if (floatBtn) {
          floatBtn.style.transform = 'scale(1.08)';
          floatBtn.style.background = '#ffffff';
          floatBtn.style.color = '#0a0a0a';
        }
      });

      floatBtn.addEventListener('mouseleave', () => {
        if (floatBtn) {
          floatBtn.style.transform = 'scale(1)';
          floatBtn.style.background = '#0a0a0a';
          floatBtn.style.color = '#ffffff';
        }
      });

      floatBtn.addEventListener('click', () => {
        try {
          if (browser.runtime?.id) {
            browser.runtime.sendMessage({ action: 'openPopup' });
          } else {
            removeButton();
            console.warn('[Agentic Clipboard] Extension context invalidated.');
          }
        } catch (e) {
          removeButton();
          console.warn('[Agentic Clipboard] Error sending message:', e);
        }
      });

      document.body.appendChild(floatBtn);
    };

    const removeButton = () => {
      const existingBtn = document.getElementById('agentic-float-btn');
      if (existingBtn) existingBtn.remove();
      floatBtn = null;
    };

    const updateButtonVisibility = (enabled: boolean) => {
      // If enabled, ensure it exists and is visible
      if (enabled) {
        createButton(); // Will not duplicate because it checks for existing
        const existingBtn = document.getElementById('agentic-float-btn');
        if (existingBtn) existingBtn.style.display = 'flex';
      } else {
        removeButton();
      }
    };

    // 1. Immediately create the button synchronously but hidden!
    createButton();

    // 2. Listen for real-time toggle messages from popup
    try {
      browser.runtime.onMessage.addListener((message: any) => {
        if (message.action === 'toggleFloatingButton') {
          updateButtonVisibility(message.enabled);
        }
      });
    } catch (e) {
      console.warn('[Agentic Clipboard] Could not register listener:', e);
    }

    // 3. Asynchronously check if it should be REVEALED
    try {
      browser.storage.local.get(['floatingButtonEnabled']).then(result => {
        const isEnabled = result.floatingButtonEnabled !== false; // Default is true
        updateButtonVisibility(isEnabled);
      });
    } catch (e) {
      // If storage fails, fallback to visible just in case
      console.warn('[Agentic Clipboard] Storage check failed, keeping button visible:', e);
      updateButtonVisibility(true);
    }

    // 4. Keyboard shortcut listener as backup/supplement
    window.addEventListener('keydown', (e) => {
      const isX = e.code === 'KeyX' || e.key === 'x' || e.key === 'X' || e.keyCode === 88;
      const isAltShift = e.altKey && e.shiftKey;
      const isCtrlShift = e.ctrlKey && e.shiftKey;
      
      if (isX && (isAltShift || isCtrlShift)) {
        console.log('[Agentic Clipboard] Keyboard shortcut detected, requesting popup...');
        e.preventDefault();
        e.stopPropagation();
        try {
          if (browser.runtime?.id) {
            browser.runtime.sendMessage({ action: 'openPopup' });
          }
        } catch (err) {
          console.warn('[Agentic Clipboard] Error sending message on shortcut:', err);
        }
      }
    }, true);
  },
});