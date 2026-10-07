// Il pannello "Log partita" (#mid): l'elenco di tutti gli step, con quello corrente evidenziato.
// In fondo, se richieste, le verifiche di coerenza tra la ricostruzione e il log.
import { memo, useEffect } from 'react';
import { useStore } from '../store.js';
import { cls } from '../lib/format.js';
import { goTo } from '../game/playback.js';
import { toggleLog, toggleDebug } from '../game/view.js';
import { stepLabel } from '../lib/step-label.js';
import { useT } from '../i18n/useT.js';

// il simbolo davanti a ogni riga, per tipo di step
const ICONS = {
  attack: '⚔',
  block: '🛡',
  vs: '⚡',
  hit: '💔',
  deploy: '＋',
  draw: '↑',
  destroyed: '✗',
  chat: '💬',
  endTurn: '⏎',
  fail: '⛨',
  event: '✦',
  look: '👁',
};

export function EventLog() {
  const t = useT();
  const parsed = useStore((s) => s.parsed);
  const cur = useStore((s) => s.cur);
  const logOpen = useStore((s) => s.logOpen);
  const debugOpen = useStore((s) => s.debugOpen);
  const debugText = useStore((s) => s.debugText);

  // la riga corrente resta sempre in vista mentre il replay avanza…
  useEffect(() => {
    const row = document.getElementById('ev' + cur);
    if (row) row.scrollIntoView({ block: 'nearest' });
  }, [cur, parsed]);
  // …e quando il pannello si apre viene portata al centro
  useEffect(() => {
    const row = logOpen && document.getElementById('ev' + cur);
    if (row) row.scrollIntoView({ block: 'center' });
  }, [logOpen]);

  return (
    <div id="mid" className={logOpen ? 'show' : ''}>
      <header>
        <h1>{t('Log partita')}</h1>
        <span>
          <button id="btn-debug" title={t('Verifiche di coerenza')} onClick={toggleDebug}>
            Debug
          </button>{' '}
          <button id="btn-log-close" onClick={toggleLog}>
            ✕
          </button>
        </span>
      </header>
      <ul id="events">
        {parsed && parsed.steps.map((step, i) => <EventRows key={i} step={step} i={i} current={i === cur} />)}
      </ul>
      <pre id="debug" className={debugOpen ? 'show' : ''}>
        {debugText}
      </pre>
    </div>
  );
}

// Una riga del log; il primo step di ogni turno è preceduto dal titolo del turno.
// memo: a ogni step si ridisegnano solo la riga che smette di essere corrente e quella che lo diventa.
const EventRows = memo(function EventRows({ step, i, current }) {
  const t = useT();
  return (
    <>
      {step.kind === 'turnStart' && (
        <li className="turn" onClick={() => goTo(i)}>
          {t('Turno {n} — {who}', { n: step.turn, who: step.player === 1 ? t('Tu') : t('Avversario') })}
        </li>
      )}
      <li
        id={'ev' + i}
        className={cls('p' + step.player, current && 'cur')}
        title={t('riga {n}', { n: step.line })}
        onClick={() => goTo(i)}
      >
        <span className="k">{ICONS[step.kind] || '·'}</span>
        {' ' + stepLabel(step)}
      </li>
    </>
  );
});
