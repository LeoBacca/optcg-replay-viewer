// Note sul replay condiviso: leggerle dal server, aggiungerne, cancellarne.
//
// Ogni nota è ancorata a una riga del log, non all'indice dello step: il testo del log non cambia mai,
// mentre gli step si spostano quando il parser viene corretto. Lo step si ricalcola ogni volta (stepOfLine).
import { get, set } from '../store.js';
import { toast } from '../lib/toast.js';
import { isVertical } from '../lib/platform.js';
import { shareHeaders } from './share.js';
import { setShare } from './library.js';
import { setNotesVisible } from './view.js';
import { t } from '../i18n/index.js';

const AUTHOR_KEY = 'optcg.noteAuthor';

// sale a ogni cambio di partita: una risposta del server arrivata tardi per la partita di prima viene ignorata
let generation = 0;

/** Lo step con la riga più vicina a quella della nota, senza superarla. */
function stepOfLine(line) {
  let best = 0;
  let bestLine = -1;
  get().parsed.steps.forEach((step, i) => {
    if (step.line && step.line <= line && step.line > bestLine) {
      best = i;
      bestLine = step.line;
    }
  });
  return best;
}

const withStep = (note) => ({ ...note, step: stepOfLine(note.line) });

// in ordine di partita; a parità di momento, prima la più vecchia
const sorted = (notes) => [...notes].sort((a, b) => a.step - b.step || (a.createdAt < b.createdAt ? -1 : 1));

/** "T3" oppure "Inizio" ("Start"): il turno dello step i. */
export function turnLabel(i) {
  const step = get().parsed.steps[i];
  return step.turn ? 'T' + step.turn : t('Inizio');
}

/**
 * Collega le note a un replay condiviso.
 * @param {{ base, id }} share  il link del replay
 * @param {object[]} notes      le note come arrivano dal server
 * @param {boolean} mine        true se il replay l'ho caricato io (posso cancellare le note)
 */
export function openNotes(share, notes, mine) {
  set({ notesCtx: { base: share.base, id: share.id, mine: !!mine }, notes: sorted((notes || []).map(withStep)) });
}

/** Stacca le note: si chiama quando si apre un'altra partita. */
export function resetNotes() {
  generation++;
  set({ notesCtx: null, notes: [], notesVisible: false });
}

/** Partita aperta dalla cartella che ha già un link: scarica le note dal server. */
export async function loadNotes(share) {
  const myGeneration = generation;
  let response;
  try {
    response = await fetch(share.base + '/api/replays/' + share.id, { headers: shareHeaders(share.base) });
  } catch (e) {
    return;
  }
  if (myGeneration !== generation) return;
  if (response.status === 404) {
    // il replay è stato cancellato dal server: il link salvato non vale più
    const { logRef } = get();
    if (logRef) setShare(logRef, null);
    set({ share: null });
    toast(t('Il link di questa partita non esiste più sul server'));
    return;
  }
  if (!response.ok) return;
  const body = await response.json();
  if (myGeneration !== generation) return;
  openNotes(share, body.notes, body.mine);
  if (body.notes.length && !isVertical()) setNotesVisible(true);
}

/**
 * Aggiunge una nota al momento della partita mostrato adesso.
 * @returns {Promise<boolean>} true se è stata salvata
 */
export async function addNote(author, text) {
  const ctx = get().notesCtx;
  if (!ctx) return false;
  try {
    const { parsed, cur } = get();
    const response = await fetch(ctx.base + '/api/replays/' + ctx.id + '/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, line: parsed.steps[cur].line }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast(body.error ? t(body.error) : t('Non riesco a salvare la nota ({status})', { status: response.status }));
      return false;
    }
    saveAuthor(author);
    if (ctx === get().notesCtx) set({ notes: sorted([...get().notes, withStep(body)]) });
    return true;
  } catch (e) {
    toast(t('Server non raggiungibile'));
    return false;
  }
}

/** Cancella una nota (può farlo solo chi ha caricato il replay). */
export async function removeNote(note) {
  const ctx = get().notesCtx;
  let response;
  try {
    response = await fetch(ctx.base + '/api/replays/' + ctx.id + '/notes/' + note.id, {
      method: 'DELETE',
      headers: shareHeaders(ctx.base),
    });
  } catch (e) {
    toast(t('Server non raggiungibile'));
    return;
  }
  // 404 = qualcuno l'ha già cancellata: va tolta comunque dall'elenco
  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => ({}));
    toast(body.error ? t(body.error) : t('Non riesco a eliminare la nota'));
    return;
  }
  if (ctx !== get().notesCtx) return;
  set({ notes: get().notes.filter((n) => n.id !== note.id) });
}

/** Il nome con cui l'utente ha firmato l'ultima nota. */
export function savedAuthor() {
  try {
    return localStorage.getItem(AUTHOR_KEY) || '';
  } catch (e) {
    return '';
  }
}
function saveAuthor(author) {
  try {
    localStorage.setItem(AUTHOR_KEY, author);
  } catch (e) {
    // vale solo per questa visita
  }
}
