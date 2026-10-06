// Il ponte tra la pagina (React) e il Memory Trainer, che esiste solo nell'exe.
//
// Il trainer è scritto a mano sul DOM (screens.js) e viene caricato solo quando serve. Questo file:
//   - gli passa i pezzi della pagina che usa (immagini, raccolta, apertura di un log…);
//   - dà alla pagina un modo per comandarlo (getTrainer) e per sapere se è acceso (trainerLab);
//   - lo avvisa a ogni cambio di step, perché aggiorni il pannello "Fondo del mazzo".
// Nel sito il trainer non c'è: getTrainer() restituisce null e trainerLab() false.
import { useStore, get, set } from '../store.js';
import { setImg, metaOf } from '../lib/cards.js';
import { toast, copyText } from '../lib/toast.js';
import { getSetting } from '../game/settings.js';
import { pause } from '../game/playback.js';
import { openLog } from '../game/folder.js';
import { summaryOf, readText, dateOf } from '../game/library.js';

let trainer = null;

/** Il trainer, oppure null se non è (ancora) caricato. */
export const getTrainer = () => trainer;

/** true se il trainer c'è e le "Funzioni in prova" sono accese. */
export const trainerLab = () => !!trainer && trainer.lab();

/** Da chiamare quando cambia qualcosa dentro il trainer che i menu della pagina mostrano. */
export const refreshTrainerUi = () => set({ trainerTick: get().trainerTick + 1 });

// i due attrezzi con cui il trainer costruisce le sue schermate
const $ = (selector) => document.querySelector(selector);
function mk(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/** Carica il trainer e lo aggancia alla pagina. Va chiamata una volta, dopo che la pagina è stata disegnata. */
export async function initTrainer() {
  const { createTrainer } = await import('./screens.js');
  trainer = createTrainer({
    $,
    mk,
    setImg,
    metaOf,
    Settings: { get: getSetting },
    Home: { isOpen: () => get().homeOpen, rebuild: refreshTrainerUi },
    Library: { sumOf: summaryOf, readText, dateOf },
    toast,
    copyText,
    logs: () => get().logFiles,
    openLog,
    pause,
    state: () => get().snaps[get().cur] || null,
  });
  set({ trainerReady: true });

  // a ogni cambio di step il trainer riceve il nuovo stato del tavolo
  const current = get().snaps[get().cur];
  if (current) trainer.onStep(current);
  useStore.subscribe((now, before) => {
    if (now.snaps === before.snaps && now.cur === before.cur) return;
    const state = now.snaps[now.cur];
    if (state) trainer.onStep(state);
  });
}
