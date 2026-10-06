// Memory Trainer — le schermate. Solo app desktop, dietro l'interruttore "Funzioni in prova".
// Sono scritte a mano sul DOM (non in React): il trainer è ancora in prova e cambia spesso.
// La pagina gli passa in "app" i pezzi che gli servono (vedi src/trainer/index.js).
import * as Core from '../core/index.js';
import * as T from './core.js';

/**
 * Crea il trainer e lo aggancia alla pagina.
 * @param {object} app  i pezzi della pagina: $, mk, setImg, metaOf, Settings, Home, Library, toast, copyText, logs, openLog, pause, state
 * @returns l'oggetto con cui la pagina comanda il trainer: open, close, isOpen, key, onStep, toggleBottom, setPanel, panelOn, lab, quiz
 */
export function createTrainer(app) {
  const { $, mk, setImg, metaOf, Settings, Home, Library, toast } = app;
  // negli appunti si passa dal processo principale; se non c'è (exe vecchio) resta la copia della pagina
  const copyText = async (text) => {
    try {
      if (window.desktop.copy) {
        window.desktop.copy(text);
        return true;
      }
    } catch (e) {}
    return app.copyText(text);
  };
  const KEY = 'optcg.trainer';
  let store = T.newStore();
  try {
    store = T.migrate(JSON.parse(localStorage.getItem(KEY) || 'null'));
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {}
  };
  // DECK = il mazzo scelto (null finché non se ne sceglie uno): esercizi, associazioni e flashcard girano tutti su questo
  let DECK = store.decks[store.deck] || null;
  function use(deck) {
    store.decks[deck.leader] = deck;
    store.deck = deck.leader;
    DECK = deck;
    save();
  }
  // --trainer[=schermata] all'avvio dell'exe: apre il trainer senza toccare l'impostazione (serve per provarlo da terminale)
  const force = new URLSearchParams(location.search).get('trainer');
  const lab = () => force != null || !!Settings.get('lab');
  const nameOf = (id) => (metaOf(id) || {}).name || id;
  const secs = (ms) => (ms / 1000).toFixed(1).replace('.', ',') + ' s';

  const el = mk('div', 'hidden');
  el.id = 'trainer';
  const head = mk('header'),
    back = mk('button', 'tback', '‹ Indietro'),
    title = mk('h1'),
    sub = mk('p', 'tsub');
  const body = mk('div', 'tbody'),
    zoom = mk('div', 'tzoom');
  head.append(back, title, sub);
  el.append(head, body, zoom);
  document.body.append(el);
  zoom.append(document.createElement('img'), mk('span'));

  // una carta: immagine, oppure il nome se l'immagine non arriva; al passaggio del mouse si ingrandisce a lato
  function card(id, cls) {
    const c = mk('div', 'tcard' + (cls ? ' ' + cls : '')),
      img = document.createElement('img');
    img.alt = nameOf(id);
    img.draggable = false;
    setImg(img, id, () => {
      img.remove();
      c.classList.add('noimg');
      c.append(mk('span', '', nameOf(id)));
    });
    c.append(img);
    c.onmouseenter = () => {
      setImg(zoom.firstChild, id);
      zoom.lastChild.textContent = nameOf(id);
      zoom.classList.add('show');
    };
    c.onmouseleave = () => zoom.classList.remove('show');
    return c;
  }
  const btn = (label, cls, on) => {
    const b = mk('button', cls, label);
    b.onclick = on;
    return b;
  };
  // nei campi di testo la pagina non passa i tasti al trainer: Esc esce dal campo, poi torna a valere "indietro"
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) e.target.blur();
  });

  // screen = schermata corrente; ctx = la prova in corso; timer = scadenza del blocco che si sta guardando
  let screen = '',
    ctx = null,
    timer = null,
    onKey = null,
    onBack = null;
  function view(name, t, s, backTo) {
    clearTimeout(timer);
    timer = null;
    onKey = null;
    zoom.classList.remove('show');
    screen = name;
    el.dataset.screen = name;
    delete el.dataset.res;
    title.textContent = t;
    sub.textContent = s || '';
    onBack = backTo;
    body.replaceChildren();
  }
  back.onclick = () => onBack && onBack();

  // ---- ingresso: il percorso, un passo dopo l'altro (guidato ma libero: si entra dove si vuole) ----
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const needDeck = (go) => () => (DECK ? go() : deckPick());
  function hub() {
    view('hub', 'MEMORY TRAINER', 'Ricorda le carte che mandi in fondo al mazzo', close);
    back.textContent = '‹ Menu';
    const nav = mk('nav', 'tsteps');
    const step = (n, label, note, on, done) => {
      const b = btn('', done ? 'ok' : '', on);
      b.append(mk('i', '', n), mk('b', '', label), mk('small', '', note));
      nav.append(b);
      return b;
    };
    const uniq = DECK ? Object.keys(DECK.cards).length : 0,
      has = DECK ? T.assigned(DECK).length : 0;
    const due = DECK ? T.dueCards(DECK, T.today()).length : 0,
      cards = DECK ? T.flashcards(DECK).length : 0;
    const done = DECK ? T.LEVELS.filter((_, i) => T.passed(DECK, i + 1)).length : 0;
    const first = step(
      1,
      'Mazzo',
      DECK ? DECK.name + ' · ' + plural(uniq, 'carta unica', 'carte uniche') : 'scegli il mazzo che stai imparando',
      deckPick,
      !!DECK,
    );
    const s2 = step(
      2,
      'Conversione fonetica',
      DECK ? has + ' / ' + uniq + ' carte con il loro suono' : 'un suono per ogni carta del mazzo',
      needDeck(assoc),
      uniq > 0 && has === uniq,
    );
    const s3 = step(
      3,
      'Flashcard',
      !cards ? 'per fissare le associazioni nella memoria' : due ? due + ' da ripassare oggi' : 'a posto per oggi',
      needDeck(srs),
      cards > 0 && !due,
    );
    const s4 = step(
      4,
      'Training puro',
      "blocchi a tempo, poi ricostruisci l'ordine · " + done + ' / ' + T.LEVELS.length + ' livelli superati',
      needDeck(levels),
      done === T.LEVELS.length,
    );
    step(5, 'In partita', 'rivedi un replay e prova a ricordare il fondo di quella partita', needDeck(games));
    body.append(nav, btn('Come funziona il metodo', 'thelp', tutorial));
    // il fuoco va sul primo passo che ha ancora qualcosa da fare
    (!DECK ? first : has < uniq ? s2 : due ? s3 : s4).focus();
  }

  // ---- 1. il mazzo: i leader giocati nei log; la lista delle carte viene dalle partite più recenti ----
  const stamp = (lf) => Core.gameDate(lf.name) || lf.mtime || 0;
  const READ = 8; // quante partite al massimo si leggono per completare la lista di un mazzo
  function deckPick() {
    view(
      'deck',
      'IL TUO MAZZO',
      'Scegli il mazzo che stai imparando: la lista delle carte la prendo dalle tue ultime partite con quel leader.',
      hub,
    );
    back.textContent = '‹ Indietro';
    const by = new Map();
    for (const lf of app.logs()) {
      const s = Library.sumOf(lf);
      if (!s || !s.me.leader) continue;
      const e = by.get(s.me.leader.id) || {
        id: s.me.leader.id,
        name: s.me.leader.name || nameOf(s.me.leader.id),
        logs: [],
      };
      e.logs.push(lf);
      by.set(e.id, e);
    }
    // i mazzi già salvati restano in elenco anche se i loro log non ci sono più
    for (const d of Object.values(store.decks))
      if (!by.has(d.leader)) by.set(d.leader, { id: d.leader, name: d.name, logs: [] });
    const list = mk('ul', 'tdecks');
    // una partita da sola non mostra tutte le 50 carte: si leggono le più recenti finché la lista è completa
    async function listOf(e) {
      const lists = [],
        recent = e.logs
          .slice()
          .sort((a, b) => stamp(b) - stamp(a))
          .slice(0, READ);
      for (const lf of recent) {
        try {
          lists.push(T.deckFrom(Core.parseLog(await Library.readText(lf))));
        } catch (err) {}
        const m = T.mergeLists(lists);
        if (m && T.total(m) >= T.SIZE) break;
      }
      return { cards: T.mergeLists(lists), from: recent.length ? Library.dateOf(recent[0]) : null };
    }
    // se il mazzo c'è già la lista si aggiorna, tenendo associazioni e record
    async function pick(e, li) {
      li.classList.add('busy');
      const { cards, from } = await listOf(e),
        old = store.decks[e.id];
      if (screen !== 'deck') return;
      li.classList.remove('busy');
      if (!old && !cards) {
        toast('Non riesco a leggere la lista del mazzo da quelle partite');
        return;
      }
      const short =
        cards && T.total(cards) < T.SIZE
          ? ' Ho trovato ' +
            T.total(cards) +
            ' carte su ' +
            T.SIZE +
            ': le altre arrivano giocando altre partite e riscegliendo il mazzo.'
          : '';
      if (!old) {
        use(T.newDeck(e.id, e.name, cards, from));
        if (short) toast(short.trim());
        assoc();
        return;
      }
      // una lista più corta di quella salvata non la sostituisce: è solo una partita che ha mostrato meno carte
      if (
        cards &&
        !T.sameCards(old.cards, cards) &&
        !(T.total(cards) < T.total(old.cards) && Object.keys(cards).every((id) => cards[id] <= (old.cards[id] || 0)))
      ) {
        const fresh = T.setCards(old, cards, from);
        toast(
          'Lista aggiornata dalle ultime partite' +
            (fresh.length ? ': ' + plural(fresh.length, 'carta nuova', 'carte nuove') + ' da associare.' : '.') +
            short,
        );
      }
      use(old);
      hub();
    }
    for (const e of [...by.values()].sort((a, b) => b.logs.length - a.logs.length)) {
      const li = mk('li', DECK && DECK.leader === e.id ? 'cur' : ''),
        img = document.createElement('img'),
        d = store.decks[e.id];
      img.alt = '';
      setImg(img, e.id, () => img.remove());
      li.append(
        img,
        mk('b', '', e.name),
        mk(
          'span',
          '',
          e.id + ' · ' + (e.logs.length ? plural(e.logs.length, 'partita', 'partite') : 'nessuna partita nei log'),
        ),
        mk(
          'small',
          '',
          d
            ? T.assigned(d).length +
                ' / ' +
                Object.keys(d.cards).length +
                ' carte associate' +
                (DECK === d ? ' · in uso' : '')
            : '',
        ),
      );
      li.tabIndex = 0;
      li.onclick = () => pick(e, li);
      list.append(li);
    }
    if (list.children.length) {
      body.append(list);
      list.firstChild.focus();
      onKey = (e) => {
        if (e.key === 'Enter' && document.activeElement.parentNode === list) document.activeElement.click();
      };
    } else {
      body.append(
        mk(
          'p',
          'tnote',
          app.logs().length
            ? 'Sto ancora leggendo le partite della cartella dei log: riprova tra un attimo.'
            : 'Nessuna partita: scegli la cartella dei log in Impostazioni, oppure prova con il mazzo di esempio.',
        ),
        btn('Usa il mazzo di esempio (' + T.DECKS.mihawk.name + ')', 'primary', () => {
          use(T.example());
          assoc();
        }),
      );
    }
  }

  // ---- 2. conversione fonetica: per ogni carta unica un suono e il motivo ----
  function assoc() {
    view(
      'assoc',
      'CONVERSIONE FONETICA',
      'A ogni carta 1 o 2 suoni della stessa famiglia e un motivo che te la faccia venire in mente. Clicca il riquadro del suono per sceglierlo.',
      hub,
    );
    back.textContent = '‹ Indietro';
    const ids = Object.keys(DECK.cards).sort((a, b) => DECK.cards[b] - DECK.cards[a] || (a < b ? -1 : 1));
    const warn = mk('p', 'twarn'),
      count = mk('p', 'tnote'),
      list = mk('div', 'tassoc');
    function status() {
      const c = T.clashes(DECK),
        k = Object.keys(c);
      warn.textContent = k.length
        ? 'Suoni doppi: ' + k.map((s) => s + ' (' + c[s].map(nameOf).join(', ') + ')').join(' · ')
        : '';
      count.textContent = T.assigned(DECK).length + ' / ' + ids.length + ' carte con il loro suono';
    }
    // i suoni non si scrivono: si scelgono da una tavolozza (una sola aperta alla volta, sotto la riga della carta), ognuno con la parola che lo fa sentire
    const picker = mk('div', 'tpick');
    const shut = () => {
      picker.remove();
      picker.dataset.id = '';
      onBack = hub;
    };
    for (const id of ids) {
      const row = mk('div', 'trowa'),
        why = document.createElement('input'),
        mine = () => T.sounds((DECK.assoc[id] || {}).s);
      const snd = btn('', 'snd', () => {
        if (picker.dataset.id === id) shut();
        else {
          picker.dataset.id = id;
          row.after(picker);
          onBack = () => {
            shut();
            snd.focus();
          };
          palette();
          (picker.querySelector('.on') || picker.querySelector('button')).focus();
        }
      });
      const drawSnd = () => {
        const s = mine();
        snd.replaceChildren(...(s.length ? s.map((k) => mk('b', '', k)) : [mk('span', '', 'scegli')]));
        snd.title = s.length ? s.map(T.soundName).join('  /  ') : 'Scegli il suono di ' + nameOf(id);
      };
      const set = (s) => {
        T.setAssoc(DECK, id, s.join(' '), why.value);
        save();
        drawSnd();
        status();
      };
      function palette(focus) {
        const s = mine(),
          taken = {};
        for (const o of ids) if (o !== id) for (const k of T.sounds((DECK.assoc[o] || {}).s)) taken[k] = nameOf(o);
        picker.replaceChildren();
        for (const fam of T.FAMILIES) {
          const g = mk('div', 'tfam');
          for (const k of fam) {
            const b = btn('', (s.includes(k) ? 'on' : '') + (taken[k] ? ' taken' : ''), () => {
              set(s.includes(k) ? s.filter((x) => x !== k) : [...s, k].slice(-2));
              palette(k);
            });
            b.append(
              mk('b', '', k),
              ...T.soundName(k)
                .replace('come in ', '')
                .split(' · ')
                .map((t) => mk('small', '', t)),
            );
            b.dataset.k = k;
            if (taken[k]) b.title = 'Già di ' + taken[k];
            g.append(b);
          }
          picker.append(g);
        }
        picker.append(
          btn('Fatto', 'primary', () => {
            shut();
            why.focus();
          }),
        );
        if (focus) picker.querySelector('[data-k="' + focus + '"]').focus();
      }
      why.type = 'text';
      why.maxLength = 160;
      why.placeholder = 'perché proprio questo suono';
      why.value = (DECK.assoc[id] || {}).why || '';
      why.setAttribute('aria-label', 'Motivo per ' + nameOf(id));
      why.onchange = () => set(mine());
      const name = mk('div', 'tname');
      name.append(mk('b', '', nameOf(id)), mk('small', '', id + ' · ×' + DECK.cards[id]));
      drawSnd();
      row.append(card(id), name, snd, why);
      list.append(row);
    }
    const acts = mk('div', 'tacts');
    acts.append(
      btn("Copia il prompt per l'AI", 'primary', async () =>
        toast(
          (await copyText(T.promptFor(DECK, nameOf, metaOf)))
            ? 'Prompt copiato: incollalo nella tua AI (ChatGPT, Claude…) e decidete insieme le associazioni'
            : 'Non sono riuscito a copiare il prompt',
        ),
      ),
      btn("Incolla la tabella dell'AI", '', paste),
      btn('Copia la tabella', '', async () =>
        toast((await copyText(T.tableOf(DECK))) ? 'Tabella copiata' : 'Non sono riuscito a copiare la tabella'),
      ),
    );
    status();
    body.append(acts, warn, list, count);
    const empty = [...list.querySelectorAll('button.snd')].find((b) => !b.querySelector('b'));
    if (empty) empty.focus();
  }
  // la tabella che l'AI scrive alla fine: una riga per carta, "CODICE | SUONI | MOTIVO"
  function paste() {
    view(
      'paste',
      'INCOLLA LA TABELLA',
      "Incolla qui la tabella finale dell'AI (CODICE | SUONI | MOTIVO, una riga per carta). Le righe che non sono carte del mazzo le salto.",
      assoc,
    );
    const ta = mk('textarea', 'tpaste'),
      note = mk('p', 'tnote', ''),
      ok = btn('Applica', 'primary', () => {
        const { rows } = T.parseTable(ta.value, DECK);
        for (const id in rows) T.setAssoc(DECK, id, rows[id].s, rows[id].why);
        save();
        toast(plural(Object.keys(rows).length, 'associazione scritta', 'associazioni scritte'));
        assoc();
      });
    ta.rows = 14;
    ta.placeholder = 'OP12-034 | P B | Perona, la P di fantasma che fa "Bu!"';
    ta.spellcheck = false;
    const read = () => {
      const r = T.parseTable(ta.value, DECK),
        n = Object.keys(r.rows).length,
        changed = Object.keys(r.rows).filter(
          (id) => T.soundOf(DECK, id) && T.soundOf(DECK, id) !== r.rows[id].s,
        ).length;
      ok.disabled = !n;
      note.textContent = !ta.value.trim()
        ? ''
        : 'Lette ' +
          n +
          ' carte su ' +
          Object.keys(DECK.cards).length +
          (changed
            ? ' · ' + plural(changed, 'suono cambia', 'suoni cambiano') + ' (le loro flashcard ripartono da capo)'
            : '') +
          (r.skipped
            ? ' · ' +
              plural(r.skipped, 'riga con un codice che non è nel mazzo', 'righe con un codice che non è nel mazzo')
            : '');
    };
    ta.oninput = read;
    read();
    const acts = mk('div', 'tacts');
    acts.append(btn('Annulla', '', assoc), ok);
    body.append(ta, note, acts);
    ta.focus();
  }

  // ---- 3. flashcard: le associazioni nei due versi, a ripetizione spaziata ----
  const GRADES = ['Non la sapevo', 'Bene', 'Facile'];
  function srs() {
    back.textContent = '‹ Indietro';
    const day = T.today(),
      all = T.flashcards(DECK),
      due = T.dueCards(DECK, day);
    if (!all.length) {
      view('srs', 'FLASHCARD', 'Prima servono le associazioni: le flashcard nascono da lì.', hub);
      body.append(btn('Vai alla conversione fonetica', 'primary', assoc));
      body.lastChild.focus();
      return;
    }
    if (due.length) {
      session(due, true);
      return;
    }
    const next = T.nextDue(DECK) - day;
    view(
      'srs',
      'A POSTO PER OGGI',
      'Prossimo ripasso ' +
        (next <= 1 ? 'domani' : 'tra ' + next + ' giorni') +
        ". Tornare prima non serve: è l'attesa che fissa il ricordo.",
      hub,
    );
    const acts = mk('div', 'tacts');
    acts.append(
      btn('Ripasso libero', '', () => session(all, false)),
      btn('Training puro ›', 'primary', levels),
    );
    body.append(acts, mk('p', 'tnote', 'Il ripasso libero ripassa tutte le flashcard senza spostare le scadenze.'));
    acts.lastChild.focus();
  }
  // counts = vale per le scadenze; nel ripasso libero si guarda e basta
  function session(keys, counts) {
    const queue = keys.slice().sort(() => Math.random() - 0.5),
      total = queue.length;
    let wrong = 0;
    function show() {
      if (!queue.length) {
        finish();
        return;
      }
      const key = queue[0],
        id = key.slice(0, -1),
        toSound = key.endsWith('>'),
        a = DECK.assoc[id];
      view(
        'srs',
        toSound ? 'CHE SUONO È?' : 'CHE CARTA È?',
        (counts ? '' : 'Ripasso libero · ') + plural(queue.length, 'flashcard rimasta', 'flashcard rimaste'),
        hub,
      );
      const face = mk('div', 'tflash ' + (toSound ? 'q-card' : 'q-sound')),
        ans = mk('div', 'tans');
      const flip = btn('Gira  ·  Spazio', 'primary', () => {
        face.classList.add('open');
        ans.append(
          mk('b', '', nameOf(id)),
          mk('span', '', a.why || 'Nessun motivo scritto: aggiungine uno, aiuta molto.'),
        );
        const acts = mk('div', 'tacts');
        GRADES.forEach((g, i) =>
          acts.append(btn(g + '  ·  ' + (i + 1), i === 1 ? 'primary' : '', () => answer(key, i))),
        );
        flip.replaceWith(acts);
        acts.children[1].focus();
        onKey = (e) => {
          if (e.key >= '1' && e.key <= '3') {
            e.preventDefault();
            answer(key, +e.key - 1);
          } else if (e.code === 'Space' || e.key === 'Enter') {
            e.preventDefault();
            answer(key, 1);
          }
        };
      });
      // il suono con la parola che lo fa sentire: "K — C dura · come in casa, chiave"
      const snd = mk('div', 'tsound');
      for (const k of T.sounds(a.s)) {
        const s = mk('div');
        s.append(mk('b', '', k), mk('small', '', T.soundName(k)));
        snd.append(s);
      }
      face.append(card(id), snd);
      body.append(face, ans, flip);
      flip.focus();
      onKey = (e) => {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          flip.click();
        }
      };
    }
    function answer(key, g) {
      queue.shift();
      if (counts) {
        T.grade(DECK, key, g, T.today());
        save();
      }
      // quella non saputa torna in fondo alla coda: si chiude solo quando le sai tutte
      if (g === 0) {
        wrong++;
        queue.push(key);
      }
      show();
    }
    function finish() {
      view(
        'srs',
        'FATTO',
        plural(total, 'flashcard ripassata', 'flashcard ripassate') +
          (wrong
            ? ' · ' +
              plural(
                wrong,
                'ripetizione in più per quelle che non sapevi',
                'ripetizioni in più per quelle che non sapevi',
              )
            : ' · tutte al primo colpo'),
        hub,
      );
      const acts = mk('div', 'tacts');
      acts.append(btn('Menu del trainer', '', hub), btn('Training puro ›', 'primary', levels));
      body.append(acts);
      acts.lastChild.focus();
      onKey = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          acts.lastChild.click();
        }
      };
    }
    show();
  }

  // ---- come funziona: il metodo spiegato a chi non l'ha mai visto ----
  const TUTORIAL = [
    [
      'Il problema',
      'Ogni searchata manda in fondo al mazzo 4 o 5 carte, in ordine. A fine partita quelle carte tornano su, e chi ricorda l\'ordine sa cosa pescherà. Ma ricordare venti carte "a forza", mentre giochi, è durissimo.',
    ],
    [
      "L'idea: le carte diventano consonanti",
      'Dai a ogni carta unica del mazzo un suono consonantico. A quel punto una searchata non è più una fila di carte ma una fila di consonanti, e con le consonanti si fanno parole: basta metterci le vocali che vuoi.',
    ],
    [
      'Un esempio',
      'Vanno sotto quattro carte che per te sono P, L, K, M. Ci metti le vocali: "PoLLo CoMò". Un pollo seduto su un comò non te lo scordi più. Cinque carte T, G, L, K, V diventano "TeGoLa CHiaVe": cinque carte in due parole concrete.',
    ],
    [
      'Conta il suono, non la lettera',
      'La C di "casa" e la C di "cena" sono la stessa lettera ma due suoni diversi, quindi due carte diverse. Per questo i suoni non li scrivi: li scegli da una tavolozza, ognuno con la sua sigla e una parola che lo fa sentire. K è la C dura (casa, chiave), CI la C dolce (cena, ciao), G la G dura (gatto), GI la G dolce (gelato), SC è "sci", GN è "gnomo", GL è "aglio". Le doppie contano una volta sola (poLLo = una L). Le vocali sono libere, non valgono niente: servono solo a fare la parola.',
    ],
    [
      'Uno o due suoni per carta',
      "Nella tavolozza i suoni sono raggruppati per famiglie, cioè suoni che si fanno quasi uguali in bocca: P B · T D · F V · K G · CI GI · S Z SC · M N GN · L R GL. Se dai a una carta due suoni, prendili dalla stessa famiglia: così per quella carta puoi usare l'uno o l'altro e trovare parole è più facile. Con tante carte uniche le coppie non bastano: allora le spezzi (M a una carta, N a un'altra). L'importante è che nessun suono stia su due carte: quelli già presi la tavolozza te li mostra sbiaditi.",
    ],
    [
      'Il motivo è metà del lavoro',
      'Ogni associazione deve avere un perché: Trafalgar Law è T oppure L, Bonney è B. Quando ci sono più carte con lo stesso personaggio usa come le chiami tu: la Bonney che cerca, la Bonney che blocca, la Bonney "mestolo" perché nell\'immagine ha il mestolo. Più il motivo è visivo e sciocco, meglio resta.',
    ],
    [
      "Fatti aiutare da un'AI",
      'In "Conversione fonetica" c\'è il pulsante "Copia il prompt per l\'AI": contiene le regole e la lista del tuo mazzo. Incollalo in ChatGPT, Claude o quello che usi, e decidete insieme suoni e motivi. Alla fine l\'AI scrive una tabella: la incolli qui con "Incolla la tabella dell\'AI" e le righe si riempiono da sole. Poi puoi ritoccarle a mano.',
    ],
    [
      'Il percorso',
      "1. Scegli il mazzo.  2. Dai un suono e un motivo a ogni carta.  3. Fissa le associazioni con le flashcard: pochi minuti al giorno, l'app ti ripropone ogni carta poco prima che tu la dimentichi.  4. Training puro: guardi le searchate, ti fai le parole, ricostruisci.  5. In partita: lo stesso sui tuoi replay veri.",
    ],
    [
      'Come si fanno le parole in fretta',
      "Una parola ogni due o tre carte, concreta e che si possa vedere (un oggetto, un animale, un posto). Collega le parole di una searchata in una scenetta, e le searchate una dopo l'altra in una storia. All'inizio è lento: è normale. Dopo qualche giorno di flashcard il suono di ogni carta ti viene da solo.",
    ],
  ];
  function tutorial() {
    view('tutorial', 'COME FUNZIONA', 'Il metodo in due minuti', hub);
    back.textContent = '‹ Indietro';
    const art = mk('article', 'ttut');
    for (const [h, p] of TUTORIAL) art.append(mk('h3', '', h), mk('p', '', p));
    const go = btn(DECK ? 'Ho capito' : 'Ho capito: scelgo il mazzo', 'primary', DECK ? hub : deckPick);
    body.append(art, go);
    go.focus();
    if (!store.tutorial) {
      store.tutorial = 1;
      save();
    }
    onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        go.click();
      }
    };
  }

  // ---- training puro: scelta del livello ----
  function levels() {
    view(
      'levels',
      'TRAINING PURO',
      DECK.name + ' · Un livello si supera solo ricostruendo tutto giusto. Tre perfette di fila e diventa consolidato.',
      hub,
    );
    back.textContent = '‹ Indietro';
    const grid = mk('div', 'tlevels');
    T.LEVELS.forEach((L, i) => {
      const n = i + 1,
        S = T.statOf(DECK, n),
        locked = n > DECK.unlocked;
      const b = btn('', locked ? 'lock' : T.mastered(DECK, n) ? 'star' : T.passed(DECK, n) ? 'ok' : '', () => {
        if (!locked) start(n);
      });
      b.disabled = locked;
      b.append(
        mk('b', '', n === T.LEVELS.length ? 'BOSS' : String(n)),
        mk('span', '', L.blocks + ' searchate · ' + L.secs + " s l'una"),
      );
      b.append(
        mk(
          'small',
          '',
          locked
            ? '🔒 supera il livello ' + (n - 1)
            : T.mastered(DECK, n)
              ? '⭐ consolidato · ' + secs(S.bestMs)
              : T.passed(DECK, n)
                ? '✓ superato · serie ' + S.streak + ' / ' + T.MASTER
                : S.runs
                  ? 'migliore ' + S.bestPct + '%'
                  : 'da provare',
        ),
      );
      grid.append(b);
    });
    body.append(grid);
    const next = grid.children[Math.min(DECK.unlocked, T.LEVELS.length) - 1];
    if (next) next.focus();
  }

  // ---- training puro: i blocchi, uno alla volta ----
  function start(n) {
    const L = T.LEVELS[n - 1];
    ctx = { mode: 'level', n, secs: L.secs, blocks: T.deal(DECK, L.blocks), k: 0, exit: levels };
    view(
      'count',
      'LIVELLO ' + (n === T.LEVELS.length ? 'BOSS' : n),
      L.blocks + ' searchate, ' + L.secs + " secondi l'una",
      levels,
    );
    const num = mk('div', 'tcount', '3');
    body.append(num);
    let c = 3;
    const tick = () => {
      c--;
      if (c) {
        num.textContent = c;
        timer = setTimeout(tick, 700);
      } else showBlock();
    };
    timer = setTimeout(tick, 700);
  }
  function showBlock() {
    const b = ctx.blocks[ctx.k];
    view(
      'block',
      'SEARCHATA ' + (ctx.k + 1) + ' DI ' + ctx.blocks.length,
      "Vanno in fondo al mazzo in quest'ordine, da sinistra a destra",
      ctx.exit,
    );
    const row = mk('div', 'tshow');
    b.forEach((id, i) => {
      const c = card(id);
      c.style.setProperty('--i', i);
      c.append(mk('i', '', i + 1));
      row.append(c);
    });
    const bar = mk('div', 'tbar'),
      fill = mk('i');
    fill.style.animationDuration = ctx.secs + 's';
    bar.append(fill);
    const next = () => {
      ctx.k++;
      if (ctx.k < ctx.blocks.length) showBlock();
      else recall();
    };
    body.append(row, bar, btn('Fatto  ·  Spazio', 'primary', next));
    timer = setTimeout(next, ctx.secs * 1000);
    onKey = (e) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    };
  }

  // ---- ricostruzione: le carte viste, rimescolate, da rimettere nei posti ----
  function recall() {
    const want = ctx.blocks.flat(),
      ans = want.map(() => null),
      t0 = performance.now();
    let sel = -1;
    view(
      'recall',
      'RICOSTRUISCI IL FONDO',
      'Scegli una carta e va nel primo posto libero. Clicca un posto per svuotarlo o per sceglierlo.',
      ctx.exit,
    );
    const slotsEl = mk('div', 'tslots'),
      poolEl = mk('div', 'tpool');
    const ok = btn('Conferma  ·  Invio', 'primary', () => {
      if (ans.every(Boolean)) review(ans, performance.now() - t0);
    });
    const clear = btn('Svuota', '', () => {
      ans.fill(null);
      sel = -1;
      draw();
    });
    const firstFree = () => ans.indexOf(null);
    function put(id) {
      const i = sel >= 0 ? sel : firstFree();
      if (i < 0) return;
      ans[i] = id;
      sel = -1;
      draw();
    }
    function draw() {
      slotsEl.replaceChildren();
      poolEl.replaceChildren();
      let i = 0;
      const target = sel >= 0 ? sel : firstFree();
      ctx.blocks.forEach((b, bi) => {
        const g = mk('div', 'tgroup'),
          row = mk('div', 'trow');
        g.append(mk('h3', '', bi + 1 + 'ª searchata'), row);
        b.forEach(() => {
          const k = i++,
            s = mk('div', 'tslot' + (k === target ? ' cur' : ''));
          if (ans[k]) s.append(card(ans[k]));
          else s.append(mk('i', '', k + 1));
          s.onclick = () => {
            if (ans[k]) {
              ans[k] = null;
              sel = k;
            } else sel = sel === k ? -1 : k;
            draw();
          };
          row.append(s);
        });
        slotsEl.append(g);
      });
      // le copie uguali stanno impilate: quante ne restano da mettere
      const left = {};
      for (const id of want) left[id] = (left[id] || 0) + 1;
      for (const id of ans) if (id) left[id]--;
      for (const id of Object.keys(left).sort()) {
        const c = card(id, left[id] ? '' : 'used');
        if (left[id] > 1) c.append(mk('b', '', '×' + left[id]));
        if (left[id]) c.onclick = () => put(id);
        poolEl.append(c);
      }
      ok.disabled = !ans.every(Boolean);
    }
    const acts = mk('div', 'tacts');
    acts.append(clear, ok);
    body.append(slotsEl, mk('h3', 'tlabel', 'Carte viste'), poolEl, acts);
    draw();
    onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ok.click();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        const k = ans.findLastIndex(Boolean);
        if (k >= 0) {
          ans[k] = null;
          sel = -1;
          draw();
        }
      }
    };
  }

  // ---- revisione: la tua risposta contro l'ordine giusto ----
  function review(ans, ms) {
    const res = T.score(ctx.blocks, ans),
      lvl = ctx.mode === 'level';
    let L = null,
      opened = false;
    if (lvl) {
      const before = DECK.unlocked;
      L = T.record(DECK, ctx.n, res, ms);
      opened = DECK.unlocked > before;
      save();
    }
    view(
      'review',
      res.perfect ? 'PERFETTO' : res.right + ' SU ' + res.total,
      res.pct +
        '% al posto giusto · ' +
        secs(ms) +
        ' per ricostruire' +
        (lvl && res.perfect ? ' · serie ' + L.streak + ' / ' + T.MASTER : ''),
      ctx.exit,
    );
    el.dataset.res = res.perfect ? 'ok' : 'no';
    const slotsEl = mk('div', 'tslots');
    let i = 0;
    ctx.blocks.forEach((b, bi) => {
      const g = mk('div', 'tgroup'),
        row = mk('div', 'trow'),
        pb = res.perBlock[bi];
      g.append(
        mk('h3', pb.right === pb.total ? 'ok' : 'no', bi + 1 + 'ª searchata · ' + pb.right + ' / ' + pb.total),
        row,
      );
      b.forEach((id) => {
        const k = i++,
          s = mk('div', 'tslot ' + (res.marks[k] ? 'ok' : 'no'));
        s.append(card(ans[k]));
        if (!res.marks[k]) {
          const r = card(id, 'right');
          r.title = 'Qui andava ' + nameOf(id);
          s.append(r);
        }
        row.append(s);
      });
      slotsEl.append(g);
    });
    const acts = mk('div', 'tacts');
    if (lvl) {
      const again = btn(
        res.perfect ? 'Ancora' : 'Riprova',
        res.perfect && ctx.n < T.LEVELS.length ? '' : 'primary',
        () => start(ctx.n),
      );
      acts.append(btn('Livelli', '', levels), again);
      if (res.perfect && ctx.n < T.LEVELS.length)
        acts.append(
          btn('Livello ' + (ctx.n + 1 === T.LEVELS.length ? 'Boss' : ctx.n + 1) + ' ›', 'primary', () =>
            start(ctx.n + 1),
          ),
        );
      if (opened)
        body.append(mk('p', 'tnews', 'Livello ' + (ctx.n + 1 === T.LEVELS.length ? 'Boss' : ctx.n + 1) + ' sbloccato'));
      else if (res.perfect && L.streak === T.MASTER) body.append(mk('p', 'tnews', '⭐ Livello consolidato'));
    } else acts.append(btn('Torna al replay', 'primary', ctx.exit));
    body.append(
      slotsEl,
      mk('p', 'tnote', res.perfect ? '' : 'Bordo rosso: carta sbagliata. Sotto, in piccolo, quella che andava lì.'),
      acts,
    );
    acts.lastChild.focus();
    onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        acts.lastChild.click();
      }
    };
  }

  // ---- in partita: scelta del replay ----
  function games() {
    view(
      'games',
      'IN PARTITA',
      'Il replay si apre con il pannello "Fondo del mazzo" a destra, coperto: B lo scopre.',
      hub,
    );
    back.textContent = '‹ Indietro';
    const logs = app.logs(),
      list = mk('ul', 'tgames');
    logs.forEach((lf, i) => {
      const s = Library.sumOf(lf);
      if (!s || !s.me.leader || s.me.leader.id !== DECK.leader) return;
      const li = mk('li'),
        opp = s.opp.leader ? nameOf(s.opp.leader.id) : '?';
      const r = { w: 'V', l: 'S', o: '–' }[Core.outcome(s)];
      li.append(
        mk('span', 'd', Library.dateOf(lf)),
        mk('b', '', 'vs ' + opp),
        mk('span', '', s.turns + ' turni'),
        mk('span', 'r ' + r, r),
      );
      li.onclick = () => {
        panelOn = true;
        shown = false;
        close();
        app.openLog(i);
      };
      list.append(li);
    });
    if (list.children.length) body.append(list);
    else
      body.append(
        mk(
          'p',
          'tnote',
          logs.length
            ? 'Nessuna partita con ' +
                DECK.name +
                ' nella cartella dei log (o la raccolta le sta ancora leggendo: riprova tra un attimo).'
            : 'Scegli prima la cartella dei log in Impostazioni.',
        ),
      );
  }

  // ---- pannello nel replay: il fondo del mazzo registrato fino alla mossa corrente ----
  const panel = mk('section');
  panel.id = 'tbottom';
  panel.hidden = true;
  const pTitle = mk('h1'),
    pEye = btn('👁', '', () => toggleBottom()),
    pQuiz = btn('Mettimi alla prova', 'primary', () => quiz()),
    pBody = mk('div', 'pb');
  pEye.title = 'Mostra o copri le carte (B)';
  const pHead = mk('header');
  pHead.append(pTitle, pEye);
  panel.append(pHead, pBody, pQuiz);
  $('#right').append(panel);
  let panelOn = false,
    shown = false,
    bottom = [];
  function drawPanel() {
    panel.hidden = !(panelOn && lab());
    $('#right').classList.toggle('hasbottom', !panel.hidden);
    if (panel.hidden) return;
    pTitle.textContent = 'Fondo del mazzo · ' + bottom.length;
    pEye.classList.toggle('on', shown);
    pQuiz.disabled = !bottom.length;
    pBody.replaceChildren();
    if (!bottom.length) {
      pBody.append(mk('p', '', 'Ancora nessuna carta mandata sotto.'));
      return;
    }
    T.groups(bottom).forEach((g, i) => {
      const row = mk('div', 'pr');
      row.append(mk('i', '', i + 1));
      for (const id of g) row.append(shown ? card(id) : mk('div', 'tcard cover'));
      pBody.append(row);
    });
  }
  function onStep(S) {
    bottom = S ? S.players[1].bottom : [];
    drawPanel();
  }
  function toggleBottom() {
    if (!panelOn) return;
    shown = !shown;
    drawPanel();
  }
  function setPanel(v) {
    panelOn = v;
    shown = false;
    onStep(app.state());
  }
  function quiz() {
    if (!bottom.length) return;
    app.pause();
    shown = false;
    drawPanel();
    ctx = { mode: 'quiz', blocks: T.groups(bottom), exit: close };
    el.classList.remove('hidden');
    back.textContent = '‹ Replay';
    recall();
  }

  function open() {
    el.classList.remove('hidden');
    if (store.tutorial) hub();
    else tutorial();
  }
  function close() {
    clearTimeout(timer);
    timer = null;
    onKey = null;
    ctx = null;
    screen = '';
    el.classList.add('hidden');
    if (Home.isOpen()) Home.rebuild();
  }
  const isOpen = () => !el.classList.contains('hidden');
  function key(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (onBack) onBack();
      return;
    }
    if (onKey) onKey(e);
  }

  Home.rebuild();
  if (force === 'panel') {
    panelOn = shown = true;
  } else if (force != null) {
    if (!DECK) use(T.example());
    el.classList.remove('hidden');
    hub();
    if (force === 'levels') levels();
    else if (force === 'deck') deckPick();
    else if (force === 'assoc') assoc();
    else if (force === 'cards') srs();
    else if (force === 'tutorial') tutorial();
    else if (force === 'block' || force === 'recall' || force === 'review') {
      ctx = { mode: 'level', n: 7, secs: 8, blocks: T.deal(DECK, 4), k: 0, exit: levels };
      if (force === 'block') showBlock();
      else if (force === 'recall') recall();
      else
        review(
          ctx.blocks.flat().map((id, i, a) => (i % 6 === 2 ? a[i + 1] || id : id)),
          41300,
        );
    }
  }
  return { open, close, isOpen, key, onStep, toggleBottom, setPanel, panelOn: () => panelOn, lab, quiz };
}
