const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function hashString(input: string): number {
    let hash = 2166136261;

    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

export function normalizeSeed(seed: string): string {
    return seed.trim();
}

export function getSeededLetter(seed: string, row: number, col: number): string {
    const normalizedSeed = normalizeSeed(seed);
    const hash = hashString(`${normalizedSeed}:${row},${col}`);
    const index = hash % ALPHABET.length;
    return ALPHABET[index] ?? 'A';
}
