import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Home, Folder, HardDrive, ChevronDown, Check, Edit2, X } from 'lucide-react';

const LOCATION_PRESETS = [
  { label: 'Desktop', path: 'Desktop' },
  { label: 'Projects', path: 'Projects' },
  { label: 'Documents', path: 'Documents' },
  { label: 'Downloads', path: 'Downloads' },
  { label: 'Root only (No prefix)', path: '' },
];

export function Breadcrumbs({
  mode = 'handle',
  breadcrumbs = [],
  currentUrl = '',
  onNavigateCrumb,
  onBack,
  onNavigateUrl,
  parentPathPrefix = 'Desktop',
  onSetParentPathPrefix,
}) {
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customPathInput, setCustomPathInput] = useState(parentPathPrefix || '');
  const locationMenuRef = useRef(null);

  useEffect(() => {
    setCustomPathInput(parentPathPrefix || '');
  }, [parentPathPrefix]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target)) {
        setIsEditingLocation(false);
      }
    }
    if (isEditingLocation) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingLocation]);

  if (mode === 'handle') {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    const canGoBack = breadcrumbs.length > 1;

    // Split parent prefix into segments, avoiding duplication if folder name is identical
    const rootName = (breadcrumbs[0]?.name || '').toLowerCase();
    const parentSegments = (parentPathPrefix || '')
      .split(/[\\/]+/)
      .filter((seg) => Boolean(seg.trim()) && seg.toLowerCase() !== rootName);

    const handleSelectPreset = (path) => {
      onSetParentPathPrefix && onSetParentPathPrefix(path);
      setIsEditingLocation(false);
    };

    const handleCustomSave = (e) => {
      e.preventDefault();
      onSetParentPathPrefix && onSetParentPathPrefix(customPathInput.trim());
      setIsEditingLocation(false);
    };

    return (
      <nav className="flex items-center gap-1 flex-wrap text-xs text-slate-600 relative" aria-label="Folder Navigation">
        {canGoBack && (
          <button
            type="button"
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors mr-1 cursor-pointer"
            onClick={onBack}
            title="Go to parent folder"
            aria-label="Back"
          >
            <ArrowLeft size={14} />
          </button>
        )}

        {/* Parent / Previous Path Segments (e.g. Desktop / Projects) */}
        {parentSegments.map((pSeg, pIdx) => (
          <React.Fragment key={`parent-${pIdx}`}>
            {pIdx > 0 && (
              <span className="text-slate-400 flex items-center">
                <ChevronRight size={13} />
              </span>
            )}
            <div className="relative inline-flex items-center" ref={pIdx === 0 ? locationMenuRef : undefined}>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer group"
                onClick={() => setIsEditingLocation((prev) => !prev)}
                title={`Parent path: ${pSeg} (click to change location)`}
              >
                <HardDrive size={13} className="text-slate-400 group-hover:text-blue-500" />
                <span>{pSeg}</span>
                <ChevronDown size={11} className="text-slate-400 opacity-60 group-hover:opacity-100" />
              </button>

              {/* Location Editor Popover on first segment */}
              {pIdx === 0 && isEditingLocation && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700">Folder Location (Parent Path)</span>
                    <button
                      type="button"
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      onClick={() => setIsEditingLocation(false)}
                      aria-label="Close"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="space-y-1 mb-2.5">
                    {LOCATION_PRESETS.map((preset) => {
                      const isSelected = parentPathPrefix === preset.path;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                          onClick={() => handleSelectPreset(preset.path)}
                        >
                          <span>{preset.label}</span>
                          {isSelected && <Check size={13} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleCustomSave} className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                      placeholder="e.g. Desktop/Projects"
                      value={customPathInput}
                      onChange={(e) => setCustomPathInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </form>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}

        {/* Separator between parent path and selected folder */}
        {parentSegments.length > 0 && (
          <span className="text-slate-400 flex items-center">
            <ChevronRight size={13} />
          </span>
        )}

        {/* Selected Folder & Subfolder Breadcrumbs */}
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="text-slate-400 flex items-center">
                  <ChevronRight size={13} />
                </span>
              )}
              <button
                type="button"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  isLast
                    ? 'font-semibold text-slate-900 pointer-events-none'
                    : 'font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
                onClick={() => !isLast && onNavigateCrumb(idx)}
                title={crumb.name}
                disabled={isLast}
              >
                {idx === 0 ? <Folder size={13} className="text-blue-600 font-semibold" /> : <Folder size={13} className="text-blue-500" />}
                <span>{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    );
  }

  // URL mode
  if (!currentUrl) return null;

  let parsedProtocol = 'file:///';
  let pathPart = currentUrl;
  if (currentUrl.startsWith('file:///')) {
    parsedProtocol = 'file:///';
    pathPart = currentUrl.slice('file:///'.length);
  } else if (currentUrl.startsWith('http://') || currentUrl.startsWith('https://')) {
    try {
      const u = new URL(currentUrl);
      parsedProtocol = u.origin + '/';
      pathPart = u.pathname.replace(/^\//, '');
    } catch {
      pathPart = currentUrl;
    }
  }

  const segments = pathPart.split('/').filter(Boolean);
  const canGoBack = segments.length > 0;

  const handleUrlBack = () => {
    if (segments.length <= 1) {
      onNavigateUrl(parsedProtocol);
    } else {
      const parentUrl = parsedProtocol + segments.slice(0, -1).join('/') + '/';
      onNavigateUrl(parentUrl);
    }
  };

  return (
    <nav className="flex items-center gap-1 flex-wrap text-xs text-slate-600" aria-label="URL Navigation">
      {canGoBack && (
        <button
          type="button"
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors mr-1 cursor-pointer"
          onClick={handleUrlBack}
          title="Go to parent directory"
          aria-label="Back"
        >
          <ArrowLeft size={14} />
        </button>
      )}

      {/* Root item */}
      <button
        type="button"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
          segments.length === 0
            ? 'font-semibold text-slate-900 pointer-events-none'
            : 'font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
        }`}
        onClick={() => segments.length > 0 && onNavigateUrl(parsedProtocol)}
        title={parsedProtocol}
      >
        <HardDrive size={13} className="text-blue-600" />
        <span>{parsedProtocol === 'file:///' ? 'Root' : parsedProtocol}</span>
      </button>

      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const targetUrl = parsedProtocol + segments.slice(0, idx + 1).join('/') + '/';

        return (
          <React.Fragment key={idx}>
            <span className="text-slate-400 flex items-center">
              <ChevronRight size={13} />
            </span>
            <button
              type="button"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                isLast
                  ? 'font-semibold text-slate-900 pointer-events-none'
                  : 'font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
              onClick={() => !isLast && onNavigateUrl(targetUrl)}
              title={seg}
              disabled={isLast}
            >
              <Folder size={13} className="text-blue-500" />
              <span>{seg}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
