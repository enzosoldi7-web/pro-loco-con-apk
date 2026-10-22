export type SocioCategoria = 
  | 'Ordinario'
  | 'Sostenitore'
  | 'Onorario'
  | 'Giovane'
  | 'Volontario Attivo'
  | 'Membro Direttivo';

export type SocioRuoloDirettivo =
  | 'Nessuno'
  | 'Presidente'
  | 'Vicepresidente'
  | 'Segretario'
  | 'Tesoriere'
  | 'Consigliere';

export type MetodoPagamento =
  | 'Contanti'
  | 'Bonifico Bancario'
  | 'POS / Carta'
  | 'Satispay'
  | 'PayPal';

export type StatoQuota = 'in_regola' | 'da_rinnovare' | 'scaduta';

export type TipoDonatore = 
  | 'privato' 
  | 'azienda' 
  | 'fondazione' 
  | 'ente_benefico' 
  | 'associazione' 
  | 'anonimo';

export type TipoErogazione = 
  | 'erogazione_liberale_denaro' // Art. 83 CTS (detraibile/deducibile)
  | '5_per_mille'                // Quota 5x1000 con rendiconto
  | 'raccolta_fondi_pubblica'    // Art. 7 CTS (Manifestazione pubblica occasionale)
  | 'progetto_vincolato'         // Donazione vincolata a scopo statutario specifico
  | 'in_memoria'                 // Donazione in memoria di persona cara o socio fondatore
  | 'lascito_testamentario';     // Lascito testamentario / eredità

export interface CampagnaRaccoltaFondi {
  id: string;
  titolo: string;
  descrizione: string;
  obiettivoImporto: number;
  anno: number;
  attiva: boolean;
  dataInizio: string;
  dataFine?: string;
  responsabileProgetto?: string;
  luogoSvolgimento?: string; // Piazza, centro storico, gazebo
  oneriSostenuti?: number; // Costi e spese organizzative documentate per la raccolta (€)
  deliberaConsiglio?: string; // Es. "Delibera C.D. n. 4 del 12/03/2026"
  relazioneIllustrativa?: string; // Relazione del Presidente ex Art. 87 D.Lgs. 117/2017
  dataApprovazioneRendiconto?: string;
  approvatoAssemblea?: boolean;
}

export interface DonazioneTerzi {
  id: string;
  donatore: string; // Nome persona fisica, ditta, azienda, ente o fondazione
  tipoDonatore: TipoDonatore;
  codiceFiscalePartitaIva?: string;
  indirizzoDonatore?: string;
  cittaDonatore?: string;
  capDonatore?: string;
  emailDonatore?: string;
  telefonoDonatore?: string;
  importo: number; // Importo donazione in Euro (€)
  data: string; // YYYY-MM-DD
  anno: number; // Esercizio finanziario di competenza
  causale: string; // Es. "Erogazione liberale a sostegno delle attività culturali e ambientali"
  tipoErogazione?: TipoErogazione;
  metodo: MetodoPagamento;
  estremiTracciabilita?: string; // Es. "CRO/TRN 19283741920 - Intesa Sanpaolo"
  ricevutaNumero: string; // Es. "DON-2026/001"
  destinazione?: string; // Es. "Cultura & Ambiente", "Feste & Sagre", "Solidarietà", "Generale"
  destinazioneVincolata?: boolean; // Se la somma è vincolata e intoccabile per un progetto deliberato
  spesaEffettuataProgetto?: number; // Quota già impiegata/liquidata per il progetto vincolato (€)
  dettaglioImpiego?: string; // Note sull'impiego effettivo dei fondi
  oneriCorrelati?: number; // Commissioni bancarie/POS o spese vive gestione donazione (€)
  campagnaId?: string;
  eventoCollegatoId?: string;
  eventoCollegatoTitolo?: string;
  deliberaConsiglio?: string; // Es. "Delibera C.D. verbale n. 3 del 15/02/2026"
  detraibileFiscale?: boolean; // Attestazione erogazione liberale Terzo Settore (Art. 83 D.Lgs. 117/2017)
  opposizione730?: boolean; // Donatore ha esercitato il diritto di opposizione alla trasmissione all'Agenzia delle Entrate (DM MEF 3/2/2021)
  trasmessaAdE?: boolean; // Dati trasmessi con successo all'Agenzia delle Entrate
  dataTrasmissioneAdE?: string;
  protocolloInvioAdE?: string;
  note?: string;
  inviataQuietanza?: boolean;
  dataInviataQuietanza?: string;
  stato?: 'attiva' | 'annullata_ripensamento';
  motivoAnnullamento?: string;
  dataAnnullamento?: string;
  annullatoDa?: string;
}

export type TipoEntitaCestino = 'donazione' | 'socio' | 'evento';

export interface ElementoCestino {
  id: string; // ID univoco nel cestino (es. 'cestino-don-...')
  entitaId: string; // ID dell'entità originaria
  tipoEntita: TipoEntitaCestino;
  titolo: string; // Intestazione o nominativo (es. "Quietanza DON-2026/001 - Dott. Roberto Bianchi")
  sottotitolo?: string; // Dettagli secondari (es. "C.F. BNC... • Esercizio 2026")
  importo?: number; // Importo originale (€) se applicabile, rigorosamente escluso da tutti i calcoli
  dataEliminazione: string; // Data di revoca / eliminazione YYYY-MM-DD
  oraEliminazione?: string; // Ora HH:MM
  motivo: string; // Motivazione del ripensamento o eliminazione
  eliminatoDa?: string; // Es. "Ufficio Tesoreria / Presidente"
  datiOriginali?: any; // Snapshot completo dell'entità per il ripristino sicuro
}

export type TipoMovimentoContabile = 'entrata' | 'uscita';

export type CategoriaMovimentoContabile =
  | 'quote_associative'
  | 'donazioni_liberalita'
  | 'contributi_pubblici'
  | 'sponsor_partner'
  | 'proventi_eventi'
  | 'altre_entrate'
  | 'spese_eventi'
  | 'materiali_attrezzature'
  | 'affitti_locali'
  | 'utenze_sede'
  | 'assicurazioni'
  | 'cancelleria_tipografia'
  | 'servizi_consulenze'
  | 'rimborsi_volontari'
  | 'altre_uscite';

export interface MovimentoContabile {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: TipoMovimentoContabile;
  descrizione: string;
  importo: number;
  categoria: CategoriaMovimentoContabile | string;
  metodoPagamento?: string; // 'Contanti' | 'Bonifico Bancario' | 'POS / Carta' | 'Altro'
  note?: string;
  riferimentoId?: string;
  anno: number;
  allegatoNome?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface QuotaAssociativa {
  id: string;
  socioId: string;
  anno: number;
  importo: number;
  dataPagamento: string; // ISO string YYYY-MM-DD
  dataScadenza?: string; // ISO string YYYY-MM-DD (data di scadenza/validità della quota)
  metodo: MetodoPagamento;
  ricevutaNumero: string; // Es. REC-2025/042
  note?: string;
  registratoDa?: string;
}

export interface Socio {
  id: string;
  numeroTessera: string; // Es. PL-2025-001
  pin?: string; // PIN personale per sblocco Area Riservata Soci associato al numero tessera
  nome: string;
  cognome: string;
  codiceFiscale: string;
  partitaIva?: string; // Partita IVA opzionale (es. Socio Sostenitore / Ditta / Ente)
  dataNascita: string;
  luogoNascita: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  telefono: string;
  email: string;
  categoria: SocioCategoria;
  ruoloDirettivo: SocioRuoloDirettivo;
  dataIscrizione: string; // YYYY-MM-DD
  attivo: boolean;
  consensoPrivacy: boolean;
  foto?: string; // Data URL base64 o URL immagine della fototessera
  note?: string;
  competenzeVolontariato?: string[];
  dataCancellazione?: string; // Data eventuale cancellazione/decadenza dall'albo
  quote: QuotaAssociativa[];
}

export interface ProLocoInfo {
  nome: string;
  codiceFiscale: string;
  partitaIva?: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  email: string;
  telefono: string;
  sitoWeb: string;
  codiceUnpli?: string;
  numeroRunts?: string;
  annoCorrente: number;
  quotaStandardOrdinario: number;
  quotaStandardSostenitore: number;
  quotaStandardGiovane: number;
  nomePresidente: string;
  motto?: string;
  iban?: string;
  banca?: string;
  pec?: string;
}

export interface SchedaTerritorio {
  id: string;
  titolo: string;
  descrizione: string;
  immagine?: string;
  categoria?: 'monumento' | 'natura' | 'enogastronomia' | 'tradizione';
}

export interface SitoWebConfig {
  titoloHero: string;
  sottotitoloHero: string;
  mottoPersonalizzato: string;
  testoBenvenuto: string;
  immagineCopertina: string;
  avvisoImportante: string;
  mostraAvviso: boolean;
  tipoAvviso: 'info' | 'success' | 'warning' | 'evento';
  
  // Sezioni abilitate nel portale
  abilitaEventi: boolean;
  abilitaTesseramentoOnline: boolean;
  abilitaTerritorio: boolean;
  abilitaDirettivo: boolean;
  abilitaContatti: boolean;

  // Personalizzazioni testuali
  titoloTerritorio: string;
  testoTerritorio: string;
  orariAperturaSede: string;
  linkFacebook?: string;
  linkInstagram?: string;
  linkWhatsApp?: string;

  // Stato di pubblicazione e blindatura visitatori
  pubblicato: boolean;
  dataPubblicazione?: string;
  blindatoVisitatori: boolean;
  pinSbloccoAdmin: string;

  // Potenziamenti layout & personalizzazione
  temaColore?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
  stileTipografico?: 'classico' | 'moderno' | 'tradizionale';
  testoInvitoTesseramento?: string;
  schedeTerritorio?: SchedaTerritorio[];
}

export interface FiltriSoci {
  ricerca: string;
  categoria: string;
  statoQuota: 'tutti' | 'in_regola' | 'da_rinnovare' | 'scaduta';
  ruoloDirettivo: string;
  ordinamento: 'cognome_asc' | 'cognome_desc' | 'tessera_asc' | 'tessera_desc' | 'data_asc' | 'data_desc';
}

export type CategoriaEvento =
  | 'Enogastronomia & Sagra'
  | 'Festa Tradizionale & Patronale'
  | 'Musica, Spettacolo & Teatro'
  | 'Cultura, Arte & Mostre'
  | 'Visita Guidata & Escursione'
  | 'Mercatino & Fiera Tipica'
  | 'Sport & Tempo Libero'
  | 'Assemblea & Riunione Soci';

export type StatoEvento = 'in_programma' | 'in_corso' | 'concluso' | 'annullato';

export type TipoEvento = 'nativo' | 'ibrido' | 'gestione';

export type TipologiaStand =
  | 'Food / Gastronomia'
  | 'Food / Griglia & Brace'
  | 'Food / Friggitoria & Dolci'
  | 'Beverage / Bar & Vini'
  | 'Cassa & Ticket'
  | 'Mercatino & Artigianato'
  | 'Info Point & Servizi';

export type FasciaOrariaTurno =
  | 'Mattina (Allestimento & Prep)'
  | 'Pranzo (Servizio Diurno)'
  | 'Pomeriggio (Accoglienza)'
  | 'Cena (Servizio Serale)'
  | 'Notte (Chiusura & Riordino)'
  | 'Giornata Intera';

export type MansioneStand =
  | 'Responsabile Stand / Capo Postazione'
  | 'Cuoco / Addetto Cucina'
  | 'Fuochista / Addetto Griglia'
  | 'Addetto Friggitoria / Dolci'
  | 'Barista / Spillatore Bevande'
  | 'Cassiere / Addetto Ticket'
  | 'Servizio ai Tavoli / Runner'
  | 'Accoglienza / Info Point'
  | 'Logistica / Rifornimento Scorte';

export interface AssegnazioneVolontarioStand {
  id: string;
  socioId?: string; // ID dal database soci (se selezionato dall'Albo)
  nomeVolontario: string; // Cognome e Nome
  nominativo?: string; // Alias retrocompatibile
  numeroTessera?: string;
  telefono?: string;
  mansione: MansioneStand | string;
  fasciaOraria: FasciaOrariaTurno | string;
  orarioInizio?: string; // es. "18:30"
  orarioFine?: string; // es. "23:30"
  orarioSpecifico?: string; // es. "18:30 - 23:30"
  dataTurno?: string; // YYYY-MM-DD
  confermato: boolean; // Disponibilità confermata
  note?: string;
}

export interface StandEvento {
  id: string;
  numero: number; // Numero assegnato in base all'esigenza (es. 1, 2, 3...)
  nome: string; // Denominazione dello stand (es. "Cucina Tradizionale & Primi Piatti")
  tipologia: TipologiaStand | string;
  riferimentoFood: boolean; // Riferimento Food (True = collegato all'area ristorazione / Food & Beverage)
  descrizione?: string;
  responsabile?: string;
  orarioAperturaStand?: string; // es. "18:30 - 23:30"
  volontariRichiesti?: number; // Fabbisogno minimo operatori per lo stand
  turniAssegnazioni?: AssegnazioneVolontarioStand[]; // Turni e volontari assegnati a questo stand
  // Dati economici per singolo stand (Preventivo, Consuntivo e Differenza)
  spesaPreventivo?: number; // Costi preventivati allestimento/merci (€)
  spesaConsuntivo?: number; // Spese consuntive sostenute (€)
  incassoPrevisto?: number; // Incasso / ricavi previsti (€)
  incassoConsuntivo?: number; // Incasso consuntivo effettivo realizzato (€)
  incassoStimato?: number; // Retrocompatibilità
}

export interface DettaglioSpeseEvento {
  food: number; // Materie prime alimentari, bevande, forniture stand gastronomico
  intrattenimento: number; // Artisti, musica, SIAE, service audio-luci, spettacoli
  altreSpese: number; // Logistica, noleggio palco/gazebo, pulizie, sicurezza/safety
  varie: number; // Tipografia, manifesti, permessi, oneri vari, imprevisti
}

export interface ProLocoEvento {
  id: string;
  titolo: string;
  categoria: CategoriaEvento;
  dataInizio: string; // YYYY-MM-DD
  oraInizio?: string; // HH:MM
  dataFine: string; // YYYY-MM-DD
  oraFine?: string; // HH:MM
  luogo: string;
  stato: StatoEvento;
  descrizione: string;
  locandina?: string;

  // Stand Numerati con Tipologia e Riferimento Food
  standNumerati?: StandEvento[];

  // 1. Nativo | 2. Ibrido | 3. Gestione
  tipoEvento?: TipoEvento;

  // Dettagli specifici Gestione Economica per EVENTO IBRIDO (Co-organizzazione / Partnership)
  partnerIbridoNome?: string;
  percentualeSpeseProLoco?: number; // % a carico Pro Loco (es. 50)
  percentualeEntrateProLoco?: number; // % di competenza Pro Loco (es. 50)
  contributoPartner?: number; // Quota o contributo fisso erogato dal partner (€)

  // Dettagli specifici Gestione Economica per EVENTO GESTIONE (Conto Terzi / Servizi / Convenzioni)
  committenteNome?: string; // Ente committente terzo (es. Comune, Parrocchia, Ente Parco)
  tipoAccordoGestione?: 'compenso_forfettario' | 'rimborso_piu_fee' | 'incassi_delegati';
  compensoGestione?: number; // Compenso / corrispettivo pattuito di gestione (€)
  rimborsoSpeseCommittente?: number; // Spese vive anticipate rimborsate dal committente (€)
  
  // Economia dell'evento: Totali e Dettagli analitici (Tutte le tipologie condividono le stesse voci)
  budgetPrevisto: number; // Totale preventivo spese (somma food, intrattenimento, altreSpese, varie)
  costiSostenuti: number; // Totale consuntivo spese sostenute (somma food, intrattenimento, altreSpese, varie)
  entratePreviste?: number; // Previsione entrate (sponsor, offerte, stand, quote partecipazione)
  entrateRealizzate: number; // Entrate effettive incassate

  // Dettaglio Voci di Costo Preventivo & Consuntivo (Food, Spettacolo, Logistica, Varie)
  spesePreventivo?: DettaglioSpeseEvento;
  speseConsuntivo?: DettaglioSpeseEvento;

  // Risorse umane (collegate ai soci della Pro Loco)
  volontariIds: string[]; // ID dei soci
  responsabileId?: string; // ID socio responsabile

  // Pratiche autorizzative & conformità
  permessoComunale: boolean; // Occupazione suolo pubblico / Patrocinio
  licenzaSIAE: boolean; // Autorizzazione diritti d'autore
  pianoSicurezzaSafety: boolean; // Piano evacuazione e antincendio
  aslHaccp: boolean; // Notifica sanitaria ASL somministrazione

  partecipantiStimati?: number;
  noteOrganizzative?: string;

  // Iscrizione soci e tracciamento presenze
  iscrizioni?: IscrizioneEvento[]; // Elenco soci iscritti e registro presenze
  postiMassimi?: number; // Limite massimo partecipanti/iscritti
  quotaIscrizioneSocio?: number; // Eventuale quota iscrizione socio (€)
  iscrizioniAperte?: boolean; // Se le iscrizioni dei soci sono aperte
}

export type RuoloPartecipazioneEvento = 'partecipante' | 'volontario' | 'relatore_ospite' | 'staff';
export type StatoPresenzaEvento = 'da_verificare' | 'presente' | 'assente' | 'giustificato';

export interface IscrizioneEvento {
  id: string; // ID univoco dell'iscrizione (es. iscr-evt1-socio1)
  socioId: string; // ID del socio nell'Albo Soci
  dataIscrizione: string; // YYYY-MM-DD
  oraIscrizione?: string; // HH:MM
  ruolo: RuoloPartecipazioneEvento; // 'partecipante' | 'volontario' | 'relatore_ospite' | 'staff'
  statoPresenza: StatoPresenzaEvento; // 'da_verificare' | 'presente' | 'assente' | 'giustificato'
  orarioCheckIn?: string; // HH:MM (impostato al check-in dell'amministratore)
  checkInRegistratoDa?: string; // Nominativo dell'amministratore / operatore che ha registrato il check-in
  note?: string; // Es. intolleranze, preferenze menu, mansione assegnata
  numeroAccompagnatori?: number; // Familiari o accompagnatori non soci al seguito
  quotaVersata?: number; // Eventuale quota o contributo versato (€)
}

export interface FiltriEventi {
  ricerca: string;
  categoria: string;
  stato: string;
  tipoEvento?: TipoEvento | 'tutti';
  anno: number | 'tutti';
  ordinamento: 'data_asc' | 'data_desc' | 'titolo_asc' | 'budget_desc';
}

export type CategoriaComunicazioneSocio = 'assemblea' | 'convenzione' | 'avviso' | 'evento' | 'generale' | 'giornalino' | 'newsletter';

export interface ComunicazioneSocio {
  id: string;
  titolo: string;
  oggetto?: string;
  categoria: CategoriaComunicazioneSocio;
  dataPubblicazione: string; // YYYY-MM-DD
  oraPubblicazione?: string; // HH:MM
  autore: string; // Es. "Presidente Pro Loco", "Consiglio Direttivo", "Segreteria"
  contenuto: string;
  inEvidenza?: boolean;
  destinatari?: 'tutti' | 'in_regola' | 'da_rinnovare' | 'ordinari' | 'sostenitori' | 'volontari' | 'direttivo' | 'selezione_personalizzata';
  destinatariCount?: number;
  inviataViaEmail?: boolean;
  allegatoNome?: string;
  linkAzione?: string;
  testoLinkAzione?: string;
  // Campi per invio Uscita Giornalino con riferimento al Numero Tessera del socio
  numeroTesseraRiferimento?: string; // Es. "PL-2026-001" oppure "TUTTI"
  socioDestinatarioId?: string;
  socioDestinatarioNome?: string;
  edizioneGiornalinoId?: string;
  edizioneGiornalinoNumero?: string;
  edizioneGiornalinoSnapshot?: EdizioneGiornalino;
}

export type PaginaPrincipale = 'dashboard' | 'gestionale' | 'sitoweb' | 'giornalino' | 'archivio_giornalino' | 'portale_soci';
export type SottoTabGestionale = 'soci' | 'eventi' | 'bilancio' | 'conto_terzi' | 'comunicazioni' | 'cestino';

export type CategoriaArticoloGiornalino = 
  | 'editoriale'
  | 'primo_piano'
  | 'eventi'
  | 'vita_associativa'
  | 'storia_cultura'
  | 'rubrica';

export type FontEditorGiornalino = 
  | 'serif'          // Playfair Display
  | 'playfair'       // Playfair Display alias
  | 'sans'           // Plus Jakarta Sans
  | 'classico';      // Times / Antiqua

export type StileEsteticaGiornalino = 
  | 'classico_inchiostro'   // Gazzetta Storica d'Inchiostro (Classico)
  | 'antico_borgo'          // Antico Borgo & Pergamena Rinascimentale (Culturale & Tradizioni)
  | 'unpli_verde'           // Periodico Territoriale UNPLI (Natura & Verde)
  | 'bordeaux_nobiliare'    // Notiziario Nobiliare & Sagre Enogastronomiche (Bordeaux Prestigioso)
  | 'alpino_dolomiti'       // Eco Alpino & Valli del Territorio (Pino Montano & Roccia)
  | 'mediterraneo_solare'   // Solare Mediterraneo & Feste Patronali (Terracotta, Ocra & Tradizione)
  | 'moderno_magazine'      // Moderno Magazine Pro Loco (Contemporaneo & Minimal)
  | 'vintage_rotativa'      // Gazzettino di Provincia & Rotativa Anni '70 (Vintage Popolare)
  | 'blu_civico';           // Bollettino Civico Oltremare (Blu Istituzionale)

export type StileLayoutIntestazione = 
  | 'classica_doppio_filetto' 
  | 'ornata_stemma' 
  | 'banda_piena' 
  | 'minimal_lineare' 
  | 'retro_box' 
  | 'bilaterale_logo';

export type DimensioneTitoloIntestazione = 'compatta' | 'standard' | 'grande' | 'imponente';
export type AllineamentoIntestazione = 'center' | 'left' | 'bilaterale';

export interface ConfigurazioneIntestazioneGiornalino {
  stileIntestazione: StileLayoutIntestazione;
  dimensioneTitolo?: DimensioneTitoloIntestazione;
  allineamento?: AllineamentoIntestazione;
  mostraLogo?: boolean;
  mostraMotto?: boolean;
  mostraEnte?: boolean;
  mostraNumeroEdizione?: boolean;
  mostraPeriodo?: boolean;
  mostraDataPubblicazione?: boolean;
  mostraTiratura?: boolean;
  mostraRuntsUnpli?: boolean;
  colorePersonalizzato?: string; // hex es. #064e3b
  fontTestata?: string;
  fregioSimbolo?: string; // es. ❖, ❦, ⚜, ✦, 🏛️
  testoPersonalizzatoEnte?: string;
  testoDirittoDestra?: string;
}

export interface OpzioniEsteticaStampa {
  stileEstetica: StileEsteticaGiornalino;
  stileIntestazione?: StileLayoutIntestazione;
  tonalitaCarta?: 'bianco_ottico' | 'carta_naturale_avorio' | 'pergamena_antica' | 'grigio_quotidiano' | 'carta_sabbia_riciclata' | 'ocra_solare';
  stileFiletti?: 'doppio_classico' | 'sottile_continuo' | 'tratteggiato' | 'ornato_fregio' | 'nessuno';
  stileCapolettera?: 'classico_inchiostro' | 'accento_tema' | 'box_decorato' | 'semplice';
  densitaSpaziatura?: 'compatta' | 'standard' | 'arioso';
  fregioOrnamentale?: boolean;
  corniceFoglio?: boolean;
}

export interface ArticoloGiornalino {
  id: string;
  titolo: string;
  sottotitolo?: string;
  occhiello?: string; // Occhiello / sopratitolo giornalistico
  sezione: CategoriaArticoloGiornalino;
  autore: string;
  data: string; // Es. "Settembre 2025" o "2025-09-01"
  contenuto: string;
  immagine?: string;
  didascaliaImmagine?: string;
  fotoAutore?: string;
  fotoPosizione?: 'sopra' | 'sotto' | 'sinistra' | 'destra' | 'in_testo_sinistra' | 'in_testo_destra' | 'in_calce';
  inEvidenza?: boolean;
  pagina?: number; // Pagina assegnata nel fascicolo (1, 2, 3, 4...)
  ordine?: number; // Ordine di lettura all'interno della pagina
  colonna?: 'singola' | 'doppia' | 'intera' | 'tre';
  allineamento?: 'left' | 'center' | 'right' | 'justify';
  capolettera?: boolean; // Capolettera iniziale (drop cap) stile giornale/Word
  fontFamiglia?: FontEditorGiornalino;
  dimensioneCarattere?: 'compatto' | 'standard' | 'ampio';
  stileBox?: 'trasparente' | 'nessuno' | 'bordo_sottile' | 'cornice_classica' | 'sfondo_chiaro' | 'sfondo_pergamena' | 'evidenza_scuro' | 'bordo_blu';
  // Posizionamento e ridimensionamento libero (DTP Desktop Publishing a piacere con mouse)
  posX?: number; // offset percentuale o px orizzontale
  posY?: number; // offset percentuale o px verticale
  customWidth?: number; // larghezza in percentuale (es. 100, 50, ecc.) o pixel
  customHeight?: number; // altezza minima/fissata in pixel
}

export interface SponsorInserzionista {
  id: string;
  nome: string;
  categoria: string;
  slogan?: string;
  telefono?: string;
  indirizzo?: string;
  logoUrl?: string;
  pagina: number; // 1, 2, 3, 4 ...
  formato: 'box_quarto' | 'banner_striscia' | 'mezza_pagina';
}

export interface StudioEditorConfig {
  temaColore: 'inchiostro' | 'bordeaux' | 'unpli' | 'blu' | 'antico_borgo' | 'vintage' | 'moderno' | 'alpino' | 'mediterraneo' | StileEsteticaGiornalino;
  stileFont: FontEditorGiornalino;
  grigliaPredefinita: 1 | 2 | 3;
  filettiVerticali: boolean;
  interlinea: 'stretta' | 'standard' | 'ampia';
  mostraRighelli: boolean;
  mostraGuide: boolean;
  modalitaVisualizzazione: 'singola' | 'doppia';
  zoom: number;
  esteticaStampa?: OpzioniEsteticaStampa;
}

export interface GiornalinoConfig {
  id?: string;
  testata: string; // Es. "La Voce della Pro Loco"
  sottotitoloTestata: string; // Es. "Notiziario periodico di cultura, feste e vita associativa"
  motto: string;
  numeroEdizione: string; // Es. "Anno XXIV - N. 1"
  periodo: string; // Es. "Edizione Autunno - Inverno"
  dataPubblicazione: string; // Es. "Ottobre 2025"
  direttoreResponsabile: string; // Es. "Marco Valenti (Presidente)"
  redazione: string; // Es. "Consiglio Direttivo e Comitato di Redazione Volontari"
  tiratura: string; // Es. "1.200 copie cartacee e diffusione digitale"
  sedeStampa: string; // Es. "Sede Pro Loco - Tipografia Locale"
  articoli: ArticoloGiornalino[];
  totalePagine?: number; // Numero pagine fascicolo (default 4)
  runningHeader?: string; // Intestazione corrente nelle pagine interne
  mostraNumerazionePagine?: boolean; // Mostra piè di pagina con numero
  layoutPagine?: Record<number, string>; // ID template layout per singola pagina
  sponsor?: SponsorInserzionista[];
  studioConfig?: StudioEditorConfig;
  configurazioneIntestazione?: ConfigurazioneIntestazioneGiornalino;
}

export type StatoUscitaGiornalino = 'bozza' | 'in_stampa' | 'pubblicato' | 'archiviato';

export interface EdizioneGiornalino extends GiornalinoConfig {
  id: string; // ID univoco es. 'ed-2026-primavera', 'ed-2025-autunno'
  anno: number; // Anno di catalogazione (es. 2026, 2025, 2024)
  dataUscita: string; // Data formattata es. "2026-05-15" o "Maggio 2026"
  statoUscita: StatoUscitaGiornalino;
  copertinaPreview?: string; // URL immagine copertina
  noteRedazione?: string; // Note interne del comitato di redazione
  dataCreazione?: string;
  dataUltimaModifica?: string;
  protocolloStampa?: string; // Es. "REG-2026/01-STAMPA"
}

export interface FiltriArchivioGiornalino {
  ricerca: string;
  anno: number | 'tutti';
  stato: StatoUscitaGiornalino | 'tutti';
  ordinamento: 'data_desc' | 'data_asc' | 'anno_desc' | 'anno_asc' | 'titolo_asc';
}


