// ============================================================
// STATO GLOBALE DELL'APPLICAZIONE
// ============================================================
// Variabili d'appoggio popolate tramite la chiamata fetch al file JSON
let isole = [];          // Lista di tutti gli oggetti isola (con coordinate, nome, pericolo...)
let archi = [];          // Lista delle rotte/collegamenti tra le isole (da, a, giorni, magnetismo)
let ciurma = null;       // Informazioni sulla ciurma (salute, membri)
let viaggioBackend = []; // Eventuale percorso precalcolato proveniente dal file JSON
let isoleById = {};      // Mappa per un accesso rapido alle isole tramite il loro ID (es. isoleById[5])
let percorsoOriginale = []; // Percorso custom della ciurma di Luffy da seguire passo-passo
let percorsoOriginaleAttivo = false; // Indica se l'utente sta seguendo il percorso custom
let indicePercorsoOriginale = 0; // Indice dell'ultimo step raggiunto del percorso custom
let viaggioAttivo = 'normale'; // Indica quale dataset è attualmente visualizzato

// Tracciamento dello stato di navigazione
let correnteId = 0;      // ID dell'isola su cui si trova attualmente la nave
let giorno = 0;          // Contatore dei giorni trascorsi
let animando = false;    // Flag di sicurezza per impedire click multipli durante i movimenti della nave

// Offset per allineare graficamente i punti dell'isola e della nave
const OFFSET_X = 30, OFFSET_Y = 20;
let navePos = {x:0,y:0}; // Coordinate correnti (x,y) della nave usate per il disegno su Canvas
let naveAngolo = 0;       // Rotazione corrente della nave (0 = orientamento normale)

// VISTA / ZOOM / PAN
let zoomLevel = 1;       // Livello di ingrandimento corrente della mappa
let panX = 0;            // Traslazione orizzontale del canvas (spostamento mappa)
let panY = 0;            // Traslazione verticale del canvas
let isDragging = false;  // Flag che indica se l'utente sta trascinando la mappa con il mouse
let startX = 0, startY = 0; // Coordinate d'inizio del trascinamento
let hasDragged = false;  // Distingue un vero trascinamento (drag) da un semplice click singolo
let drawQueued = false;  // Evita ridisegni sovrapposti durante drag/zoom/hover

// Riferimenti agli elementi HTML del pannello di controllo
const elDiario = document.getElementById('diario');
const elStato = document.getElementById('stato');
const btn = document.getElementById('btn-avanza');
const btn_reset = document.getElementById('btn-restart');
const btn_reset_view = document.getElementById('btn-reset-view');
const btn_partenza_casuale = document.getElementById('btn-partenza-casuale');
const btn_carica_percorso_originale = document.getElementById('btn-carica-percorso-originale');
const btn_carica_viaggio_normale = document.getElementById('btn-carica-viaggio-normale');
const tooltip = document.getElementById('tooltip');
const islandDetails = document.getElementById('island-details');
let hoveredIslandId = null;
let islandSelezionataPerDettagli = null;
// Evidenziazione temporanea quando si centra la vista su un'isola
let focusedIslandId = null;
let focusedPersistent = false;


// ============================================================
// FUNZIONI DI LOGICA DI GIOCO E UTILITÀ
// ============================================================

/**
 * Ripristina lo stato del simulatore portando il viaggio all'inizio.
 */
function reset(){
  animando = false;

  if (percorsoOriginaleAttivo && percorsoOriginale.length > 0) {
    const primo = percorsoOriginale[0];
    correnteId = primo ? primo.isola_id : 0;
    giorno = primo ? primo.giorno : 0;
    indicePercorsoOriginale = 0;
    elDiario.innerHTML = '';
    log('--- Viaggio Riavviato dal percorso originale ---');
    const isolaInizio = isoleById[correnteId];
    log(`Giorno ${giorno}: Inizio a ${isolaInizio ? isolaInizio.nome : 'partenza'}`);
  } else {
    correnteId = 0;
    giorno = 0;
    indicePercorsoOriginale = 0;
    elDiario.innerHTML = '';
    log('--- Viaggio Riavviato ---');
    log(`Giorno 0: Inizio a ${isoleById[correnteId] ? isoleById[correnteId].nome : 'Reverse Mountain'}`);
  }

  aggiornaNavePos();
  aggiornaStato();
  disegna();

  btn_reset.disabled = false;
  btn.disabled = false;
  btn_partenza_casuale.disabled = percorsoOriginaleAttivo;
  btn_carica_percorso_originale.disabled = false;
  btn_carica_viaggio_normale.disabled = false;
}

function partenza_casuale(){
  // Seleziona un'isola casuale tra quelle disponibili
  const isolaCasuale = isole[Math.floor(Math.random() * isole.length)];
  if(isolaCasuale){
    correnteId = isolaCasuale.id;
    giorno = 0;
    aggiornaNavePos();
    elDiario.innerHTML = '';
    log('--- Viaggio Riavviato con Partenza Casuale ---');
    log(`Giorno 0: Inizio a ${isolaCasuale.nome}`);
    aggiornaStato();
    disegna();
    btn_reset.disabled = true;
    btn.disabled = false;
  }
}

async function caricaPercorsoOriginale(){
  try {
    const risposta = await fetch('/Dataset/percorso_cappello_di_paglia_elbaf.json', { cache: 'no-store' });
    if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
    const dati = await risposta.json();

    if (!dati.viaggio || !Array.isArray(dati.viaggio)) {
      throw new Error('Il file JSON non contiene un percorso valido.');
    }

    if (Array.isArray(dati.isole) && dati.isole.length) {
      isole = dati.isole;
    }
    if (Array.isArray(dati.archi) && dati.archi.length) {
      archi = dati.archi;
    }
    isoleById = Object.fromEntries(isole.map(i => [i.id, i]));

    percorsoOriginale = dati.viaggio;
    percorsoOriginaleAttivo = true;
    viaggioAttivo = 'originale';
    indicePercorsoOriginale = 0;
    ciurma = dati.ciurma || { membri: [], salute: 0 };

    const primo = percorsoOriginale[0];
    const isolaPrimo = primo ? isoleById[primo.isola_id] : null;

    correnteId = primo ? primo.isola_id : 0;
    giorno = primo ? primo.giorno : 0;

    elDiario.innerHTML = '';
    log('--- Percorso originale di Luffy ---', 'backend');
    log(`Giorno ${giorno}: ${isolaPrimo ? isolaPrimo.nome : 'Partenza'}`, 'backend');
    log('Premi il pulsante di avanzamento per seguire il percorso tappa per tappa.', 'backend');

    aggiornaNavePos();
    aggiornaStato();
    disegna();
    btn_reset.disabled = false;
    btn.disabled = false;
    btn_partenza_casuale.disabled = true;
    btn_carica_percorso_originale.disabled = false;
    btn_carica_viaggio_normale.disabled = false;

    const nomeStato = document.getElementById('stato-caricamento');
    nomeStato.textContent = 'Percorso originale caricato: Luffy';
    nomeStato.className = 'ok';
  } catch (err) {
    const nomeStato = document.getElementById('stato-caricamento');
    nomeStato.textContent = `Errore nel caricare il percorso originale: ${err.message}`;
    nomeStato.className = 'errore';
  }
}

async function caricaViaggioNormale(){
  const elStatoCaricamento = document.getElementById('stato-caricamento');
  try {
    const risposta = await fetch('/Dataset/viaggio.json', { cache: 'no-store' });
    if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
    const dati = await risposta.json();

    if (!Array.isArray(dati.isole) || !Array.isArray(dati.archi)) {
      throw new Error('Il file viaggio.json non contiene le informazioni di mappa.');
    }

    isole = dati.isole || [];
    archi = dati.archi || [];
    isoleById = Object.fromEntries(isole.map(i => [i.id, i]));

    viaggioBackend = dati.viaggio || [];
    ciurma = dati.ciurma || { membri: [], salute: 0 };
    percorsoOriginale = [];
    percorsoOriginaleAttivo = false;
    viaggioAttivo = 'normale';
    indicePercorsoOriginale = 0;

    const primo = viaggioBackend[0];
    correnteId = primo ? primo.isola_id : 0;
    giorno = primo ? primo.giorno : 0;

    elDiario.innerHTML = '';
    log('--- Viaggio normale caricato ---', 'backend');
    log(`Giorno ${giorno}: Inizio a ${isoleById[correnteId] ? isoleById[correnteId].nome : 'Reverse Mountain'}`, 'backend');

    aggiornaNavePos();
    aggiornaStato();
    disegna();
    btn_reset.disabled = false;
    btn.disabled = false;
    btn_partenza_casuale.disabled = false;
    btn_carica_percorso_originale.disabled = false;
    btn_carica_viaggio_normale.disabled = false;

    elStatoCaricamento.textContent = `Viaggio normale caricato: ${isole.length} isole, ${archi.length} archi`;
    elStatoCaricamento.className = 'ok';
  } catch (err) {
    elStatoCaricamento.textContent = `Errore nel caricare il viaggio normale: ${err.message}`;
    elStatoCaricamento.className = 'errore';
  }
}

/**
 * Restituisce il valore reale di pericolo di un'isola.
 * Usa 'pericolo_effettivo' se esiste (es. dinamico), altrimenti il 'pericolo_base'.
 */
function pericoloEffettivo(isola){
  return isola.pericolo_effettivo ?? isola.pericolo_base;
}

/**
 * Genera un evento casuale (attacco marina, Re dei Mari, buon tempo...)
 * basandosi sul livello di pericolo dell'isola di destinazione.
 */
function generaEventoCasuale(isolaDest) {
  const pericolo = pericoloEffettivo(isolaDest);
  const roll = Math.random() * 100; // Genera un numero casuale tra 0 e 99

  // Fascia di pericolo molto alta (>= 8)
  if (pericolo >= 8) {
    if (roll < 50) return { testo: "⚡ Intercettati da una Flotta della Marina!", tipo: "evento" };
    if (roll < 80) return { testo: "⚠️ Attacco di una nave da guerra con Viceammiraglio!", tipo: "evento" };
    return { testo: "🌊 Tempesta improvvisa!", tipo: "evento" };
  } 

  // Fascia di pericolo media (>= 4)
  if (pericolo >= 4) {
    if (roll < 35) return { testo: "🏴‍☠️ Scontro con una ciurma pirata rivale!", tipo: "evento" };
    if (roll < 65) return { testo: "🌪️ Re dei Mare (Sea King) attacca la nave!", tipo: "evento" };
    if (roll < 85) return { testo: "🌤️ Incontro con un mercante.", tipo: "ok" };
    return null; // Nessun evento
  }

  // Fascia di pericolo bassa (< 4)
  if (roll < 20) return { testo: "🌪️ Burrasca improvvisa lungo la rotta.", tipo: "evento" };
  if (roll < 45) return { testo: "🎣 Tutto tranquillo! La ciurma recupera energie.", tipo: "ok" };
  return null;
}

/**
 * Trova la rotta (arco) migliore da seguire a partire dall'isola corrente.
 * Sceglie l'arco uscente con il valore di 'magnetismo' più alto.
 */
function prossimaIsola(id){
  // Filtra tutti gli archi che partono dall'isola corrente
  const uscenti = archi.filter(a => a.da === id);
  if(uscenti.length === 0) return null; // Nessuna rotta trovata
  
  // Trova l'arco con il valore massimo di magnetismo
  let best = uscenti[0];
  for(const a of uscenti) {
    if(a.magnetismo >= best.magnetismo) best = a;
  }
  return best;
}

/**
 * Carica in modo asincrono i dati dal file JSON (/Dataset/viaggio.json),
 * popola le variabili globali e imposta lo stato iniziale.
 */
async function caricaViaggio(){
  const elStatoCaricamento = document.getElementById('stato-caricamento');
  try{
    // Richiesta HTTP per scaricare il file JSON senza caching
    const risposta = await fetch('/Dataset/viaggio.json', {cache:"no-store"});
    if(!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
    const dati = await risposta.json();

    // Assegnazione dati ricevuti
    isole = dati.isole || [];
    archi = dati.archi || []; 
    ciurma = dati.ciurma || { membri: [], salute: 0 };
    viaggioBackend = dati.viaggio || [];
    
    // Mappa l'array delle isole in un oggetto per ricerca rapida: { id: oggettoIsola }
    isoleById = Object.fromEntries(isole.map(i => [i.id, i]));

    // Aggiornamento interfaccia testuale caricamento
    elStatoCaricamento.textContent = `viaggio.json caricato: ${isole.length} isole, ${archi.length} archi, ☠️ciurma: ${(ciurma.membri || []).join(', ')} (salute ${ciurma.salute ?? 0})`;
    elStatoCaricamento.className = 'ok';

    // Stampa nel diario gli eventi storici/precalcolati dal backend
    log('--- Viaggio precalcolato dal backend C++ ---', 'backend');
    for(const ev of viaggioBackend){
      const isolaEv = isoleById[ev.isola_id];
      let testo = `Giorno ${ev.giorno}: ${isolaEv ? isolaEv.nome : ev.isola_id}`;
      if(ev.evento) testo += `  -> ${ev.evento}`;
      log(testo, ev.evento ? 'evento backend' : 'backend');
    }
    log('--- Da qui puoi continuare il viaggio interattivamente ---');

    // Imposta la posizione iniziale al primo evento del viaggio caricato
    const primo = viaggioBackend[0];
    correnteId = primo ? primo.isola_id : 0;
    giorno = primo ? primo.giorno : 0;

    // Inizializza posizione nave, pannelli e prima resa grafica
    aggiornaNavePos();
    aggiornaStato();
    disegna();
    document.getElementById('btn-avanza').disabled = false;
    btn_reset.disabled = false;

  }catch(err){
    // Gestione visiva dell'errore (es. server locale non attivo)
    elStatoCaricamento.textContent = `Errore nel caricare viaggio.json: ${err.message}. Assicurati di aver avviato server.py e di aprire la pagina via http://127.0.0.1:8080/, non con doppio click sul file.`;
    elStatoCaricamento.className = 'errore';
  }
}

/**
 * Aggiorna le coordinate (x,y) della nave sincronizzandole con l'isola corrente (+ offset).
 */
function aggiornaNavePos(){
  const i = isoleById[correnteId];
  if(i) {
    navePos = {x: i.x + OFFSET_X, y: i.y + OFFSET_Y};
    naveAngolo = 0;
  }
}

function showTooltip(isola, pageX, pageY){
  const descrizioni = [];
  if(isola.tipo) descrizioni.push(`Tipo: ${isola.tipo}`);
  if(isola.personaggio) descrizioni.push(`Personaggio: ${isola.personaggio}`);
  descrizioni.push(`Pericolo: ${pericoloEffettivo(isola)}`);

  const descrizione = descrizioni.join(' · ');
  const imageUrl = isola.immagine || isola.img || '';

  tooltip.innerHTML = `
    <div class="tooltip-title">🏝️ ${isola.nome}</div>
    <div class="tooltip-text">${descrizione}</div>
    ${imageUrl ? `<div class="tooltip-image"><img src="${imageUrl}" alt="${isola.nome}"></div>` : ''}
  `;
  tooltip.hidden = false;
  tooltip.style.display = 'block';
  positionTooltip(pageX, pageY);
}

function positionTooltip(pageX, pageY){
  const rect = canvas.getBoundingClientRect();
  const offsetX = 20;
  const offsetY = 14;
  let left = pageX - rect.left + offsetX;
  let top = pageY - rect.top + offsetY;

  if(left + tooltip.offsetWidth > rect.width) left = rect.width - tooltip.offsetWidth - 20;
  if(top + tooltip.offsetHeight > rect.height) top = pageY - rect.top - tooltip.offsetHeight - 20;
  if(left < 6) left = 6;
  if(top < 6) top = 6;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip(){
  tooltip.hidden = true;
  tooltip.style.display = 'none';
}



function getHoveredIsland(clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
  const canvasY = (clientY - rect.top) * (canvas.height / rect.height);
  const worldX = (canvasX - panX) / zoomLevel - OFFSET_X;
  const worldY = (canvasY - panY) / zoomLevel - OFFSET_Y;
  let closest = null;
  let bestDist = Infinity;

  for(const isola of isole){
    const dx = worldX - isola.x;
    const dy = worldY - isola.y;
    const dist = Math.hypot(dx, dy);
    const hitRadius = 12 / zoomLevel;
    if(dist < hitRadius && dist < bestDist){
      bestDist = dist;
      closest = isola;
    }
  }
  return closest;
}

function handleCanvasHover(e){
  if(isDragging) return;
  const isola = getHoveredIsland(e.clientX, e.clientY);
  if(isola){
    if(hoveredIslandId !== isola.id){
      canvas.style.cursor = 'pointer';
      hoveredIslandId = isola.id;
      showTooltip(isola, e.clientX, e.clientY);
      disegna();
    } else {
      positionTooltip(e.clientX, e.clientY);
    }
  } else if(hoveredIslandId !== null){
    hoveredIslandId = null;
    canvas.style.cursor = 'default';
    hideTooltip();
    disegna();
  }
}



// ============================================================
// FUNZIONI PER IL PANNELLO DI RICERCA
// ============================================================

//funzioni di ricerca per nome dell'isola, utile per il pannello di ricerca
function ricercaIsolaPerNome(nome){
  const nomeLower = nome.toLowerCase();
  return isole.find(isola => isola.nome.toLowerCase() === nomeLower) || null;
}
//funzione di ricerca per tipo dell'isola, utile per il pannello di ricerca
function ricercaIsolaPerTipo(tipo){
  const tipoLower = tipo.toLowerCase();
  return isole.find(isola => isola.tipo.toLowerCase() === tipoLower) || null;
}

//funzione di ricerca per pericolo dell'isola, utile per il pannello di ricerca
function ricercaIsolaPerPericolo(pericolo){
  return isole.filter(isola => pericoloEffettivo(isola) === pericolo);
}

const searchResultsContainer = document.getElementById('results-list');

const searchInputNome = document.getElementById('search-input-nome');
const searchInputTipo = document.getElementById('search-input-tipo');
const searchInputPericolo = document.getElementById('search-input-pericolo');

// Renderizza la lista di risultati come nomi cliccabili (unione dei risultati)
function renderSearchResults(results){
  searchResultsContainer.innerHTML = '';
  if(!results || results.length === 0){
    const li = document.createElement('li');
    li.textContent = 'Nessun risultato';
    searchResultsContainer.appendChild(li);
    return;
  }

  for(const isola of results){
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = isola.nome;
    // Single click: non avvia animazione, permette selezione futura
    link.addEventListener('click', (ev) =>{
      ev.preventDefault();
      // evidenziazione leggera (opzionale): aggiunge classe 'selected' al risultato
      searchResultsContainer.querySelectorAll('.selected').forEach(n => n.classList.remove('selected'));
      li.classList.add('selected');
      // Porta la pagina al canvas per mostrare la mappa
      if(typeof canvas !== 'undefined' && canvas && canvas.scrollIntoView){
        try{ canvas.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(e){ window.scrollTo({ top: canvas.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
      }
    });
    li.appendChild(link);

    // anima la vista verso l'isola (porta prima la pagina al canvas)
    li.addEventListener('click', (ev) => {
      ev.preventDefault();
      if(typeof canvas !== 'undefined' && canvas && canvas.scrollIntoView){
        try{ canvas.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(e){ window.scrollTo({ top: canvas.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
      }
      muoviVisualeVersoDst(isola.id, 700, null, true);
    });

    searchResultsContainer.appendChild(li);
  }
}

// Unisce (union) i risultati delle tre ricerche e li passa al renderer
function aggiornaRisultatiRicerca(){
  const nomeVal = (searchInputNome.value || '').trim();
  const tipoVal = (searchInputTipo.value || '').trim();
  const pericoloVal = (searchInputPericolo.value || '').trim();

  const map = new Map();

  if(nomeVal){
    const queryNome = nomeVal.toLowerCase().trim();
    const perIniziali = isole.filter(i => i.nome.toLowerCase().trim().startsWith(queryNome));
    if(perIniziali.length > 0){ for(const i of perIniziali) map.set(i.id, i); }
    const exact = ricercaIsolaPerNome(nomeVal);
    if(exact) map.set(exact.id, exact);
  }

  if(tipoVal){
    // ricercaIsolaPerTipo restituiva un singolo elemento; cerchiamo per occorrenza iniziale
    const tipoLower = tipoVal.toLowerCase().trim();
    const valPerIniziali = isole.filter(i => (i.tipo.toLowerCase().trim() || '').startsWith(tipoLower));
    for(const i of valPerIniziali) map.set(i.id, i);
    const exactTipo = ricercaIsolaPerTipo(tipoVal);
    if(exactTipo) map.set(exactTipo.id, exactTipo);
  }

  if(pericoloVal !== ''){
    const p = parseInt(pericoloVal);
    if(!isNaN(p)){
      const trovate = ricercaIsolaPerPericolo(p) || [];
      for(const i of trovate) map.set(i.id, i);
    }
  }

  const risultati = Array.from(map.values());
  renderSearchResults(risultati);
}

// Collega gli eventi agli input per aggiornare la lista in tempo reale
searchInputNome.addEventListener('input', aggiornaRisultatiRicerca);
searchInputTipo.addEventListener('input', aggiornaRisultatiRicerca);
searchInputPericolo.addEventListener('input', aggiornaRisultatiRicerca);

// Inizializza la lista vuota
renderSearchResults([]);


// ============================================================
// CANVAS E GESTIONE ZOOM/PAN
// ============================================================
const canvas = document.getElementById('mappa');
const ctx = canvas.getContext('2d');

function queueDraw(){
  if(drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    disegna();
  });
}

/**
 * Determina il colore del punto dell'isola: 
 * usa la variabile CSS --timeskip se legata ad un personaggio, altrimenti --oro-forte.
 */
function coloreIsola(isola){
  return isola.personaggio
    ? getComputedStyle(document.documentElement).getPropertyValue('--timeskip').trim()
    : getComputedStyle(document.documentElement).getPropertyValue('--oro-forte').trim();
}

// Caricamento asincrono dell'immagine di sfondo della mappa
const mappaImg = new Image();
mappaImg.src = '/Images/mappa_one_piece.svg';
mappaImg.onload = () => { queueDraw(); }; // Ridisegna il canvas non appena l'immagine è pronta

canvas.addEventListener('mousemove', handleCanvasHover);
canvas.addEventListener('mouseleave', () => {
  hoveredIslandId = null;
  hideTooltip();
  queueDraw();
});

/**
 * FUNZIONE PRINCIPALE DI RENDERING:
 * Pulisce il canvas e ridisegna sfondo, rotte (archi), isole e nave tenendo conto di Pan e Zoom.
 */
function disegna(){
  // 1. Pulisce l'intero canvas dalle vecchie schermate
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. Salva lo stato base della matrice di trasformazione del Canvas
  ctx.save();
  
  // 3. Applica prima il movimento (Pan) e poi l'ingrandimento (Zoom)
  ctx.translate(panX, panY);
  ctx.scale(zoomLevel, zoomLevel);

  // 4. Disegna lo sfondo: l'immagine della mappa o, in alternativa, una griglia di emergenza
  if (mappaImg.complete && mappaImg.naturalWidth !== 0) {
    ctx.drawImage(mappaImg, 0, 0, canvas.width, canvas.height);
  } else {
    // Griglia vettoriale sostitutiva
    ctx.strokeStyle = 'rgba(212,169,92,0.08)';
    ctx.lineWidth = 1;
    for(let gx=0; gx<canvas.width; gx+=60){ ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,canvas.height); ctx.stroke(); }
    for(let gy=0; gy<canvas.height; gy+=60){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(canvas.width,gy); ctx.stroke(); }
  }

  if(isole.length > 0) {
    // 5. Disegna gli ARCHI (linee tra le isole)
    for(const a of archi){
      const da = isoleById[a.da], aa = isoleById[a.a];
      if(!da || !aa) continue; // Salta se una delle due isole non esiste
      
      const isTimeskip = da.personaggio || aa.personaggio;
      ctx.beginPath();
      ctx.moveTo(da.x + OFFSET_X, da.y + OFFSET_Y);
      ctx.lineTo(aa.x + OFFSET_X, aa.y + OFFSET_Y);
      
      // Colore viola tratteggiato per il timeskip, blu continuo per le rotte normali
      ctx.strokeStyle = isTimeskip ? 'rgba(139,107,177,0.8)' : 'rgba(212,169,92,0.8)';
      ctx.lineWidth = 2 / zoomLevel; // Mantiene lo spessore visivo costante a qualsiasi zoom
      
      if(isTimeskip) ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Ripristina il tratto continuo per gli altri elementi

    // 6. Disegna le ISOLE (punti/cerchi)
    for(const isola of isole){
      const px = isola.x + OFFSET_X, py = isola.y + OFFSET_Y;
      const pericolo = pericoloEffettivo(isola);

      // Se il pericolo è stato aumentato rispetto alla base, disegna un alone rosso graduato
      if(pericolo > isola.pericolo_base){
        const raggio = 10 + (pericolo - isola.pericolo_base) * 2.2;
        const grad = ctx.createRadialGradient(px, py, 2, px, py, raggio);
        grad.addColorStop(0, 'rgba(192,72,58,0.5)');
        grad.addColorStop(1, 'rgba(192,72,58,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px, py, raggio, 0, Math.PI*2); ctx.fill();
      }

      // Punto principale dell'isola
      ctx.beginPath();
      // Ridimensiona il punto in base allo zoom per evitare che sia troppo grande ad alti ingrandimenti
      ctx.arc(px, py, (isola.personaggio ? 4 : 6) / Math.sqrt(zoomLevel), 0, Math.PI*2);
      ctx.fillStyle = coloreIsola(isola);
      ctx.fill();

      // Se l'isola è quella CORRENTE, aggiunge un anello blu di evidenziazione
      if(isola.id === correnteId){
        ctx.beginPath();
        ctx.arc(px, py, 12 / Math.sqrt(zoomLevel), 0, Math.PI*2);
        ctx.strokeStyle = '#f0c775';
        ctx.lineWidth = 3 / zoomLevel;
        ctx.stroke();
      }
    }

    if(hoveredIslandId != null){
      const hover = isoleById[hoveredIslandId];
      if(hover){
        const hx = hover.x + OFFSET_X;
        const hy = hover.y + OFFSET_Y;
        ctx.beginPath();
        ctx.arc(hx, hy, 16 / Math.sqrt(zoomLevel), 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(240,199,117,0.9)';
        ctx.lineWidth = 3 / zoomLevel;
        ctx.stroke();
      }
    }

    // Evidenziazione per l'isola centrata recentemente (anello persistente)
    if(focusedIslandId != null){
      const f = isoleById[focusedIslandId];
      if(f){
        const fx = f.x + OFFSET_X;
        const fy = f.y + OFFSET_Y;

        // Se l'evidenziazione è persistente la manteniamo fino a che i dettagli sono mostrati
        if(focusedPersistent){
          // Se i dettagli sono ancora visibili per quell'isola e non siamo troppo dezoomati, disegna anello fisso
          if(islandSelezionataPerDettagli && islandSelezionataPerDettagli.id === focusedIslandId && zoomLevel >= 2.5){
            ctx.beginPath();
            ctx.arc(fx, fy, 14 / Math.sqrt(zoomLevel), 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(255,205,60,0.95)';
            ctx.lineWidth = 3 / zoomLevel;
            ctx.stroke();

            const grad = ctx.createRadialGradient(fx, fy, 6, fx, fy, 28);
            grad.addColorStop(0, 'rgba(255,205,60,0.18)');
            grad.addColorStop(1, 'rgba(255,205,60,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(fx, fy, 28, 0, Math.PI*2); ctx.fill();
          } else {
            // Se i dettagli non sono più visibili (es. dezoom) rimuoviamo l'evidenziazione persistente
            focusedPersistent = false;
            focusedIslandId = null;
          }
        }
      }
    }

    // 7. Disegna la NAVE (Triangolo stilizzato)
    if(navePos.x || navePos.y){
      ctx.save();
      // Trasla l'origine del sistema di coordinate sulla posizione corrente della nave
      ctx.translate(navePos.x, navePos.y);
      // Ruota la nave solo quando è in movimento; altrimenti resta nella posizione normale
      ctx.rotate(naveAngolo);
      // Mantiene la nave proporzionata rispetto allo zoom corrente
      ctx.scale(1/Math.sqrt(zoomLevel), 1/Math.sqrt(zoomLevel));
      
      // Disegna la freccia/nave
      ctx.beginPath();
      ctx.moveTo(0, -12); 
      ctx.lineTo(8, 8); 
      ctx.lineTo(-8, 8); 
      ctx.closePath();
      
      ctx.fillStyle = '#f0c775';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  // 8. Ripristina il contesto trasformato per evitare accumuli di scale/translate ai rendering successivi
  ctx.restore();
}

// ============================================================
// EVENTI MOUSE (ZOOM E PANNING DELLA MAPPA)
// ============================================================

/**
 * Gestione dello Zoom tramite la rotellina del mouse (Wheel).
 * Zoom centrato sulla posizione esatta del cursore del mouse.
 */
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); // Impedisce lo scroll della pagina Web

  if( zoomLevel < 2.5){
    islandDetails.hidden = true;
    islandDetails.innerHTML = '';
  }
  
  const zoomFactor = 1.1;
  const rect = canvas.getBoundingClientRect();
  // Posizione del mouse relativa ai bordi del canvas
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let newZoom;
  if (e.deltaY < 0) {
    newZoom = zoomLevel * zoomFactor; // Zoom In
  } else {
    newZoom = zoomLevel / zoomFactor; // Zoom Out
  }

  // Applica i limiti minimi e massimi allo zoom (1x - 8x)
  newZoom = Math.max(1, Math.min(newZoom, 8));

  // Ricalcola il Pan (traslazione) per fare in modo che lo zoom sia focalizzato sul punto in cui si trova il mouse
  panX = mouseX - (mouseX - panX) * (newZoom / zoomLevel);
  panY = mouseY - (mouseY - panY) * (newZoom / zoomLevel);
  zoomLevel = newZoom;

  queueDraw(); // Ridisegna il canvas con i nuovi parametri
});

/**
 * Inizio trascinamento (MouseDown)
 */
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
  hasDragged = false; // Reset del flag di movimento
  startX = e.clientX - panX;
  startY = e.clientY - panY;
 
});

/**
 * Movimento del mouse per il Pan della Mappa (MouseMove)
 */
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    hasDragged = true; // L'utente sta effettuando un vero e proprio trascinamento
    panX = e.clientX - startX;
    panY = e.clientY - startY;
     canvas.style.cursor = 'grabbing';
     islandDetails.hidden = true;
    islandDetails.innerHTML = '';
    queueDraw();
  }
});

/**
 * Rilascio del tasto del mouse (MouseUp)
 */
window.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'default';
});

/**
 * Intercetta il click per ricavare le coordinate reali (World X/Y) dell'immagine originale,
 * invertendo le trasformazioni matematiche apportate da Zoom, Pan e Offset.
 */
canvas.addEventListener('click', (e) => {
  if (hasDragged) return; // Se l'utente stava trascinando la mappa, annulla il click

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Coordinate sul canvas in pixel puri
  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;

  // Formula inversa: converte le coordinate trasformate del canvas nelle coordinate originarie del mondo
  const worldX = Math.round((canvasX - panX) / zoomLevel - OFFSET_X);
  const worldY = Math.round((canvasY - panY) / zoomLevel - OFFSET_Y);

  console.log(`Coordinata isola -> "x": ${worldX}, "y": ${worldY}`);
});

// ============================================================
// ANIMAZIONI E INTERFACCIA
// ============================================================

/**
 * Anima lo spostamento fluido della nave da 'navePos' all'isola di destinazione.
 * Utilizza una funzione di 'easing' (Ease-In-Out) per rendere il movimento naturale.
 */
function muoviNaveVerso(destId, durataMs, callback){
  const partenza = {...navePos};
  const dest = isoleById[destId];
  const arrivo = {x: dest.x + OFFSET_X, y: dest.y + OFFSET_Y};
  const t0 = performance.now(); // Marca temporale di inizio animazione

  function step(now){
    // Progresso normalizzato da 0.0 a 1.0
    const t = Math.min(1, (now - t0) / durataMs);
    // Formula di Easing quadratica (accelerazione iniziale, decelerazione finale)
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    // Interpolazione della posizione
    navePos.x = partenza.x + (arrivo.x - partenza.x) * ease;
    navePos.y = partenza.y + (arrivo.y - partenza.y) * ease;

    // Calcola la direzione del movimento e ruota la nave verso la destinazione
    /*
    La rotazione della nave viene calcolata usando l'arcotangente della differenza tra le coordinate di arrivo e partenza.
    L'angolo viene poi aggiustato di π/2 (90 gradi) per allineare correttamente la freccia della nave verso la direzione del movimento.
    Il vettore dx e dy dice: “da dove parto e verso dove devo andare” ed è proprio la direzione che serve per ruotare la nave.
    Math.atan2(dy, dx) --> in che direzione punta il vettore (dx,dy) rispetto all'asse x. Math.PI / 2 serve per fare si che la punta 
    del triangolo punti in avanti e non verso destra (che sarebbe l'orientamento di default del triangolo).
    */
    const dx = arrivo.x - navePos.x;
    const dy = arrivo.y - navePos.y;
    const distanza = Math.hypot(dx, dy);
    naveAngolo = distanza > 0 ? Math.atan2(dy, dx) + Math.PI / 2 : 0;
    
    disegna(); // Ridisegna ad ogni frame dell'animazione
    
    if(t < 1) {
      requestAnimationFrame(step); // Continua l'animazione al frame successivo
    } else {
      naveAngolo = 0;
      callback(); // Animazione completata: esegui la funzione di callback
    }
  }
  requestAnimationFrame(step);
}

//animazione Google Maps-like per muovere la visuale verso un'isola specifica quando l'utente fa doppio click su di essa. 
// La funzione muoviVisualeVersoDst prende l'id dell'isola di destinazione, la durata dell'animazione in millisecondi 
// e una callback opzionale da eseguire al termine dell'animazione. 
// L'animazione utilizza un easing per rendere il movimento fluido e naturale.
function mostraDettagliIsola(isola){
  if(!isola || zoomLevel < 2.5){
    islandSelezionataPerDettagli = null;
    islandDetails.hidden = true;
    islandDetails.innerHTML = '';
    return;
  }

  islandSelezionataPerDettagli = isola;
  islandDetails.hidden = false;
  islandDetails.innerHTML = `
    <h1>🏝️ ${isola.nome}</h1>
    <div class="detail-row">
      <div class="detail-label">Nome:</div>
      <div class="detail-value">${isola.nome}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Tipo:</div>
      <div class="detail-value">${isola.tipo || 'N/D'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Pericolo:</div>
      <div class="detail-value">${pericoloEffettivo(isola)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Personaggio:</div>
      <div class="detail-value">${isola.personaggio || 'Nessuno'}</div>
    </div>
    <div class="detail-row">
      <button id="btn-avanza-dettagli" type="button" onclick="apriDettagliIsola()">Maggiori Dettagli</button>
    </div>
  `;
}

function apriDettagliIsola(){
  if(!islandSelezionataPerDettagli) return;

  const params = new URLSearchParams({
    id: islandSelezionataPerDettagli.id,
    nome: islandSelezionataPerDettagli.nome || '',
    tipo: islandSelezionataPerDettagli.tipo || '',
    pericolo: pericoloEffettivo(islandSelezionataPerDettagli),
    personaggio: islandSelezionataPerDettagli.personaggio || ''
  });

  window.open(`/Frontend/isola_dettagli.html?${params.toString()}`, '_blank');
}

function muoviVisualeVersoDst(destId, durataMs = 900, callback = null, showDetails = true){
  // 1. Controlla che l'isola di destinazione esista davvero
  const dest = isoleById[destId];
  if(!dest) return;

  // 2. Salva lo stato iniziale della vista: zoom e posizione corrente
  const startZoom = zoomLevel;
  const startPanX = panX;
  const startPanY = panY;

  // 3. Converte la posizione dell'isola in coordinate del mondo
  const worldX = dest.x + OFFSET_X;
  const worldY = dest.y + OFFSET_Y;

  // 4. Calcola il target finale della vista: zoom più grande e centro sull'isola
  const targetZoom = Math.min(4, Math.max(2.4, startZoom + 1.6));
  const targetPanX = canvas.width / 2 - worldX * targetZoom;
  const targetPanY = canvas.height / 2 - worldY * targetZoom;

  // 5. Registra il momento in cui parte l'animazione
  const t0 = performance.now();

  // 6. Funzione che viene richiamata ogni frame per aggiornare la vista
  function step(now){
    // 6a. Calcola il progresso dell'animazione da 0 a 1
    const t = Math.min(1, (now - t0) / durataMs);

    // 6b. Applica una curva di easing per far sembrare il movimento più naturale
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // 7. Interpola zoom e pan verso il valore finale
    zoomLevel = startZoom + (targetZoom - startZoom) * ease;
    panX = startPanX + (targetPanX - startPanX) * ease;
    panY = startPanY + (targetPanY - startPanY) * ease;

    // 8. Ridisegna la mappa con la nuova vista
    disegna();

    // 9. Se l'animazione non è ancora finita, continua il loop
    if(t < 1) {
      requestAnimationFrame(step);
    } else {
      // 10. Se l'animazione è terminata, opzionalmente mostra i dettagli dell'isola
      if(showDetails) mostraDettagliIsola(dest);
      if(callback) {
        callback();
      }

      // Imposta evidenziazione persistente sull'isola raggiunta
      focusedIslandId = destId;
      focusedPersistent = true;
      queueDraw();
    }
  }

  // 11. Avvia il ciclo di animazione
  requestAnimationFrame(step);
}


/**
 * Aggiunge un nuovo messaggio di log nell'interfaccia del diario di bordo.
 */
function log(testo, classe=''){
  const riga = document.createElement('div');
  riga.className = 'riga ' + classe;
  riga.textContent = testo;
  elDiario.appendChild(riga);
  // Auto-scroll del diario sempre verso il basso
  elDiario.scrollTop = elDiario.scrollHeight;
}

/**
 * Aggiorna il testo informativo del pannello laterale (Giorno, Isola, Pericolo).
 */
function aggiornaStato(){
  const isola = isoleById[correnteId];
  if(isola){
    elStato.innerHTML = `Giorno <b>${giorno}</b><br>Isola attuale: <b>${isola.nome}</b><br>Pericolo effettivo: <b>${pericoloEffettivo(isola)}</b>`;
  }
}

/**
 * Gestisce la logica di avanzamento del viaggio alla pressione del tasto "Avanza":
 * 1. Trova la rotta da seguire.
 * 2. Avvia l'animazione della nave.
 * 3. Aggiorna il contatore dei giorni e l'isola corrente.
 * 4. Calcola e registra eventuali eventi casuali.
 */
function avanza(){
  if(animando) return; // Sicurezza: previene l'avvio se un'animazione è già in corso
  btn_partenza_casuale.disabled = true;
  btn_carica_percorso_originale.disabled = true;
  btn_carica_viaggio_normale.disabled = true;

  if (percorsoOriginaleAttivo && percorsoOriginale.length > 0) {
    const stepCorrente = percorsoOriginale[indicePercorsoOriginale];
    const stepSuccessivo = percorsoOriginale[indicePercorsoOriginale + 1];
     btn_carica_viaggio_normale.disabled = true;
    if (!stepCorrente) {
      log('Il percorso originale non è ancora pronto.');
      return;
    }

    if (!stepSuccessivo) {
      log('Hai raggiunto l’ultima tappa del percorso originale.');
      btn.disabled = true;
      btn_reset.disabled = false;
      return;
    }

    const destIsola = isoleById[stepSuccessivo.isola_id];
    animando = true;
    btn.disabled = true;

    muoviNaveVerso(stepSuccessivo.isola_id, 900, () => {
      giorno = stepSuccessivo.giorno;
      correnteId = stepSuccessivo.isola_id;
      indicePercorsoOriginale += 1;
      animando = false;
      btn.disabled = false;
      btn_partenza_casuale.disabled = true;
      btn_carica_percorso_originale.disabled = true;
      btn_carica_viaggio_normale.disabled = true;

      const isTimeskip = !!destIsola?.personaggio;
      log(`Giorno ${giorno}: Arrivo a ${destIsola ? destIsola.nome : stepSuccessivo.isola_id}${destIsola?.personaggio ? ' (' + destIsola.personaggio + ')' : ''}.`,
          isTimeskip ? 'timeskip' : '');

      const ev = generaEventoCasuale(destIsola);
      if (ev) {
        log(`  └─ Evento: ${ev.testo}`, ev.tipo);
      }

      aggiornaStato();
      disegna();

      if (indicePercorsoOriginale >= percorsoOriginale.length - 1) {
        btn.disabled = true;
        log('Percorso originale completato.', 'backend');
      }
    });
    return;
  }

  const arco = prossimaIsola(correnteId);
  if(!arco){
    log(`Il Log Pose non punta più da nessuna parte. Fine del viaggio a ${isoleById[correnteId].nome}.`);
    btn.disabled = true;
    btn_reset.disabled = false;
    return;
  }

  const destIsola = isoleById[arco.a];
  animando = true;
  btn.disabled = true;

  // Avvia l'animazione con una durata di 900 millisecondi
  muoviNaveVerso(arco.a, 900, () => {
    // CALLBACK eseguita a fine animazione:
    giorno += arco.giorni;
    correnteId = arco.a;
    animando = false;
    btn.disabled = false;
    btn_partenza_casuale.disabled = true;

    const isTimeskip = !!destIsola.personaggio;
    
    log(`Giorno ${giorno}: Arrivo a ${destIsola.nome}${destIsola.personaggio ? ' ('+destIsola.personaggio+')' : ''}.`,
        isTimeskip ? 'timeskip' : '');

    // Generazione ed eventuale log dell'evento casuale
    const ev = generaEventoCasuale(destIsola);
    if (ev) {
      log(`  └─ Evento: ${ev.testo}`, ev.tipo);
    }

    aggiornaStato();
    disegna();
  });
}

// ============================================================
// LISTENERS DEGLI ELEMENTI DI INTERFACCIA E INIZIALIZZAZIONE
// ============================================================

btn.addEventListener('click', avanza);
btn_reset.addEventListener('click', reset);
btn_partenza_casuale.addEventListener('click', partenza_casuale);
btn_carica_percorso_originale.addEventListener('click', caricaPercorsoOriginale);
btn_carica_viaggio_normale.addEventListener('click', caricaViaggioNormale);

canvas.addEventListener('dblclick', (e) => {
  // 1. Se il doppio clic è avvenuto sul canvas, procedi; altrimenti ignora
  if (e.target !== canvas) return;

  // 2. Se l'utente stava trascinando la mappa, non far partire l'animazione
  if (hasDragged) return;

  // 3. Evita il comportamento di default del browser sul doppio clic
  e.preventDefault();

  // 4. Rileva quale isola si trova sotto il cursore
  const isola = getHoveredIsland(e.clientX, e.clientY);

  // 5. Se non è stata trovata nessuna isola, non fa nulla
  if (!isola) return;

  // 6. Avvia l'animazione di avvicinamento verso l'isola selezionata
  muoviVisualeVersoDst(isola.id, 900);
});

// Tasto per resettare la vista della mappa (ripristina Zoom 1x e posizione centrata)
btn_reset_view.addEventListener('click', () => {
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  if(islandDetails != null){
    islandDetails.hidden = true;
    islandDetails.innerHTML = '';
  }
  disegna();
});

// Punto d'ingresso dell'applicazione: avvia la chiamata fetch iniziale
caricaViaggio();

// ============================================================
// ANIMAZIONE SULLO SCROLL (HERO EXIT & APP CONTAINER ENTRANCE)
// ============================================================
const heroSection = document.querySelector('.hero-section');
const heroContent = document.querySelector('.hero-content');
const appContainer = document.querySelector('.app-container');

function gestisciAnimazioneScroll() {
  const scrollY = window.scrollY;
  const heroHeight = heroSection.offsetHeight;
  const progress = Math.min(1, Math.max(0, scrollY / heroHeight));

  // Animazione di uscita per l'Hero Content (sfuma, sale e si sfoca)
  if (heroContent) {
    heroContent.style.opacity = (1 - progress * 1.4).toFixed(2);
    heroContent.style.transform = `translateY(${scrollY * 0.35}px) scale(${1 - progress * 0.08})`;
    heroContent.style.filter = `blur(${progress * 10}px)`;
  }

  // Animazione di entrata per l'App Container (da traslata in basso/sfocata a completamente nitida)
  if (appContainer) {
    const appOpacity = Math.min(1, progress * 1.5);
    const translateY = (1 - progress) * 60; // Parte 60px più in basso
    
    appContainer.style.opacity = appOpacity.toFixed(2);
    appContainer.style.transform = `translateY(${translateY}px)`;
  }
}

window.addEventListener('scroll', gestisciAnimazioneScroll);
// Esegui un primo controllo subito per impostare le posizioni corrette
gestisciAnimazioneScroll();