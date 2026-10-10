import React, { useState, useMemo } from 'react';
import { DettaglioSpeseEvento } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Utensils,
  Music,
  Truck,
  MoreHorizontal,
  Euro,
  BarChart3,
  PieChart as PieChartIcon,
  Scale,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface EventBudgetChartProps {
  spesePreventivo: DettaglioSpeseEvento;
  speseConsuntivo: DettaglioSpeseEvento;
  entratePreviste?: number;
  entrateRealizzate?: number;
  compatto?: boolean;
  titolo?: string;
}

export const CATEGORIE_SPESA_CONFIG = {
  food: {
    nome: 'Food & Beverage',
    sottotitolo: 'Stand gastronomico, alimenti, bevande',
    colore: '#059669', // Emerald 600
    icona: Utensils
  },
  intrattenimento: {
    nome: 'Intrattenimento',
    sottotitolo: 'Musica, spettacoli, artisti, SIAE',
    colore: '#7c3aed', // Violet 600
    icona: Music
  },
  altreSpese: {
    nome: 'Altre Spese',
    sottotitolo: 'Allestimenti, palco, noleggi, sicurezza',
    colore: '#0284c7', // Sky 600
    icona: Truck
  },
  varie: {
    nome: 'Varie & Oneri',
    sottotitolo: 'Pubblicità, permessi, imprevisti',
    colore: '#d97706', // Amber 600
    icona: MoreHorizontal
  }
};

export const EventBudgetChart: React.FC<EventBudgetChartProps> = ({
  spesePreventivo,
  speseConsuntivo,
  entratePreviste = 0,
  entrateRealizzate = 0,
  compatto = false,
  titolo
}) => {
  // Modalità del diagramma: barre comparative (default, più leggibile), torta/ciambella o flussi
  const [modalitaGrafico, setModalitaGrafico] = useState<'barre' | 'torta' | 'flussi'>('barre');
  const [vistaTorta, setVistaTorta] = useState<'consuntivo' | 'preventivo'>('consuntivo');

  // Calcoli somme automatiche
  const totPreventivo = useMemo(() => {
    return (
      (spesePreventivo?.food || 0) +
      (spesePreventivo?.intrattenimento || 0) +
      (spesePreventivo?.altreSpese || 0) +
      (spesePreventivo?.varie || 0)
    );
  }, [spesePreventivo]);

  const totConsuntivo = useMemo(() => {
    return (
      (speseConsuntivo?.food || 0) +
      (speseConsuntivo?.intrattenimento || 0) +
      (speseConsuntivo?.altreSpese || 0) +
      (speseConsuntivo?.varie || 0)
    );
  }, [speseConsuntivo]);

  // Differenza tra i costi con segno SEMPRE POSITIVO come richiesto per evitare errori di segno
  const diffAssolutaCosti = Math.abs(totConsuntivo - totPreventivo);
  const isRisparmioGlobale = totConsuntivo <= totPreventivo;

  // Risultato economico (Entrate - Costi)
  const margineConsuntivo = entrateRealizzate - totConsuntivo;
  const marginePreventivo = entratePreviste - totPreventivo;

  // Dati per il grafico a barre comparativo (Preventivo vs Consuntivo)
  const datiBarre = useMemo(() => {
    return [
      {
        categoria: 'Food & Stand',
        Preventivo: spesePreventivo?.food || 0,
        Consuntivo: speseConsuntivo?.food || 0,
        diff: Math.abs((speseConsuntivo?.food || 0) - (spesePreventivo?.food || 0)),
        isRisparmio: (speseConsuntivo?.food || 0) <= (spesePreventivo?.food || 0)
      },
      {
        categoria: 'Intrattenimento',
        Preventivo: spesePreventivo?.intrattenimento || 0,
        Consuntivo: speseConsuntivo?.intrattenimento || 0,
        diff: Math.abs((speseConsuntivo?.intrattenimento || 0) - (spesePreventivo?.intrattenimento || 0)),
        isRisparmio: (speseConsuntivo?.intrattenimento || 0) <= (spesePreventivo?.intrattenimento || 0)
      },
      {
        categoria: 'Altre Spese',
        Preventivo: spesePreventivo?.altreSpese || 0,
        Consuntivo: speseConsuntivo?.altreSpese || 0,
        diff: Math.abs((speseConsuntivo?.altreSpese || 0) - (spesePreventivo?.altreSpese || 0)),
        isRisparmio: (speseConsuntivo?.altreSpese || 0) <= (spesePreventivo?.altreSpese || 0)
      },
      {
        categoria: 'Varie & Oneri',
        Preventivo: spesePreventivo?.varie || 0,
        Consuntivo: speseConsuntivo?.varie || 0,
        diff: Math.abs((speseConsuntivo?.varie || 0) - (spesePreventivo?.varie || 0)),
        isRisparmio: (speseConsuntivo?.varie || 0) <= (spesePreventivo?.varie || 0)
      },
      {
        categoria: 'Totale Spese',
        Preventivo: totPreventivo,
        Consuntivo: totConsuntivo,
        diff: diffAssolutaCosti,
        isRisparmio: isRisparmioGlobale,
        isTotale: true
      }
    ];
  }, [spesePreventivo, speseConsuntivo, totPreventivo, totConsuntivo, diffAssolutaCosti, isRisparmioGlobale]);

  // Dati per il grafico a torta
  const speseAttive = vistaTorta === 'consuntivo' ? speseConsuntivo : spesePreventivo;
  const totAttivo = vistaTorta === 'consuntivo' ? totConsuntivo : totPreventivo;

  const datiTorta = useMemo(() => {
    const raw = [
      {
        chiave: 'food',
        name: CATEGORIE_SPESA_CONFIG.food.nome,
        value: Number(speseAttive?.food) || 0,
        color: CATEGORIE_SPESA_CONFIG.food.colore
      },
      {
        chiave: 'intrattenimento',
        name: CATEGORIE_SPESA_CONFIG.intrattenimento.nome,
        value: Number(speseAttive?.intrattenimento) || 0,
        color: CATEGORIE_SPESA_CONFIG.intrattenimento.colore
      },
      {
        chiave: 'altreSpese',
        name: CATEGORIE_SPESA_CONFIG.altreSpese.nome,
        value: Number(speseAttive?.altreSpese) || 0,
        color: CATEGORIE_SPESA_CONFIG.altreSpese.colore
      },
      {
        chiave: 'varie',
        name: CATEGORIE_SPESA_CONFIG.varie.nome,
        value: Number(speseAttive?.varie) || 0,
        color: CATEGORIE_SPESA_CONFIG.varie.colore
      }
    ];

    return raw.filter(item => item.value > 0);
  }, [speseAttive]);

  // Dati per i flussi economici (Entrate vs Spese)
  const datiFlussi = useMemo(() => {
    return [
      {
        name: 'Preventivo',
        Entrate: entratePreviste,
        Spese: totPreventivo,
        Margine: Math.max(0, marginePreventivo)
      },
      {
        name: 'Consuntivo Reale',
        Entrate: entrateRealizzate,
        Spese: totConsuntivo,
        Margine: Math.max(0, margineConsuntivo)
      }
    ];
  }, [entratePreviste, entrateRealizzate, totPreventivo, totConsuntivo, marginePreventivo, margineConsuntivo]);

  // Custom Tooltip per Grafico a Barre
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const prev = payload.find((p: any) => p.dataKey === 'Preventivo')?.value || 0;
      const cons = payload.find((p: any) => p.dataKey === 'Consuntivo')?.value || 0;
      const diffVal = Math.abs(cons - prev);
      const isRisparm = cons <= prev;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 pointer-events-none z-50 min-w-[200px]">
          <p className="font-bold text-slate-100 border-b border-slate-700 pb-1 mb-2 flex items-center justify-between">
            <span>{label}</span>
            {isRisparm ? (
              <span className="text-[10px] text-emerald-400 font-normal">✓ Entro Budget</span>
            ) : (
              <span className="text-[10px] text-amber-400 font-normal">▲ Oltre Budget</span>
            )}
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" />
                Preventivo:
              </span>
              <span className="font-bold">{(prev || 0).toLocaleString('it-IT')} €</span>
            </div>
            <div className="flex justify-between items-center text-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                Consuntivo:
              </span>
              <span className="font-bold">{(cons || 0).toLocaleString('it-IT')} €</span>
            </div>
            <div className="border-t border-slate-700/80 pt-1.5 mt-1 flex justify-between items-center font-sans">
              <span className="text-[11px] text-slate-300 font-semibold">Differenza:</span>
              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                isRisparm ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                +{(diffVal || 0).toLocaleString('it-IT')} € ({isRisparm ? 'Risparmio' : 'Scostamento'})
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip per Grafico a Torta
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const perc = totAttivo > 0 ? (((data.value || 0) / totAttivo) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs border border-slate-800 pointer-events-none z-50">
          <p className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.payload.color }} />
            {data.name}
          </p>
          <p className="text-slate-200 mt-1 font-mono">
            <strong>{(Number(data.value) || 0).toLocaleString('it-IT')} €</strong> ({perc}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${compatto ? 'space-y-3' : 'space-y-4'}`}>
      
      {/* 1. Header con titolo e selettore tipo diagramma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rendiconto Finanziario & Budgeting
          </span>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>{titolo || 'Confronto Preventivo vs Consuntivo & Ripartizione Costi'}</span>
          </h4>
        </div>

        {/* Selettore Vista Diagramma */}
        <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setModalitaGrafico('barre')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
              modalitaGrafico === 'barre'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Barre Comparative</span>
          </button>
          <button
            type="button"
            onClick={() => setModalitaGrafico('torta')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
              modalitaGrafico === 'torta'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Ripartizione a Torta</span>
          </button>
          <button
            type="button"
            onClick={() => setModalitaGrafico('flussi')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
              modalitaGrafico === 'flussi'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Euro className="w-3.5 h-3.5" />
            <span>Entrate vs Costi</span>
          </button>
        </div>
      </div>

      {/* 2. Riquadro Totali Principali con segno della Differenza SEMPRE POSITIVO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        
        {/* Totale Preventivo Costi */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Totale Preventivo</span>
          <span className="text-base font-black text-slate-800 mt-0.5 block font-mono">
            {(totPreventivo || 0).toLocaleString('it-IT')} €
          </span>
          <span className="text-[10px] text-slate-400">Somma voci previste</span>
        </div>

        {/* Totale Consuntivo Costi */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Totale Consuntivo</span>
          <span className="text-base font-black text-slate-900 mt-0.5 block font-mono">
            {(totConsuntivo || 0).toLocaleString('it-IT')} €
          </span>
          <span className="text-[10px] text-slate-400">Spese reali sostenute</span>
        </div>

        {/* Differenza Preventivo vs Consuntivo - SEGNO SEMPRE POSITIVO (+) */}
        <div className={`p-2.5 rounded-lg border ${
          isRisparmioGlobale 
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
            : 'bg-amber-50/80 border-amber-300 text-amber-950'
        }`}>
          <span className="text-[10px] font-bold uppercase block flex items-center gap-1">
            {isRisparmioGlobale ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Differenza Costi</span>
          </span>
          <span className={`text-base font-black mt-0.5 block font-mono ${
            isRisparmioGlobale ? 'text-emerald-800' : 'text-amber-800'
          }`}>
            +{(diffAssolutaCosti || 0).toLocaleString('it-IT')} €
          </span>
          <span className="text-[10px] font-semibold flex items-center gap-1">
            {totConsuntivo === totPreventivo ? (
              'Budget rispettato al 100%'
            ) : isRisparmioGlobale ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-700">
                <CheckCircle2 className="w-2.5 h-2.5" /> Risparmio sul preventivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-amber-700">
                <AlertTriangle className="w-2.5 h-2.5" /> Scostamento di spesa
              </span>
            )}
          </span>
        </div>

        {/* Risultato Netto (Entrate - Spese) */}
        <div className={`p-2.5 rounded-lg border ${
          (margineConsuntivo || 0) >= 0 
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        }`}>
          <span className="text-[10px] font-bold uppercase block">Margine Netto Reale</span>
          <span className={`text-base font-black mt-0.5 block font-mono ${
            (margineConsuntivo || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {(margineConsuntivo || 0) >= 0 ? `+${(margineConsuntivo || 0).toLocaleString('it-IT')}` : (margineConsuntivo || 0).toLocaleString('it-IT')} €
          </span>
          <span className="text-[10px] font-medium text-slate-600">
            {(margineConsuntivo || 0) >= 0 ? 'Avanzo gestione' : 'Disavanzo registrato'} (Incassi: {(entrateRealizzate || 0).toLocaleString('it-IT')}€)
          </span>
        </div>

      </div>

      {/* 3. DIAGRAMMA: 3 MODALITÀ (Barre Comparative, Torta/Ciambella, Flussi) */}
      <div className="pt-2">

        {/* MODALITÀ 1: DIAGRAMMA A BARRE COMPARATIVO (PREVENTIVO vs CONSUNTIVO) */}
        {modalitaGrafico === 'barre' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">
                Confronto diretto per singola categoria di costo: la barra blu indica il preventivo stimato, la barra verde il consuntivo reale sostenuto.
              </span>
              <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-500 inline-block" />
                  <span>Preventivo</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                  <span>Consuntivo</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datiBarre} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="categoria" 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) => `${val}€`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    dataKey="Preventivo" 
                    fill="#64748b" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={45} 
                  />
                  <Bar 
                    dataKey="Consuntivo" 
                    fill="#059669" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={45} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODALITÀ 2: DIAGRAMMA A TORTA / CIAMBELLA */}
        {modalitaGrafico === 'torta' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Distribuzione percentuale dei costi per capitolo di spesa:
              </span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-md text-[11px] font-semibold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVistaTorta('consuntivo')}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    vistaTorta === 'consuntivo' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Consuntivo ({totConsuntivo}€)
                </button>
                <button
                  type="button"
                  onClick={() => setVistaTorta('preventivo')}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    vistaTorta === 'preventivo' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Preventivo ({totPreventivo}€)
                </button>
              </div>
            </div>

            <div className={`grid ${compatto ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'} items-center gap-4`}>
              <div className={`${compatto ? 'w-full' : 'md:col-span-5'} flex flex-col items-center justify-center`}>
                {datiTorta.length > 0 ? (
                  <div className="w-full h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datiTorta}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {datiTorta.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Totale</span>
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {(totAttivo || 0).toLocaleString('it-IT')}€
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 p-4 text-center">
                    <Euro className="w-8 h-8 mb-1 text-slate-300" />
                    <p className="text-xs font-medium">Nessuna spesa {vistaTorta} registrata</p>
                  </div>
                )}
              </div>

              {/* Ripartizione percentuali */}
              <div className={`${compatto ? 'w-full' : 'md:col-span-7'} space-y-2`}>
                {Object.entries(CATEGORIE_SPESA_CONFIG).map(([chiave, cfg]) => {
                  const valPrev = (spesePreventivo as any)?.[chiave] || 0;
                  const valCons = (speseConsuntivo as any)?.[chiave] || 0;
                  return renderVoceDettaglio(cfg, valPrev, valCons, vistaTorta, totAttivo);
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODALITÀ 3: FLUSSO ECONOMICO ENTRATE vs SPESE */}
        {modalitaGrafico === 'flussi' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Rapporto complessivo tra risorse economiche incassate (sponsor, stand, contributi) e uscite per l'evento:
            </p>
            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datiFlussi} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `${val}€`} />
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${(Number(value) || 0).toLocaleString('it-IT')} €`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Entrate" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Spese" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Margine" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* 4. Tabella Dettaglio 4 Categorie con SEGNO SEMPRE POSITIVO */}
      <div className="pt-3 border-t border-slate-100">
        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Dettaglio Capitoli di Spesa (Differenza a Segno Positivo)
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(CATEGORIE_SPESA_CONFIG).map(([chiave, cfg]) => {
            const valPrev = (spesePreventivo as any)?.[chiave] || 0;
            const valCons = (speseConsuntivo as any)?.[chiave] || 0;
            const diffAssolutaVoce = Math.abs(valCons - valPrev);
            const isRisparmioVoce = valCons <= valPrev;
            const Icon = cfg.icona;

            return (
              <div key={chiave} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-600" />
                    <span>{cfg.nome}</span>
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.colore }} />
                </div>

                <div className="flex justify-between items-baseline font-mono text-[11px]">
                  <span className="text-slate-500">Prev: <strong>{(valPrev || 0).toLocaleString('it-IT')}€</strong></span>
                  <span className="text-slate-800">Cons: <strong className="text-slate-900">{(valCons || 0).toLocaleString('it-IT')}€</strong></span>
                </div>

                <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Diff:</span>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                    valCons === valPrev
                      ? 'bg-slate-200 text-slate-700'
                      : isRisparmioVoce
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    +{(diffAssolutaVoce || 0).toLocaleString('it-IT')} € {isRisparmioVoce ? '(Risparmio)' : '(Scostamento)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

function renderVoceDettaglio(
  config: typeof CATEGORIE_SPESA_CONFIG.food,
  valPrev: number,
  valCons: number,
  vista: 'consuntivo' | 'preventivo',
  totAttivo: number
) {
  const valAttivo = vista === 'consuntivo' ? valCons : valPrev;
  const perc = totAttivo > 0 ? ((valAttivo / totAttivo) * 100).toFixed(1) : '0';
  const diffAssoluta = Math.abs(valCons - valPrev);
  const isRisparmio = valCons <= valPrev;

  return (
    <div key={config.nome} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: config.colore }} />
        <div className="truncate">
          <span className="font-bold text-slate-800 block truncate">{config.nome}</span>
          <span className="text-[10px] text-slate-500 block truncate">{config.sottotitolo}</span>
        </div>
      </div>

      <div className="text-right shrink-0 ml-2">
        <div className="flex items-center gap-2 justify-end font-mono">
          <span className="font-bold text-slate-900">{(valAttivo || 0).toLocaleString('it-IT')} €</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 min-w-[42px] text-center">
            {perc}%
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 justify-end font-mono">
          <span>Prev: {valPrev}€</span>
          <span>•</span>
          <span>Cons: {valCons}€</span>
          {valCons !== valPrev && (
            <span className={`font-semibold ${isRisparmio ? 'text-emerald-700' : 'text-amber-700'}`}>
              (+{diffAssoluta}€ {isRisparmio ? 'risparmio' : 'scostamento'})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
