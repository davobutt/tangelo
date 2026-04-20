import { describe, it, expect } from 'vitest';
import type { TileData } from '../models/Tile';
import { generateBoard } from '../utils/boardGenerator';
import { applyEdgeExpansions, getQualifiedEdges } from '../utils/endlessExpansion';

function makeRectBoard(rows: number, cols: number, rowOffset = 0, colOffset = 0): TileData[] {
    const tiles: TileData[] = [];
    let index = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            tiles.push({
                index,
                row: row + rowOffset,
                col: col + colOffset,
                letter: 'A',
            });
            index += 1;
        }
    }

    return tiles;
}

function findTile(tiles: TileData[], row: number, col: number): TileData {
    const tile = tiles.find((t) => t.row === row && t.col === col);
    if (!tile) {
        throw new Error(`Missing tile at (${row}, ${col})`);
    }
    return tile;
}

describe('endless expansion engine', () => {
    it('single qualifying edge expands by exactly four non-overlapping letters', () => {
        const tiles = makeRectBoard(4, 4);
        const path = [
            findTile(tiles, 0, 0),
            findTile(tiles, 0, 1),
            findTile(tiles, 0, 2),
        ];

        const result = applyEdgeExpansions(tiles, path, {
            letterGenerator: () => 'Z',
        });

        expect(result.qualifiedEdges).toEqual(['top']);
        expect(result.expandedEdges).toEqual(['top']);
        expect(result.placements).toHaveLength(4);
        result.placements.forEach((placement) => {
            expect(placement.edge).toBe('top');
            expect(placement.tile.row).toBe(-1);
            expect(placement.tile.letter).toBe('Z');
        });

        const occupiedKeys = new Set(result.placements.map((p) => `${p.tile.row},${p.tile.col}`));
        expect(occupiedKeys.size).toBe(4);
        expect(tiles).toHaveLength(20);
    });

    it('corner-spanning path can qualify and expand both connected edges', () => {
        const tiles = makeRectBoard(4, 4);
        const path = [
            findTile(tiles, 0, 0),
            findTile(tiles, 0, 1),
            findTile(tiles, 1, 0),
        ];

        const result = applyEdgeExpansions(tiles, path, {
            letterGenerator: () => 'Q',
        });

        expect(new Set(result.qualifiedEdges)).toEqual(new Set(['top', 'left']));
        expect(new Set(result.expandedEdges)).toEqual(new Set(['top', 'left']));
        expect(result.placements).toHaveLength(8);

        const topPlacements = result.placements.filter((p) => p.edge === 'top');
        const leftPlacements = result.placements.filter((p) => p.edge === 'left');
        expect(topPlacements).toHaveLength(4);
        expect(leftPlacements).toHaveLength(4);
        topPlacements.forEach((p) => expect(p.tile.row).toBe(-1));
        leftPlacements.forEach((p) => expect(p.tile.col).toBe(-1));
    });

    it('path can qualify all four edges and each edge attempts expansion', () => {
        const tiles = makeRectBoard(4, 4);
        const path = [
            findTile(tiles, 0, 0),
            findTile(tiles, 0, 1),
            findTile(tiles, 0, 2),
            findTile(tiles, 0, 3),
            findTile(tiles, 1, 3),
            findTile(tiles, 2, 3),
            findTile(tiles, 3, 3),
            findTile(tiles, 3, 2),
            findTile(tiles, 3, 1),
            findTile(tiles, 3, 0),
            findTile(tiles, 2, 0),
            findTile(tiles, 1, 0),
        ];

        expect(new Set(getQualifiedEdges(path, tiles))).toEqual(
            new Set(['top', 'right', 'bottom', 'left']),
        );

        const result = applyEdgeExpansions(tiles, path, {
            letterGenerator: () => 'M',
        });

        expect(new Set(result.expandedEdges)).toEqual(new Set(['top', 'right', 'bottom', 'left']));
        expect(result.placements).toHaveLength(16);
        expect(tiles).toHaveLength(32);
    });

    it('never overwrites occupied cells on attempted expansions', () => {
        const tiles = makeRectBoard(4, 4);
        const originalOccupied = new Set(tiles.map((t) => `${t.row},${t.col}`));

        const path = [
            findTile(tiles, 0, 0),
            findTile(tiles, 0, 1),
            findTile(tiles, 1, 0),
        ];

        const result = applyEdgeExpansions(tiles, path, {
            letterGenerator: () => 'Y',
        });

        expect(new Set(result.qualifiedEdges)).toEqual(new Set(['top', 'left']));

        const placementKeys = result.placements.map((p) => `${p.tile.row},${p.tile.col}`);
        placementKeys.forEach((key) => expect(originalOccupied.has(key)).toBe(false));

        const allKeys = tiles.map((t) => `${t.row},${t.col}`);
        expect(new Set(allKeys).size).toBe(allKeys.length);
    });

    it('placement prefers away-from-corner slots while remaining center-relative', () => {
        const tiles = makeRectBoard(3, 6);
        const path = [
            findTile(tiles, 0, 2),
            findTile(tiles, 0, 3),
            findTile(tiles, 0, 4),
        ];

        const result = applyEdgeExpansions(tiles, path, {
            letterGenerator: () => 'P',
        });

        const cols = result.placements
            .filter((p) => p.edge === 'top')
            .map((p) => p.tile.col)
            .sort((a, b) => a - b);

        expect(cols).toEqual([1, 2, 3, 4]);
    });

    it('frontier detection qualifies tiles not at bounding-box extreme after partial expansion', () => {
        // 4x4 board with right side of bottom already expanded to row 4
        const tiles = makeRectBoard(4, 4);
        tiles.push({ index: 16, row: 4, col: 2, letter: 'X' });
        tiles.push({ index: 17, row: 4, col: 3, letter: 'X' });

        // Path on the un-expanded left side — NOT at bounds.maxRow (4)
        const path = [findTile(tiles, 3, 0), findTile(tiles, 3, 1)];

        const edges = getQualifiedEdges(path, tiles);
        expect(edges).toContain('bottom');
    });

    it('gap-fill expansion places tiles at correct irregular depths', () => {
        // 4x4 board with right side already expanded: row 4, cols 2-3
        const tiles = makeRectBoard(4, 4);
        tiles.push({ index: 16, row: 4, col: 2, letter: 'X' });
        tiles.push({ index: 17, row: 4, col: 3, letter: 'X' });

        const path = [findTile(tiles, 3, 0), findTile(tiles, 3, 1)];
        const result = applyEdgeExpansions(tiles, path, { letterGenerator: () => 'G' });

        expect(result.qualifiedEdges).toContain('bottom');
        const bottomPlacements = result.placements.filter((p) => p.edge === 'bottom');

        // Frontier at col 0,1 is row 4 (gap); frontier at col 2,3 is row 5 (beyond prior expansion)
        expect(bottomPlacements).toHaveLength(4);
        const byCol: Record<number, number> = {};
        bottomPlacements.forEach((p) => { byCol[p.tile.col] = p.tile.row; });
        expect(byCol[0]).toBe(4);
        expect(byCol[1]).toBe(4);
        expect(byCol[2]).toBe(5);
        expect(byCol[3]).toBe(5);
    });

    it('after gap is filled subsequent submissions expand from the new per-column frontier', () => {
        const tiles = makeRectBoard(4, 4);
        tiles.push({ index: 16, row: 4, col: 2, letter: 'X' });
        tiles.push({ index: 17, row: 4, col: 3, letter: 'X' });

        // First submission: fills gap → (4,0),(4,1) placed + frontier for cols 2,3 advances to (5,2),(5,3)
        applyEdgeExpansions(tiles, [findTile(tiles, 3, 0), findTile(tiles, 3, 1)], { letterGenerator: () => 'G' });
        // tiles = 16 original + 2 manual + 4 expansion = 22

        // Second submission: path on newly placed (4,0),(4,1)
        const result2 = applyEdgeExpansions(
            tiles,
            [findTile(tiles, 4, 0), findTile(tiles, 4, 1)],
            { letterGenerator: () => 'H' },
        );

        expect(result2.qualifiedEdges).toContain('bottom');
        const byCol: Record<number, number> = {};
        result2.placements
            .filter((p) => p.edge === 'bottom')
            .forEach((p) => { byCol[p.tile.col] = p.tile.row; });

        // Cols 0,1 frontier was at row 4 → now expands to row 5
        expect(byCol[0]).toBe(5);
        expect(byCol[1]).toBe(5);
        // Cols 2,3 were already at row 5 → frontier is row 6
        expect(byCol[2]).toBe(6);
        expect(byCol[3]).toBe(6);
    });

    it('blocks expansion that would grow a fully capped 10-row board beyond the limit', () => {
        const tiles = makeRectBoard(10, 4);
        const path = [findTile(tiles, 0, 0), findTile(tiles, 0, 1)];

        const result = applyEdgeExpansions(tiles, path, { letterGenerator: () => 'C' });

        expect(result.qualifiedEdges).toEqual(['top']);
        expect(result.expandedEdges).toEqual([]);
        expect(result.placements).toEqual([]);
        expect(tiles).toHaveLength(40);
    });

    it('only places cells that stay within the 10x10 cap when a frontier is partially in bounds', () => {
        const tiles = makeRectBoard(9, 4);
        tiles.push({ index: 36, row: 9, col: 2, letter: 'X' });
        tiles.push({ index: 37, row: 9, col: 3, letter: 'X' });

        const path = [findTile(tiles, 8, 0), findTile(tiles, 8, 1)];
        const result = applyEdgeExpansions(tiles, path, { letterGenerator: () => 'D' });

        expect(result.qualifiedEdges).toContain('bottom');
        expect(result.expandedEdges).toEqual(['bottom']);
        const bottomPlacements = result.placements.filter((placement) => placement.edge === 'bottom');
        expect(bottomPlacements).toHaveLength(2);
        expect(bottomPlacements.map((placement) => [placement.tile.row, placement.tile.col])).toEqual([
            [9, 0],
            [9, 1],
        ]);
    });

    it('applies capped multi-edge expansion independently per edge without exceeding 10x10', () => {
        const tiles = makeRectBoard(9, 10);
        const path = [
            findTile(tiles, 0, 0),
            findTile(tiles, 0, 1),
            findTile(tiles, 0, 2),
            findTile(tiles, 0, 3),
            findTile(tiles, 0, 4),
            findTile(tiles, 0, 5),
            findTile(tiles, 0, 6),
            findTile(tiles, 0, 7),
            findTile(tiles, 0, 8),
            findTile(tiles, 0, 9),
            findTile(tiles, 1, 9),
            findTile(tiles, 2, 9),
            findTile(tiles, 3, 9),
            findTile(tiles, 4, 9),
            findTile(tiles, 5, 9),
            findTile(tiles, 6, 9),
            findTile(tiles, 7, 9),
            findTile(tiles, 8, 9),
            findTile(tiles, 8, 8),
            findTile(tiles, 8, 7),
            findTile(tiles, 8, 6),
            findTile(tiles, 8, 5),
            findTile(tiles, 8, 4),
            findTile(tiles, 8, 3),
            findTile(tiles, 8, 2),
            findTile(tiles, 8, 1),
            findTile(tiles, 8, 0),
            findTile(tiles, 7, 0),
            findTile(tiles, 6, 0),
            findTile(tiles, 5, 0),
            findTile(tiles, 4, 0),
            findTile(tiles, 3, 0),
            findTile(tiles, 2, 0),
            findTile(tiles, 1, 0),
        ];

        const result = applyEdgeExpansions(tiles, path, { letterGenerator: () => 'E' });

        expect(new Set(result.qualifiedEdges)).toEqual(new Set(['top', 'right', 'bottom', 'left']));
        expect(result.expandedEdges).toContain('top');
        expect(result.expandedEdges).not.toContain('bottom');
        result.placements.forEach((placement) => {
            expect(placement.tile.row).toBeGreaterThanOrEqual(-1);
            expect(placement.tile.row).toBeLessThanOrEqual(8);
            expect(placement.tile.col).toBeGreaterThanOrEqual(0);
            expect(placement.tile.col).toBeLessThanOrEqual(9);
        });
        expect(Math.max(...tiles.map((tile) => tile.col)) - Math.min(...tiles.map((tile) => tile.col)) + 1).toBe(10);
        expect(Math.max(...tiles.map((tile) => tile.row)) - Math.min(...tiles.map((tile) => tile.row)) + 1).toBe(10);
    });

    it('reuses the same letters for the same seed and revealed coordinates', () => {
        const seed = 'repeatable-run';
        const boardA = generateBoard({ seed });
        const boardB = generateBoard({ seed });
        const pathA = [findTile(boardA, 0, 0), findTile(boardA, 0, 1), findTile(boardA, 0, 2)];
        const pathB = [findTile(boardB, 0, 0), findTile(boardB, 0, 1), findTile(boardB, 0, 2)];

        const resultA = applyEdgeExpansions(boardA, pathA, { seed });
        const resultB = applyEdgeExpansions(boardB, pathB, { seed });

        expect(resultA.placements.map((placement) => placement.tile)).toEqual(
            resultB.placements.map((placement) => placement.tile),
        );
    });

    it('produces the same final revealed grid for the same seed across different valid expansion orders', () => {
        const seed = 'shared-daily';
        const topFirst = generateBoard({ seed });
        const bottomFirst = generateBoard({ seed });
        const topPathA = [findTile(topFirst, 0, 0), findTile(topFirst, 0, 1), findTile(topFirst, 0, 2)];
        const bottomPathA = [findTile(topFirst, 3, 0), findTile(topFirst, 3, 1), findTile(topFirst, 3, 2)];
        const bottomPathB = [findTile(bottomFirst, 3, 0), findTile(bottomFirst, 3, 1), findTile(bottomFirst, 3, 2)];
        const topPathB = [findTile(bottomFirst, 0, 0), findTile(bottomFirst, 0, 1), findTile(bottomFirst, 0, 2)];

        applyEdgeExpansions(topFirst, topPathA, { seed });
        applyEdgeExpansions(topFirst, bottomPathA, { seed });

        applyEdgeExpansions(bottomFirst, bottomPathB, { seed });
        applyEdgeExpansions(bottomFirst, topPathB, { seed });

        const finalGridA = [...topFirst]
            .sort((a, b) => a.row - b.row || a.col - b.col)
            .map((tile) => `${tile.row},${tile.col}:${tile.letter}`);
        const finalGridB = [...bottomFirst]
            .sort((a, b) => a.row - b.row || a.col - b.col)
            .map((tile) => `${tile.row},${tile.col}:${tile.letter}`);

        expect(finalGridA).toEqual(finalGridB);
    });
});
