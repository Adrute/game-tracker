"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Gamepad2, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login y Registro
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: "¡Cuenta creada! Revisa tu email para confirmar.", type: 'success' });
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/"); // Redirigir a la home si todo sale bien
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bienvenido a MyGames</h1>
          <p className="text-slate-400 text-sm mt-2">Tu colección personal de videojuegos</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Mensajes de Error/Éxito */}
            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>{isSignUp ? "Crear Cuenta" : "Iniciar Sesión"} <ArrowRight size={18}/></>
              )}
            </button>
          </form>

          {/* Toggle Login/Registro */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors"
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate gratis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}