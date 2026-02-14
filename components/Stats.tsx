"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Game = {
  platform: string;
  status: string;
};

export default function Stats({ games }: { games: Game[] }) {
  // 1. Calcular juegos por Plataforma
  const platformCounts = games.reduce((acc, game) => {
    acc[game.platform] = (acc[game.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformData = Object.entries(platformCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 2. Calcular juegos por Estado
  const statusCounts = games.reduce((acc, game) => {
    acc[game.status] = (acc[game.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Gráfico de Plataformas */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-200">Por Plataforma</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Estado */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-gray-200">Estado del Backlog</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" stroke="#888" hide />
              <YAxis dataKey="name" type="category" stroke="#888" width={100} fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}