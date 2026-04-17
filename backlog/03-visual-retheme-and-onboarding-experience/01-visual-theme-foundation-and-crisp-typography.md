# Title
Visual Theme Foundation and Crisp Typography

# Description
As a player, I want a sharper visual identity with crisp lettering and cohesive styling, so the game feels clean, fun, and modern without feeling childish.

# Acceptance Criteria
- [ ] A clear visual direction is applied across gameplay UI (color, typography, spacing, surfaces).
- [ ] Text rendering appears crisp and legible at common game resolutions.
- [ ] The visual style feels playful but not childish.
- [ ] Core UI hierarchy is easier to scan during active play.
- [ ] Theme values are centralized for reuse and tuning.

# Technical Tasks
- [ ] Define a theme token set for palette, type scale, spacing, radii, and emphasis states.
- [ ] Update Phaser text style configuration to improve sharpness and contrast.
- [ ] Refactor scene UI styling to consume shared theme tokens instead of ad hoc values.
- [ ] Normalize visual treatment of panels, buttons, and labels for consistency.
- [ ] Add tuning constants for future iteration without large refactors.

# Test Scenarios
- [ ] UI text remains crisp and readable on desktop browser targets.
- [ ] Theme tokens are consistently used by primary gameplay UI elements.
- [ ] No major regressions in layout or readability after style migration.
- [ ] Visual tone review confirms clean and fun direction.

# Dependencies
- [ ] Depends on existing timed-mode gameplay UI shell from 01-boggle-game-mvp.
- [ ] Blocks 02-start-screen-and-delayed-round-start and 03-gameplay-hud-layout-and-restart-control-redesign as the style baseline.
