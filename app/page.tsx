"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { fetchGameData } from "./actions";
import { Plus, Trash2, Gamepad2, Pencil, Calendar, Star, Search, Filter, ArrowUpDown, X } from "lucide-react"; 
import Stats from "@/components/Stats"; 
import EditModal from "@/components/EditModal"; 

// Tipos
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
  created_at: string;         // Necesario para ordenar
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  
  // Estado del Formulario
  const [showAddForm, setShowAddForm] = useState(false); // Para ocultar/mostrar el form
  const [newGameTitle, setNewGameTitle] = useState("");
  const [platform, setPlatform] = useState("PS5");
  const [format, setFormat] = useState("Digital");

  // ESTADOS DE FILTROS Y BUSQUEDA
  const [searchText, setSearchText] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest, rating, alphabetical

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

  // Lógica de Filtrado (Magic ✨)
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesPlatform = filterPlatform === "Todos" || game.platform === filterPlatform;
        const matchesStatus = filterStatus === "Todos" || game.status === filterStatus;
        return matchesSearch && matchesPlatform && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "rating": return (b.user_rating || 0) - (a.user_rating || 0); // Ordenar por TU nota
          case "az": return a.title.localeCompare(b.title);
          default: return 0;
        }
      });
  }, [games, searchText, filterPlatform, filterStatus, sortOrder]);

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
        user_rating: null 
      }
    ]);

    if (!error) {
      setNewGameTitle("");
      setShowAddForm(false); // Cerramos el form al terminar
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
    const { error } = await supabase.from("games").update(updatedGame).eq("id", updatedGame.id);
    if (!error) {
      fetchGames(); 
      setEditingGame(null); 
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      <header className="mb-6 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur z-20 py-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gamepad2 className="text-purple-500" /> My Games 
          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{games.length}</span>
        </h1>
        <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded-full shadow-lg transition-transform active:scale-95"
        >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </header>

      {/* Formulario Desplegable */}
      {showAddForm && (
        <form onSubmit={handleAddGame} className="bg-gray-800 p-4 rounded-xl mb-6 flex flex-col gap-3 border border-gray-700 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-sm text-purple-400">Añadir Nuevo Juego</h3>
            <input
            type="text"
            placeholder="Título del juego..."
            value={newGameTitle}
            onChange={(e) => setNewGameTitle(e.target.value)}
            className="bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-purple-500"
            required
            autoFocus
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
            <button disabled={loading} className="bg-white text-black hover:bg-gray-200 p-3 rounded-lg font-bold flex justify-center items-center gap-2">
            {loading ? "Buscando..." : "Guardar Juego"}
            </button>
        </form>
      )}

      {/* Estadísticas (Solo si no estamos filtrando) */}
      {searchText === "" && filterPlatform === "Todos" && filterStatus === "Todos" && games.length > 0 && (
          <div className="mb-6">
             <Stats games={games} />
          </div>
      )}

      {/* BARRA DE HERRAMIENTAS (Buscador y Filtros) */}
      <div className="sticky top-14 z-10 bg-gray-900/95 backdrop-blur pb-4 pt-2 space-y-3">
        
        {/* Buscador */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar en tu colección..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-purple-500 outline-none placeholder-gray-500"
            />
            {searchText && (
                <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    <X size={16} />
                </button>
            )}
        </div>

        {/* Filtros Horizontales (Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Filtro Estado */}
            <div className="flex items-center bg-gray-800 rounded-lg px-2 border border-gray-700 shrink-0">
                <Filter size={14} className="text-gray-400 mr-2"/>
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent py-2 text-sm text-white outline-none"
                >
                    <option value="Todos">Todos los Estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Jugando">Jugando</option>
                    <option value="Completado">Completado</option>
                    <option value="Abandonado">Abandonado</option>
                </select>
            </div>

            {/* Filtro Plataforma */}
            <div className="flex items-center bg-gray-800 rounded-lg px-2 border border-gray-700 shrink-0">
                <Gamepad2 size={14} className="text-gray-400 mr-2"/>
                <select 
                    value={filterPlatform} 
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="bg-transparent py-2 text-sm text-white outline-none"
                >
                    <option value="Todos">Todas las Plat.</option>
                    <option value="PS5">PS5</option>
                    <option value="PC">PC</option>
                    <option value="Switch">Switch</option>
                    <option value="Xbox">Xbox</option>
                </select>
            </div>

            {/* Ordenación */}
            <div className="flex items-center bg-gray-800 rounded-lg px-2 border border-gray-700 shrink-0">
                <ArrowUpDown size={14} className="text-gray-400 mr-2"/>
                <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-transparent py-2 text-sm text-white outline-none"
                >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguos</option>
                    <option value="rating">Mejor nota</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>
      </div>

      {/* Grid de Resultados */}
      {filteredGames.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
              <p>No se encontraron juegos con esos filtros.</p>
              <button onClick={() => {setSearchText(""); setFilterPlatform("Todos"); setFilterStatus("Todos")}} className="text-purple-400 underline mt-2">Limpiar filtros</button>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredGames.map((game) => (
            <div key={game.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg relative group border border-gray-700 flex flex-col h-full hover:border-purple-500/50 transition-colors">
                {/* Imagen */}
                <div className="relative h-36 md:h-48 w-full">
                    <img src={game.image_url} alt={game.title} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
                    
                    <div className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border
                    ${game.status === 'Completado' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 
                        game.status === 'Jugando' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 
                        'bg-gray-700/80 text-gray-300 border-gray-600'}`}>
                    {game.status}
                    </div>

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
                <div className="p-3 flex flex-col gap-1 flex-grow">
                <h3 className="font-bold text-sm leading-tight text-white line-clamp-2">{game.title}</h3>
                
                <div className="flex justify-between items-end mt-auto text-xs text-gray-400 pt-2">
                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{game.platform}</span>
                    
                    <div className="flex flex-col items-end gap-1">
                        {game.user_rating ? (
                            <span className="text-yellow-400 font-bold flex items-center gap-1 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                            <Star size={10} fill="currentColor" /> {game.user_rating}
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-600">--</span>
                        )}
                    </div>
                </div>
                </div>
            </div>
            ))}
          </div>
      )}

      {/* Modal */}
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