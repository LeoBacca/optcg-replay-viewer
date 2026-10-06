// Uno "step" è un momento della partita che il replay mostra: una riga di testo del log con le mosse che le appartengono.
//
// Campi principali:
//   kind        tipo di step ('deploy', 'attack', 'draw', 'effect', 'turnStart'…)
//   sub         per gli effetti, che cosa fanno ('rest', 'buff', 'trash'…)
//   player      1 = chi ha scaricato il log, 2 = l'avversario, 0 = nessuno dei due (es. l'esito di un attacco)
//   cards       le carte nominate nella riga, nell'ordine in cui compaiono
//   moves       le mosse (righe RZ1) che questo step applica al tavolo
//   parked      mosse in attesa durante un combattimento (vedi parser/read-steps.js)
//   assertions  controlli scritti dal log (mano, campo, trash) da confrontare con lo stato ricostruito
//   turn/active numero del turno e giocatore di turno
//   delay       quanto resta a schermo durante la riproduzione (1 = durata normale)
//   line        riga del log da cui nasce (parte da 1)

/**
 * Crea uno step con tutti i campi al valore di partenza.
 * @param {string} kind    tipo di step
 * @param {number} player  1, 2 oppure 0
 * @param {string} text    testo della riga, già ripulito
 * @param {object} [extra] campi da aggiungere o sostituire
 */
export function makeStep(kind, player, text, extra) {
  const base = {
    kind,
    sub: '',
    player,
    text,
    label: '',
    cards: [],
    moves: [],
    parked: [],
    assertions: [],
    turn: 0,
    active: 0,
    delay: 1,
    owned: 0,
    line: 0,
  };
  return Object.assign(base, extra || {});
}
