import React, { useState, useMemo, useEffect } from 'react';
import { ProLocoEvento, Socio, ProLocoInfo, FiltriEventi, StandEvento } from '../types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Euro, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  Tag,
  PieChart as PieChartIcon,
  Utensils,
  Music,
  Truck,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Scale,
  TrendingDown,
  Sparkles,
  Handshake,
  Briefcase,
  Store,
  RotateCcw,
  Building2,
  Check,
  ArrowRight,
  Info,
  X,
  SlidersHorizontal,
  UserCheck
} from 'lucide-react';
import { esportaEventiCSV, esportaPresenzeCSV, esportaTurniStandCSV, STAND_SIMULATI_DEFAULT } from '../storage';
import { EventBudgetChart } from './EventBudgetChart';
import { calcolaEconomiaEvento, getInfoTipoEvento, aggregaEventiPerBilancio } from '../utils/eventoHelpers';
import { EventStandsModal } from './EventStandsModal';
import { EventAttendanceModal } from './EventAttendanceModal';
import { EventAttendancePrintModal } from './EventAttendancePrintModal';

interface EventListProps {
  eventi: ProLocoEvento[];
  soci: Socio[];
  config: ProLocoInfo;
  annoSelezionato: number;
  onNuovoEvento: (step?: 1 | 2 | 3 | 4 | 5) => void;
  onModificaEvento: (evento: ProLocoEvento, step?: 1 | 2 | 3 | 4 | 5) => void;
  onEliminaEvento: (eventoId: string) => void;
  onStampaEvento: (evento: ProLocoEvento) => void;
  onAggiornaEvento?: (evento: ProLocoEvento) => void;
  onStampaProgrammaEventi?: () => void;
  onRipristinaSimulazione?: () => void;
}

export const EventList: React.FC<EventListProps> = ({
  eventi,
  soci,
  config,
  annoSelezionato,
  onNuovoEvento,
  onModificaEvento,
  onEliminaEvento,
  onStampaEvento,
  onAggiornaEvento,
  onStampaProgrammaEventi,
  onRipristinaSimulazione,
}) => {
  const [filtri, setFiltri] = useState<FiltriEventi>({
    ricerca: '',
    categoria: 'tutte',
    stato: 'tutti',
    tipoEvento: 'tutti',
    anno: annoSelezionato,
    ordinamento: 'data_asc'
  });

  useEffect(() => {
    setFiltri(prev => ({ ...prev, anno: annoSelezionato }));
  }, [annoSelezionato]);

  const [mostraGraficoAnnuale, setMostraGraficoAnnuale] = useState<boolean>(false);
  const [eventoEspansoId, setEventoEspansoId] = useState<string | null>(null);
  const [standEspansoId, setStandEspansoId] = useState<string | null>(null);
  const [turniStandEspansoId, setTurniStandEspansoId] = useState<string | null>(null);
  const [mostraComparazioneModelli, setMostraComparazioneModelli] = useState<boolean>(false);
  const [eventoPerModificaStand, setEventoPerModificaStand] = useState<ProLocoEvento | null>(null);
  const [tabInizialeModificaStand, setTabInizialeModificaStand] = useState<'bilancio' | 'turni'>('bilancio');
  const [eventoPresenze, setEventoPresenze] = useState<ProLocoEvento | null>(null);
  const [eventoStampaPresenze, setEventoStampaPresenze] = useState<ProLocoEvento | null>(null);
  const [vistaSezione, setVistaSezione] = useState<'manifestazioni' | 'presenze'>('manifestazioni');
  const [eventoSelezionatoIdPresenze, setEventoSelezionatoIdPresenze] = useState<string>(eventi[0]?.id || '');
  const [filtroPresenzeStato, setFiltroPresenzeStato] = useState<'tutti' | 'presente' | 'da_verificare' | 'assente'>('tutti');
  const [ricercaPresenze, setRicercaPresenze] = useState<string>('');

  const handleAggiornaPresenza = (eventoTarget: ProLocoEvento, iscrizioneId: string, nuovoStato: 'presente' | 'assente' | 'da_verificare') => {
    const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Amministratore'} / Registro`;
    const nuoveIscrizioni = (eventoTarget.iscrizioni || []).map(iscr => {
      if (iscr.id === iscrizioneId) {
        return {
          ...iscr,
          statoPresenza: nuovoStato,
          orarioCheckIn: nuovoStato === 'presente' ? (iscr.orarioCheckIn || ora) : undefined,
          checkInRegistratoDa: nuovoStato === 'presente' ? operatore : undefined
        };
      }
      return iscr;
    });
    const evAggiornato = { ...eventoTarget, iscrizioni: nuoveIscrizioni };
    if (onAggiornaEvento) {
      onAggiornaEvento(evAggiornato);
    } else {
      onModificaEvento(evAggiornato);
    }
  };

  const handleSegnaTuttiPresenti = (eventoTarget: ProLocoEvento) => {
    if (!confirm(`Vuoi contrassegnare tutti i ${eventoTarget.iscrizioni?.length || 0} iscritti come "Presente"?`)) return;
    const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Amministratore'} / Appello Rapido`;
    const nuoveIscrizioni = (eventoTarget.iscrizioni || []).map(iscr => ({
      ...iscr,
      statoPresenza: 'presente' as const,
      orarioCheckIn: iscr.orarioCheckIn || ora,
      checkInRegistratoDa: iscr.checkInRegistratoDa || operatore
    }));
    const evAggiornato = { ...eventoTarget, iscrizioni: nuoveIscrizioni };
    if (onAggiornaEvento) onAggiornaEvento(evAggiornato);
    else onModificaEvento(evAggiornato);
  };

  const handleAzzeraCheckIn = (eventoTarget: ProLocoEvento) => {
    if (!confirm('Vuoi azzerare lo stato delle presenze e riportare tutti a "Da Verificare"?')) return;
    const nuoveIscrizioni = (eventoTarget.iscrizioni || []).map(iscr => ({
      ...iscr,
      statoPresenza: 'da_verificare' as const,
      orarioCheckIn: undefined,
      checkInRegistratoDa: undefined
    }));
    const evAggiornato = { ...eventoTarget, iscrizioni: nuoveIscrizioni };
    if (onAggiornaEvento) onAggiornaEvento(evAggiornato);
    else onModificaEvento(evAggiornato);
  };

  const handleEliminaIscrizione = (eventoTarget: ProLocoEvento, iscrizioneId: string) => {
    if (!confirm('Confermi la cancellazione dell\'iscrizione di questo socio dall\'evento?')) return;
    const nuoveIscrizioni = (eventoTarget.iscrizioni || []).filter(i => i.id !== iscrizioneId);
    const evAggiornato = { ...eventoTarget, iscrizioni: nuoveIscrizioni };
    if (onAggiornaEvento) onAggiornaEvento(evAggiornato);
    else onModificaEvento(evAggiornato);
  };

  // Soci mappa per reperire rapidamente i nominativi
  const sociMappa = useMemo(() => {
    const map = new Map<string, Socio>();
    soci.forEach(s => map.set(s.id, s));
    return map;
  }, [soci]);

  // Filtro ed ordinamento eventi
  const eventiFiltrati = useMemo(() => {
    return eventi.filter(e => {
      // Filtro Anno
      if (filtri.anno !== 'tutti') {
        const annoEvento = parseInt(e.dataInizio.slice(0, 4), 10);
        if (annoEvento !== filtri.anno) return false;
      }

      // Filtro Ricerca testo
      if (filtri.ricerca.trim()) {
        const q = filtri.ricerca.toLowerCase();
        const matchTitolo = e.titolo.toLowerCase().includes(q);
        const matchLuogo = e.luogo.toLowerCase().includes(q);
        const matchDesc = e.descrizione.toLowerCase().includes(q);
        if (!matchTitolo && !matchLuogo && !matchDesc) return false;
      }

      // Filtro Categoria
      if (filtri.categoria !== 'tutte' && e.categoria !== filtri.categoria) {
        return false;
      }

      // Filtro Stato
      if (filtri.stato !== 'tutti' && e.stato !== filtri.stato) {
        return false;
      }

      // Filtro Tipo Evento (1. Nativo, 2. Ibrido, 3. Gestione)
      if (filtri.tipoEvento && filtri.tipoEvento !== 'tutti') {
        const t = e.tipoEvento || 'nativo';
        if (t !== filtri.tipoEvento) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filtri.ordinamento === 'data_asc') {
        return a.dataInizio.localeCompare(b.dataInizio);
      }
      if (filtri.ordinamento === 'data_desc') {
        return b.dataInizio.localeCompare(a.dataInizio);
      }
      if (filtri.ordinamento === 'titolo_asc') {
        return a.titolo.localeCompare(b.titolo);
      }
      if (filtri.ordinamento === 'budget_desc') {
        return (b.budgetPrevisto || 0) - (a.budgetPrevisto || 0);
      }
      return 0;
    });
  }, [eventi, filtri]);

  // Statistiche sul gruppo di eventi filtrato per anno, sincronizzate con il motore ufficiale di bilancio
  const stats = useMemo(() => {
    const dellAnno = filtri.anno === 'tutti' 
      ? eventi 
      : eventi.filter(e => e.dataInizio.startsWith(filtri.anno.toString()));

    const inProgramma = dellAnno.filter(e => e.stato === 'in_programma').length;
    const inCorso = dellAnno.filter(e => e.stato === 'in_corso').length;
    const conclusi = dellAnno.filter(e => e.stato === 'concluso').length;

    const aggregato = aggregaEventiPerBilancio(dellAnno);
    const totaleEntrate = aggregato.entrateCompetenzaProLoco;
    const totaleEntratePreviste = aggregato.entratePrevisteProLoco;
    const totaleCosti = aggregato.costiCompetenzaProLoco;
    const totaleBudgetPrevisto = aggregato.budgetPrevistoProLoco;
    const saldoNetto = aggregato.margineCompetenzaProLoco;

    const speseConsuntivoAggregate = {
      food: aggregato.food,
      intrattenimento: aggregato.intrattenimento,
      altreSpese: aggregato.altreSpese,
      varie: aggregato.varie
    };

    const spesePreventivoAggregate = {
      food: aggregato.foodPrev,
      intrattenimento: aggregato.intrattenimentoPrev,
      altreSpese: aggregato.altreSpesePrev,
      varie: aggregato.variePrev
    };

    const diffAssolutaBudget = aggregato.differenzaCosti;
    const isRisparmioGlobale = totaleCosti <= totaleBudgetPrevisto;

    return {
      totale: dellAnno.length,
      inProgramma,
      inCorso,
      conclusi,
      totaleEntrate,
      totaleEntratePreviste,
      totaleCosti,
      totaleBudgetPrevisto,
      diffAssolutaBudget,
      isRisparmioGlobale,
      saldoNetto,
      speseConsuntivoAggregate,
      spesePreventivoAggregate,
      volontariMobilitati: aggregato.volontariUniciCount
    };
  }, [eventi, filtri.anno]);

  const handleExportCSV = () => {
    esportaEventiCSV(eventi, filtri.anno === 'tutti' ? undefined : Number(filtri.anno));
  };

  const getBadgeStato = (stato: ProLocoEvento['stato']) => {
    switch (stato) {
      case 'in_programma':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            <span>In programma</span>
          </span>
        );
      case 'in_corso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
            <CheckCircle2 className="w-3 h-3" />
            <span>In corso</span>
          </span>
        );
      case 'concluso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            <span>Concluso</span>
          </span>
        );
      case 'annullato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" />
            <span>Annullato</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* Selettore Navigazione Principale: 1. Manifestazioni & Bilancio vs 2. Registro Presenze & Appello */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setVistaSezione('manifestazioni')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              vistaSezione === 'manifestazioni'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Calendario & Bilancio Manifestazioni</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaSezione('presenze')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              vistaSezione === 'presenze'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Registro Iscrizioni & Presenze Soci</span>
            {eventi.reduce((acc, ev) => acc + (ev.iscrizioni?.length || 0), 0) > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                vistaSezione === 'presenze' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {eventi.reduce((acc, ev) => acc + (ev.iscrizioni?.length || 0), 0)} iscritti
              </span>
            )}
          </button>
        </div>

        {/* Pulsanti Rapidi */}
        <div className="flex items-center gap-2">
          {vistaSezione === 'presenze' ? (
            <button
              type="button"
              onClick={() => {
                const ev = eventi.find(e => e.id === eventoSelezionatoIdPresenze) || eventi[0];
                if (ev) setEventoPresenze(ev);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Iscrivi Socio all'Evento</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNuovoEvento(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo Evento</span>
            </button>
          )}
        </div>
      </div>

      {vistaSezione === 'manifestazioni' ? (
        <>
          {/* ASSETTO ORGANIZZATIVO EVENTI SEZIONATO IN 5 STEP SEQUENZIALI */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/90 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-emerald-800 text-white">
                  Punto 1.2 • Assetto Organizzativo Eventi a Step
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Pianificazione e Gestione Manifestazioni in 5 Step Sequenziali
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ogni evento segue una sequenza guidata: 1. Dati, Date & Modello → 2. Squadra & Iscrizioni → 3. Stand & Turni → 4. Quadro Economico → 5. Permessi & Conferma.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNuovoEvento(1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Avvia Pianificazione Evento (Step 1 → 5)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div
                onClick={() => onNuovoEvento(1)}
                className="p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-emerald-700 text-white">Punto 1</span>
                  <span className="text-[10px] font-bold text-emerald-800">{stats.totale} eventi</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900">1. Dati, Date & Modello</div>
                <p className="text-[10px] text-slate-600 mt-0.5">Titolo, date, luogo, locandina e scelta modello (Nativo/Ibrido/Terzi).</p>
              </div>

              <div
                onClick={() => {
                  if (eventiFiltrati[0]) {
                    onModificaEvento(eventiFiltrati[0], 2);
                  } else {
                    setVistaSezione('presenze');
                  }
                }}
                className="p-2.5 rounded-xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-sky-700 text-white">Punto 2</span>
                  <span className="text-[10px] font-bold text-sky-800">{stats.volontariMobilitati} soci</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900">2. Squadra & Iscrizioni</div>
                <p className="text-[10px] text-slate-600 mt-0.5">Coordinatore, convocazione volontari dall'Albo 1.1, iscrizioni e presenze.</p>
              </div>

              <div
                onClick={() => {
                  if (eventiFiltrati[0]) {
                    onModificaEvento(eventiFiltrati[0], 3);
                  }
                }}
                className="p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-indigo-700 text-white">Punto 3</span>
                  <span className="text-[10px] font-bold text-indigo-800">Stand & Turni</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900">3. Stand & Turni</div>
                <p className="text-[10px] text-slate-600 mt-0.5">Numerazione stand #1..N, incassi/spese stand e assegnazione turni volontari.</p>
              </div>

              <div
                onClick={() => {
                  if (eventiFiltrati[0]) {
                    onModificaEvento(eventiFiltrati[0], 4);
                  } else {
                    setMostraComparazioneModelli(true);
                  }
                }}
                className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-teal-700 text-white">Punto 4</span>
                  <span className="text-[10px] font-mono font-bold text-teal-800">4 Voci Spesa</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900">4. Quadro Economico</div>
                <p className="text-[10px] text-slate-600 mt-0.5">Preventivo, Consuntivo e Differenza su Food, Musica, Logistica e Varie.</p>
              </div>

              <div
                onClick={() => {
                  if (eventiFiltrati[0]) {
                    onModificaEvento(eventiFiltrati[0], 5);
                  } else if (onStampaProgrammaEventi) {
                    onStampaProgrammaEventi();
                  }
                }}
                className="p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-amber-600 text-white">Punto 5</span>
                  <span className="text-[10px] font-bold text-amber-900">Permessi & PDF</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900">5. Permessi & Conferma</div>
                <p className="text-[10px] text-slate-600 mt-0.5">Checklist Comune, SIAE, Safety, HACCP, conferma e stampa scheda evento.</p>
              </div>
            </div>
          </div>

          {/* Banner Gestione Effettiva 3 Modelli Evento: Nativo, Ibrido, Gestione & Stand Numerati */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white border border-teal-500/40 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 shadow-2xs">
                Dati Effettivi Operativi
              </span>
              <span className="text-xs text-teal-300 font-medium">
                Gestione Eventi & Stand Numerati (Preventivo, Consuntivo e Differenza)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>1. Evento Nativo</span>
              <span className="text-teal-400">•</span>
              <span>2. Evento Ibrido</span>
              <span className="text-teal-400">•</span>
              <span>3. Evento Gestione</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Tutti gli eventi sono ora <strong>effettivi ed operativi</strong>. Ciascun evento supporta l'<strong>inserimento e la numerazione libera degli stand</strong> in base all'esigenza organizzativa, con tipologia merceologica, riferimento <strong>Food & Beverage</strong>, tracciamento di <strong>Preventivo, Consuntivo e Differenza</strong> sia sulle spese che sugli incassi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMostraComparazioneModelli(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Confronta i 3 Modelli Side-by-Side</span>
            </button>
            {onRipristinaSimulazione && (
              <button
                type="button"
                onClick={onRipristinaSimulazione}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Ripristina i 3 eventi con configurazione standard"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-300" />
                <span>Reimposta Eventi Standard</span>
              </button>
            )}
          </div>
        </div>

        {/* Badge veloci dei 3 modelli con la sintesi economica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-teal-400/20 text-xs transition-colors">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-bold text-teal-200">1. Evento Nativo</span>
              <span className="font-mono text-emerald-400 font-bold">+3.600 € Utile</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-tight">
              100% costi (5.900 €) e 100% entrate (9.500 €) a carico ed esclusivo beneficio della Pro Loco.
            </p>
          </div>

          <div className="bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-violet-400/20 text-xs transition-colors">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-bold text-violet-200">2. Evento Ibrido</span>
              <span className="font-mono text-emerald-400 font-bold">+1.800 € Utile</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-tight">
              Co-organizzato col Partner: Ripartizione 50% spese (2.950 €) ed entrate (4.750 €). Utile condiviso.
            </p>
          </div>

          <div className="bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-amber-400/20 text-xs transition-colors">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-bold text-amber-200">3. Evento Gestione</span>
              <span className="font-mono text-emerald-400 font-bold">+2.500 € Fee Netta</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-tight">
              Conto terzi Comune: Spese vive anticipate (5.900 €) rimborsate al 100% + Compenso/Fee di gestione 2.500 €.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Cruscotto Statistiche & Totali Finanziari Eventi */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Eventi & Partecipazione */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Eventi & Team</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.totale}</span>
            <span className="text-xs text-slate-500 font-medium">manifestazioni</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-blue-600" />
            <span><strong>{stats.volontariMobilitati}</strong> volontari attivi</span>
          </p>
        </div>

        {/* Card 2: Totale Preventivo Costi */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Totale Preventivo</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 font-mono">
              {(stats.totaleBudgetPrevisto || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 truncate">
            Budget stimato complessivo
          </p>
        </div>

        {/* Card 3: Totale Consuntivo Costi */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Totale Consuntivo</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Euro className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {(stats.totaleCosti || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 truncate">
            Spese reali sostenute
          </p>
        </div>

        {/* Card 4: Differenza Costi (Segno Sempre Positivo +) */}
        <div className={`p-3.5 rounded-xl border shadow-2xs ${
          stats.isRisparmioGlobale
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : 'bg-amber-50/90 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              {stats.isRisparmioGlobale ? (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>Differenza Spese</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              stats.isRisparmioGlobale ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {stats.isRisparmioGlobale ? 'Risparmio' : 'Scostamento'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-black font-mono ${
              stats.isRisparmioGlobale ? 'text-emerald-800' : 'text-amber-800'
            }`}>
              +{(stats.diffAssolutaBudget || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-slate-600 truncate">
            {stats.totaleCosti === stats.totaleBudgetPrevisto
              ? 'Pareggio perfetto'
              : stats.isRisparmioGlobale
                ? 'Spesi in meno rispetto al budget'
                : 'Scostamento positivo rispetto al budget'}
          </p>
        </div>

        {/* Card 5: Incassi & Margine Netto */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Incassi & Utile</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-800 font-mono">
              {(stats.totaleEntrate || 0).toLocaleString('it-IT')} €
            </span>
            <span className={`text-sm font-black font-mono px-1.5 py-0.5 rounded ${
              (stats.saldoNetto || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {(stats.saldoNetto || 0) >= 0 ? '+' : ''}{(stats.saldoNetto || 0).toLocaleString('it-IT')} €
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 truncate">
            Incassi stand e utile netto finale
          </p>
        </div>

      </div>

      {/* Sezione Espandibile: Analisi Bilancio, Totali & Diagrammi Comparativi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setMostraGraficoAnnuale(!mostraGraficoAnnuale)}
          className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                Rendiconto Finanziario, Totali & Diagrammi Comparativi (Anno {filtri.anno === 'tutti' ? 'Storico Completo' : filtri.anno})
              </span>
              <span className="text-[11px] text-slate-500 block">
                Visualizza diagramma a barre comparative (Preventivo vs Consuntivo), ripartizione spese e flussi economici
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-emerald-800 hidden sm:inline">
              {mostraGraficoAnnuale ? 'Nascondi Diagramma' : 'Visualizza Diagramma & Totali'}
            </span>
            {mostraGraficoAnnuale ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>

        {mostraGraficoAnnuale && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-4 animate-in fade-in duration-150">
            <EventBudgetChart
              spesePreventivo={stats.spesePreventivoAggregate}
              speseConsuntivo={stats.speseConsuntivoAggregate}
              entratePreviste={stats.totaleEntratePreviste}
              entrateRealizzate={stats.totaleEntrate}
              titolo={`Rendiconto & Diagrammi Finanziari Pro Loco - ${filtri.anno === 'tutti' ? 'Tutti gli eventi registrati' : `Esercizio ${filtri.anno}`}`}
            />
          </div>
        )}
      </div>

      {/* 2. Barra Filtri, Ricerca e Azioni */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Ricerca */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca evento per titolo o luogo..."
              value={filtri.ricerca}
              onChange={(e) => setFiltri({ ...filtri, ricerca: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Azioni Primarie: Stampa Calendario, Esporta CSV ed Aggiungi Evento */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onStampaProgrammaEventi && (
              <button
                id="btn-stampa-programma-eventi-toolbar"
                onClick={onStampaProgrammaEventi}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Stampa Calendario & Programma Eventi A4"
              >
                <Printer className="w-4 h-4 text-teal-700" />
                <span className="hidden sm:inline">Stampa Calendario A4</span>
                <span className="sm:hidden">Stampa A4</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Esporta calendario eventi in foglio Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Esporta Eventi (CSV)</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              id="btn-nuovo-evento-proloco"
              onClick={() => onNuovoEvento(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Evento</span>
            </button>
          </div>

        </div>

        {/* Riga Filtri di secondo livello */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          
          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Categoria
            </label>
            <select
              value={filtri.categoria}
              onChange={(e) => setFiltri({ ...filtri, categoria: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-700"
            >
              <option value="tutte">Tutte le categorie</option>
              <option value="Enogastronomia & Sagra">Sagre & Gastronomia</option>
              <option value="Festa Tradizionale & Patronale">Feste Tradizionali & Borghi</option>
              <option value="Musica, Spettacolo & Teatro">Musica & Spettacoli</option>
              <option value="Cultura, Arte & Mostre">Cultura & Mostre</option>
              <option value="Visita Guidata & Escursione">Visite & Escursioni</option>
              <option value="Mercatino & Fiera Tipica">Mercatini & Fiere</option>
              <option value="Sport & Tempo Libero">Sport & Tempo Libero</option>
              <option value="Assemblea & Riunione Soci">Assemblee Soci</option>
            </select>
          </div>

          {/* Tipologia Evento (Nativo, Ibrido, Gestione) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Tipologia Evento
            </label>
            <select
              value={filtri.tipoEvento || 'tutti'}
              onChange={(e) => setFiltri({ ...filtri, tipoEvento: e.target.value as any })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-700 font-medium"
            >
              <option value="tutti">Tutti i tipi (1, 2, 3)</option>
              <option value="nativo">1. Nativo (100% Pro Loco)</option>
              <option value="ibrido">2. Ibrido (Co-organizzazione)</option>
              <option value="gestione">3. Gestione (Conto Terzi)</option>
            </select>
          </div>

          {/* Stato */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Stato Evento
            </label>
            <select
              value={filtri.stato}
              onChange={(e) => setFiltri({ ...filtri, stato: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-700"
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="in_programma">In programma</option>
              <option value="in_corso">In corso</option>
              <option value="concluso">Concluso</option>
              <option value="annullato">Annullato</option>
            </select>
          </div>

          {/* Anno */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Anno
            </label>
            <select
              value={filtri.anno}
              onChange={(e) => setFiltri({ ...filtri, anno: e.target.value === 'tutti' ? 'tutti' : Number(e.target.value) })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-700"
            >
              <option value={annoSelezionato}>Anno corrente ({annoSelezionato})</option>
              <option value={annoSelezionato - 1}>Anno precedente ({annoSelezionato - 1})</option>
              <option value="tutti">Tutti gli anni (Storico)</option>
            </select>
          </div>

          {/* Ordinamento */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Ordinamento
            </label>
            <select
              value={filtri.ordinamento}
              onChange={(e) => setFiltri({ ...filtri, ordinamento: e.target.value as FiltriEventi['ordinamento'] })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-700"
            >
              <option value="data_asc">Data (più prossimi prima)</option>
              <option value="data_desc">Data (più recenti prima)</option>
              <option value="titolo_asc">Titolo alfabetico (A-Z)</option>
              <option value="budget_desc">Budget economico (€ decrescente)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3. Elenco delle Schede Evento */}
      {eventiFiltrati.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nessun evento trovato</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Non risultano eventi corrispondenti ai filtri impostati. Modifica i criteri di ricerca o crea una nuova iniziativa.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setFiltri({ ricerca: '', categoria: 'tutte', stato: 'tutti', anno: 'tutti', ordinamento: 'data_asc' })}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Azzera Filtri
            </button>
            <button
              onClick={() => onNuovoEvento(1)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Inserisci Primo Evento
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventiFiltrati.map((evento) => {
            const responsabile = evento.responsabileId ? sociMappa.get(evento.responsabileId) : null;
            const volontariNomi = (evento.volontariIds || [])
              .map(id => sociMappa.get(id))
              .filter((s): s is Socio => !!s);

            const margine = (evento.entrateRealizzate || 0) - (evento.costiSostenuti || 0);

            return (
              <div 
                key={evento.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Parte Superiore: Locandina / Badge */}
                <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                  {evento.locandina ? (
                    <img 
                      src={evento.locandina} 
                      alt={evento.titolo} 
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-800 to-slate-900 text-white">
                      <Calendar className="w-12 h-12 opacity-30" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                  {/* Badge Categoria e Tipo Evento in alto a sinistra */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 backdrop-blur-xs shadow-xs">
                      {evento.categoria}
                    </span>
                    {(() => {
                      const info = getInfoTipoEvento(evento.tipoEvento || 'nativo');
                      return (
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold backdrop-blur-xs shadow-xs ${
                          evento.tipoEvento === 'ibrido' 
                            ? 'bg-violet-900/90 text-violet-100 border border-violet-400/40' 
                            : evento.tipoEvento === 'gestione'
                              ? 'bg-amber-900/90 text-amber-100 border border-amber-400/40'
                              : 'bg-emerald-900/90 text-emerald-100 border border-emerald-400/40'
                        }`}>
                          {info.etichetta}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Badge Stato in alto a destra */}
                  <div className="absolute top-3 right-3">
                    {getBadgeStato(evento.stato)}
                  </div>

                  {/* Titolo e Luogo sovrapposti */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base sm:text-lg font-bold drop-shadow-sm leading-tight line-clamp-1">
                      {evento.titolo}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-200 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        {new Date(evento.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                        {evento.dataFine !== evento.dataInizio && ` - ${new Date(evento.dataFine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate max-w-[160px]">{evento.luogo}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Corpo Scheda Evento */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  
                  {/* Barra Sequenziale Operativa a 5 Step per Singolo Evento */}
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                        Pianificazione Evento (5 Punti)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">
                        Clicca un punto per aprirlo
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <button
                        type="button"
                        onClick={() => onModificaEvento(evento, 1)}
                        className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-200 text-left transition cursor-pointer"
                        title="Punto 1: Dati, Date & Modello"
                      >
                        <span className="block text-[9px] font-black text-emerald-700 uppercase">1. Dati</span>
                        <span className="block text-[10px] font-bold text-slate-800 truncate">Date & Modello</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onModificaEvento(evento, 2)}
                        className="p-1.5 rounded-lg bg-white hover:bg-sky-50 border border-sky-200 text-left transition cursor-pointer"
                        title="Punto 2: Squadra & Iscrizioni"
                      >
                        <span className="block text-[9px] font-black text-sky-700 uppercase">2. Squadra</span>
                        <span className="block text-[10px] font-bold text-slate-800 truncate">& Iscrizioni</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onModificaEvento(evento, 3)}
                        className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 text-left transition cursor-pointer"
                        title="Punto 3: Stand & Turni"
                      >
                        <span className="block text-[9px] font-black text-indigo-700 uppercase">3. Stand</span>
                        <span className="block text-[10px] font-bold text-slate-800 truncate">& Turni (#{(evento.standNumerati || []).length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onModificaEvento(evento, 4)}
                        className="p-1.5 rounded-lg bg-white hover:bg-teal-50 border border-teal-200 text-left transition cursor-pointer"
                        title="Punto 4: Quadro Economico"
                      >
                        <span className="block text-[9px] font-black text-teal-700 uppercase">4. Quadro</span>
                        <span className="block text-[10px] font-bold text-slate-800 truncate">Economico</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onModificaEvento(evento, 5)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-200 text-left transition cursor-pointer"
                        title="Punto 5: Permessi & Conferma"
                      >
                        <span className="block text-[9px] font-black text-amber-700 uppercase">5. Permessi</span>
                        <span className="block text-[10px] font-bold text-slate-800 truncate">& Conferma</span>
                      </button>
                    </div>
                  </div>

                  {/* Descrizione */}
                  {evento.descrizione && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {evento.descrizione}
                    </p>
                  )}

                  {/* Sezione Volontari Coinvolti */}
                  <div className="flex items-center justify-between text-xs text-slate-700 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {volontariNomi.length} Volontari
                      </span>
                      {responsabile && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          (Ref: {responsabile.cognome})
                        </span>
                      )}
                    </div>
                    {evento.partecipantiStimati ? (
                      <span className="text-[11px] text-slate-500 font-medium">
                        ~{evento.partecipantiStimati} presenze
                      </span>
                    ) : null}
                  </div>

                  {/* Sezione Iscrizioni e Presenze Soci */}
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block text-[11px] leading-tight">
                          {evento.iscrizioni?.length || 0} Soci Iscritti
                          {evento.postiMassimi ? ` (su ${evento.postiMassimi} max)` : ''}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {(evento.iscrizioni || []).filter(i => i.statoPresenza === 'presente').length} Presenti convalidati
                          {evento.quotaIscrizioneSocio ? ` • Quota: €${evento.quotaIscrizioneSocio}` : ' • Gratuito'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEventoPresenze(evento)}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Presenze & Appello
                    </button>
                  </div>

                  {/* Sezione Stand Numerati con Tipologia, Riferimento Food, Turni/Assegnazioni ed Economia Analitica */}
                  {(() => {
                    const stands: StandEvento[] = Array.isArray(evento.standNumerati)
                      ? evento.standNumerati
                      : [];
                    const isStandEspanso = standEspansoId === evento.id;
                    const isTurniEspanso = turniStandEspansoId === evento.id;
                    const foodStandsCount = stands.filter(s => s.riferimentoFood).length;

                    // Calcolo totali analitici degli stand + turni
                    let totSpPrev = 0;
                    let totSpCons = 0;
                    let totIncPrev = 0;
                    let totIncCons = 0;
                    let totTurniAss = 0;
                    let totTurniRich = 0;
                    stands.forEach((s) => {
                      totSpPrev += Number(s.spesaPreventivo) || 0;
                      totSpCons += Number(s.spesaConsuntivo) || 0;
                      totIncPrev += Number(s.incassoPrevisto) || 0;
                      totIncCons += Number(s.incassoConsuntivo) || 0;
                      const turni = Array.isArray(s.turniAssegnazioni) ? s.turniAssegnazioni : [];
                      totTurniAss += turni.length;
                      totTurniRich += Number(s.volontariRichiesti ?? 3);
                    });
                    const diffSp = totSpCons - totSpPrev;
                    const diffInc = totIncCons - totIncPrev;
                    const margStand = totIncCons - totSpCons;

                    return (
                      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 text-xs space-y-2.5">
                        
                        {/* Header Box Stand */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Store className="w-4 h-4 text-amber-600" />
                              <span>Stand Numerati ({stands.length} Stand • {totTurniAss}/{totTurniRich} Turni Assegnati)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Gestione bilancio per stand, turni orari, mansioni e assegnazione volontari
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setTabInizialeModificaStand('turni');
                                setEventoPerModificaStand(evento);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                              title="Gestisci i turni orari, le mansioni e le assegnazioni dei soci volontari per ogni stand"
                            >
                              <Users className="w-3 h-3 text-indigo-100" />
                              <span>Turni & Assegnazioni</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTabInizialeModificaStand('bilancio');
                                setEventoPerModificaStand(evento);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer border border-amber-300 shadow-2xs"
                              title="Inserisci o modifica i dati degli stand (numerazione, preventivo, consuntivo e differenze)"
                            >
                              <SlidersHorizontal className="w-3 h-3 text-amber-700" />
                              <span>Stand & Cifre</span>
                            </button>
                            {stands.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setTurniStandEspansoId(isTurniEspanso ? null : evento.id)}
                                  className="text-[10.5px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer ml-1"
                                >
                                  {isTurniEspanso ? 'Chiudi Turni' : 'Quadro Turni'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStandEspansoId(isStandEspanso ? null : evento.id)}
                                  className="text-[10.5px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer ml-1"
                                >
                                  {isStandEspanso ? 'Comprimi Cifre' : 'Tabella Cifre'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Riepilogo Rapido KPI Stand: Spese, Incassi e Margine */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-slate-500 font-sans text-[10.5px]">Spese Stand:</span>
                            <div className="text-right">
                              <strong className="text-slate-900">{(totSpCons || 0).toLocaleString('it-IT')} €</strong>
                              <span className="text-[9.5px] text-slate-400 ml-1">(prev. {(totSpPrev || 0).toLocaleString('it-IT')} €)</span>
                              <span className={`text-[9.5px] font-bold block ${diffSp <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {diffSp <= 0 ? `Diff: ${diffSp} € (Risparmio)` : `Diff: +${diffSp} € (Scost.)`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between px-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-1 sm:pt-0">
                            <span className="text-slate-500 font-sans text-[10.5px]">Incassi Stand:</span>
                            <div className="text-right">
                              <strong className="text-emerald-700">{(totIncCons || 0).toLocaleString('it-IT')} €</strong>
                              <span className="text-[9.5px] text-slate-400 ml-1">(prev. {(totIncPrev || 0).toLocaleString('it-IT')} €)</span>
                              <span className={`text-[9.5px] font-bold block ${diffInc >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {diffInc >= 0 ? `Diff: +${diffInc} €` : `Diff: ${diffInc} €`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between px-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-1 sm:pt-0">
                            <span className="text-slate-500 font-sans text-[10.5px]">Margine Stand:</span>
                            <div className="text-right">
                              <strong className={margStand >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
                                {margStand >= 0 ? `+${margStand.toLocaleString('it-IT')}` : margStand.toLocaleString('it-IT')} €
                              </strong>
                              <span className="text-[9.5px] text-slate-400 block font-sans">
                                Netto operativo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Griglia chip veloci degli stand numerati con indicatore Turni & Assegnazioni */}
                        {stands.length === 0 ? (
                          <div className="text-center py-3 bg-white rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-500">
                            Nessuno stand configurato. Clicca su <strong>Stand & Cifre</strong> o <strong>3. Stand</strong> per aggiungere stand da zero.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {stands.map((st) => {
                              const spP = Number(st.spesaPreventivo) || 0;
                              const spC = Number(st.spesaConsuntivo) || 0;
                              const inC = Number(st.incassoConsuntivo) || 0;
                              const diffS = spC - spP;
                              const turniSt = Array.isArray(st.turniAssegnazioni) ? st.turniAssegnazioni : [];
                              const richSt = Number(st.volontariRichiesti ?? 3);

                              return (
                                <div
                                  key={st.id || st.numero}
                                  className={`p-2 rounded-lg border flex items-start gap-2 ${
                                    st.riferimentoFood
                                      ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
                                      : 'bg-white border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-md text-[11px] font-bold font-mono flex items-center justify-center shrink-0 ${
                                    st.riferimentoFood ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-white'
                                  }`}>
                                    #{st.numero}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-[11px] truncate block leading-tight">
                                        {st.nome}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 mt-0.5">
                                      <span className="text-[9px] text-slate-500 truncate">
                                        Ref: {st.responsabile || '—'}
                                      </span>
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                        turniSt.length >= richSt
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        Turni {turniSt.length}/{richSt}
                                      </span>
                                    </div>
                                    {turniSt.length > 0 && (
                                      <div className="text-[9px] text-indigo-900/80 truncate mt-0.5 font-medium">
                                        👥 {turniSt.map(t => (t.nomeVolontario || t.nominativo || 'Volontario').split(' ')[0]).join(', ')}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-600 pt-1 mt-0.5 border-t border-slate-200/60">
                                      <span>Sp: <strong>{spC}€</strong> <span className={diffS <= 0 ? 'text-emerald-700' : 'text-rose-600'}>({diffS <= 0 ? `${diffS}€` : `+${diffS}€`})</span></span>
                                      <span className="text-emerald-800 font-bold">Inc: {inC}€</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Vista Espansa Turni & Assegnazioni per ogni Stand */}
                        {isTurniEspanso && stands.length > 0 && (
                          <div className="pt-2 border-t border-indigo-200 space-y-2 animate-in fade-in duration-150">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Quadro Turni e Assegnazioni Volontari per Singolo Stand</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => esportaTurniStandCSV(evento, stands)}
                                  className="text-[10px] font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileSpreadsheet className="w-3 h-3" />
                                  <span>Esporta Turni CSV</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTabInizialeModificaStand('turni');
                                    setEventoPerModificaStand(evento);
                                  }}
                                  className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-0.5 rounded cursor-pointer"
                                >
                                  + Modifica / Assegna Turni
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {stands.map((st) => {
                                const turniSt = Array.isArray(st.turniAssegnazioni) ? st.turniAssegnazioni : [];
                                const orarioSt = st.orarioAperturaStand || '18:30 - 23:30';
                                const richSt = Number(st.volontariRichiesti ?? 3);

                                return (
                                  <div key={st.id || st.numero} className="bg-white rounded-lg border border-indigo-100 p-2.5 space-y-1.5 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px]">
                                          #{st.numero}
                                        </span>
                                        <span className="font-bold text-[11px] text-slate-900 truncate max-w-[150px]">
                                          {st.nome}
                                        </span>
                                      </div>
                                      <span className="text-[9.5px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                        🕒 {orarioSt} ({turniSt.length}/{richSt})
                                      </span>
                                    </div>

                                    {turniSt.length === 0 ? (
                                      <p className="text-[10px] text-slate-400 italic py-1">
                                        Nessun volontario assegnato a questo stand.
                                      </p>
                                    ) : (
                                      <div className="space-y-1">
                                        {turniSt.map(t => {
                                          const nomeV = t.nomeVolontario || t.nominativo || 'Volontario';
                                          const mansV = (t.mansione || 'Operatore').split(' / ')[0];
                                          const orarV = t.orarioSpecifico || (t.orarioInizio && t.orarioFine ? `${t.orarioInizio}-${t.orarioFine}` : '') || (t.fasciaOraria || '').split(' ')[0];
                                          return (
                                            <div key={t.id} className="flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                              <div className="min-w-0 pr-1">
                                                <span className="font-bold text-slate-900">{nomeV}</span>
                                                <span className="text-slate-400 mx-1">•</span>
                                                <span className="text-indigo-700 font-semibold">{mansV}</span>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <span className="font-mono text-[9.5px] text-slate-600">
                                                  {orarV}
                                                </span>
                                                <span className={`w-2 h-2 rounded-full ${t.confermato ? 'bg-emerald-500' : 'bg-amber-500'}`} title={t.confermato ? 'Confermato' : 'In attesa'} />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Vista Espansa: Tabella Analitica Completa degli Stand */}
                        {isStandEspanso && (
                          <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-slate-700 block">
                                Dettaglio Economico Stand: Preventivo, Consuntivo e Scostamento
                              </span>
                              <button
                                type="button"
                                onClick={() => setEventoPerModificaStand(evento)}
                                className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Modifica Dati Stand
                              </button>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full text-[10.5px] text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                                    <th className="py-1.5 px-2">N° & Stand</th>
                                    <th className="py-1.5 px-2">Tipologia</th>
                                    <th className="py-1.5 px-2">Circuito</th>
                                    <th className="py-1.5 px-2">Referente</th>
                                    <th className="py-1.5 px-2 text-right">Spesa (Prev / Cons / Diff)</th>
                                    <th className="py-1.5 px-2 text-right">Incasso (Prev / Cons / Diff)</th>
                                    <th className="py-1.5 px-2 text-right">Margine Netto</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                  {stands.map(st => {
                                    const spP = Number(st.spesaPreventivo) || 0;
                                    const spC = Number(st.spesaConsuntivo) || 0;
                                    const diffS = spC - spP;

                                    const inP = Number(st.incassoPrevisto) || 0;
                                    const inC = Number(st.incassoConsuntivo) || 0;
                                    const diffI = inC - inP;

                                    const marg = inC - spC;

                                    return (
                                      <tr key={st.id || st.numero} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-1.5 px-2 font-sans font-bold text-slate-900 whitespace-nowrap">
                                          <span className="w-5 h-5 rounded bg-slate-800 text-white font-mono text-[10px] inline-flex items-center justify-center mr-1.5">
                                            #{st.numero}
                                          </span>
                                          {st.nome}
                                        </td>
                                        <td className="py-1.5 px-2 font-sans text-slate-600 whitespace-nowrap">
                                          {st.tipologia}
                                        </td>
                                        <td className="py-1.5 px-2 font-sans whitespace-nowrap">
                                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                            st.riferimentoFood ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                          }`}>
                                            {st.riferimentoFood ? 'Food & Bev' : 'Servizi'}
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-2 font-sans text-slate-500 whitespace-nowrap">
                                          {st.responsabile || '—'}
                                        </td>
                                        <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                          <span className="text-slate-500">{spP}€</span> / <strong className="text-slate-900">{spC}€</strong>
                                          <span className={`ml-1 text-[9.5px] font-bold ${diffS <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                            ({diffS <= 0 ? `${diffS}€` : `+${diffS}€`})
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                          <span className="text-slate-500">{inP}€</span> / <strong className="text-emerald-800">{inC}€</strong>
                                          <span className={`ml-1 text-[9.5px] font-bold ${diffI >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            ({diffI >= 0 ? `+${diffI}€` : `${diffI}€`})
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-black whitespace-nowrap">
                                          <span className={marg >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                            {marg >= 0 ? `+${marg.toLocaleString('it-IT')}` : marg.toLocaleString('it-IT')} €
                                          </span>
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
                    );
                  })()}

                  {/* Sezione Economia, Dettaglio 4 Spese, Differenza Costi (+) & Competenza Bilancio */}
                  {(() => {
                    const econ = calcolaEconomiaEvento(evento);
                    const cFood = evento.speseConsuntivo?.food ?? Math.round((evento.costiSostenuti || 0) * 0.50);
                    const cIntr = evento.speseConsuntivo?.intrattenimento ?? Math.round((evento.costiSostenuti || 0) * 0.25);
                    const cAltre = evento.speseConsuntivo?.altreSpese ?? Math.round((evento.costiSostenuti || 0) * 0.15);
                    const cVarie = evento.speseConsuntivo?.varie ?? Math.round((evento.costiSostenuti || 0) * 0.10);

                    const pFood = evento.spesePreventivo?.food ?? Math.round((evento.budgetPrevisto || 0) * 0.45);
                    const pIntr = evento.spesePreventivo?.intrattenimento ?? Math.round((evento.budgetPrevisto || 0) * 0.25);
                    const pAltre = evento.spesePreventivo?.altreSpese ?? Math.round((evento.budgetPrevisto || 0) * 0.20);
                    const pVarie = evento.spesePreventivo?.varie ?? Math.round((evento.budgetPrevisto || 0) * 0.10);

                    const totPrev = pFood + pIntr + pAltre + pVarie;
                    const totCons = cFood + cIntr + cAltre + cVarie;
                    const diffAssoluta = Math.abs(totCons - totPrev);
                    const isRisparmio = totCons <= totPrev;
                    const isEspanso = eventoEspansoId === evento.id;

                    return (
                      <div className="space-y-2">
                        <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/70 text-xs space-y-2">
                          
                          {/* Intestazione Costi & Differenza con segno sempre POSITIVO */}
                          <div className="flex items-center justify-between font-bold pb-1.5 border-b border-emerald-200/50">
                            <span className="text-slate-800 text-[11px]">
                              Spese Totali: <strong className="text-slate-900">{(totCons || 0).toLocaleString('it-IT')} €</strong> 
                              <span className="text-slate-500 font-normal text-[10px] ml-1">(Prev: {(totPrev || 0).toLocaleString('it-IT')} €)</span>
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono inline-flex items-center gap-1 ${
                              isRisparmio ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`} title={isRisparmio ? 'Spese inferiori o pari al budget previsto (Risparmio)' : 'Spese superiori al budget previsto (Scostamento)'}>
                              Diff: +{(diffAssoluta || 0).toLocaleString('it-IT')} € ({isRisparmio ? 'Risparmio' : 'Scostamento'})
                            </span>
                          </div>

                          {/* Dettagli Tipologia Specifica (Nativo, Ibrido o Gestione) */}
                          {evento.tipoEvento === 'nativo' && (
                            <div className="bg-emerald-100/60 text-emerald-950 px-2 py-1 rounded border border-emerald-300/60 text-[10.5px] flex items-center justify-between">
                              <span className="truncate">
                                <strong>Modello 1:</strong> Evento Diretto Nativo (100% Pro Loco)
                              </span>
                              <span className="font-semibold text-emerald-800 shrink-0 ml-1">
                                100% Bilancio
                              </span>
                            </div>
                          )}

                          {evento.tipoEvento === 'ibrido' && (
                            <div className="bg-violet-50 text-violet-900 px-2 py-1 rounded border border-violet-200 text-[10.5px] flex items-center justify-between">
                              <span className="truncate">
                                <strong>Modello 2 (Partner):</strong> {evento.partnerIbridoNome || 'Co-organizzatore'}
                              </span>
                              <span className="font-semibold text-violet-800 shrink-0 ml-1">
                                Spese Pro Loco: {(econ.costiProLocoConsuntivo || 0).toLocaleString('it-IT')} € (50%)
                              </span>
                            </div>
                          )}

                          {evento.tipoEvento === 'gestione' && (
                            <div className="bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 text-[10.5px] flex items-center justify-between">
                              <span className="truncate">
                                <strong>Modello 3 (Committente):</strong> {evento.committenteNome || 'Comune'}
                              </span>
                              <span className="font-semibold text-amber-800 shrink-0 ml-1">
                                Fee Pro Loco: +{(evento.compensoGestione || 0).toLocaleString('it-IT')} € (Spese 100% rimborsate)
                              </span>
                            </div>
                          )}

                          {/* 4 Voci di Spesa Analitiche */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 text-[10px]">
                            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-1 rounded border border-emerald-100 text-slate-700">
                              <Utensils className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate">Food:</span>
                              <strong className="font-mono ml-auto">{cFood}€</strong>
                            </div>
                            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-1 rounded border border-emerald-100 text-slate-700">
                              <Music className="w-2.5 h-2.5 text-violet-600 shrink-0" />
                              <span className="truncate">Spett:</span>
                              <strong className="font-mono ml-auto">{cIntr}€</strong>
                            </div>
                            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-1 rounded border border-emerald-100 text-slate-700">
                              <Truck className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                              <span className="truncate">Altre:</span>
                              <strong className="font-mono ml-auto">{cAltre}€</strong>
                            </div>
                            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-1 rounded border border-emerald-100 text-slate-700">
                              <MoreHorizontal className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span className="truncate">Varie:</span>
                              <strong className="font-mono ml-auto">{cVarie}€</strong>
                            </div>
                          </div>

                          {/* Risultato Netto ed Entrate a Bilancio Pro Loco */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/50 text-[11px]">
                            <span className="text-slate-600 text-[10px]">
                              {evento.tipoEvento === 'gestione' ? (
                                <>Rimborso Spese + Fee: <strong>{(econ.entrateProLocoRealizzate || 0).toLocaleString('it-IT')} €</strong></>
                              ) : (
                                <>Quota Incassi: <strong>{(econ.entrateProLocoRealizzate || 0).toLocaleString('it-IT')} €</strong></>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold">Utile Netto Bilancio:</span>
                              <span className={`font-black font-mono text-xs ${(econ.margineNettoProLoco || 0) >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                                {(econ.margineNettoProLoco || 0) >= 0 ? '+' : ''}{(econ.margineNettoProLoco || 0).toLocaleString('it-IT')} €
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Toggle Diagramma e Totali per l'Evento */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEventoEspansoId(isEspanso ? null : evento.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>{isEspanso ? 'Chiudi Diagramma & Totali' : 'Visualizza Diagramma & Totali Spese'}</span>
                          </button>
                        </div>

                        {/* Grafico a Torta Espanso */}
                        {isEspanso && (
                          <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                            <EventBudgetChart
                              spesePreventivo={evento.spesePreventivo || {
                                food: pFood,
                                intrattenimento: pIntr,
                                altreSpese: pAltre,
                                varie: pVarie
                              }}
                              speseConsuntivo={evento.speseConsuntivo || {
                                food: cFood,
                                intrattenimento: cIntr,
                                altreSpese: cAltre,
                                varie: cVarie
                              }}
                              entratePreviste={evento.entratePreviste ?? totPrev}
                              entrateRealizzate={evento.entrateRealizzate || 0}
                              titolo={`Bilancio & Torta: ${evento.titolo}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Punto 5: Permessi & Conferma (Conformità & Autorizzazioni) */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-500" />
                      <span>5. Permessi & Conferma (Conformità & Autorizzazioni)</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-semibold ${evento.permessoComunale ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                        {evento.permessoComunale ? '✓ Comune / Suolo' : '✗ Comune'}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-semibold ${evento.licenzaSIAE ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                        {evento.licenzaSIAE ? '✓ SIAE Musica' : '✗ SIAE'}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-semibold ${evento.pianoSicurezzaSafety ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                        {evento.pianoSicurezzaSafety ? '✓ Safety Sicurezza' : '✗ Safety'}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-semibold ${evento.aslHaccp ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                        {evento.aslHaccp ? '✓ ASL Somministrazione' : '✗ ASL'}
                      </span>
                    </div>
                  </div>

                  {/* Pulsanti Azioni */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onStampaEvento(evento)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        title="Stampa e scarica Scheda Tecnica e Circolare A4 dell'evento in PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Scheda PDF</span>
                      </button>

                      <button
                        onClick={() => setEventoPresenze(evento)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                        title="Gestisci elenco iscritti e presenze"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                        <span>Presenze ({evento.iscrizioni?.length || 0})</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onModificaEvento(evento)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        title="Modifica dettagli evento"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Modifica</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Confermi l'eliminazione dell'evento "${evento.titolo}"?`)) {
                            onEliminaEvento(evento.id);
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Elimina evento dal database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
        </>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Barra Selezione Evento per Registro Presenze */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Seleziona Evento per Appello e Tracciamento
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Controllo Presenze & Check-in Ufficiale</span>
                </h3>
              </div>

              {/* Selettore rapido a discesa */}
              <div className="w-full sm:w-80">
                <select
                  value={eventoSelezionatoIdPresenze}
                  onChange={(e) => setEventoSelezionatoIdPresenze(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-none"
                >
                  {eventi.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.titolo} ({ev.dataInizio}) — {ev.iscrizioni?.length || 0} iscritti
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chip degli eventi per selezione rapida a 1 click */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              {eventi.map(ev => {
                const attivo = (ev.id === eventoSelezionatoIdPresenze) || (!eventoSelezionatoIdPresenze && ev.id === eventi[0]?.id);
                const countIscr = ev.iscrizioni?.length || 0;
                const countPres = (ev.iscrizioni || []).filter(i => i.statoPresenza === 'presente').length;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setEventoSelezionatoIdPresenze(ev.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      attivo
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="font-bold">{ev.titolo}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      attivo ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {countPres}/{countIscr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dettaglio Evento Selezionato & Tabella Registro */}
          {(() => {
            const eventoAttivo = eventi.find(e => e.id === eventoSelezionatoIdPresenze) || eventi[0];
            if (!eventoAttivo) {
              return (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                  Nessun evento disponibile. Crea il tuo primo evento per attivare il registro presenze.
                </div>
              );
            }

            const iscritti = eventoAttivo.iscrizioni || [];
            const presenti = iscritti.filter(i => i.statoPresenza === 'presente');
            const daVerificare = iscritti.filter(i => i.statoPresenza === 'da_verificare');
            const assenti = iscritti.filter(i => i.statoPresenza === 'assente');
            const percPresenza = iscritti.length > 0 ? Math.round((presenti.length / iscritti.length) * 100) : 0;
            const quoteTotali = iscritti.reduce((acc, i) => acc + (i.quotaVersata || 0), 0);

            // Filtro della lista
            const iscrittiFiltrati = iscritti.filter(iscr => {
              if (filtroPresenzeStato !== 'tutti' && iscr.statoPresenza !== filtroPresenzeStato) return false;
              if (ricercaPresenze.trim()) {
                const s = sociMappa.get(iscr.socioId);
                const q = ricercaPresenze.toLowerCase().trim();
                const matchNome = s ? `${s.nome} ${s.cognome}`.toLowerCase().includes(q) : false;
                const matchTessera = s ? s.numeroTessera.toLowerCase().includes(q) : false;
                const matchRuolo = iscr.ruolo?.toLowerCase().includes(q);
                return matchNome || matchTessera || matchRuolo;
              }
              return true;
            });

            return (
              <div className="space-y-4">
                {/* Header Dettaglio Evento con KPI */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {eventoAttivo.categoria}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          eventoAttivo.iscrizioniAperte !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {eventoAttivo.iscrizioniAperte !== false ? 'Adesioni Aperte' : 'Iscrizioni Chiuse'}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                        {eventoAttivo.titolo}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          {eventoAttivo.dataInizio} {eventoAttivo.oraInizio ? `alle ${eventoAttivo.oraInizio}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {eventoAttivo.luogo}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEventoStampaPresenze(eventoAttivo)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer"
                        title="Stampa foglio presenze A4 per raccolta firme cartacea"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Foglio Firme A4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => esportaPresenzeCSV(eventoAttivo, soci)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer"
                        title="Esporta elenco iscritti in file Excel / CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Esporta CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventoPresenze(eventoAttivo)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Iscrivi Socio</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Box Presenze */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Soci Iscritti</span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 font-mono">{iscritti.length}</span>
                        {eventoAttivo.postiMassimi ? (
                          <span className="text-xs text-slate-400 font-medium">/ {eventoAttivo.postiMassimi} max</span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">Adesioni registrate</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">Presenti Convalidati</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-mono">
                          {percPresenza}%
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-emerald-800 font-mono">{presenti.length}</span>
                        <span className="text-xs text-emerald-700 font-medium">al check-in</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-emerald-700 h-1.5 rounded-full transition-all duration-300" style={{ width: `${percPresenza}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300">
                      <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">In Attesa Appello</span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-amber-800 font-mono">{daVerificare.length}</span>
                        <span className="text-xs text-amber-700 font-medium">da verificare</span>
                      </div>
                      <span className="text-[10px] text-amber-700 block mt-1">In attesa all'accoglienza</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Quote Raccolte</span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 font-mono">{quoteTotali.toLocaleString('it-IT')} €</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {eventoAttivo.quotaIscrizioneSocio ? `Quota di ${eventoAttivo.quotaIscrizioneSocio} € a socio` : 'Partecipazione gratuita'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra Strumenti Tabella: Ricerca, Filtri e Azioni Massive */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cerca socio per nome o tessera..."
                        value={ricercaPresenze}
                        onChange={(e) => setRicercaPresenze(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-none"
                      />
                    </div>

                    {/* Filtri pillola stato */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setFiltroPresenzeStato('tutti')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          filtroPresenzeStato === 'tutti' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tutti ({iscritti.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroPresenzeStato('presente')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          filtroPresenzeStato === 'presente' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        Presenti ({presenti.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroPresenzeStato('da_verificare')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          filtroPresenzeStato === 'da_verificare' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-700'
                        }`}
                      >
                        Da Verificare ({daVerificare.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroPresenzeStato('assente')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                          filtroPresenzeStato === 'assente' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-700'
                        }`}
                      >
                        Assenti ({assenti.length})
                      </button>
                    </div>
                  </div>

                  {/* Azioni massive appello rapido */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSegnaTuttiPresenti(eventoAttivo)}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Segna Tutti Presenti</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAzzeraCheckIn(eventoAttivo)}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Azzera Check-in</span>
                    </button>
                  </div>
                </div>

                {/* Tabella Registro Presenze con Check-in Immediato */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  {iscrittiFiltrati.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">Nessun iscritto trovato per i criteri selezionati.</p>
                      <p className="text-xs text-slate-400 mt-1">Puoi aggiungere nuovi partecipanti tramite il pulsante "Iscrivi Socio".</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Socio Partecipante</th>
                            <th className="py-3 px-4">Ruolo & Note</th>
                            <th className="py-3 px-4">Data Iscrizione</th>
                            <th className="py-3 px-4">Quota</th>
                            <th className="py-3 px-4 text-center">Stato & Check-in</th>
                            <th className="py-3 px-4 text-right">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {iscrittiFiltrati.map((iscr, idx) => {
                            const socio = sociMappa.get(iscr.socioId);
                            const nomeCompleto = socio ? `${socio.cognome} ${socio.nome}` : 'Socio non identificato';
                            const tessera = socio?.numeroTessera || 'N/D';
                            const categoria = socio?.categoria || 'Ordinario';

                            return (
                              <tr key={iscr.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-mono text-slate-400 font-bold">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                      {nomeCompleto.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block leading-tight">
                                        {nomeCompleto}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Tessera: {tessera} • {categoria}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold block w-fit ${
                                    iscr.ruolo === 'relatore' ? 'bg-amber-100 text-amber-900' :
                                    iscr.ruolo === 'staff' ? 'bg-blue-100 text-blue-900' :
                                    iscr.ruolo === 'accompagnatore' ? 'bg-violet-100 text-violet-900' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {iscr.ruolo ? iscr.ruolo.charAt(0).toUpperCase() + iscr.ruolo.slice(1) : 'Partecipante'}
                                  </span>
                                  {iscr.note && (
                                    <span className="text-[10px] text-slate-500 italic block mt-0.5 line-clamp-1">
                                      {iscr.note}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                  {iscr.dataIscrizione}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                  {iscr.quotaVersata !== undefined ? `${iscr.quotaVersata} €` : '0 €'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleAggiornaPresenza(eventoAttivo, iscr.id, 'presente')}
                                      className={`px-2 py-1 rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                        iscr.statoPresenza === 'presente'
                                          ? 'bg-emerald-700 text-white shadow-2xs'
                                          : 'text-slate-600 hover:text-emerald-700'
                                      }`}
                                      title="Registra socio come Presente"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Presente</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAggiornaPresenza(eventoAttivo, iscr.id, 'da_verificare')}
                                      className={`px-1.5 py-1 rounded text-[10.5px] font-bold transition cursor-pointer ${
                                        iscr.statoPresenza === 'da_verificare'
                                          ? 'bg-amber-600 text-white shadow-2xs'
                                          : 'text-slate-600 hover:text-amber-700'
                                      }`}
                                      title="Riporta a Da Verificare"
                                    >
                                      <span>?</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAggiornaPresenza(eventoAttivo, iscr.id, 'assente')}
                                      className={`px-2 py-1 rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                        iscr.statoPresenza === 'assente'
                                          ? 'bg-rose-600 text-white shadow-2xs'
                                          : 'text-slate-600 hover:text-rose-700'
                                      }`}
                                      title="Segna come Assente"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Assente</span>
                                    </button>
                                  </div>
                                  {iscr.orarioCheckIn && (
                                    <span className="block text-[9.5px] text-emerald-700 font-mono font-medium mt-0.5">
                                      Check-in: {iscr.orarioCheckIn}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleEliminaIscrizione(eventoAttivo, iscr.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Cancella iscrizione socio dall'evento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. Modale Comparativa Side-by-Side dei 3 Modelli di Gestione Economica */}
      {mostraComparazioneModelli && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* Header Modale */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Confronto dei 3 Modelli di Gestione Eventi Pro Loco</span>
                  </h3>
                  <p className="text-xs text-teal-300">
                    Stesse voci analitiche • Stessi 6 stand numerati (#1-#6 con rif. Food) • Differenza: Meccanismo Economico
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostraComparazioneModelli(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Chiudi confronto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo Modale con Tabella Comparativa */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-slate-50/50">
              
              {/* Box Informativo Introduttivo */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-[13px]">Parametri di Confronto Standardizzati:</span>
                  <p className="leading-relaxed">
                    Come richiesto, la simulazione impiega per tutte e tre le manifestazioni la <strong>medesima configurazione operativa</strong>: le stesse 4 voci di spesa (Food 3.200 €, Spettacolo 1.200 €, Altre 1.100 €, Varie 400 € = 5.900 €), gli stessi incassi lordi da stand (9.500 €) e la stessa pianta allestimento con 6 stand numerati. La tabella evidenzia in modo trasparente l'<strong>unica differenza: l'architettura della gestione economica</strong>.
                  </p>
                </div>
              </div>

              {/* Colonne Comparativa dei 3 Modelli */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Evento Nativo */}
                <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-xs flex flex-col overflow-hidden">
                  <div className="bg-emerald-700 text-white p-3.5 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-wider inline-block">
                      Modello 1
                    </span>
                    <h4 className="text-base font-bold">1. Evento Nativo</h4>
                    <p className="text-[11px] text-emerald-100">
                      Sagra della Castagna e dei Sapori d'Autunno
                    </p>
                  </div>

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Titolarità & Organizzazione
                        </span>
                        <p className="font-semibold text-slate-900 text-[11.5px]">
                          100% Pro Loco (Titolarità Diretta)
                        </p>
                        <span className="text-[10.5px] text-slate-500">Nessun partner esterno, piena autonomia decisionale.</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Stand Numerati & Riferimento Food
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] mb-1">
                          <Store className="w-3 h-3 text-emerald-700" />
                          6 Stand: 4 Food & 2 No-Food
                        </span>
                        <p className="text-[10.5px] text-slate-600">
                          #1 Cucina (Food), #2 Griglia (Food), #3 Friggitoria (Food), #4 Beverage (Food), #5 Cassa (Servizi), #6 Mercatino (Servizi).
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Voci di Spesa (Consuntivo)
                        </span>
                        <div className="font-mono text-[11px] space-y-0.5 text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                          <div className="flex justify-between"><span>Food & Beverage:</span><strong>3.200 €</strong></div>
                          <div className="flex justify-between"><span>Intrattenimento:</span><strong>1.200 €</strong></div>
                          <div className="flex justify-between"><span>Altre Spese:</span><strong>1.100 €</strong></div>
                          <div className="flex justify-between"><span>Varie / Imprevisti:</span><strong>400 €</strong></div>
                          <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                            <span>Totale Spese Sostenute:</span><strong>5.900 €</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Incassi Realizzati Stand
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 block">
                          9.500 €
                        </span>
                        <span className="text-[10.5px] text-slate-500">100% incassato alle casse Pro Loco</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Regola Economica Applicata
                        </span>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          <strong>Formula:</strong> Incassi totali (9.500 €) − Costi totali (5.900 €). Tutto il rischio e il ricavo restano all'interno della Pro Loco.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-emerald-500 bg-emerald-50/70 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        Utile Netto Bilancio Pro Loco:
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-700 block mt-0.5">
                        +3.600 €
                      </span>
                      <span className="text-[10px] text-emerald-900 font-medium">
                        100% Utile a cassa associativa
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Evento Ibrido */}
                <div className="bg-white rounded-xl border-2 border-violet-500 shadow-xs flex flex-col overflow-hidden">
                  <div className="bg-violet-700 text-white p-3.5 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-wider inline-block">
                      Modello 2
                    </span>
                    <h4 className="text-base font-bold">2. Evento Ibrido</h4>
                    <p className="text-[11px] text-violet-100">
                      Festa Patronale & Borgo Antico in Festa
                    </p>
                  </div>

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Titolarità & Organizzazione
                        </span>
                        <p className="font-semibold text-slate-900 text-[11.5px]">
                          Co-organizzazione con Partner
                        </p>
                        <span className="text-[10.5px] text-slate-500">Partner: Parrocchia & Comitato Festeggiamenti (Accordo 50/50).</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Stand Numerati & Riferimento Food
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded text-[11px] mb-1">
                          <Store className="w-3 h-3 text-violet-700" />
                          6 Stand: 4 Food & 2 No-Food
                        </span>
                        <p className="text-[10.5px] text-slate-600">
                          #1 Cucina (Food), #2 Griglia (Food), #3 Friggitoria (Food), #4 Beverage (Food), #5 Cassa (Servizi), #6 Mercatino (Servizi).
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Voci di Spesa (Consuntivo)
                        </span>
                        <div className="font-mono text-[11px] space-y-0.5 text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                          <div className="flex justify-between"><span>Food & Beverage:</span><strong>3.200 €</strong></div>
                          <div className="flex justify-between"><span>Intrattenimento:</span><strong>1.200 €</strong></div>
                          <div className="flex justify-between"><span>Altre Spese:</span><strong>1.100 €</strong></div>
                          <div className="flex justify-between"><span>Varie / Imprevisti:</span><strong>400 €</strong></div>
                          <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                            <span>Totale Spese Complessive:</span><strong>5.900 €</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Incassi Realizzati Stand
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 block">
                          9.500 €
                        </span>
                        <span className="text-[10.5px] text-slate-500">Incasso lordo condiviso al 50%</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Regola Economica Applicata
                        </span>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          <strong>Formula:</strong> Quota Entrate 50% (4.750 €) − Quota Spese 50% (2.950 €). Costi ed entrate ripartiti equamente con il Partner.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-violet-500 bg-violet-50/70 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-violet-800 uppercase block">
                        Utile Netto Bilancio Pro Loco:
                      </span>
                      <span className="text-2xl font-black font-mono text-violet-700 block mt-0.5">
                        +1.800 €
                      </span>
                      <span className="text-[10px] text-violet-900 font-medium">
                        50% alla Pro Loco (+1.800 € al Partner)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Evento Gestione */}
                <div className="bg-white rounded-xl border-2 border-amber-500 shadow-xs flex flex-col overflow-hidden">
                  <div className="bg-amber-600 text-white p-3.5 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-wider inline-block">
                      Modello 3
                    </span>
                    <h4 className="text-base font-bold">3. Evento Gestione</h4>
                    <p className="text-[11px] text-amber-100">
                      Festa del Natale & Mercatini nel Borgo
                    </p>
                  </div>

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Titolarità & Organizzazione
                        </span>
                        <p className="font-semibold text-slate-900 text-[11.5px]">
                          Gestione per Conto Terzi (Convenzione)
                        </p>
                        <span className="text-[10.5px] text-slate-500">Committente: Comune di Montechiaro (Incarico istituzionale).</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Stand Numerati & Riferimento Food
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] mb-1">
                          <Store className="w-3 h-3 text-amber-700" />
                          6 Stand: 4 Food & 2 No-Food
                        </span>
                        <p className="text-[10.5px] text-slate-600">
                          #1 Cucina (Food), #2 Griglia (Food), #3 Friggitoria (Food), #4 Beverage (Food), #5 Cassa (Servizi), #6 Mercatino (Servizi).
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Voci di Spesa (Consuntivo)
                        </span>
                        <div className="font-mono text-[11px] space-y-0.5 text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                          <div className="flex justify-between"><span>Food & Beverage:</span><strong>3.200 €</strong></div>
                          <div className="flex justify-between"><span>Intrattenimento:</span><strong>1.200 €</strong></div>
                          <div className="flex justify-between"><span>Altre Spese:</span><strong>1.100 €</strong></div>
                          <div className="flex justify-between"><span>Varie / Imprevisti:</span><strong>400 €</strong></div>
                          <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                            <span>Spese Rimborsate al 100%:</span><strong>5.900 €</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Incassi Stand & Rimborsi
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 block">
                          5.900 € rimborso + 2.500 € fee
                        </span>
                        <span className="text-[10.5px] text-slate-500">Spese coperte al 100% dal Comune di Montechiaro</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Regola Economica Applicata
                        </span>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          <strong>Formula:</strong> Rimborso spese a piè di lista (5.900 €) + Compenso/Fee di Gestione concordata (2.500 €). Rischio d'impresa azzerato.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-amber-500 bg-amber-50/70 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        Utile Netto Bilancio Pro Loco:
                      </span>
                      <span className="text-2xl font-black font-mono text-amber-700 block mt-0.5">
                        +2.500 €
                      </span>
                      <span className="text-[10px] text-amber-900 font-medium">
                        Fee di gestione pattuita (Zero rischio)
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tabella Comparativa di Sintesi Finale */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-900 text-xs">
                  Sintesi Comparativa Parametri Economici
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10.5px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Voce / Parametro</th>
                        <th className="py-2.5 px-3 text-emerald-800">1. Nativo</th>
                        <th className="py-2.5 px-3 text-violet-800">2. Ibrido (50/50)</th>
                        <th className="py-2.5 px-3 text-amber-800">3. Gestione (Conto Terzi)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Stand Numerati Allestiti</td>
                        <td className="py-2 px-3 font-mono">6 Stand (#1-#6)</td>
                        <td className="py-2 px-3 font-mono">6 Stand (#1-#6)</td>
                        <td className="py-2 px-3 font-mono">6 Stand (#1-#6)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Tipologia Stand & Rif. Food</td>
                        <td className="py-2 px-3">4 Food, 2 Servizi</td>
                        <td className="py-2 px-3">4 Food, 2 Servizi</td>
                        <td className="py-2 px-3">4 Food, 2 Servizi</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Voci di Spesa Preventivo</td>
                        <td className="py-2 px-3 font-mono">6.500 €</td>
                        <td className="py-2 px-3 font-mono">6.500 €</td>
                        <td className="py-2 px-3 font-mono">6.500 €</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Voci di Spesa Consuntivo</td>
                        <td className="py-2 px-3 font-mono">5.900 €</td>
                        <td className="py-2 px-3 font-mono">5.900 €</td>
                        <td className="py-2 px-3 font-mono">5.900 €</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Incassi Lordi Stand</td>
                        <td className="py-2 px-3 font-mono">9.500 €</td>
                        <td className="py-2 px-3 font-mono">9.500 €</td>
                        <td className="py-2 px-3 font-mono">9.500 €</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Costi a carico Pro Loco</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">5.900 € (100%)</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">2.950 € (50%)</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">0 € (100% rimborsati)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Entrate incassate Pro Loco</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-800">9.500 € (100%)</td>
                        <td className="py-2 px-3 font-mono font-bold text-violet-800">4.750 € (50%)</td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-800">8.400 € (5.900€ rimb. + 2.500€ fee)</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="py-3 px-3 text-slate-900 text-xs">Utile Netto Finale Pro Loco</td>
                        <td className="py-3 px-3 font-mono text-base text-emerald-700">+3.600 €</td>
                        <td className="py-3 px-3 font-mono text-base text-violet-700">+1.800 €</td>
                        <td className="py-3 px-3 font-mono text-base text-amber-700">+2.500 €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer Modale */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Guida operativa conforme ai principi contabili e gestionali UNPLI per Pro Loco APS
              </span>
              <button
                type="button"
                onClick={() => setMostraComparazioneModelli(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modale Dedicata per Gestione & Inserimento Dati Stand Numerati e Turni */}
      {eventoPerModificaStand && (
        <EventStandsModal
          evento={eventoPerModificaStand}
          soci={soci}
          initialTab={tabInizialeModificaStand}
          onSalva={(eventoAggiornato) => {
            if (onAggiornaEvento) {
              onAggiornaEvento(eventoAggiornato);
            } else {
              onModificaEvento(eventoAggiornato);
            }
            setEventoPerModificaStand(null);
          }}
          onClose={() => setEventoPerModificaStand(null)}
        />
      )}

      {/* Modale Gestione Iscrizioni & Tracciamento Presenze */}
      {eventoPresenze && (
        <EventAttendanceModal
          evento={eventoPresenze}
          soci={soci}
          config={config}
          onAggiornaEvento={(evAggiornato) => {
            if (onAggiornaEvento) {
              onAggiornaEvento(evAggiornato);
            } else {
              onModificaEvento(evAggiornato);
            }
            setEventoPresenze(evAggiornato);
          }}
          onApriStampaPresenze={(ev) => setEventoStampaPresenze(ev)}
          onClose={() => setEventoPresenze(null)}
        />
      )}

      {/* Modale Stampa Foglio Firme Presenze Ufficiale A4 */}
      {eventoStampaPresenze && (
        <EventAttendancePrintModal
          evento={eventoStampaPresenze}
          config={config}
          soci={soci}
          onClose={() => setEventoStampaPresenze(null)}
        />
      )}

    </div>
  );
};
