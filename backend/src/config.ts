/**
 * Configuration module for environment-based backend setup
 * Supports local (SQLite), and deployed (cloud) datastore targets
 */

export interface Config {
    port: number;
    environment: 'development' | 'production';
    datastore: {
        type: 'sqlite' | 'memory';
        dbPath?: string;
    };
    challenge: {
        adminToken?: string;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
    };
}

export function getConfig(): Config {
    const env = process.env.NODE_ENV || 'development';
    const port = parseInt(process.env.PORT || '3000', 10);
    const datastoreType = (process.env.DATASTORE_TYPE || 'sqlite') as 'sqlite' | 'memory';
    const loggingLevel = (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

    return {
        port,
        environment: env as 'development' | 'production',
        datastore: {
            type: datastoreType,
            dbPath: process.env.DB_PATH || './leaderboard.db',
        },
        challenge: {
            adminToken: process.env.CHALLENGE_ADMIN_TOKEN?.trim() || undefined,
        },
        logging: {
            level: loggingLevel,
        },
    };
}

export default getConfig();
