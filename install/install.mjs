#!/usr/bin/env node
// Installs this repo's global instructions, skills and hooks into each AI tool.
//
//   node install/install.mjs                 all tools whose config folder exists
//   node install/install.mjs claude codex    only these tools
//   node install/install.mjs --dry-run       show what would change, write nothing
//   node install/install.mjs --no-skills     skip the skills step
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TARGETS } from './targets.mjs';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HEADER = '<!-- Generated from ai-config. Edit the repo, not this file. -->';

// Git may check sources out with CRLF; installed files always use LF so
// re-running the installer on another machine doesn't report changes.
const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

export function buildInstructions(repo, target) {
  const parts = [HEADER, read(path.join(repo, 'instructions', 'global.md')).trimEnd()];
  const overlay = path.join(repo, 'instructions', target.overlay);
  if (fs.existsSync(overlay)) parts.push(read(overlay).trimEnd());
  return `${parts.join('\n\n')}\n`;
}

// Writes content to file. An existing, different file is backed up first.
// Returns 'unchanged', 'written' or 'backed-up'.
export function writeFile(file, content, { dryRun = false, now = Date.now() } = {}) {
  let result = 'written';
  if (fs.existsSync(file)) {
    if (read(file) === content) return 'unchanged';
    result = 'backed-up';
    if (!dryRun) fs.copyFileSync(file, `${file}.bak-${now}`);
  }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return result;
}

// Adds the repo's hooks and default permission mode to existing settings
// without touching anything else. Hooks already present (same command) are skipped.
export function mergeSettings(existing, fragment, hooksDir) {
  const merged = structuredClone(existing);
  const resolved = JSON.parse(JSON.stringify(fragment).replaceAll('{{HOOKS_DIR}}', hooksDir));

  if (resolved.permissions?.defaultMode && !merged.permissions?.defaultMode) {
    merged.permissions = { ...merged.permissions, defaultMode: resolved.permissions.defaultMode };
  }

  merged.hooks ??= {};
  for (const [event, groups] of Object.entries(resolved.hooks ?? {})) {
    merged.hooks[event] ??= [];
    const commands = new Set(merged.hooks[event].flatMap((g) => (g.hooks ?? []).map((h) => h.command)));
    for (const group of groups) {
      if (!group.hooks.some((h) => commands.has(h.command))) merged.hooks[event].push(group);
    }
  }
  return merged;
}

export function installClaudeHooks(repo, home, target, opts) {
  const results = [];
  const hooksDir = path.join(home, target.hooksDir);
  const source = path.join(repo, 'hooks', 'claude');
  for (const name of fs.readdirSync(source).filter((f) => f.endsWith('.js'))) {
    const file = path.join(hooksDir, name);
    results.push([file, writeFile(file, read(path.join(source, name)), opts)]);
  }

  const settingsFile = path.join(home, target.settings);
  const existing = fs.existsSync(settingsFile) ? JSON.parse(read(settingsFile)) : {};
  const fragment = JSON.parse(read(path.join(source, 'settings.hooks.json')));
  const merged = mergeSettings(existing, fragment, hooksDir.replaceAll('\\', '/'));
  results.push([settingsFile, writeFile(settingsFile, `${JSON.stringify(merged, null, 2)}\n`, opts)]);
  return results;
}

export function skillsArgs(repo, targets) {
  const args = ['-y', 'skills', 'add', repo, '-g', '--skill', '*', '-y'];
  for (const t of targets) args.push('-a', t.skillsAgent);
  return args;
}

export function selectTargets(names, home) {
  const unknown = names.filter((n) => !TARGETS[n]);
  if (unknown.length) throw new Error(`Unknown tool(s): ${unknown.join(', ')}. Known: ${Object.keys(TARGETS).join(', ')}`);
  if (names.length) return names.map((n) => TARGETS[n]);
  return Object.values(TARGETS).filter((t) => fs.existsSync(path.join(home, t.dir)));
}

export function install({ names = [], home = os.homedir(), repo = REPO, dryRun = false, skills = true, log = console.log }) {
  const targets = selectTargets(names, home);
  if (!targets.length) {
    log('No supported tools found. Name one explicitly, e.g. `node install/install.mjs claude`.');
    return [];
  }

  const opts = { dryRun };
  const results = [];
  for (const target of targets) {
    const file = path.join(home, target.instructions);
    results.push([file, writeFile(file, buildInstructions(repo, target), opts)]);
    if (target.hooksDir) results.push(...installClaudeHooks(repo, home, target, opts));
  }

  for (const [file, status] of results) log(`${dryRun ? '[dry-run] ' : ''}${status.padEnd(10)} ${file}`);

  if (skills) {
    const args = skillsArgs(repo, targets);
    if (dryRun) {
      log(`[dry-run] would run: npx ${args.join(' ')}`);
    } else {
      // npx is a .cmd shim on Windows, so it needs a shell; quote every argument.
      const r = spawnSync('npx', args.map((a) => `"${a}"`), { stdio: 'inherit', shell: true });
      if (r.status !== 0) throw new Error(`Skills install failed (npx skills exited ${r.status})`);
    }
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  try {
    const badFlags = argv.filter((a) => a.startsWith('--') && !['--dry-run', '--no-skills'].includes(a));
    if (badFlags.length) throw new Error(`Unknown option(s): ${badFlags.join(', ')}`);
    install({
      names: argv.filter((a) => !a.startsWith('--')),
      dryRun: argv.includes('--dry-run'),
      skills: !argv.includes('--no-skills'),
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
