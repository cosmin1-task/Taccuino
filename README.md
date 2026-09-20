# Taccuino

**Versione 0.2**

Un programma per tenere insieme **clienti**, **incarichi** e **note** del lavoro da consulente.
Gira solo sul tuo computer: niente internet, niente account, nessun dato che esce da qui.
Funziona su macOS, Windows e Linux.

## Come si avvia

Su Mac: doppio clic su **`Avvia Taccuino.command`**.
Su Windows: doppio clic su **`Avvia Taccuino.bat`**.

Si apre una finestra del Terminale (quella nera) e subito dopo il browser
all'indirizzo `http://localhost:4321`.

**La finestra nera deve restare aperta** mentre usi il Taccuino: e' il programma
vero e proprio. Se la chiudi, il Taccuino si spegne.

Per chiudere tutto: chiudi la finestra nera, oppure premi `Ctrl+C` dentro di essa.

> La prima volta macOS potrebbe dire che il file "non puo' essere aperto perche'
> proviene da uno sviluppatore non identificato". In quel caso: clic destro sul
> file, poi **Apri**, poi **Apri** di nuovo nella finestra che compare.
> Succede una volta sola.

## Portarlo su un altro computer

Il modo pulito e' scaricarlo da GitHub con GitHub Desktop: apri il programma
sull'altro computer, accedi al tuo account e scegli il repository Taccuino.
Cosi' i due computer restano allineati sul codice, e quando arriva una
versione nuova basta premere un bottone.

In alternativa va bene anche copiare la cartella su una chiavetta, ma
**senza** le cartelle `.node-mac` o `node-win`: sono il motore compilato per
un sistema preciso e su un altro computer non funzionano.

### Su Windows

Serve Node.js. Due strade:

- **Se puoi installare programmi**: scarica la versione LTS da `nodejs.org`
  e installala. Il file `Avvia Taccuino.bat` la trovera' da solo.
- **Se il computer e' aziendale e non ti lascia installare nulla**: dalla
  stessa pagina scarica il pacchetto **.zip** per Windows invece
  dell'installer. Estrailo, rinomina la cartella che ne esce in `node-win`
  e mettila dentro la cartella Taccuino. Non serve installare niente e non
  serve la password di amministratore.

### I dati NON si sincronizzano

Ogni computer ha il suo `dati.json`. Quello che scrivi in ufficio non compare
a casa, e viceversa: sono due taccuini separati che portano lo stesso nome.

Non e' una dimenticanza, e' come e' fatto il programma in questa versione.
Se ti serve la stessa lista su piu' computer, va ripensata quella scelta —
non risolto con una copia manuale del file, che dopo due settimane ti lascia
con due versioni diverse e nessuna certezza su quale sia quella buona.

### Prima di metterlo su un computer aziendale

Due domande da farsi, e non sono informatiche:

1. La policy aziendale ti permette di installare programmi e far girare un
   server locale?
2. Nel Taccuino finiranno nomi di clienti e note sul loro lavoro. Se quel
   computer appartiene a qualcun altro, quei dati ci possono stare?

## Come si usa

- **Incarichi** — cosa devi fare, per chi, entro quando. Il menu a sinistra di
  ogni riga cambia lo stato: da fare, in corso, fatto.
- **Urgenza** — ogni incarico ha un livello, e il livello sale da solo col
  passare dei giorni (vedi sotto).
- **Clienti** — l'anagrafica. Serve per agganciare incarichi e note a un nome.
- **Note** — appunti liberi, con la data. Puoi collegarli a un cliente o a un incarico.
- **Ricerca in alto** — cerca contemporaneamente dentro clienti, incarichi e note.
  Scorciatoia: `Cmd+K`. Per svuotarla: `Esc`.

Dentro le note, `Cmd+Invio` salva senza toccare il mouse.

## L'urgenza che sale da sola

Ogni incarico parte da uno di questi quattro livelli:

| Livello | Colore | Dopo quanto sale |
|---|---|---|
| Puo' aspettare | grigio | 14 giorni |
| Da pianificare | verde | 7 giorni |
| Da fare presto | arancione | 3 giorni |
| Subito | viola | resta li' |

I giorni si contano dalla **data di inizio** (il campo "Da"), non da quando
hai creato l'incarico. Cosi' puoi segnare oggi una cosa che parte il mese
prossimo, e comincera' a invecchiare solo da allora.

Quando un incarico e' salito di livello da solo, accanto al nome compare una
freccia. Passandoci sopra col mouse leggi da dove e' partito e quando.

Se sposti il livello a mano, **il conteggio riparte da oggi**: e' il modo per
rimandare davvero qualcosa. La data nel campo "Da" si aggiorna sotto i tuoi
occhi mentre scegli, cosi' puoi correggerla prima di salvare.

Gli incarichi segnati come fatti smettono di invecchiare.

Una cosa da sapere su come e' fatto dentro: il livello attuale **non viene
salvato**. Nel file dei dati ci sono solo il livello di partenza e la data.
Il livello di oggi si ricalcola ogni volta che apri la pagina. Per questo
funziona anche se il Taccuino resta chiuso per un mese: al rientro trovi
tutto gia' al posto giusto, senza che nessun timer sia rimasto acceso.

Attenzione a non confondere due rossi: il **rosso** segnala una scadenza
superata, il **viola** segnala l'urgenza massima. Sono cose diverse e un
incarico puo' avere entrambe.

## Dove finiscono i dati

Nel file **`dati.json`**, in questa stessa cartella. E' un file di testo:
puoi aprirlo, leggerlo, copiarlo altrove per fare un backup.

Ad ogni salvataggio viene tenuta una copia della versione precedente in
`dati.backup.json`. Se qualcosa va storto, quella copia e' la tua rete di sicurezza.

Questi due file **non** finiscono nella cronologia di Git: i tuoi dati restano tuoi,
anche se un domani metti il codice online.

## Com'e' fatto dentro

    Taccuino/
      server.js            il programma: risponde al browser e salva su disco
      public/index.html    la struttura della pagina
      public/stile.css     l'aspetto
      public/app.js        il comportamento: cosa succede quando clicchi
      public/livelli.js    il calcolo dei livelli di urgenza
      prove/               i controlli automatici
      dati.json            i tuoi dati
      Avvia Taccuino.command  il file da cliccare su Mac
      Avvia Taccuino.bat      il file da cliccare su Windows

Nessuna libreria esterna, nessun `npm install`. Serve solo Node.js installato.

## Se qualcosa non va

- **"Manca Node.js"** — la finestra nera ti dice cosa scaricare. Da `nodejs.org`, versione LTS.
- **"La porta 4321 e' gia' occupata"** — il Taccuino e' gia' aperto da qualche parte.
  Vai su `http://localhost:4321`, oppure chiudi l'altra finestra nera.
- **La pagina dice che non riesce a contattare il programma** — hai chiuso la
  finestra nera. Riavvia col doppio clic.

## Le prove

Nella cartella `prove/` ci sono i controlli automatici. Per eseguirli:

    node prove/livelli.prova.js

(sul tuo Mac, dove Node sta nella cartella: `./.node-mac/bin/node prove/livelli.prova.js`)

Controllano che un incarico salga di livello al giorno giusto, che quelli
fatti non salgano, e che date strane o livelli inesistenti non rompano nulla.

## Cosa manca ancora (i prossimi passi)

1. Checklist di procedure ripetitive, da richiamare e spuntare per ogni cliente
2. Conteggio delle ore per incarico, per la fatturazione
3. Un modo per consultarlo dal telefono
