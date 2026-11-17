// Argument parsing of the pr-screenshots upload script (the browser part needs GitHub and is checked by hand).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { REPO } from './install.mjs';

const { parseArgs } = createRequire(import.meta.url)(
  path.join(REPO, 'skills', 'pr-screenshots', 'scripts', 'upload-pr-screenshots.js'),
);

test('upload script takes a PR, resolving image paths', () => {
  const opts = parseArgs(['--repo', 'o/r', '--pr', '7', 'a.png', 'b.png']);
  assert.equal(opts.repo, 'o/r');
  assert.equal(opts.pr, '7');
  assert.equal(opts.issue, undefined);
  assert.deepEqual(opts.files, [path.resolve('a.png'), path.resolve('b.png')]);
});

test('upload script takes an issue instead of a PR', () => {
  const opts = parseArgs(['--issue', '12', 'shot.png']);
  assert.equal(opts.issue, '12');
  assert.equal(opts.pr, undefined);
  assert.deepEqual(opts.files, [path.resolve('shot.png')]);
});

test('upload script rejects a PR and an issue together', () => {
  assert.throws(() => parseArgs(['--pr', '1', '--issue', '2', 'x.png']), /not both/);
});
