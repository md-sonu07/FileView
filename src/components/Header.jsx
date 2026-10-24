import React from 'react';
import { FolderOpen, ExternalLink, HardDrive, Sparkles, ArrowUpRight } from 'lucide-react';

export function Header({
  onChooseFolder,
  isFolderOpen,
  isAutoEnhanceEnabled = true,
  onToggleAutoEnhance,
  currentUrl,
}) {
  const handleOpenFullTab = () => {
    try {
      if (typeof chrome !== 'undefined' && chrome?.tabs?.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
      } else {
        window.open(window.location.href, '_blank');
      }
    } catch {
      window.open(window.location.href, '_blank');
    }
  };

  const handleOpenClassic = () => {
    if (currentUrl) {
      window.location.href = currentUrl;
    }
  };

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 select-none">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
          <HardDrive size={18} strokeWidth={2.4} />
        </div>
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">FileView</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Clickable Toggle Pill */}
        <label
          htmlFor="header-auto-toggle-input"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 border whitespace-nowrap ${
            isAutoEnhanceEnabled
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/70'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70'
          }`}
          title={`Click to turn ${isAutoEnhanceEnabled ? 'OFF' : 'ON'} automatic file:/// modern UI`}
        >
          <input
            id="header-auto-toggle-input"
            type="checkbox"
            className="sr-only"
            checked={isAutoEnhanceEnabled}
            onChange={(e) => onToggleAutoEnhance && onToggleAutoEnhance(e.target.checked)}
          />
          <Sparkles
            size={13}
            className={isAutoEnhanceEnabled ? 'text-blue-600' : 'text-slate-400'}
          />
          <span className="text-xs">file:/// UI</span>
          <span
            className={`relative inline-block w-7 h-4 rounded-full transition-colors ${
              isAutoEnhanceEnabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-150 shadow-xs ${
                isAutoEnhanceEnabled ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </span>
          <span
            className={`text-[10px] font-bold px-1 py-0.5 rounded uppercase tracking-wider ${
              isAutoEnhanceEnabled
                ? 'bg-blue-200/70 text-blue-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isAutoEnhanceEnabled ? 'ON' : 'OFF'}
          </span>
        </label>

        {currentUrl && currentUrl.startsWith('file:///') && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            onClick={handleOpenClassic}
            title="View the raw default Chrome file:/// directory page"
          >
            <span>Classic View</span>
            <ArrowUpRight size={13} />
          </button>
        )}

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          onClick={onChooseFolder}
          title="Pick a folder using native file picker"
        >
          <FolderOpen size={15} className="text-slate-600 shrink-0" />
          <span>{isFolderOpen ? 'Change Folder' : 'Choose Folder'}</span>
        </button>

        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          onClick={handleOpenFullTab}
          title="Open FileView in a new browser tab"
          aria-label="Open in new tab"
        >
          <ExternalLink size={16} />
        </button>
      </div>
    </header>
  );
}
