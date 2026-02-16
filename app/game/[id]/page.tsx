"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Calendar, Clock, Star, Gamepad2, CheckCircle2, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
};

export default function GameDetail({ params }: { params: Promise<{ id: string }> }) {
  // Desempaquetamos los params (Next.js 15+)
  const { id } = use(params);
  
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function fetchGame() {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching game:", error);
        router.push("/");
      } else {
        setGame(data);
        setNotes(data.notes || "");
      }
      setLoading(false);
    }
    fetchGame();
  }, [id, router]);

  async function saveNotes() {
    setSavingNotes(true);
    const { error } = await supabase
      .from("games")
      .update({ notes: notes })
      .eq("id", id);
    
    if (error) alert("Error al guardar notas");
    
    // Simular un pequeño delay para que se vea el feedback
    setTimeout(() => setSavingNotes(false), 500);
  }

  // Helpers de estilo (mismos que en la home)
  const getStatusBadge = (status: string) => {
    const base = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm inline-flex items-center gap-1.5";
    switch (status) {
      case 'Completado': return `${base} bg-emerald-100 text-emerald-700 border-emerald-200`;
      case 'Jugando': return `${base} bg-indigo-100 text-indigo-700 border-indigo-200`;
      case 'Deseado': return `${base} bg-pink-100 text-pink-700 border-pink-200`;
      case 'Empezado': return `${base} bg-sky-100 text-sky-700 border-sky-200`;
      default: return `${base} bg-gray-100 text-gray-600 border-gray-200`;
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!game) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      
      {/* --- HEADER CON IMAGEN DE FONDO (BLUR) --- */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {/* Imagen de fondo desenfocada */}
        <div 
            className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-50"
            style={{ backgroundImage: `url(${game.image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F8FAFC]"></div>
        
        {/* Navbar Flotante */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-10">
            <Link 
                href="/" 
                className="bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 px-4 py-2 rounded-full font-bold shadow-sm transition-all flex items-center gap-2 hover:shadow-md border border-white/50"
            >
                <ArrowLeft size={18} /> <span className="hidden sm:inline">Volver</span>
            </Link>
            
            {/* Botón Guardar Notas Flotante (Visible en móvil) */}
            <button 
                onClick={saveNotes}
                className={`bg-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all active:scale-95 ${savingNotes ? 'opacity-80' : 'hover:bg-emerald-700'}`}
            >
                {savingNotes ? <CheckCircle2 size={18} className="animate-bounce"/> : <Save size={18} />}
                <span className="hidden sm:inline">{savingNotes ? "Guardado" : "Guardar Cambios"}</span>
            </button>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL (TARJETA FLOTANTE) --- */}
      <div className="max-w-5xl mx-auto px-4 -mt-32 relative z-20">
        
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            
            {/* Cabecera del Juego */}
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-10 border-b border-slate-100">
                {/* Portada */}
                <div className="mx-auto md:mx-0 shrink-0">
                    <img 
                        src={game.image_url} 
                        alt={game.title} 
                        className="w-48 md:w-56 aspect-[3/4] object-cover rounded-2xl shadow-2xl border-4 border-white ring-1 ring-slate-100 transform md:-mt-20 bg-slate-200"
                    />
                </div>

                {/* Info Principal */}
                <div className="flex-1 text-center md:text-left space-y-4 pt-2">
                    <div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                            <span className={getStatusBadge(game.status)}>{game.status}</span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                                <Gamepad2 size={12}/> {game.platform}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight mb-2">
                            {game.title}
                        </h1>
                        <p className="text-slate-400 font-medium text-lg">{game.format}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tu Nota</p>
                            <div className="text-2xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-1">
                                <Star className="text-amber-400 fill-amber-400" size={20}/> 
                                {game.user_rating || "-"}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Metacritic</p>
                            <div className="text-2xl font-bold text-slate-600 font-mono">
                                {game.rating || "-"}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Inicio</p>
                            <div className="text-sm font-bold text-slate-700 flex items-center justify-center md:justify-start gap-1 h-8">
                                <Calendar size={14} className="text-indigo-400"/>
                                {game.started_at ? new Date(game.started_at).toLocaleDateString() : "--"}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fin</p>
                            <div className="text-sm font-bold text-slate-700 flex items-center justify-center md:justify-start gap-1 h-8">
                                <CheckCircle2 size={14} className="text-emerald-500"/>
                                {game.finished_at ? new Date(game.finished_at).toLocaleDateString() : "--"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Notas (Estilo Editor de Texto) */}
            <div className="p-6 md:p-10 bg-slate-50/50 min-h-[400px]">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            📝 Diario de Juego & Notas
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                            {savingNotes ? "Guardando..." : "Los cambios se guardan manualmente"}
                        </span>
                    </div>
                    
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-indigo-100 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <textarea 
                            className="relative w-full min-h-[400px] bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 outline-none text-slate-700 leading-relaxed text-lg resize-y focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                            placeholder="Escribe aquí tu experiencia, trucos, contraseñas de niveles o qué te pareció el final..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                         <button 
                            onClick={saveNotes}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Save size={18} /> Guardar Notas
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </main>
  );
}