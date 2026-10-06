// La freccia rossa dall'attaccante al difensore.
// Va misurata sul DOM dopo che le carte sono al loro posto, quindi è una funzione che disegna dentro l'<svg>, non un componente.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {SVGElement} svg        l'elemento #arrows, grande quanto il tavolo
 * @param {Element} boardEl       il tavolo (#board): le coordinate della freccia sono relative a lui
 * @param {Element|null} fromEl   la carta che attacca
 * @param {Element|null} toEl     la carta attaccata; se una delle due manca la freccia sparisce
 */
export function drawArrow(svg, boardEl, fromEl, toEl) {
  svg.replaceChildren();
  if (!fromEl || !toEl) return;
  const b = boardEl.getBoundingClientRect();
  const r1 = fromEl.getBoundingClientRect();
  const r2 = toEl.getBoundingClientRect();
  if (!r1.width || !r2.width) return;

  // dal centro della prima carta al centro della seconda
  const x1 = r1.left + r1.width / 2 - b.left;
  const y1 = r1.top + r1.height / 2 - b.top;
  const x2 = r2.left + r2.width / 2 - b.left;
  const y2 = r2.top + r2.height / 2 - b.top;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // la punta si ferma sul bordo della carta attaccata, non al suo centro
  const stop = Math.min(len - 6, Math.max(r2.width, r2.height) / 2 + 2);
  const ex = x1 + ux * (len - stop);
  const ey = y1 + uy * (len - stop);

  // con le carte piccole (telefono) la freccia si assottiglia in proporzione
  const k = Math.max(0.5, Math.min(1, Math.min(r1.width, r1.height) / 80));
  const headLength = 26 * k;
  const headWidth = 16 * k;
  const bx = ex - ux * headLength;
  const by = ey - uy * headLength;

  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', `M${x1},${y1} L${bx},${by}`);
  line.style.strokeWidth = 7 * k;
  const head = document.createElementNS(SVG_NS, 'polygon');
  head.setAttribute('class', 'head');
  head.setAttribute(
    'points',
    `${ex},${ey} ${bx - uy * headWidth},${by + ux * headWidth} ${bx + uy * headWidth},${by - ux * headWidth}`,
  );
  svg.append(line, head);
}
