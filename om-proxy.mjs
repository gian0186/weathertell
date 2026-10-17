// Switches the browser's Open-Meteo calls between the free API and our own proxy (/api/om).
// Usage: node om-proxy.mjs on | off | status
// Switch on only together with a commercial Open-Meteo plan: set OPEN_METEO_API_KEY in Vercel first.
// Without a key the proxy sends every visitor's request from Vercel's servers to the free API,
// which would hit its limit of 10,000 calls a day almost immediately.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = fs.readdirSync(root).filter(f => f.endsWith('.js') && fs.readFileSync(path.join(root, f), 'utf8').includes('var OM_PROXY = '));
const mode = process.argv[2];
if (!['on', 'off', 'status'].includes(mode)) {
  console.log('Gebruik: node om-proxy.mjs on | off | status');
  process.exit(1);
}
for (const f of files) {
  const file = path.join(root, f);
  const s = fs.readFileSync(file, 'utf8');
  const current = /var OM_PROXY = true;/.test(s) ? 'on' : 'off';
  if (mode === 'status') { console.log(`${f}: ${current}`); continue; }
  fs.writeFileSync(file, s.replace(/var OM_PROXY = (true|false);/, `var OM_PROXY = ${mode === 'on'};`));
  console.log(`${f}: ${current} -> ${mode}`);
}
