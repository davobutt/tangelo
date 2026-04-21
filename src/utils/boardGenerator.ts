import type { TileData } from '../models/Tile';
import { generateOpeningLetters } from './playableLetterGeneration';

export interface BoardGenerationOptions {
    seed?: string;
}

/**
 * Generates a 4×4 board in row-major order.
 * Seeded and unseeded boards use the shared playability-focused generation policy.
 */
export function generateBoard(options: BoardGenerationOptions = {}): TileData[] {
    return generateOpeningLetters(options.seed).map((letter, position) => {
        const row = Math.floor(position / 4);
        const col = position % 4;
        return { index: position, row, col, letter };
    });
}
