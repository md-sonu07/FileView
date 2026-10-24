// FileView Content Script for file:///* directory pages
(function () {
  'use strict';

  function isDirectoryPage() {
    if (location.protocol !== 'file:') return false;

    const pathname = decodeURIComponent(location.pathname || '');
    if (pathname.endsWith('/') || location.href.endsWith('/')) return true;

    const title = (document.title || '').toLowerCase();
    const h1 = (document.querySelector('h1')?.textContent || '').toLowerCase();
    const bodyText = (document.body?.innerText || '').toLowerCase();

    if (title.includes('index of') || h1.includes('index of')) return true;
    if (bodyText.includes('parent directory')) return true;
    if (document.getElementById('listing') || document.querySelector('table')) return true;

    return false;
  }

  // Safe storage reader
  function getToggleSetting(cb) {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        chrome.storage.local.get({ enhanceFileUrls: true }, (res) => {
          cb(res ? res.enhanceFileUrls : true);
        });
        return;
      }
    } catch {
      // fallback
    }
    cb(true);
  }

  // State
  let rawItems = [];
  let parentDirectoryUrl = null;
  let activeSearchQuery = '';
  let activeSortBy = 'name';

  // SVG Icons
  const ICONS = {
    folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(59, 130, 246, 0.15)" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
    code: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 8 15 10 17"/><polyline points="14 13 16 15 14 17"/></svg>`,
    image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    video: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 11 5 3-5 3v-6Z"/></svg>`,
    audio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    archive: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`,
    doc: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
    file: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    logo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>`,
    chevron: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    arrowUp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="19" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    search: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>`,
  };

  function getFileIcon(fileName, isDir) {
    if (isDir) return ICONS.folder;
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'sql', 'xml'].includes(ext)) return ICONS.code;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) return ICONS.image;
    if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) return ICONS.video;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return ICONS.audio;
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return ICONS.archive;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return ICONS.doc;
    return ICONS.file;
  }

  function parseDirectory() {
    const items = [];
    let parentUrl = null;

    // A. Parse addRow scripts
    const addRowRegex = /addRow\s*\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*,\s*([01]|true|false)\s*(?:,\s*(\d+))?(?:,\s*(['"])(.*?)\7)?(?:,\s*(\d+))?(?:,\s*(['"])(.*?)\10)?\s*\)/g;

    Array.from(document.scripts).forEach((script) => {
      const code = script.textContent || '';
      let match;
      while ((match = addRowRegex.exec(code)) !== null) {
        const rawName = match[2];
        const rawUrl = match[4];

        if (rawName === '..' || rawUrl === '..' || rawUrl === '../') {
          parentUrl = rawUrl;
          continue;
        }

        const isDir = match[5] === '1' || match[5] === 'true';
        const size = match[6] ? parseInt(match[6], 10) : (isDir ? null : 0);
        const sizeStr = match[8] || (isDir ? '—' : '0 B');
        const dateNum = match[9] ? parseInt(match[9], 10) * 1000 : null;
        const dateStr = match[11] || '';

        items.push({
          name: rawName,
          url: rawUrl,
          isDir,
          size,
          sizeStr,
          dateNum,
          dateStr,
        });
      }
    });

    // B. Parse DOM table/links fallback
    if (items.length === 0) {
      const links = document.querySelectorAll('a');
      links.forEach((a) => {
        const text = a.textContent.trim();
        const href = a.getAttribute('href') || '';

        if (!href || text === '..' || href === '../' || text === '[parent directory]') {
          parentUrl = href || '../';
          return;
        }

        const isDir = href.endsWith('/') || a.className.includes('dir');
        let sizeStr = '—';
        let dateStr = '';

        const row = a.closest('tr');
        if (row) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            sizeStr = cells[1]?.textContent.trim() || sizeStr;
            dateStr = cells[2]?.textContent.trim() || dateStr;
          }
        }

        items.push({
          name: text.replace(/\/$/, '') || href.replace(/\/$/, ''),
          url: href,
          isDir,
          size: null,
          sizeStr,
          dateNum: null,
          dateStr,
        });
      });
    }

    return { items, parentUrl };
  }

  function renderModernView() {
    document.documentElement.classList.add('fileview-active');
    if (document.body) {
      document.body.classList.add('fileview-active');
      // Hide original children
      Array.from(document.body.children).forEach((el) => {
        if (el.id !== 'fileview-root' && el.id !== 'fileview-float-btn') {
          el.setAttribute('data-fileview-hidden', 'true');
          el.style.setProperty('display', 'none', 'important');
        }
      });
    }

    const existing = document.getElementById('fileview-root');
    if (existing) existing.remove();
    const floatBtn = document.getElementById('fileview-float-btn');
    if (floatBtn) floatBtn.remove();

    const root = document.createElement('div');
    root.id = 'fileview-root';

    const parsed = parseDirectory();
    rawItems = parsed.items;
    parentDirectoryUrl = parsed.parentUrl || '../';

    const currentPath = decodeURIComponent(location.pathname);
    const segments = currentPath.split('/').filter(Boolean);

    let breadcrumbsHtml = `<a href="file:///" class="fv-breadcrumb-item">Root</a>`;
    let accumulated = 'file:///';
    segments.forEach((seg, i) => {
      accumulated += seg + '/';
      const isLast = i === segments.length - 1;
      breadcrumbsHtml += `
        <span class="fv-breadcrumb-sep">${ICONS.chevron}</span>
        <a href="${accumulated}" class="fv-breadcrumb-item ${isLast ? 'active' : ''}">${seg}</a>
      `;
    });

    const folderCount = rawItems.filter((i) => i.isDir).length;
    const fileCount = rawItems.filter((i) => !i.isDir).length;

    root.innerHTML = `
      <div class="fv-container">
        <header class="fv-header">
          <div class="fv-brand">
            <div class="fv-brand-logo">${ICONS.logo}</div>
            <div>
              <h1 class="fv-brand-title">FileView</h1>
            </div>
            <span class="fv-brand-badge">file:/// Mode</span>
          </div>

          <div class="fv-toggle-container">
            <span class="fv-toggle-label">Modern UI:</span>
            <label class="fv-switch">
              <input type="checkbox" id="fv-modern-toggle" checked />
              <span class="fv-slider"></span>
            </label>
          </div>
        </header>

        <div class="fv-toolbar">
          <div class="fv-toolbar-row-top">
            <div class="fv-breadcrumbs">
              ${
                segments.length > 0
                  ? `<a href="${parentDirectoryUrl}" class="fv-btn-back">${ICONS.arrowUp} Parent Folder</a>`
                  : ''
              }
              ${breadcrumbsHtml}
            </div>
          </div>

          <div class="fv-toolbar-row-bottom">
            <div class="fv-search-container">
              <span class="fv-search-icon">${ICONS.search}</span>
              <input
                type="text"
                class="fv-search-input"
                id="fv-search-input"
                placeholder="Search files and folders..."
              />
            </div>

            <div class="fv-filter-actions">
              <span class="fv-item-count" id="fv-item-count-badge">
                ${rawItems.length} items (${folderCount} folders, ${fileCount} files)
              </span>

              <select class="fv-sort-select" id="fv-sort-select">
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
          </div>
        </div>

        <div class="fv-table-container">
          <div class="fv-table-header">
            <div class="fv-table-header-col">Name</div>
            <div class="fv-table-header-col">Size</div>
            <div class="fv-table-header-col">Date modified</div>
          </div>

          <div id="fv-rows-container"></div>
        </div>

        <footer class="fv-footer">
          <div>FileView Explorer for Chrome</div>
          <div>Location: ${currentPath}</div>
        </footer>
      </div>
    `;

    document.body.appendChild(root);

    updateTableRows();

    // If items were empty on first pass, retry shortly in case page is still parsing
    if (rawItems.length === 0) {
      setTimeout(() => {
        const retry = parseDirectory();
        if (retry.items.length > 0) {
          rawItems = retry.items;
          parentDirectoryUrl = retry.parentUrl || '../';
          updateTableRows();
        }
      }, 150);
    }

    // Toggle switch handler
    const toggleEl = document.getElementById('fv-modern-toggle');
    if (toggleEl) {
      toggleEl.addEventListener('change', (e) => {
        const enable = e.target.checked;
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
          chrome.storage.local.set({ enhanceFileUrls: enable });
        }
        if (!enable) {
          removeModernView();
          renderFloatingToggle();
        }
      });
    }

    // Search handler
    const searchInput = document.getElementById('fv-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activeSearchQuery = e.target.value;
        updateTableRows();
      });
    }

    // Sort handler
    const sortSelect = document.getElementById('fv-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        activeSortBy = e.target.value;
        updateTableRows();
      });
    }
  }

  function updateTableRows() {
    const container = document.getElementById('fv-rows-container');
    const badge = document.getElementById('fv-item-count-badge');
    if (!container) return;

    let filtered = [...rawItems];

    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;

      if (activeSortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
      }
      if (activeSortBy === 'size') {
        return (a.size || 0) - (b.size || 0);
      }
      if (activeSortBy === 'date') {
        return (a.dateNum || 0) - (b.dateNum || 0);
      }
      return 0;
    });

    if (badge) {
      badge.textContent = `${filtered.length} of ${rawItems.length} items`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="fv-empty-state">
          <h4>No matching files found</h4>
          <p>Try searching for a different file or folder name.</p>
        </div>
      `;
      return;
    }

    let rowsHtml = '';
    filtered.forEach((item) => {
      const icon = getFileIcon(item.name, item.isDir);
      rowsHtml += `
        <a href="${item.url}" class="fv-row ${item.isDir ? 'is-folder' : 'is-file'}">
          <div class="fv-name-col">
            <span class="fv-icon-wrap">${icon}</span>
            <span class="fv-item-name" title="${item.name}">${item.name}</span>
          </div>
          <div class="fv-size-col">${item.isDir ? '—' : item.sizeStr || '—'}</div>
          <div class="fv-date-col">${item.dateStr || '—'}</div>
        </a>
      `;
    });

    container.innerHTML = rowsHtml;
  }

  function removeModernView() {
    document.documentElement.classList.remove('fileview-active');
    if (document.body) document.body.classList.remove('fileview-active');

    const root = document.getElementById('fileview-root');
    if (root) root.remove();

    if (document.body) {
      Array.from(document.body.children).forEach((el) => {
        if (el.getAttribute('data-fileview-hidden') === 'true') {
          el.removeAttribute('data-fileview-hidden');
          el.style.removeProperty('display');
        }
      });
    }
  }

  function renderFloatingToggle() {
    const existing = document.getElementById('fileview-float-btn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'fileview-float-btn';
    btn.className = 'fileview-floating-toggle';
    btn.innerHTML = `
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#94a3b8;"></span>
      <span>FileView: OFF</span>
    `;

    btn.title = 'Click to switch to modern FileView UI';
    btn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        chrome.storage.local.set({ enhanceFileUrls: true });
      }
      btn.remove();
      renderModernView();
    });

    document.body.appendChild(btn);
  }

  // Execution entry point
  function start() {
    if (!isDirectoryPage()) return;

    getToggleSetting((enabled) => {
      if (enabled) {
        renderModernView();
      } else {
        renderFloatingToggle();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Listen for storage changes from popup
  if (typeof chrome !== 'undefined' && chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.enhanceFileUrls !== undefined) {
        if (changes.enhanceFileUrls.newValue) {
          const floatBtn = document.getElementById('fileview-float-btn');
          if (floatBtn) floatBtn.remove();
          renderModernView();
        } else {
          removeModernView();
          renderFloatingToggle();
        }
      }
    });
  }
})();
