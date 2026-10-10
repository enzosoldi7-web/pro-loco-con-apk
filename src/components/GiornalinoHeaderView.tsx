import React from 'react';
import { 
  Building2, 
  Sparkles, 
  Pencil, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Layers
} from 'lucide-react';
import { ProLocoInfo, GiornalinoConfig, StileLayoutIntestazione } from '../types';

interface GiornalinoHeaderViewProps {
  config: ProLocoInfo;
  giornalino: GiornalinoConfig;
  onApriEditor?: () => void;
  modalitaStampa?: boolean;
  coloreTemaDefault?: string;
  fontTestataDefault?: string;
  className?: string;
}

export const GiornalinoHeaderView: React.FC<GiornalinoHeaderViewProps> = ({
  config,
  giornalino,
  onApriEditor,
  modalitaStampa = false,
  coloreTemaDefault = '#064e3b',
  fontTestataDefault = "'Playfair Display', Georgia, serif",
  className = ''
}) => {
  const cfg = giornalino.configurazioneIntestazione;
  
  // Stile layout scelto (fallback a quello impostato in studioConfig o a classica)
  const stile: StileLayoutIntestazione = 
    cfg?.stileIntestazione || 
    (giornalino.studioConfig?.esteticaStampa?.stileIntestazione as StileLayoutIntestazione) || 
    'classica_doppio_filetto';

  const colorePrimario = cfg?.colorePersonalizzato || coloreTemaDefault;
  const fontFamiglia = cfg?.fontTestata || fontTestataDefault;
  const fregio = cfg?.fregioSimbolo || '❖';

  // Dimensioni font del titolo
  const classeDimensioneTitolo = (() => {
    switch (cfg?.dimensioneTitolo) {
      case 'compatta': return 'text-2xl sm:text-3xl';
      case 'standard': return 'text-3xl sm:text-4xl';
      case 'imponente': return 'text-5xl sm:text-6xl';
      case 'grande':
      default:
        return 'text-4xl sm:text-5xl';
    }
  })();

  // Allineamento
  const allineamento = cfg?.allineamento || 'center';
  const classeAllineamento = 
    allineamento === 'left' ? 'text-left items-start' :
    allineamento === 'bilaterale' ? 'text-left' : 'text-center items-center';

  const mostraLogo = cfg?.mostraLogo ?? true;
  const mostraEnte = cfg?.mostraEnte ?? true;
  const mostraRunts = cfg?.mostraRuntsUnpli ?? true;
  const mostraNumero = cfg?.mostraNumeroEdizione ?? true;
  const mostraPeriodo = cfg?.mostraPeriodo ?? true;
  const mostraData = cfg?.mostraDataPubblicazione ?? true;
  const mostraMotto = cfg?.mostraMotto ?? true;

  const testoEnte = cfg?.testoPersonalizzatoEnte || `${config.nome || 'Pro Loco'} • ${config.comune || 'Comune'}${config.provincia ? ` (${config.provincia})` : ''}`;

  return (
    <div 
      className={`relative group ${className}`}
      onClick={!modalitaStampa && onApriEditor ? onApriEditor : undefined}
    >
      {/* Badge interattivo quando si passa sopra con il mouse (solo in modalità editor Menabò/Studio) */}
      {!modalitaStampa && onApriEditor && (
        <div className="absolute -top-3 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApriEditor();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-900 hover:bg-indigo-800 text-white text-[11px] font-bold rounded-full shadow-lg border border-indigo-700 cursor-pointer transform hover:scale-105 transition"
          >
            <Pencil className="w-3 h-3 text-amber-300" />
            <span>Editor Intestazione</span>
          </button>
        </div>
      )}

      {/* Riquadro visivo con transizione hover gentile in modalità editor */}
      <div className={`transition-all rounded-lg ${
        !modalitaStampa ? 'hover:ring-2 hover:ring-indigo-400/50 hover:bg-indigo-50/10 cursor-pointer' : ''
      }`}>

        {/* 1. VARIANTE: BANDA PIENA COLOR-BLOCK */}
        {stile === 'banda_piena' && (
          <header 
            className="rounded-xl p-5 mb-6 shadow-sm text-white transition-colors"
            style={{ backgroundColor: colorePrimario }}
          >
            {mostraEnte && (
              <div className="flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-90 mb-2 border-b border-white/20 pb-1.5 gap-2">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {testoEnte}
                </span>
                {mostraRunts && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Terzo Settore RUNTS • Affiliata UNPLI
                  </span>
                )}
                <span>Diffusione Periodica</span>
              </div>
            )}

            <div className={`py-2 flex flex-col ${classeAllineamento}`}>
              <div className="flex items-center gap-3 w-full justify-center">
                {mostraLogo && config.logo && (
                  <img 
                    src={config.logo} 
                    alt="Logo Pro Loco" 
                    className="w-12 h-12 object-contain rounded-lg bg-white/10 p-1 shrink-0" 
                  />
                )}
                <h1 
                  className={`${classeDimensioneTitolo} font-black uppercase tracking-tight text-white leading-none`}
                  style={{ fontFamily: fontFamiglia }}
                >
                  {giornalino.testata}
                </h1>
              </div>

              {mostraMotto && (giornalino.sottotitoloTestata || giornalino.motto) && (
                <p className="text-xs sm:text-sm opacity-95 italic mt-2 font-serif max-w-2xl">
                  «{giornalino.sottotitoloTestata || giornalino.motto}»
                </p>
              )}
            </div>

            <div 
              className="flex flex-wrap items-center justify-between py-1.5 px-3 mt-3 text-[10.5px] font-bold uppercase rounded-lg gap-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#ffffff' }}
            >
              {mostraNumero && <span>{giornalino.numeroEdizione}</span>}
              {mostraPeriodo && <span>{giornalino.periodo}</span>}
              {mostraData && <span>{giornalino.dataPubblicazione}</span>}
              {giornalino.tiratura && <span className="hidden sm:inline opacity-85">{giornalino.tiratura}</span>}
            </div>
          </header>
        )}

        {/* 2. VARIANTE: ORNATA CON STEMMA & FREGIO */}
        {stile === 'ornata_stemma' && (
          <header 
            className="border-b-4 border-double pb-4 mb-6 transition-colors"
            style={{ borderColor: colorePrimario }}
          >
            {mostraEnte && (
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-200 pb-1">
                <span>{testoEnte}</span>
                <span className="text-base font-serif" style={{ color: colorePrimario }}>
                  {fregio}
                </span>
                {mostraRunts ? (
                  <span>UNPLI • RUNTS {config.numeroRunts ? `N. ${config.numeroRunts}` : 'APS'}</span>
                ) : (
                  <span>Edizione Ufficiale</span>
                )}
              </div>
            )}

            <div className={`py-1 text-center flex flex-col items-center justify-center`}>
              {mostraLogo && (
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-400">❖</span>
                  {config.logo ? (
                    <img src={config.logo} alt="Stemma Pro Loco" className="w-10 h-10 object-contain mx-auto" />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-serif font-black text-sm"
                      style={{ borderColor: colorePrimario, color: colorePrimario }}
                    >
                      PL
                    </div>
                  )}
                  <span className="text-xs text-slate-400">❖</span>
                </div>
              )}

              <h1 
                className={`${classeDimensioneTitolo} font-black uppercase tracking-tight leading-none`}
                style={{ 
                  color: colorePrimario,
                  fontFamily: fontFamiglia 
                }}
              >
                {giornalino.testata}
              </h1>

              {mostraMotto && (giornalino.sottotitoloTestata || giornalino.motto) && (
                <p className="text-xs sm:text-sm text-slate-700 italic mt-1.5 font-serif max-w-2xl">
                  «{giornalino.sottotitoloTestata || giornalino.motto}»
                </p>
              )}
            </div>

            <div 
              className="flex items-center justify-between border-t border-b py-1.5 px-3 mt-3 text-[10.5px] font-bold uppercase tracking-wider"
              style={{ 
                borderColor: colorePrimario,
                backgroundColor: 'rgba(0,0,0,0.02)'
              }}
            >
              {mostraNumero && <span>{giornalino.numeroEdizione}</span>}
              <span className="text-xs font-serif" style={{ color: colorePrimario }}>{fregio}</span>
              {mostraPeriodo && <span>{giornalino.periodo}</span>}
              <span className="text-xs font-serif" style={{ color: colorePrimario }}>{fregio}</span>
              {mostraData && <span>{giornalino.dataPubblicazione}</span>}
            </div>
          </header>
        )}

        {/* 3. VARIANTE: RIQUADRO D'EPOCA (RETRO BOX) */}
        {stile === 'retro_box' && (
          <header 
            className="border-2 p-4 text-center mb-6 rounded-lg transition-colors"
            style={{ 
              borderColor: colorePrimario,
              backgroundColor: 'rgba(0,0,0,0.015)'
            }}
          >
            {mostraEnte && (
              <div 
                className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2 border-b pb-1.5" 
                style={{ borderColor: colorePrimario }}
              >
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {testoEnte}
                </span>
                <span className="font-serif font-black tracking-widest">★ BOLLETTINO PERIODICO ★</span>
                <span>{mostraRunts ? 'Terzo Settore' : 'Pro Loco'}</span>
              </div>
            )}

            <div className={`py-1 flex flex-col ${classeAllineamento}`}>
              <h1 
                className={`${classeDimensioneTitolo} font-black uppercase tracking-tight py-1 leading-none`}
                style={{ 
                  color: colorePrimario,
                  fontFamily: fontFamiglia 
                }}
              >
                {giornalino.testata}
              </h1>

              {mostraMotto && (giornalino.sottotitoloTestata || giornalino.motto) && (
                <p className="text-xs text-slate-700 italic mt-1 font-serif">
                  «{giornalino.sottotitoloTestata || giornalino.motto}»
                </p>
              )}
            </div>

            <div 
              className="flex items-center justify-between border-t pt-1.5 px-2 mt-2 text-[10.5px] font-bold uppercase"
              style={{ borderColor: colorePrimario }}
            >
              <div className="flex items-center gap-3">
                {mostraNumero && <span className="bg-black/5 px-2 py-0.5 rounded">{giornalino.numeroEdizione}</span>}
                {mostraPeriodo && <span>{giornalino.periodo}</span>}
              </div>
              <div className="flex items-center gap-3">
                {mostraData && <span>{giornalino.dataPubblicazione}</span>}
                {giornalino.tiratura && <span className="text-slate-500 font-normal hidden sm:inline">• {giornalino.tiratura}</span>}
              </div>
            </div>
          </header>
        )}

        {/* 4. VARIANTE: MINIMAL LINEARE CONTEMPORANEA */}
        {stile === 'minimal_lineare' && (
          <header 
            className="border-b-2 pb-4 mb-6 transition-colors"
            style={{ borderColor: colorePrimario }}
          >
            {mostraEnte && (
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>{testoEnte}</span>
                <span>{giornalino.periodo} • {giornalino.dataPubblicazione}</span>
              </div>
            )}

            <div className={`py-2 flex flex-col ${classeAllineamento}`}>
              <h1 
                className={`${classeDimensioneTitolo} font-black tracking-tight leading-none`}
                style={{ 
                  color: colorePrimario,
                  fontFamily: fontFamiglia 
                }}
              >
                {giornalino.testata}
              </h1>

              {mostraMotto && (giornalino.sottotitoloTestata || giornalino.motto) && (
                <p className="text-xs text-slate-600 mt-2 font-medium">
                  {giornalino.sottotitoloTestata || giornalino.motto}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-100 mt-2">
              <span>{giornalino.numeroEdizione}</span>
              <span>{mostraRunts ? 'Pro Loco Iscritta RUNTS / UNPLI' : 'Notiziario Ufficiale'}</span>
            </div>
          </header>
        )}

        {/* 5. VARIANTE: BILATERALE CON STEMMA & LOGO */}
        {stile === 'bilaterale_logo' && (
          <header 
            className="border-b-4 border-double pb-4 mb-6 transition-colors"
            style={{ borderColor: colorePrimario }}
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 border-b pb-1 border-slate-200">
              <span>{testoEnte}</span>
              <span>{mostraRunts ? 'Terzo Settore RUNTS • UNPLI' : 'Pubblicazione Periodica'}</span>
            </div>

            <div className="flex items-center gap-4 py-2">
              {/* Logo / Stemma a sinistra */}
              <div className="shrink-0">
                {config.logo ? (
                  <img 
                    src={config.logo} 
                    alt="Stemma Pro Loco" 
                    className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1 bg-white shadow-2xs" 
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center p-1 font-serif text-center"
                    style={{ borderColor: colorePrimario, color: colorePrimario }}
                  >
                    <ShieldCheck className="w-6 h-6 mb-0.5" />
                    <span className="text-[9px] font-black uppercase leading-none">Pro Loco</span>
                  </div>
                )}
              </div>

              {/* Titolo e Dati a destra */}
              <div className="flex-1 min-w-0">
                <h1 
                  className={`${classeDimensioneTitolo} font-black uppercase tracking-tight leading-none truncate`}
                  style={{ 
                    color: colorePrimario,
                    fontFamily: fontFamiglia 
                  }}
                >
                  {giornalino.testata}
                </h1>
                {mostraMotto && (giornalino.sottotitoloTestata || giornalino.motto) && (
                  <p className="text-xs text-slate-600 italic mt-1 font-serif line-clamp-1">
                    «{giornalino.sottotitoloTestata || giornalino.motto}»
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold uppercase text-slate-500">
                  {mostraNumero && <span className="font-mono text-slate-900">{giornalino.numeroEdizione}</span>}
                  {mostraPeriodo && <span>• {giornalino.periodo}</span>}
                  {mostraData && <span>• {giornalino.dataPubblicazione}</span>}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* 6. VARIANTE DEFAULT: CLASSICA A DOPPIO FILETTO */}
        {(stile === 'classica_doppio_filetto' || (
          stile !== 'banda_piena' &&
          stile !== 'ornata_stemma' &&
          stile !== 'retro_box' &&
          stile !== 'minimal_lineare' &&
          stile !== 'bilaterale_logo'
        )) && (
          <header 
            className="border-b-4 border-double pb-4 text-center mb-6 transition-colors"
            style={{ borderColor: colorePrimario }}
          >
            {mostraEnte && (
              <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {testoEnte}
                </span>
                {mostraRunts && (
                  <span>UNPLI • Terzo Settore RUNTS</span>
                )}
                <span className="hidden sm:inline">{config.comune ? `${config.comune}` : ''}</span>
              </div>
            )}
            
            <div className={`py-1 flex flex-col ${classeAllineamento}`}>
              <h1 
                className={`${classeDimensioneTitolo} font-black uppercase tracking-tight py-0.5 leading-none`}
                style={{ 
                  color: colorePrimario,
                  fontFamily: fontFamiglia 
                }}
              >
                {giornalino.testata}
              </h1>

              {mostraMotto && (giornalino.sottotitoloTestata || giornalino.motto) && (
                <p className="text-xs sm:text-sm text-slate-700 italic mt-1 font-serif max-w-2xl">
                  «{giornalino.sottotitoloTestata || giornalino.motto}»
                </p>
              )}
            </div>

            <div 
              className="flex items-center justify-between border-t-2 border-b-2 py-1.5 px-3 mt-3 text-[11px] font-extrabold uppercase tracking-wide"
              style={{ borderColor: colorePrimario, color: colorePrimario }}
            >
              {mostraNumero && <span>{giornalino.numeroEdizione}</span>}
              {mostraPeriodo && <span>{giornalino.periodo}</span>}
              {mostraData && <span>{giornalino.dataPubblicazione}</span>}
              <span className="hidden sm:inline opacity-80">Distribuzione Sociale Gratuita</span>
            </div>
          </header>
        )}

      </div>
    </div>
  );
};
