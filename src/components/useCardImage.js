// L'immagine di una carta, per i componenti React.
// Prova le sorgenti una dopo l'altra (vedi lib/cards.js) e ricorda quale ha funzionato.
import { useState } from 'react';
import { imageUrl, knownSource, rememberSource, IMAGE_SOURCE_COUNT } from '../lib/cards.js';

/**
 * @param {string} id  codice della carta
 * @returns {{ src?: string, failed: boolean, onError: Function, onLoad: Function }}
 *   src, onError e onLoad vanno messi sull'<img>; failed = nessuna sorgente ha l'immagine (si mostra il nome)
 */
export function useCardImage(id) {
  const firstSource = () => {
    const known = knownSource(id);
    return known === undefined ? 0 : known;
  };
  const [tried, setTried] = useState({ id, source: firstSource() });
  // se il componente passa a un'altra carta si ricomincia dalla sua prima sorgente
  const source = tried.id === id ? tried.source : firstSource();
  const failed = source < 0 || source >= IMAGE_SOURCE_COUNT;

  return {
    failed,
    src: failed ? undefined : imageUrl(id, source),
    onLoad: () => rememberSource(id, source),
    onError: () => {
      const next = source + 1;
      if (next >= IMAGE_SOURCE_COUNT) rememberSource(id, -1);
      setTried({ id, source: next });
    },
  };
}
