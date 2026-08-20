# Review Workflow

## Resolve the Target

Use the first complete target already available:

1. A user-named canonical task record.
2. The session's focused or owning canonical task when the host exposes one.
3. A directly supplied artifact, result, or diff.
4. For a GitHub PR or GitLab MR, detect the host from `git remote -v`, then use `gh` or `glab` to read its description and diff.
5. For a commit, branch, tag, or fixed point, verify it with `git rev-parse`; inspect its diff and commits.
6. Otherwise inspect staged changes, unstaged changes, then the current branch against an identifiable default base.

Ask for one target only when these paths yield no reviewable result. A canonical task may be in any state. Treat its explicit unfinished scope as unfinished, not defective.

## Gather Criteria and Evidence

For a canonical task, read its request, Target, Result, Verification, Scope, and actual deliverables. Use the task record and available Git evidence to identify changed artifacts; do not silently attribute unrelated workspace changes to the task. If the exact result cannot be established, report the material gap as an Unverified Risk.

For a direct target, establish intent from the user request, PR/MR description, issue references, commits, and supplied context. Prefer a user-provided spec, then a clearly matching repository spec. A missing spec does not block review; omit that lens and disclose the boundary.

Read applicable repository rules. Local rules override bundled guidance. Never invent a project requirement.

## Build the Review Packet

Include only:

- user request, criteria, and non-goals
- task Target, Result, and Verification when applicable
- current artifact, result, and relevant diff
- applicable rules and spec
- checks already observed and known limitations

Exclude the author's reasoning, defense, desired verdict, and suggested Reviewer response. The Reviewer may inspect additional surrounding evidence and run non-destructive checks, but must not edit or delegate.

## Evidence Boundary

A confirmed finding needs an observable issue and practical impact. Put material uncertainty caused by missing evidence under Unverified Risks instead of presenting it as fact. Omit preference-only feedback and unrelated cleanup.

When a location has no file and line, cite the narrowest available section, Target ID, Result evidence, or result claim. Report only checks actually run and never turn the result into approval or completion authorization.
