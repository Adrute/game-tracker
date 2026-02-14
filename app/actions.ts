'use server'

export async function fetchGameData(query: string) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${query}&page_size=1`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      return {
        image_url: data.results[0].background_image,
        rating: data.results[0].metacritic,
        name: data.results[0].name
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching RAWG:", error);
    return null;
  }
}