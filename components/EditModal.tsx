"use client";

import { useState } from "react";
import { X, Save, Calendar, Star } from "lucide-react";
import { PLATFORMS } from "@/lib/constants"; // Importamos la lista maestra

type Game = {
  id: number;
  title: string;
  platform: string;
  format: string;
  status: string;
  rating: number;        
  user_rating: number | null; 
  started_at: string | null;
  finished_at: string | null;
};

interface EditModalProps {
  game: Game;
  onClose: () => void;
  onSave: (updatedGame: Partial<Game>) => Promise<void>;
}

export default function EditModal({ game, onClose, onSave }: EditModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Estados
  const [status, setStatus] = useState(game.status);
  const [platform, setPlatform] = useState(game.platform);
  const [format, setFormat] = useState(game.format);
  
  // Notas
  const [metacritic, setMetacritic] = useState(game.rating || 0);
  const [userRating, setUserRating] = useState(game.user_rating || 0);

  // Fechas (Formato YYYY-MM-DD para el input type="date")
  const [startedAt, setStartedAt] = useState(
    game.started_at ? new Date(game.started_at).toISOString().split("T")[0] : ""
  );
  const [finishedAt, setFinishedAt] = useState(
    game.finished_at ? new Date(game.finished_at).toISOString().split("T")[0] : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Convertir fechas vacías a null
    const finalStarted = startedAt ? new Date(startedAt).toISOString() : null;
    const finalFinished = finishedAt ? new Date(finishedAt).toISOString() : null;

    await onSave({
      id: game.id,
      status,
      platform,
      format,
      rating: Number(metacritic),
      user_rating: Number(userRating),
      started_at: finalStarted,
      finished_at: finalFinished,
    });
    
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
          <h3 className="text-lg font-bold text-white truncate pr-4">Editar: <span className="text-purple-400">{game.title}</span></h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Formulario con Scroll si es necesario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
          
          {/* Bloque 1: Estado y Plataforma - AQUI USAMOS LA LISTA MAESTRA */}
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase font-bold">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-white border border-gray-600">
                <option value="Pendiente">Pendiente</option>
                <option value="Deseado">Deseado (Wishlist)</option>
                <option value="Empezado">Empezado</option>
                <option value="Jugando">Jugando</option>
                <option value="Completado">Completado</option>
                <option value="Abandonado">Abandonado</option>
              </select>
            </div>
             <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase font-bold">Plataforma</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-white border border-gray-600">
                {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bloque 2: Puntuaciones */}
          <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700 space-y-3">
            <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Star size={14}/> Puntuaciones</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 uppercase font-bold">Metacritic (RAWG)</label>
                    <input 
                        type="number" min="0" max="100"
                        value={metacritic}
                        onChange={(e) => setMetacritic(Number(e.target.value))}
                        className="bg-gray-900 text-gray-300 p-2 rounded-lg border border-gray-700 text-center font-mono"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-purple-400 uppercase font-bold">Mi Nota (0-10)</label>
                    <input 
                        type="number" min="0" max="10" step="0.5"
                        value={userRating}
                        onChange={(e) => setUserRating(Number(e.target.value))}
                        className="bg-gray-700 text-white p-2 rounded-lg border border-purple-500/50 text-center font-bold text-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
            </div>
          </div>

          {/* Bloque 3: Fechas */}
          <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700 space-y-3">
            <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Calendar size={14}/> Cronología</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 uppercase font-bold">Fecha Inicio</label>
                    <input 
                        type="date" 
                        value={startedAt}
                        onChange={(e) => setStartedAt(e.target.value)}
                        className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 outline-none w-full"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 uppercase font-bold">Fecha Fin</label>
                    <input 
                        type="date" 
                        value={finishedAt}
                        onChange={(e) => setFinishedAt(e.target.value)}
                        className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 outline-none w-full"
                    />
                </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-xs text-gray-400 uppercase font-bold">Formato</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-white border border-gray-600">
                <option>Digital</option>
                <option>Físico</option>
              </select>
          </div>

          {/* Botón Guardar */}
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-xl flex justify-center items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/20"
          >
            {loading ? "Guardando..." : <><Save size={20} /> Guardar Cambios</>}
          </button>

        </form>
      </div>
    </div>
  );
}