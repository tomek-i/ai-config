---
name: pull-request
description: Create or update a GitHub pull request the way the user wants it - a plain-language description of what changed and why, before/after screenshots for user-facing changes (cropped and annotated, uploaded through the browser, never committed), and a narrated walkthrough video for new user-facing features. Use whenever opening, drafting, or filling in a PR, or when the user says "create a PR", "open a PR", "raise a PR", or "PR description".
---

# Pull request

## 1. Description
Short title in Conventional Commit style (`feat(auth): add password reset`).

Body, in simple words, short sections:

```markdown
## What
What the PR adds or changes - the feature it adds or the problem it solves.

## Why
The motivation / problem.

## How it was tested
Tests added, commands run, manual checks.

## Screenshots
(before / after, only for user-facing changes)

Closes #123
```

Keep it brief. No filler sections. Use the repo's PR template if it has one.

## 2. Before / after screenshots
**Only for user-facing (visual) changes.** Skip for backend, API, refactors, or anything the user can't see.

**Never commit screenshots to the repo or the branch.**

### Capture
- **Before:** capture from `main` (the base branch). Do this before starting the change, or later by checking out the base branch / using a worktree and running the app.
- **After:** capture from the feature branch, same page, same viewport, same state.
- Use the Playwright MCP (headless preferred).
- **Focus on the change.** Crop to the relevant area (screenshot the element, or a clipped region), not the whole page.
- **Subtle changes:** before screenshotting, inject a temporary overlay with `browser_evaluate` to frame the change, e.g. a red outline around the element (`outline: 3px solid #ef4444; outline-offset: 4px`) or an absolutely-positioned arrow/label. Apply the same framing to before and after.
- **Fallback** when real screenshots aren't practical (app can't run, needs data you don't have): draw before vs after wireframes with the Excalidraw MCP (`create_view`), highlighting what changed, and describe them in the PR.

### Upload
Once the PR exists, use the `pr-screenshots` skill. It uploads the images through a signed-in browser (GitHub has no API for attachments) and adds them to the description under **Screenshots** as a before/after table.

If the upload can't be done, save the screenshots locally under `./docs/screenshots/` (gitignored) and tell the user so they can attach them manually.

## 3. Narrated walkthrough video
**Only for new user-facing features.** Skip for bug fixes, refactors, and backend/API changes.

- Record it with the `/narrate` plugin (`narrate:narrate-video`), which drives the Playwright MCP.
- The video is for the user to watch the shipped feature. It's saved under `./docs/`. **Don't attach it to the PR and don't commit it.**
- Tell the user the path to the video when done.

## 4. Keep local media out of git
Before committing, make sure the project `.gitignore` has these lines (add any that are missing, in their own commit: `chore: ignore local media`):

```
.narrate/
docs/*.mp4
docs/*.vtt
docs/*.scene.json
docs/*.tasks.md
docs/screenshots/
docs/ux-review/
```

Check `git status` before each commit so no media files slip in.
