import React, { useState } from 'react';
import { DonazioneTerzi, ProLocoInfo, CampagnaRaccoltaFondi } from '../types';
import { 
  Building2, 
  Printer, 
  Download, 
  ShieldCheck, 
  Coins, 
  Lock, 
  Unlock, 
  Landmark, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Scale, 
  Layers, 
  Info,
  Calendar
} from 'lucide-react';

interface DonazioneStatoPatrimonialeProps {
  donazioni: DonazioneTerzi[];
  campagne: CampagnaRaccoltaFondi[];
  config: ProLocoInfo;
  annoSelezionato: number;
}

export const DonazioneStatoPatrimoniale: React.FC<DonazioneStatoPatrimonialeProps> = ({
  donazioni,
  campagne,
  config,
  annoSelezionato
}) => {
  const [modalitaStampa, setModalitaStampa] = useState<boolean>(false);

  // Considera sia le donazioni dell'anno che lo storico dei fondi vincolati (escludendo revocate Punto 1.4)
  const donazioniAttive = donazioni.filter(d => d.stato !== 'annullata_ripensamento');
  const donazioniAnno = donazioniAttive.filter(d => d.anno === annoSelezionato);

  // 1. ATTIVO: Liquidità derivanti da Donazioni
  // Liquidità su C/C ordinario (donazioni con bonifico/POS generiche)
  const liquiditaBancariaGenerale = donazioniAnno
    .filter(d => d.metodo !== 'Contanti' && !d.destinazioneVincolata && !d.campagnaId)
    .reduce((acc, d) => acc + d.importo, 0);

  // Liquidità dedicate a Progetti e Campagne Vincolate (fondi intoccabili)
  const liquiditaProgettiVincolati = donazioniAnno
    .filter(d => (d.destinazioneVincolata || d.campagnaId))
    .reduce((acc, d) => acc + (d.importo - (d.spesaEffettuataProgetto || 0)), 0);

  // Cassa contanti (solo per donazioni non tracciate ordinarie)
  const cassaContantiDonazioni = donazioniAnno
    .filter(d => d.metodo === 'Contanti')
    .reduce((acc, d) => acc + d.importo, 0);

  const totaleAttivoDonazioni = liquiditaBancariaGenerale + Math.max(0, liquiditaProgettiVincolati) + cassaContantiDonazioni;

  // 2. PATRIMONIO NETTO & RISERVE VINCOLATE DA DONATORI
  // Dettaglio vincoli per campagna/progetto
  const prospettoVincoli = campagne.map(camp => {
    const donazioniCampagna = donazioniAttive.filter(d => d.campagnaId === camp.id || d.destinazione === camp.titolo);
    const raccoltoTotale = donazioniCampagna.reduce((acc, d) => acc + d.importo, 0);
    const spesoTotale = donazioniCampagna.reduce((acc, d) => acc + (d.spesaEffettuataProgetto || 0), 0) + (camp.oneriSostenuti || 0);
    const saldoResiduoVincolato = Math.max(0, raccoltoTotale - spesoTotale);

    return {
      campagna: camp,
      raccoltoTotale,
      spesoTotale,
      saldoResiduoVincolato
    };
  });

  // Altre donazioni vincolate fuori campagna
  const altreDonazioniVincolate = donazioniAnno.filter(d => d.destinazioneVincolata && !d.campagnaId);
  const raccoltoAltroVincolato = altreDonazioniVincolate.reduce((acc, d) => acc + d.importo, 0);
  const spesoAltroVincolato = altreDonazioniVincolate.reduce((acc, d) => acc + (d.spesaEffettuataProgetto || 0), 0);
  const residuoAltroVincolato = Math.max(0, raccoltoAltroVincolato - spesoAltroVincolato);

  // Totale Riserve Vincolate da Donatori (Patrimonio Netto Vincolato ex DM 39/2020)
  const totalePatrimonioNettoVincolato = prospettoVincoli.reduce((acc, p) => acc + p.saldoResiduoVincolato, 0) + residuoAltroVincolato;

  // Riserva Indivisibile da Donazioni Generiche Non Vincolate
  const totaleRiservaGenerica = liquiditaBancariaGenerale + cassaContantiDonazioni;

  // Totale Patrimonio Netto generato da liberalità
  const totalePatrimonioNettoDonazioni = totalePatrimonioNettoVincolato + totaleRiservaGenerica;

  const esportaCSVStatoPatrimoniale = () => {
    const intestazioni = ['Sezione Stato Patrimoniale Modello C', 'Codice Voce', 'Descrizione Analitica', 'Importo (€)'];
    const righe = [
      ['ATTIVO CIRCOLANTE - DISPONIBILITÀ LIQUIDE', 'CIV.1', 'Depositi bancari per erogazioni liberali ordinarie', liquiditaBancariaGenerale.toFixed(2)],
      ['ATTIVO CIRCOLANTE - DISPONIBILITÀ LIQUIDE', 'CIV.2', 'Depositi vincolati dedicati a specifici progetti deliberati', Math.max(0, liquiditaProgettiVincolati).toFixed(2)],
      ['ATTIVO CIRCOLANTE - DISPONIBILITÀ LIQUIDE', 'CIV.3', 'Denaro e valori in cassa da liberalità', cassaContantiDonazioni.toFixed(2)],
      ['TOTALE ATTIVO DA EROGAZIONI LIBERALI', 'TOT-ATT', '', totaleAttivoDonazioni.toFixed(2)],
      ['', '', '', ''],
      ['PATRIMONIO NETTO - FONDI VINCOLATI PER DESTINAZIONE', 'A.III.1', 'Fondo vincolato da donatori per progetti e campagne', totalePatrimonioNettoVincolato.toFixed(2)],
      ['PATRIMONIO NETTO - RISERVE STATUTARIE', 'A.IV.1', 'Riserva statutaria indivisibile da donazioni generiche', totaleRiservaGenerica.toFixed(2)],
      ['TOTALE PATRIMONIO NETTO DA EROGAZIONI', 'TOT-PN', '', totalePatrimonioNettoDonazioni.toFixed(2)]
    ].map(r => r.map(c => `"${c}"`).join(';'));

    const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stato_Patrimoniale_Fondi_Vincolati_Donazioni_${annoSelezionato}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Intestazione */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
              Modello C RUNTS • DM 39/2020
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">
              Esercizio {annoSelezionato}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-700" />
            <span>Stato Patrimoniale Donazioni & Riserve Vincolate da Donatori</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Prospetto patrimoniale che certifica le disponibilità liquide in cassa/banca e l'ammontare dei Fondi Vincolati destinati obbligatoriamente a specifici progetti statutari (Art. 8 Codice del Terzo Settore).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={esportaCSVStatoPatrimoniale}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
            title="Esporta Stato Patrimoniale Donazioni in CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
            <span>Esporta CSV</span>
          </button>
          <button
            onClick={() => setModalitaStampa(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Stampa Ufficiale A4 dello Stato Patrimoniale"
          >
            <Printer className="w-4 h-4" />
            <span>Stampa Stato Patrimoniale A4</span>
          </button>
        </div>
      </div>

      {/* Schede Riassuntive dei Saldi Patrimoniali */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Liquidità Totale da Donazioni</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            € {totaleAttivoDonazioni.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Giacenza bancaria e cassa Pro Loco
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-2xs bg-gradient-to-b from-white to-amber-50/30">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>Fondi Vincolati da Donatori</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">
            € {totalePatrimonioNettoVincolato.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Somme con vincolo giuridico di scopo
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-2xs bg-gradient-to-b from-white to-indigo-50/30">
          <div className="flex items-center justify-between text-xs text-indigo-800 font-bold mb-1">
            <span>Riserva Donazioni Libere</span>
            <Unlock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 font-mono">
            € {totaleRiservaGenerica.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-indigo-700 mt-1">
            Patrimonio netto a destinazione libera
          </p>
        </div>

      </div>

      {/* Tavola Patrimoniale Bipartita: ATTIVO vs PASSIVO E PATRIMONIO NETTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLONNA 1: ATTIVO CIRCOLANTE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>ATTIVO • Disponibilità Liquide e Saldi Bancari</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-slate-500">C.IV</span>
            </div>

            <div className="p-5 space-y-3">
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">C.IV.1</span>
                    <span className="font-bold text-slate-800">Conto Corrente Ordinario Pro Loco</span>
                    <div className="text-[11px] text-slate-500">
                      Giacenze da liberalità per spese istituzionali correnti
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {liquiditaBancariaGenerale.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">C.IV.2</span>
                    <span className="font-bold text-amber-900">Sottoconto / Saldo Dedicato a Progetti Vincolati</span>
                    <div className="text-[11px] text-slate-500">
                      Liquidità intoccabile vincolata a specifici progetti deliberati
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-900">
                    € {Math.max(0, liquiditaProgettiVincolati).toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">C.IV.3</span>
                    <span className="font-bold text-slate-800">Cassa Contanti della Pro Loco</span>
                    <div className="text-[11px] text-slate-500">
                      Micro-liberalità ordinarie non tracciate
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {cassaContantiDonazioni.toFixed(2)}
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between text-xs font-black text-emerald-950">
            <span>TOTALE ATTIVO DONAZIONI & DISPONIBILITÀ:</span>
            <span className="font-mono text-sm">€ {totaleAttivoDonazioni.toFixed(2)}</span>
          </div>
        </div>

        {/* COLONNA 2: PATRIMONIO NETTO E FONDI VINCOLATI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-700" />
                <span>PATRIMONIO NETTO • Fondi Vincolati & Riserve</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-slate-500">A.III / A.IV</span>
            </div>

            <div className="p-5 space-y-3">
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">A.III.1</span>
                    <span className="font-bold text-amber-950">Fondo Vincolato da Donatori per Scopi Specifici</span>
                    <div className="text-[11px] text-slate-500">
                      Da riportare agli esercizi successivi fino a completamento dell'opera
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-950">
                    € {totalePatrimonioNettoVincolato.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">A.IV.1</span>
                    <span className="font-bold text-slate-800">Riserva Statutaria Indivisibile da Donazioni Libere</span>
                    <div className="text-[11px] text-slate-500">
                      Accantonamento per la continuità operativa dell'Associazione
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {totaleRiservaGenerica.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between text-slate-500 text-[11px]">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">D.1</span>
                    <span>Debiti verso fornitori per progetti di donazione</span>
                  </div>
                  <span className="font-mono font-bold">€ 0.00</span>
                </div>

              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/60 border-t border-indigo-100 flex items-center justify-between text-xs font-black text-indigo-950">
            <span>TOTALE PATRIMONIO NETTO DA LIBERALITÀ:</span>
            <span className="font-mono text-sm">€ {totalePatrimonioNettoDonazioni.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* Dettaglio Analitico dei Fondi Vincolati per Campagna / Progetto */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Rendiconto Analitico dei Fondi Vincolati per Progetto (DM 39/2020)</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Stato di avanzamento tra fondi raccolti, uscite giustificate e quota residua vincolata a nuovo
            </p>
          </div>
          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
            {prospettoVincoli.length} Progetti Istituiti
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Progetto / Campagna Vincolata</th>
                <th className="py-2.5 px-3">Esercizio & Delibera C.D.</th>
                <th className="py-2.5 px-3 text-right">Totale Raccolto (€)</th>
                <th className="py-2.5 px-3 text-right">Spese Giustificate (€)</th>
                <th className="py-2.5 px-3 text-right font-black">Saldo Residuo Vincolato (€)</th>
                <th className="py-2.5 px-3 text-center">Stato Vincolo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prospettoVincoli.map(p => (
                <tr key={p.campagna.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {p.campagna.titolo}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {p.campagna.anno} {p.campagna.deliberaConsiglio && `• ${p.campagna.deliberaConsiglio}`}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800 font-bold">
                    € {p.raccoltoTotale.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-800">
                    € {p.spesoTotale.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                    € {p.saldoResiduoVincolato.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {p.saldoResiduoVincolato === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Completato
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Vincolato a Nuovo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALE DI STAMPA A4 DELLO STATO PATRIMONIALE             */}
      {/* ======================================================== */}
      {modalitaStampa && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 border border-slate-300 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                <Printer className="w-4 h-4" />
                <span>Anteprima di Stampa Ministeriale A4 • Stato Patrimoniale Donazioni</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa / Salva PDF</span>
                </button>
                <button
                  onClick={() => setModalitaStampa(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>

            {/* Documento A4 */}
            <div className="border border-slate-300 p-8 rounded-xl bg-white space-y-6 font-serif text-slate-900 text-xs">
              
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <div className="text-[10px] uppercase font-sans tracking-widest text-slate-500 font-bold">
                  Repubblica Italiana • Registro Unico Nazionale del Terzo Settore (RUNTS)
                </div>
                <h2 className="text-lg font-black tracking-wide font-sans text-slate-950 uppercase">
                  {config.nome}
                </h2>
                <p className="text-[11px] font-sans text-slate-600">
                  C.F.: <span className="font-mono font-bold">{config.codiceFiscale}</span> • Sede: {config.indirizzo}, {config.comune} ({config.provincia})
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-sans font-bold text-xs uppercase rounded border border-slate-300">
                    Stato Patrimoniale (Modello C) • Donazioni, Erogazioni Liberali e Fondi Vincolati • Esercizio {annoSelezionato}
                  </span>
                </div>
              </div>

              {/* Tabella di Stampa */}
              <div className="grid grid-cols-2 gap-4 font-sans text-[11px]">
                
                {/* ATTIVO */}
                <div className="border border-slate-400 p-3 rounded">
                  <div className="font-bold text-center border-b border-slate-400 pb-1 mb-2 uppercase">
                    ATTIVO (DISPONIBILITÀ)
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>C.IV.1 C/C Ordinario Donazioni:</span>
                      <span className="font-mono font-bold">€ {liquiditaBancariaGenerale.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>C.IV.2 Saldi Vincolati Progetti:</span>
                      <span className="font-mono font-bold text-amber-900">€ {Math.max(0, liquiditaProgettiVincolati).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>C.IV.3 Cassa Contanti Donazioni:</span>
                      <span className="font-mono font-bold">€ {cassaContantiDonazioni.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-400 pt-1 flex justify-between font-black">
                      <span>TOTALE ATTIVO:</span>
                      <span className="font-mono">€ {totaleAttivoDonazioni.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* PATRIMONIO NETTO */}
                <div className="border border-slate-400 p-3 rounded">
                  <div className="font-bold text-center border-b border-slate-400 pb-1 mb-2 uppercase">
                    PATRIMONIO NETTO
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>A.III.1 Fondi Vincolati Donatori:</span>
                      <span className="font-mono font-bold text-amber-900">€ {totalePatrimonioNettoVincolato.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A.IV.1 Riserva Statutaria Libera:</span>
                      <span className="font-mono font-bold">€ {totaleRiservaGenerica.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>D Debiti verso terzi:</span>
                      <span className="font-mono">€ 0.00</span>
                    </div>
                    <div className="border-t border-slate-400 pt-1 flex justify-between font-black">
                      <span>TOTALE PATRIMONIO NETTO:</span>
                      <span className="font-mono">€ {totalePatrimonioNettoDonazioni.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Attestazione Vincoli */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded text-[11px] font-sans leading-relaxed text-slate-700">
                <strong>Attestazione del Consiglio Direttivo e Tesoreria:</strong> Si certifica che le somme vincolate a specifici progetti corrispondono all'effettivo saldo liquido bancario depositato presso l'istituto di credito della Pro Loco ({config.banca || 'Banca Convenzionata'}, IBAN {config.iban || 'Registrato agli atti'}), e che non sono state distratte per finalità estranee agli scopi deliberati dai rispettivi donatori.
              </div>

              {/* Firme */}
              <div className="pt-6 grid grid-cols-3 gap-6 text-center font-sans text-[11px]">
                <div className="space-y-8">
                  <span>Il Tesoriere</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">(Firma)</div>
                </div>
                <div className="space-y-8">
                  <span>Il Presidente</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-800">{config.nomePresidente}</div>
                </div>
                <div className="space-y-8">
                  <span>Collegio dei Revisori</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">(Firma)</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
