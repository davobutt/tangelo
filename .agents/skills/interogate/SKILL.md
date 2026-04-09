---
name: interogate
description: Ask questions to gather information, clarify requirements, or explore possibilities.
---

# Skill: Interogate

## Goal
Produce a series of user stories that capture the requirements and needs of the user, based on a set of questions.

## Steps

### Phase 1: Discovery
1. Ask open-ended questions to understand the user's goals, challenges, and context.
2. Identify key stakeholders and their needs.
3. Gather information about existing solutions, constraints, and preferences.
4. Keep asking follow-up questions to clarify and deepen understanding.

### Phase 2: Requirements Synthesis
6. Summarize the agreed requirements as a structured list:
   - Feature name
   - User-facing description
   - Acceptance criteria (checkbox format)
   - Technical considerations (affected layers, new entities, migrations)
   - Dependencies on existing stories/epics
7. Present the summary to the user for final confirmation

### Phase 3: Backlog Decision
8. Determine the backlog outcome — one of:
   - **New story in existing epic** — if the feature fits an existing epic's scope
   - **Multiple stories in existing epic** — if the feature is large but within an existing epic
   - **New epic** — if the feature represents a new scope area
9. Present the proposed structure (epic/story IDs, titles, dependency order)
10. On user approval, invoke `/create-story` for each story to be created
