import React, { useState, useRef, useEffect } from 'react';
import { 
  GiornalinoConfig, 
  ArticoloGiornalino, 
  SponsorInserzionista, 
  StudioEditorConfig, 
  ProLocoInfo, 
  ProLocoEvento,
  StileEsteticaGiornalino,
  OpzioniEsteticaStampa,
  FontEditorGiornalino
} from '../types';
import { 
  FONT_GIORNALINO_LIST, 
  getEsteticaPreset, 
  getFontFamilyCss,
  getSfondoCarta
} from '../utils/giornalinoStili';
import { GiornalinoHeaderView } from './GiornalinoHeaderView';
import { GiornalinoHeaderEditor } from './GiornalinoHeaderEditor';
import {
  Columns,
  Grid,
  Ruler,
  Type,
  BookOpen,
  Printer,
  Plus,
  Trash2,
  Edit3,
  MoveUp,
  MoveDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  Store,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  Save,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  Phone,
  MapPin,
  Check,
  X,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minimize2,
  RotateCcw
} from 'lucide-react';

interface GiornalinoStudioEditorProps {
  config: ProLocoInfo;
  giornalino: GiornalinoConfig;
  eventi: ProLocoEvento[];
  onSalva: (nuovoGiornalino: GiornalinoConfig) => void;
  onApriWordEditor: (articolo: ArticoloGiornalino) => void;
  onApriStampaModal: () => void;
}

const TEMI_STUDIO = [
  {
    id: 'unpli',
    nome: 'Periodico UNPLI Verde',
    descrizione: 'Smeraldo istituzionale, valorizzazione del territorio e sagre',
    colorePrimario: '#064e3b',
    coloreAccento: '#047857',
    bgBadge: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    fontTitolo: "font-['Lora',serif]",
    sfondoFoglio: '#fcfdfb'
  },
  {
    id: 'blu',
    nome: 'Bollettino Civico Oltremare',
    descrizione: 'Blu oltremare istituzionale ad alta leggibilità ed eleganza',
    colorePrimario: '#1e1b4b',
    coloreAccento: '#312e81',
    bgBadge: 'bg-indigo-100 text-indigo-950 border-indigo-300',
    fontTitolo: "font-['Plus_Jakarta_Sans',sans-serif]",
    sfondoFoglio: '#fcfdff'
  },
  {
    id: 'bordeaux',
    nome: 'Bordeaux Nobiliare',
    descrizione: 'Amarone e bordeaux, feste tradizionali ed enogastronomia',
    colorePrimario: '#4c0519',
    coloreAccento: '#881337',
    bgBadge: 'bg-rose-100 text-rose-950 border-rose-300',
    fontTitolo: "font-['Merriweather',serif]",
    sfondoFoglio: '#fffdfd'
  },
  {
    id: 'antico_borgo',
    nome: 'Antico Borgo & Pergamena',
    descrizione: 'Tonalità seppia, carta avorio calda, memorie storiche e borghi',
    colorePrimario: '#451a03',
    coloreAccento: '#78350f',
    bgBadge: 'bg-amber-100 text-amber-950 border-amber-300',
    fontTitolo: "font-['Cinzel',serif]",
    sfondoFoglio: '#fdfbf7'
  },
  {
    id: 'moderno_magazine',
    nome: 'Moderno Magazine',
    descrizione: 'Design contemporaneo minimalista, contrasti netti ed essenziali',
    colorePrimario: '#18181b',
    coloreAccento: '#4f46e5',
    bgBadge: 'bg-zinc-100 text-zinc-950 border-zinc-300',
    fontTitolo: "font-['Outfit',sans-serif]",
    sfondoFoglio: '#ffffff'
  },
  {
    id: 'vintage_rotativa',
    nome: 'Vintage Rotativa \'70',
    descrizione: 'Fascino vintage tipografico da gazzettino di provincia d\'epoca',
    colorePrimario: '#292524',
    coloreAccento: '#854d0e',
    bgBadge: 'bg-stone-100 text-stone-900 border-stone-300',
    fontTitolo: "font-['Bitter',serif]",
    sfondoFoglio: '#fbf9f5'
  }
];

export const GiornalinoStudioEditor: React.FC<GiornalinoStudioEditorProps> = ({
  config,
  giornalino,
  eventi,
  onSalva,
  onApriWordEditor,
  onApriStampaModal
}) => {
  const [paginaAttiva, setPaginaAttiva] = useState<number>(1);
  const [modalitaVista, setModalitaVista] = useState<'singola' | 'doppia' | 'timone'>('singola');
  const [zoom, setZoom] = useState<number>(100);
  const [mostraRighelli, setMostraRighelli] = useState<boolean>(true);
  const [mostraGabbia, setMostraGabbia] = useState<boolean>(true);
  const [mostraBleed, setMostraBleed] = useState<boolean>(false);
  const [schedaIspettore, setSchedaIspettore] = useState<'layout' | 'intestazione' | 'blocchi' | 'sponsor' | 'preflight'>('layout');
  const [mostraModalEditorIntestazione, setMostraModalEditorIntestazione] = useState<boolean>(false);
  
  // Stato selezione articolo per spostamento e ridimensionamento DTP
  const [articoloSelezionatoId, setArticoloSelezionatoId] = useState<string | null>(null);
  const [modalitaLayout, setModalitaLayout] = useState<'libero' | 'automatico'>('libero');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Riferimento al canvas foglio A4 per calcolo proporzioni mouse
  const canvasA4Ref = useRef<HTMLDivElement>(null);
  
  // Stato interazione mouse attiva (drag o resize)
  const [operazioneMouse, setOperazioneMouse] = useState<{
    tipo: 'drag' | 'resize';
    articoloId: string;
    startX: number;
    startY: number;
    origPosX: number;
    origPosY: number;
    origWidth: number;
    origHeight: number;
    canvasWidth: number;
  } | null>(null);
  
  // Modale inserimento rapido sponsor
  const [mostraModaleSponsor, setMostraModaleSponsor] = useState<boolean>(false);
  const [sponsorInModifica, setSponsorInModifica] = useState<SponsorInserzionista | null>(null);

  // Configurazione Studio DTP
  const studioCfg: StudioEditorConfig = giornalino.studioConfig || {
    temaColore: 'unpli',
    stileFont: 'serif',
    grigliaPredefinita: 2,
    filettiVerticali: true,
    interlinea: 'standard',
    mostraRighelli: true,
    mostraGuide: true,
    modalitaVisualizzazione: 'singola',
    zoom: 100
  };

  // Opzioni Estetica & Stampa sincronizzate
  const opzioniEsteticaAttive: OpzioniEsteticaStampa = studioCfg.esteticaStampa || {
    stileEstetica: (
      studioCfg.temaColore === 'antico_borgo' ? 'antico_borgo' :
      studioCfg.temaColore === 'unpli' ? 'unpli_verde' :
      studioCfg.temaColore === 'bordeaux' ? 'bordeaux_nobiliare' :
      studioCfg.temaColore === 'alpino' ? 'alpino_dolomiti' :
      studioCfg.temaColore === 'mediterraneo' ? 'mediterraneo_solare' :
      studioCfg.temaColore === 'vintage' ? 'vintage_rotativa' :
      studioCfg.temaColore === 'moderno' ? 'moderno_magazine' :
      studioCfg.temaColore === 'blu' ? 'blu_civico' : 'classico_inchiostro'
    ),
    tonalitaCarta: 'bianco_ottico',
    stileFiletti: 'doppio_classico',
    stileCapolettera: 'accento_tema',
    fregioOrnamentale: true,
    corniceFoglio: false
  };

  const presetAttivo = getEsteticaPreset(opzioniEsteticaAttive.stileEstetica);
  const coloreSfondoCarta = getSfondoCarta(presetAttivo, opzioniEsteticaAttive.tonalitaCarta);

  const totalePagine = giornalino.totalePagine || 4;
  const sponsorList = giornalino.sponsor || [];
  const temaAttivo = TEMI_STUDIO.find(t => t.id === studioCfg.temaColore) || TEMI_STUDIO[0];

  // Articoli e sponsor della pagina corrente
  const articoliPagina = giornalino.articoli.filter(a => (a.pagina || 1) === paginaAttiva);
  const sponsorPagina = sponsorList.filter(s => s.pagina === paginaAttiva);

  // Stima battute e riempimento pagina
  const battuteTesto = articoliPagina.reduce((acc, a) => acc + a.contenuto.replace(/<[^>]*>?/gm, '').length, 0);
  const spazioFoto = articoliPagina.filter(a => a.immagine).length * 400;
  const spazioSponsor = sponsorPagina.length * 350;
  const totalePuntiOccupazione = battuteTesto + spazioFoto + spazioSponsor + (paginaAttiva === 1 ? 800 : 200);
  const percentualeRiempimento = Math.min(100, Math.round((totalePuntiOccupazione / 2800) * 100));

  // Salvataggio configurazione studio
  const aggiornaStudioConfig = (aggiornamento: Partial<StudioEditorConfig>) => {
    const nuovo = {
      ...giornalino,
      studioConfig: { ...studioCfg, ...aggiornamento }
    };
    onSalva(nuovo);
  };

  // Spostamento di articolo tra pagine
  const spostaArticoloPagina = (articoloId: string, nuovaPagina: number) => {
    const p = Math.max(1, Math.min(totalePagine, nuovaPagina));
    const nuovaLista = giornalino.articoli.map(a => a.id === articoloId ? { ...a, pagina: p } : a);
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Modifica colonna articolo (singola, doppia, tre)
  const cambiaColonnaArticolo = (articoloId: string, nuovaColonna: 'singola' | 'doppia' | 'intera') => {
    const nuovaLista = giornalino.articoli.map(a => a.id === articoloId ? { ...a, colonna: nuovaColonna } : a);
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Sposta ordine articolo nella pagina attiva
  const spostaOrdineInPagina = (articoloId: string, direzione: 'su' | 'giu') => {
    const inPag = giornalino.articoli.filter(a => (a.pagina || 1) === paginaAttiva);
    const pos = inPag.findIndex(a => a.id === articoloId);
    const target = direzione === 'su' ? pos - 1 : pos + 1;
    if (target < 0 || target >= inPag.length) return;

    const altro = inPag[target];
    const idx1 = giornalino.articoli.findIndex(a => a.id === articoloId);
    const idx2 = giornalino.articoli.findIndex(a => a.id === altro.id);

    const nuovaLista = [...giornalino.articoli];
    const tmp = nuovaLista[idx1];
    nuovaLista[idx1] = nuovaLista[idx2];
    nuovaLista[idx2] = tmp;
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Creazione nuovo articolo veloce per la pagina attiva
  const apriNuovoArticoloStudio = () => {
    const nuovo: ArticoloGiornalino = {
      id: `art-${Date.now()}`,
      titolo: 'Titolo Articolo in Evidenza',
      sottotitolo: 'Sottotitolo redazionale o occhiello di presentazione',
      sezione: paginaAttiva === 1 ? 'editoriale' : 'primo_piano',
      autore: config.nomePresidente,
      data: giornalino.dataPubblicazione || 'Mese Corrente',
      contenuto: 'Scrivi qui il corpo del tuo articolo con lo Studio Editor. Puoi applicare stili di paragrafo, colonne, immagini e capolettera.',
      pagina: paginaAttiva,
      ordine: articoliPagina.length + 1,
      colonna: studioCfg.grigliaPredefinita === 3 ? 'doppia' : 'doppia',
      allineamento: 'justify',
      capolettera: true,
      inEvidenza: paginaAttiva === 1
    };
    onApriWordEditor(nuovo);
  };

  // Gestione Sponsor
  const salvaSponsor = (s: SponsorInserzionista) => {
    const esiste = sponsorList.some(item => item.id === s.id);
    let nuovaLista: SponsorInserzionista[];
    if (esiste) {
      nuovaLista = sponsorList.map(item => item.id === s.id ? s : item);
    } else {
      nuovaLista = [...sponsorList, s];
    }
    onSalva({ ...giornalino, sponsor: nuovaLista });
    setMostraModaleSponsor(false);
    setSponsorInModifica(null);
  };

  const eliminaSponsor = (id: string) => {
    if (!confirm('Eliminare questo sponsor dal giornalino?')) return;
    const nuovaLista = sponsorList.filter(s => s.id !== id);
    onSalva({ ...giornalino, sponsor: nuovaLista });
  };

  const apriNuovoSponsor = (pag: number = paginaAttiva) => {
    setSponsorInModifica({
      id: `sp-${Date.now()}`,
      nome: '',
      categoria: 'Attività Convenzionata',
      slogan: '',
      telefono: '',
      indirizzo: '',
      pagina: pag,
      formato: 'box_quarto',
      logoUrl: ''
    });
    setMostraModaleSponsor(true);
  };

  // Funzioni DTP: Drag and Drop & Ridimensionamento con il mouse
  const iniziaSpostamento = (e: React.MouseEvent, art: ArticoloGiornalino) => {
    e.stopPropagation();
    e.preventDefault();
    setArticoloSelezionatoId(art.id);
    
    const canvasRect = canvasA4Ref.current?.getBoundingClientRect();
    const canvasW = canvasRect?.width || 680;
    
    setOperazioneMouse({
      tipo: 'drag',
      articoloId: art.id,
      startX: e.clientX,
      startY: e.clientY,
      origPosX: art.posX || 0,
      origPosY: art.posY || 0,
      origWidth: art.customWidth || 100,
      origHeight: art.customHeight || 240,
      canvasWidth: canvasW
    });
  };

  const iniziaRidimensionamento = (e: React.MouseEvent, art: ArticoloGiornalino) => {
    e.stopPropagation();
    e.preventDefault();
    setArticoloSelezionatoId(art.id);
    
    const canvasRect = canvasA4Ref.current?.getBoundingClientRect();
    const canvasW = canvasRect?.width || 680;
    
    setOperazioneMouse({
      tipo: 'resize',
      articoloId: art.id,
      startX: e.clientX,
      startY: e.clientY,
      origPosX: art.posX || 0,
      origPosY: art.posY || 0,
      origWidth: art.customWidth || 100,
      origHeight: art.customHeight || 240,
      canvasWidth: canvasW
    });
  };

  // Effetto per ascoltare mousemove e mouseup globali durante drag o resize
  useEffect(() => {
    if (!operazioneMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - operazioneMouse.startX;
      const deltaY = e.clientY - operazioneMouse.startY;
      
      const deltaPercentX = (deltaX / operazioneMouse.canvasWidth) * 100;
      
      let nuovaLista = [...giornalino.articoli];
      const idx = nuovaLista.findIndex(a => a.id === operazioneMouse.articoloId);
      if (idx === -1) return;

      const art = nuovaLista[idx];

      if (operazioneMouse.tipo === 'drag') {
        let newPosX = Math.max(0, Math.min(100 - (art.customWidth || 100), operazioneMouse.origPosX + deltaPercentX));
        let newPosY = Math.max(0, operazioneMouse.origPosY + deltaY);

        if (snapToGrid) {
          // Snap a colonne (0%, 50%, ecc.)
          if (Math.abs(newPosX - 0) < 3) newPosX = 0;
          if (Math.abs(newPosX - 50) < 3) newPosX = 50;
          // Snap verticale a passi di 10px
          newPosY = Math.round(newPosY / 10) * 10;
        }

        nuovaLista[idx] = {
          ...art,
          posX: Math.round(newPosX * 10) / 10,
          posY: Math.round(newPosY)
        };
        onSalva({ ...giornalino, articoli: nuovaLista });
      } else if (operazioneMouse.tipo === 'resize') {
        let newW = Math.max(25, Math.min(100, operazioneMouse.origWidth + deltaPercentX));
        let newH = Math.max(120, operazioneMouse.origHeight + deltaY);

        if (snapToGrid) {
          // Snap larghezza a 33.3%, 50%, 66.6%, 100%
          if (Math.abs(newW - 50) < 4) newW = 50;
          else if (Math.abs(newW - 100) < 4) newW = 100;
          else if (Math.abs(newW - 33.3) < 4) newW = 33.3;
          // Snap altezza a multipli di 10px
          newH = Math.round(newH / 10) * 10;
        }

        nuovaLista[idx] = {
          ...art,
          customWidth: Math.round(newW * 10) / 10,
          customHeight: Math.round(newH)
        };
        onSalva({ ...giornalino, articoli: nuovaLista });
      }
    };

    const handleMouseUp = () => {
      setOperazioneMouse(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [operazioneMouse, snapToGrid, giornalino, onSalva]);

  // Allineamento articoli all'interno dello spazio (Sinistra, Centro, Destra, Larghezza Piena)
  const allineaArticoloNelloSpazio = (articoloId: string, allineamento: 'sinistra' | 'centro' | 'destra' | 'piena') => {
    const nuovaLista = giornalino.articoli.map(a => {
      if (a.id !== articoloId) return a;
      if (allineamento === 'piena') {
        return { ...a, posX: 0, customWidth: 100 };
      } else if (allineamento === 'sinistra') {
        const w = a.customWidth || 50;
        return { ...a, posX: 0, customWidth: w > 90 ? 50 : w };
      } else if (allineamento === 'destra') {
        const w = a.customWidth || 50;
        const validW = w > 90 ? 50 : w;
        return { ...a, posX: 100 - validW, customWidth: validW };
      } else if (allineamento === 'centro') {
        const w = a.customWidth || 50;
        const validW = w > 90 ? 70 : w;
        return { ...a, posX: Math.max(0, (100 - validW) / 2), customWidth: validW };
      }
      return a;
    });
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Imposta allineamento tipografico del testo (richiesta utente 1)
  const cambiaAllineamentoTesto = (articoloId: string, allin: 'left' | 'center' | 'right' | 'justify') => {
    const nuovaLista = giornalino.articoli.map(a => a.id === articoloId ? { ...a, allineamento: allin } : a);
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Cambia stile box grafico per l'articolo
  const cambiaStileBox = (articoloId: string, stile: ArticoloGiornalino['stileBox']) => {
    const nuovaLista = giornalino.articoli.map(a => a.id === articoloId ? { ...a, stileBox: stile } : a);
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Cambia posizione layout della foto nell'articolo
  const cambiaFotoPosizione = (articoloId: string, pos: ArticoloGiornalino['fotoPosizione']) => {
    const nuovaLista = giornalino.articoli.map(a => a.id === articoloId ? { ...a, fotoPosizione: pos } : a);
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  // Helper stile box DTP
  const getStileBoxClass = (stile?: string) => {
    switch (stile) {
      case 'bordo_sottile':
        return 'border border-slate-400 bg-white shadow-2xs';
      case 'bordo_blu':
        return 'border-2 border-indigo-600 bg-indigo-50/20 shadow-2xs';
      case 'sfondo_chiaro':
        return 'border border-slate-200 bg-slate-50/90 shadow-2xs';
      case 'sfondo_pergamena':
        return 'border border-amber-300 bg-[#fdfbf7] shadow-2xs text-amber-950';
      case 'cornice_classica':
        return 'border-4 border-double border-slate-900 bg-white shadow-2xs';
      default:
        return 'border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40';
    }
  };

  // Resetta dimensioni o posizionamento personalizzato
  const resettaDimensioniArticolo = (articoloId: string) => {
    const nuovaLista = giornalino.articoli.map(a => {
      if (a.id !== articoloId) return a;
      const { posX, posY, customWidth, customHeight, ...resto } = a;
      return resto;
    });
    onSalva({ ...giornalino, articoli: nuovaLista });
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. BARRA DI CONTROLLO STUDIO DTP SUPERIORE */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Selettore Vista Foglio & Modalità */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setModalitaVista('singola')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                modalitaVista === 'singola' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualizza e impagina una pagina A4 per volta"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Foglio A4</span>
            </button>
            <button
              onClick={() => {
                setModalitaVista('doppia');
                if (paginaAttiva % 2 !== 0 && paginaAttiva > 1) {
                  setPaginaAttiva(paginaAttiva - 1);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                modalitaVista === 'doppia' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Apertura a libro: vedi due pagine affiancate (es. Pag 2-3)"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Doppia Pagina (Spread)</span>
            </button>
            <button
              onClick={() => setModalitaVista('timone')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                modalitaVista === 'timone' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualizza il timone / menabò completo con tutte le pagine"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-600" />
              <span>Timone Menabò</span>
            </button>
          </div>

          {/* Selettore Pagina Rapido */}
          {modalitaVista !== 'timone' && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">Pagina:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalePagine }, (_, i) => i + 1).map((p) => {
                  const numArt = giornalino.articoli.filter(a => (a.pagina || 1) === p).length;
                  return (
                    <button
                      key={p}
                      onClick={() => setPaginaAttiva(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer relative ${
                        paginaAttiva === p
                          ? 'bg-indigo-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={`Vai a Pagina ${p} (${numArt} articoli)`}
                    >
                      <span>{p}</span>
                      {numArt > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Strumenti Studio: Righelli, Gabbia Colonne, Zoom */}
        <div className="flex items-center gap-2">
          
          {/* Toggles Guide Studio & DTP Free-form */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setModalitaLayout(modalitaLayout === 'libero' ? 'automatico' : 'libero')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold text-[11px] ${
                modalitaLayout === 'libero' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white'
              }`}
              title="Modalità DTP: Sposta e ridimensiona liberamente gli spazi degli articoli col mouse"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{modalitaLayout === 'libero' ? 'DTP Libero' : 'Automatico'}</span>
            </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                snapToGrid ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Attiva/Disattiva allineamento magnetico su colonne e griglia (Snap-to-grid)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMostraRighelli(!mostraRighelli)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                mostraRighelli ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Attiva/Disattiva righelli millimetrici graduati"
            >
              <Ruler className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMostraGabbia(!mostraGabbia)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                mostraGabbia ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Attiva/Disattiva visualizzazione gabbia tipografica e colonne"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMostraBleed(!mostraBleed)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                mostraBleed ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Attiva/Disattiva margini di rifilo / abbondanza 3mm (Bleed tipografico)"
            >
              <span className="text-[10px] font-mono font-black">3mm</span>
            </button>
          </div>

          {/* Zoom Controller */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 15))}
              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Riduci Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[11px] text-slate-700 w-11 text-center select-none">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(130, zoom + 15))}
              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Aumenta Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-700 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer ml-0.5"
              title="Ripristina dimensione reale 1:1"
            >
              100%
            </button>
          </div>

          {/* Azioni Rapide Stampa & Aggiungi */}
          <button
            onClick={() => setMostraModalEditorIntestazione(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            title="Personalizza il layout, il titolo e lo stile dell'intestazione del notiziario"
          >
            <Type className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Editor Intestazione</span>
            <span className="md:hidden">Testata</span>
          </button>

          <button
            onClick={apriNuovoArticoloStudio}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#185abd] hover:bg-[#114691] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Articolo</span>
          </button>

          <button
            onClick={onApriStampaModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stampa A4</span>
          </button>

        </div>

      </div>

      {/* 2. AREA DI LAVORO DELLO STUDIO (SIDEBAR ISPETTORE + STAGE CANVAS A4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ISPETTORE STRUMENTI DELLO STUDIO (COLONNA SINISTRA 4 / 12) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          
          {/* Schede dell'Ispettore */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-center">
            <button
              onClick={() => setSchedaIspettore('layout')}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                schedaIspettore === 'layout' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gabbia
            </button>
            <button
              onClick={() => setSchedaIspettore('intestazione')}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                schedaIspettore === 'intestazione' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Testata
            </button>
            <button
              onClick={() => setSchedaIspettore('blocchi')}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                schedaIspettore === 'blocchi' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Articoli</span>
              <span className="text-[10px] px-1 bg-indigo-100 text-indigo-900 rounded font-black">
                {articoliPagina.length}
              </span>
            </button>
            <button
              onClick={() => setSchedaIspettore('sponsor')}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                schedaIspettore === 'sponsor' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Sponsor</span>
              <span className="text-[10px] px-1 bg-amber-100 text-amber-900 rounded font-black">
                {sponsorPagina.length}
              </span>
            </button>
            <button
              onClick={() => setSchedaIspettore('preflight')}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                schedaIspettore === 'preflight' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verifica
            </button>
          </div>

          {/* SOTTO-SCHEDA INTESTAZIONE: EDITOR TESTATA COMPLETO */}
          {schedaIspettore === 'intestazione' && (
            <GiornalinoHeaderEditor
              config={config}
              giornalino={giornalino}
              onSalva={onSalva}
              inline={true}
            />
          )}

          {/* SOTTO-SCHEDA 1: GABBIA, COLORI & TIPOMETRIA */}
          {schedaIspettore === 'layout' && (
            <div className="space-y-4 text-xs">
              
              {/* Barra Stima Riempimento Pagina */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Riempimento Pagina {paginaAttiva}:
                  </span>
                  <span className={`font-mono font-black ${
                    percentualeRiempimento > 95 ? 'text-amber-700' :
                    percentualeRiempimento > 40 ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {percentualeRiempimento}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      percentualeRiempimento > 95 ? 'bg-amber-500' :
                      percentualeRiempimento > 40 ? 'bg-emerald-600' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${percentualeRiempimento}%` }}
                  />
                </div>
                <p className="text-[10.5px] text-slate-500">
                  {percentualeRiempimento > 90 ? '⚠️ Pagina molto densa, verifica che non debordi.' :
                   percentualeRiempimento > 50 ? '✓ Spazio equilibrato e bilanciato.' :
                   'ℹ️ Pagina parzialmente libera: puoi aggiungere un articolo o uno sponsor.'}
                </p>
              </div>

              {/* Riquadro Accesso Rapido all'Intestazione con Editor */}
              <div className="bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold shadow-2xs">
                      <Type className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <div>
                      <span className="font-black text-slate-900 text-xs block">
                        Intestazione & Testata
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-medium truncate max-w-[160px] block">
                        {giornalino.testata || 'La Voce della Pro Loco'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostraModalEditorIntestazione(true)}
                    className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-2xs"
                  >
                    Editor
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-slate-600 pt-1 border-t border-indigo-100">
                  <span>Modello grafico:</span>
                  <span className="font-bold text-indigo-950">
                    {giornalino.configurazioneIntestazione?.stileIntestazione === 'banda_piena' ? 'Banda Piena' :
                     giornalino.configurazioneIntestazione?.stileIntestazione === 'ornata_stemma' ? 'Ornata con Stemma' :
                     giornalino.configurazioneIntestazione?.stileIntestazione === 'retro_box' ? 'Retro Box' :
                     giornalino.configurazioneIntestazione?.stileIntestazione === 'minimal_lineare' ? 'Minimal Lineare' :
                     giornalino.configurazioneIntestazione?.stileIntestazione === 'bilaterale_logo' ? 'Bilaterale Logo' : 'Classica Doppio Filetto'}
                  </span>
                </div>
              </div>

              {/* Selezione Font Principale del Notiziario */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    Carattere Tipografico del Fascicolo
                  </label>
                  <span className="text-[10px] text-indigo-700 font-bold">Standard</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {FONT_GIORNALINO_LIST.map((f) => {
                    const isAttivo = (studioCfg.stileFont === f.id) || ((studioCfg.stileFont === 'playfair' || !studioCfg.stileFont) && f.id === 'serif');
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => aggiornaStudioConfig({ stileFont: f.id as any })}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isAttivo
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <span 
                          className="block text-xs truncate"
                          style={{ fontFamily: getFontFamilyCss(f.id) }}
                        >
                          {f.nome}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block font-sans">
                          {f.categoria}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gabbia a Colonne Predefinita */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Gabbia Colonne per Pagina {paginaAttiva}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { col: 1, label: '1 Colonna', sub: 'Editoriale largo' },
                    { col: 2, label: '2 Colonne', sub: 'Standard rivista' },
                    { col: 3, label: '3 Colonne', sub: 'Gazzetta compatta' }
                  ].map((g) => (
                    <button
                      key={g.col}
                      onClick={() => aggiornaStudioConfig({ grigliaPredefinita: g.col as any })}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        studioCfg.grigliaPredefinita === g.col
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold">{g.label}</span>
                      <span className="text-[10px] text-slate-500">{g.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filetti verticali tra colonne */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Filetti Verticali Tipografici</span>
                  <span className="text-[10.5px] text-slate-500">Linea sottile di separazione tra le colonne</span>
                </div>
                <input
                  type="checkbox"
                  checked={studioCfg.filettiVerticali}
                  onChange={(e) => aggiornaStudioConfig({ filettiVerticali: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>

              {/* Interlinea Testo */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Interlinea Editoriale (Leading)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['stretta', 'standard', 'ampia'] as const).map((inter) => (
                    <button
                      key={inter}
                      onClick={() => aggiornaStudioConfig({ interlinea: inter })}
                      className={`p-2 rounded-xl border capitalize text-center transition cursor-pointer ${
                        studioCfg.interlinea === inter
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {inter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Azioni Rapide su Pagina */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={apriNuovoArticoloStudio}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Articolo a Pag. {paginaAttiva}</span>
                </button>
                <button
                  onClick={() => apriNuovoSponsor(paginaAttiva)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>+ Sponsor a Pag. {paginaAttiva}</span>
                </button>
              </div>

            </div>
          )}

          {/* SOTTO-SCHEDA 2: ARTICOLI DELLA PAGINA CORRENTE */}
          {schedaIspettore === 'blocchi' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  Articoli Assegnati a Pagina {paginaAttiva}:
                </span>
                <button
                  onClick={apriNuovoArticoloStudio}
                  className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                >
                  + Nuovo Articolo
                </button>
              </div>

              {articoliPagina.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2 text-slate-400">
                  <BookOpen className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="text-xs">Nessun articolo assegnato a Pagina {paginaAttiva}</p>
                  <button
                    onClick={apriNuovoArticoloStudio}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-lg font-bold text-xs hover:bg-indigo-100 transition cursor-pointer"
                  >
                    Crea Articolo per questa pagina
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {articoliPagina.map((art, idx) => (
                    <div
                      key={art.id}
                      className="p-3 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900">
                          {art.sezione.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => spostaOrdineInPagina(art.id, 'su')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer"
                            title="Sposta prima"
                          >
                            <MoveUp className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <button
                            onClick={() => spostaOrdineInPagina(art.id, 'giu')}
                            disabled={idx === articoliPagina.length - 1}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer"
                            title="Sposta dopo"
                          >
                            <MoveDown className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 line-clamp-1">{art.titolo}</h4>
                      
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                        {/* Selettore Pagina */}
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Sposta:</span>
                          <select
                            value={art.pagina || 1}
                            onChange={(e) => spostaArticoloPagina(art.id, parseInt(e.target.value, 10))}
                            className="bg-white border border-slate-300 text-indigo-900 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {Array.from({ length: totalePagine }, (_, i) => i + 1).map(p => (
                              <option key={p} value={p}>Pag. {p}</option>
                            ))}
                          </select>
                        </div>

                        {/* Modifica Word */}
                        <button
                          onClick={() => onApriWordEditor(art)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#185abd] text-white rounded-lg font-bold text-[11px] hover:bg-[#114691] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Modifica</span>
                        </button>
                      </div>

                      {/* Selettore Colonna & DTP Allineamento nello Spazio */}
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 text-[10.5px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Allinea nello spazio:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => allineaArticoloNelloSpazio(art.id, 'sinistra')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                              title="Allinea a sinistra nella pagina (50% larghezza)"
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => allineaArticoloNelloSpazio(art.id, 'centro')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                              title="Centra nello spazio della pagina"
                            >
                              <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => allineaArticoloNelloSpazio(art.id, 'destra')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                              title="Allinea a destra nella pagina (50% larghezza)"
                            >
                              <AlignRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => allineaArticoloNelloSpazio(art.id, 'piena')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                              title="Espandi a larghezza intera (100%)"
                            >
                              <AlignJustify className="w-3.5 h-3.5" />
                            </button>
                            {(art.posX !== undefined || art.customWidth !== undefined) && (
                              <button
                                onClick={() => resettaDimensioniArticolo(art.id)}
                                className="p-1 hover:bg-slate-200 rounded text-amber-700 cursor-pointer ml-1"
                                title="Reimposta posizione/dimensioni automatiche"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Allineamento Testo Tipografico */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Allineamento Testo:</span>
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200">
                            {(['left', 'center', 'right', 'justify'] as const).map(al => (
                              <button
                                key={al}
                                onClick={() => cambiaAllineamentoTesto(art.id, al)}
                                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                  (art.allineamento || 'justify') === al ? 'bg-indigo-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title={`Testo ${al}`}
                              >
                                {al === 'left' ? 'SX' : al === 'center' ? 'C' : al === 'right' ? 'DX' : 'Giust.'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Spostamento e ridimensionamento libero col mouse */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg">
                          <span>DTP Libero:</span>
                          <span className="font-mono font-medium text-indigo-950">
                            W: {art.customWidth || (art.colonna === 'singola' ? 50 : 100)}% {art.posX ? `| X: ${art.posX}%` : ''} {art.posY ? `| Y: ${art.posY}px` : ''}
                          </span>
                        </div>

                        {/* Stile Box Grafico & Posizione Foto DTP */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Stile Riquadro:</span>
                            <select
                              value={art.stileBox || 'nessuno'}
                              onChange={(e) => cambiaStileBox(art.id, e.target.value as any)}
                              className="w-full text-[10.5px] font-medium bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800"
                            >
                              <option value="nessuno">Nessuno (Classico)</option>
                              <option value="bordo_sottile">Bordo Sottile</option>
                              <option value="bordo_blu">Bordo Blu Oltremare</option>
                              <option value="sfondo_chiaro">Sfondo Neutro</option>
                              <option value="sfondo_pergamena">Pergamena / Warm</option>
                              <option value="cornice_classica">Cornice Doppia DTP</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Posizione Foto:</span>
                            <select
                              value={art.fotoPosizione || 'sopra'}
                              onChange={(e) => cambiaFotoPosizione(art.id, e.target.value as any)}
                              className="w-full text-[10.5px] font-medium bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800"
                            >
                              <option value="sopra">In alto (Larghezza piena)</option>
                              <option value="in_testo_sinistra">Affiancata a Sinistra</option>
                              <option value="in_testo_destra">Affiancata a Destra</option>
                              <option value="in_calce">In calce al testo</option>
                            </select>
                          </div>
                        </div>

                        {/* Carattere Tipografico dell'Articolo */}
                        <div className="pt-1.5 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-500 font-medium block mb-0.5">Carattere / Font Articolo:</span>
                          <select
                            value={art.fontFamiglia || studioCfg.stileFont || 'playfair'}
                            onChange={(e) => {
                              const nuovaLista = giornalino.articoli.map(a => a.id === art.id ? { ...a, fontFamiglia: e.target.value as any } : a);
                              onSalva({ ...giornalino, articoli: nuovaLista });
                            }}
                            className="w-full text-[10.5px] font-medium bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800"
                          >
                            {FONT_GIORNALINO_LIST.map(f => (
                              <option key={f.id} value={f.id}>{f.nome} ({f.categoria})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* SOTTO-SCHEDA 3: SPONSOR & INSERZIONISTI LOCALI */}
          {schedaIspettore === 'sponsor' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Sponsor & Sostenitori Locali</span>
                  <span className="text-[10.5px] text-slate-500">Spazi per finanziare la stampa del giornalino</span>
                </div>
                <button
                  onClick={() => apriNuovoSponsor(paginaAttiva)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  + Sponsor
                </button>
              </div>

              {sponsorPagina.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-amber-200 rounded-xl space-y-2 text-slate-500 bg-amber-50/40">
                  <Store className="w-6 h-6 mx-auto text-amber-600" />
                  <p className="text-xs font-bold text-slate-700">Nessuna inserzione su Pagina {paginaAttiva}</p>
                  <p className="text-[11px] text-slate-500">
                    Aggiungi le botteghe del paese, ristoranti o banche locali per coprire i costi di stampa.
                  </p>
                  <button
                    onClick={() => apriNuovoSponsor(paginaAttiva)}
                    className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-bold text-xs hover:bg-amber-800 transition cursor-pointer"
                  >
                    Aggiungi Sponsor a Pag. {paginaAttiva}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {sponsorPagina.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          {sp.categoria}
                        </span>
                        <span className="text-[10.5px] text-slate-500 capitalize">
                          {sp.formato === 'box_quarto' ? '1/4 Pagina' :
                           sp.formato === 'banner_striscia' ? 'Banner Striscia' : '1/2 Pagina'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{sp.nome}</h4>
                        {sp.slogan && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">{sp.slogan}</p>
                        )}
                        <div className="text-[10.5px] text-slate-500 mt-1 flex flex-wrap gap-2">
                          {sp.telefono && <span>📞 {sp.telefono}</span>}
                          {sp.indirizzo && <span>📍 {sp.indirizzo}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Pagina:</span>
                          <select
                            value={sp.pagina}
                            onChange={(e) => {
                              const nuovaLista = sponsorList.map(item => item.id === sp.id ? { ...item, pagina: parseInt(e.target.value, 10) } : item);
                              onSalva({ ...giornalino, sponsor: nuovaLista });
                            }}
                            className="bg-white border border-slate-300 text-amber-900 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {Array.from({ length: totalePagine }, (_, i) => i + 1).map(p => (
                              <option key={p} value={p}>Pag. {p}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSponsorInModifica({ ...sp });
                              setMostraModaleSponsor(true);
                            }}
                            className="p-1 text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer font-bold"
                            title="Modifica sponsor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => eliminaSponsor(sp.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Elimina sponsor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* SOTTO-SCHEDA 4: PREFLIGHT CHECK / VERIFICA PRESTAMPA */}
          {schedaIspettore === 'preflight' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-800">Controllo Tecnico Prestampa (Preflight)</span>
              </div>

              <div className="space-y-2">
                {/* 1. Numero Pagine Pari */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Fascicolo Stampabile</strong>
                    <span className="text-slate-500 text-[11px]">
                      {totalePagine} pagine totali ({totalePagine % 2 === 0 ? 'Fronte/Retro corretto per spillatura a punto sella' : 'Attenzione: pagine dispari'})
                    </span>
                  </div>
                </div>

                {/* 2. Testata e Direttore */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  {giornalino.direttoreResponsabile ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="text-slate-900 block font-bold">Gerenza & Direttore Responsabile</strong>
                    <span className="text-slate-500 text-[11px]">
                      {giornalino.direttoreResponsabile || 'Non impostato (obbligo legge stampa)'}
                    </span>
                  </div>
                </div>

                {/* 3. Copertura Sponsor */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Inserzioni Pubblicitarie</strong>
                    <span className="text-slate-500 text-[11px]">
                      {sponsorList.length} sponsor locali inseriti nel notiziario
                    </span>
                  </div>
                </div>

                {/* 4. Tiratura & Consegna */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Tiratura Notiziario</strong>
                    <span className="text-slate-500 text-[11px]">
                      {giornalino.tiratura || '1.000 copie'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* CANVAS PRINCIPALE DEL FOGLIO A4 (COLONNA DESTRA 8 / 12) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-start overflow-x-auto pb-8">
          
          {/* VISTA 1: FOGLIO SINGOLO A4 CON RIGHELLI E GABBIA */}
          {modalitaVista === 'singola' && (
            <div 
              className="relative transition-transform origin-top flex flex-col items-center"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              
              {/* RIGHELLO ORIZZONTALE GRADUATO IN ALTO */}
              {mostraRighelli && (
                <div className="w-[680px] h-5 bg-slate-200 border-t border-l border-r border-slate-300 text-[9px] font-mono text-slate-500 flex items-end justify-between px-2 select-none">
                  <span>0mm</span>
                  <span>30mm</span>
                  <span>60mm</span>
                  <span>90mm</span>
                  <span className="font-bold text-indigo-900">105mm (Centro)</span>
                  <span>140mm</span>
                  <span>170mm</span>
                  <span>210mm</span>
                </div>
              )}

              <div className="flex">
                
                {/* RIGHELLO VERTICALE GRADUATO A SINISTRA */}
                {mostraRighelli && (
                  <div className="w-5 h-[960px] bg-slate-200 border-l border-b border-t border-slate-300 text-[8px] font-mono text-slate-500 flex flex-col justify-between py-2 items-center select-none">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span className="font-bold text-indigo-900">200</span>
                    <span>250</span>
                    <span>297</span>
                  </div>
                )}

                {/* FOGLIO A4 CENTRALE (DIMENSIONE PROPORZIONATA A4) */}
                <div 
                  ref={canvasA4Ref}
                  className={`w-[680px] min-h-[960px] border-2 border-slate-300 shadow-xl p-8 flex flex-col justify-between relative transition-all ${
                    mostraBleed ? 'outline-2 outline-dashed outline-rose-400' : ''
                  }`}
                  style={{ 
                    color: presetAttivo.colori.primario,
                    backgroundColor: coloreSfondoCarta,
                    fontFamily: getFontFamilyCss(studioCfg.stileFont)
                  }}
                  onClick={() => setArticoloSelezionatoId(null)}
                >
                  
                  {/* CORNICE PERIMETRALE FOGLIO (Se attivata da opzioni estetiche) */}
                  {opzioniEsteticaAttive.corniceFoglio && (
                    <div 
                      className="absolute inset-4 pointer-events-none border-2 border-double opacity-60 z-0"
                      style={{ borderColor: presetAttivo.colori.primario }}
                    />
                  )}

                  {/* GUIDA GABBIA COLONNE TRATTEGGIATA (Se attivata) */}
                  {mostraGabbia && (
                    <div className="absolute inset-x-8 inset-y-8 pointer-events-none grid grid-cols-2 gap-6 opacity-25 z-0">
                      <div className="border-r border-dashed border-indigo-400"></div>
                      <div></div>
                    </div>
                  )}

                  {/* INDICATORE DI RIFILO BLEED 3mm */}
                  {mostraBleed && (
                    <div className="absolute -top-3 -left-3 text-[9px] font-mono bg-rose-500 text-white px-1.5 py-0.5 rounded shadow z-10">
                      Abbondanza 3mm
                    </div>
                  )}

                  <div className="relative z-10">
                    
                    {/* INTESTAZIONE SPECIFICA PAGINA 1 (TESTATA DEL GIORNALE) */}
                    {paginaAttiva === 1 && (
                      <div className="relative mb-6 group">
                        <GiornalinoHeaderView
                          config={config}
                          giornalino={giornalino}
                          onApriEditor={() => setMostraModalEditorIntestazione(true)}
                          modalitaStampa={false}
                          coloreTemaDefault={temaAttivo.colorePrimario}
                          fontTestataDefault={temaAttivo.fontTitolo}
                        />
                      </div>
                    )}

                    {/* TESTATINA CORRENTE PER PAGINE INTERNE (2, 3, 4) */}
                    {paginaAttiva > 1 && (
                      <div 
                        onClick={() => setMostraModalEditorIntestazione(true)}
                        title="Clicca per modificare la testatina corrente e i dati del periodico"
                        className="group relative border-b pb-2 mb-6 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-50/80 rounded px-2 -mx-2 transition"
                        style={{ 
                          borderColor: presetAttivo.colori.filettoSeparatore,
                          color: presetAttivo.colori.secondario 
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-black">{giornalino.runningHeader || `${giornalino.testata} - ${giornalino.periodo}`}</span>
                          <span className="text-[10px] text-indigo-700 font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            Modifica
                          </span>
                        </div>
                        {giornalino.mostraNumerazionePagine !== false && (
                          <span 
                            className="font-mono px-2 py-0.5 rounded border"
                            style={{ 
                              color: presetAttivo.colori.primario,
                              borderColor: presetAttivo.colori.filettoSeparatore,
                              backgroundColor: 'rgba(0,0,0,0.03)'
                            }}
                          >
                            PAGINA {paginaAttiva}
                          </span>
                        )}
                      </div>
                    )}

                    {/* ARTICOLI MONTATI SULLA PAGINA ATTIVA */}
                    {articoliPagina.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl py-16 text-center text-slate-400 space-y-3">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                        <h3 className="font-bold text-slate-700 text-sm">Questa pagina A4 è attualmente vuota</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Usa i pulsanti sottostanti o la barra laterale per montare il primo articolo su Pagina {paginaAttiva}.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            onClick={apriNuovoArticoloStudio}
                            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Aggiungi Articolo a Pagina {paginaAttiva}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative min-h-[500px] flex flex-wrap content-start gap-y-6">
                        {articoliPagina.map((art) => {
                          const isSelezionato = articoloSelezionatoId === art.id;
                          
                          // Calcolo larghezza: da customWidth % se impostato, altrimenti da colonna
                          const widthPercent = art.customWidth !== undefined 
                            ? art.customWidth 
                            : (art.colonna === 'singola' ? 50 : 100);

                          const isDoppia = (art.colonna === 'doppia' || !art.colonna) && widthPercent > 60;
                          const isIntera = art.colonna === 'intera' && widthPercent > 85;

                          // Stile DTP posizionamento
                          const styleDtp: React.CSSProperties = {
                            width: `${widthPercent}%`,
                            minHeight: art.customHeight ? `${art.customHeight}px` : undefined,
                            transform: (art.posX || art.posY) ? `translate(${art.posX ? `${(art.posX / widthPercent) * 100}%` : '0px'}, ${art.posY || 0}px)` : undefined,
                            transition: operazioneMouse?.articoloId === art.id ? 'none' : 'box-shadow 0.2s, border-color 0.2s'
                          };

                          return (
                            <article 
                              key={art.id} 
                              style={styleDtp}
                              onClick={(e) => {
                                e.stopPropagation();
                                setArticoloSelezionatoId(art.id);
                              }}
                              className={`${getStileBoxClass(art.stileBox)} pb-5 relative group p-3.5 rounded-xl transition ${
                                isSelezionato 
                                  ? 'ring-2 ring-indigo-500 shadow-md z-10' 
                                  : ''
                              }`}
                            >
                              
                              {/* FLOATING ACTION TOOLBAR SU HOVER O SELEZIONE */}
                              <div className={`absolute top-2 right-2 transition-opacity flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-300 shadow-md p-1 rounded-xl z-20 text-[10.5px] ${
                                isSelezionato ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                {/* MANIGLIA PER SPOSTAMENTO CON IL MOUSE */}
                                <button
                                  onMouseDown={(e) => iniziaSpostamento(e, art)}
                                  className="px-2 py-1 bg-indigo-900 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-800 cursor-grab active:cursor-grabbing select-none"
                                  title="Trascina con il mouse per spostare lo spazio dell'articolo"
                                >
                                  <Move className="w-3 h-3" />
                                  <span className="hidden sm:inline">Sposta</span>
                                </button>

                                {/* ALLINEAMENTO RAPIDO NELLO SPAZIO */}
                                <div className="flex items-center gap-0.5 border-l border-r border-slate-200 px-1">
                                  <button
                                    onClick={() => allineaArticoloNelloSpazio(art.id, 'sinistra')}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                    title="Allinea a sinistra"
                                  >
                                    <AlignLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => allineaArticoloNelloSpazio(art.id, 'centro')}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                    title="Centra nello spazio"
                                  >
                                    <AlignCenter className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => allineaArticoloNelloSpazio(art.id, 'destra')}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                    title="Allinea a destra"
                                  >
                                    <AlignRight className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => allineaArticoloNelloSpazio(art.id, 'piena')}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                    title="Espandi a larghezza 100%"
                                  >
                                    <AlignJustify className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => onApriWordEditor(art)}
                                  className="px-2 py-1 bg-[#185abd] text-white rounded-lg font-bold flex items-center gap-1 hover:bg-[#114691] cursor-pointer"
                                  title="Modifica testo a schermo intero in stile Word"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editor</span>
                                </button>
                                
                                <button
                                  onClick={() => spostaArticoloPagina(art.id, paginaAttiva > 1 ? paginaAttiva - 1 : totalePagine)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                  title="Sposta a pagina precedente"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-indigo-900 px-1">Pag {paginaAttiva}</span>
                                <button
                                  onClick={() => spostaArticoloPagina(art.id, paginaAttiva < totalePagine ? paginaAttiva + 1 : 1)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                  title="Sposta a pagina successiva"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Sezione & Autore */}
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                                <span className={`px-2 py-0.5 rounded font-black ${
                                  art.sezione === 'editoriale' ? 'bg-emerald-100 text-emerald-900' :
                                  art.sezione === 'primo_piano' ? 'bg-amber-100 text-amber-900' :
                                  'bg-indigo-100 text-indigo-900'
                                }`}>
                                  {art.sezione.replace('_', ' ')}
                                </span>
                                <span className="flex items-center gap-2">
                                  {art.customWidth && (
                                    <span className="font-mono text-indigo-900 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                                      {Math.round(art.customWidth)}% W
                                    </span>
                                  )}
                                  <span>{art.data}</span>
                                </span>
                              </div>

                              {/* Occhiello Superiore */}
                              {art.occhiello && (
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-0.5 font-sans">
                                  {art.occhiello}
                                </div>
                              )}

                              {/* Titolo Principale */}
                              <h3 
                                style={{ fontFamily: getFontFamilyCss(art.fontFamiglia || studioCfg.stileFont || 'playfair') }}
                                className={`font-black leading-tight text-slate-950 mb-1 ${
                                  art.inEvidenza ? 'text-2xl' : 'text-xl'
                                }`}
                              >
                                {art.titolo}
                              </h3>

                              {/* Sottotitolo */}
                              {art.sottotitolo && (
                                <p 
                                  style={{ fontFamily: getFontFamilyCss(art.fontFamiglia || studioCfg.stileFont || 'playfair') }}
                                  className="text-xs font-medium text-slate-600 italic mb-2"
                                >
                                  {art.sottotitolo}
                                </p>
                              )}

                              {/* Immagine Allegata - Posizione SOPRA */}
                              {art.immagine && (art.fotoPosizione === 'sopra' || !art.fotoPosizione) && (
                                <div className="my-2 rounded-lg overflow-hidden border border-slate-200">
                                  <img
                                    src={art.immagine}
                                    alt={art.titolo}
                                    className="w-full h-40 object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  {art.didascaliaImmagine && (
                                    <div className="bg-slate-50 px-2 py-1 text-[10px] text-slate-500 italic border-t border-slate-200">
                                      {art.didascaliaImmagine}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Testo a Colonne con Capolettera (Drop Cap) e Allineamento all'interno dello spazio */}
                              <div 
                                style={{ fontFamily: getFontFamilyCss(art.fontFamiglia || studioCfg.stileFont || 'garamond') }}
                                className={`text-[11.5px] leading-relaxed text-slate-800 ${
                                  isDoppia ? 'sm:columns-2 gap-5' :
                                  isIntera ? 'sm:columns-3 gap-4' : ''
                                } ${
                                  art.allineamento === 'center' ? 'text-center' :
                                  art.allineamento === 'right' ? 'text-right' : 
                                  art.allineamento === 'left' ? 'text-left' : 'text-justify'
                                } ${
                                  studioCfg.interlinea === 'stretta' ? 'leading-normal' :
                                  studioCfg.interlinea === 'ampia' ? 'leading-loose' : 'leading-relaxed'
                                }`}
                              >
                                {/* Immagine Allegata Flottante a Sinistra */}
                                {art.immagine && art.fotoPosizione === 'in_testo_sinistra' && (
                                  <div className="float-left w-44 mr-3 mb-2 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                                    <img
                                      src={art.immagine}
                                      alt={art.titolo}
                                      className="w-full h-28 object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    {art.didascaliaImmagine && (
                                      <div className="bg-slate-50 px-1.5 py-0.5 text-[9.5px] text-slate-500 italic border-t border-slate-200">
                                        {art.didascaliaImmagine}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Immagine Allegata Flottante a Destra */}
                                {art.immagine && art.fotoPosizione === 'in_testo_destra' && (
                                  <div className="float-right w-44 ml-3 mb-2 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                                    <img
                                      src={art.immagine}
                                      alt={art.titolo}
                                      className="w-full h-28 object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    {art.didascaliaImmagine && (
                                      <div className="bg-slate-50 px-1.5 py-0.5 text-[9.5px] text-slate-500 italic border-t border-slate-200">
                                        {art.didascaliaImmagine}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {art.capolettera && art.contenuto ? (
                                  <div>
                                    <span className="float-left text-3xl font-black font-['Playfair_Display',serif] leading-none pr-1.5 pt-0.5 text-slate-900 select-none">
                                      {art.contenuto.replace(/<[^>]*>?/gm, '').trim().charAt(0)}
                                    </span>
                                    {art.contenuto.includes('<') ? (
                                      <span dangerouslySetInnerHTML={{ __html: art.contenuto }} />
                                    ) : (
                                      <span className="whitespace-pre-line">{art.contenuto}</span>
                                    )}
                                  </div>
                                ) : art.contenuto.includes('<') ? (
                                  <div dangerouslySetInnerHTML={{ __html: art.contenuto }} />
                                ) : (
                                  <p className="whitespace-pre-line">{art.contenuto}</p>
                                )}
                              </div>

                              {/* Immagine Allegata - Posizione IN CALCE */}
                              {art.immagine && art.fotoPosizione === 'in_calce' && (
                                <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
                                  <img
                                    src={art.immagine}
                                    alt={art.titolo}
                                    className="w-full h-36 object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  {art.didascaliaImmagine && (
                                    <div className="bg-slate-50 px-2 py-1 text-[10px] text-slate-500 italic border-t border-slate-200">
                                      {art.didascaliaImmagine}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Firma Autore con eventuale avatar */}
                              <div className="mt-3 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10.5px] text-slate-500 italic font-serif">
                                <div className="flex items-center gap-1.5 not-italic">
                                  {art.fotoAutore && (
                                    <img
                                      src={art.fotoAutore}
                                      alt={art.autore}
                                      className="w-5 h-5 rounded-full object-cover border border-slate-300"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <span>A cura di: <strong className="text-slate-800 font-sans font-bold">{art.autore}</strong></span>
                                </div>
                                <span className="font-sans text-[10px]">{art.data}</span>
                              </div>

                              {/* MANIGLIA DI RIDIMENSIONAMENTO ANGOLARE IN BASSO A DESTRA (MOUSE RESIZE) */}
                              <div
                                onMouseDown={(e) => iniziaRidimensionamento(e, art)}
                                className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-indigo-600 hover:bg-indigo-800 text-white rounded-full flex items-center justify-center cursor-nwse-resize shadow-md transition select-none z-30 ${
                                  isSelezionato ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90'
                                }`}
                                title="Trascina con il mouse per ridimensionare larghezza e altezza a piacimento"
                              >
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M15 19l4 0l0 -4" />
                                  <path d="M11 19l8 -8" />
                                </svg>
                              </div>

                            </article>
                          );
                        })}
                      </div>
                    )}

                    {/* SEZIONE SPONSOR MONTATI IN QUESTA PAGINA */}
                    {sponsorPagina.length > 0 && (
                      <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Spazio Riservato alle Attività Sostenitrici del Territorio
                          </span>
                          <span className="text-[9px] text-slate-400">Si ringraziano gli inserzionisti</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {sponsorPagina.map((sp) => (
                            <div 
                              key={sp.id} 
                              className={`border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between ${
                                sp.formato === 'banner_striscia' ? 'sm:col-span-2' : ''
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                                    {sp.categoria}
                                  </span>
                                  {sp.telefono && (
                                    <span className="text-[10px] text-slate-500 font-mono">Tel. {sp.telefono}</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-black text-slate-900 uppercase">{sp.nome}</h4>
                                {sp.slogan && (
                                  <p className="text-[10.5px] text-slate-600 italic font-serif">{sp.slogan}</p>
                                )}
                              </div>

                              {sp.indirizzo && (
                                <div className="text-[9.5px] text-slate-500 mt-2 pt-1 border-t border-slate-200">
                                  📍 {sp.indirizzo}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* PIEDE DI PAGINA FOGLIO A4 */}
                  <footer className="border-t border-slate-300 pt-2 mt-6 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-mono select-none">
                    <span>{config.nome}</span>
                    {giornalino.mostraNumerazionePagine !== false ? (
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        PAGINA {paginaAttiva} DI {totalePagine}
                      </span>
                    ) : (
                      <span className="text-slate-400">•••</span>
                    )}
                    <span>{giornalino.dataPubblicazione}</span>
                  </footer>

                </div>

              </div>

            </div>
          )}

          {/* VISTA 2: DOPPIA PAGINA APERTA (SPREAD FOGLIO 2-3) */}
          {modalitaVista === 'doppia' && (
            <div 
              className="relative transition-transform origin-top flex flex-col items-center"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="text-center mb-3 text-xs font-bold text-slate-600">
                Apertura Centrale del Giornalino • Pagine 2 e 3 a Confronto
              </div>

              <div className="flex gap-4 items-start">
                
                {/* PAGINA SINISTRA (Es. Pag 2) */}
                <div className="w-[440px] min-h-[640px] bg-white border border-slate-300 shadow-lg p-5 rounded-l-2xl flex flex-col justify-between text-xs">
                  <div>
                    <div className="border-b border-slate-300 pb-1 mb-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{giornalino.testata}</span>
                      <span className="font-mono text-slate-900 font-bold">PAGINA 2</span>
                    </div>

                    <div className="space-y-3">
                      {giornalino.articoli.filter(a => (a.pagina || 1) === 2).map(art => (
                        <div key={art.id} className="border-b border-slate-100 pb-2">
                          <span className="text-[9.5px] font-bold uppercase text-indigo-900 block">{art.sezione}</span>
                          <h4 className="font-bold text-slate-900 text-sm">{art.titolo}</h4>
                          <p className="text-[10.5px] text-slate-600 line-clamp-4 mt-1 leading-relaxed">
                            {art.contenuto.replace(/<[^>]*>?/gm, ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-400 border-t pt-1 font-mono">PAGINA 2</div>
                </div>

                {/* PAGINA DESTRA (Es. Pag 3) */}
                <div className="w-[440px] min-h-[640px] bg-white border border-slate-300 shadow-lg p-5 rounded-r-2xl flex flex-col justify-between text-xs">
                  <div>
                    <div className="border-b border-slate-300 pb-1 mb-3 flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span className="font-mono text-slate-900 font-bold">PAGINA 3</span>
                      <span>{config.nome}</span>
                    </div>

                    <div className="space-y-3">
                      {giornalino.articoli.filter(a => (a.pagina || 1) === 3).map(art => (
                        <div key={art.id} className="border-b border-slate-100 pb-2">
                          <span className="text-[9.5px] font-bold uppercase text-indigo-900 block">{art.sezione}</span>
                          <h4 className="font-bold text-slate-900 text-sm">{art.titolo}</h4>
                          <p className="text-[10.5px] text-slate-600 line-clamp-4 mt-1 leading-relaxed">
                            {art.contenuto.replace(/<[^>]*>?/gm, ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-400 border-t pt-1 font-mono text-right">PAGINA 3</div>
                </div>

              </div>
            </div>
          )}

          {/* VISTA 3: TIMONE MENABÒ (TUTTE LE PAGINE IN MINIATURA) */}
          {modalitaVista === 'timone' && (
            <div className="w-full space-y-4">
              <div className="text-center text-xs font-bold text-slate-600">
                Timone Redazionale & Menabò Fascicolo ({totalePagine} Pagine Totali)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: totalePagine }, (_, i) => i + 1).map((p) => {
                  const artP = giornalino.articoli.filter(a => (a.pagina || 1) === p);
                  const spP = sponsorList.filter(s => s.pagina === p);

                  return (
                    <div
                      key={p}
                      onClick={() => {
                        setPaginaAttiva(p);
                        setModalitaVista('singola');
                      }}
                      className="bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md p-4 transition cursor-pointer flex flex-col justify-between min-h-[300px]"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b pb-2 mb-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                            PAGINA {p}
                          </span>
                          <span className="text-[10.5px] font-bold text-indigo-700">
                            {artP.length} art.
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {artP.slice(0, 3).map(a => (
                            <div key={a.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                              <span className="text-[9.5px] font-black uppercase text-indigo-900 block">{a.sezione}</span>
                              <strong className="text-slate-900 block truncate">{a.titolo}</strong>
                            </div>
                          ))}
                          {artP.length > 3 && (
                            <span className="text-[10.5px] text-slate-400 block text-center">
                              +{artP.length - 3} altri articoli
                            </span>
                          )}
                          {spP.length > 0 && (
                            <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                              ★ {spP.length} sponsor assegnati
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t text-[11px] font-bold text-indigo-700 hover:underline flex items-center justify-between">
                        <span>Apri Foglio A4</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. MODALE INSERIMENTO RAPIDO SPONSOR */}
      {mostraModaleSponsor && sponsorInModifica && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="p-5 bg-gradient-to-r from-amber-800 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Gestione Inserzionista / Sponsor Locale</h3>
              </div>
              <button
                onClick={() => {
                  setMostraModaleSponsor(false);
                  setSponsorInModifica(null);
                }}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome Attività / Inserzionista *
                </label>
                <input
                  type="text"
                  value={sponsorInModifica.nome}
                  onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, nome: e.target.value })}
                  placeholder="Es. Ristorante Pizzeria Il Vecchio Mulino"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Categoria Merceologica
                  </label>
                  <input
                    type="text"
                    value={sponsorInModifica.categoria}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, categoria: e.target.value })}
                    placeholder="Es. Enogastronomia, Artigianato, Banca"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Formato Inserzione
                  </label>
                  <select
                    value={sponsorInModifica.formato}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, formato: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                  >
                    <option value="box_quarto">1/4 Pagina (Modulo Standard)</option>
                    <option value="banner_striscia">Striscia / Banner Orizzontale</option>
                    <option value="mezza_pagina">1/2 Pagina (Spazio Primario)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Slogan o Claim Pubblicitario
                </label>
                <input
                  type="text"
                  value={sponsorInModifica.slogan || ''}
                  onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, slogan: e.target.value })}
                  placeholder="Es. Cucina tipica a km zero, specialità carne alla brace"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Telefono / Contatto
                  </label>
                  <input
                    type="text"
                    value={sponsorInModifica.telefono || ''}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, telefono: e.target.value })}
                    placeholder="Es. 0577 123456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Assegna a Pagina
                  </label>
                  <select
                    value={sponsorInModifica.pagina}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, pagina: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                  >
                    {Array.from({ length: totalePagine }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>Pagina {p} {p === totalePagine ? '(Quarta di Copertina)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Indirizzo Sede / Negozio
                </label>
                <input
                  type="text"
                  value={sponsorInModifica.indirizzo || ''}
                  onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, indirizzo: e.target.value })}
                  placeholder="Es. Via Roma 15, Centro Storico"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setMostraModaleSponsor(false);
                  setSponsorInModifica(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (!sponsorInModifica.nome.trim()) {
                    alert('Inserisci il nome dell\'attività inserzionista.');
                    return;
                  }
                  salvaSponsor(sponsorInModifica);
                }}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salva Inserzione</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODALE DIALOGO DEDICATA: EDITOR INTESTAZIONE & TESTATA */}
      {mostraModalEditorIntestazione && (
        <GiornalinoHeaderEditor
          config={config}
          giornalino={giornalino}
          onSalva={onSalva}
          onChiudi={() => setMostraModalEditorIntestazione(false)}
          inline={false}
        />
      )}

    </div>
  );
};
