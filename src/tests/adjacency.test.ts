import { describe, it, expect } from 'vitest';
import { isAdjacent, isValidPath, canAppendTile } from '../utils/adjacency';
import type { TileData } from '../models/Tile';

function tile(index: number): TileData {
    return { index, row: Math.floor(index / 4), col: index % 4, letter: 'A' };
}

// Board layout (indices):
//  0  1  2  3
//  4  5  6  7
//  8  9 10 11
// 12 13 14 15

describe('isAdjacent', () => {
    it('horizontal neighbours are adjacent', () => {
        expect(isAdjacent(tile(0), tile(1))).toBe(true);
        expect(isAdjacent(tile(5), tile(6))).toBe(true);
    });

    it('vertical neighbours are adjacent', () => {
        expect(isAdjacent(tile(0), tile(4))).toBe(true);
        expect(isAdjacent(tile(5), tile(9))).toBe(true);
    });

    it('diagonal neighbours are adjacent', () => {
        expect(isAdjacent(tile(0), tile(5))).toBe(true);
        expect(isAdjacent(tile(5), tile(0))).toBe(true);
        expect(isAdjacent(tile(3), tile(6))).toBe(true);
    });

    it('same tile is not adjacent to itself', () => {
        expect(isAdjacent(tile(5), tile(5))).toBe(false);
    });

    it('non-adjacent tiles return false', () => {
        expect(isAdjacent(tile(0), tile(2))).toBe(false); // same row, distance 2
        expect(isAdjacent(tile(0), tile(8))).toBe(false); // same col, distance 2
        expect(isAdjacent(tile(0), tile(15))).toBe(false); // diagonal corners
    });

    it('tiles at row boundary are not adjacent across rows', () => {
        // tile 3 (row 0, col 3) and tile 4 (row 1, col 0)
        expect(isAdjacent(tile(3), tile(4))).toBe(false);
    });
});

describe('isValidPath', () => {
    it('returns false for empty path', () => {
        expect(isValidPath([])).toBe(false);
    });

    it('returns true for single tile', () => {
        expect(isValidPath([tile(5)])).toBe(true);
    });

    it('returns true for valid adjacent path', () => {
        expect(isValidPath([tile(0), tile(1), tile(5)])).toBe(true);
    });

    it('returns false when a tile is repeated', () => {
        expect(isValidPath([tile(0), tile(1), tile(0)])).toBe(false);
    });

    it('returns false when consecutive tiles are non-adjacent', () => {
        expect(isValidPath([tile(0), tile(2)])).toBe(false);
    });
});

describe('canAppendTile', () => {
    it('allows first tile on empty path', () => {
        expect(canAppendTile([], tile(5))).toBe(true);
    });

    it('allows valid adjacent tile', () => {
        expect(canAppendTile([tile(0)], tile(1))).toBe(true);
    });

    it('blocks non-adjacent tile', () => {
        expect(canAppendTile([tile(0)], tile(2))).toBe(false);
    });

    it('blocks tile already in path', () => {
        expect(canAppendTile([tile(0), tile(1)], tile(0))).toBe(false);
    });
});
