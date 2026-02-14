"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { Trophy, Gamepad2, Star, CalendarClock } from "lucide-react";

type Game = {
  id: number;
  status: string;
  platform: string;
  user_rating: number | null;
  finished_at: string | null;
};

export default function Stats({ games }: { games: Game[] }) {
  
  // --- 1. CÁLCULO DE KPIs ---
  const totalGames = games.length;
  const completedGames = games.filter(g => g.status === "Completado").length;
  const backlogGames = games.filter(g => g.status === "Pendiente" || g.status === "Jugando").length;
  
  // Nota media (solo de los que tienen nota tuya)
  const ratedGames = games.filter(g => g.user_rating);
  const avgRating = ratedGames.length > 0 
    ? (ratedGames.reduce((acc, g) => acc + (g.user_rating || 0), 0) / ratedGames.length).toFixed(1) 
    : "-";

  // --- 2. DATOS PARA GRÁFICAS ---

  // A. Juegos terminados por AÑO
  const gamesByYear = games
    .filter(g => g.status === "Completado" && g.finished_at)
    .reduce((acc, game) => {
      const year = new Date(game.finished_at!).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const yearData = Object.entries(gamesByYear)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name)); // Ordenar cronológicamente

  // B. Juegos terminados por MES (Del año actual o general)
  const gamesByMonth = games
  .filter(g => g.status === "Completado" && g.finished_at)
  .reduce((acc, game) => {
    // Obtenemos el nombre del mes (0 = Enero)
    const date = new Date(game.finished_at!);
    const month = date.toLocaleString('es-ES', { month: 'short' }); // "ene", "feb"...
    const monthIndex = date.getMonth(); 
    
    if (!acc[monthIndex]) {
        acc[monthIndex] = { name: month, value: 0, index: monthIndex };
    }
    acc[monthIndex].value += 1;
    return acc;
  }, {} as Record<number, {name: string, value: number, index: number}>);

  // Rellenar meses vacíos y ordenar
  const monthData = Array.from({ length: 12 }, (_, i) => {
    return gamesByMonth[i] || { 
        name: new Date(0, i).toLocaleString('es-ES', { month: 'short' }), 
        value: 0 
    };
  });


  // C. Estado Actual (Pie Chart)
  const statusCounts = games.reduce((acc, game) => {
    acc[game.status] = (acc[game.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusData = [
    { name: "Completado", value: statusCounts["Completado"] || 0, color: "#10B981" }, // Green
    { name: "Jugando", value: statusCounts["Jugando"] || 0, color: "#8B5CF6" },     // Purple
    { name: "Pendiente", value: statusCounts["Pendiente"] || 0, color: "#6B7280" },   // Gray
    { name: "Abandonado", value: statusCounts["Abandonado"] || 0, color: "#EF4444" }, // Red
  ].filter(d => d.value > 0);


  return (
    <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Tarjetas de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Gamepad2 />} title="Total Juegos" value={totalGames} color="text-blue-400" />
        <KpiCard icon={<Trophy />} title="Completados" value={completedGames} color="text-green-400" />
        <KpiCard icon={<CalendarClock />} title="Backlog" value={backlogGames} color="text-purple-400" />
        <KpiCard icon={<Star />} title="Nota Media" value={avgRating} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Gráfico Anual (Barras) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-sm font-bold mb-4 text-gray-400 uppercase tracking-wider">Juegos terminados por Año</h3>
          <div className="h-64 w-full">
            {yearData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearData}>
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40}>
                        {yearData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8B5CF6' : '#7C3AED'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center">
                    Marca juegos como "Completado" <br/> y ponles fecha para ver estadísticas.
                </div>
            )}
          </div>
        </div>

        {/* 3. Gráfico Estado (Circular) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-sm font-bold mb-4 text-gray-400 uppercase tracking-wider">Estado de la Colección</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

// Componente pequeño auxiliar para las tarjetas
function KpiCard({ icon, title, value, color }: { icon: any, title: string, value: string | number, color: string }) {
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center shadow-lg">
            <div className={`${color} mb-2 opacity-80`}>{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">{title}</div>
        </div>
    )
}