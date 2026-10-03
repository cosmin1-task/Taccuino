/* Taccuino - l'archivio.
   Tutte le regole su come cambiano i dati: cosa si accetta, cosa si rifiuta,
   cosa succede agli incarichi e alle note quando sparisce un cliente.

   Lo usano due padroni diversi, con le stesse identiche regole:
   - server.js sul computer, che poi scrive il risultato in dati.json;
   - la pagina sull'iPhone, che lo salva nella memoria del telefono.

   Qui non si legge e non si scrive niente: si riceve l'archivio, si fa la
   modifica e si dice se e' cambiato. Dove salvarlo lo decide chi chiama. */

const Archivio = (function () {
  const COLLEZIONI = ['clienti', 'incarichi', 'note'];
  const STATI = ['da fare', 'in corso', 'fatto'];

  // Le chiavi dei livelli di urgenza. Come salgono col tempo sta in
  // livelli.js: qui serve solo sapere quali valori sono accettabili.
  const LIVELLI = ['aspettare', 'pianificare', 'presto', 'subito'];
  const LIVELLO_PREDEFINITO = 'pianificare';

  class Errore400 extends Error {}

  function vuoto() {
    return { clienti: [], incarichi: [], note: [], impostazioni: { ultimaCopia: null } };
  }

  const E_UNA_DATA = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

  function oggiIso() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0');
  }

  function nuovoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function testo(valore, max) {
    if (typeof valore !== 'string') return '';
    return valore.trim().slice(0, max);
  }

  /* Porta un archivio di qualunque versione alla forma attuale.
     Gli incarichi della 0.0 non hanno livello ne' data di inizio; gli
     archivi fino alla 0.2 non sanno quando e' stata fatta l'ultima copia. */
  function sistema(dati, oggi) {
    if (!dati || typeof dati !== 'object' || Array.isArray(dati)) throw new Errore400('Non e\' un archivio del Taccuino');
    for (const c of COLLEZIONI) if (!Array.isArray(dati[c])) dati[c] = [];
    for (const inc of dati.incarichi) {
      if (!LIVELLI.includes(inc.livello)) inc.livello = LIVELLO_PREDEFINITO;
      if (!E_UNA_DATA(inc.dataInizio)) {
        const creato = String(inc.creato || '').slice(0, 10);
        inc.dataInizio = E_UNA_DATA(creato) ? creato : (oggi || oggiIso());
      }
    }
    if (!dati.impostazioni || typeof dati.impostazioni !== 'object' || Array.isArray(dati.impostazioni)) {
      dati.impostazioni = {};
    }
    if (!('ultimaCopia' in dati.impostazioni)) dati.impostazioni.ultimaCopia = null;
    return dati;
  }

  // ---------------------------------------------------------------- normalizzazione

  function normalizza(tipo, corpo, precedente, oggi) {
    const vecchio = precedente || {};
    const adesso = new Date().toISOString();
    if (tipo === 'clienti') {
      const nome = testo(corpo.nome, 200);
      if (!nome) throw new Errore400('Manca il nome del cliente');
      return {
        id: vecchio.id || nuovoId(),
        nome,
        contatto: testo(corpo.contatto, 300),
        note: testo(corpo.note, 5000),
        creato: vecchio.creato || adesso,
      };
    }
    if (tipo === 'incarichi') {
      const titolo = testo(corpo.titolo, 300);
      if (!titolo) throw new Errore400('Manca il titolo dell\'incarico');
      return {
        id: vecchio.id || nuovoId(),
        titolo,
        clienteId: testo(corpo.clienteId, 100),
        stato: STATI.includes(corpo.stato) ? corpo.stato : (vecchio.stato || 'da fare'),
        livello: LIVELLI.includes(corpo.livello) ? corpo.livello : (vecchio.livello || LIVELLO_PREDEFINITO),
        dataInizio: E_UNA_DATA(corpo.dataInizio) ? corpo.dataInizio : (vecchio.dataInizio || oggi || oggiIso()),
        scadenza: E_UNA_DATA(corpo.scadenza) ? corpo.scadenza : '',
        note: testo(corpo.note, 10000),
        creato: vecchio.creato || adesso,
        aggiornato: adesso,
      };
    }
    // note
    const scritto = testo(corpo.testo, 50000);
    if (!scritto) throw new Errore400('La nota e\' vuota');
    return {
      id: vecchio.id || nuovoId(),
      testo: scritto,
      clienteId: testo(corpo.clienteId, 100),
      incaricoId: testo(corpo.incaricoId, 100),
      creato: vecchio.creato || adesso,
      aggiornato: adesso,
    };
  }

  /* Un archivio arrivato da una copia di sicurezza. Prima si controlla
     tutto, e solo se va bene si sostituisce: una copia sbagliata non deve
     lasciare a meta' quello che c'e'. */
  function daImportare(letto, oggi) {
    if (!letto || typeof letto !== 'object' || Array.isArray(letto)
        || !COLLEZIONI.some((c) => Array.isArray(letto[c]))) {
      throw new Errore400('Questo file non e\' una copia del Taccuino');
    }
    const copia = sistema(JSON.parse(JSON.stringify(letto)), oggi);
    const nuovo = vuoto();
    nuovo.impostazioni = { ultimaCopia: copia.impostazioni.ultimaCopia || null };
    for (const c of COLLEZIONI) {
      const visti = new Set();
      for (const el of copia[c]) {
        if (!el || typeof el !== 'object' || typeof el.id !== 'string' || !el.id || visti.has(el.id)) {
          throw new Errore400('La copia contiene ' + c + ' rovinati');
        }
        visti.add(el.id);
        const pulito = normalizza(c, el, el, oggi);
        if (el.aggiornato) pulito.aggiornato = el.aggiornato;
        nuovo[c].push(pulito);
      }
    }
    return nuovo;
  }

  // ---------------------------------------------------------------- le richieste

  /* Risponde a una richiesta come farebbe un server.
     Restituisce { codice, corpo, modificato }: "modificato" dice a chi
     chiama se l'archivio va salvato. */
  function rispondi(dati, metodo, percorso, corpo, oggi) {
    corpo = corpo || {};
    const giorno = oggi || oggiIso();
    const ok = (c, risposta, modificato) => ({ codice: c, corpo: risposta, modificato: !!modificato });
    try {
      if (percorso === '/api/dati' && metodo === 'GET') return ok(200, dati);

      // Sostituire tutto con una copia di sicurezza.
      if (percorso === '/api/importa' && metodo === 'POST') {
        const nuovo = daImportare(corpo.dati, giorno);
        for (const k of Object.keys(dati)) delete dati[k];
        Object.assign(dati, nuovo);
        return ok(200, { dati }, true);
      }

      // Segna che una copia di sicurezza e' stata appena fatta.
      if (percorso === '/api/copia-fatta' && metodo === 'POST') {
        dati.impostazioni.ultimaCopia = new Date().toISOString();
        return ok(200, { impostazioni: dati.impostazioni }, true);
      }

      const pezzi = percorso.split('/').filter(Boolean); // ['api', tipo, id?]
      const tipo = pezzi[1];
      const id = pezzi[2];
      if (pezzi[0] !== 'api' || !COLLEZIONI.includes(tipo)) return ok(404, { errore: 'Sezione sconosciuta' });

      if (metodo === 'POST' && !id) {
        const elemento = normalizza(tipo, corpo, null, giorno);
        dati[tipo].unshift(elemento);
        return ok(201, elemento, true);
      }

      if (metodo === 'PUT' && id) {
        const indice = dati[tipo].findIndex((e) => e.id === id);
        if (indice === -1) return ok(404, { errore: 'Non trovato' });
        const cambi = Object.assign({}, corpo);
        // Se sposti il livello a mano e non tocchi la data di inizio, il
        // conteggio dei giorni riparte da oggi: e' il modo per rimandare
        // davvero qualcosa, invece di vederla risalire subito.
        if (tipo === 'incarichi' && cambi.livello
            && cambi.livello !== dati[tipo][indice].livello
            && cambi.dataInizio === undefined) {
          cambi.dataInizio = giorno;
        }
        const unito = Object.assign({}, dati[tipo][indice], cambi);
        dati[tipo][indice] = normalizza(tipo, unito, dati[tipo][indice], giorno);
        return ok(200, dati[tipo][indice], true);
      }

      if (metodo === 'DELETE' && id) {
        const indice = dati[tipo].findIndex((e) => e.id === id);
        if (indice === -1) return ok(404, { errore: 'Non trovato' });
        dati[tipo].splice(indice, 1);
        // Se cancello un cliente, le sue note e i suoi incarichi restano ma perdono il collegamento.
        if (tipo === 'clienti') {
          for (const i of dati.incarichi) if (i.clienteId === id) i.clienteId = '';
          for (const n of dati.note) if (n.clienteId === id) n.clienteId = '';
        }
        if (tipo === 'incarichi') {
          for (const n of dati.note) if (n.incaricoId === id) n.incaricoId = '';
        }
        return ok(200, { ok: true }, true);
      }

      return ok(405, { errore: 'Metodo non ammesso' });
    } catch (err) {
      if (err instanceof Errore400) return ok(400, { errore: err.message });
      throw err;
    }
  }

  return { vuoto, sistema, rispondi, Errore400 };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Archivio;
