// Una metà del tappetino: tutte le aree di un giocatore (life, personaggi, leader, stage, mazzo, DON, trash).
// La mano sta nella colonna di sinistra (Hand.jsx).
import { set } from '../../store.js';
import { nick, cls } from '../../lib/format.js';
import { Card, LifeBack, CardBack } from './Card.jsx';
import { visibleZones } from './combat.js';

/**
 * @param {object} state   lo stato del tavolo a questo step
 * @param {number} p       1 = tu (metà in basso), 2 = avversario (metà in alto, girata)
 * @param {object} marks   ruoli e potenze del combattimento in corso (combat.js)
 * @param {number} stepKey cambia a ogni step: i DON della Cost Area vengono ricreati, così non scivolano da un posto all'altro
 */
export function Side({ state, p, marks, stepKey }) {
  const P = state.players[p];
  const isOpp = p === 2;
  const { resolving, trash } = visibleZones(state, p);
  const card = (c, extra) => <Card key={c.uid} card={c} player={p} {...marks[c.uid]} {...extra} />;

  const activeDon = P.donPool.filter((d) => !d.rested).length;
  // i DON riposati stanno per primi
  const donPool = [...P.donPool].sort((a, b) => (b.rested ? 1 : 0) - (a.rested ? 1 : 0));
  const topOfTrash = trash[trash.length - 1];

  return (
    <div className={cls('half', isOpp ? 'opp' : 'you')} id={(isOpp ? 'opp' : 'you') + '-half'}>
      {/* life: pila di carte di traverso; --ls dice quanta parte di ogni carta resta scoperta, e si stringe se sono tante */}
      <div className="area a-life" style={{ '--ls': Math.min(0.33, 1.35 / Math.max(1, P.life.length - 1)) }}>
        {P.life.map((c) => (
          <LifeBack key={c.uid} card={c} player={p} />
        ))}
        <div className="lifecnt" style={isOpp ? { transform: 'rotate(180deg)' } : undefined}>
          {P.life.length}
        </div>
      </div>

      <div className="area a-chars" data-label="Character area">
        {P.chars.map((c) => card(c))}
      </div>

      <div className={cls('a-name', resolving && 'res')}>
        <div>{nick(P.name || (p === 1 ? 'You' : 'Opponent'))}</div>
        <small>{'Deck ' + P.deck + ' · DON ' + activeDon + '/' + P.donPool.length}</small>
        {state.active === p && <div className="turn">{'● turno ' + state.turn}</div>}
      </div>

      {/* evento in risoluzione: resta accanto al leader finché non ha finito */}
      <div className="area a-resolve">
        {resolving && card(resolving)}
        {resolving && <span className="rtag">in risoluzione</span>}
      </div>

      <div className="area a-leader">{card(P.leader, { myTurn: state.active === p })}</div>

      <div className="area a-stage" data-label={P.stage.length ? '' : 'Stage'}>
        {P.stage.map((c) => card(c))}
      </div>

      <div className="area a-deck">
        <DeckPile count={P.deck} />
      </div>

      <div className="area a-dond">
        <div className="dond">
          <span className="n">{P.donDeck}</span>
        </div>
      </div>

      <div className="area a-cost" data-label="Cost area">
        {donPool.map((d, i) => (
          <div key={stepKey + '-' + i} className={cls('doncard', d.rested && 'r', d.frozen && 'f')}>
            DON!!
          </div>
        ))}
      </div>

      {/* trash: si vede solo la carta in cima; un click apre l'elenco completo */}
      <div className="area a-trash" data-label={trash.length ? '' : 'Trash'} onClick={() => set({ trashOf: p })}>
        {topOfTrash && card(topOfTrash, { inTrash: true })}
        {topOfTrash && <span className="cnt">{trash.length}</span>}
      </div>
    </div>
  );
}

// Il mazzo: da uno a quattro dorsi sfalsati, a seconda di quante carte restano; il numero sta su quello in cima.
function DeckPile({ count }) {
  const layers = Math.min(4, Math.max(1, Math.ceil(count / 12)));
  return (
    <div className="pile" style={count ? undefined : { opacity: 0.3 }}>
      {Array.from({ length: layers }, (_, i) => (
        <CardBack key={i} count={i === layers - 1 ? count : null} style={{ left: i * 2 + 'px', top: i * 2 + 'px' }} />
      ))}
    </div>
  );
}
