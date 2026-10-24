import React from 'react';
import { ChevronRight, ArrowLeft, Home, Folder, HardDrive } from 'lucide-react';

export function Breadcrumbs({
  mode = 'handle',
  breadcrumbs = [],
  currentUrl = '',
  onNavigateCrumb,
  onBack,
  onNavigateUrl,
}) {
  if (mode === 'handle') {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    const canGoBack = breadcrumbs.length > 1;

    return (
      <nav className="flex items-center gap-1 flex-wrap text-xs text-slate-600" aria-label="Folder Navigation">
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
                {idx === 0 ? <Home size={13} className="text-slate-500" /> : <Folder size={13} className="text-blue-500" />}
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
