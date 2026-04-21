---
name: backlog-status
description: Review the backlog and produce a succinct summary of overall delivery status, epic progress, and next ready work.
---

# Skill: Backlog Status

## Goal
Review the markdown backlog in `backlog/` and produce a terse status snapshot of current delivery progress.

## Input
- Optional focus such as an epic (`02`, `epic 04`) or story (`05-02`)
- If no focus is given, review the full backlog

## Workflow

### 1. Collect backlog stories
1. Read all story files in `backlog/*/*.md`.
2. For each story, capture:
   - story reference from epic/story numbering
   - title
   - Acceptance Criteria checklist
   - Technical Tasks checklist
   - Test Scenarios checklist
   - Dependencies checklist
   - Review Notes if present

### 2. Determine story status
Classify each story from the checklist state in the file itself:

- **Done**: all checklist items across Acceptance Criteria, Technical Tasks, Test Scenarios, and Dependencies are checked.
- **In progress**: at least one checklist item is checked, but not all checklist items are checked.
- **Not started**: no checklist items are checked.
- **Blocked**: the story is not done and one or more dependency stories are not done.

If a story has all checklist items checked but no `Review Notes` section, still treat it as **Done**.

### 3. Resolve dependencies
1. Use the Dependencies section to identify prerequisite stories or epics.
2. Resolve dependency references when written as:
   - story IDs such as `04-01`
   - story filenames such as `01-bounded-10x10-grid-expansion`
   - explicit references like `Depends on completion of 03-...`
3. If a dependency cannot be resolved confidently, call out the ambiguity instead of guessing.

### 4. Aggregate status
1. Summarize overall counts for done, in-progress, blocked, and not-started stories.
2. Summarize each epic as `completed/total`.
3. Identify up to 3 next ready stories in numeric order:
   - not done
   - not blocked by incomplete dependencies
4. If everything is done, say so directly and do not invent follow-on work.

### 5. Produce the summary
Keep the response succinct and outcome-first. Use this shape when helpful:

```md
**Overall:** 21/21 stories complete. No active backlog work remains.

**By epic**
- 01 Boggle Game MVP: 3/3 complete
- 02 Endless Mode: 4/4 complete
- 03 Visual Retheme and Onboarding Experience: 5/5 complete
- 04 Online Leaderboard and Player Identity: 5/5 complete
- 05 Deterministic Seeded Play and Bounded Expansion Rules: 4/4 complete

**Next up:** None - the tracked backlog currently looks fully delivered.
```

## Rules
- Be concise. Summarize status; do not restate full story contents.
- Prefer direct status language over speculative narrative.
- Surface blockers only when they are evident from incomplete dependency stories.
- When a focus is provided, scope the summary to that epic or story and include only directly relevant dependencies.
