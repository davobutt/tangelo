export type RoundStatus = 'idle' | 'running' | 'ended';

export interface RoundState {
    status: RoundStatus;
    timeRemaining: number; // whole seconds, 0–60
    submittedWords: string[];
    score: number;
    wordHistory: import('./WordHistoryEntry').WordHistoryEntry[];
}

export const ROUND_DURATION_SECONDS = 60;

export function createRoundState(): RoundState {
    return {
        status: 'idle',
        timeRemaining: ROUND_DURATION_SECONDS,
        submittedWords: [],
        score: 0,
        wordHistory: [],
    };
}
