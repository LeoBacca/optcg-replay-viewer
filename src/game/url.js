// Aprire una partita dall'indirizzo della pagina.
//   ?r=<id>     replay condiviso: la pagina è servita dal server dei replay, che ha il log e le note
//   ?log=<url>  carica un log da un indirizzo (serve un server http, es. durante le prove)
//   ?step=N     dopo il caricamento salta allo step N, in pausa
import { set } from '../store.js';
import { isVertical } from '../lib/platform.js';
import { loadText } from './loader.js';
import { goTo, pause } from './playback.js';
import { openNotes } from './notes.js';
import { setNotesVisible } from './view.js';
import { shareHeaders } from './share.js';

export function openFromUrl() {
  const query = new URLSearchParams(location.search);
  const jumpToStep = () => {
    if (!query.has('step')) return;
    pause();
    goTo(+query.get('step'));
  };

  const replayId = query.get('r');
  if (replayId) {
    const share = {
      id: replayId,
      base: location.origin,
      url: location.origin + location.pathname + '?r=' + encodeURIComponent(replayId),
    };
    set({ progress: 'Carico il replay…' });
    fetch(share.base + '/api/replays/' + encodeURIComponent(share.id), { headers: shareHeaders(share.base) })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'errore ' + response.status);
        return body;
      })
      .then(async (body) => {
        await loadText(body.log, 'replay ' + share.id);
        set({ share });
        openNotes(share, body.notes, body.mine);
        // nel layout verticale le note restano chiuse (coprirebbero mezzo tavolo): le annunciano il pulsante col conteggio e i fumetti
        setNotesVisible(!isVertical());
        jumpToStep();
      })
      .catch((e) => set({ progress: 'Non riesco ad aprire il replay: ' + e.message }));
    return;
  }

  const logUrl = query.get('log');
  if (logUrl) {
    fetch(logUrl)
      .then((response) => response.text())
      .then((text) => loadText(text, logUrl))
      .then(jumpToStep)
      .catch((e) => set({ progress: 'Errore caricamento: ' + e.message }));
  }
}
