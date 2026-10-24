import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, X } from 'lucide-react';

export function AddressBar({ currentUrl, onOpenUrl, isLoading }) {
  const [inputVal, setInputVal] = useState(currentUrl || '');

  useEffect(() => {
    if (currentUrl) {
      setInputVal(currentUrl);
    }
  }, [currentUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onOpenUrl(inputVal.trim());
    }
  };

  return (
    <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <div className="relative flex-1">
          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
          <input
            type="text"
            className="w-full pl-9 pr-8 py-1.5 font-mono text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all"
            placeholder="Enter file:/// path or folder URL (e.g. file:///Users/... or /path/to/folder)"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          {inputVal && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
              onClick={() => setInputVal('')}
              title="Clear URL"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          disabled={!inputVal.trim() || isLoading}
        >
          <span>Open URL</span>
          <ArrowRight size={13} />
        </button>
      </form>
    </div>
  );
}
