---
name: brainstorming
description: Explores user intent and design options before implementing a new feature, component, or behavioral change. Use when the user wants to design before coding, requirements are unclear, or mentions brainstorming, ideation, or exploring approaches.
---

# Brainstorming Ideas Into Designs

Turn ideas into validated designs through dialogue — before writing implementation code.

## When to Use

- New feature or component with open design questions
- User asks to explore options, trade-offs, or requirements
- Scope or success criteria are not yet defined

Do **not** use for bug fixes, typo edits, or changes with an already-approved spec.

## The Process

**Understanding the idea:**
- Check current project state (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice when possible; open-ended is fine
- Focus on purpose, constraints, and success criteria

**Exploring approaches:**
- Propose 2–3 approaches with trade-offs
- Lead with a recommendation and reasoning

**Presenting the design:**
- Break into sections of ~200–300 words
- Confirm after each section before continuing
- Cover architecture, components, data flow, error handling, testing
- Go back and clarify when something does not land

## After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Use clear, concise prose (no dependency on external writing skills)

**Implementation (only if user asks to continue):**
- Ask: "Ready to set up for implementation?"
- Create a detailed implementation plan or issues from the design
- Use git worktrees or a feature branch if the project supports it

## Key Principles

- One question at a time
- YAGNI — cut unnecessary features early
- Explore alternatives before committing
- Incremental validation — section by section
- Stay flexible — revisit earlier decisions when new info appears
