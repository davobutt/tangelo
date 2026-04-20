const HIGH_SCORE_KEY = 'tangelo.endless.highScore';
const LEGACY_HIGH_SCORE_KEY = 'tangelo.highScore';

export const HIGH_SCORE_STORAGE_KEY = HIGH_SCORE_KEY;
export const LEGACY_HIGH_SCORE_STORAGE_KEY = LEGACY_HIGH_SCORE_KEY;

export interface HighScoreStore {
    get(): number;
    set(score: number): void;
    clear(): void;
}

function toScore(value: unknown): number {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return parsed;
}

function tryGetLocalStorage(): Storage | null {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }

        return window.localStorage;
    } catch {
        return null;
    }
}

export function createHighScoreStore(storage: Storage | null = tryGetLocalStorage()): HighScoreStore {
    let inMemoryScore = 0;

    if (!storage) {
        return {
            get: () => inMemoryScore,
            set: (score: number) => {
                inMemoryScore = Math.max(inMemoryScore, Math.max(0, Math.floor(score)));
            },
            clear: () => {
                inMemoryScore = 0;
            },
        };
    }

    return {
        get: () => {
            try {
                const raw = storage.getItem(HIGH_SCORE_KEY);
                if (raw !== null) {
                    const score = toScore(raw);
                    inMemoryScore = Math.max(inMemoryScore, score);
                    return inMemoryScore;
                }

                const legacyRaw = storage.getItem(LEGACY_HIGH_SCORE_KEY);
                if (legacyRaw === null) {
                    return inMemoryScore;
                }

                const score = toScore(legacyRaw);
                inMemoryScore = Math.max(inMemoryScore, score);
                storage.setItem(HIGH_SCORE_KEY, String(inMemoryScore));
                return inMemoryScore;
            } catch {
                return inMemoryScore;
            }
        },
        set: (score: number) => {
            const normalized = Math.max(inMemoryScore, Math.max(0, Math.floor(score)));
            inMemoryScore = normalized;

            try {
                storage.setItem(HIGH_SCORE_KEY, String(normalized));
            } catch {
                // Ignore storage errors; in-memory fallback still works.
            }
        },
        clear: () => {
            inMemoryScore = 0;

            try {
                storage.removeItem(HIGH_SCORE_KEY);
                storage.removeItem(LEGACY_HIGH_SCORE_KEY);
            } catch {
                // Ignore storage errors; in-memory fallback still works.
            }
        },
    };
}
