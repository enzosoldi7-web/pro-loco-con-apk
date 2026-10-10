import React, { useState, useRef } from 'react';
import { DonazioneTerzi, ProLocoInfo } from '../types';
import { 
  Printer, 
  X, 
  HeartHandshake, 
  ShieldCheck, 
  Award, 
  FileText, 
  Mail, 
  Check, 
  Copy, 
  Landmark, 
  Building2, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { numeroInLettere } from '../utils/italianWords';

interface DonazioneRicevutaModalProps {
  donazione: DonazioneTerzi;
  config: ProLocoInfo;
  onClose: () => void;
}

type TabDocumento = 'quietanza' | 'benemerenza' | 'lettera' | 'email';

export const DonazioneRicevutaModal: React.FC<DonazioneRicevutaModalProps> = ({
  donazione,
  config,
  onClose
}) => {
  const [tabAttiva, setTabAttiva] = useState<TabDocumento>('quietanza');
  const [copiato, setCopiato] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const importoInLettere = numeroInLettere(donazione.importo);

  // Email template per il donatore
  const testoEmail = `Gentile ${donazione.donatore},

a nome dell'Associazione Turistica Pro Loco "${config.nome}", del Consiglio Direttivo e di tutti i volontari, desidero esprimerLe la nostra più sincera gratitudine per la generosa donazione di € ${donazione.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ricevuta in data ${donazione.data}.

Il Suo prezioso contributo (Quietanza N. ${donazione.ricevutaNumero}) sarà destinato a sostenere:
${donazione.destinazione || 'Attività Statutarie e Valorizzazione del Territorio'}
Causale: ${donazione.causale}

${donazione.detraibileFiscale ? `--- ATTESTAZIONE AGEVOLAZIONE FISCALE EX ART. 83 CTS ---
In quanto erogazione liberale versata con metodo di pagamento tracciabile (${donazione.metodo}${donazione.estremiTracciabilita ? ` - ${donazione.estremiTracciabilita}` : ''}), la donazione è:
• Detraibile dall'IRPEF per le persone fisiche nella misura del 30% (fino a 30.000 € annui)
• Oppure deducibile dal reddito complessivo netto nel limite del 10% (per persone fisiche, enti e imprese).
Conservi la ricevuta allegata per la prossima dichiarazione dei redditi (Modello 730 / Modello Redditi).` : ''}

Grazie di cuore per essere al fianco della nostra comunità e delle nostre tradizioni.

Cordiali saluti,
${config.nomePresidente}
Presidente Pro Loco ${config.nome}
${config.email} • Tel: ${config.telefono}
Codice Fiscale: ${config.codiceFiscale} ${config.numeroRunts ? `• Iscrizione RUNTS: ${config.numeroRunts}` : ''}
${config.sitoWeb}`;

  const handleCopiaEmail = () => {
    navigator.clipboard.writeText(testoEmail);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[94vh]">
        
        {/* BARRA SUPERIORE STRUMENTI & TAB (NON STAMPABILE) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Documentazione Ufficiale Donazione</h3>
              <p className="text-[11px] text-slate-400">Quietanza N° {donazione.ricevutaNumero} • {donazione.donatore}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa / Salva PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELETTORE FORMATI DOCUMENTALI (TABS) */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-print shrink-0">
          <button
            onClick={() => setTabAttiva('quietanza')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tabAttiva === 'quietanza'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>1. Quietanza Fiscale A4 (Art. 83 CTS)</span>
          </button>

          <button
            onClick={() => setTabAttiva('benemerenza')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tabAttiva === 'benemerenza'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Diploma di Benemerenza d'Onore</span>
          </button>

          <button
            onClick={() => setTabAttiva('lettera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tabAttiva === 'lettera'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>3. Lettera di Ringraziamento del Presidente</span>
          </button>

          <button
            onClick={() => setTabAttiva('email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tabAttiva === 'email'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Bozza Comunicazione Email / PEC</span>
          </button>
        </div>

        {/* CONTENITORE PRINCIPALE STAMPABILE */}
        <div ref={printRef} className="overflow-y-auto p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0">
          
          {/* ======================================================== */}
          {/* 1. QUIETANZA FISCALE UFFICIALE A4 EX ART. 83 CTS        */}
          {/* ======================================================== */}
          {tabAttiva === 'quietanza' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 sm:p-10 max-w-3xl mx-auto space-y-6 text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
              
              {/* Intestazione Istituzionale Ente Beneficiario */}
              <div className="border-b-2 border-emerald-800 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                      Associazione Turistica Pro Loco
                    </span>
                    {config.codiceUnpli && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        {config.codiceUnpli}
                      </span>
                    )}
                    {config.numeroRunts && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                        Iscritta RUNTS: {config.numeroRunts}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-1">
                    {config.nome.toUpperCase()}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {config.indirizzo} • {config.cap} {config.comune} ({config.provincia})
                  </p>
                  <p className="text-xs text-slate-600">
                    Codice Fiscale: <strong>{config.codiceFiscale}</strong> {config.partitaIva ? `• P. IVA: ${config.partitaIva}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Email: {config.email} • PEC: {config.pec || 'proloco@pec.it'} • Tel: {config.telefono} • Sito: {config.sitoWeb}
                  </p>
                  {config.iban && (
                    <p className="text-[10.5px] font-mono text-slate-500">
                      IBAN Tesoreria: {config.iban} ({config.banca || 'Istituto di Credito'})
                    </p>
                  )}
                </div>

                <div className="border-2 border-emerald-700 bg-emerald-50/70 p-3 rounded-xl text-center shrink-0 min-w-[170px]">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider block">
                    Ricevuta Fiscale Erogazione
                  </span>
                  <span className="text-base font-black text-emerald-950 font-mono block mt-0.5">
                    N° {donazione.ricevutaNumero}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 block mt-1">
                    Data: {donazione.data}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Esercizio {donazione.anno}
                  </span>
                </div>
              </div>

              {/* Titolo Ricevuta */}
              <div className="text-center py-2 bg-slate-100/70 border border-slate-200 rounded-lg">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Quietanza di Erogazione Liberale in Denaro
                </h2>
                <p className="text-[10.5px] text-slate-600">
                  (Rilasciata ai sensi e per gli effetti dell'Articolo 83 del D.Lgs. 3 luglio 2017, n. 117 - Codice del Terzo Settore)
                </p>
              </div>

              {/* Corpo Ricevuta */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                <p>
                  L'Associazione Turistica Pro Loco <strong>{config.nome}</strong> (Ente del Terzo Settore iscritto nel RUNTS) attesta di aver ricevuto a titolo di <strong>erogazione liberale</strong> la somma di:
                </p>

                {/* Box Importo Cifre e Lettere */}
                <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10.5px] font-bold text-emerald-900 uppercase tracking-wider block">Importo Erogato:</span>
                    <span className="text-xs font-semibold text-emerald-950">In lettere: <em>{importoInLettere}</em> Euro</span>
                  </div>
                  <span className="text-2xl font-black font-mono text-emerald-950">
                    € {donazione.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Dati del Donatore e Tracciabilità */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Soggetto Erogatore:</span>
                    <span className="col-span-2 font-black text-slate-900">{donazione.donatore}</span>
                  </div>

                  {donazione.codiceFiscalePartitaIva && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-bold text-slate-600">Codice Fiscale / P.IVA:</span>
                      <span className="col-span-2 font-mono font-bold text-slate-900">{donazione.codiceFiscalePartitaIva}</span>
                    </div>
                  )}

                  {(donazione.indirizzoDonatore || donazione.cittaDonatore) && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-bold text-slate-600">Sede / Residenza:</span>
                      <span className="col-span-2 text-slate-800">
                        {donazione.indirizzoDonatore ? `${donazione.indirizzoDonatore}, ` : ''}
                        {donazione.capDonatore ? `${donazione.capDonatore} ` : ''}
                        {donazione.cittaDonatore || ''}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Causale Contabile:</span>
                    <span className="col-span-2 text-slate-800 font-medium">{donazione.causale}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Destinazione Vincolata:</span>
                    <span className="col-span-2 text-emerald-900 font-bold">
                      {donazione.destinazione || 'Attività Statutarie Generali'}
                      {donazione.eventoCollegatoTitolo ? ` (Evento: ${donazione.eventoCollegatoTitolo})` : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Modalità di Pagamento:</span>
                    <span className="col-span-2 font-semibold text-slate-900">
                      {donazione.metodo}
                      {donazione.estremiTracciabilita ? ` (${donazione.estremiTracciabilita})` : ''}
                    </span>
                  </div>

                  {donazione.deliberaConsiglio && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-bold text-slate-600">Atto di Delibera:</span>
                      <span className="col-span-2 text-slate-700 italic">{donazione.deliberaConsiglio}</span>
                    </div>
                  )}
                </div>

                {/* Quadro Normativo e Regime Agevolativo Art. 83 CTS */}
                <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-[11px] space-y-1.5 text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Attestazione di Tracciabilità e Benefici Fiscali per il Donatore:</span>
                  </div>
                  <p className="leading-relaxed">
                    Si dichiara che la presente erogazione liberale è stata eseguita mediante <strong>strumento di pagamento tracciabile</strong> (bancario, postale o circuito elettronico convenzionato) ai sensi dell'art. 83, commi 1 e 2 del D.Lgs. n. 117/2017 (Codice del Terzo Settore). 
                    L'importo costituisce:
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li><strong>Per le persone fisiche:</strong> onere detraibile dall'IRPEF nella misura del 30% (fino a un importo massimo erogato di € 30.000 annui), ovvero deducibile dal reddito complessivo netto dichiarato nel limite del 10%.</li>
                    <li><strong>Per enti e società d'impresa:</strong> onere deducibile dal reddito complessivo netto nel limite del 10% del reddito dichiarato.</li>
                  </ul>
                </div>
              </div>

              {/* Firme, Luogo e Timbro */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Luogo e Data</span>
                  <span className="font-semibold text-slate-800 block mt-3">
                    {config.comune} ({config.provincia}), {donazione.data}
                  </span>
                </div>

                <div className="relative">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Il Presidente Legale Rappresentante</span>
                  <span className="font-bold text-slate-900 block mt-1 text-sm">{config.nomePresidente}</span>
                  
                  {/* Timbro Pro Loco stilizzato */}
                  <div className="mx-auto mt-2 w-28 h-12 rounded-full border-2 border-emerald-800/60 border-dashed flex flex-col items-center justify-center text-[9px] font-serif text-emerald-900 font-bold uppercase tracking-tighter opacity-80 rotate-[-2deg]">
                    <span>Pro Loco {config.nome}</span>
                    <span className="text-[7.5px] font-sans">Timbro e Firma</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">(Firma autografa per quietanza)</span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 2. DIPLOMA DI BENEMERENZA D'ONORE (PERGAMENA SOSTENITORE) */}
          {/* ======================================================== */}
          {tabAttiva === 'benemerenza' && (
            <div className="bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 rounded-xl shadow-xs border-4 border-double border-amber-600/80 p-8 sm:p-12 max-w-3xl mx-auto text-slate-900 font-serif text-center space-y-6 print:border-amber-700 print:shadow-none print:p-8">
              
              {/* Intestazione Araldica */}
              <div className="space-y-1 border-b border-amber-300/80 pb-4">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-sans font-black tracking-widest uppercase">
                    Associazione Turistica Pro Loco {config.nome}
                  </span>
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-[10.5px] text-slate-600 font-sans">
                  Costituita a tutela delle tradizioni, della cultura e del patrimonio paesaggistico
                </p>
              </div>

              {/* Titolo Diploma */}
              <div className="py-2">
                <h2 className="text-2xl sm:text-3xl font-black text-amber-950 uppercase tracking-wider font-serif">
                  Diploma di Benemerenza & Riconoscenza
                </h2>
                <div className="w-24 h-0.5 bg-amber-600 mx-auto my-2"></div>
                <p className="text-xs italic text-slate-700 font-serif">
                  Il Consiglio Direttivo dell'Associazione, con delibera unanime, conferisce con gratitudine il titolo onorifico di
                </p>
                <div className="my-3 py-2 px-6 bg-amber-100/70 border border-amber-300 rounded-full inline-block">
                  <span className="text-sm font-black text-amber-950 uppercase tracking-widest">
                    ★ Sostenitore Benemerito della Pro Loco ★
                  </span>
                </div>
              </div>

              {/* Destinatario */}
              <div className="py-2">
                <p className="text-xs font-sans uppercase tracking-widest text-slate-500">Conferito a</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 font-serif mt-1">
                  {donazione.donatore}
                </h3>
                {donazione.codiceFiscalePartitaIva && (
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    C.F. / P.IVA: {donazione.codiceFiscalePartitaIva}
                  </p>
                )}
              </div>

              {/* Motivazione solenne */}
              <div className="max-w-xl mx-auto text-xs sm:text-sm text-slate-800 leading-relaxed font-serif italic border-y border-amber-200 py-4">
                "Per la generosità, la sensibilità civica e il costante sostegno economico offerto alla nostra Pro Loco con l'erogazione di Euro {donazione.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}, rendendo possibile la realizzazione delle iniziative culturali, ambientali e comunitarie a favore di tutto il nostro territorio."
              </div>

              {/* Riferimenti e Firme */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs font-sans">
                <div className="text-left">
                  <span className="text-[10.5px] text-slate-500 uppercase block font-bold">Data e Protocollo</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {config.comune}, {donazione.data}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                    Registro Quietanza: N° {donazione.ricevutaNumero}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10.5px] text-slate-500 uppercase block font-bold">Il Presidente della Pro Loco</span>
                  <span className="font-bold text-slate-900 block mt-1 text-sm">{config.nomePresidente}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">(Firma e Timbro Ufficiale)</span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 3. LETTERA UFFICIALE DI RINGRAZIAMENTO DEL PRESIDENTE    */}
          {/* ======================================================== */}
          {tabAttiva === 'lettera' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 sm:p-12 max-w-3xl mx-auto space-y-6 text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
              
              {/* Carta Intestata Lettera */}
              <div className="border-b border-slate-300 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-950 text-base">PRO LOCO {config.nome.toUpperCase()}</h3>
                  <p className="text-xs text-slate-600">{config.indirizzo} • {config.cap} {config.comune} ({config.provincia})</p>
                  <p className="text-[11px] text-slate-500">Cod. Fiscale: {config.codiceFiscale} • Email: {config.email}</p>
                </div>

                <div className="text-right text-xs">
                  <p className="text-slate-500">Spett.le</p>
                  <p className="font-bold text-slate-950 text-sm">{donazione.donatore}</p>
                  {donazione.indirizzoDonatore && <p className="text-slate-600">{donazione.indirizzoDonatore}</p>}
                  {donazione.cittaDonatore && (
                    <p className="text-slate-600">
                      {donazione.capDonatore ? `${donazione.capDonatore} ` : ''}{donazione.cittaDonatore}
                    </p>
                  )}
                </div>
              </div>

              {/* Data e Oggetto */}
              <div className="space-y-1.5 pt-2">
                <p className="text-xs text-slate-500">
                  {config.comune}, li {donazione.data}
                </p>
                <p className="text-xs font-bold text-slate-900">
                  Oggetto: Ringraziamento ufficiale per erogazione liberale a favore della Pro Loco (Quietanza N. {donazione.ricevutaNumero})
                </p>
              </div>

              {/* Testo Lettera */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 pt-2">
                <p>Gentile <strong>{donazione.donatore}</strong>,</p>
                
                <p>
                  a nome dell'Associazione Turistica Pro Loco <strong>{config.nome}</strong>, dei componenti del Consiglio Direttivo e dei numerosi volontari che operano quotidianamente per la nostra comunità, desidero ringraziarLa con sincera stima e viva riconoscenza per la generosa donazione di <strong>€ {donazione.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong> ({importoInLettere} Euro).
                </p>

                <p>
                  Il Suo contributo economico rappresenta una risorsa fondamentale che ci consente di portare avanti con determinazione le attività di <strong>{donazione.destinazione || 'promozione turistica, salvaguardia delle radici storiche e valorizzazione del nostro borgo'}</strong>. Senza il sostegno di cittadini ed enti sensibili come Lei, gran parte dei nostri progetti non potrebbe vedere la luce.
                </p>

                <p>
                  In allegato Le rimettiamo la <strong>Quietanza Ufficiale n° {donazione.ricevutaNumero}</strong> emessa ai sensi dell'Art. 83 del D.Lgs. 117/2017 (Codice del Terzo Settore), valida ai fini delle agevolazioni fiscali (detrazione IRPEF al 30% per i privati o deduzione IRES per le imprese) in virtù del versamento avvenuto con mezzo tracciabile ({donazione.metodo}).
                </p>

                <p>
                  RinnovandoLe i nostri più sentiti ringraziamenti e augurandoci di averLa presto ospite alle nostre prossime manifestazioni, Le porgo i miei più cordiali e calorosi saluti.
                </p>
              </div>

              {/* Firma Presidente */}
              <div className="pt-8 text-right text-xs">
                <p className="text-slate-500">Con profonda stima,</p>
                <p className="font-bold text-slate-900 text-sm mt-1">{config.nomePresidente}</p>
                <p className="text-[11px] text-slate-500">Presidente Pro Loco {config.nome}</p>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 4. BOZZA COMUNICAZIONE EMAIL / PEC PER DONATORE          */}
          {/* ======================================================== */}
          {tabAttiva === 'email' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 max-w-3xl mx-auto space-y-4 text-slate-800 font-sans print:border-none print:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Bozza Messaggio per Invio Quietanza Fiscale</h4>
                  <p className="text-xs text-slate-500">Copia il testo con un clic per inviarlo via email o PEC al donatore e al suo studio commerciale</p>
                </div>
                <button
                  onClick={handleCopiaEmail}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    copiato 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copiato ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiato ? 'Copiato negli appunti!' : 'Copia Testo Email'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 w-16">A:</span>
                  <span className="text-slate-800 font-medium">{donazione.emailDonatore || `${donazione.donatore} (Inserisci email destinatario)`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 w-16">Oggetto:</span>
                  <span className="text-slate-900 font-bold">Ricevuta Ufficiale Erogazione Liberale N° {donazione.ricevutaNumero} - Pro Loco {config.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 w-16">Allegati:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    Quietanza_Donazione_{donazione.ricevutaNumero.replace('/', '_')}.pdf
                  </span>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 overflow-x-auto max-h-[400px]">
                  {testoEmail}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER NON STAMPABILE */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print shrink-0 text-xs text-slate-500">
          <span>
            Documento ufficiale generato dal Registro Donazioni 1.4 della Pro Loco {config.nome}
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
