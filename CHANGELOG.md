# Cosa e' cambiato

Ogni versione del Taccuino, dalla piu' recente alla piu' vecchia.

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
