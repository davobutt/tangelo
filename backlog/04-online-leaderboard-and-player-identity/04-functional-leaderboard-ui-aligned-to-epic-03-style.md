# Title
Functional Leaderboard UI Aligned to Epic 03 Style

# Description
As a player, I want a clear, functional leaderboard view that matches the visual style established in Epic 03, so I can quickly understand global ranking status.

# Acceptance Criteria
- [ ] Leaderboard UI displays ranked entries and scores from backend data.
- [ ] Loading, empty, and error states are clearly represented.
- [ ] Player identity context is clear (for example highlighting own entry where available).
- [ ] UI is functional-first and consistent with Epic 03 visual language.
- [ ] Refresh behavior is predictable and does not interrupt core gameplay.

# Technical Tasks
- [ ] Build leaderboard view/container in the existing scene flow.
- [ ] Implement client data-fetch path for leaderboard endpoint.
- [ ] Add view-state handling for loading, error, and no-data conditions.
- [ ] Apply Epic 03 theme tokens to leaderboard typography and layout.
- [ ] Add manual and/or lifecycle-driven refresh strategy.

# Test Scenarios
- [ ] Leaderboard renders sorted scores from backend responses.
- [ ] Error and empty states are readable and actionable.
- [ ] UI remains usable across common desktop viewport sizes.
- [ ] Leaderboard integration does not regress game start or scoring flows.

# Dependencies
- [ ] Depends on 01-backend-leaderboard-service-and-datastore-foundation.
- [ ] Depends on 03-guid-based-score-submission-and-merge-rules.
- [ ] Depends on Epic 03 styling foundation.
