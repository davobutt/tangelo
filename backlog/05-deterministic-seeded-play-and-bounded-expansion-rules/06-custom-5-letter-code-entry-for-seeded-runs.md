# Title
Custom 5-Letter Code Entry for Seeded Runs

# Description
As a player, I want to enter a simple 5-letter code to start a seeded run, so I can replay or share deterministic boards without needing hidden developer controls.

# Acceptance Criteria
- [x] `Enter Code` presents a dedicated 5-slot code-entry UI before gameplay starts.
- [x] Input accepts letters only and requires exactly 5 letters.
- [x] Submit/start action remains disabled until all 5 slots are filled.
- [x] Any 5-letter code starts a valid deterministic seeded run.
- [x] Entered codes are normalized consistently for seeded generation and leaderboard lookup.
- [x] Custom code runs use the seeded leaderboard context and remain separate from Free Play and backend Challenge scores.

# Technical Tasks
- [x] Build the code-entry modal/screen with five visible input boxes and clear focus behavior.
- [x] Add input normalization and validation rules for exact 5-letter alphabetic codes.
- [x] Wire accepted codes into seeded run initialization using the existing coordinate-seeded generation path.
- [x] Ensure restart/replay behavior for custom code runs is explicit and consistent with the selected code.
- [x] Route custom seeded runs through the correct seeded leaderboard/high-score context.

# Test Scenarios
- [x] Code entry rejects non-letter input and prevents submission before all 5 slots are filled.
- [x] Entering any valid 5-letter code launches a playable seeded run.
- [x] Reusing the same 5-letter code reproduces the same board outcome deterministically.
- [x] Custom code scores appear only in the custom seeded context, not in Free Play or Challenge leaderboards.
- [x] Leaving and re-entering the flow does not corrupt the selected code or mode state.

# Dependencies
- [x] Depends on `05-seeded-play-mode-selection-and-mode-aware-leaderboards`.
- [x] Depends on `03-coordinate-seeded-board-generation`.
- [x] Depends on `04-seeded-challenge-score-tracking`.

# Review Notes
- Replaced free-text seed entry with a dedicated five-box code dialog that accepts letters only, enables start only when all boxes are filled, and always refocuses on a cleared first box when reopened.
- Added shared `seedCode` helpers so custom codes normalize consistently to a canonical 5-letter lowercase seed for run context, seeded board generation, and leaderboard/high-score scoping.
- Preserved seeded replay behavior by keeping the selected code as the active seeded run context while making re-entry explicit through the dedicated dialog flow.
- Verified with `npm run build && npm run test`.
