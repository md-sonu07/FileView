import React from 'react';
import { Search, X, RotateCw, ArrowUpDown, ArrowDownAZ, HardDrive, Clock } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { CustomDropdown } from './CustomDropdown';

const sortOptions = [
  { value: 'name', label: 'Name', icon: ArrowDownAZ },
  { value: 'size', label: 'Size', icon: HardDrive },
  { value: 'modified', label: 'Modified', icon: Clock },
];

export function Toolbar({
  mode = 'handle',
  breadcrumbs,
  currentUrl,
  onNavigateCrumb,
  onBack,
  onNavigateUrl,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  onRefresh,
  isRefreshing,
  totalItemsCount,
  filteredItemsCount,
}) {
  return (
    <div className="flex flex-col gap-2.5 px-5 py-3 bg-slate-50/60 border-b border-slate-200 select-none">
      {/* Row 1: Path Breadcrumbs & Refresh */}
      <div className="flex items-center justify-between gap-3">
        <Breadcrumbs
          mode={mode}
          breadcrumbs={breadcrumbs}
          currentUrl={currentUrl}
          onNavigateCrumb={onNavigateCrumb}
          onBack={onBack}
          onNavigateUrl={onNavigateUrl}
        />

        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer"
          onClick={onRefresh}
          title="Refresh current folder"
          disabled={isRefreshing}
          aria-label="Refresh"
        >
          <RotateCw
            size={14}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Row 2: Search bar and Sort controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all"
            placeholder="Filter files by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
              onClick={() => onSearchChange('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {searchQuery
              ? `${filteredItemsCount} of ${totalItemsCount} items`
              : `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}`}
          </span>

          <CustomDropdown
            value={sortBy}
            onChange={onSortByChange}
            options={sortOptions}
            ariaLabel="Sort files"
          />

          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer"
            onClick={onToggleSortOrder}
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            aria-label="Toggle sort order"
          >
            <ArrowUpDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
