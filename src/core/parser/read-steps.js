// Prima passata del parser: legge il log riga per riga e produce la lista grezza degli step.
//
// Il lavoro difficile è abbinare le mosse (righe RZ1) alle righe di testo:
//   - una mossa che arriva dopo una riga di testo va di norma a quello step (attachMove);
//   - se arriva prima della riga a cui si riferisce, lo step nuovo se la riprende dalla coda del precedente (lookAhead);
//   - durante un combattimento le mosse restano "parcheggiate" finché non arriva l'esito (colpito, fallito, distrutto),
//     perché il log le scrive prima del risultato ma sul tavolo devono vedersi dopo.
import { MOVE, CHK, PLY, ACTOR, TAGS, RICH_REF } from '../log-format.js';
import { refs, clean, stripName } from '../text.js';
import { lastGame } from '../last-game.js';
import { makeStep } from './step.js';
import { owns, wants } from './ownership.js';

/**
 * @param {string} text  il testo intero del log
 * @returns {{ players: object, nameMap: object, steps: object[], moveCount: number, warnings: string[] }}
 */
export function readSteps(text) {
  const lines = text.split(/\r?\n/);
  const players = { 1: { name: 'You', leader: null }, 2: { name: 'Opponent', leader: null } };
  const nameMap = {};
  const steps = [];
  let cur = null;
  let pendingName = null; // nome privato in attesa di mapping tramite RZ1
  let activePlayer = 0,
    turn = 0,
    turnEnded = true;
  let inCombat = false;
  let moveCount = 0;
  let run = { key: null, rests: 0 }; // attivazione in corso: righe consecutive con la stessa sorgente (serve a numerare i suoi "Rest")
  const warnings = [];

  // ogni step nasce con il turno e il giocatore di turno di questo momento
  const newStep = (kind, player, text, extra) =>
    makeStep(kind, player, text, Object.assign({ turn, active: activePlayer }, extra || {}));
  const pushStep = (s) => {
    steps.push(s);
    cur = s;
    return s;
  };

  // mosse in attesa nel combattimento in corso (parcheggiate sull'attacco e su un eventuale "Blocks"), nell'ordine del log
  const takeParked = () => {
    const held = [];
    let k = steps.length - 1;
    while (k >= 0 && steps[k].kind !== 'attack') k--;
    if (k >= 0)
      for (; k < steps.length; k++) {
        held.push(...steps[k].parked);
        steps[k].parked = [];
      }
    return held;
  };

  const attachMove = (mv) => {
    if (!cur || (cur.kind === 'synthetic' && cur.key !== mv.player + ':' + mv.fz + '>' + mv.tz)) {
      if ((cur && cur.kind === 'synthetic') || !cur) {
        const key = mv.player + ':' + mv.fz + '>' + mv.tz;
        if (!cur || cur.key !== key) pushStep(newStep('synthetic', mv.player, '', { key, delay: 0.3, line: mv.line }));
      }
    }
    // dopo "Blocks" il log mette spesso subito la mossa del blocker che va nel trash, prima ancora della riga "vs": aspetta anche lei l'esito
    if ((cur.kind === 'attack' || cur.kind === 'block') && inCombat) {
      cur.parked.push(mv);
      return;
    }
    // in combattimento, se dopo l'attacco è già passata una riga di testo, le mosse rimaste in attesa vanno applicate prima di questa: l'ordine del log conta (gli indici in mano si spostano)
    if (inCombat) cur.moves.push(...takeParked());
    mv.prot = owns(cur, mv);
    cur.moves.push(mv);
  };

  // sposta in avanti (nel nuovo step) le mosse in coda non possedute dal precedente, se il nuovo step le "vuole"
  const lookAhead = (s) => {
    if (!cur) return;
    const pull = (arr) => {
      const taken = [];
      while (arr.length) {
        const mv = arr[arr.length - 1];
        if (mv.prot || !wants(s, mv)) break;
        taken.unshift(arr.pop());
      }
      return taken;
    };
    let taken = pull(cur.parked.length ? cur.parked : cur.moves);
    for (const mv of taken) {
      mv.prot = owns(s, mv);
      s.moves.push(mv);
    }
  };

  const game = lastGame(lines);
  for (let li = game.from; li < game.to; li++) {
    const raw = lines[li].replace(RICH_REF, '$1');
    if (!raw.trim()) continue;
    let m;
    // "RZ1|PLY|1|Nome#1234|OP14-020": chi è il giocatore 1 e chi il 2, prima ancora della prima pescata
    if ((m = PLY.exec(raw))) {
      const name = stripName(m[2]);
      if (!(name in nameMap)) nameMap[name] = +m[1];
      continue;
    }
    if ((m = MOVE.exec(raw))) {
      const mv = {
        seq: +m[1],
        player: +m[2],
        id: m[3],
        fz: +m[4],
        fi: +m[5],
        tz: +m[6],
        ti: +m[7],
        f1: +m[8],
        f2: +m[9],
        f3: +m[10],
        chk: null,
        prot: false,
        line: li + 1,
      };
      moveCount++;
      if (pendingName && !(pendingName in nameMap)) {
        nameMap[pendingName] = mv.player;
        players[mv.player].name = pendingName;
      }
      pendingName = null;
      attachMove(mv);
      continue;
    }
    if ((m = CHK.exec(raw))) {
      const c = m[3].split('|').map(Number);
      const chk = {
        seq: +m[1],
        player: +m[2],
        deck: c[0],
        hand: c[1],
        chars: c[2],
        life: c[3],
        donDeck: c[4],
        donPool: c[5],
        trash: c[6],
        stage: c[7],
        donAttached: c[9],
      };
      const target = cur && (cur.parked.length ? cur.parked[cur.parked.length - 1] : cur.moves[cur.moves.length - 1]);
      if (target && target.seq === chk.seq) target.chk = chk;
      continue;
    }

    // --------- riga testuale ---------
    let player = 0,
      body = raw,
      actor = null;
    if ((m = ACTOR.exec(raw))) {
      actor = stripName(m[1]);
      body = m[2];
      if (actor === 'You') player = 1;
      else if (actor === 'Opponent') player = 2;
      else {
        player = nameMap[actor] || 0;
        if (player) players[player].name = actor;
      }
    }
    const text = clean(body);
    const cards = refs(body);

    // drop / assertions
    if (
      /^(Waiting for a Connection|Attempting to connect|.+ Has Connected$|Version is|Opponent is Ready for Rematch|Will select turn order|Downloaded the Combat Log|RZ1\|)/.test(
        clean(body),
      ) ||
      /Downloaded the Combat Log/.test(raw)
    )
      continue;
    if (actor && /^(Hand|Board|Trash|Life|Hand before Mulligan|Hand after Mulligan): /.test(body)) {
      const kind = body.split(':')[0];
      const val = body.slice(kind.length + 1).trim();
      if (cur) cur.assertions.push({ player: player || null, actor, kind, val, line: li + 1 });
      continue;
    }
    if (actor && /^Drew card from deck: /.test(body)) {
      if (!(actor in nameMap) && player === 0) pendingName = actor;
      const s = newStep('draw', player, text, { cards, delay: 0.6, line: li + 1, actor });
      lookAhead(s);
      pushStep(s);
      continue;
    }
    if (actor && !player) {
      player = 0;
    }

    let s = null;
    if (/^Leader is /.test(body)) {
      if (player) players[player].leader = cards[0];
      s = newStep('leader', player, text, { cards, delay: 0.5 });
    } else if (/^Chose to go /.test(body)) {
      s = newStep('info', player, text, { delay: 0.6 });
    } else if (/^Draw \d+ Card$/.test(body) || (/^Draw \d+ Don$/.test(body) && activePlayer === 0)) {
      const isTurn = /Card$/.test(body) ? turnEnded || player !== activePlayer : true;
      if (isTurn) {
        turn++;
        activePlayer = player;
        turnEnded = false;
        s = newStep('turnStart', player, text, { delay: 0.6, turn, active: player });
      } else s = newStep('info', player, text, { delay: 0.5 });
      if (/Don$/.test(body)) s.kind2 = 'drawDon';
    } else if (/^Draw \d+ Don$/.test(body)) {
      s = newStep('drawDon', player, text, { delay: 0.6 });
    } else if (/^Deploy /.test(body)) {
      s = newStep('deploy', player, text, { cards, delay: 1 });
    } else if (/^Trash /.test(body) && cards.length) {
      s = newStep('trash', player, text, { cards, delay: 0.6 });
    } else if (/^Mulligan$/.test(body)) {
      s = newStep('mulligan', player, text, { delay: 0.6 });
    } else if (/^End Turn$/.test(body)) {
      turnEnded = true;
      s = newStep('endTurn', player, text, { delay: 0.8 });
    } else if (/ attacking /.test(body) && cards.length >= 2) {
      s = newStep('attack', player, text, { cards, delay: 1 });
    } else if (/ Blocks$/.test(body) && cards.length === 1) {
      s = newStep('block', player, text, { cards, delay: 1 });
    } else if (!actor && /\]\[\d+\] vs /.test(raw)) {
      const pm = /\[(\d+)\] vs .*\[(\d+)\]\s*$/.exec(raw);
      s = newStep('vs', 0, text, { cards, delay: 1.3, atk: pm ? +pm[1] : null, def: pm ? +pm[2] : null });
    } else if (!actor && / hit for \d+ damage/.test(body)) {
      s = newStep('hit', 0, text, { cards, delay: 1.2, dmg: +/hit for (\d+)/.exec(body)[1] });
    } else if (!actor && /^Attack Fails/.test(body)) {
      s = newStep('fail', 0, text, { delay: 1.1 });
    } else if (!actor && cards.length && / cost restored$/.test(body)) {
      // "Enel cost restored": è finito un cambio di costo (vedi gli effetti 'cost')
      s = newStep('costRestored', 0, text, { cards, delay: 0.5 });
    } else if (/ Destroyed$/.test(body) && !/: /.test(body)) {
      s = newStep('destroyed', player, text, { cards, delay: 1.1 });
    } else if (/^Discard .* for Counter \d+/.test(body)) {
      s = newStep('counter', player, text, { cards, target: cards[0], delay: 1 });
    } else if (/^Attach \d+ Don to /.test(body)) {
      s = newStep('attach', player, text, { cards, delay: 1 });
    } else if (/^Placing Cards on Bottom of Deck/.test(body)) {
      s = newStep('bottom', player, text, { delay: 0.6 });
    } else if (/^(Concedes!|Quits!)/.test(body) || /^GameOver/.test(raw) || /Has Disconnected/.test(raw)) {
      s = newStep('phase', player, text, { delay: 1 });
    } else if (/^<b><size/.test(body) || /^<b>/.test(body)) {
      s = newStep('chat', player, text, { delay: 0.8 });
    } else if (cards.length && /^.+?: /.test(body) && body.indexOf(cards[0].raw) < body.indexOf(': ')) {
      // effetto "Sorgente: azione"
      const src = cards[0];
      const rest = body.slice(body.indexOf(': ') + 2).replace(TAGS, '');
      const tcards = cards.slice(1);
      let sub = 'effect',
        target = tcards[0] || null,
        delay = 1;
      const extra = {};
      if (/^Rest \d+ Don/.test(rest) || /^Rest Don \[/.test(rest)) {
        s = newStep('restDon', player, text, { cards, src, delay: 0.7 });
      } else if (/^Activate \d+ Don/.test(rest)) {
        s = newStep('activateDon', player, text, { cards, src, delay: 0.7 });
      } else if (/^Reveal and Draw /.test(rest)) {
        s = newStep('reveal', player, text, { cards, src, target, delay: 1 });
      } else if (/^Rest /.test(rest)) {
        sub = 'rest';
      } else if (/^Set .* to Active/.test(rest)) {
        sub = 'active';
      } else if (/^Return .* to Hand/.test(rest)) {
        sub = 'return';
      } else if (/^Trash /.test(rest)) {
        sub = 'trash';
      } else if (/^Destroy /.test(rest)) {
        sub = 'destroy';
      } else if (/^Deploy /.test(rest)) {
        s = newStep('deploy', player, text, { cards: tcards, src, delay: 1 });
      } else if (/^Buff /.test(rest)) {
        // "Buff X -2000" vale fino a fine turno, "Buff X 2000 for the Combat" fino a fine combattimento; "Buff Self" è la sorgente stessa
        sub = 'buff';
        delay = 0.8;
        const bm = /(-?\d+)( for the Combat)?$/.exec(rest);
        if (bm) {
          extra.pw = +bm[1];
          extra.until = bm[2] ? 'combat' : 'turn';
        }
        if (/^Buff Self\b/.test(rest)) target = src;
      } else if (/^Set .* Base Power to -?\d+$/.test(rest)) {
        // "Charlotte Linlin: Set Shanks Base Power to -12000": il numero è la variazione (Shanks 12000 → 0), non il valore finale
        sub = 'buff';
        delay = 0.8;
        extra.pw = +/(-?\d+)$/.exec(rest)[1];
        extra.until = 'turn';
      } else if (tcards.length && / Cost [-+]?\d+( until Opponent's Turn End)?$/.test(rest)) {
        // "Rob Lucci: Mr. 1 Cost -1" fino a fine turno; "Varie: Enel Cost 2 until Opponent's Turn End" fino a fine del turno avversario.
        // Quando finisce il log scrive "Enel cost restored".
        const cm = / Cost ([-+]?\d+)( until Opponent's Turn End)?$/.exec(rest);
        sub = 'cost';
        delay = 0.8;
        extra.cost = +cm[1];
        extra.until = cm[2] ? 'oppTurn' : 'turn';
      } else if (/^Activate Counter/.test(rest)) {
        sub = 'counterOn';
        delay = 0.7;
      } else if (/^Draw \d+ Card/.test(rest)) {
        sub = 'drawFx';
        delay = 0.5;
        target = null;
      } else if (/^Can't play/.test(rest)) {
        sub = 'note';
        delay = 0.5;
        target = null;
      } else if (/ will not Activate during next Refresh/.test(rest)) {
        sub = 'freeze';
        delay = 0.8;
      } // Electrical Luna, Lightning Dragon, "I Know You're Strong...", Law & Bepo; Jewelry Bonney sul DON
      else {
        sub = 'other';
      }
      if (!s) s = newStep('effect', player, text, { cards, src, target, sub, delay, ...extra });
      const key = player + ':' + src.id;
      if (run.key !== key) run = { key, rests: 0 };
      if (s.sub === 'rest') s.nth = run.rests++;
    } else {
      s = newStep('unknown', player, text, { cards, delay: 0.6 });
    }

    if (!s.src) run.key = null;
    s.line = li + 1;
    s.actor = actor;
    // combattimento: flush del parcheggio sugli step di risoluzione o su step che chiudono la finestra
    if (inCombat && cur) {
      const resolves =
        s.kind === 'hit' ||
        s.kind === 'fail' ||
        s.kind === 'destroyed' ||
        s.kind === 'attack' ||
        s.kind === 'endTurn' ||
        s.kind === 'turnStart' ||
        s.kind === 'phase';
      if (resolves) {
        s.moves.push(...takeParked());
        if (s.kind !== 'attack') inCombat = false;
      }
    }
    if (s.kind === 'attack') inCombat = true;
    lookAhead(s);
    pushStep(s);
  }
  // flush finale
  for (const st of steps)
    if (st.parked.length) {
      st.moves.push(...st.parked);
      st.parked = [];
    }
  // log con i nomi al posto di [You]/[Opponent]: le righe "Leader is" arrivano prima che si sappia chi è chi
  for (const st of steps)
    if (st.kind === 'leader' && !st.player && st.actor in nameMap) {
      st.player = nameMap[st.actor];
      if (!players[st.player].leader) players[st.player].leader = st.cards[0];
    }
  return { players, nameMap, steps, moveCount, warnings };
}
