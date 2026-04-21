import { describe, expect, it } from 'vitest';
import type { TileData } from '../models/Tile';
import { isValidPath } from '../utils/adjacency';
import { generateBoard } from '../utils/boardGenerator';
import { CURATED_SEED_DEFINITIONS } from '../utils/curatedSeedConfig';
import { applyEdgeExpansions } from '../utils/endlessExpansion';
import { getCuratedHiddenWordBonus, validateCuratedSeedDefinitions } from '../utils/playableLetterGeneration';

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

function revealFirstExpansionRing(seed: string): TileData[] {
    const board = generateBoard({ seed });
    const perimeterPath = [
        findTile(board, 0, 0),
        findTile(board, 0, 1),
        findTile(board, 0, 2),
        findTile(board, 0, 3),
        findTile(board, 1, 3),
        findTile(board, 2, 3),
        findTile(board, 3, 3),
        findTile(board, 3, 2),
        findTile(board, 3, 1),
        findTile(board, 3, 0),
        findTile(board, 2, 0),
        findTile(board, 1, 0),
    ];

    applyEdgeExpansions(board, perimeterPath, { seed });
    return board;
}

function revealCuratedHiddenWordGrid(seed: string): TileData[] {
    const board = revealFirstExpansionRing(seed);

    if (seed === 'moose') {
        const cornerRevealPath = [findTile(board, -1, 0), findTile(board, 0, -1)];
        applyEdgeExpansions(board, cornerRevealPath, { seed });
    }

    return board;
}

describe('curated seeded boards', () => {
    it('always includes every configured hidden word as a legal path', () => {
        for (const definition of CURATED_SEED_DEFINITIONS) {
            const board = revealCuratedHiddenWordGrid(definition.seed);

            for (const word of definition.hiddenWords) {
                const path = findWordPath(board, word);
                expect(path, `missing ${word} for ${definition.seed}`).not.toBeNull();
                expect(isValidPath(path ?? [])).toBe(true);
            }
        }
    });

    it('keeps curated seeds deterministic for both opening boards and expansions', () => {
        const seed = CURATED_SEED_DEFINITIONS.find((definition) => definition.seed === 'moose')?.seed ?? 'moose';
        const boardA = generateBoard({ seed });
        const boardB = generateBoard({ seed });
        const perimeterPathA = [
            findTile(boardA, 0, 0),
            findTile(boardA, 0, 1),
            findTile(boardA, 0, 2),
            findTile(boardA, 0, 3),
            findTile(boardA, 1, 3),
            findTile(boardA, 2, 3),
            findTile(boardA, 3, 3),
            findTile(boardA, 3, 2),
            findTile(boardA, 3, 1),
            findTile(boardA, 3, 0),
            findTile(boardA, 2, 0),
            findTile(boardA, 1, 0),
        ];
        const perimeterPathB = [
            findTile(boardB, 0, 0),
            findTile(boardB, 0, 1),
            findTile(boardB, 0, 2),
            findTile(boardB, 0, 3),
            findTile(boardB, 1, 3),
            findTile(boardB, 2, 3),
            findTile(boardB, 3, 3),
            findTile(boardB, 3, 2),
            findTile(boardB, 3, 1),
            findTile(boardB, 3, 0),
            findTile(boardB, 2, 0),
            findTile(boardB, 1, 0),
        ];

        const expansionA = applyEdgeExpansions(boardA, perimeterPathA, { seed });
        const expansionB = applyEdgeExpansions(boardB, perimeterPathB, { seed });

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

    it('keeps moose hidden words in the expanded ring instead of the opening 4x4', () => {
        const openingBoard = generateBoard({ seed: 'moose' });
        const expandedBoard = revealCuratedHiddenWordGrid('moose');

        for (const word of ['DOG', 'CHIVE', 'BONE', 'WOOF']) {
            const openingPath = findWordPath(openingBoard, word);
            const expandedPath = findWordPath(expandedBoard, word);

            expect(expandedPath, `missing expanded path for ${word}`).not.toBeNull();
            expect((expandedPath ?? []).some((tile) => tile.row < 0 || tile.row > 3 || tile.col < 0 || tile.col > 3)).toBe(true);
            if (openingPath) {
                expect(openingPath.some((tile) => tile.row < 0 || tile.row > 3 || tile.col < 0 || tile.col > 3)).toBe(false);
            }
        }
    });

    it('awards a per-letter bonus for curated hidden words only', () => {
        expect(getCuratedHiddenWordBonus('moose', 'dog')).toBe(3);
        expect(getCuratedHiddenWordBonus('moose', 'chive')).toBe(5);
        expect(getCuratedHiddenWordBonus('moose', 'cat')).toBe(0);
        expect(getCuratedHiddenWordBonus('peach', 'dog')).toBe(0);
    });
});
