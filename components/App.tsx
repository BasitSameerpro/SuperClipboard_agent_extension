import React, { useState, useEffect, useRef } from 'react';
import { pickAndBundleFolder } from '../utils/fileBundler';
import { getCachedSkills, fetchAndCacheSkills, fetchSkillContent, Skill } from '../utils/githubFetcher';

const DEFAULT_EXCLUDES = [
  'node_modules', '.git', '.github', '.vscode', '.idea', 'dist', 'build', 'out', 
  'coverage', '.next', '.nuxt', '*.log', '*.tmp', '*.temp', '.env', '.env.*',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', 'Thumbs.db'
];

export default function App() {
  // Tab State
  const [activeTab, setActiveTab] = useState<'skills' | 'extractor'>('skills');
  
  // Skills State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<string>('');
  
  // Folder Extractor State
  const [excludePatterns, setExcludePatterns] = useState<string[]>(DEFAULT_EXCLUDES);
  const [compression, setCompression] = useState<'none' | 'minify' | 'skeleton'>('none');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [floatingEnabled, setFloatingEnabled] = useState<boolean>(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load settings from storage
    browser.storage.local.get(['floatingButtonEnabled', 'excludePatterns']).then(result => {
      if (result.floatingButtonEnabled !== undefined) setFloatingEnabled(result.floatingButtonEnabled);
      if (result.excludePatterns) setExcludePatterns(result.excludePatterns);
    });

    // Auto-focus the search bar
    setTimeout(() => searchInputRef.current?.focus(), 100);

    // Load skills
    loadSkills();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSkills = async () => {
    try {
      let cachedSkills = await getCachedSkills();
      if (cachedSkills.length === 0) {
        setStatus('Loading skills...');
        cachedSkills = await fetchAndCacheSkills();
      }
      setSkills(cachedSkills);
      if (status === 'Loading skills...') setStatus('');
    } catch (err: any) { 
      setStatus('Failed to load skills'); 
      console.error(err);
    }
  };

  // Limit autocomplete to 10 items for performance and UI compactness
  const filteredSkills = skills.filter(skill => 
    skill.command.toLowerCase().includes(skillInput.toLowerCase())
  ).slice(0, 10);

  useEffect(() => { setSelectedIndex(0); }, [skillInput]);

  const handleSkillAction = async (skillOverride?: Skill) => {
    const cmd = skillOverride ? skillOverride.command : skillInput;
    if (!cmd.startsWith('/')) { setStatus('Command must start with /'); return; }
    
    const matchedSkill = skillOverride || skills.find(s => s.command.toLowerCase() === cmd.toLowerCase());
    if (!matchedSkill) { setStatus(`Unknown command: ${cmd}`); return; }

    setStatus('Fetching skill...');
    try {
      const content = await fetchSkillContent(matchedSkill);
      await navigator.clipboard.writeText(content);
      setStatus(`✓ ${matchedSkill.command} copied!`);
      setTimeout(() => window.close(), 50); // Auto-close instantly to get back to ChatGPT
    } catch (err: any) { setStatus(`Error: ${err.message}`); }
  };

  const handleBundleAction = async () => {
    try {
      setStatus('Selecting folder...');
      const bundledText = await pickAndBundleFolder(
        { minify: compression === 'minify', skeleton: compression === 'skeleton', excludePatterns }, 
        setStatus
      );
      
      setStatus('Copying...');
      try {
        await navigator.clipboard.writeText(bundledText);
        setStatus('✓ Folder copied to clipboard!');
      } catch (clipErr) {
        const blob = new Blob([bundledText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'codebase.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus('✓ Downloaded as .txt (Too large)');
      }
      setTimeout(() => window.close(), 50); // Auto-close instantly to get back to ChatGPT
    } catch (err: any) { setStatus(`Error: ${err.message}`); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { 
      if (showDropdown && filteredSkills.length > 0) {
        const skill = filteredSkills[selectedIndex];
        setSkillInput(skill.command);
        setShowDropdown(false);
        handleSkillAction(skill);
      } else {
        handleSkillAction(); 
        setShowDropdown(false); 
      }
    } 
    else if (e.key === 'Escape') { setShowDropdown(false); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSkills.length - 1));
      setShowDropdown(true);
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      setShowDropdown(true);
    }
  };

  const saveSettings = () => {
    browser.storage.local.set({ 
      floatingButtonEnabled: floatingEnabled,
      excludePatterns: excludePatterns
    });
    
    // Notify all tabs to toggle the floating button
    browser.tabs.query({}).then(tabs => {
      tabs.forEach(tab => {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { 
            action: 'toggleFloatingButton', 
            enabled: floatingEnabled 
          }).catch(() => {});
        }
      });
    });
    
    setShowSettings(false);
    setStatus('Settings saved');
    setTimeout(() => setStatus(''), 2000);
  };

  const toggleExclude = (pattern: string) => {
    setExcludePatterns(prev => 
      prev.includes(pattern) ? prev.filter(p => p !== pattern) : [...prev, pattern]
    );
  };

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', width: '100%', minHeight: '450px', boxSizing: 'border-box', color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', lineHeight: '1.5', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', letterSpacing: '-0.3px' }}>Agentic Clipboard</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>{skills.length} skills loaded</p>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: '1px solid #333', color: '#888', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '16px' }} title="Settings">⚙️</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('skills')}
          style={{
            flex: 1,
            background: activeTab === 'skills' ? '#ffffff' : 'transparent',
            color: activeTab === 'skills' ? '#0a0a0a' : '#888',
            border: '1px solid #333',
            padding: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
        >
          Skills (/)
        </button>
        <button
          onClick={() => setActiveTab('extractor')}
          style={{
            flex: 1,
            background: activeTab === 'extractor' ? '#ffffff' : 'transparent',
            color: activeTab === 'extractor' ? '#0a0a0a' : '#888',
            border: '1px solid #333',
            padding: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
        >
          Folder Extractor
        </button>
      </div>

      {/* Tab 1: Skills Content */}
      {activeTab === 'skills' && (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <input 
            ref={searchInputRef}
            value={skillInput} 
            onChange={e => { setSkillInput(e.target.value); setShowDropdown(true); }} 
            onFocus={() => setShowDropdown(true)} 
            onKeyDown={handleKeyDown} 
            placeholder="Type / to search skills..." 
            style={{ width: '100%', padding: '12px', border: '1px solid #333', background: '#111', color: '#fff', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginBottom: '12px' }} 
          />
          
          {showDropdown && filteredSkills.length > 0 && (
            <div style={{ position: 'absolute', top: '50px', left: 0, right: 0, background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid #333', borderRadius: '6px', maxHeight: '240px', overflowY: 'auto', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}>
              {filteredSkills.map((skill, index) => (
                <div 
                  key={skill.command} 
                  onClick={() => { setSkillInput(skill.command); setShowDropdown(false); handleSkillAction(skill); }} 
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #222', fontSize: '13px', color: '#ccc', background: index === selectedIndex ? '#333' : 'transparent' }} 
                  onMouseEnter={() => setSelectedIndex(index)} 
                >
                  <span style={{ color: '#fff', fontWeight: '600' }}>{skill.command}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button 
              onClick={() => handleSkillAction()} 
              style={{ flex: 2, padding: '12px', border: '1px solid #444', background: '#111', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px', borderRadius: '6px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#222'}
              onMouseLeave={e => e.currentTarget.style.background = '#111'}
            >
              Copy Skill to Clipboard
            </button>
            <button 
              onClick={() => setShowBrowseMenu(true)} 
              style={{ flex: 1, padding: '12px', border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer', fontWeight: '600', fontSize: '12px', borderRadius: '6px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
            >
              Browse All
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Folder Extractor Content */}
      {activeTab === 'extractor' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Compression</div>
            <select 
              value={compression} 
              onChange={e => setCompression(e.target.value as any)} 
              style={{ width: '100%', padding: '10px', border: '1px solid #333', background: '#111', color: '#fff', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
            >
              <option value="none">No Compression (Raw Code)</option>
              <option value="minify">Minify (Strip Comments/Whitespace)</option>
              <option value="skeleton">Skeleton (Signatures Only)</option>
            </select>
          </div>

          <button 
            onClick={handleBundleAction} 
            style={{ width: '100%', padding: '12px', border: '1px solid #444', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px', borderRadius: '6px', transition: 'all 0.2s' }}
          >
            Extract & Copy Folder
          </button>
        </div>
      )}

      {/* Status Message */}
      {status && (
        <div style={{ marginTop: '16px', fontSize: '12px', textAlign: 'center', color: status.startsWith('✓') ? '#4ade80' : status.startsWith('Error') || status.startsWith('Failed') ? '#f87171' : '#888', padding: '10px', borderRadius: '6px', background: status.startsWith('✓') ? 'rgba(74, 222, 128, 0.1)' : status.startsWith('Error') || status.startsWith('Failed') ? 'rgba(248, 113, 113, 0.1)' : 'transparent' }}>
          {status}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', padding: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Settings</h3>
            <button onClick={saveSettings} style={{ background: '#fff', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }}>Save & Close</button>
          </div>

          {/* Floating Button Toggle */}
          <div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Floating Button</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#111', borderRadius: '6px', border: '1px solid #333' }}>
              <span style={{ fontSize: '13px', color: '#ccc' }}>Show floating button on webpages</span>
              <button
                onClick={() => setFloatingEnabled(!floatingEnabled)}
                style={{
                  background: floatingEnabled ? '#4ade80' : '#444',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {floatingEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Exclude Patterns */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Exclude Patterns</div>
            <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>Files and folders to ignore when extracting code</p>
            <div style={{ flex: 1, overflowY: 'auto', background: '#111', borderRadius: '6px', border: '1px solid #333', padding: '12px', maxHeight: '200px' }}>
              {DEFAULT_EXCLUDES.map(pattern => (
                <label key={pattern} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderBottom: '1px solid #222' }}>
                  <input 
                    type="checkbox" 
                    checked={excludePatterns.includes(pattern)} 
                    onChange={() => toggleExclude(pattern)} 
                    style={{ marginRight: '12px', accentColor: '#4ade80', width: '16px', height: '16px' }} 
                  />
                  <span style={{ fontSize: '12px', color: '#ccc', fontFamily: 'monospace' }}>{pattern}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Browse All Skills Modal */}
      {showBrowseMenu && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a0a', padding: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>All Skills Catalog</h3>
            <button onClick={() => setShowBrowseMenu(false)} style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }}>Close</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
            {skills.map(skill => (
              <div 
                key={skill.command}
                onClick={() => { setSkillInput(skill.command); setShowBrowseMenu(false); handleSkillAction(skill); }}
                style={{ background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
              >
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{skill.command}</div>
                <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>Click to auto-copy payload</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}