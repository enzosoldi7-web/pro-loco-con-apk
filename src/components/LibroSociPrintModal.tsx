import React, { useState, useRef } from 'react';
import { Socio, ProLocoInfo } from '../types';
import { getStatoQuotaSocio } from '../storage';
import { 
  Printer, 
  X, 
  Users, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  FileSpreadsheet,
  FileDown,
  Loader2
} from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';

interface LibroSociPrintModalProps {
  soci: Socio[];
  config: ProLocoInfo;
  annoSelezionato: number;
  onClose: () => void;
}

export const LibroSociPrintModal: React.FC<LibroSociPrintModalProps> = ({
  soci,
  config,
  annoSelezionato,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'in_regola' | 'da_rinnovare'>('tutti');
  const [ordinamento, setOrdinamento] = useState<'tessera' | 'cognome' | 'iscrizione'>('tessera');
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleScaricaPDF = async () => {
    if (!printRef.current) return;
    setGenerandoPDF(true);
    const nomeFile = `Libro_Soci_ProLoco_${annoSelezionato}.pdf`;
    await esportaElementoInPDF(printRef.current, nomeFile, 'landscape');
    setGenerandoPDF(false);
  };

  // Filtraggio soci
  const sociFiltrati = soci.filter(s => {
    if (filtroStato === 'tutti') return true;
    const stato = getStatoQuotaSocio(s, annoSelezionato);
    if (filtroStato === 'in_regola') return stato === 'in_regola';
    if (filtroStato === 'da_rinnovare') return stato !== 'in_regola';
    return true;
  });

  // Ordinamento
  const sociOrdinati = [...sociFiltrati].sort((a, b) => {
    if (ordinamento === 'tessera') {
      return a.numeroTessera.localeCompare(b.numeroTessera, undefined, { numeric: true });
    }
    if (ordinamento === 'cognome') {
      return a.cognome.localeCompare(b.cognome);
    }
    return a.dataIscrizione.localeCompare(b.dataIscrizione);
  });

  // Calcolo statistiche registro
  const totaleSoci = soci.length;
  const sociInRegola = soci.filter(s => getStatoQuotaSocio(s, annoSelezionato) === 'in_regola').length;
  const sociInAttesa = totaleSoci - sociInRegola;
  const totaleIncassatoQuote = soci.reduce((tot, s) => {
    const q = s.quote?.find(item => item.anno === annoSelezionato);
    return tot + (q ? Number(q.importo) : 0);
  }, 0);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0 no-print gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">
                Stampa Ufficiale Libro dei Soci (Albo Generale)
              </span>
              <span className="text-xs text-slate-300">
                Anno {annoSelezionato} • Conforme D.Lgs. 117/2017 (Codice Terzo Settore)
              </span>
            </div>
          </div>

          {/* Filtri e Azioni */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-1 text-xs">
              <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtro:
              </span>
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value as any)}
                className="bg-slate-900 text-white rounded px-2 py-1 text-xs border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="tutti">Tutti ({totaleSoci})</option>
                <option value="in_regola">Solo in regola ({sociInRegola})</option>
                <option value="da_rinnovare">Da rinnovare ({sociInAttesa})</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-800 rounded-lg p-1 text-xs">
              <select
                value={ordinamento}
                onChange={(e) => setOrdinamento(e.target.value as any)}
                className="bg-slate-900 text-white rounded px-2 py-1 text-xs border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="tessera">Ordina: N° Tessera</option>
                <option value="cognome">Ordina: Cognome A-Z</option>
                <option value="iscrizione">Ordina: Data Iscrizione</option>
              </select>
            </div>

            <button
              id="btn-scarica-libro-soci-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica il Libro dei Soci in formato PDF"
            >
              {generandoPDF ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-400" />
              )}
              <span>{generandoPDF ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
            
            {/* Intestazione Ente Ufficiale */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
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
                  {config.codiceFiscale && ` • C.F. / P.IVA: ${config.codiceFiscale}`}
                </p>
              </div>

              <div className="text-left sm:text-right bg-slate-50 border border-slate-200 p-3 rounded-xl shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">REGISTRO UFFICIALE</span>
                <span className="text-base font-black text-emerald-800 block">LIBRO DEI SOCI</span>
                <span className="text-xs font-semibold text-slate-700">Anno Sociale {annoSelezionato}</span>
              </div>
            </div>

            {/* Titolo e Riferimento Normativo */}
            <div className="text-center py-1 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
                Albo Generale degli Iscritti e Registro Tesseramento
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Redatto ai sensi dell'art. 24 del D.Lgs. n. 117/2017 (Codice del Terzo Settore) e delle disposizioni statutarie UNPLI
              </p>
            </div>

            {/* Riepilogo di Sintesi Amministrativa */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="border-r border-slate-200 last:border-none pr-2">
                <span className="text-slate-500 block text-[11px]">Totale Soci Iscritti</span>
                <span className="font-bold text-base text-slate-900">{totaleSoci}</span>
              </div>
              <div className="border-r border-slate-200 last:border-none pr-2">
                <span className="text-slate-500 block text-[11px]">In Regola {annoSelezionato}</span>
                <span className="font-bold text-base text-emerald-700">{sociInRegola}</span>
              </div>
              <div className="border-r border-slate-200 last:border-none pr-2">
                <span className="text-slate-500 block text-[11px]">Da Rinnovare</span>
                <span className="font-bold text-base text-amber-700">{sociInAttesa}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Totale Quote Incassate</span>
                <span className="font-bold text-base text-emerald-800">{totaleIncassatoQuote.toFixed(2)} €</span>
              </div>
            </div>

            {/* TABELLA UFFICIALE SOCI */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10.5px] uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-300 w-16 text-center">N° Tess.</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Cognome e Nome</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Codice Fiscale</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Categoria / Ruolo</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-24">Iscritto dal</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-24 text-right">Quota {annoSelezionato}</th>
                    <th className="py-2.5 px-3 w-28 text-center">Stato / Ricevuta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {sociOrdinati.map((socio, idx) => {
                    const stato = getStatoQuotaSocio(socio, annoSelezionato);
                    const quotaAnno = socio.quote?.find(q => q.anno === annoSelezionato);
                    const inRegola = stato === 'in_regola';

                    return (
                      <tr key={socio.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold text-center">
                          {socio.numeroTessera}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-900">
                          {socio.cognome} {socio.nome}
                          {socio.luogoNascita && (
                            <span className="block text-[9.5px] text-slate-500 font-normal">
                              Nato a {socio.luogoNascita} il {socio.dataNascita || '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono text-[10px]">
                          {socio.codiceFiscale}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300">
                          <span className="font-medium">{socio.categoria}</span>
                          {socio.ruoloDirettivo && socio.ruoloDirettivo !== 'Nessuno' && (
                            <span className="block text-[10px] font-bold text-purple-700">
                              ★ {socio.ruoloDirettivo}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-slate-600">
                          {socio.dataIscrizione}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-semibold">
                          {quotaAnno ? `${Number(quotaAnno.importo).toFixed(2)} €` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {inRegola ? (
                            <span className="font-bold text-emerald-800 block text-[10px]">
                              REGOLARE
                              {quotaAnno?.ricevutaNumero && (
                                <span className="block text-[9px] text-slate-500 font-normal">
                                  Ric. {quotaAnno.ricevutaNumero}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-700 block text-[10px]">
                              NON IN REGOLA
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note Legali e Certificazione */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
              <p>
                <strong>Attestazione di conformità:</strong> Si certifica che il presente estratto del Libro dei Soci corrisponde 
                fedelmente alle risultanze dell'archivio associativo e alle delibere del Consiglio Direttivo relative all'ammissione 
                dei soci e alla regolarità dei versamenti della quota associativa per l'anno di riferimento.
              </p>
            </div>

            {/* Riquadro Firme Ufficiali */}
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="border-t border-slate-400 pt-2 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  Il Segretario dell'Associazione
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-5">
                  (Firma e attestazione di tenuta registro)
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
                  (Firma autografa e timbro dell'Ente)
                </span>
              </div>
            </div>

            {/* Piè di Pagina */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
              <span>Luogo e Data: {config.comune}, {dataStampa}</span>
              <span>Documento Ufficiale generato dal Gestionale Pro Loco A4 • Pagina 1 di 1</span>
            </div>

          </div>
        </div>

        {/* Barra di fondo fissa (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0 no-print">
          <span className="text-xs text-slate-500">
            Libro dei Soci conforme al Codice del Terzo Settore • Formato A4
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
              <span>Stampa Libro Soci A4</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
