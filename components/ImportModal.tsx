"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, X, FileSpreadsheet, Check, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { searchGamesRAWG } from "@/app/actions";

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportModal({ onClose, onImportSuccess }: ImportModalProps) {
  // ... (estados existentes)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<any>(null);

  // ... (funciones de drag & drop y processFile existentes)

  // Función de búsqueda con paginación
  const handleSearch = async (e: React.FormEvent, newPage: number = 1) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setPage(newPage);
    
    const { results, total } = await searchGamesRAWG(searchQuery, newPage);
    setSearchResults(results);
    setTotalPages(Math.ceil(total / 20));
    setIsSearching(false);
  };

  // ... (función handleUpload existente)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ... (Cabecera del modal existente) */}

        <div className="p-6 overflow-y-auto">
          {/* ... (Formulario de búsqueda existente) */}

          {/* Resultados Búsqueda */}
          {!selectedGame && searchResults.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {searchResults.map((game) => (
                  <div 
                    key={game.id}
                    onClick={() => setSelectedGame(game)} 
                    className="flex gap-3 p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 cursor-pointer transition-all items-center group"
                  >
                    <img src={game.image_url} className="w-12 h-16 object-cover rounded-lg bg-slate-200 shadow-sm"/>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{game.name}</p>
                      <p className="text-xs text-slate-500">{game.released} • ⭐ {game.rating}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                    onClick={(e) => handleSearch(e, page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-slate-600">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={(e) => handleSearch(e, page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ... (Confirmación de selección existente) */}
        </div>
      </div>
    </div>
  );
}