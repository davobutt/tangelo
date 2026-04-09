import type { RoundState } from '../models/RoundState';

export const EXPANSION_TIME_BONUS_SECONDS = 10;

export function applyExpansionTimeBonus(
    round: RoundState,
    expandedEdgeCount: number,
    bonusSeconds = EXPANSION_TIME_BONUS_SECONDS,
): number {
    if (round.status !== 'running') return 0;
    if (expandedEdgeCount < 1) return 0;

    round.timeRemaining += bonusSeconds;
    return bonusSeconds;
}
