// Aprire un log trascinandolo nella finestra.
import { useEffect } from 'react';
import { get, set } from '../store.js';
import { loadFile } from '../game/loader.js';
import { openDrop } from '../game/view.js';

export function useDragAndDrop() {
  useEffect(() => {
    // sul menu di benvenuto il file si lascia cadere direttamente lì; altrimenti compare la raccolta, evidenziata
    const onDragOver = (e) => {
      e.preventDefault();
      if (get().homeOpen) return;
      set({ dropOpen: true, dropOver: true });
    };
    // il file è uscito dalla finestra senza essere lasciato
    const onDragLeave = (e) => {
      if (e.relatedTarget !== null || get().homeOpen) return;
      set(get().snaps.length ? { dropOver: false, dropOpen: false } : { dropOver: false });
    };
    const onDrop = (e) => {
      e.preventDefault();
      set({ dropOver: false });
      const file = e.dataTransfer.files[0];
      if (file) {
        // dal menu di benvenuto la raccolta compare solo per mostrare il caricamento
        if (get().homeOpen) openDrop();
        loadFile(file);
      } else if (get().snaps.length) set({ dropOpen: false });
    };
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  }, []);
}
