// Le traduzioni: ogni testo scritto dentro t('...') deve avere la sua riga inglese, e nel dizionario non restano righe inutili.
// Se questo test fallisce dopo aver aggiunto un testo alla pagina: manca la sua riga in src/i18n/en.js
// (o in src/trainer/en.js, per il Memory Trainer).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import en from '../src/i18n/en.js';
import { t, setLanguage } from '../src/i18n/index.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const TRAINER_EN = join(SRC, 'trainer', 'en.js');
const trainerEn = existsSync(TRAINER_EN) ? (await import(pathToFileURL(TRAINER_EN).href)).default : {};
const server = readFileSync(new URL('../server/server.js', import.meta.url), 'utf8');

/** I file .js e .jsx di una cartella (dizionari esclusi), con un filtro sul percorso. */
function sourceFiles(dir, keep) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path, keep);
    return /\.jsx?$/.test(name) && name !== 'en.js' && keep(path) ? [path] : [];
  });
}

// i testi dentro t(): t('testo'), t("testo") e t(condizione ? 'uno' : 'altro')
const STRING = String.raw`'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"`;
const CALL = new RegExp(String.raw`\bt\(\s*(?:[^'"()]*?\?\s*)?(?:${STRING})(?:\s*:\s*(?:${STRING}))?`, 'g');
const BACKSLASH_ESCAPE = new RegExp(String.raw`\\(['"\\])`, 'g');

/** Tutti i testi passati a t() nei file scelti, ognuno con il file in cui compare. */
function keysIn(files) {
  const keys = new Map();
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(CALL)) {
      for (const k of [m[1], m[2], m[3], m[4]]) if (k != null) keys.set(k.replace(BACKSLASH_ESCAPE, '$1'), file);
    }
  }
  return keys;
}
const isTrainer = (path) => /[\\/]trainer[\\/]/.test(path);
const pageKeys = keysIn(sourceFiles(SRC, (path) => !isTrainer(path)));
const trainerKeys = keysIn(sourceFiles(SRC, isTrainer));

// i messaggi d'errore del server arrivano in italiano e la pagina li traduce con t(body.error)
const serverMessages = [...server.matchAll(/HttpError\(\d+, '([^']+)'\)/g)].map((m) => m[1]);
serverMessages.push('Errore del server', 'La nota supera i 500 caratteri');

test('ogni testo della pagina ha la traduzione inglese', () => {
  const missing = [...pageKeys].filter(([k]) => !(k in en)).map(([k, file]) => file.slice(SRC.length) + ': ' + k);
  assert.deepEqual(missing, []);
});

test('ogni testo del Memory Trainer ha la traduzione inglese', () => {
  const missing = [...trainerKeys]
    .filter(([k]) => !(k in trainerEn) && !(k in en))
    .map(([k, file]) => file.slice(SRC.length) + ': ' + k);
  assert.deepEqual(missing, []);
});

test('nei dizionari non restano traduzioni di testi che nessuno usa più', () => {
  assert.deepEqual(
    Object.keys(en).filter((k) => !pageKeys.has(k) && !trainerKeys.has(k) && !serverMessages.includes(k)),
    [],
  );
  assert.deepEqual(
    Object.keys(trainerEn).filter((k) => !trainerKeys.has(k)),
    [],
  );
});

test('le traduzioni hanno gli stessi {segnaposto} del testo italiano', () => {
  const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(' ');
  const wrong = Object.entries({ ...en, ...trainerEn }).filter(([it, eng]) => placeholders(it) !== placeholders(eng));
  assert.deepEqual(
    wrong.map(([it]) => it),
    [],
  );
});

test('ogni messaggio di errore del server ha la traduzione inglese', () => {
  assert.ok(serverMessages.length > 5);
  assert.deepEqual(
    serverMessages.filter((m) => !(m in en)),
    [],
  );
  // il limite della nota è scritto anche nel dizionario: se cambia nel server va cambiato anche lì
  assert.match(server, /MAX_TEXT = 500\b/);
});

test("t() traduce, riempie i segnaposto e in italiano lascia il testo com'è", () => {
  setLanguage('en');
  assert.equal(t('{n} turni', { n: 12 }), '12 turns');
  assert.equal(t('testo che non è nel dizionario'), 'testo che non è nel dizionario');
  setLanguage('it');
  assert.equal(t('{n} turni', { n: 12 }), '12 turni');
  // una lingua sconosciuta (impostazione salvata da una versione futura, o rovinata) torna all'inglese
  setLanguage('xx');
  assert.equal(t('Impostazioni'), 'Settings');
});
