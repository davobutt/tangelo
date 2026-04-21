# Title
Curated Themed Seeds with Guaranteed Hidden Words

# Description
As a challenge designer, I want to preconfigure special seeds that secretly contain real themed words, so I can run hand-crafted challenges without revealing the answers to players ahead of time.

Current seeded play guarantees reproducibility, but it does not provide a way to author intentional themed boards. This story adds a static in-repo configuration for curated seeds and a deterministic generation path that guarantees the configured hidden words appear as valid board paths while still producing a normal playable board around them.

# Acceptance Criteria
- [x] A static repo configuration can define curated themed seeds and the hidden words each seed must contain.
- [x] Each configured hidden word is guaranteed to appear as a valid path on the generated board for that seed.
- [x] Curated seeds remain deterministic and replayable across runs.
- [x] Players are not shown the theme or the hidden target words before or during play.
- [x] Non-curated seeds continue to use the normal seeded-generation path without regression.
- [x] Invalid or impossible curated-seed definitions fail clearly during development or startup rather than silently producing a broken challenge.

# Technical Tasks
- [x] Add a static curated-seed configuration format to the repo for mapping a seed to one or more hidden real words.
- [x] Build deterministic placement logic that embeds configured words as valid non-repeating board paths.
- [x] Generate filler letters around placed words while preserving the fairness goals introduced for general generation.
- [x] Validate curated-seed definitions so overlapping, impossible, or invalid words are surfaced explicitly.
- [x] Ensure the seeded board-generation entry point selects the curated path only when a configured seed is used.
- [x] Keep challenge and custom seeded play APIs compatible with existing seed inputs and leaderboard identities.

# Test Scenarios
- [x] A configured curated seed always produces the same board and always includes each required hidden word.
- [x] The hidden words can be traced as legal adjacent paths by the existing submission rules.
- [x] Two runs of the same curated seed produce identical starting and expanded boards.
- [x] A non-curated seed still behaves like a normal seeded run.
- [x] Invalid curated configuration is rejected with a clear error.

# Dependencies
- [x] Depends on `03-coordinate-seeded-board-generation`.
- [x] Depends on `08-playable-letter-distribution-for-opening-and-expansion-generation`.
- [x] Integrates with `07-backend-managed-active-challenge-launch-flow` when curated seeds are used as shared challenges.

# Review Notes
- Added a static curated-seed config module and wired the default `lemon` challenge seed to hidden citrus-themed words that stay repo-internal and are never surfaced in the UI or leaderboard APIs.
- Seeded opening-board generation now detects curated seeds, deterministically searches for valid adjacent paths for each hidden word, overlays those letters onto the existing fair seeded filler board, and keeps non-curated seeds on the normal seeded path.
- Curated seed definitions are validated during module load so malformed seeds, empty hidden-word lists, non-dictionary words, duplicate seed definitions, or unplaceable boards fail clearly during development and startup.
- Added regression tests for guaranteed hidden-word paths, curated board and expansion determinism, non-curated seeded fallback, and explicit invalid configuration rejection.
- Verified with `npm run build && npm run test` and `cd backend && npm run build && node dist/integration.test.js`.
