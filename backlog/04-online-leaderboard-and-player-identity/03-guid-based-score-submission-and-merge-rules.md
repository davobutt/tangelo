# Title
GUID-Based Score Submission and Merge Rules

# Description
As a player, I want score identity to be tied to my unique GUID rather than unique display name, so name clashes do not break leaderboard behavior.

# Acceptance Criteria
- [ ] Score submissions include player GUID, display name, and score.
- [ ] Backend allows duplicate display names across different GUIDs.
- [ ] Leaderboard merge behavior uses GUID identity for per-player best-score logic.
- [ ] Score records remain valid when players later rename themselves.
- [ ] Submission failures are surfaced gracefully without blocking continued play.

# Technical Tasks
- [ ] Extend client score submission payload to include guid and displayName.
- [ ] Implement backend merge/update rules keyed by guid.
- [ ] Ensure display name is treated as mutable profile metadata.
- [ ] Add conflict-safe handling for repeated submissions from same guid.
- [ ] Add migration/backfill notes for test data created before GUID rules.

# Test Scenarios
- [ ] Two players with the same display name are tracked independently by GUID.
- [ ] Repeated submissions from one GUID retain correct best-score behavior.
- [ ] Renaming a player does not break score association to their GUID.
- [ ] Temporary API errors do not crash gameplay loops.

# Dependencies
- [ ] Depends on 01-backend-leaderboard-service-and-datastore-foundation.
- [ ] Depends on 02-first-launch-name-capture-and-local-player-profile.
