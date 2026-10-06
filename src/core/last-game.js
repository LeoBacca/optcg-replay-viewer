// Trova l'ultima partita dentro un file che ne contiene più d'una (i log salvati da soli dal sim).
import { MOVE } from './log-format.js';

// Un log di AutoSaved contiene tutte le partite della sessione (le rivincite si accodano), e l'ultima è quella a cui il file dà il nome:
// le precedenti stanno già nei file salvati prima. Restituisce le righe [from, to) dell'ultima partita giocata (tutto il file se è una sola).
// Una partita parte dalle righe "Leader is". Quando finisce, il sim fa ripartire le mosse da capo (RZ1|HDR, seq 1) per sgombrare il tavolo,
// per esempio i DON attaccati che tornano nella Cost Area: quelle mosse non sono né della partita finita né della rivincita, e restano fuori.
const LEADER_LINE = /^\[(?:You|Opponent)\] Leader is /;
const TURN_LINE = /^\[(?:You|Opponent)\] (?:Draw \d+ (?:Card|Don)|End Turn)\s*$/;
export function lastGame(lines) {
  let from = 0,
    to = lines.length,
    cand = 0,
    seq = 0,
    m;
  let st = 1; // 0 = tra due partite, 1 = intestazione letta, 2 = si gioca
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if ((m = MOVE.exec(l))) {
      if (st === 2 && +m[1] < seq) {
        st = 0;
        to = i;
      }
      seq = +m[1];
    } else if (st === 2 && /^RZ1\|HDR/.test(l)) {
      st = 0;
      to = i;
    } else if (st !== 1 && LEADER_LINE.test(l)) {
      if (st === 2) to = i;
      st = 1;
      cand = i;
    } else if (st === 1 && TURN_LINE.test(l)) {
      st = 2;
      from = cand;
      to = lines.length;
    } // una rivincita accettata e mai iniziata non è una partita
  }
  return { from, to };
}
