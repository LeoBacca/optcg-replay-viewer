// Il fondo del mazzo: le carte di cui si conosce il posto perché sono state messe sotto una per una.

// Fondo del mazzo noto: P.bottom[0] è la carta più in fondo, come gli indici del mazzo nel log (la cima è l'indice più alto).
// Ci entrano le carte messe sotto una per una (searchate, "Send to Deck Bottom"); g = riga dello step, per raggrupparle. Una rimescolata lo azzera.
export function deckOut(P, mv, doubts) {
  if (mv.fi >= P.bottom.length) return;
  const c = P.bottom.splice(mv.fi, 1)[0];
  if (doubts && c.id !== mv.id)
    doubts.push('r' + mv.line + ' ' + mv.id + ': esce dal fondo del mazzo, ma in quel posto risultava ' + c.id);
}
export function deckIn(P, mv, st) {
  if (mv.ti === 0 || mv.ti < P.bottom.length) P.bottom.splice(mv.ti, 0, { id: mv.id, g: st ? st.line : 0 });
}
// rimescolata: il log riscrive il mazzo carta per carta, con i posti di arrivo 0, 1, 2…
export const isShuffle = (st) => {
  const dd = st.moves.filter((mv) => mv.fz === 0 && mv.tz === 0);
  return dd.length > 1 && dd[0].ti === 0 && dd[1].ti === 1;
};
