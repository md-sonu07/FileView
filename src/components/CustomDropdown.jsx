import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function CustomDropdown({ value, onChange, options, ariaLabel = 'Sort options' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-blue-50/70 border-blue-300 text-blue-700 ring-2 ring-blue-500/15'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        {SelectedIcon && <SelectedIcon size={13} className="text-slate-500 shrink-0" />}
        <span className="whitespace-nowrap">Sort: {selectedOption?.label}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
          role="listbox"
          aria-label={ariaLabel}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 select-none">
            Sort Files By
          </div>
          {options.map((option) => {
            const isSelected = option.value === value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/60 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-normal'
                }`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center gap-2 truncate">
                  {Icon && (
                    <Icon
                      size={14}
                      className={isSelected ? 'text-blue-600' : 'text-slate-400'}
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
