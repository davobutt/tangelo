# Title
Start Screen and Delayed Round Start

# Description
As a player, I want a dedicated start screen on first load with a clear Start Game action, so the round does not begin before I am ready.

# Acceptance Criteria
- [x] First load opens on a splash/start screen instead of immediately starting the round timer.
- [x] Countdown and round lifecycle begin only after pressing Start Game.
- [x] Transition from start screen into gameplay is visually clear and smooth.
- [x] Restart behavior follows the same gated start flow.
- [x] Start screen styling matches the new visual theme.

# Technical Tasks
- [x] Add a start state or scene gate before entering active round state.
- [x] Wire Start Game action to initialize round timer and gameplay input.
- [x] Ensure restart routes back through the intended start flow.
- [x] Add transition animation hooks for start-to-game entry.
- [x] Align start-screen UI components with shared theme tokens.

# Test Scenarios
- [x] Loading the app does not start the timer until Start Game is pressed.
- [x] Pressing Start Game reliably enters active gameplay state.
- [x] Restart from an ended or active round returns to the correct start entry point.
- [x] Input is disabled for gameplay interactions while on the start screen.

# Dependencies
- [x] Depends on 01-visual-theme-foundation-and-crisp-typography for final look-and-feel.
- [x] Depends on existing round lifecycle and timer logic from 01-boggle-game-mvp.
