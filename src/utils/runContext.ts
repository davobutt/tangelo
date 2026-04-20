export type RunMode = 'normal' | 'seeded';

export interface RunContext {
    mode: RunMode;
    seedKey: string | null;
    highScoreStorageKey: string;
    leaderboardLabel: string;
}

export interface RunContextOptions {
    manualSeed?: unknown;
    sharedSeed?: string | undefined;
}

const NORMAL_HIGH_SCORE_KEY = 'tangelo.endless.highScore';

function normalizeSeed(seed: unknown): string | null {
    if (typeof seed !== 'string') {
        return null;
    }

    const trimmed = seed.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function createSeededHighScoreKey(seedKey: string): string {
    return `tangelo.seeded.${encodeURIComponent(seedKey)}.highScore`;
}

export function resolveRunContext(options: RunContextOptions = {}): RunContext {
    const manualSeed = normalizeSeed(options.manualSeed);
    if (manualSeed) {
        return {
            mode: 'seeded',
            seedKey: manualSeed,
            highScoreStorageKey: createSeededHighScoreKey(manualSeed),
            leaderboardLabel: 'Top players (this seed)',
        };
    }

    const sharedSeed = normalizeSeed(options.sharedSeed);
    if (sharedSeed) {
        return {
            mode: 'seeded',
            seedKey: sharedSeed,
            highScoreStorageKey: createSeededHighScoreKey(sharedSeed),
            leaderboardLabel: 'Top players (daily seed)',
        };
    }

    return {
        mode: 'normal',
        seedKey: null,
        highScoreStorageKey: NORMAL_HIGH_SCORE_KEY,
        leaderboardLabel: 'Top players (global)',
    };
}
