// La raccolta (#drop): il riquadro sopra il tavolo da cui si sceglie la cartella dei log e si apre una partita.
// Dentro ci sono l'elenco delle partite con i filtri e la scheda delle statistiche.
// È anche il posto dove compare l'avanzamento mentre un log si carica.
import { useStore, set, get } from '../../store.js';
import * as Core from '../../core/index.js';
import { cls } from '../../lib/format.js';
import { isDesktop } from '../../lib/platform.js';
import { closeDrop, showHome } from '../../game/view.js';
import { pickFolder, reopenFolder } from '../../game/folder.js';
import { summaryOf, leaderName, recordText, currentLogIndex } from '../../game/library.js';
import { GameRow } from './GameRow.jsx';
import { StatsView } from './StatsView.jsx';
import { useT } from '../../i18n/useT.js';

export function LibraryOverlay() {
  const t = useT();
  const dropOpen = useStore((s) => s.dropOpen);
  const dropOver = useStore((s) => s.dropOver);
  const loaded = useStore((s) => s.snaps.length > 0);
  const libShown = useStore((s) => s.libShown);
  const canReopen = useStore((s) => s.canReopen);
  const folderName = useStore((s) => s.folderName);
  const progress = useStore((s) => s.progress);
  const libProgress = useStore((s) => s.libProgress);

  return (
    <div id="drop" className={cls(!dropOpen && 'hidden', dropOver && 'over')}>
      <div className={cls('box', libShown && 'wide')}>
        <button id="btn-drop-home" title={t('Torna al menu principale')} onClick={showHome}>
          ‹ {t('Menu')}
        </button>
        <button id="btn-drop-close" title={t('Torna al replay (Esc)')} hidden={!loaded} onClick={closeDrop}>
          ✕ {t('Torna al replay')}
        </button>
        <h2>{t('Replay OPTCGSim')}</h2>
        <p>
          <button id="btn-folder" className="primary" onClick={pickFolder}>
            📁 {t('Scegli la cartella dei log')}
          </button>{' '}
          <button id="btn-refolder" hidden={!canReopen} onClick={reopenFolder}>
            ↻ {t('Riapri')} <span id="folder-name">{folderName}</span>
          </button>
        </p>
        <div id="lib" hidden={!libShown}>
          {libShown && <Library />}
        </div>
        <p className="kbd">
          {t('oppure trascina qui un file .log, o')} <label htmlFor="file">{t('scegline uno')}</label>
        </p>
        <p className="kbd" id="dirfiles-hint" hidden={isDesktop}>
          {t(
            'Se il browser non lascia scegliere quella cartella (su Mac i log del sim stanno in una cartella di sistema, e Safari e Firefox non hanno il pulsante sopra):',
          )}{' '}
          <label htmlFor="dirfiles">{t('apri i log di una cartella')}</label>{' '}
          {t('con la finestra dei file. Non viene ricordata: si rifà a ogni apertura.')}
        </p>
        <p className="kbd" id="lib-progress">
          {libProgress}
        </p>
        <p id="progress">{progress}</p>
      </div>
      <p className="kbd">
        {t('M = menu · Spazio = play/pausa · ← → = mossa indietro/avanti · H = mano avversario · Home/End')}
      </p>
    </div>
  );
}

// Le partite della cartella: schede, filtri, riga di riepilogo, e sotto l'elenco oppure le statistiche.
function Library() {
  const t = useT();
  const logFiles = useStore((s) => s.logFiles);
  const tab = useStore((s) => s.libTab);
  const filter = useStore((s) => s.libFilter);
  // l'indice delle partite cambia sul posto: libVersion dice quando ridisegnare
  useStore((s) => s.libVersion);
  useStore((s) => s.logRef);

  const all = logFiles.map((logFile, i) => ({ logFile, i, summary: summaryOf(logFile) }));
  const analyzed = all.filter((g) => g.summary);

  // le voci delle due tendine: ogni leader con il numero di partite, dal più giocato
  const leaderOptions = (pick) => {
    const byId = new Map();
    for (const g of analyzed) {
      const leader = pick(g.summary);
      if (!leader) continue;
      const entry = byId.get(leader.id) || { id: leader.id, name: leaderName(leader), games: 0 };
      entry.games++;
      byId.set(leader.id, entry);
    }
    return [...byId.values()].sort((a, b) => b.games - a.games);
  };
  const myLeaders = leaderOptions((s) => s.me.leader);
  const oppLeaders = leaderOptions((s) => s.opp.leader);
  // un filtro su un leader che non è più in elenco non vale
  const me = myLeaders.some((o) => o.id === filter.me) ? filter.me : '';
  const opp = oppLeaders.some((o) => o.id === filter.opp) ? filter.opp : '';
  const res = filter.res;
  const filtering = me || opp || res;

  const passes = (s) =>
    (!me || s.me.leader.id === me) &&
    (!opp || (s.opp.leader && s.opp.leader.id === opp)) &&
    (!res || Core.outcome(s) === res);
  // le partite non ancora analizzate si vedono solo senza filtri
  const shown = all.filter((g) => (g.summary ? passes(g.summary) : !filtering));
  const stats = Core.stats(shown.map((g) => g.summary));
  const total = stats.total;
  const winrate = Core.winrate(total);
  const openIndex = currentLogIndex();
  const setFilter = (change) => set({ libFilter: { ...get().libFilter, ...change } });

  return (
    <>
      <div id="lib-bar">
        <div id="lib-tabs">
          <button className={tab === 'games' ? 'sel' : ''} onClick={() => set({ libTab: 'games' })}>
            {t('Partite')}
          </button>
          <button className={tab === 'stats' ? 'sel' : ''} onClick={() => set({ libTab: 'stats' })}>
            {t('Statistiche')}
          </button>
        </div>
        <LeaderSelect
          id="flt-me"
          title={t('Filtra per il tuo leader')}
          all={t('Tutti i miei leader')}
          options={myLeaders}
          value={me}
          onChange={(v) => setFilter({ me: v })}
        />
        <LeaderSelect
          id="flt-opp"
          title={t('Filtra per il leader avversario')}
          all={t('Tutti gli avversari')}
          options={oppLeaders}
          value={opp}
          onChange={(v) => setFilter({ opp: v })}
        />
        <select
          id="flt-res"
          title={t('Filtra per esito')}
          value={res}
          onChange={(e) => setFilter({ res: e.target.value })}
        >
          <option value="">{t('Tutti gli esiti')}</option>
          <option value="w">{t('Vittorie')}</option>
          <option value="l">{t('Sconfitte')}</option>
          <option value="o">{t('Incerte o non concluse')}</option>
        </select>
      </div>
      <p id="lib-sum">
        {total.games > 0 &&
          t(total.games === 1 ? '{n} partita' : '{n} partite', { n: total.games }) + ' · ' + recordText(total)}
        {total.games > 0 && winrate != null && (
          <>
            {' · winrate '}
            <b>{winrate + '%'}</b>
          </>
        )}
      </p>
      <ul id="loglist" hidden={tab !== 'games'}>
        {tab === 'games' && !logFiles.length && <li className="empty">{t('Nessun file .log in questa cartella')}</li>}
        {tab === 'games' && logFiles.length > 0 && !shown.length && (
          <li className="empty">{t('Nessuna partita con questi filtri')}</li>
        )}
        {tab === 'games' &&
          shown.map((g) => <GameRow key={g.i} logFile={g.logFile} index={g.i} current={g.i === openIndex} />)}
      </ul>
      <div id="lib-stats" hidden={tab !== 'stats'}>
        {tab === 'stats' && (
          <StatsView
            stats={stats}
            // un click su un matchup mostra le sue partite
            onPick={(mine, theirs) => set({ libFilter: { me: mine, opp: theirs, res: '' }, libTab: 'games' })}
          />
        )}
      </div>
    </>
  );
}

function LeaderSelect({ id, title, all, options, value, onChange }) {
  return (
    <select id={id} title={title} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name + ' (' + o.games + ')'}
        </option>
      ))}
    </select>
  );
}
