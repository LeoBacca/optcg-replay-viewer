// Una carta sul tavolo, in mano o tra le carte guardate, più i dorsi (carte coperte).
import { useState } from 'react';
import { logName } from '../../lib/cards.js';
import { cls } from '../../lib/format.js';
import { isVertical } from '../../lib/platform.js';
import { showPreview } from '../../game/view.js';
import { useCardImage } from '../useCardImage.js';
import { useT } from '../../i18n/useT.js';

// perché conosciamo una carta nella mano dell'avversario
const knownLabel = (t, known) =>
  known === 'field'
    ? t('tornata in mano')
    : known === 'trash'
      ? t('dal trash')
      : known === 'revealed'
        ? t('rivelata')
        : '';

/**
 * @param {object} card     la carta nello stato del tavolo: { uid, id, rested, don, known, frozen }
 * @param {number} player   1 o 2: di chi è (serve alle animazioni per sapere da quale mazzo esce)
 * @param {string} [role]   'attacking' | 'defending' se è in combattimento
 * @param {string|number} [power]  la potenza da scrivere sulla carta durante il combattimento
 * @param {boolean} [myTurn]   alone bianco: è il leader del giocatore di turno
 * @param {boolean} [inTrash]  la carta in cima al trash: al tocco si apre l'elenco, non l'anteprima
 */
export function Card({ card, player, role, power, myTurn, inTrash }) {
  const t = useT();
  const image = useCardImage(card.id);
  const don = card.don || 0;

  return (
    <div
      className={cls(
        'card',
        image.failed && 'noimg',
        card.rested && 'rested',
        card.known && 'isknown',
        role,
        myTurn && 'myturn',
      )}
      data-uid={card.uid}
      data-p={player}
      onMouseEnter={() => {
        if (!isVertical()) showPreview(card.id);
      }}
      onClick={() => {
        if (isVertical() && !inTrash) showPreview(card.id, true);
      }}
    >
      {/* senza immagine resta il nome della carta */}
      {image.failed && logName(card.id)}
      <span className="dons">
        {Array.from({ length: don }, (_, k) => (
          <AttachedDon key={k} index={k} />
        ))}
      </span>
      {!image.failed && (
        <img alt="" draggable={false} loading="eager" src={image.src} onLoad={image.onLoad} onError={image.onError} />
      )}
      <span className={cls('donx', don > 0 && 'show')} style={{ '--n': don }}>
        {'DON!! ×' + don}
      </span>
      <span className={cls('pw', power != null && 'show')}>{power}</span>
      <span className={cls('known', card.known && 'show')}>{knownLabel(t, card.known)}</span>
      <span className={cls('frz', card.frozen && 'show')}>❄ {t('non stappa')}</span>
    </div>
  );
}

// Un DON attaccato sotto la carta. La classe "in" fa partire l'animazione d'ingresso e si toglie quando è finita.
function AttachedDon({ index }) {
  const [entering, setEntering] = useState(true);
  return (
    <span className={cls('dcard', entering && 'in')} style={{ '--k': index }} onAnimationEnd={() => setEntering(false)}>
      DON!!
    </span>
  );
}

/** Una life coperta: ha il suo uid, così quando viene presa la carta "parte" da qui verso la mano. */
export function LifeBack({ card, player }) {
  return <div className="back life" data-uid={card.uid} data-p={player} />;
}

/** Un dorso qualsiasi (mazzo, mano coperta). count = numero scritto sopra, se serve. */
export function CardBack({ count, style }) {
  return (
    <div className="back" style={style}>
      {count != null && <span className="n">{count}</span>}
    </div>
  );
}
