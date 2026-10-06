// Applica il testo di uno step allo stato del tavolo: tutto quello che NON è uno spostamento di carte
// (chi è di turno, carte che si riposano o si riattivano, combattimento, esito della partita).
import { ruleOf } from '../card-rules.js';
import { nextUid, findCard } from './state.js';

function ownerOf(state, uid) {
  for (const p of [1, 2]) {
    const P = state.players[p];
    if (P.leader.uid === uid) return p;
    for (const c of P.chars) if (c.uid === uid) return p;
  }
  return 0;
}
const PLAYERLESS_KINDS = new Set(['vs', 'hit', 'fail', 'phase']);
// refresh di inizio turno: stappa tutto, tranne le carte bloccate da un "will not Activate during next Refresh" (che saltano solo questo).
// frozen: 'pending' = deve ancora saltare il refresh; 'skipped' = l'ha saltato, resta segnata fino al refresh dopo, in cui stappa
function refresh(P) {
  const wake = (c) => {
    if (c.frozen === 'pending') c.frozen = 'skipped';
    else {
      c.rested = false;
      delete c.frozen;
    }
  };
  wake(P.leader);
  P.chars.forEach(wake);
  P.stage.forEach(wake);
  P.donPool.forEach(wake);
}

const who = (st) => 'r' + st.line + ' ' + st.text;
// doubts: punti in cui la ricostruzione non torna con le regole del gioco, o ha dovuto scegliere alla cieca. Non sono errori certi.
export function applyText(state, st, dbg, doubts) {
  const P = st.player ? state.players[st.player] : null;
  const O = st.player ? state.players[st.player === 1 ? 2 : 1] : null;
  if (!P && !PLAYERLESS_KINDS.has(st.kind)) return;
  switch (st.kind) {
    case 'turnStart':
      state.turn = st.turn;
      state.active = st.player;
      refresh(P);
      state.combat = null;
      state.resolving = null;
      state.look = null;
      break;
    // carte guardate in cima al mazzo: restano in vista finché quella presa non va in mano e le altre non tornano in fondo
    case 'look':
      state.look = { p: st.player, title: st.text, cards: st.look.map((id) => ({ uid: nextUid(), id })) };
      break;
    case 'bottom':
      state.look = null;
      break;
    case 'event': {
      const id = st.cards[0].id;
      let c = st.handIdx >= 0 ? P.hand[st.handIdx] : null;
      if (!c || c.id !== id) c = P.hand.find((x) => x.id === id);
      state.resolving = c ? { p: st.player, uid: c.uid, id } : null;
      break;
    }
    case 'eventEnd':
      state.resolving = null;
      break;
    case 'attack': {
      const a = findCard(P, st.cards[0].id, { prefer: 'active' });
      const d = findCard(O, st.cards[1].id, { prefer: 'rested' });
      if (doubts) {
        if (a && a.rested) doubts.push(who(st) + ': attacca ma risulta già riposato');
        if (d && d !== O.leader && !d.rested) doubts.push(who(st) + ': il personaggio attaccato risulta attivo');
      }
      if (a) a.rested = true;
      state.combat = {
        attacker: a ? a.uid : null,
        defender: d ? d.uid : null,
        aName: st.cards[0].name,
        dName: st.cards[1].name,
        atk: st.atk0 != null ? st.atk0 : null,
        def: st.def0 != null ? st.def0 : null,
        buffs: [],
        result: null,
      };
      break;
    }
    case 'block': {
      // il blocker si riposa e prende il posto del bersaglio: da qui la freccia punta a lui
      let b = st.charIdx != null ? P.chars[st.charIdx] : null;
      if (!b || b.id !== st.cards[0].id) b = findCard(P, st.cards[0].id, { prefer: 'active' });
      if (doubts && b && b.rested) doubts.push(who(st) + ': blocca ma risulta già riposato');
      if (b) b.rested = true;
      if (state.combat) {
        state.combat.defender = b ? b.uid : null;
        state.combat.dName = st.cards[0].name;
        state.combat.def = st.def0 != null ? st.def0 : null;
      }
      break;
    }
    case 'counter':
      if (state.combat && st.side && state.combat[st.side] != null) state.combat[st.side] += st.amt;
      break;
    case 'vs':
      if (state.combat) {
        state.combat.atk = st.atk;
        state.combat.def = st.def;
      } else
        state.combat = {
          attacker: null,
          defender: null,
          aName: st.cards[0] && st.cards[0].name,
          dName: st.cards[1] && st.cards[1].name,
          atk: st.atk,
          def: st.def,
          buffs: [],
          result: null,
        };
      break;
    case 'hit':
      if (state.combat) {
        state.combat.result = 'hit ' + st.dmg;
        const t = state.combat.defender;
        if (t) state.flash.push(t);
        // danno letale: il difensore è un leader senza life
        const owner = t && ownerOf(state, t);
        if (owner && state.players[owner].leader.uid === t && state.players[owner].life.length === 0 && !state.result)
          state.result = { winner: owner === 1 ? 2 : 1, how: 'lethal' };
      }
      break;
    case 'fail':
      if (state.combat) {
        state.combat.result = 'fail';
      }
      break;
    case 'destroyed': {
      // se cade il bersaglio del combattimento è proprio quella copia, non un'altra con lo stesso nome
      const t = state.combat && P.chars.find((x) => x.uid === state.combat.defender && x.id === st.cards[0].id);
      const c = t || findCard(P, st.cards[0].id, { prefer: 'rested' });
      if (c) state.flash.push(c.uid);
      if (state.combat) state.combat.result = 'destroyed';
      break;
    }
    case 'effect': {
      const src = st.src,
        t = st.target;
      if (!t) break;
      if (st.sub === 'rest') {
        const list = ruleOf(src, 'rest'),
          rule = Array.isArray(list) ? list[Math.min(st.nth || 0, list.length - 1)] : list;
        const ownFirst = rule ? rule === 'own' : !!src && (P.leader.id === src.id || src.id === t.id);
        const order = ownFirst ? [P, O] : [O, P];
        let c = null;
        for (const side of order) {
          const x = findCard(side, t.id, { prefer: 'active' });
          if (x && !x.rested) {
            c = x;
            break;
          }
          c = c || x;
        }
        if (doubts) {
          const free = (side) => {
            const x = findCard(side, t.id, { prefer: 'active' });
            return !!x && !x.rested;
          };
          if (!c) doubts.push(who(st) + ': nessuna carta in campo con quel nome');
          else if (!rule && free(P) && free(O))
            doubts.push(
              who(st) +
                ": bersaglio ambiguo, ce n'è una attiva per lato; scelto il lato " +
                (ownFirst ? 'di chi gioca' : 'avversario') +
                '. Serve una regola per ' +
                src.id,
            );
        }
        if (c) c.rested = true;
      } else if (st.sub === 'active') {
        let c = findCard(P, t.id, { prefer: 'rested' }) || findCard(O, t.id, { prefer: 'rested' });
        if (doubts && (!c || !c.rested)) doubts.push(who(st) + ': nessuna carta riposata con quel nome');
        if (c) c.rested = false;
      } else if (st.sub === 'freeze') {
        // "X: Y will not Activate during next Refresh": Y resta riposato al prossimo refresh del suo proprietario (di norma l'avversario di chi gioca X)
        if (t.id === 'Don') {
          const free = (x) => x.frozen !== 'pending';
          const d =
            O.donPool.find((x) => x.rested && free(x)) ||
            P.donPool.find((x) => x.rested && free(x)) ||
            O.donPool.find(free);
          if (d) d.frozen = 'pending';
          else if (doubts) doubts.push(who(st) + ': nessun DON da bloccare');
        } else {
          // una riga per bersaglio (Luna ne scrive una per ogni carta): tra le copie uguali vale la prima riposata non ancora bloccata
          const pick = (side) => {
            const pool = [side.leader, ...side.chars, ...side.stage].filter(
              (x) => x.id === t.id && x.frozen !== 'pending',
            );
            return pool.find((x) => x.rested) || pool[0] || null;
          };
          const c = pick(O) || pick(P);
          if (c) c.frozen = 'pending';
          else if (doubts) doubts.push(who(st) + ': nessuna carta in campo con quel nome');
        }
      } else if (st.sub === 'buff') {
        if (state.combat) {
          state.combat.buffs.push(st.text.replace(/^.*?: /, ''));
          if (st.side && state.combat[st.side] != null) state.combat[st.side] += st.amt;
        }
      } else if (st.sub === 'destroy') {
        const c = findCard(O, t.id, { prefer: 'rested' }) || findCard(P, t.id);
        if (c) state.flash.push(c.uid);
      }
      break;
    }
    case 'phase': {
      const t = st.text;
      if (/Concedes/.test(t) && st.player) state.result = { winner: st.player === 1 ? 2 : 1, how: 'concede' };
      else if (/Disconnected/.test(t) && !state.result)
        state.result = { winner: /^Opponent/.test(t) ? 1 : 2, how: 'disconnect', uncertain: true };
      else if (/Quits/.test(t) && st.player && !state.result)
        state.result = { winner: st.player === 1 ? 2 : 1, how: 'quit', uncertain: true };
      break;
    }
  }
}
