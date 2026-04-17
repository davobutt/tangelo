# Title
First-Launch Name Capture and Local Player Profile

# Description
As a player, I must set my name on first app launch, so my scores can be associated with a persistent player identity.

# Acceptance Criteria
- [ ] First launch shows required name-entry flow before gameplay begins.
- [ ] Name entry is mandatory and blocks start until valid.
- [ ] Name validation enforces maximum length of 20 characters.
- [ ] A stable player GUID is generated and persisted locally at profile creation.
- [ ] Name and GUID persist across app reloads.

# Technical Tasks
- [ ] Add first-launch profile gate in app start flow.
- [ ] Implement name entry form and validation feedback.
- [ ] Generate GUID for new players and store in local profile payload.
- [ ] Persist profile fields (guid, displayName) to local storage with safe fallback.
- [ ] Wire onboarding completion into start-screen/game entry sequence.

# Test Scenarios
- [ ] Gameplay cannot begin until a valid name is submitted on first launch.
- [ ] Names longer than 20 characters are rejected.
- [ ] Profile data is retained after browser reload.
- [ ] Existing valid profile bypasses first-launch name capture.

# Dependencies
- [ ] Depends on Epic 03 start flow for onboarding entry integration.
- [ ] Can be built in parallel with backend story 01.
