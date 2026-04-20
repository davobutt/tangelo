# Title
Coordinate-Seeded Board Generation

# Description
As a player, I want seeded runs to generate the same board state every time, so the same challenge can be repeated and the final revealed grid is identical even if expansions happen in a different gameplay order.

# Acceptance Criteria
- [x] Board generation can be driven by a deterministic seed.
- [x] Tile letters are derived deterministically from seed plus board coordinate, not reveal order.
- [x] Reusing the same seed reproduces the same starting grid.
- [x] Reusing the same seed produces the same final revealed grid even when valid expansions occur in different gameplay orderings.
- [x] Existing unseeded play still works without requiring seed input UI.

# Technical Tasks
- [x] Introduce a seeded randomization strategy for board generation.
- [x] Define a deterministic mapping from seed and tile coordinate to tile letter.
- [x] Refactor expansion letter generation to use coordinate-based deterministic output instead of reveal-order randomness.
- [x] Ensure all gameplay paths that create tiles use the same seeded coordinate generator.
- [x] Keep non-seeded runs on a stable random path that does not regress current gameplay.

# Test Scenarios
- [x] The same seed reproduces the same initial 4x4 board.
- [x] The same seed and same revealed coordinates reproduce the same letters across runs.
- [x] Different gameplay orders that reveal the same set of coordinates end on the same final grid for the same seed.
- [x] Different seeds produce different reproducible grids.
- [x] Unseeded runs continue to generate playable boards without deterministic coupling.

# Dependencies
- [x] Depends on 01-bounded-10x10-grid-expansion.

# Review Notes
Seeded runs now use one shared coordinate-based letter resolver for both the initial 4x4 board and later endless expansions.

Implementation summary:
- Added a deterministic seed-to-coordinate letter mapping helper.
- Updated board generation to support optional seeded runs while preserving the existing unseeded Boggle-dice path.
- Updated endless expansion placement to derive seeded letters from seed plus coordinate rather than reveal order.
- Wired `GameScene` to pass an optional under-the-hood `runSeed` through both initial board creation and expansion generation.
- Added regression coverage for same-seed board replay, different-seed variation, same-coordinate letter replay, and identical final grids across different valid expansion orders.

Validation summary:
- Frontend seeded tests pass.
- Frontend tests pass.
- Frontend build passes.
