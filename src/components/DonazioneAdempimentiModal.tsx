import React, { useState } from 'react';
import { DonazioneTerzi, ProLocoInfo, CampagnaRaccoltaFondi } from '../types';
import { esportaAdE730CSV, esportaTrasparenzaL124CSV } from '../storage';
import { 
  Scale, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ExternalLink, 
  FileText, 
  Building2, 
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';

interface DonazioneAdempimentiModalProps {
  donazioni: DonazioneTerzi[];
  campagne: CampagnaRaccoltaFondi[];
  config: ProLocoInfo;
  annoSelezionato: number;
  onAggiornaDonazione?: (donazione: DonazioneTerzi) => void;
  onAggiornaCampagna?: (campagna: CampagnaRaccoltaFondi) => void;
}

export const DonazioneAdempimentiModal: React.FC<DonazioneAdempimentiModalProps> = ({
  donazioni,
  campagne,
  config,
  annoSelezionato,
  onAggiornaDonazione,
  onAggiornaCampagna
}) => {
  const [tabAttivo, setTabAttivo] = useState<'ade_730' | 'art_87' | 'trasparenza_124' | 'scadenzario'>('ade_730');
  const [copiatoHtml, setCopiatoHtml] = useState<boolean>(false);
  const [campagnaRendicontoId, setCampagnaRendicontoId] = useState<string>(campagne[0]?.id || '');
  const [mostraStampaArt87, setMostraStampaArt87] = useState<boolean>(false);
  const [mostraStampaOpposizione, setMostraStampaOpposizione] = useState<DonazioneTerzi | null>(null);

  // Scadenzario salvato in localStorage
  const keyStorageScadenze = `proloco_scadenze_runts_${annoSelezionato}`;
  const [scadenzeCompletate, setScadenzeCompletate] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(keyStorageScadenze);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const toggleScadenza = (id: string) => {
    const nuovoStato = { ...scadenzeCompletate, [id]: !scadenzeCompletate[id] };
    setScadenzeCompletate(nuovoStato);
    try {
      localStorage.setItem(keyStorageScadenze, JSON.stringify(nuovoStato));
    } catch (e) {
      console.error(e);
    }
  };

  // Donazioni attive dell'anno (escludendo revocate per ripensamento Punto 1.4)
  const donazioniAttive = donazioni.filter(d => d.stato !== 'annullata_ripensamento');
  const donazioniAnno = donazioniAttive.filter(d => d.anno === annoSelezionato);

  // 1. Dati per AdE 730 Precompilato
  // Privati cittadini con pagamento tracciabile e codice fiscale inserito
  const donatori730Idonei = donazioniAnno.filter(d => 
    d.tipoDonatore === 'privato' && 
    d.metodo !== 'Contanti' && 
    d.detraibileFiscale !== false &&
    d.codiceFiscalePartitaIva &&
    d.codiceFiscalePartitaIva.trim().length === 16
  );

  const totaleImporto730 = donatori730Idonei
    .filter(d => !d.opposizione730)
    .reduce((acc, d) => acc + d.importo, 0);

  // 2. Dati per Trasparenza Legge 124/2017 (> 10.000 €)
  const totaleDonazioniAnno = donazioniAnno.reduce((acc, d) => acc + d.importo, 0);
  const sogliaSuperata = totaleDonazioniAnno >= 10000;

  // Campagna selezionata per il rendiconto ex Art. 87 CTS
  const campagnaSelezionata = campagne.find(c => c.id === campagnaRendicontoId) || campagne[0];
  const donazioniCampagnaSel = donazioniAttive.filter(d => 
    d.campagnaId === campagnaSelezionata?.id || d.destinazione === campagnaSelezionata?.titolo
  );
  const entrateLordeCampagna = donazioniCampagnaSel.reduce((acc, d) => acc + d.importo, 0);
  const oneriSostenutiCampagna = campagnaSelezionata?.oneriSostenuti || 0;
  const avanzoNettoCampagna = entrateLordeCampagna - oneriSostenutiCampagna;

  // Handler toggle opposizione per un donatore
  const handleToggleOpposizione = (donazione: DonazioneTerzi) => {
    if (!onAggiornaDonazione) return;
    const aggiornata: DonazioneTerzi = {
      ...donazione,
      opposizione730: !donazione.opposizione730
    };
    onAggiornaDonazione(aggiornata);
  };

  const handleMarcaTrasmessoAdE = () => {
    if (!onAggiornaDonazione) return;
    const protocollo = `ADE-${annoSelezionato}-${Math.floor(100000 + Math.random() * 900000)}`;
    const dataOggi = new Date().toISOString().split('T')[0];
    donatori730Idonei.forEach(d => {
      onAggiornaDonazione({
        ...d,
        trasmessaAdE: true,
        dataTrasmissioneAdE: dataOggi,
        protocolloInvioAdE: protocollo
      });
    });
    alert(`Tutte le donazioni idonee sono state marcate come trasmesse ad AdE con Protocollo telematico: ${protocollo}`);
  };

  const handleCopiaTabellaTrasparenza = () => {
    const righeTesto = donazioniAnno.map(d => 
      `${d.donatore} | CF: ${d.codiceFiscalePartitaIva || 'N/D'} | € ${d.importo.toFixed(2)} | Data: ${d.data} | Causale: ${d.causale}`
    ).join('\n');
    const testoCompleto = `PRO LOCO ${config.nome.toUpperCase()} - C.F. ${config.codiceFiscale}\nTABELLA DI TRASPARENZA CONTRIBUTI ED EROGAZIONI EX L. 124/2017 - ANNO ${annoSelezionato}\n\n${righeTesto}\n\nTOTALE COMPLESSIVO: € ${totaleDonazioniAnno.toFixed(2)}`;
    navigator.clipboard.writeText(testoCompleto);
    setCopiatoHtml(true);
    setTimeout(() => setCopiatoHtml(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Sezione Adempimenti */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-teal-100 text-teal-900 border border-teal-300">
              Conformità Normativa RUNTS & Fiscale
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">
              Esercizio {annoSelezionato}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-700" />
            <span>Centro Adempimenti di Legge per Donazioni & Raccolta Fondi</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Gestisci in modo professionale tutti gli obblighi fiscali e statutari: Comunicazione Modello 730 Precompilato, Rendiconto Art. 87 CTS, Obblighi di Trasparenza L. 124/2017 e Scadenziario RUNTS.
          </p>
        </div>
      </div>

      {/* Schede di Navigazione Adempimenti */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        <button
          onClick={() => setTabAttivo('ade_730')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            tabAttivo === 'ade_730'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>1. Agenzia Entrate (730 Precompilato)</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            tabAttivo === 'ade_730' ? 'bg-teal-900 text-teal-100' : 'bg-slate-200 text-slate-700'
          }`}>
            {donatori730Idonei.length}
          </span>
        </button>

        <button
          onClick={() => setTabAttivo('art_87')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            tabAttivo === 'art_87'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Rendiconto Raccolte ex Art. 87 CTS</span>
        </button>

        <button
          onClick={() => setTabAttivo('trasparenza_124')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            tabAttivo === 'trasparenza_124'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Trasparenza Legge 124/2017 (&gt; 10k)</span>
          {sogliaSuperata && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
              Obbligo
            </span>
          )}
        </button>

        <button
          onClick={() => setTabAttivo('scadenzario')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            tabAttivo === 'scadenzario'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>4. Scadenzario Operativo RUNTS</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. ADEMPIMENTO 730 PRECOMPILATO AGENZIA ENTRATE         */}
      {/* ======================================================== */}
      {tabAttivo === 'ade_730' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Decreto MEF 3 Febbraio 2021
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Scadenza annuale: 16 Marzo
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Trasmissione Telematica Erogazioni Liberali per Modello 730 Precompilato
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Le Pro Loco iscritte al RUNTS possono trasmettere all'Agenzia delle Entrate i dati delle donazioni tracciabili effettuate dai privati cittadini, per consentire l'inserimento automatico della detrazione del 30% nel loro 730 precompilato.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => esportaAdE730CSV(donazioni, annoSelezionato, config)}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Esporta il file telematico formattato secondo specifiche Agenzia Entrate"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Scarica Tracciato AdE (CSV)</span>
                </button>
                <button
                  onClick={handleMarcaTrasmessoAdE}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
                  title="Marca tutte le donazioni come inviate con successo con protocollo"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Registra Protocollo Invio</span>
                </button>
              </div>
            </div>

            {/* Metriche sintetiche AdE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block">Donatori Privati Tracciati</span>
                <span className="text-xl font-black text-slate-900 font-mono">{donatori730Idonei.length}</span>
                <span className="text-[10.5px] text-slate-400 block">con Codice Fiscale valido</span>
              </div>
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs">
                <span className="text-teal-800 block">Totale Somme Trasmissibili</span>
                <span className="text-xl font-black text-teal-950 font-mono">
                  € {totaleImporto730.toFixed(2)}
                </span>
                <span className="text-[10.5px] text-teal-700 block">detraibili 30% in dichiarazione</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                <span className="text-amber-800 block">Esercizio Diritto Opposizione</span>
                <span className="text-xl font-black text-amber-950 font-mono">
                  {donatori730Idonei.filter(d => d.opposizione730).length}
                </span>
                <span className="text-[10.5px] text-amber-700 block">dati esclusi dalla trasmissione</span>
              </div>
            </div>

            {/* Elenco Donatori Idonei per 730 Precompilato */}
            {donatori730Idonei.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nessuna donazione tracciabile da privato cittadino con codice fiscale registrata per l'esercizio {annoSelezionato}.
              </div>
            ) : (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Donatore Persona Fisica</th>
                      <th className="py-2.5 px-3 font-mono">Codice Fiscale</th>
                      <th className="py-2.5 px-3">Data & Ricevuta</th>
                      <th className="py-2.5 px-3">Tracciabilità</th>
                      <th className="py-2.5 px-3 text-right">Importo (€)</th>
                      <th className="py-2.5 px-3 text-center">Diritto Opposizione</th>
                      <th className="py-2.5 px-3 text-right">Azioni Modulo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donatori730Idonei.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{d.donatore}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{d.codiceFiscalePartitaIva}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {d.data} • {d.ricevutaNumero}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {d.metodo} {d.estremiTracciabilita && `(${d.estremiTracciabilita.substring(0, 15)}...)`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          € {d.importo.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleOpposizione(d)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              d.opposizione730 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                            title="Clicca per cambiare lo stato di opposizione"
                          >
                            {d.opposizione730 ? '⛔ Opposizione Presentata' : '✓ Consenso Attivo'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setMostraStampaOpposizione(d)}
                            className="px-2 py-1 text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                            title="Stampa Modello per il Donatore"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Mod. Opposizione</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ADEMPIMENTO RENDICONTO EX ART. 87 CTS                 */}
      {/* ======================================================== */}
      {tabAttivo === 'art_87' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Art. 87 c. 6 D.Lgs. 117/2017 • DM 39/2020
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Entro 4 mesi da chiusura esercizio
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Rendiconto Analitico Separato delle Raccolte Fondi Pubbliche Occasionali
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Per ciascuna raccolta fondi pubblica occasionale (feste patronali, sagre benefiche, banchetti di piazza), l'Ente deve redigere entro 4 mesi un apposito rendiconto analitico corredato dalla relazione illustrativa del Presidente.
                </p>
              </div>

              <button
                onClick={() => setMostraStampaArt87(true)}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Stampa Rendiconto & Relazione Art. 87</span>
              </button>
            </div>

            {/* Selettore Campagna per Rendiconto Art. 87 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Seleziona la Raccolta Pubblica da Rendicontare:</span>
                <span className="text-slate-500 text-[11px]">Ogni manifestazione ha un prospetto dedicato</span>
              </div>
              <select
                value={campagnaRendicontoId}
                onChange={(e) => setCampagnaRendicontoId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 cursor-pointer"
              >
                {campagne.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.titolo} (Anno {c.anno})
                  </option>
                ))}
              </select>
            </div>

            {campagnaSelezionata && (
              <div className="space-y-4 pt-2">
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-slate-900 text-sm">
                      {campagnaSelezionata.titolo}
                    </h5>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Target: € {campagnaSelezionata.obiettivoImporto.toLocaleString('it-IT')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {campagnaSelezionata.descrizione}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-emerald-50 rounded-lg text-xs">
                      <span className="text-emerald-800 font-bold block">Entrate Lorde Raccolte:</span>
                      <span className="text-lg font-black text-emerald-950 font-mono">
                        € {entrateLordeCampagna.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-lg text-xs">
                      <span className="text-rose-800 font-bold block">Oneri e Spese Sostenute:</span>
                      <span className="text-lg font-black text-rose-950 font-mono">
                        € {oneriSostenutiCampagna.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg text-xs">
                      <span className="text-indigo-800 font-bold block">Avanzo Netto Vincolato:</span>
                      <span className="text-lg font-black text-indigo-950 font-mono">
                        € {avanzoNettoCampagna.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ADEMPIMENTO TRASPARENZA L. 124/2017 (> 10.000 €)      */}
      {/* ======================================================== */}
      {tabAttivo === 'trasparenza_124' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Legge 124/2017 art. 1 commi 125-129
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Scadenza: 30 Giugno di ogni anno
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Obblighi di Pubblicità e Trasparenza per Erogazioni &gt; 10.000 €
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Gli enti del Terzo Settore che ricevono nell'anno solare contributi pubblici o liberalità superiori a <strong>10.000 €</strong> hanno l'obbligo di pubblicare entro il 30 Giugno l'elenco dei vantaggi economici sul proprio sito web istituzionale.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopiaTabellaTrasparenza}
                  className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiatoHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiatoHtml ? 'Copiato negli Appunti!' : 'Copia Testo per Sito Web'}</span>
                </button>
                <button
                  onClick={() => esportaTrasparenzaL124CSV(donazioni, annoSelezionato, config)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
                  <span>Esporta CSV</span>
                </button>
              </div>
            </div>

            {/* Monitoraggio Soglia */}
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              sogliaSuperata 
                ? 'bg-rose-50 border-rose-200 text-rose-950' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center gap-2.5">
                {sogliaSuperata ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {sogliaSuperata 
                      ? 'Soglia dei 10.000 € Superata: OBBLIGO DI PUBBLICAZIONE ATTIVO' 
                      : 'Sotto la soglia dei 10.000 €: Pubblicazione facoltativa per trasparenza'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Totale percepito nell'anno: <strong>€ {totaleDonazioniAnno.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              </div>

              <div className="font-mono font-bold text-sm">
                Soglia: € 10.000,00
              </div>
            </div>

            {/* Tabella Trasparenza da Pubblicare */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Soggetto Erogatore</th>
                    <th className="py-2.5 px-3 font-mono">CF / P.IVA</th>
                    <th className="py-2.5 px-3 text-right">Somma Incassata (€)</th>
                    <th className="py-2.5 px-3">Data Incasso</th>
                    <th className="py-2.5 px-3">Causale Fiscale</th>
                    <th className="py-2.5 px-3">Elemento Giustificativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donazioniAnno.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{d.donatore}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{d.codiceFiscalePartitaIva || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        € {d.importo.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{d.data}</td>
                      <td className="py-2.5 px-3 text-slate-700 text-[11px]">{d.causale}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{d.deliberaConsiglio || `Quietanza ${d.ricevutaNumero}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SCADENZARIO OPERATIVO RUNTS & FISCALE                 */}
      {/* ======================================================== */}
      {tabAttivo === 'scadenzario' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            
            <div className="pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Scadenzario Operativo del Consiglio Direttivo & Tesoreria • Esercizio {annoSelezionato}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Checklist interattiva per tenere sotto controllo tutti gli adempimenti annuali del Terzo Settore
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'scad-1',
                  titolo: 'Trasmissione Telematica Donazioni all\'Agenzia delle Entrate (730 Precompilato)',
                  scadenza: `16 Marzo ${annoSelezionato + 1}`,
                  riferimento: 'DM MEF 3/2/2021',
                  descrizione: 'Invio telematico tramite Entratel / Desktop Telematico o intermediario abilitato delle donazioni detraibili 30% effettuate da persone fisiche con pagamento tracciato.'
                },
                {
                  id: 'scad-2',
                  titolo: 'Approvazione del Rendiconto d\'Esercizio in Assemblea dei Soci',
                  scadenza: `30 Aprile ${annoSelezionato + 1}`,
                  riferimento: 'Art. 13 CTS & Statuto Pro Loco',
                  descrizione: 'Convocazione dell\'Assemblea Generale Ordinaria dei Soci per l\'approvazione del Rendiconto per Cassa (Mod. D) e della Relazione di Missione.'
                },
                {
                  id: 'scad-3',
                  titolo: 'Redazione Rendiconti Separati Raccolte Pubbliche Occasionali (Art. 87 CTS)',
                  scadenza: `30 Aprile ${annoSelezionato + 1}`,
                  riferimento: 'Art. 87 c. 6 D.Lgs. 117/2017',
                  descrizione: 'Redazione entro 4 mesi dalla chiusura dell\'esercizio dei rendiconti specifici per ogni raccolta pubblica di fondi, corredati da relazione illustrativa.'
                },
                {
                  id: 'scad-4',
                  titolo: 'Pubblicazione Trasparenza Contributi Pubblici e Donazioni (Legge 124/2017)',
                  scadenza: `30 Giugno ${annoSelezionato + 1}`,
                  riferimento: 'L. 124/2017 commi 125-129',
                  descrizione: 'Se la somma di contributi e donazioni supera i 10.000 €, pubblicazione della tabella nel sito web istituzionale della Pro Loco a pena di sanzioni.'
                },
                {
                  id: 'scad-5',
                  titolo: 'Deposito del Bilancio e Rendiconti al Portale del RUNTS',
                  scadenza: `30 Giugno ${annoSelezionato + 1}`,
                  riferimento: 'Art. 48 D.Lgs. 117/2017',
                  descrizione: 'Deposito telematico sul portale ministeriale del RUNTS tramite SPID/CIE del Presidente del bilancio approvato e del verbale dell\'assemblea.'
                }
              ].map(s => {
                const completata = Boolean(scadenzeCompletate[s.id]);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleScadenza(s.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                      completata 
                        ? 'bg-emerald-50/60 border-emerald-200' 
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        completata 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {completata && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className={`font-bold text-xs ${completata ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {s.titolo}
                        </h5>
                        <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded shrink-0">
                          {s.scadenza}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {s.descrizione}
                      </p>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        Rif. Legge: {s.riferimento}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE DI STAMPA RENDICONTO ART. 87 CTS                  */}
      {/* ======================================================== */}
      {mostraStampaArt87 && campagnaSelezionata && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 border border-slate-300 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="font-bold text-xs text-amber-800 uppercase">
                Stampa Ufficiale A4 • Rendiconto Separato ex Art. 87 CTS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa / Salva PDF</span>
                </button>
                <button
                  onClick={() => setMostraStampaArt87(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>

            <div className="border border-slate-300 p-8 rounded-xl bg-white space-y-5 font-serif text-slate-900 text-xs">
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <h3 className="text-base font-black uppercase font-sans text-slate-950">
                  {config.nome}
                </h3>
                <p className="text-[11px] font-sans text-slate-600">
                  C.F. {config.codiceFiscale} • Iscr. RUNTS: {config.numeroRunts || 'In atti'}
                </p>
                <div className="pt-2 font-sans font-bold text-xs uppercase text-amber-900">
                  Rendiconto Separato della Raccolta Fondi Pubblica Occasionale (ex Art. 87 c. 6 D.Lgs. 117/2017)
                </div>
              </div>

              <div className="space-y-2 font-sans text-[11px]">
                <div><strong>Iniziativa / Manifestazione:</strong> {campagnaSelezionata.titolo}</div>
                <div><strong>Periodo di svolgimento:</strong> Anno {campagnaSelezionata.anno} ({campagnaSelezionata.dataInizio} {campagnaSelezionata.dataFine ? `al ${campagnaSelezionata.dataFine}` : ''})</div>
                <div><strong>Responsabile Progetto:</strong> {campagnaSelezionata.responsabileProgetto || config.nomePresidente}</div>
                <div><strong>Delibera Consiglio Direttivo:</strong> {campagnaSelezionata.deliberaConsiglio || 'Delibera C.D. istitutiva'}</div>
              </div>

              {/* Prospetto Economico Campagna */}
              <table className="w-full border-collapse border border-slate-400 font-sans text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-400 p-2 text-left">Voce Descrittiva</th>
                    <th className="border border-slate-400 p-2 text-right w-32">Importo (€)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-2">A) ENTRATE LORDE RACCOLTE TRA IL PUBBLICO</td>
                    <td className="border border-slate-400 p-2 text-right font-mono font-bold">€ {entrateLordeCampagna.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2">B) ONERI E SPESE SOSTENUTE PER LA RACCOLTA (Materiali, tipografia, allestimenti)</td>
                    <td className="border border-slate-400 p-2 text-right font-mono font-bold">€ {oneriSostenutiCampagna.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-amber-50 font-black border-t-2 border-slate-900">
                    <td className="border border-slate-900 p-2 text-right">RISULTATO NETTO DELLA RACCOLTA FONDI (A - B):</td>
                    <td className="border border-slate-900 p-2 text-right font-mono text-sm">€ {avanzoNettoCampagna.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Relazione Illustrativa */}
              <div className="space-y-2 font-sans text-[11px] pt-2">
                <h6 className="font-bold text-slate-900 uppercase">Relazione Illustrativa del Presidente:</h6>
                <p className="text-slate-700 leading-relaxed italic border-l-2 border-slate-300 pl-3">
                  «La raccolta pubblica di fondi è stata promossa conformemente all'Art. 7 del D.Lgs. 117/2017 in occasione delle iniziative territoriali della Pro Loco, senza cessione di beni a scopo commerciale ma mediante offerta libera e consapevole dei cittadini e visitatori. I fondi netti raccolti pari a € {avanzoNettoCampagna.toFixed(2)} sono stati integralmente vincolati al progetto statutario stabilito. La presente rendicontazione è conforme alle scritture contabili dell'Ente.»
                </p>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-6 text-center font-sans text-[11px]">
                <div className="space-y-8">
                  <span>Il Responsabile della Raccolta</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">(Firma)</div>
                </div>
                <div className="space-y-8">
                  <span>Il Presidente della Pro Loco</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-800">{config.nomePresidente}</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE STAMPA MODELLO DI OPPOSIZIONE DEL DONATORE        */}
      {/* ======================================================== */}
      {mostraStampaOpposizione && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-slate-300 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="font-bold text-xs text-teal-800 uppercase">
                Modulo Ufficiale Esercizio Diritto di Opposizione (DM MEF 3/2/2021)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa Modulo</span>
                </button>
                <button
                  onClick={() => setMostraStampaOpposizione(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>

            <div className="border border-slate-300 p-8 rounded-xl bg-white space-y-5 font-serif text-slate-900 text-xs leading-relaxed">
              <div className="text-center pb-3 border-b border-slate-300">
                <h4 className="font-bold font-sans text-sm uppercase">MODELLO DI OPPOSIZIONE ALLA TRASMISSIONE DEI DATI ALL'AGENZIA DELLE ENTRATE</h4>
                <p className="text-[11px] font-sans text-slate-500">Ai sensi del Decreto del Ministero dell'Economia e delle Finanze del 3 febbraio 2021</p>
              </div>

              <div className="space-y-2 font-sans text-[11px]">
                <p>Spettabile <strong>{config.nome}</strong> (C.F. {config.codiceFiscale})</p>
                <p>
                  Il/La sottoscritto/a <strong>{mostraStampaOpposizione.donatore}</strong>, Codice Fiscale <strong>{mostraStampaOpposizione.codiceFiscalePartitaIva}</strong>, in qualità di soggetto erogatore della donazione di <strong>€ {mostraStampaOpposizione.importo.toFixed(2)}</strong> del <strong>{mostraStampaOpposizione.data}</strong> (Quietanza n. {mostraStampaOpposizione.ricevutaNumero}),
                </p>
                <p className="font-bold uppercase text-center py-2 bg-slate-100 rounded">
                  ESERCITA IL PROPRIO DIRITTO DI OPPOSIZIONE
                </p>
                <p>
                  all'inserimento dei dati relativi alla suddetta erogazione liberale nella dichiarazione dei redditi precompilata (Modello 730 / Modello Redditi) predisposta dall'Agenzia delle Entrate per il periodo d'imposta {mostraStampaOpposizione.anno}.
                </p>
                <p className="text-slate-600 text-[10.5px]">
                  Resta ferma la possibilità per il donatore di inserire la detrazione/deduzione manualmente in sede di dichiarazione dei redditi esibendo la ricevuta di pagamento tracciabile.
                </p>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-6 text-center font-sans text-[11px]">
                <div className="space-y-6">
                  <div>Data: __________________</div>
                </div>
                <div className="space-y-6">
                  <div>Firma del Donatore: ___________________________</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
