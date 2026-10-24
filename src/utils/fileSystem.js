/**
 * Checks if the File System Access API is supported in the current environment.
 * @returns {boolean}
 */
export function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

/**
 * Prompts the user to pick a directory using the File System Access API.
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function pickDirectory() {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: 'fileview-picker',
      mode: 'read',
    });
    return handle;
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled picker dialog
      return null;
    }
    throw error;
  }
}

/**
 * Reads all child entries (files and directories) from a directory handle.
 * @param {FileSystemDirectoryHandle} dirHandle 
 * @returns {Promise<Array<{name: string, kind: 'directory'|'file', size?: number, lastModified?: number, type?: string, handle: FileSystemHandle}>>}
 */
export async function readDirectory(dirHandle) {
  if (!dirHandle || dirHandle.kind !== 'directory') {
    throw new Error('Invalid directory handle');
  }

  const items = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'directory') {
      items.push({
        name: entry.name,
        kind: 'directory',
        handle: entry,
        size: null,
        lastModified: null,
      });
    } else if (entry.kind === 'file') {
      let size = 0;
      let lastModified = null;
      let type = '';

      try {
        const file = await entry.getFile();
        size = file.size;
        lastModified = file.lastModified;
        type = file.type || '';
      } catch (err) {
        // In case of permission or lock issue on specific file
        console.warn(`Could not read metadata for ${entry.name}`, err);
      }

      items.push({
        name: entry.name,
        kind: 'file',
        handle: entry,
        size,
        lastModified,
        type,
      });
    }
  }

  // Sort: Directories first (A-Z), then Files (A-Z)
  items.sort((a, b) => {
    if (a.kind === 'directory' && b.kind !== 'directory') return -1;
    if (a.kind !== 'directory' && b.kind === 'directory') return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
  });

  return items;
}
