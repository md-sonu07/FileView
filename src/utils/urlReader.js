import { formatFileSize, formatDate, getFileExtension } from './formatters';

/**
 * Normalizes input string to a valid URL (file:/// or http:// or https://).
 * @param {string} input 
 * @returns {string}
 */
export function normalizeUrl(input) {
  let str = (input || '').trim();
  if (!str) return '';

  // Already a full file:/// URL
  if (str.startsWith('file:///')) {
    return str;
  }

  // Starts with file:// but fewer slashes
  if (str.startsWith('file://')) {
    return 'file:///' + str.slice(7).replace(/^\/+/, '');
  }

  // Unix/macOS absolute path (e.g. /Users/danish/Desktop)
  if (str.startsWith('/')) {
    return 'file://' + str;
  }

  // Windows absolute path (e.g. C:\Users\danish or C:/Users/danish)
  if (/^[a-zA-Z]:[\\/]/.test(str)) {
    return 'file:///' + str.replace(/\\/g, '/');
  }

  // HTTP or HTTPS
  if (/^https?:\/\//i.test(str)) {
    return str;
  }

  // Fallback: treat as file path
  return 'file:///' + str.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Parses Chrome native directory listing or standard HTML index page.
 * @param {string} html 
 * @param {string} baseUrl 
 * @returns {Array<object>}
 */
export function parseDirectoryHtml(html, baseUrl) {
  const items = [];
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // 1. Try parsing Chrome's internal addRow() calls
  // format: addRow(name, url, isdir, size, size_string, date, date_string)
  const addRowRegex = /addRow\s*\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*,\s*([01]|true|false)\s*(?:,\s*(\d+))?(?:,\s*(['"])(.*?)\7)?(?:,\s*(\d+))?(?:,\s*(['"])(.*?)\10)?\s*\)/g;
  let match;
  while ((match = addRowRegex.exec(html)) !== null) {
    const rawName = match[2];
    const rawUrl = match[4];

    // Skip parent directory links
    if (rawName === '..' || rawUrl === '..' || rawUrl === '../') continue;

    const isDir = match[5] === '1' || match[5] === 'true';
    const size = match[6] ? parseInt(match[6], 10) : (isDir ? null : 0);
    const dateNum = match[9] ? parseInt(match[9], 10) * 1000 : null;

    let fullItemUrl = rawUrl;
    try {
      fullItemUrl = new URL(rawUrl, normalizedBase).href;
    } catch {
      fullItemUrl = normalizedBase + rawUrl;
    }

    items.push({
      name: rawName,
      kind: isDir ? 'directory' : 'file',
      url: fullItemUrl,
      size: isDir ? null : size,
      lastModified: dateNum,
      type: '',
    });
  }

  if (items.length > 0) {
    return sortItems(items);
  }

  // 2. Fallback: Parse <a> tags from DOM (works for Apache, Python http.server, Nginx, etc.)
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');

    links.forEach((a) => {
      const href = a.getAttribute('href');
      const text = a.textContent.trim();

      if (
        !href ||
        href === '../' ||
        href === '..' ||
        href === '/' ||
        href.startsWith('?') ||
        href.startsWith('#') ||
        text === 'Parent Directory' ||
        text === '..'
      ) {
        return;
      }

      const isDir = href.endsWith('/') || a.classList.contains('dir') || a.classList.contains('icon-dir');
      const cleanName = text.replace(/\/$/, '') || href.replace(/\/$/, '');

      let fullItemUrl = href;
      try {
        fullItemUrl = new URL(href, normalizedBase).href;
      } catch {
        fullItemUrl = normalizedBase + href;
      }

      items.push({
        name: cleanName,
        kind: isDir ? 'directory' : 'file',
        url: fullItemUrl,
        size: null,
        lastModified: null,
        type: '',
      });
    });
  } catch (err) {
    console.warn('DOMParser failed on directory HTML', err);
  }

  return sortItems(items);
}

function sortItems(items) {
  return items.sort((a, b) => {
    if (a.kind === 'directory' && b.kind !== 'directory') return -1;
    if (a.kind !== 'directory' && b.kind === 'directory') return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
  });
}

/**
 * Fetches a given URL and determines if it is a directory listing or individual file.
 * @param {string} rawInputUrl 
 * @returns {Promise<{type: 'directory'|'file', url: string, items?: Array, file?: object, rawText?: string}>}
 */
export async function fetchPathOrUrl(rawInputUrl) {
  const url = normalizeUrl(rawInputUrl);

  try {
    const res = await fetch(url);
    if (!res.ok && res.status !== 0) {
      throw new Error(`Failed to load URL (HTTP ${res.status}): ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html') || url.endsWith('/') || !url.split('/').pop().includes('.');

    if (isHtml) {
      const text = await res.text();
      const parsedItems = parseDirectoryHtml(text, url);

      // If it parsed directory items, treat as directory
      if (parsedItems.length > 0 || text.includes('addRow') || text.includes('Index of')) {
        return {
          type: 'directory',
          url: url.endsWith('/') ? url : url + '/',
          items: parsedItems,
        };
      }

      // Single HTML file
      return {
        type: 'file',
        url,
        name: url.split('/').filter(Boolean).pop() || 'index.html',
        size: text.length,
        lastModified: Date.now(),
        mimeType: 'text/html',
        rawText: text,
      };
    }

    // Individual non-HTML file (image, binary, text, pdf)
    const blob = await res.blob();
    const name = url.split('/').filter(Boolean).pop() || 'file';
    let textPreview = null;

    if (blob.type.startsWith('text/') || blob.type === 'application/json') {
      try {
        textPreview = await blob.slice(0, 20480).text();
      } catch {
        // ignore preview error
      }
    }

    return {
      type: 'file',
      url,
      name,
      size: blob.size,
      lastModified: Date.now(),
      mimeType: blob.type || contentType,
      blob,
      rawText: textPreview,
    };
  } catch (err) {
    if (url.startsWith('file:///')) {
      const errorMsg =
        'Unable to access local file URL. In Google Chrome, go to chrome://extensions -> Details on FileView -> turn ON "Allow access to file URLs".';
      const enhancedError = new Error(errorMsg);
      enhancedError.isFileUrlError = true;
      throw enhancedError;
    }
    throw err;
  }
}
