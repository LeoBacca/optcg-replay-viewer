// Copia la pagina web (index.html, cards_meta.js, don.jpg, cardback.jpg) dentro desktop/app prima di avviare o compilare,
// più il Memory Trainer, che esiste solo nell'app.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'app');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['index.html', 'cards_meta.js', 'don.jpg', 'cardback.jpg']) fs.copyFileSync(path.join(src, f), path.join(dst, f));
for (const f of ['trainer.js', 'trainer.css']) fs.copyFileSync(path.join(__dirname, f), path.join(dst, f));
console.log('app/ aggiornata');
