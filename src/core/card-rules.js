// Regole per singola carta: quello che il log non dice e che il motore deve sapere per non sbagliare lato.

// ---------------- REGOLE PER CARTA ----------------
// Qui sta solo quello che il log non dice: una riga per carta, con il motivo. Ogni regola ha il suo test in test/core.test.mjs.
//   rest: 'own' | 'opp' → "Sorgente: Rest Y" non dice da che lato sta Y: own = una carta di chi gioca (di solito un costo), opp = una dell'avversario.
//         Un elenco vale per i riposi di una stessa attivazione, in ordine: ['own', 'own', 'opp'] = i primi due propri, dal terzo in poi avversari.
// Senza regola vale il default: leader e auto-riferimento (X: Rest X) → lato proprio, tutto il resto → lato avversario.
// Quando il default deve scegliere tra due carte uguali, una per lato, buildSnapshots lo segnala nei dubbi: è il segno che qui manca una riga.
// Quello che il log dice da solo (per esempio una carta che entra riposata, flag f3 della mossa) non va messo qui.
export const CARD_RULES = {
  'ST32-001': { rest: 'own' }, // Kin'emon (ST32)
  'OP01-055': { rest: 'own' }, // You Can Be My Samurai!!!: riposa due personaggi di chi la gioca
  'OP14-020': { rest: 'own' }, // Dracule Mihawk (leader): riposa una propria carta per riattivare i DON
  'OP14-038': { rest: ['own', 'own', 'opp'] }, // I Never Bother to Remember the Faces of Trash: riposa due propri personaggi, pesca, poi ne riposa uno avversario
  'OP17-022': { rest: 'opp' }, // Shanks (OP17)
  'OP17-031': { rest: 'opp' }, // Yasopp: all'ingresso riposa un personaggio avversario, anche un altro Yasopp
};
export const ruleOf = (card, k) => (card && CARD_RULES[card.id] && CARD_RULES[card.id][k]) || null;

// ---------------- EFFETTI CONTINUI ----------------
// Bonus e malus che valgono finché una condizione è vera: il log non li scrive mai, li ricalcola il motore dopo ogni step.
// Testi dalla lista ufficiale Bandai (en.onepiece-cardgame.com). Ogni voce: aura(ctx) → elenco di { card, pw } o { card, cost }.
//   ctx = { state, me: la carta con l'effetto, P / O: il suo giocatore e l'avversario, mine: P è di turno,
//           meta(id) → [nome, costo, potenza, …] stampati, cost(card) → costo adesso, anyChar(fn) → c'è un personaggio (di chiunque) che… }
// Se un effetto manca o è sbagliato lo dicono i dubbi: la riga "A[8000] vs B[9000]" del log non torna con la potenza calcolata.
const self = (ctx, n) => [{ card: ctx.me, ...n }];
const when = (cond, list) => (cond ? list : []);
const ifCost12 = (ctx) => ctx.anyChar((c) => ctx.cost(c) >= 12);
const oppChars = (ctx, n) => ctx.O.chars.map((card) => ({ card, ...n }));
const attached = (P) => [P.leader, ...P.chars].reduce((n, c) => n + c.don, 0);
// Leader con attributo <Slash>: la tabella delle carte non ha l'attributo, questi sono quelli visti nei log (Mihawk +1000 sempre presente contro di loro)
const SLASH_LEADERS = new Set(['OP14-020', 'OP17-039']);
// [Trigger] con potenza stampata 4000, per Charlotte Linlin OP17-112: solo quelli verificati sul testo ufficiale
const BIG_MOM_TRIGGER_4000 = new Set(['OP17-102', 'OP17-103', 'OP17-106', 'OP17-107', 'OP17-109', 'OP17-114']);

export const AURAS = {
  'OP14-020': (ctx) => when(SLASH_LEADERS.has(ctx.O.leader.id), self(ctx, { pw: 1000 })), // Dracule Mihawk (leader): +1000 se il leader avversario è <Slash>
  'OP17-089': (ctx) => self(ctx, { cost: 12 }), // Jaguar.D.Saul: "This Character gains +12 cost."
  'OP17-119': (ctx) => [...self(ctx, { cost: 12 }), ...when(!ctx.mine, self(ctx, { pw: 3000 }))], // Loki: +12 costo; +3000 nel turno avversario
  'OP15-088': (ctx) => self(ctx, { cost: 6 }), // Pirates Docking Six: +6 costo
  'OP17-095': (ctx) => when(ifCost12(ctx), self(ctx, { pw: 3000 })), // Roronoa Zoro: +3000 se c'è un personaggio di costo 12 o più (di chiunque)
  'OP17-087': (ctx) => when(ifCost12(ctx), self(ctx, { pw: 3000 })), // Nico Robin: come Zoro
  'OP17-080': (ctx) => when(ifCost12(ctx), self(ctx, { pw: 3000 })), // Usopp: come Zoro
  'OP12-015': (ctx) => when(attached(ctx.P) >= 2, self(ctx, { pw: 2000 })), // Monkey.D.Luffy: +2000 se in tutto ha 2 o più DON attaccati
  // Sabo (leader): −1000 a sé con 4 o più life; [DON!! x1] +1000 al leader e a tutti i personaggi se ha un personaggio di costo 8 o più
  'OP13-004': (ctx) => [
    ...when(ctx.P.life.length >= 4, self(ctx, { pw: -1000 })),
    ...when(
      ctx.me.don >= 1 && ctx.P.chars.some((c) => ctx.cost(c) >= 8),
      [ctx.P.leader, ...ctx.P.chars].map((card) => ({ card, pw: 1000 })),
    ),
  ],
  'OP16-054': (ctx) => when(ctx.mine && ctx.me.don >= 1 && ctx.P.hand.length >= 5, self(ctx, { pw: 3000 })), // Mr.1: [DON!! x1] [Your Turn] 5+ carte in mano
  // Charlotte Linlin (personaggio): [Your Turn] i propri personaggi con [Trigger] e 4000 di base passano a 8000
  'OP17-112': (ctx) =>
    when(ctx.mine, ctx.P.chars.filter((c) => BIG_MOM_TRIGGER_4000.has(c.id)).map((card) => ({ card, pw: 4000 }))),
  // Luffy & Ace (leader): −2000 a sé con un personaggio di 7000 di base o più; nel turno avversario +3000 ai propri [Portgas.D.Ace] e [Monkey.D.Luffy]
  'ST30-001': (ctx) => [
    ...when(ctx.P.chars.some((c) => (ctx.meta(c.id) || [])[2] >= 7000), self(ctx, { pw: -2000 })),
    ...when(
      !ctx.mine,
      ctx.P.chars
        .filter((c) => ['Portgas D. Ace', 'Monkey D. Luffy'].includes((ctx.meta(c.id) || [])[0]))
        .map((card) => ({ card, pw: 3000 })),
    ),
  ],
  // Enel: +2000 con 6 o meno DON in campo (Cost Area più quelli attaccati)
  'OP15-118': (ctx) => when(ctx.P.donPool.length + attached(ctx.P) <= 6, self(ctx, { pw: 2000 })),
  // Monkey.D.Luffy (OP16): [DON!! x1] [Your Turn] +1000 per ogni proprio personaggio con un nome diverso dal suo
  'OP16-034': (ctx) => {
    if (!ctx.mine || ctx.me.don < 1) return [];
    const name = (c) => (ctx.meta(c.id) || [c.id])[0];
    const names = new Set(ctx.P.chars.map(name).filter((n) => n !== name(ctx.me)));
    return when(names.size > 0, self(ctx, { pw: 1000 * names.size }));
  },
  'OP09-004': (ctx) => oppChars(ctx, { pw: -1000 }), // Shanks (costo 10): tutti i personaggi avversari −1000, sempre
  'OP14-027': (ctx) => when(!ctx.mine && ctx.me.rested, oppChars(ctx, { pw: -1000 })), // Shanks (costo 7): nel turno avversario, se è riposato
  // Krieg (leader): nel turno avversario, con almeno 1 DON e solo personaggi {East Blue} in campo. Il tipo delle carte qui non lo sappiamo: non è controllato.
  'OP15-001': (ctx) => when(!ctx.mine && ctx.me.don >= 1, oppChars(ctx, { pw: -2000 })),
};
