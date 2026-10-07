// Motore: dagli step del parser allo stato del tavolo dopo ogni step.
import { mkPlayer } from './state.js';
import { isShuffle } from './deck-bottom.js';
import { applyMove } from './moves.js';
import { applyText, clearMods, applyAuras } from './effects.js';
import { checkAssertions } from './assertions.js';

/**
 * Ricostruisce la partita uno step alla volta e fotografa lo stato dopo ognuno.
 * @param {object} parsed  quello che esce da parseLog
 * @param {{ debug?: boolean, lastOnly?: boolean }} [opts]
 *   debug: raccoglie incoerenze e dubbi; lastOnly: tiene solo lo stato finale (basta per sapere l'esito)
 * @returns {{ snapshots: object[], mismatches: string[], doubts: string[] }}
 *   snapshots[i] = stato del tavolo dopo lo step i
 */
export function buildSnapshots(parsed, opts) {
  opts = opts || {};
  const dbg = opts.debug ? [] : null,
    doubts = opts.debug ? [] : null;
  const state = {
    turn: 0,
    active: 0,
    result: null,
    combat: null,
    resolving: null,
    look: null,
    flash: [],
    players: {
      1: mkPlayer(parsed.players[1].name, parsed.players[1].leader ? parsed.players[1].leader.id : null),
      2: mkPlayer(parsed.players[2].name, parsed.players[2].leader ? parsed.players[2].leader.id : null),
    },
  };
  const snapshots = [];
  const lastStep = parsed.steps[parsed.steps.length - 1];
  for (const st of parsed.steps) {
    state.flash = [];
    if (st.kind === 'leader' && st.player) state.players[st.player].leader.id = st.cards[0].id;
    applyText(state, st, dbg, doubts);
    const shuf = isShuffle(st);
    for (const mv of st.moves) applyMove(state, mv, dbg, st, doubts, shuf);
    applyAuras(state);
    if (dbg) checkAssertions(state, st, dbg);
    // lastOnly: solo lo stato finale (basta per l'esito, evita una copia per step)
    if (!opts.lastOnly || st === lastStep)
      snapshots.push(
        typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state)),
      );
    if (st.kind === 'hit' || st.kind === 'fail' || (st.kind === 'destroyed' && state.combat)) {
      state.combat = null;
      clearMods(state, 'combat');
    }
  }
  return { snapshots, mismatches: dbg || [], doubts: doubts || [] };
}
