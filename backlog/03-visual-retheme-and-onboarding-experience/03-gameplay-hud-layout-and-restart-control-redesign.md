# Title
Gameplay HUD Layout and Restart Control Redesign

# Description
As a player, I want a clearer gameplay HUD with better control placement, so key actions like Restart are easy to find and do not interfere with play.

# Acceptance Criteria
- [x] Restart control is moved to an intentional location with clear prominence and spacing.
- [x] HUD elements (timer, score, current word, actions) are aligned and visually balanced.
- [x] Buttons and interactive controls provide clear default, hover/press, and disabled feedback.
- [x] Label hierarchy and spacing improve readability under time pressure.
- [x] Layout behaves correctly across typical desktop viewport sizes.

# Technical Tasks
- [x] Rework HUD composition with explicit layout zones for status, active word, and actions.
- [x] Reposition and restyle Restart control according to the new interaction hierarchy.
- [x] Standardize button component styling and state transitions.
- [x] Update hit areas and spacing for reliable pointer interaction.
- [x] Add configurable layout constants for quick iteration.

# Test Scenarios
- [x] Restart is easy to locate and does not occlude gameplay-critical elements.
- [x] HUD elements remain readable and non-overlapping across common viewport sizes.
- [x] Button states are visually distinct and respond correctly to user input.
- [x] No regression to core submission, timer, or scoring flows.

# Dependencies
- [x] Depends on 01-visual-theme-foundation-and-crisp-typography.
- [x] Can proceed in parallel with 02-start-screen-and-delayed-round-start after theme foundation is established.
