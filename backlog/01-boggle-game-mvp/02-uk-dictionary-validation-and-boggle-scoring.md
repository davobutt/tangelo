# Title
UK Dictionary Validation and Boggle Scoring

# Description
As a player, I receive immediate validity feedback and classic Boggle scoring for submitted words, so I can trust the game results and understand my performance.

# Acceptance Criteria
- [ ] Submitted words are validated against a UK English word list.
- [ ] Invalid words show a clear reason: not in dictionary, duplicate, too short, or invalid path.
- [ ] Valid words are scored with classic Boggle scoring rules.
- [ ] Score updates immediately when a valid word is accepted.
- [ ] Current-round word list displays accepted and rejected submissions.
- [ ] Dictionary lookup is case-insensitive and normalized.

# Technical Tasks
- [ ] Add UK English word list asset and loading strategy.
- [ ] Implement dictionary lookup service optimized for fast per-submit checks.
- [ ] Implement reusable classic Boggle scoring utility.
- [ ] Add validation result model and feedback messaging pipeline.
- [ ] Integrate score and word-history updates into round submission flow.

# Test Scenarios
- [ ] Known UK words are accepted; known invalid strings are rejected.
- [ ] Re-submitting the same word in a round is rejected as duplicate.
- [ ] Score values for 3, 4, 5, 6, 7, and 8+ letter words match classic rules.
- [ ] Word list reflects accepted/rejected status with accurate reasons.
- [ ] Validation remains performant across rapid submissions.

# Dependencies
- [ ] Depends on `01-timed-4x4-boggle-core-loop`.