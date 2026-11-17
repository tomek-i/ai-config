import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import {
  HEADER, MARKETPLACE, REPO, buildInstructions, install, mergeSettings, removeOldHooks, repoSkills, selectSkills, selectTargets,
  frontMatter, listFlag, skillsArgs, skillsCommand, writeFile,
} from './install.mjs';
import { TARGETS } from './targets.mjs';

let home;
const quiet = () => {};
const run = (opts) => install({ home, skills: false, log: quiet, ...opts });
const readHome = (rel) => fs.readFileSync(path.join(home, rel), 'utf8');

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-config-test-'));
});

afterEach(() => {
  fs.rmSync(home, { recursive: true, force: true });
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

test('claude install merges settings and leaves hooks to the plugin', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(
    path.join(home, '.claude', 'settings.json'),
    JSON.stringify({ model: 'opus', permissions: { defaultMode: 'plan', allow: ['Bash(ls)'] } }),
  );
  run({});
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'hooks')));
  const settings = JSON.parse(readHome('.claude/settings.json'));
  assert.equal(settings.model, 'opus');
  assert.equal(settings.permissions.defaultMode, 'plan', 'existing mode is kept');
  assert.deepEqual(settings.permissions.allow, ['Bash(ls)']);
  assert.equal(settings.hooks, undefined);
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

test('skills are installed for every selected tool except Claude Code', () => {
  const args = skillsArgs('/repo', [TARGETS.claude, TARGETS.codex, TARGETS.copilot]);
  assert.deepEqual(args.slice(0, 4), ['-y', 'skills', 'add', '/repo']);
  assert.ok(args.includes('-g'));
  assert.deepEqual(
    args.filter((_, i) => args[i - 1] === '-a'),
    ['codex', 'github-copilot'],
  );
});

test('a Claude-only install runs no skills command and points at the marketplace', () => {
  const lines = [];
  const results = install({ home, names: ['claude'], skills: true, log: (l) => lines.push(l) });
  assert.ok(results.length > 0);
  assert.ok(!lines.some((l) => l.includes('npx')));
  assert.ok(lines.some((l) => l.includes(`/plugin marketplace add ${MARKETPLACE}`)));
});

test('--only and --skip pick the skills passed to npx skills', () => {
  const all = repoSkills(REPO);
  assert.ok(all.includes('pull-request'));
  assert.deepEqual(selectSkills(REPO), ['*']);
  assert.deepEqual(selectSkills(REPO, { only: ['ux-review', 'ui-review'] }), ['ux-review', 'ui-review']);
  assert.deepEqual(selectSkills(REPO, { skip: ['pull-request'] }), all.filter((n) => n !== 'pull-request'));
  const args = skillsArgs('/repo', [TARGETS.codex], ['ux-review', 'ui-review']);
  assert.deepEqual(args.filter((_, i) => args[i - 1] === '--skill'), ['ux-review', 'ui-review']);
});

test('--only and --skip reject unknown skills, both at once, and skipping everything', () => {
  assert.throws(() => selectSkills(REPO, { only: ['nope'] }), /Unknown skill\(s\): nope/);
  assert.throws(() => selectSkills(REPO, { skip: ['nope'] }), /Unknown skill/);
  assert.throws(() => selectSkills(REPO, { only: ['ux-review'], skip: ['ui-review'] }), /not both/);
  assert.throws(() => selectSkills(REPO, { skip: repoSkills(REPO) }), /no skills/);
  assert.throws(() => run({ only: ['nope'] }), /Unknown skill/);
});

test('dry run leaves settings and hooks untouched', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{"model":"opus"}');
  run({ dryRun: true });
  assert.equal(readHome('.claude/settings.json'), '{"model":"opus"}');
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'hooks')));
});

test('settings.json with a BOM is merged', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '\uFEFF{"model":"opus"}');
  run({});
  const settings = JSON.parse(readHome('.claude/settings.json'));
  assert.equal(settings.model, 'opus');
  assert.equal(settings.permissions.defaultMode, 'auto');
});

test('invalid settings.json fails before anything is written', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{ // comment\n}');
  assert.throws(() => run({}), /settings\.json is not valid JSON.*nothing was changed/);
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude')), ['settings.json']);
});

test('a hooks event that is not an array fails the merge', () => {
  const fragment = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'x' }] }] } };
  assert.throws(() => mergeSettings({ hooks: { Stop: {} } }, fragment, '/h'), /"hooks\.Stop" must be an array/);
});

test('hooks the installer did not add are left exactly as they are', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{"hooks":{"Stop":{},"Odd":[{"matcher":"x"}]}}');
  run({});
  const settings = JSON.parse(readHome('.claude/settings.json'));
  assert.deepEqual(settings.hooks, { Stop: {}, Odd: [{ matcher: 'x' }] });
});

test('existing hook groups without a hooks list are kept', () => {
  const fragment = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'x' }] }] } };
  const merged = mergeSettings({ hooks: { Stop: [{ matcher: 'odd' }] } }, fragment, '/h');
  assert.deepEqual(merged.hooks.Stop, [{ matcher: 'odd' }, fragment.hooks.Stop[0]]);
});

// What older versions of the installer left behind (hook commands with forward slashes).
function oldInstall() {
  const hooksDir = path.join(home, '.claude', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  for (const f of ['biome-format.js', 'dev-ports-check.js']) fs.writeFileSync(path.join(hooksDir, f), '// old');
  const cmd = (f) => `node "${hooksDir.replaceAll('\\', '/')}/${f}"`;
  const settings = {
    model: 'opus',
    hooks: {
      PostToolUse: [
        { matcher: 'Edit|Write', hooks: [{ type: 'command', command: cmd('biome-format.js'), timeout: 30 }] },
        { hooks: [{ type: 'command', command: 'other' }] },
      ],
      Stop: [{ hooks: [{ type: 'command', command: cmd('dev-ports-check.js') }, { type: 'command', command: 'mine' }] }],
      SessionStart: [{ hooks: [{ type: 'command', command: cmd('dev-ports-check.js') }] }],
    },
  };
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), JSON.stringify(settings));
}

function skillFolder(name, frontName = name) {
  const dir = path.join(home, '.claude', 'skills', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\r\nname: ${frontName}\r\ndescription: x\r\n---\r\n`);
  return dir;
}

test('hook entries and scripts from older installs are retired, other hooks kept', () => {
  oldInstall();
  run({ now: 5 });
  const settings = JSON.parse(readHome('.claude/settings.json'));
  assert.equal(settings.model, 'opus');
  assert.deepEqual(settings.hooks, {
    PostToolUse: [{ hooks: [{ type: 'command', command: 'other' }] }],
    Stop: [{ hooks: [{ type: 'command', command: 'mine' }] }],
  });
  assert.ok(fs.existsSync(path.join(home, '.claude', 'settings.json.bak-5')), 'settings backed up');
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude', 'hooks')).sort(), [
    'biome-format.js.bak-5',
    'dev-ports-check.js.bak-5',
  ]);
  const again = run({ now: 6 });
  assert.ok(again.every(([, status]) => status === 'unchanged'));
});

test('hand-copied skill folders move out of the skills folder', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  skillFolder('ux-review');
  skillFolder('github-issue', 'someone-elses-skill');
  skillFolder('my-own');
  const results = run({ now: 7 });
  assert.ok(results.some(([file, status]) => file.endsWith('ux-review') && status === 'moved'));
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude', 'skills')).sort(), ['github-issue', 'my-own']);
  assert.ok(fs.existsSync(path.join(home, '.claude', 'skills-backup', 'ux-review-7', 'SKILL.md')));
});

test('symlinked skill folders are left alone', () => {
  fs.mkdirSync(path.join(home, '.claude', 'skills'), { recursive: true });
  const real = path.join(home, 'real-ux-review');
  fs.mkdirSync(real);
  fs.writeFileSync(path.join(real, 'SKILL.md'), '---\nname: ux-review\n---\n');
  fs.symlinkSync(real, path.join(home, '.claude', 'skills', 'ux-review'), 'junction');
  run({});
  assert.ok(fs.lstatSync(path.join(home, '.claude', 'skills', 'ux-review')).isSymbolicLink());
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'skills-backup')));
});

test('dry run retires nothing', () => {
  oldInstall();
  skillFolder('ux-review');
  const before = readHome('.claude/settings.json');
  const results = run({ dryRun: true });
  assert.equal(results.filter(([, status]) => status === 'moved').length, 3);
  assert.equal(readHome('.claude/settings.json'), before);
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude', 'hooks')).sort(), ['biome-format.js', 'dev-ports-check.js']);
  assert.ok(fs.existsSync(path.join(home, '.claude', 'skills', 'ux-review', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(home, '.claude', 'skills-backup')));
});

test('removing old hooks only touches exact installer commands', () => {
  const settings = { hooks: { Stop: [{ hooks: [{ command: 'node "/h/a.js" --extra' }, { command: 'node "/h/a.js"' }] }] } };
  const { settings: out, removed } = removeOldHooks(settings, '/h', ['a.js']);
  assert.equal(removed, 1);
  assert.deepEqual(out.hooks.Stop, [{ hooks: [{ command: 'node "/h/a.js" --extra' }] }]);
  assert.equal(settings.hooks.Stop[0].hooks.length, 2, 'input is not mutated');
});

test('the skills command quotes every argument', () => {
  const command = skillsCommand('C:/My Repo', [TARGETS.codex]);
  assert.equal(command, 'npx "-y" "skills" "add" "C:/My Repo" "-g" "--skill" "*" "-y" "-a" "codex"');
});

// Review findings: migration must never break a hook still in use, never move
// through a linked folder, and must report rather than half-fail.

test('a hook script still run by an edited entry or settings.local.json is kept', () => {
  oldInstall();
  const file = path.join(home, '.claude', 'settings.json');
  const settings = JSON.parse(fs.readFileSync(file, 'utf8'));
  // The user added an argument to the Stop hook, so it no longer matches exactly.
  settings.hooks.Stop[0].hooks[0].command += ' --verbose';
  fs.writeFileSync(file, JSON.stringify(settings));
  const local = { hooks: { PreToolUse: [{ hooks: [{ command: settings.hooks.PostToolUse[0].hooks[0].command }] }] } };
  fs.writeFileSync(path.join(home, '.claude', 'settings.local.json'), JSON.stringify(local));
  run({ now: 8 });
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude', 'hooks')).sort(), ['biome-format.js', 'dev-ports-check.js']);
  const after = JSON.parse(readHome('.claude/settings.json'));
  assert.match(after.hooks.Stop[0].hooks[0].command, /--verbose/, 'edited entry kept');
});

test('an unreadable settings.local.json keeps every hook script', () => {
  oldInstall();
  fs.writeFileSync(path.join(home, '.claude', 'settings.local.json'), '{ broken');
  run({ now: 8 });
  assert.deepEqual(fs.readdirSync(path.join(home, '.claude', 'hooks')).sort(), ['biome-format.js', 'dev-ports-check.js']);
});

test('nothing is moved through a linked skills or hooks folder', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  // e.g. ~/.claude/skills linked to a checkout of this repo's skills/
  const realSkills = path.join(home, 'checkout', 'skills');
  fs.mkdirSync(path.join(realSkills, 'ux-review'), { recursive: true });
  fs.writeFileSync(path.join(realSkills, 'ux-review', 'SKILL.md'), '---\nname: ux-review\n---\n');
  fs.symlinkSync(realSkills, path.join(home, '.claude', 'skills'), 'junction');
  const realHooks = path.join(home, 'checkout', 'hooks');
  fs.mkdirSync(realHooks);
  fs.writeFileSync(path.join(realHooks, 'biome-format.js'), '// repo');
  fs.symlinkSync(realHooks, path.join(home, '.claude', 'hooks'), 'junction');
  const results = run({ now: 9 });
  assert.ok(!results.some(([, status]) => status === 'moved'));
  assert.ok(fs.existsSync(path.join(realSkills, 'ux-review', 'SKILL.md')));
  assert.deepEqual(fs.readdirSync(realHooks), ['biome-format.js']);
});

test('a move that fails is reported, the rest still happen, and the run fails at the end', () => {
  fs.mkdirSync(path.join(home, '.claude'));
  skillFolder('ux-review');
  skillFolder('ui-review');
  // An existing, non-empty target makes this rename fail.
  const blocked = path.join(home, '.claude', 'skills-backup', 'ux-review-9');
  fs.mkdirSync(blocked, { recursive: true });
  fs.writeFileSync(path.join(blocked, 'keep'), 'x');
  const lines = [];
  assert.throws(() => install({ home, skills: false, now: 9, log: (l) => lines.push(l) }), /Could not move 1 item/);
  assert.ok(fs.existsSync(path.join(home, '.claude', 'skills-backup', 'ui-review-9', 'SKILL.md')), 'other moves done');
  assert.ok(fs.existsSync(path.join(home, '.claude', 'skills', 'ux-review', 'SKILL.md')), 'failed one left in place');
  assert.ok(lines.some((l) => l.startsWith('failed')));
  assert.ok(lines.some((l) => l.includes('/plugin marketplace add')), 'hint still shown');
});

test('an empty --only= or --skip= is an error, not "everything"', () => {
  assert.throws(() => listFlag(['--only='], '--only'), /needs at least one skill/);
  assert.throws(() => listFlag(['--skip=,'], '--skip'), /needs at least one skill/);
  assert.deepEqual(listFlag(['claude', '--only=a, b', '--only=c'], '--only'), ['a', 'b', 'c']);
  assert.deepEqual(listFlag(['--dry-run'], '--only'), []);
});

test('--only on a Claude-only run says it does not apply there', () => {
  const lines = [];
  install({ home, names: ['claude'], skills: true, only: ['ux-review'], log: (l) => lines.push(l) });
  assert.ok(lines.some((l) => l.includes('--only / --skip only apply to the other tools')));
});

test('front matter without a trailing newline or with a comment is read', () => {
  assert.deepEqual(frontMatter('---\nname: ux-review\n---'), { name: 'ux-review' });
  assert.deepEqual(frontMatter('---\nname: ux-review # old copy\ndescription: "a # b"\n---\n'), {
    name: 'ux-review',
    description: 'a # b',
  });
});

test('ux-review and ui-review share an identical review template', () => {
  // Skills can't reference each other's files, so each keeps its own copy.
  const read = (skill) => fs.readFileSync(path.join(REPO, 'skills', skill, 'template.html'), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(read('ui-review'), read('ux-review'));
});

test('ui-review banlist matches the UI Design list in global.md', () => {
  // The skill keeps its own copy so it works without the global instructions.
  const listAfter = (rel, heading) => {
    const text = fs.readFileSync(path.join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
    const start = text.indexOf(heading);
    assert.ok(start >= 0, `${heading} missing in ${rel}`);
    const lines = text.slice(start).split('\n').slice(1);
    const first = lines.findIndex((l) => l.startsWith('- '));
    const end = lines.findIndex((l, i) => i > first && !l.startsWith('- '));
    return lines.slice(first, end);
  };
  const global = listAfter('instructions/global.md', '## UI Design');
  assert.ok(global.length > 0);
  assert.deepEqual(listAfter('skills/ui-review/SKILL.md', '### AI slop banlist'), global);
});
