import React, { useState } from 'react';
import { DonazioneTerzi, ProLocoInfo, CampagnaRaccoltaFondi } from '../types';
import { 
  Award, 
  Printer, 
  X, 
  Download, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Landmark, 
  FileText, 
  HeartHandshake,
  QrCode
} from 'lucide-react';

interface DonazioneCertificatoVincoloModalProps {
  donazione?: DonazioneTerzi | null;
  donazioni: DonazioneTerzi[];
  campagne: CampagnaRaccoltaFondi[];
  config: ProLocoInfo;
  onClose: () => void;
}

export const DonazioneCertificatoVincoloModal: React.FC<DonazioneCertificatoVincoloModalProps> = ({
  donazione: donazioneIniziale,
  donazioni,
  campagne,
  config,
  onClose
}) => {
  const [donazioneSelezionataId, setDonazioneSelezionataId] = useState<string>(
    donazioneIniziale?.id || donazioni[0]?.id || ''
  );
  const [tipoDocumento, setTipoDocumento] = useState<'certificato_vincolo' | 'scheda_proposta'>('certificato_vincolo');

  const donazione = donazioni.find(d => d.id === donazioneSelezionataId) || donazioneIniziale || donazioni[0];
  const campagna = campagne.find(c => c.id === donazione?.campagnaId || c.titolo === donazione?.destinazione);

  const handleStampa = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[94vh] my-4">
        
        {/* Barra superiore di controllo (non stampata) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <span>Certificati di Destinazione Vincolata & Proposta di Donazione</span>
              </h3>
              <p className="text-xs text-slate-400">
                Documenti ufficiali professionali per benefattori privati, imprese e fondazioni mecenate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStampa}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Documento A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selettori e Opzioni Documento */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTipoDocumento('certificato_vincolo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipoDocumento === 'certificato_vincolo'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. Certificato Ufficiale di Destinazione Fondi
            </button>
            <button
              onClick={() => setTipoDocumento('scheda_proposta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipoDocumento === 'scheda_proposta'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. Scheda Proposta Bonifico Erogazione Liberale
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold">Donazione:</span>
            <select
              value={donazioneSelezionataId}
              onChange={(e) => setDonazioneSelezionataId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 cursor-pointer max-w-[280px] truncate"
            >
              {donazioni.map(d => (
                <option key={d.id} value={d.id}>
                  {d.ricevutaNumero} • {d.donatore} (€ {d.importo.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Area di Visualizzazione Documento A4 */}
        <div className="p-6 overflow-y-auto bg-slate-200/60 flex justify-center flex-1">
          {donazione ? (
            <div className="w-full max-w-2xl bg-white border border-slate-300 shadow-xl rounded-xl p-8 sm:p-12 space-y-6 font-serif text-slate-900 relative print:m-0 print:border-none print:shadow-none print:max-w-none">
              
              {/* Filigrana di fondo per eleganza istituzionale */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <Landmark className="w-96 h-96 text-slate-900" />
              </div>

              {/* TIPO 1: CERTIFICATO UFFICIALE DI DESTINAZIONE VINCOLATA */}
              {tipoDocumento === 'certificato_vincolo' && (
                <div className="space-y-6 relative z-10">
                  
                  {/* Frontespizio */}
                  <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                    <div className="text-[10px] font-sans font-bold tracking-widest text-slate-500 uppercase">
                      Repubblica Italiana • Registro Unico Nazionale Terzo Settore
                    </div>
                    <h2 className="text-lg font-black tracking-wide font-sans text-slate-950 uppercase">
                      {config.nome}
                    </h2>
                    <p className="text-[11px] font-sans text-slate-600">
                      Associazione di Promozione Sociale (APS) • C.F.: <span className="font-mono font-bold">{config.codiceFiscale}</span>
                      {config.numeroRunts && <span> • RUNTS: {config.numeroRunts}</span>}
                    </p>
                    <p className="text-[11px] font-sans text-slate-600">
                      Sede Legale: {config.indirizzo}, {config.cap} {config.comune} ({config.provincia})
                    </p>
                    <div className="pt-3">
                      <span className="inline-block px-4 py-1.5 bg-amber-50 text-amber-950 font-sans font-black text-xs uppercase tracking-wider rounded-md border border-amber-300 shadow-2xs">
                        Attestato Ufficiale di Destinazione Vincolata dei Fondi
                      </span>
                    </div>
                    <div className="text-[10px] font-sans text-slate-400 pt-1">
                      Prot. Certificato: PROT-{donazione.anno}/VINCOLO-{donazione.ricevutaNumero.replace(/[^0-9]/g, '')}
                    </div>
                  </div>

                  {/* Corpo del Certificato */}
                  <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-800">
                    <p className="text-justify">
                      Si certifica e si attesta solennemente che in data <strong>{donazione.data}</strong> è pervenuta all'Associazione <strong>{config.nome}</strong> un'erogazione liberale dell'importo di:
                    </p>

                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-center space-y-1">
                      <span className="text-xs uppercase text-slate-500 font-bold block">Somma Erogata e Accreditata:</span>
                      <span className="text-2xl font-black font-mono text-slate-950">
                        € {donazione.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] italic text-slate-600 block">
                        (Quietanza di donazione N. {donazione.ricevutaNumero} • Metodo: {donazione.metodo})
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                      <div className="text-[11px] text-amber-950">
                        <strong>Soggetto Erogatore (Donatore):</strong> {donazione.donatore}
                      </div>
                      {donazione.codiceFiscalePartitaIva && (
                        <div className="text-[11px] text-amber-950">
                          <strong>Codice Fiscale / Partita IVA:</strong> <span className="font-mono font-bold">{donazione.codiceFiscalePartitaIva}</span>
                        </div>
                      )}
                      {donazione.indirizzoDonatore && (
                        <div className="text-[11px] text-amber-950">
                          <strong>Indirizzo / Sede:</strong> {donazione.indirizzoDonatore}, {donazione.cittaDonatore}
                        </div>
                      )}
                      <div className="text-[11px] text-amber-950">
                        <strong>Causale Dichiarata:</strong> {donazione.causale}
                      </div>
                      <div className="text-[11px] text-amber-950">
                        <strong>Progetto / Destinazione Vincolata:</strong> {donazione.destinazione || campagna?.titolo || 'Attività Statutarie di Interesse Generale'}
                      </div>
                    </div>

                    <p className="text-justify text-[11.5px]">
                      Il Consiglio Direttivo dell'Associazione, ai sensi dell'Art. 8 del D.Lgs. 117/2017 e del D.M. 39/2020, <strong>certifica che la suddetta somma è stata iscritta nel Registro delle Donazioni Vincolate</strong> ed è stata (o sarà) impiegata esclusivamente ed integralmente per il conseguimento della finalità prescelta, senza alcuna distrazione a fini diversi o spese correnti non pertinenti.
                    </p>

                    <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 text-[10.5px] text-slate-600 space-y-1">
                      <div><strong>Estremi delibera istitutiva:</strong> {donazione.deliberaConsiglio || 'Delibera del Consiglio Direttivo agli atti'}</div>
                      <div><strong>Tracciabilità finanziaria:</strong> {donazione.estremiTracciabilita || `Operazione bancaria tracciata ${donazione.metodo}`}</div>
                      <div><strong>Efficacia Fiscale:</strong> {donazione.detraibileFiscale ? 'Donazione detraibile al 30% IRPEF (art. 83 c.1 CTS) o deducibile al 10% del reddito imponibile (art. 83 c.2 CTS).' : 'Donazione ordinaria.'}</div>
                    </div>
                  </div>

                  {/* Firme e data */}
                  <div className="pt-8 grid grid-cols-2 gap-8 text-center font-sans text-xs">
                    <div className="space-y-10">
                      <div>Data rilascio: {new Date().toLocaleDateString('it-IT')}</div>
                      <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">Timbro della Pro Loco</div>
                    </div>
                    <div className="space-y-10">
                      <div>Il Presidente della Pro Loco</div>
                      <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-900">{config.nomePresidente}</div>
                    </div>
                  </div>

                </div>
              )}

              {/* TIPO 2: SCHEDA PROPOSTA BONIFICO EROGAZIONE LIBERALE */}
              {tipoDocumento === 'scheda_proposta' && (
                <div className="space-y-6 relative z-10 font-sans text-xs text-slate-800">
                  
                  {/* Frontespizio */}
                  <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                    <h2 className="text-lg font-black uppercase text-slate-950 font-sans">
                      {config.nome}
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Associazione di Promozione Sociale (APS) • C.F.: <span className="font-mono font-bold">{config.codiceFiscale}</span>
                    </p>
                    <div className="pt-3">
                      <span className="inline-block px-4 py-1 bg-teal-50 text-teal-950 font-black text-xs uppercase tracking-wider rounded border border-teal-300">
                        Scheda Ufficiale di Proposta / Erogazione Liberale Tracciata
                      </span>
                    </div>
                  </div>

                  <p className="text-justify leading-relaxed">
                    La presente scheda riepiloga le coordinate istituzionali e le istruzioni fiscali per effettuare una donazione (erogazione liberale) a favore della <strong>{config.nome}</strong> nel pieno rispetto dell'Art. 83 del Codice del Terzo Settore (D.Lgs. 117/2017).
                  </p>

                  {/* Riquadro Coordinate Bancarie */}
                  <div className="p-4 rounded-xl border-2 border-slate-800 bg-slate-50 space-y-2">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-emerald-700" />
                      <span>Coordinate Bancarie Ufficiali per il Bonifico:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Intestatario del Conto:</span>
                        <span className="font-bold text-slate-900">{config.nome}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Istituto Bancario:</span>
                        <span className="font-bold text-slate-900">{config.banca || 'Banca Convenzionata'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block text-[11px]">Codice IBAN:</span>
                        <span className="font-mono font-black text-sm text-slate-950 bg-white px-2 py-1 rounded border border-slate-300 inline-block">
                          {config.iban || 'IT00 X000 0000 0000 0000 0000 000'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Causale Consigliata */}
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                    <div className="text-xs font-bold text-amber-950">
                      Causale Bonifico Raccomandata ai fini Fiscali:
                    </div>
                    <div className="font-mono text-xs font-bold text-amber-900 bg-white p-2 rounded border border-amber-300">
                      «Erogazione liberale ex Art. 83 D.Lgs. 117/2017 a favore di {config.nome} - CF {config.codiceFiscale} {donazione?.destinazione ? `- Progetto: ${donazione.destinazione}` : ''}»
                    </div>
                  </div>

                  {/* Vantaggi Fiscali */}
                  <div className="space-y-2 text-[11px]">
                    <div className="font-bold text-slate-900 uppercase">Agevolazioni Fiscali Riconosciute dalla Legge:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                      <li><strong>Per le Persone Fisiche (Art. 83 c.1 CTS):</strong> Detrazione d'imposta dall'IRPEF pari al <strong>30%</strong> dell'importo donato, fino ad un massimo di 30.000 € per ciascun periodo d'imposta.</li>
                      <li><strong>Per Imprese, Società ed Enti (Art. 83 c.2 CTS):</strong> Deducibilità dal reddito complessivo netto fino al limite del <strong>10%</strong> del reddito complessivo dichiarato.</li>
                    </ul>
                  </div>

                  {/* Note Privacy */}
                  <div className="text-[10px] text-slate-400 text-justify pt-2 border-t border-slate-200">
                    I dati forniti saranno trattati conformemente al Regolamento UE 2016/679 (GDPR) per i soli adempimenti contabili e fiscali connessi alla donazione e per l'eventuale trasmissione all'Agenzia delle Entrate per la dichiarazione dei redditi precompilata.
                  </div>

                  <div className="pt-6 flex justify-between items-center text-xs">
                    <div className="text-slate-500 text-[11px]">
                      Sede: {config.comune} • Email: {config.email}
                    </div>
                    <div className="font-bold text-slate-900">
                      Il Presidente: {config.nomePresidente}
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Nessuna donazione selezionata
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
