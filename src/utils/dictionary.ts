import wordsRaw from '../assets/words.txt?raw';

export function normalizeWord(word: string): string {
    return word.trim().toUpperCase();
}

export class DictionaryService {
    private readonly words: Set<string>;

    constructor(words: Iterable<string>) {
        this.words = new Set(words);
    }

    static fromWordList(wordListText: string): DictionaryService {
        const words = wordListText
            .split(/\r?\n/)
            .map((word) => normalizeWord(word))
            .filter(Boolean);

        return new DictionaryService(words);
    }

    has(word: string): boolean {
        return this.words.has(normalizeWord(word));
    }
}

export const fullDictionary = DictionaryService.fromWordList(wordsRaw);

// Backward-compatible alias used by existing submission pipeline.
export const ukDictionary = fullDictionary;