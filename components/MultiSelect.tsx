"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
}

export default function MultiSelect({ options, selected, onChange, label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[38px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all min-w-[140px] ${
          selected.length > 0 
            ? "bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-md" 
            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
        }`}
      >
        <span className="truncate">
          {selected.length === 0 ? label : `${selected.length} selec.`}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 max-h-60 overflow-y-auto">
          
          {/* BOTÓN LIMPIAR SELECCIÓN */}
          {selected.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="w-full flex items-center gap-2 p-2 mb-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-sm font-bold transition-colors"
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}

          {options.map((option) => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
            >
              <div className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${selected.includes(option) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                {selected.includes(option) && <Check size={10} className="text-white" />}
              </div>
              <span className="truncate">{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}