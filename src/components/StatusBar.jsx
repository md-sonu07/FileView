import React from 'react';
import { formatFileSize } from '../utils/formatters';

export function StatusBar({ items = [] }) {
  const folderCount = items.filter((i) => i.kind === 'directory').length;
  const fileCount = items.filter((i) => i.kind === 'file').length;
  const totalBytes = items
    .filter((i) => i.kind === 'file' && typeof i.size === 'number')
    .reduce((acc, curr) => acc + curr.size, 0);

  return (
    <footer className="flex items-center justify-between px-5 py-2 text-xs text-slate-400 bg-white border-t border-slate-200 select-none">
      <div className="flex items-center gap-2">
        <span>
          {folderCount} {folderCount === 1 ? 'folder' : 'folders'},{' '}
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>
        {fileCount > 0 && <span>• {formatFileSize(totalBytes)} total</span>}
      </div>

      <div>
        <span>FileView v1.0.0</span>
      </div>
    </footer>
  );
}
