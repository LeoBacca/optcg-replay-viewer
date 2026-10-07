// Il testo di uno step come lo mostrano la barra e il log della partita: "Tu: Deploy Nami".
// Quasi tutto è il testo del log del sim (in inglese); il parser aggiunge in italiano solo i pezzi che il log
// non scrive (pescate, mescolate, life messe a inizio partita, carte guardate): qui vengono tradotti nella lingua scelta.
import { t } from '../i18n/index.js';

/** "Otama: guarda le prime 5 carte", nella lingua scelta (lo usa anche il riquadro delle carte guardate). */
export const lookText = (source, count) => (source ? source + ': ' : '') + t('guarda le prime {n} carte', { n: count });

function stepText(step) {
  if (step.kind === 'look') return lookText(step.src ? step.src.name : '', step.look.length);
  if (step.kind === 'draw') return t('pesca {card}', { card: step.cards[0] ? step.cards[0].name : t('una carta') });
  if (step.kind === 'synthetic') {
    // stessa scelta di labelSteps in core/parser/passes.js: la chiave dice da quale zona a quale
    const [, move] = step.key.split(':');
    if (move === '0>0') return t('mescola il deck');
    if (move === '1>0') return t('rimette la mano nel deck');
    if (move === '0>3') return t('mette le {n} Life', { n: step.moves.length });
    return t('sistema le carte');
  }
  return step.text;
}

export function stepLabel(step) {
  const who = step.player === 1 ? t('Tu') : step.player === 2 ? t('Avv') : '';
  return (who ? who + ': ' : '') + stepText(step);
}
