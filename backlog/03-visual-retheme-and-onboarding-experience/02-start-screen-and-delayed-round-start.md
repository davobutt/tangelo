# Title
Start Screen and Delayed Round Start

# Description
As a player, I want a dedicated start screen on first load with a clear Start Game action, so the round does not begin before I am ready.

# Acceptance Criteria
- [ ] First load opens on a splash/start screen instead of immediately starting the round timer.
- [ ] Countdown and round lifecycle begin only after pressing Start Game.
- [ ] Transition from start screen into gameplay is visually clear and smooth.
- [ ] Restart behavior follows the same gated start flow.
- [ ] Start screen styling matches the new visual theme.

# Technical Tasks
- [ ] Add a start state or scene gate before entering active round state.
- [ ] Wire Start Game action to initialize round timer and gameplay input.
- [ ] Ensure restart routes back through the intended start flow.
- [ ] Add transition animation hooks for start-to-game entry.
- [ ] Align start-screen UI components with shared theme tokens.

# Test Scenarios
- [ ] Loading the app does not start the timer until Start Game is pressed.
- [ ] Pressing Start Game reliably enters active gameplay state.
- [ ] Restart from an ended or active round returns to the correct start entry point.
- [ ] Input is disabled for gameplay interactions while on the start screen.

# Dependencies
- [ ] Depends on 01-visual-theme-foundation-and-crisp-typography for final look-and-feel.
- [ ] Depends on existing round lifecycle and timer logic from 01-boggle-game-mvp.
