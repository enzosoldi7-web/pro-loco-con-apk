import React, { useState } from 'react';
import { DonazioneTerzi, ProLocoInfo, CampagnaRaccoltaFondi } from '../types';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  HeartHandshake, 
  Target, 
  Coins, 
  FileSpreadsheet, 
  CheckCircle2, 
  Info,
  Scale
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts';

interface DonazioneContoEconomicoProps {
  donazioni: DonazioneTerzi[];
  campagne: CampagnaRaccoltaFondi[];
  config: ProLocoInfo;
  annoSelezionato: number;
}

export const DonazioneContoEconomico: React.FC<DonazioneContoEconomicoProps> = ({
  donazioni,
  campagne,
  config,
  annoSelezionato
}) => {
  const [modalitaStampa, setModalitaStampa] = useState<boolean>(false);

  // Filtro donazioni per l'esercizio selezionato (escludendo revocate per ripensamento Punto 1.4)
  const donazioniAnno = donazioni.filter(d => d.anno === annoSelezionato && d.stato !== 'annullata_ripensamento');

  // 1. C.1 Proventi da raccolte pubbliche occasionali di fondi
  const proventiRaccoltePubbliche = donazioniAnno
    .filter(d => d.tipoErogazione === 'raccolta_fondi_pubblica')
    .reduce((acc, d) => acc + d.importo, 0);

  // 2. C.2 Proventi da erogazioni liberali da persone fisiche (Art. 83 c.1)
  const proventiPersoneFisiche = donazioniAnno
    .filter(d => d.tipoDonatore === 'privato' && d.tipoErogazione !== 'raccolta_fondi_pubblica' && d.tipoErogazione !== '5_per_mille')
    .reduce((acc, d) => acc + d.importo, 0);

  // 3. C.3 Proventi da erogazioni liberali da altri enti o imprese (Art. 83 c.2)
  const proventiImpreseEnti = donazioniAnno
    .filter(d => (d.tipoDonatore === 'azienda' || d.tipoDonatore === 'fondazione' || d.tipoDonatore === 'ente_benefico' || d.tipoDonatore === 'associazione'))
    .reduce((acc, d) => acc + d.importo, 0);

  // 4. C.4 Proventi da quota 5 per mille (5x1000)
  const proventi5x1000 = donazioniAnno
    .filter(d => d.tipoErogazione === '5_per_mille')
    .reduce((acc, d) => acc + d.importo, 0);

  // 5. C.5 Altre erogazioni, lasciti o memorie
  const proventiAltriLasciti = donazioniAnno
    .filter(d => d.tipoErogazione === 'in_memoria' || d.tipoErogazione === 'lascito_testamentario' || (!d.tipoErogazione && d.tipoDonatore === 'anonimo'))
    .reduce((acc, d) => acc + d.importo, 0);

  // Totale Entrate / Proventi Sezione C
  const totaleProventiSezioneC = proventiRaccoltePubbliche + proventiPersoneFisiche + proventiImpreseEnti + proventi5x1000 + proventiAltriLasciti;

  // Oneri Sezione C: oneri documentati campagne + commissioni bancarie donazioni
  const oneriCampagneAnno = campagne
    .filter(c => c.anno === annoSelezionato)
    .reduce((acc, c) => acc + (c.oneriSostenuti || 0), 0);

  const oneriCommissioniBancarie = donazioniAnno
    .reduce((acc, d) => acc + (d.oneriCorrelati || 0), 0);

  const totaleOneriSezioneC = oneriCampagneAnno + oneriCommissioniBancarie;

  // Risultato Gestionale Netto Sezione C (Avanzo / Disavanzo Raccolta Fondi)
  const avanzoNettoSezioneC = totaleProventiSezioneC - totaleOneriSezioneC;

  // Dati per Grafico
  const datiGrafico = [
    { nome: 'Privati Cittadini', valore: proventiPersoneFisiche, colore: '#047857' },
    { nome: 'Aziende & Imprese', valore: proventiImpreseEnti, colore: '#0d9488' },
    { nome: 'Raccolte di Piazza', valore: proventiRaccoltePubbliche, colore: '#d97706' },
    { nome: 'Quota 5 per Mille', valore: proventi5x1000, colore: '#4f46e5' },
    { nome: 'Lasciti & Memoria', valore: proventiAltriLasciti, colore: '#9333ea' }
  ].filter(item => item.valore > 0);

  const esportaCSVRendicontoC = () => {
    const intestazioni = ['Voce Ministeriale Modello D RUNTS', 'Codice Voce', 'Importo Esercizio (€)'];
    const righe = [
      ['PROVENTI DA RACCOLTE FONDI ED EROGAZIONI LIBERALI', '', ''],
      ['Proventi da raccolte pubbliche occasionali di fondi', 'C.1', proventiRaccoltePubbliche.toFixed(2)],
      ['Erogazioni liberali da persone fisiche (Art. 83 c.1 CTS)', 'C.2', proventiPersoneFisiche.toFixed(2)],
      ['Erogazioni liberali da enti, fondazioni e imprese (Art. 83 c.2 CTS)', 'C.3', proventiImpreseEnti.toFixed(2)],
      ['Contributi da destinazione quota 5 per mille', 'C.4', proventi5x1000.toFixed(2)],
      ['Altri proventi da liberalità, lasciti e donazioni in memoria', 'C.5', proventiAltriLasciti.toFixed(2)],
      ['TOTALE PROVENTI RACCOLTA FONDI ED EROGAZIONI (C)', 'TOT C-PROV', totaleProventiSezioneC.toFixed(2)],
      ['', '', ''],
      ['ONERI DELLA RACCOLTA FONDI ED EROGAZIONI LIBERALI', '', ''],
      ['Oneri documentati per manifestazioni pubbliche e campagne', 'C.O1', oneriCampagneAnno.toFixed(2)],
      ['Commissioni bancarie, POS e spese vive gestione donazioni', 'C.O2', oneriCommissioniBancarie.toFixed(2)],
      ['TOTALE ONERI RACCOLTA FONDI ED EROGAZIONI (C)', 'TOT C-ONER', totaleOneriSezioneC.toFixed(2)],
      ['', '', ''],
      ['RISULTATO DI GESTIONE SEZIONE C (AVANZO/DISAVANZO NETTO)', 'RIS-C', avanzoNettoSezioneC.toFixed(2)]
    ].map(r => r.map(c => `"${c}"`).join(';'));

    const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Conto_Economico_Sezione_C_Donazioni_${config.nome.replace(/\s+/g, '_')}_${annoSelezionato}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Intestazione Sezione Conto Economico */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              Modello D RUNTS • DM 39/2020
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">
              Esercizio {annoSelezionato}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <span>Conto Economico & Rendiconto Gestionale Donazioni (Sezione C)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Rendiconto ufficiale per cassa prescritto dal Codice del Terzo Settore (D.Lgs. 117/2017) per l'evidenza delle erogazioni liberali, raccolte pubbliche e oneri correlati.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={esportaCSVRendicontoC}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
            title="Esporta Conto Economico Sezione C in formato CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Esporta CSV</span>
          </button>
          <button
            onClick={() => setModalitaStampa(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Stampa Ufficiale A4 del Rendiconto di Gestione Donazioni"
          >
            <Printer className="w-4 h-4" />
            <span>Stampa Rendiconto A4</span>
          </button>
        </div>
      </div>

      {/* Schede Sintesi Saldi Economici */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>Totale Proventi Sez. C</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            € {totaleProventiSezioneC.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {donazioniAnno.length} erogazioni liberali registrate
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
            <span>Oneri & Costi Raccolta</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            € {totaleOneriSezioneC.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Spese allestimenti, tipografia e bancarie
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-indigo-800 font-bold mb-1">
            <span>Avanzo Netto Sezione C</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-2xl font-black font-mono ${avanzoNettoSezioneC >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            € {avanzoNettoSezioneC.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Disponibile per scopi statutari Pro Loco
          </p>
        </div>

      </div>

      {/* Prospetto Ufficiale Modello D: Tabella Rendicontazione Sezione C */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabella Dettagliata delle Voci */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-700" />
              <span>Prospetto Economico Ministeriale • Sezione C (D.Lgs. 117/2017)</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-bold">Valori in Euro (€)</span>
          </div>

          <div className="p-5 space-y-6">
            
            {/* 1. SEZIONE PROVENTI (ENTRATE) */}
            <div className="space-y-2">
              <div className="text-xs font-black text-emerald-900 uppercase tracking-wider pb-1 border-b-2 border-emerald-600 flex items-center justify-between">
                <span>C) PROVENTI DA ATTIVITÀ DI RACCOLTA FONDI ED EROGAZIONI LIBERALI</span>
                <span>Esercizio {annoSelezionato}</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.1</span>
                    <span className="text-slate-800 font-medium">Proventi da raccolte pubbliche occasionali di fondi (Art. 7 c. 2 CTS)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {proventiRaccoltePubbliche.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.2</span>
                    <div>
                      <span className="text-slate-800 font-medium">Erogazioni liberali da privati cittadini</span>
                      <span className="text-[10px] text-emerald-700 ml-1.5 font-bold">(Detraibili 30% IRPEF ex Art. 83 c.1)</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {proventiPersoneFisiche.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.3</span>
                    <div>
                      <span className="text-slate-800 font-medium">Erogazioni liberali da imprese, società ed enti</span>
                      <span className="text-[10px] text-teal-700 ml-1.5 font-bold">(Deducibili IRES 10% ex Art. 83 c.2)</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {proventiImpreseEnti.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.4</span>
                    <span className="text-slate-800 font-medium">Contributi da quota 5 per mille dell'IRPEF</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {proventi5x1000.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.5</span>
                    <span className="text-slate-800 font-medium">Altri proventi da liberalità, memorie e lasciti testamentari</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {proventiAltriLasciti.toFixed(2)}
                  </span>
                </div>

                {/* Subtotale Proventi */}
                <div className="py-2.5 bg-emerald-50/60 px-2 rounded-lg flex items-center justify-between font-black text-emerald-950">
                  <span>TOTALE PROVENTI RACCOLTA FONDI ED EROGAZIONI LIBERALI (C)</span>
                  <span className="font-mono text-sm">
                    € {totaleProventiSezioneC.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SEZIONE ONERI (USCITE) */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-black text-amber-900 uppercase tracking-wider pb-1 border-b-2 border-amber-600 flex items-center justify-between">
                <span>ONERI DA ATTIVITÀ DI RACCOLTA FONDI</span>
                <span>Esercizio {annoSelezionato}</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.O1</span>
                    <span className="text-slate-800 font-medium">Oneri diretti per manifestazioni pubbliche, allestimenti e materiali informativi</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {oneriCampagneAnno.toFixed(2)}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-8">C.O2</span>
                    <span className="text-slate-800 font-medium">Commissioni bancarie, POS, tenuta conti vincolati e spese incasso</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    € {oneriCommissioniBancarie.toFixed(2)}
                  </span>
                </div>

                {/* Subtotale Oneri */}
                <div className="py-2.5 bg-amber-50/60 px-2 rounded-lg flex items-center justify-between font-black text-amber-950">
                  <span>TOTALE ONERI RACCOLTA FONDI (C)</span>
                  <span className="font-mono text-sm">
                    € {totaleOneriSezioneC.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. RISULTATO NETTO SEZIONE C */}
            <div className="p-4 rounded-xl border border-slate-300 bg-gradient-to-r from-slate-50 to-emerald-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-black text-slate-900 text-sm block">
                  AVANZO / DISAVANZO ATTIVITÀ DI RACCOLTA FONDI (Sezione C)
                </span>
                <span className="text-[11px] text-slate-500">
                  Avanzo di gestione destinato per legge esclusivamente al perseguimento delle finalità civiche e solidaristiche
                </span>
              </div>
              <span className={`text-base font-black font-mono px-3 py-1 rounded-lg ${
                avanzoNettoSezioneC >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                € {avanzoNettoSezioneC.toFixed(2)}
              </span>
            </div>

          </div>
        </div>

        {/* Grafico di Ripartizione & Note Legali */}
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Ripartizione Tipologia Donazioni
            </h4>

            {datiGrafico.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessuna erogazione liberale registrata per l'esercizio {annoSelezionato}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datiGrafico}
                        dataKey="valore"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        paddingAngle={3}
                      >
                        {datiGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.colore} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => [`€ ${val.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 'Importo']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 text-xs">
                  {datiGrafico.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.colore }} />
                        <span className="text-slate-700">{item.nome}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        € {item.valore.toFixed(2)} ({((item.valore / (totaleProventiSezioneC || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Box Normativo e Vincolo di Destinazione */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Principio di Inerenza ex Art. 8 D.Lgs. 117/2017</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Il patrimonio della Pro Loco, comprensivo di donazioni, raccolte fondi e quote sociali, è interamente e stabilmente destinato allo svolgimento dell'attività statutaria. È fatto divieto assoluto di distribuzione, anche indiretta, di utili ed avanzi di gestione.
            </p>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* MODALE DI STAMPA UFFICIALE A4 RENDICONTO MODELLO D RUNTS */}
      {/* ======================================================== */}
      {modalitaStampa && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 border border-slate-300 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Printer className="w-4 h-4" />
                <span>Anteprima di Stampa Ministeriale A4 • Rendiconto Sezione C</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Avvia Stampa / Salva PDF</span>
                </button>
                <button
                  onClick={() => setModalitaStampa(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>

            {/* Foglio A4 Simulato */}
            <div className="border border-slate-300 p-8 rounded-xl bg-white space-y-6 font-serif text-slate-900 text-xs">
              
              {/* Intestazione Ufficiale */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <div className="text-[10px] uppercase font-sans tracking-widest text-slate-500 font-bold">
                  Repubblica Italiana • Registro Unico Nazionale del Terzo Settore (RUNTS)
                </div>
                <h2 className="text-lg font-black tracking-wide font-sans text-slate-950 uppercase">
                  {config.nome}
                </h2>
                <p className="text-[11px] font-sans text-slate-600">
                  Associazione di Promozione Sociale (APS) • C.F.: <span className="font-mono font-bold">{config.codiceFiscale}</span>
                  {config.numeroRunts && <span> • Iscr. RUNTS: {config.numeroRunts}</span>}
                </p>
                <p className="text-[11px] font-sans text-slate-600">
                  Sede Legale: {config.indirizzo}, {config.cap} {config.comune} ({config.provincia})
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-sans font-bold text-xs uppercase rounded border border-slate-300">
                    Rendiconto di Gestione per Cassa (Mod. D) • Sezione C: Attività di Raccolta Fondi ed Erogazioni Liberali • Esercizio {annoSelezionato}
                  </span>
                </div>
              </div>

              {/* Tabella Ufficiale Stampa */}
              <table className="w-full border-collapse border border-slate-400 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                    <th className="border border-slate-400 p-2 text-left w-14">Rif.</th>
                    <th className="border border-slate-400 p-2 text-left">Voci del Rendiconto di Cassa (D.M. 39/2020)</th>
                    <th className="border border-slate-400 p-2 text-right w-28">Esercizio {annoSelezionato} (€)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="border border-slate-400 p-1.5 text-emerald-950">
                      C) PROVENTI DA ATTIVITÀ DI RACCOLTA FONDI ED EROGAZIONI LIBERALI
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.1</td>
                    <td className="border border-slate-400 p-1.5">Proventi da raccolte pubbliche occasionali di fondi svolte nell'esercizio</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{proventiRaccoltePubbliche.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.2</td>
                    <td className="border border-slate-400 p-1.5">Erogazioni liberali da privati cittadini con tracciabilità bancaria (Art. 83 c.1 CTS)</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{proventiPersoneFisiche.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.3</td>
                    <td className="border border-slate-400 p-1.5">Erogazioni liberali da imprese, società ed enti giuridici (Art. 83 c.2 CTS)</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{proventiImpreseEnti.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.4</td>
                    <td className="border border-slate-400 p-1.5">Quote e contributi attribuiti dal Ministero per il 5 per mille</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{proventi5x1000.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.5</td>
                    <td className="border border-slate-400 p-1.5">Altri proventi da liberalità e donazioni in memoria</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{proventiAltriLasciti.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold border-t-2 border-slate-400">
                    <td colSpan={2} className="border border-slate-400 p-2 text-right">TOTALE PROVENTI RACCOLTA FONDI (C):</td>
                    <td className="border border-slate-400 p-2 text-right font-mono font-black">€ {totaleProventiSezioneC.toFixed(2)}</td>
                  </tr>

                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="border border-slate-400 p-1.5 text-amber-950">
                      ONERI DA ATTIVITÀ DI RACCOLTA FONDI
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.O1</td>
                    <td className="border border-slate-400 p-1.5">Oneri diretti per manifestazioni pubbliche, allestimenti e materiali informativi</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{oneriCampagneAnno.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-mono text-center">C.O2</td>
                    <td className="border border-slate-400 p-1.5">Commissioni bancarie, POS, tenuta conti dedicati e spese incasso tracciato</td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">{oneriCommissioniBancarie.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-amber-50 font-bold border-t-2 border-slate-400">
                    <td colSpan={2} className="border border-slate-400 p-2 text-right">TOTALE ONERI RACCOLTA FONDI (C):</td>
                    <td className="border border-slate-400 p-2 text-right font-mono font-black">€ {totaleOneriSezioneC.toFixed(2)}</td>
                  </tr>

                  <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-xs">
                    <td colSpan={2} className="border border-slate-900 p-2.5 text-right uppercase">
                      AVANZO / (DISAVANZO) DELLA SEZIONE C:
                    </td>
                    <td className="border border-slate-900 p-2.5 text-right font-mono text-sm">
                      € {avanzoNettoSezioneC.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Riquadro Attestazione e Firme */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center font-sans text-[11px]">
                <div className="space-y-10">
                  <span>Il Tesoriere</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                    (Firma autografa)
                  </div>
                </div>
                <div className="space-y-10">
                  <span>Il Presidente del C.D.</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-800">
                    {config.nomePresidente}
                  </div>
                </div>
                <div className="space-y-10">
                  <span>Organo di Controllo / Revisori</span>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                    (Visto di conformità)
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
