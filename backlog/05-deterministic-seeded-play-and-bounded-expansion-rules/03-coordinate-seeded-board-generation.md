# Title
Coordinate-Seeded Board Generation

# Description
As a player, I want seeded runs to generate the same board state every time, so the same challenge can be repeated and the final revealed grid is identical even if expansions happen in a different gameplay order.

# Acceptance Criteria
- [ ] Board generation can be driven by a deterministic seed.
- [ ] Tile letters are derived deterministically from seed plus board coordinate, not reveal order.
- [ ] Reusing the same seed reproduces the same starting grid.
- [ ] Reusing the same seed produces the same final revealed grid even when valid expansions occur in different gameplay orderings.
- [ ] Existing unseeded play still works without requiring seed input UI.

# Technical Tasks
- [ ] Introduce a seeded randomization strategy for board generation.
- [ ] Define a deterministic mapping from seed and tile coordinate to tile letter.
- [ ] Refactor expansion letter generation to use coordinate-based deterministic output instead of reveal-order randomness.
- [ ] Ensure all gameplay paths that create tiles use the same seeded coordinate generator.
- [ ] Keep non-seeded runs on a stable random path that does not regress current gameplay.

# Test Scenarios
- [ ] The same seed reproduces the same initial 4x4 board.
- [ ] The same seed and same revealed coordinates reproduce the same letters across runs.
- [ ] Different gameplay orders that reveal the same set of coordinates end on the same final grid for the same seed.
- [ ] Different seeds produce different reproducible grids.
- [ ] Unseeded runs continue to generate playable boards without deterministic coupling.

# Dependencies
- [ ] Depends on 01-bounded-10x10-grid-expansion.
