# OPTCG Replay — visualizzatore di replay per OPTCGSim

Pagina web singola, senza installazione: apri `index.html` nel browser (doppio click) e trascina dentro il combat log `.log` scaricato da OPTCGSim. Il replay parte da solo.

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

"Tu" sei sempre chi ha scaricato il log (`[You]`). Ogni log viene analizzato una volta sola: il riepilogo resta in cache nel browser (IndexedDB), quindi alle aperture successive si leggono solo i file nuovi.

## Link condivisi e note
"Genera link" (sulla riga della raccolta, nella barra in basso o nel menu) carica il replay sul server e copia negli appunti un indirizzo che chiunque può aprire nel browser. Nella copia caricata i messaggi di chat diventano "…" e il nick dell'avversario diventa "Avversario"; il file sul tuo computer non viene toccato.

Chi apre il link può lasciare note: si ferma su un momento della partita, scrive il testo e il proprio nome. Ogni nota compare nell'elenco a sinistra con il turno, come segnalino sulla barra di scorrimento e come fumetto quando la riproduzione ci passa sopra; un click sulla nota porta a quel momento. Riaprendo la stessa partita nell'app le note vengono scaricate e mostrate allo stesso modo. Chi ha caricato il replay può eliminare le note.

Per generare i link serve un token personale (menu ☰ → Server e token), che dà chi gestisce il server. Leggere un replay e scrivere note non richiede nulla. Nell'app per Windows il token si può preconfigurare, senza incollarlo, aggiungendo `"share": { "base": "https://…", "token": "…" }` al file `%APPDATA%\OPTCG Replay\settings.json`.

## File
- `index.html` — tutto il programma (parser del log, motore di stato, interfaccia).
- `don.jpg` — immagine della carta DON!! (fornita da Leo).
- `cardback.jpg` — dorso delle carte (fornito da Leo): mazzo, life, mano coperta dell'avversario.
- `cards_meta.js` — nome / costo / potenza / counter per ogni carta (anteprima della carta, potenze in combattimento, nomi dei leader). Se manca, funziona lo stesso.
- `server/` — server dei replay condivisi (vedi sotto).
- `desktop/` — app per Windows (vedi in fondo).
- `test/esempio.log` — un log di prova: è la partita su cui girano i test.
- `test/core.test.mjs` — test di parser ed engine sul log di esempio.
- `test/server.test.mjs` — test del server su una cartella dati temporanea.
- `tools/dubbi.mjs` — passa una cartella di log e stampa incoerenze e dubbi (vedi "Regole per carta e dubbi").

## Server dei replay condivisi
`server/server.js` è un server Node senza dipendenze: serve la pagina e una piccola API, e tiene i dati su file.
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
Per aggiornare: `git pull` e `systemctl --user restart optcg-replay`. `setup.sh` serve di nuovo solo per cambiare porta, cartella dei dati o indirizzo: riscrive il servizio, quindi `PUBLIC_URL` va ripassato. I dati stanno in `~/optcg-replay-data` (basta copiare quella cartella per averne un salvataggio). L'indirizzo predefinito nell'app è `SHARE_SERVER` in `index.html`.

Le note sono ancorate al numero di riga del log e non all'indice dello step: il log non cambia mai, mentre gli step si spostano quando il parser viene corretto. Per questo l'oscuramento di chat e nick sostituisce il testo sul posto senza togliere righe.

## Immagini delle carte
Vengono scaricate al volo (e messe in cache dal browser) da dotgg, con fallback su Limitless. dotgg viene prima perché ha la scritta SAMPLE solo su una parte delle carte recenti, mentre Limitless ce l'ha su tutte. Se nessuna delle due ha l'immagine (per esempio le promo da P-120 a P-134) la carta viene mostrata con il nome. Il sito ufficiale Bandai non è utilizzabile: manda l'header `Cross-Origin-Resource-Policy: same-site` e il browser blocca le sue immagini da qualsiasi altro sito.

## Parametri URL (opzionali, servono se la pagina è servita via http)
- `?r=<id>` apre un replay condiviso (solo quando la pagina è servita dal server dei replay).
- `?log=<url del log>` carica un log automaticamente (es. `python -m http.server` nella cartella e poi `http://localhost:8000/index.html?log=test/esempio.log`).
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
`Sorgente: Rest Y` non dice da che lato del tavolo sta Y. Il default è: leader e auto-riferimento (`X: Rest X`) riposano una carta propria, tutto il resto una dell'avversario. Dove il default sbaglia c'è una riga in `CARD_RULES`, in cima al blocco `core` di `index.html`: `'OP17-031': { rest: 'opp' }` (Yasopp riposa un personaggio avversario, anche un altro Yasopp), oppure un elenco per i riposi di una stessa attivazione, `{ rest: ['own', 'own', 'opp'] }`. Ci va solo quello che il log non dice, una riga per carta con il motivo, e ogni regola ha il suo test in `test/core.test.mjs`.

Per sapere dove manca una regola non serve ricordarsele: `buildSnapshots(parsed, { debug: true })` restituisce in `doubts` i punti in cui la ricostruzione non torna con le regole del gioco. Sono: un riposo che ha dovuto scegliere tra due carte uguali, una attiva per lato, senza una regola (il messaggio dice per quale carta serve); un attacco a un personaggio che risulta attivo; un attaccante o un blocker che risulta già riposato; un "Set to Active" su una carta che non risulta riposata; una carta che torna in mano con uno stato diverso da quello scritto nel log. Un dubbio non è un errore certo. Si vedono nel pannello Debug della partita aperta, oppure per una cartella intera con `node tools/dubbi.mjs <cartella dei log>`, che in fondo elenca le carte senza regola.

## Online
Sito: https://leobacca.github.io/optcg-replay-viewer/ — repo: https://github.com/LeoBacca/optcg-replay-viewer. Ogni push su `main` aggiorna il sito in un minuto circa.

## Per chi collabora
Non serve nessun tool: si modifica `index.html` e si apre nel browser. Il file è diviso in tre blocchi:
1. `<style>` — tutto il CSS. Le misure delle carte partono dalle variabili `--ch` (altezza carta in campo) e `--hch` (in mano) definite in `:root`.
2. `<script id="core">` — **Parser** (log → lista di step), **Engine** (step → stato del tavolo, uno snapshot per step), più riepilogo di una partita, statistiche e oscuramento per la condivisione. Non tocca il DOM: si può testare in node estraendo il blocco.
3. secondo `<script>` — **Renderer** (stato → DOM del tappetino), **Controller** (play/pausa/step), **Menu** (pannello ☰), **Home** (menu di benvenuto), **Loader** (file, cartella, immagini), **Library** (raccolta e statistiche), **Share** (link), **Notes** (note).

Per aggiungere una feature al menu basta una riga in `SECTIONS()` dentro il modulo `Menu`: `{ ic, label, hint, kbd, on }` per un'azione, `type:'toggle'` con `get`/`set` per un interruttore, `type:'seg'` con `opts` per una scelta tra pochi valori. Le impostazioni che devono sopravvivere al riavvio passano da `Settings` (`get`/`set`, salvate in `localStorage` sotto `optcg.settings`, default in `DEF`, effetto immediato in `apply`). Una voce con `pref: true` compare anche nella schermata Impostazioni del menu di benvenuto. Per aggiungere una voce al menu di benvenuto basta una riga in `ITEMS()` dentro il modulo `Home`: `{ label, hint, on }`, con `show` per farla comparire solo in certi casi.

Per lavorare in due: ognuno su un branch, poi pull request su `main`. Prima di aprire la PR:
- `node --test` (Node 18 o successivo, nessuna dipendenza): esegue parser ed engine sul log di esempio;
- provare il log di esempio con il pannello Debug (tasto L → Debug): deve dire "nessuna incoerenza" e "nessun dubbio".

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
