import React, { useRef, useState } from 'react';
import { ProLocoEvento, ProLocoInfo, Socio } from '../types';
import { 
  Printer, 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Euro, 
  Clock, 
  Building2,
  FileDown,
  Loader2
} from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';
import { calcolaEconomiaEvento, aggregaEventiPerBilancio } from '../utils/eventoHelpers';

interface EventsProgramPrintModalProps {
  eventi: ProLocoEvento[];
  config: ProLocoInfo;
  soci: Socio[];
  annoSelezionato: number;
  onClose: () => void;
}

export const EventsProgramPrintModal: React.FC<EventsProgramPrintModalProps> = ({
  eventi,
  config,
  soci,
  annoSelezionato,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleScaricaPDF = async () => {
    if (!printRef.current) return;
    setGenerandoPDF(true);
    const nomeFile = `Programma_Eventi_ProLoco_${annoSelezionato}.pdf`;
    await esportaElementoInPDF(printRef.current, nomeFile, 'landscape');
    setGenerandoPDF(false);
  };

  // Filtro eventi dell'anno (sincronizzato su dataInizio)
  const eventiAnno = eventi.filter(e => {
    const dStr = e.dataInizio || (e as any).data || '';
    const annoEvento = parseInt(dStr.slice(0, 4), 10) || new Date(dStr).getFullYear();
    return annoEvento === annoSelezionato;
  }).sort((a, b) => {
    const dA = a.dataInizio || (a as any).data || '';
    const dB = b.dataInizio || (b as any).data || '';
    return dA.localeCompare(dB);
  });

  // Statistiche del programma sincronizzate con il motore di bilancio
  const totaleEventi = eventiAnno.length;
  const riepilogoEventi = aggregaEventiPerBilancio(eventiAnno);
  const totaleBudgetPrevisto = riepilogoEventi.budgetPrevistoProLoco;
  const totaleCostiConsuntivo = riepilogoEventi.costiCompetenzaProLoco;
  const totaleEntrateRealizzate = riepilogoEventi.entrateCompetenzaProLoco;
  const margineNettoProgramma = riepilogoEventi.margineCompetenzaProLoco;

  const dataStampa = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* Contenitore Modale */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[95vh] flex flex-col relative overflow-hidden print:max-h-none print:h-auto print:m-0 print:p-0 print:shadow-none print:border-none print:overflow-visible print:block">
        
        {/* Barra comandi superiore (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">
                Stampa Calendario & Programma Iniziative Territoriali
              </span>
              <span className="text-xs text-slate-300">
                Anno {annoSelezionato} • Circolare per Bacheca, Volontari e Istituzioni
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-scarica-programma-eventi-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica il Programma Eventi in formato PDF"
            >
              {generandoPDF ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              ) : (
                <FileDown className="w-4 h-4 text-teal-400" />
              )}
              <span>{generandoPDF ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Apri finestra di stampa o Salva come PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / PDF A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FOGLIO A4 STAMPABILE SCORREVOLE */}
        <div 
          ref={printRef}
          className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50 print:p-0 print:bg-white print:overflow-visible print:h-auto print:block"
        >
          <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 sm:p-10 rounded-2xl shadow-sm text-slate-900 font-sans space-y-6 print:border-none print:p-0 print:shadow-none print:max-w-none">
            
            {/* Intestazione Ufficiale Pro Loco */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-800">
                    Associazione Turistica Pro Loco
                  </span>
                  {config.codiceUnpli && (
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                      UNPLI: {config.codiceUnpli}
                    </span>
                  )}
                  {config.numeroRunts && (
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                      RUNTS: {config.numeroRunts}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {config.nome}
                </h1>
                <p className="text-xs text-slate-600">
                  {config.indirizzo} • {config.cap} {config.comune} ({config.provincia})
                  {config.email && ` • Email: ${config.email}`}
                  {config.telefono && ` • Tel: ${config.telefono}`}
                </p>
              </div>

              <div className="text-left sm:text-right bg-slate-50 border border-slate-200 p-3 rounded-xl shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CALENDARIO UFFICIALE</span>
                <span className="text-base font-black text-teal-800 block">PROGRAMMA EVENTI</span>
                <span className="text-xs font-semibold text-slate-700">Anno {annoSelezionato}</span>
              </div>
            </div>

            {/* Titolo Documento */}
            <div className="text-center py-1 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
                Calendario delle Manifestazioni e Attività di Promozione Territoriale
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Approvato dal Consiglio Direttivo per l'animazione socio-culturale e turistica della comunità locale
              </p>
            </div>

            {/* Sintesi Programmazione */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-teal-50/60 border border-teal-200/80 p-4 rounded-xl text-xs">
              <div className="border-r border-teal-200/80 pr-2">
                <span className="text-teal-700 block text-[11px] font-medium">Iniziative in Calendario</span>
                <span className="font-bold text-base text-teal-950">{totaleEventi} manifestazioni</span>
                <span className="text-[10px] text-teal-700 block">{riepilogoEventi.totaleStands} stand • {riepilogoEventi.totaleTurniAssegnati} turni</span>
              </div>
              <div className="border-r border-teal-200/80 pr-2">
                <span className="text-teal-700 block text-[11px] font-medium">Volontari Operativi Mobilitati</span>
                <span className="font-bold text-base text-teal-950">{riepilogoEventi.volontariUniciCount} soci volontari</span>
              </div>
              <div className="border-r border-teal-200/80 pr-2">
                <span className="text-teal-700 block text-[11px] font-medium">Budget Prev. / Spese Cons.</span>
                <span className="font-bold text-sm text-teal-950 font-mono">
                  {totaleBudgetPrevisto.toLocaleString('it-IT')} € / {totaleCostiConsuntivo.toLocaleString('it-IT')} €
                </span>
              </div>
              <div>
                <span className="text-teal-700 block text-[11px] font-medium">Incassi / Margine Pro Loco</span>
                <span className={`font-bold text-sm font-mono ${margineNettoProgramma >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                  {totaleEntrateRealizzate.toLocaleString('it-IT')} € ({margineNettoProgramma >= 0 ? '+' : ''}{margineNettoProgramma.toLocaleString('it-IT')} €)
                </span>
              </div>
            </div>

            {/* ELENCO DEGLI EVENTI */}
            {eventiAnno.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                Nessuna manifestazione programmata per l'anno {annoSelezionato}.
              </div>
            ) : (
              <div className="space-y-4">
                {eventiAnno.map((evento, index) => {
                  const resp = soci.find(s => s.id === evento.responsabileId);
                  const econ = calcolaEconomiaEvento(evento);
                  const dInizio = evento.dataInizio || (evento as any).data || '';
                  const dataFormattata = dInizio
                    ? new Date(dInizio).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Data da definire';

                  return (
                    <div 
                      key={evento.id} 
                      className="border border-slate-300 rounded-xl p-4 bg-white space-y-2 page-break-inside:avoid"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {evento.titolo}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {econ.etichettaTipo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 text-[10.5px]">
                            {evento.categoria || 'Generale'}
                          </span>
                          <span className="font-bold text-teal-800 capitalize">
                            {dataFormattata}
                          </span>
                          {evento.oraInizio && (
                            <span className="text-slate-500 font-mono text-[11px]">
                              ({evento.oraInizio} {evento.oraFine ? `- ${evento.oraFine}` : ''})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span><strong>Luogo:</strong> {evento.luogo}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            <strong>Referente:</strong> {resp ? `${resp.nome} ${resp.cognome}` : 'Consiglio Direttivo'}
                          </span>
                        </div>
                      </div>

                      {evento.descrizione && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                          {evento.descrizione}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <span>Volontari mobilitati: <strong>{econ.volontariUniciIds.length}</strong> ({econ.numeroStands} stand • {econ.numeroTurniAssegnati} turni)</span>
                        <span>Preventivo: <strong>{econ.costiProLocoPreventivo.toLocaleString('it-IT')} €</strong> • Consuntivo: <strong>{econ.costiProLocoConsuntivo.toLocaleString('it-IT')} €</strong></span>
                        <span>Incassi: <strong>{econ.entrateProLocoRealizzate.toLocaleString('it-IT')} €</strong> (<strong className={econ.margineNettoProLoco >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{econ.margineNettoProLoco >= 0 ? '+' : ''}{econ.margineNettoProLoco.toLocaleString('it-IT')} €</strong>)</span>
                        <span>Stato: <strong className="uppercase">{evento.stato.replace('_', ' ')}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Note Istituzionali */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
              <p>
                <strong>Avviso pubblico e trasparenza:</strong> Il presente programma può subire variazioni in caso di condizioni 
                meteo avverse o cause di forza maggiore. Tutte le manifestazioni si svolgono con il patrocinio e in conformità alle 
                normative vigenti di pubblica sicurezza e tutela ambientale.
              </p>
            </div>

            {/* Firme Ufficiali */}
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="border-t border-slate-400 pt-2 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  Il Responsabile Eventi & Manifestazioni
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-5">
                  (Firma per approvazione organizzativa)
                </span>
              </div>

              <div className="border-t border-slate-400 pt-2 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  Il Presidente della Pro Loco
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-1">
                  {config.nomePresidente}
                </span>
                <span className="text-[11px] text-slate-500 block mt-3">
                  (Firma e timbro dell'Associazione)
                </span>
              </div>
            </div>

            {/* Piè di Pagina */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
              <span>Comune di {config.comune} • Data rilascio: {dataStampa}</span>
              <span>Documento estratto dal Gestionale Eventi Pro Loco A4</span>
            </div>

          </div>
        </div>

        {/* Barra di fondo fissa (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0 no-print">
          <span className="text-xs text-slate-500">
            Circolare Calendario Manifestazioni • Formato A4
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Programma Eventi A4</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
