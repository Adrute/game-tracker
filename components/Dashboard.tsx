"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import { Trophy, Gamepad2, Star, Disc, Layers } from "lucide-react";
import { useTheme } from "next-themes"; // <--- Importamos para detectar tema

// Colores para las gráficas
const COLORS = ['#059669', '#4F46E5', '#D97706', '#DB2777', '#0891B2', '#DC2626'];

export default function Dashboard({ games }: { games: any[] }) {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Evitar errores de hidratación con las gráficas
  useEffect(() => { setIsMounted(true); }, []);

  // --- CONFIGURACIÓN DE COLORES SEGÚN TEMA ---
  const chartColors = {
      text: theme === 'dark' ? '#94a3b8' : '#64748b', // slate-400 vs slate-500
      grid: theme === 'dark' ? '#334155' : '#e2e8f0', // slate-700 vs slate-200
      tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
      tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
      tooltipText: theme === 'dark' ? '#f1f5f9' : '#1e293b',
  };

  // --- CÁLCULOS ESTADÍSTICOS (Igual que antes) ---
  const stats = useMemo(() => {
    const total = games.length;
    const completed = games.filter(g => g.status === 'Completado' || g.status === '100%').length;
    const ratedGames = games.filter(g => g.user_rating > 0);
    const avgRating = ratedGames.length > 0 
      ? (ratedGames.reduce((acc, curr) => acc + curr.user_rating, 0) / ratedGames.length).toFixed(1) 
      : "0";
    const physical = games.filter(g => g.format === 'Físico').length;
    const digital = games.filter(g => g.format === 'Digital').length;
    return { total, completed, avgRating, physical, digital };
  }, [games]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    games.forEach(g => { counts[g.status] = (counts[g.status] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [games]);

  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    games.forEach(g => { counts[g.platform] = (counts[g.platform] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [games]);

  const ratingData = useMemo(() => {
    const counts = Array(11).fill(0);
    games.forEach(g => {
      if (g.user_rating) {
        const rounded = Math.round(g.user_rating);
        if (rounded >= 0 && rounded <= 10) counts[rounded]++;
      }
    });
    return counts.map((count, score) => ({ score: score.toString(), count }));
  }, [games]);

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- TARJETAS KPI --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Juegos" value={stats.total} icon={<Layers size={20} className="text-slate-500 dark:text-slate-400"/>} />
        <StatCard title="Completados" value={stats.completed} sub={`${Math.round((stats.completed/stats.total)*100 || 0)}%`} icon={<Trophy size={20} className="text-amber-500"/>} />
        <StatCard title="Nota Media" value={stats.avgRating} icon={<Star size={20} className="text-emerald-500"/>} />
        <StatCard title="Físico vs Digital" value={`${stats.physical} / ${stats.digital}`} icon={<Disc size={20} className="text-indigo-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- DONUT --- */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Estado de la Colección</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={theme === 'dark' ? '#0f172a' : '#fff'} />))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipText, borderRadius: '12px' }} itemStyle={{ color: chartColors.tooltipText }}/>
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- BARRAS --- */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Plataformas Favoritas</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: chartColors.text}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipText, borderRadius: '12px' }}/>
                        <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- ÁREA --- */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-1 lg:col-span-2 transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Tu Curva de Calidad</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratingData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="score" tick={{fill: chartColors.text}} />
                        <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, color: chartColors.tooltipText, borderRadius: '12px' }}/>
                        <Area type="monotone" dataKey="count" stroke="#10B981" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
            <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h4>
                    {sub && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{sub}</span>}
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">{icon}</div>
        </div>
    )
}