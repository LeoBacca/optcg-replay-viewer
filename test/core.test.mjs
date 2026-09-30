import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const coreSrc = html.split('<script id="core">')[1].split('</script>')[0];
const mod = {};
new Function('module', coreSrc)(mod);
const Core = mod.exports;

const sampleLog = readFileSync(new URL('Esempio COmbat log/2026-09-23T13.26.58.log', root), 'utf8');
const lines = sampleLog.split('\n');

const replay = (text) => {
  const parsed = Core.parseLog(text);
  return { parsed, ...Core.buildSnapshots(parsed, { debug: true }) };
};

test('il log di esempio si ricostruisce senza incoerenze', () => {
  const { parsed, mismatches } = replay(sampleLog);
  assert.deepEqual(mismatches, []);
  assert.equal(parsed.turns.length, 17);
  assert.equal(parsed.moveCount, 641);
  assert.equal(parsed.steps.reduce((n, s) => n + s.moves.length, 0), 641);
});

test('Reveal and Draw in grassetto viene riconosciuto e prende la sua mossa', () => {
  const { parsed } = replay(sampleLog);
  const reveals = parsed.steps.filter((s) => s.kind === 'reveal');
  assert.equal(reveals.length, 11);
  const first = reveals.find((s) => s.line === 732);
  assert.equal(first.target.id, 'OP06-038');
  assert.deepEqual(first.moves.map((m) => [m.fz, m.tz, m.id]), [[0, 1, 'OP06-038']]);
});

test('il log di esempio non lascia righe non riconosciute', () => {
  const { parsed } = replay(sampleLog);
  assert.deepEqual(parsed.steps.filter((s) => s.kind === 'unknown').map((s) => s.line), []);
});

test('il Trash per sostituire un personaggio ha un suo step', () => {
  const { parsed } = replay(sampleLog);
  const trash = parsed.steps.filter((s) => s.kind === 'trash').map((s) => [s.line, s.cards[0].id]);
  assert.deepEqual(trash, [[1724, 'ST32-001'], [1739, 'OP12-034']]);
});

test('una riga di un attore non associato a un giocatore non blocca il replay', () => {
  const at = lines.findIndex((l) => / attacking /.test(l));
  const injected = [
    '[Sconosciuto#1] Yasopp ["OP17-031">OP17-031] attacking Dracule Mihawk ["OP14-020">OP14-020]',
    '[Sconosciuto#1] Yasopp ["OP17-031">OP17-031] Destroyed',
    '[Sconosciuto#1] Leader is Dracule Mihawk ["OP14-020">OP14-020]',
  ];
  const text = [...lines.slice(0, at), ...injected, ...lines.slice(at)].join('\n');
  const { mismatches } = replay(text);
  assert.deepEqual(mismatches, []);
});

test('le carte entrate in mano in modo pubblico restano note finché non escono', () => {
  const { snapshots } = replay(sampleLog);
  const known = (step, player) => snapshots[step].players[player].hand.filter((c) => c.known).map((c) => [c.id, c.known]);
  assert.deepEqual(known(26, 2), []);
  assert.deepEqual(known(27, 2), [['ST32-001', 'revealed']]);
  assert.deepEqual(known(199, 2), [['OP17-022', 'revealed'], ['OP12-034', 'field']]);
  assert.deepEqual(known(402, 2), [['OP06-038', 'revealed'], ['OP01-055', 'revealed']]);
  assert.deepEqual(known(408, 2), [['OP06-038', 'revealed']]);
  assert.deepEqual(known(157, 1), [['ST32-001', 'field'], ['OP12-034', 'field']]);
});

test('le carte pescate o prese dalla Life non sono note', () => {
  const { snapshots } = replay(sampleLog);
  const last = snapshots[snapshots.length - 1];
  assert.equal(last.players[2].hand.length, 8);
  assert.deepEqual(last.players[2].hand.filter((c) => c.known), []);
});

test('il riepilogo dice leader, chi inizia ed esito della partita', () => {
  const s = Core.summarize(sampleLog);
  assert.deepEqual(s.me, { name: 'LeoIlPirata#3980', leader: { id: 'OP14-020', name: 'Dracule Mihawk' } });
  assert.deepEqual(s.opp, { name: 'Theshyopop#27381', leader: { id: 'OP14-020', name: 'Dracule Mihawk' } });
  assert.equal(s.first, 2);
  assert.deepEqual(s.result, { winner: 1, how: 'concede' });
  assert.equal(s.turns, 17);
});

test('lastOnly restituisce lo stesso stato finale del replay completo', () => {
  const parsed = Core.parseLog(sampleLog);
  const full = Core.buildSnapshots(parsed).snapshots;
  const last = Core.buildSnapshots(Core.parseLog(sampleLog), { lastOnly: true }).snapshots;
  assert.equal(last.length, 1);
  const zones = (S) => [1, 2].map((p) => ['hand', 'chars', 'life', 'trash'].map((z) => S.players[p][z].map((c) => c.id)));
  assert.deepEqual(zones(last[0]), zones(full[full.length - 1]));
  assert.deepEqual(last[0].result, full[full.length - 1].result);
});

test('un log troncato prima della fine non ha esito', () => {
  const cut = lines.slice(0, lines.findIndex((l) => /Concedes!/.test(l))).join('\n');
  assert.equal(Core.summarize(cut).result, null);
});

test('la data della partita viene dal nome del file', () => {
  assert.equal(Core.gameDate('2026-09-23T13.26.58.log'), new Date(2026, 8, 23, 13, 26, 58).getTime());
  assert.equal(Core.gameDate('partita.log'), null);
});

test('le statistiche raggruppano per mio leader e per matchup, con gli esiti incerti fuori dal winrate', () => {
  const game = (mine, theirs, first, result) => ({ me: { name: 'Io', leader: { id: mine, name: mine } }, opp: { name: 'X', leader: { id: theirs, name: theirs } }, first, result });
  const win = { winner: 1, how: 'lethal' }, loss = { winner: 2, how: 'concede' }, unsure = { winner: 1, how: 'quit', uncertain: true };
  const st = Core.stats([
    game('A', 'B', 1, win), game('A', 'B', 1, win), game('A', 'B', 2, loss), game('A', 'B', 2, unsure),
    game('A', 'C', 2, loss), game('D', 'B', 1, null), { error: true },
  ]);
  assert.deepEqual(st.total, { games: 6, w: 2, l: 2, open: 2 });
  assert.deepEqual(st.leaders.map((L) => [L.id, L.games]), [['A', 5], ['D', 1]]);
  const [ab, ac] = st.leaders[0].matchups;
  assert.deepEqual([ab.id, ab.games, ab.w, ab.l, ab.open], ['B', 4, 2, 1, 1]);
  assert.deepEqual(ab.first, { games: 2, w: 2, l: 0, open: 0 });
  assert.deepEqual(ab.second, { games: 2, w: 0, l: 1, open: 1 });
  assert.equal(Core.winrate(ab), 67);
  assert.equal(Core.winrate(ac), 0);
  assert.equal(Core.winrate(st.leaders[1]), null);
});
