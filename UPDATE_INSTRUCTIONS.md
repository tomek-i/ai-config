# Update Instructions: Single-Source AI Config

**Goal:** Turn this repo into the single source of truth for my AI coding setup
(global instructions, skills, hooks, plugin list) and install it into each tool
from there: Claude Code, Codex, OpenCode and GitHub Copilot.

Snapshot taken from `~/.claude` and `~/.agents` on 2026-11-05.

## 1. Decisions

- **Delete the old content.** The Copilot chatmodes, prompts and
  `copilot-instructions.md` are removed, not archived. Git history keeps them.
- **One source, many targets.** Instructions and skills are written once in
  tool-neutral formats (`AGENTS.md` and `SKILL.md`). An install script copies
  them to wherever each tool expects them.
- **Only my own work is committed.** Third-party skills and plugins are listed
  with their source and install command, not vendored.
- **Internal/work-only skills stay out.** `daily-scrum-email` (SSW internal) and
  the SSW plugins are not part of this repo.

## 2. Target Structure

```text
ai-config/
├── README.md                    # what's here, how to install, supported tools
├── AGENTS.md                    # rules for agents working IN this repo
├── CLAUDE.md                    # contains only: @AGENTS.md
├── instructions/
│   ├── global.md                # shared global instructions (single source)
│   ├── claude.md                # Claude-only additions (optional)
│   ├── codex.md                 # Codex-only additions (optional)
│   ├── opencode.md              # OpenCode-only additions (optional)
│   └── copilot.md               # Copilot-only additions (optional)
├── skills/                      # my own skills, Agent Skills format
│   ├── github-issue/
│   ├── pr-review-fix/
│   ├── pr-screenshots/          # + scripts/upload-pr-screenshots
│   ├── pull-request/
│   ├── ui-review/
│   └── ux-review/
├── hooks/
│   └── claude/
│       ├── biome-format.js
│       ├── dev-ports-check.js
│       └── settings.hooks.json  # hook block to merge into settings.json
├── external.md                  # third-party skills + plugins, with sources
├── install/
│   ├── install.mjs              # one cross-platform installer (Node)
│   ├── targets.mjs              # per-tool paths in one place
│   └── install.test.mjs         # node:test tests for the installer
└── docs/
    └── CONTRIBUTING.md          # how to add a skill / instruction / target
```

## 3. Files to Delete

```text
.github/chatmodes/documentarian.chatmode.md
.github/copilot-instructions.md
agents/                          (whole folder, 9 chatmodes)
prompts/                         (refactor.md, unit-tests.md, architecture.md)
```

What replaced them, for the README "history" note:

| Old | Now |
| --- | --- |
| visionary, product-manager, marketing | `plaid` (third-party, see 4.4) |
| architect, planner | Plan mode + Plannotator |
| coordinator, issue-scribe | `github-issue` skill |
| devils-advocate | `/code-review`, adversarial subagent review before PRs |
| documentarian | "update README/docs" rule in global instructions, `/init` |
| refactor prompt | `/simplify` |
| unit-tests prompt | Testing section of global instructions |

## 4. Content Inventory

### 4.1 Global instructions → `instructions/global.md`

Source: `~/.claude/CLAUDE.md`. Split it:

- **Shared (`global.md`):** communication, shell & editing, coding, testing,
  dev environment, risky actions, Git, pull requests, project conventions.
- **Claude-only (`claude.md`):** anything naming Claude-specific features:
  plan mode + Plannotator, subagent review before PRs, skill names in the
  "Skills" section, and the "overrides harness attribution" wording.

Write `global.md` in tool-neutral language ("the agent", not "Claude").

### 4.2 My skills → `skills/`

All five were written by me with Claude in October 2026.

| Skill | Purpose | Portable? |
| --- | --- | --- |
| `github-issue` | Why / What / Acceptance criteria issues, sub-issues | Yes |
| `pull-request` | PR description, before/after screenshots, video | Mostly (video uses `narrate`) |
| `pr-screenshots` | Upload screenshots to a PR body, never committed | Yes (needs its script) |
| `pr-review-fix` | Address all review comments on a PR | Yes |
| `ux-review` | Playwright walkthrough → HTML UX review page (+ `template.html`) | Needs Playwright MCP |
| `ui-review` | Visual design / consistency review → HTML page (WIP) | Needs Playwright MCP |

Not included: `create-agents` and `create-skill`. Their origin is unknown (no
author or source, dated 2026-06-22) and Anthropic's `skill-creator` and
`/agents` cover the same ground. They were disabled on 2026-11-05 by moving
them to `~/.claude/skills-disabled/`; delete that folder once nothing is
missed.

Moves needed:

- `~/.claude/scripts/upload-pr-screenshots` goes into
  `skills/pr-screenshots/scripts/` and the skill references it relatively.
- Skills that depend on a plugin/MCP say so in their description or body, so
  tools without it fail clearly.
- If a Claude-only skill is added later, list it in `targets.mjs` so the
  installer skips it for other tools.

### 4.3 Hooks → `hooks/claude/`

- `biome-format.js` — PostToolUse on `Edit|Write`: run the project's local Biome.
- `dev-ports-check.js` — Stop: warn when dev ports are still listening.

Hooks are Claude Code-only for now. Porting them to OpenCode plugins or Codex
hooks is a later, optional step.

`settings.hooks.json` contains only these two hooks plus
`permissions.defaultMode: "auto"`. Never include the
`claude-terminal-hook-handler.js` hooks — the Claude Terminal app installs those.

### 4.4 Third-party → `external.md`

Skills installed with the `skills` CLI (`npx skills`, from `vercel-labs/skills`)
into `~/.agents/skills`:

| Skill | Source | Note |
| --- | --- | --- |
| `plaid` | `BuildGreatProducts/plaid` | Used twice (May 2026, `/plaid` and `/plaid design`). Keep listed, optional. |
| `impeccable` | `pbakaus/impeccable` | Also available as a Claude plugin |
| `aspire*` (6 skills) | check `~/.agents/.skill-lock.json` | Aspire work |
| `plannotator-*` | Plannotator | Installed by the Plannotator plugin |

Claude Code plugins (generic ones only):

| Plugin | Marketplace | Enabled |
| --- | --- | --- |
| `plannotator` | `backnotprop/plannotator` | yes |
| `narrate` | `tomek-i/narrate-plugin` | yes |
| `impeccable` | `pbakaus/impeccable` | yes |
| `playwright` | `anthropics/claude-plugins-official` | local |
| `andrej-karpathy-skills` | `forrestchang/andrej-karpathy-skills` | no |

Leave out: `ssw-*`, `armada`, `ssw-rnd`, `typesafe-ai` (work/internal or unused).

Each entry gets its install command, for example:

```text
npx skills add BuildGreatProducts/plaid -g
/plugin marketplace add backnotprop/plannotator
/plugin install plannotator@plannotator
```

## 5. Install Targets

All paths live in `install/targets.mjs` so there is one place to fix them.
**Check each path against the tool's current docs while implementing** — these
change between releases.

| Tool | Global instructions | Skills | Extras |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` | `~/.claude/skills/` | hooks → `~/.claude/hooks/`, merge `settings.hooks.json` |
| Codex | `~/.codex/AGENTS.md` | `~/.agents/skills/` | — |
| OpenCode | `~/.config/opencode/AGENTS.md` | `~/.config/opencode/skills/` | — |
| Copilot CLI | `~/.copilot/copilot-instructions.md` | `~/.copilot/skills/` | — |

Instruction file for each tool = `global.md` + `<tool>.md` (if it exists), with
a generated header: `<!-- Generated from ai-config. Edit the repo, not this file. -->`.

Before writing a custom skills copier, check whether `npx skills add
tomek-i/ai-config -g -a <agent>` already installs this repo's `skills/` into
all four tools. If it does, use it and keep `install.mjs` for instructions and
hooks only.

## 6. Installer Behaviour (`install/install.mjs`)

Node, because the hooks already need Node and it runs the same on Windows,
macOS and Linux. No dependencies.

```text
node install/install.mjs                  # all detected tools
node install/install.mjs claude codex     # specific tools
node install/install.mjs --dry-run        # print what would change
```

Rules:

- Only install for tools whose config folder exists, unless named explicitly.
- Back up any existing file that differs to `<file>.bak-<timestamp>` before
  overwriting. Never delete files the installer didn't create.
- Merge into `settings.json`, never replace it: add the two hook entries if
  missing and leave all other keys alone.
- Copy, don't symlink (Windows symlinks need Developer Mode).
- Print a summary: written, unchanged, backed up, skipped.

Tests (`node --test install/`) against a temp home folder:

- Builds each tool's instruction file from `global.md` + overlay.
- Skips Claude-only skills for other tools.
- Backs up a changed file; leaves an identical file untouched.
- Settings merge keeps existing keys and doesn't duplicate hooks on re-run.
- `--dry-run` writes nothing.

## 7. Repo Rules to Rewrite (`AGENTS.md`, `CONTRIBUTING.md`)

- Remove: "no executable code", "no build scripts", `.chatmode.md` naming and
  the chatmode/prompt templates.
- Allow: the installer, its tests, hook scripts and skill helper scripts.
- Test command: `node --test install/`.
- Add the skill template:

  ```markdown
  ---
  name: skill-name
  description: What it does and when to use it (trigger phrases).
  ---

  # Skill Name
  Steps, rules, output format.
  ```

- Never commit machine-specific paths, tokens, session data or work-internal
  skills.
- Edit the repo, then run the installer. Don't edit the installed copies.

## 8. Steps

1. Branch: `git switch -c refactor/single-source-config`.
2. Delete the old files (section 3).
3. Add `instructions/global.md` + `claude.md` (section 4.1).
4. Add `skills/` and move the screenshot script in (section 4.2).
5. Add `hooks/claude/` (section 4.3).
6. Add `external.md` (section 4.4).
7. Write `install/targets.mjs`, `install.mjs` and tests; run
   `node --test install/` and a `--dry-run` on this machine.
8. Rewrite `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/CONTRIBUTING.md`.
9. Grep for secrets, emails and absolute paths (`C:/Users/tomek`) before
   committing.
10. Commit per step, for example:
    - `chore: remove legacy copilot chatmodes and prompts`
    - `feat(instructions): add shared global instructions`
    - `feat(skills): add personal skills`
    - `feat(hooks): add claude biome and dev-ports hooks`
    - `feat(install): add cross-platform installer`
    - `docs: rewrite readme and agents.md for single-source setup`

## 9. Open Questions

- Should `~/.claude/CLAUDE.md` become installer-generated, or should it import
  a shared file (`@~/.ai-config/global.md`) so updates don't need a reinstall?
- Do I want VS Code Copilot (user `*.instructions.md` / prompt files) as a
  target, or only Copilot CLI?
- Is the repo public? If so, review `global.md` for anything work-specific.
