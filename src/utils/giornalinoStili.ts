import { FontEditorGiornalino, StileEsteticaGiornalino, OpzioniEsteticaStampa } from '../types';

export interface FontInfo {
  id: FontEditorGiornalino;
  nome: string;
  categoria: 'serif' | 'sans' | 'slab' | 'mono' | 'romano';
  descrizione: string;
  familyCss: string;
  campione: string;
}

export const FONT_GIORNALINO_LIST: FontInfo[] = [
  {
    id: 'serif',
    nome: 'Playfair Display (Serif)',
    categoria: 'serif',
    descrizione: 'Gazzetta d\'epoca e quotidiani nobili ad alto contrasto, ideale per testate ed editoriali',
    familyCss: "'Playfair Display', Georgia, serif",
    campione: 'La Voce della Pro Loco'
  },
  {
    id: 'sans',
    nome: 'Plus Jakarta Sans (Sans)',
    categoria: 'sans',
    descrizione: 'Sans-serif moderno, pulito e geometrico per un look istituzionale contemporaneo',
    familyCss: "'Plus Jakarta Sans', system-ui, sans-serif",
    campione: 'Associazione Turistica Pro Loco APS'
  },
  {
    id: 'classico',
    nome: 'Antiqua Classica (Times)',
    categoria: 'serif',
    descrizione: 'Proporzioni tipografiche storiche intramontabili con forte rigore editoriale',
    familyCss: "'Times New Roman', Times, serif",
    campione: 'Edizione periodica sociale a diffusione gratuita'
  }
];

export interface PresetEsteticaGiornalino {
  id: StileEsteticaGiornalino;
  nome: string;
  tag: string;
  descrizione: string;
  icona: string;
  colori: {
    primario: string; // Inchiostro primario
    secondario: string; // Sottotitoli / rubriche
    accento: string; // Occhielli / box
    sfondoFoglio: string; // Tonalità foglio di carta A4
    sfondoBadge: string;
    bordoTestata: string;
    filettoSeparatore: string;
    accentoCapolettera: string;
    testoArticolo: string;
  };
  tipografia: {
    fontTestata: string;
    fontTitoli: string;
    fontCorpo: string;
    fontGerenza: string;
  };
  decorazioni: {
    stileFiletti: 'doppio' | 'sottile' | 'tratteggiato' | 'ornato';
    mostraFiligrana: boolean;
    coloreFiletti: string;
    stileBordoBox: string;
    stileTestataDefault: 'classica_doppio_filetto' | 'ornata_stemma' | 'banda_piena' | 'minimal_lineare' | 'retro_box';
    fregioSimbolo?: string;
  };
}

export const PRESET_ESTETICA_GIORNALINO: Record<StileEsteticaGiornalino, PresetEsteticaGiornalino> = {
  classico_inchiostro: {
    id: 'classico_inchiostro',
    nome: "Gazzetta Storica d'Inchiostro",
    tag: 'Classico Tradizionale',
    descrizione: 'Nero grafite ad alto contrasto, testata a doppio filetto e Playfair Display da grande quotidiano d\'informazione.',
    icona: '🏛️',
    colori: {
      primario: '#0f172a',
      secondario: '#334155',
      accento: '#1e293b',
      sfondoFoglio: '#ffffff',
      sfondoBadge: 'bg-slate-100 text-slate-900 border-slate-300',
      bordoTestata: 'border-b-4 border-double border-slate-900',
      filettoSeparatore: '#cbd5e1',
      accentoCapolettera: '#0f172a',
      testoArticolo: '#1e293b'
    },
    tipografia: {
      fontTestata: "'Playfair Display', Georgia, serif",
      fontTitoli: "'Playfair Display', Georgia, serif",
      fontCorpo: "'Playfair Display', Georgia, serif",
      fontGerenza: "'Playfair Display', Georgia, serif"
    },
    decorazioni: {
      stileFiletti: 'doppio',
      mostraFiligrana: false,
      coloreFiletti: '#94a3b8',
      stileBordoBox: 'border-2 border-slate-900 bg-slate-50',
      stileTestataDefault: 'classica_doppio_filetto',
      fregioSimbolo: '❦'
    }
  },

  antico_borgo: {
    id: 'antico_borgo',
    nome: 'Antico Borgo & Pergamena Rinascimentale',
    tag: 'Cultura & Rievocazioni',
    descrizione: 'Tonalità pergamena avorio, inchiostro seppia e bronzo, Cinzel e Garamond per borghi storici, palii e feste medievali.',
    icona: '📜',
    colori: {
      primario: '#451a03',
      secondario: '#78350f',
      accento: '#92400e',
      sfondoFoglio: '#faf7f0', // Calda pergamena avorio
      sfondoBadge: 'bg-[#f4ede1] text-[#451a03] border-[#d6c7af]',
      bordoTestata: 'border-b-4 border-double border-[#78350f]',
      filettoSeparatore: '#d6c7af',
      accentoCapolettera: '#78350f',
      testoArticolo: '#382216'
    },
    tipografia: {
      fontTestata: "'Cinzel', 'Times New Roman', serif",
      fontTitoli: "'Cinzel', 'Times New Roman', serif",
      fontCorpo: "'EB Garamond', Garamond, Georgia, serif",
      fontGerenza: "'EB Garamond', Garamond, Georgia, serif"
    },
    decorazioni: {
      stileFiletti: 'ornato',
      mostraFiligrana: true,
      coloreFiletti: '#c4b59d',
      stileBordoBox: 'border-2 border-[#78350f] bg-[#f4ede1]',
      stileTestataDefault: 'ornata_stemma',
      fregioSimbolo: '❖'
    }
  },

  unpli_verde: {
    id: 'unpli_verde',
    nome: 'Periodico Territoriale UNPLI',
    tag: 'Natura & Istituzionale',
    descrizione: 'Verde bosco istituzionale, accenti smeraldo e Lora ad altissima leggibilità per valorizzazione del territorio e natura.',
    icona: '🌿',
    colori: {
      primario: '#064e3b',
      secondario: '#047857',
      accento: '#065f46',
      sfondoFoglio: '#ffffff',
      sfondoBadge: 'bg-emerald-50 text-emerald-950 border-emerald-300',
      bordoTestata: 'border-b-4 border-double border-[#064e3b]',
      filettoSeparatore: '#a7f3d0',
      accentoCapolettera: '#064e3b',
      testoArticolo: '#0f291e'
    },
    tipografia: {
      fontTestata: "'Lora', Georgia, serif",
      fontTitoli: "'Lora', Georgia, serif",
      fontCorpo: "'Lora', Georgia, serif",
      fontGerenza: "'Lora', Georgia, serif"
    },
    decorazioni: {
      stileFiletti: 'sottile',
      mostraFiligrana: false,
      coloreFiletti: '#6ee7b7',
      stileBordoBox: 'border-2 border-[#064e3b] bg-emerald-50/60',
      stileTestataDefault: 'classica_doppio_filetto',
      fregioSimbolo: '❧'
    }
  },

  bordeaux_nobiliare: {
    id: 'bordeaux_nobiliare',
    nome: 'Bordeaux Nobiliare & Sagre Enogastronomiche',
    tag: 'Prestigio & Tradizione',
    descrizione: 'Tonalità amarone, bordeaux nobile e Merriweather per sagre del vino, rassegne culinarie e patroni d\'autunno.',
    icona: '🍷',
    colori: {
      primario: '#4c0519',
      secondario: '#881337',
      accento: '#9f1239',
      sfondoFoglio: '#fffdfd',
      sfondoBadge: 'bg-rose-50 text-rose-950 border-rose-300',
      bordoTestata: 'border-b-4 border-double border-[#4c0519]',
      filettoSeparatore: '#fecdd3',
      accentoCapolettera: '#881337',
      testoArticolo: '#2d0a12'
    },
    tipografia: {
      fontTestata: "'Cinzel', 'Times New Roman', serif",
      fontTitoli: "'Merriweather', Georgia, serif",
      fontCorpo: "'Merriweather', Georgia, serif",
      fontGerenza: "'Merriweather', Georgia, serif"
    },
    decorazioni: {
      stileFiletti: 'doppio',
      mostraFiligrana: false,
      coloreFiletti: '#fb7185',
      stileBordoBox: 'border-2 border-[#4c0519] bg-rose-50/70',
      stileTestataDefault: 'retro_box',
      fregioSimbolo: '✦'
    }
  },

  alpino_dolomiti: {
    id: 'alpino_dolomiti',
    nome: 'Eco Alpino & Valli del Territorio',
    tag: 'Montagna & Sentieri',
    descrizione: 'Tonalità pino montano, roccia dolomitica e corteccia di castagno con carattere solido Bitter per rifugi, natura e sentieri.',
    icona: '🌲',
    colori: {
      primario: '#1c3b2b',
      secondario: '#334155',
      accento: '#2d5a3f',
      sfondoFoglio: '#fafbf9',
      sfondoBadge: 'bg-stone-100 text-stone-900 border-stone-300',
      bordoTestata: 'border-b-4 border-double border-[#1c3b2b]',
      filettoSeparatore: '#cbd5e1',
      accentoCapolettera: '#1c3b2b',
      testoArticolo: '#1e2922'
    },
    tipografia: {
      fontTestata: "'Bitter', serif",
      fontTitoli: "'Bitter', serif",
      fontCorpo: "'Lora', Georgia, serif",
      fontGerenza: "'Plus Jakarta Sans', sans-serif"
    },
    decorazioni: {
      stileFiletti: 'sottile',
      mostraFiligrana: false,
      coloreFiletti: '#94a3b8',
      stileBordoBox: 'border-2 border-[#1c3b2b] bg-[#f2f6f3]',
      stileTestataDefault: 'classica_doppio_filetto',
      fregioSimbolo: '▲'
    }
  },

  mediterraneo_solare: {
    id: 'mediterraneo_solare',
    nome: 'Solare Mediterraneo & Feste Patronali',
    tag: 'Estate & Folklore',
    descrizione: 'Terracotta calda, ocra dorata e zafferano con Playfair e Lora per sagre all\'aperto, notti bianche e rievocazioni estive.',
    icona: '☀️',
    colori: {
      primario: '#7c2d12',
      secondario: '#9a3412',
      accento: '#c2410c',
      sfondoFoglio: '#fdfbf7', // Calda luce solare
      sfondoBadge: 'bg-amber-100 text-amber-950 border-amber-300',
      bordoTestata: 'border-b-4 border-double border-[#7c2d12]',
      filettoSeparatore: '#fed7aa',
      accentoCapolettera: '#9a3412',
      testoArticolo: '#431407'
    },
    tipografia: {
      fontTestata: "'Playfair Display', Georgia, serif",
      fontTitoli: "'Playfair Display', Georgia, serif",
      fontCorpo: "'Lora', Georgia, serif",
      fontGerenza: "'Plus Jakarta Sans', sans-serif"
    },
    decorazioni: {
      stileFiletti: 'ornato',
      mostraFiligrana: false,
      coloreFiletti: '#f97316',
      stileBordoBox: 'border-2 border-[#9a3412] bg-amber-50/80',
      stileTestataDefault: 'ornata_stemma',
      fregioSimbolo: '☀️'
    }
  },

  moderno_magazine: {
    id: 'moderno_magazine',
    nome: 'Moderno Magazine Contemporaneo',
    tag: 'Design & Minimalismo',
    descrizione: 'Look fresco da rivista patinata con Outfit e Plus Jakarta Sans, linee pulite, sezioni ariose e forte impatto visivo.',
    icona: '✨',
    colori: {
      primario: '#09090b',
      secondario: '#27272a',
      accento: '#4338ca', // Indigo accent
      sfondoFoglio: '#ffffff',
      sfondoBadge: 'bg-zinc-100 text-zinc-900 border-zinc-300',
      bordoTestata: 'border-b-2 border-zinc-900',
      filettoSeparatore: '#e4e4e7',
      accentoCapolettera: '#4338ca',
      testoArticolo: '#18181b'
    },
    tipografia: {
      fontTestata: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      fontTitoli: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      fontCorpo: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontGerenza: "'Plus Jakarta Sans', system-ui, sans-serif"
    },
    decorazioni: {
      stileFiletti: 'sottile',
      mostraFiligrana: false,
      coloreFiletti: '#d4d4d8',
      stileBordoBox: 'border border-zinc-300 bg-zinc-50 rounded-xl',
      stileTestataDefault: 'minimal_lineare',
      fregioSimbolo: '▪'
    }
  },

  vintage_rotativa: {
    id: 'vintage_rotativa',
    nome: "Gazzettino di Provincia Anni '70",
    tag: 'Vintage & Notiziario',
    descrizione: 'Sapore autentico da rotativa di provincia: carta grigio-tipografica, Bitter solido e richiami a macchina da scrivere.',
    icona: '📻',
    colori: {
      primario: '#1c1917',
      secondario: '#44403c',
      accento: '#57534e',
      sfondoFoglio: '#f5f4f0', // Carta quotidiano calda
      sfondoBadge: 'bg-stone-200 text-stone-900 border-stone-400',
      bordoTestata: 'border-b-4 border-double border-stone-800',
      filettoSeparatore: '#a8a29e',
      accentoCapolettera: '#1c1917',
      testoArticolo: '#292524'
    },
    tipografia: {
      fontTestata: "'Bitter', serif",
      fontTitoli: "'Bitter', serif",
      fontCorpo: "'Bitter', Georgia, serif",
      fontGerenza: "'Courier Prime', monospace"
    },
    decorazioni: {
      stileFiletti: 'doppio',
      mostraFiligrana: true,
      coloreFiletti: '#78716c',
      stileBordoBox: 'border-2 border-stone-800 bg-stone-100',
      stileTestataDefault: 'retro_box',
      fregioSimbolo: '— ❖ —'
    }
  },

  blu_civico: {
    id: 'blu_civico',
    nome: 'Bollettino Civico Oltremare',
    tag: 'Istituzionale & Civico',
    descrizione: 'Blu notte istituzionale e accenti zaffiro, ideale per resoconti comunali, trasparenza e notiziari ufficiali di paese.',
    icona: '🌊',
    colori: {
      primario: '#172554',
      secondario: '#1e3a8a',
      accento: '#1d4ed8',
      sfondoFoglio: '#ffffff',
      sfondoBadge: 'bg-blue-50 text-blue-950 border-blue-300',
      bordoTestata: 'border-b-4 border-double border-[#172554]',
      filettoSeparatore: '#bfdbfe',
      accentoCapolettera: '#1e3a8a',
      testoArticolo: '#0f172a'
    },
    tipografia: {
      fontTestata: "'Playfair Display', Georgia, serif",
      fontTitoli: "'Playfair Display', Georgia, serif",
      fontCorpo: "'Lora', Georgia, serif",
      fontGerenza: "'Plus Jakarta Sans', system-ui, sans-serif"
    },
    decorazioni: {
      stileFiletti: 'doppio',
      mostraFiligrana: false,
      coloreFiletti: '#93c5fd',
      stileBordoBox: 'border-2 border-[#172554] bg-blue-50/50',
      stileTestataDefault: 'classica_doppio_filetto',
      fregioSimbolo: '◆'
    }
  }
};

export const LISTA_PRESET_ESTETICA = Object.values(PRESET_ESTETICA_GIORNALINO);

export const TONALITA_CARTA_MAP: Record<string, { nome: string; bg: string; border: string; desc: string }> = {
  bianco_ottico: {
    nome: 'Bianco Ottico Tipografico',
    bg: '#ffffff',
    border: '#cbd5e1',
    desc: 'Luminoso, pulito, per massima leggibilità contemporanea'
  },
  carta_naturale_avorio: {
    nome: 'Uso Mano Avorio Naturale',
    bg: '#fbf9f4',
    border: '#e2d9cc',
    desc: 'Caldo, rilassante per la vista, tipico delle edizioni pregiate'
  },
  pergamena_antica: {
    nome: 'Pergamena d\'Epoca',
    bg: '#f6f1e5',
    border: '#d5c7b0',
    desc: 'Sapore antico per borghi medievali e rievocazioni storiche'
  },
  grigio_quotidiano: {
    nome: 'Grigio Rotativa Tipografica',
    bg: '#f4f3ef',
    border: '#d6d3cd',
    desc: 'Fascino autentico da notiziario stampato su rotativa'
  },
  carta_sabbia_riciclata: {
    nome: 'Carta Sabbia Ecologica',
    bg: '#f5f2eb',
    border: '#dcd5c7',
    desc: 'Tonalità fibra naturale per sostenibilità e territorio'
  },
  ocra_solare: {
    nome: 'Ocra Solare Calda',
    bg: '#fdfbf4',
    border: '#ebdcc5',
    desc: 'Luce dorata mediterranea per feste patronali e sagre estive'
  }
};

/**
 * Risolve la famiglia font CSS a partire dal codice identificativo salvato
 */
export const getFontFamilyCss = (fontId?: string): string => {
  if (!fontId) return "'Playfair Display', Georgia, serif";
  const trovato = FONT_GIORNALINO_LIST.find(f => f.id === fontId);
  if (trovato) return trovato.familyCss;
  
  if (fontId === 'serif' || fontId === 'playfair') return "'Playfair Display', Georgia, serif";
  if (fontId === 'sans') return "'Plus Jakarta Sans', system-ui, sans-serif";
  if (fontId === 'classico') return "'Times New Roman', Times, serif";
  
  return "'Playfair Display', Georgia, serif";
};

/**
 * Recupera la configurazione estetica completa
 */
export const getEsteticaPreset = (presetId?: string): PresetEsteticaGiornalino => {
  if (presetId && presetId in PRESET_ESTETICA_GIORNALINO) {
    return PRESET_ESTETICA_GIORNALINO[presetId as StileEsteticaGiornalino];
  }
  // Mappa dai temi studio legacy
  if (presetId === 'inchiostro') return PRESET_ESTETICA_GIORNALINO.classico_inchiostro;
  if (presetId === 'unpli') return PRESET_ESTETICA_GIORNALINO.unpli_verde;
  if (presetId === 'bordeaux') return PRESET_ESTETICA_GIORNALINO.bordeaux_nobiliare;
  if (presetId === 'blu') return PRESET_ESTETICA_GIORNALINO.blu_civico;
  if (presetId === 'antico_borgo') return PRESET_ESTETICA_GIORNALINO.antico_borgo;
  if (presetId === 'vintage') return PRESET_ESTETICA_GIORNALINO.vintage_rotativa;
  if (presetId === 'moderno') return PRESET_ESTETICA_GIORNALINO.moderno_magazine;
  if (presetId === 'alpino') return PRESET_ESTETICA_GIORNALINO.alpino_dolomiti;
  if (presetId === 'mediterraneo') return PRESET_ESTETICA_GIORNALINO.mediterraneo_solare;

  return PRESET_ESTETICA_GIORNALINO.classico_inchiostro;
};

/**
 * Risolve la tonalità reale della carta
 */
export const getSfondoCarta = (preset: PresetEsteticaGiornalino, tonalita?: string): string => {
  if (tonalita && tonalita in TONALITA_CARTA_MAP) {
    return TONALITA_CARTA_MAP[tonalita].bg;
  }
  return preset.colori.sfondoFoglio;
};

/**
 * Mappatura bidirezionale fluida tra temaColore e StileEsteticaGiornalino
 */
export const sincronizzaTemaColore = (stileId: StileEsteticaGiornalino): string => {
  if (stileId === 'classico_inchiostro') return 'inchiostro';
  if (stileId === 'antico_borgo') return 'antico_borgo';
  if (stileId === 'unpli_verde') return 'unpli';
  if (stileId === 'bordeaux_nobiliare') return 'bordeaux';
  if (stileId === 'alpino_dolomiti') return 'alpino';
  if (stileId === 'mediterraneo_solare') return 'mediterraneo';
  if (stileId === 'moderno_magazine') return 'moderno';
  if (stileId === 'vintage_rotativa') return 'vintage';
  if (stileId === 'blu_civico') return 'blu';
  return 'inchiostro';
};
