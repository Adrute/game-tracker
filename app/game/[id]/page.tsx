"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Star, Gamepad2, CheckCircle2, Pencil, Trash2, Calendar, Disc } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CoverSearchModal from "@/components/CoverSearchModal";
import { PLATFORMS } from "@/lib/constants"; // Importa tus plataformas

// ... (Tipo Game igual que antes)
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
  notes: string | null;
  description: string | null;
  screenshots: string[] | null;
};

export default function GameDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [isCoverSearchOpen, setIsCoverSearchOpen] = useState(false);

  // ... (useEffect fetchGame IGUAL QUE ANTES) ...
  useEffect(() => {
    async function fetchGame() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        const { data } = await supabase.from("games").select("*").eq("id", id).single();
        if (data) { setGame(data); setNotes(data.notes || ""); }
        setLoading(false);
    }
    if (id) fetchGame();
  }, [id, router]);

  // FUNCIÓN GENÉRICA PARA ACTUALIZAR CAMPOS AL VUELO
  const updateField = async (field: keyof Game, value: any) => {
    if (!game) return;
    
    // 1. Actualización Optimista (UI instantánea)
    setGame(prev => prev ? ({ ...prev, [field]: value }) : null);

    // 2. Guardar en BD
    const { error } = await supabase.from("games").update({ [field]: value }).eq("id", game.id);
    if (error) {
        console.error("Error actualizando:", error);
        alert("Error al guardar cambio");
    }
  };

  // ... (saveNotes, handleCoverSelect, handleDelete IGUAL QUE ANTES) ...
  const saveNotes = async () => { if (!game) return; setSavingNotes(true); await supabase.from("games").update({ notes }).eq("id", game.id); setTimeout(() => setSavingNotes(false), 500); };
  const handleCoverSelect = async (url: string) => { if (!game) return; setGame({ ...game, image_url: url }); await supabase.from("games").update({ image_url: url }).eq("id", game.id); };
  const handleDelete = async () => { if (!game || !confirm("¿Borrar?")) return; await supabase.from("games").delete().eq("id", game.id); router.push("/"); };

  if (loading || !game) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400">Cargando...</div>;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      
      {/* HEADER IMAGEN (IGUAL) */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110" style={{ backgroundImage: `url(${game.image_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F8FAFC]"></div>
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-10">
            <Link href="/" className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-bold shadow-sm flex items-center gap-2"><ArrowLeft size={18} /> Volver</Link>
            <div className="flex gap-2">
                <button onClick={handleDelete} className="bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50"><Trash2 size={20} /></button>
                <button onClick={saveNotes} className="bg-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">{savingNotes ? <CheckCircle2 size={18}/> : <Save size={18} />} Guardar Notas</button>
            </div>
        </div>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div className="max-w-5xl mx-auto px-4 -mt-32 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-10 border-b border-slate-100">
                {/* PORTADA */}
                <div className="mx-auto md:mx-0 shrink-0 relative group">
                    <img src={game.image_url} className="w-48 md:w-56 aspect-[3/4] object-cover rounded-2xl shadow-2xl border-4 border-white bg-slate-200" />
                    <button onClick={() => setIsCoverSearchOpen(true)} className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-all"><Pencil size={16} /></button>
                </div>

                {/* INFO EDITABLE */}
                <div className="flex-1 text-center md:text-left space-y-4 pt-2">
                    <div>
                        {/* SELECTORES INTERACTIVOS */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-3">
                            <select 
                                value={game.status} 
                                onChange={(e) => updateField('status', e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border bg-slate-50 border-slate-200 cursor-pointer outline-none hover:bg-slate-100 focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Jugando">Jugando</option>
                                <option value="Completado">Completado</option>
                                <option value="Deseado">Deseado</option>
                            </select>

                            <select 
                                value={game.platform} 
                                onChange={(e) => updateField('platform', e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border bg-slate-50 border-slate-200 cursor-pointer outline-none hover:bg-slate-100 focus:ring-2 focus:ring-emerald-500"
                            >
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>

                             <select 
                                value={game.format} 
                                onChange={(e) => updateField('format', e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border bg-slate-50 border-slate-200 cursor-pointer outline-none hover:bg-slate-100 focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="Digital">Digital</option>
                                <option value="Físico">Físico</option>
                            </select>
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 leading-tight mb-2">{game.title}</h1>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        {/* NOTA EDITABLE */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tu Nota</p>
                            <div className="flex items-center justify-center md:justify-start gap-1">
                                <Star className="text-amber-400 fill-amber-400" size={18}/> 
                                <input 
                                    type="number" 
                                    min="0" max="10" step="0.5"
                                    value={game.user_rating || ""}
                                    onChange={(e) => updateField('user_rating', parseFloat(e.target.value))}
                                    className="bg-transparent font-bold text-xl w-12 text-slate-800 outline-none border-b border-transparent focus:border-emerald-500 text-center md:text-left"
                                    placeholder="-"
                                />
                            </div>
                        </div>

                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Metacritic</p>
                            <div className="text-xl font-bold text-slate-600 font-mono">{game.rating || "-"}</div>
                        </div>

                        {/* FECHAS EDITABLES */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Inicio</p>
                            <input 
                                type="date" 
                                value={game.started_at ? new Date(game.started_at).toISOString().split('T')[0] : ""}
                                onChange={(e) => updateField('started_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="bg-transparent text-sm font-bold text-slate-700 w-full outline-none cursor-pointer"
                            />
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fin</p>
                            <input 
                                type="date" 
                                value={game.finished_at ? new Date(game.finished_at).toISOString().split('T')[0] : ""}
                                onChange={(e) => updateField('finished_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="bg-transparent text-sm font-bold text-slate-700 w-full outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DESCRIPCIÓN Y NOTAS (IGUAL QUE ANTES) */}
            {game.description && <div className="p-6 border-b border-slate-100 bg-slate-50/30"><h3 className="font-bold text-slate-800 mb-2">Sinopsis</h3><p className="text-slate-600 text-sm whitespace-pre-line">{game.description}</p></div>}
            
            <div className="p-6 md:p-10 bg-white">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">📝 Notas Personales</h3>
                <textarea className="w-full min-h-[300px] bg-slate-50 p-6 rounded-2xl border border-slate-100 outline-none text-slate-700 resize-y focus:ring-2 focus:ring-emerald-500/20" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

        </div>
      </div>
      {isCoverSearchOpen && <CoverSearchModal onClose={() => setIsCoverSearchOpen(false)} onSelectCover={handleCoverSelect} />}
    </main>
  );
}