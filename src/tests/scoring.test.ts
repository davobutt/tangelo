import { describe, expect, it } from 'vitest';
import { scoreWord } from '../utils/scoring';

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
});