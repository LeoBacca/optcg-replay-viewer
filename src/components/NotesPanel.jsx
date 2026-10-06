// Il pannello delle note di un replay condiviso (colonna di sinistra): elenco delle note e modulo per scriverne una.
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.js';
import { isVertical } from '../lib/platform.js';
import { toast } from '../lib/toast.js';
import { goTo, pause } from '../game/playback.js';
import { setNotesVisible } from '../game/view.js';
import { addNote, removeNote, savedAuthor, turnLabel } from '../game/notes.js';

export function NotesPanel() {
  const ctx = useStore((s) => s.notesCtx);
  const notes = useStore((s) => s.notes);
  const visible = useStore((s) => s.notesVisible);
  const cur = useStore((s) => s.cur);

  const [text, setText] = useState('');
  const [author, setAuthor] = useState(savedAuthor);
  const [sending, setSending] = useState(false);
  const textRef = useRef(null);
  const authorRef = useRef(null);
  const listRef = useRef(null);

  // la nota del momento mostrato resta in vista nell'elenco
  useEffect(() => {
    const current = listRef.current && listRef.current.querySelector('li.cur');
    if (current) current.scrollIntoView({ block: 'nearest' });
  }, [cur, notes]);

  async function submit(e) {
    e.preventDefault();
    if (!ctx) return;
    const cleanText = text.trim();
    const cleanAuthor = author.trim();
    if (!cleanText) {
      textRef.current.focus();
      return;
    }
    if (!cleanAuthor) {
      authorRef.current.focus();
      toast('Scrivi il tuo nome accanto alla nota');
      return;
    }
    setSending(true);
    const saved = await addNote(cleanAuthor, cleanText);
    setSending(false);
    if (saved) setText('');
  }

  return (
    <section id="notes" hidden={!visible}>
      <header>
        <h1>
          Note <span id="notes-n">{ctx && notes.length ? '(' + notes.length + ')' : ''}</span>
        </h1>
        <button id="notes-close" title="Chiudi le note (N)" onClick={() => setNotesVisible(false)}>
          ✕
        </button>
      </header>
      <ul id="notes-list" ref={listRef}>
        {ctx && !notes.length && (
          <li className="empty">Ancora nessuna nota. Fermati su un momento della partita e scrivi la prima.</li>
        )}
        {ctx &&
          notes.map((note) => (
            <li
              key={note.id}
              data-step={note.step}
              className={note.step === cur ? 'cur' : ''}
              onClick={() => {
                pause();
                goTo(note.step);
                // nel layout verticale il pannello copre mezzo tavolo: scelta la nota si chiude, e il testo resta nel fumetto
                if (isVertical()) setNotesVisible(false);
              }}
            >
              <div className="h">
                <b>{turnLabel(note.step)}</b>
                <span className="au">{note.author}</span>
                {ctx.mine && (
                  <button
                    className="del"
                    title="Elimina la nota"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNote(note);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p>{note.text}</p>
            </li>
          ))}
      </ul>
      <form id="notes-form" onSubmit={submit}>
        <textarea
          id="note-text"
          rows="2"
          maxLength="500"
          placeholder="Scrivi una nota su questo momento della partita…"
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={pause}
        />
        <div>
          <input
            type="text"
            id="note-author"
            maxLength="30"
            placeholder="Il tuo nome"
            ref={authorRef}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <button className="primary" id="note-send" disabled={sending}>
            {ctx ? 'Aggiungi a ' + turnLabel(cur) : 'Aggiungi'}
          </button>
        </div>
      </form>
    </section>
  );
}
