import React from 'react';
import { 
  GiornalinoConfig, 
  ProLocoInfo, 
  ProLocoEvento, 
  ArticoloGiornalino
} from '../types';
import {
  Printer,
  X,
  Building2,
  Calendar,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Edit3,
  BookOpen
} from 'lucide-react';
import { 
  getEsteticaPreset, 
  getFontFamilyCss, 
  PresetEsteticaGiornalino
} from '../utils/giornalinoStili';
import { GiornalinoHeaderView } from './GiornalinoHeaderView';

interface GiornalinoPrintModalProps {
  giornalino: GiornalinoConfig;
  config: ProLocoInfo;
  eventi?: ProLocoEvento[];
  onChiudi: () => void;
  onSpostaArticoloTraPagine?: (articoloId: string, nuovaPagina: number) => void;
  onModificaArticolo?: (articolo: ArticoloGiornalino) => void;
  onAggiornaGiornalino?: (giornalinoAggiornato: GiornalinoConfig) => void;
}

export const GiornalinoPrintModal: React.FC<GiornalinoPrintModalProps> = ({
  giornalino,
  config,
  eventi = [],
  onChiudi,
  onSpostaArticoloTraPagine,
  onModificaArticolo
}) => {
  // Recupera il preset estetico dal tema configurato nel fascicolo
  const temaAttivo = giornalino.studioConfig?.temaColore || 'inchiostro';
  const presetCorrente: PresetEsteticaGiornalino = getEsteticaPreset(temaAttivo);

  const coloreFoglioEffettivo = '#ffffff';

  const handleStampa = () => {
    window.print();
  };

  const totalePagine = Math.max(giornalino.totalePagine || 4, ...giornalino.articoli.map(a => a.pagina || 1));
  const listaPagine = Array.from({ length: totalePagine }, (_, i) => i + 1);

  // Helper per renderizzare il contenuto dell'articolo formattato
  const renderContenutoFormattato = (art: ArticoloGiornalino) => {
    const isHtml = art.contenuto.includes('<') && art.contenuto.includes('>');
    
    const alignClass = 
      art.allineamento === 'left' ? 'text-left' :
      art.allineamento === 'center' ? 'text-center' :
      art.allineamento === 'right' ? 'text-right' :
      'text-justify';

    // Se l'articolo ha un suo font specifico usalo, altrimenti usa quello del preset estetico
    const fontFamilyStyle = getFontFamilyCss(art.fontFamiglia || presetCorrente.tipografia.fontCorpo);

    // Drop cap
    const dropCapStyle = art.capolettera 
      ? 'first-letter:float-left first-letter:text-4xl first-letter:pr-2 first-letter:font-black first-letter:leading-none'
      : '';

    if (isHtml) {
      return (
        <div 
          style={{ 
            fontFamily: fontFamilyStyle,
            color: presetCorrente.colori.testoArticolo
          }}
          className={`text-xs leading-relaxed ${alignClass} ${dropCapStyle} [&>p]:mb-2 [&>blockquote]:italic [&>blockquote]:border-l-2 [&>blockquote]:pl-3 [&>blockquote]:my-2`}
          dangerouslySetInnerHTML={{ __html: art.contenuto }}
        />
      );
    }

    return (
      <div 
        style={{ 
          fontFamily: fontFamilyStyle,
          color: presetCorrente.colori.testoArticolo
        }}
        className={`text-xs leading-relaxed whitespace-pre-line ${alignClass} ${dropCapStyle}`}
      >
        {art.contenuto}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex flex-col items-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      
      {/* 1. BARRA SUPERIORE AZIONI (Nascosta durante la stampa) */}
      <div className="sticky top-2 z-50 w-full max-w-5xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 sm:p-4 mb-5 print:hidden">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black flex items-center gap-2">
                <span>Anteprima e Stampa • {totalePagine} Pagine A4</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {presetCorrente.nome}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verifica impaginazione e contenuti prima dell'invio in tipografia o esportazione PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStampa}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition cursor-pointer"
              title="Stampa su carta A4 o esporta come documento PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa / PDF</span>
            </button>

            <button
              onClick={onChiudi}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
              title="Chiudi anteprima"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. CONTENITORE DELLE PAGINE DEL GIORNALE (Rendering A4 Reale) */}
      <div className="w-full max-w-4xl space-y-10 print:space-y-0">
        
        {listaPagine.map((numPagina) => {
          const articoliDellaPagina = giornalino.articoli
            .filter(a => (a.pagina || 1) === numPagina)
            .sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
          
          const isPrimaPagina = numPagina === 1;
          const isUltimaPagina = numPagina === totalePagine;
          const borderColonnaClass = 'border-solid';

          return (
            <div
              key={numPagina}
              id={`pagina-giornale-${numPagina}`}
              className="w-full p-6 sm:p-10 shadow-2xl rounded-2xl print:shadow-none print:rounded-none print:p-8 print:max-w-none print:break-after-page flex flex-col justify-between min-h-[950px] relative transition-colors duration-200 border border-slate-300/40 print:border-none"
              style={{ 
                pageBreakAfter: 'always',
                backgroundColor: coloreFoglioEffettivo,
                color: presetCorrente.colori.testoArticolo
              }}
            >
              <div>
                
                {/* 2.1 TESTATA DI PAGINA */}
                {isPrimaPagina ? (
                  /* TESTATA COMPLETA PER LA PRIMA PAGINA (LAYOUT DA CONFIGURAZIONE/EDITOR) */
                  <div className="mb-6">
                    <GiornalinoHeaderView
                      config={config}
                      giornalino={giornalino}
                      modalitaStampa={true}
                      coloreTemaDefault={presetCorrente.colori.primario}
                      fontTestataDefault={presetCorrente.tipografia.fontTestata}
                    />
                  </div>
                ) : (
                  /* RUNNING HEADER PER PAGINE SUCCESSIVE (2, 3, 4...) */
                  <header 
                    style={{ borderColor: presetCorrente.colori.primario }}
                    className="border-b-2 pb-2 mb-6 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        style={{ 
                          fontFamily: presetCorrente.tipografia.fontTestata,
                          color: presetCorrente.colori.primario
                        }}
                        className="font-black"
                      >
                        {giornalino.runningHeader || `${giornalino.testata} • ${giornalino.periodo}`}
                      </span>
                      <span>•</span>
                      <span>{config.nome}</span>
                    </div>
                    <div>
                      <span>{giornalino.numeroEdizione} • {giornalino.periodo}</span>
                    </div>
                    <div 
                      style={{ backgroundColor: `${presetCorrente.colori.primario}15`, color: presetCorrente.colori.primario }}
                      className="px-2 py-0.5 rounded font-black"
                    >
                      Pagina {numPagina} di {totalePagine}
                    </div>
                  </header>
                )}

                {/* 3.2 ARTICOLI ASSEGNATI A QUESTA PAGINA */}
                {articoliDellaPagina.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 my-12 print:hidden">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">Nessun articolo assegnato a Pagina {numPagina}</p>
                    <p className="text-[11px] mt-1">Puoi trascinare gli articoli qui dallo Studio DTP o dall'Editor del Notiziario.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {articoliDellaPagina.map((art) => {
                      const isDueColonne = art.colonna === 'doppia' || (isPrimaPagina && art.sezione === 'editoriale');
                      const isTreColonne = art.colonna === 'tre';
                      
                      // Font personalizzato o del preset
                      const fontTitoloArticolo = getFontFamilyCss(art.fontFamiglia || presetCorrente.tipografia.fontTitoli);

                      return (
                        <article
                          key={art.id}
                          className={`border-b-2 pb-6 relative group ${
                            art.sezione === 'editoriale' 
                              ? `${presetCorrente.decorazioni.stileBordoBox} p-4 sm:p-5 rounded-xl` 
                              : ''
                          }`}
                          style={{ 
                            borderColor: art.sezione === 'editoriale' ? undefined : `${presetCorrente.colori.primario}25`
                          }}
                        >
                          {/* Pulsanti Spostamento Paginazione Rapida (Visibili in hover - Nascosti in Stampa) */}
                          {onSpostaArticoloTraPagine && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/95 border border-slate-300 shadow-md px-2 py-1 rounded-lg print:hidden z-10 text-[10.5px]">
                              <span className="font-bold text-slate-500 mr-1">Pagina:</span>
                              <button
                                onClick={() => onSpostaArticoloTraPagine(art.id, Math.max(1, numPagina - 1))}
                                disabled={numPagina <= 1}
                                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                                title="Sposta a pagina precedente"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-indigo-900 px-1">{numPagina}</span>
                              <button
                                onClick={() => onSpostaArticoloTraPagine(art.id, Math.min(totalePagine, numPagina + 1))}
                                disabled={numPagina >= totalePagine}
                                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                                title="Sposta a pagina successiva"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              {onModificaArticolo && (
                                <button
                                  onClick={() => onModificaArticolo(art)}
                                  className="ml-1 pl-1 border-l border-slate-200 p-1 text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer font-bold flex items-center gap-1"
                                  title="Modifica questo articolo con l'editor Word"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Modifica</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Occhiello / Kicker e Sezione */}
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                            <span 
                              style={{ color: presetCorrente.colori.secondario }}
                              className="font-black px-1.5 py-0.5 rounded border border-current/20"
                            >
                              {art.sezione.replace('_', ' ')}
                            </span>
                            {art.occhiello && (
                              <span 
                                style={{ color: presetCorrente.colori.accento }}
                                className="font-black tracking-widest text-[9.5px]"
                              >
                                {art.occhiello}
                              </span>
                            )}
                            <span className="text-slate-400 font-mono">{art.data}</span>
                          </div>

                          {/* Titolo Principale */}
                          <h3 
                            style={{ 
                              fontFamily: fontTitoloArticolo,
                              color: presetCorrente.colori.primario
                            }}
                            className={`font-black leading-tight mb-1.5 ${
                              art.inEvidenza ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                            }`}
                          >
                            {art.titolo}
                          </h3>

                          {/* Sottotitolo / Catenaccio */}
                          {art.sottotitolo && (
                            <p 
                              style={{ fontFamily: fontTitoloArticolo }}
                              className="text-xs sm:text-sm font-medium italic mb-3 text-slate-600"
                            >
                              {art.sottotitolo}
                            </p>
                          )}

                          {/* Immagine Allegata */}
                          {art.immagine && (
                            <div className="my-3 rounded-lg overflow-hidden border border-slate-300/80 max-w-xl shadow-2xs">
                              <img
                                src={art.immagine}
                                alt={art.titolo}
                                className="w-full h-44 object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {art.didascaliaImmagine && (
                                <div className="bg-black/5 px-2.5 py-1 text-[10px] text-slate-600 italic border-t border-slate-300/60">
                                  {art.didascaliaImmagine}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Testo Articolo a Colonne */}
                          <div 
                            className={`${
                              isTreColonne ? 'sm:columns-3 gap-5' : 
                              isDueColonne ? 'sm:columns-2 gap-6' : ''
                            } ${borderColonnaClass}`}
                            style={{
                              columnRule: `1px solid ${presetCorrente.colori.filettoSeparatore}`
                            }}
                          >
                            {renderContenutoFormattato(art)}
                          </div>

                          {/* Firma Autore in Calce */}
                          <div 
                            style={{ borderColor: `${presetCorrente.colori.primario}20` }}
                            className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] text-slate-500 italic"
                          >
                            <span>A cura di:</span>
                            <span 
                              style={{ color: presetCorrente.colori.primario }}
                              className="font-bold not-italic"
                            >
                              {art.autore}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* 3.3 SPONSOR & INSERZIONI PUBBLICITARIE ASSEGNATE A QUESTA PAGINA */}
                {(() => {
                  const sponsorDellaPagina = (giornalino.sponsor || []).filter(s => s.pagina === numPagina);
                  if (sponsorDellaPagina.length === 0) return null;

                  return (
                    <div 
                      style={{ borderColor: presetCorrente.colori.primario }}
                      className="mt-6 pt-3 border-t-2 border-dashed"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          style={{ color: presetCorrente.colori.secondario }}
                          className="text-[9px] font-black uppercase tracking-widest"
                        >
                          Spazio Sostenitori & Attività del Territorio
                        </span>
                        <span className="text-[8.5px] text-slate-400 italic">Si ringraziano le realtà locali</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {sponsorDellaPagina.map((sp) => (
                          <div
                            key={sp.id}
                            style={{ 
                              borderColor: `${presetCorrente.colori.primario}30`,
                              backgroundColor: `${presetCorrente.colori.primario}08`
                            }}
                            className={`border rounded-lg p-2.5 flex flex-col justify-between ${
                              sp.formato === 'banner_striscia' ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between text-[8.5px] font-bold">
                                <span 
                                  style={{ color: presetCorrente.colori.primario }}
                                  className="uppercase font-bold"
                                >
                                  {sp.categoria}
                                </span>
                                {sp.telefono && (
                                  <span className="text-slate-600 font-mono">Tel. {sp.telefono}</span>
                                )}
                              </div>
                              <h5 
                                style={{ 
                                  fontFamily: presetCorrente.tipografia.fontTitoli,
                                  color: presetCorrente.colori.primario
                                }}
                                className="font-black text-[11px] uppercase mt-0.5"
                              >
                                {sp.nome}
                              </h5>
                              {sp.slogan && (
                                <p className="text-[10px] text-slate-600 italic mt-0.5">{sp.slogan}</p>
                              )}
                            </div>
                            {sp.indirizzo && (
                              <div className="text-[9px] text-slate-500 mt-1.5 pt-1 border-t border-black/10">
                                📍 {sp.indirizzo}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 3.4 EVENTI & MANIFESTAZIONI (SE NELL'ULTIMA PAGINA) */}
                {isUltimaPagina && eventi.length > 0 && (
                  <div 
                    style={{ borderColor: presetCorrente.colori.primario }}
                    className="border-2 rounded-xl p-4 mt-6 bg-black/5"
                  >
                    <div className="flex items-center gap-2 border-b border-black/10 pb-2 mb-3">
                      <Calendar className="w-4 h-4" style={{ color: presetCorrente.colori.secondario }} />
                      <h4 
                        style={{ 
                          fontFamily: presetCorrente.tipografia.fontTitoli,
                          color: presetCorrente.colori.primario
                        }}
                        className="text-xs font-black uppercase tracking-wider"
                      >
                        Agenda Manifestazioni & Appuntamenti in Arrivo
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {eventi.slice(0, 6).map((ev) => (
                        <div key={ev.id} className="bg-white/80 p-2.5 rounded-lg border border-black/10 text-xs shadow-2xs">
                          <span 
                            style={{ color: presetCorrente.colori.secondario }}
                            className="text-[10px] font-bold block"
                          >
                            {new Date(ev.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          <strong className="text-slate-900 font-bold block truncate mt-0.5">{ev.titolo}</strong>
                          <span className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {ev.luogo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3.5 RIQUADRO TESSERAMENTO PRO LOCO (SE NELL'ULTIMA PAGINA) */}
                {isUltimaPagina && (
                  <div 
                    style={{ 
                      borderColor: presetCorrente.colori.primario,
                      backgroundColor: `${presetCorrente.colori.primario}0a`
                    }}
                    className="border-2 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
                  >
                    <div className="space-y-1">
                      <span 
                        style={{ color: presetCorrente.colori.secondario }}
                        className="text-[11px] font-extrabold uppercase tracking-widest"
                      >
                        Sostieni la tua comunità
                      </span>
                      <h5 
                        style={{ 
                          fontFamily: presetCorrente.tipografia.fontTitoli,
                          color: presetCorrente.colori.primario
                        }}
                        className="text-sm font-black"
                      >
                        Tesseramento Annuale Pro Loco • Diventa Protagonista del Tuo Borgo!
                      </h5>
                      <p className="text-xs text-slate-600">
                        Quota Ordinaria €{config.quotaStandardOrdinario} • Sostenitore €{config.quotaStandardSostenitore} • Under 25 €{config.quotaStandardGiovane}.
                      </p>
                    </div>
                    <div className="shrink-0 text-center sm:text-right">
                      <div 
                        style={{ backgroundColor: presetCorrente.colori.primario }}
                        className="inline-block px-3 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Sede: {config.indirizzo}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Tel: {config.telefono} • {config.email}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* 3.6 PIÈ DI PAGINA FOGLIO / COLOPHON REDAZIONALE */}
              {isUltimaPagina ? (
                <footer 
                  style={{ borderColor: presetCorrente.colori.primario }}
                  className="border-t-2 mt-8 pt-3 text-[10.5px] text-slate-600 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                    <span>Direttore Responsabile: <strong style={{ color: presetCorrente.colori.primario }}>{giornalino.direttoreResponsabile}</strong></span>
                    <span>Redazione: {giornalino.redazione}</span>
                    <span>Tiratura: {giornalino.tiratura}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[10px] pt-1">
                    <span>Stampa: {giornalino.sedeStampa}</span>
                    <span>Edito da: {config.nome} • C.F. {config.codiceFiscale}</span>
                    <span 
                      style={{ color: presetCorrente.colori.primario }}
                      className="font-bold"
                    >
                      Pagina {numPagina} di {totalePagine}
                    </span>
                  </div>
                </footer>
              ) : (
                <footer 
                  style={{ borderColor: `${presetCorrente.colori.primario}30` }}
                  className="border-t mt-8 pt-2 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest"
                >
                  <span style={{ fontFamily: presetCorrente.tipografia.fontTestata, color: presetCorrente.colori.secondario }} className="font-bold">
                    {giornalino.testata}
                  </span>
                  <span style={{ color: presetCorrente.colori.primario }} className="font-bold">
                    Pagina {numPagina} di {totalePagine}
                  </span>
                  <span>{giornalino.dataPubblicazione}</span>
                </footer>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
};
