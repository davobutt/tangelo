# Title
Separate Seeded Challenge Score Tracking

# Description
As a player, I want shared seeded runs to have their own score tracking, so friends or family can compare results on the same grid without mixing those scores into normal endless-mode progression.

# Acceptance Criteria
- [ ] Seeded runs are tracked separately from normal leaderboard and high-score flows.
- [ ] Seeded scores remain viewable for comparison.
- [ ] The system supports both manual seeds and a shared daily seed source, even before player-facing seed UI is added.
- [ ] Daily shared seed selection can be configured manually for now.
- [ ] Normal endless/random play remains unaffected by seeded challenge tracking.

# Technical Tasks
- [ ] Add a run mode or score category that distinguishes seeded runs from normal runs.
- [ ] Update score submission and storage contracts to preserve seeded-run identity.
- [ ] Add support for manual seed injection in game flow without requiring player-facing UI yet.
- [ ] Add a configurable source for the current shared daily seed.
- [ ] Ensure seeded result viewing can compare scores for the same seeded challenge.

# Test Scenarios
- [ ] A seeded run score is stored separately from normal endless scores.
- [ ] Normal high-score behavior remains unchanged for unseeded runs.
- [ ] Two players using the same seed can compare scores within the seeded challenge category.
- [ ] Changing the configured shared seed starts a distinct comparison set.
- [ ] Manual seeded runs and shared seeded runs both resolve through the seeded tracking path.

# Dependencies
- [ ] Depends on 03-coordinate-seeded-board-generation.
- [ ] Depends on epic 04-online-leaderboard-and-player-identity.
