import React, { useState, useMemo, useRef } from 'react';
import { DonazioneTerzi, ProLocoInfo } from '../types';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  User, 
  Building2, 
  Landmark, 
  CheckCircle2,
  Receipt,
  Download
} from 'lucide-react';
import { numeroInLettere } from '../utils/italianWords';

interface DonazioneCertificatoAnnualeModalProps {
  donazioni: DonazioneTerzi[];
  config: ProLocoInfo;
  annoSelezionato: number;
  donatoreIniziale?: string;
  onClose: () => void;
}

export const DonazioneCertificatoAnnualeModal: React.FC<DonazioneCertificatoAnnualeModalProps> = ({
  donazioni,
  config,
  annoSelezionato,
  donatoreIniziale,
  onClose
}) => {
  const [annoFiscale, setAnnoFiscale] = useState<number>(annoSelezionato);
  const printRef = useRef<HTMLDivElement>(null);

  // Lista di tutti i donatori dell'anno con almeno una donazione (escludendo revocate Punto 1.4)
  const donazioniAttive = useMemo(() => donazioni.filter(d => d.stato !== 'annullata_ripensamento'), [donazioni]);

  const donatoriDellAnno = useMemo(() => {
    const mappa = new Map<string, { donatore: string; cf?: string; totale: number; conteggio: number }>();
    donazioniAttive
      .filter(d => d.anno === annoFiscale && d.tipoDonatore !== 'anonimo')
      .forEach(d => {
        const chiave = (d.codiceFiscalePartitaIva || d.donatore).trim().toUpperCase();
        if (!mappa.has(chiave)) {
          mappa.set(chiave, {
            donatore: d.donatore,
            cf: d.codiceFiscalePartitaIva,
            totale: 0,
            conteggio: 0
          });
        }
        const record = mappa.get(chiave)!;
        record.totale += d.importo;
        record.conteggio += 1;
      });
    return Array.from(mappa.values()).sort((a, b) => a.donatore.localeCompare(b.donatore));
  }, [donazioniAttive, annoFiscale]);

  const [donatoreSelezionatoKey, setDonatoreSelezionatoKey] = useState<string>(() => {
    if (donatoreIniziale) {
      const match = donatoriDellAnno.find(d => 
        d.donatore.toLowerCase().includes(donatoreIniziale.toLowerCase()) || 
        d.cf?.toLowerCase() === donatoreIniziale.toLowerCase()
      );
      if (match) return (match.cf || match.donatore).trim().toUpperCase();
    }
    return donatoriDellAnno[0] ? (donatoriDellAnno[0].cf || donatoriDellAnno[0].donatore).trim().toUpperCase() : '';
  });

  // Lista donazioni del donatore selezionato per l'anno fiscale
  const donazioniDelDonatore = useMemo(() => {
    if (!donatoreSelezionatoKey) return [];
    return donazioniAttive
      .filter(d => {
        const chiave = (d.codiceFiscalePartitaIva || d.donatore).trim().toUpperCase();
        return d.anno === annoFiscale && chiave === donatoreSelezionatoKey;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [donazioniAttive, annoFiscale, donatoreSelezionatoKey]);

  const totaleErogato = useMemo(() => {
    return donazioniDelDonatore.reduce((acc, d) => acc + d.importo, 0);
  }, [donazioniDelDonatore]);

  const donatoreAttivo = donazioniDelDonatore[0];
  const importoInLettere = numeroInLettere(totaleErogato);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[94vh]">
        
        {/* BARRA CONTROLLI SUPERIORE (NON STAMPABILE) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Certificazione Annuale Donazioni (Modello 730 / Redditi)</h3>
              <p className="text-[11px] text-slate-400">Attestazione fiscale cumulativa annuale ai sensi dell'Art. 83 Codice del Terzo Settore</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={donazioniDelDonatore.length === 0}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Certificato A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA FILTRO DONATORE ED ESERCIZIO (NON STAMPABILE) */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 no-print shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Anno Fiscale:</span>
              <select
                value={annoFiscale}
                onChange={(e) => setAnnoFiscale(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {[annoSelezionato, annoSelezionato - 1, annoSelezionato - 2].map(a => (
                  <option key={a} value={a}>Periodo d'imposta {a}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Donatore Beneficiario:</span>
              <select
                value={donatoreSelezionatoKey}
                onChange={(e) => setDonatoreSelezionatoKey(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none cursor-pointer max-w-xs sm:max-w-md truncate"
              >
                {donatoriDellAnno.map(d => (
                  <option key={d.cf || d.donatore} value={(d.cf || d.donatore).trim().toUpperCase()}>
                    {d.donatore} {d.cf ? `(${d.cf})` : ''} - Tot. € {d.totale.toFixed(2)} ({d.conteggio} donaz.)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            {donazioniDelDonatore.length} erogazioni trovate • Totale Annuale: <strong>€ {totaleErogato.toFixed(2)}</strong>
          </span>
        </div>

        {/* FOGLIO A4 CERTIFICATO FISCALE ANNUALE STAMPABILE */}
        <div ref={printRef} className="overflow-y-auto p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0">
          {donazioniDelDonatore.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 max-w-xl mx-auto">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">Nessuna donazione registrata per questo donatore nel {annoFiscale}</h4>
              <p className="text-xs text-slate-500">
                Seleziona un altro donatore dal menù a tendina in alto o cambia l'anno d'imposta.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 sm:p-12 max-w-3xl mx-auto space-y-6 text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
              
              {/* Intestazione Ente Certificatore */}
              <div className="border-b-2 border-teal-900 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-teal-900">
                      Associazione Turistica Pro Loco
                    </span>
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
                    Email: {config.email} • PEC: {config.pec || 'proloco@pec.it'} • Tel: {config.telefono}
                  </p>
                </div>

                <div className="border-2 border-teal-800 bg-teal-50/60 p-3 rounded-xl text-center shrink-0 min-w-[170px]">
                  <span className="text-[10px] uppercase font-bold text-teal-900 tracking-wider block">
                    Attestazione Fiscale Annuale
                  </span>
                  <span className="text-sm font-black text-teal-950 font-mono block mt-0.5">
                    ESERCIZIO {annoFiscale}
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-1">
                    Emessa ai sensi Art. 83 CTS
                  </span>
                </div>
              </div>

              {/* Titolo Certificazione */}
              <div className="text-center py-3 bg-teal-50/50 border border-teal-200 rounded-xl">
                <h2 className="text-sm font-black text-teal-950 uppercase tracking-wide">
                  Certificazione Annuale delle Erogazioni Liberali Ricevute
                </h2>
                <p className="text-xs text-teal-800 font-semibold mt-0.5">
                  Valida per la dichiarazione dei redditi Modello 730 / Modello Redditi Persone Fisiche o Società (Periodo d'Imposta {annoFiscale})
                </p>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  (Rilasciata ai sensi e per gli effetti dell'Articolo 83 del D.Lgs. 3 luglio 2017, n. 117 - Codice del Terzo Settore)
                </p>
              </div>

              {/* Dati del Donatore */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-bold text-slate-600">Soggetto Donatore / Erogatore:</span>
                  <span className="col-span-2 font-black text-slate-900 text-sm">{donatoreAttivo.donatore}</span>
                </div>
                {donatoreAttivo.codiceFiscalePartitaIva && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Codice Fiscale / Partita IVA:</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{donatoreAttivo.codiceFiscalePartitaIva}</span>
                  </div>
                )}
                {(donatoreAttivo.indirizzoDonatore || donatoreAttivo.cittaDonatore) && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Indirizzo Residenza / Sede:</span>
                    <span className="col-span-2 text-slate-800">
                      {donatoreAttivo.indirizzoDonatore ? `${donatoreAttivo.indirizzoDonatore}, ` : ''}
                      {donatoreAttivo.capDonatore ? `${donatoreAttivo.capDonatore} ` : ''}
                      {donatoreAttivo.cittaDonatore || ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Testo di Dichiarazione Legale */}
              <p className="text-xs text-slate-700 leading-relaxed">
                Si certifica che il soggetto sopra indicato ha effettuato nel corso dell'anno d'imposta <strong>{annoFiscale}</strong> a favore dell'Associazione Turistica Pro Loco <strong>{config.nome}</strong> (Ente del Terzo Settore iscritto nel RUNTS), le seguenti erogazioni liberali tracciabili:
              </p>

              {/* Tabella Analitica Donazioni dell'Anno */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10.5px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">N° Ricevuta</th>
                      <th className="py-2.5 px-3">Causale & Destinazione</th>
                      <th className="py-2.5 px-3">Metodo & Tracciabilità</th>
                      <th className="py-2.5 px-3 text-right">Importo (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donazioniDelDonatore.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">{d.data}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-teal-900">{d.ricevutaNumero}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{d.causale}</div>
                          {d.destinazione && <div className="text-[10px] text-teal-800 font-semibold">{d.destinazione}</div>}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                          <div>{d.metodo}</div>
                          {d.estremiTracciabilita && (
                            <div className="text-[10px] font-mono text-slate-400">{d.estremiTracciabilita}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right font-black text-slate-900 font-mono">
                          € {d.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-teal-50/70 border-t-2 border-teal-800 font-bold text-slate-900">
                      <td colSpan={4} className="py-3 px-3 uppercase text-right text-teal-950 font-black">
                        Totale Erogazioni Liberali Anno {annoFiscale}:
                      </td>
                      <td className="py-3 px-3 text-right font-black text-teal-950 font-mono text-base">
                        € {totaleErogato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Importo in Lettere */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Importo complessivo certificato in lettere: </span>
                <span className="italic font-serif text-slate-800 font-bold">{importoInLettere} Euro</span>
              </div>

              {/* Quadro di Attestazione e Diritto alla Detrazione */}
              <div className="p-4 rounded-xl border border-teal-300 bg-teal-50/40 text-[11px] space-y-1.5 text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-teal-950">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Dichiarazione di Tracciabilità e Requisiti di Legge:</span>
                </div>
                <p className="leading-relaxed">
                  L'Associazione dichiara sotto la propria responsabilità che le suddette somme sono state regolarmente incassate mediante <strong>strumenti di pagamento tracciabili</strong> (bancari, postali o carte) e risultano debitamente contabilizzate nel Rendiconto per Cassa ex Modello D (D.M. 1344/2021).
                </p>
                <p className="leading-relaxed">
                  Ai sensi dell'art. 83 del D.Lgs. 117/2017, la presente attestazione consente al donatore di usufruire dei seguenti benefici in sede di dichiarazione dei redditi:
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li><strong>Persone Fisiche:</strong> Detrazione IRPEF del 30% dell'importo erogato (fino a un massimo di € 30.000 annui), ovvero deduzione dal reddito complessivo netto dichiarato nel limite del 10%.</li>
                  <li><strong>Enti, Società ed Imprese:</strong> Deduzione dell'erogazione dal reddito complessivo netto dichiarato nel limite del 10%.</li>
                </ul>
              </div>

              {/* Firme, Luogo e Data */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Luogo e Data Rilascio</span>
                  <span className="font-semibold text-slate-800 block mt-3">
                    {config.comune} ({config.provincia}), {new Date().toLocaleDateString('it-IT')}
                  </span>
                </div>

                <div className="relative">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Il Presidente Legale Rappresentante</span>
                  <span className="font-bold text-slate-900 block mt-1 text-sm">{config.nomePresidente}</span>
                  
                  {/* Timbro Circolare Pro Loco */}
                  <div className="mx-auto mt-2 w-28 h-12 rounded-full border-2 border-teal-900/60 border-dashed flex flex-col items-center justify-center text-[9px] font-serif text-teal-950 font-bold uppercase tracking-tighter opacity-80 rotate-[-1deg]">
                    <span>Pro Loco {config.nome}</span>
                    <span className="text-[7.5px] font-sans">Timbro e Firma</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">(Firma autografa per attestazione)</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* FOOTER NON STAMPABILE */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print shrink-0 text-xs text-slate-500">
          <span>
            Documento ufficiale generato per il CAF / Commercialista dalla Pro Loco {config.nome}
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
