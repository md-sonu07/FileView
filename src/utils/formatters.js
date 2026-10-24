/**
 * Formats byte size into human-readable string (B, KB, MB, GB).
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return '—';
  }
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i >= sizes.length) {
    return (bytes / Math.pow(k, sizes.length - 1)).toFixed(1) + ' ' + sizes[sizes.length - 1];
  }

  // Show integer for Bytes, 1 decimal place for KB/MB/GB
  if (i === 0) return `${bytes} B`;
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formats epoch timestamp or Date object into human-readable date.
 * @param {number|Date} timestamp 
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Extracts lowercase extension from file name.
 * @param {string} fileName 
 * @returns {string}
 */
export function getFileExtension(fileName) {
  if (!fileName || !fileName.includes('.')) return '';
  return fileName.split('.').pop().toLowerCase();
}
