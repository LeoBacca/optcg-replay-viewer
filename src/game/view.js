// Aprire e chiudere i pezzi della pagina: menu di benvenuto, raccolta, log, anteprima della carta, pennarello.
// Ogni funzione cambia solo lo stato condiviso; a mostrare o nascondere pensano i componenti.
import { get, set } from '../store.js';
import { OPP_HAND_MODES, saveOppHand } from '../lib/opp-hand.js';
import { isVertical } from '../lib/platform.js';
import * as Core from '../core/index.js';
import { getSetting } from './settings.js';
import { pause, play } from './playback.js';
import { listLogs } from './folder.js';
import { t } from '../i18n/index.js';

// ---------- menu di benvenuto ----------
export function showHome() {
  pause();
  set({ dropOpen: false, homeOpen: true, homeSel: 0, homePage: 'main' });
}
export const hideHome = () => set({ homeOpen: false });

// ---------- raccolta delle partite ----------
export function openDrop() {
  pause();
  set({ homeOpen: false, dropOpen: true });
  // a ogni apertura la cartella viene riletta: così compaiono le partite appena giocate
  if (get().hasFolder) listLogs();
}

/** Chiude la raccolta. Senza una partita aperta non c'è un replay a cui tornare: si torna al menu di benvenuto. */
export function closeDrop() {
  if (get().snaps.length) set({ dropOpen: false });
  else if (!get().homeOpen) showHome();
}

/** Apre la raccolta direttamente su una scheda: 'games' (partite) o 'stats' (statistiche). */
export function openLibrary(tab) {
  set({ libTab: tab });
  openDrop();
}

// ---------- log degli eventi e verifiche ----------
export function setNotesVisible(visible) {
  const show = !!(visible && get().notesCtx);
  // nel layout verticale log e note occupano lo stesso posto sopra la barra: aprirne uno chiude l'altro
  set(show && isVertical() ? { notesVisible: true, logOpen: false } : { notesVisible: show });
}

export function toggleLog() {
  const open = !get().logOpen;
  set({ logOpen: open });
  if (open && isVertical()) setNotesVisible(false);
}

/** Confronta la ricostruzione con i controlli scritti nel log e mette il risultato in debugText. */
export function runDebug() {
  const { parsed } = get();
  const r = Core.buildSnapshots(parsed, { debug: true });
  const assigned = parsed.steps.reduce((sum, step) => sum + step.moves.length, 0);
  const lines = [
    t('step: {steps} · mosse: {moves} (assegnate {assigned}) · turni: {turns}', {
      steps: parsed.steps.length,
      moves: parsed.moveCount,
      assigned,
      turns: parsed.turns.length,
    }),
    // le singole righe di incoerenze e dubbi vengono dal motore e restano in italiano: servono a chi sviluppa
    r.mismatches.length
      ? t('{n} incoerenze:', { n: r.mismatches.length }) + '\n' + r.mismatches.join('\n')
      : t('✓ nessuna incoerenza con i CHK e gli snapshot del log'),
    r.doubts.length
      ? t('{n} dubbi (carte riposate o attive che non tornano con le regole del gioco):', { n: r.doubts.length }) +
        '\n' +
        r.doubts.join('\n')
      : t('✓ nessun dubbio su carte riposate e attive'),
  ];
  set({ debugText: lines.join('\n') });
}

export function toggleDebug() {
  const open = !get().debugOpen;
  set({ debugOpen: open });
  if (open && get().parsed) {
    set({ logOpen: true });
    runDebug();
  }
}

// ---------- mano dell'avversario ----------
export function setOppHand(mode) {
  set({ oppHand: mode });
  saveOppHand(mode);
}
export function nextOppHand() {
  const k = OPP_HAND_MODES.indexOf(get().oppHand);
  setOppHand(OPP_HAND_MODES[(k + 1) % OPP_HAND_MODES.length]);
}

// ---------- anteprima grande della carta ----------
// Nel layout verticale l'anteprima copre il tavolo: il replay aspetta finché non la si chiude.
let resumeAfterPreview = false;

/**
 * @param {string} id     codice della carta
 * @param {boolean} [tap] true se è stata toccata (telefono): mette in pausa finché l'anteprima resta aperta
 */
export function showPreview(id, tap) {
  if (!getSetting('preview')) return;
  if (tap) {
    resumeAfterPreview = get().playing;
    pause();
  }
  set({ preview: { id, show: true } });
}

export function closePreview() {
  set({ preview: { ...get().preview, show: false } });
  if (resumeAfterPreview) {
    resumeAfterPreview = false;
    play();
  }
}

// ---------- pennarello ----------
/** Accende o spegne il pennarello. Si può disegnare solo in pausa: durante il Play compare un avviso. */
export function toggleInk() {
  const { inkOn, playing, inkHint } = get();
  if (!inkOn && playing) set({ inkHint: inkHint + 1 });
  else set({ inkOn: !inkOn });
}
