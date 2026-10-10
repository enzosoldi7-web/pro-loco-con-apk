import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Socio, 
  ProLocoInfo, 
  QuotaAssociativa, 
  ProLocoEvento, 
  SitoWebConfig,
  PaginaPrincipale,
  SottoTabGestionale,
  GiornalinoConfig,
  EdizioneGiornalino,
  DonazioneTerzi,
  CampagnaRaccoltaFondi,
  ElementoCestino,
  ComunicazioneSocio
} from './types';
import { 
  loadSoci, 
  saveSoci, 
  loadProLocoConfig, 
  saveProLocoConfig, 
  INITIAL_SOCI, 
  DEFAULT_PRO_LOCO,
  loadEventi,
  saveEventi,
  INITIAL_EVENTI,
  INITIAL_DONAZIONI,
  INITIAL_CAMPAGNE_FONDI,
  INITIAL_ARCHIVIO_GIORNALINI,
  INITIAL_COMUNICAZIONI_SOCI,
  DEFAULT_SITO_WEB_CONFIG,
  DEFAULT_GIORNALINO_CONFIG,
  ripristinaEventiSimulati,
  loadDonazioni,
  saveDonazioni,
  saveCampagneFondi,
  loadSitoWebConfig,
  saveSitoWebConfig,
  loadGiornalinoConfig,
  saveGiornalinoConfig,
  loadArchivioGiornalini,
  saveArchivioGiornalini,
  loadGiornalinoAttivoId,
  saveGiornalinoAttivoId,
  eliminaEdizioneGiornalino,
  loadCestino,
  saveCestino,
  aggiungiAlCestino,
  rimuoviDalCestino,
  svuotaCestino,
  saveComunicazioniSoci,
  loadSessioneSocioId,
  saveSessioneSocioId,
  loadBloccoPortaleSocio,
  saveBloccoPortaleSocio,
  isTesseraSbloccataInSessione,
  azzeraDatabase,
  getEmptySitoWebConfig,
  getEmptyGiornalinoConfig,
  applyUrlPortalSync,
  fetchDatabaseFromServer,
  syncDatabaseToServer,
  buildSyncedMemberPortalUrl,
  GESTIONALE_VERSION
} from './storage';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { MemberList } from './components/MemberList';
import { MemberModal } from './components/MemberModal';
import { DigitalCardModal } from './components/DigitalCardModal';
import { SendMemberPortalLinkModal } from './components/SendMemberPortalLinkModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyConsentModal } from './components/PrivacyConsentModal';
import { ApkModal } from './components/ApkModal';
import { EventList } from './components/EventList';
import { EventModal } from './components/EventModal';
import { EventPrintModal } from './components/EventPrintModal';
import { GlobalBudgetSummary } from './components/GlobalBudgetSummary';
import { GlobalBudgetPrintModal } from './components/GlobalBudgetPrintModal';
import { LibroSociPrintModal } from './components/LibroSociPrintModal';
import { EventsProgramPrintModal } from './components/EventsProgramPrintModal';
import { MemberSheetPrintModal } from './components/MemberSheetPrintModal';
import { DonazioniTerziView } from './components/DonazioniTerziView';
import { CestinoSistemaView } from './components/CestinoSistemaView';
import { PublicWebsitePortal } from './components/PublicWebsitePortal';
import { WebsiteEditor } from './components/WebsiteEditor';
import { DashboardView } from './components/DashboardView';
import { GiornalinoEditor } from './components/GiornalinoEditor';
import { GiornalinoArchiveDashboard } from './components/GiornalinoArchiveDashboard';
import { MemberPortalView } from './components/MemberPortalView';
import { ComunicazioniNewsletterView } from './components/ComunicazioniNewsletterView';
import { FullscreenFloatingControls } from './components/FullscreenFloatingControls';
import { useFullscreen } from './hooks/useFullscreen';
import { Award, ShieldCheck, Heart, Sparkles, PartyPopper, Printer, Mail } from 'lucide-react';

export default function App() {
  const { isFullscreen, toggleFullscreen, enterFullscreen } = useFullscreen();

  // Prima di inizializzare lo stato, applica l'eventuale payload sincronizzato nel link del Portale Soci
  const [initialUrlSync] = useState(() => applyUrlPortalSync());

  const [config, setConfig] = useState<ProLocoInfo>(() => initialUrlSync.configSincronizzata || loadProLocoConfig());
  const [soci, setSoci] = useState<Socio[]>(() => loadSoci());
  const [eventi, setEventi] = useState<ProLocoEvento[]>(() => loadEventi());
  const [donazioni, setDonazioni] = useState<DonazioneTerzi[]>(() => loadDonazioni());
  const [cestino, setCestino] = useState<ElementoCestino[]>(() => loadCestino());
  const [paginaAttiva, setPaginaAttiva] = useState<PaginaPrincipale>('dashboard');
  const [tabGestionale, setTabGestionale] = useState<SottoTabGestionale>('soci');
  const [sitoConfig, setSitoConfig] = useState<SitoWebConfig>(() => loadSitoWebConfig());
  const [giornalinoConfig, setGiornalinoConfig] = useState<GiornalinoConfig>(() => loadGiornalinoConfig());
  const [archivioGiornalini, setArchivioGiornalini] = useState<EdizioneGiornalino[]>(() => loadArchivioGiornalini());
  const [giornalinoAttivoId, setGiornalinoAttivoId] = useState<string>(() => loadGiornalinoAttivoId());
  const [tabGiornalinoAttivo, setTabGiornalinoAttivo] = useState<'studio' | 'articoli' | 'sponsor' | 'paginazione' | 'testata' | 'anteprima'>('studio');
  const [tabEditorSitoAttivo, setTabEditorSitoAttivo] = useState<'generale' | 'sezioni' | 'avvisi' | 'territorio' | 'aspetto' | 'sicurezza'>('generale');
  const [vistaEditorForzata, setVistaEditorForzata] = useState<boolean>(false);

  // Il gestionale si posiziona in automatico sempre sull'anno di riferimento in base al sistema del PC o al link sincronizzato
  const [annoSelezionato, setAnnoSelezionato] = useState<number>(() => {
    return initialUrlSync.annoSincronizzato || new Date().getFullYear();
  });

  // Stati per Modali Soci
  const [socioModale, setSocioModale] = useState<Socio | null | 'nuovo'>(null);
  const [socioTessera, setSocioTessera] = useState<Socio | null>(null);
  const [socioQuote, setSocioQuote] = useState<Socio | null>(null);
  const [socioPrivacy, setSocioPrivacy] = useState<Socio | null>(null);
  const [socioSchedaStampa, setSocioSchedaStampa] = useState<Socio | null>(null);
  const [socioLinkPortale, setSocioLinkPortale] = useState<Socio | null>(null);
  const [ricevutaAttiva, setRicevutaAttiva] = useState<{ socio: Socio; quota: QuotaAssociativa } | null>(null);
  const [mostraImpostazioni, setMostraImpostazioni] = useState<boolean>(false);
  const [mostraApkModal, setMostraApkModal] = useState<boolean>(false);

  // Stati per Modali Eventi e Bilancio e Stampe A4
  const [eventoModale, setEventoModale] = useState<ProLocoEvento | null | 'nuovo'>(null);
  const [eventoModaleStep, setEventoModaleStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [eventoStampa, setEventoStampa] = useState<ProLocoEvento | null>(null);
  const [mostraStampaBilancio, setMostraStampaBilancio] = useState<boolean>(false);
  const [mostraStampaLibroSoci, setMostraStampaLibroSoci] = useState<boolean>(false);
  const [mostraStampaProgrammaEventi, setMostraStampaProgrammaEventi] = useState<boolean>(false);

  // Sincronizzazione continua automatica con riconnessione exponential backoff (5s, 10s, 30s) e riallineamento post-riavvio del server
  useEffect(() => {
    let active = true;
    let isSyncing = false;
    let retryAttempt = 0;
    const backoffIntervalsMs = [5000, 10000, 30000];
    let syncTimerId: number | null = null;
    let sse: EventSource | null = null;

    const aggiornaStatiSeCambiati = (configOverride?: ProLocoInfo | null) => {
      const nuoviSoci = loadSoci();
      const nuovaConfig = configOverride || loadProLocoConfig();
      const nuoviEventi = loadEventi();
      const nuoveDonazioni = loadDonazioni();
      const nuovoCestino = loadCestino();
      const nuovaSitoConfig = loadSitoWebConfig();
      const nuovoArchivio = loadArchivioGiornalini();
      const nuovaGiornalinoConfig = loadGiornalinoConfig();
      const nuovoGiornalinoId = loadGiornalinoAttivoId();

      setSoci(prev => (JSON.stringify(prev) === JSON.stringify(nuoviSoci) ? prev : nuoviSoci));
      setConfig(prev => (JSON.stringify(prev) === JSON.stringify(nuovaConfig) ? prev : nuovaConfig));
      setEventi(prev => (JSON.stringify(prev) === JSON.stringify(nuoviEventi) ? prev : nuoviEventi));
      setDonazioni(prev => (JSON.stringify(prev) === JSON.stringify(nuoveDonazioni) ? prev : nuoveDonazioni));
      setCestino(prev => (JSON.stringify(prev) === JSON.stringify(nuovoCestino) ? prev : nuovoCestino));
      setSitoConfig(prev => (JSON.stringify(prev) === JSON.stringify(nuovaSitoConfig) ? prev : nuovaSitoConfig));
      setArchivioGiornalini(prev => (JSON.stringify(prev) === JSON.stringify(nuovoArchivio) ? prev : nuovoArchivio));
      setGiornalinoConfig(prev => (JSON.stringify(prev) === JSON.stringify(nuovaGiornalinoConfig) ? prev : nuovaGiornalinoConfig));
      setGiornalinoAttivoId(prev => (prev === nuovoGiornalinoId ? prev : nuovoGiornalinoId));
    };

    const scheduleNextSync = (wasSuccess: boolean) => {
      if (!active) return;
      if (syncTimerId !== null) {
        window.clearTimeout(syncTimerId);
        syncTimerId = null;
      }
      let nextDelay = 3000;
      if (wasSuccess) {
        retryAttempt = 0;
        nextDelay = 3000;
      } else {
        const idx = Math.min(retryAttempt, backoffIntervalsMs.length - 1);
        nextDelay = backoffIntervalsMs[idx];
        retryAttempt++;
      }
      syncTimerId = window.setTimeout(() => {
        sincronizzaDalServer();
      }, nextDelay);
    };

    const connectSseStream = () => {
      if (!active || typeof EventSource === 'undefined') return;
      if (sse && sse.readyState !== EventSource.CLOSED) return;
      try {
        sse = new EventSource('/api/v2/stream');
        sse.onmessage = ev => {
          try {
            const payload = JSON.parse(ev.data || '{}');
            if (payload && (payload.type === 'db_update' || payload.type === 'connected')) {
              retryAttempt = 0;
              sincronizzaDalServer();
            }
          } catch {
            // ignore
          }
        };
        sse.onerror = () => {
          try {
            sse?.close();
          } catch {
            // ignore
          }
          sse = null;
        };
      } catch {
        // ignore
      }
    };

    const sincronizzaDalServer = async () => {
      if (isSyncing || !active) return;
      isSyncing = true;
      try {
        const db = await fetchDatabaseFromServer();
        if (!active) return;
        if (db) {
          const urlSync = db.azzerato === true ? { configSincronizzata: null } : applyUrlPortalSync();
          aggiornaStatiSeCambiati(urlSync.configSincronizzata);
          connectSseStream();
          scheduleNextSync(true);
        } else {
          aggiornaStatiSeCambiati();
          scheduleNextSync(false);
        }
      } finally {
        isSyncing = false;
      }
    };

    sincronizzaDalServer();
    connectSseStream();

    const handleStorageChange = () => {
      if (!active) return;
      aggiornaStatiSeCambiati();
    };

    const handleWindowFocusOrOnline = () => {
      retryAttempt = 0;
      sincronizzaDalServer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        retryAttempt = 0;
        sincronizzaDalServer();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocusOrOnline);
    window.addEventListener('online', handleWindowFocusOrOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      if (syncTimerId !== null) {
        window.clearTimeout(syncTimerId);
      }
      if (sse) {
        try {
          sse.close();
        } catch {
          // ignore
        }
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocusOrOnline);
      window.removeEventListener('online', handleWindowFocusOrOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // All'avvio il gestionale si apre sempre dalla Dashboard generale (a meno che non sia stato aperto un link diretto con parametri URL specifici di tessera socio)
  useEffect(() => {
    const urlSync = applyUrlPortalSync();
    if (urlSync.socioSincronizzato) {
      setSoci(loadSoci());
    }
    const params = new URLSearchParams(window.location.search);
    const isAreaSoci =
      Boolean(params.get('area_soci')) ||
      Boolean(params.get('portale_soci')) ||
      params.get('portale') === 'soci' ||
      Boolean(params.get('blocco_socio')) ||
      Boolean(params.get('sync_socio'));
    const tesseraParam = params.get('s') || params.get('tessera') || params.get('cf') || params.get('barcode');
    
    if (isAreaSoci || tesseraParam) {
      saveBloccoPortaleSocio(true);
      setPaginaAttiva('portale_soci');
      const pinParam = (params.get('pin') || params.get('p') || params.get('pk') || '').trim();
      const existingSession = loadSessioneSocioId();
      if (tesseraParam && !pinParam && !existingSession && !isTesseraSbloccataInSessione(tesseraParam)) {
        // All'apertura iniziale del link richiede lo sblocco tramite combinazione Numero Tessera + PIN
        saveSessioneSocioId(null);
      }
    } else {
      saveBloccoPortaleSocio(false);
      setPaginaAttiva('dashboard');
    }
  }, []);

  // Handler salvataggio socio (creazione o modifica)
  const handleSalvaSocio = (socioAggiornato: Socio) => {
    let nuovaLista: Socio[];
    const esiste = soci.some(s => s.id === socioAggiornato.id);
    if (esiste) {
      nuovaLista = soci.map(s => s.id === socioAggiornato.id ? socioAggiornato : s);
    } else {
      nuovaLista = [socioAggiornato, ...soci];
    }
    setSoci(nuovaLista);
    saveSoci(nuovaLista);
    setSocioModale(null);

    // Se stiamo visualizzando la tessera, quote o link di questo socio, aggiorna lo stato
    if (socioTessera?.id === socioAggiornato.id) setSocioTessera(socioAggiornato);
    if (socioQuote?.id === socioAggiornato.id) setSocioQuote(socioAggiornato);
    if (socioLinkPortale?.id === socioAggiornato.id) setSocioLinkPortale(socioAggiornato);
  };

  // Handler eliminazione socio (con tracciamento nel Cestino di Sistema)
  const handleEliminaSocio = (socioId: string) => {
    const target = soci.find(s => s.id === socioId);
    if (target) {
      aggiungiAlCestino({
        id: `cestino-socio-${target.id}`,
        entitaId: target.id,
        tipoEntita: 'socio',
        titolo: `${target.cognome} ${target.nome} (Tessera ${target.numeroTessera})`,
        sottotitolo: `Codice Fiscale: ${target.codiceFiscale} • Iscrizione: ${target.dataIscrizione}`,
        dataEliminazione: new Date().toISOString().split('T')[0],
        oraEliminazione: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        motivo: 'Rimozione socio dal registro attivo (Albo Soci)',
        eliminatoDa: `${config.nomePresidente || 'Presidente'} / Segreteria`,
        datiOriginali: target
      });
      setCestino(loadCestino());
    }
    const nuovaLista = soci.filter(s => s.id !== socioId);
    setSoci(nuovaLista);
    saveSoci(nuovaLista);
  };

  // Handler salvataggio quote associative del socio
  const handleSalvaQuote = (socioId: string, nuoveQuote: QuotaAssociativa[]) => {
    const nuovaLista = soci.map(s => {
      if (s.id === socioId) {
        return { ...s, quote: nuoveQuote };
      }
      return s;
    });
    setSoci(nuovaLista);
    saveSoci(nuovaLista);

    // Aggiorna anche il socio attivo nelle modali collegate
    const socioAggiornato = nuovaLista.find(s => s.id === socioId);
    if (socioAggiornato) {
      setSocioQuote(socioAggiornato);
      if (socioTessera?.id === socioId) {
        setSocioTessera(socioAggiornato);
      }
      if (socioLinkPortale?.id === socioId) {
        setSocioLinkPortale(socioAggiornato);
      }
    }
  };

  // Handler Gestione Eventi (Salvataggio ed Eliminazione)
  const handleSalvaEvento = (eventoAggiornato: ProLocoEvento) => {
    let nuovaLista: ProLocoEvento[];
    const esiste = eventi.some(e => e.id === eventoAggiornato.id);
    if (esiste) {
      nuovaLista = eventi.map(e => e.id === eventoAggiornato.id ? eventoAggiornato : e);
    } else {
      nuovaLista = [eventoAggiornato, ...eventi];
    }
    setEventi(nuovaLista);
    saveEventi(nuovaLista);
    setEventoModale(null);
  };

  // Handler eliminazione evento (con tracciamento nel Cestino di Sistema)
  const handleEliminaEvento = (eventoId: string) => {
    const target = eventi.find(e => e.id === eventoId);
    if (target) {
      aggiungiAlCestino({
        id: `cestino-evento-${target.id}`,
        entitaId: target.id,
        tipoEntita: 'evento',
        titolo: target.titolo,
        sottotitolo: `${target.luogo} • Data: ${target.dataInizio} • ${target.categoria}`,
        importo: target.entrateRealizzate || target.budgetPrevisto,
        dataEliminazione: new Date().toISOString().split('T')[0],
        oraEliminazione: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        motivo: 'Cancellazione evento dal calendario istituzionale',
        eliminatoDa: `${config.nomePresidente || 'Presidente'} / Direttivo`,
        datiOriginali: target
      });
      setCestino(loadCestino());
    }
    const nuovaLista = eventi.filter(e => e.id !== eventoId);
    setEventi(nuovaLista);
    saveEventi(nuovaLista);
  };

  // Handler gestione Cestino di Sistema (Audit Trail ex Punto 1.4)
  const handleRipristinaDaCestino = (item: ElementoCestino) => {
    if (item.tipoEntita === 'donazione') {
      const idDon = item.entitaId;
      const nuovaLista = donazioni.map(d => {
        if (d.id === idDon) {
          const { stato, motivoAnnullamento, dataAnnullamento, annullatoDa, ...resto } = d;
          return { ...resto, stato: 'attiva' as const };
        }
        return d;
      });
      setDonazioni(nuovaLista);
      saveDonazioni(nuovaLista);
    } else if (item.tipoEntita === 'socio') {
      const socioOriginale = item.datiOriginali as Socio;
      if (socioOriginale && !soci.some(s => s.id === socioOriginale.id)) {
        const nuovaLista = [socioOriginale, ...soci];
        setSoci(nuovaLista);
        saveSoci(nuovaLista);
      }
    } else if (item.tipoEntita === 'evento') {
      const eventoOriginale = item.datiOriginali as ProLocoEvento;
      if (eventoOriginale && !eventi.some(e => e.id === eventoOriginale.id)) {
        const nuovaLista = [eventoOriginale, ...eventi];
        setEventi(nuovaLista);
        saveEventi(nuovaLista);
      }
    }
    rimuoviDalCestino(item.id);
    setCestino(loadCestino());
  };

  const handleEliminaDefinitivoCestino = (id: string) => {
    rimuoviDalCestino(id);
    setCestino(loadCestino());
  };

  const handleSvuotaCestino = () => {
    svuotaCestino();
    setCestino([]);
  };

  // Handler salvataggio configurazione Pro Loco
  const handleSalvaConfig = (nuovaConfig: ProLocoInfo) => {
    setConfig(nuovaConfig);
    saveProLocoConfig(nuovaConfig);
  };

  // Gestione Donazioni Conto Terzi
  const handleSalvaDonazioni = (nuoveDonazioni: DonazioneTerzi[]) => {
    setDonazioni(nuoveDonazioni);
    saveDonazioni(nuoveDonazioni);
    setCestino(loadCestino());
  };

  // Ripristino dati di prova realistici (Soci, Eventi, Donazioni, Campagne, Sito, Giornalino, Comunicazioni)
  const handleRipristinaDemo = () => {
    setSoci(INITIAL_SOCI);
    saveSoci(INITIAL_SOCI);
    setEventi(INITIAL_EVENTI);
    saveEventi(INITIAL_EVENTI);
    setDonazioni(INITIAL_DONAZIONI);
    saveDonazioni(INITIAL_DONAZIONI);
    saveCampagneFondi(INITIAL_CAMPAGNE_FONDI);
    setConfig(DEFAULT_PRO_LOCO);
    saveProLocoConfig(DEFAULT_PRO_LOCO);
    setSitoConfig(DEFAULT_SITO_WEB_CONFIG);
    saveSitoWebConfig(DEFAULT_SITO_WEB_CONFIG);
    setArchivioGiornalini(INITIAL_ARCHIVIO_GIORNALINI);
    saveArchivioGiornalini(INITIAL_ARCHIVIO_GIORNALINI);
    if (INITIAL_ARCHIVIO_GIORNALINI.length > 0) {
      setGiornalinoAttivoId(INITIAL_ARCHIVIO_GIORNALINI[0].id);
      saveGiornalinoAttivoId(INITIAL_ARCHIVIO_GIORNALINI[0].id);
      setGiornalinoConfig(INITIAL_ARCHIVIO_GIORNALINI[0]);
      saveGiornalinoConfig(INITIAL_ARCHIVIO_GIORNALINI[0]);
    } else {
      setGiornalinoConfig(DEFAULT_GIORNALINO_CONFIG);
      saveGiornalinoConfig(DEFAULT_GIORNALINO_CONFIG);
    }
    saveComunicazioniSoci(INITIAL_COMUNICAZIONI_SOCI);
    setCestino(loadCestino());
    syncDatabaseToServer();
  };

  // Ripristino specifico dei 3 eventi simulati
  const handleRipristinaEventiSimulati = () => {
    const ripristinati = ripristinaEventiSimulati();
    setEventi(ripristinati);
  };

  // Azzeramento completo dell'intero database (Soci, Eventi, Quote, Donazioni, Campagne, Cestino, Giornalino, Comunicazioni, Sito Web)
  const handleAzzeraDatabase = () => {
    azzeraDatabase();
    const emptySito = getEmptySitoWebConfig();
    const emptyGiornalino = getEmptyGiornalinoConfig();

    setSoci([]);
    setEventi([]);
    setDonazioni([]);
    setCestino([]);
    setArchivioGiornalini([]);
    setGiornalinoAttivoId('');
    setGiornalinoConfig(emptyGiornalino);
    setSitoConfig(emptySito);

    setSocioModale(null);
    setSocioTessera(null);
    setSocioQuote(null);
    setSocioPrivacy(null);
    setSocioSchedaStampa(null);
    setSocioLinkPortale(null);
    setRicevutaAttiva(null);
    setEventoModale(null);
    setEventoStampa(null);
  };

  // Importazione backup JSON
  const handleImportaBackup = (dati: { 
    soci: Socio[]; 
    config: ProLocoInfo; 
    eventi?: ProLocoEvento[]; 
    donazioni?: DonazioneTerzi[];
    campagne?: CampagnaRaccoltaFondi[];
    sitoConfig?: SitoWebConfig;
    archivioGiornalini?: EdizioneGiornalino[];
    comunicazioni?: ComunicazioneSocio[];
  }) => {
    setSoci(dati.soci);
    saveSoci(dati.soci);
    if (dati.eventi && Array.isArray(dati.eventi)) {
      setEventi(dati.eventi);
      saveEventi(dati.eventi);
    }
    if (dati.donazioni && Array.isArray(dati.donazioni)) {
      setDonazioni(dati.donazioni);
      saveDonazioni(dati.donazioni);
    }
    if (dati.campagne && Array.isArray(dati.campagne)) {
      saveCampagneFondi(dati.campagne);
    }
    if (dati.sitoConfig) {
      setSitoConfig(dati.sitoConfig);
      saveSitoWebConfig(dati.sitoConfig);
    }
    if (dati.archivioGiornalini && Array.isArray(dati.archivioGiornalini)) {
      setArchivioGiornalini(dati.archivioGiornalini);
      saveArchivioGiornalini(dati.archivioGiornalini);
    }
    if (dati.comunicazioni && Array.isArray(dati.comunicazioni)) {
      saveComunicazioniSoci(dati.comunicazioni);
    }
    if (dati.config) {
      setConfig(dati.config);
      saveProLocoConfig(dati.config);
    }
    syncDatabaseToServer();
  };

  // Handlers Gestione e Pubblicazione Sito Web Pubblico
  const handleSalvaSitoConfig = (nuovaConfig: SitoWebConfig) => {
    setSitoConfig(nuovaConfig);
    saveSitoWebConfig(nuovaConfig);
    syncDatabaseToServer();
  };

  const handlePubblicaEBlinda = (nuovaConfig: SitoWebConfig) => {
    const dataPubblicazioneOggi = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const configBlindata: SitoWebConfig = {
      ...nuovaConfig,
      pubblicato: true,
      dataPubblicazione: dataPubblicazioneOggi,
      blindatoVisitatori: true,
    };

    setSitoConfig(configBlindata);
    saveSitoWebConfig(configBlindata);
    syncDatabaseToServer();
    setVistaEditorForzata(false);
  };

  const handleSalvaGiornalinoConfig = (nuovaConfig: GiornalinoConfig) => {
    setGiornalinoConfig(nuovaConfig);
    saveGiornalinoConfig(nuovaConfig);
    // Aggiorna anche l'archivio in memoria
    setArchivioGiornalini(loadArchivioGiornalini());
  };

  const handleSelezionaEdizioneGiornalino = (edizione: EdizioneGiornalino, apriEditor: boolean = false) => {
    setGiornalinoAttivoId(edizione.id);
    saveGiornalinoAttivoId(edizione.id);
    setGiornalinoConfig(edizione);
    saveGiornalinoConfig(edizione);
    if (apriEditor) {
      setPaginaAttiva('giornalino');
    }
  };

  const handleSalvaArchivioGiornalini = (nuovoArchivio: EdizioneGiornalino[], nuovoAttivoId?: string) => {
    setArchivioGiornalini(nuovoArchivio);
    saveArchivioGiornalini(nuovoArchivio);
    const idTarget = nuovoAttivoId || giornalinoAttivoId;
    if (nuovoAttivoId) {
      setGiornalinoAttivoId(nuovoAttivoId);
      saveGiornalinoAttivoId(nuovoAttivoId);
    }
    const attiva = nuovoArchivio.find(e => e.id === idTarget) || nuovoArchivio[0];
    if (attiva) {
      setGiornalinoConfig(attiva);
      saveGiornalinoConfig(attiva);
    }
  };

  const handleEliminaEdizioneGiornalino = (edizioneId: string) => {
    const res = eliminaEdizioneGiornalino(edizioneId);
    setArchivioGiornalini(res.nuovoArchivio);
    setGiornalinoAttivoId(res.nuovaAttiva.id);
    setGiornalinoConfig(res.nuovaAttiva);
  };

  const handleSbloccaAdmin = (pin: string): boolean => {
    const pinAtteso = sitoConfig.pinSbloccoAdmin || '1234';
    if (pin.trim() === pinAtteso.trim()) {
      const sbloccata: SitoWebConfig = {
        ...sitoConfig,
        blindatoVisitatori: false,
      };
      setSitoConfig(sbloccata);
      saveSitoWebConfig(sbloccata);
      setVistaEditorForzata(true);
      return true;
    }
    return false;
  };

  // 1. VISTA DASHBOARD GENERALE (Master Hub con 3 moduli: Gestionale, Sito Web, Giornalino)
  if (paginaAttiva === 'dashboard') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-[#f6f4ee]"
      >
        <DashboardView
          config={config}
          soci={soci}
          eventi={eventi}
          donazioni={donazioni}
          cestinoCount={cestino.length}
          sitoConfig={sitoConfig}
          giornalinoConfig={giornalinoConfig}
          archivioGiornalini={archivioGiornalini}
          annoSelezionato={annoSelezionato}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onNavigaPagina={(pagina, sottoTab, opzioni) => {
            setPaginaAttiva(pagina);
            if (pagina === 'sitoweb') {
              if (opzioni?.soloPubblico) {
                setVistaEditorForzata(false);
              } else {
                setVistaEditorForzata(true);
              }
              if (opzioni?.tabEditorSito) {
                setTabEditorSitoAttivo(opzioni.tabEditorSito);
              } else {
                setTabEditorSitoAttivo('generale');
              }
            }
            if (pagina === 'giornalino') {
              if (opzioni?.tabGiornalino) {
                setTabGiornalinoAttivo(opzioni.tabGiornalino);
              } else {
                setTabGiornalinoAttivo('studio');
              }
            }
            if (sottoTab) {
              setTabGestionale(sottoTab);
            }
          }}
          onCambiaAnno={setAnnoSelezionato}
          onApriImpostazioni={() => setMostraImpostazioni(true)}
          onApriApkModal={() => setMostraApkModal(true)}
          onImportaBackup={handleImportaBackup}
          onRipristinaDemo={handleRipristinaDemo}
          onAzzeraDatabase={handleAzzeraDatabase}
        />

        {/* Modale Impostazioni Associazione Pro Loco */}
        {mostraImpostazioni && (
          <SettingsModal
            config={config}
            onClose={() => setMostraImpostazioni(false)}
            onSalva={handleSalvaConfig}
          />
        )}

        {/* Modale App Android & Download File APK */}
        {mostraApkModal && (
          <ApkModal
            onClose={() => setMostraApkModal(false)}
          />
        )}

        {/* Controlli Fluttuanti Schermo Intero */}
        <FullscreenFloatingControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onEnterFullscreen={enterFullscreen}
        />
      </motion.div>
    );
  }

  // 2. VISTA SITO WEB: Editor Sito Web oppure Portale Pubblico Blindato
  if (paginaAttiva === 'sitoweb') {
    // Se il sito non è ancora blindato (o l'admin ha sbloccato l'accesso con PIN / forzato l'editor), entra nell'Editor dedicato
    if (!sitoConfig.blindatoVisitatori || vistaEditorForzata) {
      return (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.2 }}
          className="min-h-screen bg-[#f6f4ee]"
        >
          <WebsiteEditor
            config={config}
            soci={soci}
            eventi={eventi}
            sitoConfig={sitoConfig}
            tabIniziale={tabEditorSitoAttivo}
            onSalvaSitoConfig={handleSalvaSitoConfig}
            onPubblicaEBlinda={handlePubblicaEBlinda}
            onTornaAlGestionale={() => {
              setVistaEditorForzata(false);
              setPaginaAttiva('dashboard');
            }}
          />
          <FullscreenFloatingControls
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onEnterFullscreen={enterFullscreen}
          />
        </motion.div>
      );
    }

    // Modalità blindata per i visitatori: interfaccia pulita senza controlli amministrativi
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-[#f6f4ee]"
      >
        <PublicWebsitePortal
          config={config}
          soci={soci}
          eventi={eventi}
          sitoConfig={sitoConfig}
          isEditorPreview={false}
          onTornaAlGestionale={() => {
            setPaginaAttiva('dashboard');
          }}
          onApriEditor={() => {
            setVistaEditorForzata(true);
          }}
          onSbloccaAdmin={handleSbloccaAdmin}
          onNuovoSocioIscritto={(nuovoSocio) => {
            const nuovaLista = [nuovoSocio, ...soci];
            setSoci(nuovaLista);
            saveSoci(nuovaLista);
          }}
          onAggiornaEvento={handleSalvaEvento}
          onApriPortaleSoci={() => setPaginaAttiva('portale_soci')}
        />
        <FullscreenFloatingControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onEnterFullscreen={enterFullscreen}
        />
      </motion.div>
    );
  }

  // 3. VISTA ARCHIVIO DATI GIORNALINO (Dashboard catalogata per Anno e Data con pulsante di visione)
  if (paginaAttiva === 'archivio_giornalino') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-[#f6f4ee]"
      >
        <GiornalinoArchiveDashboard
          config={config}
          soci={soci}
          archivio={archivioGiornalini}
          edizioneAttivaId={giornalinoAttivoId}
          onSelezionaEdizione={(ed, apri) => handleSelezionaEdizioneGiornalino(ed, apri)}
          onSalvaArchivio={handleSalvaArchivioGiornalini}
          onEliminaEdizione={handleEliminaEdizioneGiornalino}
          onTornaDashboard={() => setPaginaAttiva('dashboard')}
          onApriEditorSuEdizione={(ed, tab = 'studio') => {
            handleSelezionaEdizioneGiornalino(ed, false);
            setTabGiornalinoAttivo(tab);
            setPaginaAttiva('giornalino');
          }}
        />
        <FullscreenFloatingControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onEnterFullscreen={enterFullscreen}
        />
      </motion.div>
    );
  }

  // 4. VISTA GIORNALINO DELLA PRO LOCO (Periodico & Stampa Ufficiale A4/PDF / Editor Menabò)
  if (paginaAttiva === 'giornalino') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-[#f6f4ee]"
      >
        <GiornalinoEditor
          config={config}
          eventi={eventi}
          giornalinoConfig={giornalinoConfig}
          archivioGiornalini={archivioGiornalini}
          giornalinoAttivoId={giornalinoAttivoId}
          tabIniziale={tabGiornalinoAttivo}
          onSalva={handleSalvaGiornalinoConfig}
          onUpdateArchivioGiornalini={handleSalvaArchivioGiornalini}
          onEliminaEdizioneGiornalino={handleEliminaEdizioneGiornalino}
          onTornaDashboard={() => setPaginaAttiva('dashboard')}
          onVaiAllArchivio={() => setPaginaAttiva('archivio_giornalino')}
        />
        <FullscreenFloatingControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onEnterFullscreen={enterFullscreen}
        />
      </motion.div>
    );
  }

  // 5. VISTA PORTALE DEI SOCI (Area Riservata Web: Autenticazione, Anagrafica, Tessere, Quote e Bacheca Avvisi)
  if (paginaAttiva === 'portale_soci') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-[#f6f4ee]"
      >
        <MemberPortalView
          config={config}
          soci={soci}
          eventi={eventi}
          annoSelezionato={annoSelezionato}
          onAggiornaSocio={handleSalvaSocio}
          onAggiornaEvento={handleSalvaEvento}
          onTornaAlSito={() => {
            saveBloccoPortaleSocio(false);
            setPaginaAttiva('sitoweb');
          }}
          onVaiAlGestionale={() => {
            saveBloccoPortaleSocio(false);
            setPaginaAttiva('dashboard');
          }}
        />
        <FullscreenFloatingControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onEnterFullscreen={enterFullscreen}
        />
      </motion.div>
    );
  }

  // 4. VISTA GESTIONALE: Albo & Libro Soci (1.1), Calendario Eventi (1.2), Bilancio Generale (1.3)
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f6f4ee] text-stone-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Intestazione Principale del Gestionale con Navigazione a Schede e Azioni */}
      <Header
        config={config}
        soci={soci}
        eventi={eventi}
        donazioni={donazioni}
        cestinoCount={cestino.length}
        sitoConfig={sitoConfig}
        tabAttivo={tabGestionale}
        annoSelezionato={annoSelezionato}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onCambiaTab={(tab) => {
          if (tab === 'portale') {
            setVistaEditorForzata(true);
            setPaginaAttiva('sitoweb');
          } else {
            setTabGestionale(tab);
          }
        }}
        onCambiaAnno={setAnnoSelezionato}
        onTornaDashboard={() => setPaginaAttiva('dashboard')}
        onVaiGiornalino={() => setPaginaAttiva('archivio_giornalino')}
        onNuovoSocio={() => setSocioModale('nuovo')}
        onNuovoEvento={() => setEventoModale('nuovo')}
        onApriImpostazioni={() => setMostraImpostazioni(true)}
        onApriApkModal={() => setMostraApkModal(true)}
        onImportaBackup={handleImportaBackup}
        onRipristinaDemo={handleRipristinaDemo}
        onAzzeraDatabase={handleAzzeraDatabase}
        onApriStampaBilancio={() => setMostraStampaBilancio(true)}
        onApriStampaLibroSoci={() => setMostraStampaLibroSoci(true)}
        onApriStampaProgrammaEventi={() => setMostraStampaProgrammaEventi(true)}
        onVaiPortaleSoci={() => setPaginaAttiva('portale_soci')}
      />

      {/* Contenuto Principale Dinamico a seconda del Tab Attivo del Gestionale */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${
        isFullscreen ? 'max-w-[1680px]' : 'max-w-7xl'
      }`}>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={tabGestionale}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {tabGestionale === 'soci' ? (
              /* SEZIONE 1: GESTIONE SOCI & TESSERAMENTO */
              <>
                {/* Banner Istituzionale e Motto Pro Loco */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/40 relative overflow-hidden no-print">
                  <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-700/60 text-emerald-100 border border-emerald-500/30">
                        Albo Soci Ufficiale
                      </span>
                      <span className="text-xs text-emerald-200/90 font-medium">
                        Anno Sociale {annoSelezionato}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Gestione Tesseramento & Registro Quote Associative
                    </h2>
                    <p className="text-xs text-emerald-100/80 max-w-2xl font-normal italic">
                      «{config.motto || 'Promozione del patrimonio culturale, tutela delle tradizioni e animazione del territorio.'}»
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 relative z-10">
                    <span
                      className="px-2.5 py-2 rounded-xl bg-emerald-800/80 text-emerald-100 text-xs font-mono font-bold border border-emerald-500/40 shadow-2xs select-none"
                      title="Versione aggiornamento del Gestionale (compatibile con tutte le versioni APK)"
                    >
                      v{GESTIONALE_VERSION}
                    </span>
                    <button
                      id="btn-comunicazioni-newsletter-banner"
                      onClick={() => setTabGestionale('comunicazioni')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold border border-indigo-400/40 shadow-2xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                      title="Invia Comunicazioni, Convocazioni e Newsletter via Email ai Soci"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Invia Comunicazioni & Newsletter</span>
                    </button>
                    <button
                      id="btn-stampa-libro-soci-banner"
                      onClick={() => setMostraStampaLibroSoci(true)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 shadow-2xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                      title="Stampa Ufficiale Libro dei Soci A4"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Stampa Libro Soci</span>
                    </button>
                    <button
                      onClick={() => setSocioModale('nuovo')}
                      className="px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold shadow-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      Iscrivi Nuovo Socio
                    </button>
                  </div>
                </div>

                {/* Barra Metriche e Statistiche di Cassa per l'anno sociale */}
                <StatsBar
                  soci={soci}
                  annoSelezionato={annoSelezionato}
                  config={config}
                />

                {/* Elenco Soci con Ricerca, Filtri Avanzati e Tesseramento Digitale */}
                <MemberList
                  soci={soci}
                  annoSelezionato={annoSelezionato}
                  config={config}
                  onVisualizzaTessera={(socio) => setSocioTessera(socio)}
                  onGestisciQuote={(socio) => setSocioQuote(socio)}
                  onModificaSocio={(socio) => setSocioModale(socio)}
                  onEliminaSocio={handleEliminaSocio}
                  onNuovoSocio={() => setSocioModale('nuovo')}
                  onStampaPrivacy={(socio) => setSocioPrivacy(socio)}
                  onStampaLibroSoci={() => setMostraStampaLibroSoci(true)}
                  onVisualizzaRicevuta={(socio, quota) => setRicevutaAttiva({ socio, quota })}
                  onStampaSchedaSocio={(socio) => setSocioSchedaStampa(socio)}
                  onInviaLinkPortale={(socio) => setSocioLinkPortale(socio)}
                />
              </>
            ) : tabGestionale === 'eventi' ? (
              /* SEZIONE 2: GESTIONE EVENTI CON DATABASE */
              <>
                {/* Banner Modulo Eventi */}
                <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-700/40 no-print">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-800/80 text-teal-100 border border-teal-500/30">
                        Calendario Iniziative Territoriali
                      </span>
                      <span className="text-xs text-teal-200">
                        Anno di Programmazione {annoSelezionato}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Gestione Sagre, Rassegne, Feste & Manifestazioni
                    </h2>
                    <p className="text-xs text-slate-300 max-w-2xl font-normal">
                      Pianificazione eventi con monitoraggio permessi (Comune, SIAE, ASL, Safety), bilancio economico e assegnazione soci volontari.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="btn-stampa-calendario-banner"
                      onClick={() => setMostraStampaProgrammaEventi(true)}
                      className="px-3 py-2 rounded-xl bg-teal-800/60 hover:bg-teal-800 text-teal-50 text-xs font-bold border border-teal-500/40 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Stampa Calendario & Programma Eventi A4"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-200" />
                      <span>Stampa Calendario A4</span>
                    </button>
                    <button
                      id="btn-programma-evento-banner"
                      onClick={() => setEventoModale('nuovo')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black tracking-wide shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <PartyPopper className="w-3.5 h-3.5" />
                      Pianifica Nuovo Evento
                    </button>
                  </div>
                </div>

                {/* Dashboard e Lista Eventi */}
                <EventList
                  eventi={eventi}
                  soci={soci}
                  config={config}
                  annoSelezionato={annoSelezionato}
                  onNuovoEvento={(step = 1) => {
                    setEventoModaleStep(step);
                    setEventoModale('nuovo');
                  }}
                  onModificaEvento={(evento, step = 1) => {
                    setEventoModaleStep(step);
                    setEventoModale(evento);
                  }}
                  onEliminaEvento={handleEliminaEvento}
                  onStampaEvento={(evento) => setEventoStampa(evento)}
                  onAggiornaEvento={handleSalvaEvento}
                  onStampaProgrammaEventi={() => setMostraStampaProgrammaEventi(true)}
                  onRipristinaSimulazione={handleRipristinaEventiSimulati}
                />
              </>
            ) : tabGestionale === 'conto_terzi' ? (
              /* SEZIONE 1.4: DONAZIONI CONTO TERZI & RACCOLTA FONDI */
              <DonazioniTerziView
                donazioni={donazioni}
                annoSelezionato={annoSelezionato}
                config={config}
                onAggiornaDonazioni={(nuove) => {
                  handleSalvaDonazioni(nuove);
                  setCestino(loadCestino());
                }}
                onApriCestino={() => setTabGestionale('cestino')}
              />
            ) : tabGestionale === 'comunicazioni' ? (
              /* SEZIONE 1.5: COMUNICAZIONI, CIRCOLARI & NEWSLETTER SOCI */
              <ComunicazioniNewsletterView
                soci={soci}
                config={config}
                annoSelezionato={annoSelezionato}
                archivioGiornalini={archivioGiornalini}
                onVaiASocio={(socio) => {
                  setTabGestionale('soci');
                  setSocioTessera(socio);
                }}
              />
            ) : tabGestionale === 'cestino' ? (
              /* SEZIONE 1.6: CESTINO DI SISTEMA & AUDIT LOG STORICO */
              <CestinoSistemaView
                elementi={cestino}
                config={config}
                onRipristinaElemento={handleRipristinaDaCestino}
                onEliminaDefinitivo={handleEliminaDefinitivoCestino}
                onSvuotaCestino={handleSvuotaCestino}
                onTornaGestionale={() => setTabGestionale('conto_terzi')}
              />
            ) : (
              /* SEZIONE 1.3: BILANCIO GENERALE TERZO SETTORE */
              <GlobalBudgetSummary
                soci={soci}
                eventi={eventi}
                config={config}
                annoSelezionato={annoSelezionato}
                donazioni={donazioni}
                onSalvaDonazione={(donazione) => {
                  const esiste = donazioni.some(d => d.id === donazione.id);
                  const nuove = esiste 
                    ? donazioni.map(d => d.id === donazione.id ? donazione : d) 
                    : [donazione, ...donazioni];
                  setDonazioni(nuove);
                  saveDonazioni(nuove);
                }}
                onEliminaDonazione={(id) => {
                  const nuove = donazioni.filter(d => d.id !== id);
                  setDonazioni(nuove);
                  saveDonazioni(nuove);
                }}
                onCambiaAnno={setAnnoSelezionato}
                onApriStampaBilancio={() => setMostraStampaBilancio(true)}
                onVaiASocio={(socioId) => {
                  const s = soci.find(item => item.id === socioId);
                  if (s) {
                    setTabGestionale('soci');
                    setSocioTessera(s);
                  }
                }}
                onVaiAEvento={(eventoId) => {
                  const e = eventi.find(item => item.id === eventoId);
                  if (e) {
                    setTabGestionale('eventi');
                    setEventoModale(e);
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Footer Istituzionale */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-700">{config.nome}</span>
            <span>•</span>
            <span>{config.comune} ({config.provincia})</span>
          </div>

          <div className="flex items-center gap-3 text-[11.5px]">
            <span>Database Unificato: Soci, Tessere, Bilancio ed Eventi</span>
            <span>•</span>
            <span className="text-slate-400">Salvataggio Locale Persistente</span>
          </div>
        </div>
      </footer>

      {/* MODALI APPLICATIVE */}
      
      {/* 1. Modale Aggiunta / Modifica Socio */}
      {socioModale && (
        <MemberModal
          socio={socioModale === 'nuovo' ? null : socioModale}
          soci={soci}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setSocioModale(null)}
          onSalva={handleSalvaSocio}
        />
      )}

      {/* 2. Modale Tessera Digitale del Socio */}
      {socioTessera && (
        <DigitalCardModal
          socio={
            soci.find(
              s =>
                s.id === socioTessera.id ||
                s.numeroTessera.trim().toUpperCase() === socioTessera.numeroTessera.trim().toUpperCase()
            ) || socioTessera
          }
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setSocioTessera(null)}
          onRinnovaQuota={(socio) => {
            setSocioTessera(null);
            setSocioQuote(soci.find(s => s.id === socio.id) || socio);
          }}
          onApriSchedaSocio={(socio) => {
            setSocioSchedaStampa(soci.find(s => s.id === socio.id) || socio);
          }}
          onInviaLinkPortale={(socio) => {
            setSocioTessera(null);
            setSocioLinkPortale(soci.find(s => s.id === socio.id) || socio);
          }}
        />
      )}

      {/* 3. Modale Registro Quote e Pagamenti */}
      {socioQuote && (
        <PaymentModal
          socio={soci.find(s => s.id === socioQuote.id) || socioQuote}
          soci={soci}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setSocioQuote(null)}
          onSalvaQuote={handleSalvaQuote}
          onVisualizzaRicevuta={(socio, quota) => {
            setRicevutaAttiva({ socio: soci.find(s => s.id === socio.id) || socio, quota });
          }}
        />
      )}

      {/* 4. Modale Ricevuta Ufficiale Quota Sociale */}
      {ricevutaAttiva && (
        <ReceiptModal
          socio={ricevutaAttiva.socio}
          quota={ricevutaAttiva.quota}
          config={config}
          onClose={() => setRicevutaAttiva(null)}
        />
      )}

      {/* 5. Modale Impostazioni Associazione Pro Loco */}
      {mostraImpostazioni && (
        <SettingsModal
          config={config}
          onClose={() => setMostraImpostazioni(false)}
          onSalva={handleSalvaConfig}
        />
      )}

      {/* 6. Modale Delibera Trattamento Dati Personali (GDPR) */}
      {socioPrivacy && (
        <PrivacyConsentModal
          socio={socioPrivacy}
          config={config}
          onClose={() => setSocioPrivacy(null)}
        />
      )}

      {/* 7. Modale App Android & Download File APK */}
      {mostraApkModal && (
        <ApkModal
          onClose={() => setMostraApkModal(false)}
        />
      )}

      {/* 8. Modale Creazione / Modifica Evento Pro Loco */}
      {eventoModale && (
        <EventModal
          evento={eventoModale === 'nuovo' ? null : eventoModale}
          soci={soci}
          annoPredefinito={annoSelezionato}
          stepIniziale={eventoModaleStep}
          onSalva={handleSalvaEvento}
          onClose={() => {
            setEventoModale(null);
            setEventoModaleStep(1);
          }}
        />
      )}

      {/* 9. Modale Stampa Scheda Tecnica & Circolare Evento A4 */}
      {eventoStampa && (
        <EventPrintModal
          evento={eventoStampa}
          config={config}
          soci={soci}
          onClose={() => setEventoStampa(null)}
        />
      )}

      {/* 10. Modale Stampa Ufficiale Bilancio Completo A4 (RUNTS / Assemblea) */}
      {mostraStampaBilancio && (
        <GlobalBudgetPrintModal
          soci={soci}
          eventi={eventi}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setMostraStampaBilancio(false)}
        />
      )}

      {/* 11. Modale Stampa Ufficiale Libro dei Soci A4 */}
      {mostraStampaLibroSoci && (
        <LibroSociPrintModal
          soci={soci}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setMostraStampaLibroSoci(false)}
        />
      )}

      {/* 12. Modale Stampa Ufficiale Calendario / Programma Eventi A4 */}
      {mostraStampaProgrammaEventi && (
        <EventsProgramPrintModal
          eventi={eventi}
          soci={soci}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setMostraStampaProgrammaEventi(false)}
        />
      )}

      {/* 13. Modale Stampa Scheda Socio A4 / PDF */}
      {socioSchedaStampa && (
        <MemberSheetPrintModal
          socio={socioSchedaStampa}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setSocioSchedaStampa(null)}
        />
      )}

      {/* 14. Modale Invio Link Portale Web dei Soci */}
      {socioLinkPortale && (
        <SendMemberPortalLinkModal
          socio={soci.find(s => s.id === socioLinkPortale.id) || socioLinkPortale}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setSocioLinkPortale(null)}
          onApriPortaleComeSocio={() => {
            setSocioLinkPortale(null);
            setSocioTessera(null);
            setPaginaAttiva('portale_soci');
          }}
        />
      )}

      {/* Controlli Fluttuanti Schermo Intero */}
      <FullscreenFloatingControls
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onEnterFullscreen={enterFullscreen}
      />

    </div>
  );
}

