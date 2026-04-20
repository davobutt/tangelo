# Title
Bounded 10x10 Grid Expansion

# Description
As a player, I want endless-mode growth to stop at a clear 10x10 limit so the board stays readable, fair, and playable even after repeated expansions.

# Acceptance Criteria
- [ ] Board growth never exceeds 10 rows by 10 columns.
- [ ] Expansion logic respects the cap on every eligible edge.
- [ ] If a qualifying word would expand past the cap, only valid in-bounds placements are added.
- [ ] If no placements are possible because of the cap, the accepted word still resolves cleanly without corrupting board state.
- [ ] Board layout and rendering remain stable and readable when the grid reaches its maximum size.

# Technical Tasks
- [ ] Add a max-board-bounds rule to endless expansion planning.
- [ ] Update edge-expansion placement logic to reject out-of-bounds cells against the 10x10 cap.
- [ ] Ensure board geometry/layout code handles the capped maximum consistently.
- [ ] Preserve existing submission and feedback flow when expansion is partially or fully blocked by the cap.
- [ ] Surface bounded-expansion outcomes in scene feedback without introducing inconsistent states.

# Test Scenarios
- [ ] Expansion can grow normally until the board reaches 10x10.
- [ ] A qualifying edge near the cap only places letters that fit within the allowed bounds.
- [ ] A qualifying word that cannot expand because all candidate cells are out of bounds leaves the board valid and playable.
- [ ] Repeated capped expansions do not break board autoscaling or tile rendering.
- [ ] Multi-edge expansion respects the cap independently for each eligible edge.

# Dependencies
- [ ] None (foundational story for this epic).
