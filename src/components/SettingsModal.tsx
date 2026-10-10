import React, { useState } from 'react';
import { ProLocoInfo } from '../types';
import { 
  X, 
  Settings, 
  Building2, 
  Award, 
  MapPin, 
  Euro, 
  CheckCircle2,
  FileBadge
} from 'lucide-react';

interface SettingsModalProps {
  config: ProLocoInfo;
  onClose: () => void;
  onSalva: (nuovaConfig: ProLocoInfo) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onClose,
  onSalva
}) => {
  const [formData, setFormData] = useState<ProLocoInfo>({ ...config });

  const handleChange = (campo: keyof ProLocoInfo, valore: any) => {
    setFormData(prev => ({ ...prev, [campo]: valore }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalva(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Header Modale - Fissa in alto */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xs shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Impostazioni Associazione Pro Loco
              </h2>
              <p className="text-xs text-slate-500">
                Dati anagrafici per quietanze, tessere e importi standard quote
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

        {/* Formulario con scorrimento interno */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          
            {/* Dati Ente */}
            <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Denominazione e Fisco
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Denominazione Pro Loco *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Codice Fiscale Associazione *
                </label>
                <input
                  type="text"
                  required
                  value={formData.codiceFiscale}
                  onChange={(e) => handleChange('codiceFiscale', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Partita IVA (se presente)
                </label>
                <input
                  type="text"
                  value={formData.partitaIva || ''}
                  onChange={(e) => handleChange('partitaIva', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sede Legale e Contatti */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Sede e Contatti
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Indirizzo Sede
                </label>
                <input
                  type="text"
                  value={formData.indirizzo}
                  onChange={(e) => handleChange('indirizzo', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comune
                </label>
                <input
                  type="text"
                  value={formData.comune}
                  onChange={(e) => handleChange('comune', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  CAP / Prov.
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.cap}
                    onChange={(e) => handleChange('cap', e.target.value)}
                    className="w-2/3 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:bg-white"
                  />
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.provincia}
                    onChange={(e) => handleChange('provincia', e.target.value.toUpperCase())}
                    className="w-1/3 bg-slate-50 border border-slate-300 rounded-lg text-center px-1 py-1.5 text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Ufficiale
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Telefono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Registri e Rappresentanza Legale */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Iscrizioni e Presidenza
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Codice UNPLI
                </label>
                <input
                  type="text"
                  placeholder="Es. UNPLI-TOS-5219"
                  value={formData.codiceUnpli || ''}
                  onChange={(e) => handleChange('codiceUnpli', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Numero Registro RUNTS
                </label>
                <input
                  type="text"
                  placeholder="Es. RUNTS-APS-2022-84912"
                  value={formData.numeroRunts || ''}
                  onChange={(e) => handleChange('numeroRunts', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nome del Presidente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome e Cognome"
                  value={formData.nomePresidente}
                  onChange={(e) => handleChange('nomePresidente', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quote Sociali Predefinite */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5 text-emerald-600" />
              Quote Associative Standard (€)
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Socio Ordinario (€)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.quotaStandardOrdinario}
                  onChange={(e) => handleChange('quotaStandardOrdinario', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sostenitore (€)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.quotaStandardSostenitore}
                  onChange={(e) => handleChange('quotaStandardSostenitore', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Giovane / Ridotto (€)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.quotaStandardGiovane}
                  onChange={(e) => handleChange('quotaStandardGiovane', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          </div>

          {/* Pulsanti Azione - Fissi in basso */}
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Salva Configurazione
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
