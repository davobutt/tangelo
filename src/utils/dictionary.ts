import wordsRaw from '../assets/words.txt?raw';

export function normalizeWord(word: string): string {
    return word.trim().toUpperCase();
}

export class DictionaryService {
    private readonly words: Set<string>;
    private readonly prefixes: Set<string>;

    constructor(words: Iterable<string>) {
        this.words = new Set();
        this.prefixes = new Set();

        for (const rawWord of words) {
            const word = normalizeWord(rawWord);
            if (!word) {
                continue;
            }

            this.words.add(word);
            for (let index = 1; index <= word.length; index += 1) {
                this.prefixes.add(word.slice(0, index));
            }
        }
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

    hasPrefix(prefix: string): boolean {
        return this.prefixes.has(normalizeWord(prefix));
    }
}

export const fullDictionary = DictionaryService.fromWordList(wordsRaw);

// Backward-compatible alias used by existing submission pipeline.
export const ukDictionary = fullDictionary;
