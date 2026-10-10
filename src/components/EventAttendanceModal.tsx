import React, { useState, useMemo } from 'react';
import { ProLocoEvento, Socio, IscrizioneEvento, RuoloPartecipazioneEvento, StatoPresenzaEvento, ProLocoInfo } from '../types';
import { 
  X, 
  Users, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  Printer, 
  FileSpreadsheet, 
  AlertCircle, 
  Check, 
  Trash2, 
  UserCheck, 
  ShieldCheck, 
  HeartHandshake, 
  Tag, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  Info,
  ChevronRight
} from 'lucide-react';
import { esportaPresenzeCSV } from '../storage';

interface EventAttendanceModalProps {
  evento: ProLocoEvento;
  soci: Socio[];
  config: ProLocoInfo;
  onAggiornaEvento: (eventoAggiornato: ProLocoEvento) => void;
  onApriStampaPresenze: (evento: ProLocoEvento) => void;
  onClose: () => void;
}

export const EventAttendanceModal: React.FC<EventAttendanceModalProps> = ({
  evento,
  soci,
  config,
  onAggiornaEvento,
  onApriStampaPresenze,
  onClose
}) => {
  const [filtroStato, setFiltroStato] = useState<'tutti' | StatoPresenzaEvento>('tutti');
  const [ricerca, setRicerca] = useState('');
  const [modalNuovaIscrizioneAperta, setModalNuovaIscrizioneAperta] = useState(false);
  
  // Campi per la nuova iscrizione di un socio
  const [socioSelezionatoId, setSocioSelezionatoId] = useState<string>('');
  const [ruoloNuovo, setRuoloNuovo] = useState<RuoloPartecipazioneEvento>('partecipante');
  const [numeroAccompagnatori, setNumeroAccompagnatori] = useState<number>(0);
  const [noteIscrizione, setNoteIscrizione] = useState<string>('');
  const [quotaVersata, setQuotaVersata] = useState<number>(evento.quotaIscrizioneSocio || 0);
  const [checkInImmediato, setCheckInImmediato] = useState<boolean>(false);
  const [ricercaSocioAlbo, setRicercaSocioAlbo] = useState<string>('');

  const sociMap = useMemo(() => {
    const map = new Map<string, Socio>();
    soci.forEach(s => map.set(s.id, s));
    return map;
  }, [soci]);

  const iscrizioni = evento.iscrizioni || [];

  // Statistiche e metriche
  const presenti = useMemo(() => iscrizioni.filter(i => i.statoPresenza === 'presente'), [iscrizioni]);
  const assenti = useMemo(() => iscrizioni.filter(i => i.statoPresenza === 'assente'), [iscrizioni]);
  const daVerificare = useMemo(() => iscrizioni.filter(i => i.statoPresenza === 'da_verificare' || !i.statoPresenza), [iscrizioni]);
  const giustificati = useMemo(() => iscrizioni.filter(i => i.statoPresenza === 'giustificato'), [iscrizioni]);
  const totaleAccompagnatori = useMemo(() => iscrizioni.reduce((sum, i) => sum + (i.numeroAccompagnatori || 0), 0), [iscrizioni]);
  const tassoAffluenza = iscrizioni.length > 0 ? Math.round((presenti.length / iscrizioni.length) * 100) : 0;
  const postiDisponibili = evento.postiMassimi ? Math.max(0, evento.postiMassimi - iscrizioni.length) : null;

  // Iscrizioni filtrate
  const iscrizioniFiltrate = useMemo(() => {
    return iscrizioni.filter(iscr => {
      if (filtroStato !== 'tutti') {
        const stato = iscr.statoPresenza || 'da_verificare';
        if (stato !== filtroStato) return false;
      }
      if (ricerca.trim()) {
        const q = ricerca.toLowerCase().trim();
        const s = sociMap.get(iscr.socioId);
        const matchNome = s ? `${s.nome} ${s.cognome}`.toLowerCase().includes(q) : false;
        const matchTessera = s?.numeroTessera?.toLowerCase().includes(q) || false;
        const matchRuolo = iscr.ruolo?.toLowerCase().includes(q) || false;
        const matchNote = iscr.note?.toLowerCase().includes(q) || false;
        if (!matchNome && !matchTessera && !matchRuolo && !matchNote) return false;
      }
      return true;
    });
  }, [iscrizioni, filtroStato, ricerca, sociMap]);

  // Soci non ancora iscritti a questo evento (per la selezione di iscrizione)
  const sociDisponibiliPerIscrizione = useMemo(() => {
    const idsGiaIscritti = new Set(iscrizioni.map(i => i.socioId));
    return soci.filter(s => {
      if (idsGiaIscritti.has(s.id)) return false;
      if (ricercaSocioAlbo.trim()) {
        const q = ricercaSocioAlbo.toLowerCase().trim();
        const nomeCompleto = `${s.cognome} ${s.nome}`.toLowerCase();
        const tessera = (s.numeroTessera || '').toLowerCase();
        const cf = (s.codiceFiscale || '').toLowerCase();
        return nomeCompleto.includes(q) || tessera.includes(q) || cf.includes(q);
      }
      return true;
    });
  }, [soci, iscrizioni, ricercaSocioAlbo]);

  // Handler cambio stato presenza singolo socio
  const handleCambiaStatoPresenza = (iscrizioneId: string, nuovoStato: StatoPresenzaEvento) => {
    const oraAttuale = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Amministratore'} / Presenze`;

    const nuoveIscrizioni = iscrizioni.map(iscr => {
      if (iscr.id === iscrizioneId) {
        return {
          ...iscr,
          statoPresenza: nuovoStato,
          orarioCheckIn: nuovoStato === 'presente' ? (iscr.orarioCheckIn || oraAttuale) : (nuovoStato === 'da_verificare' ? undefined : iscr.orarioCheckIn),
          checkInRegistratoDa: nuovoStato === 'presente' ? operatore : iscr.checkInRegistratoDa
        };
      }
      return iscr;
    });

    const eventoAggiornato: ProLocoEvento = {
      ...evento,
      iscrizioni: nuoveIscrizioni
    };

    onAggiornaEvento(eventoAggiornato);
  };

  // Handler per appello rapido: segna tutti presenti
  const handleSegnaTuttiPresenti = () => {
    if (!confirm('Vuoi convalidare il check-in come "Presente" per tutti gli iscritti dell\'evento?')) return;
    const oraAttuale = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Amministratore'} / Appello`;

    const nuoveIscrizioni = iscrizioni.map(iscr => ({
      ...iscr,
      statoPresenza: 'presente' as const,
      orarioCheckIn: iscr.orarioCheckIn || oraAttuale,
      checkInRegistratoDa: iscr.checkInRegistratoDa || operatore
    }));

    onAggiornaEvento({
      ...evento,
      iscrizioni: nuoveIscrizioni
    });
  };

  // Handler per azzerare i check-in
  const handleAzzeraTuttiCheckIn = () => {
    if (!confirm('Vuoi azzerare lo stato di presenza di tutti gli iscritti (riporta a "Da Verificare")?')) return;
    const nuoveIscrizioni = iscrizioni.map(iscr => ({
      ...iscr,
      statoPresenza: 'da_verificare' as const,
      orarioCheckIn: undefined
    }));

    onAggiornaEvento({
      ...evento,
      iscrizioni: nuoveIscrizioni
    });
  };

  // Toggle apertura/chiusura iscrizioni
  const handleToggleIscrizioniAperte = () => {
    const statoNuovo = !(evento.iscrizioniAperte ?? true);
    onAggiornaEvento({
      ...evento,
      iscrizioniAperte: statoNuovo
    });
  };

  // Handler salvataggio nuova iscrizione socio
  const handleAggiungiIscrizione = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socioSelezionatoId) return;

    const dataOggi = new Date().toISOString().split('T')[0];
    const oraOggi = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Amministratore'} / Iscrizione`;

    const nuovaIscrizione: IscrizioneEvento = {
      id: `iscr-${evento.id}-${socioSelezionatoId}-${Date.now().toString().slice(-4)}`,
      socioId: socioSelezionatoId,
      dataIscrizione: dataOggi,
      oraIscrizione: oraOggi,
      ruolo: ruoloNuovo,
      statoPresenza: checkInImmediato ? 'presente' : 'da_verificare',
      orarioCheckIn: checkInImmediato ? oraOggi : undefined,
      checkInRegistratoDa: checkInImmediato ? operatore : undefined,
      note: noteIscrizione.trim() || undefined,
      numeroAccompagnatori: numeroAccompagnatori > 0 ? numeroAccompagnatori : undefined,
      quotaVersata: quotaVersata > 0 ? quotaVersata : undefined
    };

    const nuoveIscrizioni = [nuovaIscrizione, ...iscrizioni];

    onAggiornaEvento({
      ...evento,
      iscrizioni: nuoveIscrizioni
    });

    // Reset modulo
    setSocioSelezionatoId('');
    setNoteIscrizione('');
    setNumeroAccompagnatori(0);
    setCheckInImmediato(false);
    setModalNuovaIscrizioneAperta(false);
  };

  // Handler rimozione iscrizione
  const handleRimuoviIscrizione = (iscrizioneId: string, nomeSocio: string) => {
    if (!confirm(`Confermi la cancellazione dell'iscrizione per il socio "${nomeSocio}"?`)) return;
    const nuoveIscrizioni = iscrizioni.filter(i => i.id !== iscrizioneId);
    onAggiornaEvento({
      ...evento,
      iscrizioni: nuoveIscrizioni
    });
  };

  // Esportazione CSV Presenze
  const handleExportCSV = () => {
    esportaPresenzeCSV(evento, soci);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-hidden">
      
      {/* Contenitore Modale Principale */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[94vh] flex flex-col relative overflow-hidden">
        
        {/* HEADER MODALE */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Gestione Iscrizioni & Tracciamento Presenze
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  (evento.iscrizioniAperte ?? true) 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {(evento.iscrizioniAperte ?? true) ? '● Iscrizioni Aperte' : '○ Iscrizioni Chiuse'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-800">{evento.titolo}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  {evento.dataInizio}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  {evento.luogo}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleIscrizioniAperte}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                (evento.iscrizioniAperte ?? true)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Apri o blocca le iscrizioni per i soci"
            >
              {(evento.iscrizioniAperte ?? true) ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
              <span>{(evento.iscrizioniAperte ?? true) ? 'Iscrizioni Aperte' : 'Iscrizioni Bloccate'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Chiudi pannello"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO PRINCIPALE SCORREVOLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
          
          {/* CRUSCOTTO KPI PRESENZE */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            
            {/* Totale Iscritti */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Soci Iscritti
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">{iscrizioni.length}</span>
                {evento.postiMassimi && (
                  <span className="text-xs text-slate-400 font-mono">/ {evento.postiMassimi} max</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {totaleAccompagnatori > 0 ? `+${totaleAccompagnatori} accompagnatori` : 'Nessun ospite extra'}
              </span>
            </div>

            {/* Presenti Convalidati */}
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider block">
                Presenti Check-in
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">{presenti.length}</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">({tassoAffluenza}%)</span>
              </div>
              <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${tassoAffluenza}%` }}
                ></div>
              </div>
            </div>

            {/* Da Verificare / In Attesa */}
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wider block">
                In Attesa Check-in
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-700 font-mono">{daVerificare.length}</span>
              </div>
              <span className="text-[11px] text-amber-600 mt-1 block">
                Da accogliere all'ingresso
              </span>
            </div>

            {/* Assenti Segnati */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10.5px] font-bold text-rose-700 uppercase tracking-wider block">
                Assenti
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-rose-700 font-mono">{assenti.length}</span>
                {giustificati.length > 0 && (
                  <span className="text-[11px] text-sky-700 font-medium">({giustificati.length} giust.)</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Non presentatisi
              </span>
            </div>

            {/* Capienza / Quota Iscrizione */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Capienza & Quota
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-slate-800 font-mono">
                  {evento.quotaIscrizioneSocio ? `€ ${evento.quotaIscrizioneSocio}` : 'Gratuito'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {postiDisponibili !== null ? `${postiDisponibili} posti residui` : 'Capienza libera'}
              </span>
            </div>

          </div>

          {/* BARRA AZIONI RAPIDE ADMIN */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalNuovaIscrizioneAperta(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Iscrivi Socio all'Evento</span>
              </button>

              <button
                type="button"
                onClick={handleSegnaTuttiPresenti}
                disabled={iscrizioni.length === 0}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Segna tutti gli iscritti come presenti in un colpo solo"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Appello Rapido: Tutti Presenti</span>
              </button>

              <button
                type="button"
                onClick={handleAzzeraTuttiCheckIn}
                disabled={iscrizioni.length === 0}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Azzera stato presenze (ritorna a Da Verificare)"
              >
                <span>Azzera Check-in</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={iscrizioni.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Esporta foglio presenze in CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Esporta CSV</span>
              </button>

              <button
                type="button"
                onClick={() => onApriStampaPresenze(evento)}
                disabled={iscrizioni.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 transition-colors cursor-pointer disabled:opacity-50"
                title="Stampa foglio firme presenze ufficiale A4"
              >
                <Printer className="w-4 h-4 text-teal-700" />
                <span>Stampa Foglio Firme A4</span>
              </button>
            </div>

          </div>

          {/* FILTRI DI CONSULTAZIONE & RICERCA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            
            {/* Pillole filtro stato presenza */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setFiltroStato('tutti')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  filtroStato === 'tutti'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tutti gli Iscritti ({iscrizioni.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStato('presente')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer border ${
                  filtroStato === 'presente'
                    ? 'bg-emerald-800 text-white border-emerald-900'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Presenti ({presenti.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroStato('da_verificare')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer border ${
                  filtroStato === 'da_verificare'
                    ? 'bg-amber-800 text-white border-amber-900'
                    : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Da Verificare ({daVerificare.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroStato('assente')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer border ${
                  filtroStato === 'assente'
                    ? 'bg-rose-800 text-white border-rose-900'
                    : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Assenti ({assenti.length})</span>
              </button>
            </div>

            {/* Campo di ricerca rapida */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca socio per nome, cognome, tessera..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

          </div>

          {/* TABELLA REGISTRO ISCRITTI & CHECK-IN RAPIDO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {iscrizioniFiltrate.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">Nessuna iscrizione trovata</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {iscrizioni.length === 0 
                    ? 'Non risultano soci ancora registrati a questa iniziativa. Clicca su "+ Iscrivi Socio all\'Evento" per inserire le adesioni.'
                    : 'Nessun iscritto corrisponde ai filtri di ricerca impostati.'}
                </p>
                {iscrizioni.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setModalNuovaIscrizioneAperta(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Iscrivi il Primo Socio</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Socio & Tessera</th>
                      <th className="py-3 px-3">Ruolo</th>
                      <th className="py-3 px-3">Data Iscrizione</th>
                      <th className="py-3 px-3">Accompagnatori / Note</th>
                      <th className="py-3 px-4 text-center">Stato Presenza & Check-in</th>
                      <th className="py-3 px-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {iscrizioniFiltrate.map((iscr) => {
                      const socio = sociMap.get(iscr.socioId);
                      const nomeCompleto = socio ? `${socio.cognome} ${socio.nome}` : 'Socio Sconosciuto';
                      const isPresente = iscr.statoPresenza === 'presente';
                      const isAssente = iscr.statoPresenza === 'assente';
                      const isGiustificato = iscr.statoPresenza === 'giustificato';

                      return (
                        <tr 
                          key={iscr.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isPresente ? 'bg-emerald-50/20' : isAssente ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Colonna Socio */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {socio?.foto ? (
                                <img 
                                  src={socio.foto} 
                                  alt={nomeCompleto} 
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200">
                                  {socio ? `${socio.nome[0]}${socio.cognome[0]}` : '??'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 leading-tight">
                                  {nomeCompleto}
                                </div>
                                <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                  <span>Tessera: {socio?.numeroTessera || 'N.D.'}</span>
                                  {socio?.categoria && (
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-sans font-medium">
                                      {socio.categoria}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Colonna Ruolo */}
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              iscr.ruolo === 'volontario' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              iscr.ruolo === 'staff' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              iscr.ruolo === 'relatore_ospite' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {iscr.ruolo === 'volontario' ? 'Volontario' :
                               iscr.ruolo === 'staff' ? 'Staff' :
                               iscr.ruolo === 'relatore_ospite' ? 'Relatore' : 'Partecipante'}
                            </span>
                          </td>

                          {/* Data Iscrizione */}
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                            <div>{iscr.dataIscrizione}</div>
                            {iscr.oraIscrizione && <span className="text-[10px] text-slate-400">ore {iscr.oraIscrizione}</span>}
                          </td>

                          {/* Accompagnatori / Note */}
                          <td className="py-3 px-3 text-slate-700">
                            {iscr.numeroAccompagnatori ? (
                              <span className="font-semibold text-emerald-800 block text-[11px]">
                                +{iscr.numeroAccompagnatori} accompagnatori
                              </span>
                            ) : null}
                            {iscr.note ? (
                              <p className="text-[10.5px] text-slate-500 italic max-w-xs truncate" title={iscr.note}>
                                "{iscr.note}"
                              </p>
                            ) : (!iscr.numeroAccompagnatori && (
                              <span className="text-slate-400 text-[11px]">-</span>
                            ))}
                          </td>

                          {/* Check-in Rapido (Pulsanti interattivi per l'amministratore) */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* Pulsante Presente */}
                              <button
                                type="button"
                                onClick={() => handleCambiaStatoPresenza(iscr.id, isPresente ? 'da_verificare' : 'presente')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border ${
                                  isPresente
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={isPresente ? 'Presente convalidato. Clicca per deselezionare' : 'Segna come Presente (Check-in)'}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isPresente ? 'Presente' : 'Check-in'}</span>
                              </button>

                              {/* Pulsante Assente */}
                              <button
                                type="button"
                                onClick={() => handleCambiaStatoPresenza(iscr.id, isAssente ? 'da_verificare' : 'assente')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border ${
                                  isAssente
                                    ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-rose-400 hover:text-rose-700 hover:bg-rose-50'
                                }`}
                                title={isAssente ? 'Segnato come Assente. Clicca per deselezionare' : 'Segna come Assente'}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Assente</span>
                              </button>

                              {/* Badge Ora Check-in se presente */}
                              {iscr.orarioCheckIn && (
                                <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold" title={`Orario Check-in convalidato da ${iscr.checkInRegistratoDa || 'Admin'}`}>
                                  {iscr.orarioCheckIn}
                                </span>
                              )}

                            </div>
                          </td>

                          {/* Azioni Rimozione */}
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRimuoviIscrizione(iscr.id, nomeCompleto)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancella iscrizione del socio"
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

      </div>

      {/* MODALE SECONDARIA: ISCRIZIONE DIRETTA NUOVO SOCIO */}
      {modalNuovaIscrizioneAperta && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Plus className="w-5 h-5" />
                <h4 className="font-black text-slate-900 text-sm">
                  Iscrizione Socio all'Evento: {evento.titolo}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalNuovaIscrizioneAperta(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAggiungiIscrizione} className="space-y-3.5 text-xs">
              
              {/* Selezione Socio dall'Albo */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Seleziona Socio dall'Albo Pro Loco: *
                </label>
                
                {/* Ricerca veloce all'interno dell'elenco soci */}
                <input
                  type="text"
                  placeholder="Filtra soci per cognome, nome o n° tessera..."
                  value={ricercaSocioAlbo}
                  onChange={(e) => setRicercaSocioAlbo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />

                <select
                  required
                  value={socioSelezionatoId}
                  onChange={(e) => setSocioSelezionatoId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- Scegli il socio da iscrivere ({sociDisponibiliPerIscrizione.length} disponibili) --</option>
                  {sociDisponibiliPerIscrizione.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.cognome} {s.nome} (Tessera {s.numeroTessera || 'N.D.'}) - {s.categoria}
                    </option>
                  ))}
                </select>
                {sociDisponibiliPerIscrizione.length === 0 && (
                  <span className="text-[11px] text-amber-700 block">
                    Nessun socio trovato o tutti i soci risultano già iscritti a questa manifestazione.
                  </span>
                )}
              </div>

              {/* Ruolo Partecipazione e Accompagnatori */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Ruolo nell'Evento:</label>
                  <select
                    value={ruoloNuovo}
                    onChange={(e) => setRuoloNuovo(e.target.value as RuoloPartecipazioneEvento)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="partecipante">Partecipante Ordinario</option>
                    <option value="volontario">Volontario Operativo</option>
                    <option value="staff">Staff / Assistenza</option>
                    <option value="relatore_ospite">Relatore / Ospite d'Onore</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Accompagnatori Extra:</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={numeroAccompagnatori}
                    onChange={(e) => setNumeroAccompagnatori(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Eventuale Quota Iscrizione Versata */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Quota / Contributo Versato (€):</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={quotaVersata}
                  onChange={(e) => setQuotaVersata(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                  placeholder="0.00"
                />
              </div>

              {/* Note e Richieste Particolari */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Note, Intolleranze o Richieste:</label>
                <textarea
                  rows={2}
                  value={noteIscrizione}
                  onChange={(e) => setNoteIscrizione(e.target.value)}
                  placeholder="Es. Menu vegetariano, allergia glutine, disponibilità allestimento gazebo..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                ></textarea>
              </div>

              {/* Check-in immediato */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkInImmediato}
                  onChange={(e) => setCheckInImmediato(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span className="font-bold text-xs text-emerald-950">
                  Convalida Presenza Immediata (Check-in sul posto adesso)
                </span>
              </label>

              {/* Pulsanti Azione Modale */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuovaIscrizioneAperta(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!socioSelezionatoId}
                  className="px-4 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Conferma Iscrizione Socio
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
