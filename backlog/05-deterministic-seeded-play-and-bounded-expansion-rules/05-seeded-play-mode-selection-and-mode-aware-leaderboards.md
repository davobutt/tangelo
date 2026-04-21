# Title
Seeded Play Mode Selection and Mode-Aware Leaderboards

# Description
As a player, I want to choose between Free Play, Challenge, and Enter Code from the splash screen, so seeded play is easy to discover and leaderboard context always matches the mode I launched.

# Acceptance Criteria
- [x] Splash/start screen shows exactly three primary launch actions: `Free Play`, `Challenge`, and `Enter Code`.
- [x] `Free Play` launches the existing normal endless-mode flow.
- [x] `Challenge` launches the shared challenge flow for the currently active backend-configured challenge.
- [x] `Enter Code` opens the custom seeded-run entry flow instead of launching gameplay immediately.
- [x] Leaderboard reads and labels reflect the current mode context instead of mixing Free Play, Challenge, and custom Enter Code scores together.
- [x] The current run mode is visually clear once gameplay has started.

# Technical Tasks
- [x] Refactor start-screen action model to support three explicit launch modes.
- [x] Add run-context wiring from splash selection through gameplay initialization and restart flows.
- [x] Update leaderboard entry points and labels to resolve against the active run mode.
- [x] Add shared mode metadata/state so HUD and overlays can present the current context clearly.
- [x] Ensure seeded-mode launch hooks integrate with the existing hidden seeded-run plumbing from this epic.

# Test Scenarios
- [x] Splash screen renders all three launch actions with no missing or duplicate options.
- [x] Launching `Free Play` still behaves exactly like the current normal endless mode.
- [x] Launching `Enter Code` routes to seeded entry rather than starting a free-play round.
- [x] Launching `Challenge` routes to challenge-mode startup rather than free play.
- [x] Leaderboard opened from each mode shows results for that mode only.
- [x] Restarting or reopening overlays preserves the correct run-mode context.

# Dependencies
- [x] Depends on `03-coordinate-seeded-board-generation`.
- [x] Depends on `04-seeded-challenge-score-tracking`.
- [x] Depends on Epic 03 start flow and onboarding shell for splash-screen integration.

# Review Notes
- Start gate now exposes `Free Play`, `Challenge`, and `Enter Code`, with seeded mode selection flowing through restart and leaderboard interactions.
- Run context now distinguishes free play, shared challenge, and custom code runs for leaderboard labels and local high-score storage keys.
- Backend leaderboard categories now separate `challenge` from custom `seeded` runs even when the same seed text is reused.
- Verified with `npm run build && npm run test` and `cd backend && npm run build && node dist/integration.test.js`.
