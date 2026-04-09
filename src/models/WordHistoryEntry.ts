export type WordStatus = 'accepted' | 'rejected';

export type WordRejectionReason =
    | 'round_not_running'
    | 'too_short'
    | 'duplicate'
    | 'invalid_path'
    | 'not_in_dictionary';

export interface AcceptedWordHistoryEntry {
    status: 'accepted';
    word: string;
    score: number;
}

export interface RejectedWordHistoryEntry {
    status: 'rejected';
    word: string;
    reason: WordRejectionReason;
}

export type WordHistoryEntry =
    | AcceptedWordHistoryEntry
    | RejectedWordHistoryEntry;