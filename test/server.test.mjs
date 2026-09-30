import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import server from '../server/server.js';

const root = new URL('../', import.meta.url);
const sampleLog = readFileSync(new URL('Esempio COmbat log/2026-09-23T13.26.58.log', root), 'utf8');
const lineCount = sampleLog.split(/\r?\n/).length;

let dataDir, srv, base;
const LEO = 'token-di-leo', AMICO = 'token-di-un-amico';
before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'optcg-server-'));
  writeFileSync(join(dataDir, 'tokens.json'), JSON.stringify({ [server.hashToken(LEO)]: { name: 'Leo' }, [server.hashToken(AMICO)]: { name: 'Amico' } }));
  srv = server.createServer({ dataDir });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + srv.address().port;
});
after(() => { srv.close(); srv.closeAllConnections(); rmSync(dataDir, { recursive: true, force: true }); });

const call = async (method, path, { token, body, ip } = {}) => {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (ip) headers['X-Forwarded-For'] = ip;
  if (body !== undefined && typeof body !== 'string') { body = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
  const res = await fetch(base + path, { method, headers, body });
  return { status: res.status, headers: res.headers, json: await res.json().catch(() => null) };
};
const upload = (token, text = sampleLog) => call('POST', '/api/replays', { token, body: text });

test('senza token, o con un token sconosciuto, non si carica nulla', async () => {
  assert.equal((await upload(null)).status, 401);
  assert.equal((await upload('token-inventato')).status, 401);
});

test('il token dice chi sei', async () => {
  assert.deepEqual((await call('GET', '/api/me', { token: LEO })).json, { name: 'Leo' });
  assert.equal((await call('GET', '/api/me')).status, 401);
});

test('un log caricato si rilegge identico, e ricaricarlo dà lo stesso link', async () => {
  const a = await upload(LEO);
  assert.equal(a.status, 201);
  assert.match(a.json.id, /^[A-Za-z0-9]{10}$/);
  assert.equal(a.json.url, base + '/?r=' + a.json.id);
  const b = await upload(LEO);
  assert.equal(b.status, 200);
  assert.equal(b.json.id, a.json.id);
  const got = await call('GET', '/api/replays/' + a.json.id);
  assert.equal(got.status, 200);
  assert.equal(got.json.log, sampleLog);
  assert.equal(got.json.owner, 'Leo');
  assert.equal(got.json.mine, false);
  assert.deepEqual(got.json.notes, []);
  assert.equal((await call('GET', '/api/replays/' + a.json.id, { token: LEO })).json.mine, true);
  assert.equal(got.headers.get('access-control-allow-origin'), '*');
});

test('lo stesso log caricato da due persone ha due link distinti', async () => {
  const mine = await upload(LEO), theirs = await upload(AMICO);
  assert.equal(theirs.status, 201);
  assert.notEqual(theirs.json.id, mine.json.id);
});

test('ciò che non è un combat log, o è troppo grande, viene rifiutato', async () => {
  assert.equal((await upload(LEO, 'ciao, questo è un file qualsiasi')).status, 400);
  assert.equal((await upload(LEO, sampleLog + 'x'.repeat(2 * 1024 * 1024))).status, 413);
});

test('un replay che non esiste dà 404, anche con un id malformato', async () => {
  assert.equal((await call('GET', '/api/replays/AAAAAAAAAA')).status, 404);
  assert.equal((await call('GET', '/api/replays/..%2Ftokens')).status, 404);
  assert.equal((await call('GET', '/api/altro')).status, 404);
});

test('chiunque lascia una nota ancorata a una riga del log', async () => {
  const { json: { id } } = await upload(LEO);
  const note = await call('POST', '/api/replays/' + id + '/notes', { body: { author: '  Giammarco ', text: 'turno 9: qui non attacchi mai', line: 1200 }, ip: '10.0.0.1' });
  assert.equal(note.status, 201);
  assert.equal(note.json.author, 'Giammarco');
  assert.equal(note.json.line, 1200);
  const { json } = await call('GET', '/api/replays/' + id);
  assert.deepEqual(json.notes.map((n) => [n.id, n.author, n.text, n.line]), [[note.json.id, 'Giammarco', 'turno 9: qui non attacchi mai', 1200]]);
});

test('le note senza nome, vuote, troppo lunghe o fuori dal log vengono rifiutate', async () => {
  const { json: { id } } = await upload(LEO);
  const post = (body) => call('POST', '/api/replays/' + id + '/notes', { body, ip: '10.0.0.2' });
  assert.equal((await post({ author: '', text: 'x', line: 5 })).status, 400);
  assert.equal((await post({ author: 'A', text: '   ', line: 5 })).status, 400);
  assert.equal((await post({ author: 'A', text: 'x'.repeat(501), line: 5 })).status, 400);
  assert.equal((await post({ author: 'A', text: 'x', line: 0 })).status, 400);
  assert.equal((await post({ author: 'A', text: 'x', line: lineCount + 1 })).status, 400);
  assert.equal((await post({ author: 'A', text: 'x', line: 'nove' })).status, 400);
  assert.equal((await call('POST', '/api/replays/' + id + '/notes', { body: '{non json', ip: '10.0.0.2' })).status, 400);
  assert.equal((await post({ author: 'A'.repeat(80), text: 'x', line: 5 })).json.author.length, 30);
});

test('più di dieci note al minuto dallo stesso indirizzo vengono fermate', async () => {
  const { json: { id } } = await upload(LEO);
  const post = (ip) => call('POST', '/api/replays/' + id + '/notes', { body: { author: 'A', text: 'x', line: 5 }, ip });
  for (let k = 0; k < 10; k++) assert.equal((await post('10.0.0.3')).status, 201);
  assert.equal((await post('10.0.0.3')).status, 429);
  assert.equal((await post('10.0.0.4')).status, 201);
});

test('solo chi ha caricato il replay cancella le note e il replay', async () => {
  const { json: { id } } = await upload(AMICO, sampleLog + '\n');
  const note = await call('POST', '/api/replays/' + id + '/notes', { body: { author: 'A', text: 'x', line: 5 }, ip: '10.0.0.5' });
  const notePath = '/api/replays/' + id + '/notes/' + note.json.id;
  assert.equal((await call('DELETE', notePath)).status, 401);
  assert.equal((await call('DELETE', notePath, { token: LEO })).status, 403);
  assert.equal((await call('DELETE', notePath, { token: AMICO })).status, 200);
  assert.equal((await call('DELETE', notePath, { token: AMICO })).status, 404);
  assert.deepEqual((await call('GET', '/api/replays/' + id)).json.notes, []);
  assert.equal((await call('DELETE', '/api/replays/' + id, { token: LEO })).status, 403);
  assert.equal((await call('DELETE', '/api/replays/' + id, { token: AMICO })).status, 200);
  assert.equal((await call('GET', '/api/replays/' + id)).status, 404);
  assert.equal((await upload(AMICO, sampleLog + '\n')).status, 201);
});

test('i replay caricati sopravvivono al riavvio del server', async () => {
  const { json: { id } } = await upload(LEO);
  const again = server.createServer({ dataDir });
  await new Promise((r) => again.listen(0, '127.0.0.1', r));
  try {
    const url = 'http://127.0.0.1:' + again.address().port;
    const res = await fetch(url + '/api/replays', { method: 'POST', headers: { Authorization: 'Bearer ' + LEO }, body: sampleLog });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).id, id);
  } finally { again.close(); again.closeAllConnections(); }
});

test('la pagina e i suoi file sono serviti, il resto no', async () => {
  const page = await fetch(base + '/?r=qualcosa');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(await page.text(), /<title>OPTCG Replay<\/title>/);
  assert.equal((await fetch(base + '/cards_meta.js')).status, 200);
  assert.equal((await fetch(base + '/don.jpg')).status, 200);
  assert.equal((await fetch(base + '/cardback.jpg')).status, 200);
  assert.equal((await fetch(base + '/server/server.js')).status, 404);
  assert.equal((await fetch(base + '/README.md')).status, 404);
});
