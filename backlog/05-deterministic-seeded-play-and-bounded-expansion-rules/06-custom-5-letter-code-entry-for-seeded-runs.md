# Title
Custom 5-Letter Code Entry for Seeded Runs

# Description
As a player, I want to enter a simple 5-letter code to start a seeded run, so I can replay or share deterministic boards without needing hidden developer controls.

# Acceptance Criteria
- [ ] `Enter Code` presents a dedicated 5-slot code-entry UI before gameplay starts.
- [ ] Input accepts letters only and requires exactly 5 letters.
- [ ] Submit/start action remains disabled until all 5 slots are filled.
- [ ] Any 5-letter code starts a valid deterministic seeded run.
- [ ] Entered codes are normalized consistently for seeded generation and leaderboard lookup.
- [ ] Custom code runs use the seeded leaderboard context and remain separate from Free Play and backend Challenge scores.

# Technical Tasks
- [ ] Build the code-entry modal/screen with five visible input boxes and clear focus behavior.
- [ ] Add input normalization and validation rules for exact 5-letter alphabetic codes.
- [ ] Wire accepted codes into seeded run initialization using the existing coordinate-seeded generation path.
- [ ] Ensure restart/replay behavior for custom code runs is explicit and consistent with the selected code.
- [ ] Route custom seeded runs through the correct seeded leaderboard/high-score context.

# Test Scenarios
- [ ] Code entry rejects non-letter input and prevents submission before all 5 slots are filled.
- [ ] Entering any valid 5-letter code launches a playable seeded run.
- [ ] Reusing the same 5-letter code reproduces the same board outcome deterministically.
- [ ] Custom code scores appear only in the custom seeded context, not in Free Play or Challenge leaderboards.
- [ ] Leaving and re-entering the flow does not corrupt the selected code or mode state.

# Dependencies
- [ ] Depends on `05-seeded-play-mode-selection-and-mode-aware-leaderboards`.
- [ ] Depends on `03-coordinate-seeded-board-generation`.
- [ ] Depends on `04-seeded-challenge-score-tracking`.
