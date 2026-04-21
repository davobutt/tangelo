import { formatSeedCodeLabel, normalizeSeedCode } from './seedCode';

export type RunMode = 'normal' | 'challenge' | 'seeded';
export type LaunchMode = 'free-play' | 'challenge' | 'enter-code';

export interface RunContext {
    mode: RunMode;
    launchMode: LaunchMode;
    seedKey: string | null;
    highScoreStorageKey: string;
    leaderboardLabel: string;
    modeLabel: string;
}

export interface RunContextOptions {
    launchMode?: unknown;
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

function normalizeLaunchMode(mode: unknown): LaunchMode | null {
    switch (mode) {
        case 'free-play':
        case 'challenge':
        case 'enter-code':
            return mode;
        default:
            return null;
    }
}

export function createSeededHighScoreKey(seedKey: string): string {
    return `tangelo.seeded.${encodeURIComponent(seedKey)}.highScore`;
}

export function createChallengeHighScoreKey(seedKey: string): string {
    return `tangelo.challenge.${encodeURIComponent(seedKey)}.highScore`;
}

export function resolveRunContext(options: RunContextOptions = {}): RunContext {
    const launchMode = normalizeLaunchMode(options.launchMode);
    const manualSeed = normalizeSeedCode(options.manualSeed);
    if ((launchMode === 'enter-code' || (!launchMode && manualSeed)) && manualSeed) {
        const codeLabel = formatSeedCodeLabel(manualSeed);
        return {
            mode: 'seeded',
            launchMode: 'enter-code',
            seedKey: manualSeed,
            highScoreStorageKey: createSeededHighScoreKey(manualSeed),
            leaderboardLabel: `Top players (code ${codeLabel})`,
            modeLabel: `CODE ${codeLabel}`,
        };
    }

    const sharedSeed = normalizeSeed(options.sharedSeed);
    if ((launchMode === 'challenge' || (!launchMode && sharedSeed)) && sharedSeed) {
        return {
            mode: 'challenge',
            launchMode: 'challenge',
            seedKey: sharedSeed,
            highScoreStorageKey: createChallengeHighScoreKey(sharedSeed),
            leaderboardLabel: 'Top players (challenge)',
            modeLabel: 'CHALLENGE',
        };
    }

    return {
        mode: 'normal',
        launchMode: 'free-play',
        seedKey: null,
        highScoreStorageKey: NORMAL_HIGH_SCORE_KEY,
        leaderboardLabel: 'Top players (free play)',
        modeLabel: 'FREE PLAY',
    };
}
