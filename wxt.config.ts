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
      "activeTab" // <--- THIS FIXES THE GREYED OUT ICON
    ],
    host_permissions: [
      "https://api.github.com/*",
      "https://raw.githubusercontent.com/*",
      "<all_urls>" // <--- ALLOWS IT TO RUN ON EVERY WEBSITE
    ],
    browser_specific_settings: {
      gecko: {
        id: "agentic-clipboard@yourdomain.com",
        strict_min_version: "109.0"
      }
    },
    commands: {
      "_execute_action": {
        "suggested_key": {
          "default": "Alt+Shift+X",
          "mac": "Alt+Shift+X"
        },
        "description": "Open Agentic Clipboard"
      }
    }
  },
});