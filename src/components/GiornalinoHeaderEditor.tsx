import React, { useState } from 'react';
import { 
  Building2, 
  Pencil, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Palette, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignJustify,
  Layers, 
  X,
  FileText,
  Bookmark,
  Calendar,
  Eye,
  Settings,
  ShieldCheck,
  Save,
  CheckCircle2
} from 'lucide-react';
import { 
  ProLocoInfo, 
  GiornalinoConfig, 
  StileLayoutIntestazione, 
  DimensioneTitoloIntestazione, 
  AllineamentoIntestazione,
  ConfigurazioneIntestazioneGiornalino 
} from '../types';
import { GiornalinoHeaderView } from './GiornalinoHeaderView';

interface GiornalinoHeaderEditorProps {
  config: ProLocoInfo;
  giornalino: GiornalinoConfig;
  onSalva: (nuovoGiornalino: GiornalinoConfig) => void;
  onChiudi?: () => void;
  inline?: boolean; // Se visualizzato come pannello sidebar (inline) o modale
}

const STILI_LAYOUT: { 
  id: StileLayoutIntestazione; 
  nome: string; 
  descrizione: string; 
  tag: string;
  anteprimaIcona: string;
}[] = [
  {
    id: 'classica_doppio_filetto',
    nome: 'Classica a Doppio Filetto',
    descrizione: 'Istituzionale e solenne, filetto doppio tipografico e proporzioni simmetriche tradizionali.',
    tag: 'Consigliata',
    anteprimaIcona: '═ 🏛️ ═'
  },
  {
    id: 'banda_piena',
    nome: 'Banda Piena Color-Block',
    descrizione: 'Fascia moderna a sfondo colorato pieno con testo bianco nitido e riquadri metadati ad alto contrasto.',
    tag: 'Forte Impatto',
    anteprimaIcona: '█ 📰 █'
  },
  {
    id: 'ornata_stemma',
    nome: 'Ornata con Stemma & Fregio',
    descrizione: 'Decorazione storica con emblema araldico Pro Loco, glifi tipografici e fregi ornamentali.',
    tag: 'Tradizione & Palii',
    anteprimaIcona: '❖ ⚜ ❖'
  },
  {
    id: 'retro_box',
    nome: 'Riquadro d\'Epoca (Retro Box)',
    descrizione: 'Cornice chiusa rettangolare con scomparti dedicati per metadati, anno, volume e territorio.',
    tag: 'Fascino d\'Epoca',
    anteprimaIcona: '▢ 📜 ▢'
  },
  {
    id: 'minimal_lineare',
    nome: 'Minimalista Contemporanea',
    descrizione: 'Lineare, essenziale, bordo sottile singolo e ampi spazi per un look pulito e moderno.',
    tag: 'Moderno',
    anteprimaIcona: '─ ✦ ─'
  },
  {
    id: 'bilaterale_logo',
    nome: 'Bilaterale con Stemma & Logo',
    descrizione: 'Grande stemma/logo Pro Loco a sinistra, titolo imponente e metadati organizzati a destra.',
    tag: 'Brand Territorio',
    anteprimaIcona: '🛡️ ──'
  }
];

const PALETTE_COLORI_PRESET = [
  { nome: 'Verde UNPLI Smeraldo', hex: '#064e3b' },
  { nome: 'Blu Oltremare Civico', hex: '#1e1b4b' },
  { nome: 'Amaranto & Bordeaux', hex: '#4c0519' },
  { nome: 'Antracite Grafite', hex: '#18181b' },
  { nome: 'Terra di Siena Calda', hex: '#78350f' },
  { nome: 'Blu Reale Istituzionale', hex: '#1e3a8a' },
  { nome: 'Ardesia Tipografica', hex: '#334155' }
];

const FREGIO_LIST = ['❖', '❦', '⚜', '✦', '🏛️', '•', '★'];

export const GiornalinoHeaderEditor: React.FC<GiornalinoHeaderEditorProps> = ({
  config,
  giornalino,
  onSalva,
  onChiudi,
  inline = false
}) => {
  // Stato interno per la configurazione dell'intestazione
  const cfgIniziale: ConfigurazioneIntestazioneGiornalino = {
    stileIntestazione: 
      giornalino.configurazioneIntestazione?.stileIntestazione || 
      (giornalino.studioConfig?.esteticaStampa?.stileIntestazione as StileLayoutIntestazione) || 
      'classica_doppio_filetto',
    dimensioneTitolo: giornalino.configurazioneIntestazione?.dimensioneTitolo || 'grande',
    allineamento: giornalino.configurazioneIntestazione?.allineamento || 'center',
    mostraLogo: giornalino.configurazioneIntestazione?.mostraLogo ?? true,
    mostraMotto: giornalino.configurazioneIntestazione?.mostraMotto ?? true,
    mostraEnte: giornalino.configurazioneIntestazione?.mostraEnte ?? true,
    mostraNumeroEdizione: giornalino.configurazioneIntestazione?.mostraNumeroEdizione ?? true,
    mostraPeriodo: giornalino.configurazioneIntestazione?.mostraPeriodo ?? true,
    mostraDataPubblicazione: giornalino.configurazioneIntestazione?.mostraDataPubblicazione ?? true,
    mostraRuntsUnpli: giornalino.configurazioneIntestazione?.mostraRuntsUnpli ?? true,
    colorePersonalizzato: giornalino.configurazioneIntestazione?.colorePersonalizzato || '#064e3b',
    fontTestata: giornalino.configurazioneIntestazione?.fontTestata || "'Playfair Display', Georgia, serif",
    fregioSimbolo: giornalino.configurazioneIntestazione?.fregioSimbolo || '❖',
    testoPersonalizzatoEnte: giornalino.configurazioneIntestazione?.testoPersonalizzatoEnte || ''
  };

  const [headerCfg, setHeaderCfg] = useState<ConfigurazioneIntestazioneGiornalino>(cfgIniziale);
  const [testataTesto, setTestataTesto] = useState(giornalino.testata || 'La Voce della Pro Loco');
  const [sottotitoloTesto, setSottotitoloTesto] = useState(giornalino.sottotitoloTestata || '');
  const [numeroEdizione, setNumeroEdizione] = useState(giornalino.numeroEdizione || 'Anno XXIV - N. 1');
  const [periodo, setPeriodo] = useState(giornalino.periodo || 'Edizione in corso');
  const [dataPubblicazione, setDataPubblicazione] = useState(giornalino.dataPubblicazione || '');
  const [tiratura, setTiratura] = useState(giornalino.tiratura || '');
  const [runningHeader, setRunningHeader] = useState(giornalino.runningHeader || '');

  const [schedaAttiva, setSchedaAttiva] = useState<'stili' | 'testi' | 'grafica' | 'pagine_interne'>('stili');
  const [salvato, setSalvato] = useState(false);

  // Giornalino sintetico per preview in tempo reale
  const giornalinoPreview: GiornalinoConfig = {
    ...giornalino,
    testata: testataTesto,
    sottotitoloTestata: sottotitoloTesto,
    numeroEdizione,
    periodo,
    dataPubblicazione,
    tiratura,
    runningHeader,
    configurazioneIntestazione: headerCfg,
    studioConfig: {
      ...(giornalino.studioConfig || {
        temaColore: 'unpli',
        stileFont: 'serif',
        grigliaPredefinita: 2,
        filettiVerticali: true,
        interlinea: 'standard',
        mostraRighelli: true,
        mostraGuide: true,
        modalitaVisualizzazione: 'singola',
        zoom: 1
      }),
      esteticaStampa: {
        ...(giornalino.studioConfig?.esteticaStampa || {
          stileEstetica: 'unpli_verde',
          tonalitaCarta: 'bianco_ottico',
          stileFiletti: 'doppio_classico'
        }),
        stileIntestazione: headerCfg.stileIntestazione
      }
    }
  };

  const applicaModifiche = (nuovaCfg?: Partial<ConfigurazioneIntestazioneGiornalino>) => {
    const cfgAggiornata = { ...headerCfg, ...(nuovaCfg || {}) };
    setHeaderCfg(cfgAggiornata);

    const nuovoGiornalino: GiornalinoConfig = {
      ...giornalino,
      testata: testataTesto,
      sottotitoloTestata: sottotitoloTesto,
      numeroEdizione,
      periodo,
      dataPubblicazione,
      tiratura,
      runningHeader,
      configurazioneIntestazione: cfgAggiornata,
      studioConfig: {
        ...(giornalino.studioConfig || {
          temaColore: 'unpli',
          stileFont: 'serif',
          grigliaPredefinita: 2,
          filettiVerticali: true,
          interlinea: 'standard',
          mostraRighelli: true,
          mostraGuide: true,
          modalitaVisualizzazione: 'singola',
          zoom: 1
        }),
        esteticaStampa: {
          ...(giornalino.studioConfig?.esteticaStampa || {
            stileEstetica: 'unpli_verde',
            tonalitaCarta: 'bianco_ottico',
            stileFiletti: 'doppio_classico'
          }),
          stileIntestazione: cfgAggiornata.stileIntestazione
        }
      }
    };

    onSalva(nuovoGiornalino);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 2000);
  };

  const handleRipristina = () => {
    const resetCfg: ConfigurazioneIntestazioneGiornalino = {
      stileIntestazione: 'classica_doppio_filetto',
      dimensioneTitolo: 'grande',
      allineamento: 'center',
      mostraLogo: true,
      mostraMotto: true,
      mostraEnte: true,
      mostraNumeroEdizione: true,
      mostraPeriodo: true,
      mostraDataPubblicazione: true,
      mostraRuntsUnpli: true,
      colorePersonalizzato: '#064e3b',
      fregioSimbolo: '❖'
    };
    setHeaderCfg(resetCfg);
    applicaModifiche(resetCfg);
  };

  const contenutoEditor = (
    <div className="space-y-5">

      {/* ANTEPRIMA LIVE IN TESTA */}
      <div className="bg-slate-50 p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-indigo-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Anteprima Intestazione in Tempo Reale
            </span>
          </div>
          <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            Live Preview Menabò & Stampa
          </span>
        </div>

        {/* Render dell'intestazione */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <GiornalinoHeaderView
            config={config}
            giornalino={giornalinoPreview}
            modalitaStampa={true}
          />
        </div>
      </div>

      {/* BARRA TAB DI CONFIGURAZIONE */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setSchedaAttiva('stili')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            schedaAttiva === 'stili'
              ? 'bg-indigo-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Stile Grafico ({STILI_LAYOUT.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSchedaAttiva('testi')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            schedaAttiva === 'testi'
              ? 'bg-indigo-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>2. Testi & Edizione</span>
        </button>

        <button
          type="button"
          onClick={() => setSchedaAttiva('grafica')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            schedaAttiva === 'grafica'
              ? 'bg-indigo-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>3. Colori & Tipometria</span>
        </button>

        <button
          type="button"
          onClick={() => setSchedaAttiva('pagine_interne')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            schedaAttiva === 'pagine_interne'
              ? 'bg-indigo-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>4. Testatina Pagine Interne</span>
        </button>
      </div>

      {/* SCHEDA 1: SELEZIONE DEGLI STILI GRAFICI */}
      {schedaAttiva === 'stili' && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Seleziona il Modello di Layout per l'Intestazione del Notiziario
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {STILI_LAYOUT.map((st) => {
              const selezionato = headerCfg.stileIntestazione === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => applicaModifiche({ stileIntestazione: st.id })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    selezionato
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-black text-indigo-700">
                        {st.anteprimaIcona}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        selezionato ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {st.tag}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {st.nome}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {st.descrizione}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                    <span className={selezionato ? 'font-black text-indigo-800' : 'text-slate-400'}>
                      {selezionato ? '✓ Attivo nel Notiziario' : 'Clicca per applicare'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDA 2: TESTI & METADATI TESTATA */}
      {schedaAttiva === 'testi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Testata Principale
              </label>
              <input
                type="text"
                value={testataTesto}
                onChange={(e) => {
                  setTestataTesto(e.target.value);
                  applicaModifiche();
                }}
                placeholder="Es. La Voce della Pro Loco"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sottotitolo / Motto Editoriale
              </label>
              <input
                type="text"
                value={sottotitoloTesto}
                onChange={(e) => {
                  setSottotitoloTesto(e.target.value);
                  applicaModifiche();
                }}
                placeholder="Es. Notiziario periodico di cultura, feste e vita associativa"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numero Edizione
              </label>
              <input
                type="text"
                value={numeroEdizione}
                onChange={(e) => {
                  setNumeroEdizione(e.target.value);
                  applicaModifiche();
                }}
                placeholder="Es. Anno XXIV - N. 1"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Periodo / Stagione
              </label>
              <input
                type="text"
                value={periodo}
                onChange={(e) => {
                  setPeriodo(e.target.value);
                  applicaModifiche();
                }}
                placeholder="Es. Edizione Primavera - Estate"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data di Pubblicazione
              </label>
              <input
                type="text"
                value={dataPubblicazione}
                onChange={(e) => {
                  setDataPubblicazione(e.target.value);
                  applicaModifiche();
                }}
                placeholder="Es. Maggio 2026"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiratura / Diffusione
              </label>
              <input
                type="text"
                value={tiratura}
                onChange={(e) => {
                  setTiratura(e.target.value);
                  applicaModifiche();
                }}
                placeholder="Es. 1.500 copie • Distribuzione Gratuita"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dicitura Ente & Territorio Personalizzata (Opzionale)
              </label>
              <input
                type="text"
                value={headerCfg.testoPersonalizzatoEnte || ''}
                onChange={(e) => applicaModifiche({ testoPersonalizzatoEnte: e.target.value })}
                placeholder={`Default: ${config.nome || 'Pro Loco'} • ${config.comune || 'Territorio'}`}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

          </div>

          {/* TOGGLE ELEMENTI VISIBILI NELLA TESTATA */}
          <div className="pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Elementi Visibili nell'Intestazione
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { key: 'mostraEnte', label: 'Nome Ente Pro Loco' },
                { key: 'mostraRuntsUnpli', label: 'Dicitura RUNTS • UNPLI' },
                { key: 'mostraMotto', label: 'Sottotitolo / Motto' },
                { key: 'mostraNumeroEdizione', label: 'Numero Edizione' },
                { key: 'mostraPeriodo', label: 'Periodo / Stagione' },
                { key: 'mostraDataPubblicazione', label: 'Data Pubblicazione' },
                { key: 'mostraLogo', label: 'Stemma / Logo' }
              ].map((item) => (
                <label 
                  key={item.key}
                  className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(headerCfg as any)[item.key] ?? true}
                    onChange={(e) => applicaModifiche({ [item.key]: e.target.checked } as any)}
                    className="rounded text-indigo-700 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDA 3: COLORI & TIPOMETRIA */}
      {schedaAttiva === 'grafica' && (
        <div className="space-y-4">
          
          {/* Sezione Palette Colori */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Colore Istituzionale dell'Intestazione
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE_COLORI_PRESET.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => applicaModifiche({ colorePersonalizzato: c.hex })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    headerCfg.colorePersonalizzato === c.hex
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.nome}</span>
                </button>
              ))}

              {/* Input colore libero */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                <input
                  type="color"
                  value={headerCfg.colorePersonalizzato || '#064e3b'}
                  onChange={(e) => applicaModifiche({ colorePersonalizzato: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-[11px] text-slate-600">
                  {headerCfg.colorePersonalizzato}
                </span>
              </div>
            </div>
          </div>

          {/* Dimensione Carattere Titolo */}
          <div className="pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Dimensione Carattere del Titolo Testata
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'compatta', nome: 'Compatta (32px)' },
                { id: 'standard', nome: 'Standard (40px)' },
                { id: 'grande', nome: 'Grande (48px)' },
                { id: 'imponente', nome: 'Imponente (60px)' }
              ].map((dim) => (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => applicaModifiche({ dimensioneTitolo: dim.id as DimensioneTitoloIntestazione })}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                    headerCfg.dimensioneTitolo === dim.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700'
                  }`}
                >
                  {dim.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Allineamento Testata */}
          <div className="pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Allineamento Tipografico
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'center', label: 'Centrato', icon: AlignCenter },
                { id: 'left', label: 'A Sinistra', icon: AlignLeft },
                { id: 'bilaterale', label: 'Bilaterale', icon: AlignJustify }
              ].map((all) => {
                const Icona = all.icon;
                return (
                  <button
                    key={all.id}
                    type="button"
                    onClick={() => applicaModifiche({ allineamento: all.id as AllineamentoIntestazione })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                      headerCfg.allineamento === all.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700'
                    }`}
                  >
                    <Icona className="w-3.5 h-3.5" />
                    <span>{all.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simbolo Fregio Tipografico */}
          <div className="pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Fregio Decorativo (Per stili ornati e filetti)
            </label>
            <div className="flex items-center gap-2">
              {FREGIO_LIST.map((fregio) => (
                <button
                  key={fregio}
                  type="button"
                  onClick={() => applicaModifiche({ fregioSimbolo: fregio })}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-serif transition cursor-pointer ${
                    headerCfg.fregioSimbolo === fregio
                      ? 'border-indigo-600 bg-indigo-100 text-indigo-950 font-black ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700'
                  }`}
                >
                  {fregio}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SCHEDA 4: TESTATINA PAGINE INTERNE (RUNNING HEADER) */}
      {schedaAttiva === 'pagine_interne' && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Testatina Corrente per le Pagine Interne (Pagina 2, 3, 4...)
          </label>
          <p className="text-[11px] text-slate-500">
            Compare in cima alle pagine successive per identificare il notiziario sfogliato dai lettori.
          </p>

          <input
            type="text"
            value={runningHeader}
            onChange={(e) => {
              setRunningHeader(e.target.value);
              applicaModifiche();
            }}
            placeholder={`Default: ${testataTesto} • ${periodo}`}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
          />

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
              Anteprima Testatina Pagine Interne:
            </span>
            <div 
              className="border-b-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider"
              style={{ 
                borderColor: headerCfg.colorePersonalizzato || '#064e3b',
                color: headerCfg.colorePersonalizzato || '#064e3b' 
              }}
            >
              <span>{runningHeader || `${testataTesto} • ${periodo}`}</span>
              <span>Pagina 2</span>
            </div>
          </div>
        </div>
      )}

      {/* BARRA AZIONI INFERIORE */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={handleRipristina}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Ripristina Predefiniti</span>
        </button>

        <div className="flex items-center gap-2">
          {salvato && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Applicato con successo!
            </span>
          )}

          {onChiudi && (
            <button
              type="button"
              onClick={onChiudi}
              className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              Chiudi Editor
            </button>
          )}
        </div>
      </div>

    </div>
  );

  // Se inline (ad esempio nella sidebar dell'Inspector dello Studio Editor)
  if (inline) {
    return (
      <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Editor Intestazione Notiziario
              </h3>
              <p className="text-[10.5px] text-slate-500">
                Personalizza layout, caratteri, colori e metadati della testata
              </p>
            </div>
          </div>
        </div>
        {contenutoEditor}
      </div>
    );
  }

  // Altrimenti, rendering come modale a schermo o cassetto completo
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header modale */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xs">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">
                Editor Intestazione & Testata del Notiziario
              </h2>
              <p className="text-xs text-indigo-200">
                Configurazione modelli grafici, tipometria, colori Pro Loco e testatina running
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onChiudi}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo scrollabile */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {contenutoEditor}
        </div>

      </div>
    </div>
  );
};
