import { describe, expect, it } from 'vitest';
import { createRoundState, ROUND_DURATION_SECONDS } from '../models/RoundState';
import { applyExpansionTimeBonus, EXPANSION_TIME_BONUS_SECONDS } from '../utils/endlessTimer';
import { tickRoundTimer } from '../utils/endlessRunLifecycle';

describe('endless timer integration', () => {
    it('fresh run starts at exactly 60 seconds and running status', () => {
        const round = createRoundState();

        expect(round.timeRemaining).toBe(ROUND_DURATION_SECONDS);
        expect(round.status).toBe('running');
    });

    it('adds +10 seconds when submission triggers one or more edge expansions', () => {
        const round = createRoundState();

        const bonus = applyExpansionTimeBonus(round, 1);

        expect(bonus).toBe(EXPANSION_TIME_BONUS_SECONDS);
        expect(round.timeRemaining).toBe(ROUND_DURATION_SECONDS + EXPANSION_TIME_BONUS_SECONDS);
    });

    it('does not add time when submission has no qualifying expansions', () => {
        const round = createRoundState();

        const bonus = applyExpansionTimeBonus(round, 0);

        expect(bonus).toBe(0);
        expect(round.timeRemaining).toBe(ROUND_DURATION_SECONDS);
    });

    it('does not add time when run has already ended', () => {
        const round = createRoundState();
        round.status = 'ended';

        const bonus = applyExpansionTimeBonus(round, 2);

        expect(bonus).toBe(0);
        expect(round.timeRemaining).toBe(ROUND_DURATION_SECONDS);
    });

    it('timer reaching zero transitions run to ended immediately', () => {
        const round = createRoundState();
        round.timeRemaining = 1;

        const ended = tickRoundTimer(round);

        expect(ended).toBe(true);
        expect(round.timeRemaining).toBe(0);
        expect(round.status).toBe('ended');
    });

    it('does not tick when run is already ended', () => {
        const round = createRoundState();
        round.status = 'ended';

        const ended = tickRoundTimer(round);

        expect(ended).toBe(false);
        expect(round.timeRemaining).toBe(ROUND_DURATION_SECONDS);
    });
});
