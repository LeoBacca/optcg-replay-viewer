// Una riga dell'elenco delle partite: data, i due leader, chi ha iniziato, turni, esito e pulsante del link.
import * as Core from '../../core/index.js';
import { cls, nick, howText } from '../../lib/format.js';
import { openLog } from '../../game/folder.js';
import { shareLog } from '../../game/share.js';
import { summaryOf, isUnreadable, dateOf, resultLetter } from '../../game/library.js';
import { Leader } from './Leader.jsx';
import { useT } from '../../i18n/useT.js';

/**
 * @param {object} logFile   la voce della cartella
 * @param {number} index     la sua posizione nell'elenco dei log (serve per aprirla)
 * @param {boolean} current  è la partita aperta in questo momento
 */
export function GameRow({ logFile, index, current }) {
  const t = useT();
  const summary = summaryOf(logFile);

  // non ancora analizzata, o non è una partita leggibile: si vede solo il nome del file
  if (!summary) {
    return (
      <li className={cls('raw', current && 'cur')} onClick={() => openLog(index)}>
        <span className="d">{dateOf(logFile)}</span>
        <span className="fn">{logFile.name}</span>
        <span className="st">{isUnreadable(logFile) ? t('non leggibile') : t('in analisi…')}</span>
      </li>
    );
  }

  const outcome = Core.outcome(summary);
  const result = summary.result;
  const unsure = result && result.uncertain;
  const oppNick = nick(summary.opp.name);
  const share = summary.share;

  return (
    <li className={cls('g', current && 'cur')} onClick={() => openLog(index)}>
      <span className="d">{dateOf(logFile)}</span>
      <Leader leader={summary.me.leader} side="you" />
      <span className="x">vs</span>
      <Leader leader={summary.opp.leader} side="opp" sub={oppNick === 'Opponent' ? '' : oppNick} />
      <span className="ord" title={summary.first === 1 ? t('Hai iniziato tu') : t("Ha iniziato l'avversario")}>
        {summary.first === 1 ? '1°' : '2°'}
      </span>
      <span className="tn">{t('{n} turni', { n: summary.turns })}</span>
      <span className={'rb ' + outcome} title={result ? howText(result) : t('Partita non conclusa nel log')}>
        {unsure ? resultLetter(result.winner === 1 ? 'w' : 'l') + '?' : resultLetter(outcome)}
      </span>
      <button
        className={cls('lk', share && 'on')}
        title={share ? share.url : t('Crea un link pubblico a questo replay, dove chi lo apre può lasciare note')}
        onClick={(e) => {
          e.stopPropagation();
          shareLog(logFile);
        }}
      >
        {share ? t('Copia link') : t('Genera link')}
      </button>
    </li>
  );
}
