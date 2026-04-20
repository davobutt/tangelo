/**
 * Main Express server for Boggle leaderboard backend
 */

import express from 'express';
import { getConfig } from './config.js';
import { createDatastore } from './datastore.js';
import { createApiRouter } from './routes.js';

const config = getConfig();
const app = express();

const explicitAllowedOrigins = (process.env.CORS_ALLOW_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
    if (explicitAllowedOrigins.includes(origin)) {
        return true;
    }

    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (allow local frontend across any dev port, plus optional env allowlist)
app.use((req, res, next) => {
    const origin = req.headers.origin || '';

    if (origin && isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader(
            'Access-Control-Allow-Headers',
            req.headers['access-control-request-headers'] || 'Content-Type',
        );
    }

    if (req.method === 'OPTIONS') {
        if (!origin || isAllowedOrigin(origin)) {
            return res.sendStatus(204);
        }

        return res.sendStatus(403);
    }

    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize datastore
const datastore = createDatastore(config.datastore.type, config.datastore.dbPath);
datastore.initialize();

// Register API routes
app.use('/api', createApiRouter(datastore));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        code: 'NOT_FOUND',
        message: `Endpoint not found: ${req.method} ${req.path}`,
        timestamp: Date.now(),
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: Date.now(),
    });
});

// Start server
app.listen(config.port, () => {
    console.log(`🎮 Boggle Leaderboard Backend running on port ${config.port}`);
    console.log(`📊 Environment: ${config.environment}`);
    console.log(`💾 Datastore: ${config.datastore.type}`);
    console.log(`📡 Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    datastore.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    datastore.close();
    process.exit(0);
});

export default app;
