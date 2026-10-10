import React, { useState, useEffect } from 'react';
import { ProLocoInfo, Socio, ProLocoEvento, SitoWebConfig, SchedaTerritorio } from '../types';
import { 
  Globe, 
  Save, 
  Eye, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Sparkles, 
  Palette, 
  Layers, 
  Bell, 
  FileText, 
  ShieldCheck, 
  Smartphone, 
  Tablet,
  Monitor, 
  ArrowLeft, 
  Check, 
  KeyRound, 
  ExternalLink, 
  Download, 
  Compass, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Info,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Maximize2,
  Sliders
} from 'lucide-react';
import { PublicWebsitePortal } from './PublicWebsitePortal';
import { esportaCodiceSitoHTML } from '../storage';

interface WebsiteEditorProps {
  config: ProLocoInfo;
  soci: Socio[];
  eventi: ProLocoEvento[];
  sitoConfig: SitoWebConfig;
  tabIniziale?: 'generale' | 'sezioni' | 'avvisi' | 'territorio' | 'aspetto' | 'sicurezza';
  onSalvaSitoConfig: (nuovaConfig: SitoWebConfig) => void;
  onPubblicaEBlinda: (nuovaConfig: SitoWebConfig) => void;
  onTornaAlGestionale: () => void;
}

export const WebsiteEditor: React.FC<WebsiteEditorProps> = ({
  config,
  soci,
  eventi,
  sitoConfig,
  tabIniziale = 'generale',
  onSalvaSitoConfig,
  onPubblicaEBlinda,
  onTornaAlGestionale,
}) => {
  const [activeTab, setActiveTab] = useState<'generale' | 'sezioni' | 'avvisi' | 'territorio' | 'aspetto' | 'sicurezza'>(tabIniziale);
  const [formData, setFormData] = useState<SitoWebConfig>(() => ({
    ...sitoConfig,
    schedeTerritorio: sitoConfig.schedeTerritorio && sitoConfig.schedeTerritorio.length > 0 
      ? sitoConfig.schedeTerritorio 
      : [
          {
            id: 'terr-1',
            titolo: 'Borgo Storico & Cinta Muraria',
            descrizione: 'Un intatto dedalo di vicoli in pietra serena, botteghe artigiane e bastioni panoramici affacciati sulla vallata.',
            immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
            categoria: 'monumento'
          },
          {
            id: 'terr-2',
            titolo: 'Sapori della Tradizione & Olio EVO',
            descrizione: 'Degustazioni di prodotti tipici a km zero, vino DOCG e ricette secolari tramandate dai mastri cuochi locali.',
            immagine: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
            categoria: 'enogastronomia'
          },
          {
            id: 'terr-3',
            titolo: 'Sentieri Naturalistici & Trekking',
            descrizione: 'Itinerari immersi tra uliveti, boschi di querce e sorgenti d\'acqua limpida, perfetti per famiglie ed escursionisti.',
            immagine: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
            categoria: 'natura'
          }
        ],
    temaColore: sitoConfig.temaColore || 'emerald',
    stileTipografico: sitoConfig.stileTipografico || 'classico',
    testoInvitoTesseramento: sitoConfig.testoInvitoTesseramento || 'Diventa parte attiva della comunità: sostieni gli eventi, partecipa alla vita associativa e accedi alle convenzioni nazionali UNPLI.'
  }));

  const [mostraAnteprima, setMostraAnteprima] = useState(false);
  const [mostraRiquadroLive, setMostraRiquadroLive] = useState(true);
  const [riquadroDevice, setRiquadroDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [riquadroSezione, setRiquadroSezione] = useState<'hero' | 'eventi' | 'territorio' | 'tesseramento' | 'direttivo' | 'contatti'>('hero');
  const [riquadroOverlayOpacita, setRiquadroOverlayOpacita] = useState<number>(60);
  const [mostraQuickTuner, setMostraQuickTuner] = useState<boolean>(false);
  const [mostraModaleConfermaBlindatura, setMostraModaleConfermaBlindatura] = useState(false);
  const [salvatoNotifica, setSalvatoNotifica] = useState(false);
  const [mostraPinInChiaro, setMostraPinInChiaro] = useState(false);

  // Form temporaneo per aggiungere una nuova scheda territorio
  const [nuovaScheda, setNuovaScheda] = useState<{
    titolo: string;
    descrizione: string;
    immagine: string;
    categoria: 'monumento' | 'natura' | 'enogastronomia' | 'tradizione';
  }>({
    titolo: '',
    descrizione: '',
    immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
    categoria: 'monumento'
  });
  const [mostraFormNuovaScheda, setMostraFormNuovaScheda] = useState(false);

  // Sincronizza activeTab se tabIniziale cambia dall'esterno
  useEffect(() => {
    if (tabIniziale) {
      setActiveTab(tabIniziale);
    }
  }, [tabIniziale]);

  // Gallerie sfondi copertina preimpostati ad alta risoluzione
  const sfondiSuggeriti = [
    {
      titolo: 'Borgo Storico & Piazza',
      url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&auto=format&fit=crop&q=80'
    },
    {
      titolo: 'Colline & Campagna',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80'
    },
    {
      titolo: 'Festa Notturna & Sagre',
      url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&auto=format&fit=crop&q=80'
    },
    {
      titolo: 'Vigneti & Enogastronomia',
      url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1600&auto=format&fit=crop&q=80'
    },
    {
      titolo: 'Castello Medievale & Mura',
      url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=1600&auto=format&fit=crop&q=80'
    },
    {
      titolo: 'Mercatino & Tradizione',
      url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&auto=format&fit=crop&q=80'
    }
  ];

  const handleSalvaBozza = () => {
    onSalvaSitoConfig(formData);
    setSalvatoNotifica(true);
    setTimeout(() => setSalvatoNotifica(false), 2500);
  };

  const handleConfermaBlindatura = () => {
    const dataPubblicazioneOggi = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const configBlindata: SitoWebConfig = {
      ...formData,
      pubblicato: true,
      dataPubblicazione: dataPubblicazioneOggi,
      blindatoVisitatori: true,
    };

    onPubblicaEBlinda(configBlindata);
  };

  const handleAggiungiSchedaTerritorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovaScheda.titolo.trim() || !nuovaScheda.descrizione.trim()) return;

    const schedaCreata: SchedaTerritorio = {
      id: `terr-${Date.now()}`,
      titolo: nuovaScheda.titolo.trim(),
      descrizione: nuovaScheda.descrizione.trim(),
      immagine: nuovaScheda.immagine.trim() || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
      categoria: nuovaScheda.categoria
    };

    setFormData({
      ...formData,
      schedeTerritorio: [...(formData.schedeTerritorio || []), schedaCreata]
    });

    setNuovaScheda({
      titolo: '',
      descrizione: '',
      immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
      categoria: 'monumento'
    });
    setMostraFormNuovaScheda(false);
  };

  const handleRimuoviSchedaTerritorio = (id: string) => {
    setFormData({
      ...formData,
      schedeTerritorio: (formData.schedeTerritorio || []).filter(s => s.id !== id)
    });
  };

  const handleRipristinaSchedeDefault = () => {
    setFormData({
      ...formData,
      schedeTerritorio: [
        {
          id: 'terr-1',
          titolo: 'Borgo Storico & Cinta Muraria',
          descrizione: 'Un intatto dedalo di vicoli in pietra serena, botteghe artigiane e bastioni panoramici affacciati sulla vallata.',
          immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80',
          categoria: 'monumento'
        },
        {
          id: 'terr-2',
          titolo: 'Sapori della Tradizione & Olio EVO',
          descrizione: 'Degustazioni di prodotti tipici a km zero, vino DOCG e ricette secolari tramandate dai mastri cuochi locali.',
          immagine: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
          categoria: 'enogastronomia'
        },
        {
          id: 'terr-3',
          titolo: 'Sentieri Naturalistici & Trekking',
          descrizione: 'Itinerari immersi tra uliveti, boschi di querce e sorgenti d\'acqua limpida, perfetti per famiglie ed escursionisti.',
          immagine: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
          categoria: 'natura'
        }
      ]
    });
  };

  // Se è richiesta l'anteprima full-screen
  if (mostraAnteprima) {
    return (
      <div className="relative min-h-screen bg-white">
        {/* Barra di ritorno dall'anteprima */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold">
              Modalità Anteprima Live Portale • Modifiche in bozza applicate
            </span>
          </div>
          <button
            onClick={() => setMostraAnteprima(false)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Torna all'Editor</span>
          </button>
        </div>

        <PublicWebsitePortal
          config={config}
          soci={soci}
          eventi={eventi}
          sitoConfig={formData}
          isEditorPreview={true}
          onTornaAlGestionale={() => setMostraAnteprima(false)}
          onNuovoSocioIscritto={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* TESTATA PRINCIPALE DELL'EDITOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onTornaAlGestionale}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="Torna alla Dashboard Generale"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Riquadro Sezione Sito Web & Portale
                </span>
                {formData.pubblicato && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Online
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-700" />
                Editor Avanzato Portale • {config.nome}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Esporta HTML Standalone */}
            <button
              id="btn-esporta-sito-html-editor"
              onClick={() => esportaCodiceSitoHTML(config, eventi, soci, formData)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="Scarica il file HTML autonomo del sito web"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Esporta HTML</span>
            </button>

            {/* Anteprima Live Full-Screen */}
            <button
              id="btn-anteprima-live-fullscreen"
              onClick={() => setMostraAnteprima(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Guarda come appare il sito a schermo intero"
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>Anteprima Live</span>
            </button>

            {/* Salva Bozza */}
            <button
              id="btn-salva-bozza-sito"
              onClick={handleSalvaBozza}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              {salvatoNotifica ? <Check className="w-4 h-4 text-emerald-700" /> : <Save className="w-4 h-4 text-emerald-700" />}
              <span>{salvatoNotifica ? 'Bozza Salvata!' : 'Salva Bozza'}</span>
            </button>

            {/* PUBBLICA E BLINDA SITO */}
            <button
              id="btn-pubblica-blinda-sito"
              onClick={() => setMostraModaleConfermaBlindatura(true)}
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-teal-800 hover:bg-teal-700 active:bg-teal-900 shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-teal-200" />
              <span>Pubblica & Blinda</span>
            </button>
          </div>

        </div>

        {/* Tab di Navigazione Potenziati (6 Sezioni) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('generale')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'generale' ? 'border-teal-700 text-teal-900 bg-teal-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>1. Copertina & Hero Riquadro</span>
          </button>

          <button
            onClick={() => setActiveTab('sezioni')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sezioni' ? 'border-teal-700 text-teal-900 bg-teal-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>2. Sezioni & Moduli Attivi</span>
          </button>

          <button
            onClick={() => setActiveTab('avvisi')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'avvisi' ? 'border-teal-700 text-teal-900 bg-teal-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-teal-600" />
            <span>3. Bacheca Avvisi Cittadini</span>
          </button>

          <button
            onClick={() => setActiveTab('territorio')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'territorio' ? 'border-teal-700 text-teal-900 bg-teal-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>4. Territorio & Schede Borgo</span>
          </button>

          <button
            onClick={() => setActiveTab('aspetto')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'aspetto' ? 'border-teal-700 text-teal-900 bg-teal-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-teal-600" />
            <span>5. Stile, Colori & Tipografia</span>
          </button>

          <button
            onClick={() => setActiveTab('sicurezza')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sicurezza' ? 'border-teal-700 text-teal-900 bg-teal-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-teal-600" />
            <span>6. Kiosk, PIN & Esportazione</span>
          </button>
        </div>
      </header>

      {/* ANTEPRIMA RIQUADRO IN TEMPO REALE (LIVE CARD PREVIEW & SIMULATORE AVANZATO) */}
      <section className="bg-slate-100/95 border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 transition-all">
        <div className="max-w-6xl mx-auto space-y-3">
          
          {/* Header Barra di Controllo del Riquadro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Riquadro Editor & Simulatore Portale
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Live Preview
              </span>
            </div>

            {/* Controlli Viewport e Tool veloci */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Selettore Device Viewport */}
              <div className="bg-white p-0.5 rounded-xl border border-slate-200 flex items-center shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRiquadroDevice('desktop')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    riquadroDevice === 'desktop' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vista Schermo Desktop Completo"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRiquadroDevice('tablet')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    riquadroDevice === 'tablet' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vista Schermo Tablet (iPad)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRiquadroDevice('mobile')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    riquadroDevice === 'mobile' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vista Smartphone / Totem Kiosk Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {/* Quick Tuner Riquadro */}
              <button
                type="button"
                onClick={() => setMostraQuickTuner(!mostraQuickTuner)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                  mostraQuickTuner ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Regola colori, oscuramento e sfondi rapidi nel riquadro"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Quick Tuner</span>
              </button>

              {/* Schermo Intero */}
              <button
                type="button"
                onClick={() => setMostraAnteprima(true)}
                className="px-2.5 py-1 bg-white text-teal-800 hover:text-teal-950 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                title="Apri Anteprima Portale Interattivo a Schermo Intero"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Schermo Intero</span>
              </button>

              {/* Comprimi / Espandi */}
              <button
                type="button"
                onClick={() => setMostraRiquadroLive(!mostraRiquadroLive)}
                className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                {mostraRiquadroLive ? 'Comprimi ▲' : 'Espandi ▼'}
              </button>
            </div>
          </div>

          {mostraRiquadroLive && (
            <div className="space-y-3">
              
              {/* Pannello Quick Tuner rapido del riquadro */}
              {mostraQuickTuner && (
                <div className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                  {/* Scelta Veloce Colore */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-amber-600" />
                      <span>Palette:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'emerald', bg: 'bg-emerald-600', label: 'Smeraldo' },
                        { id: 'ocean', bg: 'bg-sky-600', label: 'Oceano' },
                        { id: 'amber', bg: 'bg-amber-600', label: 'Terracotta' },
                        { id: 'indigo', bg: 'bg-indigo-600', label: 'Indaco' },
                        { id: 'rose', bg: 'bg-rose-600', label: 'Rubino' }
                      ].map((pal) => (
                        <button
                          key={pal.id}
                          onClick={() => setFormData({ ...formData, temaColore: pal.id as any })}
                          className={`w-6 h-6 rounded-full ${pal.bg} transition transform hover:scale-110 cursor-pointer ${
                            formData.temaColore === pal.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-105' : 'opacity-80'
                          }`}
                          title={`Tema ${pal.label}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Scelta Veloce Tipografia */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Carattere:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'classico', label: 'Classico Serif' },
                        { id: 'moderno', label: 'Moderno Sans' },
                        { id: 'elegante', label: 'Elegante' }
                      ].map((tip) => (
                        <button
                          key={tip.id}
                          onClick={() => setFormData({ ...formData, stileTipografico: tip.id as any })}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            formData.stileTipografico === tip.id
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {tip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider Opacità Veloce */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Scuro Sfondo:</span>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      step="5"
                      value={riquadroOverlayOpacita}
                      onChange={(e) => setRiquadroOverlayOpacita(Number(e.target.value))}
                      className="w-24 accent-teal-700 cursor-pointer"
                    />
                    <span className="font-mono text-slate-500 text-[10px] w-7">{riquadroOverlayOpacita}%</span>
                  </div>

                  {/* Cicla Sfondi Suggeriti */}
                  <button
                    onClick={() => {
                      const indici = sfondiSuggeriti.map(s => s.url);
                      const currIdx = indici.indexOf(formData.immagineCopertina || '');
                      const nextUrl = indici[(currIdx + 1) % indici.length] || indici[0];
                      setFormData({ ...formData, immagineCopertina: nextUrl });
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cambia Foto Copertina</span>
                  </button>
                </div>
              )}

              {/* Selettore Sezione Visualizzata nel Riquadro */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Esplora Riquadro:
                </span>
                {[
                  { id: 'hero', label: 'Hero & Copertina', icon: Sparkles },
                  { id: 'avvisi', label: 'Bacheca Avviso', icon: Bell, badge: formData.mostraAvviso ? 'Attivo' : undefined },
                  { id: 'eventi', label: 'Eventi & Sagre', icon: Calendar, count: eventi.length },
                  { id: 'territorio', label: 'Territorio & Borgo', icon: Compass, count: formData.schedeTerritorio?.length || 0 },
                  { id: 'tesseramento', label: 'Tesseramento Online', icon: CreditCard },
                  { id: 'direttivo', label: 'Direttivo RUNTS', icon: Users },
                  { id: 'contatti', label: 'Contatti & Sede', icon: MapPin }
                ].map((s) => {
                  const Icon = s.icon;
                  const isSel = riquadroSezione === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setRiquadroSezione(s.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSel 
                          ? 'bg-teal-800 text-white shadow-2xs' 
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-teal-200' : 'text-slate-400'}`} />
                      <span>{s.label}</span>
                      {s.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                          {s.badge}
                        </span>
                      )}
                      {typeof s.count === 'number' && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          isSel ? 'bg-teal-900 text-teal-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Riquadro Contenitore con Simulazione Viewport (Desktop / Tablet / Smartphone) */}
              <div className={`transition-all duration-300 mx-auto ${
                riquadroDevice === 'desktop' 
                  ? 'w-full' 
                  : riquadroDevice === 'tablet' 
                    ? 'max-w-2xl' 
                    : 'max-w-xs'
              }`}>
                <div className={`rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-md transition-all ${
                  riquadroDevice === 'mobile' ? 'border-8 border-slate-800 shadow-2xl rounded-[38px]' : ''
                }`}>
                  
                  {/* Tacca e Speaker se simulazione Smartphone */}
                  {riquadroDevice === 'mobile' && (
                    <div className="bg-slate-800 py-2 px-6 flex items-center justify-between text-[10px] text-slate-400">
                      <span>9:41</span>
                      <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto"></div>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}

                  {/* Banner Avviso Globale */}
                  {formData.mostraAvviso && formData.avvisoImportante && (
                    <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 border-b ${
                      formData.tipoAvviso === 'warning' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      formData.tipoAvviso === 'evento' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                      formData.tipoAvviso === 'info' ? 'bg-sky-100 text-sky-900 border-sky-300' :
                      'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">{formData.avvisoImportante}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide opacity-75 font-black shrink-0">Bacheca</span>
                    </div>
                  )}

                  {/* VISTA SEZIONE 1: HERO & COPERTINA */}
                  {riquadroSezione === 'hero' && (
                    <div className="relative bg-slate-950 text-white p-6 sm:p-10 overflow-hidden transition-all">
                      <img 
                        src={formData.immagineCopertina || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&auto=format&fit=crop&q=80'} 
                        alt="Copertina" 
                        style={{ opacity: 1 - (riquadroOverlayOpacita / 100) }}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="relative max-w-2xl space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-teal-200 uppercase tracking-wider border border-white/20 backdrop-blur-xs">
                            {config.comune} ({config.provincia}) • Portale Ufficiale Pro Loco
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950">
                            UNPLI Aderente
                          </span>
                        </div>

                        <h3 className={`text-xl sm:text-3xl font-black tracking-tight drop-shadow-xs ${
                          formData.stileTipografico === 'classico' ? 'font-serif' : 'font-sans'
                        }`}>
                          {formData.titoloHero || 'Benvenuti nel Nostro Borgo'}
                        </h3>

                        <p className="text-xs sm:text-sm text-teal-100 italic leading-relaxed font-light">
                          «{formData.sottotitoloHero || formData.mottoPersonalizzato || config.motto || 'Custodi delle tradizioni, promotori del territorio.'}»
                        </p>

                        {formData.testoBenvenuto && (
                          <p className="text-xs text-slate-300 line-clamp-3 pt-1 border-t border-white/15">
                            {formData.testoBenvenuto}
                          </p>
                        )}

                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRiquadroSezione('tesseramento')}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Tesserati Online
                          </button>
                          <button
                            type="button"
                            onClick={() => setRiquadroSezione('eventi')}
                            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-xs border border-white/20 transition cursor-pointer"
                          >
                            Calendario Sagre
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA SEZIONE 2: BACHECA AVVISO */}
                  {riquadroSezione === 'avvisi' && (
                    <div className="p-6 bg-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Bell className="w-4 h-4 text-teal-700" />
                          <span>Bacheca Avvisi e Comunicati Ufficiali</span>
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          formData.mostraAvviso ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {formData.mostraAvviso ? 'Pubblicato' : 'Inattivo'}
                        </span>
                      </div>

                      {formData.mostraAvviso && formData.avvisoImportante ? (
                        <div className="p-4 rounded-2xl border border-teal-200 bg-white shadow-xs space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                            <span className="text-xs font-bold text-slate-900">Ultimo Comunicato della Pro Loco</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {formData.avvisoImportante}
                          </p>
                          <span className="text-[10px] text-slate-400 block pt-1">
                            In evidenza nell'intestazione del portale pubblico per tutti i visitatori.
                          </span>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center text-xs text-slate-500">
                          Nessun avviso urgente attivo. Puoi scriverne uno dalla scheda "3. Bacheca Avvisi".
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISTA SEZIONE 3: EVENTI & SAGRE */}
                  {riquadroSezione === 'eventi' && (
                    <div className="p-5 sm:p-6 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-700" />
                          <span>Prossimi Eventi, Sagre & Manifestazioni</span>
                        </h4>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {eventi.length} in Programma
                        </span>
                      </div>

                      {eventi.length === 0 ? (
                        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center text-xs text-slate-500">
                          Nessun evento presente in calendario. Gli eventi creati nel gestionale compariranno automaticamente qui.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {eventi.slice(0, 4).map((ev) => (
                            <div key={ev.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
                                  {ev.categoria}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">
                                  {ev.data}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{ev.titolo}</h5>
                              <p className="text-[11px] text-slate-600 line-clamp-2">{ev.descrizione || 'Evento organizzato dalla Pro Loco sul territorio locale.'}</p>
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500 pt-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{ev.luogo || config.comune}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISTA SEZIONE 4: TERRITORIO & BORGO */}
                  {riquadroSezione === 'territorio' && (
                    <div className="p-5 sm:p-6 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Compass className="w-4 h-4 text-teal-700" />
                          <span>Alla Scoperta del Borgo e del Territorio</span>
                        </h4>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {formData.schedeTerritorio?.length || 0} Punti di Interesse
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(formData.schedeTerritorio || []).slice(0, 3).map((sch) => (
                          <div key={sch.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
                            <div className="h-24 bg-slate-200 relative overflow-hidden">
                              <img 
                                src={sch.immagine} 
                                alt={sch.titolo} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-black/60 text-white backdrop-blur-xs">
                                {sch.categoria}
                              </span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                              <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{sch.titolo}</h5>
                              <p className="text-[11px] text-slate-600 line-clamp-2">{sch.descrizione}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VISTA SEZIONE 5: TESSERAMENTO ONLINE */}
                  {riquadroSezione === 'tesseramento' && (
                    <div className="p-5 sm:p-6 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-teal-700" />
                          <span>Tesseramento Online Soci & Sostenitori</span>
                        </h4>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {formData.abilitaTesseramentoOnline ? 'Attivo sul Portale' : 'Disabilitato'}
                        </span>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-teal-300" />
                            <span className="text-xs font-bold tracking-wider uppercase">Tessera del Socio Pro Loco</span>
                          </div>
                          <span className="text-[10px] font-mono bg-teal-800/80 px-2 py-0.5 rounded border border-teal-600 text-teal-200">
                            Anno {new Date().getFullYear()}
                          </span>
                        </div>
                        <p className="text-xs text-teal-100 font-light leading-relaxed">
                          «{formData.testoInvitoTesseramento || 'Diventa parte attiva della comunità: sostieni gli eventi, partecipa alla vita associativa e accedi alle convenzioni nazionali UNPLI.'}»
                        </p>
                        <div className="pt-2 flex items-center justify-between text-xs border-t border-teal-800/50">
                          <span className="text-teal-300 font-bold">Quota Annuale: 15,00 €</span>
                          <span className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px]">
                            Iscriviti Online Subito
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA SEZIONE 6: DIRETTIVO RUNTS */}
                  {riquadroSezione === 'direttivo' && (
                    <div className="p-5 sm:p-6 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-700" />
                          <span>Consiglio Direttivo & Trasparenza RUNTS</span>
                        </h4>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          RUNTS Ente Terzo Settore
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { ruolo: 'Presidente', nome: config.presidente || 'Presidente Pro Loco' },
                          { ruolo: 'Vicepresidente', nome: config.vicepresidente || 'Vice Presidente' },
                          { ruolo: 'Segretario', nome: config.segretario || 'Segretario Generale' }
                        ].map((d, i) => (
                          <div key={i} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center space-y-1">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center mx-auto text-xs">
                              {d.nome.charAt(0)}
                            </div>
                            <h5 className="text-xs font-bold text-slate-900">{d.nome}</h5>
                            <span className="text-[10px] font-bold text-teal-700 block uppercase">{d.ruolo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VISTA SEZIONE 7: CONTATTI & SEDE */}
                  {riquadroSezione === 'contatti' && (
                    <div className="p-5 sm:p-6 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-700" />
                          <span>Recapiti Istituzionali & Sede Operativa</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-teal-700" />
                            <span>Sede Legale & Operativa</span>
                          </span>
                          <p className="text-slate-600 font-medium">
                            {config.indirizzo || 'Piazza Centrale, 1'}, {config.cap} {config.comune} ({config.provincia})
                          </p>
                          <span className="text-[11px] text-slate-400 block">C.F. / P.IVA: {config.codiceFiscale || '00000000000'}</span>
                        </div>

                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-teal-700" />
                            <span>Contatti Rapidi per Cittadini & Turisti</span>
                          </span>
                          <p className="text-slate-600">Tel: <strong className="text-slate-800">{config.telefono || 'Non specificato'}</strong></p>
                          <p className="text-slate-600">Email: <strong className="text-slate-800">{config.email || 'info@proloco.it'}</strong></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra Rapida di Monitoraggio & Toggle Moduli in Tempo Reale */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Attiva / Disattiva:
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, abilitaEventi: !formData.abilitaEventi })}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                          formData.abilitaEventi 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title="Clicca per attivare o disattivare la sezione eventi"
                      >
                        ✓ Eventi ({eventi.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, abilitaTesseramentoOnline: !formData.abilitaTesseramentoOnline })}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                          formData.abilitaTesseramentoOnline 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title="Clicca per attivare o disattivare il modulo tesseramento online"
                      >
                        ✓ Tesseramento
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, abilitaTerritorio: !formData.abilitaTerritorio })}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                          formData.abilitaTerritorio 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title="Clicca per attivare o disattivare le schede borgo e territorio"
                      >
                        ✓ Territorio ({formData.schedeTerritorio?.length || 0})
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, abilitaDirettivo: !formData.abilitaDirettivo })}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                          formData.abilitaDirettivo 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title="Clicca per attivare o disattivare il consiglio direttivo"
                      >
                        ✓ Direttivo RUNTS
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, abilitaContatti: !formData.abilitaContatti })}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                          formData.abilitaContatti 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title="Clicca per attivare o disattivare la sezione contatti e mappa"
                      >
                        ✓ Contatti
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>Tema: <strong className="capitalize text-teal-800 font-bold">{formData.temaColore || 'emerald'}</strong></span>
                      <span>•</span>
                      <span>Font: <strong className="capitalize text-teal-800 font-bold">{formData.stileTipografico || 'classico'}</strong></span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* CORPO DELL'EDITOR */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* TAB 1: GENERALE & COPERTINA HERO */}
        {activeTab === 'generale' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Personalizzazione Copertina & Intestazione Hero</h2>
                <p className="text-xs text-slate-500">Configura il titolo ad alto impatto visivo, il motto e l'immagine di sfondo del borgo.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                Modulo 1 / 6
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Titolo Principale Hero (In evidenza sulla copertina)
                </label>
                <input
                  type="text"
                  id="input-titolo-hero"
                  value={formData.titoloHero}
                  onChange={(e) => setFormData({ ...formData, titoloHero: e.target.value })}
                  placeholder="Es. Benvenuti a Colle di Val d'Elsa"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Sottotitolo Accattivante per Visitatori
                </label>
                <input
                  type="text"
                  id="input-sottotitolo-hero"
                  value={formData.sottotitoloHero}
                  onChange={(e) => setFormData({ ...formData, sottotitoloHero: e.target.value })}
                  placeholder="Es. Tradizioni, sagre popolari, cultura e accoglienza nel cuore della Toscana"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Motto Associativo Ufficiale Pro Loco
                </label>
                <input
                  type="text"
                  id="input-motto-hero"
                  value={formData.mottoPersonalizzato}
                  onChange={(e) => setFormData({ ...formData, mottoPersonalizzato: e.target.value })}
                  placeholder="Es. Custodi delle tradizioni popolari, promotori del territorio e del patrimonio culturale."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs italic text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Messaggio di Benvenuto del Presidente & Consiglio Direttivo
                </label>
                <textarea
                  rows={3}
                  id="textarea-benvenuto-hero"
                  value={formData.testoBenvenuto}
                  onChange={(e) => setFormData({ ...formData, testoBenvenuto: e.target.value })}
                  placeholder="Breve presentazione dell'associazione, cosa fa la Pro Loco per il paese e invito caloroso a partecipare..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Scelta Sfondo Copertina con Galleria 6 Presets */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Galleria Sfondi Fotografici Copertina (Seleziona un'immagine)
                  </label>
                  <span className="text-[11px] text-slate-500">6 preset panoramici ad alta risoluzione</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sfondiSuggeriti.map((sfondo, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, immagineCopertina: sfondo.url })}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-video ${
                        formData.immagineCopertina === sfondo.url ? 'border-teal-700 ring-2 ring-teal-500 shadow-sm' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={sfondo.url}
                        alt={sfondo.titolo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/45 p-2 flex items-end">
                        <span className="text-[10.5px] text-white font-bold leading-tight drop-shadow-xs">
                          {sfondo.titolo}
                        </span>
                      </div>
                      {formData.immagineCopertina === sfondo.url && (
                        <div className="absolute top-1.5 right-1.5 bg-teal-700 text-white rounded-full p-1 shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Oppure inserisci l'URL diretto a una tua foto personalizzata:
                  </label>
                  <input
                    type="url"
                    id="input-url-copertina"
                    value={formData.immagineCopertina}
                    onChange={(e) => setFormData({ ...formData, immagineCopertina: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SEZIONI ATTIVE */}
        {activeTab === 'sezioni' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sezioni & Moduli Visibili al Pubblico</h2>
                <p className="text-xs text-slate-500">Scegli quali schede e strumenti abilitare per la consultazione da parte di residenti e turisti.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                Modulo 2 / 6
              </span>
            </div>

            <div className="space-y-4">
              
              {/* Eventi */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      1. Calendario Eventi, Sagre & Manifestazioni
                    </span>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.2 rounded-md">
                      {eventi.length} nel database
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Mostra le manifestazioni in programma con programma, date, orari, luogo e categorie tematiche.
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="chk-abilita-eventi"
                  checked={formData.abilitaEventi}
                  onChange={(e) => setFormData({ ...formData, abilitaEventi: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              {/* Tesseramento Online */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      2. Modulo di Richiesta Tesseramento Online
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-md">
                      Tessere UNPLI
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Permette ai cittadini di compilare la domanda di adesione online registrandola in segreteria.
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="chk-abilita-tesseramento"
                  checked={formData.abilitaTesseramentoOnline}
                  onChange={(e) => setFormData({ ...formData, abilitaTesseramentoOnline: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              {/* Territorio */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      3. Sezione Territorio, Borgo & Schede Turistiche
                    </span>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.2 rounded-md">
                      {formData.schedeTerritorio?.length || 0} schede
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Schede illustrate per promuovere monumenti storici, enogastronomia tipica e sentieri naturalistici.
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="chk-abilita-territorio"
                  checked={formData.abilitaTerritorio}
                  onChange={(e) => setFormData({ ...formData, abilitaTerritorio: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              {/* Direttivo RUNTS */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      4. Trasparenza & Organi Sociali (Consiglio Direttivo)
                    </span>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.2 rounded-md">
                      RUNTS Obbligo
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Mostra il Presidente e i membri del Direttivo in carica in adempimento alle norme del Terzo Settore.
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="chk-abilita-direttivo"
                  checked={formData.abilitaDirettivo}
                  onChange={(e) => setFormData({ ...formData, abilitaDirettivo: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              {/* Contatti */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      5. Recapiti Sede, Telefono, Email & Assistenza WhatsApp
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Orari di apertura della sede, indirizzo, codice UNPLI, canali social e link WhatsApp.
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="chk-abilita-contatti"
                  checked={formData.abilitaContatti}
                  onChange={(e) => setFormData({ ...formData, abilitaContatti: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: AVVISO IN EVIDENZA & COMUNICAZIONI */}
        {activeTab === 'avvisi' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bacheca Avviso Ufficiale per i Cittadini</h2>
                <p className="text-xs text-slate-500">Mostra un banner in cima a tutte le pagine per comunicazioni urgenti, aperture iscrizioni o novità.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                Modulo 3 / 6
              </span>
            </div>

            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Attiva Banner di Avviso in Evidenza</span>
                  <span className="text-[11px] text-slate-500">Visualizza una barra visibile in cima al portale visitatori.</span>
                </div>
                <input
                  type="checkbox"
                  id="chk-mostra-avviso"
                  checked={formData.mostraAvviso}
                  onChange={(e) => setFormData({ ...formData, mostraAvviso: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              {formData.mostraAvviso && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Testo dell'Avviso
                    </label>
                    <input
                      type="text"
                      id="input-testo-avviso"
                      value={formData.avvisoImportante}
                      onChange={(e) => setFormData({ ...formData, avvisoImportante: e.target.value })}
                      placeholder="Es. Aperte le iscrizioni per la Sagra: prenotazioni al numero..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {/* Suggerimenti veloci di avvisi tipici Pro Loco */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Testi Rapidi Consigliati (Fai click per impostare):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Campagna tesseramento socio in corso: iscriviti online!',
                        'Sagra di paese: programma spettacoli e menu tipico online!',
                        'Assemblea Ordinaria dei Soci: consultare l\'ordine del giorno in sede',
                        'Avviso Meteo: le manifestazioni previste all\'aperto si terranno nei locali al coperto'
                      ].map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData({ ...formData, avvisoImportante: sugg })}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-400 text-[11px] text-slate-700 rounded-lg hover:text-teal-900 transition text-left cursor-pointer"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tipologia Grafica & Colore del Banner
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'info', label: 'Informativo (Blu)', bg: 'bg-sky-100 text-sky-800 border-sky-300' },
                        { id: 'success', label: 'Positivo (Verde)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                        { id: 'warning', label: 'Avvertenza (Ambra)', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
                        { id: 'evento', label: 'Speciale Evento (Viola)', bg: 'bg-purple-100 text-purple-800 border-purple-300' }
                      ].map((tipo) => (
                        <div
                          key={tipo.id}
                          onClick={() => setFormData({ ...formData, tipoAvviso: tipo.id as any })}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition text-xs font-bold text-center ${
                            formData.tipoAvviso === tipo.id ? `${tipo.bg} ring-2 ring-slate-800` : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {tipo.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* TAB 4: TERRITORIO & SCHEDE BORGO (POTENZIATO) */}
        {activeTab === 'territorio' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Territorio, Borgo & Schede Turistiche</h2>
                <p className="text-xs text-slate-500">Aggiungi e personalizza i riquadri delle attrazioni storiche, percorsi naturalistici e prodotti tipici.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                Modulo 4 / 6
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Testi generali del territorio */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Titolo Sezione Territorio
                  </label>
                  <input
                    type="text"
                    id="input-titolo-territorio"
                    value={formData.titoloTerritorio}
                    onChange={(e) => setFormData({ ...formData, titoloTerritorio: e.target.value })}
                    placeholder="Es. Scopri il Nostro Borgo Medievale & le Tradizioni"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Descrizione Generale del Borgo e delle Tradizioni
                  </label>
                  <textarea
                    rows={3}
                    id="textarea-testo-territorio"
                    value={formData.testoTerritorio}
                    onChange={(e) => setFormData({ ...formData, testoTerritorio: e.target.value })}
                    placeholder="Testo introduttivo per i turisti e residenti che valorizza la storia locale, monumenti e prodotti tipici..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Riquadri / Schede del Territorio Interattive */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-teal-700" />
                      <span>Riquadri Attrazioni & Schede del Territorio ({formData.schedeTerritorio?.length || 0})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Queste schede appariranno sul portale visitatori corredate da foto, categoria e descrizione.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRipristinaSchedeDefault}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Ripristina le schede consigliate"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ripristina Consigliati</span>
                    </button>

                    <button
                      type="button"
                      id="btn-aggiungi-scheda-territorio"
                      onClick={() => setMostraFormNuovaScheda(!mostraFormNuovaScheda)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuova Scheda Riquadro</span>
                    </button>
                  </div>
                </div>

                {/* Form Nuova Scheda Territorio */}
                {mostraFormNuovaScheda && (
                  <form onSubmit={handleAggiungiSchedaTerritorio} className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-900">Aggiungi Nuova Scheda Territorio</span>
                      <button
                        type="button"
                        onClick={() => setMostraFormNuovaScheda(false)}
                        className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                      >
                        Chiudi
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Titolo Scheda / Attrazione</label>
                        <input
                          type="text"
                          required
                          value={nuovaScheda.titolo}
                          onChange={(e) => setNuovaScheda({ ...nuovaScheda, titolo: e.target.value })}
                          placeholder="Es. Rocca Medievale & Bastioni"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoria Tematica</label>
                        <select
                          value={nuovaScheda.categoria}
                          onChange={(e) => setNuovaScheda({ ...nuovaScheda, categoria: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                        >
                          <option value="monumento">Monumento & Storia</option>
                          <option value="enogastronomia">Enogastronomia & Sapori</option>
                          <option value="natura">Natura & Sentieri</option>
                          <option value="tradizione">Tradizioni Popolari</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Descrizione Dettagliata</label>
                      <textarea
                        rows={2}
                        required
                        value={nuovaScheda.descrizione}
                        onChange={(e) => setNuovaScheda({ ...nuovaScheda, descrizione: e.target.value })}
                        placeholder="Breve spiegazione per i turisti..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">URL Immagine Fotografica</label>
                      <input
                        type="url"
                        value={nuovaScheda.immagine}
                        onChange={(e) => setNuovaScheda({ ...nuovaScheda, immagine: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition cursor-pointer"
                      >
                        Salva Scheda Territorio
                      </button>
                    </div>
                  </form>
                )}

                {/* Elenco Schede Esistenti */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(formData.schedeTerritorio || []).map((sch) => (
                    <div key={sch.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between group">
                      {sch.immagine && (
                        <img 
                          src={sch.immagine} 
                          alt={sch.titolo} 
                          className="w-full h-32 object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.2 rounded-md">
                              {sch.categoria || 'monumento'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRimuoviSchedaTerritorio(sch.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition cursor-pointer"
                              title="Elimina scheda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{sch.titolo}</h4>
                          <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed mt-0.5">{sch.descrizione}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Orari sede e recapiti social */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Orari Apertura al Pubblico della Sede Pro Loco
                  </label>
                  <input
                    type="text"
                    value={formData.orariAperturaSede}
                    onChange={(e) => setFormData({ ...formData, orariAperturaSede: e.target.value })}
                    placeholder="Es. Lun-Ven: 09:30-12:30 | Sabato su appuntamento"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Recapito WhatsApp Info Turistiche & WhatsApp Sede
                  </label>
                  <input
                    type="text"
                    value={formData.linkWhatsApp || ''}
                    onChange={(e) => setFormData({ ...formData, linkWhatsApp: e.target.value })}
                    placeholder="+39 0577 920314"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Pagina Facebook Ufficiale
                  </label>
                  <input
                    type="text"
                    value={formData.linkFacebook || ''}
                    onChange={(e) => setFormData({ ...formData, linkFacebook: e.target.value })}
                    placeholder="https://facebook.com/proloco..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Profilo Instagram Ufficiale
                  </label>
                  <input
                    type="text"
                    value={formData.linkInstagram || ''}
                    onChange={(e) => setFormData({ ...formData, linkInstagram: e.target.value })}
                    placeholder="https://instagram.com/proloco..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: STILE, COLORI & TIPOGRAFIA (NUOVO MODULO) */}
        {activeTab === 'aspetto' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Stile Visivo, Palette Colori & Tipografia</h2>
                <p className="text-xs text-slate-500">Definisci l'identità cromatica e lo stile dei caratteri per dare un'impronta unica al portale.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                Modulo 5 / 6
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Selezione Tema Cromatico */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Palette Colori Principale del Portale
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'emerald', nome: 'Smeraldo UNPLI', colore: 'bg-emerald-700', descr: 'Verde tradizionale Pro Loco d\'Italia' },
                    { id: 'blue', nome: 'Blu Istituzionale', colore: 'bg-sky-700', descr: 'Sereno, fluviale e rassicurante' },
                    { id: 'amber', nome: 'Terracotta Borgo', colore: 'bg-amber-600', descr: 'Pietra calda, tufo e borghi antichi' },
                    { id: 'rose', nome: 'Rubino Chianti', colore: 'bg-rose-800', descr: 'Vino, sagre contadine e accoglienza' },
                    { id: 'purple', nome: 'Viola Nobiliare', colore: 'bg-purple-800', descr: 'Cortei storici, palii e tradizioni' }
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setFormData({ ...formData, temaColore: t.id as any })}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition text-left space-y-1.5 ${
                        (formData.temaColore || 'emerald') === t.id ? 'border-teal-700 ring-2 ring-teal-500 bg-slate-50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-xl ${t.colore} shadow-2xs`}></div>
                      <span className="text-xs font-bold text-slate-900 block">{t.nome}</span>
                      <p className="text-[10px] text-slate-500 leading-tight">{t.descr}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selezione Tipografia */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Stile Tipografico & Caratteri
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'classico', nome: 'Classico con Grazie', font: 'font-serif', descr: 'Elegante, rinascimentale, ideale per borghi storici e palii' },
                    { id: 'moderno', nome: 'Moderno Pulito', font: 'font-sans', descr: 'Lineare, ad alta leggibilità, stile contemporaneo e smart' },
                    { id: 'tradizionale', nome: 'Tradizionale Istituzionale', font: 'font-serif', descr: 'Autorevole e formale per comunicazioni istituzionali' }
                  ].map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setFormData({ ...formData, stileTipografico: f.id as any })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-1 ${
                        (formData.stileTipografico || 'classico') === f.id ? 'border-teal-700 ring-2 ring-teal-500 bg-slate-50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`text-base font-bold text-slate-900 block ${f.font}`}>
                        {f.nome}
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">{f.descr}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testo Invito Tesseramento Personalizzabile */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Testo d'Invito al Tesseramento Online (Call to Action)
                </label>
                <textarea
                  rows={2}
                  value={formData.testoInvitoTesseramento || ''}
                  onChange={(e) => setFormData({ ...formData, testoInvitoTesseramento: e.target.value })}
                  placeholder="Es. Diventa parte attiva della comunità: sostieni gli eventi, partecipa alla vita associativa e accedi alle convenzioni..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-teal-600"
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: SICUREZZA, KIOSK & ESPORTAZIONE */}
        {activeTab === 'sicurezza' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sicurezza Kiosk, PIN Direttivo & Esportazione</h2>
                <p className="text-xs text-slate-500">Gestisci la blindatura per i visitatori, il PIN di sblocco e l'esportazione del file HTML autonomo.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                Modulo 6 / 6
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Box PIN Segreto */}
              <div className="max-w-xl space-y-4">
                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                  <div className="text-xs text-teal-950 leading-relaxed">
                    <strong>Modalità Blindata per Visitatori:</strong> Quando il sito è blindato, i visitatori vedranno solo la vetrina pubblica. Per riaccedere all'editor o al gestionale, basterà cliccare sul lucchetto in fondo al portale e digitare questo PIN.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    PIN Segreto Direttivo (4 - 6 cifre)
                  </label>
                  <div className="relative">
                    <input
                      type={mostraPinInChiaro ? 'text' : 'password'}
                      maxLength={6}
                      id="input-pin-sblocco"
                      value={formData.pinSbloccoAdmin}
                      onChange={(e) => setFormData({ ...formData, pinSbloccoAdmin: e.target.value })}
                      placeholder="1234"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center tracking-widest text-lg font-bold focus:bg-white focus:ring-2 focus:ring-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setMostraPinInChiaro(!mostraPinInChiaro)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      {mostraPinInChiaro ? 'Nascondi' : 'Mostra'}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block text-center">
                    PIN attualmente memorizzato: <strong>{formData.pinSbloccoAdmin || '1234'}</strong>
                  </span>
                </div>
              </div>

              {/* Sezione Esportazione File HTML Autonomo */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 text-teal-700" />
                      <span>Esporta Sito Web in File HTML Standalone</span>
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xl">
                      Genera un singolo file HTML autonomo con grafica responsive Tailwind, eventi, soci del direttivo e schede del territorio. Pronto da caricare su qualsiasi server di hosting (Aruba, Register, GitHub Pages) o aprire da chiavetta USB.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => esportaCodiceSitoHTML(config, eventi, soci, formData)}
                    className="px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-teal-700" />
                    <span>Scarica Pacchetto HTML</span>
                  </button>
                </div>
              </div>

              {/* Sezione Pubblicazione Definitiva */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => setMostraModaleConfermaBlindatura(true)}
                  className="w-full py-4 bg-teal-800 hover:bg-teal-700 text-white rounded-2xl text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-teal-200" />
                  <span>Pubblica e Attiva Modalità Blindata Visitatori</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* MODALE DI CONFERMA PUBBLICAZIONE & BLINDATURA */}
      {mostraModaleConfermaBlindatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
                Procedura Sicura
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Pubblica e Blinda il Sito Web
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Stai per attivare la <strong>modalità blindata per i visitatori</strong> per il portale della <strong>{config.nome}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Nessun pulsante visibile per tornare al gestionale</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Navigazione pulita con copertina, eventi e tesseramento online</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>{formData.schedeTerritorio?.length || 0} schede territorio illustrate incluse</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-teal-900 font-bold">
                <KeyRound className="w-4 h-4 text-teal-700 shrink-0" />
                <span>PIN di sblocco per il Direttivo: <strong>{formData.pinSbloccoAdmin || '1234'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMostraModaleConfermaBlindatura(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annulla e Continua a Modificare
              </button>
              <button
                type="button"
                id="btn-conferma-blindatura-definitiva"
                onClick={handleConfermaBlindatura}
                className="flex-1 py-3 bg-teal-800 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Conferma & Blinda Ora</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
