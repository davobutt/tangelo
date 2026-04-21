# Title
Playable Letter Distribution for Opening and Expansion Generation

# Description
As a player, I want both normal and seeded games to generate more consistently playable boards, so runs feel fairer and less prone to dead starts, awkward expansion letters, or punishing rare-letter clusters.

Today the starting 4x4 board, seeded board generation, and endless expansion letters use different generation strategies. That creates inconsistent playability across modes and makes some runs feel arbitrarily harsh rather than skill-testing. This story introduces one playability-focused letter generation policy that can be applied across opening generation and expansion while preserving seeded determinism and replayability.

# Acceptance Criteria
- [x] Opening 4x4 boards are generated with a playability-focused distribution instead of relying solely on the current classic-dice or uniform-random behavior.
- [x] Endless expansion letters use the same fairness goals and do not rely on pure uniform `A-Z` randomness.
- [x] Seeded runs remain deterministic and reproducible while using the improved generation rules.
- [x] Generation reduces dead boards, extreme vowel/consonant imbalance, and punishing rare-letter clustering compared with the current behavior.
- [x] Existing unseeded free play still works without requiring any new player input.
- [x] Existing replay guarantees for seeded boards and seeded expansions remain intact.

# Technical Tasks
- [x] Define a reusable generation policy that expresses playability constraints for opening boards and later expansions.
- [x] Refactor unseeded opening-board generation to use the new policy instead of only the current classic 4x4 dice path.
- [x] Refactor seeded coordinate-based generation so it remains deterministic while producing more playable letter distributions.
- [x] Update endless expansion generation to use the same policy for both seeded and unseeded runs.
- [x] Add guardrails or validation metrics so obviously dead or overly hostile boards are rejected or avoided by the generator.
- [x] Preserve existing board/state contracts so `GameScene` and submission logic do not require unrelated behavioral changes.

# Test Scenarios
- [x] Across a representative sample of generated boards, playable submissions are more consistently available than under the current generator.
- [x] Unseeded starting boards still vary between runs while staying within the new fairness constraints.
- [x] The same seed still reproduces the same initial 4x4 board and the same expanded coordinates.
- [x] Rare-letter clusters such as `Q`, `Z`, and `X` no longer appear together at the same punishing frequency as before unless intentionally allowed by the policy.
- [x] Expansion letters in endless mode follow the same fairness policy and do not regress existing edge-expansion behavior.

# Dependencies
- [x] Depends on `03-coordinate-seeded-board-generation`.
- [x] Depends on epic `02-endless-mode` expansion logic, especially `04-frontier-edge-detection-and-gap-fill-expansion`.

# Review Notes
- Added a shared playability-focused letter generation module that combines weighted letter frequencies, vowel/rare-letter guardrails, and opening-board assessment logic.
- Opening 4x4 generation now retries seeded and unseeded candidates against those guardrails instead of using the old classic-dice or uniform seeded mapping.
- Endless expansion letters now flow through the same policy: unseeded expansions score weighted candidates against current board balance, while seeded expansions keep coordinate-stable weighted letters so replay order still produces the same revealed grid.
- Added prefix-aware dictionary support plus regression tests covering repeated unseeded guardrails, deterministic seeded sample comparisons, reduced rare-letter clustering, and preserved seeded coordinate replay.
- Verified with `npm run build && npm run test` and `cd backend && npm run build && node dist/integration.test.js`.
