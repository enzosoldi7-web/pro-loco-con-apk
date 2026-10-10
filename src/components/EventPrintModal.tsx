import React, { useRef, useState } from 'react';
import { ProLocoEvento, ProLocoInfo, Socio } from '../types';
import { Printer, X, Calendar, MapPin, Users, Euro, ShieldCheck, Clock, FileDown, Loader2 } from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';
import { STAND_SIMULATI_DEFAULT } from '../storage';
import { calcolaEconomiaEvento } from '../utils/eventoHelpers';

interface EventPrintModalProps {
  evento: ProLocoEvento;
  config: ProLocoInfo;
  soci: Socio[];
  onClose: () => void;
}

export const EventPrintModal: React.FC<EventPrintModalProps> = ({
  evento,
  config,
  soci,
  onClose
}) => {
  const foglioRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleScaricaPDF = async () => {
    if (!foglioRef.current) return;
    setGenerandoPDF(true);
    const titoloSanificato = evento.titolo.replace(/[^a-zA-Z0-9_-]/g, '_');
    const nomeFile = `Scheda_Evento_${titoloSanificato}_${evento.anno || new Date().getFullYear()}.pdf`;
    await esportaElementoInPDF(foglioRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  const econ = calcolaEconomiaEvento(evento);
  const responsabile = soci.find(s => s.id === evento.responsabileId);
  const volontariCoinvolti = soci.filter(s => econ.volontariUniciIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* Contenitore Modale */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[94vh] flex flex-col relative overflow-hidden print:max-h-none print:h-auto print:m-0 print:p-0 print:shadow-none print:border-none print:overflow-visible print:block">
        
        {/* Barra di comando fissa in alto (nascosta in stampa) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block leading-tight">
                Scheda Tecnica & Circolare Evento
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {evento.titolo} • ID: {evento.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-scarica-scheda-evento-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica direttamente il file PDF sul tuo computer"
            >
              {generandoPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{generandoPDF ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Apri finestra di stampa o Salva come PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva in PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo modale scorrevole (non fuoriesce dallo schermo) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 print:p-0 print:bg-white print:overflow-visible print:h-auto print:block">

          {/* FOGLIO STAMPABILE (Stile documento ufficiale) */}
          <div 
            ref={foglioRef}
            className="border border-slate-300 p-6 sm:p-8 rounded-xl bg-white text-slate-800 font-sans text-xs space-y-5 max-w-2xl mx-auto shadow-xs print:border-none print:p-0 print:shadow-none print:max-w-none"
          >
          
          {/* Intestazione Ente Pro Loco */}
          <div className="border-b-2 border-emerald-800 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-base sm:text-lg font-black text-emerald-900 uppercase tracking-wide">
                {config.nome}
              </h2>
              <p className="text-[11px] text-slate-600">
                Associazione di Promozione Sociale Turistica e Culturale
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {config.indirizzo} - {config.cap} {config.comune} ({config.provincia})
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                C.F. {config.codiceFiscale} {config.partitaIva ? `| P.IVA ${config.partitaIva}` : ''} | RUNTS: {config.numeroRunts || 'Iscritto'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">
                {evento.categoria}
              </span>
              <p className="text-[10px] text-slate-400 mt-2">
                Documento del {new Date().toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>

          {/* Titolo Principale Evento */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Scheda Iniziativa & Piano Operativo
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {evento.titolo}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-slate-700 font-semibold text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                {new Date(evento.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                {evento.dataFine !== evento.dataInizio && ` - ${new Date(evento.dataFine).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}`}
              </span>
              {evento.oraInizio && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Dalle ore {evento.oraInizio} {evento.oraFine ? `alle ${evento.oraFine}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                {evento.luogo}
              </span>
            </div>
          </div>

          {/* 1. Descrizione e programma */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-xs uppercase tracking-wide">
              1. Dati, Date, Modello & Programma
            </h3>
            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line bg-white">
              {evento.descrizione || 'Nessuna descrizione inserita.'}
            </p>
          </div>

          {/* 2. Squadra Operativa Volontari & Iscrizioni */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-xs uppercase tracking-wide flex items-center justify-between">
              <span>2. Squadra & Iscrizioni</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {volontariCoinvolti.length} volontari mobilitati • {(evento.iscrizioni || []).length} soci iscritti
              </span>
            </h3>
            
            {responsabile && (
              <p className="text-[11px] text-slate-700 mb-2">
                <strong>Responsabile Operativo:</strong> {responsabile.cognome} {responsabile.nome} (Tel: {responsabile.telefono})
              </p>
            )}

            {volontariCoinvolti.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {volontariCoinvolti.map(v => (
                  <div key={v.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                    <span className="font-medium text-slate-900">{v.cognome} {v.nome}</span>
                    <span className="text-slate-500">{v.telefono}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px]">Nessun volontario registrato in questa scheda.</p>
            )}
          </div>

          {/* 3. Stand & Turni per ogni Stand */}
          {(() => {
            const stands = Array.isArray(evento.standNumerati) ? evento.standNumerati : [];

            return (
              <div>
                <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 text-xs uppercase tracking-wide flex items-center justify-between">
                  <span>3. Stand & Turni (Assegnazioni Volontari)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {stands.length} stand operativi
                  </span>
                </h3>
                {stands.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Nessuno stand configurato per questo evento.</p>
                ) : (
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="w-full text-[10.5px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[9.5px] font-bold">
                          <th className="py-1.5 px-2">Stand</th>
                          <th className="py-1.5 px-2">Capo Stand / Orario</th>
                          <th className="py-1.5 px-2">Turni & Volontari Assegnati (Mansione e Fascia Oraria)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {stands.map((st) => {
                          const turni = Array.isArray(st.turniAssegnazioni) ? st.turniAssegnazioni : [];
                          return (
                            <tr key={st.id || st.numero} className="align-top">
                              <td className="py-1.5 px-2 font-bold text-slate-900 whitespace-nowrap">
                                <div>#{st.numero} - {st.nome}</div>
                                <div className="text-[9px] text-slate-500 font-normal">{st.tipologia}</div>
                              </td>
                              <td className="py-1.5 px-2 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">{st.responsabile || '—'}</div>
                                <div className="text-[9.5px] font-mono text-slate-500">{st.orarioAperturaStand || '18:30 - 23:30'}</div>
                              </td>
                              <td className="py-1.5 px-2">
                                {turni.length === 0 ? (
                                  <span className="text-slate-400 italic">Nessun turno assegnato</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {turni.map(t => (
                                      <span key={t.id} className="inline-block bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9.5px]">
                                        <strong>{t.nomeVolontario || t.nominativo || 'Volontario'}</strong> ({(t.mansione || 'Operatore').split(' / ')[0]} • {t.orarioSpecifico || (t.orarioInizio && t.orarioFine ? `${t.orarioInizio}-${t.orarioFine}` : '') || (t.fasciaOraria || '').split(' ')[0]})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4. Quadro Economico */}
          <div className="space-y-4">
            {/* Rendiconto Economico Preventivo & Consuntivo Dettagliato */}
            <div className="bg-white rounded-lg border border-slate-300 p-3.5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Euro className="w-3.5 h-3.5 text-emerald-700" />
                  <span>4. Quadro Economico (Preventivo & Consuntivo)</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  Affluenza stimata: <strong>{evento.partecipantiStimati || '-'}</strong> partecipanti
                </span>
              </div>

              {/* Tabella analitica delle 4 voci */}
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-600 bg-slate-50/80">
                    <th className="py-1.5 px-2 text-left">Voce di Spesa</th>
                    <th className="py-1.5 px-2 text-right">Preventivo (€)</th>
                    <th className="py-1.5 px-2 text-right">Consuntivo (€)</th>
                    <th className="py-1.5 px-2 text-right">Differenza (€)</th>
                    <th className="py-1.5 px-2 text-right">% su Spesa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(() => {
                    const prevFood = econ.foodPrev;
                    const prevIntr = econ.intrattenimentoPrev;
                    const prevAltre = econ.altreSpesePrev;
                    const prevVarie = econ.variePrev;
                    const totPrev = econ.costiProLocoPreventivo;

                    const consFood = econ.food;
                    const consIntr = econ.intrattenimento;
                    const consAltre = econ.altreSpese;
                    const consVarie = econ.varie;
                    const totCons = econ.costiProLocoConsuntivo;

                    const entratePrev = econ.entrateProLocoPreviste;
                    const entrateReal = econ.entrateProLocoRealizzate;
                    const margineCons = econ.margineNettoProLoco;

                    const righeSpesa = [
                      { label: 'Food & Beverage (Stand gastronomico, cibi, bevande)', prev: prevFood, cons: consFood },
                      { label: 'Intrattenimento & Spettacoli (Musica, SIAE, artisti, service)', prev: prevIntr, cons: consIntr },
                      { label: 'Altre Spese & Logistica (Palco, noleggi, sicurezza safety)', prev: prevAltre, cons: consAltre },
                      { label: 'Varie & Oneri (Tipografia, manifesti, permessi, imprevisti)', prev: prevVarie, cons: consVarie }
                    ];

                    return (
                      <>
                        {righeSpesa.map((r, i) => {
                          const diffAss = Math.abs(r.cons - r.prev);
                          const isRisparmio = r.cons <= r.prev;
                          const perc = totCons > 0 ? ((r.cons / totCons) * 100).toFixed(1) : '0';
                          return (
                            <tr key={i}>
                              <td className="py-1 px-2 font-medium">{r.label}</td>
                              <td className="py-1 px-2 text-right font-mono">{(r.prev || 0).toLocaleString('it-IT')} €</td>
                              <td className="py-1 px-2 text-right font-mono">{(r.cons || 0).toLocaleString('it-IT')} €</td>
                              <td className={`py-1 px-2 text-right font-mono font-semibold ${
                                r.cons === r.prev ? 'text-slate-400' : isRisparmio ? 'text-emerald-700' : 'text-amber-700'
                              }`}>
                                {r.cons === r.prev ? '0 €' : `+${diffAss} € (${isRisparmio ? 'risparmio' : 'scostamento'})`}
                              </td>
                              <td className="py-1 px-2 text-right font-mono text-slate-500">{perc}%</td>
                            </tr>
                          );
                        })}

                        {/* Riga Totale Costi */}
                        <tr className="border-t-2 border-slate-300 font-bold bg-slate-50">
                          <td className="py-1.5 px-2 font-black text-slate-900">Totale Spese (Somma Costi)</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-900">{(totPrev || 0).toLocaleString('it-IT')} €</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-900">{(totCons || 0).toLocaleString('it-IT')} €</td>
                          <td className={`py-1.5 px-2 text-right font-mono font-bold ${
                            totCons <= totPrev ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            +{(Math.abs((totCons || 0) - (totPrev || 0)) || 0).toLocaleString('it-IT')} € {((totCons || 0) <= (totPrev || 0)) ? '(Risparmio)' : '(Scostamento)'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-700 font-black">100%</td>
                        </tr>

                        {/* Riga Entrate e Risultato Netto */}
                        <tr className="border-t border-slate-200">
                          <td className="py-1 px-2 font-semibold text-slate-700">Entrate Realizzate (Incassi)</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-500">{(entratePrev || 0).toLocaleString('it-IT')} €</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{(entrateReal || 0).toLocaleString('it-IT')} €</td>
                          <td colSpan={2} className="py-1 px-2 text-right text-[10px] text-slate-500">
                            {entrateReal >= entratePrev ? 'Target superato' : 'In linea col piano'}
                          </td>
                        </tr>

                        <tr className="bg-emerald-50/50 font-bold text-slate-900">
                          <td className="py-1.5 px-2 font-black">Risultato Economico Netto (Entrate - Costi)</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                            {((entratePrev || 0) - (totPrev || 0) >= 0 ? '+' : '')}{((entratePrev || 0) - (totPrev || 0)).toLocaleString('it-IT')} €
                          </td>
                          <td className={`py-1.5 px-2 text-right font-mono text-xs font-black ${(margineCons || 0) >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                            {((margineCons || 0) >= 0 ? '+' : '')}{(margineCons || 0).toLocaleString('it-IT')} €
                          </td>
                          <td colSpan={2} className="py-1.5 px-2 text-right font-semibold text-[10px]">
                            {margineCons >= 0 ? 'Utile per la Pro Loco' : 'Disavanzo registrato'}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>

              {/* Barra grafica di ripartizione spese per la stampa */}
              {(() => {
                const consFood = econ.food;
                const consIntr = econ.intrattenimento;
                const consAltre = econ.altreSpese;
                const consVarie = econ.varie;
                const tot = consFood + consIntr + consAltre + consVarie || 1;

                const pFood = ((consFood / tot) * 100);
                const pIntr = ((consIntr / tot) * 100);
                const pAltre = ((consAltre / tot) * 100);
                const pVarie = ((consVarie / tot) * 100);

                return (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Ripartizione Percentuale delle Spese Consuntive
                    </span>
                    <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden">
                      {pFood > 0 && <div style={{ width: `${pFood}%` }} className="bg-emerald-600" title={`Food: ${pFood.toFixed(1)}%`} />}
                      {pIntr > 0 && <div style={{ width: `${pIntr}%` }} className="bg-violet-600" title={`Intrattenimento: ${pIntr.toFixed(1)}%`} />}
                      {pAltre > 0 && <div style={{ width: `${pAltre}%` }} className="bg-sky-600" title={`Altre spese: ${pAltre.toFixed(1)}%`} />}
                      {pVarie > 0 && <div style={{ width: `${pVarie}%` }} className="bg-amber-600" title={`Varie: ${pVarie.toFixed(1)}%`} />}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Food: {pFood.toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" /> Intrattenimento: {pIntr.toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Altre: {pAltre.toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> Varie: {pVarie.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* 5. Permessi & Conferma */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>5. Permessi & Conferma (Adempimenti Istituzionali)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
              <div className="flex justify-between border-b sm:border-b-0 sm:border-r border-slate-200 pr-2">
                <span>Comune/Suolo:</span>
                <span className={`font-bold ${evento.permessoComunale ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {evento.permessoComunale ? 'Acquisito' : 'Non rich.'}
                </span>
              </div>
              <div className="flex justify-between border-b sm:border-b-0 sm:border-r border-slate-200 pr-2">
                <span>SIAE Musica:</span>
                <span className={`font-bold ${evento.licenzaSIAE ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {evento.licenzaSIAE ? 'Autorizzato' : 'Non prev.'}
                </span>
              </div>
              <div className="flex justify-between border-b sm:border-b-0 sm:border-r border-slate-200 pr-2">
                <span>Safety Sicurezza:</span>
                <span className={`font-bold ${evento.pianoSicurezzaSafety ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {evento.pianoSicurezzaSafety ? 'Predisposto' : 'Non prev.'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ASL HACCP:</span>
                <span className={`font-bold ${evento.aslHaccp ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {evento.aslHaccp ? 'Regolare' : 'Non prev.'}
                </span>
              </div>
            </div>
          </div>

          {/* Note Organizzative */}
          {evento.noteOrganizzative && (
            <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/80 text-[11px] text-amber-900">
              <strong>Note Operative:</strong> {evento.noteOrganizzative}
            </div>
          )}

          {/* Riquadro Firme Ufficiali */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[11px]">
            <div>
              <p className="text-slate-500 mb-8">Il Responsabile dell'Evento</p>
              <div className="border-b border-slate-400 w-4/5 mx-auto"></div>
              <p className="font-semibold text-slate-700 mt-1">
                {responsabile ? `${responsabile.nome} ${responsabile.cognome}` : '...........................................'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-8">Il Presidente della Pro Loco</p>
              <div className="border-b border-slate-400 w-4/5 mx-auto"></div>
              <p className="font-semibold text-slate-700 mt-1">
                {config.nomePresidente}
              </p>
            </div>
          </div>

          </div>
        </div>

        {/* Barra di fondo fissa (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0 no-print">
          <span className="text-xs text-slate-500">
            Circolare tecnica conforme RUNTS/ETS • Formato A4
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Scheda PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
