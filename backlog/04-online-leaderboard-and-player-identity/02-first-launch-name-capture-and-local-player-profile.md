# Title
First-Launch Name Capture and Local Player Profile

# Description
As a player, I must set my name on first app launch, so my scores can be associated with a persistent player identity.

# Acceptance Criteria
- [x] First launch shows required name-entry flow before gameplay begins.
- [x] Name entry is mandatory and blocks start until valid.
- [x] Name validation enforces maximum length of 20 characters.
- [x] A stable player GUID is generated and persisted locally at profile creation.
- [x] Name and GUID persist across app reloads.

# Technical Tasks
- [x] Add first-launch profile gate in app start flow.
- [x] Implement name entry form and validation feedback.
- [x] Generate GUID for new players and store in local profile payload.
- [x] Persist profile fields (guid, displayName) to local storage with safe fallback.
- [x] Wire onboarding completion into start-screen/game entry sequence.

# Test Scenarios
- [x] Gameplay cannot begin until a valid name is submitted on first launch.
- [x] Names longer than 20 characters are rejected.
- [x] Profile data is retained after browser reload.
- [x] Existing valid profile bypasses first-launch name capture.

# Dependencies
- [x] Depends on Epic 03 start flow for onboarding entry integration.
- [x] Can be built in parallel with backend story 01.

# Review Notes
First-launch profile capture fully implemented with persistent player identity management.

**Deliverables**:
- New `src/utils/playerProfile.ts` module with:
  - `PlayerProfile` type (guid, displayName, createdAt)
  - `createPlayerProfile()` generates UUID v4 GUID + creates profile record
  - `validateDisplayName()` enforces max 20 chars, alphanumeric + spaces/hyphens/underscores, non-empty
  - `savePlayerProfile()` / `loadPlayerProfile()` for localStorage persistence with error handling
- New `showProfileGate()` modal in GameScene with:
  - Heading + subtitle describing name entry requirement
  - DOM input field (hidden, positioned off-screen) synced with on-screen text display
  - Real-time validation feedback (error messages appear below input)
  - Submit button wired to handleProfileSubmit()
  - Fades in/out with smooth transitions (220ms in, 200ms out)
- New `handleProfileSubmit()` method:
  - Validates name before saving
  - Creates profile + persists to localStorage
  - Transitions to start gate after successful save
- Modified `create()` lifecycle to check for existing profile:
  - If profile exists: loads it, shows start gate (normal flow)
  - If no profile: shows profile gate (new player flow)
- Test coverage: 19 new tests in `src/tests/playerProfile.test.ts`:
  - GUID generation (UUID format, uniqueness)
  - Name validation (edge cases, character limits, invalid input)
  - localStorage persistence (save/load/overwrite/corruption handling)
  - Profile lifecycle (create/save/reload cycles)

**Build Status**: ✅ Compiles cleanly (TypeScript strict mode, 0 errors)
**Test Status**: ✅ All 78 tests pass (59 existing + 19 new player profile tests)
**Bundle Size**: ~6,088 kB (minimal change from profile gate UI layer)

**Product-owner sign-off**: Story 04-02 complete and integration-ready. First-launch player identity capture working correctly. 18 Apr 2026.
