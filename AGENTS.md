# AI Agent Guidelines for ai-config

## Repository Overview

The single source for my AI coding setup: global instructions, skills and
Claude Code hooks, plus an installer that copies them into Claude Code, Codex,
OpenCode and GitHub Copilot CLI. See `README.md`.

## Layout

- `instructions/global.md` — shared global instructions. Tool-neutral wording
  ("the agent", "file edit tools"), no tool-specific features.
- `instructions/<tool>.md` — optional overlay appended for one tool. File name
  comes from `overlay` in `install/targets.mjs`. Don't name one `claude.md`:
  on Windows it is read as `CLAUDE.md` and loaded as folder instructions.
- `skills/<name>/SKILL.md` — one skill per folder, helper files next to it.
- `hooks/claude/` — Claude Code hook scripts and `settings.hooks.json`.
- `install/` — `install.mjs`, `targets.mjs` (all tool paths), tests.
- `external.md` — third-party skills/plugins; never vendor them here.

## Commands

```bash
node --test "install/*.test.mjs"   # tests
node install/install.mjs --dry-run # check the install without writing
```

Run the tests after any change to `install/` or `hooks/claude/settings.hooks.json`.

## Conventions

- Markdown: H1 title, H2 sections, `-` for lists, fenced code with a language.
- Files and folders: kebab-case.
- Node scripts: no dependencies, built-in modules only.
- Skills reference their own files relative to the skill folder, never via
  `~/.claude/...` or another tool's path.

### Skill Template

```markdown
---
name: skill-name
description: What it does and when to use it (trigger phrases, slash command).
---

# Skill Name

Steps, rules, output format.
```

## Rules

- Edit the repo, then run the installer. Don't edit installed copies.
- Never commit machine-specific paths, tokens, session data, or
  work-internal skills. This repo is public.
- The installer must never delete or silently overwrite user files: back up
  first, merge settings instead of replacing them.
- Commits follow Conventional Commits: `type(scope): subject`.
