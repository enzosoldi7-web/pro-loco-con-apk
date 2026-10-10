import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, X, Monitor, Sparkles } from 'lucide-react';

interface FullscreenFloatingControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onEnterFullscreen: () => void;
}

export const FullscreenFloatingControls: React.FC<FullscreenFloatingControlsProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onEnterFullscreen,
}) => {
  const [mostraBannerLancio, setMostraBannerLancio] = useState<boolean>(() => {
    // Mostra il banner di lancio a schermo intero solo se non siamo già a schermo intero
    // e se l'utente non ha chiuso il banner in questa sessione
    const giaChiuso = sessionStorage.getItem('proloco_banner_fullscreen_chiuso');
    return !giaChiuso;
  });

  const [mostratoToast, setMostratoToast] = useState<string | null>(null);

  // Se l'app entra a schermo intero, chiudiamo il banner di invito
  useEffect(() => {
    if (isFullscreen) {
      setMostraBannerLancio(false);
      setMostratoToast('Modalità Schermo Intero Attiva');
      const timer = setTimeout(() => setMostratoToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  const handleChiudiBanner = () => {
    setMostraBannerLancio(false);
    sessionStorage.setItem('proloco_banner_fullscreen_chiuso', 'true');
  };

  const handleAttivaDaBanner = () => {
    onEnterFullscreen();
    handleChiudiBanner();
  };

  return (
    <>
      {/* Toast notifica cambio stato fullscreen */}
      {mostratoToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/90 text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-700/60 backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 no-print">
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{mostratoToast} (premi ESC per uscire)</span>
        </div>
      )}

      {/* Banner di avvio a schermo intero */}
      {!isFullscreen && mostraBannerLancio && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 no-print">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/40 border border-emerald-400/50 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-100 flex items-center gap-1.5">
                  <span>Esperienza a Schermo Intero</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 text-[10px] rounded font-semibold">Consigliato</span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Avvia l'applicazione a tutto schermo per visualizzare registri, contabilità e grafici senza cornici del browser.
                </p>
              </div>
            </div>
            <button
              onClick={handleChiudiBanner}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Nascondi avviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-emerald-800/40">
            <button
              onClick={handleChiudiBanner}
              className="px-3 py-1.5 rounded-xl text-[11px] text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-medium cursor-pointer"
            >
              Non ora
            </button>
            <button
              onClick={handleAttivaDaBanner}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Avvia a Schermo Intero</span>
            </button>
          </div>
        </div>
      )}

      {/* Pulsante Floating Fisso per Schermo Intero (in basso a destra, sopra la barra di stato) */}
      <div className="fixed bottom-4 right-4 z-40 no-print">
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Esci dallo Schermo Intero (ESC)" : "Attiva Schermo Intero (F11)"}
          className={`group flex items-center gap-2 px-3 py-2 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 cursor-pointer ${
            isFullscreen
              ? 'bg-slate-900/85 hover:bg-slate-900 text-white border-slate-700/80'
              : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border-emerald-500/50 hover:shadow-emerald-900/30'
          }`}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Riduci Schermo</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline">Schermo Intero</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
