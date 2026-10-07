// Il centro della pagina (#board): il tappetino con le due metà, e sopra di lui i pannelli che lo coprono
// (log della partita, raccolta), la freccia dell'attacco, l'esito e il fumetto delle note.
import { useEffect, useRef } from 'react';
import { useStore } from '../../store.js';
import { howText, cls } from '../../lib/format.js';
import { useT } from '../../i18n/useT.js';
import { loadFile } from '../../game/loader.js';
import { takeFolderFiles } from '../../game/folder.js';
import { EventLog } from '../EventLog.jsx';
import { LibraryOverlay } from '../library/LibraryOverlay.jsx';
import { NoteBubble } from '../NoteBubble.jsx';
import { Side } from './Side.jsx';
import { combatMarks } from './combat.js';

export function Board() {
  const state = useStore((s) => s.snaps[s.cur]);
  const cur = useStore((s) => s.cur);
  const marks = state ? combatMarks(state) : {};

  return (
    <main id="board">
      <EventLog />
      <LibraryOverlay />
      {/* i due selettori di file sono invisibili: li aprono i pulsanti e le etichette della raccolta */}
      <input type="file" id="file" accept=".log,.txt" hidden onChange={(e) => loadFile(e.target.files[0])} />
      <input
        type="file"
        id="dirfiles"
        webkitdirectory=""
        multiple
        hidden
        onChange={(e) => {
          takeFolderFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div id="mat">
        {state ? (
          <>
            <Side state={state} p={2} marks={marks} stepKey={cur} />
            <Side state={state} p={1} marks={marks} stepKey={cur} />
          </>
        ) : (
          <>
            <div className="half opp" id="opp-half" />
            <div className="half you" id="you-half" />
          </>
        )}
      </div>
      <svg id="arrows" />
      <Result result={state?.result} />
      <NoteBubble />
    </main>
  );
}

// La scritta YOU WIN / YOU LOSE a fine partita.
function Result({ result }) {
  // la riga sotto la scritta (come è finita) è nella lingua scelta
  useT();
  // l'animazione d'ingresso parte solo la prima volta che la scritta compare, non a ogni step successivo
  const wasShown = useRef(false);
  const style = result && wasShown.current ? { animation: 'none' } : undefined;
  useEffect(() => {
    wasShown.current = !!result;
  });

  if (!result) {
    return (
      <div id="result">
        <div className="big" />
        <div className="how" />
      </div>
    );
  }
  const win = result.winner === 1;
  return (
    <div id="result" className={cls('show', win ? 'win' : 'lose')} style={style}>
      <div className="big">{win ? 'YOU WIN' : 'YOU LOSE'}</div>
      <div className="how">{howText(result)}</div>
    </div>
  );
}
