# Title
Profile Name Edit and Local Reset Controls

# Description
As a player, I want to update my display name and reset local leaderboard/profile state through UI controls, so I can manage my identity and local data intentionally.

# Acceptance Criteria
- [ ] Player can edit display name after onboarding from an accessible profile/settings path.
- [ ] Name edit enforces required input and max length 20.
- [ ] Reset control exists for local profile/leaderboard client state with confirmation.
- [ ] Reset behavior is explicit and does not silently alter unrelated backend data.
- [ ] Post-reset flow returns player to required onboarding state.

# Technical Tasks
- [ ] Add profile/settings access point in existing UI flow.
- [ ] Implement name edit form with shared validation rules.
- [ ] Implement confirmed reset action for local identity and cached leaderboard state.
- [ ] Reinitialize app state correctly after reset.
- [ ] Update client-side docs/help text for reset behavior.

# Test Scenarios
- [ ] Name changes persist and are reflected in subsequent score submissions.
- [ ] Invalid or overlength names are rejected with clear feedback.
- [ ] Reset removes local profile data and requires name entry again.
- [ ] Reset action does not break continued gameplay after re-onboarding.

# Dependencies
- [ ] Depends on 02-first-launch-name-capture-and-local-player-profile.
- [ ] Depends on 03-guid-based-score-submission-and-merge-rules.
