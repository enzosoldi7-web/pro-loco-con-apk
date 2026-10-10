import React, { useRef, useState } from 'react';
import { Socio, ProLocoEvento, ProLocoInfo, DonazioneTerzi } from '../types';
import { 
  Printer, 
  X, 
  Building2, 
  Award, 
  FileText, 
  CheckCircle2, 
  Euro, 
  Calendar,
  Users,
  PartyPopper,
  ShieldCheck,
  FileDown,
  Loader2,
  Store,
  Utensils,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { esportaElementoInPDF } from '../utils/pdfExport';
import { calcolaScadenzaQuota, getSociNonRinnovati } from '../utils/quoteHelpers';
import { STAND_SIMULATI_DEFAULT, loadDonazioni } from '../storage';
import { calcolaEconomiaEvento, aggregaEventiPerBilancio } from '../utils/eventoHelpers';

interface GlobalBudgetPrintModalProps {
  soci: Socio[];
  eventi: ProLocoEvento[];
  config: ProLocoInfo;
  annoSelezionato: number;
  donazioni?: DonazioneTerzi[];
  onClose: () => void;
}

export const GlobalBudgetPrintModal: React.FC<GlobalBudgetPrintModalProps> = ({
  soci,
  eventi,
  config,
  annoSelezionato,
  donazioni,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleScaricaPDF = async () => {
    if (!printRef.current) return;
    setGenerandoPDF(true);
    const nomeFile = `Rendiconto_Bilancio_ProLoco_${annoSelezionato}.pdf`;
    await esportaElementoInPDF(printRef.current, nomeFile, 'portrait');
    setGenerandoPDF(false);
  };

  // Soci attivi (escludendo i cancellati)
  const sociAttivi = soci.filter(s => !s.dataCancellazione);

  // Quote dell'anno
  const quoteAnno = sociAttivi.flatMap(s => (s.quote || []).filter(q => q.anno === annoSelezionato));
  const totaleQuote = quoteAnno.reduce((sum, q) => sum + (q.importo || 0), 0);

  // Donazioni ed Erogazioni Liberali da Terzi dell'anno (escludendo revocate per ripensamento Punto 1.4)
  const donazioniEffettive = donazioni && donazioni.length > 0 ? donazioni : loadDonazioni();
  const donazioniAnno = donazioniEffettive.filter(d => d.anno === annoSelezionato && d.stato !== 'annullata_ripensamento');
  const totaleDonazioni = donazioniAnno.reduce((sum, d) => sum + (d.importo || 0), 0);
  const totaleDonazioniDetraibili = donazioniAnno.filter(d => d.detraibileFiscale).reduce((sum, d) => sum + (d.importo || 0), 0);

  // Soci in regola nell'anno (inclusi soci Onorari esenti quota)
  const sociTesseratiAnno = sociAttivi.filter(s => s.categoria === 'Onorario' || (s.quote || []).some(q => q.anno === annoSelezionato));

  // Metodi pagamento quote
  const quotePerMetodo: Record<string, number> = {};
  quoteAnno.forEach(q => {
    quotePerMetodo[q.metodo] = (quotePerMetodo[q.metodo] || 0) + q.importo;
  });

  // Eventi dell'anno
  const eventiAnno = eventi.filter(e => e.dataInizio.startsWith(annoSelezionato.toString()));

  // Spese ed Entrate eventi aggregate tramite il motore ufficiale di bilancio
  const aggregatoEventi = aggregaEventiPerBilancio(eventiAnno);
  const speseFood = aggregatoEventi.food;
  const speseIntr = aggregatoEventi.intrattenimento;
  const speseAltre = aggregatoEventi.altreSpese;
  const speseVarie = aggregatoEventi.varie;
  const totaleSpeseEventi = aggregatoEventi.costiCompetenzaProLoco;

  const totaleEntrateEventi = aggregatoEventi.entrateCompetenzaProLoco;
  const totaleBudgetPreventivato = aggregatoEventi.budgetPrevistoProLoco;

  // Bilancio Globale (Quote + Eventi + Donazioni da terzi)
  const totaleEntrateGenerali = totaleQuote + totaleEntrateEventi + totaleDonazioni;
  const totaleUsciteGenerali = totaleSpeseEventi;
  const avanzoGestione = totaleEntrateGenerali - totaleUsciteGenerali;

  // Quote da Incassare e Scadenza Statutaria Esercizio
  const sociNonRinnovati = getSociNonRinnovati(soci, annoSelezionato, config);
  const totaleQuoteDaIncassare = sociNonRinnovati.reduce((sum, s) => sum + s.importoDovuto, 0);
  const scadenzaQuota = calcolaScadenzaQuota(annoSelezionato);

  // Stand Numerati & Modelli Economici dell'Anno (Nativo, Ibrido, Gestione)
  let totStandsCountAnno = 0;
  let totFoodCountAnno = 0;
  let totNonFoodCountAnno = 0;
  let totSpesaPrevStandsAnno = 0;
  let totSpesaConsStandsAnno = 0;
  let totIncassoPrevStandsAnno = 0;
  let totIncassoConsStandsAnno = 0;

  const eventiStandsDettaglio = eventiAnno.map(e => {
    const stands = (e.standNumerati && e.standNumerati.length > 0) ? e.standNumerati : STAND_SIMULATI_DEFAULT;
    let sPrev = 0;
    let sCons = 0;
    let iPrev = 0;
    let iCons = 0;
    let fCount = 0;
    let nfCount = 0;

    stands.forEach(s => {
      sPrev += Number(s.spesaPreventivo) || 0;
      sCons += Number(s.spesaConsuntivo) || 0;
      iPrev += Number(s.incassoPrevisto) || Number(s.incassoStimato) || 0;
      iCons += Number(s.incassoConsuntivo) || Number(s.incassoStimato) || 0;
      if (s.riferimentoFood) fCount++;
      else nfCount++;
    });

    totStandsCountAnno += stands.length;
    totFoodCountAnno += fCount;
    totNonFoodCountAnno += nfCount;
    totSpesaPrevStandsAnno += sPrev;
    totSpesaConsStandsAnno += sCons;
    totIncassoPrevStandsAnno += iPrev;
    totIncassoConsStandsAnno += iCons;

    const diffS = sCons - sPrev;
    const diffI = iCons - iPrev;
    const margineStand = iCons - sCons;

    let modelloLabel = 'Nativo (100%)';
    let quotaProLoco = margineStand;
    if (e.tipoEvento === 'ibrido') {
      const perc = (e.percentualeEntrateProLoco !== undefined ? e.percentualeEntrateProLoco : 50) / 100;
      modelloLabel = `Ibrido (${e.percentualeEntrateProLoco || 50}%)`;
      quotaProLoco = Math.round(margineStand * perc);
    } else if (e.tipoEvento === 'gestione') {
      modelloLabel = `Gestione (${e.committenteNome || 'Comune'})`;
      quotaProLoco = Number(e.compensoGestione) || 2500;
    }

    return {
      evento: e,
      standsCount: stands.length,
      fCount,
      nfCount,
      sPrev,
      sCons,
      diffS,
      iPrev,
      iCons,
      diffI,
      margineStand,
      modelloLabel,
      quotaProLoco
    };
  });

  const totMargineStandsAnno = totIncassoConsStandsAnno - totSpesaConsStandsAnno;
  const totQuotaProLocoStands = eventiStandsDettaglio.reduce((sum, item) => sum + item.quotaProLoco, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      
      {/* Contenitore Principale */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Barra di Controllo della Modale (Nascosta in stampa) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Rendiconto Economico Finanziario Generale Pro Loco
              </h3>
              <p className="text-xs text-slate-300">
                Esercizio Sociale Anno {annoSelezionato} • Conforme Schema RUNTS per Enti del Terzo Settore / APS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-scarica-bilancio-pdf"
              onClick={handleScaricaPDF}
              disabled={generandoPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Scarica il Rendiconto Economico in formato PDF"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              title="Apri finestra di stampa o Salva come PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa / PDF A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FOGLIO A4 STAMPABILE */}
        <div 
          ref={printRef}
          className="p-8 sm:p-10 overflow-y-auto print:overflow-visible print:p-0 space-y-6 text-slate-800 font-sans"
        >
          
          {/* Intestazione Ufficiale Pro Loco */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Associazione Turistica Pro Loco
                </span>
                {config.codiceUnpli && (
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                    Aderente UNPLI: {config.codiceUnpli}
                  </span>
                )}
                {config.numeroRunts && (
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                    RUNTS: {config.numeroRunts}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                {config.nome.toUpperCase()}
              </h1>
              <p className="text-xs text-slate-600">
                {config.indirizzo} - {config.cap} {config.comune} ({config.provincia}) • Cod. Fisc. {config.codiceFiscale} {config.partitaIva ? `• P.IVA ${config.partitaIva}` : ''}
              </p>
              <p className="text-[11px] text-slate-500">
                Email: {config.email} • Tel: {config.telefono} • Sito: {config.sitoWeb}
              </p>
            </div>

            <div className="text-right sm:self-center border border-slate-300 bg-slate-50 p-3 rounded-lg text-center shrink-0">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Esercizio Finanziario
              </span>
              <span className="block text-xl font-black text-slate-900">
                Anno {annoSelezionato}
              </span>
              <span className="block text-[10px] text-slate-600 font-medium">
                Rendiconto di Cassa
              </span>
            </div>
          </div>

          {/* Titolo Principale del Rendiconto */}
          <div className="text-center py-2 bg-emerald-50/70 border-y border-emerald-200">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Rendiconto Economico Finanziario Generale di Gestione
            </h2>
            <p className="text-xs text-slate-600">
              Quadro consuntivo unificato: Tesseramento Soci, Manifestazioni Popolari, Feste Tradizionali e Risultato di Cassa
            </p>
          </div>

          {/* 1. QUADRO SINTETICO DI BILANCIO (STATO GENERALE) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-300 rounded-lg p-3 bg-white">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">1. Entrate Totali Riscosse</span>
              <span className="text-lg font-black text-slate-950 block mt-1">
                {(totaleEntrateGenerali || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
              </span>
              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                <div>• Quote Tesseramento: {(totaleQuote || 0).toLocaleString('it-IT')} €</div>
                <div>• Incassi Eventi & Sagre: {(totaleEntrateEventi || 0).toLocaleString('it-IT')} €</div>
                <div>• Donazioni da Terzi: {(totaleDonazioni || 0).toLocaleString('it-IT')} €</div>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-white">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">2. Uscite & Costi Sostenuti</span>
              <span className="text-lg font-black text-slate-950 block mt-1">
                {(totaleUsciteGenerali || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
              </span>
              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                <div>• Costi Eventi & Sagre: {(totaleSpeseEventi || 0).toLocaleString('it-IT')} €</div>
                <div>• Scostamento dal Prev.: {((totaleUsciteGenerali || 0) - (totaleBudgetPreventivato || 0) > 0 ? '+' : '')}{((totaleUsciteGenerali || 0) - (totaleBudgetPreventivato || 0)).toLocaleString('it-IT')} €</div>
              </div>
            </div>

            <div className={`border-2 rounded-lg p-3 ${
              (avanzoGestione || 0) >= 0 
                ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950' 
                : 'bg-rose-50/80 border-rose-500 text-rose-950'
            }`}>
              <span className="text-[11px] font-bold uppercase block">
                3. {(avanzoGestione || 0) >= 0 ? 'Avanzo di Gestione' : 'Disavanzo di Gestione'}
              </span>
              <span className="text-xl font-black block mt-1">
                {((avanzoGestione || 0) >= 0 ? '+' : '')}{(avanzoGestione || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
              </span>
              <span className="text-[10px] block mt-1 font-medium">
                {(avanzoGestione || 0) >= 0 
                  ? 'Risultato positivo da destinare a riserva per attività statutarie'
                  : 'Disavanzo economico dell\'esercizio sociale'}
              </span>
            </div>
          </div>

          {/* 2. SEZIONE A: TESSERAMENTO & QUOTE ASSOCIATIVE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sezione A • Gestione Tesseramento & Libro Soci ({annoSelezionato})</span>
              </h3>
              <span className="text-xs font-semibold text-slate-600">
                Soci Tesserati: <strong>{sociTesseratiAnno.length}</strong> su {soci.length} anagrafiche censite
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Ripartizione per Categoria */}
              <table className="w-full border-collapse border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                    <th className="p-1.5 border border-slate-300">Categoria Socio</th>
                    <th className="p-1.5 border border-slate-300 text-center">N° Tessere</th>
                    <th className="p-1.5 border border-slate-300 text-right">Totale Riscosso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {['Membro Direttivo', 'Ordinario', 'Sostenitore', 'Volontario Attivo', 'Giovane', 'Onorario'].map((cat) => {
                    const sociCat = sociTesseratiAnno.filter(s => s.categoria === cat);
                    if (sociCat.length === 0) return null;
                    const totCat = sociCat.reduce((acc, s) => {
                      const sommaSocio = (s.quote || []).filter(item => item.anno === annoSelezionato).reduce((sum, q) => sum + (q.importo || 0), 0);
                      return acc + sommaSocio;
                    }, 0);

                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="p-1.5 border border-slate-300 font-medium">{cat}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono">{sociCat.length}</td>
                        <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold">{(totCat || 0).toLocaleString('it-IT')} €</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-1.5 border border-slate-300">Totale Quote Sociali</td>
                    <td className="p-1.5 border border-slate-300 text-center font-mono">{sociTesseratiAnno.length}</td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono text-emerald-900">{(totaleQuote || 0).toLocaleString('it-IT')} €</td>
                  </tr>
                </tbody>
              </table>

              {/* Ripartizione per Modalità di Pagamento */}
              <table className="w-full border-collapse border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                    <th className="p-1.5 border border-slate-300">Metodo di Pagamento</th>
                    <th className="p-1.5 border border-slate-300 text-right">Importo Registrato</th>
                    <th className="p-1.5 border border-slate-300 text-right">% su Quote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(quotePerMetodo).map(([metodo, importo]) => {
                    const perc = totaleQuote > 0 ? ((importo / totaleQuote) * 100).toFixed(1) : '0';
                    return (
                      <tr key={metodo} className="hover:bg-slate-50">
                        <td className="p-1.5 border border-slate-300 font-medium">{metodo}</td>
                        <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold">{(importo || 0).toLocaleString('it-IT')} €</td>
                        <td className="p-1.5 border border-slate-300 text-right font-mono text-slate-500">{perc}%</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-1.5 border border-slate-300">Totale Cassa Tesseramento</td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono text-emerald-900">{(totaleQuote || 0).toLocaleString('it-IT')} €</td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Riquadro Proposta Quote da Incassare & Scadenza Esercizio */}
            <div className="border border-amber-300 bg-amber-50/50 p-2.5 rounded text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-950 uppercase text-[10px] block">
                  Previsione Quote Sociali da Incassare (Crediti Esercizio {annoSelezionato})
                </span>
                <span className="text-[11px] text-amber-900 mt-0.5 block">
                  <strong>{sociNonRinnovati.length} soci</strong> in attesa di rinnovo • Quota totale da riscuotere: <strong className="font-mono font-black">{(totaleQuoteDaIncassare || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</strong>
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5">
                  Scadenza statutaria: <strong>{scadenzaQuota.dataScadenzaEsercizio}</strong> ({scadenzaQuota.etichettaTempo}) • Termine per diritto di voto: <strong>{scadenzaQuota.dataLimiteAssemblea}</strong>
                </span>
              </div>
              <div className="text-right border-l border-amber-200 pl-4 shrink-0">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Entrata Teorica Tesseramento</span>
                <span className="text-sm font-black text-emerald-800 font-mono block">
                  {((totaleQuote || 0) + (totaleQuoteDaIncassare || 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[9.5px] text-slate-500 block">
                  Avanzo potenziale con quote: <strong>{(((avanzoGestione || 0) + (totaleQuoteDaIncassare || 0)) >= 0 ? '+' : '')}{((avanzoGestione || 0) + (totaleQuoteDaIncassare || 0)).toLocaleString('it-IT')} €</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3. SEZIONE B: RENDICONTO DETTAGLIATO DI TUTTI GLI EVENTI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <PartyPopper className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sezione B • Calendario Eventi & Manifestazioni Popolari ({annoSelezionato})</span>
              </h3>
              <span className="text-xs font-semibold text-slate-600">
                Iniziative Programmate: <strong>{eventiAnno.length}</strong>
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-left text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9.5px]">
                  <th className="p-1.5 border border-slate-300">Manifestazione / Evento</th>
                  <th className="p-1.5 border border-slate-300 text-center">Data</th>
                  <th className="p-1.5 border border-slate-300 text-right">Food (€)</th>
                  <th className="p-1.5 border border-slate-300 text-right">Spett. (€)</th>
                  <th className="p-1.5 border border-slate-300 text-right">Altre (€)</th>
                  <th className="p-1.5 border border-slate-300 text-right">Varie (€)</th>
                  <th className="p-1.5 border border-slate-300 text-right font-black">Tot. Costi</th>
                  <th className="p-1.5 border border-slate-300 text-right font-black">Entrate</th>
                  <th className="p-1.5 border border-slate-300 text-right font-black">Risultato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {eventiAnno.map(e => {
                  const econ = calcolaEconomiaEvento(e);
                  const cFood = econ.food;
                  const cIntr = econ.intrattenimento;
                  const cAltre = econ.altreSpese;
                  const cVarie = econ.varie;
                  const totCons = econ.costiProLocoConsuntivo;
                  const entrateComp = econ.entrateProLocoRealizzate;
                  const margine = econ.margineNettoProLoco;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-1.5 border border-slate-300">
                        <strong className="block text-slate-900">{e.titolo}</strong>
                        <span className="text-[9px] text-slate-500 block">{e.categoria} • {e.luogo} • {econ.etichettaTipo}</span>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center font-mono whitespace-nowrap">
                        {e.dataInizio}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono">{(cFood || 0).toLocaleString('it-IT')}</td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono">{(cIntr || 0).toLocaleString('it-IT')}</td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono">{(cAltre || 0).toLocaleString('it-IT')}</td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono">{(cVarie || 0).toLocaleString('it-IT')}</td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-slate-900">
                        {(totCons || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-emerald-800">
                        {(entrateComp || 0).toLocaleString('it-IT')} €
                      </td>
                      <td className={`p-1.5 border border-slate-300 text-right font-mono font-bold ${
                        (margine || 0) >= 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}>
                        {((margine || 0) >= 0 ? '+' : '')}{(margine || 0).toLocaleString('it-IT')} €
                      </td>
                    </tr>
                  );
                })}

                {/* Riga Totali Eventi */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={2} className="p-1.5 border border-slate-300 font-black text-slate-900">
                    TOTALE MANIFESTAZIONI ED EVENTI
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{(speseFood || 0).toLocaleString('it-IT')} €</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{(speseIntr || 0).toLocaleString('it-IT')} €</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{(speseAltre || 0).toLocaleString('it-IT')} €</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono">{(speseVarie || 0).toLocaleString('it-IT')} €</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-slate-950">
                    {(totaleSpeseEventi || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-950">
                    {(totaleEntrateEventi || 0).toLocaleString('it-IT')} €
                  </td>
                  <td className={`p-1.5 border border-slate-300 text-right font-mono font-black ${
                    (totaleEntrateEventi || 0) - (totaleSpeseEventi || 0) >= 0 ? 'text-emerald-900' : 'text-rose-800'
                  }`}>
                    {((totaleEntrateEventi || 0) - (totaleSpeseEventi || 0) >= 0 ? '+' : '')}
                    {((totaleEntrateEventi || 0) - (totaleSpeseEventi || 0)).toLocaleString('it-IT')} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. SEZIONE C: QUADRO MACRO ECONOMICO DEGLI STAND NUMERATI & MODELLI DI GESTIONE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sezione C • Quadro Riassuntivo Stand Numerati & Modelli di Gestione Economica</span>
              </h3>
              <span className="text-xs font-semibold text-slate-600">
                Totale Stand Censiti: <strong>{totStandsCountAnno}</strong> ({totFoodCountAnno} Food & Beverage, {totNonFoodCountAnno} Servizi)
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-left text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                  <th className="p-1.5 border border-slate-300">Manifestazione</th>
                  <th className="p-1.5 border border-slate-300 text-center">Modello Gestione</th>
                  <th className="p-1.5 border border-slate-300 text-center">N° Stand (F / NF)</th>
                  <th className="p-1.5 border border-slate-300 text-right">Prev. Spese</th>
                  <th className="p-1.5 border border-slate-300 text-right">Cons. Spese</th>
                  <th className="p-1.5 border border-slate-300 text-right">Diff. Spese</th>
                  <th className="p-1.5 border border-slate-300 text-right">Prev. Incassi</th>
                  <th className="p-1.5 border border-slate-300 text-right">Cons. Incassi</th>
                  <th className="p-1.5 border border-slate-300 text-right">Diff. Incassi</th>
                  <th className="p-1.5 border border-slate-300 text-right font-black">Margine Stand</th>
                  <th className="p-1.5 border border-slate-300 text-right font-black">Quota Cassa Pro Loco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {eventiStandsDettaglio.map(({ evento, standsCount, fCount, nfCount, sPrev, sCons, diffS, iPrev, iCons, diffI, margineStand, modelloLabel, quotaProLoco }) => (
                  <tr key={evento.id} className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-medium">
                      <span className="block text-slate-900 font-bold">{evento.titolo}</span>
                      <span className="text-[8.5px] text-slate-500">{evento.dataInizio}</span>
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center font-semibold text-slate-700 whitespace-nowrap">
                      {modelloLabel}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center font-mono font-semibold">
                      {standsCount} <span className="text-slate-500 text-[8.5px]">({fCount} F / {nfCount} NF)</span>
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono">{(sPrev || 0).toLocaleString('it-IT')} €</td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold">{(sCons || 0).toLocaleString('it-IT')} €</td>
                    <td className={`p-1.5 border border-slate-300 text-right font-mono text-[9px] ${diffS <= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {diffS <= 0 ? `${diffS.toLocaleString('it-IT')} €` : `+${diffS.toLocaleString('it-IT')} €`}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono">{(iPrev || 0).toLocaleString('it-IT')} €</td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold">{(iCons || 0).toLocaleString('it-IT')} €</td>
                    <td className={`p-1.5 border border-slate-300 text-right font-mono text-[9px] ${diffI >= 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {diffI >= 0 ? `+${diffI.toLocaleString('it-IT')} €` : `${diffI.toLocaleString('it-IT')} €`}
                    </td>
                    <td className={`p-1.5 border border-slate-300 text-right font-mono font-bold ${margineStand >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {margineStand >= 0 ? '+' : ''}{margineStand.toLocaleString('it-IT')} €
                    </td>
                    <td className={`p-1.5 border border-slate-300 text-right font-mono font-black ${quotaProLoco >= 0 ? 'text-emerald-950' : 'text-rose-950'}`}>
                      {quotaProLoco >= 0 ? '+' : ''}{quotaProLoco.toLocaleString('it-IT')} €
                    </td>
                  </tr>
                ))}

                {/* Totale Stand */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={2} className="p-1.5 border border-slate-300 font-black text-slate-900">
                    TOTALE CONSOLIDATO STAND NUMERATI
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center font-mono">
                    {totStandsCountAnno} ({totFoodCountAnno} F / {totNonFoodCountAnno} NF)
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">{(totSpesaPrevStandsAnno || 0).toLocaleString('it-IT')} €</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-slate-950">{(totSpesaConsStandsAnno || 0).toLocaleString('it-IT')} €</td>
                  <td className={`p-1.5 border border-slate-300 text-right font-mono ${(totSpesaConsStandsAnno - totSpesaPrevStandsAnno) <= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {(totSpesaConsStandsAnno - totSpesaPrevStandsAnno) <= 0 
                      ? `${(totSpesaConsStandsAnno - totSpesaPrevStandsAnno).toLocaleString('it-IT')} €` 
                      : `+${(totSpesaConsStandsAnno - totSpesaPrevStandsAnno).toLocaleString('it-IT')} €`}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-bold">{(totIncassoPrevStandsAnno || 0).toLocaleString('it-IT')} €</td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-950">{(totIncassoConsStandsAnno || 0).toLocaleString('it-IT')} €</td>
                  <td className={`p-1.5 border border-slate-300 text-right font-mono ${(totIncassoConsStandsAnno - totIncassoPrevStandsAnno) >= 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {(totIncassoConsStandsAnno - totIncassoPrevStandsAnno) >= 0 
                      ? `+${(totIncassoConsStandsAnno - totIncassoPrevStandsAnno).toLocaleString('it-IT')} €` 
                      : `${(totIncassoConsStandsAnno - totIncassoPrevStandsAnno).toLocaleString('it-IT')} €`}
                  </td>
                  <td className={`p-1.5 border border-slate-300 text-right font-mono font-black ${totMargineStandsAnno >= 0 ? 'text-emerald-900' : 'text-rose-800'}`}>
                    {totMargineStandsAnno >= 0 ? '+' : ''}{totMargineStandsAnno.toLocaleString('it-IT')} €
                  </td>
                  <td className={`p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-950`}>
                    {totQuotaProLocoStands >= 0 ? '+' : ''}{totQuotaProLocoStands.toLocaleString('it-IT')} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. SEZIONE D: DONAZIONI ED EROGAZIONI LIBERALI DA TERZI (ART. 83 CTS - RUNTS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sezione D • Donazioni ed Erogazioni Liberali da Terzi (Art. 83 D.Lgs. 117/2017)</span>
              </h3>
              <span className="text-xs font-semibold text-slate-600">
                Totale Registrate: <strong>{donazioniAnno.length}</strong> erogazioni (Detraibili: <strong>{(totaleDonazioniDetraibili || 0).toLocaleString('it-IT')} €</strong>)
              </span>
            </div>

            {donazioniAnno.length === 0 ? (
              <div className="p-3 text-center border border-slate-200 rounded-lg text-slate-500 italic text-[11px]">
                Nessuna donazione registrata per l'esercizio {annoSelezionato}.
              </div>
            ) : (
              <table className="w-full border-collapse border border-slate-300 text-left text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                    <th className="p-1.5 border border-slate-300">N° Ricevuta</th>
                    <th className="p-1.5 border border-slate-300">Data</th>
                    <th className="p-1.5 border border-slate-300">Donatore / Ente Erogatore</th>
                    <th className="p-1.5 border border-slate-300 text-center">Tipologia</th>
                    <th className="p-1.5 border border-slate-300">C.F. / P.IVA</th>
                    <th className="p-1.5 border border-slate-300">Causale & Destinazione</th>
                    <th className="p-1.5 border border-slate-300 text-center">Pagamento</th>
                    <th className="p-1.5 border border-slate-300 text-center">Detraibile (Art. 83)</th>
                    <th className="p-1.5 border border-slate-300 text-right font-black">Importo Erogato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {donazioniAnno.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">
                        {d.ricevutaNumero}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-mono whitespace-nowrap">
                        {d.data}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-semibold text-slate-900">
                        {d.donatore}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center uppercase text-[8.5px] font-semibold text-slate-600">
                        {d.tipoDonatore}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-mono text-[9px] text-slate-600">
                        {d.codiceFiscalePartitaIva || '—'}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-slate-700">
                        <span className="block font-medium">{d.causale}</span>
                        {d.destinazione && (
                          <span className="text-[8.5px] text-emerald-800 font-semibold block">
                            Destinazione: {d.destinazione}
                          </span>
                        )}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center whitespace-nowrap text-slate-700 text-[9px]">
                        {d.metodo}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                          d.detraibileFiscale ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {d.detraibileFiscale ? 'SI (Art. 83 CTS)' : 'NO'}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-950">
                        {(d.importo || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                      </td>
                    </tr>
                  ))}

                  {/* Totale Donazioni */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td colSpan={7} className="p-1.5 border border-slate-300 font-black text-slate-900">
                      TOTALE EROGAZIONI LIBERALI & DONAZIONI DA TERZI
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center font-mono text-[9px]">
                      {donazioniAnno.filter(d => d.detraibileFiscale).length} su {donazioniAnno.length} detraibili
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-emerald-950">
                      {(totaleDonazioni || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* 6. ATTESTAZIONE, VERBALE & FIRME COLLEGIALI */}
          <div className="pt-4 border-t-2 border-slate-900 text-xs space-y-4">
            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              Il presente Rendiconto Economico Finanziario dell'Esercizio {annoSelezionato} è stato redatto in conformità alle scritture del registro soci e alle registrazioni di cassa delle manifestazioni territoriali della Pro Loco {config.nome}. Viene depositato presso la sede sociale e sottoposto alla formale approvazione dell'Assemblea Ordinaria dei Soci.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-4 text-center">
              <div className="border-t border-slate-400 pt-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Il Tesoriere</span>
                <span className="text-xs font-semibold text-slate-800 block mt-4">(Firma autografa)</span>
              </div>

              <div className="border-t border-slate-400 pt-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Il Presidente della Pro Loco</span>
                <span className="text-xs font-bold text-slate-900 block mt-1">{config.nomePresidente}</span>
                <span className="text-[10px] text-slate-400 block mt-3">(Firma e timbro)</span>
              </div>

              <div className="border-t border-slate-400 pt-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Il Collegio dei Revisori dei Conti</span>
                <span className="text-xs font-semibold text-slate-800 block mt-4">(Firme dei componenti)</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2">
              <span>Luogo e Data: {config.comune}, {new Date().toLocaleDateString('it-IT')}</span>
              <span>Documento estratto dal Database Gestionale Ufficiale Pro Loco v2.0</span>
            </div>
          </div>

        </div>

        {/* Barra di fondo fissa (non stampabile) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0 no-print">
          <span className="text-xs text-slate-500">
            Rendiconto Economico Finanziario Terzo Settore • Formato A4
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
              <span>Stampa Bilancio A4 / PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
