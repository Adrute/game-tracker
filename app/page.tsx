"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchGameData } from "./actions";
import { Plus, Trash2, Gamepad2 } from "lucide-react";
import Stats from "@/components/Stats";

// Tipos
type Game = {
  id: number;
  title: string;
  platform: string;
  format: string;
  status: string;
  image_url: string;
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del formulario
  const [newGameTitle, setNewGameTitle] = useState("");
  const [platform, setPlatform] = useState("PS5");
  const [format, setFormat] = useState("Digital");

  // Cargar juegos al iniciar
  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    const { data } = await supabase.from("games").select("*").order("created_at", { ascending: false });
    if (data) setGames(data);
    setLoading(false);
  }

  // Añadir juego
  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1. Buscar info en RAWG
    const rawgData = await fetchGameData(newGameTitle);
    const finalTitle = rawgData?.name || newGameTitle;
    const finalImage = rawgData?.image_url || "https://via.placeholder.com/300x200?text=No+Cover";

    // 2. Guardar en Supabase
    const { error } = await supabase.from("games").insert([
      { title: finalTitle, platform, format, status: "Pendiente", image_url: finalImage }
    ]);

    if (!error) {
      setNewGameTitle("");
      fetchGames(); // Recargar lista
    } else {
      alert("Error al guardar: " + error.message);
    }
    setLoading(false);
  }

  // Borrar juego
  async function handleDelete(id: number) {
    if(!confirm("¿Borrar juego?")) return;
    await supabase.from("games").delete().eq("id", id);
    fetchGames();
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 pb-20">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="text-purple-500" /> My Games
        </h1>
      </header>

      {games.length > 0 && <Stats games={games} />}

      {/* Formulario simple */}
      <form onSubmit={handleAddGame} className="bg-gray-800 p-4 rounded-xl mb-8 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Nombre del juego..."
          value={newGameTitle}
          onChange={(e) => setNewGameTitle(e.target.value)}
          className="bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
        <div className="flex gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-gray-700 p-3 rounded-lg flex-1">
            <option>PS5</option>
            <option>PC</option>
            <option>Switch</option>
            <option>Xbox</option>
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-gray-700 p-3 rounded-lg flex-1">
            <option>Digital</option>
            <option>Físico</option>
          </select>
        </div>
        <button disabled={loading} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg font-bold flex justify-center items-center gap-2">
          {loading ? "Cargando..." : <><Plus size={20} /> Añadir Juego</>}
        </button>
      </form>

      {/* Grid de Juegos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg relative group">
            <img src={game.image_url} alt={game.title} className="w-full h-40 object-cover" />
            <button 
                onClick={() => handleDelete(game.id)}
                className="absolute top-2 right-2 bg-red-600 p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 size={16} />
            </button>
            <div className="p-3">
              <h3 className="font-bold truncate">{game.title}</h3>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span className="bg-gray-700 px-2 py-1 rounded">{game.platform}</span>
                <span className={`px-2 py-1 rounded ${game.format === 'Físico' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                  {game.format}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}