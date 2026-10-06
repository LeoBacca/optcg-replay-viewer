// La scheda Statistiche della raccolta: per ogni mio leader, una tabella con i matchup contro ogni leader avversario.
import { Fragment } from 'react';
import * as Core from '../../core/index.js';
import { leaderName, recordText } from '../../game/library.js';
import { Leader, LeaderImage } from './Leader.jsx';

const COLUMNS = ['Contro', 'Partite', 'V', 'S', 'Incerte', 'Winrate', 'Da primo', 'Da secondo'];

// "3–1 (75%)", oppure un puntino se non ci sono partite concluse
function split(bucket) {
  const winrate = Core.winrate(bucket);
  return winrate != null ? bucket.w + '–' + bucket.l + ' (' + winrate + '%)' : '·';
}

/**
 * @param {object} stats     quello che esce da Core.stats sulle partite filtrate
 * @param {Function} onPick  chiamata con (id del mio leader, id del leader avversario) quando si clicca un matchup
 */
export function StatsView({ stats, onPick }) {
  if (!stats.leaders.length) return <p className="empty">Nessuna partita analizzata con questi filtri</p>;

  return stats.leaders.map((mine) => {
    const winrate = Core.winrate(mine);
    return (
      // un blocco per leader: intestazione e tabella, uno sotto l'altro
      <Fragment key={mine.id}>
        <div className="lead">
          <LeaderImage id={mine.id} />
          <b>{leaderName(mine)}</b>
          <small>
            {mine.games +
              (mine.games === 1 ? ' partita · ' : ' partite · ') +
              recordText(mine) +
              (winrate != null ? ' · winrate ' + winrate + '%' : '')}
          </small>
        </div>
        <table>
          <tbody>
            <tr>
              {COLUMNS.map((title) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
            {mine.matchups.map((matchup) => {
              const matchupWinrate = Core.winrate(matchup);
              const unknown = matchup.id === '?';
              return (
                <tr
                  key={matchup.id}
                  className="mu"
                  title="Mostra queste partite"
                  onClick={() => onPick(mine.id, unknown ? '' : matchup.id)}
                >
                  <td>
                    <Leader leader={unknown ? null : matchup} side="opp" />
                  </td>
                  <td>{matchup.games}</td>
                  <td>{matchup.w}</td>
                  <td>{matchup.l}</td>
                  <td>{matchup.open || '·'}</td>
                  <td className="wr">
                    {matchupWinrate != null ? (
                      <>
                        <span className="wrbar">
                          <i style={{ width: matchupWinrate + '%' }} />
                        </span>
                        {matchupWinrate + '%'}
                      </>
                    ) : (
                      '·'
                    )}
                  </td>
                  <td>{split(matchup.first)}</td>
                  <td>{split(matchup.second)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Fragment>
    );
  });
}
