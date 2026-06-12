import React, { useState, useRef, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { containsSecrets, isSensitiveFilename } from '../utils/secretScanner';

interface FolderBundlerProps {
  excludePatterns: string[];
  setStatus: (status: string) => void;
  autoTrigger?: boolean;
}

// Helper to escape XML characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Helper to compress code
function compressCode(content: string, options: { minify: boolean; skeleton: boolean }): string {
  let result = content;
  if (options.skeleton) {
    const lines = result.split('\n');
    const skeletonLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('class ') ||
        trimmed.startsWith('def ') ||
        trimmed.startsWith('function ') ||
        trimmed.startsWith('export ') ||
        trimmed.startsWith('import ') ||
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('type ')
      ) {
        skeletonLines.push(line);
        if (trimmed.endsWith('{') || trimmed.endsWith(':')) {
          skeletonLines.push('  // implementation omitted');
        }
      }
    }
    result = skeletonLines.join('\n');
  } else if (options.minify) {
    const lines = result.split('\n');
    const minifiedLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        continue;
      }
      minifiedLines.push(line);
    }
    result = minifiedLines.join('\n');
  }
  return result;
}

// Helper to check exclusions
function isExcluded(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const p = pattern.trim();
    if (!p) continue;

    if (p.startsWith('*') && p.endsWith('*')) {
      if (path.includes(p.slice(1, -1))) return true;
    } else if (p.startsWith('*')) {
      if (path.endsWith(p.slice(1))) return true;
    } else if (p.endsWith('*')) {
      if (path.startsWith(p.slice(0, -1))) return true;
    } else {
      if (
        path === p || 
        path.includes('/' + p + '/') || 
        path.endsWith('/' + p) || 
        path.startsWith(p + '/') ||
        path.split('/').includes(p)
      ) {
        return true;
      }
    }
  }
  return false;
}

export default function FolderBundler({
  excludePatterns,
  setStatus,
  autoTrigger = false
}: FolderBundlerProps) {
  const [compression, setCompression] = useState<'none' | 'minify' | 'skeleton'>('none');
  const [bundledText, setBundledResult] = useState<string>('');
  const [stats, setStats] = useState<{ filesCount: number; sizeBytes: number } | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoTrigger) {
      const timer = setTimeout(() => {
        triggerBrowse();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger]);

  // Recursively read FileSystemDirectoryEntry files for Drag & Drop
  const scanDirectory = async (entry: any, currentPath: string = ''): Promise<File[]> => {
    const files: File[] = [];
    
    const readEntry = async (item: any, path: string): Promise<void> => {
      const entryPath = path ? `${path}/${item.name}` : item.name;
      
      if (isSensitiveFilename(item.name) || isExcluded(entryPath, excludePatterns)) {
        return;
      }
      
      if (item.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          item.file(resolve, reject);
        });
        
        const validExtensions = [
          '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.csv', 
          '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs',
          '.php', '.rb', '.sh', '.bash', '.yml', '.yaml', '.xml', '.html', 
          '.css', '.scss', '.less', '.sql', '.ini', '.env'
        ];
        
        const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || 
                                  !file.name.includes('.');
                                  
        if (hasValidExtension && file.size <= 1000000) {
          (file as any).relativePath = entryPath;
          files.push(file);
        }
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        
        // readEntries might need to be called multiple times to read all contents
        const getEntries = async (): Promise<any[]> => {
          return new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
        };
        
        let entries = await getEntries();
        for (const childEntry of entries) {
          await readEntry(childEntry, entryPath);
        }
      }
    };
    
    await readEntry(entry, currentPath);
    return files;
  };

  const processFileList = async (filesList: File[] | FileList) => {
    try {
      setStatus('Processing files...');
      const files: { path: string; content: string }[] = [];
      
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        const entryPath = (file as any).relativePath || file.name;
        const fileName = file.name;
        
        if (isSensitiveFilename(fileName) || isExcluded(entryPath, excludePatterns)) {
          continue;
        }
        
        const validExtensions = [
          '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.csv', 
          '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs',
          '.php', '.rb', '.sh', '.bash', '.yml', '.yaml', '.xml', '.html', 
          '.css', '.scss', '.less', '.sql', '.ini', '.env'
        ];
        
        const hasValidExtension = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext)) || 
                                  !fileName.includes('.');
                                  
        if (!hasValidExtension || file.size > 1000000) {
          continue;
        }
        
        const content = await file.text();
        if (containsSecrets(content)) {
          throw new Error(`Security alert: Potential API key found in ${entryPath}`);
        }
        
        files.push({ path: entryPath, content });
      }
      
      if (files.length === 0) {
        setStatus('Error: No valid text files found.');
        return;
      }
      
      let xmlText = `<repository>\n`;
      const minify = compression === 'minify';
      const skeleton = compression === 'skeleton';
      
      for (const f of files) {
        const processedContent = compressCode(f.content, { minify, skeleton });
        xmlText += `<file path="${escapeXml(f.path)}">\n${escapeXml(processedContent)}\n</file>\n`;
      }
      xmlText += `</repository>`;
      
      setBundledResult(xmlText);
      
      const sizeBytes = new Blob([xmlText]).size;
      setStats({ filesCount: files.length, sizeBytes });
      setStatus(`✓ Scanned ${files.length} files successfully!`);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0].webkitGetAsEntry();
      if (item) {
        setStatus('Scanning dropped directory...');
        try {
          const files = await scanDirectory(item);
          await processFileList(files);
        } catch (err: any) {
          setStatus(`Error: ${err.message}`);
        }
      }
    }
  };

  // Browse Handler
  const handleBrowseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
    }
  };

  const triggerBrowse = () => {
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isStandalone = typeof window !== 'undefined' && window.location.search.includes('view=bundler_standalone');
    
    if (isFirefox && !isStandalone) {
      browser.windows.create({
        url: browser.runtime.getURL('/popup.html?view=bundler_standalone'),
        type: 'popup',
        width: 500,
        height: 520
      }).then(() => {
        setStatus('');
      }).catch(err => {
        console.error("Failed to open standalone bundler window:", err);
        fileInputRef.current?.click();
      });
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleCopyClipboard = async () => {
    if (!bundledText) return;
    
    const sizeBytes = new Blob([bundledText]).size;
    const isTooLong = sizeBytes > 1500000; // ~1.5MB threshold for clipboard warning
    
    if (isTooLong) {
      setStatus('Text too long for clipboard. Downloading text file...');
      downloadTextFile();
      setTimeout(() => window.close(), 2500);
      return;
    }

    try {
      await navigator.clipboard.writeText(bundledText);
      setStatus('✓ Copied to clipboard! Closing...');
      setTimeout(() => window.close(), 800);
    } catch (err) {
      // Fallback to download if copying fails
      setStatus('Copy failed. Downloading text file instead...');
      downloadTextFile();
      setTimeout(() => window.close(), 2500);
    }
  };

  const downloadTextFile = () => {
    const blob = new Blob([bundledText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codebase.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Configuration Select */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          marginBottom: '6px', 
          textTransform: 'uppercase', 
          letterSpacing: '1px', 
          fontWeight: '600' 
        }}>Compression Mode</div>
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

      {/* Drag & Drop Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        style={{
          border: dragActive ? '2px dashed #3b82f6' : '2px dashed #222',
          background: dragActive ? 'rgba(59, 130, 246, 0.05)' : '#0d0d0d',
          borderRadius: '12px',
          padding: '24px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '16px'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleBrowseChange}
          style={{ display: 'none' }}
          /* @ts-ignore */
          webkitdirectory=""
          directory=""
          multiple
        />
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📁</div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
          {dragActive ? "Drop Folder Here" : "Drag & Drop Folder Here"}
        </div>
        <div style={{ fontSize: '11px', color: '#555' }}>
          or click to browse from system
        </div>
        <div style={{ fontSize: '9px', color: '#444', marginTop: '6px', fontStyle: 'italic' }}>
          *Drag & drop is recommended to avoid popup closing on Chrome
        </div>
      </div>

      {/* Stats Display */}
      {stats && (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid #1a1a1a', 
          borderRadius: '10px', 
          padding: '12px', 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '12px' 
        }}>
          <div>Files bundled: <strong style={{ color: '#fff' }}>{stats.filesCount}</strong></div>
          <div>Bundle Size: <strong style={{ color: '#fff' }}>{(stats.sizeBytes / 1024).toFixed(2)} KB</strong></div>
        </div>
      )}

      {/* Bundling Action Buttons */}
      {bundledText && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #333',
              background: '#111',
              color: '#fff',
              fontWeight: '600',
              fontSize: '12px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
          >
            👁️ Preview Payload
          </button>
          
          <button
            onClick={handleCopyClipboard}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              fontWeight: '700',
              fontSize: '12px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1.0'}
          >
            📋 Copy & Close
          </button>
        </div>
      )}

      {/* Popup Preview Overlay Modal */}
      {showPreview && (
        <div style={{
          position: 'absolute',
          top: '-20px', // Cover full component
          left: '-20px',
          right: '-20px',
          bottom: '-20px',
          background: 'rgba(5, 5, 5, 0.98)',
          backdropFilter: 'blur(16px)',
          padding: '16px',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {/* Preview Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid #222', 
            paddingBottom: '8px',
            marginBottom: '12px'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff' }}>Codebase Payload Preview</h4>
              {stats && <div style={{ fontSize: '10px', color: '#666' }}>{stats.filesCount} files ({(stats.sizeBytes / 1024).toFixed(2)} KB)</div>}
            </div>
            <button 
              onClick={() => setShowPreview(false)}
              style={{
                background: '#222',
                color: '#fff',
                border: '1px solid #333',
                padding: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >Close</button>
          </div>

          {/* Scrollable Pre */}
          <pre style={{
            flex: 1,
            margin: 0,
            padding: '12px',
            background: '#020202',
            border: '1px solid #1c1c1c',
            borderRadius: '10px',
            color: '#38bdf8',
            fontSize: '11px',
            fontFamily: 'SFMono-Regular, Consolas, monospace',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {bundledText}
          </pre>
        </div>
      )}

    </div>
  );
}
