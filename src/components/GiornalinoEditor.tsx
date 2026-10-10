import React, { useState, useEffect } from 'react';
import { 
  GiornalinoConfig, 
  EdizioneGiornalino,
  StatoUscitaGiornalino,
  ArticoloGiornalino, 
  ProLocoInfo, 
  ProLocoEvento, 
  CategoriaArticoloGiornalino, 
  SponsorInserzionista
} from '../types';
import {
  loadArchivioGiornalini,
  saveArchivioGiornalini,
  saveGiornalinoAttivoId,
  saveGiornalinoConfig,
  eliminaEdizioneGiornalino,
  normalizzaEdizioneGiornalinoCompat
} from '../storage';
import { 
  Newspaper, 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Printer, 
  Plus, 
  PlusCircle,
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Eye, 
  Calendar, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  BookOpen,
  Send,
  X,
  Sliders,
  ExternalLink,
  Copy,
  Columns,
  Shuffle,
  LayoutGrid,
  Move,
  Store,
  PenTool,
  Maximize2,
  Minimize2,
  Table,
  FileSpreadsheet,
  ArrowUpDown,
  Wand2,
  RotateCcw,
  Archive
} from 'lucide-react';
import { GiornalinoHeaderEditor } from './GiornalinoHeaderEditor';
import { GiornalinoStudioEditor } from './GiornalinoStudioEditor';
import { GiornalinoPrintModal } from './GiornalinoPrintModal';
import { WordStyleEditorModal } from './WordStyleEditorModal';

interface GiornalinoEditorProps {
  config: ProLocoInfo;
  giornalino?: GiornalinoConfig;
  giornalinoConfig?: GiornalinoConfig;
  eventi: ProLocoEvento[];
  onSalva: (nuovoGiornalino: GiornalinoConfig) => void;
  onTornaDashboard: () => void;
  tabIniziale?: 'studio' | 'articoli' | 'sponsor' | 'paginazione' | 'testata' | 'anteprima';
  onVaiAllArchivio?: () => void;
  archivioGiornalini?: EdizioneGiornalino[];
  giornalinoAttivoId?: string;
  onUpdateArchivioGiornalini?: (nuovoArchivio: EdizioneGiornalino[], nuovoAttivoId?: string) => void;
  onEliminaEdizioneGiornalino?: (edizioneId: string) => void;
}

const PRESET_IMMAGINI = [
  { label: 'Borgo Medievale & Centro Storico', url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Festa di Paese & Enogastronomia', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Sentiero Naturalistico & Colline', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Musica & Concerto in Piazza', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Mercatino Artigianale & Prodotti Tipici', url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop&q=80' },
];

export const GiornalinoEditor: React.FC<GiornalinoEditorProps> = ({
  config,
  giornalino,
  giornalinoConfig,
  eventi,
  onSalva,
  onTornaDashboard,
  tabIniziale = 'articoli',
  onVaiAllArchivio,
  archivioGiornalini: propArchivioGiornalini,
  giornalinoAttivoId: propGiornalinoAttivoId,
  onUpdateArchivioGiornalini,
  onEliminaEdizioneGiornalino
}) => {
  const sorgente = giornalino || giornalinoConfig || {
    testata: 'La Voce della Pro Loco',
    sottotitoloTestata: 'Periodico Ufficiale',
    motto: '',
    numeroEdizione: 'Anno 2025 - N. 1',
    periodo: 'Edizione Autunno',
    dataPubblicazione: 'Ottobre 2025',
    direttoreResponsabile: config.nomePresidente,
    redazione: 'Consiglio Direttivo',
    tiratura: '1.000 copie',
    sedeStampa: 'Tipografia',
    articoli: []
  };

  const [form, setForm] = useState<GiornalinoConfig>({
    ...sorgente
  });

  // Sincronizza il form quando cambia il giornalino selezionato (es. dall'archivio)
  useEffect(() => {
    const nuovaSorgente = giornalino || giornalinoConfig;
    if (nuovaSorgente) {
      setForm(nuovaSorgente);
    }
  }, [giornalino, giornalinoConfig, propGiornalinoAttivoId]);

  const [tab, setTab] = useState<'studio' | 'articoli' | 'sponsor' | 'paginazione' | 'testata' | 'anteprima'>(tabIniziale || 'studio');
  const [articoloInModifica, setArticoloInModifica] = useState<ArticoloGiornalino | null>(null);
  const [mostraModaleArticolo, setMostraModaleArticolo] = useState(false);
  const [mostraStampaModal, setMostraStampaModal] = useState(false);
  const [messaggioSalvataggio, setMessaggioSalvataggio] = useState(false);
  const [messaggioAzioneExtra, setMessaggioAzioneExtra] = useState<string | null>(null);
  const [schermoIntero, setSchermoIntero] = useState(false);
  const [sponsorFiltroPagina, setSponsorFiltroPagina] = useState<number | 'tutte'>('tutte');
  const [mostraModaleSponsor, setMostraModaleSponsor] = useState(false);
  const [sponsorInModifica, setSponsorInModifica] = useState<SponsorInserzionista | null>(null);
  const [mostraTabellaMenabo, setMostraTabellaMenabo] = useState(false);

  // Stato Modali Nuovo Giornalino ed Elimina Giornalino
  const [mostraModalNuovoGiornalino, setMostraModalNuovoGiornalino] = useState(false);
  const [mostraModalEliminaGiornalino, setMostraModalEliminaGiornalino] = useState(false);
  const [nuovoNumeroEdizione, setNuovoNumeroEdizione] = useState<number>(2);
  const [nuovoAnnoEdizione, setNuovoAnnoEdizione] = useState<number>(new Date().getFullYear());
  const [nuovaPeriodicita, setNuovaPeriodicita] = useState<'Mensile' | 'Bimestrale' | 'Trimestrale' | 'Semestrale' | 'Annuale' | 'Edizione Straordinaria'>('Mensile');
  const [nuovaDataUscita, setNuovaDataUscita] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [nuovoMeseAnnoLabel, setNuovoMeseAnnoLabel] = useState<string>(() => {
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const d = new Date();
    return `${mesi[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [nuoveNoteRedazione, setNuoveNoteRedazione] = useState<string>('');
  const [nuovaModalitaContenuto, setNuovaModalitaContenuto] = useState<'solo_testata' | 'duplica_tutto' | 'editoriale_iniziale'>('solo_testata');

  const totalePagine = form.totalePagine || 4;

  const handleSalva = () => {
    onSalva(form);
    setMessaggioSalvataggio(true);
    setTimeout(() => setMessaggioSalvataggio(false), 3000);
  };

  const handleApriModalNuovoGiornalino = () => {
    const archivioCorrente = propArchivioGiornalini && propArchivioGiornalini.length > 0
      ? propArchivioGiornalini
      : loadArchivioGiornalini();
    const annoOggi = new Date().getFullYear();
    const edizioniAnno = archivioCorrente.filter(e => Number(e.anno) === annoOggi);
    const prossimoNum = edizioniAnno.length + 1;

    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const oggi = new Date();
    setNuovoAnnoEdizione(annoOggi);
    setNuovoNumeroEdizione(prossimoNum);
    setNuovaPeriodicita('Mensile');
    setNuovaDataUscita(oggi.toISOString().split('T')[0]);
    setNuovoMeseAnnoLabel(`${mesi[oggi.getMonth()]} ${annoOggi}`);
    setNuoveNoteRedazione(`Uscita N.${prossimoNum}/${annoOggi}`);
    setNuovaModalitaContenuto('solo_testata');
    setMostraModalNuovoGiornalino(true);
  };

  const handleConfermaNuovoGiornalino = (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Salva prima eventuali modifiche sul giornalino corrente
    onSalva(form);

    const archivioCorrente = (propArchivioGiornalini && propArchivioGiornalini.length > 0
      ? propArchivioGiornalini
      : loadArchivioGiornalini()
    ).map((ed, idx) => {
      const norm = normalizzaEdizioneGiornalinoCompat(ed, idx);
      const idCorr = propGiornalinoAttivoId || form.id;
      if (idCorr && norm.id === idCorr) {
        return normalizzaEdizioneGiornalinoCompat({ ...norm, ...form, id: norm.id }, idx);
      }
      return norm;
    });

    const dataLabel = (nuovoMeseAnnoLabel || '').trim() || new Date(nuovaDataUscita || Date.now()).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    const nuovoId = `giornalino-${nuovoAnnoEdizione}-${Date.now().toString().slice(-4)}`;
    const oggiIso = new Date().toISOString().split('T')[0];

    let nuoviArticoli: ArticoloGiornalino[] = [];
    if (nuovaModalitaContenuto === 'duplica_tutto') {
      nuoviArticoli = (form.articoli || []).map((art, i) => ({
        ...art,
        id: `art-${Date.now()}-${i}`
      }));
    } else if (nuovaModalitaContenuto === 'editoriale_iniziale') {
      nuoviArticoli = [
        {
          id: `art-${Date.now()}-1`,
          titolo: `Benvenuti nel N. ${nuovoNumeroEdizione} del Giornalino`,
          sottotitolo: `Nuova uscita di ${dataLabel} della ${config.nome}`,
          occhiello: 'EDITORIALE DEL PRESIDENTE',
          sezione: 'editoriale',
          autore: config.nomePresidente || 'Il Presidente',
          data: dataLabel,
          pagina: 1,
          ordine: 1,
          colonna: 'doppia',
          allineamento: 'justify',
          capolettera: true,
          inEvidenza: true,
          contenuto: `Cari Soci e concittadini,\n\nsiamo lieti di presentarvi il nuovo numero (N. ${nuovoNumeroEdizione} - Anno ${nuovoAnnoEdizione}) del nostro periodico associativo.`
        }
      ];
    }

    const nuovaEdizione: EdizioneGiornalino = normalizzaEdizioneGiornalinoCompat({
      ...form,
      id: nuovoId,
      anno: Number(nuovoAnnoEdizione) || new Date().getFullYear(),
      dataUscita: nuovaDataUscita || oggiIso,
      numeroEdizione: `Anno ${nuovoAnnoEdizione} - N. ${nuovoNumeroEdizione}`,
      periodo: `Edizione ${nuovaPeriodicita}`,
      dataPubblicazione: dataLabel,
      statoUscita: 'bozza' as StatoUscitaGiornalino,
      noteRedazione: nuoveNoteRedazione.trim() || `Edizione N. ${nuovoNumeroEdizione}/${nuovoAnnoEdizione} (${dataLabel})`,
      protocolloStampa: `REG-${nuovoAnnoEdizione}/${String(archivioCorrente.length + 1).padStart(2, '0')}-STAMPA`,
      dataCreazione: oggiIso,
      dataUltimaModifica: oggiIso,
      articoli: nuoviArticoli,
      sponsor: [...(form.sponsor || [])]
    }, 0);

    const nuovoArchivio = [nuovaEdizione, ...archivioCorrente];
    saveArchivioGiornalini(nuovoArchivio);
    saveGiornalinoAttivoId(nuovoId);
    saveGiornalinoConfig(nuovaEdizione);

    setForm(nuovaEdizione);
    if (onUpdateArchivioGiornalini) {
      onUpdateArchivioGiornalini(nuovoArchivio, nuovoId);
    }
    onSalva(nuovaEdizione);

    setMostraModalNuovoGiornalino(false);
    setMessaggioAzioneExtra(`Nuovo Giornalino N.${nuovoNumeroEdizione}/${nuovoAnnoEdizione} creato e registrato in Archivio Edizioni!`);
    setTimeout(() => setMessaggioAzioneExtra(null), 4000);
  };

  const handleConfermaEliminaGiornalino = () => {
    const archivioCorrente = propArchivioGiornalini && propArchivioGiornalini.length > 0
      ? propArchivioGiornalini
      : loadArchivioGiornalini();
    const targetId = propGiornalinoAttivoId || form.id || archivioCorrente[0]?.id;
    if (!targetId) {
      setMostraModalEliminaGiornalino(false);
      return;
    }

    if (onEliminaEdizioneGiornalino) {
      onEliminaEdizioneGiornalino(targetId);
    } else {
      const res = eliminaEdizioneGiornalino(targetId);
      setForm(res.nuovaAttiva);
      if (onUpdateArchivioGiornalini) {
        onUpdateArchivioGiornalini(res.nuovoArchivio, res.nuovaAttiva.id);
      }
      onSalva(res.nuovaAttiva);
    }

    setMostraModalEliminaGiornalino(false);
    setMessaggioAzioneExtra('Giornalino eliminato dall\'Archivio e aggiornato su APK!');
    setTimeout(() => setMessaggioAzioneExtra(null), 4000);
  };

  const handleSalvaSponsor = (sp: SponsorInserzionista) => {
    const esistenti = form.sponsor || [];
    const index = esistenti.findIndex(s => s.id === sp.id);
    let nuovaLista: SponsorInserzionista[];
    if (index >= 0) {
      nuovaLista = esistenti.map(s => s.id === sp.id ? sp : s);
    } else {
      nuovaLista = [...esistenti, sp];
    }
    const aggiornato = { ...form, sponsor: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
    setMostraModaleSponsor(false);
    setSponsorInModifica(null);
  };

  const handleEliminaSponsor = (id: string) => {
    if (!confirm('Rimuovere questo sponsor inserzionista dal giornalino?')) return;
    const nuovaLista = (form.sponsor || []).filter(s => s.id !== id);
    const aggiornato = { ...form, sponsor: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Spostamento di un articolo da una pagina a un'altra all'interno del fascicolo
  const handleSpostaArticoloDiPagina = (articoloId: string, nuovaPagina: number) => {
    const pag = Math.max(1, Math.min(totalePagine, nuovaPagina));
    const nuovaLista = form.articoli.map(a => {
      if (a.id === articoloId) {
        return { ...a, pagina: pag };
      }
      return a;
    });
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Spostamento ordine all'interno della stessa pagina
  const handleSpostaArticoloNellaPagina = (articoloId: string, direzione: 'su' | 'giu') => {
    const art = form.articoli.find(a => a.id === articoloId);
    if (!art) return;
    const pag = art.pagina || 1;
    const articoliDellaPagina = form.articoli.filter(a => (a.pagina || 1) === pag);
    const posInPagina = articoliDellaPagina.findIndex(a => a.id === articoloId);
    const targetPos = direzione === 'su' ? posInPagina - 1 : posInPagina + 1;
    if (targetPos < 0 || targetPos >= articoliDellaPagina.length) return;

    const altroArt = articoliDellaPagina[targetPos];
    const idx1 = form.articoli.findIndex(a => a.id === articoloId);
    const idx2 = form.articoli.findIndex(a => a.id === altroArt.id);

    const nuovaLista = [...form.articoli];
    const temp = nuovaLista[idx1];
    nuovaLista[idx1] = nuovaLista[idx2];
    nuovaLista[idx2] = temp;

    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Imposta formato standard di stampa fascicolo (quartini e sedicesimi tipografici)
  const handleImpostaFascicoloStandard = (nuovoTotale: number) => {
    // Se ci sono articoli assegnati a pagine oltre il nuovo totale, li spostiamo nell'ultima pagina
    const nuovaLista = form.articoli.map(a => {
      const pag = a.pagina || 1;
      if (pag > nuovoTotale) {
        return { ...a, pagina: nuovoTotale };
      }
      return a;
    });
    const aggiornato = { ...form, totalePagine: nuovoTotale, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Scambia l'intera pagina A con la pagina B (tutti gli articoli invertono la pagina)
  const handleScambiaPagine = (pagA: number, pagB: number) => {
    if (pagA < 1 || pagB < 1 || pagA > totalePagine || pagB > totalePagine || pagA === pagB) return;
    const nuovaLista = form.articoli.map(art => {
      const p = art.pagina || 1;
      if (p === pagA) return { ...art, pagina: pagB };
      if (p === pagB) return { ...art, pagina: pagA };
      return art;
    });
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Duplica una pagina: clona tutti gli articoli di quella pagina con nuovi ID
  const handleDuplicaPagina = (pagNumero: number) => {
    const articoliDaClonare = form.articoli.filter(a => (a.pagina || 1) === pagNumero);
    if (articoliDaClonare.length === 0) {
      alert(`La Pagina ${pagNumero} non ha articoli da duplicare.`);
      return;
    }
    const nuovaTotale = totalePagine + 1;
    const cloni: ArticoloGiornalino[] = articoliDaClonare.map((a, idx) => ({
      ...a,
      id: `art-${Date.now()}-${idx}`,
      titolo: `${a.titolo} (Copia)`,
      pagina: nuovaTotale
    }));
    const nuovaLista = [...form.articoli, ...cloni];
    const aggiornato = { ...form, totalePagine: nuovaTotale, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Svuota una pagina: sposta tutti i suoi articoli a Pagina 1
  const handleSvuotaPagina = (pagNumero: number) => {
    const articoli = form.articoli.filter(a => (a.pagina || 1) === pagNumero);
    if (articoli.length === 0) return;
    if (!confirm(`Vuoi svuotare la Pagina ${pagNumero}? I suoi ${articoli.length} articolo/i verranno spostati a Pagina 1.`)) return;
    const nuovaLista = form.articoli.map(a => {
      if ((a.pagina || 1) === pagNumero) {
        return { ...a, pagina: 1 };
      }
      return a;
    });
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Elimina una pagina specifica: scala tutti gli articoli delle pagine successive di 1
  const handleEliminaPagina = (pagNumero: number) => {
    if (totalePagine <= 2) {
      alert('Il fascicolo deve avere almeno 2 pagine (fronte e retro).');
      return;
    }
    const articoliInPag = form.articoli.filter(a => (a.pagina || 1) === pagNumero);
    if (articoliInPag.length > 0) {
      if (!confirm(`La Pagina ${pagNumero} contiene ${articoliInPag.length} articolo/i. Se la elimini, questi articoli verranno spostati alla pagina precedente. Continuare?`)) {
        return;
      }
    }
    const nuovaLista = form.articoli.map(a => {
      const p = a.pagina || 1;
      if (p === pagNumero) {
        return { ...a, pagina: Math.max(1, pagNumero - 1) };
      }
      if (p > pagNumero) {
        return { ...a, pagina: p - 1 };
      }
      return a;
    });
    const aggiornato = { ...form, totalePagine: totalePagine - 1, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Applica un template rapido a una pagina specifica
  const handleApplicaTemplatePagina = (pagNumero: number, tipo: 'copertina' | 'due_colonne' | 'tre_colonne' | 'eventi' | 'retro_sponsor') => {
    const esistentiInPag = form.articoli.filter(a => (a.pagina || 1) === pagNumero);
    if (esistentiInPag.length > 0) {
      if (!confirm(`La Pagina ${pagNumero} ha già articoli. Vuoi aggiungere la struttura del template a quelli esistenti?`)) {
        return;
      }
    }

    let nuoviArt: ArticoloGiornalino[] = [];
    const timestamp = Date.now();

    if (tipo === 'copertina') {
      nuoviArt = [
        {
          id: `art-copertina-${timestamp}`,
          titolo: 'Edizione Speciale: Insieme per la Comunità',
          sottotitolo: 'Tutti gli eventi, le storie e i progetti del nostro paese.',
          occhiello: 'IN PRIMO PIANO',
          sezione: 'primo_piano',
          autore: 'Comitato di Redazione',
          data: form.dataPubblicazione || 'Autunno 2025',
          pagina: pagNumero,
          colonna: 'intera',
          allineamento: 'justify',
          capolettera: true,
          inEvidenza: true,
          stileBox: 'cornice_classica',
          immagine: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
          didascaliaImmagine: 'Scorcio del borgo illuminato per le manifestazioni storiche.',
          contenuto: '<p class="mb-3">Con questa nuova edizione del nostro notiziario vogliamo raccontare l\'impegno quotidiano che anima ogni angolo della nostra comunità.</p><p class="mb-3">All\'interno troverete le cronache delle feste, il bilancio delle attività sociali e il calendario dettagliato di tutti i prossimi appuntamenti.</p>'
        }
      ];
    } else if (tipo === 'due_colonne') {
      nuoviArt = [
        {
          id: `art-col1-${timestamp}`,
          titolo: 'Le Attività Culturali e le Visite Guidate',
          sottotitolo: 'Riscopriamo la bellezza dei monumenti storici con i nostri volontari.',
          sezione: 'storia_cultura',
          autore: 'Gruppo Cultura Pro Loco',
          data: form.dataPubblicazione || 'Autunno 2025',
          pagina: pagNumero,
          colonna: 'singola',
          allineamento: 'justify',
          capolettera: true,
          contenuto: '<p class="mb-3">Il patrimonio storico del nostro paese è una ricchezza da tramandare alle nuove generazioni con orgoglio e dedizione.</p>'
        },
        {
          id: `art-col2-${timestamp + 1}`,
          titolo: 'Progetti Ambientali: Cura dei Sentieri',
          sottotitolo: 'Ripuliti e segnalati dieci chilometri di percorsi naturalistici nel verde.',
          sezione: 'vita_associativa',
          autore: 'Squadra Manutenzione Sentieri',
          data: form.dataPubblicazione || 'Autunno 2025',
          pagina: pagNumero,
          colonna: 'singola',
          allineamento: 'justify',
          capolettera: true,
          contenuto: '<p class="mb-3">Grazie al lavoro delle squadre di volontariato abbiamo reso nuovamente fruibili i percorsi pedonali storici tra boschi e sorgenti.</p>'
        }
      ];
    } else if (tipo === 'eventi') {
      nuoviArt = [
        {
          id: `art-eventi-${timestamp}`,
          titolo: 'Il Programma Completo delle Feste e Sagre',
          sottotitolo: 'Orari, luoghi, degustazioni tipiche e spettacoli in piazza per tutti.',
          occhiello: 'AGENDA CITTADINA',
          sezione: 'eventi',
          autore: 'Segreteria Organizzativa',
          data: form.dataPubblicazione || 'Autunno 2025',
          pagina: pagNumero,
          colonna: 'intera',
          allineamento: 'left',
          stileBox: 'bordo_blu',
          contenuto: '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.9em;"><thead><tr style="background-color: #1e3a8a; color: white;"><th style="padding: 6px; border: 1px solid #cbd5e1;">Data</th><th style="padding: 6px; border: 1px solid #cbd5e1;">Ora</th><th style="padding: 6px; border: 1px solid #cbd5e1;">Luogo</th><th style="padding: 6px; border: 1px solid #cbd5e1;">Evento</th></tr></thead><tbody><tr style="background-color: #f8fafc;"><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Sabato 18 Ottobre</td><td style="padding: 6px; border: 1px solid #e2e8f0;">16:00</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Piazza Roma</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Apertura stand enogastronomici e artigianato</td></tr><tr><td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Domenica 19 Ottobre</td><td style="padding: 6px; border: 1px solid #e2e8f0;">10:30</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Centro Storico</td><td style="padding: 6px; border: 1px solid #e2e8f0;">Corteo storico e sfilata con costumi d\'epoca</td></tr></tbody></table>'
        }
      ];
    } else if (tipo === 'retro_sponsor') {
      nuoviArt = [
        {
          id: `art-retro-${timestamp}`,
          titolo: 'Colophon Redazionale & Ringraziamenti',
          sottotitolo: 'Notiziario periodico edito dalla Pro Loco - Distribuzione gratuita per i soci.',
          sezione: 'vita_associativa',
          autore: 'La Redazione',
          data: form.dataPubblicazione || 'Autunno 2025',
          pagina: pagNumero,
          colonna: 'intera',
          allineamento: 'center',
          stileBox: 'sfondo_pergamena',
          contenuto: '<p style="font-size: 0.9em; margin-bottom: 8px;"><strong>Direttore Responsabile:</strong> ' + (form.direttoreResponsabile || 'Presidente Pro Loco') + '<br/><strong>Comitato di Redazione:</strong> ' + (form.redazione || 'Consiglio Direttivo e Volontari') + '<br/><strong>Tiratura:</strong> ' + (form.tiratura || '1.200 copie') + ' • <strong>Stampa:</strong> ' + (form.sedeStampa || 'Tipografia Locale') + '</p><div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 0.85em; color: #475569;">Si ringraziano tutte le attività commerciali, artigiane e produttive che con il loro sostegno rendono possibile la pubblicazione di questo notiziario.</div>'
        }
      ];
    }

    const nuovaLista = [...form.articoli, ...nuoviArt];
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Aggiungi una nuova pagina al fascicolo
  const handleAggiungiPagina = () => {
    const nuovaTotale = totalePagine + 1;
    const aggiornato = { ...form, totalePagine: nuovaTotale };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Rimuovi l'ultima pagina vuota dal fascicolo
  const handleRimuoviUltimaPaginaVuota = () => {
    if (totalePagine <= 2) {
      alert('Il fascicolo deve avere almeno 2 pagine (fronte e retro).');
      return;
    }
    const articoliInUltimaPagina = form.articoli.filter(a => (a.pagina || 1) === totalePagine);
    if (articoliInUltimaPagina.length > 0) {
      alert(`La Pagina ${totalePagine} contiene ancora ${articoliInUltimaPagina.length} articolo/i. Spostali su altre pagine prima di rimuoverla.`);
      return;
    }
    const nuovaTotale = totalePagine - 1;
    const aggiornato = { ...form, totalePagine: nuovaTotale };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  // Distribuzione automatica equilibrata degli articoli su tutte le pagine
  const handleDistribuisciAutomaticamente = () => {
    const nuovaLista = form.articoli.map((art, idx) => ({
      ...art,
      pagina: (idx % totalePagine) + 1,
      ordine: Math.floor(idx / totalePagine) + 1
    }));
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  const handleSpostaArticolo = (index: number, direzione: 'su' | 'giu') => {
    const nuovaLista = [...form.articoli];
    const targetIndex = direzione === 'su' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nuovaLista.length) return;

    const temp = nuovaLista[index];
    nuovaLista[index] = nuovaLista[targetIndex];
    nuovaLista[targetIndex] = temp;

    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  const handleEliminaArticolo = (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo dal giornalino?')) return;
    const nuovaLista = form.articoli.filter(a => a.id !== id);
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
  };

  const apriNuovoArticolo = (paginaPredefinita: number = 1) => {
    setArticoloInModifica({
      id: `art-${Date.now()}`,
      titolo: '',
      sottotitolo: '',
      sezione: 'primo_piano',
      autore: `${config.nomePresidente}`,
      data: form.dataPubblicazione || 'Mese Corrente',
      contenuto: '',
      pagina: paginaPredefinita,
      ordine: 1,
      colonna: 'doppia',
      allineamento: 'justify',
      capolettera: true,
      immagine: '',
      didascaliaImmagine: '',
      inEvidenza: false
    });
    setMostraModaleArticolo(true);
  };

  const handleSalvaArticolo = (art: ArticoloGiornalino) => {
    let nuovaLista: ArticoloGiornalino[];
    const esiste = form.articoli.some(a => a.id === art.id);
    if (esiste) {
      nuovaLista = form.articoli.map(a => a.id === art.id ? art : a);
    } else {
      nuovaLista = [art, ...form.articoli];
    }
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
    setMostraModaleArticolo(false);
    setArticoloInModifica(null);
  };

  // Importazione veloce degli eventi della Pro Loco come articolo nel Giornalino
  const handleImportaEventiNelGiornalino = () => {
    if (eventi.length === 0) {
      alert('Nessun evento presente nel gestionale da importare.');
      return;
    }

    const testoEventi = eventi.map(e => {
      const dataFmt = new Date(e.dataInizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
      return `• ${e.titolo.toUpperCase()} (${dataFmt} - ${e.luogo}):\n${e.descrizione}`;
    }).join('\n\n');

    const nuovoArt: ArticoloGiornalino = {
      id: `art-eventi-${Date.now()}`,
      titolo: 'Le Feste e le Manifestazioni della Stagione: Il Calendario Completo',
      sottotitolo: 'Tutti gli appuntamenti imperdibili curati dai volontari della Pro Loco per residenti e visitatori',
      sezione: 'eventi',
      autore: 'Comitato Eventi & Sagre',
      data: form.dataPubblicazione,
      contenuto: `Ecco la programmazione ufficiale delle nostre manifestazioni per i prossimi mesi. Vi aspettiamo numerosi!\n\n${testoEventi}`,
      immagine: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      didascaliaImmagine: 'Momenti di festa e condivisione durante le nostre iniziative popolari.',
      inEvidenza: false
    };

    const nuovaLista = [...form.articoli, nuovoArt];
    const aggiornato = { ...form, articoli: nuovaLista };
    setForm(aggiornato);
    onSalva(aggiornato);
    alert('Articolo con il calendario eventi importato con successo nel giornalino!');
  };

  return (
    <div className={`bg-[#f8fafc] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-all ${
      schermoIntero 
        ? 'fixed inset-0 z-50 h-screen w-screen overflow-y-auto' 
        : 'min-h-screen'
    }`}>
      
      {/* HEADER DELLA PAGINA GIORNALINO (con tasto per tornare alla Dashboard) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className={schermoIntero ? 'w-full px-4 sm:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
            
            {/* Tasto Torna alla Dashboard & Titolo Modulo */}
            <div className="flex items-center gap-3">
              <button
                id="btn-torna-dashboard-da-giornalino"
                onClick={onTornaDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer"
                title="Ritorna alla schermata principale della Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {onVaiAllArchivio && (
                <button
                  id="btn-vai-archivio-da-giornalino"
                  onClick={onVaiAllArchivio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                  title="Accedi all'Archivio Dati per gestire tutte le uscite catalogate per anno e data"
                >
                  <Archive className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Archivio Uscite</span>
                </button>
              )}

              <div className="h-5 w-px bg-slate-300 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span>3.1 Editor Giornalino</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-indigo-800 font-serif italic text-sm">{form.testata}</span>
                  </h1>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span>{form.numeroEdizione} • {form.periodo} ({form.dataPubblicazione})</span>
                    {onVaiAllArchivio && (
                      <button
                        type="button"
                        onClick={onVaiAllArchivio}
                        className="text-indigo-700 font-bold hover:underline cursor-pointer"
                        title="Torna all'archivio per cambiare uscita o visualizzare le edizioni passate"
                      >
                        (Cambia Uscita)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni Rapide: Stampa A4 / PDF, Salva, Nuovo Giornalino ed Elimina Giornalino */}
            <div className="flex flex-wrap items-center gap-2">
              
              {messaggioSalvataggio && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Salvato!
                </span>
              )}

              {messaggioAzioneExtra && (
                <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {messaggioAzioneExtra}
                </span>
              )}

              <button
                id="btn-importa-eventi-giornalino"
                onClick={handleImportaEventiNelGiornalino}
                title="Importa gli eventi salvati nel gestionale all'interno del notiziario"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden md:inline">Importa Eventi dal Calendario</span>
                <span className="md:hidden">Importa Eventi</span>
              </button>

              <button
                id="btn-stampa-giornalino-modal"
                onClick={() => setMostraStampaModal(true)}
                title="Apri il formato di stampa editoriale A4 / PDF"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Stampa A4 / PDF</span>
              </button>

              <button
                id="btn-schermo-intero-giornalino"
                onClick={() => setSchermoIntero(!schermoIntero)}
                title={schermoIntero ? 'Esci da schermo intero' : 'Visualizza l\'editor a schermo intero'}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
              >
                {schermoIntero ? <Minimize2 className="w-4 h-4 text-indigo-700" /> : <Maximize2 className="w-4 h-4 text-indigo-700" />}
                <span className="hidden sm:inline">{schermoIntero ? 'Finestra' : 'Schermo Intero'}</span>
              </button>

              <button
                id="btn-salva-giornalino"
                onClick={handleSalva}
                title="Salva il giornalino corrente e sincronizza con l'Archivio Edizioni e l'APK"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salva</span>
              </button>

              <button
                id="btn-nuovo-giornalino-editor"
                type="button"
                onClick={handleApriModalNuovoGiornalino}
                title="Crea un nuovo giornalino che sarà subito rintracciabile nell'Archivio Edizioni e aggiornabile con l'APK"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuovo Giornalino</span>
              </button>

              <button
                id="btn-elimina-giornalino-editor"
                type="button"
                onClick={() => setMostraModalEliminaGiornalino(true)}
                title="Elimina questo giornalino dall'Archivio Edizioni e aggiorna l'APK"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Elimina Giornalino</span>
              </button>

            </div>

          </div>

          {/* Schede interne dell'Editor Giornalino */}
          <div className="flex items-center gap-1.5 border-t border-slate-200 pt-1 overflow-x-auto">
            <button
              id="tab-studio-editor"
              onClick={() => setTab('studio')}
              className={`px-3.5 py-2 text-xs font-black border-b-2 cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap ${
                tab === 'studio'
                  ? 'border-indigo-800 text-indigo-950 bg-indigo-50 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-indigo-700 hover:text-indigo-950 font-bold hover:bg-indigo-50/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Studio Editor (DTP & Menabò)</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-900 text-white font-mono">
                PRO
              </span>
            </button>
            <button
              id="tab-articoli-editor"
              onClick={() => setTab('articoli')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
                tab === 'articoli'
                  ? 'border-indigo-700 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Articoli & Redazione ({form.articoli.length})
            </button>
            <button
              id="tab-sponsor-editor"
              onClick={() => setTab('sponsor')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap ${
                tab === 'sponsor'
                  ? 'border-indigo-700 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Sponsor & Inserzioni ({(form.sponsor || []).length})</span>
            </button>
            <button
              id="tab-paginazione-editor"
              onClick={() => setTab('paginazione')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 whitespace-nowrap ${
                tab === 'paginazione'
                  ? 'border-indigo-700 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Paginazione Fascicolo</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-900 rounded font-black">
                {totalePagine} Pag.
              </span>
            </button>
            <button
              onClick={() => setTab('testata')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
                tab === 'testata'
                  ? 'border-indigo-700 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Dati Testata & Colophon
            </button>
            <button
              onClick={() => setTab('anteprima')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 cursor-pointer transition whitespace-nowrap ${
                tab === 'anteprima'
                  ? 'border-indigo-700 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Anteprima Impaginazione
            </button>
          </div>

        </div>
      </header>

      {/* CORPO DELL'EDITOR */}
      <main className={`flex-1 w-full mx-auto py-6 space-y-6 transition-all ${
        schermoIntero ? 'px-4 sm:px-6 max-w-full' : 'max-w-7xl px-4 sm:px-6 lg:px-8'
      }`}>
        
        {/* TAB 0: STUDIO EDITOR DTP & MENABÒ (CANVAS DIGITALE AVANZATO) */}
        {tab === 'studio' && (
          <GiornalinoStudioEditor
            config={config}
            giornalino={form}
            eventi={eventi}
            onSalva={(aggiornato) => {
              setForm(aggiornato);
              onSalva(aggiornato);
            }}
            onApriWordEditor={(art) => {
              setArticoloInModifica(art);
              setMostraModaleArticolo(true);
            }}
            onApriStampaModal={() => setMostraStampaModal(true)}
          />
        )}

        {/* TAB SPONSOR & INSERZIONI PUBBLICITARIE */}
        {tab === 'sponsor' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  <span>Sponsor & Inserzionisti Locali del Territorio</span>
                  <span className="text-xs bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    {(form.sponsor || []).length} Inserzioni
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Spazi pubblicitari e ringraziamenti alle attività commerciali che sostengono la stampa del notiziario Pro Loco.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setTab('studio')}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Vedi nello Studio DTP</span>
                </button>

                <button
                  id="btn-nuovo-sponsor"
                  onClick={() => {
                    const nuovo: SponsorInserzionista = {
                      id: `sp-${Date.now()}`,
                      nome: 'Nuova Attività Locale',
                      categoria: 'Commercio / Artigianato',
                      slogan: 'Al servizio del nostro borgo con passione',
                      telefono: '000 000000',
                      indirizzo: `Via Roma, ${config.comune}`,
                      pagina: 4,
                      formato: 'box_quarto'
                    };
                    setSponsorInModifica(nuovo);
                    setMostraModaleSponsor(true);
                  }}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuovo Inserzionista</span>
                </button>
              </div>
            </div>

            {/* Filtro per Pagina del Fascicolo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSponsorFiltroPagina('tutte')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sponsorFiltroPagina === 'tutte'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tutte le Pagine ({(form.sponsor || []).length})
              </button>
              {Array.from({ length: totalePagine }, (_, i) => i + 1).map((num) => {
                const count = (form.sponsor || []).filter(s => s.pagina === num).length;
                return (
                  <button
                    key={num}
                    onClick={() => setSponsorFiltroPagina(num)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      sponsorFiltroPagina === num
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Pagina {num} ({count})
                  </button>
                );
              })}
            </div>

            {/* Griglia degli Sponsor */}
            {(() => {
              const lista = (form.sponsor || []).filter(s => 
                sponsorFiltroPagina === 'tutte' ? true : s.pagina === sponsorFiltroPagina
              );

              if (lista.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                    <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-700">Nessun inserzionista trovato</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Aggiungi le attività locali sostenitrici per includerle nel formato di stampa A4 e nello Studio Editor.
                    </p>
                    <button
                      onClick={() => {
                        const nuovo: SponsorInserzionista = {
                          id: `sp-${Date.now()}`,
                          nome: 'Bottega del Borgo',
                          categoria: 'Alimentari & Tipicità',
                          slogan: 'Sapori genuini della tradizione locale',
                          telefono: '0123 456789',
                          indirizzo: `Piazza Garibaldi, ${config.comune}`,
                          pagina: 4,
                          formato: 'box_quarto'
                        };
                        setSponsorInModifica(nuovo);
                        setMostraModaleSponsor(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inserisci Sponsor di Prova</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lista.map((sp) => (
                    <div
                      key={sp.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-amber-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                            {sp.categoria}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            Pagina {sp.pagina}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900">{sp.nome}</h4>
                        {sp.slogan && (
                          <p className="text-xs text-slate-600 italic mt-1 font-serif">
                            "{sp.slogan}"
                          </p>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                          {sp.telefono && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Tel:</span>
                              <span className="font-semibold">{sp.telefono}</span>
                            </div>
                          )}
                          {sp.indirizzo && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Indirizzo:</span>
                              <span>{sp.indirizzo}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-slate-400">Formato:</span>
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                              {sp.formato === 'banner_striscia' ? 'Banner Striscia (Orizzontale)' : sp.formato === 'mezza_pagina' ? 'Mezza Pagina (Grande)' : '1/4 di Pagina (Modulo Standard)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const pagNuova = Math.max(1, sp.pagina - 1);
                              handleSalvaSponsor({ ...sp, pagina: pagNuova });
                            }}
                            disabled={sp.pagina <= 1}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 text-xs font-bold"
                            title="Sposta a pagina precedente"
                          >
                            ← Pag.
                          </button>
                          <button
                            onClick={() => {
                              const pagNuova = Math.min(totalePagine, sp.pagina + 1);
                              handleSalvaSponsor({ ...sp, pagina: pagNuova });
                            }}
                            disabled={sp.pagina >= totalePagine}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 text-xs font-bold"
                            title="Sposta a pagina successiva"
                          >
                            Pag. →
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSponsorInModifica(sp);
                              setMostraModaleSponsor(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Modifica Inserzione"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminaSponsor(sp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Elimina Inserzione"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              );
            })()}

          </div>
        )}

        {/* TAB 1: ARTICOLI & REDAZIONE */}
        {tab === 'articoli' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Composizione e Redazione Articoli</span>
                  <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                    {form.articoli.length} Articoli su {totalePagine} Pagine
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scrivi gli articoli con il nuovo editor in stile Word e spostali facilmente all'interno della paginazione del notiziario.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setTab('paginazione')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Gestione Paginazione</span>
                </button>

                <button
                  id="btn-nuovo-articolo-giornalino"
                  onClick={() => apriNuovoArticolo(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#185abd] hover:bg-[#114691] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuovo Articolo (Stile Word)</span>
                </button>
              </div>
            </div>

            {/* LISTA ARTICOLI */}
            <div className="space-y-4">
              {form.articoli.map((art, idx) => (
                <div 
                  key={art.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-300 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    
                    {/* Badge Metadati e Collocazione Pagina */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      
                      {/* Controllo Spostamento Pagina Rapido */}
                      <div className="inline-flex items-center gap-1 bg-indigo-50/90 text-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold text-[11px]">Pagina:</span>
                        <select
                          value={art.pagina || 1}
                          onChange={(e) => handleSpostaArticoloDiPagina(art.id, parseInt(e.target.value, 10))}
                          className="bg-white text-indigo-900 font-black text-xs px-1.5 py-0.5 rounded border border-indigo-300 cursor-pointer focus:outline-none"
                        >
                          {Array.from({ length: totalePagine }, (_, i) => i + 1).map(p => (
                            <option key={p} value={p}>Pag. {p}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSpostaArticoloDiPagina(art.id, (art.pagina || 1) - 1)}
                          disabled={(art.pagina || 1) <= 1}
                          className="p-0.5 hover:bg-indigo-200 rounded disabled:opacity-30 cursor-pointer"
                          title="Sposta alla pagina precedente"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleSpostaArticoloDiPagina(art.id, (art.pagina || 1) + 1)}
                          disabled={(art.pagina || 1) >= totalePagine}
                          className="p-0.5 hover:bg-indigo-200 rounded disabled:opacity-30 cursor-pointer"
                          title="Sposta alla pagina successiva"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] uppercase tracking-wider ${
                        art.sezione === 'editoriale' ? 'bg-emerald-100 text-emerald-900' :
                        art.sezione === 'primo_piano' ? 'bg-amber-100 text-amber-900' :
                        art.sezione === 'eventi' ? 'bg-teal-100 text-teal-900' :
                        'bg-indigo-50 text-indigo-900'
                      }`}>
                        {art.sezione.replace('_', ' ')}
                      </span>

                      {art.inEvidenza && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                          ★ In Evidenza
                        </span>
                      )}

                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-medium">{art.data}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 italic truncate max-w-[200px]">Autore: {art.autore}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 font-['Playfair_Display',serif]">
                      {art.titolo}
                    </h3>

                    {art.sottotitolo && (
                      <p className="text-xs font-medium text-slate-600 italic">
                        {art.sottotitolo}
                      </p>
                    )}

                    <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                      {art.contenuto.replace(/<[^>]*>?/gm, ' ')}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                      {art.immagine && (
                        <div className="flex items-center gap-1 text-indigo-700 font-medium">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Foto allegata</span>
                        </div>
                      )}
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                        Layout: <strong className="text-slate-800 capitalize">{art.colonna || 'doppia'}</strong> colonna
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                        Allineamento: <strong className="text-slate-800 capitalize">{art.allineamento || 'giustificato'}</strong>
                      </span>
                      {art.capolettera && (
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold">
                          Capolettera ON
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Azioni Articolo: Modifica Word, Spostamenti, Elimina */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => {
                        setArticoloInModifica({ ...art });
                        setMostraModaleArticolo(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#185abd] hover:bg-[#114691] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      title="Apri l'Editor avanzato stile Word con formattazione e capolettera"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifica Word</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSpostaArticolo(idx, 'su')}
                        disabled={idx === 0}
                        title="Sposta più in alto nell'ordine generale"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSpostaArticolo(idx, 'giu')}
                        disabled={idx === form.articoli.length - 1}
                        title="Sposta più in basso nell'ordine generale"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminaArticolo(art.id)}
                        title="Elimina articolo"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: PAGINAZIONE & SPOSTAMENTO FASCICOLO */}
        {tab === 'paginazione' && (
          <div className="space-y-6">
            
            {/* Header del Pannello Paginazione */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-700" />
                    <span>Gestione Paginazione e Spostamento Articoli nel Fascicolo</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualizza la struttura del notiziario pagina per pagina. Puoi spostare ogni articolo su una pagina diversa con un clic o riordinarlo nella colonna di lettura.
                  </p>
                </div>

                {/* Controlli Pagine Fascicolo */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setMostraTabellaMenabo(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    title="Apri la tabella riassuntiva del Timone Menabò per la riunione di redazione"
                  >
                    <Table className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Tabella Menabò Redazionale</span>
                  </button>

                  <button
                    onClick={handleDistribuisciAutomaticamente}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                    title="Distribuisci gli articoli in modo equilibrato su tutte le pagine"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Distribuisci Equamente</span>
                  </button>

                  <button
                    onClick={handleAggiungiPagina}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Aggiungi Pagina ({totalePagine + 1})</span>
                  </button>

                  {totalePagine > 2 && (
                    <button
                      onClick={handleRimuoviUltimaPaginaVuota}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      title="Rimuovi l'ultima pagina se vuota"
                    >
                      <span>Rimuovi Pagina {totalePagine}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setMostraStampaModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Anteprima di Stampa A4</span>
                  </button>
                </div>
              </div>

              {/* FORMATI TIPOGRAFICI STANDARD (QUARTINI & SEDICESIMI) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
                    <span>Dimensionamento Rapido Fascicolo Tipografico:</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    I periodici si stampano a quartini (multipli di 4 facciate per fogli A3 piegati a metà)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[
                    { pag: 4, label: '4 Pagine (Quartino Standard)', desc: '1 Foglio A3 piegato' },
                    { pag: 8, label: '8 Pagine (Doppio Quartino)', desc: '2 Fogli A3 spillati al centro' },
                    { pag: 12, label: '12 Pagine (Fascicolo Medio)', desc: '3 Fogli A3 spillati' },
                    { pag: 16, label: '16 Pagine (Sedicesimo Industriale)', desc: '4 Fogli A3 / Rivista' }
                  ].map((f) => (
                    <button
                      key={f.pag}
                      onClick={() => handleImpostaFascicoloStandard(f.pag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        totalePagine === f.pag
                          ? 'bg-indigo-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:text-indigo-900'
                      }`}
                      title={f.desc}
                    >
                      <span>{f.label}</span>
                      {totalePagine === f.pag && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barra informativa di riepilogo pagine */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase block">Pagine Totali</span>
                  <strong className="text-base text-slate-900">{totalePagine} Pagine A4</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase block">Articoli Assegnati</span>
                  <strong className="text-base text-indigo-900">{form.articoli.length} Articoli</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase block">Media per Pagina</span>
                  <strong className="text-base text-slate-900">
                    {(form.articoli.length / totalePagine).toFixed(1)} art./pag.
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase block">Fascicolo Stampabile</span>
                  <strong className="text-base text-emerald-800">
                    {totalePagine % 4 === 0 ? '✓ Quartino Tipografico Perfetto' : totalePagine % 2 === 0 ? 'Fronte/Retro' : '⚠️ Pagine Dispari'}
                  </strong>
                </div>
              </div>
            </div>

            {/* GRIGLIA PAGINE DEL FASCICOLO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {Array.from({ length: totalePagine }, (_, i) => i + 1).map((p) => {
                const articoliInQuestaPagina = form.articoli.filter(a => (a.pagina || 1) === p);
                const isPrima = p === 1;
                const isUltima = p === totalePagine;

                return (
                  <div
                    key={p}
                    className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden transition hover:border-indigo-300"
                  >
                    <div>
                      {/* Testata Pagina Wireframe */}
                      <div className={`p-4 border-b ${
                        isPrima ? 'bg-indigo-900 text-white' :
                        isUltima ? 'bg-slate-800 text-white' :
                        'bg-slate-50 text-slate-900 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black uppercase tracking-wider">
                            PAGINA {p}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPrima || isUltima ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-900'
                          }`}>
                            {articoliInQuestaPagina.length} {articoliInQuestaPagina.length === 1 ? 'articolo' : 'articoli'}
                          </span>
                        </div>
                        <p className={`text-xs font-medium mt-1 ${isPrima || isUltima ? 'text-slate-200' : 'text-slate-500'}`}>
                          {isPrima ? 'Copertina & Apertura' :
                           isUltima ? 'Retro-copertina & Eventi' :
                           `Interno Fascicolo (${p % 2 === 0 ? 'Pag. Sinistra' : 'Pag. Destra'})`}
                        </p>

                        {/* STRUMENTI RAPIDI PER LA SINGOLA PAGINA */}
                        <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          {/* Scambia Pagina */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleScambiaPagine(p, p - 1)}
                              disabled={p <= 1}
                              className={`px-1.5 py-0.5 rounded font-bold disabled:opacity-20 cursor-pointer ${
                                isPrima || isUltima ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                              title="Scambia l'intera pagina con quella precedente"
                            >
                              ← Scambia
                            </button>
                            <button
                              onClick={() => handleScambiaPagine(p, p + 1)}
                              disabled={p >= totalePagine}
                              className={`px-1.5 py-0.5 rounded font-bold disabled:opacity-20 cursor-pointer ${
                                isPrima || isUltima ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                              title="Scambia l'intera pagina con quella successiva"
                            >
                              Scambia →
                            </button>
                          </div>

                          {/* Azioni Duplica / Svuota / Elimina */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDuplicaPagina(p)}
                              className={`p-1 rounded cursor-pointer ${
                                isPrima || isUltima ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Duplica intera pagina (clona articoli su nuova pagina)"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleSvuotaPagina(p)}
                              disabled={articoliInQuestaPagina.length === 0}
                              className={`p-1 rounded disabled:opacity-20 cursor-pointer ${
                                isPrima || isUltima ? 'text-amber-300 hover:bg-white/10' : 'text-amber-700 hover:bg-amber-100'
                              }`}
                              title="Svuota pagina (sposta articoli a Pagina 1)"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            {totalePagine > 2 && (
                              <button
                                onClick={() => handleEliminaPagina(p)}
                                className={`p-1 rounded cursor-pointer ${
                                  isPrima || isUltima ? 'text-rose-300 hover:bg-rose-900/50' : 'text-rose-600 hover:bg-rose-100'
                                }`}
                                title="Elimina questa specifica pagina"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* TEMPLATE RAPIDO PER QUESTA PAGINA */}
                        <div className="mt-2 flex items-center gap-1 text-[10.5px]">
                          <span className={isPrima || isUltima ? 'text-slate-300' : 'text-slate-500'}>Template:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleApplicaTemplatePagina(p, e.target.value as any);
                                e.target.value = '';
                              }
                            }}
                            className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold cursor-pointer focus:outline-none ${
                              isPrima || isUltima ? 'bg-white/20 text-white' : 'bg-white border border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="">+ Applica Struttura...</option>
                            <option value="copertina">Copertina con Foto & In Primo Piano</option>
                            <option value="due_colonne">2 Colonne Equilibrate</option>
                            <option value="eventi">Tabella Programma & Eventi</option>
                            <option value="retro_sponsor">Retro con Colophon & Ringraziamenti</option>
                          </select>
                        </div>
                      </div>

                      {/* Lista Articoli all'interno di questa pagina */}
                      <div className="p-3.5 space-y-3 min-h-[220px]">
                        {articoliInQuestaPagina.length === 0 ? (
                          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                            <BookOpen className="w-6 h-6 mx-auto text-slate-300" />
                            <p className="text-xs font-medium">Pagina Vuota</p>
                            <p className="text-[11px] text-slate-400">
                              Usa i pulsanti degli articoli o creane uno per questa pagina.
                            </p>
                            <button
                              onClick={() => apriNuovoArticolo(p)}
                              className="inline-flex items-center gap-1 text-xs text-indigo-700 font-bold hover:underline pt-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Crea per Pagina {p}</span>
                            </button>
                          </div>
                        ) : (
                          articoliInQuestaPagina.map((art, artIdx) => (
                            <div
                              key={art.id}
                              className="bg-slate-50 rounded-2xl p-3 border border-slate-200 hover:bg-white hover:border-indigo-300 transition space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  art.sezione === 'editoriale' ? 'bg-emerald-100 text-emerald-900' :
                                  art.sezione === 'primo_piano' ? 'bg-amber-100 text-amber-900' :
                                  'bg-indigo-100 text-indigo-900'
                                }`}>
                                  {art.sezione.replace('_', ' ')}
                                </span>
                                {art.inEvidenza && (
                                  <span className="text-[10px] text-amber-700 font-bold">★ In evidenza</span>
                                )}
                              </div>

                              <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-tight">
                                {art.titolo}
                              </h4>

                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-normal">
                                {art.contenuto.replace(/<[^>]*>?/gm, ' ')}
                              </p>

                              {/* Barra Azioni Articolo nella Pagina */}
                              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1 text-xs">
                                
                                {/* Pulsanti Sposta Pagina (← Prec | Succ →) */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleSpostaArticoloDiPagina(art.id, p - 1)}
                                    disabled={p <= 1}
                                    className="p-1 text-slate-600 hover:text-indigo-900 hover:bg-indigo-100 rounded disabled:opacity-20 cursor-pointer"
                                    title="Sposta alla pagina precedente"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>

                                  <select
                                    value={p}
                                    onChange={(e) => handleSpostaArticoloDiPagina(art.id, parseInt(e.target.value, 10))}
                                    className="text-[10px] font-bold text-indigo-900 bg-white border border-indigo-200 rounded px-1 py-0.5 cursor-pointer"
                                    title="Seleziona la pagina di destinazione"
                                  >
                                    {Array.from({ length: totalePagine }, (_, idx) => idx + 1).map(num => (
                                      <option key={num} value={num}>Pag. {num}</option>
                                    ))}
                                  </select>

                                  <button
                                    onClick={() => handleSpostaArticoloDiPagina(art.id, p + 1)}
                                    disabled={p >= totalePagine}
                                    className="p-1 text-slate-600 hover:text-indigo-900 hover:bg-indigo-100 rounded disabled:opacity-20 cursor-pointer"
                                    title="Sposta alla pagina successiva"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Azioni Editor Word & Ordine */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleSpostaArticoloNellaPagina(art.id, 'su')}
                                    disabled={artIdx === 0}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer"
                                    title="Sposta in alto nella pagina"
                                  >
                                    <MoveUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleSpostaArticoloNellaPagina(art.id, 'giu')}
                                    disabled={artIdx === articoliInQuestaPagina.length - 1}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer"
                                    title="Sposta in basso nella pagina"
                                  >
                                    <MoveDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setArticoloInModifica({ ...art });
                                      setMostraModaleArticolo(true);
                                    }}
                                    className="p-1 text-indigo-700 hover:bg-indigo-100 rounded cursor-pointer font-bold"
                                    title="Modifica in stile Word"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Footer del riquadro pagina */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Pagina {p} di {totalePagine}</span>
                      <button
                        onClick={() => apriNuovoArticolo(p)}
                        className="text-indigo-700 font-bold hover:underline cursor-pointer"
                      >
                        + Aggiungi qui
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 3: DATI TESTATA & COLOPHON */}
        {tab === 'testata' && (
          <div className="space-y-6">
            {/* Nuovo Editor Intestazione & Testata Grafica */}
            <GiornalinoHeaderEditor
              config={config}
              giornalino={form}
              onSalva={(nuovo) => setForm(nuovo)}
              inline={true}
            />

            {/* Colophon Ufficiale e Dati di Stampa */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-black text-slate-900">
                  Colophon Ufficiale & Dati di Distribuzione
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Imposta i responsabili editoriali, il comitato di redazione e i dettagli di stampa per la conformità con lo Statuto Pro Loco e RUNTS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Direttore Responsabile
                  </label>
                  <input
                    type="text"
                    value={form.direttoreResponsabile}
                    onChange={(e) => setForm({ ...form, direttoreResponsabile: e.target.value })}
                    placeholder="Es. Marco Valenti (Presidente Pro Loco)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comitato di Redazione
                  </label>
                  <input
                    type="text"
                    value={form.redazione}
                    onChange={(e) => setForm({ ...form, redazione: e.target.value })}
                    placeholder="Es. Consiglio Direttivo e Volontari"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiratura & Canali Distribuzione
                  </label>
                  <input
                    type="text"
                    value={form.tiratura}
                    onChange={(e) => setForm({ ...form, tiratura: e.target.value })}
                    placeholder="Es. 1.500 copie cartacee e distribuzione digitale"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipografia / Sede di Stampa
                  </label>
                  <input
                    type="text"
                    value={form.sedeStampa}
                    onChange={(e) => setForm({ ...form, sedeStampa: e.target.value })}
                    placeholder="Es. Tipografia Locale & Sede Pro Loco"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSalva}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva Configurazione Completa</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ANTEPRIMA IMPAGINAZIONE MULTIPAGINA */}
        {tab === 'anteprima' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-700" />
                  <span>Anteprima Impaginazione Fascicolo ({totalePagine} Pagine)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualizza il notiziario distribuito nelle singole pagine A4. Clicca sui selettori di pagina per spostare gli articoli al volo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setTab('paginazione')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Pannello Fascicolo</span>
                </button>

                <button
                  onClick={() => setMostraStampaModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa A4 / Salva PDF</span>
                </button>
              </div>
            </div>

            {/* Simulazione Pagine A4 del Fascicolo */}
            <div className="space-y-8 max-w-4xl mx-auto">
              {Array.from({ length: totalePagine }, (_, i) => i + 1).map((p) => {
                const articoliDellaPagina = form.articoli.filter(a => (a.pagina || 1) === p);
                const isPrima = p === 1;
                const isUltima = p === totalePagine;

                return (
                  <div key={p} className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
                    
                    {/* Header di Pagina */}
                    <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                          PAG. {p}
                        </span>
                        <span className="font-bold text-slate-700">
                          {isPrima ? 'Prima Pagina (Copertina & Testata)' :
                           isUltima ? 'Ultima Pagina (Chiusura & Eventi)' :
                           `Pagina Interna ${p % 2 === 0 ? 'Sinistra' : 'Destra'}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">
                          {articoliDellaPagina.length} {articoliDellaPagina.length === 1 ? 'articolo' : 'articoli'}
                        </span>
                        <button
                          onClick={() => apriNuovoArticolo(p)}
                          className="text-xs text-indigo-700 font-bold hover:underline cursor-pointer"
                        >
                          + Aggiungi Articolo
                        </button>
                      </div>
                    </div>

                    <div className="p-6 sm:p-10 space-y-6">
                      
                      {/* Se Pagina 1, mostra la Testata Storica */}
                      {isPrima && (
                        <div className="border-b-4 border-double border-slate-900 pb-4 text-center mb-6">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                            {config.nome} • UNPLI APS
                          </span>
                          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Playfair_Display',serif] uppercase tracking-tight mt-1">
                            {form.testata}
                          </h2>
                          <p className="text-xs text-slate-600 italic font-['Playfair_Display',serif]">
                            {form.sottotitoloTestata}
                          </p>
                          <div className="flex items-center justify-between border-t border-b border-slate-900 py-1 px-3 mt-3 text-[10.5px] font-bold uppercase bg-slate-50">
                            <span>{form.numeroEdizione}</span>
                            <span>{form.periodo}</span>
                            <span>{form.dataPubblicazione}</span>
                          </div>
                        </div>
                      )}

                      {/* Articoli di questa pagina */}
                      {articoliDellaPagina.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 space-y-2">
                          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">Nessun articolo assegnato alla Pagina {p}</p>
                          <p className="text-xs text-slate-400">
                            Assegna un articolo a questa pagina dalla scheda "Articoli" o usa il pulsante qui sotto.
                          </p>
                          <button
                            onClick={() => apriNuovoArticolo(p)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl transition cursor-pointer mt-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Crea Articolo per Pagina {p}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {articoliDellaPagina.map((art) => (
                            <div key={art.id} className="border-b border-slate-200 pb-6 group">
                              
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider bg-indigo-100 px-2 py-0.5 rounded">
                                    {art.sezione.replace('_', ' ')}
                                  </span>
                                  <span className="text-slate-500 font-medium">Autore: {art.autore}</span>
                                </div>

                                {/* Sposta articolo al volo da qui */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-bold text-slate-600">Sposta a Pag:</span>
                                  <select
                                    value={art.pagina || 1}
                                    onChange={(e) => handleSpostaArticoloDiPagina(art.id, parseInt(e.target.value, 10))}
                                    className="bg-white border border-slate-300 text-indigo-900 font-black text-xs px-2 py-0.5 rounded cursor-pointer"
                                  >
                                    {Array.from({ length: totalePagine }, (_, idx) => idx + 1).map(num => (
                                      <option key={num} value={num}>Pag. {num}</option>
                                    ))}
                                  </select>

                                  <button
                                    onClick={() => {
                                      setArticoloInModifica({ ...art });
                                      setMostraModaleArticolo(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#185abd] text-white rounded text-[11px] font-bold hover:bg-[#114691] cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Word</span>
                                  </button>
                                </div>
                              </div>

                              <h3 className="text-xl font-black text-slate-900 font-['Playfair_Display',serif]">
                                {art.titolo}
                              </h3>

                              {art.sottotitolo && (
                                <p className="text-xs text-slate-600 italic mt-0.5 mb-2">
                                  {art.sottotitolo}
                                </p>
                              )}

                              {art.immagine && (
                                <div className="my-3 max-w-md">
                                  <img 
                                    src={art.immagine} 
                                    alt={art.titolo} 
                                    className="rounded-xl w-full h-44 object-cover border border-slate-200" 
                                    referrerPolicy="no-referrer" 
                                  />
                                  {art.didascaliaImmagine && (
                                    <p className="text-[10.5px] text-slate-500 italic mt-1">{art.didascaliaImmagine}</p>
                                  )}
                                </div>
                              )}

                              <div 
                                className={`text-xs leading-relaxed text-slate-800 ${
                                  art.colonna === 'singola' ? '' :
                                  art.colonna === 'tre' ? 'sm:columns-3 sm:gap-6' :
                                  'sm:columns-2 sm:gap-6'
                                } ${
                                  art.allineamento === 'justify' ? 'text-justify' :
                                  art.allineamento === 'center' ? 'text-center' :
                                  art.allineamento === 'right' ? 'text-right' : 'text-left'
                                }`}
                              >
                                {art.capolettera && art.contenuto ? (
                                  <div>
                                    <span className="float-left text-4xl leading-none font-black font-['Playfair_Display',serif] text-indigo-950 mr-2 mt-1 select-none">
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

                            </div>
                          ))}
                        </div>
                      )}

                      {/* Piede Pagina */}
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>{form.testata} - {form.periodo}</span>
                        <span className="font-bold text-slate-700 font-mono">PAGINA {p} DI {totalePagine}</span>
                        <span>{config.nome}</span>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* MODALE DI AGGIUNTA / MODIFICA ARTICOLO IN STILE WORD */}
      {mostraModaleArticolo && articoloInModifica && (
        <WordStyleEditorModal
          articolo={articoloInModifica}
          totalePagine={totalePagine}
          onSalva={(artAggiornato) => {
            handleSalvaArticolo(artAggiornato);
          }}
          onChiudi={() => {
            setMostraModaleArticolo(false);
            setArticoloInModifica(null);
          }}
        />
      )}

      {/* MODALE DI STAMPA A4 / PDF GIORNALINO CON GESTIONE PAGINAZIONE */}
      {mostraStampaModal && (
        <GiornalinoPrintModal
          giornalino={form}
          config={config}
          eventi={eventi}
          onChiudi={() => setMostraStampaModal(false)}
          onSpostaArticoloTraPagine={(articoloId, nuovaPagina) => {
            handleSpostaArticoloDiPagina(articoloId, nuovaPagina);
          }}
          onModificaArticolo={(art) => {
            setArticoloInModifica({ ...art });
            setMostraModaleArticolo(true);
          }}
          onAggiornaGiornalino={(nuovo) => {
            setForm(nuovo);
            onSalva(nuovo);
          }}
        />
      )}

      {/* MODALE INSERIMENTO / MODIFICA SPONSOR INSERZIONISTA */}
      {mostraModaleSponsor && sponsorInModifica && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {sponsorInModifica.id ? 'Scheda Inserzionista Locale' : 'Nuovo Sponsor del Territorio'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setMostraModaleSponsor(false);
                  setSponsorInModifica(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Attività / Insegna *</label>
                <input
                  type="text"
                  value={sponsorInModifica.nome}
                  onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, nome: e.target.value })}
                  placeholder="Es. Forno & Pasticceria Antico Borgo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria Merceologica</label>
                  <input
                    type="text"
                    value={sponsorInModifica.categoria}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, categoria: e.target.value })}
                    placeholder="Es. Ristorazione tipica"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Formato Inserzione</label>
                  <select
                    value={sponsorInModifica.formato}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, formato: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900 bg-white"
                  >
                    <option value="box_quarto">1/4 di Pagina (Standard)</option>
                    <option value="banner_striscia">Banner Striscia (Orizzontale)</option>
                    <option value="mezza_pagina">Mezza Pagina (Grande)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Slogan o Messaggio Pubblicitario</label>
                <input
                  type="text"
                  value={sponsorInModifica.slogan || ''}
                  onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, slogan: e.target.value })}
                  placeholder="Es. Dal 1968, ingredienti genuini a km zero"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recapito Telefonico</label>
                  <input
                    type="text"
                    value={sponsorInModifica.telefono || ''}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, telefono: e.target.value })}
                    placeholder="Es. 0123 456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pagina Assegnata nel Fascicolo</label>
                  <select
                    value={sponsorInModifica.pagina}
                    onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, pagina: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900 bg-white"
                  >
                    {Array.from({ length: totalePagine }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Pagina {n} {n === totalePagine ? '(Retro copertina - Consigliata)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Indirizzo / Sede Locale</label>
                <input
                  type="text"
                  value={sponsorInModifica.indirizzo || ''}
                  onChange={(e) => setSponsorInModifica({ ...sponsorInModifica, indirizzo: e.target.value })}
                  placeholder={`Via Roma 12, ${config.comune}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMostraModaleSponsor(false);
                  setSponsorInModifica(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!sponsorInModifica.nome.trim()) {
                    alert('Inserisci il nome dell\'attività sostenitrice.');
                    return;
                  }
                  handleSalvaSponsor(sponsorInModifica);
                }}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Salva Inserzionista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE TIMONE MENABÒ REDAZIONALE COMPLETO */}
      {mostraTabellaMenabo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header Timone */}
            <div className="bg-indigo-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Table className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    Timone Menabò Redazionale del Notiziario
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Pro Loco {config.denominazione} • {form.titoloTestata} ({form.periodo || 'Edizione in corso'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Stampa foglio menabò per la riunione"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stampa Foglio</span>
                </button>
                <button
                  onClick={() => setMostraTabellaMenabo(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Riepilogo metriche redazione */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fascicolo</span>
                <strong className="text-base text-indigo-900">{totalePagine} Pagine A4</strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Articoli Totali</span>
                <strong className="text-base text-slate-900">{form.articoli.length} Pezzi</strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Parole Complessive</span>
                <strong className="text-base text-emerald-800">
                  {form.articoli.reduce((acc, a) => {
                    const text = a.contenuto.replace(/<[^>]*>?/gm, ' ').trim();
                    return acc + (text ? text.split(/\s+/).filter(Boolean).length : 0);
                  }, 0)} parole
                </strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Inserzionisti Sponsor</span>
                <strong className="text-base text-amber-800">{(form.sponsor || []).length} Sponsor</strong>
              </div>
            </div>

            {/* Tabella Redazionale */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-3 w-16 text-center">Pagina</th>
                      <th className="py-3 px-3">Titolo & Occhiello</th>
                      <th className="py-3 px-3">Sezione</th>
                      <th className="py-3 px-3">Autore</th>
                      <th className="py-3 px-3">Formato</th>
                      <th className="py-3 px-3 text-right">Parole</th>
                      <th className="py-3 px-3 text-center">Foto</th>
                      <th className="py-3 px-3 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {form.articoli
                      .slice()
                      .sort((a, b) => (a.pagina || 1) - (b.pagina || 1) || (a.ordine || 0) - (b.ordine || 0))
                      .map((art) => {
                        const words = art.contenuto.replace(/<[^>]*>?/gm, ' ').trim().split(/\s+/).filter(Boolean).length;
                        return (
                          <tr key={art.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-center font-black text-indigo-900">
                              <span className="inline-block w-7 h-7 leading-7 rounded-full bg-indigo-50 border border-indigo-200 text-xs">
                                {art.pagina || 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {art.occhiello && (
                                <span className="text-[9.5px] uppercase font-bold text-indigo-700 block tracking-wider">
                                  {art.occhiello}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 block line-clamp-1">
                                {art.titolo}
                              </span>
                              {art.sottotitolo && (
                                <span className="text-[10.5px] text-slate-500 italic block line-clamp-1">
                                  {art.sottotitolo}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                                {art.sezione.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                              {art.autore || 'Redazione'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              <span className="capitalize">{art.colonna || 'doppia'}</span>
                              {art.inEvidenza && (
                                <span className="text-amber-600 font-bold ml-1">★ Copertina</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-bold">
                              {words}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {art.immagine ? (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  ✓ Sì
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setArticoloInModifica(art);
                                    setMostraModaleArticolo(true);
                                    setMostraTabellaMenabo(false);
                                  }}
                                  className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                  title="Modifica con l'editor Word"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <select
                                  value={art.pagina || 1}
                                  onChange={(e) => handleSpostaArticoloDiPagina(art.id, Number(e.target.value))}
                                  className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.5"
                                  title="Sposta a pagina..."
                                >
                                  {Array.from({ length: totalePagine }, (_, i) => i + 1).map(p => (
                                    <option key={p} value={p}>Pag. {p}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleEliminaArticolo(art.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Elimina articolo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Timone */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Puoi trascinare e modificare la posizione visiva millimetrica nello Studio DTP.
              </span>
              <button
                onClick={() => setMostraTabellaMenabo(false)}
                className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-800 transition cursor-pointer"
              >
                Chiudi Menabò
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE: CREA NUOVO GIORNALINO (Rintracciabile da Archivio Edizioni e Aggiornabile con APK) */}
      {mostraModalNuovoGiornalino && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-5 h-5 text-amber-100" />
                <div>
                  <h3 className="text-base font-black">Crea Nuovo Giornalino</h3>
                  <p className="text-[11px] text-amber-100">Catalogato automaticamente in Archivio Edizioni e sincronizzato con l&apos;APK</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostraModalNuovoGiornalino(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfermaNuovoGiornalino} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Anno Edizione</label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={nuovoAnnoEdizione}
                    onChange={e => setNuovoAnnoEdizione(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Numero Uscita (N.)</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={nuovoNumeroEdizione}
                    onChange={e => setNuovoNumeroEdizione(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periodicità</label>
                  <select
                    value={nuovaPeriodicita}
                    onChange={e => setNuovaPeriodicita(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white"
                  >
                    <option value="Mensile">Mensile</option>
                    <option value="Bimestrale">Bimestrale</option>
                    <option value="Trimestrale">Trimestrale</option>
                    <option value="Semestrale">Semestrale</option>
                    <option value="Annuale">Annuale</option>
                    <option value="Edizione Straordinaria">Edizione Straordinaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Uscita</label>
                  <input
                    type="date"
                    value={nuovaDataUscita}
                    onChange={e => setNuovaDataUscita(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mese / Stagione in Copertina</label>
                  <input
                    type="text"
                    value={nuovoMeseAnnoLabel}
                    onChange={e => setNuovoMeseAnnoLabel(e.target.value)}
                    placeholder="Es. Novembre 2025"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note Archivio Edizioni</label>
                  <input
                    type="text"
                    value={nuoveNoteRedazione}
                    onChange={e => setNuoveNoteRedazione(e.target.value)}
                    placeholder="Es. Speciale Eventi e Sagre"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Struttura iniziale del nuovo giornalino</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${nuovaModalitaContenuto === 'solo_testata' ? 'border-amber-600 bg-amber-50/70 font-bold text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="modalitaNuovo"
                      checked={nuovaModalitaContenuto === 'solo_testata'}
                      onChange={() => setNuovaModalitaContenuto('solo_testata')}
                    />
                    <span>Mantieni Testata e Sponsor della Pro Loco (pagine pronte per nuovi articoli)</span>
                  </label>
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${nuovaModalitaContenuto === 'editoriale_iniziale' ? 'border-amber-600 bg-amber-50/70 font-bold text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="modalitaNuovo"
                      checked={nuovaModalitaContenuto === 'editoriale_iniziale'}
                      onChange={() => setNuovaModalitaContenuto('editoriale_iniziale')}
                    />
                    <span>Crea con Articolo Editoriale di benvenuto in Prima Pagina</span>
                  </label>
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${nuovaModalitaContenuto === 'duplica_tutto' ? 'border-amber-600 bg-amber-50/70 font-bold text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="modalitaNuovo"
                      checked={nuovaModalitaContenuto === 'duplica_tutto'}
                      onChange={() => setNuovaModalitaContenuto('duplica_tutto')}
                    />
                    <span>Duplica anche tutti gli articoli del giornalino attuale come base</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostraModalNuovoGiornalino(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crea Nuovo Giornalino</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE: CONFERMA ELIMINA GIORNALINO */}
      {mostraModalEliminaGiornalino && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black">Elimina Giornalino</h3>
              </div>
              <button
                type="button"
                onClick={() => setMostraModalEliminaGiornalino(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Confermi di voler eliminare definitivamente l&apos;uscita <strong>{form.numeroEdizione}</strong> ({form.dataPubblicazione})?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Il giornalino verrà rimosso dall&apos;<strong>Archivio Edizioni</strong> e l&apos;elenco delle uscite nell&apos;<strong>App Android (.APK)</strong> sarà aggiornato automaticamente.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostraModalEliminaGiornalino(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaEliminaGiornalino}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Conferma Elimina</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
