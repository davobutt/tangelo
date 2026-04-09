import { describe, it, expect, beforeEach } from 'vitest';
import { submitWord } from '../utils/submission';
import { createRoundState } from '../models/RoundState';
import type { TileData } from '../models/Tile';
import type { RoundState } from '../models/RoundState';

function tile(index: number, letter: string): TileData {
    return { index, row: Math.floor(index / 4), col: index % 4, letter };
}

// Valid 3-tile horizontal path: [0,1,2] → row 0, cols 0-1-2
const validPath = [tile(0, 'C'), tile(1, 'A'), tile(2, 'T')]; // "CAT"
const shortPath = [tile(0, 'I'), tile(1, 'T')]; // "IT" – too short
const duplicatePath = [tile(4, 'D'), tile(5, 'O'), tile(6, 'G')]; // "DOG"

let round: RoundState;

beforeEach(() => {
    round = createRoundState();
    round.status = 'running';
});

describe('submitWord', () => {
    it('accepts a valid word and adds it to submittedWords', () => {
        const result = submitWord(round, validPath);
        expect(result.accepted).toBe(true);
        expect(result.word).toBe('CAT');
        expect(round.submittedWords).toContain('CAT');
    });

    it('rejects submission when round has not started (idle)', () => {
        round.status = 'idle';
        const result = submitWord(round, validPath);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('round_not_running');
    });

    it('rejects submission after round ends', () => {
        round.status = 'ended';
        const result = submitWord(round, validPath);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('round_not_running');
    });

    it('rejects words shorter than 3 letters', () => {
        const result = submitWord(round, shortPath);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('too_short');
    });

    it('rejects duplicate words in the same round', () => {
        submitWord(round, validPath); // first submission accepts
        const second = submitWord(round, validPath);
        expect(second.accepted).toBe(false);
        if (!second.accepted) expect(second.reason).toBe('duplicate');
    });

    it('allows two different valid words in one round', () => {
        const r1 = submitWord(round, validPath);
        const r2 = submitWord(round, duplicatePath);
        expect(r1.accepted).toBe(true);
        expect(r2.accepted).toBe(true);
        expect(round.submittedWords).toHaveLength(2);
    });

    it('rejects invalid path (non-adjacent tiles)', () => {
        const nonAdjacentPath = [tile(0, 'C'), tile(2, 'A'), tile(8, 'T')];
        const result = submitWord(round, nonAdjacentPath);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('invalid_path');
    });

    it('does not mutate submittedWords on rejection', () => {
        round.status = 'ended';
        submitWord(round, validPath);
        expect(round.submittedWords).toHaveLength(0);
    });
});
