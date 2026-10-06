// Il foglio trasparente sopra il tavolo su cui si disegna con il pennarello (solo in pausa; al Play si cancella).
// I comandi (colore, spessore, gomma) stanno nella colonna destra: vedi Marker in RightColumn.jsx.
import { useEffect, useRef } from 'react';
import { useStore } from '../store.js';
import { cls } from '../lib/format.js';

export function Ink() {
  const inkOn = useStore((s) => s.inkOn);
  const tool = useStore((s) => s.inkTool);
  const inkClear = useStore((s) => s.inkClear);
  const playing = useStore((s) => s.playing);

  const canvasRef = useRef(null);
  // il tratto in corso: l'ultimo punto toccato, o null se non si sta disegnando
  const lastPoint = useRef(null);
  // gli strumenti letti dai gestori del puntatore, sempre aggiornati
  const toolRef = useRef(tool);
  toolRef.current = tool;

  // porta la risoluzione del foglio a quella dello schermo (cambiandola, il disegno si cancella: lo fa il browser)
  function fit() {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(r.width * dpr);
    const height = Math.round(r.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  function clear() {
    fit();
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  function point(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function stroke(a, b) {
    const { color, size, eraser } = toolRef.current;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // la gomma non disegna: toglie quello che c'è sotto, con un tratto più largo
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = eraser ? size * 4 : size;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // "Cancella" e il Play puliscono il foglio
  useEffect(() => {
    if (inkClear || playing) clear();
  }, [inkClear, playing]);

  // all'accensione e quando la finestra cambia misura il foglio si riadatta
  useEffect(() => {
    if (!inkOn) return;
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [inkOn]);

  const stop = () => {
    lastPoint.current = null;
  };

  return (
    <canvas
      id="ink"
      ref={canvasRef}
      className={cls(inkOn && 'active', inkOn && tool.eraser && 'eraser')}
      onPointerDown={(e) => {
        if (!inkOn) return;
        fit();
        const p = point(e);
        lastPoint.current = p;
        // un puntino, per chi tocca senza trascinare
        stroke(p, { x: p.x + 0.01, y: p.y });
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!lastPoint.current) return;
        const p = point(e);
        stroke(lastPoint.current, p);
        lastPoint.current = p;
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
    />
  );
}
