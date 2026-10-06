// La mano di un giocatore, nella colonna di sinistra: le carte si sovrappongono quanto basta per starci tutte.
import { useLayoutEffect, useRef } from 'react';
import { useStore } from '../../store.js';
import { Card, CardBack } from './Card.jsx';
import { combatMarks, visibleZones } from './combat.js';

/** @param {number} p  1 = la tua mano (in basso), 2 = quella dell'avversario (in alto) */
export function Hand({ p }) {
  const state = useStore((s) => s.snaps[s.cur]);
  const oppHand = useStore((s) => s.oppHand);
  const ref = useRef(null);

  // dopo ogni disegno si ricalcola di quanto sovrapporre le carte (anche quando la finestra cambia misura: vedi Table.jsx)
  useLayoutEffect(() => {
    layoutHand(ref.current);
  });

  const id = p === 2 ? 'opp-hand' : 'you-hand';
  if (!state) return <div className="hand" id={id} ref={ref} />;

  const { hand } = visibleZones(state, p);
  const marks = combatMarks(state);
  const card = (c) => <Card key={c.uid} card={c} player={p} {...marks[c.uid]} />;

  // mano avversaria coperta: dorsi al posto delle carte, tranne (in modalità "note") quelle che conosciamo
  if (p === 2 && oppHand !== 'all') {
    const showKnown = oppHand === 'known';
    const knownCount = hand.filter((c) => c.known).length;
    return (
      <div className="hand" id={id} ref={ref}>
        {hand.map((c) => (showKnown && c.known ? card(c) : <CardBack key={'back' + c.uid} />))}
        <div className="hcnt">{hand.length + ' carte in mano' + (showKnown ? ', ' + knownCount + ' note' : '')}</div>
      </div>
    );
  }
  return (
    <div className="hand" id={id} ref={ref}>
      {hand.map(card)}
    </div>
  );
}

// Calcola la sovrapposizione (--ov) che fa stare tutte le carte nella larghezza della colonna.
function layoutHand(handEl) {
  if (!handEl) return;
  const cards = [...handEl.children].filter((el) => el.classList.contains('card') || el.classList.contains('back'));
  handEl.style.setProperty('--ov', '0px');
  if (cards.length < 2) return;
  const cardWidth = cards[0].offsetWidth;
  const available = handEl.clientWidth - 8;
  const overlap = Math.max(0, (cards.length * cardWidth - available) / (cards.length - 1));
  handEl.style.setProperty('--ov', Math.min(overlap, cardWidth * 0.8) + 'px');
}
