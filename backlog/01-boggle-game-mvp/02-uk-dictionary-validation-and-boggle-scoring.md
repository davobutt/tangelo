# Title
UK Dictionary Validation and Boggle Scoring

# Description
As a player, I receive immediate validity feedback and classic Boggle scoring for submitted words, so I can trust the game results and understand my performance.

# Acceptance Criteria
- [x] Submitted words are validated against a UK English word list.
- [x] Invalid words show a clear reason: not in dictionary, duplicate, too short, or invalid path.
- [x] Valid words are scored with classic Boggle scoring rules.
- [x] Score updates immediately when a valid word is accepted.
- [x] Current-round word list displays accepted and rejected submissions.
- [x] Dictionary lookup is case-insensitive and normalized.

# Technical Tasks
- [x] Add UK English word list asset and loading strategy.
- [x] Implement dictionary lookup service optimized for fast per-submit checks.
- [x] Implement reusable classic Boggle scoring utility.
- [x] Add validation result model and feedback messaging pipeline.
- [x] Integrate score and word-history updates into round submission flow.

# Test Scenarios
- [x] Known UK words are accepted; known invalid strings are rejected.
- [x] Re-submitting the same word in a round is rejected as duplicate.
- [x] Score values for 3, 4, 5, 6, 7, and 8+ letter words match classic rules.
- [x] Word list reflects accepted/rejected status with accurate reasons.
- [x] Validation remains performant across rapid submissions.

# Dependencies
- [x] Depends on `01-timed-4x4-boggle-core-loop`.