"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Gamepad2, Mail, Lock, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login'); // Manejamos 3 vistas
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (view === 'reset') {
        // 1. Lógica de Resetear Contraseña
        // IMPORTANTE: Cambia localhost:3000 por tu dominio cuando subas a producción
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        setMessage({ text: "Revisa tu email para restablecer la contraseña.", type: 'success' });
      } 
      else if (view === 'signup') {
        // 2. Registro
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: "¡Cuenta creada! Revisa tu email.", type: 'success' });
      } 
      else {
        // 3. Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Cabecera */}
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
          <div className="bg-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 text-white">
            <Gamepad2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {view === 'login' && "Bienvenido a MyGames"}
            {view === 'signup' && "Crea tu cuenta"}
            {view === 'reset' && "Recuperar Contraseña"}
          </h1>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required placeholder="ejemplo@correo.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {view !== 'reset' && (
              <div className="space-y-1 animate-in fade-in">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" required placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Link Olvidé contraseña */}
            {view === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => { setView('reset'); setMessage(null); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {view === 'login' && "Iniciar Sesión"}
                  {view === 'signup' && "Crear Cuenta"}
                  {view === 'reset' && "Enviar enlace"}
                  <ArrowRight size={18}/>
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Registro/Volver */}
          <div className="mt-6 text-center space-y-2">
            {view === 'reset' ? (
               <button onClick={() => { setView('login'); setMessage(null); }} className="text-sm text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-2 mx-auto">
                 <ArrowLeft size={16}/> Volver al login
               </button>
            ) : (
                <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setMessage(null); }} className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors">
                  {view === 'login' ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya tienes cuenta? Inicia Sesión"}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}