# Global preferences

Apply to every project. A project's own instructions, conventions, or tooling
win where they differ.

## Communication
- Keep explanations short and direct unless I ask for detail. Lead with the answer.
- Answer the question I asked before implementing. If I ask a conceptual question alongside a feature request, address it explicitly.
- Report results honestly, including failures and skipped steps.

## Shell & Editing
- This is a Windows machine with Git Bash and PowerShell. Avoid complex inline scripts with nested quotes in Bash. For multi-line or quote-heavy changes, use file edit tools or write a temporary script file and run it.
- Preserve existing line endings. Watch for CRLF issues when scripting edits.

## Workflow
- Non-trivial work (new features, multi-file changes, unclear approach): write a plan first and wait for my approval. Trivial fixes don't need a plan.
- Ask when requirements are genuinely ambiguous; otherwise pick a sensible default and state it.

## Coding
- Match the existing code: naming, structure, comment density, idioms.
- Keep changes focused on the task. No drive-by refactors; mention them instead.
- Fix the root cause, not the symptom.
- Simple over clever. No abstractions or config that aren't needed yet.
- Comments explain *why*. No commented-out code. Don't swallow errors.
- No hardcoded secrets. No new dependencies without a good reason.
- Update the README / docs when behavior, setup, config, or APIs change.

## Testing
- Always write tests for new code, behavior changes, and bug fixes (failing test first for bugs when practical).
- Run the relevant tests, linter, and type checker before saying it's done; say so if you couldn't.
- Never weaken, skip, or delete tests to make them pass.

## Dev Environment
- Before saying dev services are stopped, check for leftover processes and listening ports: Aspire, the Aspire dashboard, orchestrators, Next/Vite dev servers, Electron and containers.
- Report what was killed and what is still running.

## Risky actions
Confirm with me first before anything destructive or hard to undo: deleting files/branches/data, DB migrations, CI/CD or infra changes, major-version upgrades, force-push, history rewrites, `reset --hard`.

## Git
- Never commit to `main`/`master`; branch first: `type/short-description`.
- On a feature branch, commit often without asking, one logical change per commit. Push and open PRs only when asked.
- Conventional Commits: `type(scope): subject` (feat, fix, docs, style, refactor, perf, test, build, ci, chore; `!` for breaking). Imperative, lowercase, no period, ≤72 chars. Body only when the *why* isn't obvious.
- **No AI attribution anywhere** (commits, PRs, issues, comments): no `Co-Authored-By` lines for AI tools, no "Generated with …" footers, no session trailers or session links.

## Pull Requests
- Screenshots go on GitHub (PR body or comments). Never commit them to the repo.
- Verify UI changes in a browser before opening the PR.
- Wait for the dev server to be ready before running browser checks or e2e tests.
- Before opening a PR, review the diff adversarially (a second agent if the tool supports it): ordering bugs, edge cases (multiple matching rows, timezone/date off-by-one, races with server readiness) and missing tests. Fix anything real first.

## Project Conventions
- Electron (electron-builder): set `extraMetadata.name` (or `productName`) so the installer folder uses the app's real name, not the workspace folder name (e.g. `desktop`).

## Skills
- GitHub issues: `github-issue` skill.
- Pull requests: `pull-request` skill (description, before/after screenshots, feature video).
- UI/UX review of an app: `ux-review` skill.
