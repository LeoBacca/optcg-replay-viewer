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
