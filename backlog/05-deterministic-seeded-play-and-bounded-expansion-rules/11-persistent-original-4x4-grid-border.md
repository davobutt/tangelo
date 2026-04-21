# Title
Persistent Original 4x4 Grid Border

# Description
As a player, I want the game to keep outlining the original 4x4 starting footprint, so I can stay oriented after the board expands and still recognize the original play area.

Today the board grows outward without a persistent visual cue showing where the run began. This story adds a subtle border around the initial 4x4 footprint and keeps it visible through later expansions, scaling, and seeded/challenge play without interfering with existing hover, selection, or special-word highlighting.

# Acceptance Criteria
- [ ] The initial 4x4 starting footprint is outlined on the board with a subtle visual border.
- [ ] The original 4x4 border remains visible after expansions begin.
- [ ] The border tracks correctly as the board scales, re-renders, and shifts within the viewport.
- [ ] The border appears in free play, challenge mode, and enter-code seeded runs.
- [ ] The border does not reduce tile readability or conflict with selection, hover, or special-word highlight states.

# Technical Tasks
- [ ] Add a rendering treatment for the original 4x4 footprint that can persist independently of later tile placement.
- [ ] Keep the border aligned with the original starting coordinates as board bounds change and the layout rescales.
- [ ] Ensure board rebuilds and expansion animations preserve the border consistently.
- [ ] Tune theme values so the border is visible but remains secondary to tile states and path highlights.
- [ ] Add or update regression coverage for persistent rendering of the original footprint.

# Test Scenarios
- [ ] The original 4x4 border is visible before any expansions occur.
- [ ] The border remains visible and aligned after one or more expansions.
- [ ] The border still frames the correct footprint when the board autoscale changes.
- [ ] Hover, selection, and special-word highlighting still render correctly alongside the border.
- [ ] Free play, challenge, and enter-code seeded runs all show the same persistent original-grid border.

# Dependencies
- [ ] Depends on `10-reduce-bounded-expansion-limit-to-8x8`.
- [ ] Depends on epic `02-endless-mode` board rendering and expansion behavior.
- [ ] Depends on epic `03-visual-retheme-and-onboarding-experience` board styling conventions.
