// Guards for the repo's content: skills, hooks and public-repo hygiene.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { REPO, frontMatter, repoSkills } from './install.mjs';

const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
const skillNames = () => repoSkills(REPO);

// Files a skill says live in its own folder: `scripts/...` style paths, and
// backticked names in a sentence that says "this skill folder".
export function skillFileRefs(text) {
  const refs = new Set();
  for (const m of text.matchAll(/(?<![\w./-])((?:scripts|references|assets)\/[\w.-]+(?:\/[\w.-]+)*\.\w+)/g)) refs.add(m[1]);
  for (const sentence of text.split(/(?<=[.!?])\s+|\n\n/)) {
    if (!/this skill folder/i.test(sentence)) continue;
    for (const m of sentence.matchAll(/`([\w.-]+\.\w+)`/g)) refs.add(m[1]);
  }
  return [...refs];
}

// Paths into an installed tool's config folder; skills must not depend on them.
export const TOOL_PATH = /(?:~|\$HOME|%USERPROFILE%)[\\/]\.(?:claude|codex|agents|copilot|config[\\/]opencode)\b/;

test('every skill has front matter with a matching name and a description', () => {
  const names = skillNames();
  assert.ok(names.length > 0);
  for (const name of names) {
    const file = path.join('skills', name, 'SKILL.md');
    assert.ok(fs.existsSync(path.join(REPO, file)), `${file} missing`);
    const fm = frontMatter(read(file));
    assert.ok(fm, `${file}: no front matter`);
    assert.equal(fm.name, name, `${file}: name must match the folder`);
    assert.ok(fm.description, `${file}: description missing`);
  }
});

test('skills only reference files in their own folder', () => {
  for (const name of skillNames()) {
    const file = path.join('skills', name, 'SKILL.md');
    const text = read(file);
    assert.doesNotMatch(text, TOOL_PATH, `${file}: points at an installed tool folder`);
    for (const ref of skillFileRefs(text)) {
      assert.ok(fs.existsSync(path.join(REPO, 'skills', name, ref)), `${file}: references missing file ${ref}`);
    }
  }
});

test('skill reference helpers', () => {
  assert.deepEqual(frontMatter('---\nname: a\ndescription: "b c"\n---\n# A\n'), { name: 'a', description: 'b c' });
  assert.equal(frontMatter('# no front matter\n'), null);
  assert.deepEqual(
    skillFileRefs('Run `scripts/up.js` now.\n\nCopy `template.html` from this skill folder to `./out/index.html`.'),
    ['scripts/up.js', 'template.html'],
  );
  assert.match('Copy ~/.claude/skills/x/template.html', TOOL_PATH);
  assert.match('%USERPROFILE%\\.codex\\AGENTS.md', TOOL_PATH);
  assert.doesNotMatch('./docs/ux-review/index.html', TOOL_PATH);
});

// The repo is public: nothing machine-specific or secret in tracked files.
export const LEAKS = [
  ['Windows user path', /\b[A-Za-z]:[\\/]+Users[\\/]+(?!<)[^\\/\s`'"]+/i],
  ['macOS user path', /(?<![\w.])\/Users\/(?!<)[A-Za-z0-9._-]+/],
  ['Linux home path', /(?<![\w.])\/home\/(?!<)[A-Za-z0-9._-]+/],
  ['email address', /\b(?!git@)[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net)\b)(?!users\.noreply\.github\.com\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['Anthropic / OpenAI key', /\bsk-(?:ant-)?[A-Za-z0-9_-]{24,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

export function findLeaks(text) {
  return LEAKS.filter(([, re]) => re.test(text)).map(([label]) => label);
}

test('tracked files contain no machine paths, emails or secrets', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: REPO, encoding: 'utf8' }).split('\0').filter(Boolean);
  const hits = [];
  for (const file of files) {
    const buf = fs.readFileSync(path.join(REPO, file));
    if (buf.includes(0)) continue; // binary
    const text = buf.toString('utf8');
    text.split('\n').forEach((line, i) => {
      for (const label of findLeaks(line)) hits.push(`${file}:${i + 1} ${label}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('leak patterns catch the real thing and allow placeholders', () => {
  // Built from parts so this file doesn't trip its own scan.
  const user = ['C:', 'Users', 'someone', 'x'].join('\\');
  assert.deepEqual(findLeaks(user), ['Windows user path']);
  assert.deepEqual(findLeaks(['', 'Users', 'someone', 'x'].join('/')), ['macOS user path']);
  assert.deepEqual(findLeaks(['', 'home', 'someone'].join('/')), ['Linux home path']);
  assert.deepEqual(findLeaks(`mail ${'someone'}@${'gmail.com'}`), ['email address']);
  assert.deepEqual(findLeaks(`token ${'ghp_'}${'a'.repeat(36)}`), ['GitHub token']);
  assert.deepEqual(findLeaks(`key ${'sk-ant-'}${'a'.repeat(30)}`), ['Anthropic / OpenAI key']);
  assert.deepEqual(findLeaks(`-----BEGIN ${'RSA PRIVATE'} KEY-----`), ['private key']);
  assert.deepEqual(findLeaks('contact@example.com, /Users/<name>/, C:\\Users\\<you>, ./home/x, git@github.com:a/b'), []);
});

test('hook scripts parse and every configured hook points at one', () => {
  const dir = path.join(REPO, 'hooks', 'claude');
  const scripts = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  assert.ok(scripts.length > 0);
  for (const script of scripts) {
    const r = spawnSync(process.execPath, ['--check', path.join(dir, script)], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${script} does not parse:\n${r.stderr}`);
  }
  // The dev-hooks plugin is rooted at hooks/claude, so its hooks.json sits in
  // the default spot (hooks/hooks.json under the plugin root) and the scripts
  // are next to the root. The installer's settings fragment carries no hooks.
  const plugin = JSON.parse(read('hooks/claude/hooks/hooks.json'));
  const commands = Object.values(plugin.hooks ?? {}).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
  assert.ok(commands.length > 0);
  for (const command of commands) {
    const m = /\$\{CLAUDE_PLUGIN_ROOT\}\/([\w.-]+\.js)"/.exec(command);
    assert.ok(m, `hook command does not run a script from hooks/claude: ${command}`);
    assert.ok(scripts.includes(m[1]), `hook command points at missing ${m[1]}`);
  }
  assert.equal(JSON.parse(read('hooks/claude/settings.hooks.json')).hooks, undefined);
});

test('the marketplace lists every skill once and every entry points at a real folder', () => {
  const market = JSON.parse(read('.claude-plugin/marketplace.json'));
  assert.ok(market.name && market.owner?.name);
  const names = market.plugins.map((p) => p.name);
  assert.equal(new Set(names).size, names.length, 'plugin names are unique');
  const listed = [];
  for (const p of market.plugins) {
    assert.ok(p.description, `${p.name}: description missing`);
    if (p.name === 'dev-hooks') continue;
    // Rooted at the repo, a plugin without an explicit skills list would load every skill.
    assert.equal(p.source, './', `${p.name}: source must be ./ (the repo root)`);
    assert.ok(p.skills?.length, `${p.name}: must list its skills`);
    for (const rel of p.skills) {
      assert.ok(fs.existsSync(path.join(REPO, rel, 'SKILL.md')), `${p.name}: ${rel} has no SKILL.md`);
      listed.push(path.basename(rel));
    }
  }
  assert.deepEqual(listed.sort(), skillNames().sort(), 'every skill folder has exactly one marketplace entry');

  // The hooks plugin gets its own root so it picks up no skills, and the repo
  // root has no hooks/hooks.json, which every skill plugin would load.
  const hooks = market.plugins.find((p) => p.name === 'dev-hooks');
  assert.equal(hooks?.source, './hooks/claude');
  assert.ok(fs.existsSync(path.join(REPO, 'hooks', 'claude', 'hooks', 'hooks.json')));
  assert.ok(!fs.existsSync(path.join(REPO, 'hooks', 'hooks.json')), 'hooks/hooks.json at the root would load in every plugin');
  assert.equal(fs.readdirSync(path.join(REPO, 'hooks', 'claude')).some((f) => f === 'skills' || f === 'SKILL.md'), false);
});
