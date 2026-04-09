import type { BoardEdge, ExpansionResult } from '../models/ExpansionResult';
import type { TileData } from '../models/Tile';
import {
    buildOccupiedSet,
    coordKey,
    getBoardBounds,
    getNextTileIndex,
    type BoardBounds,
} from './boardGeometry';

const LETTERS_PER_EDGE = 4;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface ExpansionOptions {
    lettersPerEdge?: number;
    letterGenerator?: () => string;
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

function touchesEdge(tile: TileData, edge: BoardEdge, bounds: BoardBounds): boolean {
    if (edge === 'top') return tile.row === bounds.minRow;
    if (edge === 'bottom') return tile.row === bounds.maxRow;
    if (edge === 'left') return tile.col === bounds.minCol;
    return tile.col === bounds.maxCol;
}

function edgeAxisValue(tile: TileData, edge: BoardEdge): number {
    return edge === 'top' || edge === 'bottom' ? tile.col : tile.row;
}

function axisCornerDistance(axis: number, axisMin: number, axisMax: number): number {
    return Math.min(Math.abs(axis - axisMin), Math.abs(axisMax - axis));
}

function buildEdgeCells(edge: BoardEdge, bounds: BoardBounds): AxisPlacement[] {
    const placements: AxisPlacement[] = [];

    if (edge === 'top' || edge === 'bottom') {
        const row = edge === 'top' ? bounds.minRow - 1 : bounds.maxRow + 1;
        for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
            placements.push({ row, col, axis: col });
        }
        return placements;
    }

    const col = edge === 'left' ? bounds.minCol - 1 : bounds.maxCol + 1;
    for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
        placements.push({ row, col, axis: row });
    }
    return placements;
}

function planEdgePlacements(
    edge: BoardEdge,
    edgeTiles: TileData[],
    bounds: BoardBounds,
    occupied: Set<string>,
    lettersPerEdge: number,
): AxisPlacement[] {
    const edgeCells = buildEdgeCells(edge, bounds);
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

    const bounds = getBoardBounds(tiles);
    const edgeCounts: Record<BoardEdge, number> = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    };

    for (const tile of path) {
        if (tile.row === bounds.minRow) edgeCounts.top += 1;
        if (tile.row === bounds.maxRow) edgeCounts.bottom += 1;
        if (tile.col === bounds.minCol) edgeCounts.left += 1;
        if (tile.col === bounds.maxCol) edgeCounts.right += 1;
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

    const bounds = getBoardBounds(tiles);
    const occupied = buildOccupiedSet(tiles);
    const qualifiedEdges = getQualifiedEdges(path, tiles);
    const expandedEdges: BoardEdge[] = [];
    const placements: ExpansionResult['placements'] = [];

    let nextIndex = getNextTileIndex(tiles);

    for (const edge of qualifiedEdges) {
        const edgeTiles = path.filter((tile) => touchesEdge(tile, edge, bounds));
        const planned = planEdgePlacements(edge, edgeTiles, bounds, occupied, lettersPerEdge);

        if (planned.length > 0) {
            expandedEdges.push(edge);
        }

        for (const cell of planned) {
            const tile: TileData = {
                index: nextIndex,
                row: cell.row,
                col: cell.col,
                letter: normalizeLetter(letterGenerator()),
            };
            nextIndex += 1;
            occupied.add(coordKey(cell.row, cell.col));
            tiles.push(tile);
            placements.push({ edge, tile });
        }
    }

    return {
        qualifiedEdges,
        expandedEdges,
        placements,
    };
}
