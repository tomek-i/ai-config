#!/usr/bin/env node
// Uploads images to GitHub as PR attachments (github.com/user-attachments/...), the way dragging them
// into a comment box does, and prints a JSON map of file -> URL. The comment is never posted: the box
// is emptied after each upload. GitHub has no API for this, so it drives a visible browser.
//
//   node <pr-screenshots skill>/scripts/upload-pr-screenshots.js [--repo owner/name] [--pr N] <image>...
//
// --repo and --pr default to the current directory's repo and branch PR (via gh).
// The browser keeps its own profile: the first time, sign in to GitHub in the window; it stays signed in.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { execFileSync, execSync } = require('node:child_process');

const PROFILE = path.join(process.env.LOCALAPPDATA || require('node:os').homedir(), 'claude-github-profile');
const ASSET = /https:\/\/github\.com\/user-attachments\/assets\/[\w-]+/g;
const log = (...a) => console.error(new Date().toISOString().slice(11, 19), ...a);

function parseArgs(argv) {
  const opts = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--repo') opts.repo = argv[++i];
    else if (argv[i] === '--pr') opts.pr = argv[++i];
    else opts.files.push(path.resolve(argv[i]));
  }
  return opts;
}

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();

// Prefer the project's Playwright; fall back to the one bundled with the global @playwright/cli.
function loadPlaywright() {
  const candidates = [path.join(process.cwd(), 'package.json')];
  try {
    // A plain command string: npm is a .cmd shim on Windows, so it needs a shell.
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    candidates.push(path.join(globalRoot, '@playwright', 'cli', 'package.json'));
  } catch {}
  for (const from of candidates) {
    for (const pkg of ['playwright-core', 'playwright', '@playwright/test']) {
      try {
        return createRequire(from)(pkg).chromium;
      } catch {}
    }
  }
  throw new Error('Playwright not found. Install it: npm i -g @playwright/cli');
}

// Installed Chrome avoids Playwright/browser version mismatches; bundled Chromium is the fallback.
async function launch(chromium) {
  const opts = { headless: false, viewport: null, args: ['--start-maximized'] };
  try {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, channel: 'chrome' });
  } catch {
    return chromium.launchPersistentContext(PROFILE, opts);
  }
}

async function main() {
  const { repo: repoArg, pr: prArg, files } = parseArgs(process.argv.slice(2));
  if (!files.length) throw new Error('No images given');
  const missing = files.filter((f) => !fs.existsSync(f));
  if (missing.length) throw new Error(`Not found: ${missing.join(', ')}`);
  const repo = repoArg || gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  const pr = prArg || gh(['pr', 'view', '--json', 'number', '-q', '.number']);

  const ctx = await launch(loadPlaywright());
  try {
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    // GitHub names the signed-in user in a meta tag.
    const user = () => page.locator('meta[name="user-login"]').getAttribute('content').catch(() => '');
    await page.goto('https://github.com/login');
    if (!(await user())) {
      log('Waiting for you to sign in to GitHub in the browser window...');
      const until = Date.now() + 15 * 60_000;
      while (Date.now() < until && !(await user())) await page.waitForTimeout(2000);
    }
    const who = await user();
    if (!who) throw new Error('Not signed in to GitHub after 15 minutes');
    log(`Signed in as ${who}`);

    await page.goto(`https://github.com/${repo}/pull/${pr}`);
    const box = page.locator('textarea[name="comment[body]"]').last();
    await box.waitFor({ timeout: 30_000 });
    await box.scrollIntoViewIfNeeded();
    // A fresh page's box takes no file until its editor has initialised.
    await box.click();
    await page.waitForTimeout(3000);
    const input = page.locator('form:has(textarea[name="comment[body]"]) input[type="file"]').last();

    const links = {};
    const seen = new Set();
    for (const file of files) {
      await box.fill('');
      await input.setInputFiles(file);
      let url = null;
      for (let i = 0; i < 120 && !url; i++) {
        await page.waitForTimeout(500);
        // Only a link not seen before counts: a late one belongs to the previous file.
        url = [...(await box.inputValue()).matchAll(ASSET)].map((m) => m[0]).find((u) => !seen.has(u)) ?? null;
      }
      if (!url) throw new Error(`No link came back for ${path.basename(file)} after 60 s`);
      seen.add(url);
      links[file] = url;
      log(`${path.basename(file)} -> ${url}`);
    }
    // Leave nothing in the box, so no draft comment remains.
    await box.fill('');
    console.log(JSON.stringify(links, null, 2));
  } finally {
    await ctx.close();
  }
}

main().catch((error) => {
  log(error.message);
  process.exit(1);
});
