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

Each finding must be **specific and grounded in a screenshot**: one problem,
one concrete fix (name the token, value or component). Aim for 5–20, ordered by
impact. Note effort (S/M/L) honestly.

## 4. Build the page

To be defined: template, data format, and whether findings get before/after
visuals (wireframes, CSS mock-ups or annotated screenshots).

Make sure the project `.gitignore` contains `docs/ui-review/`.

## 5. Act on the decisions

The user marks each finding **Approve / Decline / Approve with changes** and
pastes the decisions back. Then ask whether to:

- **Create GitHub issues** for approved findings (`github-issue` skill), as
  sub-issues under a parent like "UI review <date>", or
- **Implement** them directly (plan first if non-trivial).

Declined findings: do nothing.
