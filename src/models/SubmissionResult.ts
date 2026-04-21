import type { WordRejectionReason } from './WordHistoryEntry';

export interface AcceptedSubmissionResult {
    accepted: true;
    word: string;
    score: number;
    baseScore: number;
    expansionBonus: number;
    hiddenWordBonus: number;
    expandedEdgeCount: number;
}

export type SubmissionResult =
    | AcceptedSubmissionResult
    | { accepted: false; word: string; reason: WordRejectionReason };
