// PostToolUse (Edit|Write): format the edited file with the project's own Biome.
// Uses the locally installed binary only, so projects without Biome are skipped
// and nothing is ever downloaded via npx.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  const { tool_input = {}, tool_response = {} } = JSON.parse(input || '{}');
  const file = tool_response.filePath || tool_input.file_path;
  if (!file || !fs.existsSync(file)) return;

  for (let dir = path.dirname(path.resolve(file)); ; dir = path.dirname(dir)) {
    // Run Biome's JS launcher with node directly: no shell, so paths need no quoting.
    const biome = path.join(dir, 'node_modules', '@biomejs', 'biome', 'bin', 'biome');
    if (fs.existsSync(biome)) {
      const r = spawnSync(process.execPath, [biome, 'check', '--write', '--no-errors-on-unmatched', file], {
        cwd: dir,
        encoding: 'utf8',
      });
      // Remaining lint errors aren't fatal to the edit; surface them to Claude.
      if (r.status) process.stderr.write((r.stdout || '') + (r.stderr || ''));
      return;
    }
    if (path.dirname(dir) === dir) return;
  }
});
