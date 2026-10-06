// Il menu laterale (☰) e i pezzi con cui è fatto. Le voci sono descritte in sections.js: qui si disegnano soltanto.
import { useStore, get } from '../../store.js';
import * as Core from '../../core/index.js';
import { metaOf, logName } from '../../lib/cards.js';
import { cls, nick, fmtDate } from '../../lib/format.js';
import { pause } from '../../game/playback.js';
import { openLog } from '../../game/folder.js';
import { labelOf, currentLogIndex } from '../../game/library.js';
import { LeaderImage } from '../library/Leader.jsx';
import { menuSections, setMenuOpen, KEYS, GITHUB_URL } from './sections.js';

export function Menu() {
  const open = useStore((s) => s.menuOpen);
  const close = () => setMenuOpen(false);

  return (
    <>
      <div id="menu-backdrop" className={open ? 'show' : ''} onClick={close} />
      <aside id="menu" aria-label="Menu" className={open ? 'show' : ''}>
        <header>
          <div className="logo">OP</div>
          <h2>
            OPTCG Replay<small>Visualizzatore di replay per OPTCGSim</small>
          </h2>
          <button id="menu-close" title="Chiudi (Esc)" onClick={close}>
            ✕
          </button>
        </header>
        <MenuBody />
        <footer>
          <span>
            <kbd>M</kbd> apre e chiude il menu
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noopener">
            GitHub ↗
          </a>
        </footer>
      </aside>
    </>
  );
}

function MenuBody() {
  // le voci dipendono da quasi tutto lo stato (partita, riproduzione, impostazioni…): si ridisegnano a ogni cambiamento
  useStore();
  return (
    <div className="body" id="menu-body">
      {menuSections().map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          {section.items.map((item, i) => {
            if (item.type === 'match') return <MatchCard key={i} />;
            if (item.type === 'recent') return <RecentLogs key={i} />;
            if (item.type === 'keys') return <KeyList key={i} />;
            return <MenuRow key={i} item={item} />;
          })}
        </section>
      ))}
    </div>
  );
}

/** Una riga del menu: azione, interruttore o scelta tra pochi valori. Usata anche in Impostazioni (menu di benvenuto). */
export function MenuRow({ item }) {
  const start = (
    <>
      <span className="ic">{item.ic || ''}</span>
      <span className="lbl">
        {item.label}
        {item.hint && <small>{item.hint}</small>}
      </span>
      {item.kbd && <kbd>{item.kbd}</kbd>}
    </>
  );
  const disabled = item.enabled === false && 'dis';

  if (item.type === 'toggle') {
    const on = !!item.get();
    return (
      <div className={cls('row', disabled, 'act')} onClick={() => item.set(!on)}>
        {start}
        <button className={cls('sw', on && 'on')} title={item.label} />
      </div>
    );
  }
  if (item.type === 'seg') {
    const value = item.get();
    return (
      <div className={cls('row', disabled)}>
        {start}
        <div className="seg">
          {item.opts.map(([optionValue, text]) => (
            <button
              key={optionValue}
              className={value === optionValue ? 'sel' : ''}
              onClick={() => item.set(optionValue)}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      className={cls('row', disabled, 'act')}
      onClick={() => {
        setMenuOpen(false);
        item.on();
      }}
    >
      {start}
    </div>
  );
}

// La scheda della partita aperta: i due giocatori con i loro leader, qualche numero e l'esito.
function MatchCard() {
  const { parsed, snaps, cur } = get();
  if (!parsed) return <div className="match empty">Nessuna partita aperta</div>;

  const last = snaps[snaps.length - 1];
  const result = last && last.result;
  const numbers = [
    ['turni', parsed.turns.length],
    ['mosse', snaps.length],
    ['posizione', cur + 1],
  ];
  const player = (p) => {
    const P = parsed.players[p];
    const leader = P.leader;
    return (
      <div className={p === 1 ? 'you' : 'opp'}>
        {leader && <LeaderImage id={leader.id} />}
        <b>{nick(P.name) || (p === 1 ? 'Tu' : 'Avversario')}</b>
        <small>{leader ? (metaOf(leader.id) || {}).name || logName(leader.id) : ''}</small>
      </div>
    );
  };

  return (
    <div className="match">
      <div className="vs">
        {player(1)}
        <span className="x">VS</span>
        {player(2)}
      </div>
      <div className="stats">
        {numbers.map(([title, value]) => (
          <span key={title}>
            <b>{value}</b>
            {title}
          </span>
        ))}
      </div>
      {result && (
        <div className={cls('res', result.winner === 1 ? 'win' : 'lose')}>
          {result.winner === 1 ? 'YOU WIN' : 'YOU LOSE'}
        </div>
      )}
    </div>
  );
}

// Gli ultimi sei log della cartella, per passare in fretta da una partita all'altra.
function RecentLogs() {
  const { logFiles } = get();
  if (!logFiles.length) return null;
  const openIndex = currentLogIndex();
  return (
    <>
      <div className="sub">Log recenti nella cartella</div>
      <ul className="recent">
        {logFiles.slice(0, 6).map((logFile, i) => (
          <li
            key={i}
            className={i === openIndex ? 'cur' : ''}
            onClick={() => {
              setMenuOpen(false);
              pause();
              openLog(i);
            }}
          >
            {labelOf(logFile)}
            <span>{fmtDate(new Date(Core.gameDate(logFile.name) || logFile.mtime))}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** L'elenco dei tasti. Usato anche nel Tutorial (menu di benvenuto). */
export function KeyList() {
  return (
    <ul className="keys">
      {KEYS.map(([key, what]) => (
        <li key={key}>
          <kbd>{key}</kbd>
          {what}
        </li>
      ))}
    </ul>
  );
}
