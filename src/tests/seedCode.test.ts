import { describe, expect, it } from 'vitest';
import { formatSeedCodeLabel, normalizeSeedCode, sanitizeSeedCodeInput } from '../utils/seedCode';

describe('seedCode helpers', () => {
    it('keeps only letters and caps display input to 5 characters', () => {
        expect(sanitizeSeedCodeInput('a1b2c3d')).toBe('ABCD');
        expect(sanitizeSeedCodeInput('apple')).toBe('APPLE');
        expect(sanitizeSeedCodeInput('ab-cde')).toBe('ABCDE');
    });

    it('normalizes valid 5-letter codes consistently', () => {
        expect(normalizeSeedCode('APPLE')).toBe('apple');
        expect(normalizeSeedCode(' apple ')).toBe('apple');
        expect(normalizeSeedCode('Ap-pLe')).toBe('apple');
    });

    it('rejects incomplete or non-alphabetic codes after normalization', () => {
        expect(normalizeSeedCode('abcd')).toBeNull();
        expect(normalizeSeedCode('abc123')).toBeNull();
        expect(normalizeSeedCode('')).toBeNull();
    });

    it('formats code labels in uppercase', () => {
        expect(formatSeedCodeLabel('apple')).toBe('APPLE');
    });
});
