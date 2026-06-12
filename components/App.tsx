import React, { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { useSkills } from '../hooks/useSkills';
import { Skill } from '../utils/githubFetcher';

// Subcomponents
import SkillSearch from './SkillSearch';
import SkillCatalog from './SkillCatalog';
import FolderBundler from './FolderBundler';
import SettingsPanel from './SettingsPanel';
import PreviewModal from './PreviewModal';

const DEFAULT_EXCLUDES = [
  'node_modules', '.git', '.github', '.vscode', '.idea', 'dist', 'build', 'out', 
  'coverage', '.next', '.nuxt', '*.log', '*.tmp', '*.temp', '.env', '.env.*',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', 'Thumbs.db'
];

export default function App() {
  const {
    skills,
    domains,
    status,
    setStatus,
    handleSkillAction
  } = useSkills();

  // Folder Extractor Configuration State
  const [excludePatterns, setExcludePatterns] = useState<string[]>(DEFAULT_EXCLUDES);

  const isStandaloneBundler = typeof window !== 'undefined' && window.location.search.includes('view=bundler_standalone');

  if (isStandaloneBundler) {
    return (
      <div style={{ 
        background: '#0a0a0a', 
        padding: '20px', 
        width: '100%', 
        minHeight: '450px', 
        boxSizing: 'border-box', 
        color: '#ffffff', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
        fontSize: '13px', 
        lineHeight: '1.5', 
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #222' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#3b82f6' }}>Folder Bundler</h3>
        </div>
        <FolderBundler
          excludePatterns={excludePatterns}
          setStatus={setStatus}
          autoTrigger={true}
        />
        {status && (
          <div style={{ 
            marginTop: '16px', 
            fontSize: '12px', 
            textAlign: 'center', 
            color: status.startsWith('✓') ? '#4ade80' : status.startsWith('Error') || status.startsWith('Failed') ? '#f87171' : '#888', 
            padding: '10px', 
            borderRadius: '10px', 
            background: status.startsWith('✓') ? 'rgba(74, 222, 128, 0.05)' : status.startsWith('Error') || status.startsWith('Failed') ? 'rgba(248, 113, 113, 0.05)' : 'transparent' 
          }}>
            {status}
          </div>
        )}
      </div>
    );
  }

  // Tab State
  const [activeTab, setActiveTab] = useState<'skills' | 'extractor'>('skills');
  
  // Modal/Overlay State
  const [showSettings, setShowSettings] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);

  // Autocomplete visibility (for dynamic sizing)
  const [showDropdown, setShowDropdown] = useState(false);



  useEffect(() => {
    // Load ignore list settings from storage
    browser.storage.local.get(['excludePatterns']).then(result => {
      if (result.excludePatterns) {
        setExcludePatterns(result.excludePatterns);
      }
    });

    // Toggle close keyboard shortcut listener
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isSpace = e.code === 'Space' || e.key === ' ' || e.keyCode === 32;
      const isCtrlShift = e.ctrlKey && e.shiftKey;
      if (isSpace && isCtrlShift) {
        e.preventDefault();
        e.stopPropagation();
        window.close();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Filter skills query to calculate dropdown sizing
  const filteredSkillsCount = skills.filter(skill => 
    showDropdown && (
      skill.command.toLowerCase().includes('') ||
      skill.name.toLowerCase().includes('')
    )
  ).length;

  const getMinHeight = () => {
    if (showSettings) return '380px';
    if (previewSkill) return '520px';
    if (showBrowseMenu) {
      if (selectedDomain === 'all') return '410px';
      return '520px';
    }
    if (activeTab === 'skills' && showDropdown && filteredSkillsCount > 0) return '430px';
    return '220px';
  };

  return (
    <div style={{ 
      background: '#0a0a0a', 
      padding: '20px', 
      width: '100%', 
      minHeight: getMinHeight(), 
      transition: 'min-height 0.15s ease-out', 
      boxSizing: 'border-box', 
      color: '#ffffff', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      fontSize: '13px', 
      lineHeight: '1.5', 
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #222' }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '17px', 
            fontWeight: '700', 
            letterSpacing: '-0.3px', 
            background: 'linear-gradient(90deg, #fff 0%, #aaa 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>Agentic Clipboard</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666' }}>{skills.length} prompts & skills loaded</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => { setShowBrowseMenu(true); setSelectedDomain('all'); }} 
            style={{ 
              background: '#111', 
              border: '1px solid #333', 
              color: '#aaa', 
              cursor: 'pointer', 
              padding: '6px 12px', 
              borderRadius: '10px', 
              fontSize: '11px', 
              fontWeight: '600',
              transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = '#333'; }}
          >
            Explore Skills
          </button>
          <button 
            onClick={() => setShowSettings(true)} 
            style={{ 
              background: 'none', 
              border: '1px solid #333', 
              color: '#888', 
              cursor: 'pointer', 
              padding: '6px 10px', 
              borderRadius: '10px', 
              fontSize: '14px', 
              transition: 'all 0.2s' 
            }} 
            onMouseEnter={e => e.currentTarget.style.borderColor = '#555'} 
            onMouseLeave={e => e.currentTarget.style.borderColor = '#333'} 
            title="Settings"
          >⚙️</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('skills')}
          style={{
            flex: 1,
            background: activeTab === 'skills' ? '#ffffff' : 'transparent',
            color: activeTab === 'skills' ? '#0a0a0a' : '#888',
            border: '1px solid #222',
            padding: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            borderRadius: '10px',
            transition: 'all 0.2s'
          }}
        >
          Quick Command (/)
        </button>
        <button
          onClick={() => setActiveTab('extractor')}
          style={{
            flex: 1,
            background: activeTab === 'extractor' ? '#ffffff' : 'transparent',
            color: activeTab === 'extractor' ? '#0a0a0a' : '#888',
            border: '1px solid #222',
            padding: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            borderRadius: '10px',
            transition: 'all 0.2s'
          }}
        >
          Folder Bundler
        </button>
      </div>

      {/* Tab 1: Skills Search & Command Bar */}
      {activeTab === 'skills' && (
        <SkillSearch
          skills={skills}
          onSelectSkill={(input, skill) => handleSkillAction(input, skill)}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
        />
      )}

      {/* Tab 2: Folder Extractor Content */}
      {activeTab === 'extractor' && (
        <FolderBundler
          excludePatterns={excludePatterns}
          setStatus={setStatus}
        />
      )}

      {/* Status Message */}
      {status && (
        <div style={{ 
          marginTop: '16px', 
          fontSize: '12px', 
          textAlign: 'center', 
          color: status.startsWith('✓') ? '#4ade80' : status.startsWith('Error') || status.startsWith('Failed') ? '#f87171' : '#888', 
          padding: '10px', 
          borderRadius: '10px', 
          background: status.startsWith('✓') ? 'rgba(74, 222, 128, 0.05)' : status.startsWith('Error') || status.startsWith('Failed') ? 'rgba(248, 113, 113, 0.05)' : 'transparent' 
        }}>
          {status}
        </div>
      )}

      {/* Settings Panel Modal */}
      {showSettings && (
        <SettingsPanel
          excludePatterns={excludePatterns}
          setExcludePatterns={setExcludePatterns}
          onSave={() => {
            setShowSettings(false);
            setStatus('Settings saved');
            setTimeout(() => setStatus(''), 1000);
          }}
        />
      )}

      {/* Explore Prompts Catalog Dashboard Modal */}
      {showBrowseMenu && (
        <SkillCatalog
          skills={skills}
          domains={domains}
          onClose={() => setShowBrowseMenu(false)}
          onSelectSkill={(skill) => handleSkillAction(skill.command, skill)}
          onPreviewSkill={(skill) => setPreviewSkill(skill)}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
        />
      )}

      {/* Interactive Prompt Preview Overlay Modal */}
      {previewSkill && (
        <PreviewModal
          previewSkill={previewSkill}
          onClose={() => setPreviewSkill(null)}
          onCopied={(msg) => {
            setStatus(msg);
            setPreviewSkill(null);
          }}
        />
      )}
    </div>
  );
}