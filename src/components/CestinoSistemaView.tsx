import React, { useState, useMemo } from 'react';
import { ElementoCestino, TipoEntitaCestino, ProLocoInfo } from '../types';
import { 
  Trash2, 
  RotateCcw, 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  HeartHandshake, 
  Users, 
  PartyPopper, 
  Calendar, 
  Clock, 
  Eye, 
  X, 
  FileText, 
  ArrowLeft,
  Building2,
  Receipt,
  Scale,
  Sparkles,
  Ban
} from 'lucide-react';
import { esportaCestinoCSV } from '../storage';

interface CestinoSistemaViewProps {
  elementi: ElementoCestino[];
  config: ProLocoInfo;
  onRipristinaElemento: (elemento: ElementoCestino) => void;
  onEliminaDefinitivo: (id: string) => void;
  onSvuotaCestino: () => void;
  onTornaGestionale?: () => void;
}

export const CestinoSistemaView: React.FC<CestinoSistemaViewProps> = ({
  elementi,
  config,
  onRipristinaElemento,
  onEliminaDefinitivo,
  onSvuotaCestino,
  onTornaGestionale
}) => {
  const [filtroTipo, setFiltroTipo] = useState<TipoEntitaCestino | 'tutti'>('tutti');
  const [ricerca, setRicerca] = useState('');
  const [elementoDettaglio, setElementoDettaglio] = useState<ElementoCestino | null>(null);
  const [elementoDaEliminare, setElementoDaEliminare] = useState<ElementoCestino | null>(null);
  const [mostraConfermaSvuota, setMostraConfermaSvuota] = useState(false);
  const [elementoInRipristino, setElementoInRipristino] = useState<ElementoCestino | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'info'; testo: string } | null>(null);

  const mostraNotifica = (testo: string, tipo: 'success' | 'info' = 'success') => {
    setFeedback({ tipo, testo });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Elementi filtrati
  const elementiFiltrati = useMemo(() => {
    return elementi.filter(item => {
      if (filtroTipo !== 'tutti' && item.tipoEntita !== filtroTipo) return false;
      if (ricerca.trim()) {
        const q = ricerca.toLowerCase().trim();
        const matchTitolo = item.titolo.toLowerCase().includes(q);
        const matchSottotitolo = (item.sottotitolo || '').toLowerCase().includes(q);
        const matchMotivo = item.motivo.toLowerCase().includes(q);
        const matchData = item.dataEliminazione.includes(q);
        const matchOperatore = (item.eliminatoDa || '').toLowerCase().includes(q);
        if (!matchTitolo && !matchSottotitolo && !matchMotivo && !matchData && !matchOperatore) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // Più recenti in alto
      return (b.dataEliminazione + (b.oraEliminazione || '')).localeCompare(a.dataEliminazione + (a.oraEliminazione || ''));
    });
  }, [elementi, filtroTipo, ricerca]);

  // Conteggi per le schede
  const conteggioDonazioni = useMemo(() => elementi.filter(e => e.tipoEntita === 'donazione').length, [elementi]);
  const conteggioSoci = useMemo(() => elementi.filter(e => e.tipoEntita === 'socio').length, [elementi]);
  const conteggioEventi = useMemo(() => elementi.filter(e => e.tipoEntita === 'evento').length, [elementi]);

  const handleRipristina = (item: ElementoCestino) => {
    onRipristinaElemento(item);
    setElementoInRipristino(null);
    mostraNotifica(`Elemento "${item.titolo}" ripristinato con successo e riattivato nel gestionale.`);
  };

  const handleEliminaDefinitivo = (id: string) => {
    const bersaglio = elementi.find(e => e.id === id);
    onEliminaDefinitivo(id);
    setElementoDaEliminare(null);
    if (elementoDettaglio?.id === id) setElementoDettaglio(null);
    mostraNotifica(`Record "${bersaglio?.titolo || id}" cancellato definitivamente dal registro storico.`, 'info');
  };

  const handleSvuotaTutto = () => {
    onSvuotaCestino();
    setMostraConfermaSvuota(false);
    mostraNotifica('Cestino di sistema svuotato definitivamente.', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Intestazione Modulo Cestino */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-rose-800/40 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-200 border border-rose-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Cestino di Sistema & Audit Log
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/15">
                Punto 1.4: Revoche & Ripensamento Donanti
              </span>
              <span className="text-xs text-rose-200 font-medium">
                {elementi.length} record in archivio storico
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Registro Audit Storico & Cestino delle Eliminazioni
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tutte le entità eliminate nell'applicazione (quietanze per ripensamento donante ex art. 800 c.c., soci ed eventi) confluiscono in questo registro di traccia storica e sono <strong>completamente escluse da ogni calcolo di bilancio, statistica e rendiconto ufficiale</strong>.
            </p>
          </div>

          {/* Azioni Principali Banner */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onTornaGestionale && (
              <button
                type="button"
                onClick={onTornaGestionale}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Torna al Gestionale</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => esportaCestinoCSV(elementi, config)}
              disabled={elementi.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Esporta il registro audit completo in CSV per i Revisori dei Conti"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Esporta Audit (CSV)</span>
            </button>

            {elementi.length > 0 && (
              <button
                type="button"
                onClick={() => setMostraConfermaSvuota(true)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                title="Elimina permanentemente tutti gli elementi dal cestino"
              >
                <Trash2 className="w-4 h-4" />
                <span>Svuota Cestino</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Avviso Istituzionale di Non-Incidenza Fiscale e Contabile */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
        <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-900">
            Garanzia di Isolamento Matematico & Rispetto Normativo Terzo Settore:
          </p>
          <p className="text-amber-800 leading-relaxed font-normal">
            Le donazioni archiviate in questo modulo per <strong>ripensamento del donante (Punto 1.4)</strong> o qualsiasi record revocato non influiscono né sul Rendiconto di Cassa (Modello D RUNTS), né sullo Stato Patrimoniale (Modello C), né sul file per l'Agenzia delle Entrate 730 Precompilato, né sulle attestazioni fiscali. I record fungono esclusivamente da <em>audit trail</em> e registro di prova giuridica.
          </p>
        </div>
      </div>

      {/* Notifica Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in ${
          feedback.tipo === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' 
            : 'bg-blue-50 border-blue-200 text-blue-950 font-bold'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback.testo}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFeedback(null)} 
            className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra di Filtro & Ricerca */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Schede Filtro Tipologia */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFiltroTipo('tutti')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                filtroTipo === 'tutti'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Tutti i Record</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filtroTipo === 'tutti' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {elementi.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('donazione')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                filtroTipo === 'donazione'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>1.4 Ripensamento Donanti</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filtroTipo === 'donazione' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {conteggioDonazioni}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('socio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                filtroTipo === 'socio'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Soci Rimossi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filtroTipo === 'socio' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-900'
              }`}>
                {conteggioSoci}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('evento')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                filtroTipo === 'evento'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                  : 'bg-teal-50/70 text-teal-900 border-teal-200 hover:bg-teal-100'
              }`}
            >
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Eventi Cancellati</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filtroTipo === 'evento' ? 'bg-white/20 text-white' : 'bg-teal-200 text-teal-900'
              }`}>
                {conteggioEventi}
              </span>
            </button>
          </div>

          {/* Campo Ricerca */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca per nominativo, quietanza, motivo..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 font-medium"
            />
            {ricerca && (
              <button
                type="button"
                onClick={() => setRicerca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Tabella Elementi nel Cestino */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Audit Log Archivio ({elementiFiltrati.length} visualizzati su {elementi.length})
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Tutti i dati sottostanti sono <strong className="text-rose-700 font-bold">esclusi dai bilanci attivi</strong>
          </span>
        </div>

        {elementiFiltrati.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Trash2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Cestino vuoto per i filtri selezionati</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Non risultano elementi revocati o cancellati corrispondenti ai criteri attuali. Qualsiasi storno o cancellazione effettuata nell'app comparirà automaticamente qui come audit log storico.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tipologia</th>
                  <th className="py-3 px-4">Oggetto / Intestazione</th>
                  <th className="py-3 px-4">Importo (€) Orig.</th>
                  <th className="py-3 px-4">Data & Ora Revoca</th>
                  <th className="py-3 px-4">Motivo Cancellazione / Ripensamento</th>
                  <th className="py-3 px-4">Operatore</th>
                  <th className="py-3 px-4 text-right">Azioni Ripristino / Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {elementiFiltrati.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Badge Tipologia */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.tipoEntita === 'donazione' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                          1.4 Donazione
                        </span>
                      ) : item.tipoEntita === 'socio' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                          <Users className="w-3.5 h-3.5 text-blue-700" />
                          Socio Albo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-teal-100 text-teal-900 border border-teal-300">
                          <PartyPopper className="w-3.5 h-3.5 text-teal-700" />
                          Evento
                        </span>
                      )}
                    </td>

                    {/* Titolo e Sottotitolo */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.titolo}
                      </div>
                      {item.sottotitolo && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.sottotitolo}
                        </div>
                      )}
                    </td>

                    {/* Importo originale con line-through e avviso */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.importo !== undefined ? (
                        <div>
                          <span className="line-through text-slate-400 font-mono font-bold text-xs">
                            € {item.importo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[9.5px] font-bold text-rose-600 uppercase tracking-tighter">
                            Escluso da Bilancio
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Data e Ora Eliminazione */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-900 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.dataEliminazione}</span>
                      </div>
                      {item.oraEliminazione && (
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.oraEliminazione}</span>
                        </div>
                      )}
                    </td>

                    {/* Motivo Formale */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-xs text-slate-700 line-clamp-2 leading-relaxed" title={item.motivo}>
                        {item.motivo}
                      </div>
                    </td>

                    {/* Operatore */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.eliminatoDa || 'Tesoreria'}
                      </span>
                    </td>

                    {/* Azioni */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Dettagli Audit */}
                        <button
                          type="button"
                          onClick={() => setElementoDettaglio(item)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Visualizza i dati storici completi e il log probatorio"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Audit</span>
                        </button>

                        {/* Ripristina */}
                        <button
                          type="button"
                          onClick={() => setElementoInRipristino(item)}
                          className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Ripristina e riattiva questo elemento nel gestionale"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ripristina</span>
                        </button>

                        {/* Elimina Definitivamente */}
                        <button
                          type="button"
                          onClick={() => setElementoDaEliminare(item)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Elimina definitivamente da questo archivio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODALE 1: DETTAGLIO SCHEDA AUDIT / TRACCIA STORICA        */}
      {/* ======================================================== */}
      {elementoDettaglio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Scheda Audit Record Storico
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Conservazione ex lege • Non influente sul bilancio
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setElementoDettaglio(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Titolo / Denominazione</span>
                <span className="text-sm font-black text-slate-900 block">{elementoDettaglio.titolo}</span>
                {elementoDettaglio.sottotitolo && (
                  <span className="text-xs text-slate-600 block">{elementoDettaglio.sottotitolo}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipologia Entità</span>
                  <span className="font-bold text-slate-800 capitalize">{elementoDettaglio.tipoEntita}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Importo Originario</span>
                  <span className="font-bold font-mono text-slate-800">
                    {elementoDettaglio.importo !== undefined ? `€ ${elementoDettaglio.importo.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Eliminazione / Revoca</span>
                  <span className="font-bold text-slate-800">{elementoDettaglio.dataEliminazione}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ora / Operatore</span>
                  <span className="font-bold text-slate-800">
                    {elementoDettaglio.oraEliminazione || 'N/D'} • {elementoDettaglio.eliminatoDa || 'Tesoreria'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">Motivazione Formale Registrata</span>
                <p className="text-xs text-rose-950 font-semibold leading-relaxed">
                  {elementoDettaglio.motivo}
                </p>
              </div>

              {elementoDettaglio.datiOriginali && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Traccia Dati Serializzati (JSON)</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-40">
                    {JSON.stringify(elementoDettaglio.datiOriginali, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleRipristina(elementoDettaglio);
                  setElementoDettaglio(null);
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ripristina nel Gestionale</span>
              </button>

              <button
                type="button"
                onClick={() => setElementoDettaglio(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Chiudi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE 2: CONFERMA RIPRISTINO ELEMENTO                   */}
      {/* ======================================================== */}
      {elementoInRipristino && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Confermi il ripristino dell'elemento?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Stai per ripristinare <strong>«{elementoInRipristino.titolo}»</strong>. L'elemento tornerà allo stato attivo e sarà nuovamente computato nei calcoli e nei registri ordinari.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setElementoInRipristino(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleRipristina(elementoInRipristino)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Sì, Ripristina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE 3: CONFERMA ELIMINAZIONE DEFINITIVA SINGOLA       */}
      {/* ======================================================== */}
      {elementoDaEliminare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Eliminazione definitiva dal Cestino?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Stai per rimuovere definitivamente <strong>«{elementoDaEliminare.titolo}»</strong> dal registro audit. Questa operazione è irreversibile e cancellerà definitivamente la voce anche dall'archivio storico.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setElementoDaEliminare(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleEliminaDefinitivo(elementoDaEliminare.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE 4: CONFERMA SVUOTAMENTO TOTALE DEL CESTINO        */}
      {/* ======================================================== */}
      {mostraConfermaSvuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Svuotare l'intero Cestino di Sistema?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Verranno eliminati definitivamente tutti i <strong>{elementi.length} record</strong> attualmente archiviati nel Cestino. Nessun record potrà più essere ripristinato.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostraConfermaSvuota(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSvuotaTutto}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Sì, Svuota Cestino
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
