import { describe, expect, it } from 'vitest';
import { resolveRunContext } from '../utils/runContext';

describe('resolveRunContext', () => {
    it('defaults to normal endless mode when no seed is configured', () => {
        expect(resolveRunContext()).toEqual({
            mode: 'normal',
            launchMode: 'free-play',
            boardSeed: null,
            leaderboardSeedKey: null,
            highScoreStorageKey: 'tangelo.endless.highScore',
            leaderboardLabel: 'Top players (free play)',
            modeLabel: 'FREE PLAY',
            leaderboardModeLabel: 'FREE PLAY',
        });
    });

    it('uses a normalized custom code context for manual seeded runs', () => {
        expect(resolveRunContext({ launchMode: 'enter-code', manualSeed: ' Apple ' })).toEqual({
            mode: 'seeded',
            launchMode: 'enter-code',
            boardSeed: 'apple',
            leaderboardSeedKey: 'apple',
            highScoreStorageKey: 'tangelo.seeded.apple.highScore',
            leaderboardLabel: 'Top players (code APPLE)',
            modeLabel: 'CODE APPLE',
            leaderboardModeLabel: 'CODE APPLE',
        });
    });

    it('uses a backend-provided challenge context for challenge runs', () => {
        expect(resolveRunContext({
            launchMode: 'challenge',
            activeChallenge: {
                seedCode: 'Apple',
                leaderboardSeedKey: 'challenge:apple:101',
            },
        })).toEqual({
            mode: 'challenge',
            launchMode: 'challenge',
            boardSeed: 'apple',
            leaderboardSeedKey: 'challenge:apple:101',
            highScoreStorageKey: 'tangelo.challenge.challenge%3Aapple%3A101.highScore',
            leaderboardLabel: 'Top players (challenge APPLE)',
            modeLabel: 'CHALLENGE',
            leaderboardModeLabel: 'CHALLENGE APPLE',
        });
    });

    it('keeps compatibility with pre-selection shared-seed launches', () => {
        expect(resolveRunContext({ sharedSeed: 'daily-2026-04-20' })).toEqual({
            mode: 'challenge',
            launchMode: 'challenge',
            boardSeed: 'daily-2026-04-20',
            leaderboardSeedKey: 'daily-2026-04-20',
            highScoreStorageKey: 'tangelo.challenge.daily-2026-04-20.highScore',
            leaderboardLabel: 'Top players (challenge daily-2026-04-20)',
            modeLabel: 'CHALLENGE',
            leaderboardModeLabel: 'CHALLENGE daily-2026-04-20',
        });
    });

    it('does not enter custom code mode for invalid non-5-letter seeds', () => {
        expect(resolveRunContext({ launchMode: 'enter-code', manualSeed: 'abc' })).toEqual({
            mode: 'normal',
            launchMode: 'free-play',
            boardSeed: null,
            leaderboardSeedKey: null,
            highScoreStorageKey: 'tangelo.endless.highScore',
            leaderboardLabel: 'Top players (free play)',
            modeLabel: 'FREE PLAY',
            leaderboardModeLabel: 'FREE PLAY',
        });
    });

    it('falls back to free play when challenge mode is selected without a valid active challenge', () => {
        expect(resolveRunContext({
            launchMode: 'challenge',
            activeChallenge: {
                seedCode: 'bad',
                leaderboardSeedKey: '',
            },
        })).toEqual({
            mode: 'normal',
            launchMode: 'free-play',
            boardSeed: null,
            leaderboardSeedKey: null,
            highScoreStorageKey: 'tangelo.endless.highScore',
            leaderboardLabel: 'Top players (free play)',
            modeLabel: 'FREE PLAY',
            leaderboardModeLabel: 'FREE PLAY',
        });
    });
});
