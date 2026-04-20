# Title
Profile Name Edit and Local Reset Controls

# Description
As a player, I want to update my display name and reset local leaderboard/profile state through UI controls, so I can manage my identity and local data intentionally.

# Acceptance Criteria
- [x] Player can edit display name after onboarding from an accessible profile/settings path.
- [x] Name edit enforces required input and max length 20.
- [x] Reset control exists for local profile/leaderboard client state with confirmation.
- [x] Reset behavior is explicit and does not silently alter unrelated backend data.
- [x] Post-reset flow returns player to required onboarding state.

# Technical Tasks
- [x] Add profile/settings access point in existing UI flow.
- [x] Implement name edit form with shared validation rules.
- [x] Implement confirmed reset action for local identity and cached leaderboard state.
- [x] Reinitialize app state correctly after reset.
- [x] Update client-side docs/help text for reset behavior.

# Test Scenarios
- [x] Name changes persist and are reflected in subsequent score submissions.
- [x] Invalid or overlength names are rejected with clear feedback.
- [x] Reset removes local profile data and requires name entry again.
- [x] Reset action does not break continued gameplay after re-onboarding.

# Dependencies
- [x] Depends on 02-first-launch-name-capture-and-local-player-profile.
- [x] Depends on 03-guid-based-score-submission-and-merge-rules.

# Review Notes
Profile management controls were integrated into the leaderboard settings path.

Implemented:
- Added in-overlay profile/settings controls: `EDIT NAME` and `RESET LOCAL`.
- Name edit uses the same shared `validateDisplayName` rules (required + max 20).
- Name updates preserve GUID identity and persist via local storage helper.
- Reset action requires explicit confirmation and warns that only local profile/local high score are cleared.
- Reset reinitializes app state to onboarding by clearing local profile + local high score and reopening required name-capture gate.

Help text updates:
- Added in-UI reset explanation: local-only reset does not delete backend leaderboard records.

Validation:
- Frontend build passes.
- Frontend tests pass: 81/81.

Sign-off: Story 04-05 complete.
