import React from 'react';
import { ChevronRight } from 'lucide-react';
import { FileTypeIcon } from '../utils/fileIcons';
import { formatFileSize, formatDate } from '../utils/formatters';

export function FileRow({ item, onClick }) {
  const isDirectory = item.kind === 'directory';

  return (
    <div
      className="grid grid-cols-[minmax(220px,1fr)_110px_150px] items-center px-5 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group select-none"
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item);
        }
      }}
      title={isDirectory ? `Open folder "${item.name}"` : `View details for "${item.name}"`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <FileTypeIcon isDirectory={isDirectory} fileName={item.name} size={18} />
        <span
          className={`text-[13.5px] truncate ${
            isDirectory ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
          }`}
        >
          {item.name}
        </span>
        {isDirectory && (
          <ChevronRight
            size={14}
            className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-auto shrink-0"
          />
        )}
      </div>

      <div className="text-xs font-mono text-slate-600">
        {isDirectory ? '—' : formatFileSize(item.size)}
      </div>

      <div className="text-xs text-slate-400">
        {formatDate(item.lastModified)}
      </div>
    </div>
  );
}
