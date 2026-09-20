// Provo il calcolo con date costruite a tavolino.
const fs = require('fs'), vm = require('vm');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../public/livelli.js', 'utf8')
  + '\nglobalThis.API = { LIVELLI, livelloEffettivo, giorniAlProssimoScatto, giorniTrascorsi };', ctx);
const { LIVELLI, livelloEffettivo, giorniAlProssimoScatto } = ctx.API;

function giorniFa(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const nome = (i) => LIVELLI[i].nome;

const casi = [
  ['aspettare',    0,  'Puo’ aspettare',  'appena creato'],
  ['aspettare',   13,  'Puo’ aspettare',  'un giorno prima dello scatto'],
  ['aspettare',   14,  'Da pianificare',  'primo scatto: 14 giorni'],
  ['aspettare',   20,  'Da pianificare',  'ancora nel secondo scalino'],
  ['aspettare',   21,  'Da fare presto',  'secondo scatto: 14+7'],
  ['aspettare',   23,  'Da fare presto',  ''],
  ['aspettare',   24,  'Subito',          'terzo scatto: 14+7+3'],
  ['aspettare',  400,  'Subito',          'non va oltre'],
  ['pianificare',  6,  'Da pianificare',  ''],
  ['pianificare',  7,  'Da fare presto',  'parte da meta\' scala'],
  ['pianificare',  9,  'Da fare presto',  'un giorno prima del doppio scatto'],
  ['pianificare', 10,  'Subito',          'due scatti in una volta: 7+3'],
  ['presto',       3,  'Subito',          'tre giorni e basta'],
  ['subito',      99,  'Subito',          'il massimo resta il massimo'],
];

let errori = 0;
for (const [livello, giorni, atteso, nota] of casi) {
  const inc = { livello, dataInizio: giorniFa(giorni), stato: 'da fare' };
  const ris = nome(livelloEffettivo(inc).indice);
  const ok = ris === atteso;
  if (!ok) errori++;
  console.log((ok ? '  ok  ' : ' NO!  ') + String(giorni).padStart(3) + ' giorni da "'
    + livello + '" -> ' + ris.padEnd(16) + (nota ? '  (' + nota + ')' : ''));
}

console.log('\n-- casi particolari --');
const fatto = { livello: 'aspettare', dataInizio: giorniFa(300), stato: 'fatto' };
console.log('  incarico fatto da 300 giorni  ->', nome(livelloEffettivo(fatto).indice), '(non deve salire)');

const futuro = { livello: 'presto', dataInizio: giorniFa(-10), stato: 'da fare' };
const sf = livelloEffettivo(futuro);
console.log('  inizio fra 10 giorni          ->', nome(sf.indice), '| non iniziato:', sf.nonIniziato);

const senzaData = { livello: 'pianificare', dataInizio: '', stato: 'da fare' };
console.log('  senza data di inizio          ->', nome(livelloEffettivo(senzaData).indice), '(non deve rompersi)');

const sconosciuto = { livello: 'inventato', dataInizio: giorniFa(0), stato: 'da fare' };
console.log('  livello inesistente           ->', nome(livelloEffettivo(sconosciuto).indice), '(ripiego sul predefinito)');

console.log('\n-- giorni al prossimo scatto --');
for (const g of [0, 10, 14, 20]) {
  const inc = { livello: 'aspettare', dataInizio: giorniFa(g), stato: 'da fare' };
  console.log('  ' + String(g).padStart(2) + ' giorni ->', nome(livelloEffettivo(inc).indice),
              '| mancano', giorniAlProssimoScatto(inc), 'giorni');
}
const top = { livello: 'subito', dataInizio: giorniFa(5), stato: 'da fare' };
console.log('  gia\' a Subito -> mancano', giorniAlProssimoScatto(top), '(null = non sale piu\')');

console.log(errori ? '\n' + errori + ' CASI FALLITI' : '\nTutti i casi passati.');
