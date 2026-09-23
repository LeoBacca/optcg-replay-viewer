// Copia la pagina web (index.html, cards_meta.js, don.jpg) dentro desktop/app prima di avviare o compilare.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'app');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['index.html', 'cards_meta.js', 'don.jpg']) fs.copyFileSync(path.join(src, f), path.join(dst, f));
console.log('app/ aggiornata');
