import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

// Total JavaScript budget, gzipped. The page boots on one entry chunk; each tool is
// its own lazy chunk, loaded when its section approaches.
const dir = 'dist/_astro';
const TOTAL_LIMIT = 60 * 1024;
const ENTRY_LIMIT = 30 * 1024;
const LAZY = ['truss', 'stirling', 'sizing', 'rov', 'life'];
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
let failed = false, total = 0;
for (const f of files) {
  const gz = gzipSync(readFileSync(join(dir, f))).length;
  total += gz;
  const lazy = LAZY.find((s) => f.startsWith(`${s}.`));
  console.log(`${lazy ? 'lazy  ' : 'entry '}${f}  ${(gz / 1024).toFixed(1)} KB gz`);
  if (!lazy && !f.startsWith('shared.') && gz > ENTRY_LIMIT) { console.error(`  over the ${ENTRY_LIMIT / 1024} KB entry budget`); failed = true; }
}
for (const s of LAZY) {
  if (!files.some((f) => f.startsWith(`${s}.`))) { console.error(`missing a separate ${s} chunk (lazy loading is not working)`); failed = true; }
}
if (total > TOTAL_LIMIT) { console.error(`total ${(total / 1024).toFixed(1)} KB over ${TOTAL_LIMIT / 1024} KB`); failed = true; }
console.log(`total JS ${(total / 1024).toFixed(1)} KB gz (limit ${TOTAL_LIMIT / 1024} KB)`);
process.exit(failed ? 1 : 0);
