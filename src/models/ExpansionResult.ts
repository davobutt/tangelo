import type { TileData } from './Tile';

export type BoardEdge = 'top' | 'right' | 'bottom' | 'left';

export interface ExpandedCellPlacement {
    edge: BoardEdge;
    tile: TileData;
}

export interface ExpansionResult {
    qualifiedEdges: BoardEdge[];
    expandedEdges: BoardEdge[];
    placements: ExpandedCellPlacement[];
}
