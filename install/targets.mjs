// Where each tool reads its global config, relative to the home folder.
// Check these against each tool's docs when a tool changes; they are the only
// place paths are defined.
export const TARGETS = {
  claude: {
    name: 'Claude Code',
    dir: '.claude',
    instructions: '.claude/CLAUDE.md',
    overlay: 'claude-code.md',
    skillsAgent: 'claude-code',
    hooksDir: '.claude/hooks',
    settings: '.claude/settings.json',
  },
  codex: {
    name: 'Codex',
    dir: '.codex',
    instructions: '.codex/AGENTS.md',
    overlay: 'codex.md',
    skillsAgent: 'codex',
  },
  opencode: {
    name: 'OpenCode',
    dir: '.config/opencode',
    instructions: '.config/opencode/AGENTS.md',
    overlay: 'opencode.md',
    skillsAgent: 'opencode',
  },
  copilot: {
    name: 'Copilot CLI',
    dir: '.copilot',
    instructions: '.copilot/copilot-instructions.md',
    overlay: 'copilot.md',
    skillsAgent: 'github-copilot',
  },
};
