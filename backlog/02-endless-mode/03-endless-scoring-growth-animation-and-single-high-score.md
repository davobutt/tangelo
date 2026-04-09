# Title
Endless Scoring, Growth Animation, and Single High Score

# Description
As a player, I want clear score rewards, visible growth feedback, and persistent best-score tracking, so endless mode feels responsive and progression is meaningful across sessions.

# Acceptance Criteria
- [x] Existing Boggle base scoring remains in effect for valid words.
- [x] Expansion bonus adds +4 points per expanded edge.
- [x] Multi-edge expansion in one submission awards +4 for each expanded edge.
- [x] Score display updates immediately with base and edge bonus totals applied.
- [x] Newly added letters fade in when growth is committed.
- [x] A single high score is persisted locally and shown on load.
- [x] High score updates when current run score exceeds stored value.

# Technical Tasks
- [x] Extend scoring utility to combine base score plus per-edge expansion bonus.
- [x] Extend submission result payload with score breakdown fields.
- [x] Update HUD score rendering to reflect final per-submission score delta.
- [x] Implement fade-in animation for newly placed growth letters.
- [x] Keep or migrate persistence to one global high-score key for endless mode.
- [x] Add resilience path when local storage is unavailable.

# Test Scenarios
- [x] Base scoring still matches classic Boggle values by word length.
- [x] One-edge expansion grants exactly +4 bonus.
- [x] Multi-edge expansion grants +4 times number of expanded edges.
- [x] Growth fade-in animation triggers for each newly added letter.
- [x] High score persists across reloads and updates only on score improvement.
- [x] Game remains playable if local storage access fails.

# Dependencies
- [x] Depends on `01-irregular-board-model-and-edge-expansion-engine`.
- [x] Depends on `02-endless-timer-and-submission-rules-integration`.
