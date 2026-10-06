// Applica una mossa del log (riga RZ1) allo stato del tavolo: sposta una carta o un DON da una zona all'altra.
import { nextUid, mkCard, zoneArr, donTarget } from './state.js';
import { deckOut, deckIn } from './deck-bottom.js';

const KNOWN_FROM_ZONE = { 2: 'field', 6: 'trash', 7: 'field' };
function knownReason(mv, st) {
  if (KNOWN_FROM_ZONE[mv.fz]) return KNOWN_FROM_ZONE[mv.fz];
  if (mv.fz === 0 && st && st.kind === 'reveal') return 'revealed';
  return null;
}

/**
 * @param {object} state   stato del tavolo, modificato sul posto
 * @param {object} mv      la mossa: { player, id, fz, fi, tz, ti, f3, chk, line }
 * @param {string[]|null} dbg     se c'è, raccoglie le incoerenze con i controlli (CHK) del log
 * @param {object} st      lo step a cui la mossa appartiene
 * @param {string[]|null} doubts  se c'è, raccoglie i punti in cui la ricostruzione non torna con le regole del gioco
 * @param {boolean} shuf   la mossa fa parte di una rimescolata del mazzo
 */
export function applyMove(state, mv, dbg, st, doubts, shuf) {
  const P = state.players[mv.player];
  const { fz, tz, fi, ti, id, f3 } = mv;
  try {
    if (fz === 0 && tz === 0) {
      if (shuf) P.bottom.length = 0;
      else {
        deckOut(P, mv, doubts);
        deckIn(P, mv, st);
      }
    } else if (fz === 5 && tz === 5) {
      const d = P.donPool[fi];
      if (d) d.rested = f3 === 1;
      else dbg && dbg.push('DON pool idx ' + fi + ' mancante (r' + mv.line + ')');
    } else if (fz === 5 && tz === 9) {
      P.donPool.splice(fi, 1);
      const t = donTarget(P, ti);
      if (t) t.don++;
      else dbg && dbg.push('DON attach target ' + ti + ' mancante (r' + mv.line + ')');
    } else if (fz === 9 && tz === 5) {
      const t = donTarget(P, fi);
      if (t && t.don > 0) t.don--;
      P.donPool.splice(Math.min(ti, P.donPool.length), 0, { uid: nextUid(), rested: f3 === 1 });
    } else if (fz === 4 && tz === 5) {
      P.donDeck--;
      P.donPool.splice(Math.min(ti, P.donPool.length), 0, { uid: nextUid(), rested: f3 === 1 });
    } else if (fz === 5 && tz === 4) {
      P.donPool.splice(fi, 1);
      P.donDeck++;
    } else if (fz === 9 && tz === 4) {
      const t = donTarget(P, fi);
      if (t && t.don > 0) t.don--;
      else dbg && dbg.push('DON attaccato a ' + fi + ' mancante (r' + mv.line + ')');
      P.donDeck++;
    } // "Minus N Don" pagato con un DON attaccato
    else {
      let card = null;
      if (fz === 0) {
        P.deck--;
        deckOut(P, mv, doubts);
        card = mkCard(id);
        // la carta presa tra quelle guardate è la stessa carta: tiene il suo uid, così sul tavolo è lei a spostarsi in mano
        const L = state.look,
          k = L && L.p === mv.player && tz === 1 ? L.cards.findIndex((c) => c.id === id) : -1;
        if (k >= 0) card.uid = L.cards.splice(k, 1)[0].uid;
      } else {
        const a = zoneArr(P, fz);
        // evento in risoluzione: se nel trash va un'altra copia rispetto a quella segnata al "gioca", è quella la carta che sta risolvendo
        const R = state.resolving;
        if (R && fz === 1 && tz === 6 && R.p === mv.player && R.id === id && a[fi] && a[fi].id === id)
          R.uid = a[fi].uid;
        if (a) {
          card = a.splice(fi, 1)[0];
        }
        if (!card) {
          dbg && dbg.push('carta ' + id + ' non trovata in zona ' + fz + '[' + fi + '] (r' + mv.line + ')');
          card = mkCard(id);
        }
        if (card.id !== id) card.id = id;
        // quando un personaggio torna in mano, f3 dice se era riposato (nelle mosse verso il trash invece è sempre 0)
        if (doubts && fz === 2 && tz === 1 && card.rested !== (f3 === 1))
          doubts.push(
            'r' +
              mv.line +
              ' ' +
              id +
              ': torna in mano ' +
              (f3 ? 'riposata' : 'attiva') +
              ' secondo il log, ma qui risulta ' +
              (card.rested ? 'riposata' : 'attiva'),
          );
        if (fz === 2 || fz === 7) {
          card.rested = false;
          card.don = 0;
          delete card.frozen;
        }
      }
      if (tz === 0) {
        P.deck++;
        deckIn(P, mv, st);
      } else {
        const a = zoneArr(P, tz);
        if (a) a.splice(Math.min(ti, a.length), 0, card);
        else dbg && dbg.push('zona sconosciuta ' + tz + ' (r' + mv.line + ')');
        if (tz === 2 || tz === 7) {
          card.rested = f3 === 1;
          card.don = 0;
        }
      } // f3 = la carta entra in campo riposata (es. giocata da un effetto)
      card.known = tz === 1 ? knownReason(mv, st) : null;
    }
  } catch (e) {
    dbg && dbg.push('errore mossa r' + mv.line + ': ' + e.message);
  }
  if (mv.chk) {
    const c = mv.chk;
    P.deck = c.deck;
    P.donDeck = c.donDeck;
    if (dbg) {
      const sumDon = P.leader.don + P.chars.reduce((a, x) => a + x.don, 0);
      const got = {
        hand: P.hand.length,
        chars: P.chars.length,
        life: P.life.length,
        donPool: P.donPool.length,
        trash: P.trash.length,
        stage: P.stage.length,
        donAttached: sumDon,
      };
      for (const k in got)
        if (got[k] !== c[k])
          dbg.push(
            'CHK seq ' +
              c.seq +
              ' p' +
              c.player +
              ' ' +
              k +
              ': stato ' +
              got[k] +
              ' vs log ' +
              c[k] +
              ' (r' +
              mv.line +
              ')',
          );
    }
  }
}
