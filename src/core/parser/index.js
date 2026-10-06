// Parser: dal testo di un combat log alla lista degli step del replay.
// Legge e basta: non sa niente dello stato del tavolo (quello lo ricostruisce core/engine a partire da questi step).
import { readSteps } from './read-steps.js';
import {
  splitSetupMoves,
  addLookSteps,
  addEventSteps,
  computeCombatPowers,
  markBlockerCopies,
  labelSteps,
} from './passes.js';

/**
 * @param {string} text  il testo intero del log
 * @returns {{
 *   players: object,    i due giocatori: { 1: { name, leader }, 2: { name, leader } }
 *   steps: object[],    gli step del replay, in ordine (vedi parser/step.js)
 *   turns: object[],    un elemento per turno: { n, player, first } con first = indice del primo step del turno
 *   moveCount: number,  quante mosse RZ1 conteneva il log
 *   warnings: string[],
 *   nameMap: object     nick → giocatore (1 o 2)
 * }}
 */
export function parseLog(text) {
  const { players, nameMap, steps: raw, moveCount, warnings } = readSteps(text);
  const steps = splitSetupMoves(raw);
  addLookSteps(steps);
  addEventSteps(steps);
  computeCombatPowers(steps);
  markBlockerCopies(steps);
  const turns = labelSteps(steps, nameMap);
  return { players, steps, turns, moveCount, warnings, nameMap };
}
