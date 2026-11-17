# Contributing

This is my personal setup. Suggestions are welcome as issues; PRs should stay
small and focused.

## Add a Skill

1. Create `skills/<name>/SKILL.md` (template in `AGENTS.md`).
2. Put helper files (scripts, templates) in the same folder and reference them
   relative to the skill folder.
3. If it needs a plugin or MCP server, say so in the skill and list it in
   `external.md`.
4. Add a plugin entry for it in `.claude-plugin/marketplace.json` (copy an
   existing one: `source: "./"`, `strict: false`, `skills: ["./skills/<name>"]`)
   and its `/plugin install` line in `README.md`. The tests fail without the entry.
5. Add it to the skills table in `README.md`.
6. Check the manifest: `claude plugin validate . --strict`.

## Change the Global Instructions

- Shared rules go in `instructions/global.md`, in tool-neutral wording.
- Rules that only make sense for one tool go in that tool's overlay
  (`instructions/claude-code.md`, `codex.md`, `opencode.md`, `copilot.md`).

## Add a Tool

1. Add an entry to `install/targets.mjs`: config `dir`, `instructions` file,
   `overlay` name and the `skillsAgent` id used by `npx skills -a`.
2. Add a test in `install/install.test.mjs`.
3. Add a row to the install table in `README.md`.

## Before Committing

The tests also check every skill (front matter `name` matches the folder,
referenced files exist in it) and scan tracked files for machine paths, emails
and secrets. Use placeholders like `C:Users<you>` and `name@example.com`.

```bash
node --test "install/*.test.mjs"
node install/install.mjs --dry-run
```

Check the diff for personal paths, tokens and work-internal content.
