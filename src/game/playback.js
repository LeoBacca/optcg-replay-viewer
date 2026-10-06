// Riproduzione del replay: andare a uno step, avanti e indietro, play e pausa, velocità.
//
// Il replay è una lista di stati già calcolati (snaps): "andare allo step i" vuol dire solo cambiare
// il numero cur nello stato condiviso. Il tappetino si ridisegna da solo (components/board).
import { get, set } from '../store.js';
import { getSetting, setSetting } from './settings.js';
import { prepareFlip } from '../components/board/flip.js';

// durata di uno step a velocità 1×, in millisecondi; ogni step la moltiplica per il suo delay
const STEP_MS = 1800;

let timer = null;

/**
 * Mostra lo step i (riportato dentro la partita se è fuori).
 * Se il salto è breve le carte scivolano dal vecchio posto al nuovo, altrimenti il tavolo cambia di colpo.
 */
export function goTo(i) {
  const { snaps, cur } = get();
  if (!snaps.length) return;
  const target = Math.max(0, Math.min(snaps.length - 1, i));
  if (target === cur) return;
  const animate = Math.abs(target - cur) <= 3 && getSetting('anim');
  // le posizioni delle carte vanno misurate adesso, prima che il tavolo cambi
  prepareFlip(animate);
  set({ cur: target });
}

export function next() {
  const { snaps, cur } = get();
  if (cur < snaps.length - 1) goTo(cur + 1);
  else pause();
}

export function prev() {
  goTo(get().cur - 1);
}

// un passo della riproduzione automatica: avanza di uno step e si dà appuntamento per il prossimo
function tick() {
  if (!get().playing) return;
  if (get().cur >= get().snaps.length - 1) {
    pause();
    return;
  }
  goTo(get().cur + 1);
  const step = get().parsed.steps[get().cur];
  timer = setTimeout(tick, (STEP_MS * (step.delay || 1)) / get().speed);
}

export function play() {
  if (!get().snaps.length) return;
  // al Play il pennarello si spegne e gli scarabocchi spariscono (li cancella components/Ink.jsx)
  set({ playing: true, inkOn: false });
  clearTimeout(timer);
  timer = setTimeout(tick, (STEP_MS * 0.6) / get().speed);
}

export function pause() {
  clearTimeout(timer);
  timer = null;
  set({ playing: false });
}

export function togglePlay() {
  if (get().playing) pause();
  else play();
}

export function setSpeed(speed) {
  set({ speed });
  setSetting('speed', speed);
  if (get().playing) {
    clearTimeout(timer);
    timer = setTimeout(tick, 300);
  }
}
