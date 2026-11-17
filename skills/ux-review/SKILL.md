---
name: ux-review
description: Walk through a running web app with the Playwright MCP, screenshot it, and produce UX improvement suggestions (flows, navigation, friction, copy, feedback, usability) as a local HTML review page - each suggestion with the problem, proposal and impact, the real screenshot, before/after Excalidraw-style wireframes, and Approve / Decline / Approve with changes buttons. Use when the user asks for a "UX review", "UX audit", "usability review", to "go through the app and suggest improvements", for a general "UI/UX review", or invokes /ux-review. For visual design and consistency (typography, colour, spacing, components) use the `ui-review` skill instead.
---

# UX review

Output: a local, self-contained review page at `./docs/ux-review/<YYYY-MM-DD>/index.html` (gitignored, never committed).

## 1. Scope
- Find the app URL: an argument, a running dev server, or start one from the project's scripts.
- If the user named pages/flows or a focus (e.g. "onboarding", "mobile"), stick to it. Otherwise cover the main pages and primary flows.
- If the app needs login, **ask the user** how to authenticate (test credentials, they sign in once in the Playwright browser, or skip protected pages).

## 2. Walk through and screenshot
- Use the Playwright MCP, headless preferred. Desktop viewport (1440×900); add mobile (390×844) if the app is meant to be responsive.
- Go through each page/flow like a real user: empty states, loading, errors, forms with invalid input, hover/focus states where relevant.
- Save screenshots to `./docs/ux-review/<date>/screenshots/` with readable names (`01-dashboard.png`). Playwright MCP may save to its own output folder, so check where the file landed and move it.
- Crop to the area a suggestion is about when the full page would hide it.

## 3. Find improvements
### Impeccable (optional)
If the `impeccable` skill is available, run it before your own pass and fold its results into this review. This page stays the only output, and the review leaves no files in the project besides it.
- `/impeccable critique` on the main pages or flows: heuristic scoring from two independent assessments, with its bundled detector scan (don't run the detector separately). Confirm each hit in a screenshot and drop false positives. Override its output steps:
  - Don't post its report in chat, show its Recommended Actions, or ask its questions; end it with `Questions skipped: decisions happen on the review page`.
  - Skip its "Persist the Snapshot" step and leave no `.impeccable/` files behind.
  - It wants two sub-agents. Without a sub-agent tool it runs inline and marks itself degraded; say so in the summary.
  - If it injects its browser overlay, stop the live server with `live-server stop --keep-inject` so it doesn't edit the project's HTML.
- Use its `harden` reference (extreme input, API and network errors, long translations, many items, no data) and `clarify` reference (labels, error messages, consistent terms) as checklists only. Both commands edit code, so don't run them during a review.
- If `PRODUCT.md` or `DESIGN.md` is missing, don't run `init`; say so in the summary.

Say in the page `summary` which Impeccable commands ran, or that it wasn't available.

### Checklist
Look at:
- visual hierarchy, layout, spacing, alignment, consistency
- navigation and information architecture, friction in key flows
- copy and labels, empty / error / loading states, feedback after actions
- accessibility: contrast, focus visibility, labels, target sizes, keyboard use
- responsiveness

Each suggestion must be **specific and grounded in a screenshot**: one problem, one concrete proposal. Aim for 5–15, ordered by impact. Skip nitpicks. Note effort (S/M/L) honestly.

## 4. Wireframes (before / after)
For each suggestion, draw a **before** and **after** wireframe in the Excalidraw element format (the same JSON the Excalidraw MCP `create_view` takes; call its `read_me` once if you haven't). Optionally preview tricky ones in chat with `create_view`.
- Low fidelity: boxes, labels, arrows. Only the relevant part of the screen, not the whole app.
- Same scale and layout in both so the difference is obvious.
- In **after**, highlight what changed: amber/blue stroke (`#f59e0b` / `#4a9eed`) or light fill, plus a short annotation text.
- Use `fontSize` ≥ 16, no emoji. `cameraUpdate` / `delete` pseudo-elements are ignored by the page (the view fits the content).

## 5. Build the page
1. Create `./docs/ux-review/<date>/`.
2. Copy `template.html` from this skill folder to `./docs/ux-review/<date>/index.html`. Don't edit it.
3. Write `./docs/ux-review/<date>/data.js`:

```js
window.REVIEW = {
  kind: "UX review",                // labels the page and the copied decisions
  id: "my-app-2026-10-22",          // unique; decisions are remembered per id
  title: "My App - UX review",
  app: "My App", url: "http://localhost:3000", date: "2026-10-22",
  summary: "One or two sentences on the overall state and the biggest themes.",
  suggestions: [
    {
      id: "1",
      title: "Make the primary action stand out on the dashboard",
      area: "Dashboard",            // page or flow
      category: "Visual hierarchy",
      severity: "high",             // high | medium | low
      effort: "S",                  // S | M | L
      problem: "Three buttons of equal weight; users can't tell which one starts a project.",
      proposal: "Make 'New project' the only filled button; turn the others into secondary buttons.",
      impact: "Faster first action for new users; less hesitation.",
      changes: ["'New project' filled, primary colour", "'Import' and 'Templates' become outline buttons"],
      screenshots: [
        { src: "screenshots/01-dashboard.png", caption: "Current dashboard",
          highlights: [{ x: 62, y: 8, w: 30, h: 7 }] }   // optional red frames, in % of the image
      ],
      wireframe: { before: [ /* Excalidraw elements */ ], after: [ /* Excalidraw elements */ ] }
    }
  ]
};
```

4. Make sure the project `.gitignore` contains `docs/ux-review/` (add it if missing).
5. Open the page for the user (Windows: `start "" "docs/ux-review/<date>/index.html"`, macOS: `open ...`) and tell them the path.

## 6. Act on the decisions
The user marks each suggestion **Approve / Decline / Approve with changes** (with a note), then clicks **Copy decisions** and pastes the result back.

Then ask what they want next:
- **Create GitHub issues** for approved suggestions (one issue each, following the issue rules in the global CLAUDE.md, with the "approve with changes" note folded into the requirements), as sub-issues under a parent issue like "UX review <date>", or
- **Implement** them directly (plan first if non-trivial). If Impeccable is available, its `clarify`, `harden`, `onboard` and `adapt` commands can apply the approved suggestions; keep them scoped to those suggestions.

Declined suggestions: do nothing.

If the user asked for a general "UI/UX review", offer a `ui-review` pass for
visual design and consistency once this one is done.
