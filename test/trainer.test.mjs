import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const T = createRequire(import.meta.url)('../desktop/trainer.js');
const html = readFileSync(new URL('index.html', root), 'utf8');
const mod = {};
new Function('module', html.split('<script id="core">')[1].split('</script>')[0])(mod);
const Core = mod.exports;
const sampleLog = readFileSync(new URL('test/esempio.log', root), 'utf8');

// generatore ripetibile, per avere sempre le stesse mani
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const deck = T.DECKS.mihawk;

test('trainer: il mazzo è da 50 carte', () => {
  assert.equal(Object.values(deck.cards).reduce((a, b) => a + b, 0), 50);
});

test('trainer: ogni searchata manda sotto 4 o 5 carte, senza mai superare le copie del mazzo', () => {
  const sizes = new Set();
  for (let s = 1; s <= 200; s++) {
    const blocks = T.deal(deck, 5, seeded(s));
    assert.equal(blocks.length, 5);
    const seen = {};
    for (const b of blocks) { sizes.add(b.length); for (const id of b) seen[id] = (seen[id] || 0) + 1; }
    for (const id in seen) assert.ok(seen[id] <= deck.cards[id], id + ' ×' + seen[id]);
  }
  assert.deepEqual([...sizes].sort(), [4, 5]);
});

test('trainer: il punteggio conta il posto esatto e due copie uguali valgono lo stesso', () => {
  const blocks = [['A', 'A', 'B', 'C'], ['D', 'E', 'F', 'G', 'A']];
  const right = T.score(blocks, blocks.flat());
  assert.equal(right.perfect, true); assert.equal(right.pct, 100);
  const swapped = T.score(blocks, ['A', 'B', 'A', 'C', 'D', 'E', 'F', 'G', 'A']);
  assert.equal(swapped.perfect, false); assert.equal(swapped.right, 7);
  assert.deepEqual(swapped.marks.slice(0, 4), [true, false, false, true]);
  assert.deepEqual(swapped.perBlock, [{ right: 2, total: 4 }, { right: 5, total: 5 }]);
});

test('trainer: un livello si supera solo con la perfetta, che apre il successivo; tre di fila lo consolidano', () => {
  const s = T.example(), ok = { perfect: true, pct: 100 }, no = { perfect: false, pct: 75 };
  T.record(s, 1, no, 9000);
  assert.equal(s.unlocked, 1); assert.equal(T.passed(s, 1), false); assert.equal(T.statOf(s, 1).bestPct, 75);
  T.record(s, 1, ok, 8000);
  assert.equal(s.unlocked, 2); assert.equal(T.passed(s, 1), true);
  T.record(s, 1, ok, 5000); T.record(s, 1, no, 4000);
  assert.equal(T.mastered(s, 1), false); assert.equal(T.statOf(s, 1).streak, 0); assert.equal(T.statOf(s, 1).bestMs, 5000);
  for (let i = 0; i < 3; i++) T.record(s, 1, ok, 7000);
  assert.equal(T.mastered(s, 1), true); assert.equal(s.unlocked, 2);
  const last = T.LEVELS.length; s.unlocked = last; T.record(s, last, ok, 1);
  assert.equal(s.unlocked, last);
});

// ---- il fondo del mazzo nel motore del replay ----
const replay = (text) => { const parsed = Core.parseLog(text); return { parsed, ...Core.buildSnapshots(parsed, { debug: true }) }; };

test('fondo del mazzo: dopo Perona le quattro carte stanno sotto nell\'ordine del log, l\'ultima più in fondo', () => {
  const r = replay(sampleLog);
  const line = sampleLog.split('\n').findIndex((l) => l.startsWith('RZ1|304|1|OP17-031|0|')) + 1;
  const step = r.parsed.steps.find((s) => s.moves.some((m) => m.line === line));
  const B = r.snapshots[r.parsed.steps.indexOf(step)].players[1].bottom;
  assert.deepEqual(B.slice(0, 4).map((c) => c.id), ['OP17-031', 'ST32-002', 'OP07-022', 'OP06-038']);
  assert.deepEqual(T.groups(B).at(-1), ['OP06-038', 'OP07-022', 'ST32-002', 'OP17-031']);
});

test('fondo del mazzo: all\'inizio è vuoto (la rimescolata non conta) e non supera mai le carte nel mazzo', () => {
  const r = replay(sampleLog);
  const first = r.snapshots[r.parsed.steps.findIndex((s) => s.kind === 'turnStart')];
  assert.deepEqual(first.players[1].bottom, []); assert.deepEqual(first.players[2].bottom, []);
  for (const S of r.snapshots) for (const p of [1, 2]) assert.ok(S.players[p].bottom.length <= S.players[p].deck);
  assert.ok(r.snapshots.at(-1).players[1].bottom.length >= 4);
  assert.deepEqual(r.doubts.filter((d) => /fondo del mazzo/.test(d)), []);
});

// ---- mazzi, conversione fonetica, flashcard ----
const mkDeck = () => T.example();

test('trainer: dalle rimescolate di un log esce quasi tutta la lista del mazzo, mai una carta in più', () => {
  const cards = T.deckFrom(Core.parseLog(sampleLog));
  for (const id in cards) assert.ok(cards[id] <= deck.cards[id], id + ' ×' + cards[id]);
  assert.ok(T.total(cards) >= 47 && T.total(cards) <= 50, 'carte trovate: ' + T.total(cards));
  assert.equal(T.deckFrom({ steps: [] }), null);
});

test('trainer: più partite completano la lista; una partita con un altro mazzo non la sporca', () => {
  const a = Object.assign({}, deck.cards, { 'OP07-022': 3, 'OP12-023': 3 }), b = Object.assign({}, deck.cards, { 'OP06-033': 3 }); delete a['OP13-040'];
  const other = { 'OP01-001': 4, 'OP01-002': 4 };
  assert.deepEqual(T.mergeLists([a, null, other, b]), deck.cards);
  assert.deepEqual(T.mergeLists([a]), a); assert.equal(T.mergeLists([null]), null);
  // completa già alla prima: le altre non si guardano
  assert.deepEqual(T.mergeLists([deck.cards, other]), deck.cards);
});

test('trainer: i record della prima versione passano al mazzo Mihawk', () => {
  const s = T.migrate({ v: 1, unlocked: 4, levels: { 1: { runs: 2, perfect: 1, streak: 1, bestStreak: 1, bestPct: 100, bestMs: 9000 } } });
  assert.equal(s.v, 2); assert.equal(s.deck, 'OP14-020');
  const d = s.decks[s.deck];
  assert.equal(d.unlocked, 4); assert.equal(T.passed(d, 1), true); assert.deepEqual(d.cards, deck.cards);
  assert.equal(T.migrate(s), s);
  assert.deepEqual(T.migrate(null), T.newStore());
});

test('trainer: cambiare lista tiene le associazioni e dice quali carte sono nuove', () => {
  const d = mkDeck(); T.setAssoc(d, 'OP12-034', 'p b', 'Perona');
  const cards = Object.assign({}, d.cards, { 'OP01-055': 2 }); delete cards['OP13-040'];
  assert.equal(T.sameCards(d.cards, cards), false);
  assert.deepEqual(T.setCards(d, cards, 'oggi'), ['OP01-055']);
  assert.equal(T.soundOf(d, 'OP12-034'), 'P B'); assert.equal(T.sameCards(d.cards, cards), true);
});

test('trainer: i suoni si normalizzano e quelli dati a due carte vengono segnalati', () => {
  assert.deepEqual(T.sounds(' p, b '), ['P', 'B']); assert.deepEqual(T.sounds('ci/gi'), ['CI', 'GI']); assert.deepEqual(T.sounds(''), []);
  // sono suoni, non lettere: si riconoscono anche scritti alla buona, e quello che non è un suono dell'elenco si scarta
  assert.deepEqual(T.sounds('C dura'), ['K']); assert.deepEqual(T.sounds('c dolce / g dolce'), ['CI', 'GI']); assert.deepEqual(T.sounds('ch, gh'), ['K', 'G']);
  assert.deepEqual(T.sounds('K (come casa)'), ['K']); assert.deepEqual(T.sounds('s z sc'), ['S', 'Z']); assert.deepEqual(T.sounds('H W'), []);
  assert.deepEqual(T.FAMILIES.flat().sort(), Object.keys(T.SOUNDS).sort());
  assert.equal(T.soundName('K'), 'C dura · come in casa, chiave'); assert.equal(T.soundName('P'), 'come in pane');
  const d = mkDeck();
  T.setAssoc(d, 'OP12-034', 'p b', 'Perona'); T.setAssoc(d, 'OP06-033', 'k', ''); T.setAssoc(d, 'OP17-022', 'K G', '');
  assert.deepEqual(T.assigned(d).sort(), ['OP06-033', 'OP12-034', 'OP17-022']);
  assert.deepEqual(T.clashes(d), { K: ['OP06-033', 'OP17-022'] });
});

test('trainer: la tabella si esporta e si rilegge, anche sporca come la scrive un LLM', () => {
  const d = mkDeck(); T.setAssoc(d, 'OP12-034', 'P B', 'Perona fa "Bu!"'); T.setAssoc(d, 'ST32-001', 'T', 'il tamburo');
  const back = T.parseTable(T.tableOf(d), mkDeck());
  assert.deepEqual(back.rows, { 'OP12-034': { s: 'P B', why: 'Perona fa "Bu!"' }, 'ST32-001': { s: 'T', why: 'il tamburo' } });
  const messy = ['Ecco la tabella finale:', '```', 'CODICE | SUONI | MOTIVO', '---|---|---', '| op12-034 | p b | Perona |', '`ST32-002` | **K** | Oden | con la barra',
    'OP99-999 | Z | non è nel mazzo', 'OP06-038 |  | senza suono', '```'].join('\r\n');
  const r = T.parseTable(messy, mkDeck());
  assert.deepEqual(r.rows, { 'OP12-034': { s: 'P B', why: 'Perona' }, 'ST32-002': { s: 'K', why: 'Oden | con la barra' } });
  assert.equal(r.skipped, 2);
});

test('trainer: il prompt elenca tutte le carte del mazzo, le associazioni già fatte e il formato della tabella', () => {
  const d = mkDeck(); T.setAssoc(d, 'OP12-034', 'P B', 'Perona');
  const p = T.promptFor(d, (id) => 'Carta ' + id, () => ({ cost: 3, power: 5000, counter: 1000 }));
  for (const id of Object.keys(d.cards)) assert.ok(p.includes('- ' + id + ' · Carta ' + id), id);
  assert.ok(p.includes('OP12-034 | P B | Perona')); assert.ok(p.includes('CODICE | SUONI | MOTIVO')); assert.ok(p.includes('2 copie'));
});

test('trainer: due flashcard per carta associata; "bene" allunga l\'intervallo, "non la sapevo" la lascia per oggi', () => {
  const d = mkDeck(), day = 20000;
  assert.deepEqual(T.flashcards(d), []); assert.equal(T.nextDue(d), null);
  T.setAssoc(d, 'OP12-034', 'P', ''); T.setAssoc(d, 'ST32-001', 'T', '');
  assert.deepEqual(T.dueCards(d, day).sort(), ['OP12-034<', 'OP12-034>', 'ST32-001<', 'ST32-001>']);
  assert.equal(T.grade(d, 'OP12-034>', 1, day).due, day + 1);
  assert.equal(T.grade(d, 'OP12-034>', 1, day + 1).due, day + 4);
  const c = T.grade(d, 'OP12-034>', 1, day + 4); assert.equal(c.ivl, 8); assert.equal(c.due, day + 12);
  assert.equal(T.grade(d, 'OP12-034<', 2, day).due, day + 4);
  assert.equal(T.dueCards(d, day).length, 2); assert.equal(T.dueCards(d, day + 4).length, 3);
  const bad = T.grade(d, 'OP12-034>', 0, day + 12);
  assert.equal(bad.due, day + 12); assert.equal(bad.reps, 0); assert.equal(bad.lapses, 1); assert.ok(bad.ease < 2.5);
  assert.equal(T.grade(d, 'OP12-034>', 1, day + 12).due, day + 13);
  // cambiare il suono azzera le flashcard di quella carta, cambiare solo il motivo no
  T.setAssoc(d, 'OP12-034', 'P', 'un altro motivo'); assert.ok(d.srs['OP12-034>']);
  T.setAssoc(d, 'OP12-034', 'B', ''); assert.equal(d.srs['OP12-034>'], undefined); assert.equal(d.srs['OP12-034<'], undefined);
});
