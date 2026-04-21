# Title
Reduce Bounded Expansion Limit to 8x8

# Description
As a player, I want endless-mode growth to stop at a clearer 8x8 limit, so the board stays readable, fair, and easier to manage even after repeated expansions.

The current bounded-expansion rules cap growth at 10x10. This follow-up tightens the limit to 8x8 across all expanding modes while preserving the existing behavior that accepted words still resolve and score normally even when no further growth is possible.

# Acceptance Criteria
- [x] Board growth never exceeds 8 rows by 8 columns.
- [x] The 8x8 cap applies in free play, challenge mode, and enter-code seeded runs.
- [x] Expansion logic respects the 8x8 cap independently for every eligible edge.
- [x] If a valid submission would expand beyond the cap, the word is still accepted and scored even when no new tiles are added.
- [x] Board layout and rendering remain stable and readable when the grid reaches the 8x8 maximum.

# Technical Tasks
- [x] Update the bounded-expansion rule from 10x10 to 8x8 in the endless expansion planner.
- [x] Ensure every edge-expansion path uses the new cap consistently for normal, challenge, and seeded runs.
- [x] Preserve partial-placement and no-placement behavior so accepted submissions still resolve cleanly at the cap.
- [x] Confirm board geometry and autoscaling logic remain correct at the smaller maximum size.
- [x] Update or extend regression tests that currently assert the 10x10 limit.

# Test Scenarios
- [x] Expansion can grow normally until the board reaches 8x8.
- [x] A qualifying edge near the cap only places letters that fit within the 8x8 limit.
- [x] A qualifying word that cannot expand because the board is already at the cap still scores and leaves the board valid.
- [x] Multi-edge expansion respects the 8x8 cap independently per eligible edge.
- [x] Free play, challenge, and enter-code seeded runs all share the same 8x8 cap behavior.

# Dependencies
- [x] Depends on `01-bounded-10x10-grid-expansion`.
- [x] Depends on epic `02-endless-mode` expansion logic, especially `01-irregular-board-model-and-edge-expansion-engine`.

# Review Notes
- Reduced the bounded endless-expansion cap from 10x10 to 8x8 in the shared planner so the same limit now applies everywhere expansion logic is reused.
- Kept partial-placement and no-placement behavior intact, so valid submissions still resolve and score even when a capped edge cannot add new tiles.
- Updated expansion regressions to cover the new 8x8 maximum, including fully capped boards, partially in-bounds frontier placement, and capped multi-edge expansion.
- Added explicit board-layout coverage to confirm a full 8x8 grid still scales and fits cleanly inside the gameplay viewport.
- Verified with `npm run build && npm run test` and `cd backend && npm run build && node dist/integration.test.js`.
