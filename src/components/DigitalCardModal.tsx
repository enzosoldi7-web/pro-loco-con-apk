import React, { useState, useEffect, useRef } from 'react';
import { Socio, ProLocoInfo } from '../types';
import { getStatoQuotaSocio, buildSyncedMemberPortalUrl, syncDatabaseToServer } from '../storage';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  ShieldCheck, 
  Building2, 
  Sparkles,
  Calendar,
  CreditCard,
  User,
  FileDown,
  FileText,
  Loader2,
  Send,
  Globe
} from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';

interface DigitalCardModalProps {
  socio: Socio | null;
  config: ProLocoInfo;
  annoSelezionato: number;
  onClose: () => void;
  onRinnovaQuota: (socio: Socio) => void;
  onApriSchedaSocio?: (socio: Socio) => void;
  onInviaLinkPortale?: (socio: Socio) => void;
  solaLetturaSocio?: boolean;
}

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({
  socio,
  config,
  annoSelezionato,
  onClose,
  onRinnovaQuota,
  onApriSchedaSocio,
  onInviaLinkPortale,
  solaLetturaSocio = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiato, setCopiato] = useState(false);
  const [mostraVerifica, setMostraVerifica] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleScaricaPDF = async () => {
    if (!cardRef.current || !socio) return;
    setGenerandoPDF(true);
    const nomeFile = `Tessera_${socio.cognome}_${socio.nome}_${annoSelezionato}.pdf`;
    await esportaElementoInPDF(cardRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  useEffect(() => {
    if (!socio) return;
    let cancelled = false;
    
    const portalLink = buildSyncedMemberPortalUrl(socio, config, annoSelezionato, true);

    QRCode.toDataURL(portalLink, {
      width: 240,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    })
      .then(url => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(err => console.error('Errore generazione QR Code:', err));

    return () => {
      cancelled = true;
    };
  }, [socio?.id, socio?.numeroTessera, socio?.pin, config.nome, annoSelezionato]);

  if (!socio) return null;

  const statoQuota = getStatoQuotaSocio(socio, annoSelezionato);
  const quotaAnno = socio.quote?.find(q => q.anno === annoSelezionato);
  const isInRegola = statoQuota === 'in_regola';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    syncDatabaseToServer();
    const link = buildSyncedMemberPortalUrl(socio, config, annoSelezionato, false);
    navigator.clipboard.writeText(link).then(() => {
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible print:block">
      
      {/* Contenitore Modale */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 my-8 relative animate-in fade-in zoom-in-95 duration-150 print:m-0 print:p-6 print:shadow-none print:border-none print:max-w-none print:w-auto">
        
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tessera Digitale del Socio
              </h2>
              <p className="text-xs text-slate-500">
                Anno sociale {annoSelezionato} • Tessera N° {socio.numeroTessera}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avviso se non in regola */}
        {!isInRegola && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 no-print">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Quota associativa per l'anno <strong>{annoSelezionato}</strong> non ancora registrata.
              </span>
            </div>
            {!solaLetturaSocio && (
              <button
                onClick={() => onRinnovaQuota(socio)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 shadow-2xs"
              >
                Registra Quota
              </button>
            )}
          </div>
        )}

        {/* ANTEPRIMA TESSERA (FRONTE / RETRO) */}
        <div className="my-6 flex justify-center">
          <div 
            ref={cardRef}
            className="w-full max-w-[440px] aspect-[1.58/1] perspective-1000 print-card-container"
          >
            {!isFlipped ? (
              /* FRONTE DELLA TESSERA */
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white p-5 shadow-xl border border-emerald-600/40 relative flex flex-col justify-between overflow-hidden">
                
                {/* Elementi decorativi di sfondo */}
                <div className="absolute -right-12 -top-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Micro pattern tricolore italiano discreto */}
                <div className="absolute top-0 left-0 right-0 h-1 flex">
                  <div className="w-1/3 bg-emerald-500" />
                  <div className="w-1/3 bg-white" />
                  <div className="w-1/3 bg-rose-500" />
                </div>

                {/* Header Tessera */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold tracking-widest text-emerald-300 uppercase block">
                        UNPLI • Pro Loco d'Italia
                      </span>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        {config.nome}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black tracking-wider">
                      {annoSelezionato}
                    </div>
                  </div>
                </div>

                {/* Centro Tessera: Foto del Socio, Dati Anagrafici e QR Code */}
                <div className="relative z-10 my-auto py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Fototessera ufficiale del Socio */}
                    <div className="shrink-0">
                      {socio.foto ? (
                        <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 border-amber-300/80 shadow-md bg-slate-900">
                          <img 
                            src={socio.foto} 
                            alt={`${socio.nome} ${socio.cognome}`} 
                            className="w-full h-full object-cover object-center" 
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-lg border-2 border-white/25 bg-emerald-950/70 flex flex-col items-center justify-center text-emerald-200/80 shadow-inner">
                          <User className="w-6 h-6 mb-0.5 text-emerald-300" />
                          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-300">Foto</span>
                        </div>
                      )}
                    </div>

                    {/* Dati del Socio */}
                    <div className="min-w-0">
                      <span className="text-[9.5px] text-emerald-200/80 uppercase tracking-wider font-semibold block truncate">
                        Socio {socio.categoria}
                        {socio.ruoloDirettivo !== 'Nessuno' && ` • ${socio.ruoloDirettivo}`}
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-xs truncate">
                        {socio.nome} {socio.cognome}
                      </h4>
                      <p className="text-[10.5px] font-mono text-emerald-100/90 tracking-wide mt-0.5">
                        {socio.codiceFiscale}
                      </p>
                    </div>
                  </div>

                  {/* QR Code Scansionabile */}
                  <div className="bg-white p-1 rounded-lg shadow-md shrink-0 border border-emerald-900/40">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code Tessera" 
                        className="w-14 h-14 sm:w-16 sm:h-16" 
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-slate-400 text-[9px]">
                        QR Code
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Tessera */}
                <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/15 text-[10px]">
                  <div>
                    <span className="text-slate-400 block text-[9px]">NUMERO TESSERA</span>
                    <span className="font-mono font-bold text-amber-300 text-xs tracking-wider">
                      {socio.numeroTessera}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isInRegola ? (
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        VALIDA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        DA RINNOVARE
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px]">DATA EMISSIONE</span>
                    <span className="text-slate-200 font-medium">
                      {quotaAnno?.dataPagamento || socio.dataIscrizione}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              /* RETRO DELLA TESSERA */
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 shadow-xl border border-slate-700 relative flex flex-col justify-between">
                
                {/* Header Retro */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div className="text-left">
                    <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                      Regolamento & Note Associative
                    </h5>
                    <p className="text-[9px] text-slate-400">
                      {config.nome} • C.F. {config.codiceFiscale}
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>

                {/* Corpo del Retro */}
                <div className="text-[9.5px] text-slate-300 leading-relaxed space-y-1.5 py-1">
                  <p>
                    • La presente tessera è strettamente personale e non cedibile a terzi.
                  </p>
                  <p>
                    • Attesta lo status di socio della Pro Loco e consente l'accesso a convenzioni, assemblee e attività sociali.
                  </p>
                  <p>
                    • Residenza: {socio.indirizzo}, {socio.cap} {socio.citta} ({socio.provincia})
                  </p>
                  <p>
                    • Contatti Pro Loco: {config.email} • Tel. {config.telefono}
                  </p>
                </div>

                {/* Firme e validazione */}
                <div className="pt-2 border-t border-slate-700 flex items-end justify-between">
                  <div>
                    <span className="text-[8.5px] text-slate-400 block uppercase">Firma del Presidente</span>
                    <span className="text-xs font-serif italic text-emerald-200">
                      {config.nomePresidente}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] text-slate-400 block uppercase">Firma del Socio</span>
                    <span className="text-xs font-serif italic text-slate-400">
                      {socio.nome} {socio.cognome}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Box Invio Link Portale Web dei Soci */}
        {onInviaLinkPortale && (
          <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-teal-950 no-print">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-4 h-4 text-emerald-50" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Portale Web dei Soci</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                    Area Riservata
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  Il socio può consultare online la tessera con QR, le quote, le ricevute e gli avvisi
                </div>
              </div>
            </div>
            <button
              id="btn-box-invia-link-portale"
              onClick={() => onInviaLinkPortale(socio)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs shrink-0 shadow-2xs cursor-pointer transition-colors"
              title="Apri pannello di invio link al socio per consultare il Portale"
            >
              <Send className="w-3.5 h-3.5 text-teal-100" />
              <span>Invia Link per Socio</span>
            </button>
          </div>
        )}

        {/* Controlli Interazione Tessera */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 no-print">
          
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'Mostra Fronte' : 'Mostra Retro'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostraVerifica(!mostraVerifica)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Verifica Validità</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Copia link della tessera"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiato ? 'Copiato!' : 'Condividi'}</span>
            </button>

            {onApriSchedaSocio && socio && (
              <button
                onClick={() => {
                  onClose();
                  onApriSchedaSocio(socio);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                title="Apri e stampa la scheda anagrafica A4 completa del socio"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Scheda Socio A4</span>
              </button>
            )}

            <button
              id="btn-scarica-tessera-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-300 cursor-pointer disabled:opacity-50"
              title="Scarica la tessera in formato PDF"
            >
              {generandoPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{generandoPDF ? 'Generazione...' : 'Scarica PDF'}</span>
            </button>

            <button
              id="btn-stampa-tessera"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Stampa con finestra di sistema o Salva in PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa / PDF</span>
            </button>
          </div>

        </div>

        {/* Finestra Dettagli Verifica Online */}
        {mostraVerifica && (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 no-print animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Certificato Digitale di Validità UNPLI Pro Loco
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date().toLocaleDateString('it-IT')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">STATO TESSERAMENTO</span>
                <span className={`font-bold ${isInRegola ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isInRegola ? '● REGOLARMENTE ISCRITTO' : '● QUOTA IN SOSPESO'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ANNO DI COMPETENZA</span>
                <span className="font-semibold text-slate-800">{annoSelezionato}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DATA ISCRIZIONE ALBO</span>
                <span className="font-medium text-slate-800">{socio.dataIscrizione}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ULTIMA RICEVUTA</span>
                <span className="font-mono text-slate-800">{quotaAnno?.ricevutaNumero || 'Nessuna'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
