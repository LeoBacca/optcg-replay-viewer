// OPTCG Replay — server dei replay condivisi. Node puro, nessuna dipendenza.
// Serve la pagina (index.html, cards_meta.js, don.jpg) e una piccola API: carica un log, leggilo, lascia note.
// I dati stanno su file in DATA_DIR:
//   tokens.json          sha256(token) -> { name, createdAt }   (si gestisce con token.js)
//   replays/<id>.log     il testo del log, così com'è arrivato
//   replays/<id>.json    { id, owner, ownerName, hash, lines, createdAt, notes: [...] }
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_LOG_BYTES = 2 * 1024 * 1024;
const MAX_JSON_BYTES = 8 * 1024;
const MAX_REPLAYS_PER_OWNER = 1000;
const MAX_NOTES = 200, MAX_AUTHOR = 30, MAX_TEXT = 500;
const NOTES_PER_MINUTE = 10;
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';   // senza 0/O, 1/l/I
const ID_RE = /^[A-Za-z0-9]{10}$/;
const STATIC = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/cards_meta.js': ['cards_meta.js', 'text/javascript; charset=utf-8'], '/don.jpg': ['don.jpg', 'image/jpeg'] };

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
function newId() { let s = ''; for (const b of crypto.randomBytes(10)) s += ID_ALPHABET[b % ID_ALPHABET.length]; return s; }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; } }
// scrittura atomica: un file a metà non prende mai il posto di quello buono
function writeFile(file, data) { const tmp = file + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, data); fs.renameSync(tmp, file); }

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

function createServer(opts) {
  const dataDir = path.resolve(opts.dataDir);
  const webRoot = path.resolve(opts.webRoot || path.join(__dirname, '..'));
  const replayDir = path.join(dataDir, 'replays');
  fs.mkdirSync(replayDir, { recursive: true });
  const metaFile = (id) => path.join(replayDir, id + '.json');
  const logFile = (id) => path.join(replayDir, id + '.log');

  // owner|hash -> id: chi ricarica lo stesso log riceve lo stesso link
  const byHash = new Map(), perOwner = new Map();
  for (const f of fs.readdirSync(replayDir)) {
    if (!f.endsWith('.json')) continue;
    const m = readJson(path.join(replayDir, f), null);
    if (m && m.id) { byHash.set(m.owner + '|' + m.hash, m.id); perOwner.set(m.owner, (perOwner.get(m.owner) || 0) + 1); }
  }
  const noteTimes = new Map();   // ip -> istanti delle ultime note

  function auth(req) {
    const m = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || '');
    if (!m) return null;
    const hash = hashToken(m[1]), t = readJson(path.join(dataDir, 'tokens.json'), {})[hash];
    return t ? { hash, name: t.name } : null;
  }
  function requireAuth(req) { const who = auth(req); if (!who) throw new HttpError(401, 'Token mancante o non valido'); return who; }
  function loadMeta(id) {
    if (!ID_RE.test(id)) throw new HttpError(404, 'Replay non trovato');
    const m = readJson(metaFile(id), null);
    if (!m) throw new HttpError(404, 'Replay non trovato');
    return m;
  }
  function clientIp(req) {
    const ip = req.socket.remoteAddress || '';
    const local = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    // dietro al reverse proxy locale il vero indirizzo è nell'header
    return (local && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || ip;
  }
  function baseUrl(req) {
    if (opts.publicUrl) return opts.publicUrl.replace(/\/+$/, '');
    return (req.headers['x-forwarded-proto'] || 'http') + '://' + req.headers.host;
  }
  // oltre il limite il resto viene letto e buttato, così il client riceve un 413 pulito; oltre 8 volte il limite si chiude e basta
  function readBody(req, limit) {
    return new Promise((resolve, reject) => {
      const chunks = []; let size = 0;
      req.on('data', (c) => { size += c.length; if (size <= limit) chunks.push(c); else if (size > limit * 8) req.destroy(); });
      req.on('end', () => size > limit ? reject(new HttpError(413, 'Contenuto troppo grande')) : resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
      req.on('close', () => reject(new HttpError(400, 'Richiesta interrotta')));
    });
  }

  const api = {
    async upload(req) {
      const who = requireAuth(req);
      const text = await readBody(req, MAX_LOG_BYTES);
      if (!/Leader is /.test(text) || !/^RZ1\|/m.test(text)) throw new HttpError(400, 'Non sembra un combat log di OPTCGSim');
      const hash = sha256(text), key = who.hash + '|' + hash;
      let id = byHash.get(key), created = false;
      if (!id) {
        if ((perOwner.get(who.hash) || 0) >= MAX_REPLAYS_PER_OWNER) throw new HttpError(403, 'Hai raggiunto il numero massimo di replay caricati');
        do id = newId(); while (fs.existsSync(metaFile(id)));
        writeFile(logFile(id), text);
        writeFile(metaFile(id), JSON.stringify({ id, owner: who.hash, ownerName: who.name, hash, lines: text.split(/\r?\n/).length, createdAt: new Date().toISOString(), notes: [] }));
        byHash.set(key, id); perOwner.set(who.hash, (perOwner.get(who.hash) || 0) + 1); created = true;
      }
      return [created ? 201 : 200, { id, url: baseUrl(req) + '/?r=' + id }];
    },
    async get(req, id) {
      const m = loadMeta(id), who = auth(req);
      return [200, { id: m.id, owner: m.ownerName, createdAt: m.createdAt, mine: !!who && who.hash === m.owner, log: fs.readFileSync(logFile(id), 'utf8'), notes: m.notes }];
    },
    async remove(req, id) {
      const who = requireAuth(req), m = loadMeta(id);
      if (m.owner !== who.hash) throw new HttpError(403, 'Questo replay non è tuo');
      fs.rmSync(metaFile(id), { force: true }); fs.rmSync(logFile(id), { force: true });
      byHash.delete(m.owner + '|' + m.hash); perOwner.set(m.owner, Math.max(0, (perOwner.get(m.owner) || 1) - 1));
      return [200, { ok: true }];
    },
    async addNote(req, id) {
      const m = loadMeta(id);
      let body; try { body = JSON.parse(await readBody(req, MAX_JSON_BYTES)); } catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(400, 'JSON non valido'); }
      const author = String(body.author || '').trim().slice(0, MAX_AUTHOR), text = String(body.text || '').trim(), line = Number(body.line);
      if (!author) throw new HttpError(400, 'Manca il nome');
      if (!text) throw new HttpError(400, 'La nota è vuota');
      if (text.length > MAX_TEXT) throw new HttpError(400, 'La nota supera i ' + MAX_TEXT + ' caratteri');
      if (!Number.isInteger(line) || line < 1 || line > m.lines) throw new HttpError(400, 'Punto della partita non valido');
      if (m.notes.length >= MAX_NOTES) throw new HttpError(403, 'Questo replay ha già il numero massimo di note');
      const ip = clientIp(req), now = Date.now(), recent = (noteTimes.get(ip) || []).filter((t) => now - t < 60000);
      if (recent.length >= NOTES_PER_MINUTE) throw new HttpError(429, 'Troppe note in poco tempo, riprova tra un minuto');
      recent.push(now); noteTimes.set(ip, recent);
      const note = { id: newId(), author, text, line, createdAt: new Date().toISOString() };
      m.notes.push(note); writeFile(metaFile(id), JSON.stringify(m));
      return [201, note];
    },
    async removeNote(req, id, noteId) {
      const who = requireAuth(req), m = loadMeta(id);
      if (m.owner !== who.hash) throw new HttpError(403, 'Solo chi ha caricato il replay può cancellare le note');
      const k = m.notes.findIndex((n) => n.id === noteId);
      if (k < 0) throw new HttpError(404, 'Nota non trovata');
      m.notes.splice(k, 1); writeFile(metaFile(id), JSON.stringify(m));
      return [200, { ok: true }];
    },
  };

  function route(req, pathname) {
    const p = pathname.split('/').filter(Boolean), M = req.method;   // ['api', 'replays', id, 'notes', noteId]
    if (p[1] === 'me' && p.length === 2 && M === 'GET') return (async () => [200, { name: requireAuth(req).name }])();
    if (p[1] !== 'replays') return null;
    if (p.length === 2 && M === 'POST') return api.upload(req);
    if (p.length === 3 && M === 'GET') return api.get(req, p[2]);
    if (p.length === 3 && M === 'DELETE') return api.remove(req, p[2]);
    if (p.length === 4 && p[3] === 'notes' && M === 'POST') return api.addNote(req, p[2]);
    if (p.length === 5 && p[3] === 'notes' && M === 'DELETE') return api.removeNote(req, p[2], p[4]);
    return null;
  }

  // l'API si autentica col token nell'header, non con i cookie: può stare aperta a qualsiasi origine (serve all'app desktop)
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Max-Age': '86400' };
  const json = (res, status, body) => { res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, CORS)); res.end(JSON.stringify(body)); };

  return http.createServer(async (req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); res.end(); return; }
    if (pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
      try {
        const handled = route(req, pathname);
        if (!handled) throw new HttpError(404, 'Non trovato');
        const [status, body] = await handled;
        json(res, status, body);
      } catch (e) {
        if (!(e instanceof HttpError)) console.error(e);
        json(res, e instanceof HttpError ? e.status : 500, { error: e instanceof HttpError ? e.message : 'Errore del server' });
      }
      return;
    }
    const st = STATIC[pathname];
    if (!st || (req.method !== 'GET' && req.method !== 'HEAD')) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Non trovato'); return; }
    fs.readFile(path.join(webRoot, st[0]), (err, buf) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': st[1], 'Cache-Control': st[0] === 'don.jpg' ? 'public, max-age=86400' : 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
  });
}

module.exports = { createServer, hashToken };

if (require.main === module) {
  const port = +process.env.PORT || 8787, host = process.env.HOST || '127.0.0.1';
  const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
  createServer({ dataDir, publicUrl: process.env.PUBLIC_URL }).listen(port, host, () => console.log('OPTCG Replay server su http://' + host + ':' + port + ' · dati in ' + path.resolve(dataDir)));
}
