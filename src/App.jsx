import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, X, ShieldAlert, ExternalLink, HelpCircle } from 'lucide-react';
import { Header } from './components/Header';
import { AddressBar } from './components/AddressBar';
import { Toolbar } from './components/Toolbar';
import { FileList } from './components/FileList';
import { WelcomeState } from './components/WelcomeState';
import { FilePreview } from './components/FilePreview';
import { StatusBar } from './components/StatusBar';
import { pickDirectory, readDirectory, isFileSystemAccessSupported } from './utils/fileSystem';
import { fetchPathOrUrl, normalizeUrl } from './utils/urlReader';

export function App() {
  // Mode: 'idle' | 'handle' | 'url'
  const [mode, setMode] = useState('idle');

  // Handle mode state
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // URL mode state
  const [currentUrl, setCurrentUrl] = useState('');

  // Items in current view
  const [currentItems, setCurrentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isFileUrlPermissionError, setIsFileUrlPermissionError] = useState(false);

  // Search and Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Details Modal
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  // file:/// Auto-enhancement toggle state
  const [isAutoEnhanceEnabled, setIsAutoEnhanceEnabled] = useState(true);

  // Folder Location / Parent Path Prefix (e.g. 'Desktop' or 'Desktop/Projects')
  const [parentPathPrefix, setParentPathPrefix] = useState(() => {
    try {
      return localStorage.getItem('fileview_parent_path') || 'Desktop';
    } catch {
      return 'Desktop';
    }
  });

  const handleSetParentPathPrefix = (prefix) => {
    setParentPathPrefix(prefix);
    try {
      if (prefix) {
        localStorage.setItem('fileview_parent_path', prefix);
      } else {
        localStorage.removeItem('fileview_parent_path');
      }
    } catch (e) {
      console.warn('Could not save parent path to localStorage', e);
    }
  };

  // Active directory handle (when mode === 'handle')
  const currentFolderHandle = breadcrumbs.length > 0
    ? breadcrumbs[breadcrumbs.length - 1].handle
    : null;

  // Sync toggle state with chrome.storage.local and localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('enhanceFileUrls');
      if (stored !== null) {
        setIsAutoEnhanceEnabled(stored === 'true');
      }
    } catch {}

    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.get({ enhanceFileUrls: true }, (res) => {
        if (res && res.enhanceFileUrls !== undefined) {
          setIsAutoEnhanceEnabled(res.enhanceFileUrls);
        }
      });
    }
  }, []);

  const handleToggleAutoEnhance = (newVal) => {
    setIsAutoEnhanceEnabled(newVal);

    try {
      localStorage.setItem('enhanceFileUrls', String(newVal));
    } catch {}

    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.set({ enhanceFileUrls: newVal });
    }

    // Immediately update active tab when toggle changes
    if (typeof chrome !== 'undefined' && chrome?.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs && tabs[0];
        if (!activeTab || !activeTab.url) return;

        if (newVal) {
          // Toggled ON: If active tab is on raw file:///, immediately redirect to FileView!
          if (activeTab.url.startsWith('file:///')) {
            const viewerUrl = chrome.runtime.getURL('index.html?url=' + encodeURIComponent(activeTab.url));
            chrome.tabs.update(activeTab.id, { url: viewerUrl });
          }
        } else {
          // Toggled OFF: If active tab is on FileView with a file:/// url, switch back to raw file:///
          if (activeTab.url.includes('index.html?url=')) {
            try {
              const u = new URL(activeTab.url);
              const originalUrl = u.searchParams.get('url');
              if (originalUrl && originalUrl.startsWith('file:///')) {
                chrome.tabs.update(activeTab.id, { url: originalUrl });
                return;
              }
            } catch {}
          }
          // If already on file:///, reload so default Chrome view is displayed
          if (activeTab.url.startsWith('file:///')) {
            chrome.tabs.reload(activeTab.id);
          }
        }
      });
    }
  };

  // Read contents for a directory handle
  const loadHandleDirectory = useCallback(async (dirHandle, isRefresh = false) => {
    if (!dirHandle) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);
    setIsFileUrlPermissionError(false);

    try {
      const items = await readDirectory(dirHandle);
      setCurrentItems(items);
      setMode('handle');
    } catch (err) {
      console.error('Error reading directory:', err);
      setErrorMessage(err.message || 'Unable to read folder contents.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Open a URL or file path (e.g. file:///Users/... or /Users/...)
  const handleOpenUrl = useCallback(async (rawUrl, isRefresh = false) => {
    if (!rawUrl) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);
    setIsFileUrlPermissionError(false);

    try {
      const result = await fetchPathOrUrl(rawUrl);

      if (result.type === 'directory') {
        setCurrentUrl(result.url);
        setCurrentItems(result.items || []);
        setMode('url');
        setSearchQuery('');
      } else if (result.type === 'file') {
        setSelectedFileForModal(result);
      }
    } catch (err) {
      console.error('Error opening URL:', err);
      setErrorMessage(err.message || 'Could not load the specified URL or path.');
      if (err.isFileUrlError) {
        setIsFileUrlPermissionError(true);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Check URL parameters on mount (?url=... or cleanup ?action=pick)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const urlParam = params.get('url');

    if (urlParam) {
      handleOpenUrl(urlParam);
    }

    // If an action parameter was passed (e.g. action=pick), clean it up from the URL
    // so refreshing or re-rendering doesn't cause issues.
    // Note: showDirectoryPicker MUST NOT be called in useEffect as it requires a direct user gesture.
    if (action) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  // Choose folder via File System Access API
  const handleChooseFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      setErrorMessage(
        'Native File System Access API is not supported in this browser. Please use the URL / path input above (e.g. file:///).'
      );
      return;
    }

    try {
      const handle = await pickDirectory();
      if (!handle) return; // User cancelled picker dialog

      setBreadcrumbs([{ name: handle.name || 'Root Folder', handle }]);
      setSearchQuery('');
      await loadHandleDirectory(handle);
    } catch (err) {
      console.error('Error choosing folder:', err);
      // Gracefully ignore user cancellations
      if (err.name === 'AbortError') return;

      if (err.name === 'SecurityError') {
        setErrorMessage('Folder selection requires a direct user click. Please click "Choose Folder" again.');
      } else {
        setErrorMessage(err.message || 'Failed to select directory.');
      }
    }
  };

  // Navigate breadcrumb in handle mode
  const handleNavigateCrumb = async (index) => {
    if (index >= breadcrumbs.length - 1) return;
    const target = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSearchQuery('');
    await loadHandleDirectory(target.handle);
  };

  // Back button in handle mode
  const handleBackHandle = async () => {
    if (breadcrumbs.length <= 1) return;
    const target = breadcrumbs[breadcrumbs.length - 2];
    setBreadcrumbs(breadcrumbs.slice(0, -1));
    setSearchQuery('');
    await loadHandleDirectory(target.handle);
  };

  // Click on list item
  const handleItemClick = async (item) => {
    if (item.kind === 'directory') {
      if (mode === 'url') {
        await handleOpenUrl(item.url || `${currentUrl}${item.name}/`);
      } else {
        setBreadcrumbs((prev) => [...prev, { name: item.name, handle: item.handle }]);
        setSearchQuery('');
        await loadHandleDirectory(item.handle);
      }
    } else {
      setSelectedFileForModal(item);
    }
  };

  // Refresh current folder
  const handleRefresh = () => {
    if (mode === 'handle' && currentFolderHandle) {
      loadHandleDirectory(currentFolderHandle, true);
    } else if (mode === 'url' && currentUrl) {
      handleOpenUrl(currentUrl, true);
    }
  };

  // Sort change handler
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    let list = [...currentItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      // Directories first
      if (a.kind === 'directory' && b.kind !== 'directory') return -1;
      if (a.kind !== 'directory' && b.kind === 'directory') return 1;

      let comp = 0;
      if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
      } else if (sortBy === 'size') {
        const sizeA = a.size ?? -1;
        const sizeB = b.size ?? -1;
        comp = sizeA - sizeB;
      } else if (sortBy === 'modified') {
        const modA = a.lastModified ?? 0;
        const modB = b.lastModified ?? 0;
        comp = modA - modB;
      }

      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [currentItems, searchQuery, sortBy, sortOrder]);

  const isFolderOpen = mode !== 'idle';

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-hidden md:max-w-6xl md:h-[calc(100vh-48px)] md:max-h-225 md:rounded-xl md:shadow-md md:border md:border-slate-200 md:my-6 md:mx-auto select-none">
      <Header
        onChooseFolder={handleChooseFolder}
        isFolderOpen={isFolderOpen}
        isAutoEnhanceEnabled={isAutoEnhanceEnabled}
        onToggleAutoEnhance={handleToggleAutoEnhance}
        currentUrl={mode === 'url' ? currentUrl : ''}
      />

      {/* Address Bar for URL / file:/// paths & handle full path */}
      <AddressBar
        currentUrl={
          mode === 'url'
            ? currentUrl
            : breadcrumbs.length > 0
            ? `${parentPathPrefix && breadcrumbs[0]?.name?.toLowerCase() !== parentPathPrefix.toLowerCase() ? parentPathPrefix + '/' : ''}${breadcrumbs.map((b) => b.name).join('/')}/`
            : ''
        }
        onOpenUrl={(url) => handleOpenUrl(url)}
        isLoading={isLoading}
      />

      {/* Permission alert for file:/// access */}
      {isFileUrlPermissionError && (
        <div className="flex items-start gap-3 px-5 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs leading-relaxed">
          <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5">Enable file:/// access in Google Chrome:</strong>
            <p>
              1. Open <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[11px]">chrome://extensions</code> in a new tab.<br />
              2. Click <strong>Details</strong> on the FileView extension.<br />
              3. Toggle ON <strong>"Allow access to file URLs"</strong>.
            </p>
          </div>
          <button
            type="button"
            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors cursor-pointer"
            onClick={() => setIsFileUrlPermissionError(false)}
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* General error banner */}
      {errorMessage && !isFileUrlPermissionError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-700 px-5 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded transition-colors cursor-pointer"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isFolderOpen ? (
        <>
          <Toolbar
            mode={mode}
            breadcrumbs={breadcrumbs}
            currentUrl={currentUrl}
            parentPathPrefix={parentPathPrefix}
            onSetParentPathPrefix={handleSetParentPathPrefix}
            onNavigateCrumb={handleNavigateCrumb}
            onBack={handleBackHandle}
            onNavigateUrl={(url) => handleOpenUrl(url)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onToggleSortOrder={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            totalItemsCount={currentItems.length}
            filteredItemsCount={processedItems.length}
          />

          <main className="flex-1 overflow-y-auto relative bg-white">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 min-h-75">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500">
                  Reading directory contents...
                </p>
              </div>
            ) : (
              <FileList
                items={processedItems}
                onItemClick={handleItemClick}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
              />
            )}
          </main>

          <StatusBar items={currentItems} />
        </>
      ) : (
        <main className="flex-1 overflow-y-auto relative bg-white">
          <WelcomeState
            onOpenUrl={(url) => handleOpenUrl(url)}
            onChooseFolder={handleChooseFolder}
          />
        </main>
      )}

      {selectedFileForModal && (
        <FilePreview
          item={selectedFileForModal}
          filePath={
            mode === 'url'
              ? (currentUrl.endsWith('/') ? currentUrl : currentUrl + '/') + selectedFileForModal.name
              : `${parentPathPrefix && breadcrumbs[0]?.name?.toLowerCase() !== parentPathPrefix.toLowerCase() ? parentPathPrefix + '/' : ''}${breadcrumbs.map((b) => b.name).join('/')}/${selectedFileForModal.name}`
          }
          onClose={() => setSelectedFileForModal(null)}
        />
      )}
    </div>
  );
}

export default App;
