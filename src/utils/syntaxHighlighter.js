/**
 * Pure JavaScript Syntax Highlighter & File Categorizer for FileView
 * Provides zero-dependency, ultra-fast token highlighting for code files
 * and categorizes files into code, text, image, media, or other.
 */

export function getFileCategory(fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tiff'].includes(ext)) {
    return 'image';
  }

  // Audio / Video
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return 'video';
  }

  // PDFs
  if (ext === 'pdf') {
    return 'pdf';
  }

  // Coding files
  const codeExtensions = [
    'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx',
    'json', 'jsonc', 'json5',
    'html', 'htm', 'xhtml', 'xml',
    'css', 'scss', 'sass', 'less',
    'py', 'pyw', 'ipynb',
    'c', 'h', 'cpp', 'hpp', 'cc', 'cxx',
    'java', 'kt', 'kts', 'scala', 'groovy',
    'rs', 'go', 'php', 'rb', 'lua',
    'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
    'sql', 'graphql', 'gql',
    'yml', 'yaml', 'toml', 'ini', 'env',
    'dockerfile', 'makefile', 'gradle',
  ];
  if (codeExtensions.includes(ext) || ['dockerfile', 'makefile', '.gitignore', '.env'].includes(fileName.toLowerCase())) {
    return 'code';
  }

  // Text files
  const textExtensions = [
    'txt', 'text', 'log', 'md', 'markdown',
    'csv', 'tsv', 'rtf', 'rst', 'diff', 'patch',
    'license', 'readme',
  ];
  if (textExtensions.includes(ext) || ['license', 'readme'].includes(fileName.toLowerCase())) {
    return 'text';
  }

  return 'other';
}

export function detectLanguage(fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'javascript';
  if (['ts', 'tsx'].includes(ext)) return 'typescript';
  if (['json', 'jsonc', 'json5'].includes(ext) || lowerName.endsWith('.json')) return 'json';
  if (['html', 'htm', 'xhtml', 'xml', 'svg'].includes(ext)) return 'html';
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'css';
  if (['py', 'pyw'].includes(ext)) return 'python';
  if (['c', 'h', 'cpp', 'hpp', 'cc', 'cxx'].includes(ext)) return 'cpp';
  if (['java', 'kt', 'kts'].includes(ext)) return 'java';
  if (ext === 'rs') return 'rust';
  if (ext === 'go') return 'go';
  if (ext === 'sql') return 'sql';
  if (['sh', 'bash', 'zsh'].includes(ext) || lowerName.includes('sh')) return 'shell';
  if (['yml', 'yaml'].includes(ext)) return 'yaml';
  if (['md', 'markdown'].includes(ext)) return 'markdown';

  return 'generic';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Highlights a single line of code according to the detected language.
 * Returns an HTML string with Tailwind-styled token spans.
 */
export function highlightCodeLine(rawLine, language = 'generic') {
  if (!rawLine) return '&nbsp;';

  const escaped = escapeHtml(rawLine);

  switch (language) {
    case 'json':
      return highlightJson(escaped);
    case 'javascript':
    case 'typescript':
      return highlightJavaScript(escaped);
    case 'python':
      return highlightPython(escaped);
    case 'html':
      return highlightHtml(escaped);
    case 'css':
      return highlightCss(escaped);
    case 'sql':
      return highlightSql(escaped);
    case 'yaml':
      return highlightYaml(escaped);
    case 'shell':
      return highlightShell(escaped);
    default:
      return highlightGeneric(escaped);
  }
}

function highlightJson(line) {
  let res = line;
  // Key: "key":
  res = res.replace(/(&quot;[^\n\r]*?&quot;)(\s*:)/g, '<span class="text-sky-400 font-medium">$1</span>$2');
  // String value: : "value"
  res = res.replace(/(:\s*)(&quot;[^\n\r]*?&quot;)/g, '$1<span class="text-emerald-400">$2</span>');
  // Pure string in array
  res = res.replace(/(^\s*)(&quot;[^\n\r]*?&quot;)(,?)/g, '$1<span class="text-emerald-400">$2</span>$3');
  // Numbers
  res = res.replace(/(\b-?\d+(\.\d+)?\b)/g, '<span class="text-amber-400">$1</span>');
  // Booleans / null
  res = res.replace(/(\btrue\b|\bfalse\b|\bnull\b)/g, '<span class="text-purple-400 font-semibold">$1</span>');
  return res;
}

function highlightJavaScript(line) {
  let res = line;
  // Comments //
  if (res.includes('//')) {
    const parts = res.split('//');
    return highlightJavaScript(parts[0]) + '<span class="text-slate-500 italic">//' + parts.slice(1).join('//') + '</span>';
  }
  // Strings
  res = res.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, '<span class="text-emerald-400">$1</span>');
  // Keywords
  const jsKeywords = /\b(const|let|var|function|return|import|export|from|default|class|extends|new|this|async|await|try|catch|finally|throw|if|else|for|while|switch|case|break|continue|yield|typeof|instanceof|void|delete|interface|type)\b/g;
  res = res.replace(jsKeywords, '<span class="text-purple-400 font-medium">$1</span>');
  // Booleans / null
  res = res.replace(/\b(true|false|null|undefined|NaN)\b/g, '<span class="text-amber-400 font-semibold">$1</span>');
  // Numbers
  res = res.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-orange-400">$1</span>');
  // Function calls
  res = res.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, '<span class="text-blue-400">$1</span>');
  return res;
}

function highlightPython(line) {
  let res = line;
  // Comments #
  if (res.includes('#')) {
    const idx = res.indexOf('#');
    return highlightPython(res.slice(0, idx)) + '<span class="text-slate-500 italic">' + res.slice(idx) + '</span>';
  }
  // Strings
  res = res.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="text-emerald-400">$1</span>');
  // Keywords
  const pyKeywords = /\b(def|class|import|from|as|return|if|elif|else|for|while|try|except|finally|with|lambda|yield|raise|in|is|not|and|or|pass|break|continue|global|nonlocal|async|await)\b/g;
  res = res.replace(pyKeywords, '<span class="text-purple-400 font-medium">$1</span>');
  // Built-in constants
  res = res.replace(/\b(True|False|None|self)\b/g, '<span class="text-amber-400 font-semibold">$1</span>');
  // Numbers
  res = res.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-orange-400">$1</span>');
  return res;
}

function highlightHtml(line) {
  let res = line;
  // Tags
  res = res.replace(/(&lt;\/?[a-zA-Z0-9_-]+)/g, '<span class="text-rose-400 font-medium">$1</span>');
  res = res.replace(/(\/?&gt;)/g, '<span class="text-rose-400 font-medium">$1</span>');
  // Attributes
  res = res.replace(/([a-zA-Z0-9_-]+)(?=\=)/g, '<span class="text-sky-400">$1</span>');
  // Strings
  res = res.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="text-emerald-400">$1</span>');
  return res;
}

function highlightCss(line) {
  let res = line;
  // Comments
  res = res.replace(/(\/\*.*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>');
  // Properties
  res = res.replace(/([a-zA-Z0-9_-]+)(?=\s*:)/g, '<span class="text-sky-400">$1</span>');
  // Values with units
  res = res.replace(/(\b\d+(\.\d+)?(px|rem|em|%|vh|vw|s|ms|deg)?\b)/g, '<span class="text-amber-400">$1</span>');
  // Colors hex
  res = res.replace(/(#[a-fA-F0-9]{3,8})/g, '<span class="text-emerald-400 font-mono">$1</span>');
  return res;
}

function highlightSql(line) {
  let res = line;
  // Comments --
  if (res.includes('--')) {
    const idx = res.indexOf('--');
    return highlightSql(res.slice(0, idx)) + '<span class="text-slate-500 italic">' + res.slice(idx) + '</span>';
  }
  // Keywords
  const sqlKeywords = /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|UNION|ALL|AS|AND|OR|NOT|NULL|IS|IN|LIKE|VALUES|COUNT|AVG|SUM|MAX|MIN|DISTINCT|CASE|WHEN|THEN|ELSE|END)\b/gi;
  res = res.replace(sqlKeywords, '<span class="text-purple-400 font-semibold">$1</span>');
  // Strings
  res = res.replace(/(&#039;.*?&#039;|&quot;.*?&quot;)/g, '<span class="text-emerald-400">$1</span>');
  // Numbers
  res = res.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>');
  return res;
}

function highlightYaml(line) {
  let res = line;
  // Comments #
  if (res.includes('#')) {
    const idx = res.indexOf('#');
    return highlightYaml(res.slice(0, idx)) + '<span class="text-slate-500 italic">' + res.slice(idx) + '</span>';
  }
  // Key:
  res = res.replace(/^(\s*[\w.-]+)(:)/g, '$1<span class="text-sky-400 font-medium">:</span>');
  // Strings
  res = res.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="text-emerald-400">$1</span>');
  // Booleans
  res = res.replace(/\b(true|false|yes|no)\b/gi, '<span class="text-purple-400 font-semibold">$1</span>');
  // Numbers
  res = res.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-amber-400">$1</span>');
  return res;
}

function highlightShell(line) {
  let res = line;
  // Comments
  if (res.includes('#')) {
    const idx = res.indexOf('#');
    return highlightShell(res.slice(0, idx)) + '<span class="text-slate-500 italic">' + res.slice(idx) + '</span>';
  }
  // Variables $VAR or ${VAR}
  res = res.replace(/(\$[\w{}]+)/g, '<span class="text-amber-400">$1</span>');
  // Strings
  res = res.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="text-emerald-400">$1</span>');
  // Keywords
  const shKeywords = /\b(if|then|else|elif|fi|case|esac|for|while|until|do|done|in|function|echo|exit|export|return)\b/g;
  res = res.replace(shKeywords, '<span class="text-purple-400 font-medium">$1</span>');
  return res;
}

function highlightGeneric(line) {
  let res = line;
  // Strings
  res = res.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="text-emerald-400">$1</span>');
  // Numbers
  res = res.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-amber-400">$1</span>');
  return res;
}
