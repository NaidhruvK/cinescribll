export function calculateGuessScore(
  remainingTime: number,
  totalTime: number,
  guessRank: number
): number {
  const timeRatio = Math.max(0, Math.min(1, remainingTime / totalTime));
  // Base 100 to 450 based on time left
  let score = Math.round(100 + timeRatio * 350);

  // Speed rank bonus
  if (guessRank === 1) score += 100;
  else if (guessRank === 2) score += 50;
  else if (guessRank === 3) score += 25;

  return score;
}

export function calculateArtistScore(correctGuessCount: number, totalGuessers: number): number {
  if (correctGuessCount === 0 || totalGuessers === 0) return 0;
  const ratio = correctGuessCount / totalGuessers;
  return Math.round(100 + ratio * 300);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, '') // keep only alphanumeric
    .trim();
}

export function isCorrectGuess(guess: string, targetMovie: string): boolean {
  const normGuess = normalizeText(guess);
  const normTarget = normalizeText(targetMovie);

  if (!normGuess || !normTarget) return false;
  return normGuess === normTarget;
}

export function isCloseGuess(guess: string, targetMovie: string): boolean {
  const normGuess = normalizeText(guess);
  const normTarget = normalizeText(targetMovie);

  if (normGuess === normTarget) return false;
  if (normGuess.length < 3 || normTarget.length < 3) return false;

  // Check Levenshtein distance
  const dist = levenshteinDistance(normGuess, normTarget);
  if (normTarget.length <= 5 && dist === 1) return true;
  if (normTarget.length > 5 && dist <= 2) return true;

  // Substring closeness
  if (normGuess.length >= 4 && normTarget.includes(normGuess)) return true;

  return false;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
