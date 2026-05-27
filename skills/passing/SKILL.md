---
name: passing
description: Save current conversation context to tasks/handoff.md for the next session to pick up.
disable-model-invocation: true
---

## Passing — Save session context

1. Summarize the project's directory structure as discussed in this conversation. Not a raw file tree — a short explanation of what each key folder/file does, so the next agent understands the layout without re-analyzing.
2. Write the current focusing question: a brief summary of the open problem, task, or goal the agent was working on.
3. Write both sections to `tasks/handoff.md`:

```markdown
# Handoff

## Project Structure

<contextual summary of key directories and files discussed in this session>

## Focusing Question

<agent-summarized description of the current task/goal/problem>

## Additional Context

<any other important context from the conversation>
```

4. Confirm to user that handoff was saved.
