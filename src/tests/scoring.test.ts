import { describe, expect, it } from 'vitest';
import {
    EXPANSION_EDGE_BONUS_MULTIPLIER,
    scoreExpansionBonus,
    scoreSubmission,
    scoreWord,
} from '../utils/scoring';

describe('scoreWord', () => {
    it('returns zero for words shorter than three letters', () => {
        expect(scoreWord('IT')).toBe(0);
    });

    it('matches standard word-game scores', () => {
        expect(scoreWord('CAT')).toBe(1);
        expect(scoreWord('TREE')).toBe(1);
        expect(scoreWord('CLOCK')).toBe(2);
        expect(scoreWord('PLANET')).toBe(3);
        expect(scoreWord('THEATRE')).toBe(5);
        expect(scoreWord('NEIGHBOUR')).toBe(11);
    });

    it('grants 2x accepted word score per expanded edge', () => {
        expect(EXPANSION_EDGE_BONUS_MULTIPLIER).toBe(2);
        expect(scoreExpansionBonus(3, 1)).toBe(6);
        expect(scoreExpansionBonus(2, 2)).toBe(8);
        expect(scoreExpansionBonus(5, 0)).toBe(0);
    });

    it('combines base score and per-edge bonus into total submission score', () => {
        const oneEdge = scoreSubmission(3, 1);
        expect(oneEdge).toEqual({
            baseScore: 3,
            expansionBonus: 6,
            totalScore: 9,
        });

        const twoEdges = scoreSubmission(2, 2);
        expect(twoEdges).toEqual({
            baseScore: 2,
            expansionBonus: 8,
            totalScore: 10,
        });

        const noExpansion = scoreSubmission(11, 0);
        expect(noExpansion).toEqual({
            baseScore: 11,
            expansionBonus: 0,
            totalScore: 11,
        });
    });
});
