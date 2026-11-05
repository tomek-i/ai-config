// Stop: warn when common dev-server ports are still listening, so "services are
// stopped" claims get checked. Shown to the user only; never blocks the stop.
const { execSync } = require('child_process');

// Next/Vite/Astro/Angular/Aspire dashboard/generic API ports.
const PORTS = new Set([3000, 3001, 4200, 4321, 5000, 5001, 5173, 5174, 8080, 18888]);

let out = '';
try {
  out = execSync('netstat -ano -p TCP', { encoding: 'utf8', timeout: 5000 });
} catch {
  process.exit(0);
}

const open = new Map();
for (const line of out.split(/\r?\n/)) {
  const m = /^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/.exec(line);
  if (m && PORTS.has(Number(m[1]))) open.set(m[1], m[2]);
}

if (open.size) {
  const list = [...open].map(([port, pid]) => `${port} (pid ${pid})`).join(', ');
  console.log(JSON.stringify({ systemMessage: `Dev ports still listening: ${list}` }));
}
