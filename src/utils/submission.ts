import type { RoundState } from '../models/RoundState';
import type { TileData } from '../models/Tile';
import type { SubmissionResult } from '../models/SubmissionResult';
import type { WordRejectionReason } from '../models/WordHistoryEntry';
import { isValidPath } from './adjacency';
import type { DictionaryService } from './dictionary';
import { normalizeWord, ukDictionary } from './dictionary';
import { scoreWord } from './scoring';

const MIN_WORD_LENGTH = 3;

/**
 * Attempt to submit the word formed by `path` in the given round.
 * Returns a SubmissionResult and, if accepted, mutates `round.submittedWords`.
 */
export function submitWord(
    round: RoundState,
    path: TileData[],
    dictionary: DictionaryService = ukDictionary,
): SubmissionResult {
    const word = normalizeWord(path.map((t) => t.letter).join(''));

    const reject = (reason: WordRejectionReason): SubmissionResult => {
        round.wordHistory.unshift({ status: 'rejected', word, reason });
        return { accepted: false, word, reason };
    };

    if (round.status !== 'running') {
        return reject('round_not_running');
    }

    if (!isValidPath(path)) {
        return reject('invalid_path');
    }

    if (word.length < MIN_WORD_LENGTH) {
        return reject('too_short');
    }

    if (round.submittedWords.includes(word)) {
        return reject('duplicate');
    }

    if (!dictionary.has(word)) {
        return reject('not_in_dictionary');
    }

    const score = scoreWord(word);

    round.submittedWords.push(word);
    round.score += score;
    round.wordHistory.unshift({ status: 'accepted', word, score });

    return { accepted: true, word, score };
}
