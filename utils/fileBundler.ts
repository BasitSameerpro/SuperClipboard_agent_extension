import { containsSecrets, isSensitiveFilename } from './secretScanner';

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

function compressCode(content: string, options: { minify: boolean, skeleton: boolean }): string {
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

function isExcluded(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const p = pattern.trim();
    if (!p) continue;

    // Handle wildcards
    if (p.startsWith('*') && p.endsWith('*')) {
      if (path.includes(p.slice(1, -1))) return true;
    } else if (p.startsWith('*')) {
      if (path.endsWith(p.slice(1))) return true;
    } else if (p.endsWith('*')) {
      if (path.startsWith(p.slice(0, -1))) return true;
    } else {
      // Exact match or folder segment match
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

export async function pickAndBundleFolder(
  options: { minify: boolean, skeleton: boolean, excludePatterns: string[] },
  onProgress?: (msg: string) => void
): Promise<string> {
  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    const files: { path: string; content: string }[] = [];
    
    async function processDirectory(dir: any, currentPath: string = '') {
      for await (const entry of dir.values()) {
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        
        // Skip excluded patterns AND sensitive files
        if (isSensitiveFilename(entry.name) || isExcluded(entryPath, options.excludePatterns)) {
          continue;
        }

        if (entry.kind === 'file') {
          // Strict Whitelist of known text/code extensions
          const validExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.csv', 
            '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs',
            '.php', '.rb', '.sh', '.bash', '.yml', '.yaml', '.xml', '.html', 
            '.css', '.scss', '.less', '.sql', '.ini', '.env'
          ];
          
          const hasValidExtension = validExtensions.some(ext => entry.name.toLowerCase().endsWith(ext)) || 
                                    !entry.name.includes('.'); // Allow extensionless files like Dockerfile or Makefile

          if (!hasValidExtension) {
            continue;
          }
          
          const file = await entry.getFile();
          try {
            if (file.size > 1000000) continue;
            
            const content = await file.text();
            
            if (containsSecrets(content)) {
              throw new Error(`Security alert: Potential API key found in ${entryPath}`);
            }
            
            files.push({ path: entryPath, content });
            if (onProgress) onProgress(`Read: ${entryPath}`);
          } catch (e) {
            console.warn(`Could not read ${entryPath}`);
          }
        } else if (entry.kind === 'directory') {
          await processDirectory(entry, entryPath);
        }
      }
    }

    if (onProgress) onProgress('Selecting directory...');
    await processDirectory(dirHandle);

    if (onProgress) onProgress('Bundling files...');
    let bundledText = `<repository>\n`;
    for (const f of files) {
      const processedContent = compressCode(f.content, options);
      bundledText += `<file path="${escapeXml(f.path)}">\n${escapeXml(processedContent)}\n</file>\n`;
    }
    bundledText += `</repository>`;
    
    return bundledText;
  } catch (err) {
    console.error("Folder picker cancelled or failed", err);
    throw err;
  }
}