import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  WrapText,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Info,
  FileCode,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Code2,
} from 'lucide-react';
import { FileTypeIcon } from '../utils/fileIcons';
import { formatFileSize, formatDate, getFileExtension } from '../utils/formatters';
import { getFileCategory, detectLanguage, highlightCodeLine } from '../utils/syntaxHighlighter';

export function FilePreview({ item, onClose }) {
  // Content states
  const [previewContent, setPreviewContent] = useState(item?.rawText || null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // File metadata
  const [fileMeta, setFileMeta] = useState({
    size: item?.size ?? null,
    lastModified: item?.lastModified ?? null,
    mimeType: item?.type || item?.mimeType || '',
  });

  // UI state
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [codeTheme, setCodeTheme] = useState('dark'); // 'dark' | 'light'
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  // Markdown view mode
  const [isMarkdownRendered, setIsMarkdownRendered] = useState(true);

  // Image controls
  const [imageZoom, setImageZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState(null);
  const [imageBackground, setImageBackground] = useState('checkerboard'); // 'checkerboard' | 'dark' | 'light'

  const ext = useMemo(() => getFileExtension(item?.name || ''), [item?.name]);
  const category = useMemo(() => getFileCategory(item?.name || ''), [item?.name]);
  const language = useMemo(() => detectLanguage(item?.name || ''), [item?.name]);

  // Load file content (from handle or url)
  useEffect(() => {
    let active = true;
    let localBlobUrl = null;

    async function loadData() {
      if (!item) return;
      setIsLoading(true);
      setError(null);

      try {
        // Source 1: File System Access API handle
        if (item.handle && item.handle.kind === 'file') {
          const file = await item.handle.getFile();
          if (!active) return;

          setFileMeta({
            size: file.size,
            lastModified: file.lastModified,
            mimeType: file.type || '',
          });

          localBlobUrl = URL.createObjectURL(file);
          if (active) setBlobUrl(localBlobUrl);

          if (category === 'image' || file.type?.startsWith('image/')) {
            if (active) setPreviewImageUrl(localBlobUrl);
          } else if (category === 'code' || category === 'text' || file.type?.startsWith('text/')) {
            // Read up to 2MB safely
            const text = await file.text();
            if (active) setPreviewContent(text);
          }
        }
        // Source 2: item.url (file:/// or http:///)
        else if (item.url) {
          if (category === 'image') {
            setPreviewImageUrl(item.url);
          } else if (item.rawText) {
            setPreviewContent(item.rawText);
          } else if (category === 'code' || category === 'text') {
            const res = await fetch(item.url);
            if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to read file`);
            const text = await res.text();
            if (active) setPreviewContent(text);
          }
        }
      } catch (err) {
        console.warn('Failed to load file preview:', err);
        if (active) setError(err.message || 'Unable to preview file content.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [item, category]);

  // Handle copy text to clipboard
  const handleCopy = async () => {
    if (!previewContent) return;
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy text', err);
    }
  };

  // Handle download file
  const handleDownload = () => {
    const downloadUrl = blobUrl || item?.url;
    if (!downloadUrl && !previewContent) return;

    let targetUrl = downloadUrl;
    let tempUrl = null;

    if (!targetUrl && previewContent) {
      const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' });
      tempUrl = URL.createObjectURL(blob);
      targetUrl = tempUrl;
    }

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (tempUrl) URL.revokeObjectURL(tempUrl);
  };

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    const targetUrl = item?.url || blobUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  // Close preview on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Split code/text into lines
  const lines = useMemo(() => {
    if (!previewContent) return [];
    return previewContent.split('\n');
  }, [previewContent]);

  // Calculate text stats
  const textStats = useMemo(() => {
    if (!previewContent) return { words: 0, chars: 0, lines: 0, readTime: 1 };
    const trimmed = previewContent.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = previewContent.length;
    const numLines = lines.length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, lines: numLines, readTime };
  }, [previewContent, lines]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col w-full h-full select-none overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${item.name}`}
    >
      {/* Top Header Bar */}
      <header className="h-13 px-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-slate-100/80 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            onClick={onClose}
            title="Return to file explorer (Esc)"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="h-5 w-px bg-slate-200 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <FileTypeIcon isDirectory={false} fileName={item.name} size={18} />
            <span className="font-semibold text-slate-900 text-sm truncate max-w-50 md:max-w-md" title={item.name}>
              {item.name}
            </span>

            {/* Language / Type Badge */}
            <span
              className={`px-2 py-0.5 rounded-xl text-[10.5px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                category === 'code'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : category === 'image'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {language !== 'generic' ? language : ext || category}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Coding File Actions */}
          {category === 'code' && (
            <>
              <button
                type="button"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                onClick={handleCopy}
                title="Copy code to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  wordWrap
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setWordWrap((prev) => !prev)}
                title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
              >
                <WrapText size={14} />
              </button>

              <button
                type="button"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setCodeTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                title={`Switch to ${codeTheme === 'dark' ? 'light' : 'dark'} editor theme`}
              >
                {codeTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </>
          )}

          {/* Text File Actions */}
          {category === 'text' && (
            <>
              {ext === 'md' && (
                <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      isMarkdownRendered
                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setIsMarkdownRendered(true)}
                  >
                    Formatted
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      !isMarkdownRendered
                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setIsMarkdownRendered(false)}
                  >
                    Raw Text
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                onClick={handleCopy}
                title="Copy text to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  wordWrap
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setWordWrap((prev) => !prev)}
                title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
              >
                <WrapText size={14} />
              </button>
            </>
          )}

          {/* Image Actions */}
          {category === 'image' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setImageZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>

              <span className="text-[11px] font-mono font-medium text-slate-600 px-1 min-w-10 text-center">
                {Math.round(imageZoom * 100)}%
              </span>

              <button
                type="button"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setImageZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>

              <button
                type="button"
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setImageZoom(1)}
                title="Reset Zoom (100%)"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}

          {/* Universal Buttons */}
          <button
            type="button"
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
              showDetailsDrawer
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setShowDetailsDrawer((prev) => !prev)}
            title="Toggle File Details Panel"
          >
            <Info size={14} />
          </button>

          {(item.url || blobUrl) && (
            <button
              type="button"
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={handleOpenInNewTab}
              title="Open raw file in new browser tab"
            >
              <ExternalLink size={14} />
            </button>
          )}

          <button
            type="button"
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={handleDownload}
            title="Download file to computer"
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-1"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main Full Page Preview Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-xs">Loading file preview...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <X size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Cannot Preview File</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">{error}</p>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                onClick={handleDownload}
              >
                Download File
              </button>
            </div>
          ) : (
            <>
              {/* 1. CODING FILES PREVIEW */}
              {category === 'code' && (
                <div
                  className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-colors ${
                    codeTheme === 'dark' ? 'bg-[#0d1117] text-slate-200' : 'bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex-1 overflow-auto flex select-text">
                    {/* Line numbers gutter */}
                    <div
                      className={`py-3.5 pl-3 pr-3 text-right select-none font-mono text-[11.5px] leading-5 shrink-0 sticky left-0 z-10 border-r ${
                        codeTheme === 'dark'
                          ? 'bg-[#0d1117] text-slate-600 border-slate-800/80'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                      style={{ minWidth: `${Math.max(3, String(lines.length).length) * 9 + 28}px` }}
                    >
                      {lines.map((_, i) => (
                        <div key={i} className="h-5">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Code token lines */}
                    <div
                      className={`flex-1 py-3.5 px-4 font-mono text-[12px] leading-5 ${
                        wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                      }`}
                    >
                      {lines.map((line, i) => (
                        <div
                          key={i}
                          className={`h-5 flex items-center ${
                            codeTheme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/60'
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: highlightCodeLine(line, language),
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Code Status Bar */}
                  <div
                    className={`h-7 px-4 border-t flex items-center justify-between text-[11px] font-mono select-none shrink-0 ${
                      codeTheme === 'dark'
                        ? 'bg-[#090d13] border-slate-800 text-slate-500'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{lines.length} lines</span>
                      <span>•</span>
                      <span>{formatFileSize(fileMeta.size)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="uppercase">{language}</span>
                      <span>•</span>
                      <span>UTF-8</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. TEXT FILES PREVIEW */}
              {category === 'text' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-100/70">
                  <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
                    <article className="w-full max-w-3xl bg-white border border-slate-200/80 shadow-xs rounded-xl p-8 my-auto select-text">
                      {ext === 'md' && isMarkdownRendered ? (
                        <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-3">
                          {lines.map((line, idx) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('# ')) {
                              return (
                                <h1 key={idx} className="text-xl font-bold text-slate-900 border-b pb-2 pt-2">
                                  {trimmed.slice(2)}
                                </h1>
                              );
                            }
                            if (trimmed.startsWith('## ')) {
                              return (
                                <h2 key={idx} className="text-lg font-bold text-slate-900 border-b pb-1 pt-2">
                                  {trimmed.slice(3)}
                                </h2>
                              );
                            }
                            if (trimmed.startsWith('### ')) {
                              return (
                                <h3 key={idx} className="text-base font-semibold text-slate-900 pt-1">
                                  {trimmed.slice(4)}
                                </h3>
                              );
                            }
                            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                              return (
                                <li key={idx} className="ml-4 list-disc text-slate-700">
                                  {trimmed.slice(2)}
                                </li>
                              );
                            }
                            if (trimmed.startsWith('> ')) {
                              return (
                                <blockquote
                                  key={idx}
                                  className="border-l-4 border-blue-500 pl-3 italic text-slate-600 bg-slate-50 py-1"
                                >
                                  {trimmed.slice(2)}
                                </blockquote>
                              );
                            }
                            if (trimmed.startsWith('```')) {
                              return null; // Simple code block delimiter
                            }
                            if (!trimmed) {
                              return <div key={idx} className="h-2" />;
                            }
                            return (
                              <p key={idx} className="text-slate-700 leading-relaxed">
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className={`font-sans text-[13.5px] leading-relaxed text-slate-800 select-text ${
                            wordWrap ? 'whitespace-pre-wrap wrap-break-word' : 'whitespace-pre overflow-x-auto'
                          }`}
                        >
                          {previewContent}
                        </div>
                      )}
                    </article>
                  </div>

                  {/* Text Status Bar */}
                  <div className="h-7 px-4 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500 font-medium select-none shrink-0">
                    <div className="flex items-center gap-3">
                      <span>{textStats.words.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{textStats.chars.toLocaleString()} characters</span>
                      <span>•</span>
                      <span>{textStats.lines} lines</span>
                    </div>
                    <div>
                      <span>~{textStats.readTime} min read</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. IMAGE FILES PREVIEW */}
              {category === 'image' && (
                <div
                  className={`flex-1 flex flex-col min-h-0 overflow-hidden relative transition-colors ${
                    imageBackground === 'dark'
                      ? 'bg-slate-950'
                      : imageBackground === 'light'
                      ? 'bg-slate-50'
                      : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[16px_16px] bg-slate-100'
                  }`}
                >
                  <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt={item.name}
                        className="object-contain transition-transform duration-100 ease-out rounded shadow-lg max-h-[82%] max-w-[85%]"
                        style={{
                          transform: `scale(${imageZoom})`,
                          transformOrigin: 'center center',
                        }}
                        onLoad={(e) => {
                          setImageDimensions({
                            width: e.target.naturalWidth,
                            height: e.target.naturalHeight,
                          });
                        }}
                      />
                    ) : (
                      <div className="text-slate-400 text-xs">No image preview available</div>
                    )}
                  </div>

                  {/* Floating Image Control Bar */}
                  <div className="h-10 px-4 border-t border-slate-200/60 bg-white/95 backdrop-blur-xs flex items-center justify-between text-xs select-none shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {imageDimensions ? `${imageDimensions.width} × ${imageDimensions.height} px` : 'Loading...'}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] font-mono text-slate-500">{formatFileSize(fileMeta.size)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 mr-1">Backdrop:</span>
                      <button
                        type="button"
                        className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          imageBackground === 'checkerboard'
                            ? 'bg-blue-100 text-blue-700 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        onClick={() => setImageBackground('checkerboard')}
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          imageBackground === 'dark'
                            ? 'bg-blue-100 text-blue-700 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        onClick={() => setImageBackground('dark')}
                      >
                        Dark
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                          imageBackground === 'light'
                            ? 'bg-blue-100 text-blue-700 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        onClick={() => setImageBackground('light')}
                      >
                        Light
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. AUDIO / VIDEO / BINARY PREVIEWS */}
              {category === 'audio' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                      <FileTypeIcon isDirectory={false} fileName={item.name} size={32} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{item.name}</h3>
                    <p className="text-xs text-slate-500 mb-6">{formatFileSize(fileMeta.size)}</p>
                    {blobUrl || item.url ? (
                      <audio controls className="w-full" src={blobUrl || item.url} />
                    ) : (
                      <p className="text-xs text-slate-400">Audio playback not available</p>
                    )}
                  </div>
                </div>
              )}

              {category === 'video' && (
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
                  {blobUrl || item.url ? (
                    <video
                      controls
                      className="max-h-full max-w-full rounded-lg shadow-2xl"
                      src={blobUrl || item.url}
                    />
                  ) : (
                    <p className="text-slate-400 text-xs">Video playback not available</p>
                  )}
                </div>
              )}

              {category !== 'code' && category !== 'text' && category !== 'image' && category !== 'audio' && category !== 'video' && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-600 flex items-center justify-center mb-4">
                    <FileTypeIcon isDirectory={false} fileName={item.name} size={32} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-6">
                    This file format ({ext ? `.${ext}` : 'binary'}) cannot be displayed inline as text or image.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      onClick={handleDownload}
                    >
                      <Download size={14} />
                      <span>Download File</span>
                    </button>
                    {(item.url || blobUrl) && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={handleOpenInNewTab}
                      >
                        <ExternalLink size={14} />
                        <span>Open in Chrome</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Collapsible Info Drawer on the Right */}
        {showDetailsDrawer && (
          <aside className="w-64 border-l border-slate-200 bg-white p-4 flex flex-col gap-4 text-xs select-none shrink-0 overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs">File Information</span>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                onClick={() => setShowDetailsDrawer(false)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11.5px]">
              <div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  File Name
                </div>
                <div className="text-slate-800 break-all">{item.name}</div>
              </div>

              <div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  File Size
                </div>
                <div className="text-slate-800">
                  {formatFileSize(fileMeta.size)}{' '}
                  {fileMeta.size !== null && fileMeta.size !== undefined && (
                    <span className="text-slate-400">({fileMeta.size.toLocaleString()} bytes)</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Last Modified
                </div>
                <div className="text-slate-800">{formatDate(fileMeta.lastModified)}</div>
              </div>

              {fileMeta.mimeType && (
                <div>
                  <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    MIME Type
                  </div>
                  <div className="text-slate-800 break-all">{fileMeta.mimeType}</div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Category
                </div>
                <div className="uppercase font-semibold text-blue-600">{category}</div>
              </div>

              {item.url && (
                <div>
                  <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Location
                  </div>
                  <div className="text-slate-600 text-[10.5px] break-all">{item.url}</div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
