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
| `hooks/claude/` | Claude Code hooks (`dev-hooks` plugin) and the installer's settings fragment |
| `.claude-plugin/` | Marketplace manifest: one Claude Code plugin per skill, plus `dev-hooks` |
| `external.md` | Third-party skills and plugins I use, with install commands |
| `install/` | The installer, its tests and the repo content checks |

### Skills

| Skill | What it does |
| --- | --- |
| `github-issue` | Writes issues as Why / What / Acceptance criteria; splits big work into sub-issues |
| `pull-request` | PR description, before/after screenshots, narrated video for new features |
| `pr-screenshots` | Uploads screenshots to a PR body as GitHub attachments (never committed); its script also uploads through an issue (`--issue N`) |
| `pr-review-fix` | Works through every review comment on a PR |
| `ux-review` | Walks a running web app and produces an HTML page of UX suggestions; `--no-open` skips opening it, `--issues` creates a GitHub epic with a sub-issue per suggestion instead (needs `pr-screenshots` for images) |
| `ui-review` | Reviews a running web app's visual design and consistency (work in progress); same `--no-open` / `--issues` options as `ux-review` |

### Hooks (Claude Code, `dev-hooks` plugin)

- `biome-format.js` — after each edit, formats the file with the project's own
  Biome, if the project has it.
- `dev-ports-check.js` — when Claude stops, warns if common dev-server ports are
  still listening (Windows `netstat` only).

## Install

### Claude Code: plugin marketplace

Every skill and the hooks are a separate plugin, so you pick what you want:

```text
/plugin marketplace add tomek-i/ai-config
/plugin
```

Or install single plugins directly (Claude Code 2.1.275+):

```text
/plugin install github-issue --marketplace tomek-i/ai-config
/plugin install pull-request --marketplace tomek-i/ai-config
/plugin install pr-screenshots --marketplace tomek-i/ai-config
/plugin install pr-review-fix --marketplace tomek-i/ai-config
/plugin install ux-review --marketplace tomek-i/ai-config
/plugin install ui-review --marketplace tomek-i/ai-config
/plugin install dev-hooks --marketplace tomek-i/ai-config
```

Plugins install as `<plugin>@tomek-i` (e.g. `ux-review@tomek-i`). `dev-hooks`
holds both hooks. Switch plugins on and off in `/plugin`.

To keep them all current, turn on auto-update for the marketplace (`/plugin` >
Marketplaces > tomek-i > Enable auto-update): Claude Code then updates every
installed plugin at startup. `/plugin marketplace update tomek-i` only
refreshes the catalog; `claude plugin update <plugin>@tomek-i` updates one
plugin. Plugin skills show up with a prefix, e.g. `ux-review:ux-review`.

### Installer: instructions, and skills for the other tools

Needs Node 22+ (and `npx` for the skills step).

```bash
node install/install.mjs --dry-run              # see what would change
node install/install.mjs                        # every tool whose config folder exists
node install/install.mjs claude codex           # only these tools
node install/install.mjs --no-skills            # instructions only
node install/install.mjs --skip=pull-request    # every skill but these
node install/install.mjs --only=ux-review,ui-review  # only these skills
```

Tools: `claude`, `codex`, `opencode`, `copilot`.

What it does for each tool:

| Tool | Instructions | Skills | Settings |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` | via the marketplace | `permissions.defaultMode` merged into `~/.claude/settings.json` |
| Codex | `~/.codex/AGENTS.md` | yes | — |
| OpenCode | `~/.config/opencode/AGENTS.md` | yes | — |
| Copilot CLI | `~/.copilot/copilot-instructions.md` | yes | — |

- Instructions are `global.md` plus the tool's overlay, with a "generated"
  header.
- Any existing file that would change is backed up first as
  `<file>.bak-<timestamp>`. Identical files are left alone.
- Settings are merged: `permissions.defaultMode: "auto"` is added if no mode
  is set; nothing else is touched.
- If `settings.json` is invalid JSON or has an unexpected shape, the install
  stops before writing anything.
- Skills are installed with `npx skills add <this repo> -g`, which places them
  in each tool's skills folder. `--only` / `--skip` take skill folder names.

Moving from an older install: the installer used to copy skills and hooks into
`~/.claude` itself. It now retires those copies so nothing loads twice:

- its hook entries are removed from `settings.json` (backed up first; your
  other hooks stay) and `~/.claude/hooks/<script>.js` is renamed to
  `<script>.js.bak-<timestamp>`;
- a plain folder in `~/.claude/skills/` with the same name as one of these
  skills is moved to `~/.claude/skills-backup/<name>-<timestamp>/`.
  Symlinked folders are left alone.

It never moves anything through a linked folder (e.g. `~/.claude/skills` linked
to a checkout), and keeps a hook script while any hook entry still runs it
(one you edited, or one in `settings.local.json`). If a move fails, for example
because Claude Code holds the folder open, it says which one and the run fails
at the end; re-run to finish.

Install the `dev-hooks` plugin to keep the hooks.

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
