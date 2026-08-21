import fs from 'fs';
import path from 'path';
import bundledMovies from './movies.json';

let cachedMovies: string[] = [];

export function loadMovies(): string[] {
  if (cachedMovies.length > 0) {
    return cachedMovies;
  }

  try {
    const filePath = path.join(process.cwd(), 'server', 'data', 'movies.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed: string[] = JSON.parse(data);
      const unique = Array.from(
        new Set(
          parsed
            .map((m) => m.trim())
            .filter((m) => m.length > 0)
        )
      );
      cachedMovies = unique;
      console.log(`[MovieService] Loaded ${cachedMovies.length} Telugu movies from dataset.`);
      return cachedMovies;
    }
  } catch (err) {
    console.warn('[MovieService] Note: reading from fs failed, falling back to bundled dataset:', err);
  }

  // Fallback to bundled movies from import
  if (Array.isArray(bundledMovies) && bundledMovies.length > 0) {
    const unique = Array.from(
      new Set(
        bundledMovies
          .map((m) => String(m).trim())
          .filter((m) => m.length > 0)
      )
    );
    cachedMovies = unique;
    console.log(`[MovieService] Loaded ${cachedMovies.length} Telugu movies from bundled dataset.`);
    return cachedMovies;
  }

  return cachedMovies;
}

export function getRandomMovieChoices(count: number = 3, usedMovies: Set<string> = new Set()): string[] {
  const allMovies = loadMovies();
  if (allMovies.length === 0) {
    return ['Athadu', 'Pokiri', 'Magadheera'];
  }

  // Filter out used movies if possible
  let available = allMovies.filter((m) => !usedMovies.has(m.toLowerCase()));
  if (available.length < count) {
    // If not enough unused movies left, fallback to all movies
    available = [...allMovies];
  }

  // Shuffle and pick
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
