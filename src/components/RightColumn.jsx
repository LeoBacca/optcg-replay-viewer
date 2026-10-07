// Colonna destra: il pulsante del pennarello con i suoi strumenti, e l'anteprima grande della carta.
// (Nell'exe il Memory Trainer aggiunge qui sotto il pannello "Fondo del mazzo".)
import { useEffect, useState } from 'react';
import { useStore, set, get } from '../store.js';
import { metaOf, logName } from '../lib/cards.js';
import { cls } from '../lib/format.js';
import { isVertical } from '../lib/platform.js';
import { toggleInk, closePreview } from '../game/view.js';
import { useCardImage } from './useCardImage.js';
import { useT } from '../i18n/useT.js';

const COLORS = ['#e5322d', '#2b7bff', '#f5d000', '#2ecc71', '#ffffff', '#111111'];
// [spessore del tratto, diametro del pallino sul pulsante, nome (in italiano: lo traduce t() al momento di mostrarlo)]
const SIZES = [
  [3, 6, 'Fine'],
  [6, 11, 'Medio'],
  [12, 18, 'Grosso'],
];
const sizeName = (t, name) => (name === 'Fine' ? t('Fine') : name === 'Medio' ? t('Medio') : t('Grosso'));

export function RightColumn() {
  return (
    <div id="right">
      <Marker />
      <Preview />
    </div>
  );
}

// Il pennarello si usa solo in pausa; il disegno vero e proprio lo fa Ink.jsx, qui ci sono solo i comandi.
function Marker() {
  const t = useT();
  const inkOn = useStore((s) => s.inkOn);
  const playing = useStore((s) => s.playing);
  const tool = useStore((s) => s.inkTool);
  const inkHint = useStore((s) => s.inkHint);
  const setTool = (change) => set({ inkTool: { ...get().inkTool, ...change } });

  // "Metti in pausa per disegnare": compare per un attimo quando si prova ad accenderlo durante il Play
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!inkHint) return;
    setHint(true);
    const timer = setTimeout(() => setHint(false), 1800);
    return () => clearTimeout(timer);
  }, [inkHint]);

  return (
    <div id="marker">
      <button
        id="btn-marker"
        title={t('Pennarello (D) — solo in pausa')}
        className={cls(inkOn && 'on', playing && 'disabled')}
        onClick={toggleInk}
      >
        <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
          <g transform="rotate(-40 32 32)">
            <rect x="26" y="4" width="12" height="30" rx="2" fill="#e5322d" />
            <rect x="24" y="2" width="16" height="6" rx="2" fill="#a8201c" />
            <rect x="26" y="34" width="12" height="10" fill="#f3f3f3" />
            <polygon points="26,44 38,44 34,56 30,56" fill="#e5322d" />
            <polygon points="30,56 34,56 32,62" fill="#7a1512" />
          </g>
        </svg>
      </button>
      <div id="marker-menu" className={inkOn ? 'show' : ''}>
        <div className="colors">
          {COLORS.map((color) => (
            <button
              key={color}
              className={cls('col', tool.color === color && 'sel')}
              style={{ background: color }}
              // scegliere un colore spegne la gomma
              onClick={() => setTool({ color, eraser: false })}
            />
          ))}
        </div>
        <div className="sizes">
          {SIZES.map(([size, dot, name]) => (
            <button
              key={size}
              className={cls('sz', tool.size === size && 'sel')}
              title={sizeName(t, name)}
              onClick={() => setTool({ size })}
            >
              <i style={{ width: dot + 'px', height: dot + 'px' }} />
            </button>
          ))}
        </div>
        <button
          id="mk-eraser"
          title={t('Gomma')}
          className={tool.eraser ? 'sel' : ''}
          onClick={() => setTool({ eraser: !tool.eraser })}
        >
          🧽 {t('Gomma')}
        </button>
        <button id="mk-clear" title={t('Cancella tutto')} onClick={() => set({ inkClear: get().inkClear + 1 })}>
          🗑 {t('Cancella')}
        </button>
        <button id="mk-close" title={t('Chiudi pennarello')} onClick={() => set({ inkOn: false })}>
          ✕ {t('Chiudi')}
        </button>
        <div className="hint">{t('Disegna sul tavolo. Al Play gli scarabocchi spariscono.')}</div>
      </div>
      <div id="marker-hint" className={hint ? 'show' : ''}>
        {t('Metti in pausa per disegnare')}
      </div>
    </div>
  );
}

// L'anteprima grande: compare passando il mouse su una carta (o toccandola, nel layout verticale).
function Preview() {
  const t = useT();
  const preview = useStore((s) => s.preview);
  const meta = preview.id ? metaOf(preview.id) : null;
  const info = !preview.id
    ? ''
    : (meta ? meta.name : logName(preview.id)) +
      (meta && meta.cost ? ' · ' + t('costo {n}', { n: meta.cost }) : '') +
      (meta && meta.power ? ' · ' + meta.power : '') +
      (meta && meta.counter ? ' · counter ' + meta.counter : '') +
      ' · ' +
      preview.id;

  return (
    <div
      id="preview"
      className={preview.show ? 'show' : ''}
      // nel layout verticale copre il tavolo: un tocco la chiude
      onClick={() => {
        if (isVertical()) closePreview();
      }}
    >
      {preview.id ? <PreviewImage key={preview.id} id={preview.id} /> : <img alt="" />}
      <div className="pinfo">{info}</div>
    </div>
  );
}

function PreviewImage({ id }) {
  const image = useCardImage(id);
  return <img alt="" src={image.src} onLoad={image.onLoad} onError={image.onError} />;
}
