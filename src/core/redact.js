// Condivisione: la copia del log che viene caricata sul server, senza chat e senza il nick dell'avversario.
import { lastGame } from './last-game.js';
import { parseLog } from './parser/index.js';

// Sostituisce sul posto, senza togliere righe: i numeri di riga restano quelli del file originale,
// così una nota ancorata a una riga cade nello stesso punto sul log condiviso e su quello locale.
export function redact(text) {
  // delle partite precedenti nello stesso file (AutoSaved) restano solo le righe vuote
  const lines = text.split(/\r?\n/),
    game = lastGame(lines);
  if (game.from || game.to < lines.length)
    text = lines.map((l, i) => (i < game.from || i >= game.to ? '' : l)).join('\n');
  let out = text.replace(/^(\[[^\]]+\] ?<b><size=\d+>).*(<\/size><\/b>)(?=[ \t]*\r?$)/gm, '$1…$2');
  const { nameMap } = parseLog(text);
  const esc = (ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const name in nameMap) {
    if (nameMap[name] !== 2) continue;
    // nel log il nick ha caratteri invisibili tra le lettere (nameMap li ha già tolti)
    const loose = name.split('').map(esc).join('[\\u200B-\\u200D\\uFEFF]*');
    // un nick con #numero è unico e si può cercare ovunque; uno qualsiasi solo come autore della riga
    out = /#\d+$/.test(name)
      ? out.replace(new RegExp(loose, 'g'), 'Avversario')
      : out.replace(
          new RegExp('^\\[[\\u200B-\\u200D\\uFEFF]*' + loose + '[\\u200B-\\u200D\\uFEFF]*\\]', 'gm'),
          '[Avversario]',
        );
  }
  return out;
}
