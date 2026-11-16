---
name: ui-review
description: Review the visual design of a running web app with the Playwright MCP - typography, colour, spacing, alignment, component consistency, states and polish - and produce a local HTML review page of concrete UI fixes, each with the screenshot, the problem, the proposed change and Approve / Decline / Approve with changes buttons. Use when the user asks for a "UI review", "visual review", "design polish pass", "check the UI consistency", or invokes /ui-review. For flows, navigation and usability use the `ux-review` skill instead.
---

# UI review

Focus: how the interface **looks** and whether it is **consistent**, not how
users move through it (that is `ux-review`).

Output: a local review page at `./docs/ui-review/<YYYY-MM-DD>/index.html`
(gitignored, never committed).

## 1. Scope

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
  (390×844) if responsive, light and dark theme if supported.
- Capture component states: default, hover, focus, active, disabled, loading,
  empty, error.
- Save screenshots to `./docs/ui-review/<date>/screenshots/` with readable
  names (`01-dashboard-header.png`). Crop to the element a finding is about.

## 3. Find issues

If the `impeccable` skill is available, use its audit / polish guidance. Check:

- typography: scale, weights, line height, line length, hierarchy
- colour: palette use, contrast (WCAG AA), semantic colours, dark mode
- spacing and layout: spacing scale, alignment, grid, density, whitespace
- components: the same thing looks the same everywhere (buttons, inputs,
  cards, icons, radii, shadows); deviations from the design tokens
- states: hover / focus / disabled / loading / error styling present and
  consistent
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

Each finding must be **specific and grounded in a screenshot**: one problem,
one concrete fix (name the token, value or component). Aim for 5–20, ordered by
impact. Note effort (S/M/L) honestly.

## 4. Build the page

1. Create `./docs/ui-review/<date>/`.
2. Copy `template.html` from this skill folder to
   `./docs/ui-review/<date>/index.html`. Don't edit it.
3. Write `./docs/ui-review/<date>/data.js`:

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

4. Make sure the project `.gitignore` contains `docs/ui-review/`.
5. Open the page for the user (Windows: `start "" "docs/ui-review/<date>/index.html"`,
   macOS: `open ...`) and tell them the path.

## 5. Act on the decisions

The user marks each finding **Approve / Decline / Approve with changes** and
pastes the decisions back. Then ask whether to:

- **Create GitHub issues** for approved findings (`github-issue` skill), as
  sub-issues under a parent like "UI review <date>", or
- **Implement** them directly (plan first if non-trivial).

Declined findings: do nothing.
