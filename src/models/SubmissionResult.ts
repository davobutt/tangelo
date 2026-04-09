import type { WordRejectionReason } from './WordHistoryEntry';

export type SubmissionResult =
    | { accepted: true; word: string; score: number }
    | { accepted: false; word: string; reason: WordRejectionReason };
