"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { searchGamesRAWG } from "./actions"; 
import { Plus, Trash2, Gamepad2, Search, X, Star, Loader2, LayoutGrid, Upload, List, Download, Disc, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, ListOrdered, Puzzle } from "lucide-react"; 
import Link from "next/link"; 
import { useRouter } from "next/navigation"; 
import ImportModal from "@/components/ImportModal"; 
import MultiSelect from "@/components/MultiSelect"; 
import Dashboard from "@/components/Dashboard";
import QueueView from "@/components/QueueView";
import { ThemeToggle } from "@/components/ThemeToggle"; 
import LoadingSpinner from "@/components/LoadingSpinner";
import { PLATFORMS, STATUSES, STATUS_COLORS } from "@/lib/constants";

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
  play_order?: number;
  is_hidden_in_queue?: boolean;
  parent_id?: number | null;
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
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'dashboard' | 'queue'>('grid');
  
  const [searchQuery, setSearchQuery] = useState(""); 
  const [isSearching, setIsSearching] = useState(false); 
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); 
  const [selectedGame, setSelectedGame] = useState<SearchResult | null>(null); 
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchPages, setTotalSearchPages] = useState(0);

  const [platform, setPlatform] = useState("PS5");
  const [format, setFormat] = useState("Digital");
  const [initialStatus, setInitialStatus] = useState("Pendiente"); 
  
  const [isDlc, setIsDlc] = useState(false);
  const [parentId, setParentId] = useState<number | "">("");
  
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterFormat, setFilterFormat] = useState("Todos");
  
  const [filterStatus, setFilterStatus] = useState<string[]>([]); 
  const [filterPlatforms, setFilterPlatforms] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState("date_desc"); 

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { fetchGames(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterStatus, filterFormat, filterPlatforms, sortBy]);

  async function fetchGames() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase.from("games").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setGames(data);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredGames = useMemo(() => {
    let result = games.filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(game.status);
        const matchesPlatform = filterPlatforms.length === 0 || filterPlatforms.includes(game.platform);
        const matchesFormat = filterFormat === "Todos" || game.format === filterFormat;
        return matchesSearch && matchesStatus && matchesFormat && matchesPlatform;
    });

    result.sort((a, b) => {
        if (sortBy === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === "title_asc") return a.title.localeCompare(b.title);
        if (sortBy === "title_desc") return b.title.localeCompare(a.title);
        if (sortBy === "rating_desc") return (b.user_rating || 0) - (a.user_rating || 0);
        return 0;
    });

    return result;
  }, [games, searchText, filterStatus, filterFormat, filterPlatforms, sortBy]);

  const isActivelyFiltering = searchText.trim() !== "" || filterStatus.length > 0 || filterFormat !== "Todos" || filterPlatforms.length > 0;
  
  const gamesToPaginate = isActivelyFiltering 
    ? filteredGames 
    : filteredGames.filter(g => !g.parent_id);

  const totalPages = Math.ceil(gamesToPaginate.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentGamesToShow = gamesToPaginate.slice(indexOfFirstItem, indexOfLastItem);

  const exportCSV = () => {
    if (filteredGames.length === 0) return alert("No hay datos");
    const headers = ["ID", "Título", "Plataforma", "Formato", "Estado", "Nota", "Es DLC"];
    const rows = filteredGames.map(g => [g.id, `"${g.title}"`, g.platform, g.format, g.status, g.user_rating || "", g.parent_id ? "Sí" : "No"]);
    const csv = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", "games.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  async function handleSearch(e: React.FormEvent, page: number = 1) {
    e.preventDefault(); if (!searchQuery.trim()) return; setIsSearching(true);
    if (page === 1) { setSearchResults([]); setSelectedGame(null); }
    setSearchPage(page);
    const { results, total } = await searchGamesRAWG(searchQuery, page);
    setSearchResults(results); setTotalSearchPages(Math.ceil(total / 20)); setIsSearching(false);
  }

  async function handleSaveGame() {
    if (!selectedGame) return; setLoading(true);
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    
    const finalParentId = isDlc && parentId !== "" ? parentId : null;

    const { error } = await supabase.from("games").insert([{ 
      title: selectedGame.name, platform, format, status: initialStatus, 
      image_url: selectedGame.image_url, rating: selectedGame.rating, 
      description: selectedGame.description, screenshots: selectedGame.screenshots, 
      user_id: user.id, parent_id: finalParentId 
    }]);

    if (!error) { resetAddForm(); fetchGames(); } setLoading(false);
  }

  function resetAddForm() { 
    setSearchQuery(""); setSearchResults([]); setSelectedGame(null); 
    setIsAddModalOpen(false); setSearchPage(1); setIsDlc(false); setParentId("");
    setParentSearchQuery(""); setShowParentDropdown(false);
  }
  
  async function handleDelete(id: number) { if(!confirm("¿Eliminar? Si es un juego base, sus DLCs también se borrarán.")) return; await supabase.from("games").delete().eq("id", id); fetchGames(); }

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={20} /></button>
        </div>
    );
  };

  const availableBaseGames = games.filter(g => !g.parent_id);
  const filteredBaseGamesForDropdown = availableBaseGames.filter(g => 
    g.title.toLowerCase().includes(parentSearchQuery.toLowerCase())
  );

  // CLASE COMPARTIDA PARA UNIFICAR ESTILOS DE SELECTORES
  const filterSelectClass = "h-[38px] px-3 py-1.5 rounded-xl text-sm font-medium border bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer outline-none transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {loading && <LoadingSpinner />}

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg text-white">
                    <Gamepad2 size={20} className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white hidden sm:block">
                    MyGames
                </h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                    <button onClick={() => setViewMode('grid')} className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Cuadrícula"><LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                    <button onClick={() => setViewMode('table')} className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Lista"><List size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                    <button onClick={() => setViewMode('dashboard')} className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Estadísticas"><LayoutDashboard size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                    <button onClick={() => setViewMode('queue')} className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'queue' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Cola de Pendientes"><ListOrdered size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                </div>

                <ThemeToggle />

                <button onClick={() => setIsImportModalOpen(true)} className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm" title="Importar CSV">
                    <Upload size={16} /> <span className="hidden sm:inline text-sm font-bold">Importar</span>
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
                    <Plus size={16} /> <span className="hidden sm:inline text-sm font-bold">Añadir</span>
                </button>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all" title="Cerrar Sesión"><LogOut size={18} /></button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
         <div className="flex flex-col lg:flex-row gap-4 mb-6 sticky top-20 z-20">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    type="text" placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)} 
                    className="h-[38px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white transition-colors text-sm"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={filterSelectClass}>
                    <option value="date_desc">🕒 Más recientes</option>
                    <option value="date_asc">⏳ Más antiguos</option>
                    <option value="title_asc">🔤 Título (A-Z)</option>
                    <option value="title_desc">🔠 Título (Z-A)</option>
                    <option value="rating_desc">⭐ Mejor valorados</option>
                </select>
                
                <MultiSelect options={STATUSES} selected={filterStatus} onChange={setFilterStatus} label="Estados" />
                
                <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className={filterSelectClass}>
                    <option value="Todos">Formato: Todos</option>
                    <option value="Digital">Digital</option>
                    <option value="Físico">Físico</option>
                </select>
                
                <MultiSelect options={PLATFORMS} selected={filterPlatforms} onChange={setFilterPlatforms} label="Plataformas" />
                
                {/* Botón de exportar cuadrado perfecto y alineado */}
                <button onClick={exportCSV} className="h-[38px] px-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center shadow-sm">
                    <Download size={18}/>
                </button>
            </div>
         </div>

         {viewMode === 'grid' && (
             <>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {currentGamesToShow.map((game) => {
                        const gameDlcs = !isActivelyFiltering ? games.filter(d => d.parent_id === game.id) : [];
                        return (
                        <div key={game.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300">
                            <Link href={`/game/${game.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img src={game.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105"/>
                                <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-200 z-10">
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(game.id); }} className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-md text-slate-700 dark:text-slate-300 hover:text-red-500 backdrop-blur-sm"><Trash2 size={14}/></button>
                                </div>
                            </Link>
                            <div className="p-4 flex flex-col gap-2 flex-grow">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_COLORS[game.status] || STATUS_COLORS["default"]}`}>
                                        {game.status}
                                    </span>
                                </div>
                                <Link href={`/game/${game.id}`} className="block">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {game.parent_id && isActivelyFiltering && <Puzzle size={12} className="inline mr-1 text-indigo-500" />}
                                        {game.title}
                                    </h3>
                                </Link>
                                
                                {gameDlcs.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {gameDlcs.map(dlc => (
                                            <Link href={`/game/${dlc.id}`} key={dlc.id} className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 truncate max-w-full transition-colors">
                                                <Puzzle size={10} /> <span className="truncate">{dlc.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">{game.platform}</span> {game.format === 'Físico' && <Disc size={12} className="text-slate-400"/>}</div>
                                    {game.user_rating && (<span className="flex items-center gap-1 font-bold text-amber-500"><Star size={10} fill="currentColor"/> {game.user_rating}</span>)}
                                </div>
                            </div>
                        </div>
                    )})}
                 </div>
                 <PaginationControls />
             </>
         )}

         {viewMode === 'table' && (
            <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"><tr><th className="px-6 py-4">Juego</th><th className="px-6 py-4">Plataforma</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentGamesToShow.map(g => {
                                const gameDlcs = !isActivelyFiltering ? games.filter(d => d.parent_id === g.id) : [];
                                return (
                                <React.Fragment key={g.id}>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-slate-700 dark:text-slate-300">
                                        <td className="px-6 py-3 font-bold flex items-center gap-3">
                                            <img src={g.image_url} className="w-8 h-10 object-cover rounded bg-slate-200 dark:bg-slate-700"/>
                                            <Link href={`/game/${g.id}`} className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                {g.parent_id && isActivelyFiltering && <Puzzle size={14} className="text-indigo-500" />}
                                                {g.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3">{g.platform}</td>
                                        <td className="px-6 py-3"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_COLORS[g.status] || STATUS_COLORS["default"]}`}>{g.status}</span></td>
                                        <td className="px-6 py-3 text-right"><button onClick={() => handleDelete(g.id)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></td>
                                    </tr>
                                    {gameDlcs.map(dlc => (
                                        <tr key={dlc.id} className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-slate-600 dark:text-slate-400 text-xs">
                                            <td className="px-6 py-2 pl-16 flex items-center gap-2">
                                                <div className="w-3 h-3 border-l-2 border-b-2 border-slate-300 dark:border-slate-600 rounded-bl-sm mb-1"></div>
                                                <Puzzle size={12} className="text-indigo-500" />
                                                <Link href={`/game/${dlc.id}`} className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400">{dlc.title}</Link>
                                            </td>
                                            <td className="px-6 py-2">{dlc.platform}</td>
                                            <td className="px-6 py-2"><span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${STATUS_COLORS[dlc.status] || STATUS_COLORS["default"]}`}>{dlc.status}</span></td>
                                            <td className="px-6 py-2 text-right"><button onClick={() => handleDelete(dlc.id)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
                <PaginationControls />
            </>
         )}

         {viewMode === 'dashboard' && <Dashboard games={filteredGames} />}
         {viewMode === 'queue' && <QueueView games={games} onUpdate={fetchGames} />}
      </main>

      {/* MODAL AÑADIR JUEGO */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Añadir Nuevo Juego</h3>
                    <button onClick={resetAddForm} className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full"><X/></button>
                </div>
                <form onSubmit={(e) => handleSearch(e, 1)} className="mb-4 relative">
                    <input className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 pl-10 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-colors" autoFocus placeholder="Buscar título..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" size={18} />}
                </form>
                
                <div className="overflow-y-auto flex-1">
                    {!selectedGame && searchResults.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {searchResults.map(r => (
                                    <div key={r.id} onClick={()=>setSelectedGame(r)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 flex gap-3 items-center group">
                                        <img src={r.image_url} className="w-12 h-16 object-cover rounded-lg bg-slate-200 dark:bg-slate-700"/>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{r.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{r.released}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             {totalSearchPages > 1 && (<div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><button onClick={(e) => handleSearch(e, searchPage - 1)} disabled={searchPage === 1} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><ChevronLeft/></button><span className="text-slate-600 dark:text-slate-300">{searchPage}</span><button onClick={(e) => handleSearch(e, searchPage + 1)} disabled={searchPage >= totalSearchPages} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><ChevronRight/></button></div>)}
                        </>
                    )}

                    {selectedGame && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-6 animate-in slide-in-from-bottom-2">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <img src={selectedGame.image_url} className="w-32 h-44 object-cover rounded-lg shadow-md mx-auto sm:mx-0"/>
                                <div className="flex-1 space-y-4">
                                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{selectedGame.name}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Plataforma</label><select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">{PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
                                            <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Formato</label><select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"><option>Digital</option><option>Físico</option></select></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={isDlc} onChange={(e) => { setIsDlc(e.target.checked); if (!e.target.checked) { setParentId(""); setParentSearchQuery(""); setShowParentDropdown(false); } }} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Es una expansión / DLC</span>
                                </label>
                                
                                {isDlc && (
                                    <div className="animate-in fade-in slide-in-from-top-2 relative">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Juego Base al que pertenece</label>
                                        <input 
                                            type="text" 
                                            placeholder="Escribe para buscar tu juego base..." 
                                            value={parentSearchQuery}
                                            onChange={(e) => {
                                                setParentSearchQuery(e.target.value);
                                                setParentId(""); 
                                                setShowParentDropdown(true);
                                            }}
                                            onFocus={() => setShowParentDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowParentDropdown(false), 200)}
                                            className="w-full p-2 pl-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        
                                        {showParentDropdown && (
                                            <div className="absolute z-10 w-full mt-1 max-h-40 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                                                {filteredBaseGamesForDropdown.length > 0 ? (
                                                    filteredBaseGamesForDropdown.map(g => (
                                                        <div 
                                                            key={g.id} 
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); 
                                                                setParentId(g.id);
                                                                setParentSearchQuery(g.title);
                                                                setShowParentDropdown(false);
                                                            }}
                                                            className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                                        >
                                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{g.title}</div>
                                                            <div className="text-xs text-slate-500">{g.platform}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-slate-500 italic text-center">No se han encontrado juegos base</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleSaveGame} disabled={loading || (isDlc && parentId === "")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                {isDlc && parentId === "" ? "Selecciona un juego base..." : "Guardar en Colección"}
                            </button>
                        </div>
                    )}
                </div>
             </div>
          </div>
      )}
      
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImportSuccess={() => { setIsImportModalOpen(false); fetchGames(); }} />}
    </div>
  );
}