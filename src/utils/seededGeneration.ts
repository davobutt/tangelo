import { getSeededLetter as getPlayableSeededLetter } from './playableLetterGeneration';

export function normalizeSeed(seed: string): string {
    return seed.trim();
}

export function getSeededLetter(seed: string, row: number, col: number): string {
    const normalizedSeed = normalizeSeed(seed);
    return getPlayableSeededLetter(normalizedSeed, row, col);
}
