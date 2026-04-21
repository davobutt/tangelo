/**
 * Datastore abstraction layer for leaderboard persistence
 * Supports SQLite (local) and in-memory (testing) backends
 */

import Database from 'better-sqlite3';
import { LeaderboardEntry, type LeaderboardQuery, type RunMode } from './types.js';

export interface IDatastore {
    initialize(): void;
    submitScore(
        playerGUID: string,
        displayName: string,
        score: number,
        query?: Partial<LeaderboardQuery>,
    ): LeaderboardEntry;
    getLeaderboard(limit?: number, query?: Partial<LeaderboardQuery>): LeaderboardEntry[];
    close(): void;
}

function normalizeLeaderboardQuery(query?: Partial<LeaderboardQuery>): LeaderboardQuery {
    if (query?.runMode === 'seeded' || query?.runMode === 'challenge') {
        const seedKey = query.seedKey?.trim();
        if (!seedKey) {
            throw new Error('seedKey required for seeded leaderboard queries');
        }
        return { runMode: query.runMode, seedKey };
    }

    return { runMode: 'normal', seedKey: null };
}

function buildCategoryKey(query: LeaderboardQuery): string {
    return query.runMode === 'normal' ? 'normal' : `${query.runMode}:${query.seedKey}`;
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
        playerGUID TEXT NOT NULL,
        displayName TEXT NOT NULL,
        score INTEGER NOT NULL,
        submittedAt INTEGER NOT NULL,
        runMode TEXT NOT NULL DEFAULT 'normal',
        seedKey TEXT,
        categoryKey TEXT NOT NULL DEFAULT 'normal',
        UNIQUE(playerGUID, categoryKey)
      );
    `);

        this.ensureLeaderboardSchema();

        // Create index for efficient score ranking queries
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score_desc 
      ON leaderboard_entries(categoryKey, score DESC, submittedAt ASC);
    `);

        // Create index for player GUID lookups (for future player history queries)
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_player_guid 
      ON leaderboard_entries(playerGUID, categoryKey);
    `);

        this.initialized = true;
    }

    private ensureLeaderboardSchema(): void {
        const columns = this.db
            .prepare("PRAGMA table_info('leaderboard_entries')")
            .all() as Array<{ name: string }>;
        const columnNames = new Set(columns.map((column) => column.name));
        const hasRunColumns = columnNames.has('runMode') && columnNames.has('seedKey') && columnNames.has('categoryKey');

        const indexRows = this.db
            .prepare("PRAGMA index_list('leaderboard_entries')")
            .all() as Array<{ unique: number; name: string }>;
        const hasCompositeUnique = indexRows.some(
            (row) => row.unique === 1 && row.name.includes('sqlite_autoindex_leaderboard_entries'),
        );

        if (hasRunColumns && hasCompositeUnique) {
            return;
        }

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS leaderboard_entries_v3 (
                id TEXT PRIMARY KEY,
                playerGUID TEXT NOT NULL,
                displayName TEXT NOT NULL,
                score INTEGER NOT NULL,
                submittedAt INTEGER NOT NULL,
                runMode TEXT NOT NULL,
                seedKey TEXT,
                categoryKey TEXT NOT NULL,
                UNIQUE(playerGUID, categoryKey)
            );
        `);

        if (hasRunColumns) {
            this.db.exec(`
                INSERT OR REPLACE INTO leaderboard_entries_v3 (
                    id,
                    playerGUID,
                    displayName,
                    score,
                    submittedAt,
                    runMode,
                    seedKey,
                    categoryKey
                )
                SELECT
                    COALESCE(
                        (
                            SELECT id
                            FROM leaderboard_entries best
                            WHERE best.playerGUID = src.playerGUID
                              AND (
                                  CASE
                                      WHEN COALESCE(best.runMode, 'normal') = 'seeded' AND best.seedKey IS NOT NULL THEN 'seeded:' || best.seedKey
                                      ELSE 'normal'
                                  END
                              ) = (
                                  CASE
                                      WHEN COALESCE(src.runMode, 'normal') = 'seeded' AND src.seedKey IS NOT NULL THEN 'seeded:' || src.seedKey
                                      ELSE 'normal'
                                  END
                              )
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
                              AND (
                                  CASE
                                      WHEN COALESCE(latest.runMode, 'normal') = 'seeded' AND latest.seedKey IS NOT NULL THEN 'seeded:' || latest.seedKey
                                      ELSE 'normal'
                                  END
                              ) = (
                                  CASE
                                      WHEN COALESCE(src.runMode, 'normal') = 'seeded' AND src.seedKey IS NOT NULL THEN 'seeded:' || src.seedKey
                                      ELSE 'normal'
                                  END
                              )
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
                                  AND (
                                      CASE
                                          WHEN COALESCE(candidate.runMode, 'normal') = 'seeded' AND candidate.seedKey IS NOT NULL THEN 'seeded:' || candidate.seedKey
                                          ELSE 'normal'
                                      END
                                  ) = (
                                      CASE
                                          WHEN COALESCE(src.runMode, 'normal') = 'seeded' AND src.seedKey IS NOT NULL THEN 'seeded:' || src.seedKey
                                          ELSE 'normal'
                                      END
                                  )
                            ) THEN src.submittedAt
                            ELSE NULL
                        END
                    ) AS submittedAt,
                    COALESCE(src.runMode, 'normal') AS runMode,
                    CASE
                        WHEN COALESCE(src.runMode, 'normal') = 'seeded' THEN src.seedKey
                        ELSE NULL
                    END AS seedKey,
                    CASE
                        WHEN COALESCE(src.runMode, 'normal') = 'seeded' AND src.seedKey IS NOT NULL THEN 'seeded:' || src.seedKey
                        ELSE 'normal'
                    END AS categoryKey
                FROM leaderboard_entries src
                GROUP BY
                    src.playerGUID,
                    CASE
                        WHEN COALESCE(src.runMode, 'normal') = 'seeded' AND src.seedKey IS NOT NULL THEN 'seeded:' || src.seedKey
                        ELSE 'normal'
                    END;
            `);
        } else {
            this.db.exec(`
                INSERT OR REPLACE INTO leaderboard_entries_v3 (
                    id,
                    playerGUID,
                    displayName,
                    score,
                    submittedAt,
                    runMode,
                    seedKey,
                    categoryKey
                )
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
                    ) AS submittedAt,
                    'normal' AS runMode,
                    NULL AS seedKey,
                    'normal' AS categoryKey
                FROM leaderboard_entries src
                GROUP BY src.playerGUID;
            `);
        }

        this.db.exec(`
            DROP TABLE leaderboard_entries;
            ALTER TABLE leaderboard_entries_v3 RENAME TO leaderboard_entries;
        `);
    }

    submitScore(
        playerGUID: string,
        displayName: string,
        score: number,
        query?: Partial<LeaderboardQuery>,
    ): LeaderboardEntry {
        const normalizedQuery = normalizeLeaderboardQuery(query);
        const categoryKey = buildCategoryKey(normalizedQuery);
        const id = crypto.randomUUID();
        const submittedAt = Date.now();

        const upsert = this.db.prepare(`
            INSERT INTO leaderboard_entries (id, playerGUID, displayName, score, submittedAt, runMode, seedKey, categoryKey)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(playerGUID, categoryKey) DO UPDATE SET
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

        upsert.run(
            id,
            playerGUID,
            displayName,
            score,
            submittedAt,
            normalizedQuery.runMode,
            normalizedQuery.seedKey,
            categoryKey,
        );

        const readByGuid = this.db.prepare(`
            SELECT id, playerGUID, displayName, score, submittedAt, runMode, seedKey
            FROM leaderboard_entries
            WHERE playerGUID = ? AND categoryKey = ?
            LIMIT 1
        `);

        return readByGuid.get(playerGUID, categoryKey) as LeaderboardEntry;
    }

    getLeaderboard(limit: number = 100, query?: Partial<LeaderboardQuery>): LeaderboardEntry[] {
        const normalizedQuery = normalizeLeaderboardQuery(query);
        const categoryKey = buildCategoryKey(normalizedQuery);
        const stmt = this.db.prepare(`
      SELECT id, playerGUID, displayName, score, submittedAt, runMode, seedKey
      FROM leaderboard_entries
      WHERE categoryKey = ?
      ORDER BY score DESC, submittedAt ASC
      LIMIT ?
    `);

        return stmt.all(categoryKey, limit) as LeaderboardEntry[];
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

    submitScore(
        playerGUID: string,
        displayName: string,
        score: number,
        query?: Partial<LeaderboardQuery>,
    ): LeaderboardEntry {
        const normalizedQuery = normalizeLeaderboardQuery(query);
        const categoryKey = `${playerGUID}:${buildCategoryKey(normalizedQuery)}`;
        const existing = this.entriesByGuid.get(categoryKey);
        if (!existing) {
            const entry: LeaderboardEntry = {
                id: crypto.randomUUID(),
                playerGUID,
                displayName,
                score,
                submittedAt: Date.now(),
                runMode: normalizedQuery.runMode,
                seedKey: normalizedQuery.seedKey,
            };
            this.entriesByGuid.set(categoryKey, entry);
            return entry;
        }

        const merged: LeaderboardEntry = {
            ...existing,
            displayName,
            score: Math.max(existing.score, score),
            submittedAt: score > existing.score ? Date.now() : existing.submittedAt,
        };

        this.entriesByGuid.set(categoryKey, merged);
        return merged;
    }

    getLeaderboard(limit: number = 100, query?: Partial<LeaderboardQuery>): LeaderboardEntry[] {
        const normalizedQuery = normalizeLeaderboardQuery(query);
        return Array.from(this.entriesByGuid.values())
            .filter((entry) =>
                entry.runMode === normalizedQuery.runMode &&
                entry.seedKey === normalizedQuery.seedKey,
            )
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
