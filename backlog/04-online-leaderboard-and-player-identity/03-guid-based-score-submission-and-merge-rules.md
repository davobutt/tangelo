# Title
GUID-Based Score Submission and Merge Rules

# Description
As a player, I want score identity to be tied to my unique GUID rather than unique display name, so name clashes do not break leaderboard behavior.

# Acceptance Criteria
- [x] Score submissions include player GUID, display name, and score.
- [x] Backend allows duplicate display names across different GUIDs.
- [x] Leaderboard merge behavior uses GUID identity for per-player best-score logic.
- [x] Score records remain valid when players later rename themselves.
- [x] Submission failures are surfaced gracefully without blocking continued play.

# Technical Tasks
- [x] Extend client score submission payload to include guid and displayName.
- [x] Implement backend merge/update rules keyed by guid.
- [x] Ensure display name is treated as mutable profile metadata.
- [x] Add conflict-safe handling for repeated submissions from same guid.
- [x] Add migration/backfill notes for test data created before GUID rules.

# Test Scenarios
- [x] Two players with the same display name are tracked independently by GUID.
- [x] Repeated submissions from one GUID retain correct best-score behavior.
- [x] Renaming a player does not break score association to their GUID.
- [x] Temporary API errors do not crash gameplay loops.

# Dependencies
- [x] Depends on 01-backend-leaderboard-service-and-datastore-foundation.
- [x] Depends on 02-first-launch-name-capture-and-local-player-profile.

# Review Notes
GUID-based score identity and merge behavior are now fully implemented across backend and client.

Implementation summary:
- Added frontend leaderboard client submission utility at round end with payload `{ playerGUID, displayName, score }`.
- Added non-blocking failure surfacing in gameplay loop: failed submission shows feedback and does not interrupt play.
- Upgraded backend datastore merge logic to one active leaderboard record per GUID.
- Backend now allows duplicate display names because identity is GUID-based.
- Repeated submissions from the same GUID merge via per-player best-score logic.
- Display name is treated as mutable metadata and updates independently from score ownership.
- Added migration/backfill docs for legacy pre-GUID multi-row test data.

Validation summary:
- Backend build passes.
- Frontend build passes.
- Backend integration tests pass with explicit GUID merge/duplicate-name/rename coverage.
- Frontend tests pass with gameplay loop stability intact.

Sign-off: Story 04-03 complete and ready for 04-04 integration.
