// Aprire una partita: dal testo di un log al replay pronto sullo schermo.
import { get, set } from '../store.js';
import * as Core from '../core/index.js';
import { preloadImage, rememberName } from '../lib/cards.js';
import { nick } from '../lib/format.js';
import { resetFlip } from '../components/board/flip.js';
import { getSetting } from './settings.js';
import { pause, play } from './playback.js';
import { runDebug } from './view.js';
import { shareOf } from './library.js';
import { resetNotes, loadNotes } from './notes.js';

// se l'utente apre un altro log mentre questo sta ancora caricando le immagini, vince l'ultimo
let lastLoad = 0;

// oltre questo tempo il replay parte anche se qualche immagine non è ancora arrivata
const PRELOAD_TIMEOUT_MS = 4000;

/**
 * Apre un log.
 * @param {string} text      il testo del combat log
 * @param {string} fileName  serve solo per i messaggi
 * @param {object} [logRef]  la voce della cartella da cui viene: così si ritrova il link già creato per quella partita
 */
export async function loadText(text, fileName, logRef) {
  const myLoad = ++lastLoad;
  pause();

  const parsed = Core.parseLog(text);
  const snaps = Core.buildSnapshots(parsed).snapshots;
  if (!snaps.length) {
    set({ progress: 'Nessuna mossa trovata in ' + fileName });
    return;
  }

  // i nomi delle carte come li scrive questo log
  for (const step of parsed.steps) for (const card of step.cards) rememberName(card.id, card.name);
  for (const p of [1, 2]) {
    const leader = parsed.players[p].leader;
    if (leader) rememberName(leader.id, leader.name);
  }

  await preloadImages(cardIds(parsed, snaps));
  if (myLoad !== lastLoad) return;

  // da qui la partita nuova prende il posto di quella vecchia, tutta insieme
  resetFlip();
  resetNotes();
  const share = logRef ? shareOf(logRef) : null;
  const you = nick(parsed.players[1].name || 'You');
  const opp = nick(parsed.players[2].name || 'Opponent');
  document.title = 'OPTCG Replay · ' + you + ' vs ' + opp;
  set({
    parsed,
    snaps,
    cur: 0,
    text,
    logRef: logRef || null,
    share,
    dropOpen: false,
    homeOpen: false,
    progress: '',
  });

  if (location.search.includes('debug')) {
    set({ debugOpen: true, logOpen: true });
    runDebug();
  }
  if (share) loadNotes(share);
  if (getSetting('autoplay')) play();
}

/** Apre un file scelto o trascinato dall'utente. */
export async function loadFile(file, logRef) {
  if (!file) return;
  set({ progress: 'Leggo ' + file.name + '…' });
  await loadText(await file.text(), file.name, logRef);
}

// Tutte le carte che il replay mostrerà: quelle nominate negli step e quelle sul tavolo a fine partita.
function cardIds(parsed, snaps) {
  const ids = new Set();
  const last = snaps[snaps.length - 1];
  for (const p of [1, 2]) {
    const P = last.players[p];
    ids.add(P.leader.id);
    for (const zone of [P.hand, P.chars, P.stage, P.trash, P.life]) for (const card of zone) ids.add(card.id);
  }
  for (const step of parsed.steps) for (const card of step.cards) ids.add(card.id);
  ids.delete('Don');
  return ids;
}

// Scarica le immagini prima di far partire il replay, mostrando l'avanzamento.
function preloadImages(ids) {
  const total = ids.size;
  let done = 0;
  set({ progress: 'Carico le carte… 0 / ' + total });
  const all = [...ids].map((id) =>
    preloadImage(id).then(() => {
      done++;
      set({ progress: 'Carico le carte… ' + done + ' / ' + total });
    }),
  );
  const timeout = new Promise((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT_MS));
  return Promise.race([Promise.all(all), timeout]);
}
