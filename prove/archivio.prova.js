// Provo l'archivio: le regole su come cambiano i dati, uguali sul computer e sull'iPhone.
// Si esegue con:  node prove/archivio.prova.js
const Archivio = require('../public/archivio.js');

let errori = 0, prove = 0;
function uguale(ottenuto, atteso, cosa) {
  prove++;
  const ok = JSON.stringify(ottenuto) === JSON.stringify(atteso);
  if (!ok) errori++;
  console.log((ok ? '  ok  ' : ' NO!  ') + cosa + (ok ? '' : '\n        atteso:   ' + JSON.stringify(atteso)
    + '\n        ottenuto: ' + JSON.stringify(ottenuto)));
}

const OGGI = '2026-10-03';
const chiedi = (dati, metodo, percorso, corpo) => Archivio.rispondi(dati, metodo, percorso, corpo, OGGI);

console.log('\nArchivio vuoto');
let d = Archivio.vuoto();
let r = chiedi(d, 'GET', '/api/dati');
uguale([r.codice, r.modificato, r.corpo.incarichi.length], [200, false, 0], 'aprire un archivio vuoto non lo modifica');
r = chiedi(d, 'GET', '/api/sconosciuto');
uguale(r.codice, 404, 'un indirizzo sconosciuto risponde "non trovato"');

console.log('\nClienti, incarichi, note');
r = chiedi(d, 'POST', '/api/clienti', { nome: '  Rossi srl  ', contatto: 'rossi@example.com' });
uguale([r.codice, r.modificato, d.clienti[0].nome], [201, true, 'Rossi srl'], 'un cliente entra, senza spazi ai lati');
const cliente = r.corpo.id;
r = chiedi(d, 'POST', '/api/clienti', { nome: '   ' });
uguale([r.codice, r.modificato, d.clienti.length], [400, false, 1], 'un cliente senza nome viene rifiutato e non tocca niente');
r = chiedi(d, 'POST', '/api/incarichi', { titolo: 'Bilancio', clienteId: cliente, livello: 'presto' });
uguale([r.codice, r.corpo.stato, r.corpo.livello, r.corpo.dataInizio], [201, 'da fare', 'presto', OGGI],
  'un incarico nuovo parte "da fare", dal giorno di oggi');
const incarico = r.corpo.id;
r = chiedi(d, 'POST', '/api/incarichi', { titolo: 'Strano', livello: 'inventato', stato: 'boh', scadenza: 'domani' });
uguale([r.corpo.livello, r.corpo.stato, r.corpo.scadenza], ['pianificare', 'da fare', ''], 'livello, stato e date strani diventano quelli di partenza');
r = chiedi(d, 'POST', '/api/note', { testo: 'Chiamare', clienteId: cliente, incaricoId: incarico });
uguale(r.codice, 201, 'una nota collegata entra');
const nota = r.corpo.id;

console.log('\nModifiche');
d.incarichi.find((i) => i.id === incarico).dataInizio = '2026-09-01';
r = chiedi(d, 'PUT', '/api/incarichi/' + incarico, { stato: 'in corso' });
uguale([r.corpo.stato, r.corpo.titolo, r.corpo.dataInizio], ['in corso', 'Bilancio', '2026-09-01'], 'la modifica cambia solo quello che le dai');
r = chiedi(d, 'PUT', '/api/incarichi/' + incarico, { livello: 'aspettare' });
uguale(r.corpo.dataInizio, OGGI, 'spostare il livello a mano fa ripartire il conteggio da oggi');
r = chiedi(d, 'PUT', '/api/incarichi/' + incarico, { livello: 'presto', dataInizio: '2026-09-20' });
uguale(r.corpo.dataInizio, '2026-09-20', '...a meno che tu non scelga la data');
r = chiedi(d, 'PUT', '/api/note/inesistente', { testo: 'x' });
uguale(r.codice, 404, 'modificare qualcosa che non c\'e\' risponde "non trovato"');

console.log('\nEliminare');
r = chiedi(d, 'DELETE', '/api/incarichi/' + incarico);
uguale([r.codice, d.note.find((n) => n.id === nota).incaricoId], [200, ''], 'eliminare un incarico stacca le sue note');
r = chiedi(d, 'DELETE', '/api/clienti/' + cliente);
uguale([d.note.find((n) => n.id === nota).clienteId, d.incarichi.every((i) => i.clienteId === '')], ['', true],
  'eliminare un cliente stacca note e incarichi, senza cancellarli');

console.log('\nVersioni vecchie');
d = Archivio.sistema({ clienti: [], incarichi: [{ id: 'a', titolo: 'Vecchio', stato: 'da fare', creato: '2026-09-19T10:00:00.000Z' }] }, OGGI);
uguale([d.incarichi[0].livello, d.incarichi[0].dataInizio, d.note, d.impostazioni.ultimaCopia],
  ['pianificare', '2026-09-19', [], null], 'un dati.json della 0.0 si apre: livello e data di inizio dalla creazione');

console.log('\nCopia di sicurezza');
d = Archivio.vuoto();
chiedi(d, 'POST', '/api/clienti', { nome: 'Gia\' qui' });
r = chiedi(d, 'POST', '/api/copia-fatta');
uguale([r.modificato, typeof d.impostazioni.ultimaCopia], [true, 'string'], 'si ricorda quando e\' stata fatta l\'ultima copia');
const prima = JSON.stringify(d);
for (const [cosa, file] of [
  ['un file che non e\' un archivio', { ciao: 1 }],
  ['una lista invece di un archivio', []],
  ['un incarico senza id', { incarichi: [{ titolo: 'x' }] }],
  ['due note con lo stesso id', { note: [{ id: 'n', testo: 'a' }, { id: 'n', testo: 'b' }] }],
  ['un cliente senza nome', { clienti: [{ id: 'c', nome: '' }] }],
]) {
  r = chiedi(d, 'POST', '/api/importa', { dati: file });
  uguale([r.codice, r.modificato, JSON.stringify(d) === prima], [400, false, true], cosa + ': rifiutato senza toccare niente');
}
const copia = {
  clienti: [{ id: 'c1', nome: 'Bianchi', contatto: '', note: '', creato: '2026-09-20T08:00:00.000Z' }],
  incarichi: [{ id: 'i1', titolo: 'Dichiarazione', clienteId: 'c1', stato: 'in corso', creato: '2026-09-20T08:00:00.000Z',
    aggiornato: '2026-09-21T08:00:00.000Z' }],
  note: [{ id: 'n1', testo: 'Documenti arrivati', clienteId: 'c1', incaricoId: 'i1', creato: '2026-09-22T08:00:00.000Z' }],
};
r = chiedi(d, 'POST', '/api/importa', { dati: copia });
uguale([r.codice, d.clienti.map((c) => c.nome), d.incarichi[0].livello, d.incarichi[0].dataInizio, d.incarichi[0].aggiornato, d.note.length],
  [200, ['Bianchi'], 'pianificare', '2026-09-20', '2026-09-21T08:00:00.000Z', 1],
  'una copia buona (anche di una versione vecchia) sostituisce tutto');

console.log('\n' + (errori ? errori + ' prove su ' + prove + ' NON passano.' : 'Tutte le ' + prove + ' prove passano.') + '\n');
process.exit(errori ? 1 : 0);
