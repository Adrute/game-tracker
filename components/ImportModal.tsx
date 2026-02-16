"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, X, FileSpreadsheet, Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { searchGamesRAWG } from "@/app/actions";

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportModal({ onClose, onImportSuccess }: ImportModalProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  // Manejo de Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Por favor sube un archivo .csv válido"); return;
    }
    setFile(file); setError(null);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => setPreview(results.data.slice(0, 3)),
      error: (err) => setError("Error: " + err.message)
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("No estás autenticado");

          const total = results.data.length;
          let processed = 0;
          const gamesToInsert = [];

          // Procesamos juego a juego
          for (const row of results.data as any[]) {
            const title = row.title || row.Title || row.Nombre || "Sin título";
            
            // Buscar portada automáticamente
            let imageUrl = "https://via.placeholder.com/300x400?text=No+Cover";
            let rating = 0;
            let description = null;
            let screenshots = null;
            
            if (title !== "Sin título") {
                try {
                    // Usamos la búsqueda precisa que arreglamos antes
                    const { results: searchResults } = await searchGamesRAWG(title);
                    if (searchResults && searchResults.length > 0) {
                        imageUrl = searchResults[0].image_url || imageUrl;
                        rating = searchResults[0].rating || 0;
                        description = searchResults[0].description || null;
                        screenshots = searchResults[0].screenshots || null;
                    }
                } catch (e) {
                    console.warn(`No se pudo encontrar imagen para ${title}`);
                }
            }

            gamesToInsert.push({
              title: title,
              platform: row.platform || row.Platform || "PC",
              status: row.status || row.Status || "Pendiente",
              format: row.format || "Digital",
              rating: rating,
              user_rating: row.user_rating ? parseInt(row.user_rating) : null,
              user_id: user.id,
              image_url: imageUrl,
              description: description,
              screenshots: screenshots
            });

            processed++;
            setProgress(Math.round((processed / total) * 100));
          }

          const { error } = await supabase.from("games").insert(gamesToInsert);
          if (error) throw error;

          onImportSuccess();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* CABECERA QUE FALTABA */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-emerald-600"/> Importar Juegos
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6">
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <UploadCloud size={48} className={`mx-auto mb-4 ${dragging ? 'text-emerald-500' : 'text-slate-300'}`} />
              <p className="font-bold text-slate-700">Sube tu CSV aquí</p>
              <input type="file" id="csv-input" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <FileSpreadsheet className="text-emerald-600" />
                <p className="font-bold text-sm flex-1 truncate">{file.name}</p>
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
              </div>

              {loading && (
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                          <span>Procesando...</span>
                          <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
              )}

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

              <button 
                onClick={handleUpload} 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin"/> : <><Check size={18}/> Importar y Buscar Datos</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}