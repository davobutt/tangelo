# Title
Playable Letter Distribution for Opening and Expansion Generation

# Description
As a player, I want both normal and seeded games to generate more consistently playable boards, so runs feel fairer and less prone to dead starts, awkward expansion letters, or punishing rare-letter clusters.

Today the starting 4x4 board, seeded board generation, and endless expansion letters use different generation strategies. That creates inconsistent playability across modes and makes some runs feel arbitrarily harsh rather than skill-testing. This story introduces one playability-focused letter generation policy that can be applied across opening generation and expansion while preserving seeded determinism and replayability.

# Acceptance Criteria
- [ ] Opening 4x4 boards are generated with a playability-focused distribution instead of relying solely on the current classic-dice or uniform-random behavior.
- [ ] Endless expansion letters use the same fairness goals and do not rely on pure uniform `A-Z` randomness.
- [ ] Seeded runs remain deterministic and reproducible while using the improved generation rules.
- [ ] Generation reduces dead boards, extreme vowel/consonant imbalance, and punishing rare-letter clustering compared with the current behavior.
- [ ] Existing unseeded free play still works without requiring any new player input.
- [ ] Existing replay guarantees for seeded boards and seeded expansions remain intact.

# Technical Tasks
- [ ] Define a reusable generation policy that expresses playability constraints for opening boards and later expansions.
- [ ] Refactor unseeded opening-board generation to use the new policy instead of only the current classic 4x4 dice path.
- [ ] Refactor seeded coordinate-based generation so it remains deterministic while producing more playable letter distributions.
- [ ] Update endless expansion generation to use the same policy for both seeded and unseeded runs.
- [ ] Add guardrails or validation metrics so obviously dead or overly hostile boards are rejected or avoided by the generator.
- [ ] Preserve existing board/state contracts so `GameScene` and submission logic do not require unrelated behavioral changes.

# Test Scenarios
- [ ] Across a representative sample of generated boards, playable submissions are more consistently available than under the current generator.
- [ ] Unseeded starting boards still vary between runs while staying within the new fairness constraints.
- [ ] The same seed still reproduces the same initial 4x4 board and the same expanded coordinates.
- [ ] Rare-letter clusters such as `Q`, `Z`, and `X` no longer appear together at the same punishing frequency as before unless intentionally allowed by the policy.
- [ ] Expansion letters in endless mode follow the same fairness policy and do not regress existing edge-expansion behavior.

# Dependencies
- [ ] Depends on `03-coordinate-seeded-board-generation`.
- [ ] Depends on epic `02-endless-mode` expansion logic, especially `04-frontier-edge-detection-and-gap-fill-expansion`.
