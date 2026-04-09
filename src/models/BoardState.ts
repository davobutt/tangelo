import type { TileData } from './Tile';

export interface BoardState {
    tiles: TileData[];       // sparse/irregular board occupancy
    selectedPath: TileData[]; // ordered selection for current word
}
