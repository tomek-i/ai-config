---
name: pr-screenshots
description: Attach screenshots to a GitHub PR body - uploads local images as GitHub-hosted attachments (never committed) and adds them to the PR description as a before/after table. Use when asked to add, attach or upload screenshots to a PR.
argument-hint: "[PR number] <image paths...>"
---

# PR screenshots

Images go on GitHub, never in the repo.

1. **Images.** Use the paths given. If none were given, use the before/after screenshots captured in this session (see the `pull-request` skill for how to capture and crop them). Pair them as before/after by name (`before-x.png` / `after-x.png`); unpaired images get a row of their own.

2. **Upload.** Run, from inside the repo:
   ```
   node <this skill folder>/scripts/upload-pr-screenshots.js [--pr N] <image>...
   ```
   It opens a visible browser with its own profile. The first time, the user signs in to GitHub there; it stays signed in. Tell the user when it's waiting for sign-in. It prints a JSON map of file path to `https://github.com/user-attachments/assets/...` URL on stdout. It never posts a comment.

3. **Update the body.** Read the current body with `gh pr view N --json body -q .body`, write the new body to a temp file and run `gh pr edit N --body-file <file>`. Replace an existing `## Screenshots` section, or add one before the `Closes #...` line:
   ```markdown
   ## Screenshots

   | Before | After |
   |---|---|
   | ![before](url) | ![after](url) |
   ```

4. **Report** the PR URL and which images were attached. If the upload failed (not signed in, no link came back), say so and keep the local paths so they can be attached by hand.
