/**
 * Datastore abstraction layer for leaderboard persistence
 * Supports SQLite (local) and in-memory (testing) backends
 */

import Database from 'better-sqlite3';
import { LeaderboardEntry } from './types.js';

export interface IDatastore {
    initialize(): void;
    submitScore(playerGUID: string, displayName: string, score: number): LeaderboardEntry;
    getLeaderboard(limit?: number): LeaderboardEntry[];
    close(): void;
}

class SqliteDatastore implements IDatastore {
    private db: Database.Database;
    private initialized = false;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
    }

    initialize(): void {
        if (this.initialized) return;

        // Create leaderboard table with one row per GUID.
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        id TEXT PRIMARY KEY,
                playerGUID TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        score INTEGER NOT NULL,
        submittedAt INTEGER NOT NULL
      );
    `);

        this.ensureGuidMergeSchema();

        // Create index for efficient score ranking queries
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score_desc 
      ON leaderboard_entries(score DESC, submittedAt ASC);
    `);

        // Create index for player GUID lookups (for future player history queries)
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_player_guid 
      ON leaderboard_entries(playerGUID);
    `);

        this.initialized = true;
    }

    private ensureGuidMergeSchema(): void {
        const indexRows = this.db
            .prepare("PRAGMA index_list('leaderboard_entries')")
            .all() as Array<{ name: string; unique: number }>;
        const hasUniqueGuidIndex = indexRows.some((row) => row.unique === 1 && row.name.includes('player_guid'));

        if (hasUniqueGuidIndex) {
            return;
        }

        // Backfill legacy rows into one best-score row per GUID while keeping latest display name.
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS leaderboard_entries_v2 (
                id TEXT PRIMARY KEY,
                playerGUID TEXT NOT NULL UNIQUE,
                displayName TEXT NOT NULL,
                score INTEGER NOT NULL,
                submittedAt INTEGER NOT NULL
            );

            INSERT OR REPLACE INTO leaderboard_entries_v2 (id, playerGUID, displayName, score, submittedAt)
            SELECT
                COALESCE(
                    (
                        SELECT id
                        FROM leaderboard_entries best
                        WHERE best.playerGUID = src.playerGUID
                        ORDER BY best.score DESC, best.submittedAt ASC
                        LIMIT 1
                    ),
                    lower(hex(randomblob(16)))
                ) AS id,
                src.playerGUID,
                COALESCE(
                    (
                        SELECT latest.displayName
                        FROM leaderboard_entries latest
                        WHERE latest.playerGUID = src.playerGUID
                        ORDER BY latest.submittedAt DESC
                        LIMIT 1
                    ),
                    src.displayName
                ) AS displayName,
                MAX(src.score) AS score,
                MIN(
                    CASE
                        WHEN src.score = (
                            SELECT MAX(candidate.score)
                            FROM leaderboard_entries candidate
                            WHERE candidate.playerGUID = src.playerGUID
                        ) THEN src.submittedAt
                        ELSE NULL
                    END
                ) AS submittedAt
            FROM leaderboard_entries src
            GROUP BY src.playerGUID;

            DROP TABLE leaderboard_entries;
            ALTER TABLE leaderboard_entries_v2 RENAME TO leaderboard_entries;
        `);
    }

    submitScore(playerGUID: string, displayName: string, score: number): LeaderboardEntry {
        const id = crypto.randomUUID();
        const submittedAt = Date.now();

        const upsert = this.db.prepare(`
            INSERT INTO leaderboard_entries (id, playerGUID, displayName, score, submittedAt)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(playerGUID) DO UPDATE SET
                displayName = excluded.displayName,
                score = CASE
                    WHEN excluded.score > leaderboard_entries.score THEN excluded.score
                    ELSE leaderboard_entries.score
                END,
                submittedAt = CASE
                    WHEN excluded.score > leaderboard_entries.score THEN excluded.submittedAt
                    ELSE leaderboard_entries.submittedAt
                END
        `);

        upsert.run(id, playerGUID, displayName, score, submittedAt);

        const readByGuid = this.db.prepare(`
            SELECT id, playerGUID, displayName, score, submittedAt
            FROM leaderboard_entries
            WHERE playerGUID = ?
            LIMIT 1
        `);

        return readByGuid.get(playerGUID) as LeaderboardEntry;
    }

    getLeaderboard(limit: number = 100): LeaderboardEntry[] {
        const stmt = this.db.prepare(`
      SELECT id, playerGUID, displayName, score, submittedAt
      FROM leaderboard_entries
      ORDER BY score DESC, submittedAt ASC
      LIMIT ?
    `);

        return stmt.all(limit) as LeaderboardEntry[];
    }

    close(): void {
        this.db.close();
    }
}

class MemoryDatastore implements IDatastore {
    private entriesByGuid: Map<string, LeaderboardEntry> = new Map();

    initialize(): void {
        // No-op for memory datastore
    }

    submitScore(playerGUID: string, displayName: string, score: number): LeaderboardEntry {
        const existing = this.entriesByGuid.get(playerGUID);
        if (!existing) {
            const entry: LeaderboardEntry = {
                id: crypto.randomUUID(),
                playerGUID,
                displayName,
                score,
                submittedAt: Date.now(),
            };
            this.entriesByGuid.set(playerGUID, entry);
            return entry;
        }

        const merged: LeaderboardEntry = {
            ...existing,
            displayName,
            score: Math.max(existing.score, score),
            submittedAt: score > existing.score ? Date.now() : existing.submittedAt,
        };

        this.entriesByGuid.set(playerGUID, merged);
        return merged;
    }

    getLeaderboard(limit: number = 100): LeaderboardEntry[] {
        return Array.from(this.entriesByGuid.values())
            .sort((a, b) => b.score - a.score || a.submittedAt - b.submittedAt)
            .slice(0, limit);
    }

    close(): void {
        this.entriesByGuid.clear();
    }
}

export function createDatastore(type: 'sqlite' | 'memory', dbPath?: string): IDatastore {
    if (type === 'sqlite') {
        if (!dbPath) throw new Error('dbPath required for sqlite datastore');
        return new SqliteDatastore(dbPath);
    }
    return new MemoryDatastore();
}

export default { createDatastore };
