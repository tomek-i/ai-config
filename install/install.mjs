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
// A UTF-8 BOM (e.g. from Windows PowerShell 5 `Set-Content -Encoding UTF8`)
// is dropped so JSON.parse and comparisons see the real content.
const read = (file) => fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');

function readJson(file) {
  try {
    return JSON.parse(read(file));
  } catch (err) {
    throw new Error(`${file} is not valid JSON (${err.message}). Fix it and re-run; nothing was changed.`);
  }
}

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

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Adds the repo's hooks and default permission mode to existing settings
// without touching anything else. Hooks already present (same command) are
// skipped, so later edits to an installed hook entry must be made by hand.
export function mergeSettings(existing, fragment, hooksDir) {
  if (!isObject(existing)) throw new Error('settings.json must contain a JSON object');
  const merged = structuredClone(existing);
  const resolved = JSON.parse(JSON.stringify(fragment).replaceAll('{{HOOKS_DIR}}', hooksDir));

  if (resolved.permissions?.defaultMode && !merged.permissions?.defaultMode) {
    merged.permissions = { ...merged.permissions, defaultMode: resolved.permissions.defaultMode };
  }

  merged.hooks ??= {};
  if (!isObject(merged.hooks)) throw new Error('settings.json: "hooks" must be an object');
  for (const [event, groups] of Object.entries(resolved.hooks ?? {})) {
    merged.hooks[event] ??= [];
    // Refuse rather than coerce, so the user's own hooks are never lost.
    if (!Array.isArray(merged.hooks[event])) throw new Error(`settings.json: "hooks.${event}" must be an array`);
    const commands = new Set(merged.hooks[event].flatMap((g) => (g.hooks ?? []).map((h) => h.command)));
    for (const group of groups) {
      if (!group.hooks.some((h) => commands.has(h.command))) merged.hooks[event].push(group);
    }
  }
  return merged;
}

// Returns the [file, content] pairs for Claude's hooks and merged settings.
export function planClaudeHooks(repo, home, target) {
  const writes = [];
  const hooksDir = path.join(home, target.hooksDir);
  const source = path.join(repo, 'hooks', 'claude');
  for (const name of fs.readdirSync(source).filter((f) => f.endsWith('.js'))) {
    writes.push([path.join(hooksDir, name), read(path.join(source, name))]);
  }

  const settingsFile = path.join(home, target.settings);
  const existing = fs.existsSync(settingsFile) ? readJson(settingsFile) : {};
  const fragment = readJson(path.join(source, 'settings.hooks.json'));
  let merged;
  try {
    merged = mergeSettings(existing, fragment, hooksDir.replaceAll('\\', '/'));
  } catch (err) {
    throw new Error(`${settingsFile}: ${err.message}. Fix it and re-run; nothing was changed.`);
  }
  writes.push([settingsFile, `${JSON.stringify(merged, null, 2)}\n`]);
  return writes;
}

export function skillsArgs(repo, targets) {
  const args = ['-y', 'skills', 'add', repo, '-g', '--skill', '*', '-y'];
  for (const t of targets) args.push('-a', t.skillsAgent);
  return args;
}

// One shell command string: npx is a .cmd shim on Windows, so it needs a shell,
// and passing an args array with `shell: true` is deprecated (DEP0190).
export const skillsCommand = (repo, targets) =>
  ['npx', ...skillsArgs(repo, targets).map((a) => `"${a}"`)].join(' ');

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

  // Build every file first so bad input (e.g. a broken settings.json) fails
  // before anything is written, instead of leaving a half-done install.
  const writes = [];
  for (const target of targets) {
    writes.push([path.join(home, target.instructions), buildInstructions(repo, target)]);
    if (target.hooksDir) writes.push(...planClaudeHooks(repo, home, target));
  }

  const results = [];
  for (const [file, content] of writes) {
    const status = writeFile(file, content, { dryRun });
    results.push([file, status]);
    log(`${dryRun ? '[dry-run] ' : ''}${status.padEnd(10)} ${file}`);
  }

  if (skills) {
    const command = skillsCommand(repo, targets);
    if (dryRun) {
      log(`[dry-run] would run: ${command}`);
    } else {
      const r = spawnSync(command, { stdio: 'inherit', shell: true });
      if (r.error) throw new Error(`Skills install failed: ${r.error.message}`);
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
