"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { fetchGameData } from "./actions";
import { Plus, Trash2, Gamepad2, Pencil, Calendar, Star } from "lucide-react"; 
import Stats from "@/components/Stats"; 
import EditModal from "@/components/EditModal"; 

// Tipos actualizados
type Game = {
  id: number;
  title: string;
  platform: string;
  format: string;
  status: string;
  image_url: string;
  rating: number;             // RAWG
  user_rating: number | null; // Tu nota
  started_at: string | null;
  finished_at: string | null;
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  
  const [newGameTitle, setNewGameTitle] = useState("");
  const [platform, setPlatform] = useState("PS5");
  const [format, setFormat] = useState("Digital");

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    const { data } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (data) setGames(data);
    setLoading(false);
  }

  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const rawgData = await fetchGameData(newGameTitle);
    const finalTitle = rawgData?.name || newGameTitle;
    const finalImage = rawgData?.image_url || "https://via.placeholder.com/300x200?text=No+Cover";
    const finalRating = rawgData?.rating || 0; 

    const { error } = await supabase.from("games").insert([
      { 
        title: finalTitle, 
        platform, 
        format, 
        status: "Pendiente", 
        image_url: finalImage,
        rating: finalRating,
        user_rating: null // Al crear no tiene tu nota aún
      }
    ]);

    if (!error) {
      setNewGameTitle("");
      fetchGames();
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if(!confirm("¿Borrar juego?")) return;
    await supabase.from("games").delete().eq("id", id);
    fetchGames();
  }

  async function handleUpdateGame(updatedGame: Partial<Game>) {
    if (!updatedGame.id) return;

    const { error } = await supabase
      .from("games")
      .update({
        status: updatedGame.status,
        platform: updatedGame.platform,
        format: updatedGame.format,
        rating: updatedGame.rating,
        user_rating: updatedGame.user_rating,
        started_at: updatedGame.started_at,
        finished_at: updatedGame.finished_at
      })
      .eq("id", updatedGame.id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      fetchGames(); 
      setEditingGame(null); 
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="text-purple-500" /> My Games
        </h1>
      </header>

      {games.length > 0 && <Stats games={games} />}

      <form onSubmit={handleAddGame} className="bg-gray-800 p-4 rounded-xl mb-8 flex flex-col gap-3 border border-gray-700 shadow-lg">
        <input
          type="text"
          placeholder="Añadir nuevo juego..."
          value={newGameTitle}
          onChange={(e) => setNewGameTitle(e.target.value)}
          className="bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
          required
        />
        <div className="flex gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-gray-700 p-3 rounded-lg flex-1 text-white">
            <option>PS5</option>
            <option>PC</option>
            <option>Switch</option>
            <option>Xbox</option>
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-gray-700 p-3 rounded-lg flex-1 text-white">
            <option>Digital</option>
            <option>Físico</option>
          </select>
        </div>
        <button disabled={loading} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-lg shadow-purple-900/20">
          {loading ? "Buscando..." : <><Plus size={20} /> Añadir a la colección</>}
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg relative group border border-gray-700 flex flex-col h-full">
            {/* Imagen */}
            <div className="relative h-48 w-full">
                <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
                
                {/* Badge de Estado */}
                <div className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border
                  ${game.status === 'Completado' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 
                    game.status === 'Jugando' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 
                    'bg-gray-700/80 text-gray-300 border-gray-600'}`}>
                  {game.status}
                </div>

                 {/* Botones de Acción */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setEditingGame(game)}
                        className="bg-black/60 p-2 rounded-full text-white hover:bg-purple-600 transition-colors backdrop-blur-md"
                    >
                        <Pencil size={14} />
                    </button>
                    <button 
                        onClick={() => handleDelete(game.id)}
                        className="bg-black/60 p-2 rounded-full text-red-400 hover:bg-red-600 hover:text-white transition-colors backdrop-blur-md"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-2 flex-grow">
              <h3 className="font-bold text-sm leading-tight text-white">{game.title}</h3>
              
              <div className="flex justify-between items-end mt-auto text-xs text-gray-400">
                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{game.platform}</span>
                
                <div className="flex flex-col items-end gap-1">
                    {/* Nota de RAWG (Pequeña) */}
                    {game.rating > 0 && (
                        <span className="text-[10px] text-gray-500">
                            Metascore: {game.rating}
                        </span>
                    )}
                    {/* Tu Nota (Grande y destacada) */}
                    {game.user_rating ? (
                        <span className="text-yellow-400 font-bold flex items-center gap-1 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                           <Star size={10} fill="currentColor" /> {game.user_rating}
                        </span>
                    ) : (
                        <span className="text-gray-600 text-[10px]">Sin nota</span>
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingGame && (
        <EditModal 
            game={editingGame} 
            onClose={() => setEditingGame(null)} 
            onSave={handleUpdateGame} 
        />
      )}

    </main>
  );
}