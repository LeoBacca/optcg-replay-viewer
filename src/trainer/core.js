// Memory Trainer — la logica, senza pagina (provata da test/trainer.test.mjs).
// Allena a ricordare le carte mandate in fondo al mazzo con le searchate (Perona, Otama: 4 sotto, 5 se non si pesca niente).
// Il metodo: ogni carta unica del mazzo scelto diventa un suono consonantico (conversione fonetica), le associazioni si fissano con le flashcard
// a ripetizione spaziata, e una searchata diventa una fila di consonanti con cui fare parole.
// Le schermate stanno in screens.js.

// Mazzo di esempio per chi non ha ancora log: il Mihawk di Leo (lista del 2026-10-01). Gli altri mazzi si ricavano dai log con deckFrom.
const DECKS = {
  mihawk: {
    name: 'Dracule Mihawk',
    leader: 'OP14-020',
    cards: {
      'OP06-033': 4,
      'OP06-038': 4,
      'OP07-022': 4,
      'OP12-023': 4,
      'OP12-034': 4,
      'OP13-031': 4,
      'OP13-040': 2,
      'OP14-038': 4,
      'OP14-039': 4,
      'OP17-022': 4,
      'OP17-031': 4,
      'ST32-001': 4,
      'ST32-002': 4,
    },
  },
};
// blocks = searchate da ricordare, secs = secondi per guardare ogni blocco. Quattro searchate sono una partita normale, cinque il Boss.
const LEVELS = [
  { blocks: 2, secs: 20 },
  { blocks: 2, secs: 12 },
  { blocks: 3, secs: 20 },
  { blocks: 3, secs: 12 },
  { blocks: 4, secs: 20 },
  { blocks: 4, secs: 12 },
  { blocks: 4, secs: 8 },
  { blocks: 4, secs: 5 },
  { blocks: 5, secs: 12 },
  { blocks: 5, secs: 6 },
];
const MASTER = 3; // perfette di fila per dire un livello "consolidato"
const PICK = 0.75; // quante searchate trovano una carta da prendere (ne vanno sotto 4); le altre mandano sotto tutte e 5

const listOf = (deck) => Object.entries(deck.cards).flatMap(([id, n]) => Array(n).fill(id));
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Una partita simulata: mazzo mescolato, ogni searchata guarda le prime 5; ogni blocco è nell'ordine in cui le carte vanno sotto.
function deal(deck, nBlocks, rnd) {
  rnd = rnd || Math.random;
  const pile = shuffle(listOf(deck), rnd),
    blocks = [];
  for (let b = 0; b < nBlocks; b++) {
    const seen = pile.splice(0, 5);
    if (rnd() < PICK) seen.splice(Math.floor(rnd() * seen.length), 1);
    blocks.push(seen);
  }
  return blocks;
}

// Il fondo del mazzo come lo tiene il motore del replay (indice 0 = la carta più in fondo, g = searchata) → blocchi nell'ordine in cui sono andati sotto
function groups(bottom) {
  const out = [];
  for (let i = bottom.length - 1, g = null; i >= 0; i--) {
    if (bottom[i].g !== g) {
      out.push([]);
      g = bottom[i].g;
    }
    out[out.length - 1].push(bottom[i].id);
  }
  return out;
}

// answer: un id (o null) per posto, tutti i blocchi in fila. Conta il posto esatto; due copie della stessa carta valgono uguale.
function score(blocks, answer) {
  const want = blocks.flat(),
    marks = want.map((id, i) => answer[i] === id);
  let k = 0;
  const perBlock = blocks.map((b) => {
    const m = marks.slice(k, k + b.length);
    k += b.length;
    return { right: m.filter(Boolean).length, total: b.length };
  });
  const right = marks.filter(Boolean).length;
  return {
    marks,
    perBlock,
    right,
    total: want.length,
    pct: want.length ? Math.round((100 * right) / want.length) : 0,
    perfect: right === want.length,
  };
}

// ---- mazzi ----
// Quello che si salva: il mazzo scelto (id del leader) e, per ogni mazzo, lista, associazioni, flashcard e record dei livelli.
// assoc[id] = { s: 'P B', why }; srs[id + '>'] è la flashcard carta → suono, srs[id + '<'] quella suono → carta.
const newStore = () => ({ v: 2, deck: null, decks: {} });
const newDeck = (leader, name, cards, from) => ({
  name,
  leader,
  cards,
  from: from || null,
  assoc: {},
  srs: {},
  unlocked: 1,
  levels: {},
});
const example = () => newDeck(DECKS.mihawk.leader, DECKS.mihawk.name, Object.assign({}, DECKS.mihawk.cards));
// La prima versione teneva solo i record dei livelli, tutti sul Mihawk: restano suoi.
function migrate(s) {
  if (s && s.v === 2 && s.decks) return s;
  const store = newStore();
  if (s && s.v === 1) {
    const d = example();
    d.unlocked = s.unlocked || 1;
    d.levels = s.levels || {};
    store.decks[d.leader] = d;
    store.deck = d.leader;
  }
  return store;
}
// La lista del mazzo sta nei log: ogni rimescolata di chi ha scaricato il log elenca le sue carte (mosse mazzo → mazzo ai posti 0, 1, 2…),
// tranne le poche che restano dov'erano. Da una partita esce quindi quasi tutta la lista (di solito 47-49 carte su 50): per ogni carta
// il numero più alto visto in una rimescolata. null se nel log non c'è nessuna rimescolata.
const SIZE = 50;
const total = (cards) => Object.values(cards).reduce((a, b) => a + b, 0);
function deckFrom(parsed) {
  const cards = {};
  let found = false;
  for (const st of parsed.steps) {
    const dd = st.moves.filter((mv) => mv.player === 1 && mv.fz === 0 && mv.tz === 0);
    if (dd.length < 20 || dd.some((mv, i) => i && mv.ti <= dd[i - 1].ti)) continue;
    const seen = {};
    for (const mv of dd) seen[mv.id] = (seen[mv.id] || 0) + 1;
    for (const id in seen) cards[id] = Math.max(cards[id] || 0, seen[id]);
    found = true;
  }
  return found ? cards : null;
}
// Le liste di più partite (dalla più recente) messe insieme finché il mazzo è completo. Una partita che farebbe superare le 50 carte
// era giocata con un'altra lista, e si salta.
function mergeLists(lists) {
  let acc = null;
  for (const l of lists) {
    if (!l) continue;
    if (!acc) acc = Object.assign({}, l);
    else {
      const m = Object.assign({}, acc);
      for (const id in l) m[id] = Math.max(m[id] || 0, l[id]);
      if (total(m) <= SIZE) acc = m;
    }
    if (total(acc) >= SIZE) break;
  }
  return acc;
}
const sameCards = (a, b) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((id) => a[id] === b[id]);
};
// Cambia la lista di un mazzo già associato: le associazioni restano, torna l'elenco delle carte nuove ancora da associare.
function setCards(deck, cards, from) {
  const fresh = Object.keys(cards).filter((id) => !(id in deck.cards));
  deck.cards = cards;
  deck.from = from || deck.from;
  return fresh;
}

// ---- conversione fonetica ----
// I suoni non sono lettere: la C di "casa" e quella di "cena" sono due suoni diversi. Questi sono i suoni consonantici dell'italiano,
// ognuno con una sigla e le parole che lo fanno sentire; FAMILIES li mette vicini per somiglianza (i due di una carta vanno presi dalla stessa).
const SOUNDS = {
  P: 'pane',
  B: 'barca',
  T: 'tavolo',
  D: 'dado',
  F: 'fuoco',
  V: 'vino',
  K: 'casa, chiave',
  G: 'gatto, ghiro',
  CI: 'cena, ciao',
  GI: 'gelato, giro',
  S: 'sole',
  Z: 'zaino',
  SC: 'sci, scena',
  M: 'mano',
  N: 'naso',
  GN: 'gnomo',
  L: 'luna',
  R: 'rana',
  GL: 'aglio',
};
const NAMES = { K: 'C dura', G: 'G dura', CI: 'C dolce', GI: 'G dolce' };
const FAMILIES = [
  ['P', 'B'],
  ['T', 'D'],
  ['F', 'V'],
  ['K', 'G'],
  ['CI', 'GI'],
  ['S', 'Z', 'SC'],
  ['M', 'N', 'GN'],
  ['L', 'R', 'GL'],
];
const ALIAS = {
  C: 'K',
  CH: 'K',
  Q: 'K',
  CK: 'K',
  GH: 'G',
  CE: 'CI',
  GE: 'GI',
  J: 'GI',
  SCI: 'SC',
  SCE: 'SC',
  SH: 'SC',
  GLI: 'GL',
};
// "C dura · come in casa, chiave"
const soundName = (k) => (NAMES[k] ? NAMES[k] + ' · ' : '') + 'come in ' + SOUNDS[k];
// Un testo scritto a mano o da un LLM ("p, b", "C dolce", "ch") → le sigle dei suoni, al massimo due: ['P', 'B'], ['CI'], ['K']
const sounds = (text) =>
  [
    ...new Set(
      String(text || '')
        .toUpperCase()
        .replace(/\b([CG])\s+DOLCE\b/g, '$1I')
        .replace(/\bC\s+DURA\b/g, 'K')
        .replace(/\bG\s+DURA\b/g, 'G')
        .split(/[^A-Z]+/)
        .map((t) => ALIAS[t] || t)
        .filter((t) => t in SOUNDS),
    ),
  ].slice(0, 2);
const soundOf = (deck, id) => sounds((deck.assoc[id] || {}).s).join(' ');
const assigned = (deck) => Object.keys(deck.cards).filter((id) => soundOf(deck, id));
// Suoni dati a più di una carta: { K: [id, id] }. È un avviso, non un divieto.
function clashes(deck) {
  const by = {},
    out = {};
  for (const id of Object.keys(deck.cards))
    for (const s of sounds((deck.assoc[id] || {}).s)) (by[s] = by[s] || []).push(id);
  for (const s in by) if (by[s].length > 1) out[s] = by[s];
  return out;
}
// Se il suono cambia, le due flashcard della carta ripartono da capo.
function setAssoc(deck, id, s, why) {
  const before = soundOf(deck, id),
    now = sounds(s).join(' ');
  deck.assoc[id] = { s: now, why: String(why || '').trim() };
  if (before !== now) {
    delete deck.srs[id + '>'];
    delete deck.srs[id + '<'];
  }
}
// Le associazioni come testo, una riga per carta: "OP12-034 | P B | motivo". È anche il formato che il prompt chiede all'LLM.
const tableOf = (deck) =>
  Object.keys(deck.cards)
    .sort()
    .map((id) => id + ' | ' + soundOf(deck, id) + ' | ' + ((deck.assoc[id] || {}).why || ''))
    .join('\n');
// Legge quel formato da un testo incollato: tiene le righe che cominciano con una carta del mazzo, il resto (intestazioni, ```, chiacchiere) lo salta.
function parseTable(text, deck) {
  const rows = {};
  let skipped = 0;
  for (const line of String(text || '').split(/\r?\n/)) {
    const cells = line
      .replace(/^[\s|]+|[\s|]+$/g, '')
      .split('|')
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    const id = cells[0].replace(/[`*]/g, '').trim().toUpperCase(),
      s = sounds(cells[1].replace(/[`*]/g, ''));
    if (!(id in deck.cards) || !s.length) {
      if (/^[A-Z0-9]+-\d+/.test(id)) skipped++;
      continue;
    }
    rows[id] = { s: s.join(' '), why: cells.slice(2).join(' | ') };
  }
  return { rows, skipped };
}
// Il prompt da copiare nel proprio LLM. nameOf e metaOf arrivano dalla pagina (nomi e numeri delle carte).
function promptFor(deck, nameOf, metaOf) {
  const ids = Object.keys(deck.cards).sort();
  const line = (id) => {
    const m = (metaOf && metaOf(id)) || {},
      bits = [];
    if (m.cost != null) bits.push('costo ' + m.cost);
    if (m.power) bits.push(m.power + ' di potenza');
    if (m.counter) bits.push('counter ' + m.counter);
    return (
      '- ' +
      id +
      ' · ' +
      nameOf(id) +
      (bits.length ? ' · ' + bits.join(', ') : '') +
      ' · ' +
      deck.cards[id] +
      (deck.cards[id] === 1 ? ' copia' : ' copie')
    );
  };
  const done = assigned(deck);
  return [
    'Aiutami a costruire una CONVERSIONE FONETICA per il mio mazzo di One Piece Card Game (leader: ' + deck.name + ').',
    '',
    'A COSA SERVE',
    'In partita, quando cerco una carta guardando le prime del mazzo, quelle che non prendo vanno in fondo al mazzo in un ordine preciso (4 o 5 carte per volta, più volte a partita). Voglio ricordare quell\'ordine. Il metodo: ogni carta unica del mazzo diventa un suono consonantico; una fila di carte diventa una fila di consonanti, che riempio di vocali per farne parole concrete. Esempi: P L K M → "PoLLo CoMò"; T G L K V → "TeGoLa CHiaVe" (cinque carte in due parole).',
    '',
    'REGOLE',
    '1. A ogni carta unica vanno 1 o 2 SUONI consonantici (suoni, non lettere), scelti solo da questo elenco. Ogni suono ha una sigla:',
    ...FAMILIES.map(
      (f) => '   ' + f.map((k) => k + ' = ' + (NAMES[k] ? NAMES[k] + ', ' : '') + 'come in ' + SOUNDS[k]).join('  ·  '),
    ),
    '   Ogni riga è una famiglia di suoni simili in bocca: se a una carta ne dai 2, devono stare sulla stessa riga (P B, K G, CI GI…).',
    '2. Nessun suono su due carte diverse. Le carte uniche sono ' +
      ids.length +
      ' e i suoni ' +
      Object.keys(SOUNDS).length +
      ": quando le coppie non bastano, si spezzano (M a una carta, N a un'altra).",
    '3. Vale il suono, non la lettera: "chiave" comincia con K, "cena" con CI, "sci" è SC, "gnomo" è GN. La doppia conta una volta sola; le vocali sono libere.',
    "4. Ogni associazione deve avere un MOTIVO facile da ricordare: l'iniziale del nome o del soprannome, qualcosa che si vede nell'illustrazione, quello che la carta fa. Più è sciocco e visivo, meglio è.",
    '5. I suoni più comodi per fare parole in italiano (T, L, R, N, K, P, S, M) e le coppie intere vanno alle carte che ho in più copie, perché sono quelle che vedrò più spesso.',
    '',
    'LE CARTE DEL MAZZO',
    ...ids.map(line),
    ...(done.length
      ? [
          '',
          'ASSOCIAZIONI CHE HO GIÀ (tienile, a meno che non creino problemi)',
          ...done.map((id) => id + ' | ' + soundOf(deck, id) + ' | ' + (deck.assoc[id].why || '')),
        ]
      : []),
    '',
    'COME PROCEDERE',
    '1. Se non conosci bene una carta, cercala dal codice. Poi chiedimi come chiamo io le carte: soprannomi, e soprattutto come distinguo le carte che hanno lo stesso personaggio (per esempio "quella che cerca" e "quella che blocca").',
    "2. Proponimi un'assegnazione completa, con il motivo di ognuna, e controlla che nessun suono si ripeta.",
    '3. Discutiamola: cambio quello che non mi suona finché ogni associazione mi viene naturale.',
    "4. Quando ti dico che va bene, chiudi con la tabella finale dentro un blocco di codice, una riga per carta e nient'altro, in questo formato esatto:",
    '',
    'CODICE | SUONI | MOTIVO',
    'Esempio: ' + ids[0] + ' | P B | motivo in poche parole',
    '',
    "Nella colonna SUONI solo le sigle dell'elenco, separate da uno spazio (P B, K, CI GI), senza parentesi né commenti. La tabella la incollo così com'è nel mio programma.",
  ].join('\n');
}

// ---- flashcard a ripetizione spaziata ----
// I giorni sono interi (giorno locale); una flashcard è { due, ivl, ease, reps, lapses }, e finché non esiste è nuova.
const today = (d) => {
  d = d || new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
};
const flashcards = (deck) => assigned(deck).flatMap((id) => [id + '>', id + '<']);
const dueCards = (deck, day) => flashcards(deck).filter((k) => !deck.srs[k] || deck.srs[k].due <= day);
// Il primo giorno in cui ci sarà qualcosa da ripassare, o null se non c'è ancora nessuna flashcard
const nextDue = (deck) => {
  const d = flashcards(deck).map((k) => (deck.srs[k] ? deck.srs[k].due : 0));
  return d.length ? Math.min(...d) : null;
};
// g: 0 non la sapevo (resta da rifare oggi), 1 bene (1 giorno, 3, poi intervallo × ease), 2 facile (salto più lungo)
function grade(deck, key, g, day) {
  const c = (deck.srs[key] = deck.srs[key] || { due: day, ivl: 0, ease: 2.5, reps: 0, lapses: 0 });
  if (g === 0) {
    if (c.reps) c.lapses++;
    c.reps = 0;
    c.ivl = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = day;
    return c;
  }
  if (g === 2) {
    c.ivl = c.reps === 0 ? 4 : Math.round(Math.max(c.ivl, 1) * c.ease * 1.3);
    c.ease += 0.15;
  } else c.ivl = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.ivl * c.ease);
  c.reps++;
  c.due = day + c.ivl;
  return c;
}

// ---- livelli del training puro (i record stanno nel mazzo) ----
const statOf = (store, n) =>
  store.levels[n] || { runs: 0, perfect: 0, streak: 0, bestStreak: 0, bestPct: 0, bestMs: null };
// Segna una prova del livello n (da 1). Un livello si supera solo con la ricostruzione perfetta, e superarlo apre il successivo.
function record(store, n, res, ms) {
  const L = (store.levels[n] = statOf(store, n));
  L.runs++;
  L.bestPct = Math.max(L.bestPct, res.pct);
  if (res.perfect) {
    L.perfect++;
    L.streak++;
    L.bestStreak = Math.max(L.bestStreak, L.streak);
    if (L.bestMs == null || ms < L.bestMs) L.bestMs = ms;
    if (n === store.unlocked && n < LEVELS.length) store.unlocked = n + 1;
  } else L.streak = 0;
  return L;
}
const passed = (store, n) => statOf(store, n).perfect > 0;
const mastered = (store, n) => statOf(store, n).bestStreak >= MASTER;

export {
  DECKS,
  LEVELS,
  MASTER,
  deal,
  groups,
  score,
  newStore,
  newDeck,
  example,
  migrate,
  SIZE,
  total,
  deckFrom,
  mergeLists,
  sameCards,
  setCards,
  SOUNDS,
  FAMILIES,
  soundName,
  sounds,
  soundOf,
  assigned,
  clashes,
  setAssoc,
  tableOf,
  parseTable,
  promptFor,
  today,
  flashcards,
  dueCards,
  nextDue,
  grade,
  statOf,
  record,
  passed,
  mastered,
};
