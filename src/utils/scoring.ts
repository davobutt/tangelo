export const EXPANSION_EDGE_BONUS_POINTS = 4;

export function scoreWord(word: string): number {
    const length = word.length;

    if (length < 3) {
        return 0;
    }

    if (length <= 4) {
        return 1;
    }

    if (length === 5) {
        return 2;
    }

    if (length === 6) {
        return 3;
    }

    if (length === 7) {
        return 5;
    }

    return 11;
}

export function scoreExpansionBonus(expandedEdgeCount: number): number {
    if (expandedEdgeCount < 1) return 0;
    return expandedEdgeCount * EXPANSION_EDGE_BONUS_POINTS;
}

export function scoreSubmission(baseScore: number, expandedEdgeCount: number): {
    baseScore: number;
    expansionBonus: number;
    totalScore: number;
} {
    const expansionBonus = scoreExpansionBonus(expandedEdgeCount);
    return {
        baseScore,
        expansionBonus,
        totalScore: baseScore + expansionBonus,
    };
}