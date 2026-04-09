import { describe, it, expect, beforeEach } from 'vitest';
import { submitWord } from '../utils/submission';
import { createRoundState } from '../models/RoundState';
import type { TileData } from '../models/Tile';
import type { RoundState } from '../models/RoundState';
import { DictionaryService } from '../utils/dictionary';

function tile(index: number, letter: string): TileData {
    return { index, row: Math.floor(index / 4), col: index % 4, letter };
}

// Valid 3-tile horizontal path: [0,1,2] → row 0, cols 0-1-2
const validPath = [tile(0, 'C'), tile(1, 'A'), tile(2, 'T')]; // "CAT"
const shortPath = [tile(0, 'I'), tile(1, 'T')]; // "IT" – too short
const duplicatePath = [tile(4, 'D'), tile(5, 'O'), tile(6, 'G')]; // "DOG"

let round: RoundState;
let dictionary: DictionaryService;

beforeEach(() => {
    round = createRoundState();
    round.status = 'running';
    dictionary = new DictionaryService(['CAT', 'DOG', 'THEATRE', 'NEIGHBOUR']);
});

describe('submitWord', () => {
    it('accepts a valid word and adds it to submittedWords', () => {
        const result = submitWord(round, validPath, dictionary);
        expect(result.accepted).toBe(true);
        expect(result.word).toBe('CAT');
        if (result.accepted) expect(result.score).toBe(1);
        expect(round.submittedWords).toContain('CAT');
        expect(round.score).toBe(1);
        expect(round.wordHistory[0]).toMatchObject({ status: 'accepted', word: 'CAT', score: 1 });
    });

    it('rejects submission when round has not started (idle)', () => {
        round.status = 'idle';
        const result = submitWord(round, validPath, dictionary);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('round_not_running');
    });

    it('rejects submission after round ends', () => {
        round.status = 'ended';
        const result = submitWord(round, validPath, dictionary);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('round_not_running');
    });

    it('rejects words shorter than 3 letters', () => {
        const result = submitWord(round, shortPath, dictionary);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('too_short');
    });

    it('rejects duplicate words in the same round', () => {
        submitWord(round, validPath, dictionary); // first submission accepts
        const second = submitWord(round, validPath, dictionary);
        expect(second.accepted).toBe(false);
        if (!second.accepted) expect(second.reason).toBe('duplicate');
    });

    it('allows two different valid words in one round', () => {
        const r1 = submitWord(round, validPath, dictionary);
        const r2 = submitWord(round, duplicatePath, dictionary);
        expect(r1.accepted).toBe(true);
        expect(r2.accepted).toBe(true);
        expect(round.submittedWords).toHaveLength(2);
        expect(round.score).toBe(2);
    });

    it('rejects invalid path (non-adjacent tiles)', () => {
        const nonAdjacentPath = [tile(0, 'C'), tile(2, 'A'), tile(8, 'T')];
        const result = submitWord(round, nonAdjacentPath, dictionary);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('invalid_path');
    });

    it('rejects words that are not in the dictionary', () => {
        const result = submitWord(round, [tile(0, 'F'), tile(1, 'O'), tile(2, 'X')], dictionary);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('not_in_dictionary');
        expect(round.wordHistory[0]).toMatchObject({ status: 'rejected', word: 'FOX', reason: 'not_in_dictionary' });
    });

    it('scores eight-plus-letter words as eleven points', () => {
        const longPath = [
            tile(0, 'N'),
            tile(1, 'E'),
            tile(2, 'I'),
            tile(3, 'G'),
            tile(7, 'H'),
            tile(6, 'B'),
            tile(5, 'O'),
            tile(4, 'U'),
            tile(8, 'R'),
        ];

        const result = submitWord(round, longPath, dictionary);
        expect(result.accepted).toBe(true);
        if (result.accepted) expect(result.score).toBe(11);
        expect(round.score).toBe(11);
    });

    it('does not mutate submittedWords on rejection', () => {
        round.status = 'ended';
        submitWord(round, validPath, dictionary);
        expect(round.submittedWords).toHaveLength(0);
    });
});
