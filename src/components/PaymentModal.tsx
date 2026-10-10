import React, { useState } from 'react';
import { Socio, QuotaAssociativa, MetodoPagamento, ProLocoInfo } from '../types';
import { generaNumeroRicevuta } from '../storage';
import { 
  X, 
  Euro, 
  Plus, 
  Receipt, 
  Trash2, 
  Calendar, 
  CreditCard, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface PaymentModalProps {
  socio: Socio;
  soci: Socio[];
  config: ProLocoInfo;
  annoSelezionato: number;
  onClose: () => void;
  onSalvaQuote: (socioId: string, quote: QuotaAssociativa[]) => void;
  onVisualizzaRicevuta: (socio: Socio, quota: QuotaAssociativa) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  socio,
  soci,
  config,
  annoSelezionato,
  onClose,
  onSalvaQuote,
  onVisualizzaRicevuta
}) => {
  // Calcolo importo consigliato in base alla categoria
  const getImportoPredefinito = (anno: number) => {
    if (socio.categoria === 'Onorario') return 0;
    if (socio.categoria === 'Sostenitore') return config.quotaStandardSostenitore;
    if (socio.categoria === 'Giovane') return config.quotaStandardGiovane;
    return config.quotaStandardOrdinario;
  };

  const [nuovoAnno, setNuovoAnno] = useState<number>(annoSelezionato);
  const [nuovoImporto, setNuovoImporto] = useState<number>(getImportoPredefinito(annoSelezionato));
  const [nuovaData, setNuovaData] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nuovaDataScadenza, setNuovaDataScadenza] = useState<string>(`${annoSelezionato}-12-31`);
  const [nuovoMetodo, setNuovoMetodo] = useState<MetodoPagamento>('Bonifico Bancario');
  const [nuoveNote, setNuoveNote] = useState<string>('');

  const quoteEsistenti = socio.quote || [];
  const quoteOrdinate = [...quoteEsistenti].sort((a, b) => b.anno - a.anno);

  const haGiaPagatoAnno = quoteEsistenti.some(q => q.anno === nuovoAnno);

  const handleAggiungiQuota = (e: React.FormEvent) => {
    e.preventDefault();

    if (haGiaPagatoAnno) {
      if (!confirm(`Risulta già una quota registrata per l'anno ${nuovoAnno}. Vuoi registrarne comunque un'altra per questo anno?`)) {
        return;
      }
    }

    const nuovaRicevutaNumero = generaNumeroRicevuta(soci, nuovoAnno);

    const nuovaQuota: QuotaAssociativa = {
      id: `quota-${Date.now()}`,
      socioId: socio.id,
      anno: nuovoAnno,
      importo: Number(nuovoImporto),
      dataPagamento: nuovaData,
      dataScadenza: nuovaDataScadenza || `${nuovoAnno}-12-31`,
      metodo: nuovoMetodo,
      ricevutaNumero: nuovaRicevutaNumero,
      note: nuoveNote.trim() || undefined
    };

    const quoteAggiornate = [...quoteEsistenti, nuovaQuota];
    onSalvaQuote(socio.id, quoteAggiornate);
    setNuoveNote('');
  };

  const handleEliminaQuota = (quotaId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa registrazione di quota?')) {
      const quoteAggiornate = quoteEsistenti.filter(q => q.id !== quotaId);
      onSalvaQuote(socio.id, quoteAggiornate);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Header Modale - Fissa in alto */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-2xs shrink-0">
              <Euro className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Registro Quote Associative
              </h2>
              <p className="text-xs text-slate-500">
                Socio: <strong className="text-slate-800">{socio.nome} {socio.cognome}</strong> (Tessera: {socio.numeroTessera})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo modale scorrevole */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
        
          {/* MODULO REGISTRAZIONE NUOVA QUOTA */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            Registra Pagamento Quota
          </h3>

          <form onSubmit={handleAggiungiQuota} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Anno di Competenza */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Anno Sociale
                </label>
                <select
                  value={nuovoAnno}
                  onChange={(e) => {
                    const a = Number(e.target.value);
                    setNuovoAnno(a);
                    setNuovoImporto(getImportoPredefinito(a));
                    setNuovaDataScadenza(`${a}-12-31`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {[2027, 2026, 2025, 2024, 2023].map(a => (
                    <option key={a} value={a}>
                      {a} {a === annoSelezionato ? '★ (Selezionato)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Importo Versato */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Importo (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={nuovoImporto}
                    onChange={(e) => setNuovoImporto(Number(e.target.value))}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">€</span>
                </div>
              </div>

              {/* Data Pagamento */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Data Pagamento
                </label>
                <input
                  type="date"
                  value={nuovaData}
                  onChange={(e) => setNuovaData(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Data di Scadenza Quota */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Data Scadenza Quota
                </label>
                <input
                  type="date"
                  value={nuovaDataScadenza}
                  onChange={(e) => setNuovaDataScadenza(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Metodo di Pagamento */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Metodo di Pagamento
                </label>
                <select
                  value={nuovoMetodo}
                  onChange={(e) => setNuovoMetodo(e.target.value as MetodoPagamento)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Contanti">Contanti</option>
                  <option value="Bonifico Bancario">Bonifico Bancario</option>
                  <option value="POS / Carta">POS / Carta di Credito</option>
                  <option value="Satispay">Satispay</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              {/* Note / Causale */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Note aggiuntive (opzionali)
                </label>
                <input
                  type="text"
                  placeholder="Es. Ricevuta a mano, donazione extra..."
                  value={nuoveNote}
                  onChange={(e) => setNuoveNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Registra Quota & Genera Ricevuta
              </button>
            </div>
          </form>
        </div>

        {/* STORICO QUOTE DEL SOCIO */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Storico Pagamenti Effettuati ({quoteOrdinate.length})</span>
          </h3>

          {quoteOrdinate.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              Nessuna quota associativa registrata per questo socio.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {quoteOrdinate.map(q => (
                <div key={q.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                  
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {q.anno}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {Number(q.importo).toFixed(2)} €
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {q.metodo}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {q.ricevutaNumero}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                        <span>Pagato il: <strong className="text-slate-700">{new Date(q.dataPagamento).toLocaleDateString('it-IT')}</strong></span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                          <Calendar className="w-3 h-3 text-emerald-600 inline" />
                          Scadenza: {q.dataScadenza ? new Date(q.dataScadenza).toLocaleDateString('it-IT') : `31/12/${q.anno}`}
                        </span>
                        {q.note && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 italic">{q.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onVisualizzaRicevuta(socio, q)}
                      title="Visualizza e stampa ricevuta"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ricevuta</span>
                    </button>
                    
                    <button
                      onClick={() => handleEliminaQuota(q.id)}
                      title="Elimina registrazione quota"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        </div>

        {/* Footer con pulsante di chiusura */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/95 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
