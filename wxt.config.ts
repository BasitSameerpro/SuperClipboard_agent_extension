import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "Agentic Super Clipboard",
    description: "Bundle code & AI skills for your clipboard",
    version: "0.0.4",
    permissions: [
      "storage", 
      "clipboardWrite", 
      "activeTab",
      "unlimitedStorage",
      "contextMenus"
    ],
    icons: {
      "16": "icon-16.png",
      "32": "icon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    },
    action: {
      default_icon: {
        "16": "icon-16.png",
        "32": "icon-32.png",
        "48": "icon-48.png",
        "128": "icon-128.png"
      }
    },
    host_permissions: [
      "https://basitsameerpro.github.io/*",
      "https://raw.githubusercontent.com/*"
    ],
    browser_specific_settings: {
      gecko: {
        id: "agentic-clipboard@yourdomain.com",
        strict_min_version: "109.0"
      }
    },
    omnibox: {
      keyword: "ac"
    },
    commands: {
      "_execute_action": {
        "suggested_key": {
          "default": "Ctrl+Shift+Space",
          "mac": "Ctrl+Shift+Space"
        },
        "description": "Open Agentic Clipboard"
      }
    }
  },
});