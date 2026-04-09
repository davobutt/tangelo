export type SubmissionRejectionReason =
    | 'round_not_running'
    | 'too_short'
    | 'duplicate'
    | 'invalid_path';

export type SubmissionResult =
    | { accepted: true; word: string }
    | { accepted: false; word: string; reason: SubmissionRejectionReason };
