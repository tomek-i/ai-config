---
name: github-issue
description: Write or create GitHub issues the way the user wants them - descriptive enough for another developer or agent to implement without extra context, with a short Why / What / Acceptance criteria structure, and big work split into parallelizable sub-issues under a parent. Use whenever creating, drafting, or rewriting a GitHub issue, bug report, feature request, or backlog item, or breaking a feature down into issues.
---

# GitHub issue

## Content
- Descriptive enough that another developer or agent can pick it up and implement it **without extra context**.
- Make the **what** and the **why** clear. Plain words, no filler sections.
- Use the repo's own issue template if it has one.

## Structure
```markdown
## Why
The problem or motivation.

## What
What needs to be done, with the relevant details: files, components, endpoints, constraints, links.

## Acceptance criteria
- [ ] ...
- [ ] ...
```
- **Title:** clear, one line (no Conventional Commit prefix unless the repo uses one).
- **Bugs:** add *Steps to reproduce* and *Expected vs actual*.

## Big features: split into sub-issues
If the work is too big for one PR, break it into smaller issues, **ideally independent so they can be worked on in parallel**. Note any real ordering dependencies in the issue body.

1. Create the parent issue (overall why + list of the parts).
2. Create each child issue (same structure, scoped to its part).
3. Link each child as a GitHub **sub-issue** of the parent:
   ```bash
   P=$(gh issue view <parent#> --json id -q .id)
   C=$(gh issue view <child#> --json id -q .id)
   gh api graphql -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){issue{number}}}' -f p="$P" -f c="$C"
   ```

No AI attribution or Claude session links in issues or comments.
