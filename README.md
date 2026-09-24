# OPTCG Replay — visualizzatore di replay per OPTCGSim

Pagina web singola, senza installazione: apri `index.html` nel browser (doppio click) e trascina dentro il combat log `.log` scaricato da OPTCGSim. Il replay parte da solo.

## Controlli
| Azione | Pulsante | Tasto |
|---|---|---|
| Menu (partita, riproduzione, vista, strumenti, aiuto) | ☰ Menu | M (Esc chiude) |
| Play / Pausa | ▶ Play / ❚❚ Pausa | Spazio |
| Mossa precedente / successiva | ◀ Prec / Succ ▶ | ← / → |
| Inizio / fine partita | | Home / End |
| Velocità | menu 0.5× … 3× | |
| Salta a un turno | menu "Turno N" o slider | |
| Mano dell'avversario: tutte, solo quelle note, coperte | Mano avv | H |
| Lista trash | click sulla pila del trash | |
| Pennarello per scarabocchiare sul tavolo (solo in pausa; al Play si cancella) | icona pennarello a destra | D |
| Log degli eventi (pannello a scomparsa) | Log | L |
| Verifiche di coerenza | Debug (dentro il pannello Log) | |

Il menu ☰ (in basso a sinistra, o tasto M) raccoglie tutto in un pannello: scheda della partita (giocatori, leader, turni, esito), apertura di log e cartella con la lista dei log recenti, play/velocità/inizio/fine, e le impostazioni salvate nel browser: play automatico all'apertura, animazioni delle carte, mano dell'avversario, anteprima carta, log degli eventi. In fondo l'elenco dei tasti.

Prec / Succ mettono in pausa. Ogni passo è una riga evento del log (deploy, rest, attacco, pesca, danno...). Nel pannello a sinistra si può cliccare qualsiasi evento per saltarci.

## Layout
Riproduce il tavolo di OPTCGSim: mano dell'avversario in alto, mano tua in basso, in mezzo il tappetino con il lato avversario ruotato di 180°, Cost Area (DON), Character Area, leader, stage, deck, life e trash nelle stesse posizioni del simulatore. Le dimensioni delle carte si adattano all'altezza della finestra. Durante un attacco una freccia rossa collega l'attaccante al bersaglio e le potenze (base + DON) compaiono in rosa sulle due carte. I DON attaccati stanno sotto la carta con l'etichetta DON!! ×N, il leader di chi è di turno ha un alone bianco, gli spostamenti (life → mano, deck → mano, mano → campo, campo → trash) sono animati. Passando col mouse su una carta compare ingrandita nella colonna di destra. A fine partita compare YOU WIN / YOU LOSE (concessione, danno letale, oppure abbandono/disconnessione segnalati come esito probabile).

## Carte note
In modalità "Mano avv: note" la mano dell'avversario mostra scoperte solo le carte che hai potuto vedere: rivelate da un effetto (Reveal and Draw), tornate in mano dal campo o recuperate dal trash. Le carte pescate o prese dalla Life restano coperte. Una carta smette di essere nota quando esce dalla mano. Le carte note hanno un bordo giallo e un'etichetta con il motivo, anche nella tua mano: così vedi cosa conosce l'avversario.

## File
- `index.html` — tutto il programma (parser del log, motore di stato, interfaccia).
- `don.jpg` — immagine della carta DON!! (fornita da Leo).
- `cards_meta.js` — nome / costo / potenza / counter per ogni carta (tooltip al passaggio del mouse). Se manca, funziona lo stesso.
- `Esempio COmbat log/` — un log di prova.
- `test/core.test.mjs` - test di parser ed engine sul log di esempio.

## Immagini delle carte
Vengono scaricate al volo (e messe in cache dal browser) da dotgg, con fallback su Limitless. dotgg viene prima perché ha la scritta SAMPLE solo su una parte delle carte recenti, mentre Limitless ce l'ha su tutte. Se nessuna delle due ha l'immagine (per esempio le promo da P-120 a P-134) la carta viene mostrata con il nome. Il sito ufficiale Bandai non è utilizzabile: manda l'header `Cross-Origin-Resource-Policy: same-site` e il browser blocca le sue immagini da qualsiasi altro sito.

## Parametri URL (opzionali, servono se la pagina è servita via http)
- `?log=<url del log>` carica un log automaticamente (es. `python -m http.server` nella cartella e poi `http://localhost:8000/index.html?log=Esempio%20COmbat%20log/....log`).
- `&step=N` salta allo step N in pausa.
- `?debug` apre subito il pannello delle verifiche.

## Formato log (per chi vuole modificare il parser)
Il log ha righe testuali (`[You] Deploy X ["ID">ID]`, `A [8000] vs B [6000]`, ...) e righe `RZ1|seq|player|carta|daZona|daIdx|aZona|aIdx|f1|f2|f3|0|0` che spostano una carta tra zone (0 deck, 1 mano, 2 personaggi, 3 life, 4 DON deck, 5 DON attivi, 6 trash, 7 stage, 9 DON attaccati; `aIdx = slot*100+n` sui personaggi, `9900+n` sul leader). `RZ1|CHK|...` porta i conteggi per verifica. Lo stato "riposato" di personaggi e leader non è nelle righe RZ1 e viene dedotto dal testo; il refresh di inizio turno non è loggato e viene sintetizzato.

## Online
Sito: https://leobacca.github.io/optcg-replay-viewer/ — repo: https://github.com/LeoBacca/optcg-replay-viewer. Ogni push su `main` aggiorna il sito in un minuto circa.

## Per chi collabora
Non serve nessun tool: si modifica `index.html` e si apre nel browser. Il file è diviso in tre blocchi:
1. `<style>` — tutto il CSS. Le misure delle carte partono dalle variabili `--ch` (altezza carta in campo) e `--hch` (in mano) definite in `:root`.
2. `<script id="core">` — **Parser** (log → lista di step) e **Engine** (step → stato del tavolo, uno snapshot per step). Non tocca il DOM: si può testare in node estraendo il blocco.
3. secondo `<script>` — **Renderer** (stato → DOM del tappetino), **Controller** (play/pausa/step), **Menu** (pannello ☰), **Loader** (file, cartella, immagini).

Per aggiungere una feature al menu basta una riga in `SECTIONS()` dentro il modulo `Menu`: `{ ic, label, hint, kbd, on }` per un'azione, `type:'toggle'` con `get`/`set` per un interruttore, `type:'seg'` con `opts` per una scelta tra pochi valori. Le impostazioni che devono sopravvivere al riavvio passano da `Settings` (`get`/`set`, salvate in `localStorage` sotto `optcg.settings`, default in `DEF`, effetto immediato in `apply`).

Per lavorare in due: ognuno su un branch, poi pull request su `main`. Prima di aprire la PR:
- `node --test` (Node 18 o successivo, nessuna dipendenza): esegue parser ed engine sul log di esempio;
- provare il log di esempio con il pannello Debug (tasto L → Debug): deve dire "nessuna incoerenza".

## App per Windows (eseguibile)
Stessa pagina dentro una finestra nativa (Electron), con accesso vero ai file: scegli la cartella dei log una volta e l'app la riapre da sola a ogni avvio, senza conferme; quando il sim salva un log nuovo compare subito in lista.
- Scarica `OPTCG-Replay-portable.exe` dalle Releases di GitHub: nessuna installazione, doppio click e parte.
- Avvio con `--open-latest` apre subito l'ultima partita.

Per gli sviluppatori (cartella `desktop/`):
```
cd desktop
npm install          # una volta
npm start            # copia index.html in app/ e avvia l'app
npm run build        # produce dist/OPTCG-Replay-portable.exe e l'installer
```
`main.js` è il processo nativo (finestra, cartella, watcher dei file), `preload.js` espone `window.desktop` alla pagina, `sync.js` copia i file web in `app/`. La pagina rileva `window.desktop` e usa quello al posto della File System Access API del browser; il codice del replay è identico.
Nota: se nell'ambiente c'è la variabile `ELECTRON_RUN_AS_NODE` (es. terminale di VS Code) l'app non parte: lanciare con `env -u ELECTRON_RUN_AS_NODE npm start`.
