# Copilot Coding Agent Instructions for ai-config

## Project Purpose
This repository is a reference library of configuration files, agent modes, and prompt templates for AI tools and IDE integrations. It is designed for copy-paste usage and adaptation, not as a runnable application or library.

## Key Structure
- `agents/`: Contains agent mode definitions (e.g., `chatmode/*.chatmode.md`). Each file describes a distinct AI agent persona or workflow mode.
- `prompts/`: Modular prompt templates for development, refactoring, and project architecture. Subfolders group prompts by use case.
- `docs/`: Project documentation and contribution guidelines.
- `.github/`: (This file) Copilot and agent instructions.

## Essential Conventions
- **No build/test workflow:** This repo is static content only. There are no build scripts, tests, or runtime code.
- **File naming:** Agent modes use the `.chatmode.md` suffix. Prompts are grouped by topic and use descriptive names.
- **Copy/adapt pattern:** Users are expected to copy files into their own projects and modify as needed.
- **Non-commercial:** All content is for non-commercial use unless explicit permission is granted.

## Agent Guidance
- When adding new agent modes, follow the structure in `agents/copilot/chatmode/` and use clear, numbered or descriptive filenames.
- When creating new prompts, place them in the appropriate `prompts/` subfolder and use concise, action-oriented names.
- Reference `README.md` and `docs/` for project intent and contribution rules.
- Do not add code, scripts, or binaries—this is a configuration/template repository only.

## Examples
- To add a new agent mode: Copy an existing `.chatmode.md` file, update the persona and instructions, and increment the number if needed.
- To add a new prompt: Place a new `.md` file in the relevant `prompts/` subfolder, following the naming conventions.

## Key Files
- `README.md`: Project overview and usage.
- `agents/copilot/chatmode/`: Agent mode templates.
- `prompts/`: Prompt templates for various dev tasks.
- `docs/CONTRIBUTING.md`: Contribution guidelines.

---
For questions, see the documentation in `docs/` or contact the repository owner.
