# Review Workflow

## Resolve the Input

Use the first complete input already available:

1. For a GitHub PR or GitLab MR, detect the host from `git remote -v`, then use `gh` or `glab` to read its description and diff.
2. For a commit, branch, tag, or other fixed point, verify it with `git rev-parse`; inspect `git diff <fixed-point>...HEAD` and `git log <fixed-point>..HEAD --oneline`.
3. Review a supplied diff or one already in context directly.
4. Otherwise inspect staged changes, unstaged changes, and the current branch against an identifiable default base, in that order.

Skip host preparation when the complete relevant diff is already available. Ask for a target only when these paths yield no non-empty change.

## Gather Criteria

- Establish intent from the user request, PR/MR description, issue references, and commits.
- Prefer a user-provided spec. Otherwise follow issue references or a clearly matching file under `docs/`, `specs/`, or equivalent project directories. Missing specs do not block an ordinary review.
- Read applicable repository rules such as `AGENTS.md`, `CONTRIBUTING.md`, and language guidance. If none exist, use stable local conventions and bundled references. Never invent a project rule.

## Finding Contract

Use one severity-ranked findings list rather than separate Standards and Spec reports. Tag each finding with its lens:

```text
- [Lens] path/to/file:line — concise problem
  - Impact: observable consequence
  - Evidence: code path, scenario, requirement, or standard that proves it
  - Fix: smallest actionable correction
```

For a Standards finding, cite the repository rule. For a Spec finding, cite the requirement. General smells are suggestions unless they prove a correctness or safety risk.

End with a compact finding count and any material unverified lens or check. When there are no findings, report that directly and list only genuine verification boundaries.
