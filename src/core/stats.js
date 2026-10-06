// Raccolta: il riepilogo di una partita e le statistiche per leader e per matchup.
import { parseLog } from './parser/index.js';
import { buildSnapshots } from './engine/index.js';

// Il giocatore 1 è sempre chi ha scaricato il log ([You]), quindi "me" è lui in ogni partita.
export function summarize(text) {
  const parsed = parseLog(text);
  const last = buildSnapshots(parsed, { lastOnly: true }).snapshots[0];
  const side = (p) => {
    const P = parsed.players[p],
      L = P.leader;
    return { name: P.name, leader: L ? { id: L.id, name: L.name } : null };
  };
  return {
    me: side(1),
    opp: side(2),
    first: parsed.turns.length ? parsed.turns[0].player : 0,
    result: (last && last.result) || null,
    turns: parsed.turns.length,
    steps: parsed.steps.length,
  };
}
// OPTCGSim chiama i log 2026-09-23T13.26.58.log: la data della partita sta nel nome (ora locale). null se il nome è un altro.
export function gameDate(fileName) {
  const m = /(\d{4})-(\d{2})-(\d{2})T(\d{2})\.(\d{2})\.(\d{2})/.exec(fileName || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null;
}
// 'w' | 'l' | 'o': gli esiti mancanti o incerti (abbandono, disconnessione) restano fuori dal winrate
export const outcome = (g) => (!g.result || g.result.uncertain ? 'o' : g.result.winner === 1 ? 'w' : 'l');
export const winrate = (b) => (b.w + b.l ? Math.round((100 * b.w) / (b.w + b.l)) : null);
// games = riepiloghi di summarize(). Esce un blocco per ogni mio leader, con dentro i matchup (anche divisi tra primo e secondo).
export function stats(games) {
  const blank = () => ({ games: 0, w: 0, l: 0, open: 0 });
  const add = (b, r) => {
    b.games++;
    if (r === 'w') b.w++;
    else if (r === 'l') b.l++;
    else b.open++;
  };
  const total = blank(),
    leaders = new Map();
  for (const g of games) {
    if (!g || !g.me || !g.me.leader) continue;
    const r = outcome(g),
      mine = g.me.leader,
      theirs = g.opp.leader || { id: '?', name: '?' };
    add(total, r);
    let L = leaders.get(mine.id);
    if (!L) leaders.set(mine.id, (L = Object.assign(blank(), { id: mine.id, name: mine.name, matchups: new Map() })));
    add(L, r);
    let M = L.matchups.get(theirs.id);
    if (!M)
      L.matchups.set(
        theirs.id,
        (M = Object.assign(blank(), { id: theirs.id, name: theirs.name, first: blank(), second: blank() })),
      );
    add(M, r);
    add(g.first === 1 ? M.first : M.second, r);
  }
  const byGames = (a, b) => b.games - a.games;
  return {
    total,
    leaders: [...leaders.values()]
      .map((L) => Object.assign({}, L, { matchups: [...L.matchups.values()].sort(byGames) }))
      .sort(byGames),
  };
}
