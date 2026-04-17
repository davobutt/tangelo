# Title
Gameplay HUD Layout and Restart Control Redesign

# Description
As a player, I want a clearer gameplay HUD with better control placement, so key actions like Restart are easy to find and do not interfere with play.

# Acceptance Criteria
- [ ] Restart control is moved to an intentional location with clear prominence and spacing.
- [ ] HUD elements (timer, score, current word, actions) are aligned and visually balanced.
- [ ] Buttons and interactive controls provide clear default, hover/press, and disabled feedback.
- [ ] Label hierarchy and spacing improve readability under time pressure.
- [ ] Layout behaves correctly across typical desktop viewport sizes.

# Technical Tasks
- [ ] Rework HUD composition with explicit layout zones for status, active word, and actions.
- [ ] Reposition and restyle Restart control according to the new interaction hierarchy.
- [ ] Standardize button component styling and state transitions.
- [ ] Update hit areas and spacing for reliable pointer interaction.
- [ ] Add configurable layout constants for quick iteration.

# Test Scenarios
- [ ] Restart is easy to locate and does not occlude gameplay-critical elements.
- [ ] HUD elements remain readable and non-overlapping across common viewport sizes.
- [ ] Button states are visually distinct and respond correctly to user input.
- [ ] No regression to core submission, timer, or scoring flows.

# Dependencies
- [ ] Depends on 01-visual-theme-foundation-and-crisp-typography.
- [ ] Can proceed in parallel with 02-start-screen-and-delayed-round-start after theme foundation is established.
