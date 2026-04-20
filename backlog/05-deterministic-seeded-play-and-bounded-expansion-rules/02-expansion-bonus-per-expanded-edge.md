# Title
Expansion Bonus Per Expanded Edge

# Description
As a player, I want expansion rewards to scale with the actual word that unlocked growth, so scoring feels predictable and properly rewards harder edge plays.

# Acceptance Criteria
- [x] Expansion bonus for a submitted word is calculated as `2 x accepted word score x number of expanded edges`.
- [x] Bonus uses the final accepted word score for that submission.
- [x] Words that do not expand any edges receive no expansion bonus.
- [x] Score feedback clearly reflects the base word score and the total expansion bonus.
- [x] Total score updates remain consistent with existing round score, HUD, and history behavior.

# Technical Tasks
- [x] Update expansion bonus calculation to multiply by accepted word score and expanded-edge count.
- [x] Ensure score application occurs after accepted word scoring and finalized expansion results are known.
- [x] Update HUD and feedback text to explain the new bonus structure clearly.
- [x] Verify no legacy flat expansion bonus logic remains in endless scoring paths.
- [x] Keep non-expanding submission scoring unchanged.

# Test Scenarios
- [x] A one-edge expansion awards `2 x word score`.
- [x] A two-edge expansion awards `4 x word score`.
- [x] A multi-edge qualifying word only awards bonus for edges that actually expand.
- [x] A valid non-expanding word awards only its base score.
- [x] Feedback text matches the score breakdown applied to round totals.

# Dependencies
- [x] Depends on 01-bounded-10x10-grid-expansion.

# Review Notes
Expansion scoring now scales from the accepted word's base score instead of using the legacy flat bonus-per-edge value.

Implementation summary:
- Replaced the flat expansion edge bonus with a `2x base score per expanded edge` formula in the shared scoring helper.
- Kept non-expanding submissions unchanged by continuing to award zero expansion bonus when no edges expand.
- Preserved the existing gameplay feedback breakdown so accepted words still show `baseScore + expansionBonus` alongside the total awarded score.
- Removed the last remaining flat expansion bonus path from frontend scoring logic.

Validation summary:
- Frontend tests pass.
- Frontend build passes.
