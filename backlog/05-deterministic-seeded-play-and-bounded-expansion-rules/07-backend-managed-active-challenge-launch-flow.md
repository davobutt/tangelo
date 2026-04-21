# Title
Backend-Managed Active Challenge Launch Flow

# Description
As a player, I want a dedicated Challenge option that always launches the single active shared challenge from the backend, so I can compete on the same seeded board as everyone else without manually entering a code.

# Acceptance Criteria
- [x] Backend exposes exactly one active challenge code at a time for the client to consume.
- [x] `Challenge` mode fetches the active challenge and launches the associated seeded run.
- [x] Challenge leaderboard results remain separate from Free Play and custom Enter Code runs.
- [x] Changing the active backend challenge creates a distinct comparison set for leaderboard ranking.
- [x] If the active challenge cannot be loaded, the UI shows a clear error state and does not silently fall back to another mode.
- [x] Backend support allows manual challenge rotation without requiring automated daily scheduling.

# Technical Tasks
- [x] Add backend storage/configuration for one active challenge code and its seeded leaderboard identity.
- [x] Expose a client-facing endpoint or contract for reading the current active challenge.
- [x] Add a minimal admin/update surface suitable for manually changing the active challenge code.
- [x] Wire the frontend `Challenge` launch path to fetch, validate, and start the backend-provided challenge.
- [x] Ensure leaderboard queries and score submissions scope correctly to the active challenge seed identity.

# Test Scenarios
- [x] With an active challenge configured, pressing `Challenge` launches the expected seeded board.
- [x] Updating the active challenge code changes the launched board and leaderboard comparison set.
- [x] Challenge scores do not appear in Free Play or custom seeded leaderboards.
- [x] Backend/API failure to load the challenge shows a readable, actionable error state.
- [x] Manual challenge rotation does not break seeded replay or leaderboard isolation.

# Dependencies
- [x] Depends on `05-seeded-play-mode-selection-and-mode-aware-leaderboards`.
- [x] Depends on `04-seeded-challenge-score-tracking`.
- [x] Depends on epic `04-online-leaderboard-and-player-identity` backend and leaderboard contract stories.

# Review Notes
- Challenge mode now fetches `/api/challenge/current` before launch and uses the backend-provided board seed separately from the backend-managed leaderboard seed identity, so challenge runs stay isolated from manual code runs even when the same 5-letter code is reused.
- Backend datastore implementations now persist a single active challenge record and expose a manual rotation endpoint at `POST /api/admin/challenge`, generating a fresh challenge leaderboard identity automatically when one is not supplied.
- The start gate now shows a persistent error message when the active challenge cannot be loaded and does not silently route the player into free play.
- Verified with `npm run build && npm run test`, `cd backend && npm run build && node dist/integration.test.js`, and a direct HTTP smoke check of the new challenge endpoints.
