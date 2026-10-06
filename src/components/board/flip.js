// Animazione delle carte tra uno step e l'altro (life → mano, deck → mano, mano → campo, campo → trash…).
//
// La tecnica si chiama FLIP e funziona così:
//   1. PRIMA che il tavolo cambi si misura dove sta ogni carta (prepareFlip);
//   2. React ridisegna il tavolo: le carte sono già al posto nuovo;
//   3. subito dopo (playFlip) ogni carta viene riportata con una trasformazione al posto vecchio
//      e lasciata scivolare fino a quello nuovo.
// Le carte si riconoscono dal numero unico data-uid, quindi funziona anche se React ha ricreato l'elemento.
//
// Questo file lavora direttamente sul DOM: sono misure e movimenti, non c'è niente da "disegnare" con React.

// ogni elemento che rappresenta una carta fisica: sul tappetino, nelle mani, tra le carte guardate
const CARD_SELECTOR = '#mat [data-uid], .hand [data-uid], #look [data-uid]';

// Le misure prese da prepareFlip, in attesa che il tavolo venga ridisegnato. null = il prossimo cambio non va animato.
let pending = null;

// Le carte che hanno già avuto la loro prima animazione. Una carta mai vista prima "esce dal mazzo":
// parte dalla posizione del mazzo del suo giocatore.
const seen = new Set();

/** Da chiamare quando si apre un'altra partita: nessuna carta è ancora stata vista. */
export function resetFlip() {
  seen.clear();
  pending = null;
}

const deckElement = (player) => document.querySelector('#' + (player === 1 ? 'you' : 'opp') + '-half .a-deck');

/**
 * Passo 1: misura le carte prima del cambio.
 * @param {boolean} animate  false = il prossimo cambio avviene di colpo
 */
export function prepareFlip(animate) {
  if (!animate) {
    pending = null;
    return;
  }
  const rects = new Map();
  for (const el of document.querySelectorAll(CARD_SELECTOR)) {
    const r = el.getBoundingClientRect();
    if (r.width) rects.set(el.dataset.uid, r);
  }
  const decks = {};
  for (const p of [1, 2]) {
    const deck = deckElement(p);
    if (deck) decks[p] = deck.getBoundingClientRect();
  }
  // le carte guardate in cima al mazzo: quelle che spariranno voleranno verso il mazzo (vedi playFlip)
  const looked = [...document.querySelectorAll('#look .lcards [data-uid]')].map((el) => ({
    uid: el.dataset.uid,
    player: el.dataset.p,
    rect: el.getBoundingClientRect(),
    copy: el.cloneNode(true),
  }));
  pending = { rects, decks, looked };
}

/**
 * Passi 2 e 3: da chiamare subito dopo che il tavolo è stato ridisegnato.
 * Se prepareFlip non aveva misurato niente, non fa niente.
 */
export function playFlip() {
  const before = pending;
  pending = null;
  if (!before) return;

  flyLookedCardsToDeck(before);

  for (const el of document.querySelectorAll(CARD_SELECTOR)) {
    const uid = el.dataset.uid;
    const now = el.getBoundingClientRect();
    if (!now.width) continue;
    let old = before.rects.get(uid);
    // una carta mai vista esce dal mazzo del suo giocatore (le life coperte no: compaiono e basta)
    if (!old && !seen.has(uid) && el.classList.contains('card')) old = before.decks[el.dataset.p];
    seen.add(uid);
    if (!old) continue;

    const dx = old.left + old.width / 2 - (now.left + now.width / 2);
    const dy = old.top + old.height / 2 - (now.top + now.height / 2);
    const sx = old.width / now.width;
    const sy = old.height / now.height;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(sx - 1) < 0.05) continue;

    // la metà dell'avversario è girata di 180°: lì gli spostamenti vanno al contrario
    const inv = el.closest('.half.opp') ? -1 : 1;
    const base = el.classList.contains('rested') ? 'rotate(90deg)' : '';
    el.style.transition = 'none';
    el.style.transform = `translate(${dx * inv}px,${dy * inv}px) scale(${sx},${sy}) ${base}`;
    el.style.zIndex = 60;
    void el.offsetWidth; // obbliga il browser ad applicare la posizione di partenza prima di animare
    el.style.transition = 'transform .55s cubic-bezier(.2,.7,.25,1)';
    el.style.transform = base || 'none';
    setTimeout(() => {
      el.style.transition = '';
      el.style.transform = '';
      el.style.zIndex = '';
    }, 600);
  }
}

// Le carte guardate e non prese tornano nel mazzo: una copia di ognuna vola dal riquadro al mazzo e svanisce.
// (Quella presa ha lo stesso uid della carta che entra in mano, quindi ci va da sola con l'animazione normale.)
function flyLookedCardsToDeck(before) {
  const stillThere = new Set([...document.querySelectorAll(CARD_SELECTOR)].map((el) => el.dataset.uid));
  const leaving = before.looked.filter((x) => !stillThere.has(x.uid) && x.rect.width);
  leaving.forEach((x, i) => {
    const deck = deckElement(x.player === '1' ? 1 : 2);
    if (!deck) return;
    const d = deck.getBoundingClientRect();
    const r = x.rect;
    const ghost = x.copy;
    ghost.classList.add('ghost');
    ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    document.body.append(ghost);
    const dx = d.left + d.width / 2 - (r.left + r.width / 2);
    const dy = d.top + d.height / 2 - (r.top + r.height / 2);
    ghost.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(${d.width / r.width})`, opacity: 0.25 },
      ],
      { duration: 520, delay: i * 90, easing: 'cubic-bezier(.4,0,.5,1)', fill: 'both' },
    ).onfinish = () => ghost.remove();
  });
}

/** Fa lampeggiare le carte colpite o distrutte in questo step (classe CSS "flash", fatta ripartire da capo). */
export function flashCards(uids) {
  for (const uid of uids) {
    const el = document.querySelector('#app .card[data-uid="' + uid + '"]');
    if (!el) continue;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
}
