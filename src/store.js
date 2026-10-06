// Lo stato condiviso della pagina, in un posto solo.
//
// Come funziona: i componenti React leggono i pezzi che gli servono con useStore((s) => s.qualcosa)
// e si ridisegnano da soli quando quel pezzo cambia. Il codice che non è un componente (src/game/*)
// legge con get() e scrive con set({ ... }). Nessuno cambia questi valori in altro modo.
//
// Qui ci sono solo i dati. Le azioni ("apri un log", "vai allo step 12") stanno in src/game/*.
import { create } from 'zustand';
import { loadSettings } from './lib/settings.js';
import { loadOppHand } from './lib/opp-hand.js';

// i link condivisi (?r=), ?log= e l'avvio dell'exe con --open-latest saltano il menu di benvenuto e mostrano subito il caricamento
const skipHome = /[?&](r|log|open)=/.test(location.search);

const settings = loadSettings();

export const useStore = create(() => ({
  // ---- partita aperta ----
  parsed: null, // quello che esce da Core.parseLog: giocatori, step, turni
  snaps: [], // snaps[i] = stato del tavolo dopo lo step i
  cur: 0, // indice dello step mostrato
  text: '', // il testo del log aperto (serve per condividerlo)
  logRef: null, // la voce della cartella da cui viene il log, se viene da lì
  share: null, // il link di questa partita, se esiste: { id, url, base }

  // ---- riproduzione ----
  playing: false,
  speed: settings.speed,

  // ---- cosa si vede ----
  homeOpen: !skipHome, // menu di benvenuto
  homePage: 'main', // 'main' | 'settings' | 'tutorial'
  homeSel: 0, // voce scelta nel menu di benvenuto
  dropOpen: skipHome, // raccolta delle partite (e riquadro di caricamento)
  dropOver: false, // un file trascinato sta passando sopra la finestra
  menuOpen: false, // menu laterale ☰
  logOpen: false, // pannello "Log partita"
  debugOpen: false, // verifiche di coerenza, dentro il pannello del log
  debugText: '',
  oppHand: loadOppHand(), // 'all' | 'known' | 'hidden': come mostrare la mano avversaria
  preview: { id: '', show: false }, // carta ingrandita a destra
  trashOf: 0, // 1 o 2 = elenco del trash di quel giocatore aperto, 0 = chiuso
  inkOn: false, // pennarello acceso
  inkHint: 0, // cambia ogni volta che va mostrato "Metti in pausa per disegnare"
  inkTool: { color: '#e5322d', size: 6, eraser: false }, // colore, spessore e gomma del pennarello
  inkClear: 0, // sale quando si preme "Cancella": il foglio si pulisce
  progress: '', // riga di avanzamento del caricamento di un log
  libProgress: '', // riga di avanzamento dell'analisi della cartella
  toast: { msg: '', n: 0 }, // avviso breve in basso; n cambia a ogni avviso

  // ---- cartella dei log ----
  logFiles: [], // i log della cartella, dal più recente: { name, mtime, size, path | handle | file }
  folderName: '',
  hasFolder: false, // una cartella è stata scelta ed è leggibile
  canReopen: false, // mostra il pulsante "↻ Riapri"

  // ---- raccolta ----
  libShown: false, // la cartella è stata letta almeno una volta
  libTab: 'games', // 'games' | 'stats'
  libFilter: { me: '', opp: '', res: '' },
  libVersion: 0, // l'indice delle partite (src/game/library.js) viene modificato sul posto: questo numero sale a ogni modifica

  // ---- condivisione e note ----
  shareCfg: { base: '', token: '' },
  shareDlgOpen: false,
  notesCtx: null, // replay condiviso a cui si riferiscono le note: { base, id, mine }
  notes: [], // note del replay, ognuna con lo step a cui è ancorata
  notesVisible: false,

  // ---- impostazioni salvate ----
  settings,

  // ---- Memory Trainer (solo exe) ----
  trainerReady: false,
  trainerTick: 0, // sale quando cambia qualcosa dentro il trainer che il menu deve rileggere
}));

export const get = useStore.getState;
export const set = useStore.setState;
