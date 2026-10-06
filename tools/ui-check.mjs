// Allarme sul tappetino: apre la pagina compilata in un browser senza finestra, fa scorrere la partita di esempio
// e confronta quello che c'è sul tavolo (carte, aree, posizioni, barra) con la "foto" salvata in test/golden/board.json.
//
//   npm run test:ui              confronta con la foto salvata: se qualcosa è cambiato lo elenca ed esce con errore
//   npm run test:ui -- --update  rifà la foto (dopo una modifica VOLUTA all'aspetto del tavolo)
//
// Serve Chrome o Edge installato (oppure la variabile CHROME_PATH con il percorso del browser) e la pagina già
// compilata: lo script "test:ui" lancia prima "npm run build".
// Le immagini delle carte vengono bloccate di proposito: così il risultato non dipende da internet
// (ogni carta mostra il suo nome al posto dell'immagine).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const DIST = join(root, 'dist');
const GOLDEN = join(root, 'test', 'golden', 'board.json');
const UPDATE = process.argv.includes('--update');

// momenti della partita di esempio da controllare: inizio, primi turni, combattimenti, carte guardate, fine
const STEPS = [0, 3, 8, 21, 34, 55, 71, 89, 107, 142, 178, 214, 250, 285, 321, 356, 392, 445, 499, 535];
const WIDTH = 1500;
const HEIGHT = 900;

// ---------- 1. un piccolo server per la pagina compilata e il log di esempio ----------
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.log': 'text/plain',
};
function startServer() {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file =
      pathname === '/esempio.log'
        ? join(root, 'test', 'esempio.log')
        : resolve(DIST, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

// ---------- 2. il browser, comandato con il DevTools Protocol ----------
function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const found = candidates.find((file) => file && existsSync(file));
  if (!found) throw new Error('Non trovo Chrome o Edge: indica il percorso nella variabile CHROME_PATH');
  return found;
}

async function startBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'optcg-ui-check-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const args = [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    '--no-first-run',
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank',
  ];
  const process_ = spawn(findBrowser(), args, { stdio: 'ignore' });

  // il browser ci mette un attimo ad aprire la porta
  let info = null;
  for (let attempt = 0; attempt < 60 && !info; attempt++) {
    try {
      info = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
    } catch (e) {
      await sleep(200);
    }
  }
  if (!info) throw new Error('Il browser non è partito');

  const socket = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((done) => (socket.onopen = done));
  let lastId = 0;
  const waiting = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const pending = waiting.get(message.id);
    if (!pending) return;
    waiting.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++lastId;
      waiting.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });

  // una scheda sola, della misura voluta, con le immagini delle carte bloccate
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  await page('Page.enable');
  await page('Runtime.enable');
  await page('Network.enable');
  await page('Network.setBlockedURLs', { urls: ['*dotgg.gg*', '*digitaloceanspaces.com*'] });
  await page('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });

  return {
    goto: (url) => page('Page.navigate', { url }),
    async run(expression) {
      const result = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails)
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    },
    async close() {
      await Promise.race([send('Browser.close'), sleep(2000)]).catch(() => {});
      process_.kill();
      rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// ---------- 3. la "foto": eseguita dentro la pagina, descrive il tavolo com'è adesso ----------
function describeBoard() {
  const all = (selector, from = document) => [...from.querySelectorAll(selector)];
  const one = (selector) => document.querySelector(selector);
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map(Math.round).join(',');
  };
  const classes = (el) =>
    [...el.classList]
      .filter((name) => name !== 'flash')
      .sort()
      .join(' ');
  const shownText = (el, selector) => {
    const child = el.querySelector(selector);
    return child && child.classList.contains('show') ? child.textContent : null;
  };
  return {
    carte: all('#mat [data-uid], .hand [data-uid], #look [data-uid]').map((el) => ({
      dove: el.parentElement.id + '.' + classes(el.parentElement),
      giocatore: el.dataset.p,
      classi: classes(el),
      posto: box(el),
      potenza: shownText(el, '.pw'),
      nota: shownText(el, '.known'),
      don: all('.dons > *', el).length,
      bloccata: shownText(el, '.frz'),
      nome: el.classList.contains('card') ? el.firstChild.textContent : null,
    })),
    aree: all('#mat .area, #mat .a-name').map((el) => ({
      classi: classes(el),
      etichetta: el.dataset.label,
      posto: box(el),
      dentro: [...el.children].map((child) => child.tagName.toLowerCase() + '.' + classes(child)).join(' | '),
      testo: /a-(name|deck|dond|life)/.test(el.className) ? el.textContent : undefined,
    })),
    donCostArea: all('#mat .doncard').map((el) => classes(el) + ' @' + box(el)),
    mani: all('.hand').map((el) => ({
      id: el.id,
      carte: el.children.length,
      sovrapposizione: el.style.getPropertyValue('--ov'),
    })),
    carteGuardate: one('#look').classList.contains('show')
      ? classes(one('#look')) + ' · ' + one('#look .ltitle').textContent
      : '',
    freccia: one('#arrows').innerHTML.replace(/[0-9.]+/g, (number) => Math.round(+number)),
    esito: classes(one('#result')) + ' · ' + one('#result').textContent,
    barra: {
      posizione: one('#pos').textContent,
      mossa: one('#step-text').textContent,
      turno: one('#turns').value,
    },
  };
}

// ---------- 4. si parte ----------
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('Manca la pagina compilata: lancia prima "npm run build".');
  process.exit(1);
}
const server = await startServer();
const browser = await startBrowser();
const photos = {};
try {
  await browser.goto('http://127.0.0.1:' + server.address().port + '/?log=/esempio.log&step=0');
  // il replay è pronto quando la raccolta si chiude e la barra dice "1 / N"
  for (let attempt = 0; ; attempt++) {
    const ready = await browser
      .run(
        "/^1 \\//.test(document.querySelector('#pos')?.textContent || '') && document.querySelector('#drop').classList.contains('hidden')",
      )
      .catch(() => false);
    if (ready) break;
    if (attempt > 200) throw new Error('La pagina non ha caricato la partita di esempio');
    await sleep(150);
  }
  for (const step of STEPS) {
    // un click sulla riga del log porta a quello step; poi si aspetta che le carte abbiano finito di muoversi
    await browser.run("document.getElementById('ev" + step + "').click()");
    await sleep(750);
    photos[step] = await browser.run('(' + describeBoard.toString() + ')()');
  }
} finally {
  await browser.close();
  server.close();
}

if (UPDATE) {
  mkdirSync(join(root, 'test', 'golden'), { recursive: true });
  writeFileSync(GOLDEN, JSON.stringify(photos, null, 1) + '\n');
  console.log('Foto del tavolo salvata in test/golden/board.json (' + STEPS.length + ' momenti della partita).');
  process.exit(0);
}

if (!existsSync(GOLDEN)) {
  console.error('Manca la foto di riferimento: creala con "npm run test:ui -- --update".');
  process.exit(1);
}
const saved = JSON.parse(readFileSync(GOLDEN, 'utf8'));
// elenca i punti in cui due descrizioni differiscono, con il percorso per trovarli (es. "carte[3].posto")
function differences(before, now, path, out) {
  if (JSON.stringify(before) === JSON.stringify(now)) return out;
  const bothObjects = before && now && typeof before === 'object' && typeof now === 'object';
  if (!bothObjects) {
    out.push(path + ': era ' + JSON.stringify(before) + ', ora ' + JSON.stringify(now));
    return out;
  }
  for (const key of new Set([...Object.keys(before), ...Object.keys(now)])) {
    differences(
      before[key],
      now[key],
      Array.isArray(before) ? path + '[' + key + ']' : path ? path + '.' + key : key,
      out,
    );
  }
  return out;
}
let changedSteps = 0;
for (const step of STEPS) {
  const found = differences(saved[step], photos[step], '', []);
  if (!found.length) continue;
  changedSteps++;
  console.log('\nStep ' + step + ': ' + found.length + (found.length === 1 ? ' differenza' : ' differenze'));
  for (const line of found.slice(0, 12)) console.log('  ' + line);
  if (found.length > 12) console.log('  … e altre ' + (found.length - 12));
}
if (changedSteps) {
  console.log('\nIl tavolo è cambiato in ' + changedSteps + ' momenti su ' + STEPS.length + '.');
  console.log('Se il cambiamento è voluto, rifai la foto con "npm run test:ui -- --update".');
  process.exit(1);
}
console.log('Il tavolo è identico alla foto salvata in tutti i ' + STEPS.length + ' momenti controllati.');
