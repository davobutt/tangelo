/**
 * API routes for leaderboard service
 * POST /api/scores - Submit a score
 * GET /api/leaderboard - Fetch ranked leaderboard
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IDatastore } from './datastore.js';
import {
    validateScoreSubmission,
    validateActiveChallengeUpdate,
    ApiError,
    ActiveChallenge,
    ActiveChallengeResponse,
    LeaderboardResponse,
    createChallengeLeaderboardSeedKey,
    normalizeChallengeSeedCode,
    normalizeLeaderboardSeedKey,
    type LeaderboardQuery,
    type ActiveChallengeUpdatePayload,
    type ScoreSubmissionPayload,
} from './types.js';

export interface ApiRouterOptions {
    adminToken?: string;
}

function parseLeaderboardQuery(req: Request): LeaderboardQuery {
    const requestedMode = String(req.query.runMode ?? '').trim();
    const runMode = requestedMode === 'challenge'
        ? 'challenge'
        : requestedMode === 'seeded'
            ? 'seeded'
            : 'normal';
    const seedKey = runMode === 'normal'
        ? null
        : String(req.query.seedKey ?? '').trim() || null;

    if (runMode !== 'normal' && !seedKey) {
        throw new Error('seedKey required for seeded leaderboard queries');
    }

    return { runMode, seedKey };
}

function parseSubmissionRunMode(payload: ScoreSubmissionPayload): LeaderboardQuery {
    const runMode = payload.runMode === 'challenge'
        ? 'challenge'
        : payload.runMode === 'seeded'
            ? 'seeded'
            : 'normal';
    const seedKey = runMode === 'normal'
        ? null
        : String(payload.seedKey ?? '').trim();

    return { runMode, seedKey };
}

function buildActiveChallenge(payload: ActiveChallengeUpdatePayload): ActiveChallenge {
    const seedCode = normalizeChallengeSeedCode(payload.seedCode);
    if (!seedCode) {
        throw new Error('seedCode must be a 5-letter code');
    }

    const updatedAt = Date.now();
    return {
        seedCode,
        leaderboardSeedKey:
            normalizeLeaderboardSeedKey(payload.leaderboardSeedKey)
            ?? createChallengeLeaderboardSeedKey(seedCode, updatedAt),
        updatedAt,
    };
}

function isAuthorizedAdminRequest(req: Request, adminToken?: string): boolean {
    if (!adminToken) {
        return true;
    }

    return req.header('x-admin-token') === adminToken;
}

export function createApiRouter(datastore: IDatastore, options: ApiRouterOptions = {}): Router {
    const router = Router();

    router.get('/challenge/current', (req: Request, res: Response) => {
        try {
            const activeChallenge = datastore.getActiveChallenge();
            if (!activeChallenge) {
                const error: ApiError = {
                    status: 404,
                    code: 'NO_ACTIVE_CHALLENGE',
                    message: 'No active challenge is configured.',
                    timestamp: Date.now(),
                };
                res.status(404).json(error);
                return;
            }

            const response: ActiveChallengeResponse = {
                activeChallenge,
                timestamp: Date.now(),
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Error fetching active challenge:', error);
            const apiError: ApiError = {
                status: 500,
                code: 'DATASTORE_ERROR',
                message: 'Failed to fetch the active challenge. Please try again later.',
                timestamp: Date.now(),
            };
            res.status(500).json(apiError);
        }
    });

    router.post('/admin/challenge', (req: Request, res: Response) => {
        if (!isAuthorizedAdminRequest(req, options.adminToken)) {
            const error: ApiError = {
                status: 401,
                code: 'UNAUTHORIZED',
                message: 'Admin token required to update the active challenge.',
                timestamp: Date.now(),
            };
            res.status(401).json(error);
            return;
        }

        try {
            const payload = req.body;
            if (!validateActiveChallengeUpdate(payload)) {
                const error: ApiError = {
                    status: 400,
                    code: 'INVALID_PAYLOAD',
                    message: 'Invalid active challenge update: seedCode must be a 5-letter code and leaderboardSeedKey must be a non-empty string when provided.',
                    timestamp: Date.now(),
                };
                res.status(400).json(error);
                return;
            }

            const activeChallenge = datastore.setActiveChallenge(buildActiveChallenge(payload));
            res.status(200).json({
                success: true,
                activeChallenge,
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error('Error updating active challenge:', error);
            const apiError: ApiError = {
                status: 500,
                code: 'DATASTORE_ERROR',
                message: 'Failed to update the active challenge. Please try again later.',
                timestamp: Date.now(),
            };
            res.status(500).json(apiError);
        }
    });

    /**
     * POST /api/scores
     * Submit a new score to the leaderboard
     */
    router.post('/scores', (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body;

            // Validate payload structure
            if (!validateScoreSubmission(payload)) {
                const error: ApiError = {
                    status: 400,
                    code: 'INVALID_PAYLOAD',
                    message: 'Invalid score submission: playerGUID, displayName, score, and seeded context (when used) are required',
                    timestamp: Date.now(),
                };
                return res.status(400).json(error);
            }

            // Sanitize inputs
            const playerGUID = String(payload.playerGUID).trim();
            const displayName = String(payload.displayName).trim();
            const score = Math.floor(payload.score);
            const { runMode, seedKey } = parseSubmissionRunMode(payload);

            // Submit to datastore
            const entry = datastore.submitScore(playerGUID, displayName, score, { runMode, seedKey });

            res.status(201).json({
                success: true,
                entry,
                timestamp: Date.now(),
            });
        } catch (error) {
            // Handle datastore failures gracefully
            console.error('Error submitting score:', error);
            const apiError: ApiError = {
                status: 500,
                code: 'DATASTORE_ERROR',
                message: 'Failed to store score. Please try again later.',
                timestamp: Date.now(),
            };
            res.status(500).json(apiError);
        }
    });

    /**
     * GET /api/leaderboard
     * Fetch ranked leaderboard entries
     * Query params: limit (default 100, max 1000)
     */
    router.get('/leaderboard', (req: Request, res: Response, next: NextFunction) => {
        try {
            let limit = 100;
            if (req.query.limit) {
                const parsed = parseInt(String(req.query.limit), 10);
                if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 1000) {
                    limit = parsed;
                }
            }

            const query = parseLeaderboardQuery(req);

            // Fetch leaderboard from datastore
            const entries = datastore.getLeaderboard(limit, query);

            const response: LeaderboardResponse = {
                entries,
                totalCount: entries.length,
                timestamp: Date.now(),
            };

            res.status(200).json(response);
        } catch (error) {
            if (error instanceof Error && error.message.includes('seedKey required')) {
                const apiError: ApiError = {
                    status: 400,
                    code: 'INVALID_QUERY',
                    message: error.message,
                    timestamp: Date.now(),
                };
                res.status(400).json(apiError);
                return;
            }
            // Handle datastore read failures gracefully
            console.error('Error fetching leaderboard:', error);
            const apiError: ApiError = {
                status: 500,
                code: 'DATASTORE_ERROR',
                message: 'Failed to fetch leaderboard. Please try again later.',
                timestamp: Date.now(),
            };
            res.status(500).json(apiError);
        }
    });

    return router;
}

export default { createApiRouter };
