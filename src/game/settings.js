// Leggere e cambiare un'impostazione dalla pagina.
import { get, set } from '../store.js';
import { saveSettings } from '../lib/settings.js';

export const getSetting = (key) => get().settings[key];

/** Cambia un'impostazione, la salva e ne applica subito l'effetto. */
export function setSetting(key, value) {
  const settings = { ...get().settings, [key]: value };
  set({ settings });
  // spegnendo l'anteprima, quella aperta si chiude
  if (key === 'preview' && !value) set({ preview: { id: '', show: false } });
  saveSettings(settings);
}
