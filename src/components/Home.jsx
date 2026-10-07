// Menu di benvenuto: la prima schermata all'apertura, in stile videogioco. Titolo in alto e voci grandi,
// usabili anche da tastiera (↑ ↓ Invio, Esc torna indietro). Ha due sotto-schermate: Impostazioni e Tutorial.
// Aggiungere una voce = una riga in homeItems().
import { useEffect, useRef } from 'react';
import { useStore, get, set } from '../store.js';
import { cls } from '../lib/format.js';
import { isDesktop } from '../lib/platform.js';
import { hideHome, openLibrary } from '../game/view.js';
import { getTrainer, trainerLab } from '../trainer/bridge.js';
import { MenuRow, KeyList } from './menu/Menu.jsx';
import { settingsSections } from './menu/sections.js';
import { t } from '../i18n/index.js';
import { useT } from '../i18n/useT.js';

// Le voci del menu principale. show: false nasconde la voce.
function homeItems() {
  const loaded = get().snaps.length > 0;
  const goToPage = (page) => () => set({ homePage: page });
  return [
    { label: t('Continua'), hint: t('torna alla partita aperta'), on: hideHome, show: loaded },
    { label: t('Replay'), hint: t('tutte le tue partite, pronte da rivedere'), on: () => openLibrary('games') },
    { label: t('Stats'), hint: t('winrate per leader e per matchup'), on: () => openLibrary('stats') },
    {
      label: 'Memory Trainer',
      hint: t('ricorda le carte in fondo al mazzo'),
      on: () => getTrainer().open(),
      show: trainerLab(),
    },
    {
      label: t('Impostazioni'),
      hint: t('lingua, cartella dei log, riproduzione, condivisione'),
      on: goToPage('settings'),
    },
    { label: t('Tutorial'), hint: t('come funziona, in un minuto'), on: goToPage('tutorial') },
    { label: t('Esci'), on: () => window.close(), show: isDesktop },
  ].filter((item) => item.show !== false);
}

/**
 * I tasti quando il menu di benvenuto è aperto (li passa qui hooks/useKeyboard.js).
 * Una sola voce è scelta alla volta: mouse, frecce e Tab muovono la stessa selezione.
 */
export function homeKey(e) {
  const { homePage, homeSel, snaps, shareDlgOpen } = get();
  if (shareDlgOpen) return;
  if (e.key === 'Escape') {
    if (homePage !== 'main') set({ homePage: 'main' });
    else if (snaps.length) hideHome();
    return;
  }
  if (homePage !== 'main') return;
  const buttons = document.getElementById('home-nav').children;
  const direction = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
  if (direction) {
    e.preventDefault();
    const sel = (homeSel + direction + buttons.length) % buttons.length;
    set({ homeSel: sel });
    buttons[sel].focus();
  } else if (e.key === 'Enter' || e.code === 'Space') {
    e.preventDefault();
    buttons[Math.min(homeSel, buttons.length - 1)].click();
  }
}

export function Home() {
  const t = useT();
  const open = useStore((s) => s.homeOpen);
  const page = useStore((s) => s.homePage);
  const homeSel = useStore((s) => s.homeSel);
  // le voci dipendono da: partita aperta, funzioni in prova, Memory Trainer caricato
  useStore((s) => s.snaps.length > 0);
  useStore((s) => s.settings.lab);
  useStore((s) => s.trainerTick);
  useStore((s) => s.trainerReady);

  const items = homeItems();
  const sel = Math.min(homeSel, items.length - 1);
  const navRef = useRef(null);
  const rootRef = useRef(null);

  // cambiando schermata (o riaprendo il menu) il fuoco va sulla voce scelta, oppure su "Indietro"; non al primo avvio
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!open) return;
    const target =
      page === 'main' ? navRef.current.children[sel] : rootRef.current.querySelector('#home-' + page + ' .hback');
    if (target) target.focus();
  }, [open, page]);

  const back = () => set({ homePage: 'main' });

  return (
    <div id="home" className={open ? '' : 'hidden'} ref={rootRef}>
      <div className="bg">
        <div className="deco l">
          <i className="back" style={{ '--r': -24 }} />
          <i className="back" style={{ '--r': -8 }} />
          <i className="back" style={{ '--r': 8 }} />
        </div>
        <div className="deco r">
          <i className="back" style={{ '--r': -8 }} />
          <i className="back" style={{ '--r': 8 }} />
          <i className="back" style={{ '--r': 24 }} />
        </div>
      </div>
      <header>
        <h1>
          OPTCG <span>REPLAY</span>
        </h1>
        <p>{t('Rivedi le tue partite di OPTCGSim')}</p>
      </header>

      <nav id="home-nav" aria-label={t('Menu principale')} hidden={page !== 'main'} ref={navRef}>
        {items.map((item, i) => (
          <button
            key={item.label}
            className={cls(i === sel && 'sel')}
            style={{ '--i': i }}
            onClick={item.on}
            onMouseEnter={() => set({ homeSel: i })}
            onFocus={() => set({ homeSel: i })}
          >
            {item.label}
            {item.hint && <small>{item.hint}</small>}
          </button>
        ))}
      </nav>

      <section className="hsub" id="home-settings" hidden={page !== 'settings'}>
        <header>
          <button className="hback" onClick={back}>
            {t('‹ Indietro')}
          </button>
          <h2>{t('Impostazioni')}</h2>
        </header>
        <div className="body">{page === 'settings' && <SettingsRows />}</div>
      </section>

      <section className="hsub" id="home-tutorial" hidden={page !== 'tutorial'}>
        <header>
          <button className="hback" onClick={back}>
            {t('‹ Indietro')}
          </button>
          <h2>{t('Tutorial')}</h2>
        </header>
        <div className="body">
          <ol className="steps">
            <TutorialStep title={t('Scegli la cartella dei log')}>
              {t(
                'Indica una volta la cartella dove OPTCGSim salva i combat log: le partite nuove compaiono da sole. In alternativa trascina un file .log nella finestra.',
              )}
            </TutorialStep>
            <TutorialStep title={t('Apri una partita')}>
              {t(
                "In Replay c'è una riga per partita: data, leader, chi ha iniziato, turni ed esito. Un click e il replay parte.",
              )}
            </TutorialStep>
            <TutorialStep title={t('Rivedila mossa per mossa')}>
              {t(
                'Spazio per play e pausa, le frecce per andare avanti e indietro di una mossa, la barra in basso per saltare a un turno. In pausa puoi scarabocchiare sul tavolo con il pennarello.',
              )}
            </TutorialStep>
            <TutorialStep title={t('Guarda i numeri')}>
              {t(
                'In Stats trovi il winrate di ogni tuo leader contro ogni leader avversario, diviso anche tra partite iniziate da primo e da secondo.',
              )}
            </TutorialStep>
            <TutorialStep title={t('Condividi e commenta')}>
              {t(
                'Genera link crea una pagina pubblica del replay: chi la apre può lasciare note su un momento preciso della partita. Serve un token personale, che si imposta in Impostazioni.',
              )}
            </TutorialStep>
          </ol>
          <h3>{t('Tasti durante il replay')}</h3>
          <KeyList />
        </div>
      </section>

      <footer>
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> {t('scegli')}
        </span>
        <span>
          <kbd>{t('Invio')}</kbd> {t('conferma')}
        </span>
        <span>
          <kbd>Esc</kbd> {t('indietro')}
        </span>
      </footer>
    </div>
  );
}

// Le impostazioni sono le stesse voci del menu laterale segnate con pref: true.
function SettingsRows() {
  useStore(); // si ridisegnano a ogni cambiamento, come il menu
  return settingsSections().map((section) => <SettingsSection key={section.title} section={section} />);
}
function SettingsSection({ section }) {
  return (
    <>
      <h3>{section.title}</h3>
      {section.items.map((item) => (
        <MenuRow key={item.label} item={item} />
      ))}
    </>
  );
}

function TutorialStep({ title, children }) {
  return (
    <li>
      <div>
        <b>{title}</b>
        <span>{children}</span>
      </div>
    </li>
  );
}
