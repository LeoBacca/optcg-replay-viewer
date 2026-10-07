// Core: tutta la logica che non tocca la pagina (si può usare anche da Node, ed è quella coperta dai test).
//   parser/  dal testo del log agli step
//   engine/  dagli step allo stato del tavolo
//   stats    riepiloghi e statistiche · redact  copia del log da condividere
export { parseLog } from './parser/index.js';
export { buildSnapshots } from './engine/index.js';
export { costNow, powerNow } from './engine/effects.js';
export { clean, refs } from './text.js';
export { summarize, gameDate, outcome, winrate, stats } from './stats.js';
export { redact } from './redact.js';
export { CARD_RULES } from './card-rules.js';
