# AI Config

> My AI coding setup in one place: global instructions, skills and hooks,
> installed into Claude Code, Codex, OpenCode and GitHub Copilot CLI from a
> single source.

## What's Here

| Path | What |
| --- | --- |
| `instructions/global.md` | Global instructions shared by every tool |
| `instructions/<tool>.md` | Optional tool-specific additions (`claude-code.md` today) |
| `skills/` | My own skills in the [Agent Skills](https://agentskills.io) `SKILL.md` format |
| `hooks/claude/` | Claude Code hooks and the settings they need |
| `external.md` | Third-party skills and plugins I use, with install commands |
| `install/` | The installer and its tests |

### Skills

| Skill | What it does |
| --- | --- |
| `github-issue` | Writes issues as Why / What / Acceptance criteria; splits big work into sub-issues |
| `pull-request` | PR description, before/after screenshots, narrated video for new features |
| `pr-screenshots` | Uploads screenshots to a PR body as GitHub attachments (never committed) |
| `pr-review-fix` | Works through every review comment on a PR |
| `ux-review` | Walks a running web app and produces an HTML page of UX suggestions |

### Hooks (Claude Code)

- `biome-format.js` — after each edit, formats the file with the project's own
  Biome, if the project has it.
- `dev-ports-check.js` — when Claude stops, warns if common dev-server ports are
  still listening (Windows `netstat` only).

## Install

Needs Node 22+ (and `npx` for the skills step).

```bash
node install/install.mjs --dry-run       # see what would change
node install/install.mjs                 # every tool whose config folder exists
node install/install.mjs claude codex    # only these tools
node install/install.mjs --no-skills     # instructions and hooks only
```

Tools: `claude`, `codex`, `opencode`, `copilot`.

What it does for each tool:

| Tool | Instructions | Skills | Hooks |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` | yes | `~/.claude/hooks/` + merged into `~/.claude/settings.json` |
| Codex | `~/.codex/AGENTS.md` | yes | — |
| OpenCode | `~/.config/opencode/AGENTS.md` | yes | — |
| Copilot CLI | `~/.copilot/copilot-instructions.md` | yes | — |

- Instructions are `global.md` plus the tool's overlay, with a "generated"
  header.
- Any existing file that would change is backed up first as
  `<file>.bak-<timestamp>`. Identical files are left alone.
- Settings are merged: only missing hooks are added, plus
  `permissions.defaultMode: "auto"` if no mode is set. Hook entries that are
  already installed are never updated or removed; change those by hand.
- If `settings.json` is invalid JSON or has an unexpected shape, the install
  stops before writing anything.
- Skills are installed with `npx skills add <this repo> -g`, which places them
  in each tool's skills folder.

Paths live in `install/targets.mjs`; fix them there if a tool moves its config.

Then install the third-party pieces listed in `external.md`.

## Making Changes

Edit the files here, not the installed copies, then re-run the installer.

```bash
node --test "install/*.test.mjs"
```

See `docs/CONTRIBUTING.md` for adding a skill, an instruction overlay or a
new tool.

## History

This repo used to hold GitHub Copilot chatmodes and prompt templates. They were
removed in favour of skills, plan mode and global instructions; see the git
history if you need them.

## License

Shared for personal use. Adapt freely, but please don't redistribute
commercially without asking first.
