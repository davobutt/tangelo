import type { TileData } from '../models/Tile';

/**
 * Classic Boggle dice (16 dice, 6 faces each).
 * Each round: shuffle the dice, pick one random face per die, assign to board position.
 */
const BOGGLE_DICE: string[][] = [
    ['A', 'A', 'E', 'E', 'G', 'N'],
    ['E', 'L', 'R', 'T', 'T', 'Y'],
    ['A', 'O', 'O', 'T', 'T', 'W'],
    ['A', 'B', 'B', 'J', 'O', 'O'],
    ['E', 'H', 'R', 'T', 'V', 'W'],
    ['C', 'I', 'M', 'O', 'T', 'U'],
    ['D', 'I', 'S', 'T', 'T', 'Y'],
    ['E', 'I', 'O', 'S', 'S', 'T'],
    ['D', 'E', 'L', 'R', 'V', 'Y'],
    ['A', 'C', 'H', 'O', 'P', 'S'],
    ['H', 'I', 'M', 'N', 'Q', 'U'],
    ['E', 'E', 'I', 'N', 'S', 'U'],
    ['E', 'E', 'G', 'H', 'N', 'W'],
    ['A', 'F', 'F', 'K', 'P', 'S'],
    ['H', 'L', 'N', 'N', 'R', 'Z'],
    ['D', 'E', 'I', 'L', 'R', 'X'],
];

function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

/** Fisher-Yates shuffle (in-place) */
function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        const tmp = arr[i] as T;
        arr[i] = arr[j] as T;
        arr[j] = tmp;
    }
    return arr;
}

/**
 * Generates a randomized 4×4 board using classic Boggle dice.
 * Returns exactly 16 TileData objects in row-major order.
 */
export function generateBoard(): TileData[] {
    const diceOrder = shuffle([...Array(16).keys()]); // permuted die indices

    return diceOrder.map((dieIndex, position) => {
        const die = BOGGLE_DICE[dieIndex] ?? BOGGLE_DICE[0]!;
        const face = die[randomInt(6)] ?? 'A';
        const row = Math.floor(position / 4);
        const col = position % 4;
        return { index: position, row, col, letter: face };
    });
}
