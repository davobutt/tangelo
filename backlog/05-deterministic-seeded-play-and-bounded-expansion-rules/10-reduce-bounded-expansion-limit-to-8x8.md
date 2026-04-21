# Title
Reduce Bounded Expansion Limit to 8x8

# Description
As a player, I want endless-mode growth to stop at a clearer 8x8 limit, so the board stays readable, fair, and easier to manage even after repeated expansions.

The current bounded-expansion rules cap growth at 10x10. This follow-up tightens the limit to 8x8 across all expanding modes while preserving the existing behavior that accepted words still resolve and score normally even when no further growth is possible.

# Acceptance Criteria
- [ ] Board growth never exceeds 8 rows by 8 columns.
- [ ] The 8x8 cap applies in free play, challenge mode, and enter-code seeded runs.
- [ ] Expansion logic respects the 8x8 cap independently for every eligible edge.
- [ ] If a valid submission would expand beyond the cap, the word is still accepted and scored even when no new tiles are added.
- [ ] Board layout and rendering remain stable and readable when the grid reaches the 8x8 maximum.

# Technical Tasks
- [ ] Update the bounded-expansion rule from 10x10 to 8x8 in the endless expansion planner.
- [ ] Ensure every edge-expansion path uses the new cap consistently for normal, challenge, and seeded runs.
- [ ] Preserve partial-placement and no-placement behavior so accepted submissions still resolve cleanly at the cap.
- [ ] Confirm board geometry and autoscaling logic remain correct at the smaller maximum size.
- [ ] Update or extend regression tests that currently assert the 10x10 limit.

# Test Scenarios
- [ ] Expansion can grow normally until the board reaches 8x8.
- [ ] A qualifying edge near the cap only places letters that fit within the 8x8 limit.
- [ ] A qualifying word that cannot expand because the board is already at the cap still scores and leaves the board valid.
- [ ] Multi-edge expansion respects the 8x8 cap independently per eligible edge.
- [ ] Free play, challenge, and enter-code seeded runs all share the same 8x8 cap behavior.

# Dependencies
- [ ] Depends on `01-bounded-10x10-grid-expansion`.
- [ ] Depends on epic `02-endless-mode` expansion logic, especially `01-irregular-board-model-and-edge-expansion-engine`.
