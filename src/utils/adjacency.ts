import type { TileData } from '../models/Tile';

/** Two tiles are adjacent if they differ by at most 1 in both row and col, and are not the same tile. */
export function isAdjacent(a: TileData, b: TileData): boolean {
    return (
        a.index !== b.index &&
        Math.abs(a.row - b.row) <= 1 &&
        Math.abs(a.col - b.col) <= 1
    );
}

/**
 * Returns true if the path is:
 * – at least one tile long
 * – every consecutive pair of tiles is adjacent
 * – no tile index appears more than once
 */
export function isValidPath(path: TileData[]): boolean {
    if (path.length === 0) return false;
    const seen = new Set<number>();
    for (let i = 0; i < path.length; i++) {
        const current = path[i];
        const prev = path[i - 1];
        if (!current) return false;
        if (seen.has(current.index)) return false;
        if (i > 0 && prev && !isAdjacent(prev, current)) return false;
        seen.add(current.index);
    }
    return true;
}

/** Returns true if `candidate` can be appended to the current path without violating adjacency or re-use rules. */
export function canAppendTile(path: TileData[], candidate: TileData): boolean {
    if (path.some((t) => t.index === candidate.index)) return false;
    if (path.length === 0) return true;
    const last = path[path.length - 1];
    return last !== undefined && isAdjacent(last, candidate);
}
