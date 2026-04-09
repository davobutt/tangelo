# Title
Endless Timer and Submission Rules Integration

# Description
As a player, I want a continuous timed run where successful edge play extends my available time, so I can keep playing as long as I can find strategic words.

# Acceptance Criteria
- [x] Endless mode uses a 60-second countdown timer at run start.
- [x] Run ends immediately when timer reaches 0.
- [x] Word submission uses existing validity rules (dictionary, adjacency/path, minimum length).
- [x] Duplicate words are rejected within the same run.
- [x] Successful submissions that trigger one or more edge expansions add 10 seconds to the timer.
- [x] Submissions after run end are blocked.
- [x] Endless mode is the only playable mode in the current product.

# Technical Tasks
- [x] Add endless run lifecycle state (`running`, `ended`) with 60-second initialization.
- [x] Integrate expansion outcome from edge engine into submission resolution pipeline.
- [x] Add timer bonus hook that applies +10 seconds for successful expansion submissions.
- [x] Ensure duplicate-word tracking is run-scoped and enforced.
- [x] Remove or disable prior mode switching paths so endless is the default and only mode.
- [x] Update run restart behavior to reset timer, board, score, and used words correctly.

# Test Scenarios
- [x] Fresh run starts at exactly 60 seconds.
- [x] Timer reaches 0 and transitions to ended state with submissions blocked.
- [x] Valid non-duplicate expansion submission adds +10 seconds.
- [x] Valid submission with no qualifying expansion does not grant time bonus.
- [x] Duplicate word in same run is rejected consistently.
- [x] Restarted run resets timing and submission history cleanly.

# Dependencies
- [x] Depends on `01-irregular-board-model-and-edge-expansion-engine`.
