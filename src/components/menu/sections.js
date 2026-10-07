// Le voci del menu laterale (☰), come dati: aggiungere una funzione alla pagina = aggiungere una riga qui.
//
// Tipi di voce:
//   { ic, label, hint, kbd, on }                        azione: un click la esegue e chiude il menu
//   { ..., type: 'toggle', get, set }                   interruttore acceso/spento
//   { ..., type: 'seg', opts: [[valore, testo]], get, set }   scelta tra pochi valori
//   { type: 'match' | 'recent' | 'keys' }               blocchi speciali: scheda della partita, log recenti, tasti
// In più: enabled: false la mostra spenta; pref: true la fa comparire anche in Impostazioni (menu di benvenuto).
// I testi sono in italiano dentro t(): la traduzione inglese sta in src/i18n/en.js.
import { get, set } from '../../store.js';
import { isVertical, isDesktop } from '../../lib/platform.js';
import { goTo, pause, togglePlay, setSpeed } from '../../game/playback.js';
import { getSetting, setSetting } from '../../game/settings.js';
import { showHome, openDrop, setOppHand, toggleLog, toggleDebug, toggleInk, setNotesVisible } from '../../game/view.js';
import { pickFolder } from '../../game/folder.js';
import { shareCurrent, shareReady, openShareSettings } from '../../game/share.js';
import { getTrainer, trainerLab, refreshTrainerUi } from '../../trainer/bridge.js';
import { t, LANGUAGES } from '../../i18n/index.js';

export const GITHUB_URL = 'https://github.com/LeoBacca/optcg-replay-viewer';

/** I tasti del replay, con quello che fanno (una funzione, così i testi seguono la lingua scelta). */
export const keyList = () => [
  [t('Spazio'), t('Play / Pausa')],
  ['← →', t('Indietro / avanti')],
  ['Home / End', t('Inizio / fine')],
  ['H', t('Mano avversario')],
  ['L', t('Log eventi')],
  ['D', t('Pennarello')],
  ['N', t('Note')],
  ['M', t('Menu')],
  ['Esc', t('Chiudi')],
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
      title: t('Partita'),
      items: [
        { type: 'match' },
        { ic: '🏠', label: t('Menu principale'), hint: t('Replay, Stats, Impostazioni, Tutorial'), on: showHome },
        {
          ic: '📚',
          label: t('Raccolta e statistiche'),
          hint: t('tutte le partite della cartella, winrate per matchup'),
          on: openDrop,
        },
        {
          ic: '📂',
          label: t('Apri un log…'),
          hint: t('scegli un file .log di OPTCGSim'),
          on: () => document.getElementById('file').click(),
        },
        {
          ic: '📁',
          label: s.hasFolder ? t('Cambia cartella dei log') : t('Scegli la cartella dei log'),
          hint: s.folderName || t('i log nuovi compaiono da soli'),
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
      title: t('Condivisione'),
      items: [
        {
          ic: '🔗',
          label: s.share ? t('Copia il link di questa partita') : t('Genera link'),
          hint: s.share ? s.share.url : t('pagina pubblica con questo replay, dove chi la apre può lasciare note'),
          on: shareCurrent,
          enabled: loaded,
        },
        {
          ic: '💬',
          label: t('Note'),
          hint: notesActive
            ? t('commenti ancorati a un momento della partita')
            : t('disponibili dopo aver generato il link'),
          type: 'toggle',
          kbd: 'N',
          get: () => get().notesVisible,
          set: setNotesVisible,
          enabled: notesActive,
        },
        {
          ic: '🔑',
          label: t('Server e token'),
          hint: shareReady() ? t('configurato') : t('servono per generare i link'),
          pref: true,
          on: openShareSettings,
        },
      ],
    },
    {
      title: t('Riproduzione'),
      items: [
        {
          ic: s.playing ? '❚❚' : '▶',
          label: s.playing ? t('Pausa') : t('Play'),
          kbd: t('Spazio'),
          on: togglePlay,
          enabled: loaded,
        },
        {
          ic: '⏱',
          label: t('Velocità'),
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
          label: t('Inizio partita'),
          kbd: 'Home',
          on: () => {
            pause();
            goTo(0);
          },
          enabled: loaded,
        },
        {
          ic: '⏭',
          label: t('Fine partita'),
          kbd: 'End',
          on: () => {
            pause();
            goTo(get().snaps.length - 1);
          },
          enabled: loaded,
        },
        {
          ic: '🔁',
          label: t("Play automatico all'apertura"),
          hint: t('altrimenti il replay parte in pausa'),
          pref: true,
          ...settingToggle('autoplay'),
        },
        {
          ic: '✨',
          label: t('Animazioni delle carte'),
          hint: t('life → mano, mano → campo, campo → trash…'),
          pref: true,
          ...settingToggle('anim'),
        },
      ],
    },
    {
      title: t('Vista'),
      items: [
        // la lingua: l'etichetta resta scritta in tutte e due, così la trova anche chi non legge quella scelta
        {
          ic: '🌐',
          label: 'Language · Lingua',
          pref: true,
          type: 'seg',
          opts: LANGUAGES,
          get: () => getSetting('lang'),
          set: (v) => setSetting('lang', v),
        },
        {
          ic: '👁',
          label: t("Mano dell'avversario"),
          pref: true,
          type: 'seg',
          kbd: 'H',
          opts: [
            ['all', t('tutte')],
            ['known', t('note')],
            ['hidden', t('coperte')],
          ],
          get: () => get().oppHand,
          set: setOppHand,
        },
        {
          ic: '🔍',
          label: vertical ? t('Anteprima carta') : t('Anteprima carta a destra'),
          hint: vertical ? t('tocca una carta per ingrandirla') : t('al passaggio del mouse'),
          pref: true,
          ...settingToggle('preview'),
        },
        {
          ic: '📜',
          label: t('Log degli eventi'),
          hint: t('pannello con tutte le mosse'),
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
                label: t('Fondo del mazzo'),
                hint: t('le carte che hai mandato sotto fin qui, coperte: B le scopre'),
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
      title: t('Strumenti'),
      items: [
        // nel layout verticale il pennarello si accende solo da qui (non c'è il suo pulsante sul tavolo): mette in pausa da sé
        {
          ic: '🖍',
          label: t('Pennarello'),
          hint: vertical
            ? t('disegna sul tavolo col dito; al Play si cancella')
            : t('solo in pausa; al Play si cancella'),
          kbd: 'D',
          on: () => {
            if (isVertical()) pause();
            toggleInk();
          },
          enabled: loaded,
        },
        {
          ic: '🧪',
          label: t('Verifiche di coerenza'),
          hint: t('confronta lo stato con i CHK del log'),
          on: toggleDebug,
          enabled: !!s.parsed,
        },
        // solo nell'exe: accende le funzioni ancora da provare (per ora il Memory Trainer, che compare nel menu principale)
        ...(isDesktop
          ? [
              {
                ic: '🧠',
                label: t('Funzioni in prova'),
                hint: t('Memory Trainer: allena la memoria sul fondo del mazzo'),
                pref: true,
                ...settingToggle('lab'),
              },
            ]
          : []),
      ],
    },
    {
      title: t('Aiuto'),
      items: [
        { type: 'keys' },
        {
          ic: '🌐',
          label: t('Sito e codice sorgente'),
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
