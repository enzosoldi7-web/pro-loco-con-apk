import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Activity,
  Scale,
  Euro,
  UserCheck
} from 'lucide-react';
import { Socio, ProLocoEvento, PaginaPrincipale, SottoTabGestionale } from '../types';
import { calcolaEconomiaEvento } from '../utils/eventoHelpers';

interface DashboardAnalyticsSectionProps {
  soci: Socio[];
  eventi: ProLocoEvento[];
  annoSelezionato: number;
  onNavigaPagina: (
    pagina: PaginaPrincipale,
    sottoTab?: SottoTabGestionale
  ) => void;
}

const MESI_ITALIANI = [
  { indice: 0, breve: 'Gen', esteso: 'Gennaio' },
  { indice: 1, breve: 'Feb', esteso: 'Febbraio' },
  { indice: 2, breve: 'Mar', esteso: 'Marzo' },
  { indice: 3, breve: 'Apr', esteso: 'Aprile' },
  { indice: 4, breve: 'Mag', esteso: 'Maggio' },
  { indice: 5, breve: 'Giu', esteso: 'Giugno' },
  { indice: 6, breve: 'Lug', esteso: 'Luglio' },
  { indice: 7, breve: 'Ago', esteso: 'Agosto' },
  { indice: 8, breve: 'Set', esteso: 'Settembre' },
  { indice: 9, breve: 'Ott', esteso: 'Ottobre' },
  { indice: 10, breve: 'Nov', esteso: 'Novembre' },
  { indice: 11, breve: 'Dic', esteso: 'Dicembre' }
];

export const DashboardAnalyticsSection: React.FC<DashboardAnalyticsSectionProps> = ({
  soci,
  eventi,
  annoSelezionato,
  onNavigaPagina
}) => {
  // Controlli interattivi Grafico 1 (Iscrizioni Soci)
  const [modalitaSoci, setModalitaSoci] = useState<'combinato' | 'storico_albo' | 'confronto_anni'>('combinato');

  // Controlli interattivi Grafico 2 (Entrate vs Uscite Pianificate Eventi)
  const [vistaEventi, setVistaEventi] = useState<'per_evento' | 'mensile'>('per_evento');
  const [perimetroEconomico, setPerimetroEconomico] = useState<'totale' | 'proloco'>('totale');

  const sociAttivi = useMemo(() => soci.filter(s => !s.dataCancellazione), [soci]);

  // Elaborazione dati mensili per il grafico Iscrizioni & Rinnovi Soci
  const datiMensiliSoci = useMemo(() => {
    let progressivoAnno = 0;
    let progressivoAlbo = 0;

    return MESI_ITALIANI.map((m) => {
      // 1. Nuove iscrizioni all'albo registrate in questo mese (nell'anno selezionato)
      let nuoveIscrizioniAnno = 0;
      // 2. Rinnovi / quote saldate in questo mese per l'anno selezionato
      let rinnoviQuotaAnno = 0;
      // 3. Rinnovi / quote saldate nell'anno precedente nello stesso mese
      let tesseramentiAnnoPrec = 0;
      // 4. Distribuzione storica per mese di prima iscrizione all'Albo Soci
      let iscrizioniStoricheAlbo = 0;
      // 5. Importo quote versate nel mese per l'anno selezionato
      let incassoQuoteMese = 0;

      const nominativiMese: string[] = [];

      sociAttivi.forEach((socio) => {
        // Verifica data prima iscrizione all'Albo
        if (socio.dataIscrizione) {
          const partiIscr = socio.dataIscrizione.split('-');
          const annoIscr = parseInt(partiIscr[0], 10);
          const meseIscr = parseInt(partiIscr[1], 10) - 1;

          if (meseIscr === m.indice) {
            iscrizioniStoricheAlbo += 1;
            if (annoIscr === annoSelezionato) {
              nuoveIscrizioniAnno += 1;
              nominativiMese.push(`${socio.cognome} ${socio.nome} (Nuovo)`);
            }
          }
        }

        // Verifica quota pagata per annoSelezionato
        const quotaCorrente = (socio.quote || []).find(q => q.anno === annoSelezionato);
        if (quotaCorrente && quotaCorrente.dataPagamento) {
          const partiPag = quotaCorrente.dataPagamento.split('-');
          const mesePag = parseInt(partiPag[1], 10) - 1;
          if (mesePag === m.indice) {
            rinnoviQuotaAnno += 1;
            incassoQuoteMese += Number(quotaCorrente.importo) || 0;
            const label = `${socio.cognome} ${socio.nome}`;
            if (!nominativiMese.some(n => n.startsWith(label))) {
              nominativiMese.push(label);
            }
          }
        }

        // Verifica quota pagata per annoSelezionato - 1
        const quotaPrec = (socio.quote || []).find(q => q.anno === annoSelezionato - 1);
        if (quotaPrec && quotaPrec.dataPagamento) {
          const partiPagPrec = quotaPrec.dataPagamento.split('-');
          const mesePagPrec = parseInt(partiPagPrec[1], 10) - 1;
          if (mesePagPrec === m.indice) {
            tesseramentiAnnoPrec += 1;
          }
        }
      });

      // Totale movimenti associativi del mese (rinnovi + nuove iscrizioni + storico albo)
      const movimentiAnno = rinnoviQuotaAnno + nuoveIscrizioniAnno;
      progressivoAnno += movimentiAnno;
      progressivoAlbo += iscrizioniStoricheAlbo;

      return {
        mese: m.breve,
        meseEsteso: m.esteso,
        rinnoviAnno: rinnoviQuotaAnno,
        nuoveIscrizioniAnno,
        totaleMeseAnno: movimentiAnno,
        tesseramentiAnnoPrec,
        iscrizioniStoricheAlbo,
        cumulativoAnno: progressivoAnno,
        cumulativoAlbo: progressivoAlbo,
        incassoQuoteMese,
        nominativi: nominativiMese.slice(0, 4)
      };
    });
  }, [sociAttivi, annoSelezionato]);

  // Statistiche di sintesi per il pannello Soci
  const riepilogoSociChart = useMemo(() => {
    const totMovimentiAnno = datiMensiliSoci.reduce((acc, d) => acc + d.totaleMeseAnno, 0);
    const totIncassoAnno = datiMensiliSoci.reduce((acc, d) => acc + d.incassoQuoteMese, 0);
    const picco = [...datiMensiliSoci].sort(
      (a, b) => (b.totaleMeseAnno + b.iscrizioniStoricheAlbo) - (a.totaleMeseAnno + a.iscrizioniStoricheAlbo)
    )[0];

    return {
      totMovimentiAnno,
      totIncassoAnno,
      mesePicco: picco && (picco.totaleMeseAnno > 0 || picco.iscrizioniStoricheAlbo > 0) ? picco.meseEsteso : 'Gennaio'
    };
  }, [datiMensiliSoci]);

  // Eventi filtrati per l'anno selezionato (o tutti se l'anno non ha eventi)
  const eventiRiferimento = useMemo(() => {
    const filtrati = eventi.filter((e) => {
      const annoEv = parseInt(e.dataInizio.slice(0, 4), 10) || new Date(e.dataInizio).getFullYear();
      return annoEv === annoSelezionato;
    });
    const lista = filtrati.length > 0 ? filtrati : eventi;
    return [...lista].sort((a, b) => a.dataInizio.localeCompare(b.dataInizio));
  }, [eventi, annoSelezionato]);

  // Elaborazione dati per Grafico 2: Confronto Entrate vs Uscite Pianificate per Singolo Evento
  const datiEventiPianificati = useMemo(() => {
    return eventiRiferimento.map((ev) => {
      const eco = calcolaEconomiaEvento(ev);
      const entratePianificate =
        perimetroEconomico === 'totale' ? eco.entrateTotaliPreviste : eco.entrateProLocoPreviste;
      const uscitePianificate =
        perimetroEconomico === 'totale' ? eco.costiTotaliPreventivo : eco.costiProLocoPreventivo;
      const entrateReali =
        perimetroEconomico === 'totale' ? eco.entrateTotaliRealizzate : eco.entrateProLocoRealizzate;
      const usciteReali =
        perimetroEconomico === 'totale' ? eco.costiTotaliConsuntivo : eco.costiProLocoConsuntivo;

      const marginePianificato = entratePianificate - uscitePianificate;
      const titoloBreve = ev.titolo.length > 20 ? `${ev.titolo.slice(0, 19)}…` : ev.titolo;

      return {
        id: ev.id,
        nomeBreve: titoloBreve,
        titoloCompleto: ev.titolo,
        dataInizio: ev.dataInizio,
        luogo: ev.luogo,
        modello: eco.etichettaTipo,
        entratePianificate,
        uscitePianificate,
        marginePianificato,
        entrateReali,
        usciteReali,
        foodPrev: eco.foodPrev,
        intrattenimentoPrev: eco.intrattenimentoPrev,
        altreSpesePrev: eco.altreSpesePrev,
        variePrev: eco.variePrev
      };
    });
  }, [eventiRiferimento, perimetroEconomico]);

  // Elaborazione dati mensili per Grafico 2 (vista mensile aggregata degli eventi)
  const datiEventiMensili = useMemo(() => {
    return MESI_ITALIANI.map((m) => {
      let entratePianificate = 0;
      let uscitePianificate = 0;
      let numeroEventiMese = 0;
      const titoliMese: string[] = [];

      eventiRiferimento.forEach((ev) => {
        const parti = ev.dataInizio.split('-');
        const meseEv = parseInt(parti[1], 10) - 1;
        if (meseEv === m.indice) {
          const eco = calcolaEconomiaEvento(ev);
          entratePianificate +=
            perimetroEconomico === 'totale' ? eco.entrateTotaliPreviste : eco.entrateProLocoPreviste;
          uscitePianificate +=
            perimetroEconomico === 'totale' ? eco.costiTotaliPreventivo : eco.costiProLocoPreventivo;
          numeroEventiMese += 1;
          titoliMese.push(ev.titolo);
        }
      });

      return {
        nomeBreve: m.breve,
        titoloCompleto: `Mese di ${m.esteso} ${annoSelezionato}`,
        entratePianificate,
        uscitePianificate,
        marginePianificato: entratePianificate - uscitePianificate,
        numeroEventiMese,
        titoliMese
      };
    });
  }, [eventiRiferimento, perimetroEconomico, annoSelezionato]);

  // Totali complessivi per il pannello Eventi
  const totaliPianificatiEventi = useMemo(() => {
    const totEntrate = datiEventiPianificati.reduce((acc, d) => acc + d.entratePianificate, 0);
    const totUscite = datiEventiPianificati.reduce((acc, d) => acc + d.uscitePianificate, 0);
    const margine = totEntrate - totUscite;
    return { totEntrate, totUscite, margine };
  }, [datiEventiPianificati]);

  return (
    <section
      aria-label="Analisi visuale iscrizioni soci e bilancio eventi pianificati"
      className="space-y-4"
    >
      {/* Intestazione Sezione Analitica */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Activity className="w-4 h-4 text-emerald-700" />
            <span>Monitoraggio Direzionale & Analisi Grafica</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-500 font-normal">Esercizio {annoSelezionato}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
            Andamento Mensile Tesseramento Soci & Bilancio Eventi Pianificati
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span>{sociAttivi.length} soci in Albo</span>
          <span aria-hidden="true">·</span>
          <span>{eventiRiferimento.length} manifestazioni analizzate</span>
        </div>
      </div>

      {/* Griglia a 2 Colonne per i due Grafici Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLONNA 1: GRAFICO ANDAMENTO MENSILE ISCRIZIONI SOCI */}
        <div className="bg-white/95 rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(45,38,30,0.04)] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header Card 1 + Selettore Vista */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Andamento Mensile Iscrizioni Soci
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Flusso mensile tesseramenti, prime iscrizioni Albo e curva cumulativa
                    </p>
                  </div>
                </div>
              </div>

              {/* Controlli filtro interattivi */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl self-start shrink-0">
                <button
                  type="button"
                  onClick={() => setModalitaSoci('combinato')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    modalitaSoci === 'combinato'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Anno {annoSelezionato}
                </button>
                <button
                  type="button"
                  onClick={() => setModalitaSoci('storico_albo')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    modalitaSoci === 'storico_albo'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Storico Albo
                </button>
                <button
                  type="button"
                  onClick={() => setModalitaSoci('confronto_anni')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    modalitaSoci === 'confronto_anni'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {annoSelezionato} vs {annoSelezionato - 1}
                </button>
              </div>
            </div>

            {/* Metriche sintetiche con numeri tabulari */}
            <div className="grid grid-cols-3 gap-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/60">
              <div>
                <span className="text-[11px] text-stone-500 block">Soci Attivi in Albo</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                  {sociAttivi.length}
                </span>
                <span className="text-[10.5px] text-emerald-700 block">
                  {riepilogoSociChart.totMovimentiAnno} tesserati {annoSelezionato}
                </span>
              </div>
              <div className="border-l border-stone-200/80 pl-3">
                <span className="text-[11px] text-stone-500 block">Gettito Quote {annoSelezionato}</span>
                <span className="text-lg font-extrabold text-emerald-800 font-mono tabular-nums">
                  € {riepilogoSociChart.totIncassoAnno.toLocaleString('it-IT')}
                </span>
                <span className="text-[10.5px] text-stone-500 block">incasso tesseramento</span>
              </div>
              <div className="border-l border-stone-200/80 pl-3">
                <span className="text-[11px] text-stone-500 block">Mese di Picco</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 block truncate">
                  {riepilogoSociChart.mesePicco}
                </span>
                <span className="text-[10.5px] text-teal-700 block">maggiore affluenza</span>
              </div>
            </div>

            {/* Contenitore Grafico Recharts Soci */}
            <div className="h-64 sm:h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {modalitaSoci === 'confronto_anni' ? (
                  <BarChart
                    data={datiMensiliSoci}
                    margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis
                      dataKey="mese"
                      tick={{ fontSize: 11, fill: '#57534e', fontWeight: 600 }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1.5">
                            <div className="font-bold text-emerald-300 border-b border-slate-700 pb-1">
                              {d.meseEsteso} · Confronto Tesseramento
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Tesserati {annoSelezionato}:</span>
                              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                {d.totaleMeseAnno} soci (€ {d.incassoQuoteMese})
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Tesserati {annoSelezionato - 1}:</span>
                              <span className="font-mono font-bold text-teal-300 tabular-nums">
                                {d.tesseramentiAnnoPrec} soci
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="totaleMeseAnno"
                      name={`Iscrizioni & Rinnovi ${annoSelezionato}`}
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={26}
                    />
                    <Bar
                      dataKey="tesseramentiAnnoPrec"
                      name={`Tesseramenti ${annoSelezionato - 1}`}
                      fill="#94a3b8"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={26}
                    />
                  </BarChart>
                ) : (
                  <ComposedChart
                    data={datiMensiliSoci}
                    margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="gradCumulativoSoci" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis
                      dataKey="mese"
                      tick={{ fontSize: 11, fill: '#57534e', fontWeight: 600 }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1.5 max-w-xs">
                            <div className="font-bold text-emerald-300 border-b border-slate-700 pb-1 flex items-center justify-between gap-3">
                              <span>{d.meseEsteso}</span>
                              <span className="text-[10px] font-mono text-slate-300">
                                Esercizio {annoSelezionato}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Rinnovi & Nuovi ({annoSelezionato}):</span>
                              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                {d.totaleMeseAnno} soci
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Prime Iscrizioni Storiche Albo:</span>
                              <span className="font-mono font-bold text-amber-300 tabular-nums">
                                {d.iscrizioniStoricheAlbo} soci
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Progressivo Cumulativo:</span>
                              <span className="font-mono font-bold text-teal-300 tabular-nums">
                                {modalitaSoci === 'storico_albo' ? d.cumulativoAlbo : d.cumulativoAnno} soci
                              </span>
                            </div>
                            {d.incassoQuoteMese > 0 && (
                              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                                <span className="text-slate-400">Quote versate nel mese:</span>
                                <span className="font-mono font-bold text-white tabular-nums">
                                  € {d.incassoQuoteMese.toLocaleString('it-IT')}
                                </span>
                              </div>
                            )}
                            {d.nominativi && d.nominativi.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 text-[10.5px] text-slate-300">
                                <span className="text-slate-400 block mb-0.5">Soci registrati:</span>
                                {d.nominativi.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                    />
                    <Area
                      type="monotone"
                      dataKey={modalitaSoci === 'storico_albo' ? 'cumulativoAlbo' : 'cumulativoAnno'}
                      name={modalitaSoci === 'storico_albo' ? 'Cumulativo Albo Soci' : `Cumulativo Tesserati ${annoSelezionato}`}
                      fill="url(#gradCumulativoSoci)"
                      stroke="#0d9488"
                      strokeWidth={2}
                    />
                    {modalitaSoci === 'combinato' && (
                      <Bar
                        dataKey="totaleMeseAnno"
                        name={`Iscrizioni & Rinnovi ${annoSelezionato}`}
                        fill="#059669"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={24}
                      />
                    )}
                    <Bar
                      dataKey="iscrizioniStoricheAlbo"
                      name="Mese Prima Iscrizione Albo"
                      fill={modalitaSoci === 'storico_albo' ? '#059669' : '#d97706'}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={24}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer Card 1 con link diretto a 1.1 Albo Soci */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dati sincronizzati con l'Albo Soci 1.1</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigaPagina('gestionale', 'soci')}
              className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <span>Apri Libro Soci</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLONNA 2: GRAFICO CONFRONTO ENTRATE E USCITE PIANIFICATE EVENTI */}
        <div className="bg-white/95 rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(45,38,30,0.04)] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header Card 2 + Controlli Vista */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Entrate vs Uscite Pianificate negli Eventi
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Confronto tra ricavi previsti e budget spese preventivo delle manifestazioni
                    </p>
                  </div>
                </div>
              </div>

              {/* Controlli filtro interattivi */}
              <div className="flex flex-wrap items-center gap-1.5 self-start shrink-0">
                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVistaEventi('per_evento')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                      vistaEventi === 'per_evento'
                        ? 'bg-white text-teal-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Per Evento
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaEventi('mensile')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                      vistaEventi === 'mensile'
                        ? 'bg-white text-teal-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Mensile
                  </button>
                </div>

                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPerimetroEconomico('totale')}
                    className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition-colors cursor-pointer ${
                      perimetroEconomico === 'totale'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Budget totale lordo della manifestazione"
                  >
                    Lordo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerimetroEconomico('proloco')}
                    className={`px-2 py-1 text-[10.5px] font-semibold rounded-lg transition-colors cursor-pointer ${
                      perimetroEconomico === 'proloco'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Quota di diretta competenza del bilancio Pro Loco"
                  >
                    Quota Pro Loco
                  </button>
                </div>
              </div>
            </div>

            {/* Metriche sintetiche Entrate vs Uscite Pianificate */}
            <div className="grid grid-cols-3 gap-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/60">
              <div>
                <span className="text-[11px] text-stone-500 block">Entrate Pianificate</span>
                <span className="text-lg font-extrabold text-emerald-700 font-mono tabular-nums">
                  € {totaliPianificatiEventi.totEntrate.toLocaleString('it-IT')}
                </span>
                <span className="text-[10.5px] text-stone-500 block">ricavi previsti a budget</span>
              </div>
              <div className="border-l border-stone-200/80 pl-3">
                <span className="text-[11px] text-stone-500 block">Uscite Pianificate</span>
                <span className="text-lg font-extrabold text-amber-700 font-mono tabular-nums">
                  € {totaliPianificatiEventi.totUscite.toLocaleString('it-IT')}
                </span>
                <span className="text-[10.5px] text-stone-500 block">spese preventivate (4 voci)</span>
              </div>
              <div className="border-l border-stone-200/80 pl-3">
                <span className="text-[11px] text-stone-500 block">Margine Pianificato</span>
                <span
                  className={`text-lg font-extrabold font-mono tabular-nums ${
                    totaliPianificatiEventi.margine >= 0 ? 'text-teal-800' : 'text-rose-700'
                  }`}
                >
                  {totaliPianificatiEventi.margine >= 0 ? '+' : ''}€{' '}
                  {totaliPianificatiEventi.margine.toLocaleString('it-IT')}
                </span>
                <span className="text-[10.5px] text-stone-500 block">avanzo operativo atteso</span>
              </div>
            </div>

            {/* Contenitore Grafico Recharts Eventi */}
            <div className="h-64 sm:h-72 w-full pt-1">
              {datiEventiPianificati.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <Calendar className="w-8 h-8 text-stone-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    Nessun evento pianificato per l'esercizio {annoSelezionato}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Aggiungi una manifestazione nella sezione 1.2 per visualizzare il confronto tra entrate e uscite.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={vistaEventi === 'per_evento' ? datiEventiPianificati : datiEventiMensili}
                    margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis
                      dataKey="nomeBreve"
                      tick={{ fontSize: 10.5, fill: '#57534e', fontWeight: 600 }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(val) =>
                        val >= 1000 ? `€${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `€${val}`
                      }
                      tick={{ fontSize: 11, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine y={0} stroke="#d6d3d1" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-lg border border-slate-700 text-xs space-y-2 max-w-xs">
                            <div className="border-b border-slate-700 pb-1.5">
                              <div className="font-bold text-teal-300">{d.titoloCompleto}</div>
                              {d.modello && (
                                <div className="text-[10.5px] text-slate-400 mt-0.5">
                                  {d.dataInizio} · {d.luogo} · {d.modello}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-300">Entrate Pianificate:</span>
                                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                  € {Number(d.entratePianificate || 0).toLocaleString('it-IT')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-300">Uscite Pianificate:</span>
                                <span className="font-mono font-bold text-amber-400 tabular-nums">
                                  € {Number(d.uscitePianificate || 0).toLocaleString('it-IT')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                                <span className="text-slate-200 font-semibold">Margine Pianificato:</span>
                                <span
                                  className={`font-mono font-bold tabular-nums ${
                                    d.marginePianificato >= 0 ? 'text-teal-300' : 'text-rose-400'
                                  }`}
                                >
                                  {d.marginePianificato >= 0 ? '+' : ''}€{' '}
                                  {Number(d.marginePianificato || 0).toLocaleString('it-IT')}
                                </span>
                              </div>
                            </div>

                            {vistaEventi === 'per_evento' && d.uscitePianificate > 0 && (
                              <div className="pt-1.5 border-t border-slate-800 text-[10.5px] text-slate-300 space-y-0.5">
                                <span className="text-slate-400 block font-semibold">
                                  Dettaglio 4 Voci Uscite Preventivate:
                                </span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono tabular-nums">
                                  <span>Food: €{d.foodPrev}</span>
                                  <span>Musica: €{d.intrattenimentoPrev}</span>
                                  <span>Logistica: €{d.altreSpesePrev}</span>
                                  <span>Varie: €{d.variePrev}</span>
                                </div>
                              </div>
                            )}

                            {vistaEventi === 'mensile' && d.titoliMese && d.titoliMese.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 text-[10.5px] text-slate-300">
                                <span className="text-slate-400 block">
                                  {d.numeroEventiMese} eventi in calendario:
                                </span>
                                {d.titoliMese.join(' · ')}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="entratePianificate"
                      name="Entrate Pianificate (€)"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="uscitePianificate"
                      name="Uscite Pianificate (€)"
                      fill="#d97706"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                    <Line
                      type="monotone"
                      dataKey="marginePianificato"
                      name="Margine Atteso (€)"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#0f766e', strokeWidth: 1.5, stroke: '#ffffff' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Footer Card 2 con link diretto a 1.2 Eventi */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-500 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5 text-teal-700" />
              <span>Dati sincronizzati con il Quadro Economico 1.2</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigaPagina('gestionale', 'eventi')}
              className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <span>Apri Pianificazione Eventi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
