---
name: ui-review
description: Review the visual design of a running web app with the Playwright MCP - typography, colour, spacing, alignment, component consistency, states and polish - and produce a local HTML review page of concrete UI fixes, each with the screenshot, the problem, the proposed change and Approve / Decline / Approve with changes buttons. Use when the user asks for a "UI review", "visual review", "design polish pass", "check the UI consistency", or invokes /ui-review. For flows, navigation and usability use the `ux-review` skill instead. Options: `--no-open` builds the page without opening it; `--issues` publishes the review as a GitHub epic with one sub-issue per finding instead of a page.
argument-hint: "[url] [--no-open] [--issues]"
---

# UI review

Focus: how the interface **looks** and whether it is **consistent**, not how
users move through it (that is `ux-review`).

Output: a local review page at `./docs/ui-review/<YYYY-MM-DD>/index.html`
(gitignored, never committed), or GitHub issues with `--issues`.

## Options

Read them from the arguments, or from plain words in the request:

- `--no-open` ("don't open it"): build the page as usual but don't open it;
  just give the path.
- `--issues` ("as GitHub issues", "create an epic"): no page. Publish an epic
  issue with one sub-issue per finding, each with its screenshot and
  wireframes. The user decides on GitHub: an open sub-issue is approved, a
  closed one is declined.

The **work folder** is `./docs/ui-review/<date>/` by default, and
`<os temp>/ui-review-<date>/` with `--issues` so the review leaves nothing in
the project.

## 1. Scope

- With `--issues`, first check that `gh auth status` passes and the project
  has a GitHub remote (`gh repo view`). If not, stop and say so before
  capturing anything.
- Find the app URL: an argument, a running dev server, or start one from the
  project's scripts.
- If the user named pages, components or a focus (e.g. "forms", "dark mode"),
  stick to it. Otherwise cover the main pages and the shared components.
- If the app needs login, **ask the user** how to authenticate.
- Look for the project's design source of truth: design tokens, theme file,
  Tailwind config, component library, `DESIGN.md`, Figma link. Review against
  it when it exists.

## 2. Capture

- Use the Playwright MCP, headless preferred. Desktop (1440×900), mobile
  (390×844) if responsive, light and dark theme if supported. Check 320px wide
  for overflow and overlap.
- Capture with reduced motion on as well when the app animates.
- Capture component states: default, hover, focus, active, disabled, loading,
  empty, error.
- Save screenshots to `<work folder>/screenshots/` with readable
  names (`01-dashboard-header.png`). Crop to the element a finding is about.

## 3. Find issues

### Impeccable (optional)

If the `impeccable` skill is available, run it before your own checks and fold
its results into this review. This page stays the only output, and the review
leaves no files in the project besides it.

- `/impeccable audit` on the scope (the app URL or the UI source folder): a
  check of accessibility, performance, theming, responsive layout and
  anti-patterns, including its bundled detector scan (don't run the detector
  separately). Confirm each hit in a screenshot, drop false positives and turn
  each real issue into a finding below. Override its output steps: don't post
  its report or Recommended Actions in chat, and skip its "Save the Report"
  step so no `.impeccable/` files are left behind.
- Use its `polish` reference as a checklist only. `polish` edits code, so
  don't run it during a review.
- If `PRODUCT.md` or `DESIGN.md` is missing, don't run `init` or `document`;
  say so in the summary.

Say in the page `summary` which Impeccable commands ran, or that it wasn't
available.

### Checklist

Check:

- typography: one heading scale used everywhere, weights, line height, line
  length, hierarchy; every font it uses actually loads
- colour: palette use, contrast (WCAG AA), semantic colours, dark mode
- spacing and layout: spacing scale, grid, density, whitespace; content shares
  the same left and right edges instead of drifting to one side
- one system: a single primary / secondary button pair, one card style, one
  radius scale, one link style, the same input look in every form; boxes
  nested at most two deep (no card in a card in a card); deviations from the
  design tokens
- states: hover / focus / disabled / loading / error styling present and
  consistent; every button, link and clickable card visibly reacts to hover
  and press; the focus ring is visible and never hidden under a sticky header
- motion: nothing fades in section by section on scroll, no parallax on text,
  no scroll hijacking; anything moving longer than 5 s can be paused; with
  reduced motion everything rests and no content stays hidden
- small screens: no sideways scroll at 320px, nothing overlapping or tucked
  under a fixed bar, tap targets at least 44px tall with room between them
- polish: overflow, truncation, broken images, jank, odd breakpoints

### AI slop banlist

These patterns make an interface look generated. Flag each one you find as a
finding (category `AI slop`) and never use one in a proposal, unless the user
or the project's design source of truth explicitly asks for it:

- eyebrow labels
- monospace uppercase text
- random serif fonts
- purple gradients, and purple as a default accent
- beige
- `01 / 02 / 03` counters
- glowing orbs
- shockwave rings or circles popping out of things
- decorative particles
- long thin decorative lines
- em dashes in any text
- generic motion with no purpose, such as an icon floating up

This applies to the review's own text too. The same list is in the global
instructions (`UI Design`); keep both in sync.

### Copy that reads as generated

Also `AI slop`. One hit proves little; several together do. Propose the plain
fact the phrase stands in for:

- filler words: seamless, effortless, unlock, unleash, elevate, empower,
  powerful, robust, cutting-edge, next-level, world-class, game-changing
- stock lines: "Ready to transform your…?", "Say goodbye to…", "X made
  simple", "Join thousands of…", "at your fingertips"
- a strip of three or four big numbers over one-word labels
- two-fragment headings ("Fast setup. Zero hassle.") used more than once
- reveal tricks: "The result? …", "One thing changed: …"
- leftovers: "[Company Name]", lorem ipsum, `{{tokens}}`, stray markdown
- invented-looking specifics (precise stats, quotes, customers) with no source
- buttons that aren't a verb and an object ("Submit", "Learn more" over
  "Book a demo", "Export report")
- emoji as bullets, an arrow after every link

Each finding must be **specific and grounded in a screenshot**: one problem,
one concrete fix (name the token, value or component). Aim for 5–20, ordered by
impact. Note effort (S/M/L) honestly.

## 4. Build the page

With `--issues` the page is still built in the temp work folder, only to
render the screenshots and wireframes for the issues; it is never opened or
kept.

1. Create the work folder.
2. Copy `template.html` from this skill folder to
   `<work folder>/index.html`. Don't edit it.
3. Write `<work folder>/data.js`:

```js
window.REVIEW = {
  kind: "UI review",                // labels the page and the copied decisions
  id: "my-app-ui-2026-11-17",       // unique; decisions are remembered per id
  title: "My App - UI review",
  app: "My App", url: "http://localhost:3000", date: "2026-11-17",
  summary: "One or two sentences on the overall visual state and the biggest themes.",
  suggestions: [
    {
      id: "1",
      title: "Use one button radius across the app",
      area: "Buttons",              // page, component or area
      category: "Consistency",      // Typography | Colour | Spacing | Consistency | States | Polish | AI slop
      severity: "medium",           // high | medium | low
      effort: "S",                  // S | M | L
      problem: "Primary buttons use 4px radius, dialog buttons 8px, cards 12px.",
      proposal: "Use the --radius-md token (6px) for all buttons.",
      impact: "The app reads as one product; fewer one-off styles.",
      changes: ["Button component: border-radius var(--radius-md)", "Remove the dialog button override"],
      screenshots: [
        { src: "screenshots/03-buttons.png", caption: "Buttons on the settings page",
          highlights: [{ x: 10, y: 40, w: 25, h: 10 }] }   // optional red frames, in % of the image
      ],
      wireframe: { before: [ /* optional Excalidraw elements */ ], after: [] }
    }
  ]
};
```

4. Make sure the project `.gitignore` contains `docs/ui-review/`. Skip with
   `--issues`.
5. Open the page for the user (Windows: `start "" "docs/ui-review/<date>/index.html"`,
   macOS: `open ...`) and tell them the path. With `--no-open`, only give the
   path. With `--issues`, publish instead: follow `github-issues.md` in this skill folder, with kind `UI review` and label `ui-review`.

## 5. Act on the decisions

### With `--issues`

When the user comes back to the epic, read its sub-issues as
`github-issues.md` describes: open ones are approved (their comments are
"approve with changes" notes), closed ones are declined. Then implement the
approved ones as below.

### With the page

The user marks each finding **Approve / Decline / Approve with changes** and
pastes the decisions back. Then ask whether to:

- **Create GitHub issues** for approved findings (`github-issue` skill), as
  sub-issues under a parent like "UI review <date>", or
- **Implement** them directly (plan first if non-trivial). If Impeccable is
  available, its `polish`, `typeset`, `layout` and `adapt` commands can apply
  the approved findings; keep them scoped to those findings.

Declined findings: do nothing.
