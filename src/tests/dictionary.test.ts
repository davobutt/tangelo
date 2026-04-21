import { describe, expect, it } from 'vitest';
import {
    DictionaryService,
    normalizeWord,
    fullDictionary,
} from '../utils/dictionary';

describe('normalizeWord', () => {
    it('normalizes case and whitespace', () => {
        expect(normalizeWord('  colour  ')).toBe('COLOUR');
    });
});

describe('DictionaryService', () => {
    const dictionary = new DictionaryService([
        'CAT',
        'DOG',
        'COLOUR',
        'NEIGHBOUR',
        'ORGANISE',
    ]);

    it('accepts known words with case-insensitive lookup', () => {
        expect(dictionary.has('cat')).toBe(true);
        expect(dictionary.has('Colour')).toBe(true);
        expect(dictionary.has('NEIGHBOUR')).toBe(true);
    });

    it('supports prefix checks for generator heuristics', () => {
        expect(dictionary.hasPrefix('co')).toBe(true);
        expect(dictionary.hasPrefix('colo')).toBe(true);
        expect(dictionary.hasPrefix('zzzx')).toBe(false);
    });

    it('rejects unknown words', () => {
        expect(dictionary.has('zzzx')).toBe(false);
    });

    it('handles rapid repeated lookups efficiently enough for gameplay', () => {
        const startedAt = performance.now();

        for (let index = 0; index < 50000; index += 1) {
            dictionary.has(index % 2 === 0 ? 'cat' : 'zzzx');
        }

        expect(performance.now() - startedAt).toBeLessThan(250);
    });

    it('loads the bundled default dictionary from words.txt', () => {
        expect(fullDictionary.has('aa')).toBe(true);
        expect(fullDictionary.has('aardvark')).toBe(true);
        expect(fullDictionary.has('abacus')).toBe(true);
        expect(fullDictionary.hasPrefix('aard')).toBe(true);
    });
});
