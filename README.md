# OPTCG Replay — visualizzatore di replay per OPTCGSim

Pagina web singola, senza installazione: apri `index.html` nel browser (doppio click) e trascina dentro il combat log `.log` scaricato da OPTCGSim. Il replay parte da solo.

## Controlli
| Azione | Pulsante | Tasto |
|---|---|---|
| Play / Pausa | ▶ Play / ❚❚ Pausa | Spazio |
| Mossa precedente / successiva | ◀ Prec / Succ ▶ | ← / → |
| Inizio / fine partita | | Home / End |
| Velocità | menu 0.5× … 3× | |
| Salta a un turno | menu "Turno N" o slider | |
| Mostra / nascondi la mano dell'avversario | 👁 Mano avv | H |
| Lista trash | click sulla pila del trash | |
| Log degli eventi (pannello a scomparsa) | Log | L |
| Verifiche di coerenza | Debug (dentro il pannello Log) | |

Prec / Succ mettono in pausa. Ogni passo è una riga evento del log (deploy, rest, attacco, pesca, danno...). Nel pannello a sinistra si può cliccare qualsiasi evento per saltarci.

## Layout
Riproduce il tavolo di OPTCGSim: mano dell'avversario in alto, mano tua in basso, in mezzo il tappetino con il lato avversario ruotato di 180°, Cost Area (DON), Character Area, leader, stage, deck, life e trash nelle stesse posizioni del simulatore. Le dimensioni delle carte si adattano all'altezza della finestra. Durante un attacco una freccia rossa collega l'attaccante al bersaglio e le potenze compaiono sulle due carte.

## File
- `index.html` — tutto il programma (parser del log, motore di stato, interfaccia).
- `cards_meta.js` — nome / costo / potenza / counter per ogni carta (tooltip al passaggio del mouse). Generato da `cards_meta.json` del vecchio programma; se manca, funziona lo stesso.
- `Esempio COmbat log/` — un log di prova.

## Immagini delle carte
Vengono scaricate al volo (e messe in cache dal browser) da Limitless, con fallback su dotgg. Il sito ufficiale Bandai non è utilizzabile: manda l'header `Cross-Origin-Resource-Policy: same-site` e il browser blocca le sue immagini da qualsiasi altro sito.

## Parametri URL (opzionali, servono se la pagina è servita via http)
- `?log=<url del log>` carica un log automaticamente (es. `python -m http.server` nella cartella e poi `http://localhost:8000/index.html?log=Esempio%20COmbat%20log/....log`).
- `&step=N` salta allo step N in pausa.
- `?debug` apre subito il pannello delle verifiche.

## Formato log (per chi vuole modificare il parser)
Il log ha righe testuali (`[You] Deploy X ["ID">ID]`, `A [8000] vs B [6000]`, ...) e righe `RZ1|seq|player|carta|daZona|daIdx|aZona|aIdx|f1|f2|f3|0|0` che spostano una carta tra zone (0 deck, 1 mano, 2 personaggi, 3 life, 4 DON deck, 5 DON attivi, 6 trash, 7 stage, 9 DON attaccati; `aIdx = slot*100+n` sui personaggi, `9900+n` sul leader). `RZ1|CHK|...` porta i conteggi per verifica. Lo stato "riposato" di personaggi e leader non è nelle righe RZ1 e viene dedotto dal testo; il refresh di inizio turno non è loggato e viene sintetizzato.
