import React, { useState, useMemo, useEffect } from 'react';
import { DonazioneTerzi, ProLocoInfo, TipoDonatore, CampagnaRaccoltaFondi } from '../types';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Printer, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  CreditCard, 
  FileSpreadsheet, 
  CheckCircle2, 
  Info, 
  ArrowUpDown,
  FileCheck,
  Landmark,
  UserCheck,
  TrendingUp,
  Receipt,
  Award,
  BookOpen,
  Target,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Users,
  MapPin,
  Check,
  BarChart3,
  Scale,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  RotateCcw,
  Ban
} from 'lucide-react';
import { 
  esportaDonazioniCSV, 
  saveDonazioni, 
  loadCampagneFondi, 
  saveCampagneFondi,
  aggiungiAlCestino,
  rimuoviDalCestino
} from '../storage';
import { DonazioneModal } from './DonazioneModal';
import { DonazioneRicevutaModal } from './DonazioneRicevutaModal';
import { DonazioneCertificatoAnnualeModal } from './DonazioneCertificatoAnnualeModal';
import { DonazioneRegistroVidimabileModal } from './DonazioneRegistroVidimabileModal';
import { CampagnaFondiModal } from './CampagnaFondiModal';
import { DonazioneContoEconomico } from './DonazioneContoEconomico';
import { DonazioneStatoPatrimoniale } from './DonazioneStatoPatrimoniale';
import { DonazioneAdempimentiModal } from './DonazioneAdempimentiModal';
import { DonazioneCertificatoVincoloModal } from './DonazioneCertificatoVincoloModal';

interface DonazioniTerziViewProps {
  donazioni: DonazioneTerzi[];
  config: ProLocoInfo;
  annoSelezionato: number;
  onCambiaAnno?: (anno: number) => void;
  onAggiornaDonazioni: (nuovaLista: DonazioneTerzi[]) => void;
  onApriCestino?: () => void;
}

type SottoScheda = 'elenco' | 'campagne' | 'conto_economico' | 'stato_patrimoniale' | 'adempimenti' | 'certificati_annuali' | 'registro_libro';

export const DonazioniTerziView: React.FC<DonazioniTerziViewProps> = ({
  donazioni,
  config,
  annoSelezionato,
  onCambiaAnno,
  onAggiornaDonazioni,
  onApriCestino
}) => {
  const [sottoScheda, setSottoScheda] = useState<SottoScheda>('elenco');
  const [filtroAnno, setFiltroAnno] = useState<number | 'tutti'>(annoSelezionato);

  useEffect(() => {
    setFiltroAnno(annoSelezionato);
  }, [annoSelezionato]);
  const [ricerca, setRicerca] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'tutti' | TipoDonatore>('tutti');
  const [filtroSoloDetraibili, setFiltroSoloDetraibili] = useState<boolean>(false);
  const [filtroCampagna, setFiltroCampagna] = useState<string>('tutte');
  const [filtroStato, setFiltroStato] = useState<'attive' | 'tutte' | 'annullate'>('attive');
  const [ordinamento, setOrdinamento] = useState<'data_desc' | 'data_asc' | 'importo_desc' | 'donatore_asc'>('data_desc');

  // Campagne di raccolta fondi
  const [campagne, setCampagne] = useState<CampagnaRaccoltaFondi[]>(() => loadCampagneFondi());

  useEffect(() => {
    setCampagne(loadCampagneFondi());
  }, [donazioni]);

  // Modali
  const [modalDonazioneAperta, setModalDonazioneAperta] = useState<boolean>(false);
  const [donazioneInModifica, setDonazioneInModifica] = useState<DonazioneTerzi | null>(null);
  const [donazionePerDocumento, setDonazionePerDocumento] = useState<DonazioneTerzi | null>(null);
  
  const [modalCertificatoAnnualeAperta, setModalCertificatoAnnualeAperta] = useState<boolean>(false);
  const [donatoreSelezionatoCertificato, setDonatoreSelezionatoCertificato] = useState<string | undefined>(undefined);

  const [modalRegistroVidimabileAperta, setModalRegistroVidimabileAperta] = useState<boolean>(false);

  const [modalCampagnaAperta, setModalCampagnaAperta] = useState<boolean>(false);
  const [campagnaInModifica, setCampagnaInModifica] = useState<CampagnaRaccoltaFondi | null>(null);

  const [modalCertificatoVincoloAperta, setModalCertificatoVincoloAperta] = useState<boolean>(false);
  const [donazionePerCertificatoVincolo, setDonazionePerCertificatoVincolo] = useState<DonazioneTerzi | null>(null);

  // Gestione cancellazioni per risentimento del donante e selezioni multiple
  const [idDaEliminare, setIdDaEliminare] = useState<string | null>(null);
  const [donazioneDaCancellare, setDonazioneDaCancellare] = useState<DonazioneTerzi | null>(null);
  const [selezionatiIds, setSelezionatiIds] = useState<string[]>([]);
  const [modalCancellazioneTuttiAperta, setModalCancellazioneTuttiAperta] = useState<boolean>(false);
  const [modalCancellazioneSelezionatiAperta, setModalCancellazioneSelezionatiAperta] = useState<boolean>(false);
  const [motivoCancellazione, setMotivoCancellazione] = useState<string>('Risentimento / Ripensamento del Donante (Revoca per ripensamento donazione ex art. 800 c.c.)');
  const [tipoAzioneCancellazione, setTipoAzioneCancellazione] = useState<'definitiva' | 'storno'>('definitiva');
  const [ambitoCancellazioneTutti, setAmbitoCancellazioneTutti] = useState<'anno' | 'tutti'>('anno');
  const [feedbackMessaggio, setFeedbackMessaggio] = useState<{ tipo: 'success' | 'info'; testo: string } | null>(null);

  // Anno attivo
  const annoAttivo = filtroAnno === 'tutti' ? null : filtroAnno;

  // Anni disponibili
  const anniDisponibili = useMemo(() => {
    const setAnni = new Set<number>([
      new Date().getFullYear(),
      new Date().getFullYear() - 1,
      annoSelezionato
    ]);
    donazioni.forEach(d => {
      if (d.anno) setAnni.add(d.anno);
    });
    return Array.from(setAnni).sort((a, b) => b - a);
  }, [donazioni, annoSelezionato]);

  // Calcolo automatico del prossimo numero di ricevuta per l'anno di lavoro
  const prossimoNumeroRicevuta = useMemo(() => {
    const annoRif = annoAttivo || annoSelezionato;
    const donazioniAnno = donazioni.filter(d => d.anno === annoRif);
    const progressivo = donazioniAnno.length + 1;
    return `DON-${annoRif}/${String(progressivo).padStart(3, '0')}`;
  }, [donazioni, annoAttivo, annoSelezionato]);

  // Conteggi stato donazioni
  const conteggioDonazioniAttive = useMemo(() => donazioni.filter(d => d.stato !== 'annullata_ripensamento').length, [donazioni]);
  const conteggioDonazioniStornate = useMemo(() => donazioni.filter(d => d.stato === 'annullata_ripensamento').length, [donazioni]);

  // Donazioni filtrate (esclusione o inclusione in base al filtroStato)
  const donazioniFiltrate = useMemo(() => {
    return donazioni.filter(d => {
      if (filtroStato === 'attive' && d.stato === 'annullata_ripensamento') return false;
      if (filtroStato === 'annullate' && d.stato !== 'annullata_ripensamento') return false;
      if (annoAttivo && d.anno !== annoAttivo) return false;
      if (filtroTipo !== 'tutti' && d.tipoDonatore !== filtroTipo) return false;
      if (filtroSoloDetraibili && !d.detraibileFiscale) return false;
      if (filtroCampagna !== 'tutte' && d.campagnaId !== filtroCampagna) return false;

      if (ricerca.trim()) {
        const query = ricerca.toLowerCase().trim();
        const matchDonatore = d.donatore.toLowerCase().includes(query);
        const matchCF = (d.codiceFiscalePartitaIva || '').toLowerCase().includes(query);
        const matchCausale = d.causale.toLowerCase().includes(query);
        const matchRicevuta = d.ricevutaNumero.toLowerCase().includes(query);
        const matchDestinazione = (d.destinazione || '').toLowerCase().includes(query);
        const matchTracciabilita = (d.estremiTracciabilita || '').toLowerCase().includes(query);
        const matchMotivo = (d.motivoAnnullamento || '').toLowerCase().includes(query);
        if (!matchDonatore && !matchCF && !matchCausale && !matchRicevuta && !matchDestinazione && !matchTracciabilita && !matchMotivo) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (ordinamento === 'data_desc') return b.data.localeCompare(a.data);
      if (ordinamento === 'data_asc') return a.data.localeCompare(b.data);
      if (ordinamento === 'importo_desc') return (b.importo || 0) - (a.importo || 0);
      if (ordinamento === 'donatore_asc') return a.donatore.localeCompare(b.donatore);
      return 0;
    });
  }, [donazioni, annoAttivo, filtroTipo, filtroSoloDetraibili, filtroCampagna, ricerca, ordinamento, filtroStato]);

  // Metriche Finanziarie Avanzate (escludendo donazioni stornate per risentimento)
  const metriche = useMemo(() => {
    const donazioniAnno = (annoAttivo ? donazioni.filter(d => d.anno === annoAttivo) : donazioni)
      .filter(d => d.stato !== 'annullata_ripensamento');
    const totale = donazioniAnno.reduce((acc, d) => acc + (d.importo || 0), 0);
    const detraibili = donazioniAnno.filter(d => d.detraibileFiscale);
    const totaleDetraibili = detraibili.reduce((acc, d) => acc + (d.importo || 0), 0);
    const totaleCampagne = donazioniAnno.filter(d => d.campagnaId).reduce((acc, d) => acc + (d.importo || 0), 0);
    
    // Conteggio donatori unici
    const donatoriUniciSet = new Set(donazioniAnno.map(d => (d.codiceFiscalePartitaIva || d.donatore).trim().toUpperCase()));
    
    const privati = donazioniAnno.filter(d => d.tipoDonatore === 'privato').length;
    const imprese = donazioniAnno.filter(d => d.tipoDonatore === 'azienda').length;
    const entiFondazioni = donazioniAnno.filter(d => ['fondazione', 'ente_benefico', 'associazione'].includes(d.tipoDonatore)).length;

    return {
      totale,
      conteggio: donazioniAnno.length,
      totaleDetraibili,
      totaleCampagne,
      donatoriUnici: donatoriUniciSet.size,
      privati,
      imprese,
      entiFondazioni
    };
  }, [donazioni, annoAttivo]);

  // Donatori raggruppati per scheda "Certificati Annuali"
  const riepilogoDonatoriAnnuali = useMemo(() => {
    const annoRif = annoAttivo || annoSelezionato;
    const mappa = new Map<string, { 
      donatore: string; 
      cf?: string; 
      tipo: TipoDonatore; 
      totale: number; 
      conteggio: number; 
      tracciabili: number;
      ultimaData: string;
    }>();

    donazioni
      .filter(d => d.anno === annoRif && d.tipoDonatore !== 'anonimo' && d.stato !== 'annullata_ripensamento')
      .forEach(d => {
        const chiave = (d.codiceFiscalePartitaIva || d.donatore).trim().toUpperCase();
        if (!mappa.has(chiave)) {
          mappa.set(chiave, {
            donatore: d.donatore,
            cf: d.codiceFiscalePartitaIva,
            tipo: d.tipoDonatore,
            totale: 0,
            conteggio: 0,
            tracciabili: 0,
            ultimaData: d.data
          });
        }
        const rec = mappa.get(chiave)!;
        rec.totale += d.importo;
        rec.conteggio += 1;
        if (d.detraibileFiscale) rec.tracciabili += d.importo;
        if (d.data > rec.ultimaData) rec.ultimaData = d.data;
      });

    return Array.from(mappa.values()).sort((a, b) => b.totale - a.totale);
  }, [donazioni, annoAttivo, annoSelezionato]);

  // Calcolo avanzamento campagne
  const campagneConAvanzamento = useMemo(() => {
    return campagne.map(camp => {
      const donazioniDellaCampagna = donazioni.filter(d => d.campagnaId === camp.id && d.stato !== 'annullata_ripensamento');
      const raccolto = donazioniDellaCampagna.reduce((acc, d) => acc + d.importo, 0);
      const percentuale = Math.min(100, Math.round((raccolto / (camp.obiettivoImporto || 1)) * 100));
      return {
        ...camp,
        raccolto,
        percentuale,
        numeroDonazioni: donazioniDellaCampagna.length
      };
    });
  }, [campagne, donazioni]);

  // Feedback temporaneo
  const mostraFeedback = (testo: string, tipo: 'success' | 'info' = 'success') => {
    setFeedbackMessaggio({ tipo, testo });
    setTimeout(() => {
      setFeedbackMessaggio(null);
    }, 5000);
  };

  // Toggle selezione singola
  const handleToggleSelezione = (id: string) => {
    setSelezionatiIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Seleziona / Deseleziona tutti gli inserimenti filtrati
  const handleToggleSelezionaTutti = () => {
    const idsFiltrati = donazioniFiltrate.map(d => d.id);
    const tuttiSelezionati = idsFiltrati.length > 0 && idsFiltrati.every(id => selezionatiIds.includes(id));
    if (tuttiSelezionati) {
      setSelezionatiIds(prev => prev.filter(id => !idsFiltrati.includes(id)));
    } else {
      setSelezionatiIds(prev => Array.from(new Set([...prev, ...idsFiltrati])));
    }
  };

  // Salva donazione
  const handleSalvaDonazione = (donazioneAggiornata: DonazioneTerzi) => {
    let nuovaLista: DonazioneTerzi[];
    const esiste = donazioni.some(d => d.id === donazioneAggiornata.id);
    if (esiste) {
      nuovaLista = donazioni.map(d => d.id === donazioneAggiornata.id ? donazioneAggiornata : d);
    } else {
      nuovaLista = [donazioneAggiornata, ...donazioni];
    }
    onAggiornaDonazioni(nuovaLista);
    saveDonazioni(nuovaLista);
    setModalDonazioneAperta(false);
    setDonazioneInModifica(null);
    mostraFeedback(`Quietanza ${donazioneAggiornata.ricevutaNumero} registrata con successo.`);
  };

  // Cancellazione singola per ripensamento donante (Punto 1.4: Soft Delete + Cestino di Sistema)
  const handleConfermaCancellazioneSingola = () => {
    const target = donazioneDaCancellare || (idDaEliminare ? donazioni.find(d => d.id === idDaEliminare) : null);
    if (!target) return;
    const { id, donatore, ricevutaNumero, importo } = target;
    const dataOggi = new Date().toISOString().split('T')[0];
    const oraAttuale = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Presidente'} / Tesoreria`;

    // 1. Applica soft delete allo stato della donazione (annullata_ripensamento)
    const donazioneAggiornata: DonazioneTerzi = {
      ...target,
      stato: 'annullata_ripensamento',
      motivoAnnullamento: motivoCancellazione,
      dataAnnullamento: dataOggi,
      annullatoDa: operatore
    };

    const nuovaLista = donazioni.map(d => d.id === id ? donazioneAggiornata : d);

    // 2. Archivia nel Cestino di Sistema per l'audit trail probatorio
    aggiungiAlCestino({
      id: `cestino-don-${id}`,
      entitaId: id,
      tipoEntita: 'donazione',
      titolo: `Quietanza ${ricevutaNumero} - ${donatore}`,
      sottotitolo: `${target.codiceFiscalePartitaIva ? 'C.F./P.IVA: ' + target.codiceFiscalePartitaIva + ' • ' : ''}Esercizio ${target.anno} • ${target.metodo}`,
      importo: importo,
      dataEliminazione: dataOggi,
      oraEliminazione: oraAttuale,
      motivo: motivoCancellazione,
      eliminatoDa: operatore,
      datiOriginali: donazioneAggiornata
    });

    onAggiornaDonazioni(nuovaLista);
    saveDonazioni(nuovaLista);
    setSelezionatiIds(prev => prev.filter(x => x !== id));
    setDonazioneDaCancellare(null);
    setIdDaEliminare(null);
    mostraFeedback(`Donazione ${ricevutaNumero} (${donatore}) revocata con soft delete (Punto 1.4). Importo escluso da ogni bilancio e traccia archiviata nel Cestino.`);
  };

  // Cancellazione massiva selezionati per ripensamento donante (Punto 1.4 Soft Delete + Cestino)
  const handleConfermaCancellazioneSelezionati = () => {
    if (selezionatiIds.length === 0) return;
    const count = selezionatiIds.length;
    const dataOggi = new Date().toISOString().split('T')[0];
    const oraAttuale = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Presidente'} / Tesoreria`;

    const nuovaLista = donazioni.map(d => {
      if (selezionatiIds.includes(d.id)) {
        const aggiornata: DonazioneTerzi = {
          ...d,
          stato: 'annullata_ripensamento',
          motivoAnnullamento: motivoCancellazione,
          dataAnnullamento: dataOggi,
          annullatoDa: operatore
        };
        aggiungiAlCestino({
          id: `cestino-don-${d.id}`,
          entitaId: d.id,
          tipoEntita: 'donazione',
          titolo: `Quietanza ${d.ricevutaNumero} - ${d.donatore}`,
          sottotitolo: `${d.codiceFiscalePartitaIva ? 'C.F./P.IVA: ' + d.codiceFiscalePartitaIva + ' • ' : ''}Esercizio ${d.anno}`,
          importo: d.importo,
          dataEliminazione: dataOggi,
          oraEliminazione: oraAttuale,
          motivo: motivoCancellazione,
          eliminatoDa: operatore,
          datiOriginali: aggiornata
        });
        return aggiornata;
      }
      return d;
    });

    onAggiornaDonazioni(nuovaLista);
    saveDonazioni(nuovaLista);
    setSelezionatiIds([]);
    setModalCancellazioneSelezionatiAperta(false);
    mostraFeedback(`${count} donazioni revocate con soft delete (Punto 1.4) e archiviate nel Cestino.`);
  };

  // Cancellazione di TUTTI gli inserimenti per risentimento (Punto 1.4 Soft Delete + Cestino)
  const handleConfermaCancellazioneTutti = () => {
    const dataOggi = new Date().toISOString().split('T')[0];
    const oraAttuale = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const operatore = `${config.nomePresidente || 'Presidente'} / Tesoreria`;

    let donazioniModificate = 0;
    const nuovaLista = donazioni.map(d => {
      const matchAmbito = ambitoCancellazioneTutti === 'anno' ? (d.anno === (annoAttivo || annoSelezionato)) : true;
      if (matchAmbito && d.stato !== 'annullata_ripensamento') {
        donazioniModificate++;
        const aggiornata: DonazioneTerzi = {
          ...d,
          stato: 'annullata_ripensamento',
          motivoAnnullamento: motivoCancellazione,
          dataAnnullamento: dataOggi,
          annullatoDa: operatore
        };
        aggiungiAlCestino({
          id: `cestino-don-${d.id}`,
          entitaId: d.id,
          tipoEntita: 'donazione',
          titolo: `Quietanza ${d.ricevutaNumero} - ${d.donatore}`,
          sottotitolo: `${d.codiceFiscalePartitaIva ? 'C.F./P.IVA: ' + d.codiceFiscalePartitaIva + ' • ' : ''}Esercizio ${d.anno}`,
          importo: d.importo,
          dataEliminazione: dataOggi,
          oraEliminazione: oraAttuale,
          motivo: motivoCancellazione,
          eliminatoDa: operatore,
          datiOriginali: aggiornata
        });
        return aggiornata;
      }
      return d;
    });

    onAggiornaDonazioni(nuovaLista);
    saveDonazioni(nuovaLista);
    setModalCancellazioneTuttiAperta(false);
    mostraFeedback(`${donazioniModificate} donazioni revocate con soft delete per ripensamento donante e archiviate nel Cestino.`);
  };

  // Ripristino donazione dallo stato di annullamento
  const handleRipristinaDonazione = (donazioneId: string) => {
    const target = donazioni.find(d => d.id === donazioneId);
    if (!target) return;
    const nuovaLista = donazioni.map(d => {
      if (d.id === donazioneId) {
        const { stato, motivoAnnullamento, dataAnnullamento, annullatoDa, ...resto } = d;
        return { ...resto, stato: 'attiva' as const };
      }
      return d;
    });
    rimuoviDalCestino(`cestino-don-${donazioneId}`);
    onAggiornaDonazioni(nuovaLista);
    saveDonazioni(nuovaLista);
    mostraFeedback(`Quietanza ${target.ricevutaNumero} (${target.donatore}) ripristinata con successo allo stato attivo.`);
  };

  // Elimina donazione retrocompatibile
  const handleEliminaDonazione = (id: string) => {
    const daEliminare = donazioni.find(d => d.id === id);
    if (daEliminare) {
      setDonazioneDaCancellare(daEliminare);
      setMotivoCancellazione('Risentimento / Ripensamento del Donante (Revoca per ripensamento donazione ex art. 800 c.c.)');
      setTipoAzioneCancellazione('definitiva');
    } else {
      const nuovaLista = donazioni.filter(d => d.id !== id);
      onAggiornaDonazioni(nuovaLista);
      saveDonazioni(nuovaLista);
      setIdDaEliminare(null);
    }
  };

  // Salva Campagna
  const handleSalvaCampagna = (campagnaSalvata: CampagnaRaccoltaFondi) => {
    let nuoveCampagne: CampagnaRaccoltaFondi[];
    const esiste = campagne.some(c => c.id === campagnaSalvata.id);
    if (esiste) {
      nuoveCampagne = campagne.map(c => c.id === campagnaSalvata.id ? campagnaSalvata : c);
    } else {
      nuoveCampagne = [campagnaSalvata, ...campagne];
    }
    setCampagne(nuoveCampagne);
    saveCampagneFondi(nuoveCampagne);
    setModalCampagnaAperta(false);
    setCampagnaInModifica(null);
  };

  const handleAggiornaSingolaDonazione = (donazioneAggiornata: DonazioneTerzi) => {
    const nuovaLista = donazioni.map(d => d.id === donazioneAggiornata.id ? donazioneAggiornata : d);
    onAggiornaDonazioni(nuovaLista);
    saveDonazioni(nuovaLista);
  };

  const handleAggiornaCampagna = (campagnaAggiornata: CampagnaRaccoltaFondi) => {
    const nuove = campagne.map(c => c.id === campagnaAggiornata.id ? campagnaAggiornata : c);
    setCampagne(nuove);
    saveCampagneFondi(nuove);
  };

  const getBadgeTipoDonatore = (tipo: TipoDonatore) => {
    switch (tipo) {
      case 'azienda':
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-blue-800">Impresa / Società</span>;
      case 'privato':
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800">Privato Cittadino</span>;
      case 'fondazione':
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-100 text-purple-800">Fondazione</span>;
      case 'ente_benefico':
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900">Ente / Terzo Settore</span>;
      case 'associazione':
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-teal-100 text-teal-800">Associazione Consorella</span>;
      case 'anonimo':
      default:
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700">Anonimo / Offerte</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. BANNER ISTITUZIONALE SEZIONE 1.4 */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 rounded-3xl p-5 sm:p-7 text-white shadow-sm border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-700/90 text-emerald-100 border border-emerald-500/40 tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>1.4 Registro Ufficiale Erogazioni Liberali</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-emerald-200 border border-white/15">
                Art. 83 CTS (D.Lgs. 117/2017) • Conforme RUNTS
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <HeartHandshake className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Gestione Professionale Donazioni, Sostenitori & Raccolta Fondi</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-200/90 max-w-3xl leading-relaxed">
              Piattaforma contabile integrata per l'emissione di quietanze fiscali deducibili, diplomi di benemerenza, attestazioni annuali per il Modello 730/Redditi e libro mastro vidimabile.
            </p>
          </div>

          {/* Azioni Rapide Banner - Essenziali e pulite, nessun overflow */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Selettore Anno */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs border border-white/20 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <select
                value={filtroAnno}
                onChange={(e) => {
                  const val = e.target.value === 'tutti' ? 'tutti' : Number(e.target.value);
                  setFiltroAnno(val);
                  if (onCambiaAnno && typeof val === 'number') onCambiaAnno(val);
                }}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer pr-1"
              >
                <option value="tutti" className="bg-slate-900 text-white">Tutti gli Esercizi</option>
                {anniDisponibili.map(anno => (
                  <option key={anno} value={anno} className="bg-slate-900 text-white">Esercizio {anno}</option>
                ))}
              </select>
            </div>

            {/* Esporta CSV */}
            <button
              onClick={() => esportaDonazioniCSV(donazioni, annoAttivo || undefined)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Scarica il Registro Donazioni completo in formato CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Esporta CSV</span>
            </button>

            {/* Registra Donazione */}
            <button
              onClick={() => {
                setDonazioneInModifica(null);
                setModalDonazioneAperta(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Nuova Donazione</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. STATISTICHE & KPI FINANZIARI DONAZIONI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Totale Raccolto */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Totale Raccolto {annoAttivo ? `(${annoAttivo})` : ''}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              € {metriche.totale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {metriche.conteggio} registrazioni • {metriche.donatoriUnici} donatori unici
          </span>
        </div>

        {/* Card 2: Detraibile Art. 83 CTS */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tracciato Art. 83 CTS
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-800 tabular-nums">
              € {metriche.totaleDetraibili.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-teal-700 block mt-1 font-medium">
            {((metriche.totaleDetraibili / (metriche.totale || 1)) * 100).toFixed(0)}% del totale con tracciabilità fiscale
          </span>
        </div>

        {/* Card 3: Campagne e Progetti Vincolati */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Progetti Vincolati
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900 tabular-nums">
              € {metriche.totaleCampagne.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Fondi vincolati su {campagne.length} campagne attive
          </span>
        </div>

        {/* Card 4: Donatori Unici e Tipologie */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rete Sostenitori
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-800">
            <span>Privati: <strong>{metriche.privati}</strong></span>
            <span>•</span>
            <span>Aziende: <strong>{metriche.imprese}</strong></span>
            <span>•</span>
            <span>Enti: <strong>{metriche.entiFondazioni}</strong></span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Soggetti eroganti registrati nel sistema
          </span>
        </div>

      </div>

      {/* 3. STRUTTURA PRINCIPALE: TASTI DI SCELTA VERTICALI (UNO SOTTO L'ALTRO) + CONTENUTO SEZIONE */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        
        {/* COLONNA TASTI DI SCELTA: DISPOSTI RIGOROSAMENTE UNO SOTTO L'ALTRO */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          
          <div className="bg-white/95 rounded-2xl border border-slate-200/80 p-3.5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Tasti di Scelta Sezioni
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                7 Viste
              </span>
            </div>

            {/* I Tasti di Scelta disposti UNO SOTTO L'ALTRO */}
            <div className="flex flex-col gap-2">
              
              {/* 1. Tutte le Donazioni & Quietanze */}
              <button
                onClick={() => setSottoScheda('elenco')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'elenco'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Visualizza il registro completo delle donazioni ed emetti quietanze fiscali"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'elenco' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Donazioni & Quietanze</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'elenco' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      Registro e quietanze fiscali
                    </div>
                  </div>
                </div>
                <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-full shrink-0 font-mono ${
                  sottoScheda === 'elenco' ? 'bg-white text-emerald-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {donazioniFiltrate.length}
                </span>
              </button>

              {/* 2. Campagne & Vincoli Fondi */}
              <button
                onClick={() => setSottoScheda('campagne')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'campagne'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Gestione raccolte fondi territoriali e progetti con vincolo di destinazione"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'campagne' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Campagne & Vincoli</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'campagne' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      Raccolte fondi territoriali
                    </div>
                  </div>
                </div>
                <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-full shrink-0 font-mono ${
                  sottoScheda === 'campagne' ? 'bg-white text-emerald-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {campagne.length}
                </span>
              </button>

              {/* 3. Conto Economico Sez. C (Modello D) */}
              <button
                onClick={() => setSottoScheda('conto_economico')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'conto_economico'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Rendiconto di Cassa Sezione C per il RUNTS ex DM 39/2020"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'conto_economico' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Conto Economico Sez. C</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'conto_economico' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      Rendiconto cassa Mod. D RUNTS
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  sottoScheda === 'conto_economico' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  Mod. D
                </span>
              </button>

              {/* 4. Stato Patrimoniale & Riserve (Modello C) */}
              <button
                onClick={() => setSottoScheda('stato_patrimoniale')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'stato_patrimoniale'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Stato Patrimoniale e Riserve Vincolate Modello C RUNTS"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'stato_patrimoniale' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Stato Patrimoniale</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'stato_patrimoniale' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      Patrimonio netto e vincoli
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  sottoScheda === 'stato_patrimoniale' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-800'
                }`}>
                  Mod. C
                </span>
              </button>

              {/* 5. Centro Adempimenti di Legge */}
              <button
                onClick={() => setSottoScheda('adempimenti')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'adempimenti'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="730 Precompilato AdE, Rendicontazione Art. 87 CTS, Trasparenza L. 124/2017"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'adempimenti' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'
                  }`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Centro Adempimenti</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'adempimenti' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      730 Precompilato, Art. 87, L. 124
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  sottoScheda === 'adempimenti' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-800'
                }`}>
                  Norme
                </span>
              </button>

              {/* 6. Attestazioni Fiscali Annuali */}
              <button
                onClick={() => setSottoScheda('certificati_annuali')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'certificati_annuali'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Attestazioni cumulative annuali per CAF e commercialisti dei donatori"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'certificati_annuali' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'
                  }`}>
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Attestazioni Annuali</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'certificati_annuali' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      Certificati 730 / Redditi
                    </div>
                  </div>
                </div>
                <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-full shrink-0 font-mono ${
                  sottoScheda === 'certificati_annuali' ? 'bg-white text-emerald-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {riepilogoDonatoriAnnuali.length}
                </span>
              </button>

              {/* 7. Libro Registro Vidimabile CTS */}
              <button
                onClick={() => setSottoScheda('registro_libro')}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  sottoScheda === 'registro_libro'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Libro Mastro Vidimabile con numerazione pagine conforme RUNTS"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    sottoScheda === 'registro_libro' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Libro Registro Vidimabile</div>
                    <div className={`text-[10px] font-normal truncate ${
                      sottoScheda === 'registro_libro' ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      Mastro ufficiale RUNTS e Revisori
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  sottoScheda === 'registro_libro' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'
                }`}>
                  A4
                </span>
              </button>

              {/* 8. Cestino di Sistema & Audit Log Revoche (Punto 1.4) */}
              <button
                type="button"
                onClick={() => {
                  if (onApriCestino) {
                    onApriCestino();
                  } else {
                    setFiltroStato('annullate');
                    setSottoScheda('elenco');
                  }
                }}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2.5 cursor-pointer border ${
                  filtroStato === 'annullate' && sottoScheda === 'elenco'
                    ? 'bg-rose-900 text-white border-rose-950 shadow-xs'
                    : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                }`}
                title="Registro Storico e Cestino Revoche Donazioni per Ripensamento Donante (Punto 1.4)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    filtroStato === 'annullate' && sottoScheda === 'elenco' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-black">Cestino Revoche (1.4)</div>
                    <div className={`text-[10px] font-normal truncate ${
                      filtroStato === 'annullate' && sottoScheda === 'elenco' ? 'text-rose-100' : 'text-rose-700'
                    }`}>
                      Audit ripensamento donante
                    </div>
                  </div>
                </div>
                <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-full shrink-0 font-mono ${
                  filtroStato === 'annullate' && sottoScheda === 'elenco' ? 'bg-white text-rose-950' : 'bg-rose-200 text-rose-900'
                }`}>
                  {conteggioDonazioniStornate}
                </span>
              </button>

            </div>
          </div>

          {/* Box Documenti Ufficiali & Stampe Rapide */}
          <div className="bg-slate-900 rounded-2xl p-3.5 text-white border border-slate-800 shadow-xs space-y-2">
            <div className="text-[10.5px] font-black uppercase tracking-wider text-emerald-400 px-1">
              Documenti & Stampa Rapida
            </div>
            
            <div className="flex flex-col gap-1.5">
              {/* Libro Registro Vidimabile Modale */}
              <button
                onClick={() => setModalRegistroVidimabileAperta(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span>Stampa Libro Registro A4</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Certificato Vincolo Fondi */}
              <button
                onClick={() => {
                  setDonazionePerCertificatoVincolo(donazioni[0] || null);
                  setModalCertificatoVincoloAperta(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Certificato Vincolo & Scheda</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Esporta CSV */}
              <button
                onClick={() => esportaDonazioniCSV(donazioni, annoAttivo || undefined)}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Download Registro CSV / Excel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Box Gestione Risentimento & Diritto di Recesso Donanti (Punto 1.4) */}
          <div className="bg-rose-950/85 rounded-2xl p-3.5 text-white border border-rose-800/70 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-rose-300 px-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Punto 1.4: Revoca & Ripensamento</span>
            </div>
            
            <p className="text-[11px] text-rose-200/80 px-1 leading-snug">
              Diritto di ripensamento ex art. 800 c.c. I dati vengono archiviati con soft delete nel Cestino ed esclusi da ogni bilancio.
            </p>

            <button
              onClick={() => {
                setMotivoCancellazione('Risentimento / Ripensamento del Donante (Revoca per ripensamento donazione ex art. 800 c.c.)');
                setAmbitoCancellazioneTutti(annoAttivo ? 'anno' : 'tutti');
                setModalCancellazioneTuttiAperta(true);
              }}
              className="w-full text-left px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer shadow-xs border border-rose-500/50"
              title="Apre la procedura di revoca per ripensamento donante con archiviazione nel Cestino"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="truncate">Revoca per Ripensamento (1.4)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-200 shrink-0" />
            </button>
          </div>

        </aside>

        {/* CONTENUTO PRINCIPALE DELLA SEZIONE SELEZIONATA */}
        <main className="flex-1 min-w-0 w-full space-y-4">

      {/* ======================================================== */}
      {/* VISTA 1: ELENCO DONAZIONI & QUIETANZE                    */}
      {/* ======================================================== */}
      {sottoScheda === 'elenco' && (
        <div className="space-y-4">
          
          {/* Barra Filtri e Ricerca */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Ricerca Testuale */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca per donatore, codice fiscale, causale, ricevuta, CRO/TRN..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none transition"
              />
              {ricerca && (
                <button
                  onClick={() => setRicerca('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtri */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Filtro Campagna */}
              <select
                value={filtroCampagna}
                onChange={(e) => setFiltroCampagna(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
              >
                <option value="tutte">Tutti i Progetti / Fondi</option>
                {campagne.map(c => (
                  <option key={c.id} value={c.id}>🎯 {c.titolo}</option>
                ))}
              </select>

              {/* Tipo Donatore */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
              >
                <option value="tutti">Tutti i Donatori</option>
                <option value="privato">Solo Privati</option>
                <option value="azienda">Solo Aziende</option>
                <option value="fondazione">Fondazioni</option>
                <option value="ente_benefico">Enti Terzo Settore</option>
                <option value="associazione">Associazioni Consorelle</option>
                <option value="anonimo">Anonimi</option>
              </select>

              {/* Toggle Detraibili */}
              <button
                onClick={() => setFiltroSoloDetraibili(!filtroSoloDetraibili)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  filtroSoloDetraibili
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Solo Detraibili Art. 83</span>
              </button>

              {/* Ordinamento */}
              <select
                value={ordinamento}
                onChange={(e) => setOrdinamento(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
              >
                <option value="data_desc">Data (Più recenti)</option>
                <option value="data_asc">Data (Meno recenti)</option>
                <option value="importo_desc">Importo (€ decrescente)</option>
                <option value="donatore_asc">Donatore (A-Z)</option>
              </select>

              {/* Pulsante Cancella Tutti gli Inserimenti per Risentimento */}
              {donazioni.length > 0 && (
                <button
                  onClick={() => {
                    setMotivoCancellazione('Risentimento / Ripensamento del Donante (Revoca per ripensamento donazione ex art. 800 c.c.)');
                    setAmbitoCancellazioneTutti(annoAttivo ? 'anno' : 'tutti');
                    setModalCancellazioneTuttiAperta(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Consente di cancellare tutti gli inserimenti registrati per risentimento del donante"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancella Inserimenti (Risentimento)</span>
                </button>
              )}

            </div>

          </div>

          {/* Feedback Messaggio Notifica */}
          {feedbackMessaggio && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in ${
              feedbackMessaggio.tipo === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMessaggio.testo}</span>
              </div>
              <button 
                onClick={() => setFeedbackMessaggio(null)} 
                className="text-slate-500 hover:text-slate-800 p-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Barra Azioni Multiple per Inserimenti Selezionati */}
          {selezionatiIds.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 text-xs font-bold text-rose-950">
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-mono font-black text-xs">
                  {selezionatiIds.length}
                </div>
                <span>
                  {selezionatiIds.length === 1 ? '1 donazione selezionata' : `${selezionatiIds.length} donazioni selezionate`} per cancellazione (Risentimento del donante)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMotivoCancellazione('Risentimento / Ripensamento del Donante (Revoca per ripensamento donazione ex art. 800 c.c.)');
                    setTipoAzioneCancellazione('definitiva');
                    setModalCancellazioneSelezionatiAperta(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancella Selezionati per Risentimento</span>
                </button>

                <button
                  onClick={() => setSelezionatiIds([])}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Deseleziona
                </button>
              </div>
            </div>
          )}

          {/* Tabella Donazioni */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">
                  Quietanza & Donazioni ({donazioniFiltrate.length} su {donazioni.length})
                </span>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Totale Parziale Attivo: <strong className="text-slate-900 font-bold font-mono">€ {donazioniFiltrate.filter(d => d.stato !== 'annullata_ripensamento').reduce((a, b) => a + (b.importo || 0), 0).toFixed(2)}</strong>
              </span>
            </div>

            {/* Selettore Filtro Stato Donazione: Attive vs Revocate/Cestino vs Tutte */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Filtro Stato:</span>
                
                <button
                  type="button"
                  onClick={() => setFiltroStato('attive')}
                  className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    filtroStato === 'attive'
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Donazioni Attive</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    filtroStato === 'attive' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {conteggioDonazioniAttive}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroStato('annullate')}
                  className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    filtroStato === 'annullate'
                      ? 'bg-rose-800 text-white border-rose-900 shadow-2xs'
                      : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Revocate per Ripensamento (1.4)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    filtroStato === 'annullate' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {conteggioDonazioniStornate}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroStato('tutte')}
                  className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    filtroStato === 'tutte'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Tutte le Quietanze</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    filtroStato === 'tutte' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {donazioni.length}
                  </span>
                </button>
              </div>

              {onApriCestino && (
                <button
                  type="button"
                  onClick={onApriCestino}
                  className="px-3 py-1 rounded-xl font-bold bg-white text-rose-800 border border-rose-200 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                  title="Apri il Cestino di Sistema per l'Audit Trail completo"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Apri Cestino di Sistema (Audit Trail)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>

            {filtroStato === 'annullate' && (
              <div className="mx-4 my-3 p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-rose-900 block">
                    Registrazioni Stornate per Ripensamento Donante (Punto 1.4):
                  </span>
                  <p className="text-[11.5px] text-rose-800 leading-relaxed font-normal">
                    I record sottostanti sono stati stornati tramite <strong>soft delete</strong>. Rimangono memorizzati per traccia storica probatoria ex art. 800 c.c. e sono <strong>completamente esclusi da ogni calcolo di bilancio</strong>. Puoi ripristinare qualsiasi donazione cliccando sul pulsante «Ripristina».
                  </p>
                </div>
              </div>
            )}

            {donazioniFiltrate.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Nessuna donazione trovata</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Non risultano donazioni con i filtri attuali. Puoi registrarne una nuova premendo il tasto in alto.
                </p>
                <button
                  onClick={() => {
                    setDonazioneInModifica(null);
                    setModalDonazioneAperta(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  + Registra Donazione
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={donazioniFiltrate.length > 0 && donazioniFiltrate.every(d => selezionatiIds.includes(d.id))}
                          onChange={handleToggleSelezionaTutti}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          title="Seleziona / Deseleziona tutti gli inserimenti visualizzati"
                        />
                      </th>
                      <th className="py-3 px-4">N° Quietanza / Data</th>
                      <th className="py-3 px-4">Donatore & Dati Fiscali</th>
                      <th className="py-3 px-4">Tipologia</th>
                      <th className="py-3 px-4">Causale & Progetto</th>
                      <th className="py-3 px-4">Metodo & Tracciabilità</th>
                      <th className="py-3 px-4 text-right">Importo (€)</th>
                      <th className="py-3 px-4 text-center">Fisco Art. 83</th>
                      <th className="py-3 px-4 text-right">Documenti & Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donazioniFiltrate.map((donazione) => (
                      <tr 
                        key={donazione.id} 
                        className={`hover:bg-slate-50/70 transition-colors ${
                          selezionatiIds.includes(donazione.id) ? 'bg-rose-50/50' : ''
                        } ${donazione.stato === 'annullata_ripensamento' ? 'opacity-70 bg-amber-50/30' : ''}`}
                      >
                        {/* Checkbox selezione riga */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selezionatiIds.includes(donazione.id)}
                            onChange={() => handleToggleSelezione(donazione.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        
                        {/* Ricevuta & Data */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="font-mono text-emerald-950 font-black">{donazione.ricevutaNumero}</span>
                            {donazione.stato === 'annullata_ripensamento' && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                Stornata (Risentimento)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{donazione.data} • Esercizio {donazione.anno}</span>
                          </div>
                        </td>

                        {/* Donatore & CF/P.IVA */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 leading-snug">
                            {donazione.donatore}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {donazione.codiceFiscalePartitaIva || 'Nessun CF/P.IVA'}
                          </div>
                          {(donazione.cittaDonatore || donazione.indirizzoDonatore) && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{donazione.cittaDonatore || donazione.indirizzoDonatore}</span>
                            </div>
                          )}
                        </td>

                        {/* Badge Tipologia */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getBadgeTipoDonatore(donazione.tipoDonatore)}
                        </td>

                        {/* Causale & Destinazione */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-800 font-medium line-clamp-1">
                            {donazione.causale}
                          </div>
                          <div className="text-[10.5px] text-emerald-800 font-semibold mt-0.5">
                            {donazione.destinazione || 'Attività Statutarie Generali'}
                          </div>
                          {donazione.campagnaId && (
                            <span className="inline-block mt-0.5 text-[9.5px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                              🎯 Campagna Fondi
                            </span>
                          )}
                        </td>

                        {/* Metodo & Tracciabilità */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            {donazione.metodo}
                          </span>
                          {donazione.estremiTracciabilita && (
                            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                              {donazione.estremiTracciabilita}
                            </div>
                          )}
                        </td>

                        {/* Importo */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <span className={`font-black text-sm font-mono ${
                            donazione.stato === 'annullata_ripensamento' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}>
                            € {donazione.importo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Trattamento Fiscale Art. 83 */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {donazione.detraibileFiscale ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800" title="Detraibile 30% IRPEF / Deducibile 10% IRES">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Art. 83 CTS</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600" title="Non tracciata - Quota ordinaria">
                              Ordinaria
                            </span>
                          )}
                        </td>

                        {/* Azioni e Documenti */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* Visualizza / Stampa Documenti Ufficiali */}
                            <button
                              onClick={() => setDonazionePerDocumento(donazione)}
                              className="px-2 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer border border-emerald-200"
                              title="Genera Quietanza Fiscale, Diploma di Benemerenza o Lettera del Presidente"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-600" />
                              <span>Quietanza / Diploma</span>
                            </button>

                            {/* Certificato Vincolo Fondi */}
                            <button
                              onClick={() => {
                                setDonazionePerCertificatoVincolo(donazione);
                                setModalCertificatoVincoloAperta(true);
                              }}
                              className="p-1 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer border border-amber-200"
                              title="Attestato Ufficiale di Destinazione Vincolata e Scheda Proposta Erogazione"
                            >
                              <Landmark className="w-3.5 h-3.5 text-amber-700" />
                              <span className="hidden xl:inline">Vincolo</span>
                            </button>

                            {/* Modifica */}
                            <button
                              onClick={() => {
                                setDonazioneInModifica(donazione);
                                setModalDonazioneAperta(true);
                              }}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Modifica Dati Donazione"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Azioni Eliminazione vs Ripristino */}
                            {donazione.stato === 'annullata_ripensamento' ? (
                              <button
                                type="button"
                                onClick={() => handleRipristinaDonazione(donazione.id)}
                                className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Ripristina la donazione allo stato attivo (rientra nei calcoli di bilancio)"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ripristina</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDonazioneDaCancellare(donazione);
                                  setMotivoCancellazione('Risentimento / Ripensamento del Donante (Revoca per ripensamento donazione ex art. 800 c.c.)');
                                  setTipoAzioneCancellazione('storno');
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Revoca per Ripensamento del Donante (Punto 1.4 - Soft Delete & Cestino)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: CAMPAGNE & PROGETTI VINCOLATI                   */}
      {/* ======================================================== */}
      {sottoScheda === 'campagne' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  <span>Campagne di Raccolta Fondi e Progetti con Destinazione Vincolata</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Istituisci iniziative speciali per attrarre contributi da cittadini, imprese e fondazioni bancarie del territorio
                </p>
              </div>

              <button
                onClick={() => {
                  setCampagnaInModifica(null);
                  setModalCampagnaAperta(true);
                }}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nuova Campagna</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {campagneConAvanzamento.map((camp) => (
                <div 
                  key={camp.id}
                  className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-b from-white to-slate-50/50 shadow-2xs hover:border-amber-300 transition-colors space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          camp.attiva 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {camp.attiva ? 'Campagna Attiva' : 'Conclusa / Chiusa'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          Esercizio {camp.anno}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">
                        {camp.titolo}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        setCampagnaInModifica(camp);
                        setModalCampagnaAperta(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                      title="Modifica Campagna"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {camp.descrizione && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {camp.descrizione}
                    </p>
                  )}

                  {/* Barra di Avanzamento */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-950 font-mono text-sm">
                        € {camp.raccolto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        <span className="text-slate-400 text-xs font-normal"> / target € {camp.obiettivoImporto.toLocaleString('it-IT')}</span>
                      </span>
                      <span className={`font-black font-mono ${camp.percentuale >= 100 ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {camp.percentuale}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          camp.percentuale >= 100 
                            ? 'bg-emerald-600' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-600'
                        }`}
                        style={{ width: `${Math.min(100, camp.percentuale)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{camp.numeroDonazioni} erogazioni liberali ricevute</span>
                    {camp.responsabileProgetto && (
                      <span className="text-[11px] italic truncate max-w-[180px]">
                        Resp: {camp.responsabileProgetto}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA: CONTO ECONOMICO SEZIONE C (MODELLO D RUNTS)       */}
      {/* ======================================================== */}
      {sottoScheda === 'conto_economico' && (
        <DonazioneContoEconomico
          donazioni={donazioni}
          campagne={campagne}
          config={config}
          annoSelezionato={annoAttivo || annoSelezionato}
        />
      )}

      {/* ======================================================== */}
      {/* VISTA: STATO PATRIMONIALE & RISERVE (MODELLO C RUNTS)    */}
      {/* ======================================================== */}
      {sottoScheda === 'stato_patrimoniale' && (
        <DonazioneStatoPatrimoniale
          donazioni={donazioni}
          campagne={campagne}
          config={config}
          annoSelezionato={annoAttivo || annoSelezionato}
        />
      )}

      {/* ======================================================== */}
      {/* VISTA: CENTRO ADEMPIMENTI RUNTS & FISCALE (730, ART. 87) */}
      {/* ======================================================== */}
      {sottoScheda === 'adempimenti' && (
        <DonazioneAdempimentiModal
          donazioni={donazioni}
          campagne={campagne}
          config={config}
          annoSelezionato={annoAttivo || annoSelezionato}
          onClose={() => setSottoScheda('elenco')}
          onAggiornaDonazione={handleAggiornaSingolaDonazione}
          onAggiornaCampagna={handleAggiornaCampagna}
        />
      )}

      {/* ======================================================== */}
      {/* VISTA 3: ATTESTAZIONI FISCALI ANNUALI (730 / REDDITI)    */}
      {/* ======================================================== */}
      {sottoScheda === 'certificati_annuali' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-700" />
                  <span>Riepilogo Donatori per Certificazione Fiscale Annuale (Modello 730 / Modello Redditi)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Genera con un clic l'attestazione cumulativa annuale conforme per il commercialista o CAF del donatore (Art. 83 CTS)
                </p>
              </div>

              <button
                onClick={() => {
                  setDonatoreSelezionatoCertificato(undefined);
                  setModalCertificatoAnnualeAperta(true);
                }}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Apri Finestra Certificati A4</span>
              </button>
            </div>

            {riepilogoDonatoriAnnuali.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                Nessun donatore registrato per l'esercizio selezionato.
              </div>
            ) : (
              <div className="overflow-x-auto pt-3">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Soggetto Donatore</th>
                      <th className="py-3 px-4">Codice Fiscale / P.IVA</th>
                      <th className="py-3 px-4">Tipologia</th>
                      <th className="py-3 px-4 text-center">N. Donazioni</th>
                      <th className="py-3 px-4 text-right">Totale Tracciato Detraibile</th>
                      <th className="py-3 px-4 text-right">Totale Complessivo</th>
                      <th className="py-3 px-4 text-right">Certificazione 730</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riepilogoDonatoriAnnuali.map((d) => (
                      <tr key={d.cf || d.donatore} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{d.donatore}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{d.cf || '—'}</td>
                        <td className="py-3 px-4">{getBadgeTipoDonatore(d.tipo)}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{d.conteggio}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
                          € {d.tracciabili.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          € {d.totale.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setDonatoreSelezionatoCertificato(d.cf || d.donatore);
                              setModalCertificatoAnnualeAperta(true);
                            }}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Genera Certificato</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 4: ANTEPRIMA LIBRO REGISTRO VIDIMABILE CTS         */}
      {/* ======================================================== */}
      {sottoScheda === 'registro_libro' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-700" />
                  <h3 className="text-base font-black text-slate-900">
                    Libro Registro Vidimabile Erogazioni Liberali Terzo Settore
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Documento contabile ufficiale vidimabile per Organo di Controllo, RUNTS e Collegio dei Revisori dei Conti
                </p>
              </div>

              <button
                onClick={() => setModalRegistroVidimabileAperta(true)}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Stampa Libro Registro Completo</span>
              </button>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Normativa Registro Cronologico delle Donazioni ex D.Lgs. 117/2017:</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11.5px]">
                Ai fini del mantenimento dell'iscrizione al RUNTS e per consentire la verifica fiscale delle erogazioni liberali da parte dell'Agenzia delle Entrate, la Pro Loco deve custodire un registro progressivo che certifichi la data, l'identità del donatore, il mezzo di tracciabilità bancaria e la corrispondenza con gli estratti conto dell'Ente.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setModalRegistroVidimabileAperta(true)}
                className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-2xl text-center text-xs text-indigo-900 hover:bg-indigo-50/50 transition cursor-pointer font-bold space-y-1"
              >
                <BookOpen className="w-6 h-6 text-indigo-700 mx-auto" />
                <div>Clicca qui per aprire la vista di stampa ufficiale in formato A4 vidimabile</div>
                <div className="text-[11px] text-slate-500 font-normal">
                  Include frontespizio, tabella progressiva di cassa e verbale di conformità controfirmabile dal Presidente e Tesoriere
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

      {/* 5. BOX GUIDA NORMATIVA AGEVOLAZIONI FISCALI ART. 83 */}
      <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200 text-xs text-emerald-950 space-y-3">
        <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Vademecum Fiscale: Agevolazioni Erogazioni Liberali e Donazioni da Terzi (Art. 83 CTS)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-slate-700 leading-relaxed">
          <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Persone Fisiche (Privati Cittadini)
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Le persone fisiche possono <strong>detrarre dall'IRPEF il 30%</strong> dell'erogazione liberale effettuata a favore della Pro Loco (fino a un massimo di <strong>30.000 €</strong> per periodo d'imposta), oppure in alternativa <strong>dedurre</strong> la donazione dal reddito complessivo netto fino al 10%.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
            <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              Aziende, Imprese ed Enti Giuridici
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Le aziende e società possono <strong>dedurre dal reddito d'impresa</strong> le donazioni erogate nel limite del <strong>10% del reddito complessivo</strong> dichiarato. L'eccedenza può essere computata in aumento nei periodi d'imposta successivi fino al quarto anno.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 font-semibold border-t border-emerald-200/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Condizione essenziale di validità: il pagamento deve obbligatoriamente avvenire tramite sistemi tracciabili (Bonifico bancario/postale, POS, Carta di credito/debito, Assegno). I contanti non danno diritto a detrazione.</span>
        </div>
      </div>

      {/* ==================== MODALI ==================== */}

      {/* 1. Modale Registrazione / Modifica Donazione */}
      {modalDonazioneAperta && (
        <DonazioneModal
          donazione={donazioneInModifica}
          annoSelezionato={annoAttivo || config.annoCorrente}
          prossimoNumeroRicevuta={prossimoNumeroRicevuta}
          campagne={campagne.filter(c => c.attiva)}
          onSalva={handleSalvaDonazione}
          onClose={() => {
            setModalDonazioneAperta(false);
            setDonazioneInModifica(null);
          }}
        />
      )}

      {/* 2. Modale Suite Documenti & Ricevuta Ufficiale A4 */}
      {donazionePerDocumento && (
        <DonazioneRicevutaModal
          donazione={donazionePerDocumento}
          config={config}
          onClose={() => setDonazionePerDocumento(null)}
        />
      )}

      {/* 3. Modale Certificazione Annuale per Modello 730 */}
      {modalCertificatoAnnualeAperta && (
        <DonazioneCertificatoAnnualeModal
          donazioni={donazioni}
          config={config}
          annoSelezionato={annoAttivo || config.annoCorrente}
          donatoreIniziale={donatoreSelezionatoCertificato}
          onClose={() => {
            setModalCertificatoAnnualeAperta(false);
            setDonatoreSelezionatoCertificato(undefined);
          }}
        />
      )}

      {/* 4. Modale Libro Registro Vidimabile CTS */}
      {modalRegistroVidimabileAperta && (
        <DonazioneRegistroVidimabileModal
          donazioni={donazioni}
          config={config}
          annoSelezionato={annoAttivo || undefined}
          onClose={() => setModalRegistroVidimabileAperta(false)}
        />
      )}

      {/* 5. Modale Campagna Raccolta Fondi */}
      {modalCampagnaAperta && (
        <CampagnaFondiModal
          campagna={campagnaInModifica}
          annoSelezionato={annoAttivo || config.annoCorrente}
          onSalva={handleSalvaCampagna}
          onClose={() => {
            setModalCampagnaAperta(false);
            setCampagnaInModifica(null);
          }}
        />
      )}

      {/* 6. Modale Certificato di Destinazione Vincolata Fondi & Scheda Proposta */}
      {modalCertificatoVincoloAperta && (
        <DonazioneCertificatoVincoloModal
          donazione={donazionePerCertificatoVincolo}
          donazioni={donazioni}
          campagne={campagne}
          config={config}
          onClose={() => {
            setModalCertificatoVincoloAperta(false);
            setDonazionePerCertificatoVincolo(null);
          }}
        />
      )}

      {/* 7. Modale Cancellazione Singola per Risentimento / Ripensamento del Donante */}
      {(donazioneDaCancellare || (idDaEliminare && donazioni.find(d => d.id === idDaEliminare))) && (() => {
        const item = donazioneDaCancellare || donazioni.find(d => d.id === idDaEliminare)!;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
              
              <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    Punto 1.4: Annullamento per Ripensamento del Donante
                  </h4>
                  <p className="text-xs text-slate-500">
                    Meccanismo di Soft Delete ex art. 800 c.c. con archiviazione nel Cestino di Sistema
                  </p>
                </div>
              </div>

              {/* Dettagli della donazione */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Soggetto Donatore:</span>
                  <strong className="text-slate-900">{item.donatore}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">N° Quietanza / Data:</span>
                  <span className="font-mono font-bold text-slate-800">{item.ricevutaNumero} ({item.data})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Importo Donato:</span>
                  <strong className="text-rose-700 font-mono font-black text-sm">€ {item.importo.toFixed(2)}</strong>
                </div>
                {item.codiceFiscalePartitaIva && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Codice Fiscale / P.IVA:</span>
                    <span className="font-mono text-slate-700">{item.codiceFiscalePartitaIva}</span>
                  </div>
                )}
              </div>

              {/* Spiegazione Soft Delete & Isolamento Matematico */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950">
                <span className="font-extrabold text-amber-900 block flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-700" />
                  Effetto Contabile & Normativo del Soft Delete:
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Il record viene contrassegnato come eliminato per conservare la traccia storica probatoria legale. Verrà inviato al <strong>Cestino di Sistema (Audit Log)</strong> e sarà <strong>completamente escluso da ogni calcolo matematico, statistico o finanziario</strong> dell'applicazione (730 AdE, Rendiconti RUNTS e Bilancio di Cassa).
                </p>
              </div>

              {/* Causale di Risentimento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Causale Formale di Ripensamento / Revoca:
                </label>
                <select
                  value={motivoCancellazione}
                  onChange={(e) => setMotivoCancellazione(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="Ripensamento del donante (Revoca per ripensamento donazione ex art. 800 c.c.)">
                    Ripensamento del donante (Revoca per ripensamento donazione ex art. 800 c.c.)
                  </option>
                  <option value="Richiesta formale di storno e rimborso somme da parte del donante">
                    Richiesta formale di storno e rimborso somme da parte del donante
                  </option>
                  <option value="Opposizione donatore e revoca consenso trattamento / cancellazione dati personali">
                    Opposizione donatore e revoca consenso trattamento / cancellazione dati personali
                  </option>
                  <option value="Contestazione destinazione fondi / mancata adesione alla finalità">
                    Contestazione destinazione fondi / mancata adesione alla finalità
                  </option>
                  <option value="Errore materiale di registrazione o duplicato">
                    Errore materiale di registrazione o duplicato
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDonazioneDaCancellare(null);
                    setIdDaEliminare(null);
                  }}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfermaCancellazioneSingola}
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Conferma Annullamento (Soft Delete 1.4)</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 8. Modale Cancellazione Inserimenti Selezionati per Risentimento */}
      {modalCancellazioneSelezionatiAperta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Cancellazione {selezionatiIds.length} Inserimenti Selezionati
                </h4>
                <p className="text-xs text-slate-500">
                  Revoca per risentimento / ripensamento dei soggetti donatori
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 text-xs space-y-2 text-rose-950">
              <div className="flex justify-between font-bold">
                <span>Donazioni selezionate:</span>
                <span>{selezionatiIds.length} registrazioni</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Totale importo da revocare:</span>
                <span className="font-mono">
                  € {donazioni.filter(d => selezionatiIds.includes(d.id)).reduce((a, b) => a + (b.importo || 0), 0).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed pt-1 border-t border-rose-200">
                Confermando, gli inserimenti selezionati verranno rimossi dal registro a causa del risentimento del donante e il rendiconto di cassa verrà tempestivamente ricalcolato.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Motivazione Ufficiale:
              </label>
              <input
                type="text"
                value={motivoCancellazione}
                onChange={(e) => setMotivoCancellazione(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalCancellazioneSelezionatiAperta(false)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfermaCancellazioneSelezionati}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancella {selezionatiIds.length} Inserimenti</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 9. Modale Cancellazione di TUTTI gli Inserimenti (Risentimento Donanti) */}
      {modalCancellazioneTuttiAperta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Cancellazione Massiva Inserimenti Donazioni (Punto 1.4)
                </h4>
                <p className="text-xs text-slate-500">
                  Revoca e cancellazione di tutti gli inserimenti per risentimento / ripensamento donante
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Questa procedura consente di cancellare gli inserimenti delle donazioni registrate a seguito del <strong>risentimento del donante</strong>, ripensamento o revoca formale del contributo (Art. 800 c.c. / opposizione).
            </p>

            {/* Selezione Ambito Cancellazione */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Seleziona quali inserimenti cancellare:
              </label>
              
              <div className="space-y-2">
                {annoAttivo && (
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    ambitoCancellazioneTutti === 'anno' ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="ambitoCancellazione"
                      checked={ambitoCancellazioneTutti === 'anno'}
                      onChange={() => setAmbitoCancellazioneTutti('anno')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">
                        Cancella tutte le donazioni dell'Esercizio {annoAttivo}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rimuove {donazioni.filter(d => d.anno === annoAttivo).length} registrazioni (Totale: € {donazioni.filter(d => d.anno === annoAttivo).reduce((a, b) => a + (b.importo || 0), 0).toFixed(2)})
                      </div>
                    </div>
                  </label>
                )}

                <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  ambitoCancellazioneTutti === 'tutti' ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="ambitoCancellazione"
                    checked={ambitoCancellazioneTutti === 'tutti'}
                    onChange={() => setAmbitoCancellazioneTutti('tutti')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">
                      Cancella TUTTI gli inserimenti dell'archivio (Tutti gli anni)
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Rimuove tutti i {donazioni.length} inserimenti registrati (Totale storico: € {donazioni.reduce((a, b) => a + (b.importo || 0), 0).toFixed(2)})
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Motivo di Risentimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Motivazione Formale di Risentimento / Revoca:
              </label>
              <input
                type="text"
                value={motivoCancellazione}
                onChange={(e) => setMotivoCancellazione(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Attenzione: la cancellazione è immediata e azzererà la cassa e le metriche delle donazioni eliminate. Se desideri salvare una copia di sicurezza prima di cancellare, puoi scaricare il file CSV.
              </span>
            </div>

            {/* Azioni Modale */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalCancellazioneTuttiAperta(false)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfermaCancellazioneTutti}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Conferma Cancellazione di Tutti gli Inserimenti</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
