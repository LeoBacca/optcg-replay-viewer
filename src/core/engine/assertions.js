// Confronta lo stato ricostruito con i controlli che il log scrive ogni tanto (mano, campo, trash, life).

export function checkAssertions(state, st, dbg) {
  for (const a of st.assertions) {
    const p = a.player || (state.players[1].name === a.actor ? 1 : state.players[2].name === a.actor ? 2 : 0);
    if (!p) continue;
    const P = state.players[p];
    const ids = (arr) => arr.map((c) => c.id).join(',');
    let got = null,
      exp = a.val;
    if (a.kind === 'Hand' || a.kind === 'Hand after Mulligan') got = '[' + ids(P.hand) + ']';
    else if (a.kind === 'Board') got = '[' + ids(P.chars) + ']';
    else if (a.kind === 'Trash') got = '[' + ids(P.trash) + ']';
    else if (a.kind === 'Life') got = String(P.life.length);
    if (got !== null && got !== exp)
      dbg.push('SNAPSHOT r' + a.line + ' p' + p + ' ' + a.kind + ': stato ' + got + ' vs log ' + exp);
  }
}
