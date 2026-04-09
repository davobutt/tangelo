import { describe, it, expect } from 'vitest';
import { generateBoard } from '../utils/boardGenerator';

describe('generateBoard', () => {
    it('returns exactly 16 tiles', () => {
        const board = generateBoard();
        expect(board).toHaveLength(16);
    });

    it('every tile has a non-empty single uppercase letter', () => {
        const board = generateBoard();
        board.forEach((tile) => {
            expect(tile.letter).toMatch(/^[A-Z]$/);
        });
    });

    it('tile indices are 0–15 without duplicates', () => {
        const board = generateBoard();
        const indices = board.map((t) => t.index);
        expect(new Set(indices).size).toBe(16);
        indices.forEach((i) => expect(i).toBeGreaterThanOrEqual(0));
        indices.forEach((i) => expect(i).toBeLessThan(16));
    });

    it('row and col are consistent with index', () => {
        const board = generateBoard();
        board.forEach((tile) => {
            expect(tile.row).toBe(Math.floor(tile.index / 4));
            expect(tile.col).toBe(tile.index % 4);
        });
    });

    it('produces different boards across calls (probabilistic)', () => {
        const a = generateBoard().map((t) => t.letter).join('');
        const b = generateBoard().map((t) => t.letter).join('');
        // It's possible but astronomically unlikely they match
        expect(a === b).toBe(false);
    });
});
