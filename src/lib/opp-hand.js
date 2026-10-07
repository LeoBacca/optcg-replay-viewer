// I tre modi di mostrare la mano dell'avversario, e la scelta salvata nel browser.
import { t } from '../i18n/index.js';

export const OPP_HAND_MODES = ['all', 'known', 'hidden'];
const LABELS = {
  all: () => t('Mano avv: tutte'),
  known: () => t('Mano avv: note'),
  hidden: () => t('Mano avv: coperte'),
};
export const oppHandLabel = (mode) => LABELS[mode]();

const KEY = 'optcg.oppHand';

export function loadOppHand() {
  try {
    const saved = localStorage.getItem(KEY);
    if (OPP_HAND_MODES.includes(saved)) return saved;
  } catch (e) {
    // archivio del browser non disponibile
  }
  return 'all';
}

export function saveOppHand(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch (e) {
    // vale solo per questa visita
  }
}
