# Title
Round UX, Restart, and High Score Persistence

# Description
As a returning player, I can see timer and score clearly, restart quickly, and keep my best score saved locally, using a basic lo-fi interface that works on web and mobile.

# Acceptance Criteria
- [x] UI displays timer, current score, current selection, and submitted word list.
- [x] Submission validity feedback is visible at submit time.
- [x] Restart button starts a fresh 60-second round with a newly generated board.
- [x] High score is persisted in local storage and displayed on game load.
- [x] Layout is usable on desktop and mobile viewports.
- [x] Visual style remains intentionally basic lo-fi.

# Technical Tasks
- [x] Implement HUD components for timer, score, high score, and selection preview.
- [x] Implement restart control and state reset sequence.
- [x] Add local storage adapter for high score read/write and safe fallback behavior.
- [x] Ensure touch-friendly spacing and responsive placement for mobile.
- [x] Add lightweight UX feedback hooks for accepted/rejected submissions.

# Test Scenarios
- [x] Timer, score, and selection display update correctly during play.
- [x] Restart clears round-specific state and starts a new 60-second round.
- [x] High score persists across page reloads in supported browsers.
- [x] If local storage is unavailable, game remains playable without crashing.
- [x] Core controls remain usable on common mobile and desktop dimensions.

# Dependencies
- [x] Depends on `01-timed-4x4-boggle-core-loop`.
- [x] Depends on `02-uk-dictionary-validation-and-boggle-scoring`.