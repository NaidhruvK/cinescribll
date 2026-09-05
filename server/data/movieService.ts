import fs from 'fs';
import path from 'path';
import bundledMovies from './movies.json';

let cachedMovies: string[] = [];

export function loadMovies(): string[] {
  if (cachedMovies.length > 0) {
    return cachedMovies;
  }

  const seen = new Set<string>();
  const uniqueList: string[] = [];

  const addUnique = (rawList: unknown[]) => {
    for (const item of rawList) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        const lower = trimmed.toLowerCase();
        if (trimmed.length > 0 && !seen.has(lower)) {
          seen.add(lower);
          uniqueList.push(trimmed);
        }
      }
    }
  };

  try {
    const filePath = path.join(process.cwd(), 'server', 'data', 'movies.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed: unknown[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        addUnique(parsed);
      }
    }
  } catch (err) {
    console.warn('[MovieService] Note: reading from fs failed, falling back to bundled dataset:', err);
  }

  // Fallback / supplement from bundled movies if needed
  if (uniqueList.length === 0 && Array.isArray(bundledMovies)) {
    addUnique(bundledMovies);
  }

  cachedMovies = uniqueList;
  console.log(`[MovieService] Loaded ${cachedMovies.length} unique Telugu movies.`);
  return cachedMovies;
}

export function getTotalMovieCount(): number {
  return loadMovies().length;
}

export function getRemainingMovieCount(usedMovies: Set<string> = new Set()): number {
  const allMovies = loadMovies();
  return allMovies.filter((m) => !usedMovies.has(m.trim().toLowerCase())).length;
}

export function getRandomMovieChoices(count: number = 3, usedMovies: Set<string> = new Set()): string[] {
  const allMovies = loadMovies();
  if (allMovies.length === 0) {
    return [];
  }

  // Strictly filter out any movie that has been previously offered or used in this game session
  const available = allMovies.filter((m) => !usedMovies.has(m.trim().toLowerCase()));

  if (available.length < count) {
    // Return all remaining available movies without reusing old movies
    return [...available];
  }

  // Fisher-Yates shuffle algorithm on available pool for uniform randomness
  const pool = [...available];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }

  return pool.slice(0, count);
}
