// Lettura del testo di una riga del log: i riferimenti alle carte e il testo ripulito dai tag.
import { REF_G, TAGS, ZWSP } from './log-format.js';

export function refs(text) {
  const out = [];
  let m;
  REF_G.lastIndex = 0;
  text = text.replace(TAGS, '');
  while ((m = REF_G.exec(text))) {
    // il gruppo 1 cattura anche il testo tra un riferimento e il precedente: tolgo verbi e prefissi
    let name = m[1]
      .replace(/^[:\s]+/, '')
      .replace(/^\[\d+\]\s*vs\s+/, '')
      .replace(
        /^(?:Deploy|Rest|Trash|Destroy|Return|Buff|Discard|Set|Reveal and Draw|Attach \d+ Don to|Drew card from deck:|Leader is|attacking)\s+/i,
        '',
      );
    out.push({ name: name.trim(), id: m[2], raw: m[0] });
  }
  return out;
}
export function clean(text) {
  return text
    .replace(TAGS, '')
    .replace(/ \["([A-Za-z0-9\-_]+)">\1\]/g, '')
    .replace(ZWSP, '')
    .trim();
}
export function stripName(s) {
  return s.replace(ZWSP, '').trim();
}
