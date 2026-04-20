# Title
Separate Seeded Challenge Score Tracking

# Description
As a player, I want shared seeded runs to have their own score tracking, so friends or family can compare results on the same grid without mixing those scores into normal endless-mode progression.

# Acceptance Criteria
- [x] Seeded runs are tracked separately from normal leaderboard and high-score flows.
- [x] Seeded scores remain viewable for comparison.
- [x] The system supports both manual seeds and a shared daily seed source, even before player-facing seed UI is added.
- [x] Daily shared seed selection can be configured manually for now.
- [x] Normal endless/random play remains unaffected by seeded challenge tracking.

# Technical Tasks
- [x] Add a run mode or score category that distinguishes seeded runs from normal runs.
- [x] Update score submission and storage contracts to preserve seeded-run identity.
- [x] Add support for manual seed injection in game flow without requiring player-facing UI yet.
- [x] Add a configurable source for the current shared daily seed.
- [x] Ensure seeded result viewing can compare scores for the same seeded challenge.

# Test Scenarios
- [x] A seeded run score is stored separately from normal endless scores.
- [x] Normal high-score behavior remains unchanged for unseeded runs.
- [x] Two players using the same seed can compare scores within the seeded challenge category.
- [x] Changing the configured shared seed starts a distinct comparison set.
- [x] Manual seeded runs and shared seeded runs both resolve through the seeded tracking path.

# Dependencies
- [x] Depends on 03-coordinate-seeded-board-generation.
- [x] Depends on epic 04-online-leaderboard-and-player-identity.

# Review Notes
Seeded challenge runs now flow through a distinct run context so local high scores, backend score storage, and leaderboard queries stay isolated from the normal endless mode.

Implementation summary:
- Added a shared run-context utility that resolves normal play, manual under-the-hood seeded runs, and a configurable shared daily seed source.
- Split local high-score storage by run context so seeded challenges keep their own best score without affecting normal endless progression.
- Extended leaderboard client and backend contracts with seeded run metadata (`runMode` and `seedKey`) and filtered leaderboard reads by the active run category.
- Upgraded backend datastore persistence and migration logic so one player can have separate best scores for normal play and multiple seeded challenges.
- Updated the leaderboard overlay to compare scores within the active seeded challenge when a seed is in effect.

Validation summary:
- Frontend seeded/high-score tests pass.
- Frontend tests pass.
- Frontend build passes.
- Backend build passes.
- Backend integration script passes.
