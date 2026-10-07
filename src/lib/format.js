// Piccole funzioni che trasformano dati in testo da mostrare.
import { t, locale } from '../i18n/index.js';

/** Data e ora brevi, giorno prima del mese: 23/09/26, 13:26 */
export const fmtDate = (date) =>
  date.toLocaleString(locale(), {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Il nick senza il numero che il sim aggiunge in fondo: "Leo#1234" → "Leo" */
export const nick = (name) => (name || '').replace(/#\d+$/, '');

/** Come è finita la partita, in parole. result = { winner, how } come lo scrive il motore. */
export function howText(result) {
  if (result.how === 'concede') return result.winner === 1 ? t("L'avversario concede") : t('Hai conceduto');
  if (result.how === 'lethal') return t('Danno letale');
  if (result.how === 'disconnect') return t('Disconnessione (esito probabile)');
  return t('Abbandono (esito probabile)');
}

/** Unisce i nomi di classe veri e salta quelli falsi: cls('card', rested && 'rested') */
export const cls = (...names) => names.filter(Boolean).join(' ');
