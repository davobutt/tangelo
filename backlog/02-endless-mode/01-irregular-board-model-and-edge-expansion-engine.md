# Title
Irregular Board Model and Edge Expansion Engine

# Description
As a player in endless mode, I want the board to grow when I submit edge words, so the game space evolves dynamically and rewards edge-focused play.

# Acceptance Criteria
- [x] Endless mode initializes with a randomized 4x4 board.
- [x] Board representation supports irregular growth (non-rectangular occupied cells).
- [x] A valid submitted word that uses two or more letters on an edge marks that edge as expansion-eligible.
- [x] If one valid word qualifies multiple edges, each qualified edge attempts expansion.
- [x] Each qualified edge attempts to add exactly 4 new letters.
- [x] Expansion never overwrites existing letters.
- [x] Corner-spanning words can trigger expansion on both touched edges.
- [x] Growth placement rules prefer expansion away from corners; on long edges, placement is centered relative to edge-word letters when possible.
- [x] The full occupied grid remains visible on screen after repeated expansions (board auto-scales as needed).

# Technical Tasks
- [x] Add board cell occupancy model to support sparse/irregular geometry.
- [x] Implement edge detection for selected word paths and per-edge qualification rules.
- [x] Implement expansion planner that proposes up to 4 placements per eligible edge without collisions.
- [x] Implement letter generation and placement commit pipeline for accepted expansions.
- [x] Extend board rendering to draw newly occupied cells outside original 4x4 bounds.
- [x] Add expansion result model containing expanded edges and placed cell coordinates.

# Test Scenarios
- [x] Single-edge qualifying word expands exactly one edge by up to 4 non-overlapping letters.
- [x] Corner word with 2+ letters on both connected edges expands both edges.
- [x] A word qualifying 3 or 4 edges applies expansion attempts for each edge.
- [x] Expansion logic never overwrites occupied cells.
- [x] Placement behavior matches corner-away and center-relative rules.
- [x] Board state remains valid and renderable after repeated expansions.
- [x] Expanded boards remain fully visible within the game viewport.

# Dependencies
- [x] None (foundational story for this epic).
