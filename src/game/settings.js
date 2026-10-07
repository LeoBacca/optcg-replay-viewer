// Leggere e cambiare un'impostazione dalla pagina.
import { get, set } from '../store.js';
import { saveSettings } from '../lib/settings.js';
import { setLanguage } from '../i18n/index.js';

export const getSetting = (key) => get().settings[key];

/** Cambia un'impostazione, la salva e ne applica subito l'effetto. */
export function setSetting(key, value) {
  // la lingua va cambiata prima di avvisare i componenti, che si ridisegnano subito dopo
  if (key === 'lang') setLanguage(value);
  const settings = { ...get().settings, [key]: value };
  set({ settings });
  // spegnendo l'anteprima, quella aperta si chiude
  if (key === 'preview' && !value) set({ preview: { id: '', show: false } });
  saveSettings(settings);
}
