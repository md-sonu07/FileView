import React from 'react';
import {
  FolderOpen,
  Globe,
  ShieldCheck,
  FolderGit2,
  Info,
} from 'lucide-react';

export function WelcomeState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 select-none">
      <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
        <FolderOpen size={28} />
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-1.5">Explore Local Files with FileView</h2>
      <p className="text-[13.5px] text-slate-600 max-w-md mb-5 leading-relaxed">
        Browse your computer's files using the native folder picker or enter any local <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs">file:///</code> path.
      </p>

      <div className="flex gap-2.5 flex-wrap justify-center max-w-md">
        <div className="text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>100% Local & Private</span>
        </div>
        <div className="text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <FolderGit2 size={14} className="text-blue-600" />
          <span>Subfolder Navigation</span>
        </div>
        <div className="text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Globe size={14} className="text-purple-600" />
          <span>file:/// URL Support</span>
        </div>
      </div>

      {/* Chrome file:/// access instruction callout */}
      <div className="mt-7 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 max-w-md text-left leading-relaxed">
        <div className="flex items-center gap-1.5 text-slate-800 font-semibold mb-1">
          <Info size={14} className="text-blue-600 shrink-0" />
          <span>Enabling file:/// access in Chrome</span>
        </div>
        <p>
          Chrome blocks extensions from reading <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[11px]">file:///</code> URLs by default. To enable:
          open <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[11px]">chrome://extensions</code> &rarr; click <strong>Details</strong> on FileView &rarr; toggle ON <strong>"Allow access to file URLs"</strong>.
        </p>
      </div>
    </div>
  );
}
