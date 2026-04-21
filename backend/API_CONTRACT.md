# Boggle Leaderboard Backend API Contract

## Overview
The Boggle Leaderboard Backend provides a persistent, ranked service for storing and retrieving player scores. It is designed to handle concurrent submissions and efficiently query rankings.

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: (configured via environment variables)

## Endpoints

### Health Check
Check backend availability and readiness.

```
GET /health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": 1713398400000
}
```

---

### Submit Score
Submit a score keyed by player GUID. Returns the merged per-player leaderboard record.

```
POST /api/scores
Content-Type: application/json
```

**Request Body**:
```json
{
  "playerGUID": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Alice",
  "score": 1450,
  "runMode": "normal"
}
```

**Validation Rules**:
- `playerGUID`: Required, non-empty string, max 256 chars (UUID recommended)
- `displayName`: Required, non-empty string, max 128 chars
- `score`: Required, integer 0–1,000,000
- `runMode`: Optional, `normal`, `challenge`, or `seeded` (defaults to `normal`)
- `seedKey`: Required when `runMode` is `challenge` or `seeded`

**Merge Rules**:
- Identity is keyed by `playerGUID` within a score category
- Duplicate display names are allowed across different GUIDs
- Re-submissions from the same GUID keep the best score (`max(existing, submitted)`) within that category
- `displayName` is mutable metadata and is always refreshed to the latest submitted name
- `submittedAt` updates only when a new best score is achieved

**Response** (201 Created):
```json
{
  "success": true,
  "entry": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "playerGUID": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "Alice",
    "score": 1450,
    "submittedAt": 1713398400000,
    "runMode": "normal",
    "seedKey": null
  },
  "timestamp": 1713398400000
}
```

**Error** (400 Bad Request):
```json
{
  "status": 400,
  "code": "INVALID_PAYLOAD",
  "message": "Invalid score submission: playerGUID, displayName, score, and seeded context (when used) are required",
  "timestamp": 1713398400000
}
```

**Error** (500 Internal Server Error):
```json
{
  "status": 500,
  "code": "DATASTORE_ERROR",
  "message": "Failed to store score. Please try again later.",
  "timestamp": 1713398400000
}
```

---

### Fetch Leaderboard
Retrieve ranked entries sorted by score descending, then by submission time ascending.

```
GET /api/leaderboard?limit=100
GET /api/leaderboard?limit=100&runMode=seeded&seedKey=family-night
GET /api/leaderboard?limit=100&runMode=challenge&seedKey=weekly-puzzle
```

**Query Parameters**:
- `limit` (optional): Number of entries to return. Default: 100, Max: 1000
- `runMode` (optional): `normal`, `challenge`, or `seeded`. Default: `normal`
- `seedKey` (required when `runMode=challenge` or `runMode=seeded`): Seed identifier to compare within the selected mode category

**Response** (200 OK):
```json
{
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "playerGUID": "550e8400-e29b-41d4-a716-446655440000",
      "displayName": "Alice",
      "score": 2100,
      "submittedAt": 1713398400000,
      "runMode": "normal",
      "seedKey": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "playerGUID": "550e8400-e29b-41d4-a716-446655440099",
      "displayName": "Bob",
      "score": 1950,
      "submittedAt": 1713398401000,
      "runMode": "normal",
      "seedKey": null
    }
  ],
  "totalCount": 2,
  "timestamp": 1713398400000
}
```

**Error** (500 Internal Server Error):
```json
{
  "status": 500,
  "code": "DATASTORE_ERROR",
  "message": "Failed to fetch leaderboard. Please try again later.",
  "timestamp": 1713398400000
}
```

---

## Data Model

### LeaderboardEntry
```typescript
{
  id: string;                // UUID generated server-side
  playerGUID: string;       // Client-side persistent player identifier (UUID)
  displayName: string;      // Human-readable player name
  score: number;            // Score value (0-1,000,000)
  submittedAt: number;      // Submission timestamp (milliseconds since epoch)
  runMode: 'normal' | 'challenge' | 'seeded';
  seedKey: string | null;
}
```

The backend stores one active leaderboard record per `playerGUID` per score category. Display names are mutable and may change over time without affecting score identity.

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_PAYLOAD` | 400 | Malformed or missing required fields |
| `DATASTORE_ERROR` | 500 | Database or persistence layer failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `NOT_FOUND` | 404 | Endpoint does not exist |

---

## Environment Configuration

Backend behavior is controlled via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Execution environment (development/production) |
| `PORT` | `3000` | Port to listen on |
| `DATASTORE_TYPE` | `sqlite` | Datastore backend (sqlite/memory) |
| `DB_PATH` | `./leaderboard.db` | Path to SQLite database file (sqlite only) |
| `LOG_LEVEL` | `info` | Logging verbosity (debug/info/warn/error) |

**Example Development Setup**:
```bash
export NODE_ENV=development
export DATASTORE_TYPE=sqlite
export DB_PATH=./leaderboard.db
export PORT=3000
npm run dev
```

**Example Production Setup** (cloud datastore):
```bash
export NODE_ENV=production
export DATASTORE_TYPE=sqlite
export DB_PATH=/var/lib/boggle/leaderboard.db
export PORT=8080
npm start
```

---

## Indexing Strategy

The datastore uses two indexes for query efficiency:

1. **Score Ranking Index** (`idx_leaderboard_score_desc`):
   - Column: `score DESC, submittedAt ASC`
   - Purpose: Enables O(log N) retrieval of top-ranked entries
   - Usage: Leaderboard fetch queries

2. **Player GUID Index** (`idx_leaderboard_player_guid`):
   - Column: `playerGUID`
   - Purpose: Enables O(log N) player history queries (future feature)
   - Usage: Future per-player statistics queries

---

## Migration and Backfill Notes

- Legacy test data that inserted multiple rows per GUID is backfilled automatically on startup.
- Backfill keeps one row per GUID with:
  - Best historical score for that GUID
  - Latest known display name for that GUID
  - Score timestamp tied to the retained best-score record
- This migration is idempotent and runs safely before normal score writes.

---

## Client Integration

### Frontend TypeScript Types
```typescript
interface LeaderboardEntry {
  id: string;
  playerGUID: string;
  displayName: string;
  score: number;
  submittedAt: number;
  runMode: 'normal' | 'seeded';
  seedKey: string | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalCount: number;
  timestamp: number;
}

interface ApiError {
  status: number;
  code: string;
  message: string;
  timestamp: number;
}

interface ScoreSubmissionPayload {
  playerGUID: string;
  displayName: string;
  score: number;
  runMode?: 'normal' | 'seeded';
  seedKey?: string;
}
```

### Example Fetch
```typescript
// Fetch leaderboard
const response = await fetch('http://localhost:3000/api/leaderboard?limit=50&runMode=seeded&seedKey=family-night', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});
const data = await response.json() as LeaderboardResponse;
console.log(data.entries); // Top 50 scores

// Submit a score
const response = await fetch('http://localhost:3000/api/scores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerGUID: 'player-uuid-here',
    displayName: 'Alice',
    score: 1450,
    runMode: 'seeded',
    seedKey: 'family-night',
  }),
});
const result = await response.json();
if (response.ok) {
  console.log('Score submitted:', result.entry);
} else {
  console.error('Submission failed:', result);
}
```

---

## Stability & Error Handling

- **Datastore Failures**: All datastore errors (read/write timeouts, connection loss) return 500 status with `DATASTORE_ERROR` code. Client should retry with exponential backoff.
- **Invalid Input**: Invalid payloads return 400 status with validation details.
- **Concurrency**: SQLite with WAL mode supports concurrent readers and writers.
- **Graceful Shutdown**: Server handles SIGTERM/SIGINT to close database connections cleanly.
