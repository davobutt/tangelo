# Title
Seeded Play Mode Selection and Mode-Aware Leaderboards

# Description
As a player, I want to choose between Free Play, Challenge, and Enter Code from the splash screen, so seeded play is easy to discover and leaderboard context always matches the mode I launched.

# Acceptance Criteria
- [ ] Splash/start screen shows exactly three primary launch actions: `Free Play`, `Challenge`, and `Enter Code`.
- [ ] `Free Play` launches the existing normal endless-mode flow.
- [ ] `Challenge` launches the shared challenge flow for the currently active backend-configured challenge.
- [ ] `Enter Code` opens the custom seeded-run entry flow instead of launching gameplay immediately.
- [ ] Leaderboard reads and labels reflect the current mode context instead of mixing Free Play, Challenge, and custom Enter Code scores together.
- [ ] The current run mode is visually clear once gameplay has started.

# Technical Tasks
- [ ] Refactor start-screen action model to support three explicit launch modes.
- [ ] Add run-context wiring from splash selection through gameplay initialization and restart flows.
- [ ] Update leaderboard entry points and labels to resolve against the active run mode.
- [ ] Add shared mode metadata/state so HUD and overlays can present the current context clearly.
- [ ] Ensure seeded-mode launch hooks integrate with the existing hidden seeded-run plumbing from this epic.

# Test Scenarios
- [ ] Splash screen renders all three launch actions with no missing or duplicate options.
- [ ] Launching `Free Play` still behaves exactly like the current normal endless mode.
- [ ] Launching `Enter Code` routes to seeded entry rather than starting a free-play round.
- [ ] Launching `Challenge` routes to challenge-mode startup rather than free play.
- [ ] Leaderboard opened from each mode shows results for that mode only.
- [ ] Restarting or reopening overlays preserves the correct run-mode context.

# Dependencies
- [ ] Depends on `03-coordinate-seeded-board-generation`.
- [ ] Depends on `04-seeded-challenge-score-tracking`.
- [ ] Depends on Epic 03 start flow and onboarding shell for splash-screen integration.
