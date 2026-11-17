# Publish a review as GitHub issues

Used with `--issues`. The calling skill gives the **kind** (`UX review` or
`UI review`) and the **label** (`ux-review` or `ui-review`). The work folder
in the OS temp folder already holds `index.html`, `data.js` and
`screenshots/`. Nothing is written to the project.

Write issue bodies to files in the work folder and pass them with
`--body-file`; quoting markdown inline breaks easily. No AI attribution or
session links anywhere.

## 1. Render the images

Open `<work folder>/index.html` in the Playwright MCP (a `file://` URL; if it
refuses file URLs, serve the folder with a static server that is already
available and stop it afterwards). Viewport 1440×900. For each suggestion
`<id>`, save element screenshots to `<work folder>/issue-images/`:

- `#s-<id> .shot` for each screenshot (`<id>-shot-<n>.png`), so the red
  highlight frames are included
- `#s-<id> .wf[data-wf="before"]` and `#s-<id> .wf[data-wf="after"]`
  (`<id>-before.png`, `<id>-after.png`), for each side that has elements

Take them with element refs from a snapshot, or with `browser_run_code`
calling `page.locator(selector).screenshot({ path })`. Check that each file
exists and isn't blank.

## 2. Create the epic

1. Make sure the labels `epic` and `<label>` exist (`gh label list`); create
   the missing ones with `gh label create`.
2. Create the epic: title `<kind> <date>: <app>`, labels `epic` and `<label>`.
   Body:

   ```markdown
   ## Summary
   <the review summary>

   App: <url>, reviewed <date>.

   ## How to decide
   Each suggestion is a sub-issue.
   - Approve: leave it open.
   - Approve with changes: leave it open and comment what to change.
   - Decline: close it as "not planned".

   ## Suggestions
   (filled in once the sub-issues exist)
   ```

3. Set the issue type to Epic where the repo has issue types:
   `gh api -X PATCH repos/<owner>/<repo>/issues/<epic#> -f type=Epic`.
   If that fails (personal repos have no issue types), the `epic` label is
   enough; mention it in the report.

## 3. Upload the images

Run the `pr-screenshots` skill's upload script with `--issue <epic#>` and all
files in `issue-images/`. It prints a JSON map of file to
`https://github.com/user-attachments/assets/...` URL. The first time, the user
signs in to GitHub in the browser it opens; tell them it's waiting.

If the `pr-screenshots` skill isn't installed or the upload fails, go on
without images, keep the work folder, and give its path in the report so the
images can be attached by hand.

## 4. Create the sub-issues

One per suggestion, in the order of the review, following the `github-issue`
skill's structure. Title: the suggestion title. Labels: `<label>`. Body:

```markdown
## Why
<problem>

<impact>

## What
<proposal>

Area: <area> · Category: <category> · Severity: <severity> · Effort: <effort>

### Current
![<caption>](<shot url>)

### Wireframes
| Before | After |
|---|---|
| ![before](<before url>) | ![after](<after url>) |

## Acceptance criteria
- [ ] <one per entry in changes>

Part of #<epic#>.
```

Leave out the image sections that have no images. Link each one to the epic:

```bash
P=$(gh issue view <epic#> --json id -q .id)
C=$(gh issue view <child#> --json id -q .id)
gh api graphql -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){issue{number}}}' -f p="$P" -f c="$C"
```

## 5. Finish

1. Replace the epic's `## Suggestions` placeholder with one line per
   sub-issue: `- #<n> <title> (<severity>, effort <effort>)`.
2. Delete the work folder, unless images failed to upload.
3. Report the epic URL, how many sub-issues were created, and anything that
   didn't work (issue type, images).

## Reading the decisions later

```bash
gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){issue(number:$n){subIssues(first:100){nodes{number title state stateReason}}}}}' -f o=<owner> -f r=<repo> -F n=<epic#>
```

- `OPEN`: approved. Read its comments (`gh issue view <n> --comments`) for
  "approve with changes" notes and fold them into the work.
- `CLOSED`: skip it, whatever the close reason. Before any work starts it was
  declined; later it may also be done already.

Close each sub-issue from its PR (`Closes #<n>`), and the epic once all are done.
