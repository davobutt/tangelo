import type { TileData } from '../models/Tile';
import { fullDictionary } from './dictionary';

const OPENING_SIZE = 4;
const MAX_OPENING_ATTEMPTS = 12;
const MAX_EXPANSION_ATTEMPTS = 6;
const MIN_OPENING_WORDS = 4;
const MIN_OPENING_VOWELS = 4;
const MAX_OPENING_VOWELS = 8;
const MAX_OPENING_RARE_LETTERS = 2;

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
const RARE_LETTERS = new Set(['Q', 'J', 'X', 'Z']);

const LETTER_WEIGHTS = [
    ['E', 123],
    ['A', 82],
    ['R', 76],
    ['I', 75],
    ['O', 71],
    ['T', 69],
    ['N', 67],
    ['S', 63],
    ['H', 61],
    ['L', 40],
    ['D', 39],
    ['C', 28],
    ['U', 28],
    ['M', 24],
    ['F', 23],
    ['P', 20],
    ['G', 20],
    ['W', 24],
    ['Y', 20],
    ['B', 15],
    ['V', 10],
    ['K', 8],
    ['J', 2],
    ['X', 2],
    ['Q', 1],
    ['Z', 1],
] as const;

const TOTAL_WEIGHT = LETTER_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);

interface SeededCoord {
    row: number;
    col: number;
}

export interface OpeningBoardAssessment {
    playableWordCount: number;
    vowelCount: number;
    rareLetterCount: number;
    adjacentRarePairCount: number;
    score: number;
    passes: boolean;
}

function hashString(input: string): number {
    let hash = 2166136261;

    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function mixHash(value: number): number {
    let mixed = value >>> 0;
    mixed ^= mixed >>> 16;
    mixed = Math.imul(mixed, 0x7feb352d);
    mixed ^= mixed >>> 15;
    mixed = Math.imul(mixed, 0x846ca68b);
    mixed ^= mixed >>> 16;
    return mixed >>> 0;
}

function hashToUnitInterval(input: string): number {
    return mixHash(hashString(input)) / 0x100000000;
}

function weightedLetterFromUnit(unit: number): string {
    let threshold = unit * TOTAL_WEIGHT;

    for (const [letter, weight] of LETTER_WEIGHTS) {
        if (threshold < weight) {
            return letter;
        }
        threshold -= weight;
    }

    return 'E';
}

function randomWeightedLetter(): string {
    return weightedLetterFromUnit(Math.random());
}

function deterministicWeightedLetter(key: string): string {
    return weightedLetterFromUnit(hashToUnitInterval(key));
}

export function isVowelLetter(letter: string): boolean {
    return VOWELS.has(letter);
}

export function isRareLetter(letter: string): boolean {
    return RARE_LETTERS.has(letter);
}

function buildOpeningTiles(letters: string[]): TileData[] {
    return letters.map((letter, index) => ({
        index,
        row: Math.floor(index / OPENING_SIZE),
        col: index % OPENING_SIZE,
        letter,
    }));
}

function buildNeighborMap(tiles: TileData[]): number[][] {
    return tiles.map((tile, tileIndex) =>
        tiles
            .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
            .filter(({ candidate }) =>
                !(candidate.row === tile.row && candidate.col === tile.col) &&
                Math.abs(candidate.row - tile.row) <= 1 &&
                Math.abs(candidate.col - tile.col) <= 1,
            )
            .map(({ candidateIndex }) => candidateIndex),
    );
}

export function countPlayableWords(tiles: TileData[], maxLength = 5): number {
    if (tiles.length === 0) {
        return 0;
    }

    const words = new Set<string>();
    const neighbors = buildNeighborMap(tiles);

    const dfs = (tileIndex: number, path: string, visited: Set<number>): void => {
        if (!fullDictionary.hasPrefix(path)) {
            return;
        }

        if (path.length >= 3 && fullDictionary.has(path)) {
            words.add(path);
        }

        if (path.length >= maxLength) {
            return;
        }

        for (const nextIndex of neighbors[tileIndex] ?? []) {
            if (visited.has(nextIndex)) {
                continue;
            }

            const nextTile = tiles[nextIndex];
            if (!nextTile) {
                continue;
            }

            visited.add(nextIndex);
            dfs(nextIndex, `${path}${nextTile.letter}`, visited);
            visited.delete(nextIndex);
        }
    };

    tiles.forEach((tile, tileIndex) => {
        const visited = new Set([tileIndex]);
        dfs(tileIndex, tile.letter, visited);
    });

    return words.size;
}

function countAdjacentRarePairs(tiles: TileData[]): number {
    let adjacentRarePairs = 0;

    for (let index = 0; index < tiles.length; index += 1) {
        const tile = tiles[index];
        if (!tile || !isRareLetter(tile.letter)) {
            continue;
        }

        for (let nextIndex = index + 1; nextIndex < tiles.length; nextIndex += 1) {
            const candidate = tiles[nextIndex];
            if (!candidate || !isRareLetter(candidate.letter)) {
                continue;
            }

            if (
                Math.abs(candidate.row - tile.row) <= 1 &&
                Math.abs(candidate.col - tile.col) <= 1
            ) {
                adjacentRarePairs += 1;
            }
        }
    }

    return adjacentRarePairs;
}

export function assessOpeningBoard(tiles: TileData[]): OpeningBoardAssessment {
    const letters = tiles.map((tile) => tile.letter);
    const vowelCount = letters.filter((letter) => isVowelLetter(letter)).length;
    const rareLetterCount = letters.filter((letter) => isRareLetter(letter)).length;
    const playableWordCount = countPlayableWords(tiles);
    const adjacentRarePairCount = countAdjacentRarePairs(tiles);
    const vowelPenalty =
        (vowelCount < MIN_OPENING_VOWELS ? MIN_OPENING_VOWELS - vowelCount : 0) +
        (vowelCount > MAX_OPENING_VOWELS ? vowelCount - MAX_OPENING_VOWELS : 0);
    const rarePenalty = Math.max(0, rareLetterCount - MAX_OPENING_RARE_LETTERS);
    const score =
        playableWordCount * 6 -
        vowelPenalty * 4 -
        rarePenalty * 6 -
        adjacentRarePairCount * 10;
    const passes =
        playableWordCount >= MIN_OPENING_WORDS &&
        vowelCount >= MIN_OPENING_VOWELS &&
        vowelCount <= MAX_OPENING_VOWELS &&
        rareLetterCount <= MAX_OPENING_RARE_LETTERS &&
        adjacentRarePairCount === 0;

    return {
        playableWordCount,
        vowelCount,
        rareLetterCount,
        adjacentRarePairCount,
        score,
        passes,
    };
}

function buildSeededOpeningLetters(seed: string, attempt: number): string[] {
    return Array.from({ length: OPENING_SIZE * OPENING_SIZE }, (_, index) =>
        deterministicWeightedLetter(`${seed}:opening:${attempt}:${index}`),
    );
}

function selectBestOpeningLetters(candidates: string[][]): string[] {
    let bestLetters = candidates[0] ?? Array.from({ length: OPENING_SIZE * OPENING_SIZE }, () => 'E');
    let bestAssessment = assessOpeningBoard(buildOpeningTiles(bestLetters));

    for (const letters of candidates.slice(1)) {
        const assessment = assessOpeningBoard(buildOpeningTiles(letters));
        if (assessment.score > bestAssessment.score) {
            bestLetters = letters;
            bestAssessment = assessment;
        }
    }

    return bestLetters;
}

export function generateOpeningLetters(seed?: string): string[] {
    const candidates: string[][] = [];

    for (let attempt = 0; attempt < MAX_OPENING_ATTEMPTS; attempt += 1) {
        const letters = seed
            ? buildSeededOpeningLetters(seed, attempt)
            : Array.from({ length: OPENING_SIZE * OPENING_SIZE }, () => randomWeightedLetter());
        const assessment = assessOpeningBoard(buildOpeningTiles(letters));
        candidates.push(letters);
        if (assessment.passes) {
            return letters;
        }
    }

    return selectBestOpeningLetters(candidates);
}

function countBoardVowels(tiles: TileData[]): number {
    return tiles.filter((tile) => isVowelLetter(tile.letter)).length;
}

function countBoardRareLetters(tiles: TileData[]): number {
    return tiles.filter((tile) => isRareLetter(tile.letter)).length;
}

function countAdjacentRareNeighbors(
    row: number,
    col: number,
    letter: string,
    tiles: TileData[],
): number {
    if (!isRareLetter(letter)) {
        return 0;
    }

    return tiles.filter((tile) =>
        isRareLetter(tile.letter) &&
        Math.abs(tile.row - row) <= 1 &&
        Math.abs(tile.col - col) <= 1,
    ).length;
}

function scoreExpansionCandidate(
    row: number,
    col: number,
    letter: string,
    tiles: TileData[],
): number {
    const nextTileCount = tiles.length + 1;
    const nextVowelCount = countBoardVowels(tiles) + (isVowelLetter(letter) ? 1 : 0);
    const nextRareCount = countBoardRareLetters(tiles) + (isRareLetter(letter) ? 1 : 0);
    const vowelRatio = nextVowelCount / nextTileCount;
    const rareNeighbors = countAdjacentRareNeighbors(row, col, letter, tiles);

    let score = LETTER_WEIGHTS.find(([candidate]) => candidate === letter)?.[1] ?? 0;
    score -= Math.abs(vowelRatio - 0.42) * 120;
    score -= Math.max(0, nextRareCount - 2) * 20;
    score -= rareNeighbors * 40;
    return score;
}

export function getSeededLetter(seed: string, row: number, col: number): string {
    const normalizedSeed = seed.trim();
    return deterministicWeightedLetter(`${normalizedSeed}:coord:${row},${col}`);
}

export function generateExpansionLetter(
    tiles: TileData[],
    coord: SeededCoord,
    seed?: string,
): string {
    if (seed) {
        return getSeededLetter(seed, coord.row, coord.col);
    }

    let bestLetter = randomWeightedLetter();
    let bestScore = scoreExpansionCandidate(coord.row, coord.col, bestLetter, tiles);

    for (let attempt = 1; attempt < MAX_EXPANSION_ATTEMPTS; attempt += 1) {
        const candidate = randomWeightedLetter();
        const candidateScore = scoreExpansionCandidate(coord.row, coord.col, candidate, tiles);
        if (candidateScore > bestScore) {
            bestLetter = candidate;
            bestScore = candidateScore;
        }
    }

    return bestLetter;
}
