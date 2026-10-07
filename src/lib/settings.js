// Impostazioni che restano tra una visita e l'altra (salvate nel browser, chiave "optcg.settings").
// Aggiungere un'impostazione = aggiungere una riga a DEFAULTS.
// Qui c'è solo lettura e scrittura dell'archivio: per cambiarne una dalla pagina si usa setSetting in game/settings.js.

import { LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/index.js';

const KEY = 'optcg.settings';
const SPEEDS = [0.5, 1, 1.5, 2, 3];

const DEFAULTS = {
  autoplay: true, // il replay parte da solo all'apertura
  anim: true, // animazioni delle carte
  preview: true, // anteprima grande della carta
  speed: 1, // velocità di riproduzione
  lab: false, // funzioni in prova (solo exe): Memory Trainer
  lang: DEFAULT_LANGUAGE, // lingua della pagina: 'en' | 'it' (vedi src/i18n)
};

/** Legge le impostazioni salvate; quello che manca o non è valido prende il valore di DEFAULTS. */
export function loadSettings() {
  const settings = { ...DEFAULTS };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {
    // archivio del browser non disponibile: restano i valori di partenza
  }
  if (!SPEEDS.includes(settings.speed)) settings.speed = 1;
  if (!LANGUAGES.some(([code]) => code === settings.lang)) settings.lang = DEFAULT_LANGUAGE;
  return settings;
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (e) {
    // senza archivio l'impostazione vale solo per questa visita
  }
}
