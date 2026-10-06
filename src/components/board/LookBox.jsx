// "Guarda le prime N carte" (Perona, Otama…): le carte viste stanno in un riquadro accanto alla mano di chi le guarda.
// Quando il riquadro si chiude, quella presa vola in mano e le altre verso il mazzo (animazioni in flip.js).
import { useStore } from '../../store.js';
import { cls } from '../../lib/format.js';
import { Card, CardBack } from './Card.jsx';

export function LookBox() {
  const look = useStore((s) => s.snaps[s.cur]?.look);
  const oppHand = useStore((s) => s.oppHand);

  if (!look) {
    return (
      <div id="look">
        <div className="ltitle" />
        <div className="lcards" />
      </div>
    );
  }
  // con la mano avversaria coperta restano coperte anche le carte che guarda
  const hidden = look.p === 2 && oppHand !== 'all';
  return (
    <div id="look" className={cls('show', 'p' + look.p)}>
      <div className="ltitle">
        {(look.p === 1 ? 'Tu' : 'Avv') + ' · ' + look.title}
        {hidden && <small>coperte: Mano avv</small>}
      </div>
      <div className="lcards">
        {look.cards.map((c) =>
          hidden ? <CardBack key={'back' + c.uid} /> : <Card key={c.uid} card={c} player={look.p} />,
        )}
      </div>
    </div>
  );
}
