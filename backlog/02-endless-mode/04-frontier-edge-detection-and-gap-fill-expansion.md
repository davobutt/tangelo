# Title
Frontier Edge Detection and Gap-Fill Expansion

# Description
As a player, I want the board to expand into any unoccupied gap along an edge, so that partial expansions from earlier submissions don't permanently block growth on the other side of the same edge.

Currently the engine uses bounding-box extremes to qualify edge tiles and to compute candidate placements. Once one side of an edge expands, the bounding box advances and tiles on the un-expanded side no longer sit at the extreme — making it impossible to ever fill the resulting gap.

The fix replaces bounding-box checks with per-cell **frontier detection**: a tile qualifies as an edge tile if and only if the cell immediately outward from it in that edge's direction is unoccupied. Candidate placements are computed per-column (top/bottom) or per-row (left/right) by projecting one step outward from each column/row's frontier tile, naturally filling gaps before pushing further out.

# Acceptance Criteria
- [x] A tile qualifies as an edge tile when the cell immediately outward (in that edge's direction) is unoccupied, regardless of where the bounding-box extreme is.
- [x] After a partial one-sided expansion, a word on the un-expanded side can still qualify and trigger gap-fill expansion.
- [x] Expansion candidate cells are computed per-column (top/bottom) or per-row (left/right), each mapping to the cell immediately beyond its column/row's frontier — not a single flat boundary row.
- [x] Partial gaps from earlier expansions can be completed by later submissions.
- [x] Up to 4 tiles are placed per eligible edge, respecting corner-away and center-relative priority.
- [x] Rectangular (non-expanded) boards behave identically to before — no regression.

# Technical Tasks
- [x] Add `isFrontierTile(tile, edge, occupied)` function that returns true when the outward neighbour is unoccupied.
- [x] Replace `touchesEdge` + bounding-box qualification in `getQualifiedEdges` with `isFrontierTile`.
- [x] Add `buildFrontierEdgeCells(edge, allTiles, occupied)` that computes per-column/row outward candidates across the irregular frontier.
- [x] Replace `buildEdgeCells` usage in `planEdgePlacements` with `buildFrontierEdgeCells`.
- [x] Remove unused `getBoardBounds` / `BoardBounds` imports from `endlessExpansion.ts`.
- [x] Update `applyEdgeExpansions` to pass `tiles` (not `bounds`) into the planner and use `isFrontierTile` to filter edge tiles for each expansion.

# Test Scenarios
- [x] On a rectangular 4×4 board, all existing expansion tests pass without change.
- [x] Tiles not at the bounding-box extreme still qualify as frontier tiles after partial expansion.
- [x] Gap-fill expansion places new tiles at the correct irregular depths (row 4 for un-expanded cols, row 5 for already-expanded cols).
- [x] After a gap is filled, another qualifying submission can expand the now-uniform frontier outward.

# Dependencies
- [x] Depends on `01-irregular-board-model-and-edge-expansion-engine`.
