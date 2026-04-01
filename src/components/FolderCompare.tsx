import React, { useState } from 'react';
import { Upload, FolderSync, FilePlus, FileMinus, FileEdit } from 'lucide-react';

interface FileNode {
  path: string;
  file: File;
}

interface DiffEntry {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  origFile?: File;
  modFile?: File;
}

const FolderCompare: React.FC = () => {
  const [origFiles, setOrigFiles] = useState<FileNode[]>([]);
  const [modFiles, setModFiles] = useState<FileNode[]>([]);
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: FileNode[]) => void) => {
    const files = Array.from(e.target.files || []);
    // Map files keeping relative path
    const nodes = files.map(f => ({ path: (f as any).webkitRelativePath || f.name, file: f }));
    setter(nodes);
  };

  const computeFolderDiff = async () => {
    setLoading(true);
    const results: DiffEntry[] = [];
    
    // Quick Map by sub-path (stripping root folder name)
    const getSubPath = (p: string) => p.substring(p.indexOf('/') + 1);
    
    const origMap = new Map(origFiles.map(n => [getSubPath(n.path), n.file]));
    const modMap = new Map(modFiles.map(n => [getSubPath(n.path), n.file]));
    
    // A bit naive approach to checking file identicality: comparing size and last modified, falling back to text if needed.
    // For local-only privacy, we just compare sizes/names to keep it fast.
    
    for (const [path, origFile] of origMap.entries()) {
      if (!modMap.has(path)) {
        results.push({ path, type: 'removed', origFile });
      } else {
        const modFile = modMap.get(path)!;
        if (origFile.size !== modFile.size || origFile.lastModified !== modFile.lastModified) {
          results.push({ path, type: 'modified', origFile, modFile });
        } else {
          results.push({ path, type: 'unchanged', origFile, modFile });
        }
        modMap.delete(path);
      }
    }
    
    for (const [path, modFile] of modMap.entries()) {
      results.push({ path, type: 'added', modFile });
    }
    
    setDiffs(results.sort((a,b) => a.path.localeCompare(b.path)));
    setLoading(false);
  };

  if (diffs.length > 0) {
    return (
      <div className="flex-1 p-8 overflow-auto">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FolderSync className="text-accent" /> Folder Analysis Complete</h2>
            <div className="flex gap-4 mb-6">
              <div className="px-3 py-1 bg-green-dim text-green font-semibold rounded">{diffs.filter(d => d.type === 'added').length} Added</div>
              <div className="px-3 py-1 bg-red-dim text-red font-semibold rounded">{diffs.filter(d => d.type === 'removed').length} Removed</div>
              <div className="px-3 py-1 bg-[var(--yellow-dim)] text-[var(--yellow)] font-semibold rounded">{diffs.filter(d => d.type === 'modified').length} Modified</div>
            </div>
            
            <div className="bg-secondary border border-border rounded-lg overflow-hidden">
              {diffs.filter(d => d.type !== 'unchanged').map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border-b border-border text-sm">
                  {d.type === 'added' && <FilePlus size={16} className="text-green flex-shrink-0" />}
                  {d.type === 'removed' && <FileMinus size={16} className="text-red flex-shrink-0" />}
                  {d.type === 'modified' && <FileEdit size={16} className="text-[var(--yellow)] flex-shrink-0" />}
                  <span className="font-mono truncate">{d.path}</span>
                  {d.type === 'modified' && <span className="text-xs text-muted ml-auto bg-tertiary px-2 py-1 rounded cursor-pointer hover:bg-border">Use Text Diff</span>}
                </div>
              ))}
              {diffs.filter(d => d.type !== 'unchanged').length === 0 && (
                 <div className="p-4 text-center text-muted">Folders are identical.</div>
              )}
            </div>
            
            <button className="mt-6 btn btn-ghost border" onClick={() => setDiffs([])}>Back to Upload</button>
         </div>
      </div>
    );
  }

  return (
    <div className="input-area fade-in flex items-center justify-center p-8 bg-primary">
      <div className="flex flex-col items-center max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-8">
           <FolderSync size={28} className="text-accent" />
           <h2 className="text-2xl font-semibold">Compare Local Folders</h2>
        </div>
        
        <div className="flex w-full gap-4">
          <label className="flex-1 border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all">
            <Upload size={32} className="text-muted mb-4" />
            <span className="font-medium">Original Folder</span>
            <input type="file" multiple {...{webkitdirectory: "", directory: ""} as any} hidden onChange={e => handleFolderUpload(e, setOrigFiles)} />
            {origFiles.length > 0 && <span className="mt-4 text-green font-bold">{origFiles.length} files loaded ✓</span>}
          </label>
          
          <label className="flex-1 border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all">
            <Upload size={32} className="text-muted mb-4" />
            <span className="font-medium">Changed Folder</span>
            <input type="file" multiple {...{webkitdirectory: "", directory: ""} as any} hidden onChange={e => handleFolderUpload(e, setModFiles)} />
            {modFiles.length > 0 && <span className="mt-4 text-green font-bold">{modFiles.length} files loaded ✓</span>}
          </label>
        </div>
        {origFiles.length > 0 && modFiles.length > 0 && (
          <button onClick={computeFolderDiff} className="mt-8 btn-primary px-8 py-3 rounded-lg flex items-center gap-2 font-bold shadow-[0_4px_14px_var(--accent-dim)]">
            Analyze Differences
          </button>
        )}
        {loading && <div className="mt-6 text-muted">Analyzing structures...</div>}
      </div>
    </div>
  );
};

export default FolderCompare;
