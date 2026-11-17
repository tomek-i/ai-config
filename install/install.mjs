#!/usr/bin/env node
// Installs this repo's global instructions into each AI tool, and its skills
// into every tool except Claude Code, which gets skills and hooks from the
// plugin marketplace (.claude-plugin/marketplace.json).
//
//   node install/install.mjs                     all tools whose config folder exists
//   node install/install.mjs claude codex        only these tools
//   node install/install.mjs --dry-run           show what would change, write nothing
//   node install/install.mjs --no-skills         skip the skills step
//   node install/install.mjs --only=a,b          install only these skills
//   node install/install.mjs --skip=pull-request install every skill but these
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TARGETS } from './targets.mjs';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HEADER = '<!-- Generated from ai-config. Edit the repo, not this file. -->';
export const MARKETPLACE = 'tomek-i/ai-config';

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

  if (!resolved.hooks) return merged;
  merged.hooks ??= {};
  if (!isObject(merged.hooks)) throw new Error('settings.json: "hooks" must be an object');
  for (const [event, groups] of Object.entries(resolved.hooks)) {
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

// Removes the hook entries older versions of this installer added
// (`node "<hooksDir>/<script>"`); the dev-hooks plugin runs them now. Other
// hooks are kept, and groups or events only disappear when emptied here.
export function removeOldHooks(settings, hooksDir, scripts) {
  const old = new Set(scripts.map((s) => `node "${hooksDir}/${s}"`));
  const out = structuredClone(settings);
  let removed = 0;
  for (const [event, groups] of Object.entries(out.hooks ?? {})) {
    if (!Array.isArray(groups)) continue;
    const kept = [];
    for (const group of groups) {
      const hooks = group.hooks ?? [];
      const left = hooks.filter((h) => !old.has(h.command));
      removed += hooks.length - left.length;
      if (left.length !== hooks.length && left.length === 0) continue;
      kept.push(left.length === hooks.length ? group : { ...group, hooks: left });
    }
    if (kept.length) out.hooks[event] = kept;
    else if (groups.length) delete out.hooks[event];
  }
  return { settings: out, removed };
}

// Minimal front matter parser: top-level `key: value` lines between the first two `---`.
export function frontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text.replace(/\r\n/g, '\n'));
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const v = kv[2].trim();
    const quoted = /^(["'])(.*)\1/.exec(v);
    out[kv[1]] = quoted ? quoted[2] : v.replace(/\s+#.*$/, '');
  }
  return out;
}

// True when no link sits anywhere on the way to p, so renaming p moves p
// itself, not the target of a linked parent (e.g. ~/.claude/skills linked to
// a repo checkout). Unresolvable paths count as not plain.
export function isPlainPath(p) {
  try {
    const real = fs.realpathSync.native(p);
    const want = path.resolve(p);
    return process.platform === 'win32' ? real.toLowerCase() === want.toLowerCase() : real === want;
  } catch {
    return false;
  }
}

const hookCommands = (settings) =>
  Object.values(isObject(settings?.hooks) ? settings.hooks : {})
    .filter(Array.isArray)
    .flatMap((groups) => groups.flatMap((g) => (Array.isArray(g?.hooks) ? g.hooks.map((h) => String(h?.command ?? '')) : [])));

export const repoSkills = (repo) =>
  fs.readdirSync(path.join(repo, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

// Plans Claude's settings (default mode, old hook entries removed) and the
// moves that retire what older installs put in place: hook scripts and
// hand-copied skill folders. Returns { writes: [file, content][], moves: [from, to][] }.
export function planClaude(repo, home, target, now = Date.now()) {
  const source = path.join(repo, 'hooks', 'claude');
  const scripts = fs.readdirSync(source).filter((f) => f.endsWith('.js'));
  const hooksDir = path.join(home, target.hooksDir);

  const settingsFile = path.join(home, target.settings);
  const existing = fs.existsSync(settingsFile) ? readJson(settingsFile) : {};
  const fragment = readJson(path.join(source, 'settings.hooks.json'));
  let merged;
  try {
    merged = removeOldHooks(mergeSettings(existing, fragment, hooksDir.replaceAll('\\', '/')), hooksDir.replaceAll('\\', '/'), scripts).settings;
  } catch (err) {
    throw new Error(`${settingsFile}: ${err.message}. Fix it and re-run; nothing was changed.`);
  }

  // A script stays while any hook we leave in place still runs it: an entry
  // the user edited, or one in settings.local.json. An unreadable local file
  // counts as using everything, so nothing breaks.
  const localFile = path.join(path.dirname(settingsFile), 'settings.local.json');
  let remaining = hookCommands(merged);
  let localUnreadable = false;
  if (fs.existsSync(localFile)) {
    try {
      remaining = remaining.concat(hookCommands(JSON.parse(read(localFile))));
    } catch {
      localUnreadable = true;
    }
  }
  const norm = (s) => {
    const fwd = s.replaceAll('\\', '/');
    return process.platform === 'win32' ? fwd.toLowerCase() : fwd;
  };
  const stillUsed = (script) =>
    localUnreadable || remaining.some((c) => norm(c).includes(norm(`${hooksDir}/${script}`)));

  const moves = [];
  for (const script of scripts) {
    const file = path.join(hooksDir, script);
    if (fs.existsSync(file) && isPlainPath(file) && !stillUsed(script)) moves.push([file, `${file}.bak-${now}`]);
  }
  // A backup inside the skills folder would still load as a skill, so stale
  // copies go to a sibling folder. Links (e.g. from `npx skills`, or a linked
  // skills folder) and folders of another skill with the same name are left alone.
  for (const name of repoSkills(repo)) {
    const dir = path.join(home, target.skillsDir, name);
    const skillFile = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(skillFile) || !isPlainPath(dir)) continue;
    if (frontMatter(read(skillFile))?.name !== name) continue;
    moves.push([dir, path.join(home, target.skillsBackupDir, `${name}-${now}`)]);
  }
  return { writes: [[settingsFile, `${JSON.stringify(merged, null, 2)}\n`]], moves };
}

// Resolves --only / --skip into the skill names to install, or ['*'] for all.
export function selectSkills(repo, { only = [], skip = [] } = {}) {
  if (only.length && skip.length) throw new Error('Use --only or --skip, not both.');
  const all = repoSkills(repo);
  const unknown = [...only, ...skip].filter((n) => !all.includes(n));
  if (unknown.length) throw new Error(`Unknown skill(s): ${unknown.join(', ')}. Known: ${all.join(', ')}`);
  if (only.length) return only;
  if (!skip.length) return ['*'];
  const rest = all.filter((n) => !skip.includes(n));
  if (!rest.length) throw new Error('--skip leaves no skills to install.');
  return rest;
}

// Only targets with a skillsAgent get skills from npx; Claude Code has none.
export function skillsArgs(repo, targets, skills = ['*']) {
  const args = ['-y', 'skills', 'add', repo, '-g'];
  for (const s of skills) args.push('--skill', s);
  args.push('-y');
  for (const t of targets) if (t.skillsAgent) args.push('-a', t.skillsAgent);
  return args;
}

// One shell command string: npx is a .cmd shim on Windows, so it needs a shell,
// and passing an args array with `shell: true` is deprecated (DEP0190).
export const skillsCommand = (repo, targets, skills) =>
  ['npx', ...skillsArgs(repo, targets, skills).map((a) => `"${a}"`)].join(' ');

export function selectTargets(names, home) {
  const unknown = names.filter((n) => !TARGETS[n]);
  if (unknown.length) throw new Error(`Unknown tool(s): ${unknown.join(', ')}. Known: ${Object.keys(TARGETS).join(', ')}`);
  if (names.length) return names.map((n) => TARGETS[n]);
  return Object.values(TARGETS).filter((t) => fs.existsSync(path.join(home, t.dir)));
}

export function install({
  names = [], home = os.homedir(), repo = REPO, dryRun = false, skills = true, only = [], skip = [],
  log = console.log, now = Date.now(),
}) {
  const targets = selectTargets(names, home);
  const skillNames = selectSkills(repo, { only, skip });
  if (!targets.length) {
    log('No supported tools found. Name one explicitly, e.g. `node install/install.mjs claude`.');
    return [];
  }

  // Plan everything first so bad input (e.g. a broken settings.json) fails
  // before anything is written, instead of leaving a half-done install.
  const writes = [];
  const moves = [];
  for (const target of targets) {
    writes.push([path.join(home, target.instructions), buildInstructions(repo, target)]);
    if (target.settings) {
      const plan = planClaude(repo, home, target, now);
      writes.push(...plan.writes);
      moves.push(...plan.moves);
    }
  }

  const prefix = dryRun ? '[dry-run] ' : '';
  const results = [];
  for (const [file, content] of writes) {
    const status = writeFile(file, content, { dryRun, now });
    results.push([file, status]);
    log(`${prefix}${status.padEnd(10)} ${file}`);
  }
  // A move can fail on Windows (EPERM/EBUSY while Claude Code or a terminal
  // holds the folder). Keep going, report each failure, and fail at the end;
  // a re-run picks up what is left.
  const failed = [];
  for (const [from, to] of moves) {
    try {
      if (!dryRun) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.renameSync(from, to);
      }
      results.push([from, 'moved']);
      log(`${prefix}${'moved'.padEnd(10)} ${from} -> ${to}`);
    } catch (err) {
      failed.push(`${from}: ${err.code ?? err.message}`);
      results.push([from, 'failed']);
      log(`${'failed'.padEnd(10)} ${from} (${err.code ?? err.message})`);
    }
  }

  const skillTargets = targets.filter((t) => t.skillsAgent);
  if (targets.some((t) => !t.skillsAgent)) {
    log(`Claude Code: skills and hooks come from the plugin marketplace. In Claude Code run
  /plugin marketplace add ${MARKETPLACE}
then pick the plugins you want in /plugin.`);
    if ((only.length || skip.length) && !skillTargets.length) {
      log('--only / --skip only apply to the other tools; for Claude Code pick plugins in /plugin.');
    }
  }

  if (skills && skillTargets.length) {
    const command = skillsCommand(repo, skillTargets, skillNames);
    if (dryRun) {
      log(`[dry-run] would run: ${command}`);
    } else {
      const r = spawnSync(command, { stdio: 'inherit', shell: true });
      if (r.error) throw new Error(`Skills install failed: ${r.error.message}`);
      if (r.status !== 0) throw new Error(`Skills install failed (npx skills exited ${r.status})`);
    }
  }
  if (failed.length) {
    throw new Error(`Could not move ${failed.length} item(s); close what holds them and re-run:\n  ${failed.join('\n  ')}`);
  }
  return results;
}

// `--only=a,b` -> ['a', 'b']. A flag given with nothing after the = is an
// error, so `--only=` can't silently mean "everything".
export function listFlag(argv, flag) {
  const given = argv.filter((a) => a.startsWith(`${flag}=`));
  const list = given.flatMap((a) => a.slice(flag.length + 1).split(',')).map((s) => s.trim()).filter(Boolean);
  if (given.length && !list.length) throw new Error(`${flag}= needs at least one skill name, e.g. ${flag}=ux-review`);
  return list;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  try {
    const badFlags = argv.filter(
      (a) => a.startsWith('--') && !['--dry-run', '--no-skills'].includes(a) && !/^--(only|skip)=/.test(a),
    );
    if (badFlags.length) throw new Error(`Unknown option(s): ${badFlags.join(', ')}. Lists take an =, e.g. --skip=pull-request`);
    install({
      names: argv.filter((a) => !a.startsWith('--')),
      dryRun: argv.includes('--dry-run'),
      skills: !argv.includes('--no-skills'),
      only: listFlag(argv, '--only'),
      skip: listFlag(argv, '--skip'),
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
