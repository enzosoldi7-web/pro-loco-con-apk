import React, { useState, useMemo } from 'react';
import { 
  EdizioneGiornalino, 
  ProLocoInfo, 
  StatoUscitaGiornalino,
  ArticoloGiornalino,
  Socio,
  ComunicazioneSocio
} from '../types';
import { 
  Newspaper, 
  Calendar, 
  Eye, 
  PenTool, 
  Plus, 
  Search, 
  Filter, 
  Archive, 
  Printer, 
  Download, 
  Copy, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  X, 
  ChevronRight, 
  Sparkles, 
  FileText,
  Building2,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  Send,
  Users,
  CreditCard,
  Smartphone,
  Check,
  Bell
} from 'lucide-react';
import {
  esportaRegistroGiornaliniCSV,
  loadSoci,
  loadComunicazioniSoci,
  inviaUscitaGiornalinoAiSoci,
  eliminaEdizioneGiornalino,
  getPublicPortalOrigin
} from '../storage';

interface GiornalinoArchiveDashboardProps {
  config: ProLocoInfo;
  soci?: Socio[];
  archivio: EdizioneGiornalino[];
  edizioneAttivaId: string;
  onSelezionaEdizione: (edizione: EdizioneGiornalino, apriEditor?: boolean) => void;
  onSalvaArchivio: (nuovoArchivio: EdizioneGiornalino[]) => void;
  onEliminaEdizione?: (edizioneId: string) => void;
  onTornaDashboard: () => void;
  onApriEditorSuEdizione: (edizione: EdizioneGiornalino, tab?: 'studio' | 'articoli' | 'sponsor' | 'paginazione' | 'testata') => void;
}

export const GiornalinoArchiveDashboard: React.FC<GiornalinoArchiveDashboardProps> = ({
  config,
  soci: sociProp,
  archivio,
  edizioneAttivaId,
  onSelezionaEdizione,
  onSalvaArchivio,
  onEliminaEdizione,
  onTornaDashboard,
  onApriEditorSuEdizione
}) => {
  // Filtri
  const [filtroAnno, setFiltroAnno] = useState<number | 'tutti'>('tutti');
  const [filtroStato, setFiltroStato] = useState<StatoUscitaGiornalino | 'tutti'>('tutti');
  const [ricerca, setRicerca] = useState('');
  const [ordinamento, setOrdinamento] = useState<'data_desc' | 'data_asc' | 'anno_desc' | 'titolo_asc'>('data_desc');
  const [vista, setVista] = useState<'griglia' | 'tabella'>('griglia');

  // Modali
  const [mostraModaleNuova, setMostraModaleNuova] = useState(false);
  const [edizioneInVisione, setEdizioneInVisione] = useState<EdizioneGiornalino | null>(null);
  const [edizioneInModifica, setEdizioneInModifica] = useState<EdizioneGiornalino | null>(null);
  const [edizioneDaEliminare, setEdizioneDaEliminare] = useState<EdizioneGiornalino | null>(null);
  const [paginaVisioneSelezionata, setPaginaVisioneSelezionata] = useState<number>(1);

  // Stato per Invio Uscita / Invio Massivo per Socio (riferimento Numero Tessera) sul Portale Web Soci / APK -> Comunicazioni
  const [edizioneInInvio, setEdizioneInInvio] = useState<EdizioneGiornalino | null>(null);
  const [ricercaSocioInvio, setRicercaSocioInvio] = useState<string>('');
  const [tessereSelezionate, setTessereSelezionate] = useState<string[]>([]);
  const [notaInvioGiornalino, setNotaInvioGiornalino] = useState<string>('');
  const [comunicazioniInviate, setComunicazioniInviate] = useState<ComunicazioneSocio[]>(() => loadComunicazioniSoci());
  const [esitoInvioMassivo, setEsitoInvioMassivo] = useState<{
    edizioneNumero: string;
    inviateCount: number;
    timestamp: string;
  } | null>(null);

  const elencoSociAttivi = useMemo(() => {
    const base = sociProp && sociProp.length > 0 ? sociProp : loadSoci();
    return base.filter(s => !s.dataCancellazione && s.attivo !== false);
  }, [sociProp]);

  const apriModaleInvioUscita = (ed: EdizioneGiornalino) => {
    setEdizioneInInvio(ed);
    setRicercaSocioInvio('');
    setEsitoInvioMassivo(null);
    setTessereSelezionate(
      elencoSociAttivi
        .map(s => (s.numeroTessera || '').trim().toUpperCase())
        .filter(Boolean)
    );
    setNotaInvioGiornalino(
      `È disponibile per la tua Tessera Socio la nuova uscita del periodico "${ed.testata}" (${ed.numeroEdizione} - ${ed.periodo}). Puoi sfogliare tutte le pagine direttamente qui nella sezione Comunicazioni del tuo Portale Web Soci / App APK.`
    );
  };

  const handleInviaUscitaMassivoOSingolo = (sociDestinatari: Socio[], edTarget?: EdizioneGiornalino) => {
    const uscita = edTarget || edizioneInInvio;
    if (!uscita || sociDestinatari.length === 0) return;
    const res = inviaUscitaGiornalinoAiSoci(uscita, sociDestinatari, config, notaInvioGiornalino);
    setComunicazioniInviate(res.comunicazioni);
    setEsitoInvioMassivo({
      edizioneNumero: uscita.numeroEdizione,
      inviateCount: res.inviateCount,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    });
  };

  // Form nuova uscita
  const annoCorrente = new Date().getFullYear();
  const [nuovaUscitaForm, setNuovaUscitaForm] = useState({
    anno: annoCorrente,
    dataUscita: `${annoCorrente}-10-15`,
    dataPubblicazione: `Ottobre ${annoCorrente}`,
    numeroEdizione: `Anno ${annoCorrente - 2001} - N. 1`,
    periodo: `Edizione Autunno ${annoCorrente}`,
    totalePagine: 4,
    tiratura: '1.500 copie cartacee e diffusione digitale',
    statoUscita: 'bozza' as StatoUscitaGiornalino,
    copiaDaId: ''
  });

  // Lista anni presenti nell'archivio per filtri rapidi
  const anniDisponibili = useMemo(() => {
    const set = new Set<number>();
    archivio.forEach(e => {
      if (e.anno) set.add(e.anno);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [archivio]);

  // Conteggio uscite per anno
  const conteggioPerAnno = useMemo(() => {
    const map: Record<number, number> = {};
    archivio.forEach(e => {
      map[e.anno] = (map[e.anno] || 0) + 1;
    });
    return map;
  }, [archivio]);

  // Edizioni filtrate e ordinate
  const edizioniFiltrate = useMemo(() => {
    return archivio.filter(ed => {
      if (filtroAnno !== 'tutti' && ed.anno !== filtroAnno) return false;
      if (filtroStato !== 'tutti' && ed.statoUscita !== filtroStato) return false;
      if (ricerca.trim()) {
        const q = ricerca.toLowerCase();
        const inTestata = ed.testata?.toLowerCase().includes(q);
        const inNumero = ed.numeroEdizione?.toLowerCase().includes(q);
        const inPeriodo = ed.periodo?.toLowerCase().includes(q);
        const inData = (ed.dataUscita || ed.dataPubblicazione)?.toLowerCase().includes(q);
        const inArticoli = (ed.articoli || []).some(a => 
          a.titolo.toLowerCase().includes(q) || 
          a.autore.toLowerCase().includes(q) || 
          a.contenuto.toLowerCase().includes(q)
        );
        if (!inTestata && !inNumero && !inPeriodo && !inData && !inArticoli) return false;
      }
      return true;
    }).sort((a, b) => {
      if (ordinamento === 'anno_desc') return b.anno - a.anno;
      if (ordinamento === 'titolo_asc') return a.numeroEdizione.localeCompare(b.numeroEdizione);
      if (ordinamento === 'data_asc') {
        return (a.dataUscita || '').localeCompare(b.dataUscita || '');
      }
      return (b.dataUscita || '').localeCompare(a.dataUscita || '');
    });
  }, [archivio, filtroAnno, filtroStato, ricerca, ordinamento]);

  // Statistiche aggregate
  const stats = useMemo(() => {
    const totaleUscite = archivio.length;
    const usciteAnnoSelezionato = filtroAnno === 'tutti' 
      ? archivio.filter(e => e.anno === annoCorrente).length 
      : archivio.filter(e => e.anno === filtroAnno).length;
    
    let totaleArticoli = 0;
    let totaleSponsor = 0;
    let totalePagine = 0;

    archivio.forEach(e => {
      totaleArticoli += (e.articoli || []).length;
      totaleSponsor += (e.sponsor || []).length;
      totalePagine += (e.totalePagine || 4);
    });

    return {
      totaleUscite,
      usciteAnnoSelezionato,
      totaleArticoli,
      totaleSponsor,
      totalePagine
    };
  }, [archivio, filtroAnno, annoCorrente]);

  // Funzione creazione nuova uscita
  const handleCreaNuovaUscita = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `giornalino-${nuovaUscitaForm.anno}-${Date.now().toString().slice(-4)}`;
    
    let baseEdizione: EdizioneGiornalino;
    if (nuovaUscitaForm.copiaDaId) {
      const sorgente = archivio.find(ed => ed.id === nuovaUscitaForm.copiaDaId);
      if (sorgente) {
        baseEdizione = {
          ...sorgente,
          id,
          anno: nuovaUscitaForm.anno,
          dataUscita: nuovaUscitaForm.dataUscita,
          dataPubblicazione: nuovaUscitaForm.dataPubblicazione,
          numeroEdizione: nuovaUscitaForm.numeroEdizione,
          periodo: nuovaUscitaForm.periodo,
          totalePagine: nuovaUscitaForm.totalePagine,
          tiratura: nuovaUscitaForm.tiratura,
          statoUscita: nuovaUscitaForm.statoUscita,
          protocolloStampa: `REG-${nuovaUscitaForm.anno}/${String(archivio.length + 1).padStart(2, '0')}-PF`,
          dataCreazione: new Date().toISOString().split('T')[0],
          dataUltimaModifica: new Date().toISOString().split('T')[0]
        };
      } else {
        baseEdizione = creaEdizioneDefault(id);
      }
    } else {
      baseEdizione = creaEdizioneDefault(id);
    }

    const nuovoArchivio = [baseEdizione, ...archivio];
    onSalvaArchivio(nuovoArchivio);
    setMostraModaleNuova(false);

    // Imposta come attiva e offri di andare direttamente
    onSelezionaEdizione(baseEdizione, false);
  };

  const creaEdizioneDefault = (id: string): EdizioneGiornalino => {
    return {
      id,
      anno: nuovaUscitaForm.anno,
      dataUscita: nuovaUscitaForm.dataUscita,
      dataPubblicazione: nuovaUscitaForm.dataPubblicazione,
      numeroEdizione: nuovaUscitaForm.numeroEdizione,
      periodo: nuovaUscitaForm.periodo,
      totalePagine: nuovaUscitaForm.totalePagine,
      tiratura: nuovaUscitaForm.tiratura,
      statoUscita: nuovaUscitaForm.statoUscita,
      testata: config.nome ? `La Voce della ${config.nome}` : 'La Voce della Pro Loco',
      sottotitoloTestata: 'Periodico Ufficiale di Cultura, Feste e Vita Associativa',
      motto: config.motto || 'Al servizio del borgo e delle nostre tradizioni',
      direttoreResponsabile: config.nomePresidente || 'Presidente Pro Loco',
      redazione: 'Consiglio Direttivo e Comitato Redazionale Volontari',
      sedeStampa: 'Tipografia Sociale Locale',
      protocolloStampa: `REG-${nuovaUscitaForm.anno}/${String(archivio.length + 1).padStart(2, '0')}-STAMPA`,
      dataCreazione: new Date().toISOString().split('T')[0],
      dataUltimaModifica: new Date().toISOString().split('T')[0],
      copertinaPreview: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
      articoli: [
        {
          id: `art-${Date.now()}-1`,
          titolo: `Editoriale: Verso Nuovi Traguardi per la Pro Loco`,
          sottotitolo: `Inauguriamo la nuova stagione con entusiasmo, coesione e passione civile`,
          occhiello: 'L\'EDITORIALE DEL PRESIDENTE',
          sezione: 'editoriale',
          autore: config.nomePresidente || 'Marco Valenti',
          data: nuovaUscitaForm.dataPubblicazione,
          pagina: 1,
          ordine: 1,
          colonna: 'doppia',
          allineamento: 'justify',
          capolettera: true,
          contenuto: `Con grande gioia presentiamo ai soci e alla cittadinanza questo nuovo numero del nostro periodico associativo. Un sentito ringraziamento a tutta la redazione e ai volontari impegnati sul campo.`,
          inEvidenza: true
        }
      ],
      sponsor: []
    };
  };

  // Duplicazione veloce uscita
  const handleDuplicaUscita = (ed: EdizioneGiornalino) => {
    const nuovoAnno = new Date().getFullYear();
    const nuovoId = `giornalino-${nuovoAnno}-${Date.now().toString().slice(-4)}`;
    const duplicata: EdizioneGiornalino = {
      ...ed,
      id: nuovoId,
      anno: nuovoAnno,
      dataUscita: `${nuovoAnno}-${new Date().toISOString().slice(5, 10)}`,
      dataPubblicazione: `Nuova Edizione ${nuovoAnno}`,
      numeroEdizione: `${ed.numeroEdizione} (Copia)`,
      statoUscita: 'bozza',
      dataCreazione: new Date().toISOString().split('T')[0],
      dataUltimaModifica: new Date().toISOString().split('T')[0],
      protocolloStampa: `REG-${nuovoAnno}/${String(archivio.length + 1).padStart(2, '0')}-DUP`
    };

    const nuovoArchivio = [duplicata, ...archivio];
    onSalvaArchivio(nuovoArchivio);
    onSelezionaEdizione(duplicata, false);
  };

  // Eliminazione uscita (apre modale di conferma e aggiorna anche APK)
  const handleEliminaUscita = (id: string, _numero: string) => {
    const target = archivio.find(e => e.id === id);
    if (target) {
      setEdizioneDaEliminare(target);
    }
  };

  const handleConfermaEliminaUscita = () => {
    if (!edizioneDaEliminare) return;
    const id = edizioneDaEliminare.id;
    if (onEliminaEdizione) {
      onEliminaEdizione(id);
    } else {
      const res = eliminaEdizioneGiornalino(id);
      onSalvaArchivio(res.nuovoArchivio);
      onSelezionaEdizione(res.nuovaAttiva, false);
    }
    setComunicazioniInviate(loadComunicazioniSoci());
    setEdizioneDaEliminare(null);
  };

  // Salvataggio modifica metadati
  const handleSalvaModificaMetadati = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edizioneInModifica) return;

    const aggiornato = archivio.map(ed => {
      if (ed.id === edizioneInModifica.id) {
        return {
          ...edizioneInModifica,
          dataUltimaModifica: new Date().toISOString().split('T')[0]
        };
      }
      return ed;
    });

    onSalvaArchivio(aggiornato);
    if (edizioneAttivaId === edizioneInModifica.id) {
      onSelezionaEdizione(edizioneInModifica, false);
    }
    setEdizioneInModifica(null);
  };

  // Badge colore stato
  const getBadgeStato = (stato: StatoUscitaGiornalino) => {
    switch (stato) {
      case 'pubblicato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Pubblicato
          </span>
        );
      case 'in_stampa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Layers className="w-3 h-3 text-blue-600" />
            In Stampa Tipografica
          </span>
        );
      case 'bozza':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            In Lavorazione / Bozza
          </span>
        );
      case 'archiviato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <Archive className="w-3 h-3 text-slate-500" />
            Archivio Storico
          </span>
        );
    }
  };

  const edizioneAttiva = archivio.find(e => e.id === edizioneAttivaId) || archivio[0];

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 pb-16">
      
      {/* HEADER DELLA DASHBOARD ARCHIVIO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-torna-dashboard-principale"
                onClick={onTornaDashboard}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold border border-slate-300 cursor-pointer"
                title="Torna al Pannello Generale Pro Loco"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard Pro Loco</span>
              </button>

              <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-xs">
                <Newspaper className="w-5 h-5 text-indigo-200" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Archivio Dati Uscite del Giornalino
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                    Periodico Ufficiale
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{config.nome}</span>
                  <span>•</span>
                  <span>Catalogazione storica per anno e data di uscita</span>
                  <span>•</span>
                  <span className="text-indigo-700 font-bold">
                    Fascicolo attivo in redazione: {edizioneAttiva?.numeroEdizione || 'Nessuno'}
                  </span>
                </p>
              </div>
            </div>

            {/* Pulsanti Rapidi Header */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-esporta-registro-csv"
                onClick={() => esportaRegistroGiornaliniCSV(archivio)}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Scarica il registro protocollo delle uscite in formato CSV / Excel"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Scarica Registro CSV</span>
              </button>

              <button
                type="button"
                id="btn-nuova-uscita-header"
                onClick={() => setMostraModaleNuova(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-800 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuova Uscita</span>
              </button>

              {edizioneAttiva && (
                <button
                  type="button"
                  id="btn-vai-all-editor-attivo"
                  onClick={() => onApriEditorSuEdizione(edizioneAttiva, 'studio')}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Apri l'uscita attualmente selezionata nello Studio Editor"
                >
                  <PenTool className="w-4 h-4 text-indigo-700" />
                  <span>Apri Studio Editor</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* BODY DELLA DASHBOARD */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* 1. BLOCCO STATISTICHE & PANORAMICA ARCHIVIO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Totale Uscite
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{stats.totaleUscite}</span>
              <span className="text-xs text-slate-500">fascicoli catalogati</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Dal 2024 al {annoCorrente}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {filtroAnno === 'tutti' ? `Anno ${annoCorrente}` : `Anno ${filtroAnno}`}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-700">{stats.usciteAnnoSelezionato}</span>
              <span className="text-xs text-slate-500">uscite registrate</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Nel periodo d'interesse
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Articoli Pubblicati
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">{stats.totaleArticoli}</span>
              <span className="text-xs text-slate-500">testi storicizzati</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Editoriali, rubriche & sagre
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Sponsor Inserzionisti
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700">{stats.totaleSponsor}</span>
              <span className="text-xs text-slate-500">spazi convenzionati</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              A sostegno delle spese di stampa
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pagine Totali Fascicoli
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-700">{stats.totalePagine}</span>
              <span className="text-xs text-slate-500">pagine A4 stampate</span>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Pronto per impaginazione e stampa
            </p>
          </div>

        </div>

        {/* 2. BARRA FILTRI & CATALOGAZIONE PER ANNO E DATA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            
            {/* Navigazione per Anno Sociale */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                Anno:
              </span>

              <button
                type="button"
                onClick={() => setFiltroAnno('tutti')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  filtroAnno === 'tutti'
                    ? 'bg-indigo-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Tutti gli Anni ({archivio.length})
              </button>

              {anniDisponibili.map(anno => (
                <button
                  key={anno}
                  type="button"
                  onClick={() => setFiltroAnno(anno)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    filtroAnno === anno
                      ? 'bg-indigo-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>Anno {anno}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filtroAnno === anno ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    {conteggioPerAnno[anno] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Vista Griglia vs Tabella */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVista('griglia')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    vista === 'griglia' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Visualizzazione a Griglia Fascicoli"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Griglia Fascicoli</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVista('tabella')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    vista === 'tabella' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Visualizzazione a Tabella Registro Dati"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tabella Dati</span>
                </button>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
            
            {/* Campo di Ricerca */}
            <div className="sm:col-span-6 lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                placeholder="Cerca per testata, numero, periodo, titolo articolo o autore..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition focus:outline-hidden"
              />
              {ricerca && (
                <button
                  type="button"
                  onClick={() => setRicerca('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro per Stato */}
            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value as any)}
                className="w-full py-2 px-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-700 transition focus:outline-hidden cursor-pointer"
              >
                <option value="tutti">Tutti gli stati di pubblicazione</option>
                <option value="pubblicato">Solo Pubblicati</option>
                <option value="in_stampa">In Stampa Tipografica</option>
                <option value="bozza">In Lavorazione / Bozza</option>
                <option value="archiviato">Archivio Storico</option>
              </select>
            </div>

            {/* Ordinamento */}
            <div className="sm:col-span-3 lg:col-span-4">
              <select
                value={ordinamento}
                onChange={(e) => setOrdinamento(e.target.value as any)}
                className="w-full py-2 px-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-700 transition focus:outline-hidden cursor-pointer"
              >
                <option value="data_desc">Ordina: Data di Uscita (Più recente prima)</option>
                <option value="data_asc">Ordina: Data di Uscita (Meno recente)</option>
                <option value="anno_desc">Ordina: Anno decrescente</option>
                <option value="titolo_asc">Ordina: Numero Edizione A-Z</option>
              </select>
            </div>

          </div>

        </div>

        {/* 3. ELENCO DELLE USCITE (GRIGLIA O TABELLA) */}
        {edizioniFiltrate.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200">
              <Archive className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Nessuna uscita trovata per i criteri selezionati
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Prova a modificare il filtro per anno, resettare la ricerca o creare una nuova uscita per arricchire l'archivio.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFiltroAnno('tutti');
                  setFiltroStato('tutti');
                  setRicerca('');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Azzera Filtri
              </button>
              <button
                type="button"
                onClick={() => setMostraModaleNuova(true)}
                className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crea Nuova Uscita</span>
              </button>
            </div>
          </div>
        ) : vista === 'griglia' ? (
          
          /* VISTA A GRIGLIA FASCICOLI */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {edizioniFiltrate.map((ed) => {
              const isAttiva = ed.id === edizioneAttivaId;
              const primoArticolo = ed.articoli?.[0];

              return (
                <div
                  key={ed.id}
                  className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md group relative ${
                    isAttiva 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200/90 hover:border-indigo-300'
                  }`}
                >
                  
                  {/* Badge Anno & Stato in alto */}
                  <div>
                    
                    {/* Header Scheda con Copertina e Badge */}
                    <div className="p-5 pb-3 border-b border-slate-100 space-y-3">
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-white shadow-2xs flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                            Anno {ed.anno}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {ed.dataUscita || ed.dataPubblicazione}
                          </span>
                        </div>
                        {getBadgeStato(ed.statoUscita)}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-900 transition-colors">
                            {ed.numeroEdizione}
                          </h3>
                          {isAttiva && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                              In Redazione
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                          {ed.periodo}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ed.testata}
                        </p>
                      </div>

                    </div>

                    {/* Dati Tecnici & Articoli del Fascicolo */}
                    <div className="p-5 space-y-3.5">
                      
                      {/* Metrichette veloci */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-2.5 border border-slate-200/80 text-center">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Pagine</span>
                          <span className="text-xs font-black text-slate-800">{ed.totalePagine || 4} A4</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Articoli</span>
                          <span className="text-xs font-black text-slate-800">{(ed.articoli || []).length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Sponsor</span>
                          <span className="text-xs font-black text-slate-800">{(ed.sponsor || []).length}</span>
                        </div>
                      </div>

                      {/* Articolo Principale o Note */}
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                          Contenuti Chiave:
                        </span>
                        {primoArticolo ? (
                          <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-left space-y-0.5">
                            <span className="text-[9.5px] font-bold text-indigo-800 uppercase block">
                              {primoArticolo.sezione.replace('_', ' ')} • {primoArticolo.autore}
                            </span>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">
                              {primoArticolo.titolo}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {primoArticolo.contenuto}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Nessun articolo ancora inserito in questa bozza.
                          </p>
                        )}
                      </div>

                      {/* Dati Tiratura e Protocollo */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Tiratura: <strong>{ed.tiratura || '1.500 copie'}</strong></span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {ed.protocolloStampa || `PROT-${ed.anno}`}
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* BARRA AZIONI USCITA (Visione, Vai al Giornalino, ecc.) */}
                  <div className="p-5 pt-0 space-y-2">
                    
                    {/* TASTI PRIMARI: VISIONE, APRI GIORNALINO & INVIO USCITA AI SOCI */}
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Pulsante di Visione ("pulsante di visione, ecc.") */}
                      <button
                        type="button"
                        id={`btn-visione-${ed.id}`}
                        onClick={() => {
                          setEdizioneInVisione(ed);
                          setPaginaVisioneSelezionata(1);
                        }}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer shadow-2xs"
                        title="Visualizza in anteprima il fascicolo completo, leggi gli articoli e sfoglia le pagine"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Visione</span>
                      </button>

                      {/* Pulsante per andare sul giornalino prescelto ("poi da li si va sul giornalino pre scelto") */}
                      <button
                        type="button"
                        id={`btn-apri-giornalino-${ed.id}`}
                        onClick={() => onApriEditorSuEdizione(ed, 'studio')}
                        className="py-2.5 px-3 bg-indigo-900 hover:bg-indigo-800 active:bg-black text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        title="Seleziona questa uscita ed entra direttamente nello Studio Editor DTP"
                      >
                        <PenTool className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Apri Fascicolo</span>
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-300" />
                      </button>

                    </div>

                    {/* PULSANTE INVIO PER OGNI USCITA (INVIO MASSIVO PER SOCIO CON RIFERIMENTO NUMERO TESSERA -> PORTALE SOCI / APK COMUNICAZIONI) */}
                    {(() => {
                      const inviatePerQuestaUscita = comunicazioniInviate.filter(
                        c => c.categoria === 'giornalino' && c.edizioneGiornalinoId === ed.id
                      ).length;
                      return (
                        <button
                          type="button"
                          id={`btn-invio-uscita-${ed.id}`}
                          onClick={() => apriModaleInvioUscita(ed)}
                          className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                          title="Invia questa uscita (invio massivo o singolo per Numero Tessera) nella sezione Comunicazioni del Portale Web Soci / File APK"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Invia Uscita ai Soci (Tessera &amp; APK)</span>
                          {inviatePerQuestaUscita > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-900">
                              {inviatePerQuestaUscita} tessere
                            </span>
                          )}
                        </button>
                      );
                    })()}

                    {/* AZIONI ACCESSORIE (Modifica Dati, Duplica, Elimina) */}
                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 text-xs">
                      
                      <button
                        type="button"
                        onClick={() => setEdizioneInModifica(ed)}
                        className="text-slate-500 hover:text-indigo-900 font-medium flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Modifica anno, data, numero, stato e tiratura di questa uscita"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifica dati</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicaUscita(ed)}
                        className="text-slate-500 hover:text-indigo-900 font-medium flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Crea una nuova uscita duplicando la testata, articoli e sponsor di questo fascicolo"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminaUscita(ed.id, ed.numeroEdizione)}
                        className="text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        title="Elimina questo giornalino dall'archivio storico e aggiorna l'APK"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Elimina Giornalino</span>
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        ) : (

          /* VISTA A TABELLA REGISTRO PROTOCOLLO */
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Anno & Data Uscita</th>
                    <th className="py-3 px-4">Edizione & Periodo</th>
                    <th className="py-3 px-4">Testata</th>
                    <th className="py-3 px-4">Stato</th>
                    <th className="py-3 px-4 text-center">Pagine / Articoli</th>
                    <th className="py-3 px-4">Tiratura</th>
                    <th className="py-3 px-4 text-right">Azioni Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {edizioniFiltrate.map(ed => {
                    const isAttiva = ed.id === edizioneAttivaId;
                    return (
                      <tr 
                        key={ed.id} 
                        className={`hover:bg-indigo-50/40 transition ${isAttiva ? 'bg-indigo-50/60 font-semibold' : ''}`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-black bg-slate-800 text-white text-[11px]">
                              {ed.anno}
                            </span>
                            <span className="font-bold text-slate-900">
                              {ed.dataUscita || ed.dataPubblicazione}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ed.protocolloStampa || '-'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{ed.numeroEdizione}</span>
                            {isAttiva && (
                              <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Attiva
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-indigo-700 block">
                            {ed.periodo}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{ed.testata}</span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getBadgeStato(ed.statoUscita)}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="font-bold text-slate-800">{ed.totalePagine || 4} pag.</span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span>{(ed.articoli || []).length} art.</span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {ed.tiratura || '1.500 copie'}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEdizioneInVisione(ed);
                              setPaginaVisioneSelezionata(1);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center gap-1 font-bold cursor-pointer"
                            title="Visione Fascicolo"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Visione</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => apriModaleInvioUscita(ed)}
                            className="p-1.5 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition inline-flex items-center gap-1 font-bold shadow-2xs cursor-pointer"
                            title="Invia Uscita ai Soci per Numero Tessera sul Portale Web Soci / APK (Sezione Comunicazioni)"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Invio Soci</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onApriEditorSuEdizione(ed, 'studio')}
                            className="p-1.5 px-2.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white transition inline-flex items-center gap-1 font-bold shadow-2xs cursor-pointer"
                            title="Apri nel Giornalino per modificare"
                          >
                            <PenTool className="w-3.5 h-3.5 text-indigo-300" />
                            <span>Apri Uscita</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEdizioneInModifica(ed)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition inline-flex items-center cursor-pointer"
                            title="Modifica dati"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicaUscita(ed)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition inline-flex items-center cursor-pointer"
                            title="Duplica uscita"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminaUscita(ed.id, ed.numeroEdizione)}
                            className="p-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition inline-flex items-center gap-1 font-bold cursor-pointer"
                            title="Elimina Giornalino dall'Archivio e aggiorna APK"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Elimina</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        )}

      </main>

      {/* 4. MODALE DI VISIONE USCITA ("pulsante di visione, ecc.") */}
      {edizioneInVisione && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header Modale Visione */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black">
                      Visione Uscita: {edizioneInVisione.numeroEdizione}
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-indigo-800 text-indigo-200">
                      Anno {edizioneInVisione.anno}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {edizioneInVisione.periodo} • {edizioneInVisione.dataUscita || edizioneInVisione.dataPubblicazione} • {edizioneInVisione.testata}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ed = edizioneInVisione;
                    setEdizioneInVisione(null);
                    onApriEditorSuEdizione(ed, 'studio');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Apri nel Giornalino</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEdizioneInVisione(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenuto Modale Visione: Selettore Pagine e Visualizzatore Fascicolo */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              
              {/* Selettore Pagine del Fascicolo */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold text-slate-700">Sfoglia Pagine:</span>
                  <div className="flex items-center gap-1 ml-2">
                    {Array.from({ length: edizioneInVisione.totalePagine || 4 }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPaginaVisioneSelezionata(p)}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                          paginaVisioneSelezionata === p
                            ? 'bg-indigo-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p === 1 ? 'Copertina (Pag. 1)' : p === (edizioneInVisione.totalePagine || 4) ? `Retro (Pag. ${p})` : `Pagina ${p}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Tiratura: <strong>{edizioneInVisione.tiratura || '1.500 copie'}</strong></span>
                  <span>•</span>
                  <span>Stato: <strong>{edizioneInVisione.statoUscita.toUpperCase()}</strong></span>
                </div>
              </div>

              {/* Foglio A4 Simulata di Anteprima della Pagina Selezionata */}
              <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-md max-w-2xl mx-auto min-h-[500px] flex flex-col justify-between space-y-6">
                
                {/* Testata Giornalistica (Se Pagina 1) */}
                {paginaVisioneSelezionata === 1 && (
                  <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-300 pb-1 mb-2">
                      <span>{edizioneInVisione.numeroEdizione}</span>
                      <span>{edizioneInVisione.periodo}</span>
                      <span>{edizioneInVisione.dataUscita || edizioneInVisione.dataPubblicazione}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight font-serif uppercase">
                      {edizioneInVisione.testata}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 italic">
                      {edizioneInVisione.sottotitoloTestata}
                    </p>
                    {edizioneInVisione.motto && (
                      <p className="text-[11px] text-slate-400">
                        "{edizioneInVisione.motto}"
                      </p>
                    )}
                  </div>
                )}

                {/* Running Header (Se Pagine Interne) */}
                {paginaVisioneSelezionata > 1 && (
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-300 pb-2">
                    <span>{edizioneInVisione.testata} • {edizioneInVisione.periodo}</span>
                    <span>Pagina {paginaVisioneSelezionata}</span>
                  </div>
                )}

                {/* Articoli assegnati a questa pagina */}
                <div className="space-y-6 flex-1">
                  {(() => {
                    const articoliPagina = (edizioneInVisione.articoli || []).filter(
                      a => (a.pagina || 1) === paginaVisioneSelezionata
                    );

                    if (articoliPagina.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 italic text-xs">
                          Nessun articolo assegnato alla pagina {paginaVisioneSelezionata} in questo fascicolo.
                        </div>
                      );
                    }

                    return articoliPagina.map(art => (
                      <article key={art.id} className="space-y-2 border-b border-slate-100 pb-4 last:border-0">
                        {art.occhiello && (
                          <span className="text-[10px] font-black text-indigo-900 tracking-wider uppercase block">
                            {art.occhiello}
                          </span>
                        )}
                        <h4 className="text-lg font-black text-slate-900 leading-tight font-serif">
                          {art.titolo}
                        </h4>
                        {art.sottotitolo && (
                          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                            {art.sottotitolo}
                          </p>
                        )}
                        <div className="text-[10.5px] text-slate-400 flex items-center gap-2">
                          <span>A cura di: <strong>{art.autore}</strong></span>
                          <span>•</span>
                          <span>{art.sezione.replace('_', ' ').toUpperCase()}</span>
                        </div>

                        {art.immagine && (
                          <div className="my-2 rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={art.immagine}
                              alt={art.titolo}
                              referrerPolicy="no-referrer"
                              className="w-full h-44 object-cover"
                            />
                            {art.didascaliaImmagine && (
                              <p className="text-[10px] text-slate-500 p-1.5 bg-slate-50 italic">
                                {art.didascaliaImmagine}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-line font-serif">
                          {art.contenuto}
                        </p>
                      </article>
                    ));
                  })()}
                </div>

                {/* Box Sponsor Inserzionisti (Se presenti nella pagina) */}
                {(() => {
                  const sponsorPagina = (edizioneInVisione.sponsor || []).filter(
                    s => (s.pagina || 4) === paginaVisioneSelezionata
                  );
                  if (sponsorPagina.length === 0) return null;

                  return (
                    <div className="border-t-2 border-slate-300 pt-3 space-y-2">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                        Spazio Inserzionisti & Sostenitori
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {sponsorPagina.map(sp => (
                          <div key={sp.id} className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                            <span className="font-black text-slate-900 block text-[11px]">{sp.nome}</span>
                            <p className="text-[10px] text-slate-600 italic line-clamp-1">{sp.slogan}</p>
                            <p className="text-[9.5px] text-slate-500 mt-0.5">{sp.indirizzo} • Tel. {sp.telefono}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Piè di Pagina */}
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{edizioneInVisione.direttoreResponsabile}</span>
                  <span className="font-bold text-slate-700">Pagina {paginaVisioneSelezionata} di {edizioneInVisione.totalePagine || 4}</span>
                </div>

              </div>

            </div>

            {/* Footer Modale Visione */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEdizioneInVisione(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Chiudi Visione
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ed = edizioneInVisione;
                    setEdizioneInVisione(null);
                    apriModaleInvioUscita(ed);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>Invia Uscita ai Soci (Tessera / APK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ed = edizioneInVisione;
                    setEdizioneInVisione(null);
                    onApriEditorSuEdizione(ed, 'studio');
                  }}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PenTool className="w-4 h-4 text-indigo-200" />
                  <span>Vai al Giornalino Pre-scelto</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODALE CREAZIONE NUOVA USCITA */}
      {mostraModaleNuova && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Crea Nuova Uscita del Giornalino
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inserisci i dati per catalogare la nuova pubblicazione
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostraModaleNuova(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreaNuovaUscita} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Anno Sociale *
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    required
                    value={nuovaUscitaForm.anno}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setNuovaUscitaForm({
                        ...nuovaUscitaForm,
                        anno: val,
                        periodo: `Edizione Autunno ${val}`
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data di Uscita Prevista *
                  </label>
                  <input
                    type="date"
                    required
                    value={nuovaUscitaForm.dataUscita}
                    onChange={(e) => setNuovaUscitaForm({ ...nuovaUscitaForm, dataUscita: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Numero Edizione *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuovaUscitaForm.numeroEdizione}
                    onChange={(e) => setNuovaUscitaForm({ ...nuovaUscitaForm, numeroEdizione: e.target.value })}
                    placeholder="Es. Anno XXV - N. 2"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Periodo / Stagione *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuovaUscitaForm.periodo}
                    onChange={(e) => setNuovaUscitaForm({ ...nuovaUscitaForm, periodo: e.target.value })}
                    placeholder="Es. Edizione Autunno - Inverno"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pagine Fascicolo
                  </label>
                  <select
                    value={nuovaUscitaForm.totalePagine}
                    onChange={(e) => setNuovaUscitaForm({ ...nuovaUscitaForm, totalePagine: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800 font-bold cursor-pointer"
                  >
                    <option value={4}>4 Pagine (Standard A4 piegato)</option>
                    <option value={8}>8 Pagine (Doppio foglio spillato)</option>
                    <option value={2}>2 Pagine (Foglio fronte/retro)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stato Iniziale
                  </label>
                  <select
                    value={nuovaUscitaForm.statoUscita}
                    onChange={(e) => setNuovaUscitaForm({ ...nuovaUscitaForm, statoUscita: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="bozza">In Bozza / Lavorazione</option>
                    <option value="in_stampa">In Stampa Tipografica</option>
                    <option value="pubblicato">Già Pubblicato</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Copia Struttura da Uscita Precedente (Facoltativo)
                </label>
                <select
                  value={nuovaUscitaForm.copiaDaId}
                  onChange={(e) => setNuovaUscitaForm({ ...nuovaUscitaForm, copiaDaId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800 cursor-pointer"
                >
                  <option value="">-- Nessuna copia (Parti da fascicolo pulito) --</option>
                  {archivio.map(ed => (
                    <option key={ed.id} value={ed.id}>
                      Copia da: {ed.numeroEdizione} ({ed.anno} - {ed.periodo})
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Selezionando un'uscita precedente copierai impostazioni di testata, articoli e sponsor.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostraModaleNuova(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-black transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea & Cataloga Uscita</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. MODALE MODIFICA METADATI USCITA */}
      {edizioneInModifica && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Modifica Metadati Uscita
                  </h3>
                  <p className="text-xs text-slate-500">
                    {edizioneInModifica.numeroEdizione} • {edizioneInModifica.testata}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEdizioneInModifica(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvaModificaMetadati} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Anno Sociale *
                  </label>
                  <input
                    type="number"
                    required
                    value={edizioneInModifica.anno}
                    onChange={(e) => setEdizioneInModifica({ ...edizioneInModifica, anno: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data di Uscita *
                  </label>
                  <input
                    type="text"
                    required
                    value={edizioneInModifica.dataUscita || edizioneInModifica.dataPubblicazione}
                    onChange={(e) => setEdizioneInModifica({ 
                      ...edizioneInModifica, 
                      dataUscita: e.target.value,
                      dataPubblicazione: e.target.value 
                    })}
                    placeholder="Es. 15 Maggio 2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Numero Edizione *
                  </label>
                  <input
                    type="text"
                    required
                    value={edizioneInModifica.numeroEdizione}
                    onChange={(e) => setEdizioneInModifica({ ...edizioneInModifica, numeroEdizione: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Periodo *
                  </label>
                  <input
                    type="text"
                    required
                    value={edizioneInModifica.periodo}
                    onChange={(e) => setEdizioneInModifica({ ...edizioneInModifica, periodo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stato Uscita
                  </label>
                  <select
                    value={edizioneInModifica.statoUscita}
                    onChange={(e) => setEdizioneInModifica({ ...edizioneInModifica, statoUscita: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800 font-bold cursor-pointer"
                  >
                    <option value="bozza">In Bozza / Lavorazione</option>
                    <option value="in_stampa">In Stampa Tipografica</option>
                    <option value="pubblicato">Pubblicato & Distribuito</option>
                    <option value="archiviato">Archivio Storico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiratura Copie
                  </label>
                  <input
                    type="text"
                    value={edizioneInModifica.tiratura || ''}
                    onChange={(e) => setEdizioneInModifica({ ...edizioneInModifica, tiratura: e.target.value })}
                    placeholder="Es. 1.800 copie"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Note di Redazione / Appunti Interni
                </label>
                <textarea
                  rows={3}
                  value={edizioneInModifica.noteRedazione || ''}
                  onChange={(e) => setEdizioneInModifica({ ...edizioneInModifica, noteRedazione: e.target.value })}
                  placeholder="Note del comitato redazionale, argomenti trattati o informazioni sulla distribuzione..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEdizioneInModifica(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-black transition shadow-xs cursor-pointer"
                >
                  Salva Modifiche
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 7. MODALE INVIO USCITA & INVIO MASSIVO PER OGNI SOCIO (RIFERIMENTO NUMERO TESSERA -> PORTALE WEB SOCI / FILE APK SEZIONE COMUNICAZIONI) */}
      {edizioneInInvio && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header Modale Invio Massivo / per Tessera */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between gap-3 border-b border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black">
                      Invio Uscita ai Soci • {edizioneInInvio.numeroEdizione}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      Portale Web Soci &amp; File APK (Sezione Comunicazioni)
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Invio massivo o singolo con riferimento al <strong>Numero della Tessera</strong> di ogni socio • {edizioneInInvio.testata} ({edizioneInInvio.periodo})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEdizioneInInvio(null)}
                className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo Modale Invio */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50 text-xs">
              
              {/* Notifica di conferma invio */}
              {esitoInvioMassivo && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-sm text-emerald-900">
                        Uscita &quot;{esitoInvioMassivo.edizioneNumero}&quot; inviata con successo a {esitoInvioMassivo.inviateCount} {esitoInvioMassivo.inviateCount === 1 ? 'socio' : 'soci'}!
                      </p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Il fascicolo completo è ora visibile e sfogliabile sul <strong>Portale Web Soci</strong> e nell&apos;applicazione <strong>File .APK</strong> dentro la scheda <strong>&quot;Comunicazioni Dedicate&quot;</strong> associata a ciascun Numero di Tessera (ore {esitoInvioMassivo.timestamp}).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Riepilogo Uscita e Pulsante Principale Invio Massivo a Tutti i Soci */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-black text-[10.5px]">
                        Anno {edizioneInInvio.anno}
                      </span>
                      <span className="font-bold text-slate-500">
                        {edizioneInInvio.dataUscita || edizioneInInvio.dataPubblicazione}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-800">
                        {edizioneInInvio.totalePagine || 4} Pagine A4 ({(edizioneInInvio.articoli || []).length} articoli)
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">
                      {edizioneInInvio.testata} — {edizioneInInvio.numeroEdizione} ({edizioneInInvio.periodo})
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        Destinazione: <strong>Portale Web Soci del File .APK &rarr; Sezione Comunicazioni</strong> ({getPublicPortalOrigin()})
                      </span>
                    </p>
                  </div>

                  {/* Pulsante 1-Click: Invio Massivo per Ogni Socio (Tutti i Numeri Tessera) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="btn-invio-massivo-tutti-soci"
                      onClick={() => handleInviaUscitaMassivoOSingolo(elencoSociAttivi)}
                      className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-2xl font-black text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-emerald-200" />
                      <span>Invio Massivo a Tutti i Soci ({elencoSociAttivi.length} Tessere)</span>
                    </button>
                  </div>
                </div>

                {/* Nota di accompagnamento personalizzabile */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Messaggio di accompagnamento nella sezione Comunicazioni del Socio:
                  </label>
                  <textarea
                    rows={2}
                    value={notaInvioGiornalino}
                    onChange={e => setNotaInvioGiornalino(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                    placeholder="Messaggio per i soci..."
                  />
                </div>
              </div>

              {/* Tabella Soci con riferimento al Numero della Tessera (Selezione multipla o Invio singolo per Tessera) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span className="font-black text-slate-900">
                      Elenco Soci Destinatari per Numero di Tessera ({tessereSelezionate.length} selezionati su {elencoSociAttivi.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={ricercaSocioInvio}
                        onChange={e => setRicercaSocioInvio(e.target.value)}
                        placeholder="Cerca Numero Tessera o Socio..."
                        className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (tessereSelezionate.length === elencoSociAttivi.length) {
                          setTessereSelezionate([]);
                        } else {
                          setTessereSelezionate(
                            elencoSociAttivi.map(s => (s.numeroTessera || '').trim().toUpperCase()).filter(Boolean)
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-[11px] cursor-pointer"
                    >
                      {tessereSelezionate.length === elencoSociAttivi.length ? 'Deseleziona Tutti' : 'Seleziona Tutte le Tessere'}
                    </button>

                    <button
                      type="button"
                      disabled={tessereSelezionate.length === 0}
                      onClick={() => {
                        const setSel = new Set(tessereSelezionate);
                        const sociTarget = elencoSociAttivi.filter(s =>
                          setSel.has((s.numeroTessera || '').trim().toUpperCase())
                        );
                        handleInviaUscitaMassivoOSingolo(sociTarget);
                      }}
                      className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-40 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Invia alle Tessere Selezionate ({tessereSelezionate.length})</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {elencoSociAttivi
                    .filter(s => {
                      if (!ricercaSocioInvio.trim()) return true;
                      const q = ricercaSocioInvio.toLowerCase();
                      return (
                        (s.numeroTessera || '').toLowerCase().includes(q) ||
                        (s.nome || '').toLowerCase().includes(q) ||
                        (s.cognome || '').toLowerCase().includes(q) ||
                        (s.codiceFiscale || '').toLowerCase().includes(q)
                      );
                    })
                    .map(socio => {
                      const tesseraUpper = (socio.numeroTessera || '').trim().toUpperCase();
                      const isSelezionato = tessereSelezionate.includes(tesseraUpper);
                      const giaInviato = comunicazioniInviate.some(
                        c =>
                          c.categoria === 'giornalino' &&
                          c.edizioneGiornalinoId === edizioneInInvio.id &&
                          (c.numeroTesseraRiferimento || '').trim().toUpperCase() === tesseraUpper
                      );

                      return (
                        <div
                          key={socio.id}
                          className={`px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition ${
                            isSelezionato ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelezionato}
                              onChange={() => {
                                setTessereSelezionate(prev =>
                                  prev.includes(tesseraUpper)
                                    ? prev.filter(t => t !== tesseraUpper)
                                    : [...prev, tesseraUpper]
                                );
                              }}
                              className="w-4 h-4 rounded text-emerald-700 cursor-pointer"
                            />
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-mono font-black text-xs border border-emerald-300 shrink-0">
                              Tessera N° {tesseraUpper}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-slate-900">
                                {socio.cognome} {socio.nome}
                              </span>
                              <span className="text-slate-400 mx-1.5">•</span>
                              <span className="text-[11px] text-slate-500">
                                {socio.categoria} {socio.pin ? `(PIN: ${socio.pin})` : ''}
                              </span>
                            </div>
                          </label>

                          <div className="flex items-center gap-2 shrink-0">
                            {giaInviato && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Inviato su APK/Portale</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleInviaUscitaMassivoOSingolo([socio])}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title={`Invia questa uscita alla Tessera ${tesseraUpper} nella sezione Comunicazioni del Portale Soci / APK`}
                            >
                              <Send className="w-3 h-3 text-emerald-700" />
                              <span>{giaInviato ? 'Re-invia a Tessera' : 'Invia a Tessera'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>

            {/* Footer Modale Invio */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Bell className="w-4 h-4 text-emerald-700" />
                <span>
                  Ogni socio riceve l&apos;uscita direttamente nella scheda <strong>Comunicazioni</strong> del proprio Portale Web / File .APK filtrata per <strong>Numero Tessera</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEdizioneInInvio(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Chiudi
                </button>
                <button
                  type="button"
                  onClick={() => handleInviaUscitaMassivoOSingolo(elencoSociAttivi)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invio Massivo a Tutti ({elencoSociAttivi.length} Soci)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODALE CONFERMA ELIMINA GIORNALINO DALL'ARCHIVIO */}
      {edizioneDaEliminare && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black">Elimina Giornalino dall&apos;Archivio</h3>
              </div>
              <button
                type="button"
                onClick={() => setEdizioneDaEliminare(null)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Confermi di voler eliminare definitivamente il giornalino <strong>{edizioneDaEliminare.numeroEdizione}</strong> ({edizioneDaEliminare.periodo})?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                L&apos;uscita verrà rimossa dall&apos;<strong>Archivio Edizioni</strong> e sincronizzata immediatamente con il <strong>File APK Android</strong> e il Portale Soci.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEdizioneDaEliminare(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaEliminaUscita}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina Giornalino</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
