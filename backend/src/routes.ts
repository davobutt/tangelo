/**
 * API routes for leaderboard service
 * POST /api/scores - Submit a score
 * GET /api/leaderboard - Fetch ranked leaderboard
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IDatastore } from './datastore.js';
import { validateScoreSubmission, ApiError, LeaderboardResponse } from './types.js';

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
                    message: 'Invalid score submission: playerGUID, displayName, and score (0-1000000) are required',
                    timestamp: Date.now(),
                };
                return res.status(400).json(error);
            }

            // Sanitize inputs
            const playerGUID = String(payload.playerGUID).trim();
            const displayName = String(payload.displayName).trim();
            const score = Math.floor(payload.score);

            // Submit to datastore
            const entry = datastore.submitScore(playerGUID, displayName, score);

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

            // Fetch leaderboard from datastore
            const entries = datastore.getLeaderboard(limit);

            const response: LeaderboardResponse = {
                entries,
                totalCount: entries.length,
                timestamp: Date.now(),
            };

            res.status(200).json(response);
        } catch (error) {
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
