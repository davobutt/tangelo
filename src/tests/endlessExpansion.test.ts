import { describe, it, expect } from 'vitest';
import type { TileData } from '../models/Tile';
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
});
