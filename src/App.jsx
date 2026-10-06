// La pagina intera: mette insieme i pezzi grandi e fa partire quello che serve all'avvio.
//
//   Table        il tavolo: mani, tappetino, colonna destra, barra dei comandi
//   Home         menu di benvenuto (sopra a tutto, all'apertura)
//   Menu         menu laterale ☰
//   TrashDialog, ShareDialog   finestre
//   Toast        avvisi brevi
import { useEffect } from 'react';
import { useStore } from './store.js';
import { isDesktop } from './lib/platform.js';
import { initFolder } from './game/folder.js';
import { initShare } from './game/share.js';
import { openFromUrl } from './game/url.js';
import { initTrainer } from './trainer/bridge.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import { useDragAndDrop } from './hooks/useDragAndDrop.js';
import { usePhoneKeyboard } from './hooks/usePhoneKeyboard.js';
import { Table } from './components/Table.jsx';
import { Home } from './components/Home.jsx';
import { Menu } from './components/menu/Menu.jsx';
import { TrashDialog } from './components/board/TrashDialog.jsx';
import { ShareDialog } from './components/ShareDialog.jsx';
import { Toast } from './components/Toast.jsx';

// l'avvio va fatto una volta sola, anche se React ridisegna la pagina
let started = false;
function start() {
  if (started) return;
  started = true;
  initShare();
  initFolder();
  openFromUrl();
  // __DESKTOP__ è vero solo nella build per l'exe (vite.config.js): nel sito il trainer non viene nemmeno incluso
  if (__DESKTOP__ && isDesktop) initTrainer();
}

export function App() {
  useKeyboard();
  useDragAndDrop();
  usePhoneKeyboard();
  useEffect(start, []);

  // animazioni spente: una classe sulla pagina le toglie tutte dagli stili
  const animations = useStore((s) => s.settings.anim);
  useEffect(() => {
    document.body.classList.toggle('noanim', !animations);
  }, [animations]);

  return (
    <>
      <Table />
      <Home />
      <Menu />
      <TrashDialog />
      <ShareDialog />
      <Toast />
    </>
  );
}
