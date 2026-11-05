import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, test } from 'node:test';
import { HEADER, REPO, buildInstructions, install, mergeSettings, selectTargets, skillsArgs, writeFile } from './install.mjs';
import { TARGETS } from './targets.mjs';

let home;
const quiet = () => {};
const run = (opts) => install({ home, skills: false, log: quiet, ...opts });
const readHome = (rel) => fs.readFileSync(path.join(home, rel), 'utf8');

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-config-test-'));
});

test('instructions are global.md plus the tool overlay', () => {
  const global = fs.readFileSync(path.join(REPO, 'instructions', 'global.md'), 'utf8').replace(/\r\n/g, '\n');
  const overlay = fs.readFileSync(path.join(REPO, 'instructions', 'claude-code.md'), 'utf8').replace(/\r\n/g, '\n');
  const out = buildInstructions(REPO, TARGETS.claude);
  assert.ok(out.startsWith(HEADER));
  assert.ok(out.includes(global.trimEnd()));
  assert.ok(out.includes(overlay.trimEnd()));
  assert.ok(!out.includes('\r'));
});

test('a tool without an overlay gets only global.md', () => {
  const out = buildInstructions(REPO, TARGETS.codex);
  assert.ok(!out.includes('## Claude Code'));
});

test('installs only for tools whose config folder exists', () => {
  fs.mkdirSync(path.join(home, '.codex'));
  run({});
  assert.ok(fs.existsSync(path.join(home, '.codex', 'AGENTS.md')));
  assert.ok(!fs.existsSync(path.join(home, '.claude')));
});

test('named tools are installed even when their folder is missing', () => {
  run({ names: ['opencode'] });
  assert.ok(fs.existsSync(path.join(home, '.config', 'opencode', 'AGENTS.md')));
});

test('unknown tool names are rejected', () => {
  assert.throws(() => selectTargets(['cursor'], home), /Unknown tool/);
});

test('an existing, different file is backed up before overwriting', () => {
  const file = path.join(home, 'x.md');
  fs.writeFileSync(file, 'mine');
  assert.equal(writeFile(file, 'new', { now: 1 }), 'backed-up');
  assert.equal(fs.readFileSync(`${file}.bak-1`, 'utf8'), 'mine');
  assert.equal(fs.readFileSync(file, 'utf8'), 'new');
});

test('an identical file is left untouched and not backed up', () => {
  const file = path.join(home, 'x.md');
  fs.writeFileSync(file, 'same\r\n');
  assert.equal(writeFile(file, 'same\n'), 'unchanged');
  assert.deepEqual(fs.readdirSync(home), ['x.md']);
});

test('dry run writes nothing', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'mine');
  const results = run({ dryRun: true });
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude')), ['CLAUDE.md']);
  assert.equal(readHome('.claude/CLAUDE.md'), 'mine');
  assert.ok(results.some(([, status]) => status === 'backed-up'));
});

test('claude install copies hooks and merges settings', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(
    path.join(home, '.claude', 'settings.json'),
    JSON.stringify({ model: 'opus', permissions: { defaultMode: 'plan', allow: ['Bash(ls)'] } }),
  );
  run({});
  assert.ok(fs.existsSync(path.join(home, '.claude', 'hooks', 'biome-format.js')));
  const settings = JSON.parse(readHome('.claude/settings.json'));
  assert.equal(settings.model, 'opus');
  assert.equal(settings.permissions.defaultMode, 'plan', 'existing mode is kept');
  assert.deepEqual(settings.permissions.allow, ['Bash(ls)']);
  assert.match(settings.hooks.Stop[0].hooks[0].command, /dev-ports-check\.js/);
  assert.ok(!settings.hooks.Stop[0].hooks[0].command.includes('{{HOOKS_DIR}}'));
});

test('re-running the install changes nothing', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  run({});
  const before = readHome('.claude/settings.json');
  const results = run({});
  assert.equal(readHome('.claude/settings.json'), before);
  assert.ok(results.every(([, status]) => status === 'unchanged'));
});

test('settings merge keeps existing hooks and does not duplicate ours', () => {
  const fragment = {
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node "{{HOOKS_DIR}}/a.js"' }] }] },
  };
  const existing = {
    hooks: {
      Stop: [
        { hooks: [{ type: 'command', command: 'other' }] },
        { hooks: [{ type: 'command', command: 'node "/h/a.js"' }] },
      ],
    },
  };
  const merged = mergeSettings(existing, fragment, '/h');
  assert.equal(merged.hooks.Stop.length, 2);
  assert.equal(existing.hooks.Stop.length, 2, 'input is not mutated');
});

test('settings merge sets the default mode only when missing', () => {
  const fragment = { permissions: { defaultMode: 'auto' } };
  assert.equal(mergeSettings({}, fragment, '/h').permissions.defaultMode, 'auto');
});

test('skills are installed for every selected tool', () => {
  const args = skillsArgs('/repo', [TARGETS.claude, TARGETS.copilot]);
  assert.deepEqual(args.slice(0, 4), ['-y', 'skills', 'add', '/repo']);
  assert.ok(args.includes('-g'));
  assert.deepEqual(
    args.filter((_, i) => args[i - 1] === '-a'),
    ['claude-code', 'github-copilot'],
  );
});
