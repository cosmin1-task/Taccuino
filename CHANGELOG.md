# Cosa e' cambiato

Ogni versione del Taccuino, dalla piu' recente alla piu' vecchia.

## 0.2 - 21 settembre 2026

Il Taccuino gira anche su Windows.

**Aggiunto**

- `Avvia Taccuino.bat`: l'equivalente per Windows del file di avvio,
  con la stessa ricerca di Node e lo stesso messaggio se manca.
- Il file per Windows spiega anche la strada senza installazione: il
  pacchetto .zip di Node estratto in una cartella `node-win`, utile su un
  computer aziendale che non concede i permessi di amministratore.
- Istruzioni nel README per portare il progetto su un altro computer,
  con l'avvertenza che i dati dei due computer restano separati.

**Cambiato**

- L'apertura del browser e' passata dai file di avvio dentro `server.js`:
  ora e' scritta una volta sola e vale per macOS, Windows e Linux, invece
  di essere ripetuta in ogni file di avvio.

**Corretto**

- Se il comando per aprire il browser non esiste, il programma non muore
  piu'. Il `try/catch` che avrebbe dovuto proteggerlo era inutile: `spawn`
  segnala quel tipo di errore in un secondo momento, con un evento, e non
  al momento della chiamata. Ora quell'evento viene ascoltato.

## 0.1 - 21 settembre 2026

Gli incarichi hanno un'urgenza, e l'urgenza sale da sola col tempo.

**Aggiunto**

- Quattro livelli di urgenza: Puo' aspettare, Da pianificare, Da fare presto,
  Subito. Colorano il bordo sinistro della scheda (grigio, verde, arancione,
  viola) e compaiono come etichetta.
- Invecchiamento automatico: 14 giorni da "Puo' aspettare", 7 da
  "Da pianificare", 3 da "Da fare presto". Chi e' salito da solo porta una
  freccia, e il dettaglio si legge passandoci sopra col mouse.
- Campo "Da": la data da cui contano i giorni, distinta dalla scadenza.
  Puo' essere nel futuro, e in quel caso l'incarico non invecchia finche'
  non arriva quel giorno.
- Spostare il livello a mano fa ripartire il conteggio da oggi, cosi' si puo'
  davvero rimandare qualcosa. La data si aggiorna a vista nel modulo.
- Gli incarichi si ordinano per urgenza; a parita' di livello decide la scadenza.
- Filtro "Solo urgenti": tutto cio' che oggi e' a "Da fare presto" o oltre.
- Le due caselle data hanno un'etichetta ("Da" e "Entro"): prima erano
  indistinguibili.
- Cartella `prove/` con i controlli automatici sul calcolo dei livelli.

**Scelte tecniche**

- Il livello attuale non viene salvato: si salvano livello di partenza e data,
  e il resto si calcola al momento. Nessun timer, nessun processo da tenere
  acceso, e il conto resta giusto anche dopo mesi di programma chiuso.
- Il rosso resta riservato alle scadenze superate; l'urgenza massima usa il
  viola, cosi' i due segnali non si confondono.
- I dati della versione 0.0 continuano a funzionare: a un incarico senza
  livello viene assegnato "Da pianificare", e come data di inizio la sua
  data di creazione.

## 0.0 - 19 settembre 2026

La prima versione funzionante.

**Aggiunto**

- Clienti: nome, contatto, note libere. Ogni scheda mostra quanti incarichi
  sono in sospeso e quante note sono collegate.
- Incarichi: titolo, cliente, scadenza, note, e tre stati (da fare, in corso,
  fatto). Ordinati per scadenza, con evidenza in rosso di quelli scaduti.
  Filtri per stato.
- Note: testo libero con data automatica, collegabile a un cliente,
  a un incarico, a entrambi o a nulla.
- Ricerca unica che attraversa tutte e tre le sezioni, con la parola cercata
  evidenziata nei risultati. Trova anche per nome cliente.
- Scorciatoie: Cmd+K per cercare, Esc per svuotare, Cmd+Invio per salvare una nota.
- Avvio con doppio clic tramite "Avvia Taccuino.command", che verifica
  la presenza di Node.js e spiega cosa fare se manca.
- Salvataggio su dati.json con copia di sicurezza automatica della versione
  precedente in dati.backup.json.

**Scelte tecniche**

- Nessuna dipendenza esterna: solo Node.js e il browser. Niente npm install.
- Il server ascolta solo su 127.0.0.1, quindi e' raggiungibile da questo Mac
  e da nessun altro.
- I dati non entrano nella cronologia di Git.

**Non c'e' ancora**

Checklist di procedure ripetitive, conteggio ore, accesso da telefono,
allegati, esportazione in PDF o Excel.
