/**
 * API routes for leaderboard service
 * POST /api/scores - Submit a score
 * GET /api/leaderboard - Fetch ranked leaderboard
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IDatastore } from './datastore.js';
import {
    validateScoreSubmission,
    ApiError,
    LeaderboardResponse,
    type LeaderboardQuery,
    type ScoreSubmissionPayload,
} from './types.js';

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

export function createApiRouter(datastore: IDatastore): Router {
    const router = Router();

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
