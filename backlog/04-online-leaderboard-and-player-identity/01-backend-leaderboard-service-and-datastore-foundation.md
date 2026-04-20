# Title
Backend Leaderboard Service and Datastore Foundation

# Description
As a player, I want my score stored in an online leaderboard backend, so rankings are global and persist across devices and sessions.

# Acceptance Criteria
- [x] A backend service accepts score submissions and stores them in a persistent data store.
- [x] A leaderboard endpoint returns ranked entries sorted by score descending.
- [x] Data model stores only required leaderboard fields (player GUID, display name, score).
- [x] API and datastore failures are handled without crashing the game client.
- [x] Backend contracts are documented for client integration.

# Technical Tasks
- [x] Define leaderboard API contract for submit score and fetch rankings.
- [x] Implement datastore schema/collection for score entries and player identity linkage.
- [x] Add indexing strategy for efficient score ranking queries.
- [x] Implement service-layer validation and error responses.
- [x] Add environment-based backend configuration for local and deployed targets.

# Test Scenarios
- [x] Submitting a valid score persists correctly in the backend store.
- [x] Leaderboard queries return sorted results with stable ranking behavior.
- [x] Invalid payloads are rejected with clear error responses.
- [x] Service remains stable when datastore read/write errors occur.

# Dependencies
- [x] None (foundational story for this epic).
- [x] Integrates with existing frontend scoring flow from prior epics.

# Review Notes
Backend leaderboard service fully implemented with Node.js/Express and SQLite datastore. 

**Deliverables**:
- Express.js server with two API endpoints: POST /api/scores (submit) and GET /api/leaderboard (fetch rankings)
- SQLite datastore with WAL mode for concurrent access
- Two indexes: score ranking (DESC) and player GUID lookups
- Server-side UUID generation for entries; client-generated GUID for player identity
- Comprehensive payload validation (playerGUID, displayName max lengths; score 0–1M; type enforcement)
- Error handling: invalid payloads return 400 INVALID_PAYLOAD; datastore errors return 500 DATASTORE_ERROR with graceful fallback
- Environment-based configuration: NODE_ENV, PORT, DATASTORE_TYPE, DB_PATH, LOG_LEVEL
- Full API contract documented in API_CONTRACT.md with endpoint specs, error codes, client integration examples, and datastore schema
- Integration tests pass: 6 validation tests + 4 datastore operation tests (submit, fetch with sort, limit)
- CORS support pre-configured for local Vite dev server and deployed targets
- Graceful shutdown handling (SIGTERM/SIGINT) closes database cleanly

**Build Status**: ✅ Backend compiles (tsc), tests pass (100%), no runtime errors
**Frontend Status**: ✅ Frontend build still passing (21 modules, 6,085.60 kB gzip), tests pass (59/59)

**Product-owner sign-off**: Story 04-01 complete and ready for client integration. 18 Apr 2026.
