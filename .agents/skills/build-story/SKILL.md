---
name: build-story
description: Implement a backlog story end-to-end from a story reference, including branch setup, verification, story checkoff, and commit.
---

# Skill: Build Story

## Goal
Given a story reference such as `05-01`, implement that story completely and leave the repository in a verified, committed state.

## Required Input
- A story reference, for example `05-01`

If the user does not provide a story reference, ask for one before proceeding.

## Workflow

### 1. Resolve the story
1. Locate the matching story file in `backlog/`.
2. Read the full story, including acceptance criteria, technical tasks, dependencies, and any review notes.
3. If the reference is ambiguous or the story cannot be found, stop and ask the user to clarify.

### 2. Guardrails before implementation
1. Check that the git worktree is clean.
2. If the worktree is not clean, stop and tell the user what must be resolved before continuing.
3. Determine the branch name from the story reference and title if not already on the correct branch.
4. Create and switch to a new branch for the story from the current integration branch, unless the correct story branch already exists and is checked out.

### 3. Implement the story
1. Investigate the relevant code paths before editing.
2. Implement the story completely, not partially.
3. Keep changes scoped to the story, but fix tightly coupled issues discovered during implementation.
4. Follow existing project conventions, reuse helpers where possible, and avoid speculative refactors.

### 4. Verify the implementation
1. Run the relevant existing tests, builds, and checks needed to validate the story.
2. If validation fails, fix the implementation and re-run the relevant checks.
3. Do not mark the story complete unless the implementation is verified.
4. If there are unrelated pre-existing failures, call them out clearly and avoid claiming those were fixed.

### 5. Update the story file
1. Check off completed acceptance criteria.
2. Check off completed technical tasks.
3. Check off completed test scenarios.
4. Add concise review notes summarizing what was implemented and how it was verified.
5. Only check items that are actually complete.

### 6. Commit the work
1. Stage only the files relevant to the story.
2. Create a git commit with a message aligned to the story outcome.
3. Include the required co-author trailer:

```text
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

## Output Expectations
- Story implemented in code
- Story file updated to reflect completion
- Changes verified with existing project commands
- Changes committed on the story branch

## Stop Conditions
- Missing or ambiguous story reference
- Dirty git worktree before starting
- Story file not found
- Blocked by missing requirements or unresolved dependency
