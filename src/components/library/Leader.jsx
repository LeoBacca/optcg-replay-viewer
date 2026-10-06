// Un leader in piccolo: immagine, nome e (se serve) una riga sotto, per esempio il nick dell'avversario.
import { cls } from '../../lib/format.js';
import { leaderName } from '../../game/library.js';
import { useCardImage } from '../useCardImage.js';

/**
 * @param {{ id, name }|null} leader  null = leader sconosciuto ("?")
 * @param {string} side               'you' | 'opp': decide il colore
 * @param {string} [sub]              testo piccolo sotto il nome
 */
export function Leader({ leader, side, sub }) {
  return (
    <span className={cls('ld', side)}>
      {leader && <LeaderImage id={leader.id} lazy />}
      <span className="nm">
        <b>{leaderName(leader)}</b>
        {sub && <small>{sub}</small>}
      </span>
    </span>
  );
}

/** L'immagine di un leader; se non arriva, non si mostra niente. */
export function LeaderImage({ id, lazy }) {
  const image = useCardImage(id);
  if (image.failed) return null;
  return (
    <img alt="" loading={lazy ? 'lazy' : undefined} src={image.src} onLoad={image.onLoad} onError={image.onError} />
  );
}
