import React from 'react';
import { ArrowDown, ArrowUp, FolderArchive, SearchX } from 'lucide-react';
import { FileRow } from './FileRow';

export function FileList({
  items,
  onItemClick,
  sortBy,
  sortOrder,
  onSortChange,
  searchQuery,
  onClearSearch,
}) {
  const renderSortIndicator = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
  };

  if (items.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-12 min-h-80">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3.5">
            <SearchX size={26} />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1.5">No matching files</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            No items matched your search query "<strong>{searchQuery}</strong>".
          </p>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={onClearSearch}
          >
            Clear Search Filter
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-12 min-h-80">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3.5">
          <FolderArchive size={26} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1.5">This folder is empty</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          There are no files or subdirectories in the selected directory.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[minmax(220px,1fr)_110px_150px] px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200 bg-white sticky top-0 z-10 select-none">
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-slate-800 transition-colors"
          onClick={() => onSortChange('name')}
        >
          <span>Name</span>
          {renderSortIndicator('name')}
        </div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-slate-800 transition-colors"
          onClick={() => onSortChange('size')}
        >
          <span>Size</span>
          {renderSortIndicator('size')}
        </div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-slate-800 transition-colors"
          onClick={() => onSortChange('modified')}
        >
          <span>Modified</span>
          {renderSortIndicator('modified')}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <FileRow
            key={`${item.kind}-${item.name}`}
            item={item}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}
