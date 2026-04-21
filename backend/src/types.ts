/**
 * Data model types and interfaces for leaderboard
 */

export type RunMode = 'normal' | 'challenge' | 'seeded';

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
