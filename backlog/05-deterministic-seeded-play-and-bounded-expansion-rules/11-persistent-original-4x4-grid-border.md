# Title
Persistent Original 4x4 Grid Border

# Description
As a player, I want the game to keep outlining the original 4x4 starting footprint, so I can stay oriented after the board expands and still recognize the original play area.

Today the board grows outward without a persistent visual cue showing where the run began. This story adds a subtle border around the initial 4x4 footprint and keeps it visible through later expansions, scaling, and seeded/challenge play without interfering with existing hover, selection, or special-word highlighting.

# Acceptance Criteria
- [x] The initial 4x4 starting footprint is outlined on the board with a subtle visual border.
- [x] The original 4x4 border remains visible after expansions begin.
- [x] The border tracks correctly as the board scales, re-renders, and shifts within the viewport.
- [x] The border appears in free play, challenge mode, and enter-code seeded runs.
- [x] The border does not reduce tile readability or conflict with selection, hover, or special-word highlight states.

# Technical Tasks
- [x] Add a rendering treatment for the original 4x4 footprint that can persist independently of later tile placement.
- [x] Keep the border aligned with the original starting coordinates as board bounds change and the layout rescales.
- [x] Ensure board rebuilds and expansion animations preserve the border consistently.
- [x] Tune theme values so the border is visible but remains secondary to tile states and path highlights.
- [x] Add or update regression coverage for persistent rendering of the original footprint.

# Test Scenarios
- [x] The original 4x4 border is visible before any expansions occur.
- [x] The border remains visible and aligned after one or more expansions.
- [x] The border still frames the correct footprint when the board autoscale changes.
- [x] Hover, selection, and special-word highlighting still render correctly alongside the border.
- [x] Free play, challenge, and enter-code seeded runs all show the same persistent original-grid border.

# Dependencies
- [x] Depends on `10-reduce-bounded-expansion-limit-to-8x8`.
- [x] Depends on epic `02-endless-mode` board rendering and expansion behavior.
- [x] Depends on epic `03-visual-retheme-and-onboarding-experience` board styling conventions.

# Review Notes
- Added a dedicated original-footprint outline graphic in `GameScene` that redraws with each board rebuild, so the starting 4x4 area stays framed before and after expansion without interfering with tile fill states or selection-path rendering.
- Moved footprint-rectangle geometry into the shared board-layout utility so the outline stays aligned when the board shifts up or left and when autoscaling changes tile size and gap values.
- Added a dedicated theme color for the footprint border to keep the effect visible but secondary to hover, selection, curated-word tinting, and the active path overlay.
- Extended `boardLayout` regression coverage to verify the original 4x4 outline stays aligned both on the opening board and after expanded 8x8 layouts shift the board origin.
- Verified with `npm run build && npm run test` and `cd backend && npm run build && node dist/integration.test.js`.
