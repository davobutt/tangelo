import { describe, expect, it } from 'vitest';
import {
    EXPANSION_EDGE_BONUS_POINTS,
    scoreExpansionBonus,
    scoreSubmission,
    scoreWord,
} from '../utils/scoring';

describe('scoreWord', () => {
    it('returns zero for words shorter than three letters', () => {
        expect(scoreWord('IT')).toBe(0);
    });

    it('matches classic Boggle scores', () => {
        expect(scoreWord('CAT')).toBe(1);
        expect(scoreWord('TREE')).toBe(1);
        expect(scoreWord('CLOCK')).toBe(2);
        expect(scoreWord('PLANET')).toBe(3);
        expect(scoreWord('THEATRE')).toBe(5);
        expect(scoreWord('NEIGHBOUR')).toBe(11);
    });

    it('grants +4 points per expanded edge', () => {
        expect(EXPANSION_EDGE_BONUS_POINTS).toBe(4);
        expect(scoreExpansionBonus(1)).toBe(4);
        expect(scoreExpansionBonus(3)).toBe(12);
    });

    it('combines base score and edge bonus into total submission score', () => {
        const oneEdge = scoreSubmission(3, 1);
        expect(oneEdge).toEqual({
            baseScore: 3,
            expansionBonus: 4,
            totalScore: 7,
        });

        const fourEdges = scoreSubmission(2, 4);
        expect(fourEdges).toEqual({
            baseScore: 2,
            expansionBonus: 16,
            totalScore: 18,
        });
    });
});