/* Taccuino - i livelli di urgenza e il loro invecchiamento.

   L'idea di fondo: il livello NON viene salvato mano a mano che sale.
   Si salvano solo il livello di partenza e la data di inizio, e il livello
   attuale si ricalcola ogni volta che si guarda la lista.

   Cosi' il conto e' sempre giusto anche se il Taccuino resta chiuso un mese,
   e non serve nessun timer acceso da qualche parte.
*/

const LIVELLI = [
  { chiave: 'aspettare',   nome: 'Puo’ aspettare',  giorniPerSalire: 14 },
  { chiave: 'pianificare', nome: 'Da pianificare',       giorniPerSalire: 7 },
  { chiave: 'presto',      nome: 'Da fare presto',       giorniPerSalire: 3 },
  { chiave: 'subito',      nome: 'Subito',               giorniPerSalire: null },
];

const LIVELLO_PREDEFINITO = 'pianificare';

function indiceLivello(chiave) {
  const i = LIVELLI.findIndex((l) => l.chiave === chiave);
  return i === -1 ? LIVELLI.findIndex((l) => l.chiave === LIVELLO_PREDEFINITO) : i;
}

// Giorni interi trascorsi da una data scritta come AAAA-MM-GG.
// Negativo se la data e' nel futuro.
function giorniTrascorsi(dataIso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIso || '')) return 0;
  const [a, m, g] = dataIso.split('-').map(Number);
  const inizio = Date.UTC(a, m - 1, g);
  const adesso = new Date();
  const oggi = Date.UTC(adesso.getFullYear(), adesso.getMonth(), adesso.getDate());
  return Math.round((oggi - inizio) / 86400000);
}

/* Restituisce il livello a cui l'incarico e' arrivato oggi.
   { indice, base, salito, giorni, nonIniziato } */
function livelloEffettivo(inc) {
  const base = indiceLivello(inc.livello);
  const giorni = giorniTrascorsi(inc.dataInizio);

  // Un incarico gia' fatto smette di invecchiare, e uno che deve ancora
  // partire non ha ancora iniziato a contare.
  if (inc.stato === 'fatto') return { indice: base, base, salito: 0, giorni, nonIniziato: false };
  if (giorni < 0) return { indice: base, base, salito: 0, giorni, nonIniziato: true };

  let indice = base;
  let restanti = giorni;
  while (indice < LIVELLI.length - 1 && LIVELLI[indice].giorniPerSalire !== null
         && restanti >= LIVELLI[indice].giorniPerSalire) {
    restanti -= LIVELLI[indice].giorniPerSalire;
    indice += 1;
  }
  return { indice, base, salito: indice - base, giorni, nonIniziato: false };
}

// Quanti giorni mancano al prossimo scatto. null se e' gia' in cima.
function giorniAlProssimoScatto(inc) {
  const stato = livelloEffettivo(inc);
  if (stato.nonIniziato || inc.stato === 'fatto') return null;
  const corrente = LIVELLI[stato.indice];
  if (corrente.giorniPerSalire === null) return null;
  let consumati = 0;
  for (let i = stato.base; i < stato.indice; i++) consumati += LIVELLI[i].giorniPerSalire;
  return corrente.giorniPerSalire - (stato.giorni - consumati);
}
