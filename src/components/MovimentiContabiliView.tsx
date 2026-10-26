import React, { useState, useMemo, useEffect } from 'react';
import { MovimentoContabile, TipoMovimentoContabile, Socio, ProLocoEvento, DonazioneTerzi, ProLocoInfo } from '../types';
import { 
  loadMovimentiContabili, 
  saveMovimentiContabili, 
  cancellaMovimentoContabile,
  cancellaMultipliMovimentiContabili,
  esportaMovimentiContabiliCSV 
} from '../storage';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Layers,
  Check,
  X,
  PieChart as PieChartIcon,
  CheckSquare,
  Square
} from 'lucide-react';

interface MovimentiContabiliViewProps {
  annoSelezionato: number;
  config: ProLocoInfo;
  soci?: Socio[];
  eventi?: ProLocoEvento[];
  donazioni?: DonazioneTerzi[];
  movimenti?: MovimentoContabile[];
  onMovimentiChange?: (nuovi: MovimentoContabile[]) => void;
}

export const CATEGORIE_ENTRATE = [
  { id: 'quote_associative', label: 'Quote Associative & Tesseramento' },
  { id: 'donazioni_liberalita', label: 'Donazioni & Erogazioni Liberali (Art. 83 CTS)' },
  { id: 'contributi_pubblici', label: 'Contributi Pubblici (Comune, Regione, UNPLI)' },
  { id: 'sponsor_partner', label: 'Sponsorizzazioni & Partner Commerciali' },
  { id: 'proventi_eventi', label: 'Proventi da Sagre & Manifestazioni' },
  { id: 'altre_entrate', label: 'Altre Entrate & Rimborsi Attivi' }
];

export const CATEGORIE_USCITE = [
  { id: 'spese_eventi', label: 'Spese Organizzazione Eventi, SIAE & Permessi' },
  { id: 'materiali_attrezzature', label: 'Materiali, Provviste Stand & Attrezzature' },
  { id: 'affitti_locali', label: 'Affitti Sede, Spazi Pubblici & Strutture' },
  { id: 'utenze_sede', label: 'Utenze Sede (Luce, Gas, Acqua, Connettività)' },
  { id: 'assicurazioni', label: 'Polizze Assicurative (Responsabilità Civile & Volontari)' },
  { id: 'cancelleria_tipografia', label: 'Tipografia, Manifesti, Depliant & Cancelleria' },
  { id: 'servizi_consulenze', label: 'Servizi Tecnici, Audio/Luci & Consulenze' },
  { id: 'rimborsi_volontari', label: 'Rimborsi Spese Documentati Volontari' },
  { id: 'altre_uscite', label: 'Altre Spese di Gestione' }
];

export const METODI_PAGAMENTO = [
  'Contanti',
  'Bonifico Bancario',
  'POS / Carta di Debito/Credito',
  'Assegno Bancario',
  'Altro'
];

export const MovimentiContabiliView: React.FC<MovimentiContabiliViewProps> = ({
  annoSelezionato,
  config,
  soci = [],
  eventi = [],
  donazioni = [],
  movimenti: movimentiProp,
  onMovimentiChange
}) => {
  const [movimenti, setMovimenti] = useState<MovimentoContabile[]>(() => {
    if (movimentiProp && movimentiProp.length > 0) return movimentiProp;
    return loadMovimentiContabili();
  });

  // Mantieni sincronizzato lo stato locale se i props esterni cambiano
  React.useEffect(() => {
    if (movimentiProp) {
      setMovimenti(movimentiProp);
    }
  }, [movimentiProp]);

  const [filtroTipo, setFiltroTipo] = useState<'tutti' | 'entrata' | 'uscita'>('tutti');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('tutte');
  const [ricercaTesto, setRicercaTesto] = useState<string>('');
  const [filtroAnno, setFiltroAnno] = useState<number | 'tutti'>(annoSelezionato);

  // Modale inserimento / modifica
  const [modalAperta, setModalAperta] = useState(false);
  const [movimentoInModifica, setMovimentoInModifica] = useState<MovimentoContabile | null>(null);
  const [tipoNuovo, setTipoNuovo] = useState<TipoMovimentoContabile>('entrata');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formDescrizione, setFormDescrizione] = useState('');
  const [formImporto, setFormImporto] = useState<string>('');
  const [formCategoria, setFormCategoria] = useState<string>('quote_associative');
  const [formMetodo, setFormMetodo] = useState<string>('Bonifico Bancario');
  const [formNote, setFormNote] = useState<string>('');
  const [formErrore, setFormErrore] = useState<string | null>(null);

  // Feedback notifica
  const [notifica, setNotifica] = useState<{ tipo: 'success' | 'info'; testo: string } | null>(null);
  const mostraNotifica = (tipo: 'success' | 'info', testo: string) => {
    setNotifica({ tipo, testo });
    setTimeout(() => setNotifica(null), 4000);
  };

  // Stato eliminazione singola con modale dedicata e audit log
  const [movimentoDaEliminare, setMovimentoDaEliminare] = useState<MovimentoContabile | null>(null);
  const [motivoEliminazione, setMotivoEliminazione] = useState<string>('Rettifica contabile / errata registrazione');
  const [isEliminazioneInCorso, setIsEliminazioneInCorso] = useState(false);

  // Stato selezione multipla e cancellazione massiva
  const [selezionatiIds, setSelezionatiIds] = useState<string[]>([]);
  const [mostraConfermaMultipla, setMostraConfermaMultipla] = useState(false);

  // Ascolto in tempo reale degli eventi di sincronizzazione storage
  useEffect(() => {
    const handleSync = () => {
      const aggiornati = loadMovimentiContabili();
      setMovimenti(aggiornati);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('proloco_movimenti_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('proloco_movimenti_updated', handleSync);
    };
  }, []);

  // Anni disponibili
  const anniDisponibili = useMemo(() => {
    const set = new Set<number>([annoSelezionato, new Date().getFullYear(), new Date().getFullYear() - 1]);
    movimenti.forEach(m => {
      if (m.anno) set.add(m.anno);
      const year = parseInt((m.data || '').substring(0, 4), 10);
      if (!isNaN(year)) set.add(year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [movimenti, annoSelezionato]);

  // Movimenti filtrati
  const movimentiFiltrati = useMemo(() => {
    return movimenti
      .filter(m => {
        // Filtro anno
        if (filtroAnno !== 'tutti') {
          const year = m.anno || parseInt((m.data || '').substring(0, 4), 10);
          if (year !== filtroAnno) return false;
        }
        // Filtro tipo
        if (filtroTipo !== 'tutti' && m.tipo !== filtroTipo) return false;
        // Filtro categoria
        if (filtroCategoria !== 'tutte' && m.categoria !== filtroCategoria) return false;
        // Ricerca testuale
        if (ricercaTesto.trim()) {
          const q = ricercaTesto.toLowerCase();
          const matchDesc = (m.descrizione || '').toLowerCase().includes(q);
          const matchNote = (m.note || '').toLowerCase().includes(q);
          const matchMetodo = (m.metodoPagamento || '').toLowerCase().includes(q);
          if (!matchDesc && !matchNote && !matchMetodo) return false;
        }
        return true;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [movimenti, filtroAnno, filtroTipo, filtroCategoria, ricercaTesto]);

  // Statistiche e totali
  const metriche = useMemo(() => {
    const listAnno = movimenti.filter(m => {
      if (filtroAnno === 'tutti') return true;
      const year = m.anno || parseInt((m.data || '').substring(0, 4), 10);
      return year === filtroAnno;
    });

    let totaleEntrate = 0;
    let totaleUscite = 0;
    let entrateQuote = 0;
    let entrateDonazioni = 0;
    let usciteMateriali = 0;
    let usciteEventi = 0;

    listAnno.forEach(m => {
      const imp = Number(m.importo) || 0;
      if (m.tipo === 'entrata') {
        totaleEntrate += imp;
        if (m.categoria === 'quote_associative') entrateQuote += imp;
        if (m.categoria === 'donazioni_liberalita') entrateDonazioni += imp;
      } else {
        totaleUscite += imp;
        if (m.categoria === 'materiali_attrezzature') usciteMateriali += imp;
        if (m.categoria === 'spese_eventi') usciteEventi += imp;
      }
    });

    const saldoNetto = totaleEntrate - totaleUscite;
    return {
      totaleEntrate,
      totaleUscite,
      saldoNetto,
      conteggio: listAnno.length,
      entrateQuote,
      entrateDonazioni,
      usciteMateriali,
      usciteEventi
    };
  }, [movimenti, filtroAnno]);

  // Calcolo saldo progressivo per la tabella
  const movimentiConSaldo = useMemo(() => {
    // Ordine cronologico per saldo progressivo
    const crono = [...movimentiFiltrati].reverse();
    let accumulo = 0;
    const mapSaldo = new Map<string, number>();
    crono.forEach(m => {
      const imp = Number(m.importo) || 0;
      accumulo += m.tipo === 'entrata' ? imp : -imp;
      mapSaldo.set(m.id, accumulo);
    });

    return movimentiFiltrati.map(m => ({
      ...m,
      saldoProgressivo: mapSaldo.get(m.id) ?? 0
    }));
  }, [movimentiFiltrati]);

  // Apertura modale nuovo
  const handleApriNuovo = (tipo: TipoMovimentoContabile) => {
    setMovimentoInModifica(null);
    setTipoNuovo(tipo);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDescrizione('');
    setFormImporto('');
    setFormCategoria(tipo === 'entrata' ? 'quote_associative' : 'materiali_attrezzature');
    setFormMetodo('Bonifico Bancario');
    setFormNote('');
    setFormErrore(null);
    setModalAperta(true);
  };

  // Apertura modale modifica
  const handleApriModifica = (mov: MovimentoContabile) => {
    setMovimentoInModifica(mov);
    setTipoNuovo(mov.tipo);
    setFormDate(mov.data);
    setFormDescrizione(mov.descrizione);
    setFormImporto(mov.importo.toString());
    setFormCategoria(mov.categoria);
    setFormMetodo(mov.metodoPagamento || 'Bonifico Bancario');
    setFormNote(mov.note || '');
    setFormErrore(null);
    setModalAperta(true);
  };

  // Salvataggio form
  const handleSalvaForm = (e: React.FormEvent) => {
    e.preventDefault();
    const impNum = parseFloat(formImporto.replace(',', '.'));
    if (!formDescrizione.trim()) {
      setFormErrore('Inserisci una descrizione chiara per il movimento.');
      return;
    }
    if (isNaN(impNum) || impNum <= 0) {
      setFormErrore('Inserisci un importo valido e maggiore di zero (€).');
      return;
    }

    const annoMov = parseInt(formDate.substring(0, 4), 10) || annoSelezionato;
    const now = Date.now();

    if (movimentoInModifica) {
      const aggiornato: MovimentoContabile = {
        ...movimentoInModifica,
        data: formDate,
        tipo: tipoNuovo,
        descrizione: formDescrizione.trim(),
        importo: impNum,
        categoria: formCategoria,
        metodoPagamento: formMetodo,
        note: formNote.trim(),
        anno: annoMov,
        updatedAt: now
      };
      const nuovaLista = movimenti.map(m => m.id === aggiornato.id ? aggiornato : m);
      setMovimenti(nuovaLista);
      saveMovimentiContabili(nuovaLista);
      onMovimentiChange?.(nuovaLista);
      mostraNotifica('success', 'Registrazione contabile aggiornata con successo!');
    } else {
      const nuovo: MovimentoContabile = {
        id: `mov-${now}-${Math.random().toString(36).substring(2, 6)}`,
        data: formDate,
        tipo: tipoNuovo,
        descrizione: formDescrizione.trim(),
        importo: impNum,
        categoria: formCategoria,
        metodoPagamento: formMetodo,
        note: formNote.trim(),
        anno: annoMov,
        createdAt: now,
        updatedAt: now
      };
      const nuovaLista = [nuovo, ...movimenti];
      setMovimenti(nuovaLista);
      saveMovimentiContabili(nuovaLista);
      onMovimentiChange?.(nuovaLista);
      mostraNotifica('success', `${tipoNuovo === 'entrata' ? 'Entrata' : 'Uscita'} registrata con successo!`);
    }

    setModalAperta(false);
  };

  // Gestione Eliminazione Singola
  const handleAvviaElimina = (m: MovimentoContabile) => {
    setMovimentoDaEliminare(m);
    setMotivoEliminazione('Rettifica contabile / errata registrazione');
  };

  const handleConfermaElimina = () => {
    if (!movimentoDaEliminare) return;
    setIsEliminazioneInCorso(true);
    const id = movimentoDaEliminare.id;
    const desc = movimentoDaEliminare.descrizione;
    const nuovaLista = cancellaMovimentoContabile(
      id,
      motivoEliminazione || 'Rettifica contabile / errata registrazione',
      'Tesoreria / Amministrazione'
    );
    setMovimenti(nuovaLista);
    onMovimentiChange?.(nuovaLista);
    setSelezionatiIds(prev => prev.filter(item => item !== id));
    mostraNotifica('info', `Registrazione "${desc}" archiviata nel Cestino di Sistema.`);
    setMovimentoDaEliminare(null);
    setIsEliminazioneInCorso(false);
  };

  // Selezione Singola / Multipla
  const toggleSelezione = (id: string) => {
    setSelezionatiIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selezionaTuttiVisibili = () => {
    const idsVisibili = movimentiFiltrati.map(m => m.id);
    const tuttiSelezionati = idsVisibili.length > 0 && idsVisibili.every(id => selezionatiIds.includes(id));
    if (tuttiSelezionati) {
      setSelezionatiIds(prev => prev.filter(id => !idsVisibili.includes(id)));
    } else {
      const unione = Array.from(new Set([...selezionatiIds, ...idsVisibili]));
      setSelezionatiIds(unione);
    }
  };

  // Conferma Eliminazione Massiva
  const handleConfermaEliminazioneMassiva = () => {
    if (selezionatiIds.length === 0) return;
    setIsEliminazioneInCorso(true);
    const count = selezionatiIds.length;
    const nuovaLista = cancellaMultipliMovimentiContabili(
      selezionatiIds,
      motivoEliminazione || `Eliminazione massiva di ${count} registrazioni contabili`,
      'Tesoreria / Amministrazione'
    );
    setMovimenti(nuovaLista);
    onMovimentiChange?.(nuovaLista);
    setSelezionatiIds([]);
    setMostraConfermaMultipla(false);
    mostraNotifica('info', `${count} registrazioni contabili archiviate nel Cestino.`);
    setIsEliminazioneInCorso(false);
  };

  // Allineamento automatico da Quote, Donazioni ed Eventi esistenti
  const handleImportaAutomatico = () => {
    let importati = 0;
    const nuoviMovimenti: MovimentoContabile[] = [...movimenti];
    const annoTarget = typeof filtroAnno === 'number' ? filtroAnno : annoSelezionato;

    // 1. Allinea Quote dell'anno
    soci.forEach(s => {
      (s.quote || []).forEach(q => {
        if (q.anno === annoTarget) {
          const refId = `quota-${s.id}-${q.id}`;
          const esiste = nuoviMovimenti.some(m => m.riferimentoId === refId);
          if (!esiste) {
            nuoviMovimenti.push({
              id: `mov-sync-${q.id}`,
              data: q.dataPagamento || `${annoTarget}-01-15`,
              tipo: 'entrata',
              descrizione: `Quota associativa: ${s.nome} ${s.cognome} (Tessera ${s.numeroTessera})`,
              importo: q.importo || 15,
              categoria: 'quote_associative',
              metodoPagamento: q.metodo || 'Contanti',
              riferimentoId: refId,
              anno: annoTarget,
              note: `Ricevuta n° ${q.ricevutaNumero || 'N/D'}`
            });
            importati++;
          }
        }
      });
    });

    // 2. Allinea Donazioni dell'anno
    donazioni.forEach(d => {
      if (d.anno === annoTarget && d.stato !== 'annullata_ripensamento') {
        const refId = `donazione-${d.id}`;
        const esiste = nuoviMovimenti.some(m => m.riferimentoId === refId);
        if (!esiste) {
          nuoviMovimenti.push({
            id: `mov-sync-${d.id}`,
            data: d.dataDonazione || `${annoTarget}-02-01`,
            tipo: 'entrata',
            descrizione: `Donazione: ${d.donatore}`,
            importo: d.importo || 0,
            categoria: 'donazioni_liberalita',
            metodoPagamento: d.metodo || 'Bonifico Bancario',
            riferimentoId: refId,
            anno: annoTarget,
            note: `Quietanza n° ${d.ricevutaNumero || 'N/D'}`
          });
          importati++;
        }
      }
    });

    // 3. Allinea Eventi / Manifestazioni dell'anno
    eventi.forEach(e => {
      const annoEv = parseInt((e.dataInizio || '').substring(0, 4), 10);
      if (annoEv === annoTarget) {
        if ((e.costiSostenuti || 0) > 0) {
          const refCosto = `evento-costo-${e.id}`;
          if (!nuoviMovimenti.some(m => m.riferimentoId === refCosto)) {
            nuoviMovimenti.push({
              id: `mov-sync-c-${e.id}`,
              data: e.dataInizio || `${annoTarget}-06-01`,
              tipo: 'uscita',
              descrizione: `Spese Manifestazione: ${e.titolo}`,
              importo: e.costiSostenuti || 0,
              categoria: 'spese_eventi',
              metodoPagamento: 'Bonifico Bancario',
              riferimentoId: refCosto,
              anno: annoTarget,
              note: `Consuntivo evento ${e.categoria} (${e.luogo})`
            });
            importati++;
          }
        }

        if ((e.entrateRealizzate || 0) > 0) {
          const refIncasso = `evento-incasso-${e.id}`;
          if (!nuoviMovimenti.some(m => m.riferimentoId === refIncasso)) {
            nuoviMovimenti.push({
              id: `mov-sync-i-${e.id}`,
              data: e.dataFine || e.dataInizio || `${annoTarget}-06-01`,
              tipo: 'entrata',
              descrizione: `Incassi Manifestazione: ${e.titolo}`,
              importo: e.entrateRealizzate || 0,
              categoria: 'proventi_eventi',
              metodoPagamento: 'Contanti',
              riferimentoId: refIncasso,
              anno: annoTarget,
              note: `Incasso realizzato evento ${e.categoria} (${e.luogo})`
            });
            importati++;
          }
        }
      }
    });

    if (importati > 0) {
      setMovimenti(nuoviMovimenti);
      saveMovimentiContabili(nuoviMovimenti);
      onMovimentiChange?.(nuoviMovimenti);
      mostraNotifica('success', `Importate ed allineate ${importati} registrazioni contabili dai moduli dell'anno!`);
    } else {
      mostraNotifica('info', 'Tutte le voci dell\'anno (quote, donazioni, eventi) sono già registrate in prima nota.');
    }
  };

  const getNomeCategoria = (cat: string) => {
    const trovataEntr = CATEGORIE_ENTRATE.find(c => c.id === cat);
    if (trovataEntr) return trovataEntr.label;
    const trovataUsc = CATEGORIE_USCITE.find(c => c.id === cat);
    if (trovataUsc) return trovataUsc.label;
    return cat;
  };

  return (
    <div className="space-y-6">
      {/* Banner Intestazione Sezione Contabile */}
      <div className="bg-gradient-to-r from-slate-900 via-stone-900 to-emerald-950 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-800/40">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700/80 text-emerald-100 border border-emerald-500/40">
              Contabilità &amp; Prima Nota
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/30 text-teal-200 border border-teal-400/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-300" />
              <span>Integrata nel Bilancio &amp; Modello D RUNTS</span>
            </span>
            <span className="text-xs text-emerald-200/90 font-medium">
              Esercizio {filtroAnno === 'tutti' ? 'Globale' : filtroAnno}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <span>Gestione Contabile Semplificata</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
            Registra e monitora tutte le <strong>entrate</strong> e <strong>uscite</strong> di cassa e banca. Le uscite generali di struttura (utenze, affitti, assicurazioni, cancelleria, rimborsi volontari, consulenze) e le entrate autonome (contributi comunali/regionali/UNPLI, sponsor) vengono <strong>contabilizzate automaticamente nel Bilancio Generale e nel Modello D RUNTS</strong>.
          </p>
        </div>

        {/* Azioni Rapide Primarie */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleApriNuovo('entrata')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuova Entrata</span>
          </button>
          <button
            type="button"
            onClick={() => handleApriNuovo('uscita')}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuova Uscita</span>
          </button>
          <button
            type="button"
            onClick={handleImportaAutomatico}
            title="Sincronizza automaticamente quote dei soci e donazioni nell'anno contabile"
            className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-100 text-xs font-semibold border border-white/20 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Allinea da Quote/Donazioni</span>
          </button>
          <button
            type="button"
            onClick={() => esportaMovimentiContabiliCSV(movimenti, filtroAnno === 'tutti' ? undefined : filtroAnno)}
            title="Esporta il registro in formato CSV per Excel"
            className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-300" />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>

      {/* Banner Feedback Notifica */}
      {notifica && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
          notifica.tipo === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notifica.testo}</span>
        </div>
      )}

      {/* 4 Card di Sintesi Finanziaria (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Totale Entrate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Totale Entrate
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            + € {metriche.totaleEntrate.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex flex-col gap-0.5">
            <span>• Quote soci: <strong>€ {metriche.entrateQuote.toFixed(2)}</strong></span>
            <span>• Donazioni: <strong>€ {metriche.entrateDonazioni.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 2: Totale Uscite */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Totale Uscite
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            - € {metriche.totaleUscite.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex flex-col gap-0.5">
            <span>• Spese Eventi: <strong>€ {metriche.usciteEventi.toFixed(2)}</strong></span>
            <span>• Materiali Stand: <strong>€ {metriche.usciteMateriali.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 3: Saldo di Cassa Netto */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-2xs ${
          metriche.saldoNetto >= 0 
            ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-emerald-300' 
            : 'bg-gradient-to-br from-rose-50/90 to-amber-50/70 border-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
              metriche.saldoNetto >= 0 ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              <Euro className="w-3.5 h-3.5" />
              Saldo di Cassa Netto
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
              metriche.saldoNetto >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {metriche.saldoNetto >= 0 ? 'Attivo' : 'Disavanzo'}
            </span>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            metriche.saldoNetto >= 0 ? 'text-emerald-950' : 'text-rose-950'
          }`}>
            {metriche.saldoNetto >= 0 ? '+ ' : ''}€ {metriche.saldoNetto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            {metriche.saldoNetto >= 0 
              ? 'Avanzo di gestione disponibile per le attività istituzionali.'
              : 'Disavanzo contabile: monitorare uscite e reintegri di cassa.'}
          </p>
        </div>

        {/* Card 4: Volume Registrazioni */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Operazioni Registrate
            </span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {metriche.conteggio} <span className="text-sm font-semibold text-slate-500">voci</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Registro Prima Nota</span>
            <span className="text-emerald-700 font-bold">100% In Regola</span>
          </div>
        </div>
      </div>

      {/* Barra Filtri, Ricerca e Selezione Anno */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Input Ricerca */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ricercaTesto}
              onChange={(e) => setRicercaTesto(e.target.value)}
              placeholder="Cerca per descrizione, fornitore, socio, causale..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filtro Anno */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Anno:</span>
              <select
                value={filtroAnno}
                onChange={(e) => setFiltroAnno(e.target.value === 'tutti' ? 'tutti' : Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="tutti">Tutti gli Anni</option>
                {anniDisponibili.map(anno => (
                  <option key={anno} value={anno}>Anno {anno}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pulsanti Rapidi Filtro Tipo e Categoria */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroTipo('tutti')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroTipo === 'tutti'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tutti i Movimenti ({movimenti.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('entrata')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'entrata'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Solo Entrate (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('uscita')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'uscita'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Solo Uscite (-)</span>
            </button>
          </div>

          {/* Selettore Categoria */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="tutte">Tutte le Categorie</option>
              <optgroup label="Entrate">
                {CATEGORIE_ENTRATE.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </optgroup>
              <optgroup label="Uscite">
                {CATEGORIE_USCITE.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Barra Azione Rapida Selezione Multipla */}
      {selezionatiIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              {selezionatiIds.length}
            </span>
            <span>movimenti contabili selezionati</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelezionatiIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
            >
              Deseleziona
            </button>
            <button
              type="button"
              onClick={() => {
                setMotivoEliminazione(`Rettifica massiva di ${selezionatiIds.length} registrazioni`);
                setMostraConfermaMultipla(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Elimina Selezionati ({selezionatiIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabella Libro Giornale / Prima Nota */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Registro Cronologico Movimenti Contabili
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {movimentiConSaldo.length > 0 && (
              <button
                type="button"
                onClick={selezionaTuttiVisibili}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline underline-offset-2"
              >
                {movimentiConSaldo.every(m => selezionatiIds.includes(m.id))
                  ? 'Deseleziona tutti'
                  : 'Seleziona tutti visibili'}
              </button>
            )}
            <span className="text-xs text-slate-500 font-medium">
              Visualizzati <strong>{movimentiConSaldo.length}</strong> movimenti
            </span>
          </div>
        </div>

        {movimentiConSaldo.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Nessuna registrazione trovata</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Non sono presenti movimenti contabili che corrispondono ai criteri o per l&apos;anno selezionato. Utilizza i pulsanti in alto per aggiungere entrate o uscite.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleApriNuovo('entrata')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                + Registra Entrata
              </button>
              <button
                type="button"
                onClick={() => handleApriNuovo('uscita')}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                + Registra Uscita
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Vista Tabella (Desktop & Tablet) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={movimentiConSaldo.length > 0 && movimentiConSaldo.every(m => selezionatiIds.includes(m.id))}
                        onChange={selezionaTuttiVisibili}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        title="Seleziona / Deseleziona tutti i movimenti visibili"
                      />
                    </th>
                    <th className="py-3 px-3.5">Data</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-4">Descrizione &amp; Causale</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Metodo</th>
                    <th className="py-3 px-3.5 text-right">Importo (€)</th>
                    <th className="py-3 px-3.5 text-right">Saldo Progr. (€)</th>
                    <th className="py-3 px-3 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimentiConSaldo.map((m) => {
                    const isEntrata = m.tipo === 'entrata';
                    const isChecked = selezionatiIds.includes(m.id);
                    return (
                      <tr 
                        key={m.id} 
                        className={`transition-colors ${
                          isChecked ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox Selezione */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelezione(m.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </td>

                        {/* Data */}
                        <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                          {m.data ? new Date(m.data).toLocaleDateString('it-IT') : '-'}
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEntrata 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {isEntrata ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{isEntrata ? 'Entrata' : 'Uscita'}</span>
                          </span>
                        </td>

                        {/* Descrizione */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 leading-snug">{m.descrizione}</div>
                          {m.note && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">{m.note}</div>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {getNomeCategoria(m.categoria)}
                          </span>
                        </td>

                        {/* Metodo Pagamento */}
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {m.metodoPagamento || '-'}
                        </td>

                        {/* Importo */}
                        <td className={`py-3 px-3.5 text-right font-mono font-bold whitespace-nowrap ${
                          isEntrata ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isEntrata ? '+ ' : '- '}€ {Number(m.importo).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Saldo Progressivo */}
                        <td className={`py-3 px-3.5 text-right font-mono font-semibold whitespace-nowrap ${
                          m.saldoProgressivo >= 0 ? 'text-slate-800' : 'text-rose-700'
                        }`}>
                          € {m.saldoProgressivo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Azioni */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleApriModifica(m)}
                              title="Modifica registrazione"
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAvviaElimina(m)}
                              title="Elimina registrazione contabile"
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition-colors cursor-pointer group"
                            >
                              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista Schede Mobile (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {movimentiConSaldo.map((m) => {
                const isEntrata = m.tipo === 'entrata';
                const isChecked = selezionatiIds.includes(m.id);
                return (
                  <div 
                    key={m.id} 
                    className={`p-4 space-y-3 transition-colors ${
                      isChecked ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelezione(m.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer mt-0.5"
                        />
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEntrata 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {isEntrata ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{isEntrata ? 'Entrata' : 'Uscita'}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 ml-2">
                            {m.data ? new Date(m.data).toLocaleDateString('it-IT') : '-'}
                          </span>
                        </div>
                      </div>

                      <div className={`text-sm font-mono font-black ${
                        isEntrata ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isEntrata ? '+ ' : '- '}€ {Number(m.importo).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{m.descrizione}</h4>
                      {m.note && (
                        <p className="text-[11px] text-slate-500 mt-0.5 italic">{m.note}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {getNomeCategoria(m.categoria)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApriModifica(m)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Modifica</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAvviaElimina(m)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Elimina</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modale Inserimento / Modifica Movimento Contabile */}
      {modalAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modale */}
            <div className={`px-5 py-4 text-white flex items-center justify-between ${
              tipoNuovo === 'entrata' 
                ? 'bg-gradient-to-r from-emerald-800 to-teal-900' 
                : 'bg-gradient-to-r from-rose-800 to-stone-900'
            }`}>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-white/90" />
                <h3 className="text-base font-bold tracking-tight">
                  {movimentoInModifica ? 'Modifica Registrazione' : `Nuova ${tipoNuovo === 'entrata' ? 'Entrata di Cassa' : 'Uscita di Spesa'}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAperta(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSalvaForm} className="p-5 space-y-4">
              {formErrore && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formErrore}</span>
                </div>
              )}

              {/* Tipo Movimento Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipologia Registrazione:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoNuovo('entrata');
                      setFormCategoria('quote_associative');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      tipoNuovo === 'entrata'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Entrata (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoNuovo('uscita');
                      setFormCategoria('materiali_attrezzature');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      tipoNuovo === 'uscita'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Uscita (-)</span>
                  </button>
                </div>
              </div>

              {/* Data e Importo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Contabile:
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Importo (€):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                    <input
                      type="text"
                      required
                      placeholder="0.00"
                      value={formImporto}
                      onChange={(e) => setFormImporto(e.target.value)}
                      className="w-full text-xs pl-7 pr-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrizione / Causale Operazione:
                </label>
                <input
                  type="text"
                  required
                  placeholder={tipoNuovo === 'entrata' ? 'Es. Incasso quote tesseramento, donazione socio...' : 'Es. Acquisto materiali per sagra, fornitura manifesti, utenza...'}
                  value={formDescrizione}
                  onChange={(e) => setFormDescrizione(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Categoria e Metodo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    {tipoNuovo === 'entrata' 
                      ? CATEGORIE_ENTRATE.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                      : CATEGORIE_USCITE.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metodo Pagamento:
                  </label>
                  <select
                    value={formMetodo}
                    onChange={(e) => setFormMetodo(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    {METODI_PAGAMENTO.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note / Dettagli giustificativo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note &amp; Riferimenti Giustificativo (Opzionale):
                </label>
                <input
                  type="text"
                  placeholder="Es. Fattura n. 24, Scontrino, Ricevuta cassa, Delibera assemblea..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Bottoni Azione */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
                    tipoNuovo === 'entrata' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {movimentoInModifica ? 'Salva Modifiche' : 'Registra Movimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE CONFERMA ELIMINAZIONE SINGOLA (SENZA WINDOW.CONFIRM) */}
      {/* ======================================================== */}
      {movimentoDaEliminare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modale */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-400/30">
                  <Trash2 className="w-4 h-4 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">
                    Elimina Registrazione Contabile
                  </h3>
                  <p className="text-[10px] text-rose-200">
                    Archiviazione sicura nel Cestino &amp; Registro Audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMovimentoDaEliminare(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo Modale */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    movimentoDaEliminare.tipo === 'entrata'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {movimentoDaEliminare.tipo === 'entrata' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{movimentoDaEliminare.tipo === 'entrata' ? 'Entrata di Cassa' : 'Uscita di Spesa'}</span>
                  </span>
                  <span className={`font-mono font-black text-sm ${
                    movimentoDaEliminare.tipo === 'entrata' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {movimentoDaEliminare.tipo === 'entrata' ? '+ ' : '- '}€ {Number(movimentoDaEliminare.importo).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {movimentoDaEliminare.descrizione}
                  </div>
                  {movimentoDaEliminare.note && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      {movimentoDaEliminare.note}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-200/70 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Data Contabile:</span>
                    <span className="font-semibold text-slate-800">
                      {movimentoDaEliminare.data ? new Date(movimentoDaEliminare.data).toLocaleDateString('it-IT') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Categoria:</span>
                    <span className="font-semibold text-slate-800">
                      {getNomeCategoria(movimentoDaEliminare.categoria)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campo Motivo Eliminazione */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Motivo della cancellazione / storno (opzionale):
                </label>
                <input
                  type="text"
                  value={motivoEliminazione}
                  onChange={(e) => setMotivoEliminazione(e.target.value)}
                  placeholder="Es. Errata imputazione, duplicato, storno deliberato..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 bg-white"
                />
              </div>

              {/* Avviso Trasparenza Fiscale */}
              <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  L&apos;importo verrà immediatamente stornato da Prima Nota e Bilancio. La voce confluirà nel <strong>Cestino di Sistema</strong> per tracciabilità storica e potrà essere ripristinata in qualsiasi momento.
                </p>
              </div>

              {/* Bottoni Azione */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovimentoDaEliminare(null)}
                  disabled={isEliminazioneInCorso}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaElimina}
                  disabled={isEliminazioneInCorso}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEliminazioneInCorso ? 'Cancellazione...' : 'Elimina Movimento'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALE CONFERMA ELIMINAZIONE MASSIVA                     */}
      {/* ======================================================== */}
      {mostraConfermaMultipla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-400/30">
                  <AlertTriangle className="w-4 h-4 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">
                    Elimina {selezionatiIds.length} Movimenti
                  </h3>
                  <p className="text-[10px] text-rose-200">
                    Cancellazione multipla da Prima Nota
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostraConfermaMultipla(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Stai per rimuovere <strong>{selezionatiIds.length} registrazioni contabili</strong> contemporaneamente. Le registrazioni verranno escluse dal bilancio e archiviate nel Cestino di Sistema con apposito log probatorio.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Motivo eliminazione massiva:
                </label>
                <input
                  type="text"
                  value={motivoEliminazione}
                  onChange={(e) => setMotivoEliminazione(e.target.value)}
                  placeholder="Es. Rettifica contabile massiva..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 bg-white"
                />
              </div>

              {/* Bottoni Azione */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostraConfermaMultipla(false)}
                  disabled={isEliminazioneInCorso}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaEliminazioneMassiva}
                  disabled={isEliminazioneInCorso}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEliminazioneInCorso ? 'Cancellazione...' : `Elimina ${selezionatiIds.length} Movimenti`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
