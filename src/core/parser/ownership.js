// A quale step appartiene una mossa.
// Nel log le mosse (righe RZ1) non dicono a quale riga di testo si riferiscono, e spesso arrivano prima o dopo
// rispetto alla riga giusta. Queste due funzioni decidono l'abbinamento guardando il tipo di step e le zone della mossa.

/**
 * La mossa mv è di sicuro dello step? Vale per le mosse che arrivano DOPO la riga di testo.
 * Uno step che aspetta una sola mossa (es. un deploy) la "prende" una volta sola: lo segna in step.owned.
 */
export function owns(step, mv) {
  const { fz, tz, id, f3 } = mv;
  const c = step.cards[0],
    t = step.target;
  switch (step.kind) {
    case 'deploy':
      if (fz === 1 && (tz === 2 || tz === 7) && c && id === c.id && !step.owned) {
        step.owned++;
        return true;
      }
      return false;
    case 'draw':
      if (fz === 0 && tz === 1 && c && id === c.id && !step.owned) {
        step.owned++;
        return true;
      }
      return false;
    case 'drawDon':
      return fz === 4 && tz === 5;
    case 'turnStart':
      return step.kind2 === 'drawDon' && fz === 4 && tz === 5;
    case 'restDon':
      if (fz === 5 && tz === 5 && f3 === 1 && !step.owned) {
        step.owned++;
        return true;
      }
      return false;
    case 'activateDon':
      if (fz === 5 && tz === 5 && f3 === 0 && !step.owned) {
        step.owned++;
        return true;
      }
      return false;
    case 'endTurn':
      return fz === 9 && tz === 5;
    case 'attach':
      return fz === 5 && tz === 9;
    case 'bottom':
      return fz === 0 && tz === 0;
    case 'hit':
      return fz === 3;
    case 'destroyed':
      return fz === 2 && tz === 6;
    case 'effect':
      if (t && id === t.id && !step.owned && !(fz === 5 && tz === 5)) {
        step.owned++;
        return true;
      }
      return false;
    case 'counter':
      if (fz === 1 && tz === 6 && t && id === t.id && !step.owned) {
        step.owned++;
        return true;
      }
      return false;
    case 'mulligan':
      return (fz === 1 && tz === 0) || (fz === 0 && tz === 0);
    case 'reveal':
      if (fz === 0 && tz === 1 && t && id === t.id && !step.owned) {
        step.owned++;
        return true;
      }
      return false;
    default:
      return false;
  }
}

/**
 * Lo step s vuole la mossa mv? Vale per le mosse arrivate PRIMA della riga di testo, rimaste in coda allo step precedente.
 */
export function wants(s, mv) {
  const { fz, tz, id, f3 } = mv;
  const c = s.cards[0],
    t = s.target;
  if (mv.player !== s.player && s.player) return false;
  switch (s.kind) {
    case 'deploy':
      return (
        (fz === 5 && tz === 5 && f3 === 1) ||
        (fz === 1 && (tz === 2 || tz === 7) && c && id === c.id) ||
        (fz === 7 && tz === 6)
      );
    case 'effect':
      return (fz === 5 && tz === 5 && f3 === 1) || (t && id === t.id && !(fz === 5 && tz === 5));
    case 'counter':
      return (fz === 5 && tz === 5 && f3 === 1) || (fz === 1 && tz === 6 && t && id === t.id);
    case 'reveal':
      return t && id === t.id && fz === 0 && tz === 1;
    case 'restDon':
      return fz === 5 && tz === 5 && f3 === 1;
    case 'activateDon':
      return fz === 5 && tz === 5 && f3 === 0;
    case 'drawDon':
      return fz === 4 && tz === 5;
    case 'turnStart':
      return s.kind2 === 'drawDon' && fz === 4 && tz === 5;
    case 'attach':
      return fz === 5 && tz === 9;
    case 'mulligan':
      return (fz === 1 && tz === 0) || (fz === 0 && tz === 0);
    case 'draw':
      return fz === 0 && tz === 1 && c && id === c.id;
    default:
      return false;
  }
}
