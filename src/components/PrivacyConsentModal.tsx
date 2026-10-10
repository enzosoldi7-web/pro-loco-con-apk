import React, { useRef, useState } from 'react';
import { Socio, ProLocoInfo } from '../types';
import { Printer, X, ShieldCheck, FileDown, Loader2 } from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';

interface PrivacyConsentModalProps {
  socio: Socio;
  config: ProLocoInfo;
  onClose: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  socio,
  config,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleScaricaPDF = async () => {
    if (!printRef.current) return;
    setGenerandoPDF(true);
    const nomeFile = `Consenso_Privacy_GDPR_${socio.cognome}_${socio.nome}.pdf`;
    await esportaElementoInPDF(printRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  const dataDocumento = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* Contenitore principale con altezza vincolata al monitor */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[94vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden print:max-h-none print:h-auto print:m-0 print:p-0 print:shadow-none print:border-none print:overflow-visible print:block">
        
        {/* Barra di comando superiore fissa in alto (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0 no-print">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Delibera & Consenso Trattamento Dati (GDPR)
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Socio: <strong className="text-slate-800">{socio.nome} {socio.cognome}</strong> (Tessera N° {socio.numeroTessera})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-scarica-delibera-privacy-pdf"
              type="button"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica direttamente il file PDF sul tuo computer"
            >
              {generandoPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-blue-700" />
              )}
              <span>{generandoPDF ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              id="btn-stampa-delibera-privacy-top"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Stampa o Salva come PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / Salva PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo modale con scorrimento interno fluido entro i confini dello schermo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:overflow-visible print:p-0 print:bg-white print:h-auto print:block">
          
          {/* FOGLIO DELLA DELIBERA (STAMPABILE IN FORMATO A4) */}
          <div 
            ref={printRef}
            className="bg-white p-6 sm:p-10 border border-slate-300 rounded-xl text-slate-800 font-sans text-xs leading-relaxed max-w-3xl mx-auto shadow-xs print:border-none print:p-0 print:shadow-none print:max-w-none print:text-black print:rounded-none"
          >
          
          {/* Intestazione Associazione */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-5">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">
                {config.codiceUnpli ? `UNPLI • Codice ${config.codiceUnpli}` : 'ASSOCIAZIONE PRO LOCO (ETS)'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {config.nome}
              </h2>
              <p className="text-[11px] text-slate-600 mt-1">
                Sede Legale: {config.indirizzo || 'Sede Sociale'} - {config.cap} {config.comune} ({config.provincia})<br />
                C.F. {config.codiceFiscale} {config.partitaIva ? `• P.IVA ${config.partitaIva}` : ''} {config.numeroRunts ? `• RUNTS: ${config.numeroRunts}` : ''}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="border border-slate-300 rounded-md px-3 py-1.5 bg-slate-50 text-[11px] font-mono">
                <span className="text-slate-500 block text-[9px]">TESSERA SOCIO N°</span>
                <span className="font-bold text-slate-900">{socio.numeroTessera}</span>
              </div>
            </div>
          </div>

          {/* Titolo Documento */}
          <div className="text-center my-4">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide">
              Delibera di Consenso al Trattamento dei Dati Personali
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Ai sensi degli artt. 13 e 14 del Regolamento Generale sulla Protezione dei Dati (UE) 2016/679 (GDPR)
            </p>
          </div>

          {/* Dati Anagrafici del Socio con eventuale fototessera */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 my-4 text-[11.5px] flex items-start gap-4">
            {socio.foto && (
              <div className="shrink-0">
                <img 
                  src={socio.foto} 
                  alt={`${socio.nome} ${socio.cognome}`} 
                  className="w-16 h-20 rounded-md object-cover border border-slate-300"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-slate-900 mb-2">
                Il/La sottoscritto/a:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
                <div><strong>Cognome e Nome:</strong> {socio.cognome} {socio.nome}</div>
                <div><strong>Codice Fiscale:</strong> <span className="font-mono">{socio.codiceFiscale}</span></div>
                <div><strong>Nato/a a:</strong> {socio.luogoNascita || '__________'} il {socio.dataNascita || '__/__/____'}</div>
                <div><strong>Residente in:</strong> {socio.indirizzo || '__________'}, {socio.cap} {socio.citta || socio.comune} ({socio.provincia})</div>
                <div><strong>Telefono:</strong> {socio.telefono || '__________'}</div>
                <div><strong>Email:</strong> {socio.email || '__________'}</div>
              </div>
            </div>
          </div>

          {/* Testo dell'Informativa Istituzionale */}
          <div className="space-y-3 text-[11px] text-slate-700 text-justify">
            <p>
              In qualità di socio aderente alla <strong>{config.nome}</strong> (d'ora in avanti "Associazione" o "Titolare del trattamento"), con la presente dichiara di aver ricevuto e preso visione dell'informativa resa ai sensi dell'art. 13 del Regolamento UE 2016/679.
            </p>
            <p>
              I dati personali forniti sono trattati nel rispetto della normativa per l'iscrizione all'Albo/Libro Soci, la gestione amministrativa delle quote associative, l'attivazione della copertura assicurativa istituzionale UNPLI/Terzo Settore, la convocazione delle assemblee dei soci e la partecipazione a tutte le attività statutarie promosse dall'Associazione.
            </p>
          </div>

          {/* Opzioni di Consenso Esplicito */}
          <div className="my-5 border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3 text-[11px]">
            <p className="font-bold text-slate-900">
              In merito ai trattamenti specifici connessi alla vita associativa, il sottoscritto dichiara di:
            </p>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="font-mono text-sm leading-none">[X]</span>
                <div>
                  <strong>Finalità associative, statutarie e assicurative:</strong> Presta il consenso al trattamento dei dati anagrafici e di contatto per la corretta tenuta del Libro Soci e per l'adempimento degli obblighi di legge, statutari e assicurativi.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-sm leading-none">[X]</span>
                <div>
                  <strong>Comunicazioni informative ed eventi:</strong> Presta il consenso alla ricezione di comunicazioni sociali, inviti a manifestazioni, iniziative culturali e assemblee via posta, email o messaggistica istantanea (WhatsApp/SMS).
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-sm leading-none">[X]</span>
                <div>
                  <strong>Liberatoria Immagini & Riprese Video:</strong> Autorizza a titolo gratuito la pubblicazione di immagini fotografiche o filmati realizzati durante eventi e manifestazioni pubbliche della Pro Loco per canali istituzionali (sito web, canali social, bacheca sociale), nel pieno rispetto del decoro e della dignità personale.
                </div>
              </div>
            </div>
          </div>

          {/* Diritti dell'interessato */}
          <p className="text-[10px] text-slate-500 italic text-justify mb-6">
            Si rammenta che ai sensi degli artt. 15-22 del Regolamento UE 2016/679, il socio ha diritto in qualsiasi momento di accedere ai propri dati, richiederne la rettifica, la cancellazione, la limitazione o opporsi al loro trattamento inviando formale richiesta alla sede dell'Associazione o all'indirizzo email {config.email || 'segreteria della Pro Loco'}.
          </p>

          {/* Riquadro Firme */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs">
            <div>
              <p className="text-slate-600">
                Luogo e Data:<br />
                <span className="font-semibold text-slate-900">{config.comune}, {dataDocumento}</span>
              </p>
              <div className="mt-8 pt-2 border-t border-slate-400 text-[11px] text-slate-600 text-center">
                Firma del Presidente / Titolare del Trattamento
                <br />
                <span className="font-medium text-slate-800 italic">({config.nomePresidente || 'Il Presidente p.t.'})</span>
              </div>
            </div>

            <div>
              <p className="text-slate-600 text-right">
                Stato Consenso Privacy: 
                <span className="font-bold text-green-700 ml-1">ACQUISITO</span>
              </p>
              <div className="mt-8 pt-2 border-t border-slate-400 text-[11px] text-slate-600 text-center">
                Firma leggibile del Socio
                <br />
                <span className="font-semibold text-slate-900">({socio.nome} {socio.cognome})</span>
              </div>
            </div>
          </div>

          </div>
        </div>

        {/* Barra inferiore fissa in basso con tasto Stampa PDF e Chiudi (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0 no-print">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Documento conforme Reg. UE 2016/679 (GDPR) • Formato A4</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Chiudi
            </button>
            <button
              id="btn-stampa-delibera-privacy-bottom"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Stampa PDF (A4)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
