// Cosa scrivere sulle carte durante un combattimento, e piccoli calcoli sullo stato del tavolo usati dal tappetino.
import { basePower } from '../../lib/cards.js';

// Cerca una carta per uid tra quelle che possono combattere o essere bersaglio.
function findByUid(state, uid) {
  for (const p of [1, 2]) {
    const P = state.players[p];
    if (P.leader.uid === uid) return P.leader;
    for (const zone of [P.chars, P.stage, P.hand, P.trash]) {
      for (const card of zone) if (card.uid === uid) return card;
    }
  }
  return null;
}

/**
 * Ruolo e potenza delle due carte in combattimento.
 * @returns {{ [uid]: { role: 'attacking'|'defending', power: string|number|null } }}  vuoto se non c'è un combattimento
 */
export function combatMarks(state) {
  const combat = state.combat;
  const marks = {};
  if (!combat) return marks;

  const attacker = combat.attacker && findByUid(state, combat.attacker);
  const defender = combat.defender && findByUid(state, combat.defender);
  // la potenza la dà il log quando la conosce; altrimenti attacco = base + 1000 per ogni DON, difesa = base
  const attack = combat.atk != null ? combat.atk : attacker ? basePower(attacker) + attacker.don * 1000 : null;
  const defense = combat.def != null ? combat.def : defender ? basePower(defender) : null;
  const outcome = combat.result === 'fail' ? ' ✗' : combat.result === 'destroyed' ? ' 💥' : combat.result ? ' 💔' : '';

  if (combat.attacker) marks[combat.attacker] = { role: 'attacking', power: attack };
  if (combat.defender)
    marks[combat.defender] = { role: 'defending', power: defense != null ? defense + outcome : null };
  return marks;
}

/**
 * Le carte di un giocatore come le mostra il tavolo.
 * Un evento in risoluzione per il motore sta ancora in mano (o è già nel trash); sul tavolo resta accanto al leader
 * finché non ha finito, quindi va tolto dalla mano e dal trash.
 * @returns {{ resolving: object|null, hand: object[], trash: object[] }}
 */
export function visibleZones(state, p) {
  const P = state.players[p];
  const R = state.resolving;
  const resolving =
    R && R.p === p ? P.hand.find((c) => c.uid === R.uid) || P.trash.find((c) => c.uid === R.uid) || null : null;
  return {
    resolving,
    hand: resolving ? P.hand.filter((c) => c !== resolving) : P.hand,
    trash: resolving ? P.trash.filter((c) => c !== resolving) : P.trash,
  };
}
