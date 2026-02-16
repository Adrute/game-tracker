"use server";

export async function searchGamesRAWG(query: string) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("Falta la RAWG_API_KEY");
    return [];
  }

  try {
    // Pedimos 5 resultados
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=5&ordering=-added`
    );
    const data = await response.json();
    
    if (!data.results) return [];

    // Mapeamos para devolver solo lo que nos interesa
    return data.results.map((game: any) => ({
      id: game.id,
      name: game.name,
      image_url: game.background_image, // RAWG usa background_image como portada principal
      rating: game.metacritic || 0,
      released: game.released ? game.released.substring(0, 4) : "N/A" // Solo el año
    }));
  } catch (error) {
    console.error("RAWG Error:", error);
    return [];
  }
}