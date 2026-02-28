"use client";

import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F8FAFC]/80 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4 drop-shadow-lg" />
      <p className="text-slate-600 dark:text-slate-300 font-bold animate-pulse tracking-wide">
        Cargando datos...
      </p>
    </div>
  );
}