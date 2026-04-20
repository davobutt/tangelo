# Title
Functional Leaderboard UI Aligned to Epic 03 Style

# Description
As a player, I want a clear, functional leaderboard view that matches the visual style established in Epic 03, so I can quickly understand global ranking status.

# Acceptance Criteria
- [x] Leaderboard UI displays ranked entries and scores from backend data.
- [x] Loading, empty, and error states are clearly represented.
- [x] Player identity context is clear (for example highlighting own entry where available).
- [x] UI is functional-first and consistent with Epic 03 visual language.
- [x] Refresh behavior is predictable and does not interrupt core gameplay.

# Technical Tasks
- [x] Build leaderboard view/container in the existing scene flow.
- [x] Implement client data-fetch path for leaderboard endpoint.
- [x] Add view-state handling for loading, error, and no-data conditions.
- [x] Apply Epic 03 theme tokens to leaderboard typography and layout.
- [x] Add manual and/or lifecycle-driven refresh strategy.

# Test Scenarios
- [x] Leaderboard renders sorted scores from backend responses.
- [x] Error and empty states are readable and actionable.
- [x] UI remains usable across common desktop viewport sizes.
- [x] Leaderboard integration does not regress game start or scoring flows.

# Dependencies
- [x] Depends on 01-backend-leaderboard-service-and-datastore-foundation.
- [x] Depends on 03-guid-based-score-submission-and-merge-rules.
- [x] Depends on Epic 03 styling foundation.

# Review Notes
Implemented leaderboard UI as a modal overlay in the game scene, launched from a dedicated HUD button.

Implemented behavior:
- Backend leaderboard fetch path added to client utility with typed success/error response handling.
- Leaderboard modal states include explicit loading, empty, success, and error rendering.
- Entries are displayed with rank, score, and display name; local player entry is highlighted with a YOU marker.
- Manual refresh action is included in the modal and can be used repeatedly.
- Refresh and modal interactions are intentionally disabled during active rounds to avoid gameplay interruption.
- Visual styling uses existing Epic 03 tokens and text styles for consistency.

Validation:
- Frontend build passes.
- Frontend test suite passes (78/78).

Sign-off: Story 04-04 complete and ready for follow-on profile controls in 04-05.
