import { Socio, ProLocoInfo, QuotaAssociativa, StatoQuota, ProLocoEvento, StandEvento, SitoWebConfig, GiornalinoConfig, ArticoloGiornalino, EdizioneGiornalino, DonazioneTerzi, CampagnaRaccoltaFondi, ElementoCestino, ComunicazioneSocio } from './types';
import { calcolaEconomiaEvento, aggregaEventiPerBilancio } from './utils/eventoHelpers';

const STORAGE_KEY_SOCI = 'proloco_gestione_soci_v1';
const STORAGE_KEY_CONFIG = 'proloco_gestione_config_v1';
const STORAGE_KEY_EVENTI = 'proloco_gestione_eventi_v2';
const STORAGE_KEY_SITO_WEB = 'proloco_gestione_sito_web_v1';
const STORAGE_KEY_GIORNALINO = 'proloco_gestione_giornalino_v1';
export const STORAGE_KEY_ARCHIVIO_GIORNALINI = 'proloco_archivio_giornalini_v1';
export const STORAGE_KEY_GIORNALINO_ATTIVO_ID = 'proloco_giornalino_attivo_id_v1';
export const STORAGE_KEY_DONAZIONI = 'proloco_gestione_donazioni_v1';
export const STORAGE_KEY_CAMPAGNE_DONAZIONI = 'proloco_campagne_donazioni_v1';
export const STORAGE_KEY_CESTINO = 'proloco_gestione_cestino_v1';
export const STORAGE_KEY_COMUNICAZIONI_SOCI = 'proloco_comunicazioni_soci_v1';
export const STORAGE_KEY_SESSIONE_SOCIO = 'proloco_sessione_socio_id_v1';

export const DEFAULT_GIORNALINO_CONFIG: GiornalinoConfig = {
  testata: 'La Voce della Pro Loco',
  sottotitoloTestata: 'Periodico Ufficiale di Cultura, Tradizioni Popolari e Vita Associativa',
  motto: 'Al servizio del borgo, custodi della nostra storia dal 1978',
  numeroEdizione: 'Anno XXIV - N. 1',
  periodo: 'Edizione Autunno - Inverno',
  dataPubblicazione: 'Ottobre 2025',
  direttoreResponsabile: 'Marco Valenti (Presidente Pro Loco)',
  redazione: 'Consiglio Direttivo e Comitato Redazionale Volontari',
  tiratura: '1.500 copie ad uso sociale e diffusione digitale gratuita',
  sedeStampa: 'Tipografia Valdelsa & Diffusione Sociale APS',
  totalePagine: 4,
  articoli: [
    {
      id: 'art-1',
      titolo: 'Insieme per Custodire il Passato e Costruire il Futuro del Nostro Borgo',
      sottotitolo: 'L\'editoriale del Presidente: il valore insostituibile del volontariato e dell\'impegno per la comunità',
      sezione: 'editoriale',
      autore: 'Marco Valenti (Presidente)',
      data: 'Ottobre 2025',
      pagina: 1,
      ordine: 1,
      colonna: 'doppia',
      allineamento: 'justify',
      capolettera: true,
      contenuto: `Cari soci, cittadini e amici della nostra Pro Loco,
apriamo questo nuovo numero del nostro notiziario con un sentimento di profonda gratitudine verso tutti coloro che, con dedizione e passione silenziosa, rendono viva la nostra associazione.

La Pro Loco non è solo un comitato organizzatore di sagre o feste paesane: è un presidio di memoria storica, un collante civico e uno spazio aperto in cui generazioni diverse si incontrano. In questo anno sociale abbiamo raggiunto traguardi significativi nel registro RUNTS e nell'albo soci, rinnovando il tesseramento digitale e potenziando la sicurezza di tutte le nostre manifestazioni.

Invitiamo ogni cittadino, in particolare i giovani e le famiglie di nuovo insediamento, ad avvicinarsi alla nostra sede in Piazza del Popolo: c'è bisogno dell'entusiasmo di tutti per continuare a valorizzare i nostri vicoli storici, le nostre tradizioni agricole e il nostro impareggiabile senso di appartenenza. Buona lettura!`,
      inEvidenza: true
    },
    {
      id: 'art-2',
      titolo: 'La Tradizionale Festa d\'Autunno: Record di Presenze e Sapori Ritrovati',
      sottotitolo: 'Tre giorni indimenticabili tra stand gastronomici, musica popolare, antichi mestieri e visitatori da tutta la regione',
      sezione: 'primo_piano',
      autore: 'Redazione Pro Loco',
      data: 'Settembre 2025',
      pagina: 2,
      ordine: 1,
      colonna: 'doppia',
      allineamento: 'justify',
      capolettera: true,
      contenuto: `Si è conclusa con uno straordinario successo di pubblico la 47ª edizione della nostra Festa d'Autunno. I vicoli del centro storico si sono trasformati in un percorso a cielo aperto dedicato alle nostre eccellenze enogastronomiche: castagne del bosco, bruschette con l'olio nuovo, calici di vino tipico e dolci della tradizione contadina preparati secondo le antiche ricette delle nostre nonne.

Oltre 3.500 presenze stimate nell'intero fine settimana, con una gestione impeccabile della sicurezza, della differenziazione dei rifiuti e della viabilità grazie al coordinamento tra il nostro Direttivo, la Polizia Locale e la Protezione Civile. Un ringraziamento speciale va ai 45 volontari attivi che hanno lavorato instancabilmente dietro le quinte.`,
      immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
      didascaliaImmagine: 'I vicoli del centro storico gremiti durante la passeggiata inaugurale della fiera.',
      inEvidenza: true
    },
    {
      id: 'art-3',
      titolo: 'Campagna Tesseramento: Più Soci Siamo, Più Forte Batte il Nostro Territorio',
      sottotitolo: 'Tutti i vantaggi della tessera annuale: sconti convenzionati UNPLI, assicurazione attività e sostegno ai progetti del paese',
      sezione: 'vita_associativa',
      autore: 'Segreteria Associativa',
      data: 'Ottobre 2025',
      pagina: 3,
      ordine: 1,
      colonna: 'singola',
      allineamento: 'justify',
      capolettera: false,
      contenuto: `È ufficialmente aperta la campagna tesseramento per il nuovo anno sociale. Sottoscrivere o rinnovare la quota associativa (Quota Ordinaria 15€, Giovani Under 25 10€, Sostenitori 30€) rappresenta un gesto concreto di vicinanza e supporto al patrimonio culturale della nostra terra.

Con la tessera del socio Pro Loco, riconosciuta a livello nazionale dal circuito UNPLI, si ha diritto a centinaia di convenzioni su ingressi a musei, teatri, parchi archeologici e polizze assicurative per tutte le attività associative. Inoltre quest'anno è possibile richiedere e rinnovare la tessera anche digitalmente con ricezione immediata della ricevuta e del QR Code personale.`,
      inEvidenza: false
    },
    {
      id: 'art-4',
      titolo: 'Scorci e Memoria: Il Recupero della Fontana del Trecento e la Riscoperta dei Sentieri',
      sottotitolo: 'L\'impegno della Pro Loco per la tutela del paesaggio e la posa della nuova segnaletica escursionistica',
      sezione: 'storia_cultura',
      autore: 'Prof. Alberto Conti (Storico locale)',
      data: 'Agosto 2025',
      pagina: 4,
      ordine: 1,
      colonna: 'doppia',
      allineamento: 'justify',
      capolettera: false,
      contenuto: `In sinergia con la Soprintendenza Archeologia e il Comune, i volontari del gruppo sentieri della Pro Loco hanno completato la mappatura e la pulizia del percorso panoramico che unisce il borgo antico alle sorgenti collinari.

L'intervento ha permesso anche di riportare alla luce le antiche vasche di decantazione in pietra serena e di installare una nuova tabella didattica bilingue con QR Code informativo per escursionisti e visitatori. Un tassello fondamentale che arricchisce l'offerta turistica sostenibile del nostro comune.`,
      immagine: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      didascaliaImmagine: 'Uno scorcio del sentiero naturalistico ripulito dai volontari della Pro Loco.',
      inEvidenza: false
    }
  ],
  sponsor: [
    {
      id: 'sp-1',
      nome: 'Ristorante & Pizzeria Il Borgo Antico',
      categoria: 'Enogastronomia Tipica',
      slogan: 'Cucina tradizionale, pasta fresca fatta a mano e pizza nel forno a legna',
      telefono: '0577 987654',
      indirizzo: 'Piazza del Popolo, 12 - Centro Storico',
      pagina: 4,
      formato: 'box_quarto',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'sp-2',
      nome: 'BCC - Credito Cooperativo Locale',
      categoria: 'Banca & Finanza Etica',
      slogan: 'Da oltre 70 anni la banca del nostro territorio al fianco delle famiglie e delle associazioni',
      telefono: '0577 123456',
      indirizzo: 'Via Roma, 45',
      pagina: 4,
      formato: 'box_quarto'
    },
    {
      id: 'sp-3',
      nome: 'Frantoio & Cantina Sociale Colli Nostri',
      categoria: 'Olio EVO & Vini DOCG',
      slogan: 'Vendita diretta olio extravergine d\'oliva IGP e vini tipici del borgo',
      telefono: '0577 654321',
      indirizzo: 'Strada Provinciale dei Vigneti, 8',
      pagina: 4,
      formato: 'banner_striscia',
      logoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'sp-4',
      nome: 'Farmacia & Erboristeria Dr. Mori',
      categoria: 'Salute & Benessere',
      slogan: 'Cosmesi naturale, preparazioni galeniche e consulenza nutrizionale',
      telefono: '0577 345678',
      indirizzo: 'Corso Garibaldi, 28',
      pagina: 3,
      formato: 'box_quarto'
    }
  ],
  studioConfig: {
    temaColore: 'inchiostro',
    stileFont: 'serif',
    grigliaPredefinita: 2,
    filettiVerticali: true,
    interlinea: 'standard',
    mostraRighelli: true,
    mostraGuide: true,
    modalitaVisualizzazione: 'singola',
    zoom: 100
  }
};

export const DEFAULT_SITO_WEB_CONFIG: SitoWebConfig = {
  titoloHero: 'Benvenuti nel Cuore delle Nostre Tradizioni',
  sottotitoloHero: 'Vivi la cultura, gli eventi e l\'ospitalità della nostra terra',
  mottoPersonalizzato: 'Custodi delle tradizioni popolari, promotori del territorio e del patrimonio culturale.',
  testoBenvenuto: 'La nostra Associazione Pro Loco opera ogni giorno come Ente del Terzo Settore per valorizzare il borgo, organizzare feste paesane e manifestazioni culturali, e accogliere con calore residenti e turisti.',
  immagineCopertina: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&auto=format&fit=crop&q=80',
  avvisoImportante: 'Campagna tesseramento in corso: richiedi la tua tessera socio online!',
  mostraAvviso: true,
  tipoAvviso: 'success',
  abilitaEventi: true,
  abilitaTesseramentoOnline: true,
  abilitaTerritorio: true,
  abilitaDirettivo: true,
  abilitaContatti: true,
  titoloTerritorio: 'Scopri il Nostro Borgo & le Tradizioni',
  testoTerritorio: 'Un territorio ricco di scorci medievali, sentieri escursionistici immersi nel verde e prodotti tipici a chilometro zero, custoditi con passione dalla nostra comunità.',
  orariAperturaSede: 'Lunedì - Venerdì: 09:30 - 12:30 | Sabato mattina su appuntamento',
  linkFacebook: 'https://facebook.com',
  linkInstagram: 'https://instagram.com',
  linkWhatsApp: '+39 0577 920314',
  pubblicato: false,
  dataPubblicazione: undefined,
  blindatoVisitatori: false,
  pinSbloccoAdmin: '1234',
  temaColore: 'emerald',
  stileTipografico: 'classico',
  testoInvitoTesseramento: 'Diventa parte attiva della comunità: sostieni gli eventi, partecipa alla vita associativa e accedi alle convenzioni nazionali UNPLI.',
  schedeTerritorio: [
    {
      id: 'terr-1',
      titolo: 'Borgo Storico & Cinta Muraria',
      descrizione: 'Un intatto dedalo di vicoli in pietra serena, botteghe artigiane e bastioni panoramici affacciati sulla vallata.',
      immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
      categoria: 'monumento'
    },
    {
      id: 'terr-2',
      titolo: 'Sapori della Tradizione & Olio EVO',
      descrizione: 'Degustazioni di prodotti tipici a km zero, vino DOCG e ricette secolari tramandate dai mastri cuochi locali.',
      immagine: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
      categoria: 'enogastronomia'
    },
    {
      id: 'terr-3',
      titolo: 'Sentieri Naturalistici & Trekking',
      descrizione: 'Itinerari immersi tra uliveti, boschi di querce e sorgenti d\'acqua limpida, perfetti per famiglie ed escursionisti.',
      immagine: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      categoria: 'natura'
    }
  ]
};

export const DEFAULT_PRO_LOCO: ProLocoInfo = {
  nome: 'Pro Loco Valdelsa & Colline',
  codiceFiscale: '90023410523',
  partitaIva: '01293840521',
  indirizzo: 'Piazza del Popolo, 12',
  cap: '53034',
  comune: 'Colle di Val d\'Elsa',
  provincia: 'SI',
  email: 'info@prolocovaldelsa.it',
  pec: 'prolocovaldelsa@pec.it',
  telefono: '+39 0577 920314',
  sitoWeb: 'www.prolocovaldelsa.it',
  codiceUnpli: 'UNPLI-TOS-5219',
  numeroRunts: 'RUNTS-APS-2022-84912',
  annoCorrente: new Date().getFullYear(),
  quotaStandardOrdinario: 15,
  quotaStandardSostenitore: 30,
  quotaStandardGiovane: 10,
  nomePresidente: 'Marco Valenti',
  motto: 'Custodi delle tradizioni, promotori del territorio e della comunità',
  iban: 'IT89C0848971840000000123456',
  banca: 'BCC Credito Cooperativo del Territorio - Filiale Sede'
};

export const INITIAL_CAMPAGNE_FONDI: CampagnaRaccoltaFondi[] = [
  {
    id: 'camp-2026-restauro',
    titolo: 'Restauro Storico Fontana e Lavatoio del Trecento',
    descrizione: 'Raccolta fondi dedicata al recupero architettonico e valorizzazione del patrimonio storico monumentale del borgo.',
    obiettivoImporto: 5000,
    anno: 2026,
    attiva: true,
    dataInizio: '2026-01-10',
    dataFine: '2026-10-31',
    responsabileProgetto: 'Arch. Alessandro Monti (Consigliere Delegato Patrimonio)'
  },
  {
    id: 'camp-2026-sicurezza',
    titolo: 'Postazioni Salvavita DAE (Defibrillatori) per Sagre ed Eventi',
    descrizione: 'Acquisto defibrillatori semiautomatici, teche termoriscaldate esterne e corsi BLSD certificati per i volontari.',
    obiettivoImporto: 3000,
    anno: 2026,
    attiva: true,
    dataInizio: '2026-02-01',
    dataFine: '2026-08-31',
    responsabileProgetto: 'Marco Valenti (Presidente)'
  },
  {
    id: 'camp-2026-giovani',
    titolo: 'Fondo Borse di Studio "Aldo Rinaldi" & Giovani Volontari',
    descrizione: 'Incentivi e riconoscimenti per studenti meritevoli e progetti di digitalizzazione e promozione culturale promossi dai giovani.',
    obiettivoImporto: 2500,
    anno: 2026,
    attiva: true,
    dataInizio: '2026-01-01',
    dataFine: '2026-12-31',
    responsabileProgetto: 'Elena Bianchi (Tesoriere)'
  },
  {
    id: 'camp-2026-feste',
    titolo: 'Eco-Sagre: Allestimento Stand Gastronomici Green & Impianti a LED',
    descrizione: 'Rinnovamento stoviglie biodegradabili e illuminazione sostenibile a basso consumo energetico.',
    obiettivoImporto: 4000,
    anno: 2026,
    attiva: true,
    dataInizio: '2026-03-01',
    dataFine: '2026-09-30',
    responsabileProgetto: 'Comitato Feste & Manifestazioni'
  }
];

export const INITIAL_SOCI: Socio[] = [
  {
    id: 'socio-1',
    numeroTessera: 'PL-2025-001',
    nome: 'Marco',
    cognome: 'Valenti',
    codiceFiscale: 'VLNMCR75M14C847K',
    dataNascita: '1975-08-14',
    luogoNascita: 'Siena (SI)',
    indirizzo: 'Via Roma, 45',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '338 1234567',
    email: 'm.valenti@email.it',
    categoria: 'Membro Direttivo',
    ruoloDirettivo: 'Presidente',
    dataIscrizione: '2015-02-10',
    attivo: true,
    consensoPrivacy: true,
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    note: 'Coordinamento generale sagre e rapporti con il Comune.',
    competenzeVolontariato: ['Organizzazione Eventi', 'Rapporti Istituzionali'],
    quote: [
      {
        id: 'q-1-2024',
        socioId: 'socio-1',
        anno: 2024,
        importo: 15,
        dataPagamento: '2024-01-15',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2024/001',
        note: 'Rinnovo quota annuale ordinaria'
      },
      {
        id: 'q-1-2025',
        socioId: 'socio-1',
        anno: 2025,
        importo: 15,
        dataPagamento: '2025-01-12',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2025/001',
        note: 'Rinnovo quota annuale ordinaria'
      },
      {
        id: 'q-1-2026',
        socioId: 'socio-1',
        anno: 2026,
        importo: 15,
        dataPagamento: '2026-01-10',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2026/001',
        note: 'Quota anno 2026'
      }
    ]
  },
  {
    id: 'socio-2',
    numeroTessera: 'PL-2025-002',
    nome: 'Giulia',
    cognome: 'Bernardi',
    codiceFiscale: 'BRNGLI84P52C847E',
    dataNascita: '1984-09-12',
    luogoNascita: 'Poggibonsi (SI)',
    indirizzo: 'Via Garibaldi, 8',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '347 9876543',
    email: 'giulia.bernardi@studio.it',
    categoria: 'Membro Direttivo',
    ruoloDirettivo: 'Segretario',
    dataIscrizione: '2018-04-15',
    attivo: true,
    consensoPrivacy: true,
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    note: 'Gestione verbali assemblea e comunicazioni soci.',
    competenzeVolontariato: ['Segreteria', 'Social Media'],
    quote: [
      {
        id: 'q-2-2025',
        socioId: 'socio-2',
        anno: 2025,
        importo: 15,
        dataPagamento: '2025-01-20',
        metodo: 'POS / Carta',
        ricevutaNumero: 'REC-2025/004'
      },
      {
        id: 'q-2-2026',
        socioId: 'socio-2',
        anno: 2026,
        importo: 15,
        dataPagamento: '2026-01-18',
        metodo: 'POS / Carta',
        ricevutaNumero: 'REC-2026/003'
      }
    ]
  },
  {
    id: 'socio-3',
    numeroTessera: 'PL-2025-003',
    nome: 'Alessandro',
    cognome: 'Moretti',
    codiceFiscale: 'MRTLSN68D20D612Z',
    dataNascita: '1968-04-20',
    luogoNascita: 'Firenze (FI)',
    indirizzo: 'Viale Matteotti, 102',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '335 4433221',
    email: 'a.moretti@fattoria.com',
    categoria: 'Sostenitore',
    ruoloDirettivo: 'Nessuno',
    dataIscrizione: '2019-06-01',
    attivo: true,
    consensoPrivacy: true,
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    note: 'Azienda vinicola locale, sponsor tecnico per rassegne enogastronomiche.',
    competenzeVolontariato: ['Logistica', 'Enogastronomia'],
    quote: [
      {
        id: 'q-3-2025',
        socioId: 'socio-3',
        anno: 2025,
        importo: 30,
        dataPagamento: '2025-02-05',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2025/012',
        note: 'Quota Socio Sostenitore'
      },
      {
        id: 'q-3-2026',
        socioId: 'socio-3',
        anno: 2026,
        importo: 30,
        dataPagamento: '2026-02-02',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2026/008',
        note: 'Quota Socio Sostenitore'
      }
    ]
  },
  {
    id: 'socio-4',
    numeroTessera: 'PL-2025-004',
    nome: 'Elena',
    cognome: 'Rossi',
    codiceFiscale: 'RSSLNE92C65A564Q',
    dataNascita: '1992-03-25',
    luogoNascita: 'Bologna (BO)',
    indirizzo: 'Via delle Fonti, 14',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '349 5566778',
    email: 'elena.rossi@architettura.org',
    categoria: 'Volontario Attivo',
    ruoloDirettivo: 'Consigliere',
    dataIscrizione: '2021-03-10',
    attivo: true,
    consensoPrivacy: true,
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    note: 'Guida turistica abilitata per visite nel borgo storico medievale.',
    competenzeVolontariato: ['Visite Guidate', 'Grafica e Allestimento'],
    quote: [
      {
        id: 'q-4-2025',
        socioId: 'socio-4',
        anno: 2025,
        importo: 15,
        dataPagamento: '2025-03-01',
        metodo: 'Satispay',
        ricevutaNumero: 'REC-2025/023'
      }
      // Quota 2026 ancora da rinnovare!
    ]
  },
  {
    id: 'socio-5',
    numeroTessera: 'PL-2025-005',
    nome: 'Federico',
    cognome: 'Conti',
    codiceFiscale: 'CNTFDC01M18C847J',
    dataNascita: '2001-08-18',
    luogoNascita: 'Poggibonsi (SI)',
    indirizzo: 'Via Dante, 3',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '320 8765412',
    email: 'fede.conti@studenti.unisi.it',
    categoria: 'Giovane',
    ruoloDirettivo: 'Nessuno',
    dataIscrizione: '2023-09-01',
    attivo: true,
    consensoPrivacy: true,
    note: 'Responsabile gruppo giovani volontari per la notte bianca.',
    competenzeVolontariato: ['Audio/Luci', 'Animazione'],
    quote: [
      {
        id: 'q-5-2025',
        socioId: 'socio-5',
        anno: 2025,
        importo: 10,
        dataPagamento: '2025-01-25',
        metodo: 'Contanti',
        ricevutaNumero: 'REC-2025/007',
        note: 'Quota agevolata Under 25'
      }
    ]
  },
  {
    id: 'socio-6',
    numeroTessera: 'PL-2025-006',
    nome: 'Donatella',
    cognome: 'Mancini',
    codiceFiscale: 'MNCDTL56H55I726W',
    dataNascita: '1956-06-15',
    luogoNascita: 'San Gimignano (SI)',
    indirizzo: 'Borgo Santa Caterina, 21',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '333 7162534',
    email: 'dona.mancini@libero.it',
    categoria: 'Onorario',
    ruoloDirettivo: 'Nessuno',
    dataIscrizione: '2010-01-01',
    attivo: true,
    consensoPrivacy: true,
    note: 'Socia fondatrice e decana della Pro Loco. Quota onoraria esente da statuto.',
    competenzeVolontariato: ['Storia Locale', 'Archivio Storico'],
    quote: [
      {
        id: 'q-6-2025',
        socioId: 'socio-6',
        anno: 2025,
        importo: 0,
        dataPagamento: '2025-01-02',
        metodo: 'Contanti',
        ricevutaNumero: 'REC-2025/002',
        note: 'Socio Onorario (Esente)'
      },
      {
        id: 'q-6-2026',
        socioId: 'socio-6',
        anno: 2026,
        importo: 0,
        dataPagamento: '2026-01-02',
        metodo: 'Contanti',
        ricevutaNumero: 'REC-2026/002',
        note: 'Socio Onorario (Esente)'
      }
    ]
  },
  {
    id: 'socio-7',
    numeroTessera: 'PL-2025-007',
    nome: 'Roberto',
    cognome: 'Bianchi',
    codiceFiscale: 'BNCRRT80T10G752X',
    dataNascita: '1980-12-10',
    luogoNascita: 'Pontedera (PI)',
    indirizzo: 'Via dei Fossi, 9',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '340 1122334',
    email: 'roberto.bianchi@officina.net',
    categoria: 'Ordinario',
    ruoloDirettivo: 'Tesoriere',
    dataIscrizione: '2017-05-18',
    attivo: true,
    consensoPrivacy: true,
    note: 'Tenuta della contabilità e rendiconto annuale.',
    competenzeVolontariato: ['Amministrazione', 'Logistica'],
    quote: [
      {
        id: 'q-7-2025',
        socioId: 'socio-7',
        anno: 2025,
        importo: 15,
        dataPagamento: '2025-01-15',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2025/003'
      },
      {
        id: 'q-7-2026',
        socioId: 'socio-7',
        anno: 2026,
        importo: 15,
        dataPagamento: '2026-01-14',
        metodo: 'Bonifico Bancario',
        ricevutaNumero: 'REC-2026/004'
      }
    ]
  },
  {
    id: 'socio-8',
    numeroTessera: 'PL-2025-008',
    nome: 'Chiara',
    cognome: 'Neri',
    codiceFiscale: 'NRICHR88R48G752D',
    dataNascita: '1988-10-08',
    luogoNascita: 'Siena (SI)',
    indirizzo: 'Vicolo Corto, 2',
    cap: '53034',
    citta: 'Colle di Val d\'Elsa',
    provincia: 'SI',
    telefono: '348 9900112',
    email: 'chiara.neri@comunicazione.it',
    categoria: 'Ordinario',
    ruoloDirettivo: 'Nessuno',
    dataIscrizione: '2022-11-20',
    attivo: true,
    consensoPrivacy: true,
    note: 'Disponibile per allestimento stand sagre estive.',
    competenzeVolontariato: ['Allestimenti', 'Cucina Tradizionale'],
    quote: [
      {
        id: 'q-8-2024',
        socioId: 'socio-8',
        anno: 2024,
        importo: 15,
        dataPagamento: '2024-02-14',
        metodo: 'Contanti',
        ricevutaNumero: 'REC-2024/015'
      }
      // Non ha rinnovato né per 2025 né per 2026 (scaduta)
    ]
  }
];

export const INITIAL_DONAZIONI: DonazioneTerzi[] = [
  {
    id: 'don-2026-001',
    donatore: 'Fondazione Cassa di Risparmio Territoriale',
    tipoDonatore: 'fondazione',
    codiceFiscalePartitaIva: '01458920521',
    indirizzoDonatore: 'Corso Cavour, 28',
    cittaDonatore: 'Siena',
    capDonatore: '53100',
    emailDonatore: 'contributi@fondazionecrt.it',
    importo: 3500,
    data: '2026-02-12',
    anno: 2026,
    tipoErogazione: 'progetto_vincolato',
    campagnaId: 'camp-2026-restauro',
    causale: 'Erogazione liberale per recupero sentieristica storico-ambientale e fontana monumentale del Trecento',
    metodo: 'Bonifico Bancario',
    estremiTracciabilita: 'CRO/TRN 0481920391823 - Banca MPS',
    deliberaConsiglio: 'Delibera C.D. Verbale n. 2 del 20/01/2026',
    ricevutaNumero: 'DON-2026/001',
    destinazione: 'Cultura, Territorio & Ambiente',
    detraibileFiscale: true,
    note: 'Accreditato su c/c istituzionale Pro Loco. Emessa quietanza liberale deducibile Terzo Settore ex art. 83 CTS.'
  },
  {
    id: 'don-2026-002',
    donatore: 'BCC - Banca di Credito Cooperativo del Territorio',
    tipoDonatore: 'azienda',
    codiceFiscalePartitaIva: '00984710528',
    indirizzoDonatore: 'Viale dei Mille, 14',
    cittaDonatore: 'Colle di Val d\'Elsa',
    capDonatore: '53034',
    emailDonatore: 'direzione@bccterritorio.it',
    importo: 2000,
    data: '2026-03-05',
    anno: 2026,
    tipoErogazione: 'progetto_vincolato',
    campagnaId: 'camp-2026-sicurezza',
    causale: 'Contributo liberale per acquisto postazione DAE (defibrillatore) e presidio sicurezza sagre paesane',
    metodo: 'Bonifico Bancario',
    estremiTracciabilita: 'TRN 1928401928301 - BCC Territorio',
    deliberaConsiglio: 'Delibera C.D. Verbale n. 3 del 15/02/2026',
    ricevutaNumero: 'DON-2026/002',
    destinazione: 'Sicurezza & Protezione Civile Pro Loco',
    detraibileFiscale: true,
    note: 'Dotazione salvavita ad uso pubblico per manifestazioni.'
  },
  {
    id: 'don-2026-003',
    donatore: 'Azienda Meccanica Valdelsa S.r.l.',
    tipoDonatore: 'azienda',
    codiceFiscalePartitaIva: '02341290526',
    indirizzoDonatore: 'Zona Industriale Belvedere, 4',
    cittaDonatore: 'Colle di Val d\'Elsa',
    capDonatore: '53034',
    emailDonatore: 'amministrazione@meccanicavaldelsa.it',
    importo: 1200,
    data: '2026-04-18',
    anno: 2026,
    tipoErogazione: 'progetto_vincolato',
    campagnaId: 'camp-2026-feste',
    causale: 'Erogazione liberale per allestimento stand gastronomici e impianto luci a basso consumo',
    metodo: 'Bonifico Bancario',
    estremiTracciabilita: 'CRO 93827104928 - Intesa Sanpaolo',
    ricevutaNumero: 'DON-2026/003',
    destinazione: 'Feste & Sagre Popolari',
    detraibileFiscale: true,
    note: 'Sostegno logistico alle sagre tradizionali.'
  },
  {
    id: 'don-2026-004',
    donatore: 'Famiglia Rinaldi (in memoria del Cav. Aldo)',
    tipoDonatore: 'privato',
    codiceFiscalePartitaIva: 'RNLLDA42A15G752M',
    indirizzoDonatore: 'Via delle Fonti, 9',
    cittaDonatore: 'Colle di Val d\'Elsa',
    capDonatore: '53034',
    emailDonatore: 'famiglia.rinaldi@email.it',
    importo: 800,
    data: '2026-01-20',
    anno: 2026,
    tipoErogazione: 'in_memoria',
    campagnaId: 'camp-2026-giovani',
    causale: 'Donazione privata in memoria del socio fondatore per premio borse di studio giovani volontari',
    metodo: 'Bonifico Bancario',
    estremiTracciabilita: 'CRO 01928472910 - BancoPosta',
    deliberaConsiglio: 'Delibera C.D. Verbale n. 1 del 10/01/2026',
    ricevutaNumero: 'DON-2026/004',
    destinazione: 'Progetti Giovani & Borse di Studio',
    detraibileFiscale: true,
    note: 'Destinata a incentivare i giovani del borgo nelle attività culturali.'
  },
  {
    id: 'don-2026-005',
    donatore: 'Tenuta Vitivinicola Colle Antico',
    tipoDonatore: 'azienda',
    codiceFiscalePartitaIva: '01784920524',
    indirizzoDonatore: 'Strada del Chianti, 72',
    cittaDonatore: 'Castellina in Chianti',
    capDonatore: '53011',
    emailDonatore: 'info@colleanticovini.it',
    importo: 1000,
    data: '2026-05-15',
    anno: 2026,
    tipoErogazione: 'erogazione_liberale_denaro',
    causale: 'Erogazione liberale a supporto della valorizzazione dei prodotti enogastronomici tipici locali',
    metodo: 'Bonifico Bancario',
    estremiTracciabilita: 'TRN 8271049283710 - Credit Agricole',
    ricevutaNumero: 'DON-2026/005',
    destinazione: 'Enogastronomia & Prodotti Tipici',
    detraibileFiscale: true,
    note: 'Collaborazione per calici e degustazioni guidate.'
  },
  {
    id: 'don-2026-006',
    donatore: 'Offerte Libere Spontanee della Cittadinanza',
    tipoDonatore: 'anonimo',
    importo: 450,
    data: '2026-05-02',
    anno: 2026,
    tipoErogazione: 'raccolta_fondi_pubblica',
    causale: 'Raccolta offerte libere con cassetta sigillata durante la giornata ecologica e pulizia sentieri',
    metodo: 'Contanti',
    ricevutaNumero: 'DON-2026/006',
    destinazione: 'Ambiente & Cura del Territorio',
    detraibileFiscale: false,
    note: 'Verbale di apertura cassetta controfirmato da Presidente e Tesoriere.'
  },
  {
    id: 'don-2025-001',
    donatore: 'Fondazione Cassa di Risparmio Territoriale',
    tipoDonatore: 'fondazione',
    codiceFiscalePartitaIva: '01458920521',
    importo: 3000,
    data: '2025-03-12',
    anno: 2025,
    causale: 'Contributo liberale per restauro antico tabernacolo ligneo e pubblicazione guida storico-artistica',
    metodo: 'Bonifico Bancario',
    ricevutaNumero: 'DON-2025/001',
    destinazione: 'Cultura & Memoria Storica',
    detraibileFiscale: true,
    note: 'Progetto completato e rendicontato con successo.'
  },
  {
    id: 'don-2025-002',
    donatore: 'BCC - Banca di Credito Cooperativo del Territorio',
    tipoDonatore: 'azienda',
    codiceFiscalePartitaIva: '00984710528',
    importo: 1800,
    data: '2025-04-10',
    anno: 2025,
    causale: 'Donazione liberale per noleggio palco e impianto service musicale della Festa d\'Autunno',
    metodo: 'Bonifico Bancario',
    ricevutaNumero: 'DON-2025/002',
    destinazione: 'Musica & Spettacoli',
    detraibileFiscale: true
  },
  {
    id: 'don-2025-003',
    donatore: 'Studio Tecnico Arch. Rossi & Partners',
    tipoDonatore: 'azienda',
    codiceFiscalePartitaIva: '01998430522',
    importo: 600,
    data: '2025-09-08',
    anno: 2025,
    causale: 'Erogazione liberale per rilievo cartografico e tabellazione sentieri montani',
    metodo: 'Bonifico Bancario',
    ricevutaNumero: 'DON-2025/003',
    destinazione: 'Sentieristica & Ambiente',
    detraibileFiscale: true
  },
  {
    id: 'don-2025-004',
    donatore: 'Offerte Liberali Sagra Patronale',
    tipoDonatore: 'anonimo',
    importo: 520,
    data: '2025-09-21',
    anno: 2025,
    causale: 'Offerte libere in piazza durante le celebrazioni patronali',
    metodo: 'Contanti',
    ricevutaNumero: 'DON-2025/004',
    destinazione: 'Feste Tradizionali',
    detraibileFiscale: false
  }
];

export const STAND_SIMULATI_DEFAULT: StandEvento[] = [
  {
    id: 'std-1',
    numero: 1,
    nome: 'Cucina Tradizionale & Primi Piatti',
    tipologia: 'Food / Gastronomia',
    riferimentoFood: true,
    responsabile: 'Marco Valenti (Chef Volontario)',
    orarioAperturaStand: '18:00 - 23:30',
    volontariRichiesti: 3,
    descrizione: 'Pasta fresca tirata a mano, sughi tipici della tradizione contadina e polenta rustica. Cucina coperta certificata HACCP.',
    spesaPreventivo: 1400,
    spesaConsuntivo: 1250,
    incassoPrevisto: 3600,
    incassoConsuntivo: 3800,
    incassoStimato: 3800,
    turniAssegnazioni: [
      {
        id: 'trn-1-1',
        socioId: 'socio-1',
        nomeVolontario: 'Valenti Marco',
        nominativo: 'Valenti Marco',
        numeroTessera: 'PL-2025-001',
        telefono: '338 1234567',
        mansione: 'Responsabile Stand / Capo Postazione',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '18:00',
        orarioFine: '23:30',
        orarioSpecifico: '18:00 - 23:30',
        confermato: true,
        note: 'Coordinamento brigata cucina e controllo porzioni'
      },
      {
        id: 'trn-1-2',
        socioId: 'socio-8',
        nomeVolontario: 'Neri Chiara',
        nominativo: 'Neri Chiara',
        numeroTessera: 'PL-2025-008',
        telefono: '348 9900112',
        mansione: 'Cuoco / Addetto Cucina',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '18:30',
        orarioFine: '23:00',
        orarioSpecifico: '18:30 - 23:00',
        confermato: true,
        note: 'Cottura primi piatti e impiattamento'
      },
      {
        id: 'trn-1-3',
        socioId: 'socio-6',
        nomeVolontario: 'Mancini Donatella',
        nominativo: 'Mancini Donatella',
        numeroTessera: 'PL-2025-006',
        telefono: '333 7162534',
        mansione: 'Cuoco / Addetto Cucina',
        fasciaOraria: 'Pomeriggio (Accoglienza)',
        orarioInizio: '15:30',
        orarioFine: '19:30',
        orarioSpecifico: '15:30 - 19:30',
        confermato: true,
        note: 'Preparazione pasta fresca e sughi tradizionali'
      }
    ]
  },
  {
    id: 'std-2',
    numero: 2,
    nome: 'Griglia, Carni & Rosticceria alla Brace',
    tipologia: 'Food / Griglia & Brace',
    riferimentoFood: true,
    responsabile: 'Alessandro Moretti (Mastro Fuochista)',
    orarioAperturaStand: '18:30 - 23:30',
    volontariRichiesti: 2,
    descrizione: 'Salsicce artigianali, tagliata, arrosticini e contorni cotti alla brace a vista. Impianto con cappa aspirante e braciere protetto.',
    spesaPreventivo: 1200,
    spesaConsuntivo: 1100,
    incassoPrevisto: 3000,
    incassoConsuntivo: 3200,
    incassoStimato: 3200,
    turniAssegnazioni: [
      {
        id: 'trn-2-1',
        socioId: 'socio-3',
        nomeVolontario: 'Moretti Alessandro',
        nominativo: 'Moretti Alessandro',
        numeroTessera: 'PL-2025-003',
        telefono: '335 4433221',
        mansione: 'Fuochista / Addetto Griglia',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '18:00',
        orarioFine: '23:30',
        orarioSpecifico: '18:00 - 23:30',
        confermato: true,
        note: 'Accensione bracieri e cottura tagliata/salsicce'
      },
      {
        id: 'trn-2-2',
        socioId: 'socio-7',
        nomeVolontario: 'Bianchi Roberto',
        nominativo: 'Bianchi Roberto',
        numeroTessera: 'PL-2025-007',
        telefono: '340 1122334',
        mansione: 'Servizio ai Tavoli / Runner',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '19:00',
        orarioFine: '23:00',
        orarioSpecifico: '19:00 - 23:00',
        confermato: true,
        note: 'Porzionamento carni e uscita vassoi caldi'
      }
    ]
  },
  {
    id: 'std-3',
    numero: 3,
    nome: 'Friggitoria & Dolci Tradizionali del Borgo',
    tipologia: 'Food / Friggitoria & Dolci',
    riferimentoFood: true,
    responsabile: 'Elena Rossi',
    orarioAperturaStand: '18:30 - 23:30',
    volontariRichiesti: 2,
    descrizione: 'Fritti dorati al cartoccio, frittelle di castagne, bomboloni caldi e ciambelle della festa preparate al momento.',
    spesaPreventivo: 450,
    spesaConsuntivo: 420,
    incassoPrevisto: 1000,
    incassoConsuntivo: 1100,
    incassoStimato: 1100,
    turniAssegnazioni: [
      {
        id: 'trn-3-1',
        socioId: 'socio-4',
        nomeVolontario: 'Rossi Elena',
        nominativo: 'Rossi Elena',
        numeroTessera: 'PL-2025-004',
        telefono: '349 5566778',
        mansione: 'Addetto Friggitoria / Dolci',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '18:30',
        orarioFine: '23:30',
        orarioSpecifico: '18:30 - 23:30',
        confermato: true,
        note: 'Frittelle di castagne e cartocci caldi'
      }
    ]
  },
  {
    id: 'std-4',
    numero: 4,
    nome: 'Punto Beverage, Birreria Artigianale & Vini DOC',
    tipologia: 'Beverage / Bar & Vini',
    riferimentoFood: true,
    responsabile: 'Federico Conti',
    orarioAperturaStand: '18:00 - 24:00',
    volontariRichiesti: 2,
    descrizione: 'Vini tipici delle colline, birre artigianali alla spina, acqua minerale e bibite fresche. Banco spillatura a flusso continuo.',
    spesaPreventivo: 450,
    spesaConsuntivo: 430,
    incassoPrevisto: 1400,
    incassoConsuntivo: 1400,
    incassoStimato: 1400,
    turniAssegnazioni: [
      {
        id: 'trn-4-1',
        socioId: 'socio-5',
        nomeVolontario: 'Conti Federico',
        nominativo: 'Conti Federico',
        numeroTessera: 'PL-2025-005',
        telefono: '320 8765412',
        mansione: 'Barista / Spillatore Bevande',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '18:00',
        orarioFine: '24:00',
        orarioSpecifico: '18:00 - 24:00',
        confermato: true,
        note: 'Gestione spine birra artigianale e mescita vini DOC'
      },
      {
        id: 'trn-4-2',
        socioId: 'socio-3',
        nomeVolontario: 'Moretti Alessandro',
        nominativo: 'Moretti Alessandro',
        numeroTessera: 'PL-2025-003',
        telefono: '335 4433221',
        mansione: 'Logistica / Rifornimento Scorte',
        fasciaOraria: 'Mattina (Allestimento & Prep)',
        orarioInizio: '10:00',
        orarioFine: '12:30',
        orarioSpecifico: '10:00 - 12:30',
        confermato: true,
        note: 'Carico fusti refrigerati e calici degustazione'
      }
    ]
  },
  {
    id: 'std-5',
    numero: 5,
    nome: 'Cassa Centrale & Ritiro Ticket Ristoro',
    tipologia: 'Cassa & Ticket',
    riferimentoFood: false,
    responsabile: 'Giulia Bernardi (Segreteria)',
    orarioAperturaStand: '18:00 - 23:00',
    volontariRichiesti: 2,
    descrizione: 'Postazione scontrini e gettoni unificata per gli stand gastronomici con terminale POS contactless e contanti.',
    spesaPreventivo: 200,
    spesaConsuntivo: 180,
    incassoPrevisto: 0,
    incassoConsuntivo: 0,
    incassoStimato: 0,
    turniAssegnazioni: [
      {
        id: 'trn-5-1',
        socioId: 'socio-2',
        nomeVolontario: 'Bernardi Giulia',
        nominativo: 'Bernardi Giulia',
        numeroTessera: 'PL-2025-002',
        telefono: '347 9876543',
        mansione: 'Cassiere / Addetto Ticket',
        fasciaOraria: 'Cena (Servizio Serale)',
        orarioInizio: '18:00',
        orarioFine: '23:00',
        orarioSpecifico: '18:00 - 23:00',
        confermato: true,
        note: 'Cassa principale e emissione ticket POS'
      },
      {
        id: 'trn-5-2',
        socioId: 'socio-7',
        nomeVolontario: 'Bianchi Roberto',
        nominativo: 'Bianchi Roberto',
        numeroTessera: 'PL-2025-007',
        telefono: '340 1122334',
        mansione: 'Cassiere / Addetto Ticket',
        fasciaOraria: 'Notte (Chiusura & Riordino)',
        orarioInizio: '22:30',
        orarioFine: '24:00',
        orarioSpecifico: '22:30 - 24:00',
        confermato: true,
        note: 'Chiusura cassa serale e conteggio incassi stand'
      }
    ]
  },
  {
    id: 'std-6',
    numero: 6,
    nome: 'Mercatino Artigianato & Prodotti Tipici Km 0',
    tipologia: 'Mercatino & Artigianato',
    riferimentoFood: false,
    responsabile: 'Donatella Mancini',
    orarioAperturaStand: '10:00 - 22:00',
    volontariRichiesti: 2,
    descrizione: 'Bancarelle espositive di hobbisti locali, miele, olio extravergine d\'oliva e artigianato artistico del territorio.',
    spesaPreventivo: 100,
    spesaConsuntivo: 80,
    incassoPrevisto: 0,
    incassoConsuntivo: 0,
    incassoStimato: 0,
    turniAssegnazioni: [
      {
        id: 'trn-6-1',
        socioId: 'socio-6',
        nomeVolontario: 'Mancini Donatella',
        nominativo: 'Mancini Donatella',
        numeroTessera: 'PL-2025-006',
        telefono: '333 7162534',
        mansione: 'Accoglienza / Info Point',
        fasciaOraria: 'Mattina (Allestimento & Prep)',
        orarioInizio: '09:30',
        orarioFine: '13:30',
        orarioSpecifico: '09:30 - 13:30',
        confermato: true,
        note: 'Assegnazione piazzole espositori e punto informativo Pro Loco'
      }
    ]
  }
];

export const INITIAL_EVENTI: ProLocoEvento[] = [
  // 1. EVENTO NATIVO (100% Organizzazione & Rischio Pro Loco)
  {
    id: 'evento-eff-1',
    titolo: '1. Sagra del Borgo Antico (Evento Nativo 100% Pro Loco)',
    categoria: 'Enogastronomia & Sagra',
    dataInizio: '2026-10-17',
    oraInizio: '12:00',
    dataFine: '2026-10-18',
    oraFine: '23:30',
    luogo: 'Piazza del Popolo e Borgo Antico',
    stato: 'in_programma',
    tipoEvento: 'nativo',
    descrizione: 'Grande sagra enogastronomica autunnale ideata e gestita direttamente dalla Pro Loco con 6 stand operativi numerati, cucina tradizionale, griglia alla brace, friggitoria, punto beverage e mercatino.',
    locandina: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=700&auto=format&fit=crop&q=80',
    standNumerati: STAND_SIMULATI_DEFAULT,
    budgetPrevisto: 6500,
    costiSostenuti: 5900,
    entratePreviste: 9000,
    entrateRealizzate: 9500,
    spesePreventivo: {
      food: 3500,
      intrattenimento: 1200,
      altreSpese: 1300,
      varie: 500
    },
    speseConsuntivo: {
      food: 3200,
      intrattenimento: 1200,
      altreSpese: 1100,
      varie: 400
    },
    volontariIds: ['socio-1', 'socio-2', 'socio-3', 'socio-5'],
    responsabileId: 'socio-1',
    permessoComunale: true,
    licenzaSIAE: true,
    pianoSicurezzaSafety: true,
    aslHaccp: true,
    partecipantiStimati: 1800,
    noteOrganizzative: 'Gestione Economica Nativa Effettiva: 100% dei costi sostenuti (5.900 €) e degli incassi realizzati dagli stand (9.500 €) confluiscono nel bilancio sociale della Pro Loco con un utile netto di +3.600 €.',
    iscrizioniAperte: true,
    postiMassimi: 50,
    quotaIscrizioneSocio: 10,
    iscrizioni: [
      {
        id: 'iscr-eff-1-s1',
        socioId: 'socio-1',
        dataIscrizione: '2026-09-10',
        oraIscrizione: '10:30',
        ruolo: 'volontario',
        statoPresenza: 'presente',
        orarioCheckIn: '11:45',
        checkInRegistratoDa: 'Presidenza / Check-in',
        note: 'Coordinamento generale stand e accoglienza',
        quotaVersata: 10
      },
      {
        id: 'iscr-eff-1-s2',
        socioId: 'socio-2',
        dataIscrizione: '2026-09-11',
        oraIscrizione: '11:15',
        ruolo: 'volontario',
        statoPresenza: 'presente',
        orarioCheckIn: '11:50',
        checkInRegistratoDa: 'Segreteria',
        numeroAccompagnatori: 1,
        quotaVersata: 20
      },
      {
        id: 'iscr-eff-1-s3',
        socioId: 'socio-3',
        dataIscrizione: '2026-09-12',
        oraIscrizione: '16:00',
        ruolo: 'partecipante',
        statoPresenza: 'presente',
        orarioCheckIn: '12:10',
        checkInRegistratoDa: 'Ingresso / Check-in',
        note: 'Menu celiaco richiesto',
        quotaVersata: 10
      },
      {
        id: 'iscr-eff-1-s5',
        socioId: 'socio-5',
        dataIscrizione: '2026-09-15',
        oraIscrizione: '09:20',
        ruolo: 'staff',
        statoPresenza: 'da_verificare',
        note: 'Assistenza punto cassa e gettoni',
        quotaVersata: 10
      },
      {
        id: 'iscr-eff-1-s6',
        socioId: 'socio-6',
        dataIscrizione: '2026-09-16',
        oraIscrizione: '14:40',
        ruolo: 'relatore_ospite',
        statoPresenza: 'presente',
        orarioCheckIn: '12:00',
        checkInRegistratoDa: 'Presidenza',
        note: 'Socia decana ospite al tavolo d\'onore',
        quotaVersata: 0
      },
      {
        id: 'iscr-eff-1-s7',
        socioId: 'socio-7',
        dataIscrizione: '2026-09-18',
        oraIscrizione: '18:10',
        ruolo: 'partecipante',
        statoPresenza: 'assente',
        note: 'Impossibilitato per motivi lavorativi',
        quotaVersata: 10
      }
    ]
  },

  // 2. EVENTO IBRIDO (Co-organizzazione con Partner / Ripartizione Quote)
  {
    id: 'evento-eff-2',
    titolo: '2. Fiera d\'Autunno & Notte Bianca (Evento Ibrido con Partner)',
    categoria: 'Festa Tradizionale & Patronale',
    dataInizio: '2026-10-24',
    oraInizio: '16:00',
    dataFine: '2026-10-25',
    oraFine: '01:00',
    luogo: 'Vie del Centro Storico & Piazza Matteotti',
    stato: 'in_programma',
    tipoEvento: 'ibrido',
    partnerIbridoNome: 'Comune & Associazione Commercianti del Centro Storico',
    percentualeSpeseProLoco: 50,
    percentualeEntrateProLoco: 50,
    contributoPartner: 0,
    descrizione: 'Manifestazione autunnale co-organizzata in partnership con il Comune e i Commercianti. Stand gastronomici e operativi con ripartizione paritetica (50/50) di spese ed entrate.',
    locandina: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=700&auto=format&fit=crop&q=80',
    standNumerati: STAND_SIMULATI_DEFAULT,
    budgetPrevisto: 6500,
    costiSostenuti: 5900,
    entratePreviste: 9000,
    entrateRealizzate: 9500,
    spesePreventivo: {
      food: 3500,
      intrattenimento: 1200,
      altreSpese: 1300,
      varie: 500
    },
    speseConsuntivo: {
      food: 3200,
      intrattenimento: 1200,
      altreSpese: 1100,
      varie: 400
    },
    volontariIds: ['socio-1', 'socio-2', 'socio-3', 'socio-5'],
    responsabileId: 'socio-1',
    permessoComunale: true,
    licenzaSIAE: true,
    pianoSicurezzaSafety: true,
    aslHaccp: true,
    partecipantiStimati: 1800,
    noteOrganizzative: 'Gestione Economica Ibrida Effettiva (50/50): Spese vive lorde (5.900 €) ed entrate lorde stand (9.500 €) divise al 50%. Quota costi Pro Loco: 2.950 €, Quota incassi Pro Loco: 4.750 €, Utile netto Pro Loco: +1.800 €.',
    iscrizioniAperte: true,
    postiMassimi: 80,
    quotaIscrizioneSocio: 0,
    iscrizioni: [
      {
        id: 'iscr-eff-2-s1',
        socioId: 'socio-1',
        dataIscrizione: '2026-09-20',
        oraIscrizione: '10:00',
        ruolo: 'volontario',
        statoPresenza: 'presente',
        orarioCheckIn: '15:45',
        checkInRegistratoDa: 'Comitato Feste',
        note: 'Referente palco e accoglienza partner'
      },
      {
        id: 'iscr-eff-2-s4',
        socioId: 'socio-4',
        dataIscrizione: '2026-09-21',
        oraIscrizione: '14:20',
        ruolo: 'partecipante',
        statoPresenza: 'presente',
        orarioCheckIn: '16:15',
        checkInRegistratoDa: 'Info Point',
        numeroAccompagnatori: 2
      },
      {
        id: 'iscr-eff-2-s6',
        socioId: 'socio-6',
        dataIscrizione: '2026-09-22',
        oraIscrizione: '11:00',
        ruolo: 'partecipante',
        statoPresenza: 'da_verificare'
      }
    ]
  },

  // 3. EVENTO GESTIONE (Conto Terzi per Committente / Rimborso Spese + Fee)
  {
    id: 'evento-eff-3',
    titolo: '3. Festival Patronale & Estate nel Borgo (Gestione Conto Terzi Comune)',
    categoria: 'Musica, Spettacolo & Teatro',
    dataInizio: '2026-11-07',
    oraInizio: '10:00',
    dataFine: '2026-11-08',
    oraFine: '23:30',
    luogo: 'Piazza della Libertà e Area Spettacoli',
    stato: 'in_programma',
    tipoEvento: 'gestione',
    committenteNome: 'Comune - Assessorato al Turismo & Grandi Eventi',
    tipoAccordoGestione: 'rimborso_piu_fee',
    compensoGestione: 2500,
    rimborsoSpeseCommittente: 5900,
    descrizione: 'Allestimento e gestione logistica ed enogastronomica per conto terzi del Comune. Le spese vive anticipate sono rimborsate al 100% dal Comune + compenso di gestione di 2.500 € a favore della Pro Loco.',
    locandina: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&auto=format&fit=crop&q=80',
    standNumerati: STAND_SIMULATI_DEFAULT,
    budgetPrevisto: 6500,
    costiSostenuti: 5900,
    entratePreviste: 9000,
    entrateRealizzate: 9500,
    spesePreventivo: {
      food: 3500,
      intrattenimento: 1200,
      altreSpese: 1300,
      varie: 500
    },
    speseConsuntivo: {
      food: 3200,
      intrattenimento: 1200,
      altreSpese: 1100,
      varie: 400
    },
    volontariIds: ['socio-1', 'socio-2', 'socio-3', 'socio-5'],
    responsabileId: 'socio-1',
    permessoComunale: true,
    licenzaSIAE: true,
    pianoSicurezzaSafety: true,
    aslHaccp: true,
    partecipantiStimati: 1800,
    noteOrganizzative: 'Gestione Economica Conto Terzi Effettiva: Spese anticipate (5.900 €) integralmente rimborsate dal Comune a piè di lista. Compenso di gestione Pro Loco: +2.500 € netti a rischio d\'impresa zero.',
    iscrizioniAperte: true,
    postiMassimi: 120,
    quotaIscrizioneSocio: 15,
    iscrizioni: [
      {
        id: 'iscr-eff-3-s1',
        socioId: 'socio-1',
        dataIscrizione: '2026-09-25',
        oraIscrizione: '09:00',
        ruolo: 'staff',
        statoPresenza: 'presente',
        orarioCheckIn: '09:40',
        checkInRegistratoDa: 'Segreteria',
        quotaVersata: 15
      },
      {
        id: 'iscr-eff-3-s2',
        socioId: 'socio-2',
        dataIscrizione: '2026-09-25',
        oraIscrizione: '10:30',
        ruolo: 'volontario',
        statoPresenza: 'presente',
        orarioCheckIn: '09:50',
        checkInRegistratoDa: 'Segreteria',
        quotaVersata: 15
      },
      {
        id: 'iscr-eff-3-s3',
        socioId: 'socio-3',
        dataIscrizione: '2026-09-26',
        oraIscrizione: '15:10',
        ruolo: 'partecipante',
        statoPresenza: 'da_verificare',
        quotaVersata: 15
      }
    ]
  }
];

export function loadProLocoConfig(): ProLocoInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_PRO_LOCO));
      return DEFAULT_PRO_LOCO;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Errore nel caricamento della configurazione Pro Loco:', err);
    return DEFAULT_PRO_LOCO;
  }
}

export function saveProLocoConfig(config: ProLocoInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    syncDatabaseToServer({ config });
  } catch (err) {
    console.error('Errore nel salvataggio della configurazione:', err);
  }
}

export function loadSitoWebConfig(): SitoWebConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SITO_WEB);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SITO_WEB, JSON.stringify(DEFAULT_SITO_WEB_CONFIG));
      return DEFAULT_SITO_WEB_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SITO_WEB_CONFIG, ...parsed };
  } catch (err) {
    console.error('Errore nel caricamento della configurazione del sito web:', err);
    return DEFAULT_SITO_WEB_CONFIG;
  }
}

export function saveSitoWebConfig(config: SitoWebConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SITO_WEB, JSON.stringify(config));
    syncDatabaseToServer({ sitoConfig: config });
  } catch (err) {
    console.error('Errore nel salvataggio della configurazione del sito web:', err);
  }
}

export const INITIAL_ARCHIVIO_GIORNALINI: EdizioneGiornalino[] = [
  {
    ...DEFAULT_GIORNALINO_CONFIG,
    id: 'ed-2026-primavera',
    anno: 2026,
    dataUscita: '15 Maggio 2026',
    dataPubblicazione: 'Maggio 2026',
    numeroEdizione: 'Anno XXV - N. 1',
    periodo: 'Edizione Primavera - Estate 2026',
    statoUscita: 'in_stampa',
    copertinaPreview: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
    protocolloStampa: 'REG-2026/01-STAMPA',
    noteRedazione: 'Numero celebrativo del 25° Anniversario con programma completo dell\'Estate nel Borgo e bando fotografico.',
    tiratura: '1.800 copie cartacee e diffusione digitale',
    dataCreazione: '2026-03-01',
    dataUltimaModifica: '2026-04-18',
    articoli: [
      {
        id: 'art-2026-1',
        titolo: 'Venticinque Anni Insieme: Il Cuore Pulsante del Nostro Borgo',
        sottotitolo: 'Un quarto di secolo di volontariato, radici storiche e passione civile per la nostra comunità',
        occhiello: 'L\'EDITORIALE DEL PRESIDENTE',
        sezione: 'editoriale',
        autore: 'Marco Valenti',
        data: 'Maggio 2026',
        pagina: 1,
        ordine: 1,
        colonna: 'doppia',
        allineamento: 'justify',
        capolettera: true,
        contenuto: `Cari soci, cittadini e amici della Pro Loco,

Tagliare il traguardo dei venticinque anni di attività non è solo una lieta ricorrenza anagrafica, ma il segno tangibile di quanto la dedizione gratuita e appassionata di tante persone possa trasformarsi in un bene comune duraturo e insostituibile.

In questo quarto di secolo la nostra Pro Loco ha saputo reinventarsi senza mai smarrire la propria anima: abbiamo custodito con devozione le antiche memorie orali, valorizzato monumenti dimenticati e animato piazze che altrimenti rischierebbero lo spopolamento. L'energia dei nuovi volontari ci dà la certezza che il futuro della nostra comunità è ricco di speranza e creatività.`,
        immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
        didascaliaImmagine: 'La piazza centrale durante la storica assemblea dei soci fondatori.',
        inEvidenza: true
      },
      {
        id: 'art-2026-2',
        titolo: 'Estate nel Borgo 2026: Musica, Notte Bianca e Sapori Autentici',
        sottotitolo: 'Svelato il cartellone estivo: oltre venti appuntamenti tra concerti sotto le stelle e rievocazioni',
        occhiello: 'GRANDI EVENTI & TURISMO',
        sezione: 'eventi',
        autore: 'Comitato Festeggiamenti',
        data: 'Maggio 2026',
        pagina: 2,
        ordine: 1,
        colonna: 'singola',
        allineamento: 'justify',
        capolettera: true,
        contenuto: `Si preannuncia una stagione estiva straordinaria per il nostro comune. Tra i momenti clou spicca la Notte Bianca dei Vicoli (18 luglio), con degustazioni guidate, spettacoli itineranti di artisti di strada e botteghe artigiane aperte fino a tarda notte.

Confermatissima la Sagra del Piatto Tipico nella seconda settimana di agosto, interamente rifornita da filiera corta a chilometro zero, con stand gastronomici rinnovati ed ecocompatibili secondo le linee guida Plastic-Free adottate dal nostro Direttivo.`,
        immagine: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
        didascaliaImmagine: 'Uno scorcio degli allestimenti enogastronomici all\'aperto.',
        inEvidenza: false
      },
      {
        id: 'art-2026-3',
        titolo: 'Aperte le Iscrizioni al Concorso Fotografico "Scorci e Tradizioni"',
        sottotitolo: 'Partecipazione aperta a soci e visitatori: mostra finale e premiazione in autunno',
        occhiello: 'VITA ASSOCIATIVA & CULTURA',
        sezione: 'vita_associativa',
        autore: 'Elena Bianchi',
        data: 'Maggio 2026',
        pagina: 3,
        ordine: 1,
        colonna: 'singola',
        allineamento: 'justify',
        capolettera: false,
        contenuto: `Giunge alla terza edizione il concorso fotografico promosso dalla Pro Loco in collaborazione con l'Assessorato alla Cultura. Le opere selezionate da una giuria di esperti comporranno il calendario sociale 2027 e saranno esposte nella Sala delle Volte durante la Fiera Patronale. I moduli di iscrizione sono disponibili presso la sede e sul nostro sito web ufficiale.`,
        inEvidenza: false
      }
    ]
  },
  {
    ...DEFAULT_GIORNALINO_CONFIG,
    id: 'ed-2025-autunno',
    anno: 2025,
    dataUscita: '20 Ottobre 2025',
    dataPubblicazione: 'Ottobre 2025',
    numeroEdizione: 'Anno XXIV - N. 2',
    periodo: 'Edizione Autunno - Inverno 2025',
    statoUscita: 'pubblicato',
    copertinaPreview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    protocolloStampa: 'REG-2025/02-STAMPA',
    noteRedazione: 'Fascicolo distribuito ai soci e depositato presso la biblioteca comunale. Tiratura 1.500 copie.',
    tiratura: '1.500 copie ad uso sociale e diffusione digitale gratuita',
    dataCreazione: '2025-08-10',
    dataUltimaModifica: '2025-10-18'
  },
  {
    ...DEFAULT_GIORNALINO_CONFIG,
    id: 'ed-2025-primavera',
    anno: 2025,
    dataUscita: '10 Maggio 2025',
    dataPubblicazione: 'Maggio 2025',
    numeroEdizione: 'Anno XXIV - N. 1',
    periodo: 'Edizione Speciale Fiere e Borgo Antico',
    statoUscita: 'archiviato',
    copertinaPreview: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop&q=80',
    protocolloStampa: 'REG-2025/01-STAMPA',
    noteRedazione: 'Focus sulla riqualificazione dei vicoli storici e il mercatino artigianale.',
    tiratura: '1.200 copie',
    dataCreazione: '2025-03-05',
    dataUltimaModifica: '2025-05-08',
    articoli: [
      {
        id: 'art-2025-p1',
        titolo: 'Riscoprire la Primavera: Il Borgo si Riapre all\'Accoglienza',
        sottotitolo: 'Dalle fioriture al ritorno delle escursioni guidate tra storia e natura',
        occhiello: 'EDITORIALE DI PRIMAVERA',
        sezione: 'editoriale',
        autore: 'Marco Valenti',
        data: 'Maggio 2025',
        pagina: 1,
        ordine: 1,
        colonna: 'doppia',
        allineamento: 'justify',
        capolettera: true,
        contenuto: `La primavera risveglia i nostri sentieri e riporta residenti e viaggiatori ad affollare i vicoli del borgo. Questa edizione speciale del nostro periodico offre una bussola ricca di approfondimenti su percorsi naturalistici, mostre d'artigianato locale e la rinascita dei nostri orti comunitari.`,
        inEvidenza: true
      },
      {
        id: 'art-2025-p2',
        titolo: 'Fiera dei Mestieri Antichi: Oltre 40 Artigiani in Piazza',
        sottotitolo: 'Tessitura a mano, ferro battuto e ceramica tradizionale incantano i visitatori',
        occhiello: 'TRADIZIONI & MEMORIE',
        sezione: 'storia_cultura',
        autore: 'Redazione Storica',
        data: 'Maggio 2025',
        pagina: 2,
        ordine: 1,
        colonna: 'singola',
        allineamento: 'justify',
        capolettera: true,
        contenuto: `Il successo della Fiera dei Mestieri Antichi ha superato ogni aspettativa. Mastri scalpellini, tessitrici e impagliatori hanno allestito dimostrazioni dal vivo nei cortili storici del borgo, offrendo ai più giovani l'opportunità di riscoprire professioni artigianali dal fascino intramontabile.`,
        inEvidenza: false
      }
    ]
  },
  {
    ...DEFAULT_GIORNALINO_CONFIG,
    id: 'ed-2024-natale',
    anno: 2024,
    dataUscita: '15 Dicembre 2024',
    dataPubblicazione: 'Dicembre 2024',
    numeroEdizione: 'Anno XXIII - N. 3',
    periodo: 'Speciale Festività Natalizie & Memorie',
    statoUscita: 'archiviato',
    copertinaPreview: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    protocolloStampa: 'REG-2024/03-STAMPA',
    noteRedazione: 'Edizione natalizia con resoconto delle attività annuali e inaugurazione del presepe artistico.',
    tiratura: '1.000 copie',
    dataCreazione: '2024-11-10',
    dataUltimaModifica: '2024-12-14',
    articoli: [
      {
        id: 'art-2024-n1',
        titolo: 'La Magia del Natale Accende la Comunità',
        sottotitolo: 'Un anno ricco di soddisfazioni e progetti condivisi giunge a conclusione',
        occhiello: 'EDITORIALE DI FINE ANNO',
        sezione: 'editoriale',
        autore: 'Marco Valenti',
        data: 'Dicembre 2024',
        pagina: 1,
        ordine: 1,
        colonna: 'doppia',
        allineamento: 'justify',
        capolettera: true,
        contenuto: `Volge al termine un anno intenso e fecondo. Con il consueto fascicolo di dicembre desideriamo esprimere la nostra più sincera gratitudine a ogni volontario, socio e sostenitore che ha dedicato tempo ed entusiasmo alla nostra associazione.`,
        inEvidenza: true
      },
      {
        id: 'art-2024-n2',
        titolo: 'Inaugurato il Presepe Artistico Monumentale nelle Grotte della Pieve',
        sottotitolo: 'Scene animate e costumi d\'epoca realizzati a mano dai volontari',
        occhiello: 'FESTE & TRADIZIONE',
        sezione: 'storia_cultura',
        autore: 'Giuseppe Rinaldi',
        data: 'Dicembre 2024',
        pagina: 2,
        ordine: 1,
        colonna: 'singola',
        allineamento: 'justify',
        capolettera: false,
        contenuto: `Il suggestivo ambiente delle antiche cantine della Pieve ospita la nuova installazione del presepe meccanico monumentale. Più di cinquanta figure in movimento riproducono la vita agreste del secolo scorso, riscuotendo grande ammirazione da scolaresche e comitive turistiche.`,
        inEvidenza: false
      }
    ]
  }
];

export function normalizzaEdizioneGiornalinoCompat(raw: any, fallbackIdx: number = 0): EdizioneGiornalino {
  const baseRaw = raw && typeof raw === 'object' ? raw : {};
  const nestedConfig = baseRaw.config && typeof baseRaw.config === 'object' ? baseRaw.config : {};
  const sorgente = { ...nestedConfig, ...baseRaw };
  const annoMatch = String(
    sorgente.anno || sorgente.dataUscita || sorgente.dataPubblicazione || sorgente.numeroEdizione || sorgente.meseAnno || ''
  ).match(/20\d{2}/);
  const annoCalcolato =
    typeof sorgente.anno === 'number' && !isNaN(sorgente.anno)
      ? sorgente.anno
      : annoMatch
      ? parseInt(annoMatch[0], 10)
      : new Date().getFullYear();

  const rawArticoli = Array.isArray(sorgente.articoli) ? sorgente.articoli : [];
  const totalePagine =
    Number(sorgente.totalePagine || sorgente.numeroPagine) >= 2
      ? Number(sorgente.totalePagine || sorgente.numeroPagine)
      : 4;

  const articoliNormalizzati: ArticoloGiornalino[] = rawArticoli.map((art: any, idx: number) => ({
    ...art,
    id: art?.id || `art-compat-${fallbackIdx}-${idx}`,
    titolo: art?.titolo || 'Articolo',
    sottotitolo: art?.sottotitolo || '',
    occhiello: art?.occhiello || art?.categoria || '',
    sezione: art?.sezione || 'primo_piano',
    autore: art?.autore || DEFAULT_GIORNALINO_CONFIG.direttoreResponsabile,
    data: art?.data || sorgente.dataPubblicazione || sorgente.meseAnno || '',
    contenuto: art?.contenuto !== undefined ? art.contenuto : (art?.testo || ''),
    pagina: typeof art?.pagina === 'number' && art.pagina >= 1 ? art.pagina : ((idx % totalePagine) + 1),
    ordine: typeof art?.ordine === 'number' ? art.ordine : idx + 1,
    colonna: art?.colonna || (idx === 0 ? 'doppia' : 'singola'),
    allineamento: art?.allineamento || 'justify',
    capolettera: art?.capolettera !== undefined ? art.capolettera : idx < 2,
    inEvidenza: Boolean(art?.inEvidenza)
  }));

  const testataRisolta =
    sorgente.testata ||
    sorgente.titoloTestata ||
    sorgente.titoloPrincipale ||
    DEFAULT_GIORNALINO_CONFIG.testata;

  const numeroEdizioneRisolto =
    sorgente.numeroEdizione ||
    (sorgente.numeroUscita ? `Anno ${annoCalcolato} - N. ${sorgente.numeroUscita}` : `Anno ${annoCalcolato} - N. ${fallbackIdx + 1}`);

  const periodoRisolto =
    sorgente.periodo ||
    sorgente.meseAnno ||
    sorgente.dataPubblicazione ||
    `Edizione ${annoCalcolato}`;

  const dataPubblicazioneRisolta =
    sorgente.dataPubblicazione ||
    sorgente.meseAnno ||
    sorgente.dataUscita ||
    `${annoCalcolato}`;

  const dataUscitaRisolta =
    sorgente.dataUscita ||
    sorgente.dataPubblicazione ||
    `${annoCalcolato}-01-01`;

  return {
    ...DEFAULT_GIORNALINO_CONFIG,
    ...sorgente,
    id: sorgente.id || `ed-compat-${annoCalcolato}-${fallbackIdx + 1}`,
    anno: annoCalcolato,
    testata: testataRisolta,
    titoloTestata: testataRisolta,
    sottotitoloTestata: sorgente.sottotitoloTestata || sorgente.sottotitolo || DEFAULT_GIORNALINO_CONFIG.sottotitoloTestata,
    numeroEdizione: numeroEdizioneRisolto,
    periodo: periodoRisolto,
    dataPubblicazione: dataPubblicazioneRisolta,
    dataUscita: dataUscitaRisolta,
    totalePagine,
    numeroPagine: totalePagine,
    statoUscita: sorgente.statoUscita || 'pubblicato',
    articoli: articoliNormalizzati,
    sponsor: Array.isArray(sorgente.sponsor) ? sorgente.sponsor : [],
    studioConfig: sorgente.studioConfig
      ? { ...DEFAULT_GIORNALINO_CONFIG.studioConfig, ...sorgente.studioConfig }
      : DEFAULT_GIORNALINO_CONFIG.studioConfig
  };
}

export function loadArchivioGiornalini(): EdizioneGiornalino[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ARCHIVIO_GIORNALINI);
    if (raw === null) {
      // Compatibilità con vecchie versioni che salvavano solo STORAGE_KEY_GIORNALINO
      const legacySingleRaw = localStorage.getItem(STORAGE_KEY_GIORNALINO);
      if (legacySingleRaw) {
        try {
          const parsedLegacy = JSON.parse(legacySingleRaw);
          if (parsedLegacy && typeof parsedLegacy === 'object') {
            const edLegacy = normalizzaEdizioneGiornalinoCompat(parsedLegacy, 0);
            const combinato = [
              edLegacy,
              ...INITIAL_ARCHIVIO_GIORNALINI.filter(e => e.id !== edLegacy.id)
            ];
            localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(combinato));
            return combinato;
          }
        } catch {
          // ignore
        }
      }
      localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(INITIAL_ARCHIVIO_GIORNALINI));
      return INITIAL_ARCHIVIO_GIORNALINI;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(INITIAL_ARCHIVIO_GIORNALINI));
      return INITIAL_ARCHIVIO_GIORNALINI;
    }
    return parsed.map((item, idx) => normalizzaEdizioneGiornalinoCompat(item, idx));
  } catch (err) {
    console.error('Errore nel caricamento archivio giornalini:', err);
    return INITIAL_ARCHIVIO_GIORNALINI;
  }
}

export function saveArchivioGiornalini(edizioni: EdizioneGiornalino[]): void {
  try {
    const normalizzate = (edizioni || []).map((ed, idx) => normalizzaEdizioneGiornalinoCompat(ed, idx));
    localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(normalizzate));
    syncDatabaseToServer({ archivioGiornalini: normalizzate });
  } catch (err) {
    console.error('Errore nel salvataggio archivio giornalini:', err);
  }
}

export function loadGiornalinoAttivoId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEY_GIORNALINO_ATTIVO_ID);
    if (id !== null) return id;
    const archivio = loadArchivioGiornalini();
    return archivio[0]?.id || INITIAL_ARCHIVIO_GIORNALINI[0].id;
  } catch {
    return INITIAL_ARCHIVIO_GIORNALINI[0].id;
  }
}

export function saveGiornalinoAttivoId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GIORNALINO_ATTIVO_ID, id);
    syncDatabaseToServer({ giornalinoAttivoId: id });
  } catch (err) {
    console.error('Errore salvataggio ID giornalino attivo:', err);
  }
}

export function loadGiornalinoConfig(): GiornalinoConfig {
  try {
    const archivio = loadArchivioGiornalini();
    const attivoId = loadGiornalinoAttivoId();
    const trovatoInArchivio = archivio.find(ed => ed.id === attivoId) || archivio[0];

    const raw = localStorage.getItem(STORAGE_KEY_GIORNALINO);
    const sorgente = trovatoInArchivio || (raw ? JSON.parse(raw) : DEFAULT_GIORNALINO_CONFIG);
    return normalizzaEdizioneGiornalinoCompat(sorgente, 0);
  } catch (err) {
    console.error('Errore nel caricamento del giornalino:', err);
    return DEFAULT_GIORNALINO_CONFIG;
  }
}

export function saveGiornalinoConfig(config: GiornalinoConfig): void {
  try {
    const archivio = loadArchivioGiornalini();
    const configId = config.id || loadGiornalinoAttivoId() || `giornalino-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const idx = archivio.findIndex(ed => ed.id === configId);

    const annoMatch = (config.dataPubblicazione || config.numeroEdizione || '').match(/20\d{2}/);
    const annoCalcolato =
      (config as EdizioneGiornalino).anno ||
      (idx >= 0 && archivio[idx].anno) ||
      (annoMatch ? parseInt(annoMatch[0], 10) : new Date().getFullYear());

    const edizioneAggiornata: EdizioneGiornalino = normalizzaEdizioneGiornalinoCompat(
      {
        ...(idx >= 0 ? archivio[idx] : {}),
        ...config,
        id: configId,
        anno: annoCalcolato,
        dataUscita:
          (config as EdizioneGiornalino).dataUscita ||
          (idx >= 0 && archivio[idx].dataUscita) ||
          config.dataPubblicazione ||
          new Date().toISOString().split('T')[0],
        statoUscita:
          (config as EdizioneGiornalino).statoUscita ||
          (idx >= 0 && archivio[idx].statoUscita) ||
          'bozza',
        dataCreazione:
          (config as EdizioneGiornalino).dataCreazione ||
          (idx >= 0 && archivio[idx].dataCreazione) ||
          new Date().toISOString().split('T')[0],
        dataUltimaModifica: new Date().toISOString().split('T')[0]
      },
      0
    );

    localStorage.setItem(STORAGE_KEY_GIORNALINO, JSON.stringify(edizioneAggiornata));

    let nuovoArchivio: EdizioneGiornalino[];
    if (idx >= 0) {
      nuovoArchivio = archivio.map((ed, i) => (i === idx ? edizioneAggiornata : ed));
    } else {
      nuovoArchivio = [edizioneAggiornata, ...archivio];
    }

    localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(nuovoArchivio));
    localStorage.setItem(STORAGE_KEY_GIORNALINO_ATTIVO_ID, configId);

    // Aggiorna anche gli snapshot nelle comunicazioni già inviate ai soci / APK così l'APK riceve sempre le modifiche
    let comunicazioniAggiornate: ComunicazioneSocio[] | undefined;
    try {
      const comEsistenti = loadComunicazioniSoci();
      let modificate = false;
      const nuoveCom = comEsistenti.map(c => {
        if (c.edizioneGiornalinoId === configId) {
          modificate = true;
          return {
            ...c,
            titolo: `📰 Giornalino Pro Loco: ${edizioneAggiornata.numeroEdizione} (${edizioneAggiornata.periodo})`,
            edizioneGiornalinoNumero: edizioneAggiornata.numeroEdizione,
            edizioneGiornalinoSnapshot: edizioneAggiornata
          };
        }
        return c;
      });
      if (modificate) {
        localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify(nuoveCom));
        comunicazioniAggiornate = nuoveCom;
      }
    } catch {
      // ignore
    }

    syncDatabaseToServer({
      giornalinoConfig: edizioneAggiornata,
      giornalinoAttivoId: configId,
      archivioGiornalini: nuovoArchivio,
      ...(comunicazioniAggiornate ? { comunicazioni: comunicazioniAggiornate } : {})
    });
  } catch (err) {
    console.error('Errore nel salvataggio del giornalino:', err);
  }
}

export function eliminaEdizioneGiornalino(edizioneId: string): {
  nuovoArchivio: EdizioneGiornalino[];
  nuovaAttiva: EdizioneGiornalino;
} {
  const archivio = loadArchivioGiornalini();
  let nuovoArchivio = archivio.filter(ed => ed.id !== edizioneId);

  // Se vengono eliminate tutte le uscite, crea una nuova uscita pulita in bozza per non lasciare l'editor bloccato
  if (nuovoArchivio.length === 0) {
    const annoCorr = new Date().getFullYear();
    const oggi = new Date().toISOString().split('T')[0];
    const nuovaVuota: EdizioneGiornalino = normalizzaEdizioneGiornalinoCompat({
      ...DEFAULT_GIORNALINO_CONFIG,
      id: `giornalino-${annoCorr}-${Date.now().toString().slice(-4)}`,
      anno: annoCorr,
      dataUscita: oggi,
      dataPubblicazione: `${annoCorr}`,
      numeroEdizione: `Anno ${annoCorr} - N. 1`,
      periodo: `Nuova Edizione ${annoCorr}`,
      statoUscita: 'bozza',
      dataCreazione: oggi,
      dataUltimaModifica: oggi,
      articoli: [],
      sponsor: []
    });
    nuovoArchivio = [nuovaVuota];
  }

  const nuovaAttiva = nuovoArchivio[0];
  localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(nuovoArchivio));
  localStorage.setItem(STORAGE_KEY_GIORNALINO_ATTIVO_ID, nuovaAttiva.id);
  localStorage.setItem(STORAGE_KEY_GIORNALINO, JSON.stringify(nuovaAttiva));

  // Rimuove anche le comunicazioni collegate all'edizione eliminata così il Portale Soci e il file APK si aggiornano subito
  let nuoveComunicazioni = loadComunicazioniSoci();
  nuoveComunicazioni = nuoveComunicazioni.filter(c => c.edizioneGiornalinoId !== edizioneId);
  localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify(nuoveComunicazioni));

  syncDatabaseToServer({
    archivioGiornalini: nuovoArchivio,
    giornalinoAttivoId: nuovaAttiva.id,
    giornalinoConfig: nuovaAttiva,
    comunicazioni: nuoveComunicazioni
  });

  return { nuovoArchivio, nuovaAttiva };
}

export function esportaRegistroGiornaliniCSV(edizioni: EdizioneGiornalino[]): void {
  const headers = [
    'Anno',
    'Data Uscita',
    'Numero Edizione',
    'Periodo',
    'Testata',
    'Stato',
    'Tiratura',
    'Pagine',
    'N. Articoli',
    'N. Sponsor',
    'Protocollo Stampa',
    'Direttore Responsabile',
    'Data Creazione'
  ];

  const righe = edizioni.map(ed => [
    `"${ed.anno}"`,
    `"${ed.dataUscita || ed.dataPubblicazione}"`,
    `"${ed.numeroEdizione.replace(/"/g, '""')}"`,
    `"${ed.periodo.replace(/"/g, '""')}"`,
    `"${ed.testata.replace(/"/g, '""')}"`,
    `"${ed.statoUscita.toUpperCase()}"`,
    `"${(ed.tiratura || '').replace(/"/g, '""')}"`,
    `"${ed.totalePagine || 4}"`,
    `"${(ed.articoli || []).length}"`,
    `"${(ed.sponsor || []).length}"`,
    `"${ed.protocolloStampa || '-'}"`,
    `"${(ed.direttoreResponsabile || '').replace(/"/g, '""')}"`,
    `"${ed.dataCreazione || '-'}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...righe.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `registro_uscite_giornalino_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


export function loadSoci(): Socio[] {
  const defaultConPin = INITIAL_SOCI.map(s => ({ ...s, pin: s.pin || '1234' }));
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOCI);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify(defaultConPin));
      return defaultConPin;
    }
    const parsed: Socio[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify(defaultConPin));
      return defaultConPin;
    }
    if (parsed.length === 0) {
      return [];
    }

    // Assicura che i soci demo ricevano la fototessera predefinita se non impostata
    const fotoMappa: Record<string, string> = {};
    INITIAL_SOCI.forEach(s => {
      if (s.foto) fotoMappa[s.id] = s.foto;
    });

    const arricchiti = parsed.map(socio => {
      return {
        ...socio,
        foto: socio.foto || fotoMappa[socio.id],
        pin: socio.pin && socio.pin.trim() ? socio.pin.trim() : '1234'
      };
    });

    return arricchiti;
  } catch (err) {
    console.error('Errore nel caricamento dei soci:', err);
    return defaultConPin;
  }
}

export function saveSoci(soci: Socio[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify(soci));
    syncDatabaseToServer({ soci });
  } catch (err) {
    console.error('Errore nel salvataggio dei soci:', err);
  }
}

export function getStatoQuotaSocio(socio: Socio, anno: number): StatoQuota {
  if (socio.categoria === 'Onorario') {
    return 'in_regola';
  }
  const haPagatoAnno = socio.quote?.some(q => q.anno === anno);
  if (haPagatoAnno) {
    return 'in_regola';
  }
  const haPagatoAnnoPrecedente = socio.quote?.some(q => q.anno === anno - 1);
  if (haPagatoAnnoPrecedente) {
    return 'da_rinnovare';
  }
  return 'scaduta';
}

export function generaNumeroTessera(soci: Socio[], anno: number): string {
  const annoStr = anno.toString();
  const prefisso = `PL-${annoStr}-`;
  
  const numeri = soci
    .map(s => {
      if (s.numeroTessera && s.numeroTessera.startsWith(prefisso)) {
        const numPart = parseInt(s.numeroTessera.replace(prefisso, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      }
      // Se il numero tessera ha un formato diverso (es. anno precedente)
      const matches = s.numeroTessera?.match(/\d+$/);
      return matches ? parseInt(matches[0], 10) : 0;
    })
    .filter(n => n > 0);

  const maxNum = numeri.length > 0 ? Math.max(...numeri) : 0;
  const nextNum = maxNum + 1;
  return `${prefisso}${nextNum.toString().padStart(3, '0')}`;
}

export function generaNumeroRicevuta(soci: Socio[], anno: number): string {
  const allQuote = soci.flatMap(s => s.quote || []).filter(q => q.anno === anno);
  const prefisso = `REC-${anno}/`;
  const numeri = allQuote
    .map(q => {
      if (q.ricevutaNumero && q.ricevutaNumero.startsWith(prefisso)) {
        const n = parseInt(q.ricevutaNumero.replace(prefisso, ''), 10);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    })
    .filter(n => n > 0);

  const maxNum = numeri.length > 0 ? Math.max(...numeri) : 0;
  const nextNum = maxNum + 1;
  return `${prefisso}${nextNum.toString().padStart(3, '0')}`;
}

export function esportaLibroSociCSV(soci: Socio[], annoCorrente: number): void {
  const intestazioni = [
    'Numero Tessera',
    'Cognome',
    'Nome',
    'Codice Fiscale',
    'Data di Nascita',
    'Luogo di Nascita',
    'Indirizzo',
    'Città',
    'Provincia',
    'CAP',
    'Telefono',
    'Email',
    'Categoria Socio',
    'Ruolo Direttivo',
    'Data Prima Iscrizione',
    `Stato Quota ${annoCorrente}`,
    `Ultima Quota Pagata (Anno)`,
    'Stato Socio'
  ];

  const sociAttivi = soci.filter(s => !s.dataCancellazione);
  const righe = sociAttivi.map(s => {
    const statoQuota = getStatoQuotaSocio(s, annoCorrente);
    const ultimaQuota = s.quote?.length > 0 ? [...s.quote].sort((a, b) => b.anno - a.anno)[0].anno : 'Nessuna';
    return [
      `"${s.numeroTessera || ''}"`,
      `"${s.cognome || ''}"`,
      `"${s.nome || ''}"`,
      `"${s.codiceFiscale || ''}"`,
      `"${s.dataNascita || ''}"`,
      `"${s.luogoNascita || ''}"`,
      `"${s.indirizzo || ''}"`,
      `"${s.citta || ''}"`,
      `"${s.provincia || ''}"`,
      `"${s.cap || ''}"`,
      `"${s.telefono || ''}"`,
      `"${s.email || ''}"`,
      `"${s.categoria || ''}"`,
      `"${s.ruoloDirettivo || ''}"`,
      `"${s.dataIscrizione || ''}"`,
      `"${statoQuota === 'in_regola' ? 'IN REGOLA' : statoQuota === 'da_rinnovare' ? 'DA RINNOVARE' : 'SCADUTA'}"`,
      `"${ultimaQuota}"`,
      `"${s.attivo ? 'Attivo' : 'Non Attivo'}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Libro_Soci_ProLoco_${annoCorrente}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function loadEventi(): ProLocoEvento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTI);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_EVENTI, JSON.stringify(INITIAL_EVENTI));
      return INITIAL_EVENTI;
    }
    const parsed: ProLocoEvento[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_EVENTI, JSON.stringify(INITIAL_EVENTI));
      return INITIAL_EVENTI;
    }
    if (parsed.length === 0) {
      return [];
    }

    // Assicuriamo che ogni evento abbia le voci di costo e stand compilati
    const arricchiti = parsed.map(e => {
      // Stand numerati dell'evento: garantiamo che ciascuno abbia i campi economici
      let stands = e.standNumerati && e.standNumerati.length > 0 ? e.standNumerati : STAND_SIMULATI_DEFAULT;

      // Se gli stand non hanno ancora spesaPreventivo / spesaConsuntivo, li arricchiamo con fallback
      stands = stands.map((s, idx) => {
        const defaultStand = STAND_SIMULATI_DEFAULT[idx] || STAND_SIMULATI_DEFAULT.find(d => d.numero === s.numero);
        const rawTurni = Array.isArray(s.turniAssegnazioni) && s.turniAssegnazioni.length > 0
          ? s.turniAssegnazioni
          : (defaultStand?.turniAssegnazioni || []);
        const turniNormalizzati = rawTurni.map(t => {
          const nome = t.nomeVolontario || t.nominativo || 'Volontario';
          const spec = t.orarioSpecifico || (t.orarioInizio && t.orarioFine ? `${t.orarioInizio} - ${t.orarioFine}` : '18:30 - 23:30');
          return {
            ...t,
            nomeVolontario: nome,
            nominativo: nome,
            orarioSpecifico: spec,
            orarioInizio: t.orarioInizio || spec.split(' - ')[0] || '18:30',
            orarioFine: t.orarioFine || spec.split(' - ')[1] || '23:30'
          };
        });
        return {
          ...s,
          orarioAperturaStand: s.orarioAperturaStand ?? defaultStand?.orarioAperturaStand ?? '18:30 - 23:30',
          volontariRichiesti: s.volontariRichiesti ?? defaultStand?.volontariRichiesti ?? 2,
          turniAssegnazioni: turniNormalizzati,
          spesaPreventivo: s.spesaPreventivo ?? defaultStand?.spesaPreventivo ?? 0,
          spesaConsuntivo: s.spesaConsuntivo ?? defaultStand?.spesaConsuntivo ?? 0,
          incassoPrevisto: s.incassoPrevisto ?? defaultStand?.incassoPrevisto ?? (s.incassoStimato || 0),
          incassoConsuntivo: s.incassoConsuntivo ?? defaultStand?.incassoConsuntivo ?? (s.incassoStimato || 0),
        };
      });

      // Se il titolo conteneva vecchie denominazioni simulate, convertiamo in denominazioni effettive
      let titolo = e.titolo;
      if (titolo.includes('Simulazione: Modello 1') || titolo === '1. Sagra del Borgo Antico (Evento Nativo)') {
        titolo = '1. Sagra del Borgo Antico (Evento Nativo 100% Pro Loco)';
      } else if (titolo.includes('Simulazione: Modello 2') || titolo === '2. Sagra del Borgo Antico (Evento Ibrido)') {
        titolo = '2. Fiera d\'Autunno & Notte Bianca (Evento Ibrido con Partner)';
      } else if (titolo.includes('Simulazione: Modello 3') || titolo === '3. Sagra del Borgo Antico (Evento Gestione)') {
        titolo = '3. Festival Patronale & Estate nel Borgo (Gestione Conto Terzi Comune)';
      }

      const spesePrev = e.spesePreventivo || {
        food: Math.round((e.budgetPrevisto || 0) * 0.45),
        intrattenimento: Math.round((e.budgetPrevisto || 0) * 0.25),
        altreSpese: Math.round((e.budgetPrevisto || 0) * 0.20),
        varie: Math.round((e.budgetPrevisto || 0) * 0.10)
      };

      const speseCons = e.speseConsuntivo || {
        food: Math.round((e.costiSostenuti || 0) * 0.50),
        intrattenimento: Math.round((e.costiSostenuti || 0) * 0.25),
        altreSpese: Math.round((e.costiSostenuti || 0) * 0.15),
        varie: Math.round((e.costiSostenuti || 0) * 0.10)
      };

      const totPrev = (spesePrev.food || 0) + (spesePrev.intrattenimento || 0) + (spesePrev.altreSpese || 0) + (spesePrev.varie || 0);
      const totCons = (speseCons.food || 0) + (speseCons.intrattenimento || 0) + (speseCons.altreSpese || 0) + (speseCons.varie || 0);

      return {
        ...e,
        titolo,
        standNumerati: stands,
        tipoEvento: e.tipoEvento || 'nativo',
        partnerIbridoNome: e.partnerIbridoNome,
        percentualeSpeseProLoco: e.percentualeSpeseProLoco ?? 50,
        percentualeEntrateProLoco: e.percentualeEntrateProLoco ?? 50,
        contributoPartner: e.contributoPartner ?? 0,
        committenteNome: e.committenteNome,
        tipoAccordoGestione: e.tipoAccordoGestione ?? 'compenso_forfettario',
        compensoGestione: e.compensoGestione ?? 0,
        rimborsoSpeseCommittente: e.rimborsoSpeseCommittente ?? 0,
        spesePreventivo: spesePrev,
        speseConsuntivo: speseCons,
        budgetPrevisto: totPrev > 0 ? totPrev : (e.budgetPrevisto || 0),
        costiSostenuti: totCons > 0 ? totCons : (e.costiSostenuti || 0),
        entratePreviste: e.entratePreviste ?? e.budgetPrevisto,
        iscrizioni: Array.isArray(e.iscrizioni) && e.iscrizioni.length > 0 
          ? e.iscrizioni 
          : (INITIAL_EVENTI.find(init => init.id === e.id)?.iscrizioni || []),
        iscrizioniAperte: e.iscrizioniAperte !== undefined ? e.iscrizioniAperte : true,
        postiMassimi: e.postiMassimi || 60,
        quotaIscrizioneSocio: e.quotaIscrizioneSocio ?? 0
      };
    });

    return arricchiti;
  } catch (err) {
    console.error('Errore nel caricamento degli eventi:', err);
    return INITIAL_EVENTI;
  }
}

export function ripristinaEventiSimulati(): ProLocoEvento[] {
  try {
    saveEventi(INITIAL_EVENTI);
    return INITIAL_EVENTI;
  } catch (err) {
    console.error('Errore nel ripristino degli eventi simulati:', err);
    return INITIAL_EVENTI;
  }
}

export function saveEventi(eventi: ProLocoEvento[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTI, JSON.stringify(eventi));
    syncDatabaseToServer({ eventi });
  } catch (err) {
    console.error('Errore nel salvataggio degli eventi:', err);
  }
}

export function esportaEventiCSV(eventi: ProLocoEvento[], anno?: number): void {
  const intestazioni = [
    'ID Evento',
    'Titolo Evento',
    'Tipologia Evento',
    'Categoria',
    'Data Inizio',
    'Ora Inizio',
    'Data Fine',
    'Ora Fine',
    'Luogo',
    'Stato',
    'Ente Partner / Committente',
    'Prev. Food (€)',
    'Prev. Intrattenimento (€)',
    'Prev. Altre Spese (€)',
    'Prev. Varie (€)',
    'Totale Preventivo Costi (€)',
    'Cons. Food (€)',
    'Cons. Intrattenimento (€)',
    'Cons. Altre Spese (€)',
    'Cons. Varie (€)',
    'Totale Costi Consuntivati (€)',
    'Differenza Scostamento Costi (€)',
    'Entrate Previste (€)',
    'Entrate Realizzate (€)',
    'Risultato Netto Manifestazione (€)',
    'Costi Competenza Pro Loco (€)',
    'Entrate Competenza Pro Loco (€)',
    'Margine Netto Bilancio Pro Loco (€)',
    'Partecipanti Stimati',
    'Permesso Comune',
    'Licenza SIAE',
    'Piano Sicurezza Safety',
    'Notifica ASL HACCP',
    'Volontari Coinvolti (N°)'
  ];

  const filtrati = anno ? eventi.filter(e => e.dataInizio.startsWith(anno.toString())) : eventi;

  const righe = filtrati.map(e => {
    const econ = calcolaEconomiaEvento(e);
    const tipo = econ.tipo;
    const etichettaTipo = tipo === 'nativo' ? '1. Nativo (100% Pro Loco)' : tipo === 'ibrido' ? '2. Ibrido (Co-organizzato)' : '3. Gestione (Conto Terzi)';
    const partnerOCommittente = tipo === 'ibrido' ? (e.partnerIbridoNome || 'Partner') : tipo === 'gestione' ? (e.committenteNome || 'Committente') : 'Pro Loco Diretta';

    const prevFood = econ.foodPrev;
    const prevIntr = econ.intrattenimentoPrev;
    const prevAltre = econ.altreSpesePrev;
    const prevVarie = econ.variePrev;
    const totPrev = econ.costiTotaliPreventivo;

    const consFood = econ.food;
    const consIntr = econ.intrattenimento;
    const consAltre = econ.altreSpese;
    const consVarie = econ.varie;
    const totCons = econ.costiTotaliConsuntivo;

    const deltaCosti = totCons - totPrev;
    const margine = econ.avanzoDisavanzoConsuntivo;

    const costiProLoco = econ.costiProLocoConsuntivo;
    const entrateProLoco = econ.entrateProLocoRealizzate;
    const margineProLoco = econ.margineNettoProLoco;

    return [
      `"${e.id}"`,
      `"${e.titolo.replace(/"/g, '""')}"`,
      `"${etichettaTipo}"`,
      `"${e.categoria}"`,
      `"${e.dataInizio}"`,
      `"${e.oraInizio || ''}"`,
      `"${e.dataFine}"`,
      `"${e.oraFine || ''}"`,
      `"${e.luogo.replace(/"/g, '""')}"`,
      `"${e.stato.toUpperCase()}"`,
      `"${partnerOCommittente.replace(/"/g, '""')}"`,
      `"${prevFood}"`,
      `"${prevIntr}"`,
      `"${prevAltre}"`,
      `"${prevVarie}"`,
      `"${totPrev}"`,
      `"${consFood}"`,
      `"${consIntr}"`,
      `"${consAltre}"`,
      `"${consVarie}"`,
      `"${totCons}"`,
      `"${deltaCosti}"`,
      `"${econ.entrateTotaliPreviste}"`,
      `"${econ.entrateTotaliRealizzate}"`,
      `"${margine}"`,
      `"${costiProLoco}"`,
      `"${entrateProLoco}"`,
      `"${margineProLoco}"`,
      `"${e.partecipantiStimati || 0}"`,
      `"${e.permessoComunale ? 'SI' : 'NO'}"`,
      `"${e.licenzaSIAE ? 'SI' : 'NO'}"`,
      `"${e.pianoSicurezzaSafety ? 'SI' : 'NO'}"`,
      `"${e.aslHaccp ? 'SI' : 'NO'}"`,
      `"${econ.volontariUniciIds.length}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Calendario_Eventi_ProLoco_${anno || 'completo'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaStandEventoCSV(evento: ProLocoEvento, stands: StandEvento[]): void {
  const intestazioni = [
    'Numero Stand',
    'Denominazione Stand',
    'Tipologia Merceologica',
    'Circuito Ristorazione (Food & Beverage)',
    'Responsabile Stand',
    'Spesa Preventivo (€)',
    'Spesa Consuntivo (€)',
    'Differenza Spesa (€)',
    'Incasso Previsto (€)',
    'Incasso Consuntivo (€)',
    'Differenza Incasso (€)',
    'Margine Netto Previsto (€)',
    'Margine Netto Consuntivo (€)',
    'Scostamento Margine Netto (€)',
    'Manifestazione di Riferimento',
    'Data Manifestazione'
  ];

  const righe = stands.map(s => {
    const spP = Number(s.spesaPreventivo) || 0;
    const spC = Number(s.spesaConsuntivo) || 0;
    const diffS = spC - spP;
    const inP = Number(s.incassoPrevisto) || Number(s.incassoStimato) || 0;
    const inC = Number(s.incassoConsuntivo) || Number(s.incassoStimato) || 0;
    const diffI = inC - inP;
    const mP = inP - spP;
    const mC = inC - spC;
    const diffM = mC - mP;

    return [
      `"#${s.numero}"`,
      `"${(s.nome || '').replace(/"/g, '""')}"`,
      `"${(s.tipologia || '').replace(/"/g, '""')}"`,
      `"${s.riferimentoFood ? 'SI (Food & Beverage)' : 'NO (Servizi / No-Food)'}"`,
      `"${(s.responsabile || '').replace(/"/g, '""')}"`,
      `"${spP}"`,
      `"${spC}"`,
      `"${diffS}"`,
      `"${inP}"`,
      `"${inC}"`,
      `"${diffI}"`,
      `"${mP}"`,
      `"${mC}"`,
      `"${diffM}"`,
      `"${(evento.titolo || '').replace(/"/g, '""')}"`,
      `"${evento.dataInizio || ''}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Macro_Stand_${(evento.titolo || 'Evento').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaTurniStandCSV(evento: ProLocoEvento, stands?: StandEvento[]): void {
  const listaStands = stands && stands.length > 0
    ? stands
    : (evento.standNumerati && evento.standNumerati.length > 0 ? evento.standNumerati : STAND_SIMULATI_DEFAULT);
  const intestazioni = [
    'Evento',
    'Data Evento',
    'N° Stand',
    'Denominazione Stand',
    'Tipologia Stand',
    'Referente Stand',
    'Orario Apertura Stand',
    'Volontario Assegnato',
    'N° Tessera Socio',
    'Telefono',
    'Mansione nello Stand',
    'Fascia Oraria Turno',
    'Orario Inizio Turno',
    'Orario Fine Turno',
    'Stato Disponibilità',
    'Note Operative'
  ];

  const righe: string[] = [];

  listaStands.forEach(s => {
    const turni = s.turniAssegnazioni || [];
    if (turni.length === 0) {
      righe.push([
        `"${(evento.titolo || '').replace(/"/g, '""')}"`,
        `"${evento.dataInizio || ''}"`,
        `"#${s.numero}"`,
        `"${(s.nome || '').replace(/"/g, '""')}"`,
        `"${(s.tipologia || '').replace(/"/g, '""')}"`,
        `"${(s.responsabile || '').replace(/"/g, '""')}"`,
        `"${(s.orarioAperturaStand || '').replace(/"/g, '""')}"`,
        `"Nessun volontario assegnato"`,
        `"-"`,
        `"-"`,
        `"-"`,
        `"-"`,
        `"-"`,
        `"-"`,
        `"DA COPRIRE"`,
        `""`
      ].join(';'));
    } else {
      turni.forEach(t => {
        const nome = t.nomeVolontario || t.nominativo || '';
        righe.push([
          `"${(evento.titolo || '').replace(/"/g, '""')}"`,
          `"${t.dataTurno || evento.dataInizio || ''}"`,
          `"#${s.numero}"`,
          `"${(s.nome || '').replace(/"/g, '""')}"`,
          `"${(s.tipologia || '').replace(/"/g, '""')}"`,
          `"${(s.responsabile || '').replace(/"/g, '""')}"`,
          `"${(s.orarioAperturaStand || '').replace(/"/g, '""')}"`,
          `"${nome.replace(/"/g, '""')}"`,
          `"${t.numeroTessera || '-'}"`,
          `"${t.telefono || '-'}"`,
          `"${(t.mansione || '').replace(/"/g, '""')}"`,
          `"${(t.fasciaOraria || '').replace(/"/g, '""')}"`,
          `"${t.orarioInizio || t.orarioSpecifico || ''}"`,
          `"${t.orarioFine || ''}"`,
          `"${t.confermato ? 'CONFERMATO' : 'IN ATTESA'}"`,
          `"${(t.note || '').replace(/"/g, '""')}"`
        ].join(';'));
      });
    }
  });

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Turni_Assegnazioni_Stand_${(evento.titolo || 'Evento').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaPresenzeCSV(evento: ProLocoEvento, soci: Socio[]): void {
  const sociMap = new Map<string, Socio>();
  soci.forEach(s => sociMap.set(s.id, s));

  const intestazioni = [
    'ID Iscrizione',
    'Evento Titolo',
    'Data Evento',
    'Numero Tessera Socio',
    'Cognome Socio',
    'Nome Socio',
    'Codice Fiscale',
    'Categoria Socio',
    'Ruolo Partecipazione',
    'Data Iscrizione',
    'Ora Iscrizione',
    'Stato Presenza',
    'Orario Check-In',
    'Check-In Registrato Da',
    'Numero Accompagnatori',
    'Quota Versata (€)',
    'Note / Preferenze'
  ];

  const iscrizioni = evento.iscrizioni || [];
  const righe = iscrizioni.map(iscr => {
    const s = sociMap.get(iscr.socioId);
    return [
      `"${iscr.id}"`,
      `"${(evento.titolo || '').replace(/"/g, '""')}"`,
      `"${evento.dataInizio || ''}"`,
      `"${s?.numeroTessera || ''}"`,
      `"${(s?.cognome || '').replace(/"/g, '""')}"`,
      `"${(s?.nome || '').replace(/"/g, '""')}"`,
      `"${s?.codiceFiscale || ''}"`,
      `"${s?.categoria || ''}"`,
      `"${iscr.ruolo}"`,
      `"${iscr.dataIscrizione}"`,
      `"${iscr.oraIscrizione || ''}"`,
      `"${(iscr.statoPresenza || 'da_verificare').toUpperCase()}"`,
      `"${iscr.orarioCheckIn || ''}"`,
      `"${(iscr.checkInRegistratoDa || '').replace(/"/g, '""')}"`,
      `"${iscr.numeroAccompagnatori || 0}"`,
      `"${iscr.quotaVersata || 0}"`,
      `"${(iscr.note || '').replace(/"/g, '""')}"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Registro_Presenze_${(evento.titolo || 'Evento').replace(/[^a-zA-Z0-9]/g, '_')}_${evento.dataInizio}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function loadDonazioni(): DonazioneTerzi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DONAZIONI);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_DONAZIONI, JSON.stringify(INITIAL_DONAZIONI));
      return INITIAL_DONAZIONI;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_DONAZIONI, JSON.stringify(INITIAL_DONAZIONI));
      return INITIAL_DONAZIONI;
    }
    return parsed;
  } catch (err) {
    console.error('Errore nel caricamento delle donazioni:', err);
    return INITIAL_DONAZIONI;
  }
}

export function saveDonazioni(donazioni: DonazioneTerzi[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DONAZIONI, JSON.stringify(donazioni));
    syncDatabaseToServer({ donazioni });
  } catch (err) {
    console.error('Errore nel salvataggio delle donazioni:', err);
  }
}

export function loadCampagneFondi(): CampagnaRaccoltaFondi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAGNE_DONAZIONI);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_CAMPAGNE_DONAZIONI, JSON.stringify(INITIAL_CAMPAGNE_FONDI));
      return INITIAL_CAMPAGNE_FONDI;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_CAMPAGNE_DONAZIONI, JSON.stringify(INITIAL_CAMPAGNE_FONDI));
      return INITIAL_CAMPAGNE_FONDI;
    }
    return parsed;
  } catch (err) {
    console.error('Errore nel caricamento delle campagne fondi:', err);
    return INITIAL_CAMPAGNE_FONDI;
  }
}

export function saveCampagneFondi(campagne: CampagnaRaccoltaFondi[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CAMPAGNE_DONAZIONI, JSON.stringify(campagne));
    syncDatabaseToServer({ campagne });
  } catch (err) {
    console.error('Errore nel salvataggio delle campagne fondi:', err);
  }
}

// =====================================================================
// CESTINO DI SISTEMA & REGISTRO AUDIT STORICO (PUNTO 1.4 E GENERALI)
// =====================================================================

export function loadCestino(): ElementoCestino[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CESTINO);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Errore nel caricamento del cestino di sistema:', err);
    return [];
  }
}

export function saveCestino(elementi: ElementoCestino[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CESTINO, JSON.stringify(elementi));
    syncDatabaseToServer({ cestino: elementi });
  } catch (err) {
    console.error('Errore nel salvataggio del cestino di sistema:', err);
  }
}

export function aggiungiAlCestino(elemento: ElementoCestino): void {
  try {
    const attuali = loadCestino();
    const filtrati = attuali.filter(e => e.id !== elemento.id);
    const aggiornati = [elemento, ...filtrati];
    saveCestino(aggiornati);
  } catch (err) {
    console.error('Errore aggiunta elemento al cestino:', err);
  }
}

export function rimuoviDalCestino(id: string): void {
  try {
    const attuali = loadCestino();
    const aggiornati = attuali.filter(e => e.id !== id);
    saveCestino(aggiornati);
  } catch (err) {
    console.error('Errore rimozione elemento dal cestino:', err);
  }
}

export function svuotaCestino(): void {
  try {
    saveCestino([]);
  } catch (err) {
    console.error('Errore svuotamento cestino:', err);
  }
}

export function esportaCestinoCSV(elementi: ElementoCestino[], config?: ProLocoInfo): void {
  const intestazioni = [
    'ID Cestino',
    'ID Originale Entita',
    'Tipologia Entita',
    'Descrizione / Intestazione',
    'Dettagli Aggiuntivi',
    'Importo Originale (€)',
    'Stato Fiscale & Contabile',
    'Data Eliminazione / Revoca',
    'Ora Eliminazione',
    'Motivazione Formale / Ripensamento Donante',
    'Operatore / Registrato Da'
  ];

  const righe = elementi.map(item => [
    `"${item.id}"`,
    `"${item.entitaId}"`,
    `"${item.tipoEntita.toUpperCase()}"`,
    `"${(item.titolo || '').replace(/"/g, '""')}"`,
    `"${(item.sottotitolo || '').replace(/"/g, '""')}"`,
    `"${item.importo !== undefined ? item.importo.toFixed(2) : ''}"`,
    `"ESCLUSO DA OGNI BILANCIO E STATISTICA (AUDIT LOG)"`,
    `"${item.dataEliminazione}"`,
    `"${item.oraEliminazione || ''}"`,
    `"${(item.motivo || '').replace(/"/g, '""')}"`,
    `"${(item.eliminatoDa || 'Tesoreria / Amministrazione').replace(/"/g, '""')}"`
  ].join(';'));

  const prefisso = config ? `PRO LOCO ${config.nome.toUpperCase()} - REGISTRO AUDIT STORICO REVOCHE E CESTINO DI SISTEMA\r\nData estrazione: ${new Date().toLocaleDateString('it-IT')}\r\n\r\n` : '';
  const csvContent = '\uFEFF' + prefisso + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Registro_Audit_Cestino_Revoche_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaDonazioniCSV(donazioni: DonazioneTerzi[], anno?: number): void {
  const intestazioni = [
    'N. Ricevuta / Protocollo',
    'Data Ricezione',
    'Esercizio Finanziario',
    'Soggetto Erogatore (Donatore)',
    'Tipologia Soggetto',
    'Codice Fiscale / Partita IVA',
    'Indirizzo / Sede',
    'Comune / CAP',
    'Email Contatto',
    'Importo Erogazione (€)',
    'Natura Erogazione',
    'Causale Fiscale',
    'Destinazione Statutaria / Progetto',
    'Modalità di Pagamento',
    'Estremi Tracciabilità Bancaria (CRO/TRN)',
    'Delibera Consiglio Direttivo',
    'Detraibilità Fiscale Art. 83 CTS',
    'Note Amministrative'
  ];

  const donazioniAttive = donazioni.filter(d => d.stato !== 'annullata_ripensamento');
  const filtrati = anno ? donazioniAttive.filter(d => d.anno === anno) : donazioniAttive;

  const righe = filtrati.map(d => [
    `"${d.ricevutaNumero}"`,
    `"${d.data}"`,
    `"${d.anno}"`,
    `"${d.donatore.replace(/"/g, '""')}"`,
    `"${d.tipoDonatore.toUpperCase()}"`,
    `"${d.codiceFiscalePartitaIva || ''}"`,
    `"${(d.indirizzoDonatore || '').replace(/"/g, '""')}"`,
    `"${((d.capDonatore ? d.capDonatore + ' ' : '') + (d.cittaDonatore || '')).replace(/"/g, '""')}"`,
    `"${(d.emailDonatore || '').replace(/"/g, '""')}"`,
    `"${d.importo.toFixed(2)}"`,
    `"${(d.tipoErogazione || 'erogazione_liberale_denaro').replace(/_/g, ' ').toUpperCase()}"`,
    `"${d.causale.replace(/"/g, '""')}"`,
    `"${(d.destinazione || 'Attività Statutarie Generali').replace(/"/g, '""')}"`,
    `"${d.metodo}"`,
    `"${(d.estremiTracciabilita || '').replace(/"/g, '""')}"`,
    `"${(d.deliberaConsiglio || '').replace(/"/g, '""')}"`,
    `"${d.detraibileFiscale ? 'SI (Detraibile 30% IRPEF / Deducibile IRES ex Art. 83 CTS)' : 'NO (Ordinaria non tracciata)'}"`,
    `"${(d.note || '').replace(/"/g, '""')}"`
  ].join(';'));

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Registro_Donazioni_Terzi_ProLoco_${anno || 'Globale'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaAdE730CSV(donazioni: DonazioneTerzi[], anno: number, config: ProLocoInfo): void {
  // Specifiche tracciato comunicazione erogazioni liberali DM MEF 3/2/2021 per Modello 730 Precompilato
  const intestazioni = [
    'Codice Fiscale Ente Ricevente',
    'Denominazione Ente (Pro Loco)',
    'Anno Fiscale di Riferimento',
    'Codice Fiscale Donatore (Persona Fisica)',
    'Cognome e Nome / Denominazione Donatore',
    'Data Erogazione (AAAA-MM-GG)',
    'Importo Erogazione Liberale (€)',
    'Mezzo di Pagamento Tracciabile (1=Bonifico, 2=POS/Carta, 3=Altro tracciabile)',
    'Opposizione all\'utilizzo dei dati per 730 Precompilato (0=No, 1=Si)',
    'Riferimento Ricevuta / Protocollo',
    'Tipologia Detrazione (30% IRPEF ex Art. 83 CTS)'
  ];

  // Solo donazioni dell'anno con metodo tracciabile da privati cittadini con CF e NON ANNULLATE
  const idonei = donazioni.filter(d => 
    d.anno === anno && 
    d.tipoDonatore === 'privato' && 
    d.metodo !== 'Contanti' &&
    d.detraibileFiscale !== false &&
    d.stato !== 'annullata_ripensamento' &&
    d.codiceFiscalePartitaIva &&
    d.codiceFiscalePartitaIva.trim().length === 16
  );

  const righe = idonei.map(d => {
    const codMetodo = d.metodo === 'Bonifico Bancario' ? '1' : d.metodo === 'POS / Carta' ? '2' : '3';
    const opposizione = d.opposizione730 ? '1' : '0';
    return [
      `"${config.codiceFiscale}"`,
      `"${config.nome.replace(/"/g, '""')}"`,
      `"${anno}"`,
      `"${d.codiceFiscalePartitaIva?.trim().toUpperCase()}"`,
      `"${d.donatore.replace(/"/g, '""')}"`,
      `"${d.data}"`,
      `"${d.importo.toFixed(2)}"`,
      `"${codMetodo}"`,
      `"${opposizione}"`,
      `"${d.ricevutaNumero}"`,
      `"Art. 83 c.1 D.Lgs. 117/2017"`
    ].join(';');
  });

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Prospetto_AdE_730_Precompilato_Erogazioni_${config.codiceFiscale}_${anno}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaTrasparenzaL124CSV(donazioni: DonazioneTerzi[], anno: number, config: ProLocoInfo): void {
  // Prospetto Obblighi di Trasparenza e Pubblicità ex Legge 124/2017 (> 10.000 €)
  const intestazioni = [
    'Soggetto Ricevente (Denominazione)',
    'Codice Fiscale Ricevente',
    'Soggetto Erogatore (Denominazione / Ragione Sociale)',
    'Codice Fiscale / P.IVA Erogatore',
    'Somma Incassata (€)',
    'Data di Incasso (AAAA-MM-GG)',
    'Causale Fiscale / Tipologia Contributo o Liberalità',
    'Elemento Giustificativo / Delibera C.D.'
  ];

  const donazioniAnno = donazioni.filter(d => d.anno === anno && d.stato !== 'annullata_ripensamento');
  const righe = donazioniAnno.map(d => [
    `"${config.nome.replace(/"/g, '""')}"`,
    `"${config.codiceFiscale}"`,
    `"${d.donatore.replace(/"/g, '""')}"`,
    `"${d.codiceFiscalePartitaIva || 'N/D'}"`,
    `"${d.importo.toFixed(2)}"`,
    `"${d.data}"`,
    `"${(d.causale || 'Erogazione liberale').replace(/"/g, '""')}"`,
    `"${(d.deliberaConsiglio || `Ricevuta n. ${d.ricevutaNumero}`).replace(/"/g, '""')}"`
  ].join(';'));

  const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Prospetto_Trasparenza_L124_Erogazioni_${anno}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function esportaBilancioCompletoCSV(
  soci: Socio[], 
  eventi: ProLocoEvento[], 
  config: ProLocoInfo, 
  anno?: number,
  donazioni?: DonazioneTerzi[]
): void {
  const annoRif = anno || config.annoCorrente;
  const annoFiltro = anno && anno !== 0 ? anno : null;

  // Filtro quote dell'anno (escludendo soci cancellati)
  const sociAttivi = soci.filter(s => !s.dataCancellazione);
  const tutteQuote = sociAttivi.flatMap(s => s.quote || []);
  const quoteAnno = annoFiltro 
    ? tutteQuote.filter(q => q.anno === annoFiltro)
    : tutteQuote;
  
  const totaleQuote = quoteAnno.reduce((sum, q) => sum + (q.importo || 0), 0);

  // Donazioni da terzi (escludendo categoricamente donazioni annullate per ripensamento donante)
  const donazioniTotali = (donazioni || loadDonazioni()).filter(d => d.stato !== 'annullata_ripensamento');
  const donazioniAnno = annoFiltro
    ? donazioniTotali.filter(d => d.anno === annoFiltro)
    : donazioniTotali;
  const totaleDonazioni = donazioniAnno.reduce((sum, d) => sum + (d.importo || 0), 0);

  // Filtro eventi dell'anno
  const eventiAnno = annoFiltro
    ? eventi.filter(e => e.dataInizio.startsWith(annoFiltro.toString()))
    : eventi;

  const aggregatoEventi = aggregaEventiPerBilancio(eventiAnno);
  const totaleEntrateEventi = aggregatoEventi.entrateCompetenzaProLoco;
  const totaleCostiEventi = aggregatoEventi.costiCompetenzaProLoco;
  const totaleEntrateGenerali = totaleQuote + totaleEntrateEventi + totaleDonazioni;
  const totaleUsciteGenerali = totaleCostiEventi;
  const avanzoGestione = totaleEntrateGenerali - totaleUsciteGenerali;

  const righeCsv: string[] = [
    `"PRO LOCO ${config.nome.toUpperCase()}"`,
    `"RENDICONTO ECONOMICO FINANZIARIO GENERALE - ESERCIZIO ${annoFiltro || 'STORICO COMPLESSIVO'}"`,
    `"C.F.: ${config.codiceFiscale} - COMUNE: ${config.comune} (${config.provincia})"`,
    `"Data estrazione database: ${new Date().toLocaleDateString('it-IT')}"`,
    '""',
    '"QUADRO SINTETICO DI BILANCIO"',
    `"Voce";"Importo (€)"`,
    `"Entrate Totali da Tesseramento (Quote Sociali)";"${totaleQuote.toFixed(2)}"`,
    `"Entrate Totali da Eventi & Manifestazioni";"${totaleEntrateEventi.toFixed(2)}"`,
    `"Donazioni ed Erogazioni Liberali da Terzi";"${totaleDonazioni.toFixed(2)}"`,
    `"TOTALE GENERALE ENTRATE PRO LOCO";"${totaleEntrateGenerali.toFixed(2)}"`,
    `"TOTALE GENERALE USCITE & COSTI PRO LOCO";"${totaleUsciteGenerali.toFixed(2)}"`,
    `"RISULTATO ECONOMICO (AVANZO/DISAVANZO DI GESTIONE)";"${avanzoGestione.toFixed(2)}"`,
    '""',
    '"DETTAGLIO TESSERAMENTI & QUOTE ASSOCIATIVE"',
    `"ID Ricevuta";"Numero Tessera";"Nominativo Socio";"Categoria";"Anno";"Importo (€)";"Data Pagamento";"Data Scadenza";"Metodo"`
  ];

  // Aggiungi righe quote
  quoteAnno.forEach(q => {
    const s = soci.find(soc => soc.id === q.socioId);
    righeCsv.push([
      `"${q.ricevutaNumero || ''}"`,
      `"${s?.numeroTessera || ''}"`,
      `"${s ? `${s.cognome} ${s.nome}` : 'Socio sconosciuto'}"`,
      `"${s?.categoria || ''}"`,
      `"${q.anno}"`,
      `"${q.importo}"`,
      `"${q.dataPagamento}"`,
      `"${q.dataScadenza || `${q.anno}-12-31`}"`,
      `"${q.metodo}"`
    ].join(';'));
  });

  righeCsv.push('""');
  righeCsv.push('"DETTAGLIO EVENTI E MANIFESTAZIONI"');
  righeCsv.push(
    `"Titolo Evento";"Categoria";"Data";"Stato";"Prev. Costi (€)";"Cons. Food (€)";"Cons. Spettacolo (€)";"Cons. Altre (€)";"Cons. Varie (€)";"Totale Costi Consuntivo (€)";"Entrate Realizzate (€)";"Margine Evento (€)"`
  );

  eventiAnno.forEach(e => {
    const econ = calcolaEconomiaEvento(e);
    const consFood = econ.food;
    const consIntr = econ.intrattenimento;
    const consAltre = econ.altreSpese;
    const consVarie = econ.varie;
    const totCons = econ.costiProLocoConsuntivo;
    const entrateComp = econ.entrateProLocoRealizzate;
    const margine = econ.margineNettoProLoco;

    righeCsv.push([
      `"${e.titolo.replace(/"/g, '""')}"`,
      `"${e.categoria}"`,
      `"${e.dataInizio}"`,
      `"${e.stato.toUpperCase()}"`,
      `"${econ.costiProLocoPreventivo}"`,
      `"${consFood}"`,
      `"${consIntr}"`,
      `"${consAltre}"`,
      `"${consVarie}"`,
      `"${totCons}"`,
      `"${entrateComp}"`,
      `"${margine}"`
    ].join(';'));
  });

  righeCsv.push('""');
  righeCsv.push('"MACRO RIEPILOGO STAND NUMERATI & MODELLI DI GESTIONE ECONOMICA (NATIVO, IBRIDO, GESTIONE)"');
  righeCsv.push(
    `"Manifestazione";"Modello Economico";"N. Stand";"Stand Food";"Stand No-Food";"Prev. Spese Stand (€)";"Cons. Spese Stand (€)";"Diff. Spese (€)";"Prev. Incassi Stand (€)";"Cons. Incassi Stand (€)";"Diff. Incassi (€)";"Margine Netto Stand (€)";"Quota Spettante Pro Loco (€)"`
  );

  eventiAnno.forEach(e => {
    const stands = (e.standNumerati && e.standNumerati.length > 0) ? e.standNumerati : STAND_SIMULATI_DEFAULT;
    let spP = 0;
    let spC = 0;
    let inP = 0;
    let inC = 0;
    let fCount = 0;
    let nfCount = 0;

    stands.forEach(s => {
      spP += Number(s.spesaPreventivo) || 0;
      spC += Number(s.spesaConsuntivo) || 0;
      inP += Number(s.incassoPrevisto) || Number(s.incassoStimato) || 0;
      inC += Number(s.incassoConsuntivo) || Number(s.incassoStimato) || 0;
      if (s.riferimentoFood) fCount++;
      else nfCount++;
    });

    const diffS = spC - spP;
    const diffI = inC - inP;
    const margineStand = inC - spC;

    let modelloLabel = 'Nativo (100% Pro Loco)';
    let quotaProLoco = margineStand;
    if (e.tipoEvento === 'ibrido') {
      const perc = (e.percentualeEntrateProLoco !== undefined ? e.percentualeEntrateProLoco : 50) / 100;
      modelloLabel = `Ibrido (${e.percentualeEntrateProLoco || 50}% Pro Loco)`;
      quotaProLoco = Math.round(margineStand * perc);
    } else if (e.tipoEvento === 'gestione') {
      modelloLabel = `Gestione Conto Terzi (${e.committenteNome || 'Comune'})`;
      quotaProLoco = Number(e.compensoGestione) || 2500;
    }

    righeCsv.push([
      `"${e.titolo.replace(/"/g, '""')}"`,
      `"${modelloLabel}"`,
      `"${stands.length}"`,
      `"${fCount}"`,
      `"${nfCount}"`,
      `"${spP}"`,
      `"${spC}"`,
      `"${diffS}"`,
      `"${inP}"`,
      `"${inC}"`,
      `"${diffI}"`,
      `"${margineStand}"`,
      `"${quotaProLoco}"`
    ].join(';'));
  });

  // Aggiungi sezione Donazioni ed Erogazioni Liberali da Terzi
  righeCsv.push('""');
  righeCsv.push('"DETTAGLIO DONAZIONI ED EROGAZIONI LIBERALI DA TERZI"');
  righeCsv.push(
    `"ID Ricevuta";"Data";"Anno";"Donatore / Ente";"Tipologia";"C.F. / P.IVA";"Importo (€)";"Causale Erogazione";"Destinazione / Progetto";"Metodo Pagamento";"Detraibile Terzo Settore (Art. 83 CTS)";"Note"`
  );

  donazioniAnno.forEach(d => {
    righeCsv.push([
      `"${d.ricevutaNumero}"`,
      `"${d.data}"`,
      `"${d.anno}"`,
      `"${d.donatore.replace(/"/g, '""')}"`,
      `"${d.tipoDonatore.toUpperCase()}"`,
      `"${d.codiceFiscalePartitaIva || ''}"`,
      `"${d.importo.toFixed(2)}"`,
      `"${d.causale.replace(/"/g, '""')}"`,
      `"${(d.destinazione || 'Attività Generali').replace(/"/g, '""')}"`,
      `"${d.metodo}"`,
      `"${d.detraibileFiscale ? 'SI' : 'NO'}"`,
      `"${(d.note || '').replace(/"/g, '""')}"`
    ].join(';'));
  });

  const csvContent = '\uFEFF' + righeCsv.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bilancio_Completo_ProLoco_${annoFiltro || 'globale'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function normalizzaBackupCompat(parsed: any, fallbackConfig?: ProLocoInfo): {
  soci: Socio[];
  config: ProLocoInfo;
  eventi?: ProLocoEvento[];
  donazioni?: DonazioneTerzi[];
  campagne?: CampagnaRaccoltaFondi[];
  sitoConfig?: SitoWebConfig;
  archivioGiornalini?: EdizioneGiornalino[];
  comunicazioni?: ComunicazioneSocio[];
} | null {
  if (!parsed || typeof parsed !== 'object') return null;

  // Supporta sia array soci diretto sia struttura oggetto { soci, Membri, iscritti, ... } di vecchie versioni
  const rawSoci = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.soci)
    ? parsed.soci
    : Array.isArray(parsed.iscritti)
    ? parsed.iscritti
    : Array.isArray(parsed.membri)
    ? parsed.membri
    : null;

  if (!rawSoci) return null;

  const sociNormalizzati: Socio[] = rawSoci.map((s: any, idx: number) => ({
    ...s,
    id: s.id || `socio-compat-${idx + 1}`,
    numeroTessera: s.numeroTessera || s.tessera || `PL-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
    nome: s.nome || '',
    cognome: s.cognome || '',
    codiceFiscale: s.codiceFiscale || s.cf || '',
    pin: s.pin && String(s.pin).trim() ? String(s.pin).trim() : '1234',
    categoria: s.categoria || 'Ordinario',
    ruoloDirettivo: s.ruoloDirettivo || 'Nessuno',
    attivo: s.attivo !== undefined ? Boolean(s.attivo) : true,
    consensoPrivacy: s.consensoPrivacy !== undefined ? Boolean(s.consensoPrivacy) : true,
    quote: Array.isArray(s.quote) ? s.quote : []
  }));

  const rawCfg = parsed.configurazione || parsed.config || parsed.proLoco || parsed.ente || fallbackConfig || DEFAULT_PRO_LOCO;
  const configNormalizzata: ProLocoInfo = {
    ...DEFAULT_PRO_LOCO,
    ...(fallbackConfig || {}),
    ...(rawCfg && typeof rawCfg === 'object' ? rawCfg : {})
  };

  // Compatibilità Giornalino: supporta archivioGiornalini (nuovo) oppure giornalino / giornalinoConfig (vecchie versioni)
  let archivioNormalizzato: EdizioneGiornalino[] | undefined;
  if (Array.isArray(parsed.archivioGiornalini) && parsed.archivioGiornalini.length > 0) {
    archivioNormalizzato = parsed.archivioGiornalini.map((ed: any, idx: number) =>
      normalizzaEdizioneGiornalinoCompat(ed, idx)
    );
  } else if (parsed.giornalinoConfig || parsed.giornalino) {
    const singolo = normalizzaEdizioneGiornalinoCompat(parsed.giornalinoConfig || parsed.giornalino, 0);
    archivioNormalizzato = [singolo];
  }

  return {
    soci: sociNormalizzati,
    config: configNormalizzata,
    eventi: Array.isArray(parsed.eventi) ? parsed.eventi : undefined,
    donazioni: Array.isArray(parsed.donazioni) ? parsed.donazioni : undefined,
    campagne: Array.isArray(parsed.campagne) ? parsed.campagne : undefined,
    sitoConfig: parsed.sitoConfig || parsed.sitoWeb || undefined,
    archivioGiornalini: archivioNormalizzato,
    comunicazioni: Array.isArray(parsed.comunicazioni) ? parsed.comunicazioni : undefined
  };
}

export function esportaBackupJSON(
  soci: Socio[], 
  config: ProLocoInfo, 
  eventi?: ProLocoEvento[],
  donazioni?: DonazioneTerzi[],
  campagne?: CampagnaRaccoltaFondi[],
  sitoConfig?: SitoWebConfig,
  archivioGiornalini?: EdizioneGiornalino[],
  cestino?: ElementoCestino[],
  comunicazioni?: ComunicazioneSocio[]
): void {
  const archivio = archivioGiornalini || loadArchivioGiornalini();
  const giornalinoAttivo = loadGiornalinoConfig();
  const data = {
    versione: '4.0',
    compatibilitaVersioni: ['1.0', '2.0', '3.0', '4.0'],
    dataEsportazione: new Date().toISOString(),
    configurazione: config,
    config: config, // Chiave legacy per compatibilità con vecchie versioni
    soci: soci,
    eventi: eventi || loadEventi(),
    donazioni: donazioni || loadDonazioni(),
    campagne: campagne || loadCampagneFondi(),
    sitoConfig: sitoConfig || loadSitoWebConfig(),
    archivioGiornalini: archivio,
    giornalinoConfig: giornalinoAttivo,
    giornalino: giornalinoAttivo, // Chiave legacy per compatibilità con vecchie versioni
    giornalinoAttivoId: loadGiornalinoAttivoId(),
    cestino: cestino || loadCestino(),
    comunicazioni: comunicazioni || loadComunicazioniSoci()
  };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Backup_ProLoco_Completo_${config.annoCorrente}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getEmptySitoWebConfig(): SitoWebConfig {
  return {
    ...DEFAULT_SITO_WEB_CONFIG,
    avvisoImportante: '',
    mostraAvviso: false,
    schedeTerritorio: [],
    pubblicato: false,
    dataPubblicazione: undefined,
    blindatoVisitatori: false
  };
}

export function getEmptyGiornalinoConfig(): GiornalinoConfig {
  return {
    ...DEFAULT_GIORNALINO_CONFIG,
    id: 'ed-vuota',
    articoli: [],
    sponsor: []
  };
}

export function azzeraDatabase(): void {
  const emptySito = getEmptySitoWebConfig();
  const emptyGiornalino = getEmptyGiornalinoConfig();
  try {
    localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_EVENTI, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_DONAZIONI, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_CAMPAGNE_DONAZIONI, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_CESTINO, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_GIORNALINO_ATTIVO_ID, '');
    localStorage.setItem(STORAGE_KEY_GIORNALINO, JSON.stringify(emptyGiornalino));
    localStorage.setItem(STORAGE_KEY_SITO_WEB, JSON.stringify(emptySito));
    localStorage.removeItem(STORAGE_KEY_SESSIONE_SOCIO);
  } catch (err) {
    console.error('Errore azzeramento localStorage:', err);
  }
  resetDatabaseOnServer({
    sitoConfig: emptySito,
    giornalinoConfig: emptyGiornalino
  });
}

export function esportaCodiceSitoHTML(
  config: ProLocoInfo,
  eventi: ProLocoEvento[],
  soci: Socio[],
  sitoConfig: SitoWebConfig
): void {
  const direttivo = soci.filter(s => s.ruoloDirettivo && s.ruoloDirettivo !== 'Nessuno');
  const eventiAttivi = eventi
    .filter(e => e.stato !== 'annullato')
    .sort((a, b) => new Date(a.dataInizio).getTime() - new Date(b.dataInizio).getTime());

  const colorePrimario = sitoConfig.temaColore === 'blue' ? 'sky'
    : sitoConfig.temaColore === 'amber' ? 'amber'
    : sitoConfig.temaColore === 'rose' ? 'rose'
    : sitoConfig.temaColore === 'purple' ? 'purple'
    : 'emerald';

  const htmlContenuto = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.nome} - Sito Web Ufficiale</title>
  <meta name="description" content="${sitoConfig.sottotitoloHero || config.motto || 'Portale ufficiale della Pro Loco'}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-serif { font-family: 'Playfair Display', serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  ${sitoConfig.mostraAvviso && sitoConfig.avvisoImportante ? `
  <!-- Banner Avviso Ufficiale -->
  <div class="px-4 py-2.5 text-xs font-bold text-center border-b flex items-center justify-center gap-2 ${
    sitoConfig.tipoAvviso === 'warning' ? 'bg-amber-100 text-amber-900 border-amber-300' :
    sitoConfig.tipoAvviso === 'evento' ? 'bg-purple-100 text-purple-900 border-purple-300' :
    sitoConfig.tipoAvviso === 'info' ? 'bg-sky-100 text-sky-900 border-sky-300' :
    'bg-emerald-100 text-emerald-900 border-emerald-300'
  }">
    <span>📢</span>
    <span>${sitoConfig.avvisoImportante}</span>
  </div>` : ''}

  <!-- Intestazione Principale -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
          🏛️
        </div>
        <div>
          <h1 class="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">${config.nome}</h1>
          <p class="text-[11px] text-slate-500">${config.comune} (${config.provincia}) • Affiliata UNPLI • RUNTS APS</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${sitoConfig.abilitaEventi ? `
        <a href="#eventi" class="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition">
          Eventi
        </a>` : ''}
        ${sitoConfig.linkWhatsApp ? `
        <a href="https://wa.me/${sitoConfig.linkWhatsApp.replace(/[^0-9]/g, '')}" target="_blank" class="px-3 py-1.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 hover:bg-emerald-200 transition">
          WhatsApp
        </a>` : ''}
      </div>
    </div>
  </header>

  <!-- Hero Section con Copertina -->
  <section class="relative bg-slate-900 text-white py-20 sm:py-28 px-4 overflow-hidden">
    <img 
      src="${sitoConfig.immagineCopertina || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&auto=format&fit=crop&q=80'}" 
      alt="Copertina Borgo" 
      class="absolute inset-0 w-full h-full object-cover opacity-35"
      referrerpolicy="no-referrer"
    />
    <div class="relative max-w-4xl mx-auto text-center space-y-4">
      <span class="inline-block px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase border border-white/20">
        Associazione Turistica Pro Loco
      </span>
      <h2 class="text-3xl sm:text-5xl font-black font-serif tracking-tight leading-tight">
        ${sitoConfig.titoloHero || `Benvenuti a ${config.comune}`}
      </h2>
      <p class="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
        «${sitoConfig.sottotitoloHero || sitoConfig.mottoPersonalizzato || config.motto || 'Custodi delle tradizioni, promotori del territorio.'}»
      </p>

      ${sitoConfig.testoBenvenuto ? `
      <div class="pt-4 max-w-2xl mx-auto bg-slate-900/75 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-xs sm:text-sm text-slate-200 leading-relaxed italic">
        «${sitoConfig.testoBenvenuto}»
      </div>` : ''}

      <div class="pt-6 flex flex-wrap justify-center gap-3 text-xs">
        <div class="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
          📍 Sede: <strong>${config.indirizzo}</strong>
        </div>
        <div class="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
          📞 Tel: <strong>${config.telefono}</strong>
        </div>
        <div class="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
          ✉️ Email: <strong>${config.email}</strong>
        </div>
        <div class="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
          🕒 <strong>${sitoConfig.orariAperturaSede || 'Orari Sede: Lun-Ven 09:30-12:30'}</strong>
        </div>
      </div>
    </div>
  </section>

  ${sitoConfig.abilitaEventi ? `
  <!-- Sezione Calendario Manifestazioni -->
  <section id="eventi" class="max-w-6xl mx-auto px-4 py-16">
    <div class="text-center mb-10 space-y-2">
      <span class="text-xs font-black uppercase tracking-widest text-emerald-700">Appuntamenti della Comunità</span>
      <h3 class="text-3xl font-black text-slate-900 font-serif">Calendario Manifestazioni & Feste</h3>
      <p class="text-xs text-slate-500">Tutti gli eventi organizzati e patrocinati dalla Pro Loco</p>
    </div>
    ${eventiAttivi.length === 0 ? `
      <div class="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
        Nessun evento in programma al momento. Torna a visitarci presto!
      </div>` : `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${eventiAttivi.map(ev => `
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div class="p-5 space-y-3">
              <span class="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
                ${ev.categoria}
              </span>
              <h4 class="text-lg font-bold text-slate-900 leading-snug">${ev.titolo}</h4>
              <div class="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p>📅 <strong>Data:</strong> ${ev.dataInizio} ${ev.oraInizio ? `alle ${ev.oraInizio}` : ''}</p>
                <p>📍 <strong>Luogo:</strong> ${ev.luogo}</p>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed line-clamp-3">${ev.descrizione || ''}</p>
            </div>
          </div>
        `).join('')}
      </div>`}
  </section>` : ''}

  ${sitoConfig.abilitaTerritorio && sitoConfig.schedeTerritorio && sitoConfig.schedeTerritorio.length > 0 ? `
  <!-- Sezione Territorio & Borgo -->
  <section class="bg-slate-100/80 py-16 px-4 border-t border-b border-slate-200">
    <div class="max-w-6xl mx-auto space-y-8">
      <div class="text-center space-y-2 max-w-2xl mx-auto">
        <span class="text-xs font-black uppercase tracking-widest text-emerald-700">Guida per Visitatori & Turisti</span>
        <h3 class="text-3xl font-black text-slate-900 font-serif">${sitoConfig.titoloTerritorio || 'Territorio, Borgo & Sapori Tipici'}</h3>
        <p class="text-xs text-slate-600 leading-relaxed">${sitoConfig.testoTerritorio || 'Vivi la nostra terra attraverso i suoi monumenti, le bellezze naturalistiche e i sapori autentici.'}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${sitoConfig.schedeTerritorio.map(sch => `
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
            ${sch.immagine ? `
            <img src="${sch.immagine}" alt="${sch.titolo}" class="w-full h-44 object-cover" referrerpolicy="no-referrer" />
            ` : ''}
            <div class="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  ${sch.categoria ? sch.categoria.toUpperCase() : 'ATTRAZIONE'}
                </span>
                <h4 class="text-base font-bold text-slate-900 mt-1">${sch.titolo}</h4>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">${sch.descrizione}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>` : ''}

  ${sitoConfig.abilitaTesseramentoOnline ? `
  <!-- Sezione Invito Tesseramento -->
  <section class="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
    <div class="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-8 sm:p-12 shadow-lg space-y-4">
      <span class="px-3.5 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">Partecipazione Attiva</span>
      <h3 class="text-2xl sm:text-4xl font-black font-serif">Diventa Socio della Pro Loco</h3>
      <p class="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
        ${sitoConfig.testoInvitoTesseramento || 'Sostieni la nostra associazione, partecipa alle assemblee e agli eventi da protagonista, e usufruisci della Tessera del Socio Pro Loco UNPLI.'}
      </p>
      <div class="pt-2 flex flex-wrap justify-center gap-4 text-xs font-bold">
        <span class="bg-white/10 px-4 py-2 rounded-xl border border-white/20">Quota Ordinario: €${config.quotaStandardOrdinario || 15}</span>
        <span class="bg-white/10 px-4 py-2 rounded-xl border border-white/20">Quota Sostenitore: €${config.quotaStandardSostenitore || 30}</span>
        <span class="bg-white/10 px-4 py-2 rounded-xl border border-white/20">Quota Giovane: €${config.quotaStandardGiovane || 10}</span>
      </div>
    </div>
  </section>` : ''}

  ${sitoConfig.abilitaDirettivo && direttivo.length > 0 ? `
  <!-- Sezione Consiglio Direttivo & Trasparenza RUNTS -->
  <section class="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
    <div class="text-center mb-8 space-y-1">
      <span class="text-xs font-black uppercase tracking-widest text-emerald-700">Trasparenza Istituzionale</span>
      <h3 class="text-2xl font-black text-slate-900 font-serif">Consiglio Direttivo in Carica</h3>
      <p class="text-xs text-slate-500">Organi sociali regolarmente depositati nel Registro Unico Nazionale del Terzo Settore</p>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      ${direttivo.map(m => `
        <div class="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1 shadow-2xs">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold mx-auto flex items-center justify-center text-xs">
            ${m.nome.charAt(0)}${m.cognome.charAt(0)}
          </div>
          <h4 class="text-xs font-bold text-slate-900">${m.nome} ${m.cognome}</h4>
          <span class="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            ${m.ruoloDirettivo}
          </span>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- Footer Istituzionale -->
  <footer class="bg-white border-t border-slate-200 py-10 px-4 text-xs text-slate-500 space-y-3">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
      <div class="text-center sm:text-left space-y-1">
        <h4 class="font-bold text-slate-900 text-sm">${config.nome}</h4>
        <p>Codice Fiscale: <strong>${config.codiceFiscale}</strong> ${config.partitaIva ? `• P.IVA: ${config.partitaIva}` : ''} • Iscrizione RUNTS: ${config.numeroRunts || 'In Corso'}</p>
        <p>Presidente: <strong>${config.nomePresidente}</strong> • Sede: ${config.indirizzo}, ${config.cap} ${config.comune} (${config.provincia})</p>
      </div>
      <div class="flex items-center gap-3">
        ${sitoConfig.linkFacebook ? `<a href="${sitoConfig.linkFacebook}" target="_blank" class="p-2 bg-slate-100 rounded-xl text-slate-700 hover:text-emerald-700 transition font-bold">Facebook</a>` : ''}
        ${sitoConfig.linkInstagram ? `<a href="${sitoConfig.linkInstagram}" target="_blank" class="p-2 bg-slate-100 rounded-xl text-slate-700 hover:text-emerald-700 transition font-bold">Instagram</a>` : ''}
        ${sitoConfig.linkWhatsApp ? `<a href="https://wa.me/${sitoConfig.linkWhatsApp.replace(/[^0-9]/g, '')}" target="_blank" class="p-2 bg-emerald-50 rounded-xl text-emerald-800 font-bold border border-emerald-200">WhatsApp</a>` : ''}
      </div>
    </div>
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
      <span>Affiliata UNPLI Unione Nazionale Pro Loco d'Italia ${config.codiceUnpli ? `(${config.codiceUnpli})` : ''}</span>
      <span>Generato tramite Gestionale Pro Loco con Editor Sito Web Autonomo</span>
    </div>
  </footer>
</body>
</html>`;

  const blob = new Blob([htmlContenuto], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Sito_Web_${config.comune.replace(/[^a-zA-Z0-9]/g, '_')}_ProLoco.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const INITIAL_COMUNICAZIONI_SOCI: ComunicazioneSocio[] = [
  {
    id: 'com-2026-001',
    titolo: 'Convocazione Ufficiale Assemblea Ordinaria dei Soci 2026',
    oggetto: 'Approvazione Rendiconto Cassa CTS 2025 e Programma Iniziative 2026',
    categoria: 'assemblea',
    dataPubblicazione: '2026-03-10',
    oraPubblicazione: '09:30',
    autore: 'Consiglio Direttivo & Presidente',
    inEvidenza: true,
    destinatari: 'tutti',
    contenuto: `Gentile Socio,
è convocata per il giorno 28 Aprile 2026 in prima convocazione alle ore 07:00, e in SECONDA CONVOCAZIONE per il giorno:
MARTEDÌ 28 APRILE 2026 alle ore 21:00
presso la Sala Convegni della Sede Pro Loco (Piazza del Popolo, 12), l'Assemblea Generale Ordinaria dei Soci.

Ordine del Giorno:
1. Relazione morale e programmatica del Presidente sull'esercizio sociale 2025;
2. Esame e approvazione del Rendiconto per Cassa Terzo Settore (Modello D RUNTS) chiuso al 31/12/2025;
3. Presentazione del Bilancio Preventivo 2026 e del Calendario Sagre ed Eventi;
4. Aggiornamenti sul tesseramento soci e sulle convenzioni territoriali;
5. Varie ed eventuali.

Hanno diritto di voto e di intervento tutti i soci in regola con il pagamento della quota associativa per l'anno 2026. È ammessa una delega per socio.`
  },
  {
    id: 'com-2026-002',
    titolo: 'Nuove Convenzioni & Sconti Riservati ai Tesserati Pro Loco 2026',
    oggetto: 'Agevolazioni esclusive su commercio locale, musei e teatri',
    categoria: 'convenzione',
    dataPubblicazione: '2026-02-15',
    oraPubblicazione: '11:00',
    autore: 'Segreteria Pro Loco',
    inEvidenza: false,
    destinatari: 'tutti',
    contenuto: `Siamo lieti di comunicare a tutti i soci che, esibendo la nuova Tessera Socio Digitale o Cartacea 2026, è possibile usufruire di sconti e agevolazioni dedicate presso i seguenti partner convenzionati:

• Ristorante & Osteria "Da Baffo": Sconto 15% sul conto finale (esclusi giorni festivi);
• Libreria del Borgo Antico: Sconto 10% su tutta la narrativa e saggi storici locali;
• Farmacia Comunale: Sconto 5% su parafarmaco, cosmetica e integratori;
• Polo Museale Civico & Rocca: Ingresso gratuito per il socio e ridotto per l'accompagnatore;
• Bottega Alimentari "Sapori Toscani": Sconto 10% sui prodotti a km 0 e formaggi tipici.

Per consultare l'elenco sempre aggiornato, mostra la tua tessera con QR code alla cassa degli esercenti che espongono l'adesivo "Socio Pro Loco Benvenuto".`
  },
  {
    id: 'com-2026-003',
    titolo: 'Aperta la Campagna Rinnovi Quota Sociale 2026',
    oggetto: 'Rinnova la tua adesione e sostieni le tradizioni del nostro borgo',
    categoria: 'avviso',
    dataPubblicazione: '2026-01-08',
    oraPubblicazione: '10:00',
    autore: 'Ufficio Tesoreria',
    inEvidenza: false,
    destinatari: 'tutti',
    contenuto: `È aperta la campagna ufficiale per il rinnovo delle quote associative.
Essere soci della Pro Loco significa partecipare attivamente alla tutela del nostro patrimonio culturale, organizzare insieme le sagre storiche e mantenere vivo il senso di solidarietà civica.

Quote deliberate dal Consiglio Direttivo:
• Socio Ordinario: 15,00 €
• Socio Sostenitore: 30,00 €
• Socio Giovane (Under 25): 10,00 €

Modalità di versamento:
- Presso la nostra sede in orario di apertura;
- Tramite Bonifico Bancario intestato all'Associazione Pro Loco (IBAN indicato nella sezione tesseramento);
- Durante gli eventi e i banchetti dedicati. Al momento del pagamento verrà rilasciata quietanza ufficiale numerata con timbro e firma.`
  },
  {
    id: 'com-2026-004',
    titolo: 'Chiamata Volontari per la Sagra del Borgo Antico',
    oggetto: 'Organizzazione turni cucina, logistica stand e desk accoglienza',
    categoria: 'evento',
    dataPubblicazione: '2026-04-02',
    oraPubblicazione: '17:30',
    autore: 'Comitato Eventi & Volontariato',
    inEvidenza: true,
    destinatari: 'tutti',
    contenuto: `In vista dell'imminente Sagra del Borgo Antico (in programma per ottobre 2026), invitiamo tutti i soci disponibili a dare una mano nei vari settori organizzativi:
- Preparazione materie prime e cucina coperta certificata HACCP;
- Gestione cassa gettoni e servizio ai tavoli;
- Accoglienza visitatori e distribuzione materiale informativo;
- Allestimento e smontaggio strutture.

Chi desidera partecipare può segnalare la propria disponibilità direttamente dalla sezione Eventi del Portale Soci o contattando il referente volontari.`
  }
];

export function loadComunicazioniSoci(): ComunicazioneSocio[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMUNICAZIONI_SOCI);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify(INITIAL_COMUNICAZIONI_SOCI));
      return INITIAL_COMUNICAZIONI_SOCI;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_COMUNICAZIONI_SOCI;
  } catch (err) {
    console.error('Errore nel caricamento delle comunicazioni soci:', err);
    return INITIAL_COMUNICAZIONI_SOCI;
  }
}

export function saveComunicazioniSoci(comunicazioni: ComunicazioneSocio[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify(comunicazioni));
    syncDatabaseToServer({ comunicazioni });
  } catch (err) {
    console.error('Errore nel salvataggio delle comunicazioni soci:', err);
  }
}

/**
 * Invia un'uscita del Giornalino Pro Loco nella sezione "Comunicazioni" del Portale Web Soci / App APK,
 * facendo riferimento esplicito al Numero della Tessera di ciascun socio destinatario (invio singolo o invio massivo).
 */
export function inviaUscitaGiornalinoAiSoci(
  edizione: EdizioneGiornalino,
  sociTarget: Socio[],
  config: ProLocoInfo,
  notaAccompagnamento?: string
): { inviateCount: number; comunicazioni: ComunicazioneSocio[] } {
  const esistenti = loadComunicazioniSoci();
  const oggi = new Date().toISOString().split('T')[0];
  const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const autore = config.nomePresidente
    ? `Redazione Giornalino • ${config.nomePresidente}`
    : `Redazione ${edizione.testata || 'Giornalino Pro Loco'}`;

  // Crea uno snapshot leggero e completo dell'uscita per la lettura immediata sull'App APK / Portale Soci
  const snapshotEdizione: EdizioneGiornalino = {
    ...edizione,
    articoli: (edizione.articoli || []).map(a => ({ ...a })),
    sponsor: (edizione.sponsor || []).map(s => ({ ...s }))
  };

  const sommarioArticoli = (edizione.articoli || [])
    .map((art, idx) => `${idx + 1}. [Pag. ${art.pagina || 1}] ${art.titolo} — di ${art.autore}`)
    .join('\n');

  const nuoveComunicazioni: ComunicazioneSocio[] = [];

  sociTarget.forEach(socio => {
    const tesseraClean = (socio.numeroTessera || '').trim().toUpperCase();
    if (!tesseraClean) return;

    const idUnivoco = `com-giornalino-${edizione.id}-${tesseraClean.replace(/[^A-Z0-9]/g, '')}`;
    const intestazioneSocio = `${socio.nome} ${socio.cognome}`.trim();

    const corpoTesto = [
      `Gentile Socio ${intestazioneSocio} (Rif. Numero Tessera: ${tesseraClean}),`,
      notaAccompagnamento?.trim()
        ? notaAccompagnamento.trim()
        : `ti inviamo in allegato digitale l'uscita ufficiale del nostro periodico "${edizione.testata}" — ${edizione.numeroEdizione} (${edizione.periodo}).`,
      '',
      `• Riferimento Tessera Socio: ${tesseraClean}`,
      `• Intestatario: ${intestazioneSocio}`,
      `• Testata: ${edizione.testata}`,
      `• Uscita: ${edizione.numeroEdizione} • ${edizione.periodo} (${edizione.dataUscita || edizione.dataPubblicazione})`,
      `• Pagine Fascicolo: ${edizione.totalePagine || 4} pagine A4`,
      '',
      sommarioArticoli ? `Sommario degli articoli pubblicati in questa uscita:\n${sommarioArticoli}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    nuoveComunicazioni.push({
      id: idUnivoco,
      titolo: `📰 Giornalino Pro Loco: ${edizione.numeroEdizione} (${edizione.periodo})`,
      oggetto: `Rif. Tessera N° ${tesseraClean} • ${intestazioneSocio} — ${edizione.testata}`,
      categoria: 'giornalino',
      dataPubblicazione: oggi,
      oraPubblicazione: ora,
      autore,
      contenuto: corpoTesto,
      inEvidenza: true,
      destinatari: 'tutti',
      allegatoNome: `${edizione.testata.replace(/[^a-zA-Z0-9]/g, '_')}_${edizione.numeroEdizione.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      numeroTesseraRiferimento: tesseraClean,
      socioDestinatarioId: socio.id,
      socioDestinatarioNome: intestazioneSocio,
      edizioneGiornalinoId: edizione.id,
      edizioneGiornalinoNumero: edizione.numeroEdizione,
      edizioneGiornalinoSnapshot: snapshotEdizione
    });
  });

  // Sostituisce eventuali invii precedenti della stessa uscita per la stessa tessera, mantenendo in testa i nuovi invii
  const idsNuove = new Set(nuoveComunicazioni.map(c => c.id));
  const filtrate = esistenti.filter(c => !idsNuove.has(c.id));
  const listaFinale = [...nuoveComunicazioni, ...filtrate];

  saveComunicazioniSoci(listaFinale);
  // Sincronizza subito anche l'archivio giornalini e le comunicazioni sul server (/api/db) per l'App APK su rete dati
  syncDatabaseToServer({
    comunicazioni: listaFinale,
    archivioGiornalini: loadArchivioGiornalini()
  });

  return {
    inviateCount: nuoveComunicazioni.length,
    comunicazioni: listaFinale
  };
}

export function loadSessioneSocioId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_SESSIONE_SOCIO);
  } catch {
    return null;
  }
}

export function saveSessioneSocioId(socioId: string | null): void {
  try {
    if (socioId) {
      localStorage.setItem(STORAGE_KEY_SESSIONE_SOCIO, socioId);
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSIONE_SOCIO);
    }
  } catch (err) {
    console.error('Errore nella memorizzazione della sessione socio:', err);
  }
}

const STORAGE_KEY_BLOCCO_PORTALE_SOCIO = 'proloco_blocco_portale_socio_v1';
const STORAGE_KEY_URL_SYNCED_SOCIO = 'proloco_url_synced_socio_v1';
const STORAGE_KEY_TESSERA_SBLOCCATA = 'proloco_tessera_sbloccata_v1';

export function isTesseraSbloccataInSessione(numeroTessera?: string | null): boolean {
  try {
    if (typeof window === 'undefined' || !numeroTessera) return false;
    const target = numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const savedSession = sessionStorage.getItem(STORAGE_KEY_TESSERA_SBLOCCATA);
    const savedLocal = localStorage.getItem(STORAGE_KEY_TESSERA_SBLOCCATA);
    const saved = savedSession || savedLocal;
    return Boolean(saved && saved.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === target);
  } catch {
    return false;
  }
}

export function setTesseraSbloccataInSessione(numeroTessera: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (numeroTessera && numeroTessera.trim()) {
      const val = numeroTessera.trim().toUpperCase();
      sessionStorage.setItem(STORAGE_KEY_TESSERA_SBLOCCATA, val);
      localStorage.setItem(STORAGE_KEY_TESSERA_SBLOCCATA, val);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_TESSERA_SBLOCCATA);
      localStorage.removeItem(STORAGE_KEY_TESSERA_SBLOCCATA);
    }
  } catch {
    // ignore
  }
}

export const PUBLIC_CLOUD_PORTAL_ORIGIN = 'https://ais-pre-v5llbdiy3rvfmylfkwqz7p-81175282459.europe-west2.run.app';
const STORAGE_KEY_TRYCLOUDFLARE_URL = 'proloco_active_trycloudflare_url';

export function getActiveTryCloudflareUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (window.location.hostname.endsWith('.trycloudflare.com')) {
      return window.location.origin;
    }
    const saved = localStorage.getItem(STORAGE_KEY_TRYCLOUDFLARE_URL);
    if (saved && saved.includes('.trycloudflare.com')) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  return null;
}

export function setActiveTryCloudflareUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (url && url.includes('.trycloudflare.com')) {
      localStorage.setItem(STORAGE_KEY_TRYCLOUDFLARE_URL, url.trim().replace(/\/+$/, ''));
    } else if (url === '') {
      localStorage.removeItem(STORAGE_KEY_TRYCLOUDFLARE_URL);
    }
  } catch {
    // ignore
  }
}

export async function fetchActiveTunnelUrl(forceRestart: boolean = false): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const endpoint = forceRestart ? '/api/tunnel/restart' : '/api/tunnel';
    const res = await fetch(endpoint, {
      method: forceRestart ? 'POST' : 'GET',
      cache: 'no-store'
    });
    if (!res.ok) return getActiveTryCloudflareUrl();
    const data = await res.json();
    if (data && typeof data.tunnelUrl === 'string' && data.tunnelUrl.includes('.trycloudflare.com')) {
      const clean = data.tunnelUrl.trim().replace(/\/+$/, '');
      setActiveTryCloudflareUrl(clean);
      return clean;
    }
  } catch {
    // ignore
  }
  return getActiveTryCloudflareUrl();
}

/**
 * Restituisce l'origine pubblica HTTPS raggiungibile da smartphone su rete dati mobile (4G/5G) e Wi-Fi.
 * Se è attivo il tunnel diretto `https://....trycloudflare.com`, lo usa in via prioritaria così
 * il gestionale e l'applicazione APK rimangono sincronizzati in tempo reale sullo stesso server.
 */
export function getPublicPortalOrigin(): string {
  if (typeof window === 'undefined') return PUBLIC_CLOUD_PORTAL_ORIGIN;

  const tunnelUrl = getActiveTryCloudflareUrl();
  if (tunnelUrl) {
    return tunnelUrl;
  }

  const origin = window.location.origin;
  const hostname = window.location.hostname;

  if (hostname.endsWith('.trycloudflare.com')) {
    return origin;
  }

  if (hostname.startsWith('ais-dev-')) {
    return origin.replace('://ais-dev-', '://ais-pre-');
  }

  const isLocalOrLan =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    hostname.endsWith('.local') ||
    window.location.protocol === 'file:';

  if (isLocalOrLan) {
    return PUBLIC_CLOUD_PORTAL_ORIGIN;
  }

  return origin;
}

export function loadBloccoPortaleSocio(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hasUrlPortalParams =
        Boolean(params.get('s')) ||
        Boolean(params.get('pk')) ||
        Boolean(params.get('d')) ||
        Boolean(params.get('area_soci')) ||
        Boolean(params.get('portale_soci')) ||
        params.get('portale') === 'soci' ||
        Boolean(params.get('tessera')) ||
        Boolean(params.get('cf')) ||
        Boolean(params.get('barcode')) ||
        Boolean(params.get('blocco_socio')) ||
        Boolean(params.get('sync_socio'));
      if (hasUrlPortalParams) {
        sessionStorage.setItem(STORAGE_KEY_BLOCCO_PORTALE_SOCIO, '1');
        return true;
      }
      // Se il gestionale viene aperto senza parametri di invito/tessera nell'URL, si apre sempre dalla Dashboard
      sessionStorage.removeItem(STORAGE_KEY_BLOCCO_PORTALE_SOCIO);
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

export function saveBloccoPortaleSocio(bloccato: boolean): void {
  try {
    if (bloccato) {
      sessionStorage.setItem(STORAGE_KEY_BLOCCO_PORTALE_SOCIO, '1');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_BLOCCO_PORTALE_SOCIO);
      sessionStorage.removeItem(STORAGE_KEY_TESSERA_SBLOCCATA);
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        params.delete('s');
        params.delete('p');
        params.delete('d');
        params.delete('area_soci');
        params.delete('portale_soci');
        params.delete('portale');
        params.delete('tessera');
        params.delete('cf');
        params.delete('barcode');
        params.delete('pin');
        params.delete('pk');
        params.delete('auto');
        params.delete('n');
        params.delete('c');
        params.delete('blocco_socio');
        params.delete('sync_socio');
        const remaining = params.toString();
        const cleanUrl = remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  } catch (err) {
    console.error('Errore nel salvataggio del blocco portale socio:', err);
  }
}

// =====================================================================
// SINCRONIZZAZIONE DATABASE SERVER (/api/db) + PAYLOAD LINK PORTALE SOCI
// =====================================================================

export function toBase64Url(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function fromBase64Url(b64url: string): string {
  try {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

export interface PortalSyncPayload {
  socio: Socio;
  anno?: number;
  config?: Partial<ProLocoInfo>;
  comunicazioni?: ComunicazioneSocio[];
  archivioGiornalini?: EdizioneGiornalino[];
  eventi?: ProLocoEvento[];
  tunnelUrl?: string;
  ts?: number;
}

/**
 * Costruisce il link completo, compatto e deterministico per il Portale Web dei Soci,
 * utilizzando l'origine pubblica raggiungibile su linea dati mobile (4G/5G) e posizionando
 * Numero Tessera (`s`), Token PIN (`pk`), Nome (`n`) e Cognome (`c`) all'inizio dell'URL.
 */
export function buildSyncedMemberPortalUrl(
  socio: Socio,
  config: ProLocoInfo,
  annoSelezionato: number,
  perQrCompatto: boolean = false
): string {
  if (typeof window === 'undefined') return '';
  const publicOrigin = getPublicPortalOrigin();
  const pathname = window.location.pathname && window.location.pathname !== '/index.html' ? window.location.pathname : '/';
  const baseUrl = `${publicOrigin}${pathname}`;
  const pinEffettivo = socio.pin && socio.pin.trim() ? socio.pin.trim() : '1234';
  const pinToken = toBase64Url(pinEffettivo);
  const tesseraClean = (socio.numeroTessera || '').trim().toUpperCase();

  const headParams = new URLSearchParams();
  headParams.set('s', tesseraClean);
  headParams.set('pk', pinToken);

  if (perQrCompatto) {
    return `${baseUrl}?${headParams.toString()}`;
  }

  return `${publicOrigin}/s/${encodeURIComponent(tesseraClean)}?pk=${encodeURIComponent(pinToken)}`;
}

/**
 * Estrae il PIN atteso dai parametri dell'URL (`p`, `pin` o `pk` codificato) se presente.
 */
export function getPinFromUrlParams(rawUrlOrSearch?: string): string | null {
  try {
    const searchStr =
      rawUrlOrSearch !== undefined
        ? rawUrlOrSearch.includes('?')
          ? rawUrlOrSearch.split('?')[1]
          : rawUrlOrSearch
        : typeof window !== 'undefined'
        ? window.location.search
        : '';
    if (!searchStr) return null;
    const params = new URLSearchParams(searchStr);
    const directPin = params.get('pin') || params.get('p');
    if (directPin && directPin.trim()) {
      return directPin.trim();
    }
    const pk = params.get('pk');
    if (pk && pk.trim()) {
      const decoded = fromBase64Url(pk.trim());
      if (decoded && decoded.trim()) {
        return decoded.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Decodifica un eventuale payload `sync_socio` (o i parametri rapidi `s`/`tessera` + `p`/`pk` + `n` + `c`)
 * presenti nell'URL dell'invito email/WhatsApp o in una stringa scansionata da QR/Barcode
 * e aggiorna immediatamente il database locale affinché i dati e il PIN coincidano al 100%.
 */
export function applyUrlPortalSync(rawUrlOrSearch?: string): {
  socioSincronizzato: Socio | null;
  configSincronizzata: ProLocoInfo | null;
  annoSincronizzato: number | null;
} {
  try {
    const searchStr =
      rawUrlOrSearch !== undefined
        ? rawUrlOrSearch.includes('?')
          ? rawUrlOrSearch.split('?')[1]
          : rawUrlOrSearch
        : typeof window !== 'undefined'
        ? window.location.search
        : '';

    const getCachedSyncedSocio = (): Socio | null => {
      if (typeof window === 'undefined') return null;
      const cachedRaw = sessionStorage.getItem(STORAGE_KEY_URL_SYNCED_SOCIO);
      if (!cachedRaw) return null;
      try {
        const cachedSocio = JSON.parse(cachedRaw) as Socio;
        if (cachedSocio && cachedSocio.numeroTessera) {
          const sociAttuali = loadSoci();
          const exists = sociAttuali.some(
            s => s.id === cachedSocio.id || s.numeroTessera.trim().toUpperCase() === cachedSocio.numeroTessera.trim().toUpperCase()
          );
          if (!exists) {
            localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify([cachedSocio, ...sociAttuali]));
          }
          return cachedSocio;
        }
      } catch {
        // ignore
      }
      return null;
    };

    if (!searchStr) {
      const cached = getCachedSyncedSocio();
      return { socioSincronizzato: cached, configSincronizzata: null, annoSincronizzato: null };
    }

    const params = new URLSearchParams(searchStr);
    const encoded = params.get('sync_socio') || params.get('d');
    const pinFromUrl = getPinFromUrlParams(searchStr);
    const tesseraParam = (params.get('s') || params.get('tessera') || '').trim().toUpperCase();

    let parsed: PortalSyncPayload | null = null;
    if (encoded) {
      const jsonStr = fromBase64Url(encoded.trim());
      if (jsonStr) {
        try {
          parsed = JSON.parse(jsonStr) as PortalSyncPayload;
        } catch {
          parsed = null;
        }
      }
    }

    const sociAttuali = loadSoci();
    let socioIncoming: Socio | null = null;

    if (parsed && parsed.socio && parsed.socio.numeroTessera) {
      const tesseraParsed = parsed.socio.numeroTessera.trim().toUpperCase();
      const normParsed = tesseraParsed.replace(/[^A-Z0-9]/g, '');
      const esistente = sociAttuali.find(
        s =>
          s.id === parsed!.socio.id ||
          s.numeroTessera.trim().toUpperCase() === tesseraParsed ||
          s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === normParsed
      );
      const pinRisolto =
        (pinFromUrl && pinFromUrl.trim()) ||
        (parsed.socio.pin && parsed.socio.pin.trim()) ||
        (esistente?.pin && esistente.pin.trim()) ||
        '1234';
      socioIncoming = {
        ...(esistente || {}),
        ...parsed.socio,
        id: esistente?.id || parsed.socio.id,
        numeroTessera: tesseraParsed,
        pin: pinRisolto
      };
    } else if (tesseraParam) {
      // Ricostruisce o aggiorna il socio dai parametri corti in testa all'URL (s, pk, n, c, cf)
      const normParam = tesseraParam.replace(/[^A-Z0-9]/g, '');
      const esistente = sociAttuali.find(
        s =>
          s.numeroTessera.trim().toUpperCase() === tesseraParam ||
          s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === normParam
      );
      const pinRisolto =
        (pinFromUrl && pinFromUrl.trim()) ||
        (esistente?.pin && esistente.pin.trim()) ||
        '1234';

      if (esistente) {
        socioIncoming = {
          ...esistente,
          id: esistente.id,
          pin: pinRisolto,
          nome: params.get('n')?.trim() || esistente.nome,
          cognome: params.get('c')?.trim() || esistente.cognome,
          codiceFiscale: params.get('cf')?.trim().toUpperCase() || esistente.codiceFiscale
        };
      } else {
        const cfg = loadProLocoConfig();
        const annoCorr = new Date().getFullYear();
        socioIncoming = {
          id: `socio-url-${tesseraParam}`,
          numeroTessera: tesseraParam,
          pin: pinRisolto,
          nome: params.get('n')?.trim() || 'Socio',
          cognome: params.get('c')?.trim() || tesseraParam,
          codiceFiscale: params.get('cf')?.trim().toUpperCase() || '',
          dataNascita: '',
          luogoNascita: '',
          indirizzo: '',
          cap: cfg.cap || '',
          citta: cfg.comune || '',
          provincia: cfg.provincia || '',
          telefono: '',
          email: '',
          categoria: 'Ordinario',
          ruoloDirettivo: 'Nessuno',
          dataIscrizione: `${annoCorr}-01-01`,
          attivo: true,
          consensoPrivacy: true,
          quote: [
            {
              id: `quota-url-${tesseraParam}-${annoCorr}`,
              socioId: `socio-url-${tesseraParam}`,
              anno: annoCorr,
              importo: cfg.quotaStandardOrdinario || 15,
              dataPagamento: new Date().toISOString().slice(0, 10),
              dataScadenza: `${annoCorr}-12-31`,
              metodo: 'Contanti',
              ricevutaNumero: `REC-${annoCorr}/001`
            }
          ]
        };
      }
    }

    if (!socioIncoming) {
      const cached = getCachedSyncedSocio();
      return { socioSincronizzato: cached, configSincronizzata: null, annoSincronizzato: null };
    }

    // Sincronizza il socio nell'elenco soci locale preservando l'eventuale fototessera o quote complete già presenti
    const targetTesseraUpper = socioIncoming.numeroTessera.trim().toUpperCase();
    const idxEsistente = sociAttuali.findIndex(
      s => s.id === socioIncoming!.id || s.numeroTessera.trim().toUpperCase() === targetTesseraUpper
    );

    let socioFinale: Socio = socioIncoming;
    let nuovaListaSoci: Socio[];
    if (idxEsistente >= 0) {
      const vecchio = sociAttuali[idxEsistente];
      socioFinale = {
        ...vecchio,
        ...socioIncoming,
        id: vecchio.id,
        pin: socioIncoming.pin || vecchio.pin || '1234',
        foto: socioIncoming.foto || vecchio.foto,
        quote:
          socioIncoming.quote && socioIncoming.quote.length >= (vecchio.quote?.length || 0)
            ? socioIncoming.quote
            : vecchio.quote
      };
      nuovaListaSoci = sociAttuali.map((s, i) => (i === idxEsistente ? socioFinale : s));
    } else {
      nuovaListaSoci = [socioFinale, ...sociAttuali];
    }

    localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify(nuovaListaSoci));
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY_URL_SYNCED_SOCIO, JSON.stringify(socioFinale));
        const currentSessionId = loadSessioneSocioId();
        if (currentSessionId && currentSessionId.startsWith('socio-url-') && socioFinale.id !== currentSessionId) {
          saveSessioneSocioId(socioFinale.id);
        }
      } catch {
        // ignore
      }
    }

    let configFinale: ProLocoInfo | null = null;
    if (parsed?.config && parsed.config.nome) {
      const cfgAttuale = loadProLocoConfig();
      configFinale = {
        ...cfgAttuale,
        ...parsed.config
      };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(configFinale));
    }

    if (parsed?.tunnelUrl && parsed.tunnelUrl.includes('.trycloudflare.com')) {
      setActiveTryCloudflareUrl(parsed.tunnelUrl);
    }

    if (Array.isArray(parsed?.comunicazioni) && parsed!.comunicazioni.length > 0) {
      const comAttuali = loadComunicazioniSoci();
      const idsIncoming = new Set(parsed!.comunicazioni.map(c => c.id));
      const mergedCom = [...parsed!.comunicazioni, ...comAttuali.filter(c => !idsIncoming.has(c.id))];
      localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify(mergedCom));
    }

    if (Array.isArray(parsed?.archivioGiornalini) && parsed!.archivioGiornalini.length > 0) {
      const archAttuale = loadArchivioGiornalini();
      const idsArch = new Set(parsed!.archivioGiornalini.map(e => e.id));
      const mergedArch = [...parsed!.archivioGiornalini, ...archAttuale.filter(e => !idsArch.has(e.id))];
      localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(mergedArch));
    }

    return {
      socioSincronizzato: socioFinale,
      configSincronizzata: configFinale,
      annoSincronizzato: parsed?.anno || null
    };
  } catch (err) {
    console.error('Errore decodifica payload sync_socio:', err);
    return { socioSincronizzato: null, configSincronizzata: null, annoSincronizzato: null };
  }
}

let lastLocalWriteAt = 0;
const STORAGE_KEY_PENDING_SERVER_SYNC = 'proloco_pending_server_sync_v1';
const STORAGE_KEY_LOCAL_LAST_UPDATED = 'proloco_local_last_updated_v1';
const STORAGE_KEY_SERVER_UPDATED_AT = 'proloco_server_updated_at_v1';
let isServerCurrentlyReachable = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
let isSyncingWithServer = false;

export type ServerConnectionStatus = 'synced' | 'syncing' | 'offline';

export interface ServerSyncStatusInfo {
  status: ServerConnectionStatus;
  reachable: boolean;
  pendingSync: boolean;
  syncing: boolean;
  lastSyncAt: number;
}

export const NETWORK_STATUS_EVENT = 'proloco:network-status';

export function getServerReachability(): boolean {
  return isServerCurrentlyReachable;
}

export function hasPendingServerSync(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_PENDING_SERVER_SYNC) === '1';
  } catch {
    return false;
  }
}

export function getLastSyncServerTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return Number(localStorage.getItem(STORAGE_KEY_SERVER_UPDATED_AT) || 0);
  } catch {
    return 0;
  }
}

export function getServerSyncStatus(): ServerSyncStatusInfo {
  const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const pending = hasPendingServerSync();
  const lastSyncAt = getLastSyncServerTimestamp();

  if (!browserOnline || !isServerCurrentlyReachable) {
    return {
      status: isSyncingWithServer ? 'syncing' : 'offline',
      reachable: false,
      pendingSync: pending,
      syncing: isSyncingWithServer,
      lastSyncAt
    };
  }

  if (isSyncingWithServer || pending) {
    return {
      status: 'syncing',
      reachable: true,
      pendingSync: pending,
      syncing: true,
      lastSyncAt
    };
  }

  return {
    status: 'synced',
    reachable: true,
    pendingSync: false,
    syncing: false,
    lastSyncAt
  };
}

function emitNetworkStatusEvent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent<ServerSyncStatusInfo>(NETWORK_STATUS_EVENT, {
        detail: getServerSyncStatus()
      })
    );
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isSyncingWithServer = true;
    emitNetworkStatusEvent();
  });
  window.addEventListener('offline', () => {
    isServerCurrentlyReachable = false;
    isSyncingWithServer = false;
    emitNetworkStatusEvent();
  });
}

function setLastSyncServerTimestamp(ts: number): void {
  if (typeof window === 'undefined' || !ts) return;
  try {
    localStorage.setItem(STORAGE_KEY_SERVER_UPDATED_AT, String(ts));
  } catch {
    // ignore
  }
}

function setPendingServerSync(pending: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (pending) {
      localStorage.setItem(STORAGE_KEY_PENDING_SERVER_SYNC, '1');
      localStorage.setItem(STORAGE_KEY_LOCAL_LAST_UPDATED, String(Date.now()));
    } else {
      localStorage.removeItem(STORAGE_KEY_PENDING_SERVER_SYNC);
    }
    emitNetworkStatusEvent();
  } catch {
    // ignore
  }
}

export interface ApkVersionPolicy {
  schemaVersion: number;
  apiVersionsSupported: string[];
  currentVersionCode: number;
  currentVersionName: string;
  minRequiredVersionCode: number;
  minRequiredVersionName: string;
  forceUpdate: boolean;
  releaseNotes?: string;
}

const STORAGE_KEY_APK_VERSION_POLICY = 'proloco_apk_version_policy_v2';

export const GESTIONALE_VERSION = '2.0.0';

export const DEFAULT_APK_VERSION_POLICY: ApkVersionPolicy = {
  schemaVersion: 2,
  apiVersionsSupported: ['v1', 'v2'],
  currentVersionCode: 2,
  currentVersionName: GESTIONALE_VERSION,
  minRequiredVersionCode: 1,
  minRequiredVersionName: '1.0.0',
  forceUpdate: false,
  releaseNotes: 'Compatibilità bidirezionale /api/v1 + /api/v2 garantita tra qualsiasi versione di APK e Gestionale.'
};

export function loadApkVersionPolicy(): ApkVersionPolicy {
  if (typeof window === 'undefined') return DEFAULT_APK_VERSION_POLICY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APK_VERSION_POLICY);
    if (!raw) return DEFAULT_APK_VERSION_POLICY;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APK_VERSION_POLICY,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
      minRequiredVersionCode: 1,
      minRequiredVersionName: '1.0.0',
      forceUpdate: false
    };
  } catch {
    return DEFAULT_APK_VERSION_POLICY;
  }
}

export async function saveApkVersionPolicy(policy: Partial<ApkVersionPolicy>): Promise<ApkVersionPolicy> {
  const current = loadApkVersionPolicy();
  const updated: ApkVersionPolicy = {
    ...current,
    ...policy
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_APK_VERSION_POLICY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    try {
      await fetch('/api/v2/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {
      // fallback
    }
    syncDatabaseToServer({ apkVersionPolicy: updated });
  }
  return updated;
}

export function syncDatabaseToServer(partial?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const nowTs = Date.now();
    lastLocalWriteAt = nowTs;
    isSyncingWithServer = true;
    // Marca subito is_dirty = true (pending server sync + last_updated) nel caso il server sia spento o in fase di riavvio
    setPendingServerSync(true);

    // Costruisce sempre il database completo così il server attivo ha l'intero stato aggiornato per tutti i soci e gli APK
    const fullState = {
      azzerato: false,
      schemaVersion: 2,
      is_dirty: true,
      last_updated: nowTs,
      soci: loadSoci(),
      config: loadProLocoConfig(),
      eventi: loadEventi(),
      donazioni: loadDonazioni(),
      campagne: loadCampagneFondi(),
      cestino: loadCestino(),
      sitoConfig: loadSitoWebConfig(),
      comunicazioni: loadComunicazioniSoci(),
      archivioGiornalini: loadArchivioGiornalini(),
      giornalinoAttivoId: loadGiornalinoAttivoId(),
      giornalinoConfig: loadGiornalinoConfig(),
      apkVersionPolicy: loadApkVersionPolicy(),
      ...(partial || {})
    };

    const bodyStr = JSON.stringify(fullState);
    const tunnelUrl = getActiveTryCloudflareUrl();

    // 1. Salva sul server attivo corrente (/api/v2/db con retrocompatibilità /api/v1/db e /api/db)
    fetch('/api/v2/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    })
      .then(async res => {
        isSyncingWithServer = false;
        if (res && res.ok) {
          isServerCurrentlyReachable = true;
          setPendingServerSync(false);
          try {
            const data = await res.json();
            if (data && (data.server_updated_at || data.updatedAt)) {
              setLastSyncServerTimestamp(Number(data.server_updated_at || data.updatedAt));
            }
            if (data && typeof data.tunnelUrl === 'string' && data.tunnelUrl.includes('.trycloudflare.com')) {
              setActiveTryCloudflareUrl(data.tunnelUrl);
            }
          } catch (jsonErr) {
            console.warn('[syncDatabaseToServer] Impossibile leggere la risposta JSON da /api/v2/db:', jsonErr);
          }
          emitNetworkStatusEvent();
        } else {
          isServerCurrentlyReachable = false;
          emitNetworkStatusEvent();
          console.error(
            `[syncDatabaseToServer] Errore HTTP durante la sincronizzazione verso /api/v2/db: status ${res?.status} (${res?.statusText})`
          );
        }
      })
      .catch(err => {
        isSyncingWithServer = false;
        isServerCurrentlyReachable = false;
        emitNetworkStatusEvent();
        // Il server è spento o irraggiungibile: i dati restano salvati in locale (is_dirty=true) e verranno scambiati appena il server si riaccende
        console.error(
          '[syncDatabaseToServer] Errore bloccante di rete verso /api/v2/db (sincronizzazione rimandata in coda locale):',
          err
        );
      });

    // 2. Se c'è un tunnel trycloudflare memorizzato (e non siamo già su quell'origine), invia anche lì
    if (tunnelUrl && window.location.origin !== tunnelUrl) {
      fetch(`${tunnelUrl}/api/v2/db`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      })
        .then(res => {
          if (res && res.ok) {
            isServerCurrentlyReachable = true;
            isSyncingWithServer = false;
            setPendingServerSync(false);
            emitNetworkStatusEvent();
          } else {
            console.error(
              `[syncDatabaseToServer] Errore HTTP durante la sincronizzazione sul tunnel (${tunnelUrl}/api/v2/db): status ${res?.status} (${res?.statusText})`
            );
          }
        })
        .catch(err => {
          console.error(
            `[syncDatabaseToServer] Errore di rete durante la sincronizzazione verso il tunnel (${tunnelUrl}/api/v2/db):`,
            err
          );
        });
    }
  } catch (err) {
    isSyncingWithServer = false;
    emitNetworkStatusEvent();
    console.error('[syncDatabaseToServer] Errore imprevisto durante la preparazione del payload di sincronizzazione:', err);
  }
}

export function resetDatabaseOnServer(extra?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    lastLocalWriteAt = Date.now();
    sessionStorage.removeItem(STORAGE_KEY_URL_SYNCED_SOCIO);
    const bodyStr = JSON.stringify(extra || {});
    fetch('/api/db/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    }).catch(() => {
      // ignore
    });

    if (window.location.origin !== PUBLIC_CLOUD_PORTAL_ORIGIN) {
      fetch(`${PUBLIC_CLOUD_PORTAL_ORIGIN}/api/db/reset`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => {
        // ignore
      });
    }
  } catch {
    // ignore
  }
}

export interface ServerDatabaseSnapshot {
  azzerato?: boolean;
  soci?: Socio[];
  config?: ProLocoInfo;
  eventi?: ProLocoEvento[];
  donazioni?: DonazioneTerzi[];
  campagne?: CampagnaRaccoltaFondi[];
  cestino?: ElementoCestino[];
  sitoConfig?: SitoWebConfig;
  comunicazioni?: ComunicazioneSocio[];
  archivioGiornalini?: EdizioneGiornalino[];
  giornalinoAttivoId?: string;
  giornalinoConfig?: GiornalinoConfig;
  updatedAt?: number;
  server_updated_at?: number;
}

export async function fetchDatabaseFromServer(): Promise<ServerDatabaseSnapshot | null> {
  if (typeof window === 'undefined') return null;
  try {
    const requestStartedAt = Date.now();
    const lastSyncTs = getLastSyncServerTimestamp();
    const sinceQuery = lastSyncTs > 0 ? `?since_ts=${lastSyncTs}` : '';
    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.');

    let res: Response | null = null;
    try {
      res = await fetch(`/api/v2/db${sinceQuery}`, { cache: 'no-store' });
      if (!res || !res.ok) {
        console.warn(
          `[fetchDatabaseFromServer] Endpoint /api/v2/db non disponibile (status: ${res?.status}), tentativo fallback su /api/db...`
        );
        res = await fetch(`/api/db${sinceQuery}`, { cache: 'no-store' });
      }
    } catch (err) {
      console.error('[fetchDatabaseFromServer] Errore di rete contattando il backend primario (/api/v2/db | /api/db):', err);
      res = null;
    }

    // Se NON siamo sul PC locale (es. siamo su smartphone/APK), prova anche il tunnel o il gateway cloud
    // Sul PC locale (localhost) non sovrascriviamo mai il database locale con un database remoto diverso
    if (!isLocalHost) {
      const savedTunnel = getActiveTryCloudflareUrl();
      if ((!res || !res.ok) && savedTunnel && window.location.origin !== savedTunnel) {
        try {
          res = await fetch(`${savedTunnel}/api/v2/db${sinceQuery}`, { cache: 'no-store', mode: 'cors' });
          if (!res || !res.ok) {
            console.warn(
              `[fetchDatabaseFromServer] Tunnel ${savedTunnel}/api/v2/db non disponibile (status: ${res?.status}), tentativo fallback su /api/db...`
            );
            res = await fetch(`${savedTunnel}/api/db${sinceQuery}`, { cache: 'no-store', mode: 'cors' });
          }
        } catch (err) {
          console.error(`[fetchDatabaseFromServer] Errore di rete contattando il tunnel (${savedTunnel}):`, err);
          res = null;
        }
      }

      if ((!res || !res.ok) && window.location.origin !== PUBLIC_CLOUD_PORTAL_ORIGIN) {
        try {
          res = await fetch(`${PUBLIC_CLOUD_PORTAL_ORIGIN}/api/v2/db${sinceQuery}`, { cache: 'no-store', mode: 'cors' });
          if (!res || !res.ok) {
            console.warn(
              `[fetchDatabaseFromServer] Cloud Portal ${PUBLIC_CLOUD_PORTAL_ORIGIN}/api/v2/db non disponibile (status: ${res?.status}), tentativo fallback su /api/db...`
            );
            res = await fetch(`${PUBLIC_CLOUD_PORTAL_ORIGIN}/api/db${sinceQuery}`, { cache: 'no-store', mode: 'cors' });
          }
        } catch (err) {
          console.error(
            `[fetchDatabaseFromServer] Errore di rete contattando il Cloud Portal (${PUBLIC_CLOUD_PORTAL_ORIGIN}):`,
            err
          );
          res = null;
        }
      }
    }

    if (!res || !res.ok) {
      isServerCurrentlyReachable = false;
      isSyncingWithServer = false;
      emitNetworkStatusEvent();
      console.error(
        `[fetchDatabaseFromServer] Sincronizzazione bloccata: nessun endpoint backend raggiungibile (ultimo status HTTP: ${res?.status ?? 'nessuna risposta'}).`
      );
      return null;
    }

    isServerCurrentlyReachable = true;

    // Se avevamo modifiche effettuate a server spento (is_dirty = true), appena il server torna acceso scambiamo i dati inviando prima il nostro stato aggiornato
    if (hasPendingServerSync()) {
      console.info(
        '[fetchDatabaseFromServer] Rilevate modifiche locali in coda (pending sync / is_dirty=true): invio stato locale al backend prima di sovrascrivere.'
      );
      isSyncingWithServer = true;
      emitNetworkStatusEvent();
      setPendingServerSync(false);
      syncDatabaseToServer();
      return null;
    }

    isSyncingWithServer = false;
    emitNetworkStatusEvent();

    const data = await res.json();
    if (data && typeof data.tunnelUrl === 'string' && data.tunnelUrl.includes('.trycloudflare.com')) {
      setActiveTryCloudflareUrl(data.tunnelUrl);
    }
    // Se durante la richiesta di rete l'utente ha salvato modifiche locali più recenti, ignora la risposta obsoleta
    if (lastLocalWriteAt > requestStartedAt) {
      console.warn(
        '[fetchDatabaseFromServer] Risposta del server ignorata: rilevata scrittura locale più recente durante il trasferimento di rete.'
      );
      return null;
    }
    if (!data || !data.db || typeof data.db !== 'object') {
      console.warn('[fetchDatabaseFromServer] Risposta ricevuta dal server priva di un oggetto db valido:', data);
      return null;
    }
    const db = data.db as ServerDatabaseSnapshot;
    const serverUpdatedAt = Number(data.server_updated_at || db.server_updated_at || db.updatedAt || 0);
    if (serverUpdatedAt > 0) {
      setLastSyncServerTimestamp(serverUpdatedAt);
      emitNetworkStatusEvent();
    }

    // Se il server non è ancora inizializzato (nessun campo salvato), invia lo stato locale attuale al server una sola volta
    if (db.soci === undefined && db.azzerato === undefined) {
      console.info('[fetchDatabaseFromServer] Database sul server non ancora inizializzato: invio stato locale iniziale.');
      syncDatabaseToServer();
      return null;
    }

    const hasActiveUrlSocioParams = (() => {
      try {
        const p = new URLSearchParams(window.location.search);
        return Boolean(p.get('s') || p.get('tessera') || p.get('sync_socio') || p.get('d') || p.get('pk'));
      } catch {
        return false;
      }
    })();

    const activeSessionSocioId = loadSessioneSocioId();
    const tesseraSbloccata = (() => {
      try {
        return sessionStorage.getItem(STORAGE_KEY_TESSERA_SBLOCCATA) || localStorage.getItem(STORAGE_KEY_TESSERA_SBLOCCATA);
      } catch {
        return null;
      }
    })();

    // Se sul server il database risulta vuoto ma sul PC locale ci sono già soci salvati (o una tessera aperta in sessione),
    // preserva i soci locali e riallinea il server anziché chiudere la tessera o svuotare l'archivio locale
    const sociLocali = loadSoci();
    if (
      Array.isArray(db.soci) &&
      db.soci.length === 0 &&
      sociLocali.length > 0 &&
      (isLocalHost || activeSessionSocioId || tesseraSbloccata || hasActiveUrlSocioParams)
    ) {
      console.warn(
        `[fetchDatabaseFromServer] Il database remoto ha restituito 0 soci mentre localmente sono presenti ${sociLocali.length} soci: preservazione archivio locale e riallineamento del server.`
      );
      syncDatabaseToServer();
      return null;
    }

    // Se il database sul server è stato azzerato e NON siamo in un link invito socio né in una sessione attiva, pulisce la cache di sessione
    if (db.azzerato === true && !hasActiveUrlSocioParams && !activeSessionSocioId && !tesseraSbloccata) {
      sessionStorage.removeItem(STORAGE_KEY_URL_SYNCED_SOCIO);
    }

    // Sincronizza il localStorage locale con i dati del server preservando sempre il socio con tessera attualmente aperta
    if (Array.isArray(db.soci)) {
      let sociDaSalvare = [...db.soci];
      if (activeSessionSocioId || tesseraSbloccata) {
        const normSbloccata = (tesseraSbloccata || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const socioInSessione = sociLocali.find(
          s =>
            (activeSessionSocioId && s.id === activeSessionSocioId) ||
            (normSbloccata && s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === normSbloccata)
        );
        if (
          socioInSessione &&
          !sociDaSalvare.some(
            s =>
              s.id === socioInSessione.id ||
              s.numeroTessera.trim().toUpperCase() === socioInSessione.numeroTessera.trim().toUpperCase()
          )
        ) {
          sociDaSalvare = [socioInSessione, ...sociDaSalvare];
        }
      }
      localStorage.setItem(STORAGE_KEY_SOCI, JSON.stringify(sociDaSalvare));
    }
    if (db.config) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(db.config));
    }
    if (Array.isArray(db.eventi)) {
      localStorage.setItem(STORAGE_KEY_EVENTI, JSON.stringify(db.eventi));
    }
    if (Array.isArray(db.donazioni)) {
      localStorage.setItem(STORAGE_KEY_DONAZIONI, JSON.stringify(db.donazioni));
    }
    if (Array.isArray(db.campagne)) {
      localStorage.setItem(STORAGE_KEY_CAMPAGNE_DONAZIONI, JSON.stringify(db.campagne));
    }
    if (Array.isArray(db.cestino)) {
      localStorage.setItem(STORAGE_KEY_CESTINO, JSON.stringify(db.cestino));
    }
    if (db.sitoConfig) {
      localStorage.setItem(STORAGE_KEY_SITO_WEB, JSON.stringify(db.sitoConfig));
    }
    if (Array.isArray(db.comunicazioni)) {
      localStorage.setItem(STORAGE_KEY_COMUNICAZIONI_SOCI, JSON.stringify(db.comunicazioni));
    }
    if (Array.isArray(db.archivioGiornalini)) {
      localStorage.setItem(STORAGE_KEY_ARCHIVIO_GIORNALINI, JSON.stringify(db.archivioGiornalini));
    }
    if (typeof db.giornalinoAttivoId === 'string') {
      localStorage.setItem(STORAGE_KEY_GIORNALINO_ATTIVO_ID, db.giornalinoAttivoId);
    }
    if (db.giornalinoConfig) {
      localStorage.setItem(STORAGE_KEY_GIORNALINO, JSON.stringify(db.giornalinoConfig));
    }

    // Applica eventuale payload del socio presente nell'URL (anche su linea dati mobile) sopra ai dati del server
    if (db.azzerato !== true || hasActiveUrlSocioParams) {
      applyUrlPortalSync();
    }

    return db;
  } catch (err) {
    isServerCurrentlyReachable = false;
    isSyncingWithServer = false;
    emitNetworkStatusEvent();
    console.error('[fetchDatabaseFromServer] Errore bloccante imprevisto durante la sincronizzazione dal server:', err);
    return null;
  }
}





