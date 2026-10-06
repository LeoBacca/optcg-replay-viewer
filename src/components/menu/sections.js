// Le voci del menu laterale (☰), come dati: aggiungere una funzione alla pagina = aggiungere una riga qui.
//
// Tipi di voce:
//   { ic, label, hint, kbd, on }                        azione: un click la esegue e chiude il menu
//   { ..., type: 'toggle', get, set }                   interruttore acceso/spento
//   { ..., type: 'seg', opts: [[valore, testo]], get, set }   scelta tra pochi valori
//   { type: 'match' | 'recent' | 'keys' }               blocchi speciali: scheda della partita, log recenti, tasti
// In più: enabled: false la mostra spenta; pref: true la fa comparire anche in Impostazioni (menu di benvenuto).
import { get, set } from '../../store.js';
import { isVertical, isDesktop } from '../../lib/platform.js';
import { goTo, pause, togglePlay, setSpeed } from '../../game/playback.js';
import { getSetting, setSetting } from '../../game/settings.js';
import { showHome, openDrop, setOppHand, toggleLog, toggleDebug, toggleInk, setNotesVisible } from '../../game/view.js';
import { pickFolder } from '../../game/folder.js';
import { shareCurrent, shareReady, openShareSettings } from '../../game/share.js';
import { getTrainer, trainerLab, refreshTrainerUi } from '../../trainer/bridge.js';

export const GITHUB_URL = 'https://github.com/LeoBacca/optcg-replay-viewer';

export const KEYS = [
  ['Spazio', 'Play / Pausa'],
  ['← →', 'Indietro / avanti'],
  ['Home / End', 'Inizio / fine'],
  ['H', 'Mano avversario'],
  ['L', 'Log eventi'],
  ['D', 'Pennarello'],
  ['N', 'Note'],
  ['M', 'Menu'],
  ['Esc', 'Chiudi'],
];

// un interruttore legato a un'impostazione salvata
const settingToggle = (key) => ({ type: 'toggle', get: () => getSetting(key), set: (v) => setSetting(key, v) });

/** Le sezioni del menu, calcolate sullo stato di adesso. */
export function menuSections() {
  const s = get();
  const loaded = s.snaps.length > 0;
  const vertical = isVertical();
  const notesActive = !!s.notesCtx;
  const trainer = getTrainer();

  return [
    {
      title: 'Partita',
      items: [
        { type: 'match' },
        { ic: '🏠', label: 'Menu principale', hint: 'Replay, Stats, Impostazioni, Tutorial', on: showHome },
        {
          ic: '📚',
          label: 'Raccolta e statistiche',
          hint: 'tutte le partite della cartella, winrate per matchup',
          on: openDrop,
        },
        {
          ic: '📂',
          label: 'Apri un log…',
          hint: 'scegli un file .log di OPTCGSim',
          on: () => document.getElementById('file').click(),
        },
        {
          ic: '📁',
          label: s.hasFolder ? 'Cambia cartella dei log' : 'Scegli la cartella dei log',
          hint: s.folderName || 'i log nuovi compaiono da soli',
          pref: true,
          on: () => {
            openDrop();
            pickFolder();
          },
        },
        { type: 'recent' },
      ],
    },
    {
      title: 'Condivisione',
      items: [
        {
          ic: '🔗',
          label: s.share ? 'Copia il link di questa partita' : 'Genera link',
          hint: s.share ? s.share.url : 'pagina pubblica con questo replay, dove chi la apre può lasciare note',
          on: shareCurrent,
          enabled: loaded,
        },
        {
          ic: '💬',
          label: 'Note',
          hint: notesActive ? 'commenti ancorati a un momento della partita' : 'disponibili dopo aver generato il link',
          type: 'toggle',
          kbd: 'N',
          get: () => get().notesVisible,
          set: setNotesVisible,
          enabled: notesActive,
        },
        {
          ic: '🔑',
          label: 'Server e token',
          hint: shareReady() ? 'configurato' : 'servono per generare i link',
          pref: true,
          on: openShareSettings,
        },
      ],
    },
    {
      title: 'Riproduzione',
      items: [
        {
          ic: s.playing ? '❚❚' : '▶',
          label: s.playing ? 'Pausa' : 'Play',
          kbd: 'Spazio',
          on: togglePlay,
          enabled: loaded,
        },
        {
          ic: '⏱',
          label: 'Velocità',
          pref: true,
          type: 'seg',
          opts: [
            [0.5, '0.5×'],
            [1, '1×'],
            [1.5, '1.5×'],
            [2, '2×'],
            [3, '3×'],
          ],
          get: () => get().speed,
          set: setSpeed,
        },
        {
          ic: '⏮',
          label: 'Inizio partita',
          kbd: 'Home',
          on: () => {
            pause();
            goTo(0);
          },
          enabled: loaded,
        },
        {
          ic: '⏭',
          label: 'Fine partita',
          kbd: 'End',
          on: () => {
            pause();
            goTo(get().snaps.length - 1);
          },
          enabled: loaded,
        },
        {
          ic: '🔁',
          label: "Play automatico all'apertura",
          hint: 'altrimenti il replay parte in pausa',
          pref: true,
          ...settingToggle('autoplay'),
        },
        {
          ic: '✨',
          label: 'Animazioni delle carte',
          hint: 'life → mano, mano → campo, campo → trash…',
          pref: true,
          ...settingToggle('anim'),
        },
      ],
    },
    {
      title: 'Vista',
      items: [
        {
          ic: '👁',
          label: "Mano dell'avversario",
          pref: true,
          type: 'seg',
          kbd: 'H',
          opts: [
            ['all', 'tutte'],
            ['known', 'note'],
            ['hidden', 'coperte'],
          ],
          get: () => get().oppHand,
          set: setOppHand,
        },
        {
          ic: '🔍',
          label: vertical ? 'Anteprima carta' : 'Anteprima carta a destra',
          hint: vertical ? 'tocca una carta per ingrandirla' : 'al passaggio del mouse',
          pref: true,
          ...settingToggle('preview'),
        },
        {
          ic: '📜',
          label: 'Log degli eventi',
          hint: 'pannello con tutte le mosse',
          type: 'toggle',
          kbd: 'L',
          get: () => get().logOpen,
          set: toggleLog,
        },
        // solo nell'exe, con le funzioni in prova accese: il pannello del Memory Trainer nel replay
        ...(trainerLab()
          ? [
              {
                ic: '🧠',
                label: 'Fondo del mazzo',
                hint: 'le carte che hai mandato sotto fin qui, coperte: B le scopre',
                type: 'toggle',
                get: trainer.panelOn,
                set: (v) => {
                  trainer.setPanel(v);
                  refreshTrainerUi();
                },
              },
            ]
          : []),
      ],
    },
    {
      title: 'Strumenti',
      items: [
        // nel layout verticale il pennarello si accende solo da qui (non c'è il suo pulsante sul tavolo): mette in pausa da sé
        {
          ic: '🖍',
          label: 'Pennarello',
          hint: vertical ? 'disegna sul tavolo col dito; al Play si cancella' : 'solo in pausa; al Play si cancella',
          kbd: 'D',
          on: () => {
            if (isVertical()) pause();
            toggleInk();
          },
          enabled: loaded,
        },
        {
          ic: '🧪',
          label: 'Verifiche di coerenza',
          hint: 'confronta lo stato con i CHK del log',
          on: toggleDebug,
          enabled: !!s.parsed,
        },
        // solo nell'exe: accende le funzioni ancora da provare (per ora il Memory Trainer, che compare nel menu principale)
        ...(isDesktop
          ? [
              {
                ic: '🧠',
                label: 'Funzioni in prova',
                hint: 'Memory Trainer: allena la memoria sul fondo del mazzo',
                pref: true,
                ...settingToggle('lab'),
              },
            ]
          : []),
      ],
    },
    {
      title: 'Aiuto',
      items: [
        { type: 'keys' },
        {
          ic: '🌐',
          label: 'Sito e codice sorgente',
          hint: GITHUB_URL.replace('https://', ''),
          on: () => window.open(GITHUB_URL, '_blank', 'noopener'),
        },
      ],
    },
  ];
}

/** Solo le voci che sono impostazioni (pref: true), raggruppate per sezione: le mostra il menu di benvenuto. */
export function settingsSections() {
  return menuSections()
    .map((section) => ({ title: section.title, items: section.items.filter((item) => item.pref) }))
    .filter((section) => section.items.length);
}

/** Apre e chiude il menu laterale. */
export const setMenuOpen = (open) => set({ menuOpen: open });
