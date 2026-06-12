import React from 'react';
import { pickAndBundleFolder } from '../utils/fileBundler';

interface FolderBundlerProps {
  compression: 'none' | 'minify' | 'skeleton';
  setCompression: (comp: 'none' | 'minify' | 'skeleton') => void;
  excludePatterns: string[];
  setStatus: (status: string) => void;
}

export default function FolderBundler({
  compression,
  setCompression,
  excludePatterns,
  setStatus
}: FolderBundlerProps) {

  const handleBundleAction = async () => {
    try {
      setStatus('Selecting folder...');
      const bundledText = await pickAndBundleFolder(
        { 
          minify: compression === 'minify', 
          skeleton: compression === 'skeleton', 
          excludePatterns 
        }, 
        setStatus
      );
      
      setStatus('Copying...');
      try {
        await navigator.clipboard.writeText(bundledText);
        setStatus('✓ Folder copied!');
      } catch (clipErr) {
        const blob = new Blob([bundledText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = 'codebase.txt';
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus('✓ Downloaded codebase');
      }
      setTimeout(() => window.close(), 50);
    } catch (err: any) { 
      setStatus(`Error: ${err.message}`); 
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          marginBottom: '8px', 
          textTransform: 'uppercase', 
          letterSpacing: '1px', 
          fontWeight: '600' 
        }}>Extraction Mode</div>
        <select 
          value={compression} 
          onChange={e => setCompression(e.target.value as any)} 
          style={{ 
            width: '100%', 
            padding: '10px', 
            border: '1px solid #222', 
            background: '#111', 
            color: '#fff', 
            borderRadius: '10px', 
            fontSize: '13px', 
            boxSizing: 'border-box', 
            outline: 'none', 
            cursor: 'pointer' 
          }}
        >
          <option value="none">No Compression (Raw Code)</option>
          <option value="minify">Minify (Strip Comments & Whitespace)</option>
          <option value="skeleton">Skeleton (Signatures & Types Only)</option>
        </select>
      </div>

      <button 
        onClick={handleBundleAction} 
        style={{ 
          width: '100%', 
          padding: '12px', 
          border: '1px solid #444', 
          background: 'transparent', 
          color: '#fff', 
          cursor: 'pointer', 
          fontWeight: '600', 
          fontSize: '13px', 
          borderRadius: '10px', 
          transition: 'all 0.2s' 
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
      >
        Select Folder & Copy Payload
      </button>
    </div>
  );
}
