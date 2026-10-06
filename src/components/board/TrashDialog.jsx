// L'elenco completo del trash di un giocatore, in una finestra sopra il tavolo. Si apre cliccando il trash.
import { useEffect, useRef, useState } from 'react';
import { useStore, set } from '../../store.js';
import { nick, cls } from '../../lib/format.js';
import { logName } from '../../lib/cards.js';
import { useCardImage } from '../useCardImage.js';

export function TrashDialog() {
  const state = useStore((s) => s.snaps[s.cur]);
  const trashOf = useStore((s) => s.trashOf);
  const ref = useRef(null);
  // nel layout verticale le carte dell'elenco sono piccole: un tocco ne ingrandisce una, un altro la rimpicciolisce
  const [zoomed, setZoomed] = useState(-1);

  useEffect(() => {
    const dialog = ref.current;
    if (trashOf && !dialog.open) {
      setZoomed(-1);
      dialog.showModal();
    } else if (!trashOf && dialog.open) dialog.close();
  }, [trashOf]);

  const P = trashOf && state ? state.players[trashOf] : null;
  return (
    <dialog id="dlg" ref={ref} onClose={() => set({ trashOf: 0 })}>
      <h3 id="dlg-title">{P ? 'Trash ' + nick(P.name) + ' (' + P.trash.length + ')' : ''}</h3>
      <div className="grid" id="dlg-grid">
        {P &&
          P.trash.map((card, i) => (
            <TrashCard
              key={card.uid}
              id={card.id}
              zoomed={zoomed === i}
              onClick={(el) => {
                const zoom = zoomed !== i;
                setZoomed(zoom ? i : -1);
                if (zoom) setTimeout(() => el.scrollIntoView({ block: 'nearest' }));
              }}
            />
          ))}
      </div>
      <p style={{ textAlign: 'right', margin: '10px 0 0' }}>
        <button id="dlg-close" onClick={() => set({ trashOf: 0 })}>
          Chiudi
        </button>
      </p>
    </dialog>
  );
}

function TrashCard({ id, zoomed, onClick }) {
  const image = useCardImage(id);
  return (
    <div className={cls('card', image.failed && 'noimg', zoomed && 'zoom')} onClick={(e) => onClick(e.currentTarget)}>
      {image.failed ? logName(id) : <img src={image.src} onLoad={image.onLoad} onError={image.onError} />}
    </div>
  );
}
