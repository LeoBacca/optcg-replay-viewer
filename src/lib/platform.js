// Dove sta girando la pagina: dentro l'exe o in un browser, in orizzontale o in verticale.
import { useSyncExternalStore } from 'react';

// Dentro l'exe, desktop/preload.js espone window.desktop: accesso diretto alla cartella dei log.
export const desktop = window.desktop || null;
export const isDesktop = !!desktop;

// Layout verticale (telefoni, finestre più alte che larghe): stessa condizione del blocco @media in styles/responsive.css
const VERTICAL = window.matchMedia('(orientation:portrait),(max-width:700px)');
export const isVertical = () => VERTICAL.matches;

/** Come isVertical, ma per i componenti: si ridisegnano quando la finestra cambia orientamento. */
export function useVertical() {
  return useSyncExternalStore((onChange) => {
    VERTICAL.addEventListener('change', onChange);
    return () => VERTICAL.removeEventListener('change', onChange);
  }, isVertical);
}
