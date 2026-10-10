import React, { useRef, useState } from 'react';
import { Socio, ProLocoInfo } from '../types';
import { getStatoQuotaSocio } from '../storage';
import { 
  Printer, 
  X, 
  User, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  ShieldCheck, 
  FileDown, 
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';

interface MemberSheetPrintModalProps {
  socio: Socio;
  config: ProLocoInfo;
  annoSelezionato: number;
  onClose: () => void;
}

export const MemberSheetPrintModal: React.FC<MemberSheetPrintModalProps> = ({
  socio,
  config,
  annoSelezionato,
  onClose
}) => {
  const foglioRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const statoQuota = getStatoQuotaSocio(socio, annoSelezionato);
  const isInRegola = statoQuota === 'in_regola';
  const quotaAnno = socio.quote?.find(q => q.anno === annoSelezionato);

  const handleStampaBrowser = () => {
    window.print();
  };

  const handleScaricaPDF = async () => {
    if (!foglioRef.current) return;
    setGenerandoPDF(true);
    const nomeFile = `Scheda_Socio_${socio.cognome}_${socio.nome}_${socio.numeroTessera}.pdf`;
    await esportaElementoInPDF(foglioRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* Contenitore Modale */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[94vh] flex flex-col relative overflow-hidden print:max-h-none print:h-auto print:m-0 print:p-0 print:shadow-none print:border-none print:overflow-visible print:block">
        
        {/* Barra di comando fissa in alto (nascosta in stampa) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block leading-tight">
                Scheda Anagrafica e Documentale del Socio (A4)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {socio.cognome} {socio.nome} • Tessera N° {socio.numeroTessera}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pulsante Esporta PDF Diretto */}
            <button
              id="btn-scarica-scheda-socio-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica direttamente il file PDF sul dispositivo"
            >
              {generandoPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{generandoPDF ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            {/* Pulsante Stampa di Sistema */}
            <button
              id="btn-stampa-scheda-socio-browser"
              onClick={handleStampaBrowser}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Apri finestra di stampa o Salva come PDF"
            >
              <Printer className="w-3.5 h-3.5" />
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
          
          {/* FOGLIO A4 STAMPABILE */}
          <div 
            ref={foglioRef}
            className="border border-slate-300 p-6 sm:p-8 rounded-xl bg-white text-slate-800 font-sans text-xs space-y-5 max-w-2xl mx-auto shadow-xs print:border-none print:p-0 print:shadow-none print:max-w-none"
          >
            {/* Intestazione Ente Pro Loco */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  {config.nome}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Associazione Turistica di Promozione Sociale • Terzo Settore (RUNTS)
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Sede: {config.indirizzo}, {config.cap} {config.comune} ({config.provincia})
                </p>
                <p className="text-[10px] text-slate-500">
                  C.F.: <strong className="text-slate-700">{config.codiceFiscale}</strong>
                  {config.partitaIva ? ` • P.IVA: ${config.partitaIva}` : ''}
                  {config.codiceUnpli ? ` • UNPLI: ${config.codiceUnpli}` : ''}
                </p>
                <p className="text-[10px] text-slate-500">
                  Email: {config.email} • Tel: {config.telefono}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block border-2 border-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-center">
                  <span className="block text-[9px] font-bold text-emerald-800 uppercase tracking-widest">
                    Tessera N°
                  </span>
                  <span className="text-base font-black text-emerald-950 font-mono">
                    {socio.numeroTessera}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  Iscritto dal: <strong>{socio.dataIscrizione}</strong>
                </div>
              </div>
            </div>

            {/* Titolo Documento */}
            <div className="text-center py-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 inline-block px-4">
                Scheda Anagrafica & Domanda di Iscrizione Socio
              </h2>
            </div>

            {/* Dati Anagrafici del Socio */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                1. Dati Anagrafici e di Residenza
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Cognome</span>
                  <span className="font-bold text-slate-900 text-xs">{socio.cognome}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Nome</span>
                  <span className="font-bold text-slate-900 text-xs">{socio.nome}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Codice Fiscale</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{socio.codiceFiscale}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Data di Nascita</span>
                  <span className="text-slate-800">{socio.dataNascita || 'Non specificata'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Luogo di Nascita</span>
                  <span className="text-slate-800">{socio.luogoNascita || 'Non specificato'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Residenza</span>
                  <span className="text-slate-800">{socio.indirizzo}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Comune e Prov.</span>
                  <span className="text-slate-800">{socio.citta} ({socio.provincia}) - {socio.cap}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Telefono / Cellulare</span>
                  <span className="font-semibold text-slate-800">{socio.telefono || 'Non specificato'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Email</span>
                  <span className="text-slate-800 truncate block">{socio.email || 'Non specificata'}</span>
                </div>
              </div>
            </div>

            {/* Posizione Associativa e Ruolo */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                2. Inquadramento Associativo & Stato Quota {annoSelezionato}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Categoria Socio</span>
                  <span className="font-bold text-emerald-800">{socio.categoria}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Carica nel Direttivo</span>
                  <span className="font-semibold text-slate-800">{socio.ruoloDirettivo || 'Nessuna'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Stato Quota {annoSelezionato}</span>
                  <span className={`font-bold flex items-center gap-1 ${isInRegola ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isInRegola ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                        In Regola
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-600 inline" />
                        In Attesa di Rinnovo
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block uppercase">Ricevuta Anno Corrente</span>
                  <span className="font-mono text-slate-800">{quotaAnno?.ricevutaNumero || 'Non emessa'}</span>
                </div>
              </div>
            </div>

            {/* Competenze Volontariato */}
            {socio.competenze && socio.competenze.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  3. Disponibilità & Ambiti Operativi
                </h3>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                  {socio.competenze.map((comp, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700 font-medium">
                      ✓ {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Storico Versamento Quote Sociali */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                4. Storico Quote Associative Versate
              </h3>
              {socio.quote && socio.quote.length > 0 ? (
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1 px-2.5">Anno Sociale</th>
                        <th className="py-1 px-2.5">Importo</th>
                        <th className="py-1 px-2.5">Data Pagamento</th>
                        <th className="py-1 px-2.5">Scadenza</th>
                        <th className="py-1 px-2.5">N° Ricevuta</th>
                        <th className="py-1 px-2.5">Metodo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {socio.quote.map((q) => (
                        <tr key={q.id}>
                          <td className="py-1 px-2.5 font-bold text-slate-900">{q.anno}</td>
                          <td className="py-1 px-2.5 font-semibold text-emerald-800">{q.importo} €</td>
                          <td className="py-1 px-2.5 text-slate-600">{q.dataPagamento}</td>
                          <td className="py-1 px-2.5 text-emerald-800 font-medium">
                            {q.dataScadenza ? new Date(q.dataScadenza).toLocaleDateString('it-IT') : `31/12/${q.anno}`}
                          </td>
                          <td className="py-1 px-2.5 font-mono text-slate-700">{q.ricevutaNumero || '-'}</td>
                          <td className="py-1 px-2.5 text-slate-600 capitalize">{q.metodo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic p-2">Nessuna quota registrata a sistema.</p>
              )}
            </div>

            {/* Dichiarazioni di Rito e Privacy */}
            <div className="text-[9px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed space-y-1">
              <p>
                <strong>Dichiarazione del Socio:</strong> Il sottoscritto dichiara di condividere le finalità dell'Associazione Pro Loco, di impegnarsi ad osservare lo Statuto sociale e i regolamenti interni e di versare la quota sociale annua stabilita dall'Assemblea.
              </p>
              <p>
                <strong>Trattamento Dati:</strong> Autorizza il trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR) per gli scopi istituzionali e promozionali legati all'attività associativa.
              </p>
            </div>

            {/* Riquadro Firme e Timbro */}
            <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[9.5px] text-slate-500 block">Luogo e Data</span>
                <span className="font-semibold text-slate-800 text-[11px] mt-1 block">
                  {config.comune}, {new Date().toLocaleDateString('it-IT')}
                </span>
              </div>

              <div>
                <span className="text-[9.5px] text-slate-500 block">Firma del Socio</span>
                <div className="h-10 border-b border-dotted border-slate-400 mt-1 flex items-end justify-center">
                  <span className="text-xs font-serif italic text-slate-600">
                    {socio.nome} {socio.cognome}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9.5px] text-slate-500 block">Per la Pro Loco (Il Presidente)</span>
                <div className="h-10 border-b border-dotted border-slate-400 mt-1 flex items-end justify-center">
                  <span className="text-xs font-serif italic text-emerald-800 font-bold">
                    {config.nomePresidente}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
