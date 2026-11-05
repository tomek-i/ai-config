# External Skills and Plugins

Third-party skills and plugins I use. They are installed from their own
sources, not copied into this repo.

## Skills (any tool)

Installed with the [`skills` CLI](https://github.com/vercel-labs/skills).
Add `-a claude-code -a codex -a opencode -a github-copilot` to choose tools.

| Skill | Source | Install | Used for |
| --- | --- | --- | --- |
| `plaid` | `BuildGreatProducts/plaid` | `npx skills add BuildGreatProducts/plaid -g` | Product idea → validate → PRD → design → launch |
| `impeccable` | `pbakaus/impeccable` | `npx skills add pbakaus/impeccable -g` | Frontend design and polish |

## Claude Code Plugins

Install inside Claude Code:

```text
/plugin marketplace add <marketplace>
/plugin install <plugin>@<marketplace-name>
```

| Plugin | Marketplace | Default | Used for |
| --- | --- | --- | --- |
| `plannotator` | `backnotprop/plannotator` | enabled | Plan review UI, code review, annotations (also adds the `plannotator-*` skills) |
| `narrate` | `tomek-i/narrate-plugin` | enabled | Narrated walkthrough videos (used by the `pull-request` skill) |
| `impeccable` | `pbakaus/impeccable` | enabled | Frontend design agents and skill |
| `playwright` | `anthropics/claude-plugins-official` | enabled | Browser automation (used by `ux-review`, `pull-request`) |
| `andrej-karpathy-skills` | `forrestchang/andrej-karpathy-skills` | disabled | Coding guidelines, when needed |

## MCP Servers Used by My Skills

- **Playwright MCP** — `ux-review`, `pull-request` (screenshots).
- **Excalidraw MCP** — wireframes in `ux-review` and the `pull-request` fallback.
