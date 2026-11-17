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
available and stop it afterwards). Viewport 1440×900, device scale factor 2
if the MCP allows it, so detail survives the downscaled layout. The page
lazy-loads images: set every `img` to `loading="eager"` and wait until all
report `complete` before capturing.

For each suggestion `<id>`, save to `<work folder>/issue-images/`:

- each screenshot (`<id>-shot-<n>.png`): the original file from
  `screenshots/` when it has no highlights, otherwise the `#s-<id> .shot`
  element (the n-th one) so the red frames are included
- `#s-<id> .wf[data-wf="before"]` and `#s-<id> .wf[data-wf="after"]`
  (`<id>-before.png`, `<id>-after.png`), for each side that has elements

Take them with the Playwright MCP's run-code tool (`browser_run_code` or
`browser_run_code_unsafe`, whichever it has) calling
`page.locator(selector).nth(n).screenshot({ path })`, or with element refs
from a snapshot. The MCP may save to its own output folder; move those files
into `issue-images/`. Check that each file exists and isn't blank.

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

3. Set the issue type to Epic if the owner has one. Only organisations have
   issue types, and `Epic` isn't a default one, so check first:
   `gh api orgs/<owner>/issue-types --jq '.[].name'`. If `Epic` is listed, run
   `gh api -X PATCH repos/<owner>/<repo>/issues/<epic#> -f type=Epic`.
   Otherwise the `epic` label is enough; mention it in the report.

## 3. Upload the images

Load the `pr-screenshots` skill to find its folder, then run its upload
script from the project:

```bash
node <pr-screenshots skill folder>/scripts/upload-pr-screenshots.js --repo <owner>/<repo> --issue <epic#> <work folder>/issue-images/*.png
```

It prints a JSON map of file to
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
![<caption 1>](<shot 1 url>)
<caption 1>

![<caption 2>](<shot 2 url>)
<caption 2>

### Wireframes
| Before | After |
|---|---|
| ![before](<before url>) | ![after](<after url>) |

## Acceptance criteria
- [ ] <one per entry in changes>

Part of #<epic#>.
```

One image and caption per screenshot, in order. If only one wireframe side
exists, drop the table and show that image under `**Before**` or `**After**`.
Leave out the image sections that have no images. A parent takes at most 100
sub-issues; a review never needs that many. Link each one to the epic:

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
