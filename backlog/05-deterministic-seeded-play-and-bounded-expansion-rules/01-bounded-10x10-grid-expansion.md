# Title
Bounded 10x10 Grid Expansion

# Description
As a player, I want endless-mode growth to stop at a clear 10x10 limit so the board stays readable, fair, and playable even after repeated expansions.

# Acceptance Criteria
- [x] Board growth never exceeds 10 rows by 10 columns.
- [x] Expansion logic respects the cap on every eligible edge.
- [x] If a qualifying word would expand past the cap, only valid in-bounds placements are added.
- [x] If no placements are possible because of the cap, the accepted word still resolves cleanly without corrupting board state.
- [x] Board layout and rendering remain stable and readable when the grid reaches its maximum size.

# Technical Tasks
- [x] Add a max-board-bounds rule to endless expansion planning.
- [x] Update edge-expansion placement logic to reject out-of-bounds cells against the 10x10 cap.
- [x] Ensure board geometry/layout code handles the capped maximum consistently.
- [x] Preserve existing submission and feedback flow when expansion is partially or fully blocked by the cap.
- [x] Surface bounded-expansion outcomes in scene feedback without introducing inconsistent states.

# Test Scenarios
- [x] Expansion can grow normally until the board reaches 10x10.
- [x] A qualifying edge near the cap only places letters that fit within the allowed bounds.
- [x] A qualifying word that cannot expand because all candidate cells are out of bounds leaves the board valid and playable.
- [x] Repeated capped expansions do not break board autoscaling or tile rendering.
- [x] Multi-edge expansion respects the cap independently for each eligible edge.

# Dependencies
- [x] None (foundational story for this epic).

# Review Notes
The endless expansion engine now enforces a hard 10x10 bounding box while still allowing partial in-bounds placements and bounded gap-fills.

Implementation summary:
- Added a max-dimension rule to endless expansion planning using live board bounds.
- Filtered candidate frontier cells so only placements that preserve a 10x10 board are considered.
- Updated expansion application to maintain bounds as edges are processed, preventing later edges in the same submission from exceeding the cap.
- Added regression coverage for fully blocked expansion, partial bounded placement, and multi-edge capped behavior.

Validation summary:
- Frontend tests pass.
- Frontend build passes.
