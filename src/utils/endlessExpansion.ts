import type { BoardEdge, ExpansionResult } from '../models/ExpansionResult';
import type { TileData } from '../models/Tile';
import {
    buildOccupiedSet,
    coordKey,
    getBoardBounds,
    getNextTileIndex,
    type BoardBounds,
} from './boardGeometry';
import { getSeededLetter } from './seededGeneration';

const LETTERS_PER_EDGE = 4;
const MAX_BOARD_DIMENSION = 10;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface ExpansionOptions {
    lettersPerEdge?: number;
    letterGenerator?: () => string;
    seed?: string;
}

interface AxisPlacement {
    row: number;
    col: number;
    axis: number;
}

function randomLetter(): string {
    const index = Math.floor(Math.random() * ALPHABET.length);
    const letter = ALPHABET[index];
    return letter ?? 'A';
}

function normalizeLetter(raw: string): string {
    const normalized = raw.trim().toUpperCase();
    return normalized.length > 0 ? normalized[0] ?? 'A' : 'A';
}

function isFrontierTile(tile: TileData, edge: BoardEdge, occupied: Set<string>): boolean {
    if (edge === 'top') return !occupied.has(coordKey(tile.row - 1, tile.col));
    if (edge === 'bottom') return !occupied.has(coordKey(tile.row + 1, tile.col));
    if (edge === 'left') return !occupied.has(coordKey(tile.row, tile.col - 1));
    return !occupied.has(coordKey(tile.row, tile.col + 1));
}

function edgeAxisValue(tile: TileData, edge: BoardEdge): number {
    return edge === 'top' || edge === 'bottom' ? tile.col : tile.row;
}

function axisCornerDistance(axis: number, axisMin: number, axisMax: number): number {
    return Math.min(Math.abs(axis - axisMin), Math.abs(axisMax - axis));
}

function boardSpan(min: number, max: number): number {
    return max - min + 1;
}

function canPlaceWithinBoardCap(cell: AxisPlacement, bounds: BoardBounds): boolean {
    const nextMinRow = Math.min(bounds.minRow, cell.row);
    const nextMaxRow = Math.max(bounds.maxRow, cell.row);
    const nextMinCol = Math.min(bounds.minCol, cell.col);
    const nextMaxCol = Math.max(bounds.maxCol, cell.col);

    return (
        boardSpan(nextMinRow, nextMaxRow) <= MAX_BOARD_DIMENSION &&
        boardSpan(nextMinCol, nextMaxCol) <= MAX_BOARD_DIMENSION
    );
}

function extendBounds(bounds: BoardBounds, row: number, col: number): void {
    bounds.minRow = Math.min(bounds.minRow, row);
    bounds.maxRow = Math.max(bounds.maxRow, row);
    bounds.minCol = Math.min(bounds.minCol, col);
    bounds.maxCol = Math.max(bounds.maxCol, col);
}

function buildFrontierEdgeCells(
    edge: BoardEdge,
    allTiles: TileData[],
    occupied: Set<string>,
): AxisPlacement[] {
    const placements: AxisPlacement[] = [];

    if (edge === 'top' || edge === 'bottom') {
        const byCol = new Map<number, number>();
        for (const tile of allTiles) {
            const existing = byCol.get(tile.col);
            if (edge === 'top') {
                if (existing === undefined || tile.row < existing) byCol.set(tile.col, tile.row);
            } else {
                if (existing === undefined || tile.row > existing) byCol.set(tile.col, tile.row);
            }
        }
        for (const [col, row] of byCol) {
            const nextRow = edge === 'top' ? row - 1 : row + 1;
            if (!occupied.has(coordKey(nextRow, col))) {
                placements.push({ row: nextRow, col, axis: col });
            }
        }
    } else {
        const byRow = new Map<number, number>();
        for (const tile of allTiles) {
            const existing = byRow.get(tile.row);
            if (edge === 'left') {
                if (existing === undefined || tile.col < existing) byRow.set(tile.row, tile.col);
            } else {
                if (existing === undefined || tile.col > existing) byRow.set(tile.row, tile.col);
            }
        }
        for (const [row, col] of byRow) {
            const nextCol = edge === 'left' ? col - 1 : col + 1;
            if (!occupied.has(coordKey(row, nextCol))) {
                placements.push({ row, col: nextCol, axis: row });
            }
        }
    }

    placements.sort((a, b) => a.axis - b.axis);
    return placements;
}

function planEdgePlacements(
    edge: BoardEdge,
    edgeTiles: TileData[],
    allTiles: TileData[],
    occupied: Set<string>,
    lettersPerEdge: number,
    bounds: BoardBounds,
): AxisPlacement[] {
    const edgeCells = buildFrontierEdgeCells(edge, allTiles, occupied)
        .filter((cell) => canPlaceWithinBoardCap(cell, bounds));
    if (edgeCells.length === 0) return [];

    const axisCenter =
        edgeTiles.reduce((sum, tile) => sum + edgeAxisValue(tile, edge), 0) /
        edgeTiles.length;

    const axisMin = edgeCells[0]?.axis ?? 0;
    const axisMax = edgeCells[edgeCells.length - 1]?.axis ?? axisMin;

    const contiguousStarts = edgeCells.length >= lettersPerEdge
        ? Array.from({ length: edgeCells.length - lettersPerEdge + 1 }, (_, i) => i)
        : [];

    const candidateBlocks = contiguousStarts
        .map((start) => {
            const block = edgeCells.slice(start, start + lettersPerEdge);
            const occupiedCount = block.filter((cell) => occupied.has(coordKey(cell.row, cell.col))).length;
            const cornerPenalty = block.filter((cell) =>
                cell.axis === axisMin || cell.axis === axisMax,
            ).length;
            const blockStart = block[0]?.axis ?? 0;
            const blockEnd = block[block.length - 1]?.axis ?? blockStart;
            const center = (blockStart + blockEnd) / 2;
            const centerDistance = Math.abs(center - axisCenter);
            return { block, occupiedCount, cornerPenalty, centerDistance };
        })
        .sort((a, b) => {
            if (a.occupiedCount !== b.occupiedCount) return a.occupiedCount - b.occupiedCount;
            if (a.cornerPenalty !== b.cornerPenalty) return a.cornerPenalty - b.cornerPenalty;
            return a.centerDistance - b.centerDistance;
        });

    for (const candidate of candidateBlocks) {
        const available = candidate.block.filter((cell) => !occupied.has(coordKey(cell.row, cell.col)));
        if (available.length === lettersPerEdge) {
            return available;
        }
    }

    const availableCells = edgeCells
        .filter((cell) => !occupied.has(coordKey(cell.row, cell.col)))
        .sort((a, b) => {
            const aCornerDistance = axisCornerDistance(a.axis, axisMin, axisMax);
            const bCornerDistance = axisCornerDistance(b.axis, axisMin, axisMax);
            if (aCornerDistance !== bCornerDistance) {
                return bCornerDistance - aCornerDistance;
            }
            return Math.abs(a.axis - axisCenter) - Math.abs(b.axis - axisCenter);
        });

    return availableCells.slice(0, lettersPerEdge);
}

export function getQualifiedEdges(path: TileData[], tiles: TileData[]): BoardEdge[] {
    if (path.length < 2 || tiles.length === 0) return [];

    const occupied = buildOccupiedSet(tiles);
    const edgeCounts: Record<BoardEdge, number> = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    };

    for (const tile of path) {
        if (isFrontierTile(tile, 'top', occupied)) edgeCounts.top += 1;
        if (isFrontierTile(tile, 'bottom', occupied)) edgeCounts.bottom += 1;
        if (isFrontierTile(tile, 'left', occupied)) edgeCounts.left += 1;
        if (isFrontierTile(tile, 'right', occupied)) edgeCounts.right += 1;
    }

    return (['top', 'right', 'bottom', 'left'] as const).filter(
        (edge) => edgeCounts[edge] >= 2,
    );
}

/**
 * Applies endless-mode edge expansions for a submitted path.
 * Mutates `tiles` by appending newly generated tiles.
 */
export function applyEdgeExpansions(
    tiles: TileData[],
    path: TileData[],
    options: ExpansionOptions = {},
): ExpansionResult {
    if (tiles.length === 0) {
        return { qualifiedEdges: [], expandedEdges: [], placements: [] };
    }

    const lettersPerEdge = options.lettersPerEdge ?? LETTERS_PER_EDGE;
    const letterGenerator = options.letterGenerator ?? randomLetter;
    const seed = options.seed;

    const occupied = buildOccupiedSet(tiles);
    const bounds = getBoardBounds(tiles);
    const qualifiedEdges = getQualifiedEdges(path, tiles);
    const expandedEdges: BoardEdge[] = [];
    const placements: ExpansionResult['placements'] = [];

    let nextIndex = getNextTileIndex(tiles);

    for (const edge of qualifiedEdges) {
        const edgeTiles = path.filter((tile) => isFrontierTile(tile, edge, occupied));
        const planned = planEdgePlacements(edge, edgeTiles, tiles, occupied, lettersPerEdge, bounds);

        if (planned.length > 0) {
            expandedEdges.push(edge);
        }

        for (const cell of planned) {
            if (!canPlaceWithinBoardCap(cell, bounds)) {
                continue;
            }

            const tile: TileData = {
                index: nextIndex,
                row: cell.row,
                col: cell.col,
                letter: seed
                    ? getSeededLetter(seed, cell.row, cell.col)
                    : normalizeLetter(letterGenerator()),
            };
            nextIndex += 1;
            occupied.add(coordKey(cell.row, cell.col));
            tiles.push(tile);
            extendBounds(bounds, cell.row, cell.col);
            placements.push({ edge, tile });
        }
    }

    return {
        qualifiedEdges,
        expandedEdges,
        placements,
    };
}
