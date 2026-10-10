import React, { useRef, useState } from 'react';
import { ProLocoEvento, ProLocoInfo, Socio, IscrizioneEvento } from '../types';
import { Printer, X, Calendar, MapPin, Users, CheckCircle2, FileDown, Loader2, Clock, ShieldCheck } from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';

interface EventAttendancePrintModalProps {
  evento: ProLocoEvento;
  config: ProLocoInfo;
  soci: Socio[];
  onClose: () => void;
}

export const EventAttendancePrintModal: React.FC<EventAttendancePrintModalProps> = ({
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
    const nomeFile = `Foglio_Presenze_${titoloSanificato}_${evento.dataInizio}.pdf`;
    await esportaElementoInPDF(foglioRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  const sociMap = new Map<string, Socio>();
  soci.forEach(s => sociMap.set(s.id, s));

  const iscrizioni = evento.iscrizioni || [];
  const presenti = iscrizioni.filter(i => i.statoPresenza === 'presente');
  const assenti = iscrizioni.filter(i => i.statoPresenza === 'assente');
  const daVerificare = iscrizioni.filter(i => i.statoPresenza === 'da_verificare' || !i.statoPresenza);
  const totaleAccompagnatori = iscrizioni.reduce((sum, i) => sum + (i.numeroAccompagnatori || 0), 0);
  const totaleQuote = iscrizioni.reduce((sum, i) => sum + (i.quotaVersata || 0), 0);
  const tassoPresenza = iscrizioni.length > 0 ? Math.round((presenti.length / iscrizioni.length) * 100) : 0;

  const responsabile = evento.responsabileId ? sociMap.get(evento.responsabileId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* Contenitore Modale */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[94vh] flex flex-col relative overflow-hidden print:max-h-none print:h-auto print:m-0 print:p-0 print:shadow-none print:border-none print:overflow-visible print:block">
        
        {/* Barra di comando fissa in alto (nascosta in stampa) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block leading-tight">
                Foglio Firme Presenze Ufficiale (A4)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {evento.titolo} • {iscrizioni.length} Soci Iscritti • {presenti.length} Presenti ({tassoPresenza}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
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

        {/* Corpo modale scorrevole */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 print:p-0 print:bg-white print:overflow-visible print:h-auto print:block">

          {/* FOGLIO STAMPABILE A4 */}
          <div 
            ref={foglioRef}
            className="border border-slate-300 p-6 sm:p-8 rounded-xl bg-white text-slate-800 font-sans text-xs space-y-4 max-w-3xl mx-auto shadow-xs print:border-none print:p-0 print:shadow-none print:max-w-none"
          >
            
            {/* Intestazione Ufficiale Pro Loco */}
            <div className="border-b-2 border-emerald-800 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-900 uppercase tracking-wide">
                  {config.nome}
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  Associazione di Promozione Sociale Turistica e Culturale • Riconosciuta UNPLI
                </p>
                <div className="text-[10px] text-slate-500 space-x-2 mt-0.5 font-mono">
                  <span>C.F. {config.codiceFiscale}</span>
                  {config.partitaIva && <span>• P.IVA {config.partitaIva}</span>}
                  {config.numeroRunts && <span>• RUNTS N. {config.numeroRunts}</span>}
                  {config.codiceUnpli && <span>• Cod. UNPLI {config.codiceUnpli}</span>}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-800 text-white font-mono font-bold text-[10.5px] rounded tracking-wider uppercase">
                  Foglio Firme Presenze
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Esercizio {new Date(evento.dataInizio).getFullYear() || config.annoCorrente}
                </p>
              </div>
            </div>

            {/* Dettagli della Manifestazione / Iniziativa */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Evento / Manifestazione:
                  </span>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {evento.titolo}
                  </h1>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10.5px] font-bold">
                    {evento.categoria}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Data Svolgimento:</span>
                  <strong className="text-slate-800">{evento.dataInizio} {evento.dataFine && evento.dataFine !== evento.dataInizio ? `al ${evento.dataFine}` : ''}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Orario Inizio / Fine:</span>
                  <strong className="text-slate-800">{evento.oraInizio || 'Non spec.'} {evento.oraFine ? `- ${evento.oraFine}` : ''}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Luogo / Sede:</span>
                  <strong className="text-slate-800 truncate block">{evento.luogo}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Responsabile Evento:</span>
                  <strong className="text-slate-800 truncate block">{responsabile ? `${responsabile.cognome} ${responsabile.nome}` : (config.nomePresidente || 'Presidente')}</strong>
                </div>
              </div>
            </div>

            {/* Riepilogo Metrico Presenze */}
            <div className="grid grid-cols-4 gap-2 text-center py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl font-mono text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Iscritti Totali</span>
                <strong className="text-sm font-black text-slate-900">{iscrizioni.length}</strong>
                {totaleAccompagnatori > 0 && <span className="text-[9.5px] text-slate-500 block font-sans">(+{totaleAccompagnatori} osp.)</span>}
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 font-sans block uppercase font-bold">Presenti Convalidati</span>
                <strong className="text-sm font-black text-emerald-800">{presenti.length}</strong>
                <span className="text-[9.5px] text-emerald-700 block font-sans">({tassoPresenza}%)</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 font-sans block uppercase font-bold">Da Verificare</span>
                <strong className="text-sm font-black text-amber-700">{daVerificare.length}</strong>
              </div>
              <div>
                <span className="text-[10px] text-rose-800 font-sans block uppercase font-bold">Assenti Segnati</span>
                <strong className="text-sm font-black text-rose-700">{assenti.length}</strong>
              </div>
            </div>

            {/* TABELLA FOGLIO FIRME PRESENZE */}
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  Registro Nominativo Iscritti & Firme Autografe:
                </span>
                <span className="text-[10px] text-slate-500">
                  {iscrizioni.length} soci registrati a sistema
                </span>
              </div>

              {iscrizioni.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-500">
                  Nessun socio iscritto a questa manifestazione.
                </div>
              ) : (
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-1.5 w-8 text-center">N°</th>
                      <th className="border border-slate-300 p-1.5 text-left w-24">N° Tessera</th>
                      <th className="border border-slate-300 p-1.5 text-left">Cognome e Nome Socio</th>
                      <th className="border border-slate-300 p-1.5 text-center w-24">Ruolo</th>
                      <th className="border border-slate-300 p-1.5 text-center w-24">Stato Presenza</th>
                      <th className="border border-slate-300 p-1.5 text-center w-16">Check-in</th>
                      <th className="border border-slate-300 p-1.5 text-center w-44">Firma Autografa del Socio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iscrizioni.map((iscr, idx) => {
                      const socio = sociMap.get(iscr.socioId);
                      const isPresente = iscr.statoPresenza === 'presente';
                      const isAssente = iscr.statoPresenza === 'assente';

                      return (
                        <tr key={iscr.id || idx} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-700">
                            {socio?.numeroTessera || 'Socio Pro Loco'}
                          </td>
                          <td className="border border-slate-300 p-1.5 font-semibold text-slate-900">
                            {socio ? `${socio.cognome} ${socio.nome}` : 'Socio registrato'}
                            {socio?.categoria && (
                              <span className="text-[9.5px] font-normal text-slate-500 block">
                                {socio.categoria} {iscr.numeroAccompagnatori ? `(+${iscr.numeroAccompagnatori} accomp.)` : ''}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              iscr.ruolo === 'volontario' ? 'bg-amber-100 text-amber-800' :
                              iscr.ruolo === 'staff' ? 'bg-purple-100 text-purple-800' :
                              iscr.ruolo === 'relatore_ospite' ? 'bg-sky-100 text-sky-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {iscr.ruolo === 'volontario' ? 'Volontario' :
                               iscr.ruolo === 'staff' ? 'Staff' :
                               iscr.ruolo === 'relatore_ospite' ? 'Relatore' : 'Partecipante'}
                            </span>
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPresente ? 'bg-emerald-100 text-emerald-800' :
                              isAssente ? 'bg-rose-100 text-rose-800' :
                              iscr.statoPresenza === 'giustificato' ? 'bg-sky-100 text-sky-800' :
                              'bg-amber-50 text-amber-800'
                            }`}>
                              {isPresente ? 'PRESENTE' :
                               isAssente ? 'ASSENTE' :
                               iscr.statoPresenza === 'giustificato' ? 'GIUSTIFICATO' : 'DA VERIFICARE'}
                            </span>
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono text-[10.5px]">
                            {iscr.orarioCheckIn || '-'}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center text-slate-400">
                            {/* Spazio per firma autografa o convalida digitale */}
                            <div className="h-6 flex items-center justify-center font-mono text-[9px]">
                              {isPresente ? (
                                <span className="text-emerald-700 font-semibold italic">Firmato / Verificato</span>
                              ) : (
                                <span className="text-slate-300">___________________</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Note & Attestazione di Regolarità */}
            <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-600 space-y-1">
              <p className="leading-relaxed">
                <strong>Clausola di Trasparenza Statutaria:</strong> Il presente registro presenze viene redatto per gli scopi istituzionali della Pro Loco in conformità al Codice del Terzo Settore (D.Lgs. 117/2017) e alle disposizioni statutarie interne per la verifica dell'effettiva partecipazione dei soci e dei volontari assicurati.
              </p>
            </div>

            {/* Firme di Chiusura e Convalida */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-8 text-[11px]">Il Segretario Verbalizzante</p>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                  Firma: ____________________________________
                </div>
              </div>

              <div>
                <p className="text-slate-500 mb-8 text-[11px]">Il Presidente della Pro Loco</p>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                  {config.nomePresidente || 'Marco Valenti'}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
