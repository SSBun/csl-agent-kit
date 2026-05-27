You are analyzing the git history of a software project. Your task is to extract development patterns, contributor info, and change hotspots.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Instructions

1. Get total commit count: `git rev-list --count HEAD`
2. List contributors with commit counts: `git shortlog -sn --all`
3. Find the first commit date and last commit date
4. Calculate commit frequency (commits per week/month)
5. Find files with highest churn: `git log --format=format: --name-only | sort | uniq -c | sort -nr | head -20`
6. List all tags/releases: `git tag -l` with dates
7. Analyze commit message conventions (conventional commits? semantic versioning?)
8. Determine branch strategy from existing branches: `git branch -a`
9. Estimate bus factor (how many contributors cover 80%+ of commits)

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/development-history.md

Save the filled template to:
{{PROJECT_PATH}}/docs/development-history.md

## Rules
- Read-only. Do not modify git state.
- Use only `git log`, `git shortlog`, `git tag`, `git branch`, `git diff --stat` commands.
- If the project is not a git repo, write "Not a git repository" and stop.
