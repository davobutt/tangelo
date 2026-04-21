import type { TileData } from '../models/Tile';
import {
    CURATED_SEED_DEFINITIONS,
    type CuratedExpansionWordPlacement,
    type CuratedSeedCoord,
    type CuratedSeedDefinition,
} from './curatedSeedConfig';
import { fullDictionary, normalizeWord } from './dictionary';
import { normalizeSeedCode } from './seedCode';

const OPENING_SIZE = 4;
const MAX_OPENING_ATTEMPTS = 12;
const MAX_EXPANSION_ATTEMPTS = 6;
const MAX_PLACEMENT_CANDIDATES = 48;
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

interface CuratedWordPlacement {
    word: string;
    path: SeededCoord[];
    score: number;
}

export interface OpeningBoardAssessment {
    playableWordCount: number;
    vowelCount: number;
    rareLetterCount: number;
    adjacentRarePairCount: number;
    score: number;
    passes: boolean;
}

interface ValidatedCuratedSeedDefinition extends CuratedSeedDefinition {
    seed: string;
    theme: string;
    hiddenWords: readonly string[];
    openingHiddenWords: readonly string[];
    expansionHiddenWordPlacements: readonly ValidatedCuratedExpansionWordPlacement[];
    expansionLetterOverrides: ReadonlyMap<string, string>;
}

interface ValidatedCuratedExpansionWordPlacement {
    word: string;
    path: readonly CuratedSeedCoord[];
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

function coordKey(row: number, col: number): string {
    return `${row},${col}`;
}

function isOpeningCoord(row: number, col: number): boolean {
    return row >= 0 && row < OPENING_SIZE && col >= 0 && col < OPENING_SIZE;
}

function openingCoordIndex(row: number, col: number): number {
    return row * OPENING_SIZE + col;
}

function listOpeningCoords(): SeededCoord[] {
    return Array.from({ length: OPENING_SIZE * OPENING_SIZE }, (_, index) => ({
        row: Math.floor(index / OPENING_SIZE),
        col: index % OPENING_SIZE,
    }));
}

const OPENING_COORDS = listOpeningCoords();

function getOpeningNeighbors(coord: SeededCoord): SeededCoord[] {
    return OPENING_COORDS.filter((candidate) =>
        !(candidate.row === coord.row && candidate.col === coord.col) &&
        Math.abs(candidate.row - coord.row) <= 1 &&
        Math.abs(candidate.col - coord.col) <= 1,
    );
}

function scoreCoordForLetter(
    coord: SeededCoord,
    letter: string,
    assignments: Map<string, string>,
    baseLetters: string[],
): number {
    const key = coordKey(coord.row, coord.col);
    const assignedLetter = assignments.get(key);
    if (assignedLetter && assignedLetter !== letter) {
        return Number.NEGATIVE_INFINITY;
    }

    const baseLetter = baseLetters[openingCoordIndex(coord.row, coord.col)];
    let score = 0;
    if (assignedLetter === letter) {
        score += 18;
    }
    if (baseLetter === letter) {
        score += 12;
    }

    const centerDistance = Math.abs(coord.row - 1.5) + Math.abs(coord.col - 1.5);
    score -= centerDistance;
    return score;
}

function compareCoords(a: SeededCoord, b: SeededCoord): number {
    return a.row - b.row || a.col - b.col;
}

function findWordPlacementCandidates(
    word: string,
    assignments: Map<string, string>,
    baseLetters: string[],
): CuratedWordPlacement[] {
    const placements: CuratedWordPlacement[] = [];

    const visit = (
        coord: SeededCoord,
        index: number,
        path: SeededCoord[],
        visitedInWord: Set<string>,
        score: number,
    ): void => {
        if (placements.length >= MAX_PLACEMENT_CANDIDATES) {
            return;
        }

        if (index === word.length - 1) {
            placements.push({ word, path: [...path], score });
            return;
        }

        const nextLetter = word[index + 1] ?? '';
        const nextCoords = getOpeningNeighbors(coord)
            .filter((candidate) => !visitedInWord.has(coordKey(candidate.row, candidate.col)))
            .map((candidate) => ({
                coord: candidate,
                score: scoreCoordForLetter(candidate, nextLetter, assignments, baseLetters),
            }))
            .filter((candidate) => Number.isFinite(candidate.score))
            .sort((a, b) => b.score - a.score || compareCoords(a.coord, b.coord));

        for (const candidate of nextCoords) {
            const key = coordKey(candidate.coord.row, candidate.coord.col);
            visitedInWord.add(key);
            path.push(candidate.coord);
            visit(candidate.coord, index + 1, path, visitedInWord, score + candidate.score);
            path.pop();
            visitedInWord.delete(key);
        }
    };

    const firstLetter = word[0] ?? '';
    const starts = OPENING_COORDS
        .map((coord) => ({
            coord,
            score: scoreCoordForLetter(coord, firstLetter, assignments, baseLetters),
        }))
        .filter((candidate) => Number.isFinite(candidate.score))
        .sort((a, b) => b.score - a.score || compareCoords(a.coord, b.coord));

    for (const candidate of starts) {
        const key = coordKey(candidate.coord.row, candidate.coord.col);
        visit(candidate.coord, 0, [candidate.coord], new Set([key]), candidate.score);
    }

    return placements.sort((a, b) => b.score - a.score || compareCoords(a.path[0] ?? { row: 0, col: 0 }, b.path[0] ?? { row: 0, col: 0 }));
}

function buildAssignmentsFromPlacements(placements: CuratedWordPlacement[]): Map<string, string> {
    const assignments = new Map<string, string>();

    for (const placement of placements) {
        placement.path.forEach((coord, index) => {
            const letter = placement.word[index] ?? '';
            assignments.set(coordKey(coord.row, coord.col), letter);
        });
    }

    return assignments;
}

function overlayAssignments(baseLetters: string[], assignments: Map<string, string>): string[] {
    return baseLetters.map((letter, index) => {
        const row = Math.floor(index / OPENING_SIZE);
        const col = index % OPENING_SIZE;
        return assignments.get(coordKey(row, col)) ?? letter;
    });
}

function containsWordPath(letters: string[], word: string): boolean {
    const tiles = buildOpeningTiles(letters);
    const visited = new Set<number>();

    const dfs = (tileIndex: number, depth: number): boolean => {
        if ((tiles[tileIndex]?.letter ?? '') !== (word[depth] ?? '')) {
            return false;
        }

        if (depth === word.length - 1) {
            return true;
        }

        visited.add(tileIndex);
        const tile = tiles[tileIndex];
        const found = tile
            ? tiles.some((candidate, candidateIndex) => {
                if (visited.has(candidateIndex)) {
                    return false;
                }
                return (
                    Math.abs(candidate.row - tile.row) <= 1 &&
                    Math.abs(candidate.col - tile.col) <= 1 &&
                    !(candidate.row === tile.row && candidate.col === tile.col) &&
                    dfs(candidateIndex, depth + 1)
                );
            })
            : false;
        visited.delete(tileIndex);
        return found;
    };

    return tiles.some((_, index) => dfs(index, 0));
}

function validateExpansionWordPlacement(
    seed: string,
    placement: CuratedExpansionWordPlacement,
): ValidatedCuratedExpansionWordPlacement {
    const word = normalizeWord(placement.word);
    const path = placement.path.map((coord) => ({ row: coord.row, col: coord.col }));

    if (path.length !== word.length) {
        throw new Error(
            `Curated seed "${seed}" has expansion placement length mismatch for "${word}".`,
        );
    }

    const visited = new Set<string>();
    path.forEach((coord, index) => {
        const key = coordKey(coord.row, coord.col);
        if (visited.has(key)) {
            throw new Error(`Curated seed "${seed}" reuses expansion cell ${key} within "${word}".`);
        }
        visited.add(key);

        if (isOpeningCoord(coord.row, coord.col)) {
            throw new Error(
                `Curated seed "${seed}" must keep expansion placement "${word}" outside the opening 4x4 grid.`,
            );
        }

        const previous = path[index - 1];
        if (
            previous &&
            (Math.abs(coord.row - previous.row) > 1 ||
                Math.abs(coord.col - previous.col) > 1 ||
                (coord.row === previous.row && coord.col === previous.col))
        ) {
            throw new Error(`Curated seed "${seed}" has a non-adjacent expansion path for "${word}".`);
        }
    });

    return { word, path };
}

function buildExpansionLetterOverrides(
    seed: string,
    placements: readonly ValidatedCuratedExpansionWordPlacement[],
): ReadonlyMap<string, string> {
    const overrides = new Map<string, string>();

    placements.forEach((placement) => {
        placement.path.forEach((coord, index) => {
            const key = coordKey(coord.row, coord.col);
            const letter = placement.word[index] ?? '';
            const existing = overrides.get(key);
            if (existing && existing !== letter) {
                throw new Error(
                    `Curated seed "${seed}" assigns conflicting letters to expansion cell ${key}.`,
                );
            }
            overrides.set(key, letter);
        });
    });

    return overrides;
}

function placeCuratedWordsOnBoard(
    hiddenWords: readonly string[],
    baseLetters: string[],
): CuratedWordPlacement[] | null {
    const sortedWords = [...hiddenWords].sort((a, b) => b.length - a.length || a.localeCompare(b));

    const search = (
        wordIndex: number,
        placements: CuratedWordPlacement[],
    ): CuratedWordPlacement[] | null => {
        if (wordIndex >= sortedWords.length) {
            return placements;
        }

        const word = sortedWords[wordIndex] ?? '';
        const assignments = buildAssignmentsFromPlacements(placements);
        const candidates = findWordPlacementCandidates(word, assignments, baseLetters);

        for (const candidate of candidates) {
            const nextPlacements = [...placements, candidate];
            const result = search(wordIndex + 1, nextPlacements);
            if (result) {
                return result;
            }
        }

        return null;
    };

    return search(0, []);
}

function buildCuratedOpeningLetters(
    definition: ValidatedCuratedSeedDefinition,
    attempt: number,
): string[] {
    const baseLetters = buildSeededOpeningLetters(definition.seed, attempt);
    if (definition.openingHiddenWords.length === 0) {
        return baseLetters;
    }

    const placements = placeCuratedWordsOnBoard(definition.openingHiddenWords, baseLetters);
    if (!placements) {
        throw new Error(
            `Curated seed "${definition.seed}" cannot place hidden words: ${definition.openingHiddenWords.join(', ')}`,
        );
    }

    return overlayAssignments(baseLetters, buildAssignmentsFromPlacements(placements));
}

export function validateCuratedSeedDefinitions(
    definitions: readonly CuratedSeedDefinition[],
): ValidatedCuratedSeedDefinition[] {
    const seenSeeds = new Set<string>();

    return definitions.map((definition) => {
        const seed = normalizeSeedCode(definition.seed);
        if (!seed) {
            throw new Error(`Curated seed "${definition.seed}" must use a valid 5-letter code.`);
        }
        if (seenSeeds.has(seed)) {
            throw new Error(`Curated seed "${seed}" is defined more than once.`);
        }
        seenSeeds.add(seed);

        if (!definition.theme.trim()) {
            throw new Error(`Curated seed "${seed}" must include a non-empty theme.`);
        }
        if (definition.hiddenWords.length === 0) {
            throw new Error(`Curated seed "${seed}" must define at least one hidden word.`);
        }

        const hiddenWords = definition.hiddenWords.map((word) => normalizeWord(word));
        hiddenWords.forEach((word) => {
            if (word.length < 3) {
                throw new Error(`Curated seed "${seed}" contains hidden word "${word}" that is too short.`);
            }
            if (!fullDictionary.has(word)) {
                throw new Error(`Curated seed "${seed}" contains hidden word "${word}" that is not in the dictionary.`);
            }
        });

        const openingHiddenWords = (definition.openingHiddenWords ?? []).map((word) => normalizeWord(word));
        openingHiddenWords.forEach((word) => {
            if (!hiddenWords.includes(word)) {
                throw new Error(`Curated seed "${seed}" has opening hidden word "${word}" outside hiddenWords.`);
            }
        });

        const expansionHiddenWordPlacements = (definition.expansionHiddenWordPlacements ?? [])
            .map((placement) => validateExpansionWordPlacement(seed, placement));
        expansionHiddenWordPlacements.forEach((placement) => {
            if (!hiddenWords.includes(placement.word)) {
                throw new Error(
                    `Curated seed "${seed}" has expansion hidden word "${placement.word}" outside hiddenWords.`,
                );
            }
        });

        const validatedDefinition: ValidatedCuratedSeedDefinition = {
            seed,
            theme: definition.theme.trim(),
            hiddenWords,
            openingHiddenWords,
            expansionHiddenWordPlacements,
            expansionLetterOverrides: buildExpansionLetterOverrides(seed, expansionHiddenWordPlacements),
        };

        const letters = buildCuratedOpeningLetters(validatedDefinition, 0);
        openingHiddenWords.forEach((word) => {
            if (!containsWordPath(letters, word)) {
                throw new Error(`Curated seed "${seed}" failed to embed hidden word "${word}".`);
            }
        });

        return validatedDefinition;
    });
}

const CURATED_SEEDS = new Map(
    validateCuratedSeedDefinitions(CURATED_SEED_DEFINITIONS).map((definition) => [definition.seed, definition]),
);

function getCuratedSeedDefinition(seed: string | undefined): ValidatedCuratedSeedDefinition | null {
    if (!seed) {
        return null;
    }

    return CURATED_SEEDS.get(seed.trim().toLowerCase()) ?? null;
}

export function getCuratedHiddenWordBonus(seed: string | null | undefined, word: string): number {
    const definition = getCuratedSeedDefinition(seed ?? undefined);
    if (!definition) {
        return 0;
    }

    const normalizedWord = normalizeWord(word);
    return definition.hiddenWords.includes(normalizedWord) ? normalizedWord.length : 0;
}

function getCuratedLetterOverride(seed: string, row: number, col: number): string | null {
    const definition = getCuratedSeedDefinition(seed);
    if (!definition) {
        return null;
    }

    return definition.expansionLetterOverrides.get(coordKey(row, col)) ?? null;
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
    const curatedDefinition = getCuratedSeedDefinition(seed);
    const candidates: string[][] = [];

    for (let attempt = 0; attempt < MAX_OPENING_ATTEMPTS; attempt += 1) {
        const letters = curatedDefinition
            ? buildCuratedOpeningLetters(curatedDefinition, attempt)
            : seed
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
    const curatedOverride = getCuratedLetterOverride(normalizedSeed, row, col);
    if (curatedOverride) {
        return curatedOverride;
    }
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
