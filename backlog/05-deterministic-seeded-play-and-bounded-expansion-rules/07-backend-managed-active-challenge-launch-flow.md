# Title
Backend-Managed Active Challenge Launch Flow

# Description
As a player, I want a dedicated Challenge option that always launches the single active shared challenge from the backend, so I can compete on the same seeded board as everyone else without manually entering a code.

# Acceptance Criteria
- [ ] Backend exposes exactly one active challenge code at a time for the client to consume.
- [ ] `Challenge` mode fetches the active challenge and launches the associated seeded run.
- [ ] Challenge leaderboard results remain separate from Free Play and custom Enter Code runs.
- [ ] Changing the active backend challenge creates a distinct comparison set for leaderboard ranking.
- [ ] If the active challenge cannot be loaded, the UI shows a clear error state and does not silently fall back to another mode.
- [ ] Backend support allows manual challenge rotation without requiring automated daily scheduling.

# Technical Tasks
- [ ] Add backend storage/configuration for one active challenge code and its seeded leaderboard identity.
- [ ] Expose a client-facing endpoint or contract for reading the current active challenge.
- [ ] Add a minimal admin/update surface suitable for manually changing the active challenge code.
- [ ] Wire the frontend `Challenge` launch path to fetch, validate, and start the backend-provided challenge.
- [ ] Ensure leaderboard queries and score submissions scope correctly to the active challenge seed identity.

# Test Scenarios
- [ ] With an active challenge configured, pressing `Challenge` launches the expected seeded board.
- [ ] Updating the active challenge code changes the launched board and leaderboard comparison set.
- [ ] Challenge scores do not appear in Free Play or custom seeded leaderboards.
- [ ] Backend/API failure to load the challenge shows a readable, actionable error state.
- [ ] Manual challenge rotation does not break seeded replay or leaderboard isolation.

# Dependencies
- [ ] Depends on `05-seeded-play-mode-selection-and-mode-aware-leaderboards`.
- [ ] Depends on `04-seeded-challenge-score-tracking`.
- [ ] Depends on epic `04-online-leaderboard-and-player-identity` backend and leaderboard contract stories.
