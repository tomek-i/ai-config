---
name: pr-review-fix
description: Address all review comments on a PR
---
1. `gh pr view $ARGUMENTS --comments` and fetch review threads via `gh api`.
2. Validate each comment; fix with tests.
3. Run lint + tests, push.
4. Reply '✅ Done' to each thread and resolve it.
5. Update the PR description if scope changed.
6. Summarize briefly.
