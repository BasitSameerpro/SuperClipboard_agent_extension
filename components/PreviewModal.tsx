import React, { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { Skill, fetchSkillContent } from '../utils/githubFetcher';

interface PreviewModalProps {
  previewSkill: Skill;
  onClose: () => void;
  onCopied: (message: string) => void;
}

export default function PreviewModal({
  previewSkill,
  onClose,
  onCopied
}: PreviewModalProps) {
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);
  const [previewContent, setPreviewContent] = useState<{
    system: string | null;
    user: string | null;
    readme: string | null;
    markdown: string | null;
  } | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'system' | 'user' | 'readme' | 'markdown'>('system');

  useEffect(() => {
    const loadPreview = async () => {
      setLoadingPreview(true);
      setPreviewContent(null);
      try {
        const domainStorageKey = `cached_domain_${previewSkill.domain}`;
        const domainObj = await browser.storage.local.get([domainStorageKey]);
        let domainData = domainObj[domainStorageKey];
        
        if (!domainData) {
          await fetchSkillContent(previewSkill);
          const refetched = await browser.storage.local.get([domainStorageKey]);
          domainData = refetched[domainStorageKey];
        }
        
        const promptItem = domainData?.prompts.find((p: any) => p.id === previewSkill.id);
        if (promptItem) {
          setPreviewContent(promptItem.content);
          if (promptItem.content.markdown) setActivePreviewTab('markdown');
          else if (promptItem.content.system) setActivePreviewTab('system');
          else if (promptItem.content.user) setActivePreviewTab('user');
          else setActivePreviewTab('readme');
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    };
    loadPreview();
  }, [previewSkill]);

  const copyPreviewPayload = async () => {
    try {
      const content = await fetchSkillContent(previewSkill);
      await navigator.clipboard.writeText(content);
      onCopied(`✓ ${previewSkill.name} copied!`);
      setTimeout(() => window.close(), 50);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(5, 5, 5, 0.95)', 
      backdropFilter: 'blur(16px)', 
      padding: '16px', 
      zIndex: 300, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px', 
      overflowY: 'hidden' 
    }}>
      
      {/* Modal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #222', paddingBottom: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>{previewSkill.name}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>Source: {previewSkill.source}</p>
        </div>
        <button 
          onClick={onClose} 
          style={{ 
            background: '#222', 
            color: '#fff', 
            border: '1px solid #333', 
            padding: '4px 8px', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontSize: '11px' 
          }}
        >Close</button>
      </div>

      {/* Loader */}
      {loadingPreview && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Fetching prompt contents...</div>
      )}

      {/* Content tabs & text area */}
      {!loadingPreview && previewContent && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'hidden' }}>
          {/* Content tabs selector */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #222', paddingBottom: '4px' }}>
            {previewContent.markdown && (
              <button 
                onClick={() => setActivePreviewTab('markdown')} 
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  background: activePreviewTab === 'markdown' ? '#333' : 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '600' 
                }}
              >
                Markdown Skill
              </button>
            )}
            {previewContent.system && (
              <button 
                onClick={() => setActivePreviewTab('system')} 
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  background: activePreviewTab === 'system' ? '#333' : 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '600' 
                }}
              >
                System Directive
              </button>
            )}
            {previewContent.user && (
              <button 
                onClick={() => setActivePreviewTab('user')} 
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  background: activePreviewTab === 'user' ? '#333' : 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '600' 
                }}
              >
                User Directive
              </button>
            )}
            {previewContent.readme && (
              <button 
                onClick={() => setActivePreviewTab('readme')} 
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  background: activePreviewTab === 'readme' ? '#333' : 'transparent', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '600' 
                }}
              >
                README
              </button>
            )}
          </div>

          {/* Scrollable Text Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            background: '#111', 
            border: '1px solid #222', 
            borderRadius: '10px', 
            padding: '12px', 
            boxSizing: 'border-box' 
          }}>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '11px', color: '#ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {activePreviewTab === 'system' && previewContent.system}
              {activePreviewTab === 'user' && previewContent.user}
              {activePreviewTab === 'readme' && previewContent.readme}
              {activePreviewTab === 'markdown' && previewContent.markdown}
            </pre>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              onClick={copyPreviewPayload}
              style={{ 
                padding: '8px 16px', 
                background: '#fff', 
                color: '#000', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer', 
                fontWeight: '700', 
                fontSize: '12px' 
              }}
            >
              Copy Prompt Content
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
