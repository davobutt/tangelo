# Title
Curated Themed Seeds with Guaranteed Hidden Words

# Description
As a challenge designer, I want to preconfigure special seeds that secretly contain real themed words, so I can run hand-crafted challenges without revealing the answers to players ahead of time.

Current seeded play guarantees reproducibility, but it does not provide a way to author intentional themed boards. This story adds a static in-repo configuration for curated seeds and a deterministic generation path that guarantees the configured hidden words appear as valid board paths while still producing a normal playable board around them.

# Acceptance Criteria
- [ ] A static repo configuration can define curated themed seeds and the hidden words each seed must contain.
- [ ] Each configured hidden word is guaranteed to appear as a valid path on the generated board for that seed.
- [ ] Curated seeds remain deterministic and replayable across runs.
- [ ] Players are not shown the theme or the hidden target words before or during play.
- [ ] Non-curated seeds continue to use the normal seeded-generation path without regression.
- [ ] Invalid or impossible curated-seed definitions fail clearly during development or startup rather than silently producing a broken challenge.

# Technical Tasks
- [ ] Add a static curated-seed configuration format to the repo for mapping a seed to one or more hidden real words.
- [ ] Build deterministic placement logic that embeds configured words as valid non-repeating board paths.
- [ ] Generate filler letters around placed words while preserving the fairness goals introduced for general generation.
- [ ] Validate curated-seed definitions so overlapping, impossible, or invalid words are surfaced explicitly.
- [ ] Ensure the seeded board-generation entry point selects the curated path only when a configured seed is used.
- [ ] Keep challenge and custom seeded play APIs compatible with existing seed inputs and leaderboard identities.

# Test Scenarios
- [ ] A configured curated seed always produces the same board and always includes each required hidden word.
- [ ] The hidden words can be traced as legal adjacent paths by the existing submission rules.
- [ ] Two runs of the same curated seed produce identical starting and expanded boards.
- [ ] A non-curated seed still behaves like a normal seeded run.
- [ ] Invalid curated configuration is rejected with a clear error.

# Dependencies
- [ ] Depends on `03-coordinate-seeded-board-generation`.
- [ ] Depends on `08-playable-letter-distribution-for-opening-and-expansion-generation`.
- [ ] Integrates with `07-backend-managed-active-challenge-launch-flow` when curated seeds are used as shared challenges.
