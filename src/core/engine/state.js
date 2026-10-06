// Lo stato del tavolo e i suoi mattoni: carte, giocatori, zone.
//
// state = { turn, active, result, combat, resolving, look, flash, players: { 1: P, 2: P } }
// P     = { name, leader, deck (numero), donDeck (numero), hand, chars, stage, life, trash, donPool, bottom }
// carta = { uid, id, rested, don, known }   uid = numero unico della copia fisica, id = codice della carta (es. OP01-016)

// contatore degli uid: ogni carta e ogni DON che compare sul tavolo ne riceve uno nuovo
let UID = 0;
export const nextUid = () => ++UID;

export const mkCard = (id) => ({ uid: nextUid(), id, rested: false, don: 0, known: null });
export const mkPlayer = (name, leaderId) => ({
  name,
  leader: { uid: nextUid(), id: leaderId, rested: false, don: 0 },
  deck: 50,
  donDeck: 10,
  hand: [],
  chars: [],
  stage: [],
  life: [],
  trash: [],
  donPool: [],
  flash: [],
  bottom: [],
});
export const zoneArr = (P, z) =>
  z === 1 ? P.hand : z === 2 ? P.chars : z === 3 ? P.life : z === 6 ? P.trash : z === 7 ? P.stage : null;
export const donTarget = (P, idx) => (idx >= 9900 ? P.leader : P.chars[Math.floor(idx / 100)] || null);

export function findCard(P, id, opt) {
  opt = opt || {};
  const pool = [];
  if (P.leader.id === id) pool.push(P.leader);
  for (const c of P.chars) if (c.id === id) pool.push(c);
  for (const c of P.stage) if (c.id === id) pool.push(c);
  if (!pool.length) return null;
  if (opt.prefer === 'active') {
    const a = pool.find((c) => !c.rested);
    if (a) return a;
  }
  if (opt.prefer === 'rested') {
    const a = pool.find((c) => c.rested);
    if (a) return a;
  }
  return pool[0];
}
