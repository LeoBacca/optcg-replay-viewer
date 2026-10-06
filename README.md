# OPTCG Replay — visualizzatore di replay per OPTCGSim

Pagina web, senza installazione: apri il sito (vedi "Online") e trascina dentro il combat log `.log` scaricato da OPTCGSim. Il replay parte da solo. Per Windows c'è anche un eseguibile, che in più legge da solo la cartella dei log.

La pagina è scritta in React e compilata con Vite: il codice sta in `src/`, diviso per argomento (vedi "Com'è fatto il codice").

## Menu di benvenuto
All'apertura compare un menu in stile videogioco: il nome dell'app in alto e le voci Replay (la raccolta delle partite), Stats (le statistiche per matchup), Impostazioni (cartella dei log, server e token, velocità, play automatico, animazioni, mano dell'avversario, anteprima carta) e Tutorial (come funziona, in cinque passi, più l'elenco dei tasti). Con una partita aperta c'è anche Continua, nell'app per Windows anche Esci. Si usa con il mouse o con ↑ ↓ e Invio; Esc torna indietro. Ci si torna da "‹ Menu" nella raccolta o da "Menu principale" nel menu ☰. I link condivisi (`?r=`), `?log=` e `--open-latest` lo saltano e aprono subito il replay.

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
| Raccolta delle partite e statistiche | Raccolta | |
| Link pubblico al replay | Genera link / Copia link | |
| Note sul replay condiviso | Note | N |
| Verifiche di coerenza | Debug (dentro il pannello Log) | |

Il menu ☰ (in basso a sinistra, o tasto M) raccoglie tutto in un pannello: scheda della partita (giocatori, leader, turni, esito), apertura di log e cartella con la lista dei log recenti, play/velocità/inizio/fine, e le impostazioni salvate nel browser: play automatico all'apertura, animazioni delle carte, mano dell'avversario, anteprima carta, log degli eventi. In fondo l'elenco dei tasti.

Prec / Succ mettono in pausa. Ogni passo è una riga evento del log (deploy, rest, attacco, pesca, danno...). Nel pannello a sinistra si può cliccare qualsiasi evento per saltarci.

## Layout
Riproduce il tavolo di OPTCGSim: mano dell'avversario in alto, mano tua in basso, in mezzo il tappetino con il lato avversario ruotato di 180°, Cost Area (DON), Character Area, leader, stage, deck, life e trash nelle stesse posizioni del simulatore. Le dimensioni delle carte si adattano all'altezza della finestra. Durante un attacco una freccia rossa collega l'attaccante al bersaglio e le potenze (base + DON) compaiono in rosa sulle due carte; se un personaggio blocca, la freccia passa dal primo bersaglio a lui. I DON attaccati stanno sotto la carta con l'etichetta DON!! ×N, il leader di chi è di turno ha un alone bianco, gli spostamenti (life → mano, deck → mano, mano → campo, campo → trash) sono animati. Un evento giocato dalla mano (anche un counter in combattimento) resta accanto al leader con l'etichetta "in risoluzione" finché i suoi effetti non sono finiti, poi va nel trash. Quando un effetto guarda le prime carte del mazzo (Perona, Otama) compare nella colonna di sinistra, accanto alla mano di chi guarda, un riquadro con tutte le carte viste, nell'ordine in cui stavano in cima: quella scelta va in mano, le altre volano in fondo al mazzo. Quelle dell'avversario in partita non si vedevano: si coprono mettendo "Mano avv" su note o coperte. Passando col mouse su una carta compare ingrandita nella colonna di destra. A fine partita compare YOU WIN / YOU LOSE (concessione, danno letale, oppure abbandono/disconnessione segnalati come esito probabile).

### Sul telefono (layout verticale)
Quando la finestra è più alta che larga (un telefono in verticale, o comunque sotto i 700px di larghezza) la pagina si dispone in colonna: mano dell'avversario, tappetino, mano tua, barra dei comandi. Le carte si dimensionano per far stare tutto nello schermo senza scorrere; se avanza altezza, va alle mani. La barra tiene solo l'essenziale: testo della mossa, scorrimento, turno, ☰, ◀, Play, ▶ e Note. Velocità, mano dell'avversario, log, link e raccolta restano nel menu ☰.

Cosa cambia rispetto al layout largo:
- toccando una carta la si vede a tutto schermo, e intanto il replay aspetta; un altro tocco la chiude. Nel trash, che si apre toccandolo, un tocco ingrandisce la carta dentro l'elenco
- note e log sono pannelli che salgono dalla barra, uno alla volta. Il log si apre anche toccando il testo della mossa. Aprendo un link condiviso le note restano chiuse: le annunciano il conteggio sul pulsante e i fumetti. Toccata una nota, il pannello si chiude e resta il fumetto
- le carte guardate in cima al mazzo compaiono sopra la riga dei DON di chi guarda, attaccate alla sua mano
- il pennarello si accende dal menu (mette in pausa da sé) e i suoi strumenti stanno in una riga in alto

Il telefono in orizzontale usa il layout largo, che su uno schermo così basso resta stretto: va tenuto in verticale.

## Carte note
In modalità "Mano avv: note" la mano dell'avversario mostra scoperte solo le carte che hai potuto vedere: rivelate da un effetto (Reveal and Draw), tornate in mano dal campo o recuperate dal trash. Le carte pescate o prese dalla Life restano coperte. Una carta smette di essere nota quando esce dalla mano. Le carte note hanno un bordo giallo e un'etichetta con il motivo, anche nella tua mano: così vedi cosa conosce l'avversario.

## Raccolta e statistiche
Scelta la cartella dei log, la voce Replay del menu di benvenuto apre la raccolta: una riga per partita con data, il tuo leader, il leader e il nick dell'avversario, chi ha iniziato, turni ed esito (V, S, oppure V?/S? quando l'esito è solo probabile, – quando il log finisce prima della fine). Si filtra per tuo leader, leader avversario ed esito. La scheda Statistiche mostra, per ogni tuo leader, il winrate contro ogni leader avversario, anche diviso tra partite iniziate da primo e da secondo; un click su un matchup mostra le sue partite. Gli esiti incerti o mancanti sono contati a parte e non entrano nel winrate.

Nel browser la cartella si sceglie con la File System Access API (Chrome ed Edge), che la ricorda tra un'apertura e l'altra. Chrome però non lascia scegliere le cartelle di sistema, e su Mac i log del sim stanno lì (sotto `~/Library`); Safari e Firefox non hanno proprio quella finestra. Per questi casi nella raccolta c'è "apri i log di una cartella": usa la finestra classica dei file, legge tutti i `.log` della cartella scelta e la raccolta funziona uguale, ma la cartella non viene ricordata e va riscelta a ogni apertura. Nell'app per Windows il problema non c'è.

"Tu" sei sempre chi ha scaricato il log (`[You]`). Ogni log viene analizzato una volta sola: il riepilogo resta in cache nel browser (IndexedDB), quindi alle aperture successive si leggono solo i file nuovi.

## Link condivisi e note
"Genera link" (sulla riga della raccolta, nella barra in basso o nel menu) carica il replay sul server e copia negli appunti un indirizzo che chiunque può aprire nel browser. Nella copia caricata i messaggi di chat diventano "…" e il nick dell'avversario diventa "Avversario"; il file sul tuo computer non viene toccato.

Chi apre il link può lasciare note: si ferma su un momento della partita, scrive il testo e il proprio nome. Ogni nota compare nell'elenco a sinistra con il turno, come segnalino sulla barra di scorrimento e come fumetto quando la riproduzione ci passa sopra; un click sulla nota porta a quel momento. Riaprendo la stessa partita nell'app le note vengono scaricate e mostrate allo stesso modo. Chi ha caricato il replay può eliminare le note.

Per generare i link serve un token personale (menu ☰ → Server e token), che dà chi gestisce il server. Leggere un replay e scrivere note non richiede nulla. Nell'app per Windows il token si può preconfigurare, senza incollarlo, aggiungendo `"share": { "base": "https://…", "token": "…" }` al file `%APPDATA%\OPTCG Replay\settings.json`.

## File
- `index.html` — lo scheletro della pagina: un contenitore vuoto in cui React disegna tutto.
- `src/` — il codice della pagina (vedi "Com'è fatto il codice").
- `src/assets/don.jpg` — immagine della carta DON!! (fornita da Leo).
- `src/assets/cardback.jpg` — dorso delle carte (fornito da Leo): mazzo, life, mano coperta dell'avversario.
- `public/cards_meta.js` — nome / costo / potenza / counter per ogni carta (anteprima della carta, potenze in combattimento, nomi dei leader). È una tabella generata. Se manca, funziona lo stesso.
- `package.json`, `vite.config.js` — comandi e configurazione della compilazione.
- `dist/` — la pagina compilata (la crea `npm run build`, non sta nel repo).
- `.github/workflows/pages.yml` — pubblica il sito su GitHub Pages a ogni push su `main`.
- `server/` — server dei replay condivisi (vedi sotto).
- `desktop/` — app per Windows (vedi in fondo).
- `test/esempio.log` — un log di prova: è la partita su cui girano i test.
- `test/core.test.mjs` — test di parser ed engine sul log di esempio.
- `test/server.test.mjs` — test del server su una cartella dati temporanea.
- `test/trainer.test.mjs` — test del Memory Trainer e del fondo del mazzo nel motore.
- `tools/dubbi.mjs` — passa una cartella di log e stampa incoerenze e dubbi (vedi "Regole per carta e dubbi").
- `tools/ui-check.mjs`, `test/golden/board.json` — l'allarme sul tappetino e la sua foto di riferimento (vedi "Per chi collabora").

## Server dei replay condivisi
`server/server.js` è un server Node senza dipendenze: serve la pagina compilata (la cartella `dist/`, quindi prima va lanciato `npm run build`) e una piccola API, e tiene i dati su file.
```
DATA_DIR=/percorso/dati node server/token.js add Leo    # crea un token e lo stampa una volta sola
DATA_DIR=/percorso/dati PORT=8787 node server/server.js  # ascolta su 127.0.0.1:8787
```
Variabili: `DATA_DIR` (predefinita `server/data`), `PORT`, `HOST`, `PUBLIC_URL` (l'indirizzo pubblico da mettere nei link; se manca si usa quello della richiesta). `token.js list` elenca i token, `token.js remove <nome>` li revoca; sul disco resta solo l'impronta del token.

| Rotta | Chi | Cosa fa |
|---|---|---|
| `POST /api/replays` | token | carica un log (max 2 MB); lo stesso log dallo stesso token restituisce lo stesso link |
| `GET /api/replays/:id` | tutti | log e note |
| `POST /api/replays/:id/notes` | tutti | aggiunge una nota `{author, text, line}` (max 500 caratteri, 200 note per replay, 10 al minuto per indirizzo) |
| `DELETE /api/replays/:id`, `DELETE /api/replays/:id/notes/:nota` | chi ha caricato | elimina il replay o una nota |
| `GET /api/me` | token | verifica il token |

Messa in linea su una macchina Linux (cartella `server/deploy/`):
```
git clone https://github.com/LeoBacca/optcg-replay-viewer.git ~/optcg-replay && cd ~/optcg-replay
PUBLIC_URL=https://<ip-con-trattini>.sslip.io bash server/deploy/setup.sh   # senza sudo: Node nella home, servizio utente su 127.0.0.1:8790
sudo bash server/deploy/caddy.sh <ip-con-trattini>.sslip.io                 # HTTPS con Caddy davanti (porte 80 e 443 aperte)
```
Per aggiornare: `git pull`, poi `npm ci && npm run build` per ricompilare la pagina (con il Node installato da `setup.sh`: `PATH=~/.local/opt/node/bin:$PATH`) e `systemctl --user restart optcg-replay`. In alternativa si rilancia `setup.sh`, che fa tutto ma riscrive il servizio: `PUBLIC_URL` va ripassato. I dati stanno in `~/optcg-replay-data` (basta copiare quella cartella per averne un salvataggio). L'indirizzo predefinito nell'app è `SHARE_SERVER` in `src/game/share.js`.

Le note sono ancorate al numero di riga del log e non all'indice dello step: il log non cambia mai, mentre gli step si spostano quando il parser viene corretto. Per questo l'oscuramento di chat e nick sostituisce il testo sul posto senza togliere righe.

## Immagini delle carte
Vengono scaricate al volo (e messe in cache dal browser) da dotgg, con fallback su Limitless. dotgg viene prima perché ha la scritta SAMPLE solo su una parte delle carte recenti, mentre Limitless ce l'ha su tutte. Se nessuna delle due ha l'immagine (per esempio le promo da P-120 a P-134) la carta viene mostrata con il nome. Il sito ufficiale Bandai non è utilizzabile: manda l'header `Cross-Origin-Resource-Policy: same-site` e il browser blocca le sue immagini da qualsiasi altro sito.

## Parametri URL (opzionali, servono se la pagina è servita via http)
- `?r=<id>` apre un replay condiviso (solo quando la pagina è servita dal server dei replay).
- `?log=<url del log>` carica un log automaticamente (es. `npm run dev` e poi `http://localhost:5173/?log=test/esempio.log`).
- `&step=N` salta allo step N in pausa.
- `?debug` apre subito il pannello delle verifiche.

## Formato log (per chi vuole modificare il parser)
Il log ha righe testuali (`[You] Deploy X ["ID">ID]`, `A [8000] vs B [6000]`, ...) e righe `RZ1|seq|player|carta|daZona|daIdx|aZona|aIdx|f1|f2|f3|0|0` che spostano una carta tra zone (0 deck, 1 mano, 2 personaggi, 3 life, 4 DON deck, 5 DON attivi, 6 trash, 7 stage, 9 DON attaccati; `aIdx = slot*100+n` sui personaggi, `9900+n` sul leader). `RZ1|CHK|...` porta i conteggi per verifica. Il flag `f3` vale 1 per un DON riposato, per una carta che entra in campo riposata (per esempio giocata da un effetto) e per un personaggio che era riposato quando torna in mano. Tutti gli altri cambi di stato "riposato" di personaggi e leader non sono nelle righe RZ1 e vengono dedotti dal testo; il refresh di inizio turno non è loggato e viene sintetizzato.

I log che il sim salva da solo (`CombatLogs/AutoSaved`) hanno due differenze rispetto a quelli scaricati a mano. Le carte tengono il markup intero, `Name [<mark><link="ID">ID</link></mark>]`: il parser lo riporta alla forma corta riga per riga. E ogni file contiene tutte le partite della sessione, perché le rivincite si accodano: si legge l'ultima giocata, quella a cui il file dà il nome (le precedenti stanno nei file salvati prima). Una partita parte dalle righe `Leader is`; quando finisce, il sim fa ripartire le mosse da capo (`RZ1|HDR`, seq 1) per sgombrare il tavolo, e quelle mosse restano fuori. Questi log si chiudono nel momento in cui finisce la partita: se nessuno concede e l'ultimo colpo non è ancora scritto, l'esito manca.

Il sim a volte scrive le mosse prima delle righe di testo che le spiegano, a volte dopo. In combattimento le mosse in attesa di una riga si applicano comunque nell'ordine del log, perché gli indici in mano si spostano a ogni carta che esce. Un DON attaccato può tornare direttamente nel DON deck (mossa `9>4`, per i costi "Minus N Don").

Gli eventi sono scritti al contrario: prima le righe degli effetti (`Evento: Rest X`), poi le mosse (DON del costo, evento mano → trash). Il parser aggiunge uno step "gioca" prima del primo effetto e uno di chiusura dopo l'ultimo.

"Guarda le prime N carte": la carta presa sta nella riga `Reveal and Draw`, le altre nelle mosse mazzo → fondo del mazzo (`0>0`) sotto `Placing Cards on Bottom of Deck`, una per carta con il suo codice, anche per l'avversario. Il parser aggiunge prima uno step "guarda" con tutte le carte viste; l'ordine in cima al mazzo si ricava dagli indici delle mosse (la cima è l'indice più alto).

Potenze in combattimento: la riga `A[8000] vs B[9000]` arriva solo dopo counter e buff. Il parser risale da lì alle potenze al momento dell'attacco, togliendo i `Counter N` e i `Buff X N for the Combat` scritti nel frattempo, e il tavolo le aggiorna a ogni counter. Così contano anche i bonus fissi che il log non nomina (Dracule Mihawk OP14-020 vale 6000 e non 5000 contro certi leader) senza bisogno di una regola per carta. Se un blocker cambia il difensore, per il primo bersaglio resta la potenza base della carta.

Blocker: la riga `X Blocks` cambia il bersaglio dell'attacco. Da lì la freccia punta al blocker, che si riposa, e la potenza della riga `vs` è la sua. Spesso il log mette subito dopo `Blocks`, prima ancora della riga `vs`, la mossa del blocker che va nel trash: resta in attesa fino all'esito, come le altre mosse del combattimento. Con due copie uguali in campo blocca quella che la mossa manda nel trash (il suo posto in Character Area); se il blocker sopravvive il log non dice quale, e vale la prima attiva.

## Regole per carta e dubbi
`Sorgente: Rest Y` non dice da che lato del tavolo sta Y. Il default è: leader e auto-riferimento (`X: Rest X`) riposano una carta propria, tutto il resto una dell'avversario. Dove il default sbaglia c'è una riga in `CARD_RULES`, nel file `src/core/card-rules.js`: `'OP17-031': { rest: 'opp' }` (Yasopp riposa un personaggio avversario, anche un altro Yasopp), oppure un elenco per i riposi di una stessa attivazione, `{ rest: ['own', 'own', 'opp'] }`. Ci va solo quello che il log non dice, una riga per carta con il motivo, e ogni regola ha il suo test in `test/core.test.mjs`.

`X: Y will not Activate during next Refresh` (Electrical Luna, Lightning Dragon, "I Know You're Strong... So I'll Go All Out", Law & Bepo; Jewelry Bonney lo dice di un DON) è esplicita e non ha bisogno di una regola: Y, cercata prima tra le carte riposate dell'avversario di chi gioca X, resta riposata al prossimo refresh del suo proprietario e stappa a quello dopo; sul tavolo porta l'etichetta "❄ non stappa" (bordo azzurro per un DON) finché il blocco dura. Se lascia il campo il blocco cade.

Per sapere dove manca una regola non serve ricordarsele: `buildSnapshots(parsed, { debug: true })` restituisce in `doubts` i punti in cui la ricostruzione non torna con le regole del gioco. Sono: un riposo che ha dovuto scegliere tra due carte uguali, una attiva per lato, senza una regola (il messaggio dice per quale carta serve); un attacco a un personaggio che risulta attivo; un attaccante o un blocker che risulta già riposato; un "Set to Active" su una carta che non risulta riposata; una carta che torna in mano con uno stato diverso da quello scritto nel log. Un dubbio non è un errore certo. Si vedono nel pannello Debug della partita aperta, oppure per una cartella intera con `node tools/dubbi.mjs <cartella dei log>`, che in fondo elenca le carte senza regola.

## Online
Sito: https://leobacca.github.io/optcg-replay-viewer/ — repo: https://github.com/LeoBacca/optcg-replay-viewer. Ogni push su `main` fa partire `.github/workflows/pages.yml`, che esegue i test, compila la pagina e la pubblica in un paio di minuti. Nelle impostazioni del repo (Settings → Pages) la sorgente deve essere **GitHub Actions**.

## Com'è fatto il codice
La pagina è un'app React compilata con Vite. Tutto il codice sta in `src/`, diviso per argomento: ogni file comincia con un commento che dice cosa fa.

```
src/
  main.jsx        punto di partenza: disegna <App> dentro la pagina
  App.jsx         mette insieme i pezzi grandi e fa partire l'avvio
  store.js        lo stato condiviso della pagina (partita aperta, cosa si vede, impostazioni…)

  core/           la logica che non tocca la pagina: gira anche in Node ed è quella coperta dai test
    parser/         dal testo del log alla lista degli step
    engine/         dagli step allo stato del tavolo, uno per step
    card-rules.js   le regole per singola carta
    stats.js        riepilogo di una partita e statistiche · redact.js: copia del log da condividere

  game/           le azioni: cambiano lo stato condiviso, non disegnano niente
    playback.js     vai allo step, play, pausa, velocità
    loader.js       apre un log · url.js: apre dall'indirizzo (?r=, ?log=)
    folder.js       la cartella dei log (exe, Chrome/Edge, finestra classica dei file)
    library.js      l'indice delle partite · share.js: link · notes.js: note
    view.js         apre e chiude i pezzi della pagina · settings.js: impostazioni salvate

  components/     quello che si vede, un componente React per pezzo
    Table.jsx       il tavolo: mani, tappetino, colonna destra, barra
    board/          tappetino: Side (una metà), Card, Hand, LookBox, TrashDialog; flip.js e arrow.js sono le animazioni
    Bar.jsx         barra dei comandi · EventLog.jsx: log della partita
    library/        raccolta e statistiche
    menu/           menu laterale ☰ (le voci sono in sections.js)
    Home.jsx        menu di benvenuto · NotesPanel, NoteBubble, ShareDialog, Toast, Ink (pennarello)

  hooks/          tasti, trascinamento dei file, tastiera del telefono
  lib/            attrezzi senza stato: immagini e dati delle carte, archivio del browser, testi, avvisi
  styles/         il CSS, un file per zona (le misure delle carte partono da --ch e --hch in base.css)
  trainer/        Memory Trainer, solo exe: core.js (logica), screens.js (schermate), bridge.js (aggancio alla pagina)
```

Come gira: `core` calcola in anticipo lo stato del tavolo dopo ogni step (`snaps`). "Andare allo step 12" vuol dire solo cambiare il numero `cur` in `store.js`: i componenti che lo leggono si ridisegnano da soli. Le azioni in `game/` sono funzioni normali che leggono e scrivono lo stato; i componenti le chiamano dai click e dai tasti.

L'unico punto in cui si lavora a mano sul DOM è l'animazione delle carte (`components/board/flip.js`, la freccia dell'attacco, il foglio del pennarello): lì servono le posizioni vere sullo schermo.

Dove mettere le mani:
- **una voce nel menu ☰** — una riga in `menuSections()` (`src/components/menu/sections.js`): `{ ic, label, hint, kbd, on }` per un'azione, `type: 'toggle'` con `get`/`set` per un interruttore, `type: 'seg'` con `opts` per una scelta tra pochi valori. Con `pref: true` compare anche nella schermata Impostazioni del menu di benvenuto.
- **una voce nel menu di benvenuto** — una riga in `homeItems()` (`src/components/Home.jsx`): `{ label, hint, on }`, con `show` per farla comparire solo in certi casi.
- **un'impostazione che resta al riavvio** — una riga in `DEFAULTS` (`src/lib/settings.js`); si legge con `getSetting` e si cambia con `setSetting` (`src/game/settings.js`). Sono salvate in `localStorage` sotto `optcg.settings`.
- **una regola per una carta** — una riga in `CARD_RULES` (`src/core/card-rules.js`), con il suo test.
- **un pezzo nuovo della pagina** — un componente in `src/components/`, i suoi dati in `store.js`, le sue azioni in un file di `src/game/`.

## Per chi collabora
Serve Node 20 o successivo.
```
npm install        # una volta
npm run dev        # la pagina su http://localhost:5173, si aggiorna da sola a ogni modifica
npm test           # i test di parser, motore, server e trainer
npm run test:ui    # allarme sul tappetino: confronta il tavolo con la foto salvata (serve Chrome o Edge)
npm run build      # compila la pagina in dist/
npm run format     # rimette in ordine il codice (Prettier)
```
Per lavorare in due: ognuno su un branch, poi pull request su `main`. Prima di aprire la PR:
- `npm test`;
- `npm run test:ui`: apre la pagina compilata in un browser senza finestra, scorre 20 momenti della partita di esempio e confronta carte, aree e posizioni con `test/golden/board.json`. Se il tavolo è cambiato lo elenca. Quando il cambiamento è voluto, la foto si rifà con `npm run test:ui -- --update`;
- provare il log di esempio (`http://localhost:5173/?log=test/esempio.log`) con il pannello Debug (tasto L → Debug): deve dire "nessuna incoerenza" e "nessun dubbio".

## App per Windows (eseguibile)
Stessa pagina dentro una finestra nativa (Electron), con accesso vero ai file: scegli la cartella dei log una volta e l'app la riapre da sola a ogni avvio, senza conferme; quando il sim salva un log nuovo compare subito in lista.
- Scarica `OPTCG-Replay-portable.exe` dalle Releases di GitHub: nessuna installazione, doppio click e parte.
- Avvio con `--open-latest` apre subito l'ultima partita.

Per gli sviluppatori (cartella `desktop/`):
```
npm install          # una volta, nella radice del repo (serve a compilare la pagina)
cd desktop
npm install          # una volta
npm start            # compila la pagina in app/ e avvia l'app
npm run build        # produce dist/OPTCG-Replay-portable.exe e l'installer
```
`main.js` è il processo nativo (finestra, cartella, watcher dei file), `preload.js` espone `window.desktop` alla pagina, la pagina viene compilata in `app/` da `npm run build:desktop` (nella radice), che in più include il Memory Trainer. La pagina rileva `window.desktop` e usa quello al posto della File System Access API del browser; il codice del replay è identico.
Nota: se nell'ambiente c'è la variabile `ELECTRON_RUN_AS_NODE` (es. terminale di VS Code) l'app non parte: lanciare con `env -u ELECTRON_RUN_AS_NODE npm start`.

## Memory Trainer (solo app, in prova)
Allena a ricordare le carte mandate in fondo al mazzo con le searchate (Perona, Otama: 4 carte sotto, 5 se non si pesca niente). Esiste solo nell'app per Windows e resta nascosto finché non si accende **Funzioni in prova** in Impostazioni: da lì compare la voce **Memory Trainer** nel menu principale.

Il metodo è la **conversione fonetica**: ogni carta unica del mazzo diventa un suono consonantico, così una searchata diventa una fila di consonanti con cui fare parole (`T G L K V` → "TeGoLa CHiaVe"). Il menu del trainer è un percorso a passi, tutti sempre aperti:
- **1. Mazzo** — elenca i leader giocati nei log e ricava la lista delle carte dalle rimescolate delle ultime partite con quel leader. Una partita sola mostra di solito 47-49 carte su 50 (quelle che restano al loro posto non compaiono), quindi ne unisce fino a 8. Ogni mazzo ha le sue associazioni, le sue flashcard e i suoi record.
- **2. Conversione fonetica** — per ogni carta unica un **suono** e un **motivo**. I suoni non sono lettere (la C di "casa" e quella di "cena" sono due suoni), quindi non si scrivono: si scelgono da una tavolozza di 19 suoni dell'italiano, ognuno con una sigla e una parola che lo fa sentire (`K` C dura, casa · `CI` C dolce, cena · `SC` sci · `GN` gnomo…), raggruppati in famiglie di suoni simili (`P B`, `T D`, `K G`, `S Z SC`…). Se ne prendono 1 o 2 dalla stessa famiglia; quelli già dati a un'altra carta sono sbiaditi. L'elenco sta in `SOUNDS` e `FAMILIES` di `TrainerCore`. **Copia il prompt per l'AI** mette negli appunti regole e lista del mazzo, da incollare nel proprio LLM per decidere insieme; l'LLM chiude con una tabella `CODICE | SUONI | MOTIVO` che **Incolla la tabella dell'AI** legge e scrive nelle righe. **Copia la tabella** la esporta (backup, o per passarla a un amico). Due carte con lo stesso suono vengono segnalate.
- **3. Flashcard** — ripetizione spaziata delle associazioni, nei due versi (carta → suono, suono → carta). Spazio gira, poi `1` non la sapevo (torna in coda oggi), `2` bene (1 giorno, 3, poi sempre più lontano), `3` facile. Cambiare il suono di una carta fa ripartire le sue flashcard. Finito il giro del giorno c'è il **ripasso libero**, che non sposta le scadenze.
- **Come funziona il metodo** — la spiegazione con gli esempi; si apre da sola la prima volta.
- **4. Training puro** — sul mazzo scelto: compaiono le searchate una alla volta, per un tempo che cala con i livelli, poi si ricostruisce tutto l'ordine rimettendo le carte viste nei loro posti. Dieci livelli, da 2 searchate con 20 secondi l'una a 5 con 6 secondi (Boss). Un livello si supera solo con la ricostruzione perfetta; tre perfette di fila lo rendono consolidato. Spazio passa al blocco dopo, Invio conferma, Backspace toglie l'ultima carta, Esc torna indietro.
- **5. In partita** — elenca le partite con quel leader e apre il replay con il pannello **Fondo del mazzo** a destra: le carte che hai mandato sotto fino a quella mossa, raggruppate per searchata, coperte finché non premi `B`. **Mettimi alla prova** ferma il replay e fa ricostruire il fondo di quel momento. Il pannello si accende anche da ☰ → Vista su qualsiasi replay.

Per chi tocca il codice: il motore tiene il fondo noto in `players[p].bottom` (indice 0 = la carta più in fondo; una rimescolata lo azzera), e se una carta esce da un posto noto con un codice diverso lo segnala tra i dubbi. Il trainer sta tutto in `src/trainer/` (`core.js` la logica, `screens.js` e `trainer.css` le schermate) e viene incluso solo nella build per l'exe, quindi il sito non lo contiene; la pagina gli passa i suoi pezzi da `src/trainer/bridge.js`. Le schermate sono scritte a mano sul DOM, non in React. Mazzi, associazioni, flashcard e record stanno in `localStorage` sotto `optcg.trainer` (`{ v: 2, deck, decks: { <leader>: { cards, assoc, srs, unlocked, levels } } }`; i record della prima versione passano al Mihawk). La copia negli appunti passa da `window.desktop.copy` (preload). Per aprirlo da terminale: `--trainer` oppure `--trainer=deck|assoc|cards|tutorial|levels|block|recall|review|panel`.
