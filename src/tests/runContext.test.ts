import { describe, expect, it } from 'vitest';
import { resolveRunContext } from '../utils/runContext';

describe('resolveRunContext', () => {
    it('defaults to normal endless mode when no seed is configured', () => {
        expect(resolveRunContext()).toEqual({
            mode: 'normal',
            launchMode: 'free-play',
            seedKey: null,
            highScoreStorageKey: 'tangelo.endless.highScore',
            leaderboardLabel: 'Top players (free play)',
            modeLabel: 'FREE PLAY',
        });
    });

    it('uses a custom code context for manual seeded runs', () => {
        expect(resolveRunContext({ launchMode: 'enter-code', manualSeed: 'family-night' })).toEqual({
            mode: 'seeded',
            launchMode: 'enter-code',
            seedKey: 'family-night',
            highScoreStorageKey: 'tangelo.seeded.family-night.highScore',
            leaderboardLabel: 'Top players (code FAMILY-NIGHT)',
            modeLabel: 'CODE FAMILY-NIGHT',
        });
    });

    it('uses a challenge context for the shared challenge seed', () => {
        expect(resolveRunContext({ launchMode: 'challenge', sharedSeed: 'daily-2026-04-20' })).toEqual({
            mode: 'challenge',
            launchMode: 'challenge',
            seedKey: 'daily-2026-04-20',
            highScoreStorageKey: 'tangelo.challenge.daily-2026-04-20.highScore',
            leaderboardLabel: 'Top players (challenge)',
            modeLabel: 'CHALLENGE',
        });
    });

    it('keeps compatibility with pre-selection shared-seed launches', () => {
        expect(resolveRunContext({ sharedSeed: 'daily-2026-04-20' })).toEqual({
            mode: 'challenge',
            launchMode: 'challenge',
            seedKey: 'daily-2026-04-20',
            highScoreStorageKey: 'tangelo.challenge.daily-2026-04-20.highScore',
            leaderboardLabel: 'Top players (challenge)',
            modeLabel: 'CHALLENGE',
        });
    });
});
