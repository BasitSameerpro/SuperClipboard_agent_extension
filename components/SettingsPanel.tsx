import React from 'react';
import { browser } from 'wxt/browser';

const DEFAULT_EXCLUDES = [
  'node_modules', '.git', '.github', '.vscode', '.idea', 'dist', 'build', 'out', 
  'coverage', '.next', '.nuxt', '*.log', '*.tmp', '*.temp', '.env', '.env.*',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', 'Thumbs.db'
];

interface SettingsPanelProps {
  excludePatterns: string[];
  setExcludePatterns: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
}

export default function SettingsPanel({
  excludePatterns,
  setExcludePatterns,
  onSave
}: SettingsPanelProps) {

  const saveSettings = () => {
    browser.storage.local.set({ 
      excludePatterns: excludePatterns
    });
    onSave();
  };

  const toggleExclude = (pattern: string) => {
    setExcludePatterns(prev => 
      prev.includes(pattern) ? prev.filter(p => p !== pattern) : [...prev, pattern]
    );
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: '#0a0a0a', 
      padding: '20px', 
      zIndex: 200, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      overflowY: 'auto' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Settings</h3>
        <button 
          onClick={saveSettings} 
          style={{ 
            background: '#fff', 
            color: '#000', 
            border: 'none', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontWeight: '600', 
            fontSize: '11px' 
          }}
        >Save Settings</button>
      </div>

      {/* Exclude Patterns */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          marginBottom: '8px', 
          textTransform: 'uppercase', 
          letterSpacing: '1px', 
          fontWeight: '600' 
        }}>Ignore List</div>
        <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#555' }}>Paths ignored by the folder extractor tool:</p>
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          background: '#111', 
          borderRadius: '10px', 
          border: '1px solid #222', 
          padding: '8px', 
          maxHeight: '180px' 
        }}>
          {DEFAULT_EXCLUDES.map(pattern => (
            <label key={pattern} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderBottom: '1px solid #222' }}>
              <input 
                type="checkbox" 
                checked={excludePatterns.includes(pattern)} 
                onChange={() => toggleExclude(pattern)} 
                style={{ marginRight: '12px', accentColor: '#4ade80', width: '15px', height: '15px' }} 
              />
              <span style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace' }}>{pattern}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
