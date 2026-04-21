import { describe, expect, it } from 'vitest';
import type { TileData } from '../models/Tile';
import { isValidPath } from '../utils/adjacency';
import { generateBoard } from '../utils/boardGenerator';
import { CURATED_SEED_DEFINITIONS } from '../utils/curatedSeedConfig';
import { applyEdgeExpansions } from '../utils/endlessExpansion';
import { validateCuratedSeedDefinitions } from '../utils/playableLetterGeneration';

function findWordPath(board: TileData[], word: string): TileData[] | null {
    const visit = (path: TileData[], remaining: string): TileData[] | null => {
        const nextLetter = remaining[0];
        if (!nextLetter) {
            return path;
        }

        const previous = path[path.length - 1];
        const candidates = board.filter((tile) => {
            if (tile.letter !== nextLetter || path.some((used) => used.index === tile.index)) {
                return false;
            }
            if (!previous) {
                return true;
            }

            return (
                Math.abs(tile.row - previous.row) <= 1 &&
                Math.abs(tile.col - previous.col) <= 1 &&
                !(tile.row === previous.row && tile.col === previous.col)
            );
        });

        for (const candidate of candidates) {
            const result = visit([...path, candidate], remaining.slice(1));
            if (result) {
                return result;
            }
        }

        return null;
    };

    return visit([], word);
}

function findTile(tiles: TileData[], row: number, col: number): TileData {
    const tile = tiles.find((candidate) => candidate.row === row && candidate.col === col);
    if (!tile) {
        throw new Error(`Missing tile at (${row}, ${col})`);
    }
    return tile;
}

describe('curated seeded boards', () => {
    it('always includes every configured hidden word as a legal path', () => {
        for (const definition of CURATED_SEED_DEFINITIONS) {
            const board = generateBoard({ seed: definition.seed });

            for (const word of definition.hiddenWords) {
                const path = findWordPath(board, word);
                expect(path, `missing ${word} for ${definition.seed}`).not.toBeNull();
                expect(isValidPath(path ?? [])).toBe(true);
            }
        }
    });

    it('keeps curated seeds deterministic for both opening boards and expansions', () => {
        const seed = CURATED_SEED_DEFINITIONS[0]?.seed ?? 'lemon';
        const boardA = generateBoard({ seed });
        const boardB = generateBoard({ seed });
        const topPathA = [findTile(boardA, 0, 0), findTile(boardA, 0, 1), findTile(boardA, 0, 2)];
        const topPathB = [findTile(boardB, 0, 0), findTile(boardB, 0, 1), findTile(boardB, 0, 2)];

        const expansionA = applyEdgeExpansions(boardA, topPathA, { seed });
        const expansionB = applyEdgeExpansions(boardB, topPathB, { seed });

        expect(boardA).toEqual(boardB);
        expect(expansionA.placements.map((placement) => placement.tile)).toEqual(
            expansionB.placements.map((placement) => placement.tile),
        );
    });

    it('leaves non-curated seeds on the normal seeded generation path', () => {
        const board = generateBoard({ seed: 'peach' });
        const replay = generateBoard({ seed: 'peach' });

        expect(board).toEqual(replay);
        expect(findWordPath(board, 'LEMON')).toBeNull();
    });

    it('rejects invalid curated definitions with a clear error', () => {
        expect(() =>
            validateCuratedSeedDefinitions([
                {
                    seed: 'lemon',
                    theme: 'broken',
                    hiddenWords: [],
                },
            ]),
        ).toThrow(/at least one hidden word/i);
    });
});
