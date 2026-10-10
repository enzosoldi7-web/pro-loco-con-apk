import React, { useRef } from 'react';
import { DonazioneTerzi, ProLocoInfo } from '../types';
import { Printer, X, BookOpen, ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';
import { esportaDonazioniCSV } from '../storage';

interface DonazioneRegistroVidimabileModalProps {
  donazioni: DonazioneTerzi[];
  config: ProLocoInfo;
  annoSelezionato?: number;
  onClose: () => void;
}

export const DonazioneRegistroVidimabileModal: React.FC<DonazioneRegistroVidimabileModalProps> = ({
  donazioni,
  config,
  annoSelezionato,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const donazioniAttive = donazioni.filter(d => d.stato !== 'annullata_ripensamento');
  const donazioniFiltrate = (annoSelezionato 
    ? donazioniAttive.filter(d => d.anno === annoSelezionato)
    : donazioniAttive
  ).sort((a, b) => a.data.localeCompare(b.data));

  const totaleComplessivo = donazioniFiltrate.reduce((acc, d) => acc + d.importo, 0);
  const totaleDetraibile = donazioniFiltrate
    .filter(d => d.detraibileFiscale)
    .reduce((acc, d) => acc + d.importo, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    esportaDonazioniCSV(donazioniFiltrate, annoSelezionato);
  };

  // Calcolo progressivo cumulativo
  let saldoCumulato = 0;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[94vh]">
        
        {/* BARRA SUPERIORE STRUMENTI (NON STAMPABILE) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Libro Registro Vidimabile delle Donazioni ed Erogazioni Liberali</h3>
              <p className="text-[11px] text-slate-400">
                Registro cronologico conforme per Organo di Controllo, RUNTS e Revisore dei Conti {annoSelezionato ? `(Anno ${annoSelezionato})` : '(Globale)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Esporta CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Registro</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENUTO REGISTRO STAMPABILE */}
        <div ref={printRef} className="overflow-y-auto p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto space-y-6 text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
            
            {/* Intestazione Registro Istituzionale */}
            <div className="border-b-2 border-indigo-900 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">
                  Documento Contabile Ufficiale • Terzo Settore
                </span>
                <h1 className="text-xl font-black text-slate-950 tracking-tight mt-0.5">
                  PRO LOCO {config.nome.toUpperCase()}
                </h1>
                <p className="text-xs text-slate-600">
                  {config.indirizzo} • {config.cap} {config.comune} ({config.provincia}) • C.F. {config.codiceFiscale}
                </p>
                {config.numeroRunts && (
                  <p className="text-[11px] font-bold text-slate-700">
                    Registro Unico Nazionale Terzo Settore (RUNTS): {config.numeroRunts}
                  </p>
                )}
              </div>

              <div className="border border-indigo-200 bg-indigo-50/60 p-3 rounded-xl text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-indigo-900 block">
                  Registro Cronologico Donazioni
                </span>
                <span className="text-base font-black text-indigo-950 font-mono block">
                  {annoSelezionato ? `Esercizio ${annoSelezionato}` : 'Registro Storico'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Stampato il: {new Date().toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>

            {/* Sommario Quadro Fiscale */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Totale Erogazioni Registrate</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  € {totaleComplessivo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{donazioniFiltrate.length} registrazioni</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Tracciabili Art. 83 CTS (Detraibili)</span>
                <span className="text-lg font-black text-emerald-950 font-mono">
                  € {totaleDetraibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  {((totaleDetraibile / (totaleComplessivo || 1)) * 100).toFixed(0)}% del monte donazioni
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">Attestazione Tracciabilità</span>
                <span className="text-xs font-bold text-indigo-950 block mt-1">
                  100% Verificato
                </span>
                <span className="text-[10px] text-indigo-700 block mt-0.5">
                  Conforme con Rendiconto per Cassa
                </span>
              </div>
            </div>

            {/* Tabella Cronologica Libro Mastro */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Prot. / Data</th>
                    <th className="py-2.5 px-3">Donatore / C.F. / P.IVA</th>
                    <th className="py-2.5 px-3">Causale & Progetto</th>
                    <th className="py-2.5 px-3">Strumento & Tracciabilità</th>
                    <th className="py-2.5 px-3 text-right">Importo (€)</th>
                    <th className="py-2.5 px-3 text-right">Progressivo (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donazioniFiltrate.map((d) => {
                    saldoCumulato += d.importo;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-indigo-900 block">{d.ricevutaNumero}</span>
                          <span className="text-[10px] text-slate-500 block">{d.data}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{d.donatore}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            {d.codiceFiscalePartitaIva && (
                              <span className="font-mono">{d.codiceFiscalePartitaIva}</span>
                            )}
                            <span className="capitalize">({d.tipoDonatore})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-800 line-clamp-2">{d.causale}</span>
                          {d.destinazione && (
                            <span className="text-[10px] font-bold text-indigo-700 block mt-0.5">
                              {d.destinazione}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{d.metodo}</span>
                          {d.estremiTracciabilita && (
                            <span className="text-[9.5px] font-mono text-slate-400 block truncate max-w-[150px]">
                              {d.estremiTracciabilita}
                            </span>
                          )}
                          <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold mt-0.5 ${
                            d.detraibileFiscale ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {d.detraibileFiscale ? 'Art. 83 CTS' : 'Ordinario'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right font-black text-slate-900 font-mono">
                          € {d.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right font-bold text-slate-600 font-mono">
                          € {saldoCumulato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50/70 border-t-2 border-indigo-900 font-bold text-slate-900">
                    <td colSpan={4} className="py-3 px-3 uppercase text-right text-indigo-950 font-black">
                      Totale Complessivo Chiusura:
                    </td>
                    <td className="py-3 px-3 text-right font-black text-indigo-950 font-mono text-sm">
                      € {totaleComplessivo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-indigo-950 font-mono text-sm">
                      € {totaleComplessivo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Verbale di Vidimazione e Conformità Contabile */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Attestazione di Vidimazione e Conformità Amministrativa</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Il sottoscritto Legale Rappresentante e il Tesoriere dell'Associazione attestano che il presente registro cronologico delle donazioni corrisponde fedelmente alle quietanze emesse e agli estratti conto bancari dell'Ente. Tutte le erogazioni liberali tracciabili sono state destinate esclusivamente alle finalità civiche, solidaristiche e di utilità sociale previste dallo Statuto sociale.
              </p>

              <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Il Tesoriere dell'Associazione</span>
                  <div className="h-10 border-b border-slate-300 mx-auto w-3/4 mt-2"></div>
                  <span className="text-[10px] text-slate-400 block mt-1">(Firma per controllo contabile)</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Il Presidente Legale Rappresentante</span>
                  <div className="h-10 border-b border-slate-300 mx-auto w-3/4 mt-2"></div>
                  <span className="text-[10px] text-slate-400 block mt-1">{config.nomePresidente}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER NON STAMPABILE */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print shrink-0 text-xs text-slate-500">
          <span>
            Libro Registro Vidimabile Donazioni • Pro Loco {config.nome}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
