import React, { useState } from 'react';
import { CampagnaRaccoltaFondi } from '../types';
import { Target, X, Check, Calendar, AlertCircle } from 'lucide-react';

interface CampagnaFondiModalProps {
  campagna: CampagnaRaccoltaFondi | null;
  annoSelezionato: number;
  onSalva: (campagna: CampagnaRaccoltaFondi) => void;
  onClose: () => void;
}

export const CampagnaFondiModal: React.FC<CampagnaFondiModalProps> = ({
  campagna,
  annoSelezionato,
  onSalva,
  onClose
}) => {
  const isModifica = Boolean(campagna);

  const [titolo, setTitolo] = useState<string>(campagna?.titolo || '');
  const [descrizione, setDescrizione] = useState<string>(campagna?.descrizione || '');
  const [obiettivoImporto, setObiettivoImporto] = useState<string>(
    campagna ? campagna.obiettivoImporto.toString() : '3000'
  );
  const [anno, setAnno] = useState<number>(campagna?.anno || annoSelezionato);
  const [dataInizio, setDataInizio] = useState<string>(campagna?.dataInizio || `${annoSelezionato}-01-01`);
  const [dataFine, setDataFine] = useState<string>(campagna?.dataFine || `${annoSelezionato}-12-31`);
  const [responsabileProgetto, setResponsabileProgetto] = useState<string>(
    campagna?.responsabileProgetto || ''
  );
  const [attiva, setAttiva] = useState<boolean>(campagna ? campagna.attiva : true);
  const [errore, setErrore] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim()) {
      setErrore('Inserisci il titolo della campagna o del progetto vincolato.');
      return;
    }

    const imp = parseFloat(obiettivoImporto);
    if (isNaN(imp) || imp <= 0) {
      setErrore('Inserisci un importo obiettivo valido superiore a 0 €.');
      return;
    }

    const nuovaCampagna: CampagnaRaccoltaFondi = {
      id: campagna?.id || `camp-${anno}-${Date.now().toString(36)}`,
      titolo: titolo.trim(),
      descrizione: descrizione.trim(),
      obiettivoImporto: Math.round(imp * 100) / 100,
      anno,
      dataInizio,
      dataFine,
      responsabileProgetto: responsabileProgetto.trim() || undefined,
      attiva
    };

    onSalva(nuovaCampagna);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Target className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                {isModifica ? 'Modifica Campagna di Raccolta Fondi' : 'Nuova Campagna Raccolta Fondi'}
              </h3>
              <p className="text-xs text-amber-200">
                Definisci un progetto statutario vincolato per catalizzare donazioni
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-800">
          {errore && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errore}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Titolo Progetto / Campagna *</label>
            <input
              type="text"
              required
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="Es. Restauro Fontana Storica, Defibrillatori Sagre..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descrizione e Finalità Statutaria</label>
            <textarea
              rows={2}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Obiettivi di utilità sociale, impatto sul territorio, destinazione precisa dei fondi..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Obiettivo Economico Target (€) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  min="50"
                  required
                  value={obiettivoImporto}
                  onChange={(e) => setObiettivoImporto(e.target.value)}
                  className="w-full font-mono font-bold px-3 py-2 pl-7 border border-slate-300 rounded-lg"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 font-bold">€</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Esercizio Finanziario</label>
              <input
                type="number"
                value={anno}
                onChange={(e) => setAnno(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data Inizio</label>
              <input
                type="date"
                value={dataInizio}
                onChange={(e) => setDataInizio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Data Fine Prevista</label>
              <input
                type="date"
                value={dataFine}
                onChange={(e) => setDataFine(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Responsabile di Progetto</label>
            <input
              type="text"
              value={responsabileProgetto}
              onChange={(e) => setResponsabileProgetto(e.target.value)}
              placeholder="Es. Marco Valenti (Presidente), Arch. Monti (Consigliere)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center gap-2">
            <input
              type="checkbox"
              id="chk-campagna-attiva"
              checked={attiva}
              onChange={(e) => setAttiva(e.target.checked)}
              className="w-4 h-4 rounded text-amber-700 cursor-pointer"
            />
            <label htmlFor="chk-campagna-attiva" className="font-bold text-slate-900 cursor-pointer">
              Campagna attualmente aperta alle donazioni
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isModifica ? 'Salva Modifiche Campagna' : 'Crea Campagna'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
