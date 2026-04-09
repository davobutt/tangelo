import type { RoundState } from '../models/RoundState';
import type { TileData } from '../models/Tile';
import type { SubmissionResult } from '../models/SubmissionResult';
import { isValidPath } from './adjacency';

const MIN_WORD_LENGTH = 3;

/**
 * Attempt to submit the word formed by `path` in the given round.
 * Returns a SubmissionResult and, if accepted, mutates `round.submittedWords`.
 */
export function submitWord(
    round: RoundState,
    path: TileData[],
): SubmissionResult {
    const word = path.map((t) => t.letter).join('').toUpperCase();

    if (round.status !== 'running') {
        return { accepted: false, word, reason: 'round_not_running' };
    }

    if (!isValidPath(path)) {
        return { accepted: false, word, reason: 'invalid_path' };
    }

    if (word.length < MIN_WORD_LENGTH) {
        return { accepted: false, word, reason: 'too_short' };
    }

    if (round.submittedWords.includes(word)) {
        return { accepted: false, word, reason: 'duplicate' };
    }

    round.submittedWords.push(word);
    return { accepted: true, word };
}
