"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { Trophy, Gamepad2, Star, Calendar, Activity } from "lucide-react";

export default function Stats({ games }: { games: any[] }) {
  
  // Cálculos básicos
  const total = games.length;
  const completed = games.filter(g => g.status === "Completado").length;
  const backlog = games.filter(g => ["Pendiente", "Jugando"].includes(g.status)).length;
  const ratedGames = games.filter(g => g.user_rating);
  const avg = ratedGames.length > 0 
    ? (ratedGames.reduce((a, b) => a + (b.user_rating || 0), 0) / ratedGames.length).toFixed(1) 
    : "-";

  // Datos para Gráficas
  const byYear = games.filter(g => g.status === "Completado" && g.finished_at).reduce((acc: any, g) => {
      const y = new Date(g.finished_at).getFullYear();
      acc[y] = (acc[y] || 0) + 1;
      return acc;
  }, {});
  const yearData = Object.entries(byYear).map(([name, value]) => ({ name, value }));

  const statusCounts = games.reduce((acc: any, g) => { acc[g.status] = (acc[g.status] || 0) + 1; return acc; }, {});
  const pieData = [
    { name: "Completado", value: statusCounts["Completado"] || 0, color: "#22c55e" }, // Green
    { name: "Jugando", value: statusCounts["Jugando"] || 0, color: "#8b5cf6" },     // Violet
    { name: "Pendiente", value: statusCounts["Pendiente"] || 0, color: "#9ca3af" },   // Gray
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 mb-8">
      {/* KPIs: Tarjetas Blancas Simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-blue-500 mb-1"><Gamepad2 /></div>
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Total</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-green-500 mb-1"><Trophy /></div>
            <div className="text-2xl font-bold text-gray-800">{completed}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Completados</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-purple-500 mb-1"><Calendar /></div>
            <div className="text-2xl font-bold text-gray-800">{backlog}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Backlog</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-yellow-500 mb-1"><Star /></div>
            <div className="text-2xl font-bold text-gray-800">{avg}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Nota Media</div>
        </div>
      </div>

      {/* Gráficas en Panel Blanco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
           <p className="text-xs font-bold text-gray-400 uppercase mb-4">Por Año</p>
           <ResponsiveContainer width="100%" height="80%">
             <BarChart data={yearData}>
               <XAxis dataKey="name" fontSize={12} stroke="#9ca3af"/>
               <Bar dataKey="value" fill="#22c55e" radius={[4,4,0,0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
           <p className="text-xs font-bold text-gray-400 uppercase mb-4">Estado</p>
           <ResponsiveContainer width="100%" height="80%">
             <PieChart>
               <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={5}>
                 {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
               </Pie>
               <Legend verticalAlign="bottom" height={36} iconType="circle"/>
             </PieChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}