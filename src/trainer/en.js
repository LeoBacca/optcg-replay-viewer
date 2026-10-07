// Il dizionario inglese del Memory Trainer: a sinistra il testo italiano scritto dentro t() in screens.js, a destra la traduzione.
// Sta qui e non in src/i18n/en.js perché il trainer c'è solo nell'exe: screens.js lo aggiunge con addTranslations quando viene caricato,
// così il sito non si porta dietro testi che non mostra mai. Le parti tra graffe ({n}, {name}…) restano uguali nelle due lingue.
// Il prompt per l'AI e i nomi dei suoni non stanno qui: sono testi lunghi costruiti in core.js, che ha la sua versione inglese.
export default {
  // pulsante "indietro"
  '‹ Indietro': '‹ Back',
  '‹ Menu': '‹ Menu',
  '‹ Replay': '‹ Replay',

  // ingresso
  'Ricorda le carte che mandi in fondo al mazzo': 'Remember the cards you send to the bottom of your deck',
  Mazzo: 'Deck',
  '{n} carta unica': '{n} unique card',
  '{n} carte uniche': '{n} unique cards',
  'scegli il mazzo che stai imparando': "choose the deck you're learning",
  'Conversione fonetica': 'Phonetic conversion',
  '{n} / {all} carte con il loro suono': '{n} / {all} cards with their sound',
  'un suono per ogni carta del mazzo': 'a sound for every card in the deck',
  Flashcard: 'Flashcards',
  'per fissare le associazioni nella memoria': 'to lock the associations into memory',
  '{n} da ripassare oggi': '{n} to review today',
  'a posto per oggi': 'all done for today',
  'Training puro': 'Training',
  "blocchi a tempo, poi ricostruisci l'ordine · {n} / {all} livelli superati":
    'timed searches, then rebuild the order · {n} / {all} levels cleared',
  'In partita': 'In game',
  'rivedi un replay e prova a ricordare il fondo di quella partita':
    'watch a replay and try to remember the bottom of the deck in that game',
  'Come funziona il metodo': 'How the method works',

  // 1. il mazzo
  'IL TUO MAZZO': 'YOUR DECK',
  'Scegli il mazzo che stai imparando: la lista delle carte la prendo dalle tue ultime partite con quel leader.':
    "Choose the deck you're learning: I'll take the decklist from your latest games with that Leader.",
  'Non riesco a leggere la lista del mazzo da quelle partite': "I can't read the decklist from those games",
  'Ho trovato {n} carte su {all}: le altre arrivano giocando altre partite e riscegliendo il mazzo.':
    'Found {n} of {all} cards: the rest will show up as you play more games and pick the deck again.',
  'Lista aggiornata dalle ultime partite: {n} carta nuova da associare.':
    'Decklist updated from your latest games: {n} new card to associate.',
  'Lista aggiornata dalle ultime partite: {n} carte nuove da associare.':
    'Decklist updated from your latest games: {n} new cards to associate.',
  'Lista aggiornata dalle ultime partite.': 'Decklist updated from your latest games.',
  '{n} partita': '{n} game',
  '{n} partite': '{n} games',
  'nessuna partita nei log': 'no games in the logs',
  '{n} / {all} carte associate': '{n} / {all} cards associated',
  'in uso': 'in use',
  'Sto ancora leggendo le partite della cartella dei log: riprova tra un attimo.':
    "I'm still reading the games in your log folder: try again in a moment.",
  'Nessuna partita: scegli la cartella dei log in Impostazioni, oppure prova con il mazzo di esempio.':
    'No games: choose your log folder in Settings, or try the example deck.',
  'Usa il mazzo di esempio ({name})': 'Use the example deck ({name})',

  // 2. conversione fonetica
  'CONVERSIONE FONETICA': 'PHONETIC CONVERSION',
  'A ogni carta 1 o 2 suoni della stessa famiglia e un motivo che te la faccia venire in mente. Clicca il riquadro del suono per sceglierlo.':
    'Give each card 1 or 2 sounds from the same family and a reason that brings it to mind. Click the sound box to choose it.',
  'Suoni doppi: {list}': 'Sounds used twice: {list}',
  scegli: 'choose',
  'Scegli il suono di {name}': 'Choose the sound for {name}',
  'Già di {name}': 'Already taken by {name}',
  Fatto: 'Done',
  'perché proprio questo suono': 'why this sound',
  'Motivo per {name}': 'Reason for {name}',
  "Copia il prompt per l'AI": 'Copy the prompt for the AI',
  'Prompt copiato: incollalo nella tua AI (ChatGPT, Claude…) e decidete insieme le associazioni':
    'Prompt copied: paste it into your AI (ChatGPT, Claude…) and work out the associations together',
  'Non sono riuscito a copiare il prompt': "Couldn't copy the prompt",
  "Incolla la tabella dell'AI": "Paste the AI's table",
  'Copia la tabella': 'Copy the table',
  'Tabella copiata': 'Table copied',
  'Non sono riuscito a copiare la tabella': "Couldn't copy the table",

  // la tabella dell'AI
  'INCOLLA LA TABELLA': 'PASTE THE TABLE',
  "Incolla qui la tabella finale dell'AI (CODICE | SUONI | MOTIVO, una riga per carta). Le righe che non sono carte del mazzo le salto.":
    "Paste the AI's final table here (CODE | SOUNDS | REASON, one line per card). Lines that aren't cards in the deck are skipped.",
  Applica: 'Apply',
  '{n} associazione scritta': '{n} association saved',
  '{n} associazioni scritte': '{n} associations saved',
  'OP12-034 | P B | Perona, la P di fantasma che fa “Bu!”': 'OP12-034 | P B | Perona, the ghost that goes “Boo!”',
  'Lette {n} carte su {all}': 'Read {n} of {all} cards',
  '{n} suono cambia (le sue flashcard ripartono da capo)': '{n} sound changes (its flashcards start over)',
  '{n} suoni cambiano (le loro flashcard ripartono da capo)': '{n} sounds change (their flashcards start over)',
  '{n} riga con un codice che non è nel mazzo': "{n} line with a code that isn't in the deck",
  '{n} righe con un codice che non è nel mazzo': "{n} lines with a code that isn't in the deck",
  Annulla: 'Cancel',

  // 3. flashcard
  'Non la sapevo': "Didn't know it",
  Bene: 'Good',
  Facile: 'Easy',
  FLASHCARD: 'FLASHCARDS',
  'Prima servono le associazioni: le flashcard nascono da lì.':
    'You need the associations first: the flashcards are made from them.',
  'Vai alla conversione fonetica': 'Go to the phonetic conversion',
  'A POSTO PER OGGI': 'ALL DONE FOR TODAY',
  "Prossimo ripasso domani. Tornare prima non serve: è l'attesa che fissa il ricordo.":
    "Next review tomorrow. Coming back sooner won't help: the wait is what makes it stick.",
  "Prossimo ripasso tra {n} giorni. Tornare prima non serve: è l'attesa che fissa il ricordo.":
    "Next review in {n} days. Coming back sooner won't help: the wait is what makes it stick.",
  'Ripasso libero': 'Free review',
  'Training puro ›': 'Training ›',
  'Il ripasso libero ripassa tutte le flashcard senza spostare le scadenze.':
    'Free review goes through all the flashcards without moving their due dates.',
  'CHE SUONO È?': 'WHICH SOUND?',
  'CHE CARTA È?': 'WHICH CARD?',
  '{n} flashcard rimasta': '{n} flashcard left',
  '{n} flashcard rimaste': '{n} flashcards left',
  'Gira  ·  Spazio': 'Flip  ·  Space',
  'Nessun motivo scritto: aggiungine uno, aiuta molto.': 'No reason written: add one, it helps a lot.',
  FATTO: 'DONE',
  '{n} flashcard ripassata': '{n} flashcard reviewed',
  '{n} flashcard ripassate': '{n} flashcards reviewed',
  '{n} ripetizione in più per quelle che non sapevi': "{n} extra repeat for the ones you didn't know",
  '{n} ripetizioni in più per quelle che non sapevi': "{n} extra repeats for the ones you didn't know",
  'tutte al primo colpo': 'all right first time',
  'Menu del trainer': 'Trainer menu',

  // come funziona: in inglese le parole d'esempio sono inglesi, come quelle che chiede il prompt
  'COME FUNZIONA': 'HOW IT WORKS',
  'Il metodo in due minuti': 'The method in two minutes',
  'Il problema': 'The problem',
  "Ogni searchata manda in fondo al mazzo 4 o 5 carte, in ordine. A fine partita quelle carte tornano su, e chi ricorda l'ordine sa cosa pescherà. Ma ricordare venti carte “a forza”, mentre giochi, è durissimo.":
    'Every search sends 4 or 5 cards to the bottom of the deck, in order. Late in the game those cards come back up, and whoever remembers the order knows what they will draw. But memorising twenty cards by brute force while you play is really hard.',
  "L'idea: le carte diventano consonanti": 'The idea: cards become consonants',
  'Dai a ogni carta unica del mazzo un suono consonantico. A quel punto una searchata non è più una fila di carte ma una fila di consonanti, e con le consonanti si fanno parole: basta metterci le vocali che vuoi.':
    'Give every unique card in your deck a consonant sound. Then a search is no longer a row of cards but a row of consonants, and consonants make words: just add whatever vowels you like.',
  'Un esempio': 'An example',
  'Vanno sotto quattro carte che per te sono P, L, K, M. Ci metti le vocali: “PoLLo CoMò”. Un pollo seduto su un comò non te lo scordi più. Cinque carte T, G, L, K, V diventano “TeGoLa CHiaVe”: cinque carte in due parole concrete.':
    'Four cards go to the bottom, and for you they are P, L, K, N. Add vowels: “PeLiCaN”. One pelican, four cards, hard to forget. Five cards T, B, L, K, V become “TaBLe CaVe”: a table in a cave, five cards in two concrete words.',
  'Conta il suono, non la lettera': 'The sound counts, not the letter',
  'La C di “casa” e la C di “cena” sono la stessa lettera ma due suoni diversi, quindi due carte diverse. Per questo i suoni non li scrivi: li scegli da una tavolozza, ognuno con la sua sigla e una parola che lo fa sentire. K è la C dura (casa, chiave), CI la C dolce (cena, ciao), G la G dura (gatto), GI la G dolce (gelato), SC è “sci”, GN è “gnomo”, GL è “aglio”. Le doppie contano una volta sola (poLLo = una L). Le vocali sono libere, non valgono niente: servono solo a fare la parola.':
    'The C in “cat” and the C in “city” are the same letter but two different sounds, so two different cards. That’s why you don’t type the sounds: you pick them from a palette, each with its code and a word that lets you hear it. K is the hard C (cat, key), CI is CH (cheese), G is the hard G (goat), GI is J (jam, giant), SC is SH (ship), GN is NY (onion), GL is LY (million). Double letters count once (piLLow = one L) and silent letters don’t count. Vowels are free, and so are W, H and Y: they’re only there to make the word.',
  'Uno o due suoni per carta': 'One or two sounds per card',
  "Nella tavolozza i suoni sono raggruppati per famiglie, cioè suoni che si fanno quasi uguali in bocca: P B · T D · F V · K G · CI GI · S Z SC · M N GN · L R GL. Se dai a una carta due suoni, prendili dalla stessa famiglia: così per quella carta puoi usare l'uno o l'altro e trovare parole è più facile. Con tante carte uniche le coppie non bastano: allora le spezzi (M a una carta, N a un'altra). L'importante è che nessun suono stia su due carte: quelli già presi la tavolozza te li mostra sbiaditi.":
    'In the palette the sounds are grouped into families, sounds you make almost the same way: P B · T D · F V · K G · CI GI · S Z SC · M N GN · L R GL. If you give a card two sounds, take them from the same family: then you can use either one for that card, and finding words is easier. With lots of unique cards the pairs run out: then split them (M to one card, N to another). What matters is that no sound sits on two cards: the palette shows the ones already taken faded out.',
  'Il motivo è metà del lavoro': 'The reason is half the work',
  "Ogni associazione deve avere un perché: Trafalgar Law è T oppure L, Bonney è B. Quando ci sono più carte con lo stesso personaggio usa come le chiami tu: la Bonney che cerca, la Bonney che blocca, la Bonney “mestolo” perché nell'immagine ha il mestolo. Più il motivo è visivo e sciocco, meglio resta.":
    'Every association needs a why: Trafalgar Law is T or L, Bonney is B. When several cards share a character, use what you call them: the Bonney that searches, the Bonney that blocks, the “ladle” Bonney because she’s holding a ladle in the art. The more visual and silly the reason, the better it sticks.',
  "Fatti aiutare da un'AI": 'Get help from an AI',
  "In “Conversione fonetica” c'è il pulsante “Copia il prompt per l'AI”: contiene le regole e la lista del tuo mazzo. Incollalo in ChatGPT, Claude o quello che usi, e decidete insieme suoni e motivi. Alla fine l'AI scrive una tabella: la incolli qui con “Incolla la tabella dell'AI” e le righe si riempiono da sole. Poi puoi ritoccarle a mano.":
    'In “Phonetic conversion” there’s a “Copy the prompt for the AI” button: it contains the rules and your decklist. Paste it into ChatGPT, Claude or whatever you use, and work out the sounds and reasons together. At the end the AI writes a table: paste it here with “Paste the AI’s table” and the rows fill themselves in. Then you can touch them up by hand.',
  'Il percorso': 'The path',
  "1. Scegli il mazzo.  2. Dai un suono e un motivo a ogni carta.  3. Fissa le associazioni con le flashcard: pochi minuti al giorno, l'app ti ripropone ogni carta poco prima che tu la dimentichi.  4. Training puro: guardi le searchate, ti fai le parole, ricostruisci.  5. In partita: lo stesso sui tuoi replay veri.":
    '1. Choose your deck.  2. Give every card a sound and a reason.  3. Lock in the associations with flashcards: a few minutes a day, and the app shows you each card again just before you would forget it.  4. Training: watch the searches, make your words, rebuild the order.  5. In game: the same thing on your real replays.',
  'Come si fanno le parole in fretta': 'How to make words quickly',
  "Una parola ogni due o tre carte, concreta e che si possa vedere (un oggetto, un animale, un posto). Collega le parole di una searchata in una scenetta, e le searchate una dopo l'altra in una storia. All'inizio è lento: è normale. Dopo qualche giorno di flashcard il suono di ogni carta ti viene da solo.":
    'One word every two or three cards, concrete and easy to picture (an object, an animal, a place). Link the words of one search into a little scene, and the searches one after another into a story. It’s slow at first: that’s normal. After a few days of flashcards, each card’s sound comes to you on its own.',
  'Ho capito': 'Got it',
  'Ho capito: scelgo il mazzo': 'Got it: let me choose my deck',

  // training puro
  'TRAINING PURO': 'TRAINING',
  'Un livello si supera solo ricostruendo tutto giusto. Tre perfette di fila e diventa consolidato.':
    'You only clear a level by rebuilding everything right. Three perfect runs in a row and it’s mastered.',
  "{n} searchate · {s} s l'una": '{n} searches · {s} s each',
  '🔒 supera il livello {n}': '🔒 clear level {n}',
  '⭐ consolidato · {time}': '⭐ mastered · {time}',
  '✓ superato · serie {n} / {all}': '✓ cleared · streak {n} / {all}',
  'migliore {pct}%': 'best {pct}%',
  'da provare': 'not tried yet',
  'LIVELLO {n}': 'LEVEL {n}',
  "{n} searchate, {s} secondi l'una": '{n} searches, {s} seconds each',
  'SEARCHATA {n} DI {all}': 'SEARCH {n} OF {all}',
  "Vanno in fondo al mazzo in quest'ordine, da sinistra a destra":
    'They go to the bottom of the deck in this order, left to right',
  'Fatto  ·  Spazio': 'Done  ·  Space',

  // ricostruzione e revisione
  'RICOSTRUISCI IL FONDO': 'REBUILD THE BOTTOM',
  'Scegli una carta e va nel primo posto libero. Clicca un posto per svuotarlo o per sceglierlo.':
    'Pick a card and it goes into the first free slot. Click a slot to empty it or select it.',
  'Conferma  ·  Invio': 'Confirm  ·  Enter',
  Svuota: 'Clear',
  '{n}ª searchata': 'Search {n}',
  'Carte viste': 'Cards seen',
  PERFETTO: 'PERFECT',
  '{n} SU {all}': '{n} OF {all}',
  '{pct}% al posto giusto · {time} per ricostruire': '{pct}% in the right place · {time} to rebuild',
  'serie {n} / {all}': 'streak {n} / {all}',
  'Qui andava {name}': '{name} belonged here',
  Ancora: 'Again',
  Riprova: 'Try again',
  Livelli: 'Levels',
  'Livello {n} ›': 'Level {n} ›',
  'Livello {n} sbloccato': 'Level {n} unlocked',
  '⭐ Livello consolidato': '⭐ Level mastered',
  'Torna al replay': 'Back to the replay',
  'Bordo rosso: carta sbagliata. Sotto, in piccolo, quella che andava lì.':
    'Red border: wrong card. Underneath, small, the one that belonged there.',

  // in partita e pannello nel replay
  'IN PARTITA': 'IN GAME',
  'Il replay si apre con il pannello “Fondo del mazzo” a destra, coperto: B lo scopre.':
    'The replay opens with the “Bottom of deck” panel on the right, face down: B reveals it.',
  '{n} turni': '{n} turns',
  // esito della partita: V = vittoria, S = sconfitta
  V: 'W',
  S: 'L',
  'Nessuna partita con {name} nella cartella dei log (o la raccolta le sta ancora leggendo: riprova tra un attimo).':
    'No games with {name} in your log folder (or the library is still reading them: try again in a moment).',
  'Scegli prima la cartella dei log in Impostazioni.': 'Choose your log folder in Settings first.',
  'Mettimi alla prova': 'Test me',
  'Mostra o copri le carte (B)': 'Show or hide the cards (B)',
  'Fondo del mazzo · {n}': 'Bottom of deck · {n}',
  'Ancora nessuna carta mandata sotto.': 'No cards sent to the bottom yet.',
};
