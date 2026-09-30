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

// Gli step si cercano per riga del log e non per indice: gli indici si spostano ogni volta che il parser aggiunge uno step.
// stepAt = il primo step nato da quella riga; stateAfter = lo stato subito dopo quella riga.
const stepAt = (parsed, line) => parsed.steps.findIndex((s) => s.line === line);
const stateAfter = (r, line) => r.snapshots[r.parsed.steps.findLastIndex((s) => s.line === line)];
const field = (S, p) => S.players[p].chars.map((c) => c.id + (c.rested ? ' R' : ''));

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
  const r = replay(sampleLog);
  const known = (line, player) => stateAfter(r, line).players[player].hand.filter((c) => c.known).map((c) => [c.id, c.known]);
  assert.deepEqual(known(373, 2), []);
  assert.deepEqual(known(378, 2), [['ST32-001', 'revealed']]);
  assert.deepEqual(known(956, 2), [['OP17-022', 'revealed'], ['OP12-034', 'field']]);
  assert.deepEqual(known(1621, 2), [['OP06-038', 'revealed'], ['OP01-055', 'revealed']]);
  assert.deepEqual(known(1637, 2), [['OP06-038', 'revealed']]);
  assert.deepEqual(known(826, 1), [['ST32-001', 'field'], ['OP12-034', 'field']]);
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

test('il log oscurato non ha più chat né nick avversario, e si ricostruisce identico riga per riga', () => {
  const red = Core.redact(sampleLog);
  assert.doesNotMatch(red, /Theshyopop/);
  assert.doesNotMatch(red, /ggs|weird one/);
  assert.match(red, /LeoIlPirata/);
  assert.equal(red.split('\n').length, lines.length);
  const before = replay(sampleLog), after = replay(red);
  assert.deepEqual(after.mismatches, []);
  assert.equal(after.parsed.players[2].name, 'Avversario');
  assert.deepEqual(after.parsed.steps.map((s) => [s.kind, s.line]), before.parsed.steps.map((s) => [s.kind, s.line]));
  assert.deepEqual(after.parsed.steps.filter((s) => s.kind === 'chat').map((s) => s.text), ['…', '…']);
  assert.deepEqual(Core.summarize(red).result, Core.summarize(sampleLog).result);
  assert.equal(Core.redact(red), red);
});

test('ogni step ha la sua riga del log, così una nota può ancorarsi a qualsiasi momento', () => {
  const { parsed } = replay(sampleLog);
  assert.deepEqual(parsed.steps.filter((s) => !s.line).map((s) => s.i), []);
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

// ---------- carte riposate e attive: cosa dice il log, cosa dicono le regole per carta ----------

test('una carta giocata riposata da un effetto entra riposata (flag f3 della mossa)', () => {
  const r = replay(sampleLog);
  // r635: Trafalgar Law gioca Yasopp riposato; r557: Yasopp giocato dalla mano entra attivo
  assert.deepEqual(field(stateAfter(r, 635), 1), ['OP13-031', 'OP17-031 R']);
  assert.deepEqual(field(stateAfter(r, 557), 2), ['OP12-034', 'ST32-001', 'OP17-031']);
});

test('regola OP17-031: Yasopp riposa lo Yasopp avversario, non se stesso', () => {
  // nel log di esempio il mio Yasopp entra già riposato (Law): qui lo faccio entrare attivo, così la scelta del lato dipende solo dalla regola
  const upright = replay(sampleLog.replace('RZ1|250|1|OP17-031|1|4|2|1|1|1|1|', 'RZ1|250|1|OP17-031|1|4|2|1|1|1|0|'));
  assert.deepEqual(field(stateAfter(upright, 640), 1), ['OP13-031', 'OP17-031']);
  assert.deepEqual(field(stateAfter(upright, 640), 2), ['OP12-034', 'OP17-031 R']);
});

test('regola OP14-038: i primi due riposi sono carte proprie, il terzo è dell\'avversario', () => {
  const r = replay(sampleLog);
  // r999-r1005, giocata dall'avversario: riposa i suoi Perona e Law, pesca, poi riposa il mio Yasopp
  assert.deepEqual(field(stateAfter(r, 989), 1), ['OP17-031', 'OP13-031', 'OP17-031', 'OP12-034']);
  assert.deepEqual(field(stateAfter(r, 1005), 1), ['OP17-031 R', 'OP13-031', 'OP17-031', 'OP12-034']);
  assert.deepEqual(field(stateAfter(r, 1005), 2), ['OP13-031 R', 'OP17-031 R', 'OP12-034 R', 'OP13-031', 'ST32-002 R']);
});

test('il log di esempio non lascia dubbi su carte riposate e attive', () => {
  assert.deepEqual(replay(sampleLog).doubts, []);
});

test('un attacco a un personaggio che risulta attivo viene segnalato tra i dubbi', () => {
  // tolgo "Yasopp: Rest Yasopp" (r640): l'attacco di r657 allo Yasopp avversario non torna più
  const cut = [...lines]; cut[639] = '';
  const r = replay(cut.join('\n'));
  assert.deepEqual(r.mismatches, []);
  assert.deepEqual(r.doubts, ['r657 Dracule Mihawk attacking Yasopp: il personaggio attaccato risulta attivo']);
});

// ---------- eventi giocati dalla mano ----------

test('un evento ha uno step "gioca" prima dei suoi effetti e uno di chiusura dopo, e nel mezzo sta risolvendo', () => {
  const { parsed, snapshots } = replay(sampleLog);
  // r470-r476: l'avversario gioca You Can Be My Samurai!!!; il log mette il DON del costo e la mossa mano → trash solo alla fine
  const win = parsed.steps.filter((s) => s.line >= 470 && s.line <= 476);
  assert.deepEqual(win.map((s) => s.kind), ['event', 'effect', 'effect', 'effect', 'draw', 'draw', 'eventEnd']);
  assert.equal(win[0].text, 'gioca You Can Be My Samurai!!!');
  assert.deepEqual(win[0].moves.map((m) => [m.id, m.fz, m.tz, m.f3]), [['Don', 5, 5, 1]]);   // il DON del costo è anticipato al "gioca"
  assert.equal(snapshots[win[0].i - 1].resolving, null);
  const uids = win.slice(0, 6).map((s) => snapshots[s.i].resolving.uid);
  assert.equal(new Set(uids).size, 1);   // è sempre la stessa copia, anche quando ne pesca una seconda (r476)
  const last = snapshots[win[6].i];
  assert.equal(last.resolving, null);
  assert.equal(last.players[2].trash.at(-1).uid, uids[0]);
});

test('ogni evento giocato nel log di esempio viene riconosciuto, anche i counter in combattimento', () => {
  const { parsed } = replay(sampleLog);
  const plays = parsed.steps.filter((s) => s.kind === 'event');
  assert.deepEqual(plays.map((s) => [s.line, s.player, s.cards[0].id]), [
    [470, 2, 'OP01-055'], [759, 1, 'OP06-038'], [887, 2, 'OP06-038'], [994, 2, 'OP14-038'], [1022, 1, 'OP14-038'], [1238, 2, 'OP01-055'], [1257, 1, 'OP06-038'],
    [1541, 2, 'OP12-037'], [1631, 2, 'OP01-055'], [1661, 1, 'OP14-038'], [1788, 2, 'OP06-038'], [1796, 2, 'OP13-040'], [1890, 1, 'OP06-038'],
  ]);
  assert.equal(parsed.steps.filter((s) => s.kind === 'eventEnd').length, plays.length);
});

// ---------- "guarda le prime N carte" ----------

test('le carte guardate in cima al mazzo si vedono tutte: quella presa va in mano, le altre tornano in fondo', () => {
  const { parsed, snapshots } = replay(sampleLog);
  // r373-r379: Perona dell'avversario guarda 5 carte, prende Kin'emon (la terza dalla cima) e mette le altre in fondo
  const i = stepAt(parsed, 378);
  assert.deepEqual(parsed.steps.slice(i, i + 3).map((s) => s.kind), ['look', 'reveal', 'bottom']);
  assert.equal(parsed.steps[i].text, 'Perona: guarda le prime 5 carte');
  assert.deepEqual(parsed.steps[i].look, ['OP12-037', 'OP12-034', 'ST32-001', 'OP06-038', 'OP14-039']);
  assert.equal(snapshots[i - 1].look, null);
  const seen = snapshots[i].look.cards;
  assert.deepEqual(seen.map((c) => c.id), ['OP12-037', 'OP12-034', 'ST32-001', 'OP06-038', 'OP14-039']);
  // la carta presa è la stessa che entra in mano (stesso uid), e sparisce da quelle in vista
  assert.deepEqual(snapshots[i + 1].look.cards.map((c) => c.id), ['OP12-037', 'OP12-034', 'OP06-038', 'OP14-039']);
  assert.equal(snapshots[i + 1].players[2].hand.at(-1).uid, seen[2].uid);
  assert.equal(snapshots[i + 1].players[2].hand.at(-1).known, 'revealed');
  assert.equal(snapshots[i + 2].look, null);
});

test('ogni "Placing Cards on Bottom of Deck" del log di esempio ha il suo step con le 5 carte viste', () => {
  const { parsed } = replay(sampleLog);
  const looks = parsed.steps.filter((s) => s.kind === 'look');
  assert.deepEqual(looks.map((s) => [s.line, s.player, s.cards[0].id, s.look.length]), [
    [378, 2, 'OP12-034', 5], [732, 2, 'OP12-034', 5], [801, 1, 'OP12-034', 5], [844, 1, 'OP12-034', 5], [931, 2, 'OP12-034', 5], [1200, 2, 'OP12-034', 5],
    [1217, 2, 'OP07-022', 5], [1500, 1, 'OP12-034', 5], [1578, 2, 'OP12-034', 5], [1621, 2, 'OP12-034', 5], [1747, 1, 'OP12-034', 5],
  ]);
  // la carta presa è tra quelle viste
  for (const s of looks) assert.ok(s.look.includes(parsed.steps[s.i + 1].target.id));
});

// ---------- potenze in combattimento ----------

test('le potenze al momento dell\'attacco vengono dal log, con i bonus fissi che il log non nomina', () => {
  const r = replay(sampleLog);
  const combat = (line, kind) => { const c = r.snapshots[r.parsed.steps.findIndex((s) => s.line === line && s.kind === kind)].combat; return [c.atk, c.def]; };
  // r483: Mihawk contro Mihawk. La carta dice 5000, ma contro questo leader vale 6000: lo dice la riga "vs" e vale già all'attacco
  assert.deepEqual(combat(483, 'attack'), [6000, 6000]);
  // r758-r769: Mihawk (6000 + 2 DON) attacca Yasopp; un evento dà +2000, un counter +1000, e la riga "vs" chiude a 8000 contro 9000
  assert.deepEqual(combat(758, 'attack'), [8000, 6000]);
  assert.deepEqual(combat(765, 'effect'), [8000, 8000]);
  assert.deepEqual(combat(766, 'counter'), [8000, 9000]);
  assert.deepEqual(combat(769, 'vs'), [8000, 9000]);
  // ogni attacco del log ha la sua riga "vs" da cui risalire
  assert.deepEqual(r.parsed.steps.filter((s) => s.kind === 'attack' && (s.atk0 == null || s.def0 == null)).map((s) => s.line), []);
});

// ---- log di AutoSaved: markup intero sulle carte, più partite nello stesso file ----
const richLog = sampleLog.replace(/\["([A-Za-z0-9\-_]+)">\1\]/g, '[<mark><link="$1">$1</link></mark>]');
const shape = (parsed) => parsed.steps.map((s) => [s.kind, s.text, s.moves.length]);

test('un log di AutoSaved, con il markup intero sulle carte, si legge come quello scaricato a mano', () => {
  assert.match(richLog, /Leader is Dracule Mihawk \[<mark><link="OP14-020">OP14-020<\/link><\/mark>\]/);
  const plain = replay(sampleLog), rich = replay(richLog);
  assert.deepEqual(rich.mismatches, []);
  assert.deepEqual(shape(rich.parsed), shape(plain.parsed));
  assert.deepEqual(Core.summarize(richLog), Core.summarize(sampleLog));
});

test('di un file con più partite si legge l\'ultima giocata, senza le mosse che sgombrano il tavolo tra una e l\'altra', () => {
  const clear = ['RZ1|HDR|1.43a|2|RZ1', 'RZ1|PLY|1|LeoIlPirata#3980|OP14-020', 'RZ1|1|1|Don|9|9900|5|0|1|1|1|0|0', 'RZ1|CHK|1|1|27|6|4|2|0|8|11|0|1|2', 'Opponent is Ready for Rematch'];
  const first = ['Attempting to connect to ABC123', ...lines.slice(1)];
  const one = replay(sampleLog);
  // due partite di fila: vale la seconda, con le righe contate sul file intero
  const two = replay([...first, ...clear, ...lines].join('\n'));
  assert.deepEqual(two.mismatches, []);
  assert.deepEqual(shape(two.parsed), shape(one.parsed));
  assert.equal(two.parsed.steps[0].line, one.parsed.steps[0].line + first.length + clear.length);
  // una rivincita accettata ma mai iniziata non è una partita: resta l'ultima giocata
  const pending = replay([...lines, ...clear, 'Version is 1.43a.1', lines[3], 'Version is 1.43a.1', lines[6]].join('\n'));
  assert.deepEqual(pending.mismatches, []);
  assert.deepEqual(shape(pending.parsed), shape(one.parsed));
  // il log condiviso tiene solo quella partita, con le righe al loro posto
  const red = Core.redact([...first, ...clear, ...lines].join('\n')).split('\n');
  assert.equal(red.length, first.length + clear.length + lines.length);
  assert.deepEqual(red.slice(0, first.length + clear.length).filter((l) => l.trim()), []);
});

test('un DON attaccato che torna nel DON deck (Minus N Don) lascia la carta e non è una zona sconosciuta', () => {
  const { parsed } = replay(sampleLog);
  const step = parsed.steps.find((s) => s.kind === 'attach' && s.moves.some((m) => m.fz === 5 && m.tz === 9));
  const mv = step.moves.findLast((m) => m.fz === 5 && m.tz === 9);
  const mod = lines.slice();
  mod.splice(mv.line + 1, 0, 'RZ1|' + mv.seq + '|' + mv.player + '|Don|9|' + mv.ti + '|4|0|1|1|0|0|0');   // subito dopo il CHK della mossa
  const r = replay(mod.join('\n'));
  assert.deepEqual(r.mismatches.filter((m) => /zona sconosciuta|non trovata|mancante/.test(m)), []);
  const donOn = (S) => { const P = S.players[mv.player]; return P.leader.don + P.chars.reduce((n, c) => n + c.don, 0); };
  const k = stepAt(r.parsed, step.line);
  assert.equal(donOn(r.snapshots[k]), donOn(r.snapshots[k - 1]) + step.moves.length - 1);
});

test('in combattimento le mosse seguono l\'ordine del log, anche quando arrivano prima delle righe che le spiegano', () => {
  // righe 758-768 del log di esempio: attacco, evento counter (testo, DON del costo, evento mano → trash), poi un counter scartato dalla mano.
  // Il sim a volte scrive le mosse prima del testo: stesso scambio, stesse mosse e stessi CHK, quindi deve tornare uguale.
  assert.match(lines[757], /attacking Yasopp/);
  assert.match(lines[758], /Billion-fold World Trichiliocosm.*Activate Counter/);
  assert.match(lines[765], /Discard Kouzuki Oden.*for Counter 1000/);
  const pick = (...idx) => idx.map((k) => lines[k]);
  const mod = [...lines.slice(0, 758), ...pick(760, 761, 762, 763), ...pick(758, 759, 764), ...pick(766, 767), lines[765], ...lines.slice(768)];
  assert.equal(mod.length, lines.length);
  const r = replay(mod.join('\n'));
  assert.deepEqual(r.mismatches, []);
  assert.equal(r.parsed.steps.filter((s) => s.kind === 'event').length, 13);
});

// ---------- blocker ----------

test('"Blocks" sposta l\'attacco sul blocker: diventa lui il bersaglio, si riposa e prende la sua potenza dalla riga "vs"', () => {
  // r868: il mio Yasopp attacca lo Yasopp avversario. Faccio bloccare il Trafalgar Law avversario, attivo in campo, prima del counter di r869
  assert.match(lines[867], /^\[You\] Yasopp .* attacking Yasopp /);
  const mod = [...lines];
  mod.splice(868, 0, '[Opponent] Trafalgar Law ["OP13-031">OP13-031] Blocks');
  assert.match(mod[872], /\[7000\] vs Yasopp .*\[8000\]/);
  mod[872] = 'Yasopp ["OP17-031">OP17-031][7000] vs Trafalgar Law ["OP13-031">OP13-031][8000]';
  const r = replay(mod.join('\n'));
  assert.deepEqual(r.mismatches, []);
  const i = stepAt(r.parsed, 869);
  assert.equal(r.parsed.steps[i].kind, 'block');
  const before = r.snapshots[i - 1], after = r.snapshots[i];
  const [law, yasopp] = before.players[2].chars;
  assert.deepEqual([law.id, law.rested, yasopp.id, yasopp.rested], ['OP13-031', false, 'OP17-031', true]);
  assert.equal(before.combat.defender, yasopp.uid);
  assert.equal(after.combat.defender, law.uid);
  assert.equal(after.combat.attacker, before.combat.attacker);
  assert.equal(after.players[2].chars[0].rested, true);
  // 8000 alla riga "vs", meno il counter da 2000 arrivato dopo il blocco
  assert.deepEqual([after.combat.atk, after.combat.def], [7000, 6000]);
  assert.deepEqual(r.snapshots[i + 1].combat.def, 8000);
  assert.equal(stateAfter(r, 873).combat.defender, law.uid);   // la riga "vs" non cambia il bersaglio
});

test('con due copie uguali in campo blocca quella che poi va nel trash, e resta sul tavolo fino all\'esito', () => {
  // r987: lo Yasopp avversario attacca il mio Law. Ho due Yasopp attivi, ai posti 1 e 3: blocca il secondo, e il log mette subito la sua mossa campo → trash
  assert.match(lines[986], /^\[Opponent\] Yasopp .* attacking Trafalgar Law /);
  const mod = [...lines.slice(0, 987),
    '[You] Yasopp ["OP17-031">OP17-031] Blocks',
    'RZ1|361|1|OP17-031|2|3|6|6|1|1|0|0|0',
    'Yasopp ["OP17-031">OP17-031][6000] vs Yasopp ["OP17-031">OP17-031][5000]',
    '[You] Yasopp ["OP17-031">OP17-031] Destroyed'];
  const r = replay(mod.join('\n'));
  assert.deepEqual(r.parsed.steps.slice(-4).map((s) => [s.kind, s.moves.length]), [['attack', 0], ['block', 0], ['vs', 0], ['destroyed', 1]]);
  const [atk, block, vs, end] = r.snapshots.slice(-4);
  assert.deepEqual(field(atk, 1), ['OP13-031 R', 'OP17-031', 'OP13-031', 'OP17-031', 'OP12-034']);
  const twin = atk.players[1].chars[3];
  assert.equal(block.combat.defender, twin.uid);
  assert.deepEqual(field(block, 1), ['OP13-031 R', 'OP17-031', 'OP13-031', 'OP17-031 R', 'OP12-034']);
  assert.deepEqual(field(vs, 1), field(block, 1));
  assert.equal(vs.combat.defender, twin.uid);
  assert.deepEqual(end.flash, [twin.uid]);
  assert.deepEqual(field(end, 1), ['OP13-031 R', 'OP17-031', 'OP13-031', 'OP12-034']);
  assert.equal(end.players[1].trash.at(-1).uid, twin.uid);
});
