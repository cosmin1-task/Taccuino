/* Taccuino - logica dell'interfaccia.
   Tutto gira nel browser; i dati vengono letti e scritti dal server locale. */

// ---------------------------------------------------------------- stato

const stato = {
  dati: { clienti: [], incarichi: [], note: [] },
  vista: 'incarichi',
  filtroStato: 'aperti',
  ricerca: '',
  modifica: null, // { tipo, id }
};

const STATI = ['da fare', 'in corso', 'fatto'];

// ---------------------------------------------------------------- utilita'

const $ = (selettore) => document.querySelector(selettore);

function esc(testo) {
  return String(testo == null ? '' : testo)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Evidenzia il termine cercato dentro un testo, restituendo HTML gia' protetto.
function evidenzia(testo, termine) {
  const sicuro = esc(testo);
  if (!termine) return sicuro;
  const cercato = termine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sicuro.replace(new RegExp(cercato, 'gi'), (trovato) => '<mark>' + trovato + '</mark>');
}

function oggiIso() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dataLeggibile(iso) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

function scadenzaTesto(iso) {
  if (!iso) return null;
  const oggi = oggiIso();
  if (iso < oggi) return { testo: 'scaduto il ' + dataLeggibile(iso), scaduto: true };
  if (iso === oggi) return { testo: 'scade oggi', scaduto: true };
  return { testo: 'entro il ' + dataLeggibile(iso), scaduto: false };
}

function nomeCliente(id) {
  const c = stato.dati.clienti.find((x) => x.id === id);
  return c ? c.nome : '';
}

function titoloIncarico(id) {
  const i = stato.dati.incarichi.find((x) => x.id === id);
  return i ? i.titolo : '';
}

function avvisa(messaggio) {
  const box = $('#avviso');
  box.textContent = messaggio;
  box.hidden = false;
  clearTimeout(avvisa.timer);
  avvisa.timer = setTimeout(() => { box.hidden = true; }, 5000);
}

function segnalaSalvataggio() {
  const el = $('#stato-salvataggio');
  el.textContent = 'salvato';
  el.classList.add('visibile');
  clearTimeout(segnalaSalvataggio.timer);
  segnalaSalvataggio.timer = setTimeout(() => el.classList.remove('visibile'), 1400);
}

// ---------------------------------------------------------------- server

async function api(metodo, percorso, corpo) {
  const risposta = await fetch(percorso, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!risposta.ok) {
    let dettaglio = risposta.statusText;
    try { dettaglio = (await risposta.json()).errore || dettaglio; } catch (e) {}
    throw new Error(dettaglio);
  }
  return risposta.json();
}

async function carica() {
  stato.dati = await api('GET', '/api/dati');
}

async function aggiungi(tipo, corpo) {
  try {
    const creato = await api('POST', '/api/' + tipo, corpo);
    stato.dati[tipo].unshift(creato);
    segnalaSalvataggio();
    disegna();
  } catch (e) { avvisa('Non sono riuscito a salvare: ' + e.message); }
}

async function modifica(tipo, id, cambiamenti) {
  try {
    const aggiornato = await api('PUT', '/api/' + tipo + '/' + id, cambiamenti);
    const indice = stato.dati[tipo].findIndex((x) => x.id === id);
    if (indice !== -1) stato.dati[tipo][indice] = aggiornato;
    segnalaSalvataggio();
    disegna();
  } catch (e) { avvisa('Non sono riuscito a salvare: ' + e.message); }
}

async function elimina(tipo, id) {
  try {
    await api('DELETE', '/api/' + tipo + '/' + id);
    await carica(); // ricarico: cancellare un cliente tocca anche incarichi e note
    segnalaSalvataggio();
    disegna();
  } catch (e) { avvisa('Non sono riuscito a eliminare: ' + e.message); }
}

// ---------------------------------------------------------------- pezzi comuni

function bottoniAzione(tipo, id) {
  return '<div class="azioni">'
    + '<button class="bottone-icona" data-azione="modifica" data-tipo="' + tipo + '" data-id="' + id + '">Modifica</button>'
    + '<button class="bottone-icona pericolo" data-azione="elimina" data-tipo="' + tipo + '" data-id="' + id + '">Elimina</button>'
    + '</div>';
}

function opzioniClienti(selezionato) {
  let html = '<option value="">- nessun cliente -</option>';
  for (const c of stato.dati.clienti) {
    html += '<option value="' + c.id + '"' + (c.id === selezionato ? ' selected' : '') + '>' + esc(c.nome) + '</option>';
  }
  return html;
}

function opzioniIncarichi(selezionato) {
  let html = '<option value="">- nessun incarico -</option>';
  for (const i of stato.dati.incarichi) {
    html += '<option value="' + i.id + '"' + (i.id === selezionato ? ' selected' : '') + '>' + esc(i.titolo) + '</option>';
  }
  return html;
}

function inModifica(tipo, id) {
  return stato.modifica && stato.modifica.tipo === tipo && stato.modifica.id === id;
}

function bottoniSalvataggio(tipo, id) {
  return '<div class="azioni" style="margin-top:8px">'
    + '<button class="bottone-icona" data-azione="annulla">Annulla</button>'
    + '<button class="bottone-primario" data-azione="salva" data-tipo="' + tipo + '" data-id="' + id + '">Salva</button>'
    + '</div>';
}

// ---------------------------------------------------------------- incarichi

function ordinaIncarichi(elenco) {
  return elenco.slice().sort((a, b) => {
    if (a.scadenza && b.scadenza) return a.scadenza.localeCompare(b.scadenza);
    if (a.scadenza) return -1;
    if (b.scadenza) return 1;
    return (b.creato || '').localeCompare(a.creato || '');
  });
}

function schedaIncarico(inc, termine) {
  if (inModifica('incarichi', inc.id)) {
    return '<div class="elemento" data-id="' + inc.id + '">'
      + '<input class="modifica-area" data-campo="titolo" value="' + esc(inc.titolo) + '" maxlength="300">'
      + '<div class="riga-nota" style="margin-top:8px">'
      +   '<select class="stato-scelta" data-campo="clienteId" style="flex:1">' + opzioniClienti(inc.clienteId) + '</select>'
      +   '<input class="stato-scelta" type="date" data-campo="scadenza" value="' + esc(inc.scadenza) + '">'
      + '</div>'
      + '<textarea class="modifica-area" data-campo="note" rows="3" placeholder="Note su questo incarico...">' + esc(inc.note) + '</textarea>'
      + bottoniSalvataggio('incarichi', inc.id)
      + '</div>';
  }

  const scad = scadenzaTesto(inc.scadenza);
  const cliente = nomeCliente(inc.clienteId);

  let meta = '';
  if (cliente) meta += '<span class="pillola cliente">' + evidenzia(cliente, termine) + '</span>';
  if (scad) meta += '<span class="pillola' + (scad.scaduto && inc.stato !== 'fatto' ? ' scaduto' : '') + '">' + esc(scad.testo) + '</span>';

  let sceltaStato = '<select class="stato-scelta" data-azione="stato" data-id="' + inc.id + '">';
  for (const s of STATI) sceltaStato += '<option value="' + s + '"' + (s === inc.stato ? ' selected' : '') + '>' + s + '</option>';
  sceltaStato += '</select>';

  return '<div class="elemento' + (inc.stato === 'fatto' ? ' fatto' : '') + '" data-id="' + inc.id + '">'
    + '<div class="riga-elemento">'
    +   sceltaStato
    +   '<div style="flex:1;min-width:0">'
    +     '<div class="titolo-elemento">' + evidenzia(inc.titolo, termine) + '</div>'
    +     (meta ? '<div class="meta">' + meta + '</div>' : '')
    +     (inc.note ? '<div class="meta" style="white-space:pre-wrap">' + evidenzia(inc.note, termine) + '</div>' : '')
    +   '</div>'
    +   bottoniAzione('incarichi', inc.id)
    + '</div>'
    + '</div>';
}

function disegnaIncarichi() {
  let daMostrare;
  if (stato.filtroStato === 'tutti') daMostrare = STATI;
  else if (stato.filtroStato === 'aperti') daMostrare = ['in corso', 'da fare'];
  else daMostrare = [stato.filtroStato];

  let html = '';
  let totale = 0;
  for (const s of daMostrare) {
    const gruppo = ordinaIncarichi(stato.dati.incarichi.filter((i) => i.stato === s));
    if (!gruppo.length) continue;
    totale += gruppo.length;
    if (daMostrare.length > 1) html += '<div class="gruppo-titolo">' + s + ' (' + gruppo.length + ')</div>';
    for (const inc of gruppo) html += schedaIncarico(inc, '');
  }

  $('#elenco-incarichi').innerHTML = totale ? html
    : '<div class="vuoto">Nessun incarico qui.<br>Scrivi sopra cosa devi fare e premi Aggiungi.</div>';
}

// ---------------------------------------------------------------- clienti

function schedaCliente(cli, termine) {
  if (inModifica('clienti', cli.id)) {
    return '<div class="elemento" data-id="' + cli.id + '">'
      + '<input class="modifica-area" data-campo="nome" value="' + esc(cli.nome) + '" maxlength="200">'
      + '<input class="modifica-area" data-campo="contatto" value="' + esc(cli.contatto) + '" placeholder="Contatto" maxlength="300">'
      + '<textarea class="modifica-area" data-campo="note" rows="3" placeholder="Note sul cliente...">' + esc(cli.note) + '</textarea>'
      + bottoniSalvataggio('clienti', cli.id)
      + '</div>';
  }

  const aperti = stato.dati.incarichi.filter((i) => i.clienteId === cli.id && i.stato !== 'fatto').length;
  const quanteNote = stato.dati.note.filter((n) => n.clienteId === cli.id).length;

  let meta = '';
  if (cli.contatto) meta += '<span>' + evidenzia(cli.contatto, termine) + '</span>';
  meta += '<span class="pillola">' + aperti + ' in sospeso</span>';
  if (quanteNote) meta += '<span class="pillola">' + quanteNote + (quanteNote === 1 ? ' nota' : ' note') + '</span>';

  return '<div class="elemento" data-id="' + cli.id + '">'
    + '<div class="riga-elemento">'
    +   '<div style="flex:1;min-width:0">'
    +     '<div class="titolo-elemento">' + evidenzia(cli.nome, termine) + '</div>'
    +     '<div class="meta">' + meta + '</div>'
    +     (cli.note ? '<div class="meta" style="white-space:pre-wrap">' + evidenzia(cli.note, termine) + '</div>' : '')
    +   '</div>'
    +   bottoniAzione('clienti', cli.id)
    + '</div>'
    + '</div>';
}

function disegnaClienti() {
  const elenco = stato.dati.clienti.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  $('#elenco-clienti').innerHTML = elenco.length
    ? elenco.map((c) => schedaCliente(c, '')).join('')
    : '<div class="vuoto">Nessun cliente.<br>Aggiungine uno qui sopra per poterci agganciare incarichi e note.</div>';
}

// ---------------------------------------------------------------- note

function schedaNota(nota, termine) {
  if (inModifica('note', nota.id)) {
    return '<div class="elemento" data-id="' + nota.id + '">'
      + '<textarea class="modifica-area" data-campo="testo" rows="5">' + esc(nota.testo) + '</textarea>'
      + '<div class="riga-nota" style="margin-top:8px">'
      +   '<select class="stato-scelta" data-campo="clienteId" style="flex:1">' + opzioniClienti(nota.clienteId) + '</select>'
      +   '<select class="stato-scelta" data-campo="incaricoId" style="flex:1">' + opzioniIncarichi(nota.incaricoId) + '</select>'
      + '</div>'
      + bottoniSalvataggio('note', nota.id)
      + '</div>';
  }

  const cliente = nomeCliente(nota.clienteId);
  const incarico = titoloIncarico(nota.incaricoId);

  let meta = '<span>' + esc(dataLeggibile(nota.creato)) + '</span>';
  if (cliente) meta += '<span class="pillola cliente">' + evidenzia(cliente, termine) + '</span>';
  if (incarico) meta += '<span class="pillola">' + evidenzia(incarico, termine) + '</span>';

  return '<div class="elemento" data-id="' + nota.id + '">'
    + '<div class="riga-elemento">'
    +   '<div style="flex:1;min-width:0">'
    +     '<div class="testo-nota">' + evidenzia(nota.testo, termine) + '</div>'
    +     '<div class="meta">' + meta + '</div>'
    +   '</div>'
    +   bottoniAzione('note', nota.id)
    + '</div>'
    + '</div>';
}

function disegnaNote() {
  const elenco = stato.dati.note.slice().sort((a, b) => (b.creato || '').localeCompare(a.creato || ''));
  $('#elenco-note').innerHTML = elenco.length
    ? elenco.map((n) => schedaNota(n, '')).join('')
    : '<div class="vuoto">Nessuna nota.<br>Scrivi qui sopra quello che ti serve ricordare.</div>';
}

// ---------------------------------------------------------------- ricerca

function contiene(valore, termine) {
  return String(valore || '').toLowerCase().includes(termine);
}

function disegnaRicerca() {
  const termine = stato.ricerca.toLowerCase().trim();
  $('#ricerca-termine').textContent = stato.ricerca;

  const clienti = stato.dati.clienti.filter((c) =>
    contiene(c.nome, termine) || contiene(c.contatto, termine) || contiene(c.note, termine));

  const incarichi = stato.dati.incarichi.filter((i) =>
    contiene(i.titolo, termine) || contiene(i.note, termine) || contiene(nomeCliente(i.clienteId), termine));

  const note = stato.dati.note.filter((n) =>
    contiene(n.testo, termine) || contiene(nomeCliente(n.clienteId), termine) || contiene(titoloIncarico(n.incaricoId), termine));

  let html = '';
  if (incarichi.length) {
    html += '<div class="gruppo-titolo">Incarichi (' + incarichi.length + ')</div>';
    html += ordinaIncarichi(incarichi).map((i) => schedaIncarico(i, termine)).join('');
  }
  if (note.length) {
    html += '<div class="gruppo-titolo">Note (' + note.length + ')</div>';
    html += note.map((n) => schedaNota(n, termine)).join('');
  }
  if (clienti.length) {
    html += '<div class="gruppo-titolo">Clienti (' + clienti.length + ')</div>';
    html += clienti.map((c) => schedaCliente(c, termine)).join('');
  }

  $('#ricerca-risultati').innerHTML = html
    || '<div class="vuoto">Nessun risultato per "' + esc(stato.ricerca) + '".</div>';
}

// ---------------------------------------------------------------- disegno generale

function disegna() {
  const cercando = stato.ricerca.trim().length > 0;

  for (const vista of ['ricerca', 'incarichi', 'clienti', 'note']) {
    $('#vista-' + vista).hidden = cercando ? vista !== 'ricerca' : vista !== stato.vista;
  }
  document.querySelectorAll('.scheda').forEach((b) => {
    b.classList.toggle('attiva', !cercando && b.dataset.vista === stato.vista);
  });

  const aperti = stato.dati.incarichi.filter((i) => i.stato !== 'fatto').length;
  $('#conteggio-incarichi').textContent = aperti || '';
  $('#conteggio-clienti').textContent = stato.dati.clienti.length || '';
  $('#conteggio-note').textContent = stato.dati.note.length || '';
  document.title = aperti ? 'Taccuino (' + aperti + ')' : 'Taccuino';

  // I menu a tendina dei moduli di aggiunta vanno tenuti aggiornati.
  const selCliente = document.querySelector('#form-incarico select[name=clienteId]');
  if (selCliente) selCliente.innerHTML = opzioniClienti(selCliente.value);
  const selClienteNota = document.querySelector('#form-nota select[name=clienteId]');
  if (selClienteNota) selClienteNota.innerHTML = opzioniClienti(selClienteNota.value);
  const selIncaricoNota = document.querySelector('#form-nota select[name=incaricoId]');
  if (selIncaricoNota) selIncaricoNota.innerHTML = opzioniIncarichi(selIncaricoNota.value);

  if (cercando) disegnaRicerca();
  else if (stato.vista === 'incarichi') disegnaIncarichi();
  else if (stato.vista === 'clienti') disegnaClienti();
  else disegnaNote();
}

// ---------------------------------------------------------------- eventi

document.querySelectorAll('.scheda').forEach((bottone) => {
  bottone.addEventListener('click', () => {
    stato.vista = bottone.dataset.vista;
    stato.modifica = null;
    disegna();
  });
});

document.querySelectorAll('.filtro').forEach((bottone) => {
  bottone.addEventListener('click', () => {
    document.querySelectorAll('.filtro').forEach((b) => b.classList.remove('attivo'));
    bottone.classList.add('attivo');
    stato.filtroStato = bottone.dataset.stato;
    disegna();
  });
});

let attesaRicerca;
$('#cerca').addEventListener('input', (e) => {
  clearTimeout(attesaRicerca);
  attesaRicerca = setTimeout(() => {
    stato.ricerca = e.target.value;
    stato.modifica = null;
    $('#cerca-pulisci').hidden = !stato.ricerca;
    disegna();
  }, 120);
});

$('#cerca-pulisci').addEventListener('click', () => {
  $('#cerca').value = '';
  stato.ricerca = '';
  $('#cerca-pulisci').hidden = true;
  disegna();
  $('#cerca').focus();
});

// Cmd/Ctrl + K mette il cursore nella ricerca, Esc la svuota.
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); $('#cerca').focus(); $('#cerca').select(); }
  if (e.key === 'Escape' && document.activeElement === $('#cerca')) {
    $('#cerca').value = ''; stato.ricerca = ''; $('#cerca-pulisci').hidden = true; disegna();
  }
});

$('#form-incarico').addEventListener('submit', (e) => {
  e.preventDefault();
  const modulo = e.target;
  const titolo = modulo.titolo.value.trim();
  if (!titolo) return;
  aggiungi('incarichi', {
    titolo: titolo,
    clienteId: modulo.clienteId.value,
    scadenza: modulo.scadenza.value,
    stato: 'da fare',
  });
  modulo.titolo.value = '';
  modulo.scadenza.value = '';
  modulo.titolo.focus();
});

$('#form-cliente').addEventListener('submit', (e) => {
  e.preventDefault();
  const modulo = e.target;
  const nome = modulo.nome.value.trim();
  if (!nome) return;
  aggiungi('clienti', { nome: nome, contatto: modulo.contatto.value });
  modulo.reset();
  modulo.nome.focus();
});

$('#form-nota').addEventListener('submit', (e) => {
  e.preventDefault();
  const modulo = e.target;
  const testo = modulo.testo.value.trim();
  if (!testo) return;
  aggiungi('note', {
    testo: testo,
    clienteId: modulo.clienteId.value,
    incaricoId: modulo.incaricoId.value,
  });
  modulo.testo.value = '';
  modulo.testo.focus();
});

// Cmd+Invio dentro la nota salva senza toccare il mouse.
document.querySelector('#form-nota textarea').addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    $('#form-nota').requestSubmit();
  }
});

// Un solo ascoltatore per tutti i bottoni dentro le liste.
document.addEventListener('click', (e) => {
  const bottone = e.target.closest('button[data-azione]');
  if (!bottone) return;
  const azione = bottone.dataset.azione;

  if (azione === 'modifica') {
    stato.modifica = { tipo: bottone.dataset.tipo, id: bottone.dataset.id };
    disegna();
    const campo = document.querySelector('.elemento[data-id="' + bottone.dataset.id + '"] .modifica-area');
    if (campo) { campo.focus(); campo.setSelectionRange(campo.value.length, campo.value.length); }
    return;
  }

  if (azione === 'annulla') { stato.modifica = null; disegna(); return; }

  if (azione === 'salva') {
    const scheda = bottone.closest('.elemento');
    const cambiamenti = {};
    scheda.querySelectorAll('[data-campo]').forEach((campo) => { cambiamenti[campo.dataset.campo] = campo.value; });
    stato.modifica = null;
    modifica(bottone.dataset.tipo, bottone.dataset.id, cambiamenti);
    return;
  }

  if (azione === 'elimina') {
    // Due passaggi invece di una finestra di conferma: il secondo clic conferma.
    if (bottone.dataset.conferma === 'si') {
      elimina(bottone.dataset.tipo, bottone.dataset.id);
    } else {
      document.querySelectorAll('[data-conferma]').forEach((b) => {
        delete b.dataset.conferma; b.textContent = 'Elimina';
      });
      bottone.dataset.conferma = 'si';
      bottone.textContent = 'Confermi?';
      setTimeout(() => {
        if (bottone.dataset.conferma === 'si') { delete bottone.dataset.conferma; bottone.textContent = 'Elimina'; }
      }, 4000);
    }
    return;
  }
});

// Cambio di stato dal menu a tendina sulla scheda dell'incarico.
document.addEventListener('change', (e) => {
  if (e.target.dataset.azione === 'stato') {
    modifica('incarichi', e.target.dataset.id, { stato: e.target.value });
  }
});

// ---------------------------------------------------------------- avvio

carica()
  .then(disegna)
  .catch((err) => {
    document.querySelector('main').innerHTML =
      '<div class="vuoto">Non riesco a contattare il programma.<br><br>'
      + 'Controlla che la finestra del Terminale sia ancora aperta,<br>'
      + 'poi ricarica questa pagina.<br><br><small>' + esc(err.message) + '</small></div>';
  });
