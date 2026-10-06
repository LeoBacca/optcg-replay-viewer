// Il fumetto sul tavolo che mostra le note del momento della partita in cui ci si trova.
import { useEffect, useState } from 'react';
import { useStore } from '../store.js';

// il fumetto resta per qualche mossa dopo la sua, così si fa in tempo a leggerlo
const STAYS_FOR_STEPS = 4;

export function NoteBubble() {
  const ctx = useStore((s) => s.notesCtx);
  const notes = useStore((s) => s.notes);
  const cur = useStore((s) => s.cur);
  // { at: step a cui si riferisce, notes: le note mostrate } oppure null se il fumetto è nascosto
  const [bubble, setBubble] = useState(null);

  useEffect(() => {
    if (!ctx) {
      setBubble(null);
      return;
    }
    const here = notes.filter((n) => n.step === cur);
    if (here.length) setBubble({ at: cur, notes: here });
    else setBubble((old) => (old && (cur < old.at || cur > old.at + STAYS_FOR_STEPS) ? null : old));
  }, [ctx, notes, cur]);

  return (
    <div id="note-bubble" className={bubble ? 'show' : ''}>
      {bubble &&
        bubble.notes.map((note) => (
          <p key={note.id}>
            <b>{note.author + ': '}</b>
            {note.text}
          </p>
        ))}
    </div>
  );
}
