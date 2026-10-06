// Raccolta: l'indice di tutte le partite della cartella.
//
// Ogni log viene riassunto una volta sola (Core.summarize: leader, chi ha iniziato, esito, turni) e il riepilogo
// resta salvato nel browser. A ogni apertura si analizzano solo i file nuovi.
//
// L'indice (items) è un oggetto { chiave del file → riepilogo } che viene modificato sul posto, perché può
// contenere migliaia di partite. Per far ridisegnare i componenti si alza il numero libVersion nello stato condiviso.
import { get, set } from '../store.js';
import * as Core from '../core/index.js';
import { kvGet, kvSet } from '../lib/storage.js';
import { metaOf } from '../lib/cards.js';
import { desktop } from '../lib/platform.js';
import { fmtDate } from '../lib/format.js';

// da alzare quando cambia ciò che esce da Core.summarize: l'indice salvato viene rifatto
const INDEX_VERSION = 2;
const RESULT_LETTER = { w: 'V', l: 'S', o: '–' };

let items = null; // null finché l'indice salvato non è stato letto
let lastSync = 0; // una sync più recente (cartella cambiata, log nuovo) ferma quella in corso

const changed = () => set({ libVersion: get().libVersion + 1 });
const save = () => kvSet('index', { v: INDEX_VERSION, items });

/** Un file è lo stesso se ha stesso nome, stessa dimensione e stessa data di modifica. */
export const keyOf = (logFile) => logFile.name + '|' + logFile.size + '|' + Math.round(logFile.mtime);

/** Il riepilogo di un log, o null se non è ancora stato analizzato o non è leggibile. */
export function summaryOf(logFile) {
  const summary = items && items[keyOf(logFile)];
  return summary && !summary.error ? summary : null;
}

/** true se il log è stato analizzato ma non è una partita leggibile. */
export const isUnreadable = (logFile) => !!(items && items[keyOf(logFile)]);

/** Legge il testo di un log, da qualunque parte arrivi (vedi game/folder.js). */
export function readText(logFile) {
  if (logFile.path) return desktop.readLog(logFile.path);
  if (logFile.file) return logFile.file.text();
  return logFile.handle.getFile().then((file) => file.text());
}

/** Nome di un leader: quello ufficiale se lo conosciamo, altrimenti quello scritto nel log. */
export const leaderName = (leader) => (leader ? (metaOf(leader.id) || {}).name || leader.name || leader.id : '?');

/** Quando è stata giocata: la data nel nome del file, altrimenti la data di modifica. */
export const dateOf = (logFile) => fmtDate(new Date(Core.gameDate(logFile.name) || logFile.mtime));

/** "3 V · 1 S · 2 incerte" */
export function recordText(bucket) {
  const open = bucket.open ? ' · ' + bucket.open + (bucket.open === 1 ? ' incerta' : ' incerte') : '';
  return bucket.w + ' V · ' + bucket.l + ' S' + open;
}

export const resultLetter = (outcome) => RESULT_LETTER[outcome];

/** Etichetta breve per menu e tendina: "V · Mihawk vs Shanks", oppure il nome del file se non è ancora analizzato. */
export function labelOf(logFile) {
  const summary = summaryOf(logFile);
  if (!summary) return logFile.name.replace(/\.log$/i, '');
  const outcome = Core.outcome(summary);
  const prefix = outcome === 'o' ? '' : RESULT_LETTER[outcome] + ' · ';
  return prefix + leaderName(summary.me.leader) + ' vs ' + leaderName(summary.opp.leader);
}

/** Il link creato per una partita sta nella sua voce dell'indice: { id, url, base }. null se non c'è. */
export function shareOf(logFile) {
  const summary = summaryOf(logFile);
  return (summary && summary.share) || null;
}

/** Ricorda (o dimentica, con share = null) il link di una partita. */
export function setShare(logFile, share) {
  const summary = summaryOf(logFile);
  if (!summary) return;
  if (share) summary.share = share;
  else delete summary.share;
  save();
  changed();
}

/** Posizione nell'elenco del log aperto in questo momento, o -1. */
export function currentLogIndex() {
  const { logRef, logFiles, snaps } = get();
  if (!logRef || !snaps.length) return -1;
  const key = keyOf(logRef);
  return logFiles.findIndex((logFile) => keyOf(logFile) === key);
}

/**
 * Analizza i log della cartella che non sono ancora nell'indice e toglie dall'indice quelli spariti.
 * Lavora un file alla volta lasciando respirare la pagina, e mostra l'avanzamento.
 */
export async function syncLibrary() {
  const mySync = ++lastSync;
  if (!items) {
    const saved = await kvGet('index');
    if (mySync !== lastSync) return;
    items = saved && saved.v === INDEX_VERSION && saved.items ? saved.items : {};
  }
  const { logFiles } = get();
  const todo = logFiles.filter((logFile) => !items[keyOf(logFile)]);
  set({ libShown: true });
  changed();

  for (let n = 0; n < todo.length; n++) {
    set({ libProgress: 'Analizzo le partite… ' + n + ' / ' + todo.length });
    let summary;
    try {
      summary = Core.summarize(await readText(todo[n]));
      if (!summary.me.leader || !summary.turns) summary = { error: true };
    } catch (e) {
      summary = { error: true };
    }
    if (mySync !== lastSync) return;
    items[keyOf(todo[n])] = summary;
    // ogni dieci partite l'elenco si aggiorna e l'indice viene salvato
    if (n % 10 === 9) {
      changed();
      save();
    }
    await new Promise((resolve) => setTimeout(resolve));
    if (mySync !== lastSync) return;
  }

  const keep = new Set(logFiles.map(keyOf));
  let pruned = false;
  for (const key in items) {
    if (!keep.has(key)) {
      delete items[key];
      pruned = true;
    }
  }
  if (todo.length || pruned) save();
  set({ libProgress: '' });
  changed();
}
