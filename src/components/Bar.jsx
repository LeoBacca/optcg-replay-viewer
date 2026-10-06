// La barra dei comandi in fondo alla pagina: play e pausa, avanti e indietro, velocità, turno,
// scorrimento della partita, e i pulsanti di note, link, mano avversaria, log e raccolta.
import { useStore, set, get } from '../store.js';
import { cls, fmtDate } from '../lib/format.js';
import { OPP_HAND_LABELS } from '../lib/opp-hand.js';
import { isVertical } from '../lib/platform.js';
import { goTo, next, prev, pause, togglePlay, setSpeed } from '../game/playback.js';
import { nextOppHand, toggleLog, openDrop, setNotesVisible } from '../game/view.js';
import { openLog } from '../game/folder.js';
import { shareCurrent } from '../game/share.js';
import { currentLogIndex } from '../game/library.js';

const SPEEDS = [0.5, 1, 1.5, 2, 3];

export function Bar() {
  const parsed = useStore((s) => s.parsed);
  const total = useStore((s) => s.snaps.length);
  const cur = useStore((s) => s.cur);
  const playing = useStore((s) => s.playing);
  const speed = useStore((s) => s.speed);
  const oppHand = useStore((s) => s.oppHand);
  const menuOpen = useStore((s) => s.menuOpen);
  const share = useStore((s) => s.share);
  const notesCtx = useStore((s) => s.notesCtx);
  const notes = useStore((s) => s.notes);
  const notesVisible = useStore((s) => s.notesVisible);
  const logFiles = useStore((s) => s.logFiles);
  // la tendina dei log mostra etichette che dipendono dall'indice della raccolta
  useStore((s) => s.libVersion);
  useStore((s) => s.logRef);

  const loaded = total > 0;
  const step = loaded ? parsed.steps[cur] : null;
  // il turno a cui appartiene lo step mostrato (nessuno, durante la preparazione della partita)
  const turns = parsed ? parsed.turns : [];
  const turnIndex = turns.findIndex((t, k) => cur >= t.first && (k === turns.length - 1 || cur < turns[k + 1].first));
  const logIndex = currentLogIndex();

  return (
    <footer id="bar">
      <button
        id="btn-menu"
        title="Menu (M)"
        className={menuOpen ? 'on' : ''}
        onClick={() => set({ menuOpen: !get().menuOpen })}
      >
        ☰<span className="t"> Menu</span>
      </button>
      <button
        id="btn-prev"
        title="Mossa precedente (←)"
        onClick={() => {
          pause();
          prev();
        }}
      >
        ◀<span className="t"> Prec</span>
      </button>
      <button id="btn-play" className="primary" title="Play/Pausa (spazio)" onClick={togglePlay}>
        {playing ? '❚❚ Pausa' : '▶ Play'}
      </button>
      <button
        id="btn-next"
        title="Mossa successiva (→)"
        onClick={() => {
          pause();
          next();
        }}
      >
        <span className="t">Succ </span>▶
      </button>
      <select id="speed" title="Velocità" value={speed} onChange={(e) => setSpeed(+e.target.value)}>
        {SPEEDS.map((v) => (
          <option key={v} value={v}>
            {v + '×'}
          </option>
        ))}
      </select>
      <select
        id="turns"
        title="Vai al turno"
        value={turnIndex >= 0 ? turnIndex : ''}
        onChange={(e) => {
          const turn = turns[+e.target.value];
          if (turn) goTo(turn.first);
        }}
      >
        {/* voce vuota e invisibile: è quella selezionata prima del primo turno */}
        {loaded && <option value="" hidden />}
        {turns.map((t, k) => (
          <option key={k} value={k}>
            {'Turno ' + t.n + ' · ' + (t.player === 1 ? 'Tu' : 'Avv')}
          </option>
        ))}
      </select>
      <span id="scrub-wrap">
        <input
          type="range"
          id="scrub"
          min="0"
          max={Math.max(0, total - 1)}
          value={cur}
          onChange={(e) => {
            pause();
            goTo(+e.target.value);
          }}
        />
        <span id="scrub-marks">{notesCtx && <NoteMarks notes={notes} total={total} />}</span>
      </span>
      <span id="pos">{loaded ? cur + 1 + ' / ' + total : '0 / 0'}</span>
      {/* nel layout verticale il pulsante Log non sta nella barra: il log si apre toccando il testo della mossa */}
      <span
        id="step-text"
        onClick={() => {
          if (isVertical() && loaded) toggleLog();
        }}
      >
        {step ? (step.turn ? 'T' + step.turn + ' · ' : '') + step.label : ''}
      </span>
      <button
        id="btn-notes"
        title="Note sul replay condiviso (N)"
        disabled={!notesCtx}
        className={notesVisible ? 'on' : ''}
        onClick={() => setNotesVisible(!notesVisible)}
      >
        {'Note' + (notesCtx && notes.length ? ' (' + notes.length + ')' : '')}
      </button>
      <button
        id="btn-share"
        title="Crea un link pubblico a questo replay, dove chi lo apre può lasciare note"
        disabled={!loaded}
        className={share ? 'on' : ''}
        onClick={shareCurrent}
      >
        {share ? 'Copia link' : 'Genera link'}
      </button>
      <button
        id="btn-hand"
        title="Mano avversario: tutte, solo quelle note, coperte (H)"
        className={oppHand !== 'hidden' ? 'on' : ''}
        onClick={nextOppHand}
      >
        {OPP_HAND_LABELS[oppHand]}
      </button>
      <button id="btn-log" title="Mostra/nascondi il log (L)" onClick={toggleLog}>
        Log
      </button>
      <select
        id="logsel"
        title="Altri log della cartella"
        hidden={!logFiles.length}
        value={logIndex >= 0 ? logIndex : 0}
        onChange={(e) => {
          pause();
          openLog(+e.target.value);
        }}
      >
        {logFiles.map((logFile, i) => (
          <option key={i} value={i}>
            {fmtDate(new Date(logFile.mtime))}
          </option>
        ))}
      </select>
      <button id="btn-open" title="Raccolta delle partite, statistiche e apertura di un log" onClick={openDrop}>
        Raccolta
      </button>
    </footer>
  );
}

// I segnalini delle note sulla barra di scorrimento: uno per ogni momento della partita che ha almeno una nota.
function NoteMarks({ notes, total }) {
  const last = Math.max(1, total - 1);
  const steps = [...new Set(notes.map((n) => n.step))];
  return steps.map((step) => (
    <i
      key={step}
      // il cursore non arriva ai bordi della barra: restano 8px per lato
      style={{ left: 'calc(8px + (100% - 16px) * ' + step / last + ')' }}
      title={notes
        .filter((n) => n.step === step)
        .map((n) => n.author + ': ' + n.text)
        .join('\n')}
      onClick={() => {
        pause();
        goTo(step);
      }}
    />
  ));
}
