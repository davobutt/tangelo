# Title
Expansion Bonus Per Expanded Edge

# Description
As a player, I want expansion rewards to scale with the actual word that unlocked growth, so scoring feels predictable and properly rewards harder edge plays.

# Acceptance Criteria
- [ ] Expansion bonus for a submitted word is calculated as `2 x accepted word score x number of expanded edges`.
- [ ] Bonus uses the final accepted word score for that submission.
- [ ] Words that do not expand any edges receive no expansion bonus.
- [ ] Score feedback clearly reflects the base word score and the total expansion bonus.
- [ ] Total score updates remain consistent with existing round score, HUD, and history behavior.

# Technical Tasks
- [ ] Update expansion bonus calculation to multiply by accepted word score and expanded-edge count.
- [ ] Ensure score application occurs after accepted word scoring and finalized expansion results are known.
- [ ] Update HUD and feedback text to explain the new bonus structure clearly.
- [ ] Verify no legacy flat expansion bonus logic remains in endless scoring paths.
- [ ] Keep non-expanding submission scoring unchanged.

# Test Scenarios
- [ ] A one-edge expansion awards `2 x word score`.
- [ ] A two-edge expansion awards `4 x word score`.
- [ ] A multi-edge qualifying word only awards bonus for edges that actually expand.
- [ ] A valid non-expanding word awards only its base score.
- [ ] Feedback text matches the score breakdown applied to round totals.

# Dependencies
- [ ] Depends on 01-bounded-10x10-grid-expansion.
