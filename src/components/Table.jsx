// Il tavolo intero (#app): colonna sinistra con le mani, tappetino al centro, colonna destra, barra dei comandi.
//
// Qui sta anche l'unico punto in cui, dopo che React ha ridisegnato le carte, si lavora direttamente sul DOM:
// la freccia dell'attacco, lo scivolamento delle carte dal posto vecchio al nuovo e il lampeggio di quelle colpite.
// Servono le posizioni vere degli elementi sullo schermo, che esistono solo a disegno fatto.
import { useLayoutEffect, useEffect, useState } from 'react';
import { useStore } from '../store.js';
import { Hand } from './board/Hand.jsx';
import { LookBox } from './board/LookBox.jsx';
import { Board } from './board/Board.jsx';
import { drawArrow } from './board/arrow.js';
import { playFlip, flashCards } from './board/flip.js';
import { NotesPanel } from './NotesPanel.jsx';
import { RightColumn } from './RightColumn.jsx';
import { Ink } from './Ink.jsx';
import { Bar } from './Bar.jsx';

const cardElement = (uid) => (uid ? document.querySelector('#app .card[data-uid="' + uid + '"]') : null);

export function Table() {
  const state = useStore((s) => s.snaps[s.cur]);
  const oppHand = useStore((s) => s.oppHand);
  const windowSize = useWindowSize();

  useLayoutEffect(() => {
    if (!state) return;
    const combat = state.combat;
    drawArrow(
      document.getElementById('arrows'),
      document.getElementById('board'),
      combat && cardElement(combat.attacker),
      combat && cardElement(combat.defender),
    );
    playFlip();
    flashCards(state.flash);
  }, [state, oppHand, windowSize]);

  return (
    <div id="app">
      <LeftColumn />
      <Board />
      <RightColumn />
      <Ink />
      <Bar />
    </div>
  );
}

// Colonna sinistra: mano avversaria in alto, la tua in basso, in mezzo le note.
// Il riquadro delle carte guardate sta accanto alla mano di chi le guarda.
function LeftColumn() {
  const lookPlayer = useStore((s) => s.snaps[s.cur]?.look?.p);
  // quando il riquadro è chiuso resta dov'era l'ultima volta
  const [lookSide, setLookSide] = useState(2);
  if (lookPlayer && lookPlayer !== lookSide) setLookSide(lookPlayer);

  return (
    <div id="left">
      <Hand p={2} />
      {lookSide === 2 && <LookBox />}
      <NotesPanel />
      {lookSide !== 2 && <LookBox />}
      <Hand p={1} />
    </div>
  );
}

// Cambia a ogni ridimensionamento della finestra: chi lo usa viene ridisegnato e rifà le sue misure.
function useWindowSize() {
  const [size, setSize] = useState(0);
  useEffect(() => {
    const onResize = () => setSize((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}
