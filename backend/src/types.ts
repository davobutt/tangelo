/**
 * Data model types and interfaces for leaderboard
 */

export type RunMode = 'normal' | 'challenge' | 'seeded';

export interface ActiveChallenge {
    seedCode: string;
    leaderboardSeedKey: string;
    updatedAt: number;
}

export interface LeaderboardEntry {
    id: string; // UUID
    playerGUID: string; // Client-generated player identifier
    displayName: string;
    score: number;
    submittedAt: number; // Timestamp in milliseconds
    runMode: RunMode;
    seedKey: string | null;
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[];
    totalCount: number;
    timestamp: number;
}

export interface ScoreSubmissionPayload {
    playerGUID: string;
    displayName: string;
    score: number;
    runMode?: RunMode;
    seedKey?: string;
}

export interface ActiveChallengeUpdatePayload {
    seedCode: string;
    leaderboardSeedKey?: string;
}

export interface LeaderboardQuery {
    runMode: RunMode;
    seedKey: string | null;
}

export interface ApiError {
    status: number;
    code: string;
    message: string;
    timestamp: number;
}

export interface ActiveChallengeResponse {
    activeChallenge: ActiveChallenge;
    timestamp: number;
}

export function normalizeChallengeSeedCode(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    return /^[a-z]{5}$/.test(normalized) ? normalized : null;
}

export function normalizeLeaderboardSeedKey(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 && normalized.length <= 256 ? normalized : null;
}

export function createChallengeLeaderboardSeedKey(seedCode: string, updatedAt: number): string {
    return `challenge:${seedCode}:${updatedAt}`;
}

export function createDefaultActiveChallenge(): ActiveChallenge {
    const seedCode = 'lemon';
    return {
        seedCode,
        leaderboardSeedKey: 'challenge:lemon:default',
        updatedAt: 0,
    };
}

/**
 * Validation for score submission
 */
export function validateScoreSubmission(payload: unknown): payload is ScoreSubmissionPayload {
    if (!payload || typeof payload !== 'object') return false;

    const p = payload as Record<string, unknown>;

    // Validate playerGUID
    if (typeof p.playerGUID !== 'string' || p.playerGUID.trim().length === 0 || p.playerGUID.length > 256) {
        return false;
    }

    // Validate displayName
    if (typeof p.displayName !== 'string' || p.displayName.trim().length === 0 || p.displayName.length > 128) {
        return false;
    }

    // Validate score
    if (typeof p.score !== 'number' || !Number.isInteger(p.score) || p.score < 0 || p.score > 1000000) {
        return false;
    }

    if (p.runMode !== undefined && p.runMode !== 'normal' && p.runMode !== 'challenge' && p.runMode !== 'seeded') {
        return false;
    }

    if (p.runMode === 'seeded' || p.runMode === 'challenge') {
        if (typeof p.seedKey !== 'string' || p.seedKey.trim().length === 0 || p.seedKey.length > 256) {
            return false;
        }
    }

    return true;
}

export function validateActiveChallengeUpdate(payload: unknown): payload is ActiveChallengeUpdatePayload {
    if (!payload || typeof payload !== 'object') return false;

    const p = payload as Record<string, unknown>;

    if (!normalizeChallengeSeedCode(p.seedCode)) {
        return false;
    }

    if (p.leaderboardSeedKey !== undefined && !normalizeLeaderboardSeedKey(p.leaderboardSeedKey)) {
        return false;
    }

    return true;
}
