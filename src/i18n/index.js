// Le lingue della pagina: inglese (predefinita) e italiano.
//
// Come funziona: nel codice i testi restano scritti in italiano dentro t(), per esempio t('Menu principale').
// In italiano t() li restituisce così come sono; in inglese li cerca nel dizionario en.js.
// Le parti che cambiano si scrivono tra graffe: t('{n} turni', { n: 12 }) → "12 turns".
//
// Aggiungere un testo = scriverlo dentro t() e aggiungere la sua riga in en.js
// (npm test controlla che nessun t() sia rimasto senza traduzione).
// Aggiungere una lingua = un altro dizionario come en.js, e una voce in LANGUAGES.
// Questo file non dipende da React né dallo stato della pagina: per i componenti c'è useT() in useT.js.
import en from './en.js';

export const LANGUAGES = [
  ['en', 'English'],
  ['it', 'Italiano'],
];
export const DEFAULT_LANGUAGE = 'en';

const DICTIONARIES = { en: { ...en } };
let language = DEFAULT_LANGUAGE;

export const getLanguage = () => language;

/** Cambia la lingua di t(). La pagina la chiama da game/settings.js, insieme al salvataggio dell'impostazione. */
export function setLanguage(code) {
  language = LANGUAGES.some(([c]) => c === code) ? code : DEFAULT_LANGUAGE;
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

/** Aggiunge traduzioni a un dizionario: le usa il Memory Trainer, che ha le sue e c'è solo nell'exe. */
export function addTranslations(code, dictionary) {
  DICTIONARIES[code] = { ...DICTIONARIES[code], ...dictionary };
}

/**
 * Il testo nella lingua scelta.
 * @param {string} text  il testo in italiano, con eventuali {segnaposto}
 * @param {object} [vars]  i valori dei segnaposto
 */
export function t(text, vars) {
  const dictionary = DICTIONARIES[language];
  const out = (dictionary && dictionary[text]) || text;
  return vars ? out.replace(/\{(\w+)\}/g, (all, name) => (name in vars ? vars[name] : all)) : out;
}

/** La lingua nel formato che usano date e numeri del browser. */
export const locale = () => (language === 'it' ? 'it-IT' : 'en-GB');
