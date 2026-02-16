"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { searchGamesRAWG } from "./actions"; 
import { Plus, Trash2, Gamepad2, Search, X, Star, Loader2, LayoutGrid, Upload, List, Download, Disc, LogOut, ChevronLeft, ChevronRight } from "lucide-react"; 
import Link from "next/link"; 
import { useRouter } from "next/navigation"; 
import ImportModal from "@/components/ImportModal"; 
import MultiSelect from "@/components/MultiSelect"; 
import { PLATFORMS, STATUSES, STATUS_COLORS } from "@/lib/constants"; // Importamos todo

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
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
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

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterFormat, setFilterFormat] = useState("Todos");
  const [filterPlatforms, setFilterPlatforms] = useState<string[]>([]);

  useEffect(() => { fetchGames(); }, []);

  async function fetchGames() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase.from("games").select("*").order("created_at", { ascending: false });
    if (data) setGames(data);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Lógica de Filtrado
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = filterStatus === "Todos" || game.status === filterStatus;
        const matchesFormat = filterFormat === "Todos" || game.format === filterFormat;
        const matchesPlatform = filterPlatforms.length === 0 || filterPlatforms.includes(game.platform);
        return matchesSearch && matchesStatus && matchesFormat && matchesPlatform;
      });
  }, [games, searchText, filterStatus, filterFormat, filterPlatforms]);

  const exportCSV = () => {
    if (filteredGames.length === 0) return alert("No hay datos");
    const headers = ["ID", "Título", "Plataforma", "Formato", "Estado", "Nota"];
    const rows = filteredGames.map(g => [g.id, `"${g.title}"`, g.platform, g.format, g.status, g.user_rating || ""]);
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
    const { error } = await supabase.from("games").insert([{ title: selectedGame.name, platform, format, status: initialStatus, image_url: selectedGame.image_url, rating: selectedGame.rating, description: selectedGame.description, screenshots: selectedGame.screenshots, user_id: user.id }]);
    if (!error) { resetAddForm(); fetchGames(); } setLoading(false);
  }

  function resetAddForm() { setSearchQuery(""); setSearchResults([]); setSelectedGame(null); setIsAddModalOpen(false); setSearchPage(1); }
  
  async function handleDelete(id: number) { if(!confirm("¿Eliminar?")) return; await supabase.from("games").delete().eq("id", id); fetchGames(); }

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
                 <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18}/></button>
                    <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={18}/></button>
                </div>

                <button onClick={() => setIsImportModalOpen(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all" title="Importar CSV">
                    <Upload size={16} /> <span className="hidden sm:inline">Importar</span>
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
                    <Plus size={16} /> <span className="hidden sm:inline">Añadir</span>
                </button>
                <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all" title="Cerrar Sesión"><LogOut size={20} /></button>
            </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-8">
         <div className="flex flex-col lg:flex-row gap-4 mb-6 sticky top-20 z-20">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 shadow-sm outline-none"/></div>
            <div className="flex flex-wrap items-center gap-2">
                
                {/* FILTRO ESTADO UNIFICADO */}
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl text-sm border bg-white text-slate-600 cursor-pointer">
                    <option value="Todos">Estado: Todos</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="px-3 py-2 rounded-xl text-sm border bg-white text-slate-600 cursor-pointer"><option value="Todos">Formato: Todos</option><option value="Digital">Digital</option><option value="Físico">Físico</option></select>
                <MultiSelect options={PLATFORMS} selected={filterPlatforms} onChange={setFilterPlatforms} label="Plataformas" />
                <button onClick={exportCSV} className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl"><Download size={18}/></button>
            </div>
         </div>

         {viewMode === 'grid' ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredGames.map((game) => (
                    <div key={game.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                        <Link href={`/game/${game.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100">
                            <img src={game.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105"/>
                            <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-200 z-10">
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(game.id); }} className="bg-white/90 p-2 rounded-full shadow-md text-slate-700 hover:text-red-500 backdrop-blur-sm"><Trash2 size={14}/></button>
                            </div>
                        </Link>
                        <div className="p-4 flex flex-col gap-2 flex-grow">
                            <div className="flex justify-between items-start">
                                {/* BADGE DINÁMICO */}
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_COLORS[game.status] || STATUS_COLORS["default"]}`}>
                                    {game.status}
                                </span>
                            </div>
                            <Link href={`/game/${game.id}`} className="block">
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{game.title}</h3>
                            </Link>
                            <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1"><span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{game.platform}</span> {game.format === 'Físico' && <Disc size={12} className="text-slate-400"/>}</div>
                                {game.user_rating && (<span className="flex items-center gap-1 font-bold text-amber-500"><Star size={10} fill="currentColor"/> {game.user_rating}</span>)}
                            </div>
                        </div>
                    </div>
                ))}
             </div>
         ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4">Juego</th><th className="px-6 py-4">Plataforma</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
                    <tbody>
                        {filteredGames.map(g => (
                            <tr key={g.id} className="border-b hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-3 font-bold flex items-center gap-3">
                                    <img src={g.image_url} className="w-8 h-10 object-cover rounded bg-slate-200"/>
                                    <Link href={`/game/${g.id}`} className="hover:underline hover:text-emerald-600">{g.title}</Link>
                                </td>
                                <td className="px-6 py-3">{g.platform}</td>
                                <td className="px-6 py-3">
                                    {/* BADGE DINÁMICO TABLA */}
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_COLORS[g.status] || STATUS_COLORS["default"]}`}>
                                        {g.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button onClick={() => handleDelete(g.id)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </main>

      {/* MODAL AÑADIR */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <div className="bg-white w-full max-w-2xl rounded-2xl p-6 h-[80vh] flex flex-col shadow-2xl">
                <div className="flex justify-between mb-4 border-b pb-4"><h3 className="font-bold text-lg">Añadir Nuevo Juego</h3><button onClick={resetAddForm}><X/></button></div>
                <form onSubmit={(e) => handleSearch(e, 1)} className="mb-4 relative">
                    <input className="w-full border border-slate-200 bg-slate-50 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" autoFocus placeholder="Buscar título..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                </form>
                
                <div className="overflow-y-auto flex-1">
                    {!selectedGame && searchResults.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {searchResults.map(r => (
                                    <div key={r.id} onClick={()=>setSelectedGame(r)} className="p-2 border rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 flex gap-3 items-center">
                                        <img src={r.image_url} className="w-12 h-16 object-cover rounded-lg bg-slate-200"/>
                                        <div><p className="font-bold text-sm">{r.name}</p><p className="text-xs text-slate-500">{r.released}</p></div>
                                    </div>
                                ))}
                            </div>
                             {totalSearchPages > 1 && (<div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t"><button onClick={(e) => handleSearch(e, searchPage - 1)} disabled={searchPage === 1} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft/></button><span>{searchPage}</span><button onClick={(e) => handleSearch(e, searchPage + 1)} disabled={searchPage >= totalSearchPages} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight/></button></div>)}
                        </>
                    )}

                    {selectedGame && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6 animate-in slide-in-from-bottom-2">
                            <img src={selectedGame.image_url} className="w-32 h-44 object-cover rounded-lg shadow-md mx-auto sm:mx-0"/>
                            <div className="flex-1 space-y-4">
                                <h3 className="font-bold text-xl text-slate-900">{selectedGame.name}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Plataforma</label><select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-2 rounded-lg border bg-white">{PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
                                        <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value)} className="w-full p-2 rounded-lg border bg-white">
                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Formato</label><select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full p-2 rounded-lg border bg-white"><option>Digital</option><option>Físico</option></select></div>
                                </div>
                                <button onClick={handleSaveGame} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold mt-2">Guardar en Colección</button>
                            </div>
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