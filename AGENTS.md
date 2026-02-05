# AI Agent Guidelines for ai-config

## Repository Overview
This is a static configuration and template repository containing AI agent modes, prompts, and documentation. It is designed for copy-paste usage and adaptation, not as a runnable application.

## Build/Test Commands
**No build or test commands required** - This repository contains only static Markdown files and documentation. There are no runtime dependencies, compilation steps, or test suites.

## Code Style Guidelines

### File Structure & Organization
- Use descriptive, hyphenated filenames (e.g., `refactor.md`, `unit-tests.md`)
- Agent modes must use `.chatmode.md` suffix in `agents/copilot/chatmode/`
- Prompts should be organized by topic in `prompts/` subdirectories
- Number agent modes sequentially when they represent a workflow (e.g., `1-visionary.chatmode.md`)

### Markdown Formatting Standards
- Use YAML frontmatter for agent mode files with `description`, `tools`, and `handoffs`
- Follow consistent heading hierarchy (H1 for titles, H2 for sections, H3 for subsections)
- Use bullet points (`-`) for lists, not asterisks
- Use code blocks with language specification when applicable
- Keep lines under 80-100 characters for readability

### Content Guidelines
- **Agent Modes**: Include clear persona definition, workflow steps, questioning strategy, and output structure
- **Prompts**: Be action-oriented and specific about expected outcomes
- **Documentation**: Write for copy-paste usage, include examples and clear instructions
- Avoid implementation-specific code or binary files
- Focus on non-technical language when targeting general audiences

### Naming Conventions
- Files: kebab-case (e.g., `documentarian.chatmode.md`)
- Sections in files: Title Case for headings
- Variables in examples: camelCase for code, kebab-case for file names
- Keep filenames concise but descriptive

### Import/Reference Guidelines
- When referencing other files in the repository, use relative paths
- Cross-reference relevant files in documentation (e.g., "See `prompts/dev/refactor.md`")
- Include tool dependencies in agent frontmatter (`tools: ['search','edit/createFile']`)
- Specify handoff agents and prompts in workflow files

### Error Handling
- For agent modes, include fallback strategies and error recovery steps
- In prompts, provide guidance on handling edge cases and failures
- Document expected failure modes and recovery approaches
- Include validation checklists where appropriate

### Type Annotations (Code Examples)
- When including code examples in prompts or documentation:
  - Use TypeScript for JavaScript examples when possible
  - Include type hints for Python examples
  - Keep examples minimal and focused on the concept being demonstrated
  - Add brief explanations for complex type definitions

### Version Control Standards
- Commit messages should be descriptive and follow conventional commit format
- Use clear branch names when contributing
- Include relevant file names in commit descriptions
- Keep pull requests focused on single features or fixes

## File Templates

### Agent Mode Structure
```yaml
---
description: 'Brief description of agent purpose and scope'
tools: ['tool1','tool2']
handoffs: 
  - label: Handoff to Next Agent
    agent: agent-name
    prompt: "Context for handoff"
    send: false
---

[Agent persona and detailed instructions]
```

### Prompt Structure
```markdown
# Prompt: [Clear, Action-Oriented Title]

**Goal:** [Specific objective of the prompt]

## [Section Headers with clear organization]

### Subsections as needed
- Use bullet points for lists
- Include examples where helpful
- Provide validation criteria
```

## Key Files Reference
- `.github/copilot-instructions.md`: Primary agent instructions
- `agents/copilot/chatmode/`: Agent workflow definitions
- `prompts/`: Reusable prompt templates by category
- `docs/CONTRIBUTING.md`: Contribution guidelines
- `README.md`: Project overview and usage

## Usage Context
- Users typically copy files into their own projects
- Content should be self-contained and require minimal setup
- Focus on providing value out-of-the-box
- Include clear usage instructions and examples

## Prohibited Content
- No executable code or binary files
- No proprietary or licensed configurations
- No commercial redistribution without permission
- No build scripts or runtime dependencies

---
*Agents working in this repository should prioritize clarity, reusability, and ease of adoption over technical complexity.*