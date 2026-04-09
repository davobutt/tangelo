# Title
Round UX, Restart, and High Score Persistence

# Description
As a returning player, I can see timer and score clearly, restart quickly, and keep my best score saved locally, using a basic lo-fi interface that works on web and mobile.

# Acceptance Criteria
- [ ] UI displays timer, current score, current selection, and submitted word list.
- [ ] Submission validity feedback is visible at submit time.
- [ ] Restart button starts a fresh 60-second round with a newly generated board.
- [ ] High score is persisted in local storage and displayed on game load.
- [ ] Layout is usable on desktop and mobile viewports.
- [ ] Visual style remains intentionally basic lo-fi.

# Technical Tasks
- [ ] Implement HUD components for timer, score, high score, and selection preview.
- [ ] Implement restart control and state reset sequence.
- [ ] Add local storage adapter for high score read/write and safe fallback behavior.
- [ ] Ensure touch-friendly spacing and responsive placement for mobile.
- [ ] Add lightweight UX feedback hooks for accepted/rejected submissions.

# Test Scenarios
- [ ] Timer, score, and selection display update correctly during play.
- [ ] Restart clears round-specific state and starts a new 60-second round.
- [ ] High score persists across page reloads in supported browsers.
- [ ] If local storage is unavailable, game remains playable without crashing.
- [ ] Core controls remain usable on common mobile and desktop dimensions.

# Dependencies
- [ ] Depends on `01-timed-4x4-boggle-core-loop`.
- [ ] Depends on `02-uk-dictionary-validation-and-boggle-scoring`.