import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { FileTypeIcon } from '../utils/fileIcons';
import { formatFileSize, formatDate, getFileExtension } from '../utils/formatters';

export function FileDetailsModal({ item, onClose }) {
  const [previewContent, setPreviewContent] = useState(item?.rawText || null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileMeta, setFileMeta] = useState({
    size: item?.size ?? null,
    lastModified: item?.lastModified ?? null,
    mimeType: item?.type || item?.mimeType || '',
  });

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function loadInfo() {
      if (!item) return;

      const ext = getFileExtension(item.name);
      const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
      const isText = [
        'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css',
        'scss', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'sql', 'xml',
        'csv', 'tsv', 'log', 'env', 'yml', 'yaml',
      ].includes(ext);

      // If item was fetched from a URL
      if (item.url) {
        if (isImg) {
          setPreviewImageUrl(item.url);
        } else if (item.rawText) {
          setPreviewContent(item.rawText);
        } else if (isText) {
          setIsLoading(true);
          try {
            const res = await fetch(item.url);
            const text = await res.text();
            if (active) {
              setPreviewContent(text.slice(0, 20480));
            }
          } catch (err) {
            console.warn('Failed to fetch text preview', err);
          } finally {
            if (active) setIsLoading(false);
          }
        }
        return;
      }

      // If item is from File System Access API handle
      if (item.handle && item.handle.kind === 'file') {
        setIsLoading(true);
        try {
          const file = await item.handle.getFile();
          if (!active) return;

          setFileMeta({
            size: file.size,
            lastModified: file.lastModified,
            mimeType: file.type || '',
          });

          if (isText || file.type?.startsWith('text/')) {
            const slice = file.slice(0, 20480);
            const text = await slice.text();
            if (active) setPreviewContent(text);
          } else if (isImg || file.type?.startsWith('image/')) {
            objectUrl = URL.createObjectURL(file);
            if (active) setPreviewImageUrl(objectUrl);
          }
        } catch (err) {
          console.warn('Failed to load file from handle', err);
        } finally {
          if (active) setIsLoading(false);
        }
      }
    }

    loadInfo();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2 truncate">
            <FileTypeIcon isDirectory={false} fileName={item.name} size={18} />
            <span className="truncate">{item.name}</span>
          </div>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-xs">
            <span className="text-slate-400 font-medium">File Name:</span>
            <span className="text-slate-800 font-mono break-all">{item.name}</span>

            <span className="text-slate-400 font-medium">File Size:</span>
            <span className="text-slate-800 font-mono">
              {formatFileSize(fileMeta.size)}{' '}
              {fileMeta.size !== null && fileMeta.size !== undefined && `(${fileMeta.size.toLocaleString()} bytes)`}
            </span>

            <span className="text-slate-400 font-medium">Modified:</span>
            <span className="text-slate-800 font-mono">{formatDate(fileMeta.lastModified)}</span>

            {fileMeta.mimeType && (
              <>
                <span className="text-slate-400 font-medium">MIME Type:</span>
                <span className="text-slate-800 font-mono">{fileMeta.mimeType}</span>
              </>
            )}

            {item.url && (
              <>
                <span className="text-slate-400 font-medium">Location:</span>
                <span className="text-slate-800 font-mono text-[11px] break-all">{item.url}</span>
              </>
            )}
          </div>

          {/* Preview Section */}
          {isLoading ? (
            <div className="text-center py-4 text-slate-400">Loading preview...</div>
          ) : (
            <>
              {previewImageUrl && (
                <div>
                  <img
                    src={previewImageUrl}
                    alt={item.name}
                    className="max-w-full max-h-52 object-contain rounded-md mx-auto block border border-slate-100"
                  />
                </div>
              )}

              {previewContent !== null && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                    File Preview
                  </div>
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-44 overflow-y-auto font-mono text-[11.5px] text-slate-600 whitespace-pre-wrap">
                    {previewContent}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors mr-auto"
            >
              <ExternalLink size={13} />
              <span>Open in Chrome</span>
            </a>
          )}
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
