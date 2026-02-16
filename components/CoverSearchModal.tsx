"use client";

import { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { searchGameCovers } from "@/app/actions";

interface CoverSearchModalProps {
  onClose: () => void;
  onSelectCover: (imageUrl: string) => void;
}

export default function CoverSearchModal({ onClose, onSelectCover }: CoverSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    const results = await searchGameCovers(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Search size={18} className="text-emerald-600"/> Buscar Portada
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input
              type="text"
              placeholder="Ej: The Last of Us..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-lg p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
            {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500"/>}
          </form>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {searchResults.map((cover, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onSelectCover(cover.image_url);
                    onClose();
                  }}
                  className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all border border-transparent hover:border-emerald-500"
                >
                  <img src={cover.image_url} alt={cover.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}