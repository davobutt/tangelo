import type { RunMode } from './runContext';

export interface SubmitScorePayload {
    playerGUID: string;
    displayName: string;
    score: number;
    runMode: RunMode;
    seedKey?: string;
}

export interface LeaderboardEntry {
    id: string;
    playerGUID: string;
    displayName: string;
    score: number;
    submittedAt: number;
    runMode: RunMode;
    seedKey: string | null;
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[];
    totalCount: number;
    timestamp: number;
}

export interface ActiveChallenge {
    seedCode: string;
    leaderboardSeedKey: string;
    updatedAt: number;
}

export interface SubmitScoreResult {
    ok: boolean;
    status?: number;
    error?: string;
}

export interface FetchLeaderboardResult {
    ok: boolean;
    entries: LeaderboardEntry[];
    status?: number;
    error?: string;
}

export interface FetchActiveChallengeResult {
    ok: boolean;
    activeChallenge?: ActiveChallenge;
    status?: number;
    error?: string;
}

export interface FetchLeaderboardOptions {
    runMode?: RunMode;
    seedKey?: string;
}

const DEFAULT_API_BASE = '';

function resolveApiBase(): string {
    const fromEnv = import.meta.env.VITE_LEADERBOARD_API_URL as string | undefined;
    return (fromEnv && fromEnv.trim()) || DEFAULT_API_BASE;
}

async function readErrorMessage(response: Response): Promise<string> {
    let message = `HTTP ${response.status}`;
    try {
        const body = (await response.json()) as { message?: string };
        if (body?.message) {
            message = body.message;
        }
    } catch {
        // ignore non-JSON error response
    }

    return message;
}

function parseActiveChallenge(data: unknown): ActiveChallenge | null {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const challenge = (data as { activeChallenge?: unknown }).activeChallenge;
    if (!challenge || typeof challenge !== 'object') {
        return null;
    }

    const parsed = challenge as Record<string, unknown>;
    if (
        typeof parsed.seedCode !== 'string'
        || typeof parsed.leaderboardSeedKey !== 'string'
        || typeof parsed.updatedAt !== 'number'
    ) {
        return null;
    }

    return {
        seedCode: parsed.seedCode,
        leaderboardSeedKey: parsed.leaderboardSeedKey,
        updatedAt: parsed.updatedAt,
    };
}

export async function submitLeaderboardScore(payload: SubmitScorePayload): Promise<SubmitScoreResult> {
    try {
        const response = await fetch(`${resolveApiBase()}/api/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                error: await readErrorMessage(response),
            };
        }

        return { ok: true, status: response.status };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

export async function fetchLeaderboard(
    limit: number = 25,
    options: FetchLeaderboardOptions = {},
): Promise<FetchLeaderboardResult> {
    try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (options.runMode) {
            params.set('runMode', options.runMode);
        }
        if (options.seedKey) {
            params.set('seedKey', options.seedKey);
        }

        const response = await fetch(`${resolveApiBase()}/api/leaderboard?${params.toString()}`);

        if (!response.ok) {
            return {
                ok: false,
                entries: [],
                status: response.status,
                error: await readErrorMessage(response),
            };
        }

        const data = (await response.json()) as LeaderboardResponse;
        return {
            ok: true,
            entries: Array.isArray(data.entries) ? data.entries : [],
            status: response.status,
        };
    } catch (error) {
        return {
            ok: false,
            entries: [],
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

export async function fetchActiveChallenge(): Promise<FetchActiveChallengeResult> {
    try {
        const response = await fetch(`${resolveApiBase()}/api/challenge/current`);
        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                error: await readErrorMessage(response),
            };
        }

        const activeChallenge = parseActiveChallenge(await response.json());
        if (!activeChallenge) {
            return {
                ok: false,
                status: response.status,
                error: 'Invalid active challenge response',
            };
        }

        return {
            ok: true,
            activeChallenge,
            status: response.status,
        };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
