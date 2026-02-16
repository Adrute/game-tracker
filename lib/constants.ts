export const PLATFORMS = [
  "PC", "Steam Deck", "PS5", "PS4", "PS3", "PS2", "PS1", "PSP", "PS Vita",
  "Xbox Series", "Xbox One", "Xbox 360", "Xbox",
  "Switch", "Switch 2", "Wii U", "Wii", "GameCube", "N64", "SNES", "NES",
  "3DS", "DS", "GBA", "GBC", "Game Boy",
  "Dreamcast", "Mega Drive", "Saturn", "Master System",
  "Neo Geo", "Android", "iOS", "Mac", "Linux"
];

// Lista para los desplegables (Selects)
export const STATUSES = [
  "Pendiente",
  "Jugando",
  "Completado",
  "100%",
  "Empezado",
  "Deseado",
  "Abandonado"
];

// Mapa de colores centralizado (Badges)
// Si cambias un color aquí, cambia en TODA la app
export const STATUS_COLORS: Record<string, string> = {
  "100%": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Completado": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Jugando": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Empezado": "bg-sky-100 text-sky-700 border-sky-200",
  "Deseado": "bg-pink-100 text-pink-700 border-pink-200",
  "Abandonado": "bg-red-100 text-red-700 border-red-200",
  "Pendiente": "bg-gray-100 text-gray-600 border-gray-200",
  "default": "bg-gray-100 text-gray-600 border-gray-200"
};