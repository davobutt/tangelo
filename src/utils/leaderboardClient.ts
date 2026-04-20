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

export interface FetchLeaderboardOptions {
    runMode?: RunMode;
    seedKey?: string;
}

const DEFAULT_API_BASE = '';

function resolveApiBase(): string {
    const fromEnv = import.meta.env.VITE_LEADERBOARD_API_URL as string | undefined;
    return (fromEnv && fromEnv.trim()) || DEFAULT_API_BASE;
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
            let message = `HTTP ${response.status}`;
            try {
                const body = (await response.json()) as { message?: string };
                if (body?.message) {
                    message = body.message;
                }
            } catch {
                // ignore non-JSON error response
            }
            return {
                ok: false,
                status: response.status,
                error: message,
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
            let message = `HTTP ${response.status}`;
            try {
                const body = (await response.json()) as { message?: string };
                if (body?.message) {
                    message = body.message;
                }
            } catch {
                // ignore non-JSON error response
            }

            return {
                ok: false,
                entries: [],
                status: response.status,
                error: message,
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
