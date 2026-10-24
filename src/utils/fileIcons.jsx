import React from 'react';
import {
  Folder,
  File,
  FileText,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react';
import { getFileExtension } from './formatters';

const EXTENSION_MAP = {
  // Code & markup
  js: { icon: FileCode, color: '#eab308' },
  jsx: { icon: FileCode, color: '#06b6d4' },
  ts: { icon: FileCode, color: '#3b82f6' },
  tsx: { icon: FileCode, color: '#3b82f6' },
  html: { icon: FileCode, color: '#ea580c' },
  css: { icon: FileCode, color: '#0284c7' },
  scss: { icon: FileCode, color: '#ec4899' },
  json: { icon: FileCode, color: '#ca8a04' },
  py: { icon: FileCode, color: '#0284c7' },
  rb: { icon: FileCode, color: '#dc2626' },
  java: { icon: FileCode, color: '#ea580c' },
  c: { icon: FileCode, color: '#475569' },
  cpp: { icon: FileCode, color: '#0284c7' },
  cs: { icon: FileCode, color: '#7c3aed' },
  go: { icon: FileCode, color: '#06b6d4' },
  rs: { icon: FileCode, color: '#ea580c' },
  php: { icon: FileCode, color: '#6366f1' },
  sh: { icon: FileCode, color: '#16a34a' },
  sql: { icon: FileCode, color: '#0284c7' },
  xml: { icon: FileCode, color: '#ea580c' },
  svg: { icon: FileImage, color: '#ea580c' },

  // Images
  png: { icon: FileImage, color: '#10b981' },
  jpg: { icon: FileImage, color: '#10b981' },
  jpeg: { icon: FileImage, color: '#10b981' },
  gif: { icon: FileImage, color: '#10b981' },
  webp: { icon: FileImage, color: '#10b981' },
  bmp: { icon: FileImage, color: '#10b981' },
  ico: { icon: FileImage, color: '#10b981' },

  // Video
  mp4: { icon: FileVideo, color: '#8b5cf6' },
  webm: { icon: FileVideo, color: '#8b5cf6' },
  mov: { icon: FileVideo, color: '#8b5cf6' },
  mkv: { icon: FileVideo, color: '#8b5cf6' },
  avi: { icon: FileVideo, color: '#8b5cf6' },

  // Audio
  mp3: { icon: FileAudio, color: '#ec4899' },
  wav: { icon: FileAudio, color: '#ec4899' },
  ogg: { icon: FileAudio, color: '#ec4899' },
  flac: { icon: FileAudio, color: '#ec4899' },
  aac: { icon: FileAudio, color: '#ec4899' },

  // Spreadsheets
  xls: { icon: FileSpreadsheet, color: '#059669' },
  xlsx: { icon: FileSpreadsheet, color: '#059669' },
  csv: { icon: FileSpreadsheet, color: '#059669' },
  tsv: { icon: FileSpreadsheet, color: '#059669' },

  // Archives
  zip: { icon: FileArchive, color: '#d97706' },
  tar: { icon: FileArchive, color: '#d97706' },
  gz: { icon: FileArchive, color: '#d97706' },
  '7z': { icon: FileArchive, color: '#d97706' },
  rar: { icon: FileArchive, color: '#d97706' },

  // Documents
  pdf: { icon: FileText, color: '#dc2626' },
  doc: { icon: FileText, color: '#2563eb' },
  docx: { icon: FileText, color: '#2563eb' },
  txt: { icon: FileText, color: '#64748b' },
  md: { icon: FileText, color: '#0ea5e9' },
  log: { icon: FileText, color: '#64748b' },
};

/**
 * Returns an icon component for a folder or file.
 */
export function FileTypeIcon({ isDirectory, fileName, size = 18, className = '' }) {
  if (isDirectory) {
    return (
      <Folder
        size={size}
        className={className}
        style={{ color: '#2563eb', fill: '#3b82f6', fillOpacity: 0.15 }}
      />
    );
  }

  const ext = getFileExtension(fileName);
  const match = EXTENSION_MAP[ext];

  if (match) {
    const IconComponent = match.icon;
    return <IconComponent size={size} color={match.color} className={className} />;
  }

  return <File size={size} color="#64748b" className={className} />;
}
