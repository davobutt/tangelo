# Title
Timed 4x4 Boggle Core Loop

# Description
As a player on web or mobile, I can play a 60-second Boggle-style round on a 4x4 letter grid by selecting adjacent letters with click/tap and submitting words, so I can quickly find as many valid words as possible.

# Acceptance Criteria
- [x] Game initializes a randomized 4x4 board at round start.
- [x] Players can select letters using click/tap interactions only.
- [x] Selection path enforces adjacency (horizontal, vertical, diagonal).
- [x] Players can submit multiple words during a round via a submit button.
- [x] Round timer is fixed at 60 seconds.
- [x] At 0 seconds, the round ends and further submissions are blocked.
- [x] Duplicate words in the same round are rejected.
- [x] Words shorter than 3 letters are rejected.

# Technical Tasks
- [x] Set up Phaser + TypeScript project foundation and main scene lifecycle.
- [x] Implement 4x4 board generation with reusable tile and board state models.
- [x] Implement pointer input handling for click/tap selection and path reset.
- [x] Add adjacency/path validation utility for current selection.
- [x] Add round state machine (`idle`, `running`, `ended`) with 60-second timer.
- [x] Add submit action pipeline for candidate word intake.

# Test Scenarios
- [x] Starting a new round always renders exactly 16 letters.
- [x] Non-adjacent tile selection is blocked and clearly reset/ignored.
- [x] Submitting at least two different valid candidate words in one round is possible.
- [x] Submission at 0 seconds is rejected with round-ended state.
- [x] Duplicate and short-word rules are enforced consistently.

# Dependencies
- [x] None (foundational story for this epic).