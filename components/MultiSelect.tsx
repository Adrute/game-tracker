"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
}

export default function MultiSelect({ options, selected, onChange, label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
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
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all min-w-[140px] ${
          selected.length > 0 
            ? "bg-slate-900 text-white border-slate-900" 
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="truncate">
          {selected.length === 0 ? label : `${selected.length} selec.`}
        </span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(option) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                {selected.includes(option) && <Check size={10} className="text-white" />}
              </div>
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}