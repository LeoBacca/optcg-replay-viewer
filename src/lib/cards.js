// Tutto quello che riguarda una carta fuori dalla partita: immagine, nome, costo e potenza.

// Sorgenti delle immagini, in ordine di preferenza: se la prima non ha la carta si prova la seconda.
// NB: en.onepiece-cardgame.com manda Cross-Origin-Resource-Policy: same-site,
// quindi il browser rifiuta le sue immagini da altri siti: non è usabile.
const IMAGE_SOURCES = [
  (id) => 'https://static.dotgg.gg/onepiece/card/' + id + '.webp',
  (id) => 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/' + id.split('-')[0] + '/' + id + '_EN.webp',
];
export const IMAGE_SOURCE_COUNT = IMAGE_SOURCES.length;
export const imageUrl = (id, sourceIndex) => IMAGE_SOURCES[sourceIndex || 0](id);

// Quale sorgente ha funzionato per ogni carta (indice), oppure -1 se nessuna. Così una carta già caricata
// non riprova da capo ogni volta che viene ridisegnata.
const goodSource = new Map();
export const knownSource = (id) => goodSource.get(id);
export const rememberSource = (id, sourceIndex) => goodSource.set(id, sourceIndex);

/**
 * Imposta l'immagine di una carta su un <img> qualsiasi, provando le sorgenti una dopo l'altra.
 * Serve al codice che non è React (il Memory Trainer); i componenti usano <CardImage>.
 * @param {HTMLImageElement} img
 * @param {string} id        codice della carta
 * @param {Function} [onFail] chiamata se nessuna sorgente ha l'immagine
 */
export function setImg(img, id, onFail) {
  let k = 0;
  img.onerror = () => {
    k++;
    if (k < IMAGE_SOURCES.length) img.src = imageUrl(id, k);
    else onFail && onFail();
  };
  img.src = imageUrl(id, 0);
}

/**
 * Scarica in anticipo l'immagine di una carta.
 * @returns {Promise<void>} si chiude quando l'immagine è arrivata o quando tutte le sorgenti hanno fallito
 */
export function preloadImage(id) {
  return new Promise((resolve) => {
    const img = new Image();
    let k = 0;
    img.onload = () => {
      rememberSource(id, k);
      resolve();
    };
    img.onerror = () => {
      k++;
      if (k < IMAGE_SOURCES.length) img.src = imageUrl(id, k);
      else {
        rememberSource(id, -1);
        resolve();
      }
    };
    img.src = imageUrl(id, 0);
  });
}

// Dati delle carte: public/cards_meta.js mette in window.CARDS_META una riga per carta, [nome, costo, potenza, counter, life].
// Se il file manca la pagina funziona lo stesso, senza anteprime dei numeri.
const META = window.CARDS_META || {};

/** @returns {{ name, cost, power, counter, life } | null} */
export function metaOf(id) {
  const m = META[id];
  return m ? { name: m[0], cost: m[1], power: m[2], counter: m[3], life: m[4] } : null;
}

// Nomi delle carte come li scrive il log aperto (codice → nome): servono quando la carta non è in CARDS_META.
const namesFromLog = {};
export const rememberName = (id, name) => {
  namesFromLog[id] = name;
};
/** Il nome migliore che abbiamo per una carta: quello del log, altrimenti il codice. */
export const logName = (id) => namesFromLog[id] || id;

/** Potenza di base di una carta (0 se non la conosciamo). */
export function basePower(card) {
  const m = metaOf(card.id);
  return m ? m.power : 0;
}
