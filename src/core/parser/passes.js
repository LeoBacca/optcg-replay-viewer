// Passate successive del parser: partono dalla lista grezza degli step e la sistemano, una cosa per volta.
// Ogni funzione modifica la lista sul posto (o ne restituisce una nuova) e vengono chiamate in ordine da parser/index.js.
import { makeStep } from './step.js';

// step sintetici: code non possedute di 0>0 (>=3), 1>0, 0>3 alla fine di uno step
export function splitSetupMoves(steps) {
  const out = [];
  for (const st of steps) {
    let k = st.moves.length;
    while (k > 0) {
      const mv = st.moves[k - 1];
      const setupish =
        !mv.prot && ((mv.fz === 0 && mv.tz === 0) || (mv.fz === 1 && mv.tz === 0) || (mv.fz === 0 && mv.tz === 3));
      if (!setupish) break;
      k--;
    }
    const tail = st.moves.slice(k);
    const zeroOnly = tail.every((mv) => mv.fz === 0 && mv.tz === 0);
    if (tail.length && (!zeroOnly || tail.length >= 3) && st.kind !== 'synthetic') {
      st.moves = st.moves.slice(0, k);
      out.push(st);
      let grp = null;
      for (const mv of tail) {
        const key = mv.player + ':' + mv.fz + '>' + mv.tz;
        if (!grp || grp.key !== key) {
          grp = makeStep('synthetic', mv.player, '', {
            key,
            delay: 0.3,
            turn: st.turn,
            active: st.active,
            line: mv.line,
          });
          out.push(grp);
        }
        grp.moves.push(mv);
      }
      // le asserzioni restano sull'ultimo step emesso
      if (st.assertions.length) {
        grp.assertions = st.assertions;
        st.assertions = [];
      }
    } else out.push(st);
  }
  return out;
}

// "Guarda le prime N carte" (Perona, Otama...). Il log dà la carta presa (Reveal and Draw) e, sotto "Placing Cards on Bottom of Deck",
// le altre, una mossa mazzo → fondo del mazzo per carta, con il suo codice. Aggiungo prima uno step "guarda" con tutte le carte viste.
export function addLookSteps(out) {
  for (let k = 0; k < out.length; k++) {
    const B = out[k];
    if (B.kind !== 'bottom' || !B.moves.length || !B.moves.every((mv) => mv.fz === 0 && mv.tz === 0)) continue;
    const rv = k > 0 && out[k - 1].kind === 'reveal' && out[k - 1].player === B.player ? out[k - 1] : null;
    const take = rv ? rv.moves.find((mv) => mv.fz === 0 && mv.tz === 1) : null;
    // senza altro, l'ordine è quello del log: la carta presa, poi le altre come vanno in fondo
    let order = B.moves.map((mv) => mv.id);
    if (take) order.unshift(take.id);
    // Ordine vero in cima al mazzo (la cima è l'indice più alto). Ogni mossa verso il fondo alza di un posto le carte che stavano sotto:
    // seguo gli n posti in cima e assegno a ognuno la carta che la mossa va a prendere lì.
    const deck = B.moves[0].chk ? B.moves[0].chk.deck : 0;
    if (deck) {
      const slots = B.moves.map((_, i) => ({ at: deck - 1 - i, id: null }));
      const ok = B.moves.every((mv) => {
        const sl = slots.find((x) => !x.id && x.at === mv.fi);
        if (!sl) return false;
        sl.id = mv.id;
        for (const x of slots) if (!x.id && x.at < mv.fi) x.at++;
        return true;
      });
      const pos = take ? deck - take.fi : 0; // posto della carta presa, contando dalla cima, prima che uscisse dal mazzo
      if (ok && pos >= 0 && pos <= slots.length) {
        order = slots.map((x) => x.id);
        if (take) order.splice(pos, 0, take.id);
      }
    }
    const first = rv || B,
      src = rv && rv.src ? rv.src : null;
    const look = makeStep(
      'look',
      B.player,
      (src ? src.name + ': ' : '') + 'guarda le prime ' + order.length + ' carte',
      {
        look: order,
        cards: src ? [src] : [],
        delay: 1.3,
        turn: first.turn,
        active: first.active,
        line: first.line,
        actor: first.actor,
      },
    );
    if (src) look.src = src;
    out.splice(rv ? k - 1 : k, 0, look);
    k++;
  }
}

// Eventi giocati dalla mano. Il log scrive prima gli effetti ("Evento: Rest X") e solo dopo le mosse: DON del costo, evento mano → trash.
// Aggiungo uno step "gioca" prima del primo effetto e uno di chiusura dopo l'ultimo: tra i due la carta sta risolvendo (state.resolving)
// e il tavolo la mostra accanto al leader. Le mosse restano dove le mette il log; solo il DON del costo viene anticipato al "gioca".
export function addEventSteps(out) {
  const NEUTRAL = new Set(['draw', 'synthetic', 'bottom', 'look']);
  const isSrc = (st, mv) => !!st.src && st.src.id === mv.id && st.player === mv.player;
  for (let k = 0; k < out.length; k++) {
    const S = out[k];
    const j = S.moves.findIndex((mv) => mv.fz === 1 && mv.tz === 6 && !mv.prot && !mv.evt);
    if (j < 0) continue;
    const ev = S.moves[j];
    ev.evt = true;
    let a = isSrc(S, ev) ? k : -1;
    for (let i = k - 1; i >= 0; i--) {
      const st = out[i];
      if (isSrc(st, ev)) a = i;
      else if (!NEUTRAL.has(st.kind) || st.player !== ev.player || st.moves.some((mv) => mv.evt && mv.id === ev.id))
        break;
    }
    if (a < 0) {
      k--;
      continue;
    } // nessun effetto con questa sorgente: non è un evento riconoscibile (k-- per cercare altre mosse nello stesso step)
    let e = k;
    for (let i = k + 1; i < out.length; i++) {
      const st = out[i];
      if (isSrc(st, ev) || (st.kind === 'draw' && st.player === ev.player)) e = i;
      else break;
    }
    const card = out[a].src;
    const play = makeStep('event', ev.player, 'gioca ' + card.name, {
      cards: [card],
      delay: 1,
      turn: out[a].turn,
      active: out[a].active,
      line: out[a].line,
      actor: out[a].actor,
    });
    const end = makeStep('eventEnd', ev.player, card.name + ' va nel trash', {
      cards: [card],
      delay: 0.8,
      turn: out[e].turn,
      active: out[e].active,
      line: out[e].line,
      actor: out[e].actor,
    });
    // DON del costo: i riposi non posseduti subito prima della mossa dell'evento. Si anticipano solo se nel frattempo nessun'altra mossa tocca i DON di quel giocatore.
    let c = j;
    while (
      c > 0 &&
      S.moves[c - 1].id === 'Don' &&
      S.moves[c - 1].fz === 5 &&
      S.moves[c - 1].tz === 5 &&
      S.moves[c - 1].f3 === 1 &&
      !S.moves[c - 1].prot &&
      S.moves[c - 1].player === ev.player
    )
      c--;
    const cost = S.moves.slice(c, j);
    const otherDon = out
      .slice(a, k + 1)
      .some((st) => st.moves.some((mv) => mv.id === 'Don' && mv.player === ev.player && !cost.includes(mv)));
    if (cost.length && !otherDon) {
      S.moves.splice(c, cost.length);
      for (const mv of cost) mv.chk = null;
      play.moves = cost;
    }
    // quale copia in mano è quella giocata: parto dall'indice della mossa (ev.fi) e disfo a ritroso le mosse sulla mano fatte nel frattempo
    let hi = ev.fi;
    const between = [];
    for (let i = a; i <= k; i++)
      for (const mv of out[i].moves) {
        if (mv === ev) break;
        if (mv.player === ev.player) between.push(mv);
      }
    for (let i = between.length - 1; i >= 0 && hi >= 0; i--) {
      const mv = between[i];
      if (mv.tz === 1 && mv.fz !== 1) {
        if (mv.ti < hi) hi--;
        else if (mv.ti === hi) hi = -1;
      } else if (mv.fz === 1 && mv.tz !== 1 && mv.fi <= hi) hi++;
    }
    play.handIdx = hi;
    if (out[e].assertions.length) {
      end.assertions = out[e].assertions;
      out[e].assertions = [];
    }
    out.splice(e + 1, 0, end);
    out.splice(a, 0, play);
    // S è scalato al posto k + 1: il giro successivo riparte da lui, per eventuali altre mosse di evento al suo interno
  }
}

// Potenze in combattimento. La riga "A[8000] vs B[9000]" arriva solo dopo counter e buff: da lì risalgo alle potenze al momento dell'attacco,
// togliendo quello che è stato aggiunto nel frattempo. Così contano anche i bonus fissi che il log non nomina (es. Mihawk +1000 contro certi leader).
export function computeCombatPowers(out) {
  for (let i = 0; i < out.length; i++) {
    const A = out[i];
    if (A.kind !== 'attack') continue;
    let atk = 0,
      def = 0,
      vs = null,
      D = A,
      d = A.cards[1].id; // D = lo step che dà il bersaglio: l'attacco, oppure il "Blocks" che lo cambia
    for (let j = i + 1; j < out.length && !vs; j++) {
      const st = out[j];
      if (st.kind === 'vs') vs = st;
      else if (
        st.kind === 'attack' ||
        st.kind === 'endTurn' ||
        st.kind === 'turnStart' ||
        st.kind === 'hit' ||
        st.kind === 'fail'
      )
        break;
      else if (st.kind === 'block') {
        D = st;
        d = st.cards[0].id;
        def = 0;
      } else if (st.kind === 'counter') {
        const m = /for Counter (\d+)/.exec(st.text);
        if (m) {
          st.amt = +m[1];
          st.side = 'def';
          def += st.amt;
        }
      } else if (st.kind === 'effect' && st.sub === 'buff' && st.target) {
        const m = /(-?\d+) for the /.exec(st.text),
          a = A.cards[0].id,
          t = st.target.id;
        // chi attacca potenzia di norma l'attaccante, chi difende il difensore
        const side =
          st.player === A.player
            ? t === a
              ? 'atk'
              : t === d
                ? 'def'
                : null
            : t === d
              ? 'def'
              : t === a
                ? 'atk'
                : null;
        if (m && side) {
          st.amt = +m[1];
          st.side = side;
          if (side === 'atk') atk += st.amt;
          else def += st.amt;
        }
      }
    }
    if (!vs || vs.atk == null || vs.def == null) continue;
    if (vs.cards[0] && vs.cards[0].id === A.cards[0].id) A.atk0 = vs.atk - atk;
    if (vs.cards[1] && vs.cards[1].id === d) D.def0 = vs.def - def; // con un blocker la riga "vs" parla di lui: la potenza del primo bersaglio non si ricava
  }
}

// Quale copia blocca. Con due copie uguali in campo il nome non basta: se il blocker viene distrutto, la sua mossa campo → trash dice il posto
// che aveva in Character Area. Vale la prima mossa che tocca i personaggi di quel giocatore dopo il "Blocks".
export function markBlockerCopies(out) {
  for (let i = 0; i < out.length; i++) {
    const B = out[i];
    if (B.kind !== 'block') continue;
    for (let j = i + 1; j < out.length; j++) {
      const st = out[j];
      const mv = st.moves.find((mv) => mv.player === B.player && (mv.fz === 2 || mv.tz === 2));
      if (mv) {
        if (mv.fz === 2 && mv.tz === 6 && mv.id === B.cards[0].id) B.charIdx = mv.fi;
        break;
      }
      if (
        st.kind === 'attack' ||
        st.kind === 'hit' ||
        st.kind === 'fail' ||
        st.kind === 'destroyed' ||
        st.kind === 'endTurn' ||
        st.kind === 'turnStart'
      )
        break;
    }
  }
}

// etichette + turni
export function labelSteps(out, nameMap) {
  const turns = [];
  const pname = (p) => (p === 1 ? 'Tu' : p === 2 ? 'Avv' : '');
  out.forEach((st, i) => {
    st.i = i;
    if (!st.player && st.actor && nameMap[st.actor]) st.player = nameMap[st.actor];
    if (st.kind === 'turnStart') turns.push({ n: st.turn, player: st.player, first: i });
    if (st.kind === 'synthetic') {
      const [, tr] = st.key.split(':');
      st.text =
        tr === '0>0'
          ? 'mescola il deck'
          : tr === '1>0'
            ? 'rimette la mano nel deck'
            : tr === '0>3'
              ? 'mette le ' + st.moves.length + ' Life'
              : 'sistema le carte';
    }
    if (st.kind === 'draw') {
      st.text = 'pesca ' + (st.cards[0] ? st.cards[0].name : 'una carta');
    }
    st.label = (st.player ? pname(st.player) + ': ' : '') + st.text;
  });
  return turns;
}
