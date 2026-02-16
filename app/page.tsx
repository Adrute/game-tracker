"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { searchGamesRAWG } from "./actions"; 
import { Plus, Trash2, Gamepad2, Pencil, Search, X, Star, Check, Loader2, LayoutGrid, Upload, ChevronLeft, ChevronRight, List, Download, Disc } from "lucide-react"; 
import Link from "next/link"; 
import EditModal from "@/components/EditModal"; 
import ImportModal from "@/components/ImportModal"; 
import MultiSelect from "@/components/MultiSelect"; // Importamos el nuevo componente
import { PLATFORMS } from "@/lib/constants"; 

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
  description: string | null;
  screenshots: string[] | null;
};

type SearchResult = {
    id: number;
    name: string;
    image_url: string;
    rating: number;
    released: string;
    description?: string;
    screenshots?: string[];
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // Nuevo estado para la vista
  
  // Search Logic
  const [searchQuery, setSearchQuery] = useState(""); 
  const [isSearching, setIsSearching] = useState(false); 
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); 
  const [selectedGame, setSelectedGame] = useState<SearchResult | null>(null); 
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchPages, setTotalSearchPages] = useState(0);

  // Formulario final
  const [platform, setPlatform] = useState("PS5");
  const [format, setFormat] = useState("Digital");
  const [initialStatus, setInitialStatus] = useState("Pendiente"); 

  // --- FILTROS AVANZADOS ---
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterFormat, setFilterFormat] = useState("Todos"); // Nuevo filtro formato
  const [filterPlatforms, setFilterPlatforms] = useState<string[]>([]); // Nuevo filtro multi-plataforma

  useEffect(() => { fetchGames(); }, []);

  async function fetchGames() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; 

    const { data } = await supabase.from("games").select("*").order("created_at", { ascending: false });
    if (data) setGames(data);
    setLoading(false);
  }

  // --- LÓGICA FILTRADO ---
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = filterStatus === "Todos" || game.status === filterStatus;
        const matchesFormat = filterFormat === "Todos" || game.format === filterFormat;
        // Si el array de plataformas está vacío, mostramos todas. Si no, miramos si la plataforma del juego está en el array.
        const matchesPlatform = filterPlatforms.length === 0 || filterPlatforms.includes(game.platform);
        
        return matchesSearch && matchesStatus && matchesFormat && matchesPlatform;
      });
  }, [games, searchText, filterStatus, filterFormat, filterPlatforms]);

  // --- EXPORTAR A CSV ---
  const exportCSV = () => {
    if (filteredGames.length === 0) return alert("No hay datos para exportar");

    const headers = ["ID", "Título", "Plataforma", "Formato", "Estado", "Nota", "Inicio", "Fin"];
    const rows = filteredGames.map(g => [
        g.id, 
        `"${g.title.replace(/"/g, '""')}"`, // Escapar comillas en títulos
        g.platform, 
        g.format, 
        g.status, 
        g.user_rating || "", 
        g.started_at || "", 
        g.finished_at || ""
    ]);

    const csvContent = [
        headers.join(","), 
        ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "my_games_collection.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ... (Handlers handleSearch, handleSaveGame, handleDelete, etc. SE MANTIENEN IGUAL QUE ANTES) ...
  // Para ahorrar espacio asumo que copias las funciones lógicas del código anterior (handleSearch, handleSaveGame, handleDelete, handleUpdateGame)
  async function handleSearch(e: React.FormEvent, page: number = 1) {
    e.preventDefault(); if (!searchQuery.trim()) return; setIsSearching(true);
    if (page === 1) { setSearchResults([]); setSelectedGame(null); }
    setSearchPage(page);
    const { results, total } = await searchGamesRAWG(searchQuery, page);
    setSearchResults(results); setTotalSearchPages(Math.ceil(total / 20)); setIsSearching(false);
  }
  async function handleSaveGame() {
    if (!selectedGame) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("games").insert([{ 
        title: selectedGame.name, platform, format, status: initialStatus, image_url: selectedGame.image_url, rating: selectedGame.rating, description: selectedGame.description, screenshots: selectedGame.screenshots, user_id: user.id
    }]);
    if (!error) { resetAddForm(); fetchGames(); } setLoading(false);
  }
  function resetAddForm() { setSearchQuery(""); setSearchResults([]); setSelectedGame(null); setIsAddModalOpen(false); setSearchPage(1); }
  async function handleDelete(id: number) { if(!confirm("¿Eliminar?")) return; await supabase.from("games").delete().eq("id", id); fetchGames(); }
  async function handleUpdateGame(u: Partial<Game>) { if (!u.id) return; await supabase.from("games").update(u).eq("id", u.id); fetchGames(); setEditingGame(null); }

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
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-2 rounded-lg text-white"><Gamepad2 size={20} /></div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">MyGames</h1>
            </div>
            
            <div className="flex items-center gap-2">
                 {/* Toggle Vista */}
                 <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200 mr-2">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18}/></button>
                    <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={18}/></button>
                </div>

                <button onClick={() => setIsImportModalOpen(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all" title="Importar CSV">
                    <Upload size={16} /> <span className="hidden sm:inline">Importar</span>
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
                    <Plus size={16} /> <span className="hidden sm:inline">Añadir</span>
                </button>
            </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* BARRA DE HERRAMIENTAS (Search + Filtros + Exportar) */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 sticky top-20 z-20">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"/>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
                
                {/* Filtro Estado */}
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`px-3 py-2 rounded-xl text-sm font-medium border outline-none ${filterStatus !== 'Todos' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>
                    <option value="Todos">Estado: Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Jugando">Jugando</option>
                    <option value="Completado">Completado</option>
                    <option value="Deseado">Deseado</option>
                </select>

                {/* Filtro Formato */}
                <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className={`px-3 py-2 rounded-xl text-sm font-medium border outline-none ${filterFormat !== 'Todos' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>
                    <option value="Todos">Formato: Todos</option>
                    <option value="Digital">Digital</option>
                    <option value="Físico">Físico</option>
                </select>

                {/* Filtro Multi-Plataforma */}
                <MultiSelect 
                    options={PLATFORMS} 
                    selected={filterPlatforms} 
                    onChange={setFilterPlatforms} 
                    label="Plataformas" 
                />

                {/* Botón Exportar */}
                <button onClick={exportCSV} className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors ml-auto lg:ml-0" title="Exportar CSV">
                    <Download size={18} />
                </button>
            </div>
        </div>

        {/* VISTA GRID */}
        {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredGames.map((game) => (
                    <div key={game.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
                        <Link href={`/game/${game.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100">
                            <img src={game.image_url} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-200 z-10">
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingGame(game); }} className="bg-white/90 p-2 rounded-full shadow-md text-slate-700 hover:text-emerald-600 backdrop-blur-sm"><Pencil size={14}/></button>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(game.id); }} className="bg-white/90 p-2 rounded-full shadow-md text-slate-700 hover:text-red-500 backdrop-blur-sm"><Trash2 size={14}/></button>
                            </div>
                        </Link>
                        <div className="p-4 flex flex-col gap-2 flex-grow">
                            <div className="flex justify-between items-start">
                                <span className={getStatusBadge(game.status)}>{game.status}</span>
                            </div>
                            <Link href={`/game/${game.id}`} className="block">
                                <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">{game.title}</h3>
                            </Link>
                            <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1"><span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{game.platform}</span> {game.format === 'Físico' && <Disc size={12} className="text-slate-400"/>}</div>
                                {game.user_rating && (<span className="flex items-center gap-1 font-bold text-amber-500"><Star size={10} fill="currentColor"/> {game.user_rating}</span>)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* VISTA TABLA */}
        {viewMode === 'table' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Portada</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Plataforma</th>
                                <th className="px-6 py-4">Formato</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Nota</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGames.map((game) => (
                                <tr key={game.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-3 w-20">
                                        <img src={game.image_url} className="w-12 h-16 object-cover rounded-md shadow-sm bg-slate-200" />
                                    </td>
                                    <td className="px-6 py-3 font-bold text-slate-800">
                                        <Link href={`/game/${game.id}`} className="hover:text-emerald-600 hover:underline">{game.title}</Link>
                                    </td>
                                    <td className="px-6 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium text-xs">{game.platform}</span></td>
                                    <td className="px-6 py-3 text-slate-500">{game.format}</td>
                                    <td className="px-6 py-3"><span className={getStatusBadge(game.status)}>{game.status}</span></td>
                                    <td className="px-6 py-3 text-center font-bold text-amber-500">{game.user_rating || "-"}</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingGame(game)} className="p-2 hover:bg-white rounded-full text-slate-500 hover:text-emerald-600 shadow-sm border border-transparent hover:border-slate-200"><Pencil size={14}/></button>
                                            <button onClick={() => handleDelete(game.id)} className="p-2 hover:bg-white rounded-full text-slate-500 hover:text-red-500 shadow-sm border border-transparent hover:border-slate-200"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredGames.length === 0 && <div className="p-10 text-center text-slate-400">No se encontraron juegos con estos filtros</div>}
            </div>
        )}
      </main>

      {/* MODALES */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            {/* ... (Contenido del modal Añadir igual que antes, si quieres ahorrar espacio en la respuesta puedo omitirlo si ya lo tienes) ... */}
            {/* Para asegurar que funcione, te recomiendo mantener el modal de Añadir tal cual lo tenías en la versión anterior */}
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Search size={18} className="text-emerald-600"/> Añadir Nuevo Juego</h3>
                    <button onClick={resetAddForm} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={(e) => handleSearch(e, 1)} className="relative mb-6">
                        <input type="text" placeholder="Ej: Zelda..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-lg p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" autoFocus disabled={!!selectedGame}/>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                        {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500"/>}
                    </form>
                    {!selectedGame && searchResults.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {searchResults.map((game) => (
                                    <div key={game.id} onClick={() => setSelectedGame(game)} className="flex gap-3 p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 cursor-pointer items-center group">
                                        <img src={game.image_url} className="w-12 h-16 object-cover rounded-lg bg-slate-200"/>
                                        <div><p className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{game.name}</p><p className="text-xs text-slate-500">{game.released}</p></div>
                                    </div>
                                ))}
                            </div>
                            {totalSearchPages > 1 && (<div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-slate-100"><button onClick={(e) => handleSearch(e, searchPage - 1)} disabled={searchPage === 1}><ChevronLeft/></button><span>{searchPage}</span><button onClick={(e) => handleSearch(e, searchPage + 1)} disabled={searchPage >= totalSearchPages}><ChevronRight/></button></div>)}
                        </>
                    )}
                    {selectedGame && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6">
                            <img src={selectedGame.image_url} className="w-32 h-44 object-cover rounded-lg"/>
                            <div className="flex-1 space-y-4">
                                <h3 className="font-bold text-xl text-slate-900">{selectedGame.name}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="p-2 rounded-lg border">{PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                                    <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value)} className="p-2 rounded-lg border">
                                        <option value="Pendiente">Pendiente</option><option value="Jugando">Jugando</option><option value="Completado">Completado</option><option value="Deseado">Deseado</option>
                                    </select>
                                    <select value={format} onChange={(e) => setFormat(e.target.value)} className="p-2 rounded-lg border"><option>Digital</option><option>Físico</option></select>
                                </div>
                                <button onClick={handleSaveGame} disabled={loading} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">Guardar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {editingGame && <EditModal game={editingGame} onClose={() => setEditingGame(null)} onSave={handleUpdateGame} />}
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImportSuccess={() => { setIsImportModalOpen(false); fetchGames(); }} />}
    </div>
  );
}