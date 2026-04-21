export interface CuratedSeedDefinition {
    seed: string;
    theme: string;
    hiddenWords: readonly string[];
}

export const CURATED_SEED_DEFINITIONS: readonly CuratedSeedDefinition[] = [
    {
        seed: 'lemon',
        theme: 'citrus',
        hiddenWords: ['LEMON', 'LIME'],
    },
] as const;
