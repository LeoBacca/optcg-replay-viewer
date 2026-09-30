// Gestione dei token di chi può caricare replay. Sul server si salva solo l'impronta (sha256): il token si vede una volta sola.
//   node server/token.js add <nome>      crea un token e lo stampa
//   node server/token.js list            elenca i nomi
//   node server/token.js remove <nome>   revoca i token di quel nome
// Usa la stessa DATA_DIR del server (variabile d'ambiente, altrimenti server/data).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashToken } = require('./server.js');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const file = path.join(dataDir, 'tokens.json');
const load = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; } };
const save = (t) => { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(t, null, 2), { mode: 0o600 }); };

const [cmd, name] = process.argv.slice(2);
const tokens = load();
if (cmd === 'add' && name) {
  const token = crypto.randomBytes(24).toString('base64url');
  tokens[hashToken(token)] = { name, createdAt: new Date().toISOString() };
  save(tokens);
  console.log('Token per ' + name + ' (non verrà più mostrato):\n' + token);
} else if (cmd === 'list') {
  const rows = Object.values(tokens);
  if (!rows.length) console.log('Nessun token.');
  for (const t of rows) console.log(t.name + '  ·  creato il ' + t.createdAt.slice(0, 10));
} else if (cmd === 'remove' && name) {
  const hashes = Object.keys(tokens).filter((h) => tokens[h].name === name);
  for (const h of hashes) delete tokens[h];
  save(tokens);
  console.log(hashes.length ? 'Revocati ' + hashes.length + ' token di ' + name + '. I replay già caricati restano online.' : 'Nessun token con nome ' + name + '.');
} else {
  console.log('Uso: node server/token.js add <nome> | list | remove <nome>');
  process.exitCode = 1;
}
