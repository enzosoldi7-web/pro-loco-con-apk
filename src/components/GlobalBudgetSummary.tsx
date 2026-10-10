import React, { useState, useMemo, useEffect } from 'react';
import { Socio, ProLocoEvento, ProLocoInfo, QuotaAssociativa, StandEvento, DonazioneTerzi, TipoDonatore } from '../types';
import { 
  Building2,
  Euro,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  Users,
  PartyPopper,
  Database,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Utensils,
  Music,
  Truck,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Receipt,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Send,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Handshake,
  Briefcase,
  Store,
  Calculator,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Info,
  HeartHandshake,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  esportaBilancioCompletoCSV, 
  esportaBackupJSON, 
  STAND_SIMULATI_DEFAULT, 
  esportaStandEventoCSV,
  loadDonazioni,
  saveDonazioni,
  esportaDonazioniCSV,
  aggiungiAlCestino
} from '../storage';
import { 
  calcolaScadenzaQuota, 
  getSociNonRinnovati,
  compilaTemplatePromemoria,
  TEMPLATE_PROMEMORIA_PREDEFINITI
} from '../utils/quoteHelpers';
import { 
  aggregaEventiPerBilancio, 
  calcolaEconomiaEvento, 
  getInfoTipoEvento 
} from '../utils/eventoHelpers';
import { PromemoriaRinnovoModal } from './PromemoriaRinnovoModal';
import { DonazioneModal } from './DonazioneModal';
import { DonazioneRicevutaModal } from './DonazioneRicevutaModal';

interface GlobalBudgetSummaryProps {
  soci: Socio[];
  eventi: ProLocoEvento[];
  config: ProLocoInfo;
  annoSelezionato: number;
  donazioni?: DonazioneTerzi[];
  onSalvaDonazione?: (donazione: DonazioneTerzi) => void;
  onEliminaDonazione?: (id: string) => void;
  onCambiaAnno: (anno: number) => void;
  onApriStampaBilancio: () => void;
  onVaiASocio?: (socioId: string) => void;
  onVaiAEvento?: (eventoId: string) => void;
  onRegistraPagamento?: (socio: Socio) => void;
}

export const GlobalBudgetSummary: React.FC<GlobalBudgetSummaryProps> = ({
  soci,
  eventi,
  config,
  annoSelezionato,
  donazioni,
  onSalvaDonazione,
  onEliminaDonazione,
  onCambiaAnno,
  onApriStampaBilancio,
  onVaiASocio,
  onVaiAEvento,
  onRegistraPagamento
}) => {
  const [sottoTab, setSottoTab] = useState<'quadro' | 'tesseramenti' | 'eventi' | 'donazioni' | 'runts' | 'database'>('quadro');
  const [ricercaTesto, setRicercaTesto] = useState<string>('');
  const [filtroAnno, setFiltroAnno] = useState<number | 'tutti'>(annoSelezionato);
  const [mostraModalPromemoria, setMostraModalPromemoria] = useState<boolean>(false);
  const [mostraSociDaIncassare, setMostraSociDaIncassare] = useState<boolean>(true);
  const [filtroCircuitoStandQuadro, setFiltroCircuitoStandQuadro] = useState<'tutti' | 'food' | 'non_food'>('tutti');

  // Stati Gestione Donazioni da Terzi
  const [listaDonazioni, setListaDonazioni] = useState<DonazioneTerzi[]>(() => {
    if (donazioni !== undefined) return donazioni;
    return loadDonazioni();
  });
  const [modalDonazioneAperta, setModalDonazioneAperta] = useState<boolean>(false);
  const [donazioneInModifica, setDonazioneInModifica] = useState<DonazioneTerzi | null>(null);
  const [donazioneRicevutaStampa, setDonazioneRicevutaStampa] = useState<DonazioneTerzi | null>(null);
  const [filtroTipoDonatore, setFiltroTipoDonatore] = useState<'tutti' | TipoDonatore>('tutti');
  const [filtroRicercaDonatore, setFiltroRicercaDonatore] = useState<string>('');
  const [confermaEliminaDonazioneId, setConfermaEliminaDonazioneId] = useState<string | null>(null);

  // Sincronizzazione con donazioni esterne e anno selezionato nell'header
  useEffect(() => {
    if (donazioni) {
      setListaDonazioni(donazioni);
    }
  }, [donazioni]);

  useEffect(() => {
    setFiltroAnno(annoSelezionato);
  }, [annoSelezionato]);

  const sociAttivi = useMemo(() => soci.filter(s => !s.dataCancellazione), [soci]);

  // Lista anni disponibili
  const anniDisponibili = useMemo(() => {
    const anniSet = new Set<number>();
    anniSet.add(config.annoCorrente);
    anniSet.add(new Date().getFullYear());
    anniSet.add(new Date().getFullYear() - 1);
    anniSet.add(new Date().getFullYear() - 2);

    sociAttivi.forEach(s => {
      s.quote?.forEach(q => anniSet.add(q.anno));
    });

    eventi.forEach(e => {
      const year = parseInt(e.dataInizio.substring(0, 4));
      if (!isNaN(year)) anniSet.add(year);
    });

    return Array.from(anniSet).sort((a, b) => b - a);
  }, [sociAttivi, eventi, config.annoCorrente]);

  // Sincronizza filtro anno con prop se necessario
  const annoAttivo = filtroAnno === 'tutti' ? null : filtroAnno;

  // 1. ELABORAZIONE DATI TESSERAMENTI (escludendo soci cancellati)
  const quoteFiltrate = useMemo(() => {
    const tutteQuote: Array<{ quota: QuotaAssociativa; socio: Socio }> = [];
    sociAttivi.forEach(s => {
      (s.quote || []).forEach(q => {
        if (!annoAttivo || q.anno === annoAttivo) {
          tutteQuote.push({ quota: q, socio: s });
        }
      });
    });
    return tutteQuote.sort((a, b) => b.quota.dataPagamento.localeCompare(a.quota.dataPagamento));
  }, [sociAttivi, annoAttivo]);

  const totaleQuote = useMemo(() => {
    return quoteFiltrate.reduce((acc, item) => acc + (item.quota.importo || 0), 0);
  }, [quoteFiltrate]);

  // Statistiche soci nell'anno
  const sociTesseratiNellAnno = useMemo(() => {
    if (!annoAttivo) return sociAttivi.filter(s => s.categoria === 'Onorario' || (s.quote || []).length > 0);
    return sociAttivi.filter(s => s.categoria === 'Onorario' || (s.quote || []).some(q => q.anno === annoAttivo));
  }, [sociAttivi, annoAttivo]);

  const sociDaRinnovareNellAnno = useMemo(() => {
    if (!annoAttivo) return [];
    return sociAttivi.filter(s => s.attivo && s.categoria !== 'Onorario' && !(s.quote || []).some(q => q.anno === annoAttivo));
  }, [sociAttivi, annoAttivo]);

  // Ripartizione quote per categoria socio
  const quotePerCategoria = useMemo(() => {
    const mappa: Record<string, { conteggio: number; importo: number }> = {};
    quoteFiltrate.forEach(({ quota, socio }) => {
      const cat = socio.categoria || 'Ordinario';
      if (!mappa[cat]) {
        mappa[cat] = { conteggio: 0, importo: 0 };
      }
      mappa[cat].conteggio += 1;
      mappa[cat].importo += quota.importo;
    });
    return mappa;
  }, [quoteFiltrate]);

  // Ripartizione quote per metodo di pagamento
  const quotePerMetodo = useMemo(() => {
    const mappa: Record<string, { conteggio: number; importo: number }> = {};
    quoteFiltrate.forEach(({ quota }) => {
      const m = quota.metodo || 'Contanti';
      if (!mappa[m]) {
        mappa[m] = { conteggio: 0, importo: 0 };
      }
      mappa[m].conteggio += 1;
      mappa[m].importo += quota.importo;
    });
    return mappa;
  }, [quoteFiltrate]);

  // 2. ELABORAZIONE DATI EVENTI CON AGGREGAZIONE BILANCIO (3 TIPOLOGIE: NATIVI, IBRIDI, GESTIONE)
  const eventiFiltrati = useMemo(() => {
    return eventi.filter(e => {
      if (annoAttivo && !e.dataInizio.startsWith(annoAttivo.toString())) {
        return false;
      }
      return true;
    });
  }, [eventi, annoAttivo]);

  const aggregatoEventi = useMemo(() => {
    return aggregaEventiPerBilancio(eventiFiltrati);
  }, [eventiFiltrati]);

  const totaliEventi = useMemo(() => {
    return {
      budgetPrevisto: aggregatoEventi.budgetPrevistoProLoco,
      costiConsuntivo: aggregatoEventi.costiCompetenzaProLoco,
      entratePreviste: aggregatoEventi.entratePrevisteProLoco,
      entrateRealizzate: aggregatoEventi.entrateCompetenzaProLoco,
      margineEventi: aggregatoEventi.margineCompetenzaProLoco,
      differenzaCosti: aggregatoEventi.differenzaCosti,
      costiLordoTotali: aggregatoEventi.costiLordoTotali,
      entrateLordoTotali: aggregatoEventi.entrateLordoTotali,
      margineLordoTotale: aggregatoEventi.margineLordoTotale,
      food: aggregatoEventi.food,
      intrattenimento: aggregatoEventi.intrattenimento,
      altreSpese: aggregatoEventi.altreSpese,
      varie: aggregatoEventi.varie,
      partecipantiStimati: aggregatoEventi.partecipantiStimati,
      eventiNativiCount: aggregatoEventi.eventiNativiCount,
      eventiIbridiCount: aggregatoEventi.eventiIbridiCount,
      eventiGestioneCount: aggregatoEventi.eventiGestioneCount,
      nativi: aggregatoEventi.nativi,
      ibridi: aggregatoEventi.ibridi,
      gestione: aggregatoEventi.gestione
    };
  }, [aggregatoEventi]);

  // 2b. SELEZIONE EVENTO & AGGREGAZIONE MACRO ECONOMICA STAND NUMERATI
  const [eventoSelezionatoPerStandId, setEventoSelezionatoPerStandId] = useState<string | null>(null);
  const [filtroTipoStand, setFiltroTipoStand] = useState<'tutti' | 'food' | 'non_food'>('tutti');

  const eventoPerMacroStand = useMemo(() => {
    if (eventoSelezionatoPerStandId) {
      const trovato = eventi.find(e => e.id === eventoSelezionatoPerStandId);
      if (trovato) return trovato;
    }
    // Preferisci il primo evento con stand tra quelli filtrati per anno
    const conStand = eventiFiltrati.find(e => e.standNumerati && e.standNumerati.length > 0);
    if (conStand) return conStand;
    if (eventiFiltrati.length > 0) return eventiFiltrati[0];
    return eventi[0] || null;
  }, [eventi, eventiFiltrati, eventoSelezionatoPerStandId]);

  const standsEventoSelezionato: StandEvento[] = useMemo(() => {
    if (!eventoPerMacroStand) return [];
    if (eventoPerMacroStand.standNumerati && eventoPerMacroStand.standNumerati.length > 0) {
      return eventoPerMacroStand.standNumerati;
    }
    return STAND_SIMULATI_DEFAULT;
  }, [eventoPerMacroStand]);

  const macroEconomiaStand = useMemo(() => {
    let totSpesaPrev = 0;
    let totSpesaCons = 0;
    let totIncassoPrev = 0;
    let totIncassoCons = 0;
    let foodCount = 0;
    let nonFoodCount = 0;

    standsEventoSelezionato.forEach(s => {
      const spP = Number(s.spesaPreventivo) || 0;
      const spC = Number(s.spesaConsuntivo) || 0;
      const inP = Number(s.incassoPrevisto) || Number(s.incassoStimato) || 0;
      const inC = Number(s.incassoConsuntivo) || Number(s.incassoStimato) || 0;

      totSpesaPrev += spP;
      totSpesaCons += spC;
      totIncassoPrev += inP;
      totIncassoCons += inC;

      if (s.riferimentoFood) {
        foodCount++;
      } else {
        nonFoodCount++;
      }
    });

    const diffSpesa = totSpesaCons - totSpesaPrev;
    const diffIncasso = totIncassoCons - totIncassoPrev;
    const marginePrev = totIncassoPrev - totSpesaPrev;
    const margineCons = totIncassoCons - totSpesaCons;
    const diffMargine = margineCons - marginePrev;

    const costiManifestazione = eventoPerMacroStand?.costiSostenuti || 0;
    const entrateManifestazione = eventoPerMacroStand?.entrateRealizzate || 0;
    const incidenzaSpese = costiManifestazione > 0 ? ((totSpesaCons / costiManifestazione) * 100) : 0;
    const incidenzaIncassi = entrateManifestazione > 0 ? ((totIncassoCons / entrateManifestazione) * 100) : 0;

    return {
      totSpesaPrev,
      totSpesaCons,
      diffSpesa,
      totIncassoPrev,
      totIncassoCons,
      diffIncasso,
      marginePrev,
      margineCons,
      diffMargine,
      totaleStand: standsEventoSelezionato.length,
      foodCount,
      nonFoodCount,
      incidenzaSpese,
      incidenzaIncassi
    };
  }, [standsEventoSelezionato, eventoPerMacroStand]);

  const standsVisualizzati = useMemo(() => {
    if (filtroTipoStand === 'food') {
      return standsEventoSelezionato.filter(s => s.riferimentoFood);
    }
    if (filtroTipoStand === 'non_food') {
      return standsEventoSelezionato.filter(s => !s.riferimentoFood);
    }
    return standsEventoSelezionato;
  }, [standsEventoSelezionato, filtroTipoStand]);

  // Handlers CRUD Donazioni da Terzi
  const handleSalvaDonazione = (nuovaDonazione: DonazioneTerzi) => {
    let aggiornate: DonazioneTerzi[];
    const esiste = listaDonazioni.some(d => d.id === nuovaDonazione.id);
    if (esiste) {
      aggiornate = listaDonazioni.map(d => d.id === nuovaDonazione.id ? nuovaDonazione : d);
    } else {
      aggiornate = [nuovaDonazione, ...listaDonazioni];
    }
    setListaDonazioni(aggiornate);
    saveDonazioni(aggiornate);
    if (onSalvaDonazione) onSalvaDonazione(nuovaDonazione);
    setDonazioneInModifica(null);
    setModalDonazioneAperta(false);
  };

  const handleEliminaDonazione = (id: string) => {
    const target = listaDonazioni.find(d => d.id === id);
    if (!target) return;
    const dataOggi = new Date().toISOString().split('T')[0];
    const oraAttuale = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Presidente'} / Tesoreria`;

    // 1. Soft delete: contrassegna come annullata per ripensamento donante (Punto 1.4)
    const donazioneStornata: DonazioneTerzi = {
      ...target,
      stato: 'annullata_ripensamento',
      motivoAnnullamento: 'Ripensamento del donante (Revoca per ripensamento donazione ex art. 800 c.c.)',
      dataAnnullamento: dataOggi,
      annullatoDa: operatore
    };

    const aggiornate = listaDonazioni.map(d => d.id === id ? donazioneStornata : d);
    setListaDonazioni(aggiornate);
    saveDonazioni(aggiornate);

    // 2. Archivia nel Cestino di Sistema per l'audit trail storico
    aggiungiAlCestino({
      id: `cestino-don-${id}`,
      entitaId: id,
      tipoEntita: 'donazione',
      titolo: `Quietanza ${target.ricevutaNumero} - ${target.donatore}`,
      sottotitolo: `${target.codiceFiscalePartitaIva ? 'C.F./P.IVA: ' + target.codiceFiscalePartitaIva + ' • ' : ''}Esercizio ${target.anno}`,
      importo: target.importo,
      dataEliminazione: dataOggi,
      oraEliminazione: oraAttuale,
      motivo: 'Ripensamento del donante (Revoca per ripensamento donazione ex art. 800 c.c.)',
      eliminatoDa: operatore,
      datiOriginali: donazioneStornata
    });

    if (onSalvaDonazione) onSalvaDonazione(donazioneStornata);
    setConfermaEliminaDonazioneId(null);
  };

  // Donazioni filtrate per anno e criteri di ricerca (esclusione categorica donazioni stornate per ripensamento)
  const donazioniFiltrate = useMemo(() => {
    return listaDonazioni.filter(d => {
      // Esclusione categorica donazioni annullate per ripensamento donante (Punto 1.4)
      if (d.stato === 'annullata_ripensamento') return false;
      // Filtro anno sociale
      if (annoAttivo && d.anno !== annoAttivo) return false;
      // Filtro tipologia donatore
      if (filtroTipoDonatore !== 'tutti' && d.tipoDonatore !== filtroTipoDonatore) return false;
      // Filtro ricerca testo
      if (filtroRicercaDonatore.trim()) {
        const q = filtroRicercaDonatore.toLowerCase();
        const matchDonatore = d.donatore.toLowerCase().includes(q);
        const matchCausale = d.causale.toLowerCase().includes(q);
        const matchCf = d.codiceFiscalePartitaIva?.toLowerCase().includes(q) || false;
        const matchRicevuta = d.ricevutaNumero.toLowerCase().includes(q);
        const matchDest = d.destinazione?.toLowerCase().includes(q) || false;
        if (!matchDonatore && !matchCausale && !matchCf && !matchRicevuta && !matchDest) return false;
      }
      return true;
    });
  }, [listaDonazioni, annoAttivo, filtroTipoDonatore, filtroRicercaDonatore]);

  const totaleDonazioni = useMemo(() => {
    return donazioniFiltrate.reduce((acc, d) => acc + (d.importo || 0), 0);
  }, [donazioniFiltrate]);

  const totaleDonazioniDetraibili = useMemo(() => {
    return donazioniFiltrate.filter(d => d.detraibileFiscale).reduce((acc, d) => acc + (d.importo || 0), 0);
  }, [donazioniFiltrate]);

  const donazioneMedia = useMemo(() => {
    return donazioniFiltrate.length > 0 ? Math.round(totaleDonazioni / donazioniFiltrate.length) : 0;
  }, [donazioniFiltrate, totaleDonazioni]);

  const prossimoNumeroRicevuta = useMemo(() => {
    const annoRif = annoAttivo || config.annoCorrente;
    const conteggioAnno = listaDonazioni.filter(d => d.anno === annoRif).length + 1;
    return `DON-${annoRif}-${String(conteggioAnno).padStart(3, '0')}`;
  }, [listaDonazioni, annoAttivo, config.annoCorrente]);

  // 3. QUADRO GENERALE BILANCIO UNIFICATO (TESSERAMENTI + EVENTI + DONAZIONI DA TERZI)
  const bilancioGlobale = useMemo(() => {
    const totaleEntrateGenerali = totaleQuote + totaliEventi.entrateRealizzate + totaleDonazioni;
    const totaleUsciteGenerali = totaliEventi.costiConsuntivo;
    const avanzoGestione = totaleEntrateGenerali - totaleUsciteGenerali;

    // Incidenza percentuale entrate
    const percQuote = totaleEntrateGenerali > 0 ? (totaleQuote / totaleEntrateGenerali) * 100 : 0;
    const percEventi = totaleEntrateGenerali > 0 ? (totaliEventi.entrateRealizzate / totaleEntrateGenerali) * 100 : 0;
    const percDonazioni = totaleEntrateGenerali > 0 ? (totaleDonazioni / totaleEntrateGenerali) * 100 : 0;

    return {
      totaleEntrate: totaleEntrateGenerali,
      totaleUscite: totaleUsciteGenerali,
      avanzoGestione,
      percQuote,
      percEventi,
      percDonazioni
    };
  }, [totaleQuote, totaliEventi, totaleDonazioni]);

  // 3b. CALCOLO QUOTE SOCIALI DA INCASSARE & SCADENZA STATUTARIA ESERCIZIO
  const annoRiferimentoQuote = annoAttivo || config.annoCorrente;

  const sociNonRinnovati = useMemo(() => {
    return getSociNonRinnovati(soci, annoRiferimentoQuote, config);
  }, [soci, annoRiferimentoQuote, config]);

  const totaleQuoteDaIncassare = useMemo(() => {
    return sociNonRinnovati.reduce((acc, curr) => acc + curr.importoDovuto, 0);
  }, [sociNonRinnovati]);

  const scadenzaQuote = useMemo(() => {
    return calcolaScadenzaQuota(annoRiferimentoQuote);
  }, [annoRiferimentoQuote]);

  const quoteDaIncassarePerCategoria = useMemo(() => {
    const mappa: Record<string, { conteggio: number; importo: number; quotaUnitaria: number }> = {};
    sociNonRinnovati.forEach(({ socio, importoDovuto }) => {
      const cat = socio.categoria || 'Ordinario';
      if (!mappa[cat]) {
        mappa[cat] = { conteggio: 0, importo: 0, quotaUnitaria: importoDovuto };
      }
      mappa[cat].conteggio += 1;
      mappa[cat].importo += importoDovuto;
    });
    return mappa;
  }, [sociNonRinnovati]);

  const potenzialeEntrateConQuote = bilancioGlobale.totaleEntrate + totaleQuoteDaIncassare;
  const potenzialeAvanzoConQuote = bilancioGlobale.avanzoGestione + totaleQuoteDaIncassare;

  // 3c. CONSOLIDATO MACRO ECONOMICO STAND NUMERATI & MODELLI ECONOMICI (TUTTI GLI EVENTI DELL'ESERCIZIO)
  const consolidatoGlobaleStand = useMemo(() => {
    let totSpesaPrev = 0;
    let totSpesaCons = 0;
    let totIncassoPrev = 0;
    let totIncassoCons = 0;
    let totalStandCount = 0;
    let foodCount = 0;
    let nonFoodCount = 0;
    let spesaFoodCons = 0;
    let incassoFoodCons = 0;
    let spesaNonFoodCons = 0;
    let incassoNonFoodCons = 0;

    // Ripartizione aggregata per i 3 modelli economici
    const perModello = {
      nativo: { eventi: 0, stand: 0, spesaPrev: 0, spesaCons: 0, incassoPrev: 0, incassoCons: 0, margineLordo: 0, quotaProLoco: 0 },
      ibrido: { eventi: 0, stand: 0, spesaPrev: 0, spesaCons: 0, incassoPrev: 0, incassoCons: 0, margineLordo: 0, quotaProLoco: 0, quotaPartner: 0 },
      gestione: { eventi: 0, stand: 0, spesaPrev: 0, spesaCons: 0, incassoPrev: 0, incassoCons: 0, margineLordo: 0, quotaProLoco: 0, compenso: 0, rimborsi: 0 }
    };

    const eventiStandList = eventiFiltrati.map(e => {
      const econ = calcolaEconomiaEvento(e);
      const stands: StandEvento[] = (e.standNumerati && e.standNumerati.length > 0)
        ? e.standNumerati
        : STAND_SIMULATI_DEFAULT;

      let evSpesaPrev = 0;
      let evSpesaCons = 0;
      let evIncassoPrev = 0;
      let evIncassoCons = 0;
      let evFoodCount = 0;
      let evNonFoodCount = 0;

      stands.forEach(s => {
        const spP = Number(s.spesaPreventivo) || 0;
        const spC = Number(s.spesaConsuntivo) || 0;
        const inP = Number(s.incassoPrevisto) || Number(s.incassoStimato) || 0;
        const inC = Number(s.incassoConsuntivo) || Number(s.incassoStimato) || 0;

        evSpesaPrev += spP;
        evSpesaCons += spC;
        evIncassoPrev += inP;
        evIncassoCons += inC;

        if (s.riferimentoFood) {
          evFoodCount++;
          spesaFoodCons += spC;
          incassoFoodCons += inC;
        } else {
          evNonFoodCount++;
          spesaNonFoodCons += spC;
          incassoNonFoodCons += inC;
        }
      });

      totSpesaPrev += evSpesaPrev;
      totSpesaCons += evSpesaCons;
      totIncassoPrev += evIncassoPrev;
      totIncassoCons += evIncassoCons;
      totalStandCount += stands.length;
      foodCount += evFoodCount;
      nonFoodCount += evNonFoodCount;

      const tipo = e.tipoEvento || 'nativo';
      const evMargineLordo = evIncassoCons - evSpesaCons;
      let evQuotaProLoco = evMargineLordo;

      if (tipo === 'nativo') {
        perModello.nativo.eventi++;
        perModello.nativo.stand += stands.length;
        perModello.nativo.spesaPrev += evSpesaPrev;
        perModello.nativo.spesaCons += evSpesaCons;
        perModello.nativo.incassoPrev += evIncassoPrev;
        perModello.nativo.incassoCons += evIncassoCons;
        perModello.nativo.margineLordo += evMargineLordo;
        perModello.nativo.quotaProLoco += evMargineLordo;
      } else if (tipo === 'ibrido') {
        const percProLoco = (e.percentualeEntrateProLoco !== undefined ? e.percentualeEntrateProLoco : 50) / 100;
        evQuotaProLoco = Math.round(evMargineLordo * percProLoco);
        const evQuotaPartner = evMargineLordo - evQuotaProLoco;

        perModello.ibrido.eventi++;
        perModello.ibrido.stand += stands.length;
        perModello.ibrido.spesaPrev += evSpesaPrev;
        perModello.ibrido.spesaCons += evSpesaCons;
        perModello.ibrido.incassoPrev += evIncassoPrev;
        perModello.ibrido.incassoCons += evIncassoCons;
        perModello.ibrido.margineLordo += evMargineLordo;
        perModello.ibrido.quotaProLoco += evQuotaProLoco;
        perModello.ibrido.quotaPartner += evQuotaPartner;
      } else if (tipo === 'gestione') {
        evQuotaProLoco = Number(e.compensoGestione) || 2500;
        const evRimborsi = Number(e.rimborsoSpeseCommittente) || evSpesaCons;

        perModello.gestione.eventi++;
        perModello.gestione.stand += stands.length;
        perModello.gestione.spesaPrev += evSpesaPrev;
        perModello.gestione.spesaCons += evSpesaCons;
        perModello.gestione.incassoPrev += evIncassoPrev;
        perModello.gestione.incassoCons += evIncassoCons;
        perModello.gestione.margineLordo += evMargineLordo;
        perModello.gestione.quotaProLoco += evQuotaProLoco;
        perModello.gestione.compenso += evQuotaProLoco;
        perModello.gestione.rimborsi += evRimborsi;
      }

      return {
        evento: e,
        economia: econ,
        stands,
        standsCount: stands.length,
        foodCount: evFoodCount,
        nonFoodCount: evNonFoodCount,
        spesaPrev: evSpesaPrev,
        spesaCons: evSpesaCons,
        diffSpesa: evSpesaCons - evSpesaPrev,
        incassoPrev: evIncassoPrev,
        incassoCons: evIncassoCons,
        diffIncasso: evIncassoCons - evIncassoPrev,
        marginePrev: evIncassoPrev - evSpesaPrev,
        margineCons: evMargineLordo,
        diffMargine: (evIncassoCons - evSpesaCons) - (evIncassoPrev - evSpesaPrev),
        quotaProLoco: evQuotaProLoco
      };
    });

    const diffSpesa = totSpesaCons - totSpesaPrev;
    const diffIncasso = totIncassoCons - totIncassoPrev;
    const marginePrev = totIncassoPrev - totSpesaPrev;
    const margineCons = totIncassoCons - totSpesaCons;
    const diffMargine = margineCons - marginePrev;

    const totQuotaProLoco = eventiStandList.reduce((sum, item) => sum + item.quotaProLoco, 0);

    const incidenzaSpese = bilancioGlobale.totaleUscite > 0 
      ? Math.min(100, Math.round((totSpesaCons / bilancioGlobale.totaleUscite) * 100)) 
      : 0;
    const incidenzaIncassi = bilancioGlobale.totaleEntrate > 0 
      ? Math.min(100, Math.round((totIncassoCons / bilancioGlobale.totaleEntrate) * 100)) 
      : 0;

    return {
      totSpesaPrev,
      totSpesaCons,
      diffSpesa,
      totIncassoPrev,
      totIncassoCons,
      diffIncasso,
      marginePrev,
      margineCons,
      diffMargine,
      totQuotaProLoco,
      totalStandCount,
      foodCount,
      nonFoodCount,
      spesaFoodCons,
      incassoFoodCons,
      margineFoodCons: incassoFoodCons - spesaFoodCons,
      spesaNonFoodCons,
      incassoNonFoodCons,
      margineNonFoodCons: incassoNonFoodCons - spesaNonFoodCons,
      incidenzaSpese,
      incidenzaIncassi,
      perModello,
      eventiStandList
    };
  }, [eventiFiltrati, bilancioGlobale.totaleUscite, bilancioGlobale.totaleEntrate]);

  // Dati per Grafico a Torta delle ENTRATE
  const datiGraficoEntrate = useMemo(() => {
    const incassoFood = consolidatoGlobaleStand.incassoFoodCons > 0 
      ? consolidatoGlobaleStand.incassoFoodCons 
      : Math.round(totaliEventi.entrateRealizzate * 0.65);
    const incassoNonFood = consolidatoGlobaleStand.incassoNonFoodCons > 0 
      ? consolidatoGlobaleStand.incassoNonFoodCons 
      : 0;
    const altreEntrate = Math.max(0, totaliEventi.entrateRealizzate - (incassoFood + incassoNonFood));

    return [
      { name: 'Quote Tesseramento', value: totaleQuote, color: '#059669' },
      ...(totaleDonazioni > 0 ? [{ name: 'Donazioni da Terzi (Art. 83 CTS)', value: totaleDonazioni, color: '#e11d48' }] : []),
      { name: 'Food & Stand Gastronomici', value: incassoFood, color: '#0d9488' },
      ...(incassoNonFood > 0 ? [{ name: 'Stand Servizi & Mercatini', value: incassoNonFood, color: '#6366f1' }] : []),
      { name: 'Sponsor & Altre Entrate', value: altreEntrate > 0 ? altreEntrate : Math.round(totaliEventi.entrateRealizzate * 0.25), color: '#0284c7' }
    ].filter(item => item.value > 0);
  }, [totaleQuote, totaleDonazioni, totaliEventi.entrateRealizzate, consolidatoGlobaleStand]);

  // Dati per Grafico a Torta delle USCITE
  const datiGraficoUscite = useMemo(() => {
    const spesaFood = consolidatoGlobaleStand.spesaFoodCons > 0 
      ? consolidatoGlobaleStand.spesaFoodCons 
      : totaliEventi.food;
    const spesaAllestimenti = totaliEventi.altreSpese + (consolidatoGlobaleStand.spesaNonFoodCons > 0 ? consolidatoGlobaleStand.spesaNonFoodCons : 0);

    return [
      { name: 'Food & Materie Prime Stand', value: spesaFood, color: '#059669' },
      { name: 'Musica, Artisti & SIAE', value: totaliEventi.intrattenimento, color: '#7c3aed' },
      { name: 'Allestimenti, Palco & Stand No-Food', value: spesaAllestimenti, color: '#0284c7' },
      { name: 'Tipografia, Permessi & Oneri Vari', value: totaliEventi.varie, color: '#d97706' }
    ].filter(item => item.value > 0);
  }, [totaliEventi, consolidatoGlobaleStand]);

  // Filtro circuiti per la Tabella Consolidata nel Quadro Generale
  const eventiStandFiltratiPerCircuito = useMemo(() => {
    if (filtroCircuitoStandQuadro === 'food') {
      return consolidatoGlobaleStand.eventiStandList.filter(item => item.foodCount > 0);
    }
    if (filtroCircuitoStandQuadro === 'non_food') {
      return consolidatoGlobaleStand.eventiStandList.filter(item => item.nonFoodCount > 0);
    }
    return consolidatoGlobaleStand.eventiStandList;
  }, [consolidatoGlobaleStand.eventiStandList, filtroCircuitoStandQuadro]);

  // Totali della tabella consolidata stand filtrata
  const totaliTabellaStandFiltrata = useMemo(() => {
    let totStands = 0;
    let totFood = 0;
    let totNonFood = 0;
    let spesaPrev = 0;
    let spesaCons = 0;
    let incassoPrev = 0;
    let incassoCons = 0;
    let margineCons = 0;
    let quotaProLoco = 0;

    eventiStandFiltratiPerCircuito.forEach(item => {
      totStands += item.standsCount;
      totFood += item.foodCount;
      totNonFood += item.nonFoodCount;
      spesaPrev += item.spesaPrev;
      spesaCons += item.spesaCons;
      incassoPrev += item.incassoPrev;
      incassoCons += item.incassoCons;
      margineCons += item.margineCons;
      quotaProLoco += item.quotaProLoco;
    });

    return {
      totStands,
      totFood,
      totNonFood,
      spesaPrev,
      spesaCons,
      diffSpesa: spesaCons - spesaPrev,
      incassoPrev,
      incassoCons,
      diffIncasso: incassoCons - incassoPrev,
      margineCons,
      quotaProLoco
    };
  }, [eventiStandFiltratiPerCircuito]);

  // Dati per Grafico a Barre Comparativo Eventi (Preventivo, Consuntivo, Entrate, Margine Pro Loco)
  const datiGraficoBarreEventi = useMemo(() => {
    return eventiFiltrati.slice(0, 8).map(e => {
      const econ = calcolaEconomiaEvento(e);
      const info = getInfoTipoEvento(e.tipoEvento || 'nativo');
      return {
        titolo: e.titolo.length > 15 ? e.titolo.substring(0, 15) + '...' : e.titolo,
        Preventivo: e.budgetPrevisto || 0,
        Consuntivo: econ.costiProLocoConsuntivo,
        Entrate: econ.entrateProLocoRealizzate,
        Utile: econ.margineNettoProLoco,
        tipo: e.tipoEvento || 'nativo',
        tipoLabel: info.etichetta
      };
    });
  }, [eventiFiltrati]);

  // Dati per Grafico Ripartizione Tipologie Evento (Nativi, Ibridi, Gestione)
  const datiGraficoTipologieEventi = useMemo(() => {
    return [
      { name: '1. Nativi (100% Pro Loco)', value: aggregatoEventi.eventiNativiCount || 0, volume: aggregatoEventi.nativi?.entrate || 0, color: '#059669' },
      { name: '2. Ibridi (Co-organizzati)', value: aggregatoEventi.eventiIbridiCount || 0, volume: aggregatoEventi.ibridi?.entrate || 0, color: '#7c3aed' },
      { name: '3. Gestione (Conto Terzi)', value: aggregatoEventi.eventiGestioneCount || 0, volume: aggregatoEventi.gestione?.entrate || 0, color: '#d97706' }
    ].filter(item => item.value > 0);
  }, [aggregatoEventi]);

  // Statistiche del Database Locale
  const statsDatabase = useMemo(() => {
    const totaleTransazioni = soci.reduce((acc, s) => acc + (s.quote?.length || 0), 0) + (eventi.length * 2);
    return {
      totaleSoci: soci.length,
      sociAttivi: soci.filter(s => s.attivo).length,
      totaleQuoteRegistrate: soci.reduce((acc, s) => acc + (s.quote?.length || 0), 0),
      totaleEventi: eventi.length,
      eventiConclusi: eventi.filter(e => e.stato === 'concluso').length,
      eventiInProgramma: eventi.filter(e => e.stato === 'in_programma' || e.stato === 'in_corso').length,
      totaleTransazioni,
      statoDatabase: 'Attivo e Sincronizzato',
      storageEngine: 'Indexed Local Storage v2.0 (Persistent Engine)'
    };
  }, [soci, eventi]);

  // Gestione Esportazione CSV Unificato
  const handleEsportaCSV = () => {
    esportaBilancioCompletoCSV(
      soci, 
      eventi, 
      config, 
      filtroAnno === 'tutti' ? undefined : filtroAnno
    );
  };

  // Esportazione CSV Consolidato di Tutti gli Stand Numerati (Tutte le Manifestazioni)
  const handleEsportaTuttiStandCSV = () => {
    const intestazioni = [
      'Manifestazione',
      'Data Inizio',
      'Modello Economico',
      'Numero Stand',
      'Denominazione Stand',
      'Tipologia',
      'Circuito Ristorazione (Food & Beverage)',
      'Responsabile Stand',
      'Spesa Preventivo (€)',
      'Spesa Consuntivo (€)',
      'Differenza Spese (€)',
      'Incasso Previsto (€)',
      'Incasso Consuntivo (€)',
      'Differenza Incassi (€)',
      'Margine Netto Stand (€)',
      'Quota Spettante Cassa Pro Loco (€)'
    ];

    const righe: string[] = [];
    consolidatoGlobaleStand.eventiStandList.forEach(({ evento, stands, quotaProLoco, margineCons }) => {
      const quotaRatio = stands.length > 0 && margineCons !== 0 ? (quotaProLoco / margineCons) : 1;
      stands.forEach(s => {
        const spP = Number(s.spesaPreventivo) || 0;
        const spC = Number(s.spesaConsuntivo) || 0;
        const inP = Number(s.incassoPrevisto) || Number(s.incassoStimato) || 0;
        const inC = Number(s.incassoConsuntivo) || Number(s.incassoStimato) || 0;
        const mC = inC - spC;
        const qStand = Math.round(mC * quotaRatio);

        let mod = 'Nativo (100% Pro Loco)';
        if (evento.tipoEvento === 'ibrido') mod = `Ibrido (${evento.percentualeEntrateProLoco || 50}% Pro Loco)`;
        else if (evento.tipoEvento === 'gestione') mod = `Gestione (${evento.committenteNome || 'Comune'})`;

        righe.push([
          `"${(evento.titolo || '').replace(/"/g, '""')}"`,
          `"${evento.dataInizio || ''}"`,
          `"${mod}"`,
          `"#${s.numero}"`,
          `"${(s.nome || '').replace(/"/g, '""')}"`,
          `"${(s.tipologia || '').replace(/"/g, '""')}"`,
          `"${s.riferimentoFood ? 'SI (Food & Beverage)' : 'NO (Servizi / No-Food)'}"`,
          `"${(s.responsabile || '').replace(/"/g, '""')}"`,
          `"${spP}"`,
          `"${spC}"`,
          `"${spC - spP}"`,
          `"${inP}"`,
          `"${inC}"`,
          `"${inC - inP}"`,
          `"${mC}"`,
          `"${qStand}"`
        ].join(';'));
      });
    });

    const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Consolidato_Stand_Bilancio_${filtroAnno === 'tutti' ? 'Globale' : filtroAnno}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header del Modulo Bilancio Unificato con Database */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-2xl p-5 text-white shadow-sm border border-emerald-700/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Database Pro Loco Unificato</span>
            </span>
            <span className="text-xs text-slate-300">
              Gestione Integrata: <strong>Tesseramenti</strong> + <strong>Eventi</strong>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Bilancio Generale di Esercizio & Rendiconto Cassa</span>
          </h2>

          <p className="text-xs text-slate-300 max-w-3xl font-normal leading-relaxed">
            Quadro riassuntivo contabile per la Pro Loco «{config.nome}». Aggregazione in tempo reale di tutte le quote sociali riscosse, incassi sagre, uscite analitiche e scostamenti di bilancio.
          </p>
        </div>

        {/* Strumenti Rapidi e Selettore Anno */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Selettore Anno Flessibile */}
          <div className="flex items-center bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/20">
            <Calendar className="w-3.5 h-3.5 text-emerald-300 ml-2 mr-1" />
            <select
              value={filtroAnno}
              onChange={(e) => {
                const val = e.target.value;
                const newAnno = val === 'tutti' ? 'tutti' : Number(val);
                setFiltroAnno(newAnno);
                if (newAnno !== 'tutti') onCambiaAnno(newAnno);
              }}
              aria-label="Filtro anno bilancio"
              className="bg-transparent text-white text-xs font-bold rounded px-2 py-1 outline-none cursor-pointer"
            >
              <option value="tutti" className="bg-slate-900 text-white">Tutti gli Anni (Storico Globale)</option>
              {anniDisponibili.map(anno => (
                <option key={anno} value={anno} className="bg-slate-900 text-white">
                  Esercizio {anno}
                </option>
              ))}
            </select>
          </div>

          {/* Stampa Bilancio Ufficiale */}
          <button
            onClick={onApriStampaBilancio}
            className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Stampa Rendiconto A4 Ufficiale per Assemblea dei Soci"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Stampa A4 Ufficiale</span>
          </button>

          {/* Esporta CSV / Excel */}
          <button
            onClick={handleEsportaCSV}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Scarica foglio Excel/CSV con Tesseramenti ed Eventi"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Esporta Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* 2. LE METRICHE DI BILANCIO GLOBALE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* KPI 1: Totale Entrate Complessive */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Entrate Riscosse</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(bilancioGlobale.totaleEntrate || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap justify-between gap-1">
            <span>Quote: <strong>{(totaleQuote || 0).toLocaleString('it-IT')} €</strong></span>
            <span>Eventi: <strong>{(totaliEventi.entrateRealizzate || 0).toLocaleString('it-IT')} €</strong></span>
            <span className="text-emerald-700">Donazioni: <strong>{(totaleDonazioni || 0).toLocaleString('it-IT')} €</strong></span>
          </div>
        </div>

        {/* KPI 2: Totale Uscite & Costi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Uscite & Costi Totali</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(bilancioGlobale.totaleUscite || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Budget Previsto: <strong>{(totaliEventi.budgetPrevisto || 0).toLocaleString('it-IT')} €</strong></span>
            <span className={(totaliEventi.differenzaCosti || 0) <= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
              {(totaliEventi.differenzaCosti || 0) > 0 ? `+${(totaliEventi.differenzaCosti || 0)}` : (totaliEventi.differenzaCosti || 0)} €
            </span>
          </div>
        </div>

        {/* KPI 3: Risultato Netto (Avanzo / Disavanzo di Gestione) */}
        <div className={`p-4 rounded-xl border shadow-2xs space-y-2 ${
          (bilancioGlobale.avanzoGestione || 0) >= 0 
            ? 'bg-emerald-50/70 border-emerald-300' 
            : 'bg-rose-50/70 border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              (bilancioGlobale.avanzoGestione || 0) >= 0 ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              3. {(bilancioGlobale.avanzoGestione || 0) >= 0 ? 'Avanzo Cassa' : 'Disavanzo Cassa'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              (bilancioGlobale.avanzoGestione || 0) >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
            }`}>
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono ${
              (bilancioGlobale.avanzoGestione || 0) >= 0 ? 'text-emerald-900' : 'text-rose-700'
            }`}>
              {((bilancioGlobale.avanzoGestione || 0) >= 0 ? '+' : '')}
              {(bilancioGlobale.avanzoGestione || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 font-medium truncate">
            {(bilancioGlobale.avanzoGestione || 0) >= 0 
              ? 'Fondi reinvestibili in attività Pro Loco' 
              : 'Disavanzo contabile dell\'esercizio'}
          </div>
        </div>

        {/* KPI 4: Quote da Incassare (Crediti Verso Soci per Rinnovi) */}
        <div className={`p-4 rounded-xl border shadow-2xs space-y-2 transition-all ${
          (totaleQuoteDaIncassare || 0) > 0 
            ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200/60' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              4. Quote da Incassare
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {(totaleQuoteDaIncassare || 0).toLocaleString('it-IT')} €
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              ({sociNonRinnovati.length} soci)
            </span>
          </div>
          <div className="pt-2 border-t border-amber-200/70 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 truncate" title={`Scadenza: ${scadenzaQuote.dataScadenzaEsercizio}`}>
              Scad: <strong>{scadenzaQuote.dataScadenzaEsercizio}</strong>
            </span>
            {(totaleQuoteDaIncassare || 0) > 0 && (
              <button
                onClick={() => setMostraModalPromemoria(true)}
                className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer flex items-center gap-0.5"
                title="Invia promemoria rinnovo quote ai soci"
              >
                <Bell className="w-3 h-3 text-amber-600" />
                <span>Sollecita</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI 5: Indicatori Territoriali e Database */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">5. Partecipazione</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(totaliEventi.partecipantiStimati || 0).toLocaleString('it-IT')}
            </span>
            <span className="text-xs text-slate-500 font-medium">presenze stimate</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Soci in regola: <strong>{sociTesseratiNellAnno.length}</strong></span>
            <span>Eventi: <strong>{eventiFiltrati.length}</strong></span>
          </div>
        </div>

        {/* KPI 6: Economia Stand Numerati & Circuiti */}
        <div 
          onClick={() => {
            const el = document.getElementById('sezione-macro-stand-consolidata');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white hover:bg-emerald-50/40 transition-colors cursor-pointer p-4 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs space-y-2 group"
          title="Clicca per visualizzare il Consolidato Stand nel Bilancio Generale"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700">6. Stand Numerati</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-200">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono ${consolidatoGlobaleStand.margineCons >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
              {consolidatoGlobaleStand.margineCons >= 0 ? '+' : ''}{(consolidatoGlobaleStand.margineCons || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Stand: <strong>{consolidatoGlobaleStand.totalStandCount}</strong> ({consolidatoGlobaleStand.foodCount} Food)</span>
            <span className="text-emerald-700 font-bold group-hover:underline">Consolidato ↓</span>
          </div>
        </div>

      </div>

      {/* BANNER PROPOSTA QUOTE DA INCASSARE & SCADENZA STATUTARIA */}
      {(totaleQuoteDaIncassare || 0) > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/70 border border-amber-300 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-950">
                  Proposta Quote da Incassare {annoRiferimentoQuote}: {sociNonRinnovati.length} soci in attesa di rinnovo
                </span>
                <span className="font-black text-emerald-800 bg-white/90 border border-amber-300 px-2 py-0.5 rounded font-mono">
                  Totale da incassare: € {(totaleQuoteDaIncassare || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-amber-800/90 mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  <strong>Data Scadenza Esercizio:</strong> {scadenzaQuote.dataScadenzaEsercizio} ({scadenzaQuote.etichettaTempo})
                </span>
                <span className="hidden md:inline">•</span>
                <span className="text-amber-900/80">
                  Termine diritto di voto assemblea: <strong>{scadenzaQuote.dataLimiteAssemblea}</strong>
                </span>
                <span className="hidden md:inline">•</span>
                <span className="text-slate-700">
                  Avanzo potenziale con quote incassate: <strong className="font-mono text-emerald-800">€ {(potenzialeAvanzoConQuote || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                setSottoTab('tesseramenti');
                setMostraSociDaIncassare(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Vedi Dettaglio Soci
            </button>
            <button
              onClick={() => setMostraModalPromemoria(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invia Promemoria Rapido</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SUB-NAVIGAZIONE SCHEDE BILANCIO */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSottoTab('quadro')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            sottoTab === 'quadro' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          <span>Quadro Finanziario & Grafici</span>
        </button>

        <button
          onClick={() => setSottoTab('tesseramenti')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            sottoTab === 'tesseramenti' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Riepilogo Tesseramenti ({quoteFiltrate.length} quote)</span>
        </button>

        <button
          onClick={() => setSottoTab('eventi')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            sottoTab === 'eventi' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PartyPopper className="w-4 h-4" />
          <span>Riepilogo Manifestazioni ({eventiFiltrati.length} eventi)</span>
        </button>

        <button
          onClick={() => setSottoTab('donazioni')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            sottoTab === 'donazioni' 
              ? 'bg-rose-700 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <span>Donazioni da Terzi ({donazioniFiltrate.length} • € {totaleDonazioni.toLocaleString('it-IT')})</span>
        </button>

        <button
          onClick={() => setSottoTab('runts')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            sottoTab === 'runts' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Bilancio RUNTS & Normativa (Mod. D)</span>
        </button>

        <button
          onClick={() => setSottoTab('database')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ml-auto ${
            sottoTab === 'database' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Stato Database</span>
        </button>
      </div>

      {/* 4. CONTENUTO SPECIFICO DEL SOTTO-TAB */}

      {/* SOTTO-TAB 1: QUADRO FINANZIARIO & GRAFICI INTERATTIVI */}
      {sottoTab === 'quadro' && (
        <div className="space-y-6">
          
          {/* Due Grafici a Torta Affiancati: Entrate vs Uscite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Torta 1: Composizione delle ENTRATE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    <span>Ripartizione delle Entrate Pro Loco</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Incasso complessivo: <strong>{(bilancioGlobale.totaleEntrate || 0).toLocaleString('it-IT')} €</strong>
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {filtroAnno === 'tutti' ? 'Storico Totale' : `Anno ${filtroAnno}`}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datiGraficoEntrate}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {datiGraficoEntrate.map((entry, index) => (
                        <Cell key={`cell-entrate-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(val: any) => [`${(Number(val) || 0).toLocaleString('it-IT')} €`, 'Entrata']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda Cromatica Dettagliata */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                {datiGraficoEntrate.map(item => {
                  const perc = bilancioGlobale.totaleEntrate > 0 
                    ? (((item.value || 0) / bilancioGlobale.totaleEntrate) * 100).toFixed(1) 
                    : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900 ml-2 shrink-0">{(item.value || 0).toLocaleString('it-IT')}€ ({perc}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Torta 2: Composizione delle USCITE & SPESE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                    <span>Ripartizione Spese (Food, Spettacoli, Allestimenti, Varie)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Spese complessive: <strong>{(bilancioGlobale.totaleUscite || 0).toLocaleString('it-IT')} €</strong>
                  </p>
                </div>
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  {filtroAnno === 'tutti' ? 'Storico Totale' : `Anno ${filtroAnno}`}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datiGraficoUscite}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {datiGraficoUscite.map((entry, index) => (
                        <Cell key={`cell-uscite-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(val: any) => [`${(Number(val) || 0).toLocaleString('it-IT')} €`, 'Spesa']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda Cromatica Dettagliata Spese */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                {datiGraficoUscite.map(item => {
                  const perc = bilancioGlobale.totaleUscite > 0 
                    ? (((item.value || 0) / bilancioGlobale.totaleUscite) * 100).toFixed(1) 
                    : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900 ml-2 shrink-0">{(item.value || 0).toLocaleString('it-IT')}€ ({perc}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Grafico a Barre: Confronto Entrate vs Uscite per ciascuna Manifestazione */}
          {datiGraficoBarreEventi.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    <span>Confronto Economico Iniziative Territoriali (Entrate vs Spese)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Redditività e tenuta finanziaria per ciascuna manifestazione principale
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datiGraficoBarreEventi} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="titolo" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(val: any) => [`${(Number(val) || 0).toLocaleString('it-IT')} €`]} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="Entrate" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Uscite" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Utile" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* QUADRO MACRO ECONOMICO CONSOLIDATO DEGLI STAND NUMERATI & MODELLI DI GESTIONE */}
          {/* ========================================================================= */}
          <div id="sezione-macro-stand-consolidata" className="space-y-6 pt-3">
            
            {/* Header di Sezione con Gradiente Scuro e Strumenti */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 rounded-2xl p-5 text-white shadow-sm border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                    <Store className="w-3 h-3 text-emerald-400" />
                    <span>Consolidato Macro Stand & Circuiti Enogastronomici</span>
                  </span>
                  <span className="text-xs text-slate-300">
                    Esercizio: <strong>{filtroAnno === 'tutti' ? 'Storico Globale' : `Anno ${filtroAnno}`}</strong>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Quadro Economico Generale degli Stand Numerati</span>
                </h3>

                <p className="text-xs text-slate-300 max-w-3xl font-normal leading-relaxed">
                  Aggregazione in tempo reale di tutti gli stand numerati operativi ({consolidatoGlobaleStand.totalStandCount} stand totali: {consolidatoGlobaleStand.foodCount} Food & Beverage, {consolidatoGlobaleStand.nonFoodCount} Servizi / No-Food) con quadratura tra preventivo e consuntivo, differenze di cassa e integrazione diretta con i 3 modelli economici (Nativi 100%, Ibridi e Gestione).
                </p>
              </div>

              {/* Bottoni Rapidi Azione */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleEsportaTuttiStandCSV}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Esporta foglio Excel/CSV con tutti gli stand di tutte le manifestazioni"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Esporta CSV Stand</span>
                </button>

                <button
                  onClick={() => setSottoTab('eventi')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Accedi al dettaglio dei singoli eventi e modifica i singoli stand"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Dettaglio Manifestazioni</span>
                </button>
              </div>
            </div>

            {/* 4 Macro KPI Card Stand nel Bilancio Generale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* KPI 1: Spese Stand Consolidate */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Spese Stand Consolidate</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {(consolidatoGlobaleStand.totSpesaCons || 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Preventivo: <strong>{(consolidatoGlobaleStand.totSpesaPrev || 0).toLocaleString('it-IT')} €</strong></span>
                  <span className={(consolidatoGlobaleStand.diffSpesa || 0) <= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {(consolidatoGlobaleStand.diffSpesa || 0) > 0 ? `+${(consolidatoGlobaleStand.diffSpesa || 0).toLocaleString('it-IT')}` : (consolidatoGlobaleStand.diffSpesa || 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Incidenza uscite ente: <strong>{consolidatoGlobaleStand.incidenzaSpese}%</strong>
                </div>
              </div>

              {/* KPI 2: Incassi Stand Consolidati */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Incassi Stand Consolidati</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {(consolidatoGlobaleStand.totIncassoCons || 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Previsto: <strong>{(consolidatoGlobaleStand.totIncassoPrev || 0).toLocaleString('it-IT')} €</strong></span>
                  <span className={(consolidatoGlobaleStand.diffIncasso || 0) >= 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {(consolidatoGlobaleStand.diffIncasso || 0) >= 0 ? `+${(consolidatoGlobaleStand.diffIncasso || 0).toLocaleString('it-IT')}` : (consolidatoGlobaleStand.diffIncasso || 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Incidenza entrate ente: <strong>{consolidatoGlobaleStand.incidenzaIncassi}%</strong>
                </div>
              </div>

              {/* KPI 3: Margine Operativo Stand Netto */}
              <div className={`p-4 rounded-xl border shadow-2xs space-y-2 ${
                (consolidatoGlobaleStand.margineCons || 0) >= 0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    (consolidatoGlobaleStand.margineCons || 0) >= 0 ? 'text-emerald-900' : 'text-rose-900'
                  }`}>
                    3. Margine Netto Stand
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    (consolidatoGlobaleStand.margineCons || 0) >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                  }`}>
                    <Euro className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black font-mono ${
                    (consolidatoGlobaleStand.margineCons || 0) >= 0 ? 'text-emerald-900' : 'text-rose-700'
                  }`}>
                    {(consolidatoGlobaleStand.margineCons || 0) >= 0 ? '+' : ''}
                    {(consolidatoGlobaleStand.margineCons || 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-700 flex justify-between">
                  <span>Quota Cassa Pro Loco:</span>
                  <strong className="text-emerald-800 font-mono font-black">+{(consolidatoGlobaleStand.totQuotaProLoco || 0).toLocaleString('it-IT')} €</strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  Scostamento vs preventivo: {consolidatoGlobaleStand.diffMargine >= 0 ? `+${consolidatoGlobaleStand.diffMargine.toLocaleString('it-IT')} €` : `${consolidatoGlobaleStand.diffMargine.toLocaleString('it-IT')} €`}
                </div>
              </div>

              {/* KPI 4: Presidio Stand & Circuiti */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Stand Attivi & Circuiti</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {consolidatoGlobaleStand.totalStandCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">postazioni complessive</span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between">
                  <span>Food & Beverage: <strong>{consolidatoGlobaleStand.foodCount}</strong></span>
                  <span>Servizi / No-Food: <strong>{consolidatoGlobaleStand.nonFoodCount}</strong></span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Food incassi: <strong>{(consolidatoGlobaleStand.incassoFoodCons || 0).toLocaleString('it-IT')} €</strong> (spesa: {(consolidatoGlobaleStand.spesaFoodCons || 0).toLocaleString('it-IT')} €)
                </div>
              </div>

            </div>

            {/* Matrice Comparativa dei 3 Modelli di Gestione Economica */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Confronto Flussi Finanziari per Modello di Gestione Economica</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Spaccato dei 3 regimi operativi adottati per le manifestazioni territoriali
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Modello 1: Eventi Nativi (100% Pro Loco) */}
                <div className="bg-white rounded-xl border border-emerald-200 shadow-2xs p-4 space-y-3 border-t-4 border-t-emerald-600">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>1. Eventi Nativi (100% Pro Loco)</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">{consolidatoGlobaleStand.perModello.nativo.eventi} manifestazioni</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Organizzazione e rischio d'impresa interamente in capo alla Pro Loco. Il 100% delle spese e degli incassi confluisce nel bilancio dell'ente.
                  </p>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stand Operativi:</span>
                      <strong className="text-slate-900 font-mono">{consolidatoGlobaleStand.perModello.nativo.stand} postazioni</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spese Stand (Prev / Cons):</span>
                      <span className="font-mono text-slate-900">
                        {consolidatoGlobaleStand.perModello.nativo.spesaPrev.toLocaleString('it-IT')} € / <strong>{consolidatoGlobaleStand.perModello.nativo.spesaCons.toLocaleString('it-IT')} €</strong>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Incassi Stand (Prev / Cons):</span>
                      <span className="font-mono text-slate-900">
                        {consolidatoGlobaleStand.perModello.nativo.incassoPrev.toLocaleString('it-IT')} € / <strong>{consolidatoGlobaleStand.perModello.nativo.incassoCons.toLocaleString('it-IT')} €</strong>
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Utile Netto a Cassa Pro Loco:</span>
                    <span className="text-sm font-black text-emerald-950 font-mono">
                      +{consolidatoGlobaleStand.perModello.nativo.quotaProLoco.toLocaleString('it-IT')} €
                    </span>
                  </div>
                </div>

                {/* Modello 2: Eventi Ibridi (Co-organizzati) */}
                <div className="bg-white rounded-xl border border-violet-200 shadow-2xs p-4 space-y-3 border-t-4 border-t-violet-600">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 flex items-center gap-1">
                      <Handshake className="w-3 h-3" />
                      <span>2. Eventi Ibridi (Co-organizzati)</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">{consolidatoGlobaleStand.perModello.ibrido.eventi} manifestazioni</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Manifestazioni in convenzione con partner (Comune, Commercianti). Spese ed entrate lorde degli stand ripartite secondo quote pattuite.
                  </p>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stand Operativi:</span>
                      <strong className="text-slate-900 font-mono">{consolidatoGlobaleStand.perModello.ibrido.stand} postazioni</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spese Lorde Stand:</span>
                      <span className="font-mono text-slate-900 font-semibold">{consolidatoGlobaleStand.perModello.ibrido.spesaCons.toLocaleString('it-IT')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Incassi Lordi Stand:</span>
                      <span className="font-mono text-slate-900 font-semibold">{consolidatoGlobaleStand.perModello.ibrido.incassoCons.toLocaleString('it-IT')} €</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Quota Spettante Partner:</span>
                      <span className="font-mono text-violet-700 font-bold">+{consolidatoGlobaleStand.perModello.ibrido.quotaPartner.toLocaleString('it-IT')} €</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-900">Quota Utile Netto Pro Loco:</span>
                    <span className="text-sm font-black text-violet-950 font-mono">
                      +{consolidatoGlobaleStand.perModello.ibrido.quotaProLoco.toLocaleString('it-IT')} €
                    </span>
                  </div>
                </div>

                {/* Modello 3: Eventi Gestione (Conto Terzi) */}
                <div className="bg-white rounded-xl border border-amber-200 shadow-2xs p-4 space-y-3 border-t-4 border-t-amber-600">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>3. Eventi Gestione (Conto Terzi)</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">{consolidatoGlobaleStand.perModello.gestione.eventi} manifestazioni</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gestione logistica ed enogastronomica su commissione. Spese stand anticipate e integralmente rimborsate a piè di lista + compenso di gestione garantito.
                  </p>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stand Operativi:</span>
                      <strong className="text-slate-900 font-mono">{consolidatoGlobaleStand.perModello.gestione.stand} postazioni</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spese Anticipate Stand:</span>
                      <span className="font-mono text-slate-900">{consolidatoGlobaleStand.perModello.gestione.spesaCons.toLocaleString('it-IT')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rimborsi Committente (100%):</span>
                      <span className="font-mono text-slate-900 font-semibold">{consolidatoGlobaleStand.perModello.gestione.rimborsi.toLocaleString('it-IT')} €</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Rischio d'Impresa:</span>
                      <span className="font-bold text-emerald-700">Rischio Zero Garantito</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">Compenso Netto Pro Loco (Fee):</span>
                    <span className="text-sm font-black text-amber-950 font-mono">
                      +{consolidatoGlobaleStand.perModello.gestione.quotaProLoco.toLocaleString('it-IT')} €
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Tabella Riassuntiva Macro di Tutti gli Eventi con Stand Numerati */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Tabella Riassuntiva Stand Consolidata di Tutte le Manifestazioni</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Prospetto macro con sommatoria totale di preventivi, consuntivi, differenze e ripartizione
                  </p>
                </div>

                {/* Filtri Circuito Stand */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setFiltroCircuitoStandQuadro('tutti')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCircuitoStandQuadro === 'tutti'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tutti gli Stand ({consolidatoGlobaleStand.totalStandCount})
                  </button>
                  <button
                    onClick={() => setFiltroCircuitoStandQuadro('food')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCircuitoStandQuadro === 'food'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Food & Beverage ({consolidatoGlobaleStand.foodCount})
                  </button>
                  <button
                    onClick={() => setFiltroCircuitoStandQuadro('non_food')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCircuitoStandQuadro === 'non_food'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Servizi / No-Food ({consolidatoGlobaleStand.nonFoodCount})
                  </button>
                </div>
              </div>

              {/* Tabella con Overflow Orizzontale */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10.5px]">
                      <th className="p-3">Manifestazione</th>
                      <th className="p-3 text-center">Modello Economico</th>
                      <th className="p-3 text-center">N° Stand Attivi</th>
                      <th className="p-3 text-right">Spesa Prev. (€)</th>
                      <th className="p-3 text-right">Spesa Cons. (€)</th>
                      <th className="p-3 text-right">Diff. Spesa (€)</th>
                      <th className="p-3 text-right">Incasso Prev. (€)</th>
                      <th className="p-3 text-right">Incasso Cons. (€)</th>
                      <th className="p-3 text-right">Diff. Incasso (€)</th>
                      <th className="p-3 text-right font-black">Margine Stand (€)</th>
                      <th className="p-3 text-right font-black">Quota Cassa Pro Loco (€)</th>
                      <th className="p-3 text-center">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventiStandFiltratiPerCircuito.map(({ evento, standsCount, foodCount, nonFoodCount, spesaPrev, spesaCons, diffSpesa, incassoPrev, incassoCons, diffIncasso, margineCons, quotaProLoco }) => {
                      const tipo = evento.tipoEvento || 'nativo';
                      let badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                          Nativo (100%)
                        </span>
                      );
                      if (tipo === 'ibrido') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200 whitespace-nowrap">
                            Ibrido ({evento.percentualeEntrateProLoco || 50}%)
                          </span>
                        );
                      } else if (tipo === 'gestione') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            Gestione ({evento.committenteNome || 'Comune'})
                          </span>
                        );
                      }

                      return (
                        <tr key={evento.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-medium">
                            <span className="block text-slate-900 font-bold">{evento.titolo}</span>
                            <span className="text-[11px] text-slate-500">{evento.categoria} • {evento.dataInizio} • {evento.luogo}</span>
                          </td>
                          <td className="p-3 text-center">
                            {badge}
                          </td>
                          <td className="p-3 text-center font-mono">
                            <span className="font-bold text-slate-900">{standsCount} stand</span>
                            <span className="block text-[10px] text-slate-500 font-normal">
                              ({foodCount} F&B • {nonFoodCount} Servizi)
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            {(spesaPrev || 0).toLocaleString('it-IT')} €
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {(spesaCons || 0).toLocaleString('it-IT')} €
                          </td>
                          <td className="p-3 text-right font-mono text-[11px]">
                            <span className={`px-2 py-0.5 rounded-md font-bold inline-block ${
                              diffSpesa <= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {diffSpesa <= 0 ? `${diffSpesa.toLocaleString('it-IT')} €` : `+${diffSpesa.toLocaleString('it-IT')} €`}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            {(incassoPrev || 0).toLocaleString('it-IT')} €
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-800">
                            {(incassoCons || 0).toLocaleString('it-IT')} €
                          </td>
                          <td className="p-3 text-right font-mono text-[11px]">
                            <span className={`px-2 py-0.5 rounded-md font-bold inline-block ${
                              diffIncasso >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {diffIncasso >= 0 ? `+${diffIncasso.toLocaleString('it-IT')} €` : `${diffIncasso.toLocaleString('it-IT')} €`}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            <span className={margineCons >= 0 ? 'text-emerald-800' : 'text-rose-700'}>
                              {margineCons >= 0 ? '+' : ''}{margineCons.toLocaleString('it-IT')} €
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-950">
                            <span className={quotaProLoco >= 0 ? 'text-emerald-900 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block' : 'text-rose-900 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 inline-block'}>
                              {quotaProLoco >= 0 ? '+' : ''}{quotaProLoco.toLocaleString('it-IT')} €
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSottoTab('eventi');
                                setEventoSelezionatoPerStandId(evento.id);
                                setTimeout(() => {
                                  const el = document.getElementById('sezione-macro-stand');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 150);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Visualizza e gestisci gli stand di questa specifica manifestazione"
                            >
                              <Store className="w-3 h-3" />
                              <span>Stand Singoli</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Riga TFOOT con la Sommatoria Complessiva */}
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-950">
                    <tr>
                      <td colSpan={2} className="p-3 font-black uppercase text-slate-900">
                        TOTALE MACRO GENERALE {filtroCircuitoStandQuadro === 'food' ? 'CIRCUITO FOOD & BEVERAGE' : filtroCircuitoStandQuadro === 'non_food' ? 'CIRCUITO SERVIZI & NO-FOOD' : 'TUTTI GLI STAND'}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {totaliTabellaStandFiltrata.totStands} stand
                        <span className="block text-[10px] text-slate-500 font-normal">
                          ({totaliTabellaStandFiltrata.totFood} F&B • {totaliTabellaStandFiltrata.totNonFood} Servizi)
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {(totaliTabellaStandFiltrata.spesaPrev || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-950">
                        {(totaliTabellaStandFiltrata.spesaCons || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md font-black inline-block ${
                          totaliTabellaStandFiltrata.diffSpesa <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {totaliTabellaStandFiltrata.diffSpesa <= 0 ? `${totaliTabellaStandFiltrata.diffSpesa.toLocaleString('it-IT')} €` : `+${totaliTabellaStandFiltrata.diffSpesa.toLocaleString('it-IT')} €`}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {(totaliTabellaStandFiltrata.incassoPrev || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-950">
                        {(totaliTabellaStandFiltrata.incassoCons || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md font-black inline-block ${
                          totaliTabellaStandFiltrata.diffIncasso >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {totaliTabellaStandFiltrata.diffIncasso >= 0 ? `+${totaliTabellaStandFiltrata.diffIncasso.toLocaleString('it-IT')} €` : `${totaliTabellaStandFiltrata.diffIncasso.toLocaleString('it-IT')} €`}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-950">
                        <span className={totaliTabellaStandFiltrata.margineCons >= 0 ? 'text-emerald-900' : 'text-rose-800'}>
                          {totaliTabellaStandFiltrata.margineCons >= 0 ? '+' : ''}{totaliTabellaStandFiltrata.margineCons.toLocaleString('it-IT')} €
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-950">
                        <span className="bg-emerald-100 text-emerald-950 px-2 py-1 rounded-md border border-emerald-300 inline-block font-mono">
                          +{totaliTabellaStandFiltrata.quotaProLoco.toLocaleString('it-IT')} €
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] text-slate-500 font-normal">Consolidato</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SOTTO-TAB 2: GESTIONE RIASSUNTIVA DI TUTTI I TESSERAMENTI */}
      {sottoTab === 'tesseramenti' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-6 p-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Riepilogo Analitico dei Tesseramenti & Quote Sociali</span>
              </h3>
              <p className="text-xs text-slate-500">
                Totale quote incassate nel periodo: <strong className="text-emerald-700 font-mono font-black">{(totaleQuote || 0).toLocaleString('it-IT')} €</strong> ({quoteFiltrate.length} soci in regola)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Soci Attivi nell'Anagrafe: <strong>{soci.length}</strong>
              </span>
              <span className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                Da rinnovare: <strong>{sociDaRinnovareNellAnno.length}</strong>
              </span>
            </div>
          </div>

          {/* Griglia 1: Ripartizione Quote per Categoria Socio */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Quote Riscosse per Categoria Associativa (Consuntivo Cassa)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.keys(quotePerCategoria).map((cat) => {
                const dati = quotePerCategoria[cat];
                return (
                  <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block truncate">{cat}</span>
                    <span className="text-lg font-black text-slate-900 font-mono block">
                      {(dati.importo || 0).toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10.5px] text-slate-500 block">
                      {dati.conteggio} soci registrati
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEZIONE 2: QUOTE SOCIALI PROPOSTE DA INCASSARE & CREDITI VERSO SOCI */}
          <div className="bg-amber-50/40 rounded-2xl border border-amber-300/80 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                    <span>2. Quote Sociali Proposte da Incassare & Crediti Esercizio {annoRiferimentoQuote}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                      {sociNonRinnovati.length} da rinnovare
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Proiezione entrate quote dei soci attivi non ancora regolarizzate per l'anno sociale di riferimento.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setMostraSociDaIncassare(!mostraSociDaIncassare)}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {mostraSociDaIncassare ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{mostraSociDaIncassare ? 'Nascondi Soci' : 'Mostra Soci'}</span>
                </button>

                <button
                  onClick={() => setMostraModalPromemoria(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Promemoria / Sollecito</span>
                </button>
              </div>
            </div>

            {/* Riquadri Statistiche e Scadenza */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <span className="text-[10.5px] font-bold text-amber-800 uppercase block">Totale da Incassare</span>
                <span className="text-xl font-black text-amber-700 font-mono block mt-0.5">
                  {(totaleQuoteDaIncassare || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {sociNonRinnovati.length} soci in attesa di versamento
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <span className="text-[10.5px] font-bold text-amber-800 uppercase block">Scadenza Statutaria</span>
                <span className="text-sm font-black text-slate-900 block mt-1">
                  {scadenzaQuote.dataScadenzaEsercizio}
                </span>
                <span className={`text-[10px] font-bold block mt-0.5 ${
                  scadenzaQuote.scaduto ? 'text-rose-600' : 'text-amber-700'
                }`}>
                  {scadenzaQuote.etichettaTempo}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <span className="text-[10.5px] font-bold text-amber-800 uppercase block">Termine Assemblea Soci</span>
                <span className="text-sm font-black text-slate-900 block mt-1">
                  {scadenzaQuote.dataLimiteAssemblea}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Termine per diritto di voto e presenza
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <span className="text-[10.5px] font-bold text-amber-800 uppercase block">Entrata Teorica Tesseramento</span>
                <span className="text-xl font-black text-emerald-800 font-mono block mt-0.5">
                  {((totaleQuote || 0) + (totaleQuoteDaIncassare || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Riscosso al: {(totaleQuote || 0) + (totaleQuoteDaIncassare || 0) > 0 ? Math.round(((totaleQuote || 0) / ((totaleQuote || 0) + (totaleQuoteDaIncassare || 0))) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Ripartizione Quote da Incassare per Categoria */}
            {Object.keys(quoteDaIncassarePerCategoria).length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                  Ripartizione Quote Previste per Categoria Socio:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Object.keys(quoteDaIncassarePerCategoria).map((cat) => {
                    const item = quoteDaIncassarePerCategoria[cat];
                    return (
                      <div key={cat} className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs">
                        <span className="font-bold text-slate-800 block truncate">{cat}</span>
                        <span className="text-base font-black text-amber-700 font-mono block mt-0.5">
                          {(item.importo || 0).toLocaleString('it-IT')} €
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {item.conteggio} soci • {item.quotaUnitaria}€ cad.
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabella Dettagliata dei Soci che devono ancora rinnovare */}
            {mostraSociDaIncassare && sociNonRinnovati.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                    Elenco Soci in Attesa di Rinnovo ({sociNonRinnovati.length} nominativi):
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    Clicca su un'icona per inviare notifica immediata o registrare il saldo
                  </span>
                </div>

                <div className="overflow-x-auto border border-amber-200 rounded-xl bg-white max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-amber-100/80 text-amber-950 font-bold text-[10.5px] uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-2 px-3">Tessera</th>
                        <th className="py-2 px-3">Socio</th>
                        <th className="py-2 px-3">Categoria</th>
                        <th className="py-2 px-3 text-right">Quota Prevista</th>
                        <th className="py-2 px-3">Scadenza</th>
                        <th className="py-2 px-3">Contatti</th>
                        <th className="py-2 px-3 text-center">Azioni Rapide</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sociNonRinnovati.map((itemSocio) => {
                        const { socio, importoDovuto, scadenza } = itemSocio;
                        const telPulito = (socio.telefono || socio.cellulare || '').replace(/[^0-9]/g, '');
                        const haWhatsApp = telPulito.length >= 8;
                        const haEmail = socio.email && socio.email.includes('@');
                        const templateCaloroso = TEMPLATE_PROMEMORIA_PREDEFINITI.find(t => t.id === 'caloroso') || TEMPLATE_PROMEMORIA_PREDEFINITI[0];
                        const templateIstituzionale = TEMPLATE_PROMEMORIA_PREDEFINITI.find(t => t.id === 'istituzionale') || TEMPLATE_PROMEMORIA_PREDEFINITI[0];
                        const testoWhatsApp = compilaTemplatePromemoria(templateCaloroso.testo, itemSocio, annoRiferimentoQuote, config);
                        const oggettoEmail = compilaTemplatePromemoria(templateIstituzionale.oggetto, itemSocio, annoRiferimentoQuote, config);
                        const testoEmail = compilaTemplatePromemoria(templateIstituzionale.testo, itemSocio, annoRiferimentoQuote, config);

                        return (
                          <tr key={socio.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">
                              {socio.numeroTessera}
                            </td>
                            <td className="py-2 px-3">
                              <strong className="text-slate-900 block">{socio.cognome} {socio.nome}</strong>
                              <span className="text-[10px] text-slate-500 block font-mono">{socio.codiceFiscale}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-medium">
                              {socio.categoria}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                              {(importoDovuto || 0).toLocaleString('it-IT')} €
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[11px] font-medium text-slate-700 block">
                                {scadenza.dataScadenzaEsercizio}
                              </span>
                              <span className="text-[10px] text-amber-800 block">
                                {scadenza.etichettaTempo}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {haEmail && <div className="truncate max-w-[140px]" title={socio.email}>{socio.email}</div>}
                              {haWhatsApp && <div>{socio.cellulare || socio.telefono}</div>}
                              {!haEmail && !haWhatsApp && <span className="text-slate-400 italic">Nessun contatto</span>}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {haWhatsApp && (
                                  <a
                                    href={`https://wa.me/${telPulito}?text=${encodeURIComponent(testoWhatsApp)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    title="Invia promemoria WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {haEmail && (
                                  <a
                                    href={`mailto:${socio.email}?subject=${encodeURIComponent(oggettoEmail)}&body=${encodeURIComponent(testoEmail)}`}
                                    className="p-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                                    title="Invia promemoria Email"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {onRegistraPagamento && (
                                  <button
                                    onClick={() => onRegistraPagamento(socio)}
                                    className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-bold transition-colors cursor-pointer"
                                    title="Registra pagamento quota a cassa"
                                  >
                                    Incassa
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Griglia 3: Metodi di Pagamento Cassa Quote */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Metodi di Pagamento Registrati a Cassa (Consuntivo)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(quotePerMetodo).map((metodo) => {
                const dati = quotePerMetodo[metodo];
                return (
                  <div key={metodo} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{metodo}</span>
                    </div>
                    <span className="text-lg font-black text-emerald-950 font-mono block">
                      {(dati.importo || 0).toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10.5px] text-emerald-700 block">
                      {dati.conteggio} transazioni contabili
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabella Dettagliata di Tutte le Quote */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Libro Cassa Quote & Ricevute Emesse
              </h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca socio o ricevuta..."
                  value={ricercaTesto}
                  onChange={(e) => setRicercaTesto(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Ricevuta</th>
                    <th className="py-2.5 px-3">Socio & Tessera</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Anno Sociale</th>
                    <th className="py-2.5 px-3 text-right">Importo Quota</th>
                    <th className="py-2.5 px-3">Data Pagamento</th>
                    <th className="py-2.5 px-3">Metodo</th>
                    <th className="py-2.5 px-3 text-center">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteFiltrate
                    .filter(({ socio, quota }) => {
                      if (!ricercaTesto) return true;
                      const q = ricercaTesto.toLowerCase();
                      return (
                        socio.nome.toLowerCase().includes(q) ||
                        socio.cognome.toLowerCase().includes(q) ||
                        socio.numeroTessera.toLowerCase().includes(q) ||
                        (quota.ricevutaNumero || '').toLowerCase().includes(q)
                      );
                    })
                    .map(({ socio, quota }) => (
                      <tr key={quota.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {quota.ricevutaNumero || 'REC-PROLOC'}
                        </td>
                        <td className="py-2 px-3">
                          <strong className="text-slate-900 block">{socio.cognome} {socio.nome}</strong>
                          <span className="text-[10px] text-slate-500 font-mono block">{socio.numeroTessera}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-medium">
                          {socio.categoria}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-800">
                          {quota.anno}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {(quota.importo || 0).toLocaleString('it-IT')} €
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {quota.dataPagamento}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10.5px]">
                            {quota.metodo}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {onVaiASocio && (
                            <button
                              onClick={() => onVaiASocio(socio.id)}
                              className="text-emerald-700 hover:text-emerald-950 text-[11px] font-bold cursor-pointer"
                            >
                              Apri Scheda
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SOTTO-TAB 3: GESTIONE RIASSUNTIVA DI TUTTI GLI EVENTI */}
      {sottoTab === 'eventi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-6 p-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-emerald-700" />
                <span>Riepilogo Dettagliato Manifestazioni, Bilancio Eventi & Tipologie</span>
              </h3>
              <p className="text-xs text-slate-500">
                Spese Competenza Pro Loco: <strong className="text-slate-900">{(totaliEventi.costiConsuntivo || 0).toLocaleString('it-IT')} €</strong> • Incassi di Competenza: <strong className="text-emerald-700">{(totaliEventi.entrateRealizzate || 0).toLocaleString('it-IT')} €</strong> • Margine Netto: <strong className={(totaliEventi.margineEventi || 0) >= 0 ? 'text-emerald-800' : 'text-rose-700'}>{((totaliEventi.margineEventi || 0) >= 0 ? '+' : '')}{(totaliEventi.margineEventi || 0).toLocaleString('it-IT')} €</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg">
                {eventiFiltrati.length} manifestazioni registrate
              </span>
            </div>
          </div>

          {/* 1. Ripartizione per le 3 Tipologie Evento (Nativo, Ibrido, Gestione) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Tipo 1: Nativo */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>1. Eventi Nativi Pro Loco</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {totaliEventi.eventiNativiCount} eventi
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Organizzati interamente dall'Associazione (100% costi ed incassi nel bilancio sociale).
              </p>
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 text-[11px]">Entrate: <strong>{(totaliEventi.nativi?.entrate || 0).toLocaleString('it-IT')} €</strong></span>
                <span className="text-slate-600 text-[11px]">Costi: <strong>{(totaliEventi.nativi?.costi || 0).toLocaleString('it-IT')} €</strong></span>
                <span className={`font-bold ${(totaliEventi.nativi?.margine || 0) >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                  {(totaliEventi.nativi?.margine || 0) >= 0 ? '+' : ''}{(totaliEventi.nativi?.margine || 0).toLocaleString('it-IT')} €
                </span>
              </div>
            </div>

            {/* Tipo 2: Ibrido */}
            <div className="p-3.5 rounded-xl border border-violet-200 bg-violet-50/70 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                  <Handshake className="w-3.5 h-3.5 text-violet-700" />
                  <span>2. Eventi Ibridi (Co-org.)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                  {totaliEventi.eventiIbridiCount || 0} eventi
                </span>
              </div>
              <p className="text-[11px] text-violet-800 leading-snug">
                In partenariato con altre associazioni; a bilancio solo la quota % di competenza Pro Loco.
              </p>
              <div className="pt-2 border-t border-violet-200/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 text-[11px]">Quota Entrate: <strong>{(totaliEventi.ibridi?.entrate || 0).toLocaleString('it-IT')} €</strong></span>
                <span className="text-slate-600 text-[11px]">Quota Costi: <strong>{(totaliEventi.ibridi?.costi || 0).toLocaleString('it-IT')} €</strong></span>
                <span className={`font-bold ${(totaliEventi.ibridi?.margine || 0) >= 0 ? 'text-violet-800' : 'text-rose-700'}`}>
                  {(totaliEventi.ibridi?.margine || 0) >= 0 ? '+' : ''}{(totaliEventi.ibridi?.margine || 0).toLocaleString('it-IT')} €
                </span>
              </div>
            </div>

            {/* Tipo 3: Gestione */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                  <span>3. Eventi in Gestione</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {totaliEventi.eventiGestioneCount || 0} eventi
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Conto terzi / convenzioni comunali: costi sostenuti, rimborsi ricevuti e compenso netto di regia.
              </p>
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 text-[11px]">Rimborsi/Fee: <strong>{(totaliEventi.gestione?.entrate || 0).toLocaleString('it-IT')} €</strong></span>
                <span className="text-slate-600 text-[11px]">Costi: <strong>{(totaliEventi.gestione?.costi || 0).toLocaleString('it-IT')} €</strong></span>
                <span className={`font-bold ${(totaliEventi.gestione?.margine || 0) >= 0 ? 'text-amber-800' : 'text-rose-700'}`}>
                  {(totaliEventi.gestione?.margine || 0) >= 0 ? '+' : ''}{(totaliEventi.gestione?.margine || 0).toLocaleString('it-IT')} €
                </span>
              </div>
            </div>
          </div>

          {/* Griglia 4 Voci Spesa Complessive Eventi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
                <Utensils className="w-3.5 h-3.5" />
                <span>Food & Stand</span>
              </div>
              <span className="text-xl font-black font-mono text-emerald-950 block">
                {(totaliEventi.food || 0).toLocaleString('it-IT')} €
              </span>
              <span className="text-[10px] text-emerald-700">Somma materie prime e alimentari</span>
            </div>

            <div className="p-3 bg-violet-50 rounded-xl border border-violet-200">
              <div className="flex items-center gap-1.5 text-violet-800 text-xs font-bold mb-1">
                <Music className="w-3.5 h-3.5" />
                <span>Spettacolo & SIAE</span>
              </div>
              <span className="text-xl font-black font-mono text-violet-950 block">
                {(totaliEventi.intrattenimento || 0).toLocaleString('it-IT')} €
              </span>
              <span className="text-[10px] text-violet-700">Artisti, service e diritti autore</span>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold mb-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Logistica & Safety</span>
              </div>
              <span className="text-xl font-black font-mono text-sky-950 block">
                {(totaliEventi.altreSpese || 0).toLocaleString('it-IT')} €
              </span>
              <span className="text-[10px] text-sky-700">Palco, gazebo, noleggi e sicurezza</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold mb-1">
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span>Varie & Pubblicità</span>
              </div>
              <span className="text-xl font-black font-mono text-amber-950 block">
                {(totaliEventi.varie || 0).toLocaleString('it-IT')} €
              </span>
              <span className="text-[10px] text-amber-700">Tipografia, manifesti e permessi</span>
            </div>
          </div>

          {/* Sezione Diagrammi Comparativi & Visualizzazione Finanziaria */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>Diagramma Comparativo: Preventivo vs Consuntivo vs Entrate per Manifestazione</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block"></span> Preventivo
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span> Consuntivo
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span> Entrate
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-64 bg-white p-3 rounded-lg border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datiGraficoBarreEventi} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="titolo" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${(Number(val) || 0).toLocaleString('it-IT')} €`]}
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="Preventivo" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Consuntivo" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Entrate" fill="#059669" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Grafico Donut Ripartizione Tipologie Evento */}
              <div className="h-64 bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Distribuzione Manifestazioni per Tipologia
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Proporzione tra iniziative native, co-organizzate e in gestione
                  </p>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datiGraficoTipologieEventi}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={4}
                      >
                        {datiGraficoTipologieEventi.map((entry, index) => (
                          <Cell key={`cell-tipo-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(val: number, name: string) => [`${val} eventi`, name]}
                        contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 text-[10px] pt-2 border-t border-slate-100">
                  {datiGraficoTipologieEventi.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-700 truncate">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <strong className="font-mono text-slate-900">{item.value} ({(item.volume || 0).toLocaleString('it-IT')} €)</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEZIONE DEDICATA: VISIONE MACRO ECONOMIA MANIFESTAZIONE (TABELLA AGGREGAZIONE STAND NUMERATI) */}
          <div id="sezione-macro-stand" className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 sm:p-6 space-y-6 shadow-xs">
            
            {/* Header Sezione con Selettore Evento & Azioni */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                    <Store className="w-5 h-5 text-emerald-800" />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                      <span>Visione Macro Economia della Manifestazione: Aggregazione Stand Numerati</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Quadro consolidato dei preventivi e consuntivi di tutti gli stand dell'evento per analizzare la sostenibilità economica e il saldo operativo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selettore Manifestazione ed Esportazione */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <label htmlFor="select-evento-stand" className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Manifestazione:
                  </label>
                  <select
                    id="select-evento-stand"
                    value={eventoPerMacroStand?.id || ''}
                    onChange={e => setEventoSelezionatoPerStandId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-2 max-w-[200px] sm:max-w-xs truncate"
                  >
                    {eventi.map(ev => {
                      const numStands = ev.standNumerati?.length || STAND_SIMULATI_DEFAULT.length;
                      return (
                        <option key={ev.id} value={ev.id}>
                          {ev.titolo} ({numStands} Stand)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {eventoPerMacroStand && (
                  <button
                    type="button"
                    id="btn-esporta-macro-stand"
                    onClick={() => esportaStandEventoCSV(eventoPerMacroStand, standsEventoSelezionato)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Scarica il bilancio analitico aggregato degli stand in formato CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Esporta Stand (CSV)</span>
                  </button>
                )}

                {onVaiAEvento && eventoPerMacroStand && (
                  <button
                    type="button"
                    id="btn-vai-gestione-evento"
                    onClick={() => onVaiAEvento(eventoPerMacroStand.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="Apri la gestione completa dell'evento"
                  >
                    <span>Gestisci Evento</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Switch rapido tra eventi registrati */}
            {eventi.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">Eventi:</span>
                {eventi.map(ev => {
                  const isSelezionato = eventoPerMacroStand?.id === ev.id;
                  const numStands = ev.standNumerati?.length || STAND_SIMULATI_DEFAULT.length;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setEventoSelezionatoPerStandId(ev.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                        isSelezionato
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Store className={`w-3 h-3 ${isSelezionato ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="truncate max-w-[180px]">{ev.titolo}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelezionato ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {numStands}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Banner Informativo sulla Manifestazione Selezionata */}
            {eventoPerMacroStand ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900">
                      {eventoPerMacroStand.titolo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      eventoPerMacroStand.tipoEvento === 'ibrido' ? 'bg-violet-100 text-violet-800 border border-violet-200' :
                      eventoPerMacroStand.tipoEvento === 'gestione' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {getInfoTipoEvento(eventoPerMacroStand.tipoEvento || 'nativo').etichettaBreve}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      📅 {eventoPerMacroStand.dataInizio}
                    </span>
                    <span className="text-xs text-slate-500">
                      📍 {eventoPerMacroStand.luogo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Spese complessive evento: <strong className="font-mono text-slate-900">{(eventoPerMacroStand.costiSostenuti || 0).toLocaleString('it-IT')} €</strong> (prev. {(eventoPerMacroStand.budgetPrevisto || 0).toLocaleString('it-IT')} €) • 
                    Incassi complessivi: <strong className="font-mono text-emerald-800">{(eventoPerMacroStand.entrateRealizzate || 0).toLocaleString('it-IT')} €</strong> (prev. {(eventoPerMacroStand.entratePreviste || 0).toLocaleString('it-IT')} €)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Incidenza Stand / Evento</span>
                    <span className="text-xs font-bold text-slate-900">
                      {macroEconomiaStand.incidenzaIncassi.toFixed(1)}% Incassi • {macroEconomiaStand.incidenzaSpese.toFixed(1)}% Spese
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 4 Card Macro KPI dell'Economia degli Stand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* KPI 1: SPESE TOTALI STAND */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Spese Totali Stand</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    macroEconomiaStand.diffSpesa <= 0 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-rose-200 text-rose-900 border border-rose-300'
                  }`}>
                    {macroEconomiaStand.diffSpesa <= 0 
                      ? `Risparmio: ${(Math.abs(macroEconomiaStand.diffSpesa)).toLocaleString('it-IT')} €` 
                      : `Scostamento: +${(macroEconomiaStand.diffSpesa).toLocaleString('it-IT')} €`}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black font-mono text-rose-950 block">
                    {(macroEconomiaStand.totSpesaCons || 0).toLocaleString('it-IT')} €
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-rose-800">
                    <span>Preventivo stimato:</span>
                    <strong className="font-mono">{(macroEconomiaStand.totSpesaPrev || 0).toLocaleString('it-IT')} €</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200/80 text-[10px] text-rose-700 flex justify-between">
                  <span>Incidenza su spesa totale:</span>
                  <strong className="font-mono font-bold">{macroEconomiaStand.incidenzaSpese.toFixed(1)}%</strong>
                </div>
              </div>

              {/* KPI 2: INCASSI TOTALI STAND */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Incassi Totali Stand</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    macroEconomiaStand.diffIncasso >= 0 
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {macroEconomiaStand.diffIncasso >= 0 
                      ? `+${(macroEconomiaStand.diffIncasso).toLocaleString('it-IT')} € Extra` 
                      : `${(macroEconomiaStand.diffIncasso).toLocaleString('it-IT')} € Minori`}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black font-mono text-emerald-950 block">
                    {(macroEconomiaStand.totIncassoCons || 0).toLocaleString('it-IT')} €
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-emerald-800">
                    <span>Preventivo stimato:</span>
                    <strong className="font-mono">{(macroEconomiaStand.totIncassoPrev || 0).toLocaleString('it-IT')} €</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-200/80 text-[10px] text-emerald-700 flex justify-between">
                  <span>Incidenza su entrate totali:</span>
                  <strong className="font-mono font-bold">{macroEconomiaStand.incidenzaIncassi.toFixed(1)}%</strong>
                </div>
              </div>

              {/* KPI 3: MARGINE OPERATIVO NETTO STAND */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Euro className="w-3.5 h-3.5 text-blue-700" />
                    <span>Margine Netto Stand</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    macroEconomiaStand.diffMargine >= 0 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {macroEconomiaStand.diffMargine >= 0 ? '+' : ''}{(macroEconomiaStand.diffMargine).toLocaleString('it-IT')} € Scost.
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className={`text-2xl font-black font-mono block ${
                    macroEconomiaStand.margineCons >= 0 ? 'text-blue-950' : 'text-rose-900'
                  }`}>
                    {macroEconomiaStand.margineCons >= 0 ? '+' : ''}{(macroEconomiaStand.margineCons || 0).toLocaleString('it-IT')} €
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-blue-800">
                    <span>Margine preventivato:</span>
                    <strong className="font-mono">{macroEconomiaStand.marginePrev >= 0 ? '+' : ''}{(macroEconomiaStand.marginePrev || 0).toLocaleString('it-IT')} €</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-200/80 text-[10px] text-blue-700 flex justify-between">
                  <span>Redditività operativa stand:</span>
                  <strong className="font-mono font-bold">
                    {macroEconomiaStand.totIncassoCons > 0 
                      ? ((macroEconomiaStand.margineCons / macroEconomiaStand.totIncassoCons) * 100).toFixed(1) 
                      : '0'}%
                  </strong>
                </div>
              </div>

              {/* KPI 4: COMPOSIZIONE & PRESIDIO */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>Presidio & Ripartizione</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {macroEconomiaStand.totaleStand} Stand Attivi
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> Food & Beverage:
                    </span>
                    <strong className="font-mono text-slate-900">{macroEconomiaStand.foodCount} stand ({macroEconomiaStand.totaleStand > 0 ? ((macroEconomiaStand.foodCount / macroEconomiaStand.totaleStand) * 100).toFixed(0) : 0}%)</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <Store className="w-3 h-3" /> Servizi & No-Food:
                    </span>
                    <strong className="font-mono text-slate-900">{macroEconomiaStand.nonFoodCount} stand ({macroEconomiaStand.totaleStand > 0 ? ((macroEconomiaStand.nonFoodCount / macroEconomiaStand.totaleStand) * 100).toFixed(0) : 0}%)</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                  <span>Riconciliazione:</span>
                  <span className="font-bold text-emerald-800">Bilancio Sociale Allineato</span>
                </div>
              </div>

            </div>

            {/* Barra Filtri Segmentazione Stand */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filtra Stand:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroTipoStand('tutti')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    filtroTipoStand === 'tutti'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Tutti ({standsEventoSelezionato.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoStand('food')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    filtroTipoStand === 'food'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  Solo Food & Beverage ({macroEconomiaStand.foodCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoStand('non_food')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    filtroTipoStand === 'non_food'
                      ? 'bg-slate-700 text-white border-slate-800 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Solo Servizi / No-Food ({macroEconomiaStand.nonFoodCount})
                </button>
              </div>

              <span className="text-xs text-slate-500">
                Visualizzati <strong className="text-slate-800">{standsVisualizzati.length}</strong> su <strong className="text-slate-800">{standsEventoSelezionato.length}</strong> stand configurati
              </span>
            </div>

            {/* TABELLA RIASSUNTIVA ANALITICA DEGLI STAND DEL SINGOLO EVENTO */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">N° & Denominazione Stand</th>
                    <th className="py-2.5 px-3">Tipologia</th>
                    <th className="py-2.5 px-3 text-center">Circuito</th>
                    <th className="py-2.5 px-3 text-right">Spesa Prev.</th>
                    <th className="py-2.5 px-3 text-right">Spesa Cons.</th>
                    <th className="py-2.5 px-3 text-right">Diff. Spesa</th>
                    <th className="py-2.5 px-3 text-right">Incasso Prev.</th>
                    <th className="py-2.5 px-3 text-right">Incasso Cons.</th>
                    <th className="py-2.5 px-3 text-right">Diff. Incasso</th>
                    <th className="py-2.5 px-3 text-right font-black">Margine Prev.</th>
                    <th className="py-2.5 px-3 text-right font-black">Margine Cons.</th>
                    <th className="py-2.5 px-3 text-right font-black">Scost. Margine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standsVisualizzati.map(st => {
                    const spP = Number(st.spesaPreventivo) || 0;
                    const spC = Number(st.spesaConsuntivo) || 0;
                    const diffS = spC - spP;
                    const isRisparmio = diffS <= 0;

                    const inP = Number(st.incassoPrevisto) || Number(st.incassoStimato) || 0;
                    const inC = Number(st.incassoConsuntivo) || Number(st.incassoStimato) || 0;
                    const diffI = inC - inP;

                    const mP = inP - spP;
                    const mC = inC - spC;
                    const diffM = mC - mP;

                    return (
                      <tr key={st.id || `st-${st.numero}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shrink-0 ${
                              st.riferimentoFood 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                : 'bg-slate-200 text-slate-800 border border-slate-300'
                            }`}>
                              #{st.numero}
                            </span>
                            <div>
                              <strong className="text-slate-900 block leading-tight">{st.nome}</strong>
                              {st.responsabile && (
                                <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                                  Ref: {st.responsabile}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {st.tipologia}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {st.riferimentoFood ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Utensils className="w-2.5 h-2.5" />
                              <span>Food & Beverage</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <Store className="w-2.5 h-2.5" />
                              <span>Servizi / No-Food</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {spP.toLocaleString('it-IT')} €
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {spC.toLocaleString('it-IT')} €
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isRisparmio 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`} title={isRisparmio ? 'Risparmio di spesa rispetto al preventivo' : 'Scostamento di spesa in eccesso'}>
                            {diffS <= 0 ? `${diffS.toLocaleString('it-IT')} €` : `+${diffS.toLocaleString('it-IT')} €`}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {inP.toLocaleString('it-IT')} €
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {inC.toLocaleString('it-IT')} €
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            diffI >= 0 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`} title={diffI >= 0 ? 'Extra incasso rispetto alla stima' : 'Minori entrate rispetto alla stima'}>
                            {diffI >= 0 ? `+${diffI.toLocaleString('it-IT')} €` : `${diffI.toLocaleString('it-IT')} €`}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                          {mP >= 0 ? '+' : ''}{mP.toLocaleString('it-IT')} €
                        </td>

                        <td className={`py-2.5 px-3 text-right font-mono font-black ${
                          mC >= 0 ? 'text-emerald-800' : 'text-rose-700'
                        }`}>
                          {mC >= 0 ? '+' : ''}{mC.toLocaleString('it-IT')} €
                        </td>

                        <td className={`py-2.5 px-3 text-right font-mono font-bold text-[10.5px] ${
                          diffM >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {diffM >= 0 ? `+${diffM.toLocaleString('it-IT')} €` : `${diffM.toLocaleString('it-IT')} €`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* TFOOT: TOTALI MACRO AGGREGATI STAND */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                    <td colSpan={3} className="py-3 px-3 uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400" />
                        <span>TOTALI AGGREGATI STAND ({standsVisualizzati.length} DI {standsEventoSelezionato.length})</span>
                      </div>
                    </td>

                    {/* Somma Spesa Prev */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {(macroEconomiaStand.totSpesaPrev || 0).toLocaleString('it-IT')} €
                    </td>

                    {/* Somma Spesa Cons */}
                    <td className="py-3 px-3 text-right font-mono text-white font-black">
                      {(macroEconomiaStand.totSpesaCons || 0).toLocaleString('it-IT')} €
                    </td>

                    {/* Differenza Spese */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={macroEconomiaStand.diffSpesa <= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {macroEconomiaStand.diffSpesa <= 0 
                          ? `${macroEconomiaStand.diffSpesa.toLocaleString('it-IT')} €` 
                          : `+${macroEconomiaStand.diffSpesa.toLocaleString('it-IT')} €`}
                      </span>
                    </td>

                    {/* Somma Incasso Prev */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {(macroEconomiaStand.totIncassoPrev || 0).toLocaleString('it-IT')} €
                    </td>

                    {/* Somma Incasso Cons */}
                    <td className="py-3 px-3 text-right font-mono text-emerald-300 font-black">
                      {(macroEconomiaStand.totIncassoCons || 0).toLocaleString('it-IT')} €
                    </td>

                    {/* Differenza Incassi */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={macroEconomiaStand.diffIncasso >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                        {macroEconomiaStand.diffIncasso >= 0 
                          ? `+${macroEconomiaStand.diffIncasso.toLocaleString('it-IT')} €` 
                          : `${macroEconomiaStand.diffIncasso.toLocaleString('it-IT')} €`}
                      </span>
                    </td>

                    {/* Somma Margine Prev */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300 font-bold">
                      {macroEconomiaStand.marginePrev >= 0 ? '+' : ''}{(macroEconomiaStand.marginePrev || 0).toLocaleString('it-IT')} €
                    </td>

                    {/* Somma Margine Cons */}
                    <td className="py-3 px-3 text-right font-mono text-emerald-300 font-black">
                      {macroEconomiaStand.margineCons >= 0 ? '+' : ''}{(macroEconomiaStand.margineCons || 0).toLocaleString('it-IT')} €
                    </td>

                    {/* Somma Scostamento Margine */}
                    <td className={`py-3 px-3 text-right font-mono font-black ${
                      macroEconomiaStand.diffMargine >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}>
                      {macroEconomiaStand.diffMargine >= 0 ? `+${macroEconomiaStand.diffMargine.toLocaleString('it-IT')} €` : `${macroEconomiaStand.diffMargine.toLocaleString('it-IT')} €`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note Descrittive di Visione Macro Economica */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">
                  Analisi Macro Economica della Manifestazione ({eventoPerMacroStand?.titolo}):
                </span>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  L'aggregazione di tutti i <strong>{standsEventoSelezionato.length} stand numerati</strong> produce un volume complessivo di spesa a consuntivo pari a <strong>{(macroEconomiaStand.totSpesaCons || 0).toLocaleString('it-IT')} €</strong> (a fronte di un preventivo di {(macroEconomiaStand.totSpesaPrev || 0).toLocaleString('it-IT')} €) e ricavi effettivi realizzati per <strong>{(macroEconomiaStand.totIncassoCons || 0).toLocaleString('it-IT')} €</strong> (a fronte di una stima di {(macroEconomiaStand.totIncassoPrev || 0).toLocaleString('it-IT')} €). Il margine operativo netto generato dagli stand ammonta a <strong className={macroEconomiaStand.margineCons >= 0 ? 'text-emerald-800' : 'text-rose-700'}>{macroEconomiaStand.margineCons >= 0 ? '+' : ''}{(macroEconomiaStand.margineCons || 0).toLocaleString('it-IT')} €</strong>, rappresentando il perno di sostenibilità per l'intero evento.
                </p>
              </div>
            </div>

          </div>

          {/* Tabella Comparativa Eventi con Totali e Segno Positivo Differenza */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Manifestazione & Tipologia</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3 text-center">Stand</th>
                  <th className="py-2.5 px-3 text-right">Preventivo</th>
                  <th className="py-2.5 px-3 text-right">Consuntivo</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Diff. (+)</th>
                  <th className="py-2.5 px-3 text-right">Food</th>
                  <th className="py-2.5 px-3 text-right">Spett.</th>
                  <th className="py-2.5 px-3 text-right">Altre</th>
                  <th className="py-2.5 px-3 text-right">Varie</th>
                  <th className="py-2.5 px-3 text-right font-black">Entrate</th>
                  <th className="py-2.5 px-3 text-right font-black">Quota Pro Loco</th>
                  <th className="py-2.5 px-3 text-right font-black">Margine Netto</th>
                  <th className="py-2.5 px-3 text-center">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventiFiltrati.map(e => {
                  const econ = calcolaEconomiaEvento(e);
                  const infoTipo = getInfoTipoEvento(e.tipoEvento || 'nativo');
                  
                  const cFood = e.speseConsuntivo?.food ?? Math.round((e.costiSostenuti || 0) * 0.50);
                  const cIntr = e.speseConsuntivo?.intrattenimento ?? Math.round((e.costiSostenuti || 0) * 0.25);
                  const cAltre = e.speseConsuntivo?.altreSpese ?? Math.round((e.costiSostenuti || 0) * 0.15);
                  const cVarie = e.speseConsuntivo?.varie ?? Math.round((e.costiSostenuti || 0) * 0.10);
                  const totConsLordo = cFood + cIntr + cAltre + cVarie || e.costiSostenuti || 0;
                  const prevLordo = e.budgetPrevisto || 0;

                  // Differenza con segno SEMPRE POSITIVO come richiesto
                  const diffAssoluta = Math.abs(totConsLordo - prevLordo);
                  const isRisparmio = totConsLordo <= prevLordo;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <strong className="text-slate-900">{e.titolo}</strong>
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                            e.tipoEvento === 'ibrido' ? 'bg-violet-100 text-violet-800' :
                            e.tipoEvento === 'gestione' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {infoTipo.etichettaBreve}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {e.categoria} • {e.luogo}
                          {e.tipoEvento === 'ibrido' && e.partnerIbridoNome && ` (Partner: ${e.partnerIbridoNome})`}
                          {e.tipoEvento === 'gestione' && e.committenteNome && ` (Committente: ${e.committenteNome})`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {e.dataInizio}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEventoSelezionatoPerStandId(e.id);
                            const el = document.getElementById('sezione-macro-stand');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer border ${
                            eventoPerMacroStand?.id === e.id
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title="Visualizza aggregazione macro di tutti gli stand per questa manifestazione"
                        >
                          <Store className="w-3 h-3" />
                          <span>{e.standNumerati?.length || STAND_SIMULATI_DEFAULT.length} Stand</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {(prevLordo || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                        {(totConsLordo || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                          isRisparmio ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`} title={isRisparmio ? 'Risparmio sul budget previsto' : 'Scostamento rispetto al budget previsto'}>
                          +{(diffAssoluta || 0).toLocaleString('it-IT')} €
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(cFood || 0).toLocaleString('it-IT')} €</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(cIntr || 0).toLocaleString('it-IT')} €</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(cAltre || 0).toLocaleString('it-IT')} €</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(cVarie || 0).toLocaleString('it-IT')} €</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {(e.entrateRealizzate || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        {(econ.entrateProLocoRealizzate || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${
                        (econ.margineNettoProLoco || 0) >= 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}>
                        {((econ.margineNettoProLoco || 0) >= 0 ? '+' : '')}{(econ.margineNettoProLoco || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.stato === 'concluso' ? 'bg-emerald-100 text-emerald-800' :
                          e.stato === 'in_corso' ? 'bg-amber-100 text-amber-800' :
                          e.stato === 'annullato' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {e.stato}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* TOTALI COMPLESSIVI DI TUTTE LE MANIFESTAZIONI */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                  <td className="py-3 px-3 uppercase tracking-wide">
                    TOTALI GENERALI ({eventiFiltrati.length} MANIFESTAZIONI)
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {annoAttivo || 'Tutti'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-300">
                    Macro Stand
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(totaliEventi.budgetPrevisto || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {(totaliEventi.costiConsuntivo || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300">
                    +{(totaliEventi.differenzaCosti || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(totaliEventi.food || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(totaliEventi.intrattenimento || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(totaliEventi.altreSpese || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {(totaliEventi.varie || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {(totaliEventi.entrateLordoTotali || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300">
                    {(totaliEventi.entrateRealizzate || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-black ${
                    (totaliEventi.margineEventi || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {((totaliEventi.margineEventi || 0) >= 0 ? '+' : '')}{(totaliEventi.margineEventi || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="py-3 px-3 text-center text-[10px] text-slate-400">
                    Bilancio OK
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

      {/* SOTTO-TAB: GESTIONE DONAZIONI DA TERZI ED EROGAZIONI LIBERALI (ART. 83 CTS) */}
      {sottoTab === 'donazioni' && (
        <div className="space-y-6">
          
          {/* Header del modulo Donazioni */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Donazioni da Terzi & Erogazioni Liberali
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Art. 83 D.Lgs. 117/2017 (CTS)
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Registro ufficiale delle donazioni, lasciti ed erogazioni liberali ricevute da cittadini, aziende, banche ed enti.
                Emissione ricevute con validità fiscale per detrazione/deduzione IRPEF e IRES.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => esportaDonazioniCSV(donazioniFiltrate, annoAttivo || config.annoCorrente)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                title="Esporta elenco donazioni in foglio Excel/CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Esporta CSV</span>
              </button>

              <button
                onClick={() => {
                  setDonazioneInModifica(null);
                  setModalDonazioneAperta(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Registra Nuova Donazione</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Donazioni */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Totale Donazioni ({annoAttivo ? `Anno ${annoAttivo}` : 'Storico'})
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-700 font-mono">
                  € {totaleDonazioni.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Incidenza entrate: <strong>{bilancioGlobale.percDonazioni.toFixed(1)}%</strong> sul bilancio
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Agevolabili Art. 83 CTS
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  € {totaleDonazioniDetraibili.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 font-medium block mt-1">
                {donazioniFiltrate.filter(d => d.detraibileFiscale).length} con ricevuta fiscale tracciata
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Donazione Media
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-800 font-mono">
                  € {donazioneMedia.toLocaleString('it-IT')}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Calcolato su {donazioniFiltrate.length} erogazioni
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tipologia Donatori
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {donazioniFiltrate.length}
                </span>
                <span className="text-xs text-slate-500">atti di liberalità</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1 truncate">
                Privati, aziende, fondazioni ed enti
              </span>
            </div>

          </div>

          {/* Filtri & Barra di Ricerca Donazioni */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={filtroRicercaDonatore}
                  onChange={(e) => setFiltroRicercaDonatore(e.target.value)}
                  placeholder="Cerca donatore, C.F./P.IVA, n° ricevuta o causale..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
                />
              </div>

              <select
                value={filtroTipoDonatore}
                onChange={(e) => setFiltroTipoDonatore(e.target.value as 'tutti' | TipoDonatore)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white font-medium"
              >
                <option value="tutti">Tutti i Donatori</option>
                <option value="privato">Persona Fisica (Privato)</option>
                <option value="azienda">Impresa / Azienda</option>
                <option value="fondazione">Fondazione Bancaria</option>
                <option value="ente_benefico">Ente Terzo Settore / Onlus</option>
                <option value="associazione">Associazione consorella</option>
                <option value="anonimo">Anonimo / Offerta</option>
              </select>

              {(filtroRicercaDonatore || filtroTipoDonatore !== 'tutti') && (
                <button
                  onClick={() => {
                    setFiltroRicercaDonatore('');
                    setFiltroTipoDonatore('tutti');
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                >
                  Resetta
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 self-center">
              Visualizzati: <strong>{donazioniFiltrate.length}</strong> record
            </div>
          </div>

          {/* Tabella Dettaglio Donazioni */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-3.5">N° Ricevuta / Data</th>
                    <th className="py-3 px-3.5">Donatore / Ente</th>
                    <th className="py-3 px-3.5">Tipologia</th>
                    <th className="py-3 px-3.5">Causale & Destinazione</th>
                    <th className="py-3 px-3.5">Metodo Pagamento</th>
                    <th className="py-3 px-3.5 text-right">Importo (€)</th>
                    <th className="py-3 px-3.5 text-center">Art. 83 CTS</th>
                    <th className="py-3 px-3.5 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donazioniFiltrate.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm text-slate-700">Nessuna donazione registrata</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {filtroRicercaDonatore || filtroTipoDonatore !== 'tutti'
                            ? 'Nessun risultato con i filtri applicati.'
                            : 'Registra la prima erogazione liberale per questo esercizio finanziario.'}
                        </p>
                        <button
                          onClick={() => {
                            setDonazioneInModifica(null);
                            setModalDonazioneAperta(true);
                          }}
                          className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Aggiungi Donazione</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    donazioniFiltrate.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5">
                          <span className="font-mono font-bold text-slate-900 block">
                            {d.ricevutaNumero}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {d.data}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="font-bold text-slate-900 block">
                            {d.donatore}
                          </span>
                          {d.codiceFiscalePartitaIva && (
                            <span className="text-[10.5px] font-mono text-slate-500 block">
                              CF/P.IVA: {d.codiceFiscalePartitaIva}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.tipoDonatore === 'privato' ? 'bg-blue-100 text-blue-800' :
                            d.tipoDonatore === 'azienda' ? 'bg-amber-100 text-amber-900' :
                            d.tipoDonatore === 'fondazione' ? 'bg-purple-100 text-purple-900' :
                            d.tipoDonatore === 'ente_benefico' ? 'bg-emerald-100 text-emerald-800' :
                            d.tipoDonatore === 'associazione' ? 'bg-teal-100 text-teal-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {d.tipoDonatore === 'privato' ? 'Persona Fisica' :
                             d.tipoDonatore === 'azienda' ? 'Impresa' :
                             d.tipoDonatore === 'fondazione' ? 'Fondazione' :
                             d.tipoDonatore === 'ente_benefico' ? 'Terzo Settore' :
                             d.tipoDonatore === 'associazione' ? 'Consorella' : 'Anonimo'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 max-w-xs">
                          <span className="text-slate-800 block truncate" title={d.causale}>
                            {d.causale}
                          </span>
                          {d.destinazione && (
                            <span className="text-[10.5px] text-emerald-700 font-semibold block">
                              Destinazione: {d.destinazione}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            {d.metodo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                          € {(d.importo || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          {d.detraibileFiscale ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title="Erogazione tracciabile agevolabile fiscalmente ex Art. 83 D.Lgs. 117/2017">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Detraibile 30%</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Ordinaria
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setDonazioneRicevutaStampa(d)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Visualizza e Stampa Ricevuta Ufficiale / Quietanza"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDonazioneInModifica(d);
                                setModalDonazioneAperta(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Modifica donazione"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfermaEliminaDonazioneId(d.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Elimina donazione dal registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {donazioniFiltrate.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                      <td colSpan={5} className="py-3 px-3.5 uppercase tracking-wide">
                        Totale Erogazioni Registrate ({donazioniFiltrate.length} donazioni)
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-emerald-300 text-sm">
                        € {totaleDonazioni.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-300 text-[10px]">
                        {donazioniFiltrate.filter(d => d.detraibileFiscale).length} con ricevuta
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => esportaDonazioniCSV(donazioniFiltrate, annoAttivo || config.annoCorrente)}
                          className="text-[10px] text-emerald-300 hover:underline cursor-pointer"
                        >
                          Scarica CSV
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Vademecum Fiscale & Normativo Art. 83 Codice del Terzo Settore */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-xs border border-emerald-700/50 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-extrabold text-sm text-white">
                Vademecum Fiscale: Regime delle Erogazioni Liberali per le Pro Loco (Art. 83 D.Lgs. 117/2017)
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-emerald-100">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <strong className="text-white block font-bold mb-1">Persone Fisiche (Cittadini)</strong>
                <p className="leading-relaxed">
                  Detrazione dall'IRPEF pari al <strong>30%</strong> dell'erogazione liberale effettuata, calcolata su un importo massimo di <strong>30.000 €</strong> per ciascun periodo d'imposta (oppure deduzione fino al 10% del reddito complessivo).
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <strong className="text-white block font-bold mb-1">Imprese, Aziende e Società</strong>
                <p className="leading-relaxed">
                  Deduzione dal reddito complessivo netto del soggetto erogatore nel limite del <strong>10%</strong> del reddito complessivo dichiarato, senza tetti massimi fissi di spesa.
                </p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <strong className="text-white block font-bold mb-1">Obbligo di Tracciabilità</strong>
                <p className="leading-relaxed">
                  Le erogazioni liberali devono essere effettuate tramite banche, uffici postali o altri sistemi tracciabili (bonifico, bollettino, carte, assegni). I contanti non danno diritto a detrazione.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
      {sottoTab === 'runts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <span>Rendiconto per Cassa degli Enti del Terzo Settore (Modello D RUNTS)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Struttura conforme al D.M. 05/03/2020 per le Associazioni Pro Loco (APS) iscritte al RUNTS
              </p>
            </div>
            <button
              onClick={onApriStampaBilancio}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Modello per Assemblea</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sezione ENTRATE */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-emerald-800 text-white px-4 py-2.5 font-bold text-xs flex justify-between">
                <span>SEZIONE 1: ENTRATE DELL'ESERCIZIO</span>
                <span>IMPORTO (€)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs text-slate-800">
                <div className="p-3 bg-slate-50 font-bold text-slate-900">
                  A) Entrate da attività di interesse generale (Manifestazioni, Sagre, Feste)
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>1. Entrate da stand gastronomico e somministrazione sagre (Food & Beverage)</span>
                  <span className="font-mono font-medium">
                    {(consolidatoGlobaleStand.incassoFoodCons > 0 
                      ? consolidatoGlobaleStand.incassoFoodCons 
                      : Math.round((totaliEventi.entrateRealizzate || 0) * 0.70)).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>2. Biglietti, mostre, mercatini e stand no-food</span>
                  <span className="font-mono font-medium">
                    {(consolidatoGlobaleStand.incassoNonFoodCons > 0 
                      ? consolidatoGlobaleStand.incassoNonFoodCons 
                      : Math.round((totaliEventi.entrateRealizzate || 0) * 0.20)).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>3. Sponsorizzazioni, contributi ed entrate da partner/gestione</span>
                  <span className="font-mono font-medium">
                    {Math.max(0, (totaliEventi.entrateRealizzate || 0) - (
                      (consolidatoGlobaleStand.incassoFoodCons > 0 ? consolidatoGlobaleStand.incassoFoodCons : Math.round((totaliEventi.entrateRealizzate || 0) * 0.70)) +
                      (consolidatoGlobaleStand.incassoNonFoodCons > 0 ? consolidatoGlobaleStand.incassoNonFoodCons : 0)
                    )).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="p-3 bg-slate-50 font-bold text-slate-900">
                  B) Entrate da attività associative e quote tesseramento
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>1. Quote associative annuali versate dai soci</span>
                  <span className="font-mono font-medium">{(totaleQuote || 0).toLocaleString('it-IT')} €</span>
                </div>
                <div className="p-3 bg-slate-50 font-bold text-slate-900 flex justify-between items-center">
                  <span>C) Entrate da raccolte fondi ed erogazioni liberali da terzi (Art. 7 e 83 CTS)</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Art. 83 CTS</span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>1. Erogazioni liberali da persone fisiche e privati</span>
                  <span className="font-mono font-medium">
                    {donazioniFiltrate.filter(d => d.tipoDonatore === 'privato' || d.tipoDonatore === 'anonimo').reduce((a, b) => a + (b.importo || 0), 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>2. Donazioni da imprese, fondazioni ed enti terzi</span>
                  <span className="font-mono font-medium">
                    {donazioniFiltrate.filter(d => d.tipoDonatore !== 'privato' && d.tipoDonatore !== 'anonimo').reduce((a, b) => a + (b.importo || 0), 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="px-4 py-1.5 bg-slate-50 text-[10.5px] text-slate-500 flex justify-between italic">
                  <span>Quota donazioni detraibili tracciate ex Art. 83 CTS:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {(totaleDonazioniDetraibili || 0).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 font-black text-emerald-950 flex justify-between text-sm">
                  <span>TOTALE GENERALE ENTRATE</span>
                  <span className="font-mono">{(bilancioGlobale.totaleEntrate || 0).toLocaleString('it-IT')} €</span>
                </div>
              </div>
            </div>

            {/* Sezione USCITE */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-rose-800 text-white px-4 py-2.5 font-bold text-xs flex justify-between">
                <span>SEZIONE 2: USCITE DELL'ESERCIZIO</span>
                <span>IMPORTO (€)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs text-slate-800">
                <div className="p-3 bg-slate-50 font-bold text-slate-900">
                  A) Uscite per attività di interesse generale (Manifestazioni, Sagre)
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>1. Materie prime alimentari e bevande (Food & Stand)</span>
                  <span className="font-mono font-medium">
                    {(consolidatoGlobaleStand.spesaFoodCons > 0 ? consolidatoGlobaleStand.spesaFoodCons : (totaliEventi.food || 0)).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>2. Servizi artistici, musicali, service e diritti SIAE</span>
                  <span className="font-mono font-medium">{(totaliEventi.intrattenimento || 0).toLocaleString('it-IT')} €</span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>3. Noleggi palchi, tensostrutture, stand no-food e logistica</span>
                  <span className="font-mono font-medium">
                    {((totaliEventi.altreSpese || 0) + (consolidatoGlobaleStand.spesaNonFoodCons > 0 ? consolidatoGlobaleStand.spesaNonFoodCons : 0)).toLocaleString('it-IT')} €
                  </span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span>4. Oneri vari, pubblicità, tipografia e permessi</span>
                  <span className="font-mono font-medium">{(totaliEventi.varie || 0).toLocaleString('it-IT')} €</span>
                </div>
                <div className="p-3 bg-slate-50 font-bold text-slate-900">
                  B) Uscite per supporto e funzionamento associazione
                </div>
                <div className="px-4 py-2 flex justify-between text-slate-500">
                  <span>1. Oneri generali di segreteria e tessere (inclusi in varie)</span>
                  <span className="font-mono">Inclusi</span>
                </div>
                <div className="p-3 bg-rose-50 font-black text-rose-950 flex justify-between text-sm">
                  <span>TOTALE GENERALE USCITE</span>
                  <span className="font-mono">{(bilancioGlobale.totaleUscite || 0).toLocaleString('it-IT')} €</span>
                </div>
              </div>
            </div>

          </div>

          {/* Riquadro Riassuntivo Avanzo / Disavanzo RUNTS */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            bilancioGlobale.avanzoGestione >= 0 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div>
              <span className="text-xs font-bold uppercase block">
                Risultato Globale di Gestione (Entrate - Uscite)
              </span>
              <span className="text-xl font-black font-mono block">
                {(bilancioGlobale.avanzoGestione >= 0 ? '+' : '')}{(bilancioGlobale.avanzoGestione || 0).toLocaleString('it-IT')} €
              </span>
              <span className="text-xs font-medium text-slate-600 block mt-0.5">
                {bilancioGlobale.avanzoGestione >= 0 
                  ? 'Avanzo di cassa da destinare allo svolgimento dell\'attività statutaria dell\'anno successivo'
                  : 'Disavanzo registrato di gestione'}
              </span>
            </div>

            <button
              onClick={onApriStampaBilancio}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Genera Verbale Assemblea
            </button>
          </div>

          {/* GUIDA NORMATIVA COMPLETA: TERZO SETTORE, RUNTS & ADEMPIMENTI PRO LOCO */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-slate-50">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold">
                  Quadro Normativo D.Lgs. 117/2017 & Guida Fiscale per Pro Loco (APS)
                </h4>
              </div>
              <span className="text-[11px] font-mono bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-700">
                CTS • D.M. 05/03/2020 • RUNTS
              </span>
            </div>

            <div className="p-5 space-y-5 text-xs text-slate-700">
              
              {/* Sezione 1: Schemi di Bilancio e Cassa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>Rendiconto per Cassa (Modello D) - D.M. 5 marzo 2020</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Gli Enti del Terzo Settore con ricavi, rendite, proventi o entrate complessive inferiori alla soglia di legge (fino a 220.000 € / 300.000 € in sede di revisione) possono redigere il bilancio di esercizio nella forma del <strong>Rendiconto per Cassa (Modello D)</strong> anziché per competenza (Mod. A Stato Patrimoniale e Mod. B Rendiconto Gestionale).
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                    <strong>Principio contabile:</strong> Vengono registrate esclusivamente le entrate effettivamente incassate e le uscite monetarie pagate nell'esercizio finanziario di riferimento.
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Calendar className="w-4 h-4 text-blue-700" />
                    <span>Calendario Istituzionale & Deposito RUNTS</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-relaxed list-disc list-inside">
                    <li>
                      <strong>Entro Marzo:</strong> Il Consiglio Direttivo predispone ed approva la bozza del Rendiconto consuntivo e la relazione di missione/accompagnatoria.
                    </li>
                    <li>
                      <strong>Entro 30 Aprile (120 giorni):</strong> L'Assemblea ordinaria dei Soci approva il bilancio con apposito verbale (prorogabile a 180 giorni se previsto da statuto).
                    </li>
                    <li>
                      <strong>Entro il 30 Giugno:</strong> Obbligo inderogabile di deposito telematico sul portale RUNTS di bilancio approvato, verbale assembleare ed eventuali relazioni.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Sezione 2: Focus Erogazioni Liberali e Donazioni da Terzi Art. 83 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <HeartHandshake className="w-4 h-4 text-rose-600" />
                  <span>Regime Fiscale delle Erogazioni Liberali (Art. 83 Codice del Terzo Settore)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                    <strong className="text-emerald-950 font-bold block mb-1">Per i Cittadini (Privati)</strong>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Detrazione IRPEF del <strong>30%</strong> dell'importo donato fino a un massimo di <strong>30.000 €</strong> per anno, oppure deduzione dal reddito complessivo nel limite del <strong>10%</strong>.
                    </p>
                  </div>
                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                    <strong className="text-amber-950 font-bold block mb-1">Per Imprese & Società</strong>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Deduzione dal reddito complessivo netto dichiarato fino al limite del <strong>10%</strong>. L'eccedenza può essere computata negli esercizi successivi fino al quarto.
                    </p>
                  </div>
                  <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-950 font-bold block mb-1">Tracciabilità Obbligatoria</strong>
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      Le donazioni in contanti non beneficiano di agevolazioni. Il pagamento deve avvenire a mezzo bonifico bancario/postale, carta di credito/debito, POS o assegno.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sezione 3: Altri obblighi di legge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Registro Volontari (Art. 18 CTS)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Obbligo di tenuta del registro dei volontari non occasionali, preventivamente vidimato o con marcatura temporale, e stipula della polizza infortuni, malattie e RCT.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-violet-700" />
                    <span>Libri Sociali Obbligatori (Art. 15 CTS)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Libro degli associati (Soci ordinari e onorari), Libro delle adunanze e delle deliberazioni delle assemblee dei soci, Libro dell'organo di amministrazione (Consiglio Direttivo).
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Trasparenza Contributi P.A. (L. 124/2017)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Obbligo di pubblicazione sul proprio portale web entro il 30 giugno di sovvenzioni, sussidi o vantaggi economici ricevuti dalla Pubblica Amministrazione superiori a <strong>10.000 €</strong> complessivi.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* SOTTO-TAB 5: STATO DATABASE & STRUMENTI DI GESTIONE */}
      {sottoTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-700" />
              <span>Stato del Database Locale & Persistenza Dati</span>
            </h3>
            <p className="text-xs text-slate-500">
              Monitoraggio dell'integrità del database, numero record memorizzati, backup e sicurezza dei dati
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">Record Anagrafiche Soci</span>
              <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                {statsDatabase.totaleSoci}
              </span>
              <span className="text-[11px] text-slate-600 font-medium mt-1 block">
                {statsDatabase.sociAttivi} soci attivi censiti
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">Record Tessere & Quote</span>
              <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                {statsDatabase.totaleQuoteRegistrate}
              </span>
              <span className="text-[11px] text-slate-600 font-medium mt-1 block">
                ricevute emesse nel database
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">Record Manifestazioni</span>
              <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                {statsDatabase.totaleEventi}
              </span>
              <span className="text-[11px] text-slate-600 font-medium mt-1 block">
                {statsDatabase.eventiConclusi} conclusi • {statsDatabase.eventiInProgramma} attivi
              </span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase block">Stato Sincronizzazione</span>
              <span className="text-sm font-black text-emerald-950 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Salvataggio Locale Persistente</span>
              </span>
              <span className="text-[11px] text-emerald-800 font-medium mt-1 block">
                Nessuna perdita dati alla chiusura
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Operazioni di Salvataggio e Sicurezza Database
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => esportaBackupJSON(soci, config, eventi, listaDonazioni)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Scarica Backup Completo Database (JSON)</span>
              </button>

              <button
                onClick={handleEsportaCSV}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Scarica Rendiconto Unificato (Excel/CSV)</span>
              </button>

              <button
                onClick={onApriStampaBilancio}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>Stampa Ufficiale per Assemblea Soci</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE PROMEMORIA E NOTIFICHE RINNOVO */}
      {mostraModalPromemoria && (
        <PromemoriaRinnovoModal
          soci={soci}
          annoSelezionato={annoRiferimentoQuote}
          config={config}
          onClose={() => setMostraModalPromemoria(false)}
          onRegistraPagamento={onRegistraPagamento}
        />
      )}

      {/* MODALE REGISTRAZIONE / MODIFICA DONAZIONE DA TERZI */}
      {modalDonazioneAperta && (
        <DonazioneModal
          donazioneIniziale={donazioneInModifica || undefined}
          annoRiferimento={annoAttivo || config.annoCorrente}
          onSalva={handleSalvaDonazione}
          onChiudi={() => {
            setModalDonazioneAperta(false);
            setDonazioneInModifica(null);
          }}
        />
      )}

      {/* MODALE STAMPA RICEVUTA UFFICIALE QUIETANZA FISCALE */}
      {donazioneRicevutaStampa && (
        <DonazioneRicevutaModal
          donazione={donazioneRicevutaStampa}
          config={config}
          onClose={() => setDonazioneRicevutaStampa(null)}
        />
      )}

      {/* MODALE CONFERMA ELIMINAZIONE DONAZIONE */}
      {confermaEliminaDonazioneId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Elimina Donazione</h4>
                <p className="text-xs text-slate-500">Confermi l'eliminazione dal registro?</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Questa azione cancellerà permanentemente la ricevuta dal registro delle entrate e aggiornerà i totali di bilancio.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfermaEliminaDonazioneId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => handleEliminaDonazione(confermaEliminaDonazioneId)}
                className="px-3.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                Elimina definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
