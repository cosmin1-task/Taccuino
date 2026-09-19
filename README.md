# Taccuino

Un programma per tenere insieme **clienti**, **incarichi** e **note** del lavoro da consulente.
Gira solo sul tuo Mac: niente internet, niente account, nessun dato che esce da qui.

## Come si avvia

Doppio clic su **`Avvia Taccuino.command`**.

Si apre una finestra del Terminale (quella nera) e subito dopo il browser
all'indirizzo `http://localhost:4321`.

**La finestra nera deve restare aperta** mentre usi il Taccuino: e' il programma
vero e proprio. Se la chiudi, il Taccuino si spegne.

Per chiudere tutto: chiudi la finestra nera, oppure premi `Ctrl+C` dentro di essa.

> La prima volta macOS potrebbe dire che il file "non puo' essere aperto perche'
> proviene da uno sviluppatore non identificato". In quel caso: clic destro sul
> file, poi **Apri**, poi **Apri** di nuovo nella finestra che compare.
> Succede una volta sola.

## Come si usa

- **Incarichi** — cosa devi fare, per chi, entro quando. Il menu a sinistra di
  ogni riga cambia lo stato: da fare, in corso, fatto.
- **Clienti** — l'anagrafica. Serve per agganciare incarichi e note a un nome.
- **Note** — appunti liberi, con la data. Puoi collegarli a un cliente o a un incarico.
- **Ricerca in alto** — cerca contemporaneamente dentro clienti, incarichi e note.
  Scorciatoia: `Cmd+K`. Per svuotarla: `Esc`.

Dentro le note, `Cmd+Invio` salva senza toccare il mouse.

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
      dati.json            i tuoi dati
      Avvia Taccuino.command  il file da cliccare

Nessuna libreria esterna, nessun `npm install`. Serve solo Node.js installato.

## Se qualcosa non va

- **"Manca Node.js"** — la finestra nera ti dice cosa scaricare. Da `nodejs.org`, versione LTS.
- **"La porta 4321 e' gia' occupata"** — il Taccuino e' gia' aperto da qualche parte.
  Vai su `http://localhost:4321`, oppure chiudi l'altra finestra nera.
- **La pagina dice che non riesce a contattare il programma** — hai chiuso la
  finestra nera. Riavvia col doppio clic.

## Cosa manca ancora (i prossimi passi)

1. Checklist di procedure ripetitive, da richiamare e spuntare per ogni cliente
2. Conteggio delle ore per incarico, per la fatturazione
3. Un modo per consultarlo dal telefono
