import type { TileData } from '../models/Tile';

export interface BoardBounds {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
}

export function coordKey(row: number, col: number): string {
    return `${row},${col}`;
}

export function getBoardBounds(tiles: TileData[]): BoardBounds {
    if (tiles.length === 0) {
        return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
    }

    let minRow = tiles[0]?.row ?? 0;
    let maxRow = tiles[0]?.row ?? 0;
    let minCol = tiles[0]?.col ?? 0;
    let maxCol = tiles[0]?.col ?? 0;

    for (let i = 1; i < tiles.length; i++) {
        const tile = tiles[i];
        if (!tile) continue;
        minRow = Math.min(minRow, tile.row);
        maxRow = Math.max(maxRow, tile.row);
        minCol = Math.min(minCol, tile.col);
        maxCol = Math.max(maxCol, tile.col);
    }

    return { minRow, maxRow, minCol, maxCol };
}

export function buildOccupiedSet(tiles: TileData[]): Set<string> {
    const occupied = new Set<string>();
    for (const tile of tiles) {
        occupied.add(coordKey(tile.row, tile.col));
    }
    return occupied;
}

export function getNextTileIndex(tiles: TileData[]): number {
    if (tiles.length === 0) return 0;

    let maxIndex = -1;
    for (const tile of tiles) {
        maxIndex = Math.max(maxIndex, tile.index);
    }

    return maxIndex + 1;
}
