import type { TileData } from './Tile';

export interface BoardState {
    tiles: TileData[];       // length 16, row-major
    selectedPath: TileData[]; // ordered selection for current word
}
