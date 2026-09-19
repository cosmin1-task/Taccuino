// Taccuino - server locale, senza dipendenze esterne.
// Avvia con: node server.js
// I dati stanno in dati.json, nella stessa cartella.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = 4321;
const CARTELLA = __dirname;
const FILE_DATI = path.join(CARTELLA, 'dati.json');
const FILE_BACKUP = path.join(CARTELLA, 'dati.backup.json');
const PUBBLICA = path.join(CARTELLA, 'public');

const COLLEZIONI = ['clienti', 'incarichi', 'note'];
const VUOTO = { clienti: [], incarichi: [], note: [] };

// ---------- lettura e scrittura dei dati ----------

function leggiDati() {
  try {
    const testo = fs.readFileSync(FILE_DATI, 'utf8');
    const dati = JSON.parse(testo);
    for (const c of COLLEZIONI) if (!Array.isArray(dati[c])) dati[c] = [];
    return dati;
  } catch (err) {
    if (err.code === 'ENOENT') return JSON.parse(JSON.stringify(VUOTO));
    // Il file esiste ma e' illeggibile: non lo tocchiamo, meglio fermarsi.
    console.error('\nERRORE: dati.json non e\' leggibile.', err.message);
    console.error('Il file non verra\' sovrascritto. Controllalo prima di continuare.\n');
    throw err;
  }
}

function scriviDati(dati) {
  // Prima una copia di sicurezza, poi scrittura su file temporaneo e rinomina:
  // cosi' un'interruzione non lascia mai dati.json a meta'.
  if (fs.existsSync(FILE_DATI)) {
    try { fs.copyFileSync(FILE_DATI, FILE_BACKUP); } catch (e) { /* non bloccante */ }
  }
  const temporaneo = FILE_DATI + '.tmp';
  fs.writeFileSync(temporaneo, JSON.stringify(dati, null, 2), 'utf8');
  fs.renameSync(temporaneo, FILE_DATI);
}

function nuovoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- validazione ----------

const STATI = ['da fare', 'in corso', 'fatto'];

function testo(valore, max) {
  if (typeof valore !== 'string') return '';
  return valore.trim().slice(0, max);
}

function normalizza(tipo, corpo, precedente) {
  const vecchio = precedente || {};
  if (tipo === 'clienti') {
    return {
      id: vecchio.id || nuovoId(),
      nome: testo(corpo.nome, 200),
      contatto: testo(corpo.contatto, 300),
      note: testo(corpo.note, 5000),
      creato: vecchio.creato || new Date().toISOString(),
    };
  }
  if (tipo === 'incarichi') {
    const stato = STATI.includes(corpo.stato) ? corpo.stato : (vecchio.stato || 'da fare');
    return {
      id: vecchio.id || nuovoId(),
      titolo: testo(corpo.titolo, 300),
      clienteId: testo(corpo.clienteId, 100),
      stato: stato,
      scadenza: /^\d{4}-\d{2}-\d{2}$/.test(corpo.scadenza || '') ? corpo.scadenza : '',
      note: testo(corpo.note, 10000),
      creato: vecchio.creato || new Date().toISOString(),
      aggiornato: new Date().toISOString(),
    };
  }
  // note
  return {
    id: vecchio.id || nuovoId(),
    testo: testo(corpo.testo, 50000),
    clienteId: testo(corpo.clienteId, 100),
    incaricoId: testo(corpo.incaricoId, 100),
    creato: vecchio.creato || new Date().toISOString(),
    aggiornato: new Date().toISOString(),
  };
}

// ---------- utilita' http ----------

function rispondiJson(res, codice, oggetto) {
  const corpo = JSON.stringify(oggetto);
  res.writeHead(codice, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(corpo);
}

function leggiCorpo(req) {
  return new Promise((risolvi, rifiuta) => {
    let pezzi = '';
    let troppo = false;
    req.on('data', (p) => {
      pezzi += p;
      if (pezzi.length > 2_000_000) { troppo = true; req.destroy(); }
    });
    req.on('end', () => {
      if (troppo) return rifiuta(new Error('corpo troppo grande'));
      if (!pezzi) return risolvi({});
      try { risolvi(JSON.parse(pezzi)); } catch (e) { rifiuta(new Error('JSON non valido')); }
    });
    req.on('error', rifiuta);
  });
}

const TIPI_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serviStatico(res, percorsoRichiesto) {
  const relativo = percorsoRichiesto === '/' ? 'index.html' : percorsoRichiesto.replace(/^\/+/, '');
  const completo = path.join(PUBBLICA, relativo);
  // Difesa contro percorsi tipo ../../: si resta dentro public/
  if (!completo.startsWith(PUBBLICA + path.sep) && completo !== PUBBLICA) {
    res.writeHead(403); return res.end('Vietato');
  }
  fs.readFile(completo, (err, contenuto) => {
    if (err) { res.writeHead(404); return res.end('Non trovato'); }
    res.writeHead(200, { 'Content-Type': TIPI_MIME[path.extname(completo)] || 'application/octet-stream' });
    res.end(contenuto);
  });
}

// ---------- il server ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const percorso = url.pathname;

  if (!percorso.startsWith('/api/')) return serviStatico(res, percorso);

  try {
    // /api/dati -> tutto l'archivio
    if (percorso === '/api/dati' && req.method === 'GET') {
      return rispondiJson(res, 200, leggiDati());
    }

    const pezzi = percorso.split('/').filter(Boolean); // ['api', tipo, id?]
    const tipo = pezzi[1];
    const id = pezzi[2];

    if (!COLLEZIONI.includes(tipo)) {
      return rispondiJson(res, 404, { errore: 'Sezione sconosciuta' });
    }

    const dati = leggiDati();

    if (req.method === 'POST' && !id) {
      const corpo = await leggiCorpo(req);
      const elemento = normalizza(tipo, corpo, null);
      dati[tipo].unshift(elemento);
      scriviDati(dati);
      return rispondiJson(res, 201, elemento);
    }

    if (req.method === 'PUT' && id) {
      const indice = dati[tipo].findIndex((e) => e.id === id);
      if (indice === -1) return rispondiJson(res, 404, { errore: 'Non trovato' });
      const corpo = await leggiCorpo(req);
      const unito = Object.assign({}, dati[tipo][indice], corpo);
      dati[tipo][indice] = normalizza(tipo, unito, dati[tipo][indice]);
      scriviDati(dati);
      return rispondiJson(res, 200, dati[tipo][indice]);
    }

    if (req.method === 'DELETE' && id) {
      const indice = dati[tipo].findIndex((e) => e.id === id);
      if (indice === -1) return rispondiJson(res, 404, { errore: 'Non trovato' });
      dati[tipo].splice(indice, 1);
      // Se cancello un cliente, le sue note e i suoi incarichi restano ma perdono il collegamento.
      if (tipo === 'clienti') {
        for (const i of dati.incarichi) if (i.clienteId === id) i.clienteId = '';
        for (const n of dati.note) if (n.clienteId === id) n.clienteId = '';
      }
      if (tipo === 'incarichi') {
        for (const n of dati.note) if (n.incaricoId === id) n.incaricoId = '';
      }
      scriviDati(dati);
      return rispondiJson(res, 200, { ok: true });
    }

    return rispondiJson(res, 405, { errore: 'Metodo non ammesso' });
  } catch (err) {
    console.error('Errore:', err.message);
    return rispondiJson(res, 500, { errore: err.message });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\nLa porta ' + PORTA + ' e\' gia\' occupata.');
    console.error('Probabilmente il Taccuino e\' gia\' aperto: guarda http://localhost:' + PORTA + '\n');
    process.exit(1);
  }
  throw err;
});

// Ascolta solo su 127.0.0.1: raggiungibile da questo Mac, da nessun altro.
server.listen(PORTA, '127.0.0.1', () => {
  if (!fs.existsSync(FILE_DATI)) scriviDati(JSON.parse(JSON.stringify(VUOTO)));
  console.log('');
  console.log('  Taccuino e\' attivo.');
  console.log('  Aprilo qui:  http://localhost:' + PORTA);
  console.log('');
  console.log('  I tuoi dati sono nel file dati.json, in questa cartella.');
  console.log('  Per chiudere: premi Ctrl+C, oppure chiudi questa finestra.');
  console.log('');
});
