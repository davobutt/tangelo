export interface CuratedSeedCoord {
    row: number;
    col: number;
}

export interface CuratedExpansionWordPlacement {
    word: string;
    path: readonly CuratedSeedCoord[];
}

export interface CuratedSeedDefinition {
    seed: string;
    theme: string;
    hiddenWords: readonly string[];
    openingHiddenWords?: readonly string[];
    expansionHiddenWordPlacements?: readonly CuratedExpansionWordPlacement[];
}

export const CURATED_SEED_DEFINITIONS: readonly CuratedSeedDefinition[] = [
    {
        seed: 'lemon',
        theme: 'citrus',
        hiddenWords: ['LEMON', 'LIME'],
        openingHiddenWords: ['LEMON', 'LIME'],
    },
    {
        seed: 'moose',
        theme: 'canine',
        hiddenWords: ['DOG', 'CHIVE', 'BONE', 'WOOF'],
        expansionHiddenWordPlacements: [
            {
                word: 'CHIVE',
                path: [
                    { row: -1, col: -1 },
                    { row: -1, col: 0 },
                    { row: -1, col: 1 },
                    { row: -1, col: 2 },
                    { row: -1, col: 3 },
                ],
            },
            {
                word: 'DOG',
                path: [
                    { row: 1, col: 4 },
                    { row: 2, col: 4 },
                    { row: 3, col: 4 },
                ],
            },
            {
                word: 'WOOF',
                path: [
                    { row: 4, col: 3 },
                    { row: 4, col: 2 },
                    { row: 4, col: 1 },
                    { row: 4, col: 0 },
                ],
            },
            {
                word: 'BONE',
                path: [
                    { row: 3, col: -1 },
                    { row: 2, col: -1 },
                    { row: 1, col: -1 },
                    { row: 0, col: -1 },
                ],
            },
        ],
    },
] as const;
