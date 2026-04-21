import { describe, expect, it } from 'vitest';
import type { TileData } from '../models/Tile';
import { generateBoard } from '../utils/boardGenerator';
import { getSeededLetter } from '../utils/seededGeneration';
import {
    assessOpeningBoard,
    isRareLetter,
} from '../utils/playableLetterGeneration';

const LEGACY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function legacyHashString(input: string): number {
    let hash = 2166136261;

    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function legacySeededLetter(seed: string, row: number, col: number): string {
    const index = legacyHashString(`${seed.trim()}:${row},${col}`) % LEGACY_ALPHABET.length;
    return LEGACY_ALPHABET[index] ?? 'A';
}

function buildLegacySeededBoard(seed: string): TileData[] {
    return Array.from({ length: 16 }, (_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        return {
            index,
            row,
            col,
            letter: legacySeededLetter(seed, row, col),
        };
    });
}

describe('playable letter generation', () => {
    it('keeps repeated unseeded opening boards within the playability guardrails', () => {
        for (let index = 0; index < 12; index += 1) {
            const assessment = assessOpeningBoard(generateBoard());
            expect(assessment.passes).toBe(true);
        }
    });

    it('improves seeded opening-board playability across a representative deterministic sample', () => {
        const seeds = Array.from({ length: 24 }, (_, index) => `sample-seed-${index}`);

        const newAssessments = seeds.map((seed) => assessOpeningBoard(generateBoard({ seed })));
        const legacyAssessments = seeds.map((seed) => assessOpeningBoard(buildLegacySeededBoard(seed)));
        const newPassingBoards = seeds.filter((seed) => assessOpeningBoard(generateBoard({ seed })).passes).length;
        const legacyPassingBoards = seeds.filter((seed) => assessOpeningBoard(buildLegacySeededBoard(seed)).passes).length;
        const newDeadBoards = newAssessments.filter((assessment) => assessment.playableWordCount === 0).length;
        const legacyDeadBoards = legacyAssessments.filter((assessment) => assessment.playableWordCount === 0).length;

        expect(newPassingBoards).toBeGreaterThan(legacyPassingBoards);
        expect(newDeadBoards).toBeLessThanOrEqual(legacyDeadBoards);
    });

    it('reduces rare-letter clustering on seeded opening boards compared with the legacy mapping', () => {
        const seeds = Array.from({ length: 24 }, (_, index) => `sample-seed-${index}`);

        const newRarePairs = seeds.reduce(
            (total, seed) => total + assessOpeningBoard(generateBoard({ seed })).adjacentRarePairCount,
            0,
        );
        const legacyRarePairs = seeds.reduce(
            (total, seed) => total + assessOpeningBoard(buildLegacySeededBoard(seed)).adjacentRarePairCount,
            0,
        );

        expect(newRarePairs).toBeLessThan(legacyRarePairs);
    });

    it('uses weighted seeded coordinate letters that reduce rare expansion letters', () => {
        const seeds = Array.from({ length: 20 }, (_, index) => `expansion-seed-${index}`);
        const coords = [
            { row: -1, col: 0 },
            { row: -1, col: 3 },
            { row: 4, col: 0 },
            { row: 4, col: 3 },
            { row: 2, col: -1 },
            { row: 2, col: 4 },
            { row: 5, col: 5 },
            { row: -2, col: 1 },
        ];

        const newRareCount = seeds.reduce(
            (total, seed) =>
                total +
                coords.filter(({ row, col }) => isRareLetter(getSeededLetter(seed, row, col))).length,
            0,
        );
        const legacyRareCount = seeds.reduce(
            (total, seed) =>
                total +
                coords.filter(({ row, col }) => isRareLetter(legacySeededLetter(seed, row, col))).length,
            0,
        );

        expect(newRareCount).toBeLessThan(legacyRareCount);
    });

    it('avoids collapsed repeated rows for the default challenge seed', () => {
        const letters = generateBoard({ seed: 'lemon' }).map((tile) => tile.letter);
        const firstTwoRows = letters.slice(0, 8);

        expect(new Set(firstTwoRows).size).toBeGreaterThanOrEqual(4);
        expect(firstTwoRows.join('')).not.toMatch(/^([A-Z])\1{7}$/);
    });
});
