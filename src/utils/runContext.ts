import { formatSeedCodeLabel, normalizeSeedCode } from './seedCode';

export type RunMode = 'normal' | 'challenge' | 'seeded';
export type LaunchMode = 'free-play' | 'challenge' | 'enter-code';

export interface RunContext {
    mode: RunMode;
    launchMode: LaunchMode;
    boardSeed: string | null;
    leaderboardSeedKey: string | null;
    highScoreStorageKey: string;
    leaderboardLabel: string;
    modeLabel: string;
    leaderboardModeLabel: string;
}

export interface ActiveChallengeConfig {
    seedCode: string;
    leaderboardSeedKey: string;
}

export interface RunContextOptions {
    launchMode?: unknown;
    manualSeed?: unknown;
    activeChallenge?: ActiveChallengeConfig | null;
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

function normalizeActiveChallenge(activeChallenge: ActiveChallengeConfig | null | undefined): ActiveChallengeConfig | null {
    if (!activeChallenge) {
        return null;
    }

    const seedCode = normalizeSeedCode(activeChallenge.seedCode);
    const leaderboardSeedKey = normalizeSeed(activeChallenge.leaderboardSeedKey);
    if (!seedCode || !leaderboardSeedKey) {
        return null;
    }

    return {
        seedCode,
        leaderboardSeedKey,
    };
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

function formatChallengeSeedLabel(seed: string): string {
    const trimmed = seed.trim();
    return /^[a-zA-Z]{5}$/.test(trimmed) ? formatSeedCodeLabel(trimmed) : trimmed;
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
            boardSeed: manualSeed,
            leaderboardSeedKey: manualSeed,
            highScoreStorageKey: createSeededHighScoreKey(manualSeed),
            leaderboardLabel: `Top players (code ${codeLabel})`,
            modeLabel: `CODE ${codeLabel}`,
            leaderboardModeLabel: `CODE ${codeLabel}`,
        };
    }

    const activeChallenge = normalizeActiveChallenge(options.activeChallenge);
    if (launchMode === 'challenge' && activeChallenge) {
        const challengeLabel = formatChallengeSeedLabel(activeChallenge.seedCode);
        return {
            mode: 'challenge',
            launchMode: 'challenge',
            boardSeed: activeChallenge.seedCode,
            leaderboardSeedKey: activeChallenge.leaderboardSeedKey,
            highScoreStorageKey: createChallengeHighScoreKey(activeChallenge.leaderboardSeedKey),
            leaderboardLabel: `Top players (challenge ${challengeLabel})`,
            modeLabel: 'CHALLENGE',
            leaderboardModeLabel: `CHALLENGE ${challengeLabel}`,
        };
    }

    const sharedSeed = normalizeSeed(options.sharedSeed);
    if ((launchMode === 'challenge' || (!launchMode && sharedSeed)) && sharedSeed) {
        const challengeLabel = formatChallengeSeedLabel(sharedSeed);
        return {
            mode: 'challenge',
            launchMode: 'challenge',
            boardSeed: sharedSeed,
            leaderboardSeedKey: sharedSeed,
            highScoreStorageKey: createChallengeHighScoreKey(sharedSeed),
            leaderboardLabel: `Top players (challenge ${challengeLabel})`,
            modeLabel: 'CHALLENGE',
            leaderboardModeLabel: `CHALLENGE ${challengeLabel}`,
        };
    }

    return {
        mode: 'normal',
        launchMode: 'free-play',
        boardSeed: null,
        leaderboardSeedKey: null,
        highScoreStorageKey: NORMAL_HIGH_SCORE_KEY,
        leaderboardLabel: 'Top players (free play)',
        modeLabel: 'FREE PLAY',
        leaderboardModeLabel: 'FREE PLAY',
    };
}
