import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Highlighter,
  Palette,
  Minus,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Check,
  Undo2,
  Redo2,
  Sparkles,
  BookOpen,
  FileText,
  Columns,
  Star,
  Type,
  HelpCircle,
  Table,
  LayoutTemplate,
  Wand2,
  Scissors,
  Layers,
  Camera,
  Info,
  AlertCircle,
  Calendar,
  CheckSquare,
  RotateCcw
} from 'lucide-react';
import { ArticoloGiornalino, CategoriaArticoloGiornalino } from '../types';
import { FONT_GIORNALINO_LIST, getFontFamilyCss } from '../utils/giornalinoStili';

interface WordStyleEditorModalProps {
  articolo: ArticoloGiornalino;
  totalePagine: number;
  onSalva: (articoloAggiornato: ArticoloGiornalino) => void;
  onChiudi: () => void;
}

const PRESET_IMMAGINI = [
  { label: 'Centro Storico & Borgo', url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Paesaggio & Sentieri Natura', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Festa & Stand Gastronomici', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Piazza del Paese & Folklore', url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Volontari & Riunione Direttivo', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Corteo Storico & Tradizioni', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80' }
];

interface ModelloArticolo {
  id: string;
  nome: string;
  descrizione: string;
  sezione: CategoriaArticoloGiornalino;
  occhiello: string;
  titolo: string;
  sottotitolo: string;
  contenutoHtml: string;
  fotoUrl?: string;
  didascalia?: string;
}

const MODELLI_PREDEFINITI: ModelloArticolo[] = [
  {
    id: 'editoriale',
    nome: "Editoriale del Presidente",
    descrizione: "Apertura ufficiale con riflessioni, ringraziamenti e progetti futuri.",
    sezione: 'editoriale',
    occhiello: "IL PUNTO DELLA STAGIONE",
    titolo: "Guardiamo al futuro con l'entusiasmo di sempre",
    sottotitolo: "Un caloroso saluto a tutti i soci, sostenitori e cittadini del nostro amato borgo.",
    contenutoHtml: `<p class="mb-3">Cari concittadini e cari amici della Pro Loco, apriamo questo nuovo numero del notiziario con profondo orgoglio e con uno sguardo colmo di speranza e progetti concreti per la nostra comunità.</p><blockquote style="border-left: 3px solid #1e3a8a; padding-left: 12px; margin: 12px 0; font-style: italic; color: #334155;">« Il vero cuore pulsante del nostro borgo risiede nella passione instancabile di chi sceglie di donare il proprio tempo per gli altri. »</blockquote><p class="mb-3">I mesi trascorsi hanno visto una partecipazione straordinaria a tutti gli appuntamenti calendarizzati: dai percorsi naturalistici alle rassegne culturali, fino alle nostre celebri manifestazioni che hanno richiamato migliaia di visitatori da ogni parte del territorio.</p><div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 0.95em;"><strong>📌 PROSSIMO OBIETTIVO:</strong> L'inaugurazione del nuovo infopoint turistico e il tesseramento soci con tante agevolazioni per le famiglie.</div><p class="mb-3">Un sincero ringraziamento va all'Amministrazione Comunale, agli sponsor storici e soprattutto a ciascuno dei nostri volontari: insieme dimostriamo ogni giorno che fare comunità è il bene più prezioso.</p>`,
    fotoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80',
    didascalia: 'Il Consiglio Direttivo e i volontari riuniti in assemblea.'
  },
  {
    id: 'sagra_evento',
    nome: "Resoconto Sagra & Manifestazione",
    descrizione: "Cronaca d'impatto con numeri di presenze, stand e ringraziamenti.",
    sezione: 'eventi',
    occhiello: "GRANDE SUCCESSO DI PUBBLICO",
    titolo: "Record di presenze per la Sagra delle Tradizioni",
    sottotitolo: "Oltre tremila visitatori hanno animato le vie del centro storico tra profumi, musica e piatti tipici.",
    contenutoHtml: `<p class="mb-3">Un fine settimana indimenticabile ha incoronato la trentaduesima edizione della nostra sagra come una delle più partecipate di sempre. Fin dalle prime ore del pomeriggio, piazza e vicoli sono stati invasi da residenti e turisti incuriositi dalle eccellenze gastronomiche locali.</p><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin: 14px 0; text-align: center;"><div><strong style="font-size: 1.4em; color: #1e3a8a; display: block;">+3.400</strong><span style="font-size: 0.8em; color: #475569;">Visitatori Totali</span></div><div><strong style="font-size: 1.4em; color: #1e3a8a; display: block;">52</strong><span style="font-size: 0.8em; color: #475569;">Volontari al Lavoro</span></div><div><strong style="font-size: 1.4em; color: #1e3a8a; display: block;">100%</strong><span style="font-size: 0.8em; color: #475569;">Ingredienti a Km 0</span></div></div><p class="mb-3">Dagli stand culinari alle visite guidate al castello medievale, ogni momento è stato curato nei minimi dettagli. Gli applausi calorosi della domenica sera hanno ripagato settimane di sacrifici e allestimenti.</p>`,
    fotoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    didascalia: 'Gli stand gastronomici e la grande tavolata dei volontari.'
  },
  {
    id: 'intervista',
    nome: "Intervista al Volontario / Maestro",
    descrizione: "Format giornalistico a domande e risposte con citazione in evidenza.",
    sezione: 'vita_associativa',
    occhiello: "VOLTI E STORIE DELLA NOSTRA TERRA",
    titolo: "«Quarant'anni al servizio del paese»: parla nonno Giuseppe",
    sottotitolo: "Il custode delle tradizioni ci racconta come è cambiata la Pro Loco e l'importanza del ricambio generazionale.",
    contenutoHtml: `<p class="mb-3">Incontriamo Giuseppe nella sede dell'associazione, tra vecchie locandine storiche e album fotografici che raccontano mezzo secolo di feste e memorie condivise.</p><div style="margin: 12px 0; padding: 10px; border-left: 3px solid #0284c7; background-color: #f0f9ff; border-radius: 0 8px 8px 0;"><p style="color: #0369a1; font-weight: bold; margin-bottom: 4px;">D: Giuseppe, cosa ti spinse quarant'anni fa a fondare il primo comitato?</p><p style="color: #334155; font-style: italic; margin-bottom: 0;">R: «Il desiderio di non far spegnere il paese. Vedevamo i giovani allontanarsi e capimmo che solo rianimando le nostre piazze avremmo preservato le nostre radici.»</p></div><div style="margin: 12px 0; padding: 10px; border-left: 3px solid #0284c7; background-color: #f0f9ff; border-radius: 0 8px 8px 0;"><p style="color: #0369a1; font-weight: bold; margin-bottom: 4px;">D: Qual è il messaggio che vuoi lasciare ai nuovi ragazzi appena tesserati?</p><p style="color: #334155; font-style: italic; margin-bottom: 0;">R: «Non abbiate paura di proporre idee nuove. La tradizione non è cenere da conservare, ma fuoco vivo da alimentare insieme.»</p></div>`,
    fotoUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&auto=format&fit=crop&q=80',
    didascalia: 'Un momento di festa e condivisione tra i soci storici.'
  },
  {
    id: 'calendario_eventi',
    nome: "Programma Completo Manifestazioni",
    descrizione: "Tabella orari, luoghi, date e dettagli pratici per i cittadini.",
    sezione: 'eventi',
    occhiello: "APPUNTAMENTI DA NON PERDERE",
    titolo: "Il Calendario degli Eventi Autunno - Inverno",
    sottotitolo: "Tutti gli appuntamenti, le conferenze e i concerti in programma per i prossimi mesi.",
    contenutoHtml: `<p class="mb-3">Segnate queste date sul calendario! La Pro Loco ha preparato un fitto programma di iniziative pensate per grandi e piccini.</p><table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 0.9em;"><thead><tr style="background-color: #1e3a8a; color: #ffffff; text-align: left;"><th style="padding: 8px; border: 1px solid #cbd5e1;">Data</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Orario</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Luogo</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Evento</th></tr></thead><tbody><tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Sabato 18 Ottobre</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Ore 16:30</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Sala Civica</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Conferenza: Le antiche vie della transumanza</td></tr><tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Domenica 26 Ottobre</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Ore 10:00</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Piazza Roma</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Festa d'Autunno: castagnata e mercatino dell'artigianato</td></tr><tr style="background-color: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Sabato 8 Novembre</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Ore 20:30</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Teatro Comunale</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Concerto di beneficenza della banda musicale</td></tr></tbody></table><p class="mb-3">Ingresso libero per tutti gli eventi. Per informazioni e prenotazioni visite guidate rivolgersi alla segreteria della Pro Loco.</p>`,
    fotoUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
    didascalia: 'La piazza centrale allestita per le manifestazioni stagionali.'
  },
  {
    id: 'storia_cultura',
    nome: "Storia, Tradizioni & Territorio",
    descrizione: "Articolo di approfondimento storico con aneddoti e foto d'epoca.",
    sezione: 'storia_cultura',
    occhiello: "RISCOPRIRE LE NOSTRE RADICI",
    titolo: "I segreti dell'antica pieve tra arte e leggenda",
    sottotitolo: "Un viaggio nel tempo alla scoperta dei tesori nascosti a due passi da casa nostra.",
    contenutoHtml: `<p class="mb-3">Pochi sanno che l'abside della nostra antica pieve custodisce tracce risalenti all'epoca romanica, testimonianza dell'importanza strategica che il borgo ricopriva lungo le antiche vie commerciali.</p><blockquote style="border-left: 3px solid #b45309; padding-left: 12px; margin: 12px 0; font-style: italic; color: #78350f;">« Conoscere il passato è la bussola per orientare il futuro della nostra comunità. »</blockquote><p class="mb-3">Recenti studi condotti dall'università hanno riportato alla luce affreschi votivi di straordinaria fattura, realizzati con pigmenti naturali tipici delle botteghe del Quattrocento. La Pro Loco promuoverà per tutto l'anno un ciclo di visite guidate speciali a cura dei nostri giovani ciceroni.</p>`,
    fotoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    didascalia: 'Particolare architettonico della facciata storica.'
  },
  {
    id: 'comunicato_tesseramento',
    nome: "Avviso Ufficiale & Tesseramento",
    descrizione: "Comunicazione associativa, quote soci, orari di apertura e vantaggi.",
    sezione: 'vita_associativa',
    occhiello: "CAMPAGNA SOCI PRO LOCO",
    titolo: "Aperto il Tesseramento: sostieni il tuo territorio",
    sottotitolo: "Tanti vantaggi esclusivi, sconti convenzionati UNPLI e la soddisfazione di far crescere il nostro paese.",
    contenutoHtml: `<p class="mb-3">È ufficialmente aperta la campagna tesseramento soci per il nuovo anno. Aderire alla Pro Loco significa sostenere attivamente le iniziative culturali, ambientali e di promozione turistica del nostro paese.</p><div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 12px 0;"><h4 style="color: #15803d; font-weight: bold; margin-top: 0; margin-bottom: 6px;">Vantaggi della Tessera del Socio UNPLI:</h4><ul style="margin: 0; padding-left: 18px; color: #166534; font-size: 0.95em;"><li>Sconti nei musei, parchi e teatri convenzionati in tutta Italia</li><li>Agevolazioni per assicurazioni, alberghi e terme</li><li>Diritto di voto nell'Assemblea Generale dei Soci</li><li>Gadget ufficiale in omaggio e copia cartacea omaggio del notiziario</li></ul></div><p class="mb-3">La quota annuale resta invariata a 15 Euro. È possibile ritirare la tessera presso la sede ogni sabato mattina dalle 9:30 alle 12:30.</p>`,
    fotoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80',
    didascalia: 'I soci al banchetto per il ritiro delle nuove tessere.'
  }
];

export const WordStyleEditorModal: React.FC<WordStyleEditorModalProps> = ({
  articolo,
  totalePagine,
  onSalva,
  onChiudi,
}) => {
  const [form, setForm] = useState<ArticoloGiornalino>({
    ...articolo,
    occhiello: articolo.occhiello || '',
    pagina: articolo.pagina || 1,
    colonna: articolo.colonna || 'doppia',
    allineamento: articolo.allineamento || 'justify',
    capolettera: articolo.capolettera ?? true,
    fontFamiglia: articolo.fontFamiglia || 'serif',
    dimensioneCarattere: articolo.dimensioneCarattere || 'standard',
    stileBox: articolo.stileBox || 'trasparente',
    fotoPosizione: articolo.fotoPosizione || 'sopra',
    fotoAutore: articolo.fotoAutore || 'Archivio Pro Loco'
  });

  const [tabRibbon, setTabRibbon] = useState<'home' | 'moduli' | 'templates' | 'layout' | 'foto'>('home');
  const [schermoIntero, setSchermoIntero] = useState<boolean>(true);
  const [mostraGalleriaFoto, setMostraGalleriaFoto] = useState<boolean>(false);
  const [coloreTestoAttivo, setColoreTestoAttivo] = useState<string>('#0f172a');
  const [evidenziatoreAttivo, setEvidenziatoreAttivo] = useState<string>('none');
  const [messaggioSalvataggio, setMessaggioSalvataggio] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // Inizializza il contenuto nell'editor visuale contentEditable
  useEffect(() => {
    if (editorRef.current) {
      if (form.contenuto.includes('<') && form.contenuto.includes('>')) {
        editorRef.current.innerHTML = form.contenuto;
      } else {
        const paragraphs = form.contenuto
          .split(/\n\n+/)
          .map(p => `<p class="mb-3">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
        editorRef.current.innerHTML = paragraphs || '<p class="mb-3">Inizia a digitare il testo del tuo articolo per il notiziario...</p>';
      }
    }
  }, []);

  // Aggiorna lo stato del form quando il testo nell'editor cambia
  const sincronizzaContenuto = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setForm(prev => ({ ...prev, contenuto: html }));
    }
  };

  // Esecuzione comandi formattazione stile Word
  const eseguiComando = (comando: string, valore: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(comando, false, valore);
    sincronizzaContenuto();
  };

  // Formattazione allineamento testo
  const impostaAllineamento = (allin: 'left' | 'center' | 'right' | 'justify') => {
    setForm(prev => ({ ...prev, allineamento: allin }));
    const cmdMap: Record<string, string> = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull'
    };
    eseguiComando(cmdMap[allin]);
  };

  // Inserisci Stile Word predefinito
  const applicaStileWord = (stile: 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'callout') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (stile === 'quote') {
      const sel = window.getSelection();
      const testoSelezionato = sel?.toString() || 'Inserisci qui la citazione d\'autore...';
      const quoteHtml = `<blockquote style="border-left: 3px solid #1e3a8a; padding-left: 12px; margin: 12px 0; font-style: italic; color: #334155;">« ${testoSelezionato} »</blockquote><p>&nbsp;</p>`;
      document.execCommand('insertHTML', false, quoteHtml);
    } else if (stile === 'callout') {
      const sel = window.getSelection();
      const testo = sel?.toString() || 'Nota in evidenza: date, orari o dettagli importanti per i soci.';
      const boxHtml = `<div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 0.95em;"><strong>📌 IN EVIDENZA:</strong> ${testo}</div><p>&nbsp;</p>`;
      document.execCommand('insertHTML', false, boxHtml);
    } else {
      document.execCommand('formatBlock', false, `<${stile}>`);
    }
    sincronizzaContenuto();
  };

  // INSERITORI AVANZATI DI BLOCCHI DTP
  const inserisciTabellaEventi = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const htmlTabella = `
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 0.9em;">
        <thead>
          <tr style="background-color: #1e3a8a; color: #ffffff; text-align: left;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Data</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Orario</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Luogo</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Programma Evento</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Sabato 18 Ottobre</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Ore 16:30</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Piazza Centrale</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Apertura stand gastronomici e artigianato locale</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Domenica 19 Ottobre</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Ore 11:00</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Chiostro Civico</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Concerto bandistico e sfilata corteo storico</td>
          </tr>
        </tbody>
      </table>
      <p>&nbsp;</p>
    `;
    document.execCommand('insertHTML', false, htmlTabella);
    sincronizzaContenuto();
  };

  const inserisciBoxStatistiche = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const htmlStats = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin: 14px 0; text-align: center;">
        <div><strong style="font-size: 1.4em; color: #1e3a8a; display: block;">+3.200</strong><span style="font-size: 0.8em; color: #475569;">Visitatori Accolti</span></div>
        <div><strong style="font-size: 1.4em; color: #1e3a8a; display: block;">48</strong><span style="font-size: 0.8em; color: #475569;">Volontari Attivi</span></div>
        <div><strong style="font-size: 1.4em; color: #1e3a8a; display: block;">100%</strong><span style="font-size: 0.8em; color: #475569;">Prodotti Tipici a Km 0</span></div>
      </div>
      <p>&nbsp;</p>
    `;
    document.execCommand('insertHTML', false, htmlStats);
    sincronizzaContenuto();
  };

  const inserisciBloccoQA = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const htmlQA = `
      <div style="margin: 12px 0; padding: 10px; border-left: 3px solid #0284c7; background-color: #f0f9ff; border-radius: 0 8px 8px 0;">
        <p style="color: #0369a1; font-weight: bold; margin-bottom: 4px;">D: Qual è il ricordo più bello di questa edizione della festa?</p>
        <p style="color: #334155; font-style: italic; margin-bottom: 0;">R: «Vedere generazioni diverse lavorare fianco a fianco, dai ragazzi delle scuole ai veterani del paese, uniti dallo stesso sorriso.»</p>
      </div>
      <p>&nbsp;</p>
    `;
    document.execCommand('insertHTML', false, htmlQA);
    sincronizzaContenuto();
  };

  const inserisciSeparatoreStelle = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const htmlStelle = `<div style="text-align: center; margin: 16px 0; color: #94a3b8; font-size: 14px; letter-spacing: 6px;">✦ ✦ ✦</div><p>&nbsp;</p>`;
    document.execCommand('insertHTML', false, htmlStelle);
    sincronizzaContenuto();
  };

  const inserisciBoxAvviso = (tipo: 'info' | 'success' | 'alert') => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    let bg = '#f0f9ff';
    let bdr = '#bae6fd';
    let title = '📌 NOTA INFORMATIVA';
    let text = 'Dettagli per la partecipazione o orari della segreteria.';

    if (tipo === 'success') {
      bg = '#f0fdf4';
      bdr = '#bbf7d0';
      title = '✓ ISCRIZIONI APERTE';
      text = 'Le quote associative possono essere versate presso la sede della Pro Loco.';
    } else if (tipo === 'alert') {
      bg = '#fffbeb';
      bdr = '#fde68a';
      title = '⚠️ ATTENZIONE';
      text = 'In caso di maltempo le manifestazioni all\'aperto si svolgeranno al coperto.';
    }

    const htmlBox = `<div style="background-color: ${bg}; border: 1px solid ${bdr}; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 0.95em;"><strong>${title}:</strong> ${text}</div><p>&nbsp;</p>`;
    document.execCommand('insertHTML', false, htmlBox);
    sincronizzaContenuto();
  };

  const inserisciSeparatore = () => {
    eseguiComando('insertHorizontalRule');
  };

  const inserisciSimbolo = (simbolo: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertText', false, simbolo);
    sincronizzaContenuto();
  };

  // Pulisce la formattazione sporca da copia-incolla esterno
  const pulisciFormattazione = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    const cleanParagraphs = text
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p class="mb-3">${p.trim().replace(/\n/g, '<br/>')}</p>`)
      .join('');
    editorRef.current.innerHTML = cleanParagraphs || '<p class="mb-3">Inizia a scrivere...</p>';
    sincronizzaContenuto();
  };

  // Trasforma virgolette dritte in virgolette tipografiche « »
  const applicaVirgoletteCaporali = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;
    html = html.replace(/"([^"]+)"/g, '« $1 »');
    editorRef.current.innerHTML = html;
    sincronizzaContenuto();
  };

  // Carica un modello predefinito
  const caricaModello = (mod: ModelloArticolo) => {
    if (form.contenuto && form.contenuto.length > 50) {
      if (!confirm(`Vuoi applicare il modello "${mod.nome}"? Il testo e la struttura correnti verranno sostituiti.`)) {
        return;
      }
    }
    setForm(prev => ({
      ...prev,
      titolo: mod.titolo,
      sottotitolo: mod.sottotitolo,
      occhiello: mod.occhiello,
      sezione: mod.sezione,
      contenuto: mod.contenutoHtml,
      immagine: mod.fotoUrl || prev.immagine,
      didascaliaImmagine: mod.didascalia || prev.didascaliaImmagine
    }));
    if (editorRef.current) {
      editorRef.current.innerHTML = mod.contenutoHtml;
    }
  };

  // Calcolo statistiche ed ingombro editoriale avanzato
  const testoPuro = (editorRef.current?.innerText || form.contenuto.replace(/<[^>]*>?/gm, ' ')).trim();
  const conteggioParole = testoPuro ? testoPuro.split(/\s+/).filter(Boolean).length : 0;
  const conteggioCaratteri = testoPuro.length;
  const tempoLetturaMinuti = Math.max(1, Math.ceil(conteggioParole / 180));
  
  // Stima righe tipografiche (media 50 caratteri a colonna per formato A4)
  const righeStimateSingola = Math.ceil(conteggioCaratteri / 70);
  const righeStimateDoppia = Math.ceil(conteggioCaratteri / 38);
  // Stima occupazione pagina A4 (una pagina piena contiene circa 650 parole con foto)
  const percentualeOccupazionePagina = Math.min(100, Math.round((conteggioParole / 550) * 100));

  const handleSalva = () => {
    sincronizzaContenuto();
    const articoloFinale: ArticoloGiornalino = {
      ...form,
      contenuto: editorRef.current?.innerHTML || form.contenuto
    };
    onSalva(articoloFinale);
    setMessaggioSalvataggio(true);
    setTimeout(() => {
      setMessaggioSalvataggio(false);
      onChiudi();
    }, 400);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-900/75 backdrop-blur-xs transition-all ${
      schermoIntero ? 'p-0' : 'p-2 sm:p-4 md:p-6'
    }`}>
      <div className={`bg-slate-100 flex flex-col shadow-2xl overflow-hidden border border-slate-300 w-full mx-auto transition-all ${
        schermoIntero ? 'h-full rounded-none' : 'h-[96vh] max-w-6xl rounded-2xl'
      }`}>
        
        {/* 1. BARRA SUPERIORE TITOLO DOCUMENTO (Stile Microsoft Word / DTP Studio) */}
        <div className="bg-[#185abd] text-white px-4 py-2.5 flex items-center justify-between shadow-xs select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-white text-[#185abd] font-black rounded flex items-center justify-center text-sm shadow-xs shrink-0">
              W
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold truncate">
                  {form.titolo || 'Nuovo Articolo del Giornalino'}
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium">
                  Bozza Fascicolo
                </span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
                  Pagina {form.pagina}
                </span>
              </div>
              <span className="text-[10px] text-blue-100 block truncate">
                Editor Professionale Redazione Stile Word & DTP • {form.sezione.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messaggioSalvataggio && (
              <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-md font-bold animate-pulse flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Salvato nel Fascicolo!</span>
              </span>
            )}

            <button
              id="btn-salva-word-modal"
              onClick={handleSalva}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              title="Salva l'articolo e applica al menabò"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salva e Applica</span>
            </button>

            <button
              onClick={() => setSchermoIntero(!schermoIntero)}
              className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title={schermoIntero ? 'Riduci a finestra' : 'Espandi a schermo intero'}
            >
              {schermoIntero ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onChiudi}
              className="p-1.5 text-blue-100 hover:text-white hover:bg-red-600/80 rounded-lg transition cursor-pointer"
              title="Chiudi editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. RIBBON / BARRA MULTIFUNZIONE WORD POTENZIATA */}
        <div className="bg-slate-50 border-b border-slate-300 shrink-0 select-none shadow-2xs">
          
          {/* Tab Ribbon Bar */}
          <div className="flex items-center gap-1 px-4 pt-1 border-b border-slate-200 text-xs font-semibold text-slate-600 bg-white overflow-x-auto">
            <button
              onClick={() => setTabRibbon('home')}
              className={`px-3 py-1.5 rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tabRibbon === 'home'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-slate-50'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Home & Carattere</span>
            </button>
            <button
              onClick={() => setTabRibbon('moduli')}
              className={`px-3 py-1.5 rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tabRibbon === 'moduli'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-slate-50'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Inserisci & Moduli DTP</span>
            </button>
            <button
              onClick={() => setTabRibbon('templates')}
              className={`px-3 py-1.5 rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tabRibbon === 'templates'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-slate-50'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modelli di Articolo (6)</span>
            </button>
            <button
              onClick={() => setTabRibbon('layout')}
              className={`px-3 py-1.5 rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tabRibbon === 'layout'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-slate-50'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-indigo-600" />
              <span>Paginazione, Stile Box & Ingombro</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                Pag. {form.pagina}
              </span>
            </button>
            <button
              onClick={() => setTabRibbon('foto')}
              className={`px-3 py-1.5 rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tabRibbon === 'foto'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-slate-50'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Foto & Posizionamento</span>
              {form.immagine && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>

          {/* Contenuto Barra Multifunzione Ribbon */}
          <div className="p-2 px-3 sm:px-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            
            {/* TAB HOME & FORMATTAZIONE */}
            {tabRibbon === 'home' && (
              <>
                {/* Annulla / Ripristina */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => eseguiComando('undo')}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                    title="Annulla (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => eseguiComando('redo')}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                    title="Ripristina (Ctrl+Y)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Font e Carattere */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <select
                    value={form.fontFamiglia || 'serif'}
                    onChange={(e) => setForm({ ...form, fontFamiglia: e.target.value as any })}
                    className="bg-transparent text-xs font-bold text-slate-800 pr-1 py-1 focus:outline-none cursor-pointer border-r border-slate-200 mr-1 max-w-[190px]"
                    title="Carattere tipografico dell'articolo"
                  >
                    <option value="serif">Playfair Display (Serif)</option>
                    <option value="sans">Plus Jakarta (Sans)</option>
                    <option value="classico">Antiqua Times (Classico)</option>
                  </select>

                  <button
                    onClick={() => eseguiComando('bold')}
                    className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded font-black cursor-pointer"
                    title="Grassetto (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => eseguiComando('italic')}
                    className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded italic cursor-pointer"
                    title="Corsivo (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => eseguiComando('underline')}
                    className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded underline cursor-pointer"
                    title="Sottolineato (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => eseguiComando('strikeThrough')}
                    className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded line-through cursor-pointer"
                    title="Barrato"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Palette Colori */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setColoreTestoAttivo('#0f172a');
                        eseguiComando('foreColor', '#0f172a');
                      }}
                      className="w-4 h-4 rounded-full bg-slate-900 border border-slate-400 cursor-pointer"
                      title="Testo Nero Inchiostro"
                    />
                    <button
                      onClick={() => {
                        setColoreTestoAttivo('#991b1b');
                        eseguiComando('foreColor', '#991b1b');
                      }}
                      className="w-4 h-4 rounded-full bg-red-800 border border-slate-400 cursor-pointer"
                      title="Rosso Editoriale"
                    />
                    <button
                      onClick={() => {
                        setColoreTestoAttivo('#1e3a8a');
                        eseguiComando('foreColor', '#1e3a8a');
                      }}
                      className="w-4 h-4 rounded-full bg-blue-900 border border-slate-400 cursor-pointer"
                      title="Blu UNPLI Istituzionale"
                    />
                    <button
                      onClick={() => {
                        setColoreTestoAttivo('#166534');
                        eseguiComando('foreColor', '#166534');
                      }}
                      className="w-4 h-4 rounded-full bg-emerald-800 border border-slate-400 cursor-pointer"
                      title="Verde Natura"
                    />
                  </div>

                  {/* Evidenziatore */}
                  <button
                    onClick={() => {
                      const nuovo = evidenziatoreAttivo === 'none' ? '#fef08a' : 'none';
                      setEvidenziatoreAttivo(nuovo);
                      eseguiComando('hiliteColor', nuovo === 'none' ? 'transparent' : '#fef08a');
                    }}
                    className={`p-1.5 rounded cursor-pointer ${
                      evidenziatoreAttivo !== 'none' ? 'bg-amber-100 text-amber-900' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Evidenziatore Giallo"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Paragrafo e Allineamento */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => impostaAllineamento('left')}
                    className={`p-1.5 rounded cursor-pointer ${
                      form.allineamento === 'left' ? 'bg-blue-100 text-[#185abd] font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Allinea a Sinistra"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => impostaAllineamento('center')}
                    className={`p-1.5 rounded cursor-pointer ${
                      form.allineamento === 'center' ? 'bg-blue-100 text-[#185abd] font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Allinea al Centro"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => impostaAllineamento('right')}
                    className={`p-1.5 rounded cursor-pointer ${
                      form.allineamento === 'right' ? 'bg-blue-100 text-[#185abd] font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Allinea a Destra"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => impostaAllineamento('justify')}
                    className={`p-1.5 rounded cursor-pointer ${
                      form.allineamento === 'justify' ? 'bg-blue-100 text-[#185abd] font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Testo Giustificato (Standard Periodici e Giornali)"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  <button
                    onClick={() => eseguiComando('insertUnorderedList')}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="Elenco Puntato"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => eseguiComando('insertOrderedList')}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="Elenco Numerato"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stili Tipografici Rapidi */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Stili:</span>
                  <button
                    onClick={() => applicaStileWord('p')}
                    className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer"
                  >
                    Normale
                  </button>
                  <button
                    onClick={() => applicaStileWord('h2')}
                    className="px-2 py-1 text-slate-900 hover:bg-slate-100 rounded text-[11px] font-bold font-serif cursor-pointer"
                  >
                    Titolo 2
                  </button>
                  <button
                    onClick={() => applicaStileWord('quote')}
                    className="px-2 py-1 text-blue-900 hover:bg-blue-50 rounded text-[11px] font-semibold italic cursor-pointer"
                  >
                    «Citazione»
                  </button>
                  <button
                    onClick={() => applicaStileWord('callout')}
                    className="px-2 py-1 text-emerald-900 hover:bg-emerald-50 rounded text-[11px] font-bold cursor-pointer"
                  >
                    Box Info
                  </button>
                </div>

                {/* Capolettera (Drop Cap) */}
                <button
                  onClick={() => setForm({ ...form, capolettera: !form.capolettera })}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    form.capolettera
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Attiva/disattiva la prima lettera gigante d'apertura"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Capolettera {form.capolettera ? 'ON' : 'OFF'}</span>
                </button>
              </>
            )}

            {/* TAB INSERISCI & MODULI DTP */}
            {tabRibbon === 'moduli' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={inserisciTabellaEventi}
                  className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 font-bold text-indigo-900 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Inserisci una tabella formattata per orari e programma eventi"
                >
                  <Table className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Tabella Programma/Date</span>
                </button>

                <button
                  onClick={inserisciBoxStatistiche}
                  className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Inserisci blocco a 3 cifre chiave (visitatori, volontari, dati)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Dati & Statistiche Chiave</span>
                </button>

                <button
                  onClick={inserisciBloccoQA}
                  className="px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 font-bold text-sky-900 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Inserisci blocco Domanda & Risposta per interviste"
                >
                  <Quote className="w-3.5 h-3.5 text-sky-600" />
                  <span>+ Blocco Intervista (Q&A)</span>
                </button>

                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 px-1">Box Avviso:</span>
                  <button
                    onClick={() => inserisciBoxAvviso('info')}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-semibold text-[11px] cursor-pointer"
                  >
                    Info
                  </button>
                  <button
                    onClick={() => inserisciBoxAvviso('success')}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px] cursor-pointer"
                  >
                    Successo
                  </button>
                  <button
                    onClick={() => inserisciBoxAvviso('alert')}
                    className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px] cursor-pointer"
                  >
                    Allerta
                  </button>
                </div>

                <button
                  onClick={inserisciSeparatoreStelle}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Separatore tipografico elegante a tre stelle"
                >
                  <span>✦ ✦ ✦ Separatore</span>
                </button>

                <button
                  onClick={inserisciSeparatore}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Linea (HR)</span>
                </button>

                {/* Simboli Tipografici */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold px-1">Simboli:</span>
                  {['•', '—', '«', '»', '★', '☞', '✦', '📍', '🕒', '📞', '💶', '©'].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => inserisciSimbolo(s)}
                      className="px-1.5 py-0.5 hover:bg-slate-100 rounded font-bold text-slate-800 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB MODELLI DI ARTICOLO PREDEFINITI */}
            {tabRibbon === 'templates' && (
              <div className="flex items-center gap-2 overflow-x-auto py-0.5 w-full">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                  Applica con 1 clic:
                </span>
                {MODELLI_PREDEFINITI.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => caricaModello(mod)}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 rounded-xl transition text-left shrink-0 shadow-2xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-indigo-900 text-xs flex items-center gap-1">
                      <LayoutTemplate className="w-3 h-3 text-indigo-600" />
                      <span>{mod.nome}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[170px]">
                      {mod.descrizione}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB PAGINAZIONE, STILE BOX & INGOMBRO */}
            {tabRibbon === 'layout' && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-between">
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Assegnazione Pagina nel Fascicolo */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">Colloca a Pagina:</span>
                    <select
                      id="select-pagina-articolo-word"
                      value={form.pagina}
                      onChange={(e) => setForm({ ...form, pagina: parseInt(e.target.value, 10) || 1 })}
                      className="bg-indigo-50 text-indigo-900 font-black text-xs px-2 py-0.5 rounded-lg border border-indigo-300 cursor-pointer focus:outline-none"
                    >
                      {Array.from({ length: Math.max(totalePagine, 4) }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p}>
                          Pagina {p} {p === 1 ? '(Copertina)' : p === totalePagine ? '(Retro)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Disposizione Colonne */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium text-[11px] px-1">Colonne:</span>
                    {(['singola', 'doppia', 'intera'] as const).map((col) => (
                      <button
                        key={col}
                        onClick={() => setForm({ ...form, colonna: col })}
                        className={`px-2 py-0.5 rounded text-xs font-semibold capitalize cursor-pointer ${
                          form.colonna === col ? 'bg-indigo-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {col === 'singola' ? '1 Colonna' : col === 'doppia' ? '2 Colonne' : 'Piena'}
                      </button>
                    ))}
                  </div>

                  {/* Stile Cornice / Box */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium text-[11px] px-1">Stile Box:</span>
                    <select
                      value={form.stileBox || 'trasparente'}
                      onChange={(e) => setForm({ ...form, stileBox: e.target.value as any })}
                      className="text-xs font-bold text-slate-800 bg-transparent cursor-pointer focus:outline-none"
                    >
                      <option value="trasparente">Trasparente (Standard)</option>
                      <option value="cornice_classica">Cornice Filetto Classico</option>
                      <option value="sfondo_pergamena">Pergamena Tenue</option>
                      <option value="bordo_blu">Bordo Blu UNPLI</option>
                      <option value="evidenza_scuro">In Evidenza Fondo Scuro</option>
                    </select>
                  </div>

                  {/* Articolo in Evidenza */}
                  <button
                    onClick={() => setForm({ ...form, inEvidenza: !form.inEvidenza })}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      form.inEvidenza
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${form.inEvidenza ? 'fill-amber-500 text-amber-600' : 'text-slate-400'}`} />
                    <span>{form.inEvidenza ? '★ In Copertina' : 'Standard'}</span>
                  </button>
                </div>

                {/* Strumenti Pulizia */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={pulisciFormattazione}
                    className="px-2 py-1 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Normalizza spazi e pulisci codice HTML sporco da copia-incolla"
                  >
                    <Scissors className="w-3 h-3 text-slate-500" />
                    <span>Pulisci Formattazione</span>
                  </button>
                  <button
                    onClick={applicaVirgoletteCaporali}
                    className="px-2 py-1 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Converti virgolette dritte in virgolette tipografiche « »"
                  >
                    <span>« » Virgolette Caporali</span>
                  </button>
                </div>

              </div>
            )}

            {/* TAB FOTO & POSIZIONAMENTO */}
            {tabRibbon === 'foto' && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold text-xs">Posizione Foto:</span>
                  {(['sopra', 'sinistra', 'destra', 'sotto'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => setForm({ ...form, fotoPosizione: pos })}
                      className={`px-2 py-1 rounded text-xs font-bold capitalize cursor-pointer ${
                        (form.fotoPosizione || 'sopra') === pos
                          ? 'bg-indigo-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pos === 'sopra' ? 'In Cima' : pos === 'sinistra' ? 'A Sinistra' : pos === 'destra' ? 'A Destra' : 'In Basso'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.fotoAutore || ''}
                    onChange={(e) => setForm({ ...form, fotoAutore: e.target.value })}
                    placeholder="Autore foto (es. Foto Archivio Pro Loco)..."
                    className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-52"
                  />
                  <button
                    onClick={() => setMostraGalleriaFoto(!mostraGalleriaFoto)}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                  >
                    {mostraGalleriaFoto ? 'Chiudi Preset' : 'Sfoglia Foto Pro Loco'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* 3. RIGHELLO GRADUATO WORD (RULER IN CM) */}
          <div className="bg-slate-200/90 border-t border-slate-300 h-4 flex items-center px-8 relative overflow-hidden select-none">
            <div className="w-full flex items-center justify-between text-[8px] font-mono text-slate-500">
              {Array.from({ length: 22 }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-px ${i % 5 === 0 ? 'h-2 bg-slate-600' : 'h-1 bg-slate-400'}`} />
                  {i % 2 === 0 && <span>{i} cm</span>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 4. AREA DI SCRITTURA (FOGLIO WORD / NOTIZIARIO SU TAVOLO DI LAVORO) */}
        <div className="flex-1 overflow-y-auto bg-slate-300/60 p-4 sm:p-8 flex justify-center">
          
          <div className={`bg-white text-slate-900 w-full max-w-3xl min-h-[750px] shadow-2xl border p-8 sm:p-12 rounded-sm flex flex-col justify-between my-2 relative transition-all ${
            form.stileBox === 'cornice_classica' ? 'border-2 border-slate-800 ring-4 ring-slate-100' :
            form.stileBox === 'sfondo_pergamena' ? 'bg-amber-50/40 border-amber-200' :
            form.stileBox === 'bordo_blu' ? 'border-2 border-blue-800 ring-2 ring-blue-100' :
            form.stileBox === 'evidenza_scuro' ? 'bg-slate-900 text-white border-slate-700' :
            'border-slate-300/80'
          }`}>
            
            {/* Margine superiore visivo foglio */}
            <div className="space-y-4">
              
              {/* Metadati Testata Articolo: Sezione, Pagina, Data, Autore */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <select
                    value={form.sezione}
                    onChange={(e) => setForm({ ...form, sezione: e.target.value as CategoriaArticoloGiornalino })}
                    className="text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300 cursor-pointer"
                  >
                    <option value="editoriale">L'Editoriale del Presidente</option>
                    <option value="primo_piano">Primo Piano / Notizia Principale</option>
                    <option value="eventi">Eventi & Manifestazioni</option>
                    <option value="vita_associativa">Vita Associativa & Soci</option>
                    <option value="storia_cultura">Storia, Tradizioni & Territorio</option>
                    <option value="rubrica">Rubrica Cittadina</option>
                  </select>

                  <span className="text-slate-300">|</span>

                  <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Fascicolo: Pagina {form.pagina}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="text"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    placeholder="Mese Anno"
                    className="w-28 text-right font-medium text-slate-600 bg-transparent hover:bg-slate-50 px-1 py-0.5 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent hover:border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* OCCHIELLO / KICKER GIORNALISTICO */}
              <div>
                <input
                  type="text"
                  value={form.occhiello || ''}
                  onChange={(e) => setForm({ ...form, occhiello: e.target.value })}
                  placeholder="OCCHIELLO GIORNALISTICO (ES. TRADIZIONI E TERRITORIO)..."
                  className="w-full text-xs font-black uppercase tracking-widest text-indigo-800 placeholder-slate-300 focus:outline-none border-b border-dotted border-slate-200 pb-0.5"
                />
              </div>

              {/* TITOLO PRINCIPALE */}
              <div>
                <input
                  id="input-titolo-word"
                  type="text"
                  value={form.titolo}
                  onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  placeholder="Digita qui il Titolo dell'Articolo..."
                  style={{ fontFamily: getFontFamilyCss(form.fontFamiglia) }}
                  className="w-full font-black text-slate-950 placeholder-slate-300 focus:outline-none tracking-tight leading-tight text-2xl sm:text-3xl"
                />
              </div>

              {/* SOTTOTITOLO / CATENACCIO */}
              <div>
                <input
                  type="text"
                  value={form.sottotitolo || ''}
                  onChange={(e) => setForm({ ...form, sottotitolo: e.target.value })}
                  placeholder="Aggiungi catenaccio o sottotitolo esplicativo (opzionale)..."
                  className="w-full text-xs sm:text-sm font-medium text-slate-600 italic placeholder-slate-300 focus:outline-none border-b border-dashed border-slate-200 pb-1"
                />
              </div>

              {/* FIRMA / AUTORE */}
              <div className="flex items-center justify-between text-xs text-slate-600 font-serif italic pb-2">
                <div className="flex items-center gap-1.5">
                  <span>Articolo a cura di:</span>
                  <input
                    type="text"
                    value={form.autore}
                    onChange={(e) => setForm({ ...form, autore: e.target.value })}
                    placeholder="Nome Autore / Redazione"
                    className="font-bold text-slate-900 not-italic bg-transparent hover:bg-slate-50 px-1.5 py-0.5 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 border border-transparent hover:border-slate-200 text-xs"
                  />
                </div>
                {form.inEvidenza && (
                  <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ★ Notizia in Copertina
                  </span>
                )}
              </div>

              {/* GALLERIA PRESET FOTO & GESTIONE FOTOGRAFIA */}
              {(form.immagine || mostraGalleriaFoto) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 my-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Fotografia del Notiziario</span>
                    </div>
                    {form.immagine && (
                      <button
                        onClick={() => setForm({ ...form, immagine: undefined, didascaliaImmagine: undefined })}
                        className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Rimuovi Foto
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={form.immagine || ''}
                    onChange={(e) => setForm({ ...form, immagine: e.target.value })}
                    placeholder="Incolla URL immagine (https://...)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />

                  {/* Preset Foto per Pro Loco */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Preset rapidi:</span>
                    {PRESET_IMMAGINI.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setForm({ ...form, immagine: p.url })}
                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-600 rounded text-[10px] font-medium cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {form.immagine && (
                    <div className="space-y-1.5 pt-1">
                      <img
                        src={form.immagine}
                        alt="Anteprima"
                        className="w-full h-44 object-cover rounded-lg border border-slate-200 shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={form.didascaliaImmagine || ''}
                          onChange={(e) => setForm({ ...form, didascaliaImmagine: e.target.value })}
                          placeholder="Didascalia della foto (es. I volontari durante la festa)..."
                          className="text-[11px] text-slate-500 italic bg-transparent border-b border-slate-200 px-1 py-0.5 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={form.fotoAutore || ''}
                          onChange={(e) => setForm({ ...form, fotoAutore: e.target.value })}
                          placeholder="Autore dello scatto..."
                          className="text-[11px] text-slate-500 bg-transparent border-b border-slate-200 px-1 py-0.5 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CORPO ARTICOLO - AREA DI SCRITTURA WYSIWYG STILE WORD */}
              <div className="pt-2">
                <div
                  ref={editorRef}
                  id="word-contenteditable-body"
                  contentEditable
                  onInput={sincronizzaContenuto}
                  onBlur={sincronizzaContenuto}
                  style={{
                    textAlign: form.allineamento,
                    lineHeight: '1.75',
                    fontFamily: getFontFamilyCss(form.fontFamiglia)
                  }}
                  className={`min-h-[400px] p-2 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded text-slate-800 text-sm leading-relaxed transition ${
                    form.capolettera ? 'first-letter:float-left first-letter:text-5xl first-letter:pr-3 first-letter:font-black first-letter:text-slate-900 first-letter:leading-none' : ''
                  }`}
                  placeholder="Componi qui l'articolo come in Microsoft Word..."
                />
              </div>

            </div>

            {/* Piè di pagina foglio Word */}
            <div className="pt-8 border-t border-slate-200 mt-6 flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
              <span>La Voce della Pro Loco • Notiziario Periodico</span>
              <span>— Pagina {form.pagina} —</span>
            </div>

          </div>

        </div>

        {/* 5. BARRA DI STATO INFERIORE (Stile Microsoft Word con Ingombro Editoriale) */}
        <div className="bg-[#185abd] text-white px-4 py-2 flex flex-wrap items-center justify-between text-[11px] select-none shrink-0 font-medium">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Pagina {form.pagina} di {totalePagine}</span>
            </span>
            <span>•</span>
            <span>{conteggioParole} parole</span>
            <span>•</span>
            <span>{conteggioCaratteri} caratteri</span>
            <span>•</span>
            <span className="hidden sm:inline">~{tempoLetturaMinuti} min lettura</span>
            <span>•</span>
            <span className="hidden md:inline">~{righeStimateDoppia} righe a 2 col.</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicatore visivo ingombro pagina A4 */}
            <div className="flex items-center gap-1.5">
              <span className="text-blue-100 text-[10.5px]">Ingombro A4:</span>
              <div className="w-16 h-2 bg-blue-950/60 rounded-full overflow-hidden border border-blue-400/40">
                <div 
                  className={`h-full transition-all ${
                    percentualeOccupazionePagina > 90 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${percentualeOccupazionePagina}%` }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold">{percentualeOccupazionePagina}%</span>
            </div>

            <span className="text-blue-200 text-[10px] hidden lg:inline">
              Allin: <strong className="text-white capitalize">{form.allineamento}</strong> • Col: <strong className="text-white capitalize">{form.colonna}</strong>
            </span>
            <span className="bg-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
              Word DTP 100%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
