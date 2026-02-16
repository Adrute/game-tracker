"use server";

// Función para buscar juegos con paginación y detalles
export async function searchGamesRAWG(query: string, page: number = 1) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("Falta la RAWG_API_KEY");
    return { results: [], total: 0 };
  }

  try {
    // CAMBIOS AQUI:
    // 1. Añadimos &search_precise=true para que busque la frase exacta
    // 2. Quitamos &ordering=-added para que ordene por RELEVANCIA, no por popularidad
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page=${page}&page_size=20&search_precise=true`
    );
    const data = await response.json();

    if (!data.results) return { results: [], total: 0 };

    // Para cada juego, obtenemos los detalles adicionales (descripción y screenshots)
    const results = await Promise.all(data.results.map(async (game: any) => {
      let description = "";
      let screenshots: string[] = [];
      
      // Solo pedimos detalles si es estrictamente necesario para no ralentizar la lista
      // (Podríamos optimizar esto pidiéndolo solo al entrar en la ficha, pero lo mantenemos así por ahora)
      try {
        // Hacemos fetch solo si necesitamos description_raw que no viene en la lista principal
        // Nota: RAWG a veces devuelve screenshots en la lista principal, optimizamos:
        screenshots = game.short_screenshots?.map((s: any) => s.image) || [];
        
        // Si queremos la descripción completa, sí necesitamos el fetch extra.
        // Si te va lento, podrías quitar este bloque y cargar la descripción solo en la ficha del juego (GameDetail).
        const detailsResponse = await fetch(`https://api.rawg.io/api/games/${game.id}?key=${apiKey}`);
        const detailsData = await detailsResponse.json();
        description = detailsData.description_raw || "";
        
        // Si la ficha tiene mejores screenshots, las usamos
        if (detailsData.short_screenshots) {
             screenshots = detailsData.short_screenshots.map((s: any) => s.image);
        }
      } catch (error) {
        console.error(`Error fetching details for game ${game.id}:`, error);
      }

      return {
        id: game.id,
        name: game.name,
        image_url: game.background_image,
        rating: game.metacritic || 0,
        released: game.released ? game.released.substring(0, 4) : "N/A",
        description, 
        screenshots 
      };
    }));

    return { results, total: data.count };
  } catch (error) {
    console.error("RAWG Error:", error);
    return { results: [], total: 0 };
  }
}

// Función simple para buscar solo portadas (usada en el modal de cambio de portada)
export async function searchGameCovers(query: string) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("Falta la RAWG_API_KEY");
    return [];
  }

  try {
    // CAMBIOS AQUI TAMBIÉN: search_precise=true y quitamos ordering
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=12&search_precise=true`
    );
    const data = await response.json();

    if (!data.results) return [];

    return data.results.map((game: any) => ({
      name: game.name,
      image_url: game.background_image,
    }));
  } catch (error) {
    console.error("RAWG Error:", error);
    return [];
  }
}