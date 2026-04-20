import { describe, expect, it } from 'vitest';
import { resolveRunContext } from '../utils/runContext';

describe('resolveRunContext', () => {
    it('defaults to normal endless mode when no seed is configured', () => {
        expect(resolveRunContext()).toEqual({
            mode: 'normal',
            seedKey: null,
            highScoreStorageKey: 'tangelo.endless.highScore',
            leaderboardLabel: 'Top players (global)',
        });
    });

    it('uses a manual under-the-hood seed when provided', () => {
        expect(resolveRunContext({ manualSeed: 'family-night' })).toEqual({
            mode: 'seeded',
            seedKey: 'family-night',
            highScoreStorageKey: 'tangelo.seeded.family-night.highScore',
            leaderboardLabel: 'Top players (this seed)',
        });
    });

    it('falls back to the shared daily seed when no manual override exists', () => {
        expect(resolveRunContext({ sharedSeed: 'daily-2026-04-20' })).toEqual({
            mode: 'seeded',
            seedKey: 'daily-2026-04-20',
            highScoreStorageKey: 'tangelo.seeded.daily-2026-04-20.highScore',
            leaderboardLabel: 'Top players (daily seed)',
        });
    });
});
