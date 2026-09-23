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
