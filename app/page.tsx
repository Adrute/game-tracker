"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { searchGamesRAWG } from "./actions"; 
import { Plus, Trash2, Gamepad2, Pencil, Search, Filter, X, Star, Calendar, Check, Loader2, LayoutGrid } from "lucide-react"; 
import Link from "next/link"; 
import EditModal from "@/components/EditModal"; 
import { PLATFORMS } from "@/lib/constants"; 
import { useRouter } from "next/navigation";

// --- TIPOS ---
type Game = {
  id: number;
  title: string;
  platform: string;
  format: string;
  status: string;
  image_url: string;
  rating: number;             
  user_rating: number | null; 
  started_at: string | null;
  finished_at: string | null;
  created_at: string;         
  notes: string | null;
};

type SearchResult = {
    id: number;
    name: string;
    image_url: string;
    rating: number;
    released: string;
};

export default function Home() {
  // Datos
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales y UI
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  
  // Lógica de Añadir
  const [searchQuery, setSearchQuery] = useState(""); 
  const [isSearching, setIsSearching] = useState(false); 
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); 
  const [selectedGame, setSelectedGame] = useState<SearchResult | null>(null); 
  
  const [platform, setPlatform] = useState("PS5");
  const [format, setFormat] = useState("Digital");
  const [initialStatus, setInitialStatus] = useState("Pendiente"); 

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const router = useRouter();

  useEffect(() => { fetchGames(); }, []);

  async function fetchGames() {
    setLoading(true);
    
    // 1. Verificamos si hay usuario
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Si no hay usuario, mandamos al login
      router.push("/login");
      return;
    }

    // 2. Si hay usuario, pedimos SUS juegos
    const { data } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (data) setGames(data);
    setLoading(false);
  }

  // --- HANDLERS ---
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedGame(null); 
    const results = await searchGamesRAWG(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  }

  async function handleSaveGame() {
    if (!selectedGame) return;
    setLoading(true);

    // Obtenemos el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert("Debes iniciar sesión");
        router.push("/login");
        return;
    }

    const { error } = await supabase.from("games").insert([{ 
        title: selectedGame.name, 
        platform, 
        format, 
        status: initialStatus, 
        image_url: selectedGame.image_url || "https://via.placeholder.com/300x400", 
        rating: selectedGame.rating, 
        user_rating: null,
        user_id: user.id // <--- CLAVE: Vinculamos el juego al usuario
    }]);

    if (!error) {
      resetAddForm();
      fetchGames();
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  }

  function resetAddForm() {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedGame(null);
      setIsAddModalOpen(false);
  }

  async function handleDelete(id: number) {
    if(!confirm("¿Eliminar este juego de tu colección?")) return;
    await supabase.from("games").delete().eq("id", id);
    fetchGames();
  }

  async function handleUpdateGame(updatedGame: Partial<Game>) {
    if (!updatedGame.id) return;
    const { error } = await supabase.from("games").update(updatedGame).eq("id", updatedGame.id);
    if (!error) { fetchGames(); setEditingGame(null); }
  }

  // Filtrado
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = filterStatus === "Todos" || game.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
  }, [games, searchText, filterStatus]);

  // Colores de estado (Estilo Badge Sutil)
  const getStatusBadge = (status: string) => {
    const base = "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm";
    switch (status) {
      case 'Completado': return `${base} bg-emerald-100 text-emerald-700 border-emerald-200`;
      case 'Jugando': return `${base} bg-indigo-100 text-indigo-700 border-indigo-200`;
      case 'Deseado': return `${base} bg-pink-100 text-pink-700 border-pink-200`;
      case 'Empezado': return `${base} bg-sky-100 text-sky-700 border-sky-200`;
      default: return `${base} bg-gray-100 text-gray-600 border-gray-200`;
    }
  };

  

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-2 rounded-lg text-white">
                    <Gamepad2 size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">MyGames</h1>
            </div>
            
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
                <Plus size={16} /> <span className="hidden sm:inline">Añadir Juego</span>
            </button>
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Estadísticas Rápidas (Estilo Banner) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total" value={games.length} icon={<LayoutGrid size={18}/>} />
            <StatCard label="Completados" value={games.filter(g => g.status === 'Completado').length} icon={<Check size={18} className="text-emerald-500"/>} />
            <StatCard label="Jugando" value={games.filter(g => g.status === 'Jugando').length} icon={<Gamepad2 size={18} className="text-indigo-500"/>} />
            <StatCard label="Wishlist" value={games.filter(g => g.status === 'Deseado').length} icon={<Star size={18} className="text-pink-500"/>} />
        </div>

        {/* Barra de Herramientas (Search & Filter) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-20 z-20">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar en tu colección..." 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {["Todos", "Jugando", "Pendiente", "Completado", "Deseado"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                            filterStatus === status 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* GRID DE JUEGOS */}
        {filteredGames.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <Gamepad2 size={48} className="mx-auto mb-4 text-slate-300"/>
                <p>No se encontraron juegos</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredGames.map((game) => (
                    <div key={game.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
                        <Link href={`/game/${game.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100">
                            <img 
                                src={game.image_url} 
                                alt={game.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            {/* Gradiente sutil para texto */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                            
                            {/* Botones de acción flotantes (Solo hover) */}
                            <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-200">
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingGame(game); }}
                                    className="bg-white/90 p-2 rounded-full shadow-md text-slate-700 hover:text-emerald-600 backdrop-blur-sm"
                                >
                                    <Pencil size={14}/>
                                </button>
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(game.id); }}
                                    className="bg-white/90 p-2 rounded-full shadow-md text-slate-700 hover:text-red-500 backdrop-blur-sm"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </Link>
                        
                        <div className="p-4 flex flex-col gap-2 flex-grow">
                            <div className="flex justify-between items-start">
                                <span className={getStatusBadge(game.status)}>{game.status}</span>
                            </div>
                            
                            <Link href={`/game/${game.id}`} className="block">
                                <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                    {game.title}
                                </h3>
                            </Link>

                            <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{game.platform}</span>
                                {game.user_rating && (
                                    <span className="flex items-center gap-1 font-bold text-amber-500">
                                        <Star size={10} fill="currentColor"/> {game.user_rating}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* --- MODAL AÑADIR JUEGO (Overlay) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Search size={18} className="text-emerald-600"/> Añadir Nuevo Juego
                    </h3>
                    <button onClick={resetAddForm} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Buscador */}
                    <form onSubmit={handleSearch} className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Ej: The Last of Us..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-lg p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            autoFocus
                            disabled={!!selectedGame}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500"/>}
                    </form>

                    {/* Resultados Búsqueda */}
                    {!selectedGame && searchResults.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    )}

                    {/* Confirmación Selección */}
                    {selectedGame && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6 animate-in slide-in-from-bottom-2">
                            <img src={selectedGame.image_url} className="w-32 h-44 object-cover rounded-lg shadow-lg mx-auto sm:mx-0"/>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900">{selectedGame.name}</h3>
                                    <p className="text-sm text-emerald-600 font-medium">¡Selección confirmada!</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Plataforma</label>
                                        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
                                        <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value)} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Deseado">Deseado</option>
                                            <option value="Jugando">Jugando</option>
                                            <option value="Completado">Completado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setSelectedGame(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100">
                                        Cambiar
                                    </button>
                                    <button onClick={handleSaveGame} disabled={loading} className="flex-[2] px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                                        {loading ? "Guardando..." : "Guardar en Colección"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingGame && (
        <EditModal 
            game={editingGame} 
            onClose={() => setEditingGame(null)} 
            onSave={handleUpdateGame} 
        />
      )}
    </div>
  );
}

// Componente pequeño para las Stats
function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                {icon}
            </div>
        </div>
    )
}