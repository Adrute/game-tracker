"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Actualizamos la contraseña del usuario logueado (Supabase hace login automático al clicar el link del email)
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
    } else {
      setMessage("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
           <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Nueva Contraseña</h1>
        <p className="text-slate-400 text-sm mb-6">Introduce tu nueva contraseña para acceder.</p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="password" required placeholder="Nueva contraseña..."
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {message && (
             <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                {message.includes("Error") ? null : <CheckCircle2 size={16}/>} {message}
             </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
             {loading ? <Loader2 className="animate-spin"/> : "Confirmar Cambio"}
          </button>
        </form>
      </div>
    </div>
  );
}