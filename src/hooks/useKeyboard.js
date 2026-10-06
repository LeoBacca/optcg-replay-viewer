// I tasti della pagina. Chi li riceve dipende da cosa c'è in primo piano:
// Memory Trainer → menu di benvenuto → replay.
import { useEffect } from 'react';
import { get } from '../store.js';
import { goTo, next, prev, pause, togglePlay } from '../game/playback.js';
import { closeDrop, nextOppHand, toggleLog, toggleInk, setNotesVisible } from '../game/view.js';
import { setMenuOpen } from '../components/menu/sections.js';
import { homeKey } from '../components/Home.jsx';
import { getTrainer } from '../trainer/bridge.js';

function onKeyDown(e) {
  // mentre si scrive in un campo i tasti sono del campo
  const tag = e.target.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

  const trainer = getTrainer();
  if (trainer && trainer.isOpen()) {
    trainer.key(e);
    return;
  }
  const s = get();
  if (s.homeOpen) {
    homeKey(e);
    return;
  }
  if (e.key === 'Escape') {
    if (s.menuOpen) setMenuOpen(false);
    else closeDrop();
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    setMenuOpen(!s.menuOpen);
    return;
  }

  // da qui in giù i tasti servono solo con una partita aperta
  if (!s.snaps.length) return;
  const key = e.key.toLowerCase();
  if (key === 'n' && s.notesCtx) {
    setNotesVisible(!s.notesVisible);
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    pause();
    next();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    pause();
    prev();
  } else if (e.key === 'Home') {
    pause();
    goTo(0);
  } else if (e.key === 'End') {
    pause();
    goTo(s.snaps.length - 1);
  } else if (key === 'h') nextOppHand();
  else if (key === 'l') toggleLog();
  else if (key === 'd') toggleInk();
  else if (key === 'b' && trainer) trainer.toggleBottom();
}

export function useKeyboard() {
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
