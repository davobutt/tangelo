import type { RoundState } from '../models/RoundState';

export function tickRoundTimer(round: RoundState): boolean {
    if (round.status !== 'running') return false;

    round.timeRemaining = Math.max(0, round.timeRemaining - 1);
    if (round.timeRemaining === 0) {
        round.status = 'ended';
        return true;
    }

    return false;
}
