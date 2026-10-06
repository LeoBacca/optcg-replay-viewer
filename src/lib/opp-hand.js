// I tre modi di mostrare la mano dell'avversario, e la scelta salvata nel browser.
export const OPP_HAND_MODES = ['all', 'known', 'hidden'];
export const OPP_HAND_LABELS = { all: 'Mano avv: tutte', known: 'Mano avv: note', hidden: 'Mano avv: coperte' };

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
