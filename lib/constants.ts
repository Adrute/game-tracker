export const PLATFORMS = [
  "PC", "Steam Deck", "PS5", "PS4", "PS3", "PS2", "PS1", "PSP", "PS Vita",
  "Xbox Series", "Xbox One", "Xbox 360", "Xbox",
  "Switch", "Switch 2", "Wii U", "Wii", "GameCube", "N64", "SNES", "NES",
  "3DS", "DS", "GBA", "GBC", "Game Boy",
  "Dreamcast", "Mega Drive", "Saturn", "Master System",
  "Neo Geo", "Android", "iOS", "Mac", "Linux"
];

export const STATUSES = [
  "Pendiente",
  "Jugando",
  "Completado",
  "100%",
  "Atemporal",
  "Empezado",
  "Deseado",
  "Abandonado"
];

// Colores actualizados con soporte perfecto para Modo Oscuro
export const STATUS_COLORS: Record<string, string> = {
  "100%": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  "Completado": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  "Jugando": "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  "Atemporal": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  "Empezado": "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  "Deseado": "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  "Abandonado": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  "Pendiente": "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700",
  "default": "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700"
};