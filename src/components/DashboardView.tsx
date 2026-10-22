import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ProLocoInfo, 
  Socio, 
  ProLocoEvento, 
  SitoWebConfig, 
  GiornalinoConfig, 
  PaginaPrincipale, 
  SottoTabGestionale, 
  EdizioneGiornalino, 
  DonazioneTerzi,
  CampagnaRaccoltaFondi,
  ComunicazioneSocio
} from '../types';
import { 
  Building2, 
  Calendar, 
  Settings, 
  Smartphone, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Award, 
  Globe, 
  Newspaper, 
  FolderKanban, 
  Users, 
  PartyPopper, 
  Landmark, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  FileText, 
  PenTool, 
  Printer, 
  Lock, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  X,
  Eye,
  Layers,
  Send,
  Bell,
  Palette,
  Compass,
  Database,
  Archive,
  HeartHandshake,
  Maximize2,
  Minimize2,
  KeyRound,
  Megaphone,
  UserCheck
} from 'lucide-react';
import {
  esportaLibroSociCSV,
  esportaBackupJSON,
  esportaBilancioCompletoCSV,
  esportaCodiceSitoHTML,
  loadDonazioni,
  normalizzaBackupCompat,
  GESTIONALE_VERSION,
  getServerSyncStatus,
  NETWORK_STATUS_EVENT,
  ServerSyncStatusInfo,
  fetchDatabaseFromServer,
  syncDatabaseToServer,
  hasPendingServerSync
} from '../storage';
import { calcolaRiepilogoQuoteSoci } from '../utils/quoteHelpers';
import { aggregaEventiPerBilancio } from '../utils/eventoHelpers';
import { DashboardAnalyticsSection } from './DashboardAnalyticsSection';
import { ServerOfficeMenu } from './ServerOfficeMenu';

interface DashboardViewProps {
  config: ProLocoInfo;
  soci: Socio[];
  eventi: ProLocoEvento[];
  sitoConfig: SitoWebConfig;
  giornalinoConfig: GiornalinoConfig;
  archivioGiornalini?: EdizioneGiornalino[];
  annoSelezionato: number;
  donazioni?: DonazioneTerzi[];
  cestinoCount?: number;
  onNavigaPagina: (
    pagina: PaginaPrincipale, 
    sottoTab?: SottoTabGestionale, 
    opzioni?: { 
      forzatureEditor?: boolean; 
      soloPubblico?: boolean; 
      tabGiornalino?: 'studio' | 'articoli' | 'sponsor' | 'paginazione' | 'testata' | 'anteprima';
      tabEditorSito?: 'generale' | 'sezioni' | 'avvisi' | 'territorio' | 'aspetto' | 'sicurezza';
    }
  ) => void;
  onCambiaAnno: (anno: number) => void;
  onApriImpostazioni: () => void;
  onApriApkModal: () => void;
  onImportaBackup: (dati: { 
    soci: Socio[]; 
    config: ProLocoInfo; 
    eventi?: ProLocoEvento[]; 
    donazioni?: DonazioneTerzi[];
    campagne?: CampagnaRaccoltaFondi[];
    sitoConfig?: SitoWebConfig;
    archivioGiornalini?: EdizioneGiornalino[];
    comunicazioni?: ComunicazioneSocio[];
  }) => void;
  onRipristinaDemo: () => void;
  onAzzeraDatabase?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  soci,
  eventi,
  sitoConfig,
  giornalinoConfig,
  archivioGiornalini = [],
  annoSelezionato,
  donazioni,
  cestinoCount = 0,
  onNavigaPagina,
  onCambiaAnno,
  onApriImpostazioni,
  onApriApkModal,
  onImportaBackup,
  onRipristinaDemo,
  onAzzeraDatabase,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [mostraMenuBackup, setMostraMenuBackup] = useState(false);
  const [mostraMenuAnno, setMostraMenuAnno] = useState(false);
  const [mostraConfermaAzzera, setMostraConfermaAzzera] = useState(false);
  const [mostraConfermaRipristinoDemo, setMostraConfermaRipristinoDemo] = useState(false);
  const [annoDaConfermare, setAnnoDaConfermare] = useState<number | null>(null);
  const [syncInfo, setSyncInfo] = useState<ServerSyncStatusInfo>(() => getServerSyncStatus());

  useEffect(() => {
    const updateStatus = () => {
      setSyncInfo(getServerSyncStatus());
    };
    const handleCustomEvent = (e: Event) => {
      const customEv = e as CustomEvent<ServerSyncStatusInfo>;
      if (customEv.detail) {
        setSyncInfo(customEv.detail);
      } else {
        updateStatus();
      }
    };
    window.addEventListener(NETWORK_STATUS_EVENT, handleCustomEvent);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('storage', updateStatus);
    return () => {
      window.removeEventListener(NETWORK_STATUS_EVENT, handleCustomEvent);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('storage', updateStatus);
    };
  }, []);

  const annoCorrenteSistema = new Date().getFullYear();
  const anniOpzioniDashboard = Array.from(
    new Set([
      annoCorrenteSistema + 1,
      annoCorrenteSistema,
      annoCorrenteSistema - 1,
      annoCorrenteSistema - 2,
      annoCorrenteSistema - 3,
      annoSelezionato
    ])
  ).sort((a, b) => b - a);

  // Calcolo statistiche rapide per la dashboard sincronizzate al 100% con StatsBar e Bilancio Generale
  const sociAttivi = soci.filter(s => !s.dataCancellazione);
  const riepilogoQuote = calcolaRiepilogoQuoteSoci(sociAttivi, annoSelezionato, config);
  const totaleSociInRegola = riepilogoQuote.sociInRegolaCount;
  const totaleIncassiQuote = riepilogoQuote.incassoTotaleAnno;

  const eventiAnno = eventi.filter(e => {
    const annoEv = parseInt(e.dataInizio.slice(0, 4), 10) || new Date(e.dataInizio).getFullYear();
    return annoEv === annoSelezionato;
  });

  const donazioniEffettive = donazioni ?? loadDonazioni();
  const donazioniAnno = donazioniEffettive.filter(d => d.anno === annoSelezionato && d.stato !== 'annullata_ripensamento');
  const totaleDonazioniAnno = donazioniAnno.reduce((acc, d) => acc + (d.importo || 0), 0);

  const aggregatoEventi = aggregaEventiPerBilancio(eventiAnno);
  const totaleSpeseEventi = aggregatoEventi.costiCompetenzaProLoco;
  const totaleEntrateEventi = aggregatoEventi.entrateCompetenzaProLoco;
  const totaleEntrateComplessive = totaleIncassiQuote + totaleEntrateEventi + totaleDonazioniAnno;
  const avanzoEconomico = totaleEntrateComplessive - totaleSpeseEventi;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const normalizzato = normalizzaBackupCompat(parsed, config);

        if (normalizzato) {
          onImportaBackup(normalizzato);
          setMostraMenuBackup(false);
        } else {
          alert('File di backup non valido.');
        }
      } catch (err) {
        alert('Errore nella lettura del file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-stone-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. INTESTAZIONE PRINCIPALE DELLA DASHBOARD (Come richiesto: Tutta l'intestazione proloco, tasto anno, database & backup, app android, configurazione) */}
      <header className="bg-[#fdfcf9]/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 shadow-[0_2px_12px_-4px_rgba(45,38,30,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
            
            {/* Logo, Denominazione e Riconoscimenti Pro Loco */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-xs ring-1 ring-emerald-500/20 shrink-0">
                <Building2 className="w-6 h-6 text-emerald-50" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {config.nome}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    {config.codiceUnpli ? 'UNPLI' : 'APS Pro Loco'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>C.F. {config.codiceFiscale}</span>
                  <span>•</span>
                  <span>{config.comune} ({config.provincia})</span>
                  {config.numeroRunts && (
                    <>
                      <span>•</span>
                      <span className="hidden sm:inline">RUNTS: {config.numeroRunts}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Tasti di Controllo Richiesti: Anno, Database & Backup, App Android, Configurazione */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Tasto 1: Anno Sociale (Menu a tendina interattivo universale) */}
              <div className="relative flex items-center bg-slate-50/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
                <span className="text-[11px] font-semibold text-slate-500 mr-1 hidden sm:inline">Anno:</span>
                <button
                  id="select-anno-dashboard"
                  type="button"
                  onClick={() => {
                    setMostraMenuAnno(prev => !prev);
                    setMostraMenuBackup(false);
                  }}
                  aria-label="Seleziona anno sociale"
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 shadow-2xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>
                    {annoSelezionato}{' '}
                    {annoSelezionato === annoCorrenteSistema
                      ? '(Anno Corrente)'
                      : annoSelezionato === annoCorrenteSistema + 1
                      ? '(Successivo)'
                      : annoSelezionato === annoCorrenteSistema - 1
                      ? '(Precedente)'
                      : ''}
                  </span>
                  <span className="text-slate-400 text-[10px]">▾</span>
                </button>

                {mostraMenuAnno && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMostraMenuAnno(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 text-slate-800">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Seleziona Anno Sociale
                      </div>
                      {anniOpzioniDashboard.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            setMostraMenuAnno(false);
                            if (a !== annoSelezionato) {
                              setAnnoDaConfermare(a);
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            a === annoSelezionato
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <span>
                            {a}{' '}
                            {a === annoCorrenteSistema
                              ? '(Anno Corrente)'
                              : a === annoCorrenteSistema + 1
                              ? '(Successivo)'
                              : a === annoCorrenteSistema - 1
                              ? '(Precedente)'
                              : ''}
                          </span>
                          {a === annoSelezionato && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                              Attivo
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Tasto 2: Database & Backup con Menu */}
              <div className="relative">
                <button
                  id="btn-database-backup-dashboard"
                  type="button"
                  onClick={() => {
                    setMostraMenuBackup(prev => !prev);
                    setMostraMenuAnno(false);
                  }}
                  title="Gestione Database, Backup e Ripristino"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-150 shadow-2xs cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Database</span>
                  <span className="text-slate-400 text-[10px]">▾</span>
                </button>

                {mostraMenuBackup && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMostraMenuBackup(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-slate-800 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Database Pro Loco
                    </div>
                    
                    <button
                      onClick={() => {
                        esportaBackupJSON(soci, config, eventi, donazioniEffettive, undefined, sitoConfig, archivioGiornalini);
                        setMostraMenuBackup(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Esporta Backup Completo (JSON)</span>
                    </button>

                    <label className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium">
                      <Upload className="w-4 h-4 text-teal-600" />
                      <span>Importa Backup (JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={() => {
                        esportaLibroSociCSV(soci, annoSelezionato);
                        setMostraMenuBackup(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Scarica Libro Soci (CSV)</span>
                    </button>

                    <button
                      onClick={() => {
                        esportaBilancioCompletoCSV(soci, eventi, config, annoSelezionato, donazioniEffettive);
                        setMostraMenuBackup(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Download className="w-4 h-4 text-amber-600" />
                      <span>Scarica Bilancio Generale (CSV)</span>
                    </button>

                    <div className="my-1.5 border-t border-slate-100"></div>
                    
                    <button
                      id="btn-reimposta-demo-dashboard"
                      type="button"
                      onClick={() => {
                        setMostraMenuBackup(false);
                        setMostraConfermaRipristinoDemo(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-amber-800 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-semibold transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-amber-600" />
                      <span>Reimposta Dati Esempio</span>
                    </button>

                    {onAzzeraDatabase && (
                      <>
                        <div className="my-1.5 border-t border-rose-100"></div>
                        <button
                          onClick={() => {
                            setMostraMenuBackup(false);
                            setMostraConfermaAzzera(true);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span>Azzera Tutto il Database</span>
                        </button>
                      </>
                    )}
                  </div>
                  </>
                )}
              </div>

              {/* Tasto 3: Configurazione */}
              <button
                id="btn-configurazione-dashboard"
                onClick={onApriImpostazioni}
                title="Configurazione Ente, Quote e Parametri Istituzionali"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-150 shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span>Configurazione</span>
              </button>

              {/* Tasto 4: Server Stile Office (Menu a scomparsa per stato e tunnel di uscita) */}
              <ServerOfficeMenu />

              {/* Tasto 5: Schermo Intero */}
              {onToggleFullscreen && (
                <button
                  id="btn-schermo-intero-dashboard"
                  type="button"
                  onClick={onToggleFullscreen}
                  title={isFullscreen ? "Riduci Schermo (F11 / Esc)" : "Modalità a Schermo Intero (F11)"}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 shadow-2xs cursor-pointer ${
                    isFullscreen
                      ? 'bg-emerald-800 text-emerald-100 border-emerald-700 hover:bg-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">Riduci</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden sm:inline">Schermo Intero</span>
                    </>
                  )}
                </button>
              )}

            </div>

          </div>

        </div>
      </header>

      {/* CORPO PRINCIPALE DELLA DASHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner di Benvenuto e Riepilogo Anno Sociale */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-emerald-700/40 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                  Pannello di Controllo Generale
                </span>
                <span className="text-xs text-emerald-200 font-medium">
                  Anno Sociale {annoSelezionato}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Dashboard Istituzionale • {config.nome}
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed italic">
                «{config.motto || 'Promozione delle tradizioni, valorizzazione del territorio e animazione civica.'}»
              </p>
              <div className="pt-1 text-xs text-emerald-200/80 flex items-center gap-2">
                <span>Presidente: <strong className="text-white font-bold">{config.nomePresidente}</strong></span>
                <span>•</span>
                <span>Sede: {config.indirizzo}, {config.comune}</span>
              </div>
            </div>

            {/* Metriche Rapide di Sintesi */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15 text-center">
                <span className="text-[11px] text-emerald-200 font-medium block">Soci Iscritti {annoSelezionato}</span>
                <span className="text-2xl font-black text-white tabular-nums">{totaleSociInRegola}</span>
                <span className="text-[10px] text-emerald-300 block">in regola con la quota</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15 text-center">
                <span className="text-[11px] text-teal-200 font-medium block">Eventi in Calendario</span>
                <span className="text-2xl font-black text-white tabular-nums">{eventiAnno.length}</span>
                <span className="text-[10px] text-teal-300 block">manifestazioni {annoSelezionato}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15 text-center">
                <span className="text-[11px] text-emerald-200 font-medium block">Saldo Cassa {annoSelezionato}</span>
                <span className={`text-2xl font-black tabular-nums ${(avanzoEconomico || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  € {(avanzoEconomico || 0).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-300 block">entrate totali - uscite</span>
              </div>
            </div>

          </div>
        </div>

        {/* SEZIONE VISUALE RECHARTS: ANDAMENTO MENSILE ISCRIZIONI SOCI & ENTRATE/USCITE PIANIFICATE EVENTI */}
        <DashboardAnalyticsSection
          soci={soci}
          eventi={eventi}
          annoSelezionato={annoSelezionato}
          onNavigaPagina={(pagina, sottoTab) => onNavigaPagina(pagina, sottoTab)}
        />

        {/* GUIDA & TITOLO SEZIONE DI NAVIGAZIONE DEI 3 MODULI */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50/90 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200/70">
            I 3 Moduli della Piattaforma Pro Loco
          </h3>
          <p className="text-xs text-slate-600 mt-1.5">
            Seleziona l'area operativa: Gestionale Amministrativo (Soci, Eventi, Turni Stand, Bilancio, Donazioni), Portale Sito Web Pubblico o Studio Editoriale Giornalino.
          </p>
        </div>

        {/* I TRE GRANDI BLOCCHI DELLA DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CARD 1: GESTIONALE */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            className="bg-white/95 rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-[0_2px_14px_-4px_rgba(45,38,30,0.04)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group hover:border-emerald-500/60 relative"
          >
            <div className="space-y-5">
              
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FolderKanban className="w-7 h-7 text-emerald-700" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300/80">
                  1. Amministrazione
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  1. Gestionale Pro Loco
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Pannello operativo per il Consiglio Direttivo e la segreteria. Include anagrafica soci, quote, calendario manifestazioni, bilancio e donazioni.
                </p>
              </div>

              {/* Elenco sottomoduli racchiusi nel Gestionale (1.1, 1.2, 1.3, 1.4, 1.5) in Sequenza a Step */}
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Assetto Organizzativo a Step (In Sequenza):
                  </span>
                  <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Flusso Sequenziale
                  </span>
                </div>
                
                <div className="rounded-xl bg-white border border-slate-200 hover:border-emerald-300 transition shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    id="btn-sub-gestionale-soci"
                    onClick={() => onNavigaPagina('gestionale', 'soci')}
                    className="w-full text-left p-2.5 hover:bg-emerald-50/60 transition group/sub flex items-center justify-between cursor-pointer"
                    title="Step 1 Organizzativo: Albo Ufficiale dei Soci e Tesseramento in 4 Step Sequenziali"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        1.1
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 group-hover/sub:text-emerald-900 block">
                          1.1 Albo & Libro Soci (4 Step in Sequenza)
                        </span>
                        <span className="text-[10.5px] text-slate-500">
                          {sociAttivi.length} soci ({totaleSociInRegola} in regola) • Step: 1.Anagrafica → 2.Ruolo → 3.Quota → 4.Tessera
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-emerald-700 shrink-0 ml-1" />
                  </button>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 hover:border-teal-300 transition shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    id="btn-sub-gestionale-eventi"
                    onClick={() => onNavigaPagina('gestionale', 'eventi')}
                    className="w-full text-left p-2.5 hover:bg-teal-50/60 transition group/sub flex items-center justify-between cursor-pointer"
                    title="Step 2 Organizzativo: Calendario Manifestazioni, Stand e Turni in 5 Step Sequenziali"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        1.2
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900 block">
                          1.2 Eventi, Stand & Turni (5 Step in Sequenza)
                        </span>
                        <span className="text-[10.5px] text-slate-500">
                          {eventiAnno.length} eventi ({aggregatoEventi.totaleStands} stand • {aggregatoEventi.totaleTurniAssegnati} turni) • 5 Step
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-sub-gestionale-bilancio"
                  onClick={() => onNavigaPagina('gestionale', 'bilancio')}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Rendiconto Generale Terzo Settore RUNTS"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Landmark className="w-3.5 h-3.5 text-emerald-800" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-emerald-900 block">
                        1.3 Bilancio Generale
                      </span>
                      <span className="text-[10.5px] text-slate-500">
                        Rendiconto Cassa CTS Modello D • {avanzoEconomico >= 0 ? '+' : ''}€{avanzoEconomico.toLocaleString('it-IT')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-emerald-800 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  id="btn-sub-gestionale-conto-terzi"
                  onClick={() => onNavigaPagina('gestionale', 'conto_terzi')}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Donazioni Liberali e Raccolta Fondi Art. 83 CTS"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-800" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-emerald-900 block">
                        1.4 Donazioni, Rendiconto & Adempimenti
                      </span>
                      <span className="text-[10.5px] text-slate-500">
                        {donazioniAnno.length} erogazioni (€{totaleDonazioniAnno.toLocaleString('it-IT')}) • Art. 83 CTS • 730
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-emerald-800 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  id="btn-sub-gestionale-comunicazioni"
                  onClick={() => onNavigaPagina('gestionale', 'comunicazioni')}
                  className="w-full text-left p-2.5 rounded-xl bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-200/80 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Centro Invio Comunicazioni, Convocazioni Assemblea e Newsletter ai Soci"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 border border-indigo-200">
                      <Send className="w-3.5 h-3.5 text-indigo-700" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-950 group-hover/sub:text-indigo-900 block flex items-center gap-1.5">
                        <span>1.5 Comunicazioni & Newsletter Soci</span>
                        <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-200/80 text-indigo-900">
                          Email & APK
                        </span>
                      </span>
                      <span className="text-[10.5px] text-indigo-700/80">
                        Invio email ai soci (tutti, in regola, da rinnovare, direttivo)
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  id="btn-sub-gestionale-cestino"
                  onClick={() => onNavigaPagina('gestionale', 'cestino')}
                  className="w-full text-left p-2.5 rounded-xl bg-rose-50/40 hover:bg-rose-50 border border-rose-200/80 hover:border-rose-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Cestino di Sistema & Audit Log Storico Revoche (1.4 Ripensamento Donante)"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 border border-rose-200">
                      <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-rose-950 group-hover/sub:text-rose-900 block flex items-center gap-1.5">
                        <span>1.6 Cestino & Audit Log</span>
                        <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-900">
                          {cestinoCount > 0 ? `${cestinoCount} record` : 'Punto 1.4'}
                        </span>
                      </span>
                      <span className="text-[10.5px] text-rose-700/80">
                        Revoche per ripensamento donante & storico eliminazioni
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover/sub:text-rose-700 shrink-0 ml-1" />
                </button>
              </div>

            </div>

            {/* Pulsante Principale di Ingresso Gestionale */}
            <div className="pt-6">
              <button
                id="btn-entra-gestionale"
                onClick={() => onNavigaPagina('gestionale', 'soci')}
                className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-sm font-black rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Accedi al Gestionale</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: SITO WEB PUBBLICO */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            className="bg-white/95 rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-[0_2px_14px_-4px_rgba(45,38,30,0.04)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group hover:border-teal-500/60 relative"
          >
            <div className="space-y-5">
              
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-7 h-7 text-teal-700" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    sitoConfig.blindatoVisitatori
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300/80'
                      : 'bg-amber-100 text-amber-900 border-amber-300/80'
                  }`}>
                    {sitoConfig.blindatoVisitatori ? 'Online & Blindato' : 'In Bozza (Editor)'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    PIN: {sitoConfig.pinSbloccoAdmin ? '••••' : 'Non impostato'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors">
                  2. Sito Web Pubblico
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Portale vetrina per cittadini e turisti con informazioni, calendario manifestazioni, tesseramento online e galleria del territorio.
                </p>
              </div>

              {/* Mini-Snapshot Anteprima Copertina Portale */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group/snap">
                <img 
                  src={sitoConfig.immagineCopertina || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80'} 
                  alt="Anteprima Portale" 
                  className="w-full h-24 object-cover group-hover/snap:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent p-3 flex flex-col justify-end">
                  <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-widest">
                    {config.comune} • Portale Ufficiale
                  </span>
                  <h4 className="text-xs font-black text-white truncate drop-shadow-xs">
                    {sitoConfig.titoloHero || 'Benvenuti nel Nostro Borgo'}
                  </h4>
                </div>
              </div>

              {/* Elenco Sottomoduli e Sezioni del Riquadro Sito Web */}
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Moduli & Configurazione:
                  </span>
                  <span className="text-[10.5px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    UNPLI Web
                  </span>
                </div>

                {/* 2.1 Editor Copertina & Hero */}
                <button
                  type="button"
                  id="btn-sub-editor-hero"
                  onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true, tabEditorSito: 'generale' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Modifica Copertina, Titolo e Messaggio di Benvenuto"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900">
                        2.1 Copertina, Hero & Sfondo Borgo
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 line-clamp-1">
                      Motto: «{sitoConfig.sottotitoloHero || config.motto || 'Custodi delle tradizioni'}»
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                </button>

                {/* 2.2 Sezioni & Moduli Pubblici */}
                <button
                  type="button"
                  id="btn-sub-editor-sezioni"
                  onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true, tabEditorSito: 'sezioni' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Gestisci le Sezioni Pubbliche Attive"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900">
                        2.2 Sezioni & Moduli Pubblici
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-600">
                      <span>Eventi: <strong>{sitoConfig.abilitaEventi ? `${eventi.length} pubbl.` : 'Off'}</strong></span>
                      <span>•</span>
                      <span>Tessere Online: <strong>{sitoConfig.abilitaTesseramentoOnline ? 'Sì' : 'No'}</strong></span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                </button>

                {/* 2.3 Bacheca Avvisi Cittadini */}
                <button
                  type="button"
                  id="btn-sub-editor-avvisi"
                  onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true, tabEditorSito: 'avvisi' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Bacheca Avvisi e Comunicazioni Importanti"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900">
                        2.3 Bacheca Avvisi alla Cittadinanza
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 line-clamp-1">
                      {sitoConfig.avvisi?.length || 0} avvisi pubblicati in primo piano
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                </button>

                {/* 2.4 Guida Territorio & Punti di Interesse */}
                <button
                  type="button"
                  id="btn-sub-editor-territorio"
                  onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true, tabEditorSito: 'territorio' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Punti di Interesse, Luoghi Storici e Sentieri"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900">
                        2.4 Guida Territorio & Luoghi Chiave
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 line-clamp-1">
                      {sitoConfig.luoghiTerritorio?.length || 0} punti di interesse censiti con foto
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                </button>

                {/* 2.5 Aspetto Grafico & Identità Visiva */}
                <button
                  type="button"
                  id="btn-sub-editor-stile"
                  onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true, tabEditorSito: 'aspetto' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Personalizza Colori, Tema e Stile Grafico"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900">
                        2.5 Aspetto Grafico & Tema Visivo
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Tema attivo: <strong className="capitalize text-teal-800">{sitoConfig.temaColore || 'smeraldo'}</strong>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                </button>

                {/* 2.6 Sicurezza, PIN & Esportazione HTML */}
                <button
                  type="button"
                  id="btn-sub-editor-sicurezza"
                  onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true, tabEditorSito: 'sicurezza' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="PIN di Sblocco, Backup ed Esportazione Codice HTML Autonomo"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-teal-900">
                        2.6 Protezione PIN & Esporta Codice
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      PIN attivo • Esportazione codice HTML autonomo
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-teal-700 shrink-0 ml-1" />
                </button>

              </div>

            </div>

            {/* Pulsanti Azione Riquadro Sito Web */}
            <div className="pt-6 space-y-2">
              <button
                id="btn-apri-editor-sito"
                onClick={() => onNavigaPagina('sitoweb', undefined, { forzatureEditor: true })}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white text-sm font-black rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Accedi all'Editor Sito Web</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-apri-portale-pubblico"
                onClick={() => onNavigaPagina('sitoweb', undefined, { soloPubblico: true })}
                className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Anteprima Portale Pubblico Visitatori</span>
              </button>
            </div>
          </motion.div>

          {/* CARD 3: GIORNALINO DELLA PRO LOCO */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            className="bg-white/95 rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-[0_2px_14px_-4px_rgba(45,38,30,0.04)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group hover:border-indigo-500/60 relative"
          >
            <div className="space-y-5">
              
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Newspaper className="w-7 h-7 text-indigo-700" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300/80">
                    Edizione #{giornalinoConfig.numeroEdizione || 1} • {giornalinoConfig.anno || annoSelezionato}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {archivioGiornalini.length} edizioni in archivio
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-800 transition-colors">
                  3. Giornalino Pro Loco
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Studio redazionale e grafico per il notiziario periodico della Pro Loco. Menabò DTP a colonne, rubriche, sponsor e stampa tipografica A4.
                </p>
              </div>

              {/* Mini-Snapshot Anteprima Copertina Giornalino */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group/snap bg-gradient-to-br from-indigo-900 to-slate-900 p-3.5 text-white">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    {config.comune} • Notiziario Ufficiale
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">
                    {giornalinoConfig.numeroPagine || 4} Pagine A4
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mt-2 truncate">
                  {giornalinoConfig.titoloTestata || 'Notiziario Pro Loco'}
                </h4>
                <p className="text-[11px] text-indigo-200 line-clamp-1 mt-0.5">
                  «{giornalinoConfig.sottotitoloTestata || config.nome}»
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10.5px] text-indigo-200">
                  <span>{giornalinoConfig.articoli?.length || 0} articoli redatti</span>
                  <span>•</span>
                  <span>{giornalinoConfig.sponsor?.length || 0} sponsor inserzionisti</span>
                </div>
              </div>

              {/* Elenco Sottomoduli e Sezioni del Giornalino */}
              <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Strumenti di Redazione DTP:
                  </span>
                  <span className="text-[10.5px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                    DTP Studio
                  </span>
                </div>

                {/* 3.1 Studio Editor DTP & Layout Menabò */}
                <button
                  type="button"
                  id="btn-sub-giornalino-studio"
                  onClick={() => onNavigaPagina('giornalino', undefined, { tabGiornalino: 'studio' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Studio Grafico Menabò Interattivo"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-indigo-900">
                        3.1 Studio Editor DTP & Menabò
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Composizione visiva a colonne con anteprima di stampa A4
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

                {/* 3.2 Redazione Articoli & Rubriche */}
                <button
                  type="button"
                  id="btn-sub-giornalino-articoli"
                  onClick={() => onNavigaPagina('giornalino', undefined, { tabGiornalino: 'articoli' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Scrivi e Organizza gli Articoli del Periodico"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-indigo-900">
                        3.2 Redazione Articoli & Rubriche
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {giornalinoConfig.articoli?.length || 0} articoli: editoriali, eventi e territorio
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

                {/* 3.3 Sponsor & Spazi Pubblicitari */}
                <button
                  type="button"
                  id="btn-sub-giornalino-sponsor"
                  onClick={() => onNavigaPagina('giornalino', undefined, { tabGiornalino: 'sponsor' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Gestione Inserzionisti e Finanziamento del Periodico"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-indigo-900">
                        3.3 Sponsor & Inserzionisti
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {giornalinoConfig.sponsor?.length || 0} sostenitori commerciali registrati
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

                {/* 3.4 Impaginazione & Griglia Tipografica */}
                <button
                  type="button"
                  id="btn-sub-giornalino-paginazione"
                  onClick={() => onNavigaPagina('giornalino', undefined, { tabGiornalino: 'paginazione' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Paginazione Foglio A4 e Densità Testo"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-indigo-900">
                        3.4 Impaginazione & Griglia A4
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {giornalinoConfig.numeroPagine || 4} pagine • Griglia tipografica a 2-3 colonne
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

                {/* 3.5 Testata Ufficiale & Layout Intestazione */}
                <button
                  type="button"
                  id="btn-sub-giornalino-testata"
                  onClick={() => onNavigaPagina('giornalino', undefined, { tabGiornalino: 'testata' })}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Stile della Testata Giornalistica e Fregi"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-indigo-900">
                        3.5 Testata Ufficiale & Fregi
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Layout classico o moderno con stemma e diciture
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

                {/* 3.6 Archivio Storico & Stampa Ufficiale */}
                <button
                  type="button"
                  id="btn-sub-giornalino-archivio"
                  onClick={() => onNavigaPagina('archivio_giornalino')}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition group/sub flex items-center justify-between cursor-pointer shadow-2xs"
                  title="Archivio Storico di Tutte le Edizioni e Stampa A4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 group-hover/sub:text-indigo-900">
                        3.6 Archivio Storico & Stampa A4
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {archivioGiornalini.length} edizioni conservate • PDF pronto stampa
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/sub:text-indigo-700 shrink-0 ml-1" />
                </button>

              </div>

            </div>

            {/* Pulsanti Azione Riquadro Giornalino */}
            <div className="pt-6 space-y-2">
              <button
                id="btn-apri-studio-giornalino"
                onClick={() => onNavigaPagina('giornalino', undefined, { tabGiornalino: 'studio' })}
                className="w-full py-3.5 px-4 bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white text-sm font-black rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Accedi allo Studio Giornalino</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-apri-archivio-giornalino"
                onClick={() => onNavigaPagina('archivio_giornalino')}
                className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archivio Edizioni & Stampa Tipografica</span>
              </button>
            </div>
          </motion.div>

        </div>

      </main>

      {/* FOOTER DELLA DASHBOARD */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-800">{config.nome}</span>
            <span>•</span>
            <span>{config.comune} ({config.provincia})</span>
          </div>

          <div className="flex items-center gap-3 text-[11.5px]">
            <span>Piattaforma Unificata Pro Loco: 1. Gestionale • 2. Sito Web • 3. Giornalino</span>
            <span>•</span>
            <span className="text-slate-400">Archivio Locale Sicuro</span>
          </div>
        </div>
      </footer>

      {/* MODALE DI CONFERMA CAMBIO ANNO SOCIALE */}
      {annoDaConfermare !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-slate-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">Cambiare Anno Sociale?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stai per passare all'anno sociale <strong>{annoDaConfermare}</strong>. Le statistiche, il libro soci e il bilancio verranno ricalcolati per questo esercizio.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setAnnoDaConfermare(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  onCambiaAnno(annoDaConfermare);
                  setAnnoDaConfermare(null);
                }}
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Conferma {annoDaConfermare}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DI CONFERMA AZZERAMENTO DATABASE */}
      {mostraConfermaAzzera && onAzzeraDatabase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sei sicuro di azzerare il database?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Questa operazione cancellerà tutti i soci, le quote e gli eventi inseriti nel database locale.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setMostraConfermaAzzera(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  onAzzeraDatabase();
                  setMostraConfermaAzzera(false);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Sì, Azzera Tutto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DI CONFERMA REIMPOSTA DATI ESEMPIO */}
      {mostraConfermaRipristinoDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reimpostare i Dati di Esempio?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verranno caricati gli elenchi dimostrativi completi di soci, quote, tessere ed eventi della Pro Loco.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-annulla-reimposta-dashboard"
                onClick={() => setMostraConfermaRipristinoDemo(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                No, Annulla
              </button>
              <button
                id="btn-conferma-reimposta-dashboard"
                onClick={() => {
                  onRipristinaDemo();
                  setMostraConfermaRipristinoDemo(false);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sì, Reimposta Dati</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
