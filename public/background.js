// FileView Background Service Worker (Manifest V3)

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only inspect when URL changes to a local file:/// path
  const url = changeInfo.url || (changeInfo.status === 'loading' && tab?.url);
  if (!url || !url.startsWith('file:///')) return;

  // Check if target is a directory (ends with '/' or has no file extension in the last path segment)
  const cleanUrl = url.split('?')[0].split('#')[0];
  const lastPart = cleanUrl.split('/').filter(Boolean).pop() || '';
  const isDirectory = cleanUrl.endsWith('/') || !lastPart.includes('.');

  if (!isDirectory) return;

  // Check user toggle preference
  chrome.storage.local.get({ enhanceFileUrls: true }, (res) => {
    if (!res.enhanceFileUrls) return;

    const fileViewUrl = chrome.runtime.getURL('index.html?url=' + encodeURIComponent(url));
    if (tab.url !== fileViewUrl) {
      chrome.tabs.update(tabId, { url: fileViewUrl });
    }
  });
});
