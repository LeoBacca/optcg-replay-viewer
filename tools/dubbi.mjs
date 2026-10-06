// Passa tutti i log di una cartella e stampa i punti in cui la ricostruzione non torna:
// incoerenze con i CHK del log e dubbi su carte riposate e attive (vedi "Regole per carta" nel README).
//   node tools/dubbi.mjs "C:\percorso\dei\log"
// In fondo elenca le carte per cui manca una regola in CARD_RULES, dalla più frequente.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as Core from '../src/core/index.js';



const dir = process.argv[2];
if (!dir) { console.error('Uso: node tools/dubbi.mjs <cartella dei log>'); process.exit(1); }

const missing = new Map();
let games = 0, clean = 0;
for (const name of readdirSync(dir).filter((f) => /\.(log|txt)$/i.test(f)).sort()) {
  let r;
  try { const parsed = Core.parseLog(readFileSync(join(dir, name), 'utf8')); r = Core.buildSnapshots(parsed, { debug: true }); }
  catch (e) { console.log(name + ': non leggibile (' + e.message + ')'); continue; }
  games++;
  if (!r.mismatches.length && !r.doubts.length) { clean++; continue; }
  console.log(name);
  for (const m of r.mismatches) console.log('  ! ' + m);
  for (const d of r.doubts) {
    console.log('  ? ' + d);
    const id = /Serve una regola per (\S+)/.exec(d);
    if (id) missing.set(id[1], (missing.get(id[1]) || 0) + 1);
  }
}
console.log('\n' + games + (games === 1 ? ' partita, ' : ' partite, ') + clean + ' senza incoerenze né dubbi');
if (missing.size) {
  console.log('Carte senza regola:');
  for (const [id, n] of [...missing].sort((a, b) => b[1] - a[1])) console.log('  ' + id + '  ×' + n);
}
