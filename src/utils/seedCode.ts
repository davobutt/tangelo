export const SEED_CODE_LENGTH = 5;

export function sanitizeSeedCodeInput(value: string): string {
    return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, SEED_CODE_LENGTH);
}

export function normalizeSeedCode(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const sanitized = sanitizeSeedCodeInput(value.trim());
    return sanitized.length === SEED_CODE_LENGTH ? sanitized.toLowerCase() : null;
}

export function formatSeedCodeLabel(value: string): string {
    const normalized = normalizeSeedCode(value);
    return normalized ? normalized.toUpperCase() : sanitizeSeedCodeInput(value).toUpperCase();
}
