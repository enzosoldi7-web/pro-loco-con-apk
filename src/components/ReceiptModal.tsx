import React, { useRef, useState } from 'react';
import { Socio, QuotaAssociativa, ProLocoInfo } from '../types';
import { X, Printer, CheckCircle, FileText, Building2, FileDown, Loader2 } from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';

interface ReceiptModalProps {
  socio: Socio;
  quota: QuotaAssociativa;
  config: ProLocoInfo;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  socio,
  quota,
  config,
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
    const nomeFile = `Ricevuta_${quota.ricevutaNumero || quota.anno}_${socio.cognome}_${socio.nome}.pdf`;
    await esportaElementoInPDF(foglioRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible print:block">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden print:max-h-none print:h-auto print:m-0 print:p-0 print:shadow-none print:border-none print:overflow-visible print:block">
        
        {/* Barra di comando fissa in alto - non stampabile */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 no-print">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-700" />
            </div>
            <span>Ricevuta Ufficiale Quota Sociale</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-scarica-ricevuta-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica la ricevuta in formato PDF"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Apri finestra di stampa o Salva come PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / PDF</span>
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

          {/* FOGLIO DELLA RICEVUTA (STAMPABILE) */}
          <div 
            ref={foglioRef}
            className="bg-white p-6 sm:p-8 border border-slate-300 rounded-xl shadow-xs text-slate-800 font-sans print-card-container"
          >
          
          {/* Intestazione Ente */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {config.nome}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {config.indirizzo} • {config.cap} {config.comune} ({config.provincia})
              </p>
              <p className="text-xs text-slate-600">
                Codice Fiscale: <strong className="text-slate-900">{config.codiceFiscale}</strong>
                {config.partitaIva && ` • P.IVA: ${config.partitaIva}`}
              </p>
              <p className="text-[11px] text-slate-500">
                {config.codiceUnpli && `Adesione UNPLI: ${config.codiceUnpli}`}
                {config.numeroRunts && ` • Iscrizione RUNTS: ${config.numeroRunts}`}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-800">
                {quota.ricevutaNumero}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Data Pagamento: <strong className="text-slate-700">{new Date(quota.dataPagamento).toLocaleDateString('it-IT')}</strong>
              </p>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                Scadenza Quota: <strong>{quota.dataScadenza ? new Date(quota.dataScadenza).toLocaleDateString('it-IT') : `31/12/${quota.anno}`}</strong>
              </p>
            </div>
          </div>

          {/* Titolo Ricevuta */}
          <div className="text-center my-5">
            <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
              Quietanza di Pagamento Quota Associativa
            </h3>
            <p className="text-xs text-slate-500">
              Anno Sociale di Riferimento: <strong className="text-slate-800">{quota.anno}</strong>
            </p>
          </div>

          {/* Dati Socio Ricevente */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 mb-5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Socio Ricevente:</span>
                <span className="font-bold text-slate-900 text-sm">{socio.nome} {socio.cognome}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tessera N°:</span>
                <span className="font-mono font-bold text-emerald-700">{socio.numeroTessera}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Codice Fiscale:</span>
                <span className="font-mono font-semibold text-slate-800">{socio.codiceFiscale}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Qualifica Socio:</span>
                <span className="font-medium text-slate-800">
                  {socio.categoria} {socio.ruoloDirettivo !== 'Nessuno' && `(${socio.ruoloDirettivo})`}
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 text-[10px] uppercase font-semibold mr-1">Indirizzo:</span>
              <span className="text-slate-700">{socio.indirizzo}, {socio.cap} {socio.citta} ({socio.provincia})</span>
            </div>
          </div>

          {/* Importo e Dettaglio */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Descrizione Operazione</th>
                  <th className="p-2.5 text-center">Modalità</th>
                  <th className="p-2.5 text-right">Importo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 text-slate-800">
                    Versamento quota associativa annuale (Anno {quota.anno}) - {config.nome}
                    {quota.note && <div className="text-[11px] text-slate-500 mt-0.5 font-sans italic">Note: {quota.note}</div>}
                  </td>
                  <td className="p-2.5 text-center text-slate-600 font-medium">
                    {quota.metodo}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900 text-sm">
                    {Number(quota.importo).toFixed(2)} €
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-2.5 text-right uppercase tracking-wider text-slate-600">
                    Totale Versato:
                  </td>
                  <td className="p-2.5 text-right text-emerald-800 text-base font-black">
                    {Number(quota.importo).toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Diciture di legge Terzo Settore / ETS */}
          <div className="text-[10px] text-slate-500 leading-relaxed border-l-2 border-emerald-500 pl-3 py-1 mb-6 bg-slate-50/70 rounded-r">
            <p>
              Operazione fuori campo applicazione I.V.A. ai sensi dell'art. 4 del D.P.R. 26/10/1972 n. 633 e successive modificazioni.
            </p>
            <p className="mt-0.5">
              Esente da imposta di bollo ai sensi dell'art. 82, comma 5, del D.Lgs. 3 luglio 2017 n. 117 (Codice del Terzo Settore).
            </p>
          </div>

          {/* Firme */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Firma per quietanza (Tesoriere/Presidente)
              </span>
              <div className="h-10 flex items-center justify-center font-serif italic text-slate-800 text-sm mt-1">
                {config.nomePresidente}
              </div>
              <div className="border-b border-slate-300 w-36 mx-auto"></div>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Firma del Socio
              </span>
              <div className="h-10 flex items-center justify-center font-serif italic text-slate-400 text-sm mt-1">
                {socio.nome} {socio.cognome}
              </div>
              <div className="border-b border-slate-300 w-36 mx-auto"></div>
            </div>
          </div>

          </div>
        </div>

        {/* Barra inferiore fissa in basso con tasto Stampa PDF e Chiudi (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/95 shrink-0 no-print">
          <span className="text-[11px] text-slate-500">
            Quietanza ufficiale quota sociale • Formato A4
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Ricevuta PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
