import React, { useState, useMemo } from 'react';
import { 
  StandEvento, 
  ProLocoEvento, 
  TipologiaStand, 
  Socio, 
  FasciaOrariaTurno, 
  MansioneStand, 
  AssegnazioneVolontarioStand 
} from '../types';
import { 
  X, 
  Store, 
  Plus, 
  Trash2, 
  ArrowUpDown, 
  RotateCcw, 
  Check, 
  Utensils, 
  Users,
  Clock,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Phone,
  CalendarClock,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { STAND_SIMULATI_DEFAULT, esportaTurniStandCSV } from '../storage';

interface EventStandsModalProps {
  evento: ProLocoEvento;
  soci: Socio[];
  initialTab?: 'bilancio' | 'turni';
  onSalva: (eventoAggiornato: ProLocoEvento) => void;
  onClose: () => void;
}

const TIPOLOGIE_STAND_PREDEFINITE: TipologiaStand[] = [
  'Food / Gastronomia',
  'Food / Griglia & Brace',
  'Food / Friggitoria & Dolci',
  'Beverage / Bar & Vini',
  'Cassa & Ticket',
  'Mercatino & Artigianato',
  'Info Point & Servizi'
];

export const FASCE_ORARIE_TURNO: FasciaOrariaTurno[] = [
  'Mattina (Allestimento & Prep)',
  'Pranzo (Servizio Diurno)',
  'Pomeriggio (Accoglienza)',
  'Cena (Servizio Serale)',
  'Notte (Chiusura & Riordino)',
  'Giornata Intera'
];

export const MANSIONI_STAND: MansioneStand[] = [
  'Responsabile Stand / Capo Postazione',
  'Cuoco / Addetto Cucina',
  'Fuochista / Addetto Griglia',
  'Addetto Friggitoria / Dolci',
  'Barista / Spillatore Bevande',
  'Cassiere / Addetto Ticket',
  'Servizio ai Tavoli / Runner',
  'Accoglienza / Info Point',
  'Logistica / Rifornimento Scorte'
];

export const EventStandsModal: React.FC<EventStandsModalProps> = ({
  evento,
  soci,
  initialTab = 'bilancio',
  onSalva,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'bilancio' | 'turni'>(initialTab);

  // Inizializza gli stand dell'evento comprensivi di turni e assegnazioni (senza forzare dati fittizi se vuoto)
  const [stands, setStands] = useState<StandEvento[]>(() => {
    const esistenti = Array.isArray(evento.standNumerati) ? evento.standNumerati : [];

    return esistenti.map((s) => {
      const rawTurni = Array.isArray(s.turniAssegnazioni) ? s.turniAssegnazioni : [];
      const turniNorm = rawTurni.map(t => {
        const nome = t.nomeVolontario || t.nominativo || 'Volontario';
        const spec = t.orarioSpecifico || (t.orarioInizio && t.orarioFine ? `${t.orarioInizio} - ${t.orarioFine}` : '18:30 - 23:30');
        return {
          ...t,
          nomeVolontario: nome,
          nominativo: nome,
          orarioSpecifico: spec
        };
      });
      return {
        ...s,
        spesaPreventivo: s.spesaPreventivo ?? 0,
        spesaConsuntivo: s.spesaConsuntivo ?? 0,
        incassoPrevisto: s.incassoPrevisto ?? (s.incassoStimato || 0),
        incassoConsuntivo: s.incassoConsuntivo ?? (s.incassoStimato || 0),
        orarioAperturaStand: s.orarioAperturaStand ?? '18:30 - 23:30',
        volontariRichiesti: s.volontariRichiesti ?? 3,
        turniAssegnazioni: turniNorm
      };
    });
  });

  const [sincronizzaConEvento, setSincronizzaConEvento] = useState<boolean>(true);
  const [confermaRipristino, setConfermaRipristino] = useState<boolean>(false);
  const [avvisoMinimo, setAvvisoMinimo] = useState<boolean>(false);

  // Filtri e form per la scheda Turni & Assegnazioni
  const [filtroStandId, setFiltroStandId] = useState<string>('tutti');
  const [filtroFascia, setFiltroFascia] = useState<string>('tutte');
  const [standConFormAperto, setStandConFormAperto] = useState<number | null>(0);

  // Stato nuovo turno da aggiungere a uno stand
  const [nuovoSocioId, setNuovoSocioId] = useState<string>('');
  const [nuovoNomeEsterno, setNuovoNomeEsterno] = useState<string>('');
  const [nuovoTelefono, setNuovoTelefono] = useState<string>('');
  const [nuovaMansione, setNuovaMansione] = useState<MansioneStand>('Servizio ai Tavoli / Runner');
  const [nuovaFascia, setNuovaFascia] = useState<FasciaOrariaTurno>('Cena (Servizio Serale)');
  const [nuovoOrarioSpec, setNuovoOrarioSpec] = useState<string>('18:30 - 23:30');
  const [nuovaNotaTurno, setNuovaNotaTurno] = useState<string>('');

  const sociAttivi = useMemo(() => soci.filter(s => !s.dataCancellazione), [soci]);

  // Calcoli aggregati (economici + turni volontari)
  const totali = useMemo(() => {
    let totSpesePrev = 0;
    let totSpeseCons = 0;
    let totIncassiPrev = 0;
    let totIncassiCons = 0;
    let totFoodSpesePrev = 0;
    let totFoodSpeseCons = 0;
    let totFoodIncassiCons = 0;
    let totTurniAssegnati = 0;
    let totTurniConfermati = 0;
    let totVolontariRichiesti = 0;

    stands.forEach(s => {
      const spPrev = Number(s.spesaPreventivo) || 0;
      const spCons = Number(s.spesaConsuntivo) || 0;
      const incPrev = Number(s.incassoPrevisto) || 0;
      const incCons = Number(s.incassoConsuntivo) || 0;

      totSpesePrev += spPrev;
      totSpeseCons += spCons;
      totIncassiPrev += incPrev;
      totIncassiCons += incCons;

      if (s.riferimentoFood) {
        totFoodSpesePrev += spPrev;
        totFoodSpeseCons += spCons;
        totFoodIncassiCons += incCons;
      }

      const assegnazioni = s.turniAssegnazioni || [];
      totTurniAssegnati += assegnazioni.length;
      totTurniConfermati += assegnazioni.filter(a => a.confermato).length;
      totVolontariRichiesti += Number(s.volontariRichiesti) || 0;
    });

    const diffSpese = totSpeseCons - totSpesePrev;
    const diffIncassi = totIncassiCons - totIncassiPrev;
    const margineCons = totIncassiCons - totSpeseCons;
    const marginePrev = totIncassiPrev - totSpesePrev;

    return {
      totSpesePrev,
      totSpeseCons,
      diffSpese,
      totIncassiPrev,
      totIncassiCons,
      diffIncassi,
      margineCons,
      marginePrev,
      totFoodSpesePrev,
      totFoodSpeseCons,
      totFoodIncassiCons,
      conteggioFood: stands.filter(s => s.riferimentoFood).length,
      totTurniAssegnati,
      totTurniConfermati,
      totVolontariRichiesti
    };
  }, [stands]);

  // Aggiorna singolo stand
  const handleAggiornaStand = (index: number, campo: keyof StandEvento, valore: any) => {
    setStands(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [campo]: valore
      };
      return copy;
    });
  };

  // Aggiungi nuovo stand
  const handleAggiungiStand = () => {
    const maxNum = stands.reduce((max, s) => Math.max(max, Number(s.numero) || 0), 0);
    const nuovoNum = maxNum + 1;
    const nuovoStand: StandEvento = {
      id: `std-custom-${Date.now()}`,
      numero: nuovoNum,
      nome: `Stand #${nuovoNum}`,
      tipologia: 'Food / Gastronomia',
      riferimentoFood: true,
      responsabile: '',
      spesaPreventivo: 0,
      spesaConsuntivo: 0,
      incassoPrevisto: 0,
      incassoConsuntivo: 0,
      descrizione: '',
      orarioAperturaStand: '18:30 - 23:30',
      volontariRichiesti: 3,
      turniAssegnazioni: []
    };
    setStands(prev => [...prev, nuovoStand]);
  };

  // Rimuovi stand
  const handleRimuoviStand = (index: number) => {
    setStands(prev => prev.filter((_, i) => i !== index));
  };

  // Ordina stand per numero
  const handleOrdinaPerNumero = () => {
    setStands(prev => [...prev].sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0)));
  };

  // Ripristina stand predefiniti
  const handleRipristinaPredefiniti = () => {
    setStands(STAND_SIMULATI_DEFAULT);
    setConfermaRipristino(false);
  };

  // Gestione Turni e Assegnazioni per singolo stand
  const handleSelezionaSocioPerTurno = (socioId: string) => {
    setNuovoSocioId(socioId);
    if (socioId) {
      const s = sociAttivi.find(item => item.id === socioId);
      if (s) {
        setNuovoNomeEsterno(`${s.nome} ${s.cognome}`);
        setNuovoTelefono(s.telefono || '');
      }
    } else {
      setNuovoNomeEsterno('');
      setNuovoTelefono('');
    }
  };

  const handleAggiungiTurnoAStand = (standIndex: number) => {
    const socioSel = sociAttivi.find(s => s.id === nuovoSocioId);
    const nominativoFinale = socioSel
      ? `${socioSel.nome} ${socioSel.cognome}`
      : nuovoNomeEsterno.trim();

    if (!nominativoFinale) return;

    const nuovaAssegnazione: AssegnazioneVolontarioStand = {
      id: `trn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      socioId: socioSel ? socioSel.id : undefined,
      nomeVolontario: nominativoFinale,
      nominativo: nominativoFinale,
      numeroTessera: socioSel ? socioSel.numeroTessera : undefined,
      telefono: nuovoTelefono.trim() || socioSel?.telefono || '',
      mansione: nuovaMansione,
      fasciaOraria: nuovaFascia,
      orarioSpecifico: nuovoOrarioSpec.trim() || undefined,
      orarioInizio: (nuovoOrarioSpec || '18:30 - 23:30').split('-')[0]?.trim() || '18:30',
      orarioFine: (nuovoOrarioSpec || '18:30 - 23:30').split('-')[1]?.trim() || '23:30',
      note: nuovaNotaTurno.trim() || undefined,
      confermato: true
    };

    setStands(prev => {
      const copy = [...prev];
      const attuali = copy[standIndex].turniAssegnazioni || [];
      copy[standIndex] = {
        ...copy[standIndex],
        turniAssegnazioni: [...attuali, nuovaAssegnazione]
      };
      return copy;
    });

    // Reset parziale form per inserimento rapido successivo
    setNuovoSocioId('');
    setNuovoNomeEsterno('');
    setNuovoTelefono('');
    setNuovaNotaTurno('');
  };

  const handleToggleConfermaTurno = (standIndex: number, turnoId: string) => {
    setStands(prev => {
      const copy = [...prev];
      const attuali = copy[standIndex].turniAssegnazioni || [];
      copy[standIndex] = {
        ...copy[standIndex],
        turniAssegnazioni: attuali.map(t => t.id === turnoId ? { ...t, conferma: !t.confermato, confermato: !t.confermato } : t)
      };
      return copy;
    });
  };

  const handleAggiornaCampoTurno = (
    standIndex: number,
    turnoId: string,
    campo: keyof AssegnazioneVolontarioStand,
    valore: any
  ) => {
    setStands(prev => {
      const copy = [...prev];
      const attuali = copy[standIndex].turniAssegnazioni || [];
      copy[standIndex] = {
        ...copy[standIndex],
        turniAssegnazioni: attuali.map(t => t.id === turnoId ? { ...t, [campo]: valore } : t)
      };
      return copy;
    });
  };

  const handleRimuoviTurnoDaStand = (standIndex: number, turnoId: string) => {
    setStands(prev => {
      const copy = [...prev];
      const attuali = copy[standIndex].turniAssegnazioni || [];
      copy[standIndex] = {
        ...copy[standIndex],
        turniAssegnazioni: attuali.filter(t => t.id !== turnoId)
      };
      return copy;
    });
  };

  // Salva
  const handleSalva = () => {
    // Raccoglie anche tutti i socioId assegnati nei vari stand per sincronizzare volontariIds dell'evento
    const sociIdsNeiTurni = new Set<string>(evento.volontariIds || []);
    stands.forEach(s => {
      (s.turniAssegnazioni || []).forEach(t => {
        if (t.socioId) sociIdsNeiTurni.add(t.socioId);
      });
    });

    let eventoAggiornato: ProLocoEvento = {
      ...evento,
      standNumerati: stands,
      volontariIds: Array.from(sociIdsNeiTurni)
    };

    if (sincronizzaConEvento) {
      const spPrevCurrent = evento.spesePreventivo || { food: 0, intrattenimento: 0, altreSpese: 0, varie: 0 };
      const spConsCurrent = evento.speseConsuntivo || { food: 0, intrattenimento: 0, altreSpese: 0, varie: 0 };

      const newSpesePrev = {
        ...spPrevCurrent,
        food: totali.totFoodSpesePrev > 0 ? totali.totFoodSpesePrev : spPrevCurrent.food
      };
      const newSpeseCons = {
        ...spConsCurrent,
        food: totali.totFoodSpeseCons > 0 ? totali.totFoodSpeseCons : spConsCurrent.food
      };

      const totCostPrev = (newSpesePrev.food || 0) + (newSpesePrev.intrattenimento || 0) + (newSpesePrev.altreSpese || 0) + (newSpesePrev.varie || 0);
      const totCostCons = (newSpeseCons.food || 0) + (newSpeseCons.intrattenimento || 0) + (newSpeseCons.altreSpese || 0) + (newSpeseCons.varie || 0);

      eventoAggiornato = {
        ...eventoAggiornato,
        spesePreventivo: newSpesePrev,
        speseConsuntivo: newSpeseCons,
        budgetPrevisto: totCostPrev > 0 ? totCostPrev : evento.budgetPrevisto,
        costiSostenuti: totCostCons > 0 ? totCostCons : evento.costiSostenuti,
        entratePreviste: totali.totIncassiPrev > 0 ? totali.totIncassiPrev : evento.entratePreviste,
        entrateRealizzate: totali.totIncassiCons > 0 ? totali.totIncassiCons : evento.entrateRealizzate
      };
    }

    onSalva(eventoAggiornato);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[95vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Intestazione */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Store className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Gestione Stand, Bilancio & Turni Volontari
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  {evento.tipoEvento.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xl">
                {evento.titolo} • Punto 1.2 Eventi: Anagrafica Stand, Preventivo/Consuntivo, Turni e Assegnazioni per ogni Stand
              </p>
            </div>
          </div>

          {/* Selettore Scheda Principale: Bilancio Stand vs Turni & Assegnazioni */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('bilancio')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bilancio'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Anagrafica & Bilancio Stand</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('turni')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'turni'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>2. Turni & Assegnazioni Stand</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'turni' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {totali.totTurniAssegnati}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra KPI Totali Stand */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3 shrink-0 border-b border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            
            {/* Totale Stand */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Stand Configurati
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-white">
                  {stands.length}
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  ({totali.conteggioFood} Food & Bev)
                </span>
              </div>
            </div>

            {/* Copertura Turni & Volontari */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-indigo-300 uppercase font-semibold block">
                Turni & Assegnazioni Stand
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-indigo-400">
                  {totali.totTurniAssegnati} / {totali.totVolontariRichiesti}
                </span>
                <span className="text-[11px] text-slate-300">
                  assegnati
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                {totali.totTurniConfermati} turni confermati
              </div>
            </div>

            {/* Totale Spese Stand */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Spese Stand (Cons. vs Prev.)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-white">
                  {totali.totSpeseCons.toLocaleString('it-IT')} €
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (prev. {totali.totSpesePrev.toLocaleString('it-IT')} €)
                </span>
              </div>
              <div className="text-[10px] font-mono">
                {totali.diffSpese <= 0 ? (
                  <span className="text-emerald-400 font-bold">
                    Diff: {totali.diffSpese.toLocaleString('it-IT')} € (Risparmio)
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold">
                    Diff: +{totali.diffSpese.toLocaleString('it-IT')} € (Scostamento)
                  </span>
                )}
              </div>
            </div>

            {/* Totale Incassi Stand */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Incassi Stand (Cons. vs Prev.)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-emerald-400">
                  {totali.totIncassiCons.toLocaleString('it-IT')} €
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (prev. {totali.totIncassiPrev.toLocaleString('it-IT')} €)
                </span>
              </div>
              <div className="text-[10px] font-mono">
                {totali.diffIncassi >= 0 ? (
                  <span className="text-emerald-400 font-bold">
                    Diff: +{totali.diffIncassi.toLocaleString('it-IT')} €
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    Diff: {totali.diffIncassi.toLocaleString('it-IT')} €
                  </span>
                )}
              </div>
            </div>

            {/* Margine Netto Stand */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Margine Netto Stand
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg font-black font-mono ${
                  totali.margineCons >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {totali.margineCons >= 0 ? `+${totali.margineCons.toLocaleString('it-IT')}` : totali.margineCons.toLocaleString('it-IT')} €
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Previsto: {totali.marginePrev >= 0 ? `+${totali.marginePrev.toLocaleString('it-IT')}` : totali.marginePrev.toLocaleString('it-IT')} €
              </div>
            </div>

          </div>
        </div>

        {/* Toolbar Azioni Stand */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAggiungiStand}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Stand</span>
            </button>
            <button
              type="button"
              onClick={handleOrdinaPerNumero}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs transition-colors cursor-pointer"
              title="Ordina la lista per numero progressivo stand"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Ordina per N°</span>
            </button>
            <button
              type="button"
              onClick={() => esportaTurniStandCSV({ ...evento, standNumerati: stands })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold text-xs transition-colors cursor-pointer"
              title="Esporta foglio turni e assegnazioni di ogni stand in formato CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Esporta Turni Stand (CSV)</span>
            </button>
            {confermaRipristino ? (
              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 p-1 rounded-lg text-xs">
                <span className="text-amber-800 font-medium px-1">Confermi ripristino 6 stand con turni?</span>
                <button
                  type="button"
                  onClick={handleRipristinaPredefiniti}
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] cursor-pointer"
                >
                  Sì, ripristina
                </button>
                <button
                  type="button"
                  onClick={() => setConfermaRipristino(false)}
                  className="px-2 py-0.5 bg-white text-slate-600 hover:bg-slate-100 rounded text-[11px] cursor-pointer border border-slate-300"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfermaRipristino(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-medium text-xs transition-colors cursor-pointer"
                title="Ripristina la configurazione tipica con 6 stand e turni predefiniti"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Predefiniti (6 Stand)</span>
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sincronizzaConEvento}
              onChange={(e) => setSincronizzaConEvento(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-medium">
              Sincronizza automaticamente voci Food, Incassi e Soci Volontari dell'evento
            </span>
          </label>
        </div>

        {avvisoMinimo && (
          <div className="mx-5 sm:mx-6 mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center justify-between">
            <span>È necessario mantenere configurato almeno uno stand per l'evento.</span>
            <button type="button" onClick={() => setAvvisoMinimo(false)} className="text-amber-700 hover:text-amber-900 font-bold">×</button>
          </div>
        )}

        {/* CONTENUTO SCHEDA 1: ANAGRAFICA STAND & BILANCIO */}
        {activeTab === 'bilancio' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="space-y-3">
              {stands.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                  <Store className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Nessuno stand ancora configurato per questo evento
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Clicca su <strong>"+ Aggiungi Stand"</strong> per inserire da zero gli stand numerati, le voci di spesa/incasso e le assegnazioni dei turni volontari.
                  </p>
                  <button
                    type="button"
                    onClick={handleAggiungiStand}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Primo Stand (#1)</span>
                  </button>
                </div>
              ) : stands.map((stand, index) => {
                const spPrev = Number(stand.spesaPreventivo) || 0;
                const spCons = Number(stand.spesaConsuntivo) || 0;
                const diffSp = spCons - spPrev;
                const isRisparmioSpesa = diffSp <= 0;

                const incPrev = Number(stand.incassoPrevisto) || 0;
                const incCons = Number(stand.incassoConsuntivo) || 0;
                const diffInc = incCons - incPrev;
                const isExtraIncasso = diffInc >= 0;

                const margineStand = incCons - spCons;
                const turniStand = stand.turniAssegnazioni || [];
                const richiesti = Number(stand.volontariRichiesti) || 3;

                return (
                  <div
                    key={stand.id || index}
                    className="bg-white rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all p-3.5 space-y-3"
                  >
                    {/* Riga Superiore: Numero, Nome, Tipologia, Riferimento Food e Azioni */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        
                        {/* Numero Stand Editabile */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase px-1">
                            N°
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={stand.numero}
                            onChange={(e) => handleAggiornaStand(index, 'numero', Math.max(1, Number(e.target.value)))}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-xs text-center text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                            title="Numero dello stand"
                          />
                        </div>

                        {/* Nome Stand Editabile */}
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={stand.nome}
                            onChange={(e) => handleAggiornaStand(index, 'nome', e.target.value)}
                            placeholder="Denominazione stand (es. Cucina, Griglia...)"
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        {/* Tipologia Stand */}
                        <div className="min-w-[170px]">
                          <select
                            value={stand.tipologia}
                            onChange={(e) => handleAggiornaStand(index, 'tipologia', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                          >
                            {TIPOLOGIE_STAND_PREDEFINITE.map(tip => (
                              <option key={tip} value={tip}>{tip}</option>
                            ))}
                          </select>
                        </div>

                        {/* Toggle Riferimento Food */}
                        <button
                          type="button"
                          onClick={() => handleAggiornaStand(index, 'riferimentoFood', !stand.riferimentoFood)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                            stand.riferimentoFood
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Utensils className={`w-3 h-3 ${stand.riferimentoFood ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span>{stand.riferimentoFood ? 'Rif. Food & Beverage' : 'Servizi / No-Food'}</span>
                        </button>

                      </div>

                      <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                        {/* Pulsante rapido Turni dello Stand */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('turni');
                            setFiltroStandId(stand.id);
                            setStandConFormAperto(index);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            turniStand.length >= richiesti
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Gestisci i turni e le assegnazioni dei volontari per questo stand"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Turni: {turniStand.length}/{richiesti}</span>
                        </button>

                        {/* Responsabile Stand */}
                        <input
                          type="text"
                          value={stand.responsabile || ''}
                          onChange={(e) => handleAggiornaStand(index, 'responsabile', e.target.value)}
                          placeholder="Referente stand..."
                          className="w-36 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                        />

                        {/* Elimina Stand */}
                        <button
                          type="button"
                          onClick={() => handleRimuoviStand(index)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Elimina questo stand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Griglia Cifre Economiche */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                      
                      {/* Blocco 1: SPESE STAND */}
                      <div className="space-y-1 bg-white p-2 rounded-md border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Spese Stand</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isRisparmioSpesa ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {diffSp <= 0 ? `Diff: ${diffSp} € (Risparmio)` : `Diff: +${diffSp} € (Extra)`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-500">Preventivo (€)</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.spesaPreventivo ?? ''}
                              onChange={(e) => handleAggiornaStand(index, 'spesaPreventivo', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">Consuntivo (€)</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.spesaConsuntivo ?? ''}
                              onChange={(e) => handleAggiornaStand(index, 'spesaConsuntivo', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Blocco 2: INCASSI STAND */}
                      <div className="space-y-1 bg-white p-2 rounded-md border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Incassi Stand</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isExtraIncasso ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {diffInc >= 0 ? `Diff: +${diffInc} €` : `Diff: ${diffInc} €`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-500">Preventivo (€)</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.incassoPrevisto ?? ''}
                              onChange={(e) => handleAggiornaStand(index, 'incassoPrevisto', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500">Consuntivo (€)</label>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.incassoConsuntivo ?? ''}
                              onChange={(e) => handleAggiornaStand(index, 'incassoConsuntivo', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Blocco 3: MARGINE NETTO STAND */}
                      <div className="space-y-1 bg-white p-2 rounded-md border border-slate-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Margine Netto Stand</span>
                          <span className="text-[10px] text-slate-400">Consuntivo</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs text-slate-500">Incassi - Spese:</span>
                          <span className={`text-base font-black font-mono ${
                            margineStand >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {margineStand >= 0 ? `+${margineStand.toLocaleString('it-IT')}` : margineStand.toLocaleString('it-IT')} €
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono text-right">
                          Previsto: {(incPrev - spPrev) >= 0 ? `+${incPrev - spPrev}` : incPrev - spPrev} €
                        </div>
                      </div>

                    </div>

                    {/* Riepilogo sintetico Turni dello Stand + Descrizione */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Orario: {stand.orarioAperturaStand || '18:30 - 23:30'}
                        </span>
                        {turniStand.slice(0, 4).map(t => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                          >
                            <span className="font-bold text-slate-900">{t.nomeVolontario || t.nominativo || 'Volontario'}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-indigo-700">{(t.mansione || 'Operatore').split(' / ')[0]}</span>
                          </span>
                        ))}
                        {turniStand.length > 4 && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            +{turniStand.length - 4} altri
                          </span>
                        )}
                      </div>
                      <div className="flex-1 max-w-md">
                        <input
                          type="text"
                          value={stand.descrizione || ''}
                          onChange={(e) => handleAggiornaStand(index, 'descrizione', e.target.value)}
                          placeholder="Note allestimento, attrezzature, menù o prescrizioni HACCP..."
                          className="w-full px-2.5 py-1 bg-slate-50/60 border border-slate-200 rounded text-[11px] text-slate-600 italic focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* CONTENUTO SCHEDA 2: TURNI & ASSEGNAZIONI VOLONTARI PER OGNI STAND */
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
            
            {/* Barra Filtri Rapidi per Stand e Fascia Oraria */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Quadro Turni, Mansioni e Assegnazioni per Singolo Stand
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Assegna i soci volontari o collaboratori a ciascuno stand specificando ruolo, fascia oraria e stato di conferma.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filtroStandId}
                  onChange={(e) => setFiltroStandId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white outline-none"
                >
                  <option value="tutti">Tutti gli Stand ({stands.length})</option>
                  {stands.map(s => (
                    <option key={s.id} value={s.id}>
                      Stand #{s.numero} - {s.nome} ({(s.turniAssegnazioni || []).length}/{s.volontariRichiesti || 3})
                    </option>
                  ))}
                </select>

                <select
                  value={filtroFascia}
                  onChange={(e) => setFiltroFascia(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white outline-none"
                >
                  <option value="tutte">Tutte le Fasce Orarie</option>
                  {FASCE_ORARIE_TURNO.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Elenco Stand con Gestione Turni e Assegnazioni */}
            <div className="space-y-4">
              {stands.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-indigo-200 text-center space-y-3">
                  <CalendarClock className="w-8 h-8 text-indigo-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Nessuno stand disponibile per l'assegnazione turni
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Prima di assegnare i volontari e gli orari dei turni, aggiungi almeno uno stand all'evento.
                  </p>
                  <button
                    type="button"
                    onClick={handleAggiungiStand}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Primo Stand (#1)</span>
                  </button>
                </div>
              ) : stands.map((stand, standIndex) => {
                if (filtroStandId !== 'tutti' && stand.id !== filtroStandId) return null;

                const turniStand = (stand.turniAssegnazioni || []).filter(t =>
                  filtroFascia === 'tutte' ? true : t.fasciaOraria === filtroFascia
                );
                const totAssegnatiStand = (stand.turniAssegnazioni || []).length;
                const richiestiStand = Number(stand.volontariRichiesti) || 3;
                const coperturaCompleta = totAssegnatiStand >= richiestiStand;
                const isFormOpen = standConFormAperto === standIndex;

                return (
                  <div
                    key={stand.id || standIndex}
                    className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden"
                  >
                    {/* Header Stand con impostazione Capostand, Orario Apertura e Fabbisogno Volontari */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-xs">
                          STAND #{stand.numero}
                        </span>
                        <h5 className="text-sm font-bold text-white">
                          {stand.nome}
                        </h5>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-200 border border-white/15">
                          {stand.tipologia}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          coperturaCompleta
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        }`}>
                          {coperturaCompleta ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                          )}
                          <span>Copertura: {totAssegnatiStand} / {richiestiStand} volontari</span>
                        </span>
                      </div>

                      {/* Parametri Operativi Stand: Referente, Orario Stand, N° Volontari Richiesti */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/15">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[10px] text-slate-300">Capo Stand:</span>
                          <input
                            type="text"
                            value={stand.responsabile || ''}
                            onChange={(e) => handleAggiornaStand(standIndex, 'responsabile', e.target.value)}
                            placeholder="Nome referente..."
                            className="bg-transparent text-white font-bold text-xs w-32 focus:outline-none border-b border-transparent focus:border-amber-400"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/15">
                          <Clock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                          <span className="text-[10px] text-slate-300">Orario:</span>
                          <input
                            type="text"
                            value={stand.orarioAperturaStand || ''}
                            onChange={(e) => handleAggiornaStand(standIndex, 'orarioAperturaStand', e.target.value)}
                            placeholder="es. 18:30 - 23:30"
                            className="bg-transparent text-white font-mono font-bold text-xs w-28 focus:outline-none border-b border-transparent focus:border-indigo-400"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/15">
                          <Users className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                          <span className="text-[10px] text-slate-300">Richiesti:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={stand.volontariRichiesti ?? 3}
                            onChange={(e) => handleAggiornaStand(standIndex, 'volontariRichiesti', Math.max(1, Number(e.target.value)))}
                            className="bg-transparent text-white font-mono font-black text-xs w-10 text-center focus:outline-none border-b border-transparent focus:border-emerald-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setStandConFormAperto(isFormOpen ? null : standIndex)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isFormOpen
                              ? 'bg-indigo-500 text-white'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isFormOpen ? 'Chiudi Inserimento' : '+ Assegna Turno'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Pannello Inserimento Nuovo Turno / Assegnazione per questo Stand */}
                    {isFormOpen && (
                      <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4 text-indigo-600" />
                            <span>Assegna Volontario / Turno a Stand #{stand.numero} ({stand.nome})</span>
                          </span>
                          <span className="text-[11px] text-indigo-700">
                            Seleziona dall'Albo Soci oppure digita il nome di un volontario esterno
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                          {/* Selezione Socio da Albo */}
                          <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              1. Seleziona da Albo Soci
                            </label>
                            <select
                              value={nuovoSocioId}
                              onChange={(e) => handleSelezionaSocioPerTurno(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">-- Scegli socio iscritto o inserisci a mano --</option>
                              {sociAttivi.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.cognome} {s.nome} (Tessera N° {s.numeroTessera})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Nominativo (auto-compilato o manuale) */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              Nominativo Volontario *
                            </label>
                            <input
                              type="text"
                              value={nuovoNomeEsterno}
                              onChange={(e) => setNuovoNomeEsterno(e.target.value)}
                              placeholder="Nome e Cognome..."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          {/* Mansione nello Stand */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              Mansione / Ruolo Stand
                            </label>
                            <select
                              value={nuovaMansione}
                              onChange={(e) => setNuovaMansione(e.target.value as MansioneStand)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              {MANSIONI_STAND.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>

                          {/* Fascia Oraria Turno */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              Fascia Oraria Turno
                            </label>
                            <select
                              value={nuovaFascia}
                              onChange={(e) => {
                                const f = e.target.value as FasciaOrariaTurno;
                                setNuovaFascia(f);
                                if (f.includes('08:00')) setNuovoOrarioSpec('08:00 - 12:30');
                                else if (f.includes('11:30')) setNuovoOrarioSpec('11:30 - 15:30');
                                else if (f.includes('15:00')) setNuovoOrarioSpec('15:00 - 19:00');
                                else if (f.includes('18:30')) setNuovoOrarioSpec('18:30 - 23:30');
                              }}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              {FASCE_ORARIE_TURNO.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>

                          {/* Orario Specifico & Telefono */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              Orario Esatto / Recapito
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={nuovoOrarioSpec}
                                onChange={(e) => setNuovoOrarioSpec(e.target.value)}
                                placeholder="18:30-23:30"
                                className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 outline-none"
                              />
                              <input
                                type="text"
                                value={nuovoTelefono}
                                onChange={(e) => setNuovoTelefono(e.target.value)}
                                placeholder="Cellulare..."
                                className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <input
                            type="text"
                            value={nuovaNotaTurno}
                            onChange={(e) => setNuovaNotaTurno(e.target.value)}
                            placeholder="Note operative per il turno (es. attestato HACCP, cambio turno alle 21:00, dotazione grembiule)..."
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAggiungiTurnoAStand(standIndex)}
                            disabled={!nuovoSocioId && !nuovoNomeEsterno.trim()}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Conferma e Aggiungi a Stand #{stand.numero}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tabella Turni e Assegnazioni dello Stand */}
                    <div className="p-3.5">
                      {turniStand.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          <Users className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-slate-600">
                            Nessun volontario assegnato a questo stand{filtroFascia !== 'tutte' ? ` nella fascia "${filtroFascia}"` : ''}.
                          </p>
                          <button
                            type="button"
                            onClick={() => setStandConFormAperto(standIndex)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Assegna il primo volontario allo Stand #{stand.numero}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 bg-slate-50/80">
                                <th className="py-2 px-2.5">Volontario / Socio</th>
                                <th className="py-2 px-2.5">Mansione nello Stand</th>
                                <th className="py-2 px-2.5">Fascia Oraria Turno</th>
                                <th className="py-2 px-2.5">Orario Specifico</th>
                                <th className="py-2 px-2.5">Note / Dotazioni</th>
                                <th className="py-2 px-2.5 text-center">Stato</th>
                                <th className="py-2 px-2.5 text-right">Azioni</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {turniStand.map((turno) => {
                                const nomeVol = turno.nomeVolontario || turno.nominativo || 'Volontario';
                                return (
                                <tr key={turno.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Nominativo e Tessera */}
                                  <td className="py-2 px-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                        {nomeVol.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                          <span>{nomeVol}</span>
                                          {turno.numeroTessera && (
                                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                              Tess. #{turno.numeroTessera}
                                            </span>
                                          )}
                                        </div>
                                        {turno.telefono && (
                                          <div className="text-[10.5px] text-slate-500 flex items-center gap-1">
                                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                                            <span>{turno.telefono}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Mansione editabile inline */}
                                  <td className="py-2 px-2.5">
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                      <select
                                        value={turno.mansione}
                                        onChange={(e) => handleAggiornaCampoTurno(standIndex, turno.id, 'mansione', e.target.value)}
                                        className="bg-transparent font-semibold text-slate-800 text-xs focus:bg-white focus:border focus:border-indigo-300 rounded px-1 py-0.5 outline-none cursor-pointer"
                                      >
                                        {MANSIONI_STAND.map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </td>

                                  {/* Fascia Oraria editabile inline */}
                                  <td className="py-2 px-2.5">
                                    <select
                                      value={turno.fasciaOraria}
                                      onChange={(e) => handleAggiornaCampoTurno(standIndex, turno.id, 'fasciaOraria', e.target.value)}
                                      className="bg-indigo-50/70 text-indigo-900 border border-indigo-200/80 font-semibold text-[11px] rounded-md px-2 py-0.5 outline-none cursor-pointer"
                                    >
                                      {FASCE_ORARIE_TURNO.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Orario Specifico */}
                                  <td className="py-2 px-2.5">
                                    <input
                                      type="text"
                                      value={turno.orarioSpecifico || ''}
                                      onChange={(e) => handleAggiornaCampoTurno(standIndex, turno.id, 'orarioSpecifico', e.target.value)}
                                      placeholder="es. 18:30 - 23:30"
                                      className="w-28 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800 focus:bg-white outline-none"
                                    />
                                  </td>

                                  {/* Note */}
                                  <td className="py-2 px-2.5">
                                    <input
                                      type="text"
                                      value={turno.note || ''}
                                      onChange={(e) => handleAggiornaCampoTurno(standIndex, turno.id, 'note', e.target.value)}
                                      placeholder="Aggiungi nota..."
                                      className="w-full min-w-[140px] px-2 py-0.5 bg-slate-50/70 border border-slate-200 rounded text-[11px] text-slate-600 focus:bg-white outline-none"
                                    />
                                  </td>

                                  {/* Stato Conferma */}
                                  <td className="py-2 px-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleConfermaTurno(standIndex, turno.id)}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                        turno.confermato
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                      }`}
                                      title="Clicca per cambiare lo stato di conferma disponibilità del volontario"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{turno.confermato ? 'Confermato' : 'In attesa'}</span>
                                    </button>
                                  </td>

                                  {/* Rimozione */}
                                  <td className="py-2 px-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRimuoviTurnoDaStand(standIndex, turno.id)}
                                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                      title="Rimuovi assegnazione turno"
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
              })}
            </div>
          </div>
        )}

        {/* Footer Barra Pulsanti */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/95 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 hidden sm:flex items-center gap-3">
            <span><strong>{stands.length}</strong> stand configurati</span>
            <span>•</span>
            <span><strong>{totali.totTurniAssegnati}</strong> turni volontari assegnati ({totali.totTurniConfermati} confermati)</span>
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSalva}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salva Stand, Bilancio & Turni</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
