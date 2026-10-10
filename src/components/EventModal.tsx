import React, { useState, useMemo } from 'react';
import { ProLocoEvento, CategoriaEvento, StatoEvento, Socio, DettaglioSpeseEvento, TipoEvento, StandEvento, FasciaOrariaTurno, MansioneStand, AssegnazioneVolontarioStand } from '../types';
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Euro, 
  ShieldCheck, 
  FileText, 
  Image as ImageIcon,
  CheckSquare,
  Square,
  AlertTriangle,
  Utensils,
  Music,
  Truck,
  MoreHorizontal,
  PieChart as PieChartIcon,
  Handshake,
  Briefcase,
  Sparkles,
  Info,
  CheckCircle2,
  Store,
  Plus,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ListChecks
} from 'lucide-react';
import { EventBudgetChart } from './EventBudgetChart';
import { calcolaEconomiaEvento, getInfoTipoEvento } from '../utils/eventoHelpers';
import { STAND_SIMULATI_DEFAULT } from '../storage';
import { FASCE_ORARIE_TURNO, MANSIONI_STAND } from './EventStandsModal';

interface EventModalProps {
  evento: ProLocoEvento | null; // null se è nuovo
  soci: Socio[];
  annoPredefinito: number;
  stepIniziale?: 1 | 2 | 3 | 4 | 5;
  onSalva: (evento: ProLocoEvento) => void;
  onClose: () => void;
}

const CATEGORIE: CategoriaEvento[] = [
  'Enogastronomia & Sagra',
  'Festa Tradizionale & Patronale',
  'Musica, Spettacolo & Teatro',
  'Cultura, Arte & Mostre',
  'Visita Guidata & Escursione',
  'Mercatino & Fiera Tipica',
  'Sport & Tempo Libero',
  'Assemblea & Riunione Soci'
];

const IMMAGINI_SUGGERITE: { label: string; url: string }[] = [
  { label: 'Sagra / Gastronomia', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=700&auto=format&fit=crop&q=80' },
  { label: 'Festa Storica / Borgo', url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=700&auto=format&fit=crop&q=80' },
  { label: 'Musica / Spettacolo', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&auto=format&fit=crop&q=80' },
  { label: 'Natura / Escursione', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&auto=format&fit=crop&q=80' },
  { label: 'Mercato / Fiera', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=700&auto=format&fit=crop&q=80' },
  { label: 'Mostra / Arte', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=700&auto=format&fit=crop&q=80' }
];

export const EventModal: React.FC<EventModalProps> = ({
  evento,
  soci,
  annoPredefinito,
  stepIniziale = 1,
  onSalva,
  onClose,
}) => {
  const isModifica = !!evento;
  const [stepAttivo, setStepAttivo] = useState<1 | 2 | 3 | 4 | 5>(stepIniziale);
  const [modalitaSequenziale, setModalitaSequenziale] = useState<boolean>(true);

  const [titolo, setTitolo] = useState(evento?.titolo || '');
  const [categoria, setCategoria] = useState<CategoriaEvento>(evento?.categoria || 'Enogastronomia & Sagra');
  const [dataInizio, setDataInizio] = useState(evento?.dataInizio || '');
  const [oraInizio, setOraInizio] = useState(evento?.oraInizio || '');
  const [dataFine, setDataFine] = useState(evento?.dataFine || '');
  const [oraFine, setOraFine] = useState(evento?.oraFine || '');
  const [luogo, setLuogo] = useState(evento?.luogo || '');
  const [stato, setStato] = useState<StatoEvento>(evento?.stato || 'in_programma');
  const [descrizione, setDescrizione] = useState(evento?.descrizione || '');
  const [locandina, setLocandina] = useState(evento?.locandina || '');

  // Economia Evento - Voci Analitiche (Food, Intrattenimento, Altre Spese, Varie)
  const [spesePrev, setSpesePrev] = useState<DettaglioSpeseEvento>(
    evento?.spesePreventivo || {
      food: evento ? Math.round((evento.budgetPrevisto || 0) * 0.45) : 0,
      intrattenimento: evento ? Math.round((evento.budgetPrevisto || 0) * 0.25) : 0,
      altreSpese: evento ? Math.round((evento.budgetPrevisto || 0) * 0.20) : 0,
      varie: evento ? Math.round((evento.budgetPrevisto || 0) * 0.10) : 0,
    }
  );

  const [speseCons, setSpeseCons] = useState<DettaglioSpeseEvento>(
    evento?.speseConsuntivo || {
      food: evento ? Math.round((evento.costiSostenuti || 0) * 0.50) : 0,
      intrattenimento: evento ? Math.round((evento.costiSostenuti || 0) * 0.25) : 0,
      altreSpese: evento ? Math.round((evento.costiSostenuti || 0) * 0.15) : 0,
      varie: evento ? Math.round((evento.costiSostenuti || 0) * 0.10) : 0,
    }
  );

  const [entratePreviste, setEntratePreviste] = useState<number>(
    evento ? (evento.entratePreviste ?? (evento.budgetPrevisto || 0)) : 0
  );
  const [entrateRealizzate, setEntrateRealizzate] = useState<number>(
    evento?.entrateRealizzate || 0
  );
  const [mostraGraficoTorta, setMostraGraficoTorta] = useState<boolean>(true);

  // Calcolo somme automatiche
  const totalePreventivo = useMemo(() => {
    return (
      (Number(spesePrev.food) || 0) +
      (Number(spesePrev.intrattenimento) || 0) +
      (Number(spesePrev.altreSpese) || 0) +
      (Number(spesePrev.varie) || 0)
    );
  }, [spesePrev]);

  const totaleConsuntivo = useMemo(() => {
    return (
      (Number(speseCons.food) || 0) +
      (Number(speseCons.intrattenimento) || 0) +
      (Number(speseCons.altreSpese) || 0) +
      (Number(speseCons.varie) || 0)
    );
  }, [speseCons]);

  // Differenza tra i costi
  const differenzaCosti = totaleConsuntivo - totalePreventivo;

  // Differenza tra entrate e costi
  const margineConsuntivo = (Number(entrateRealizzate) || 0) - totaleConsuntivo;
  const marginePreventivo = (Number(entratePreviste) || 0) - totalePreventivo;

  // Tipologia Evento: 1. Nativo, 2. Ibrido, 3. Gestione
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>(evento?.tipoEvento || 'nativo');

  // Gestione Economica Ibrido (Co-organizzazione)
  const [partnerIbridoNome, setPartnerIbridoNome] = useState<string>(evento?.partnerIbridoNome || '');
  const [percentualeSpeseProLoco, setPercentualeSpeseProLoco] = useState<number>(
    evento?.percentualeSpeseProLoco !== undefined ? evento.percentualeSpeseProLoco : 50
  );
  const [percentualeEntrateProLoco, setPercentualeEntrateProLoco] = useState<number>(
    evento?.percentualeEntrateProLoco !== undefined ? evento.percentualeEntrateProLoco : 50
  );
  const [contributoPartner, setContributoPartner] = useState<number>(evento?.contributoPartner || 0);

  // Gestione Economica Gestione (Conto Terzi per Committente)
  const [committenteNome, setCommittenteNome] = useState<string>(evento?.committenteNome || '');
  const [tipoAccordoGestione, setTipoAccordoGestione] = useState<'compenso_forfettario' | 'rimborso_piu_fee' | 'incassi_delegati'>(
    evento?.tipoAccordoGestione || 'compenso_forfettario'
  );
  const [compensoGestione, setCompensoGestione] = useState<number>(evento?.compensoGestione || 0);
  const [rimborsoSpeseCommittente, setRimborsoSpeseCommittente] = useState<number>(evento?.rimborsoSpeseCommittente || 0);

  // Volontari e Responsabile
  const [volontariIds, setVolontariIds] = useState<string[]>(evento?.volontariIds || []);
  const [responsabileId, setResponsabileId] = useState<string>(evento?.responsabileId || '');

  // Gestione Iscrizioni Soci & Capienza Evento
  const [iscrizioniAperte, setIscrizioniAperte] = useState<boolean>(evento ? (evento.iscrizioniAperte ?? true) : false);
  const [postiMassimi, setPostiMassimi] = useState<number>(evento?.postiMassimi || 0);
  const [quotaIscrizioneSocio, setQuotaIscrizioneSocio] = useState<number>(evento?.quotaIscrizioneSocio || 0);

  // Stand Numerati con Tipologia e Riferimento Food (azzerati per nuovo evento)
  const [standNumerati, setStandNumerati] = useState<StandEvento[]>(() => {
    if (!evento) {
      return [];
    }
    const list = Array.isArray(evento.standNumerati) ? evento.standNumerati : [];
    return list.map((s) => ({
      ...s,
      spesaPreventivo: s.spesaPreventivo ?? 0,
      spesaConsuntivo: s.spesaConsuntivo ?? 0,
      incassoPrevisto: s.incassoPrevisto ?? (s.incassoStimato || 0),
      incassoConsuntivo: s.incassoConsuntivo ?? (s.incassoStimato || 0),
      orarioAperturaStand: s.orarioAperturaStand ?? '18:30 - 23:30',
      volontariRichiesti: s.volontariRichiesti ?? 3,
      turniAssegnazioni: Array.isArray(s.turniAssegnazioni) ? [...s.turniAssegnazioni] : []
    }));
  });

  // Stato per inserimento rapido turno nello stand dentro EventModal
  const [standTurnoApertoIdx, setStandTurnoApertoIdx] = useState<number | null>(null);
  const [turnoSocioId, setTurnoSocioId] = useState<string>('');
  const [turnoNomeManuale, setTurnoNomeManuale] = useState<string>('');
  const [turnoMansione, setTurnoMansione] = useState<MansioneStand>('Servizio ai Tavoli / Runner');
  const [turnoFascia, setTurnoFascia] = useState<FasciaOrariaTurno>('Cena (Servizio Serale)');
  const [turnoOrarioSpec, setTurnoOrarioSpec] = useState<string>('18:30 - 23:30');

  const handleAggiungiTurnoInModal = (standIdx: number) => {
    const sSel = soci.find(s => s.id === turnoSocioId);
    const nom = sSel ? `${sSel.nome} ${sSel.cognome}` : turnoNomeManuale.trim();
    if (!nom) return;

    const nuovoTurno: AssegnazioneVolontarioStand = {
      id: `trn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      socioId: sSel?.id,
      nomeVolontario: nom,
      nominativo: nom,
      numeroTessera: sSel?.numeroTessera,
      telefono: sSel?.telefono || '',
      mansione: turnoMansione,
      fasciaOraria: turnoFascia,
      orarioSpecifico: turnoOrarioSpec.trim() || undefined,
      orarioInizio: '18:30',
      orarioFine: '23:30',
      confermato: true
    };

    setStandNumerati(prev => {
      const copy = [...prev];
      const attuali = copy[standIdx].turniAssegnazioni || [];
      copy[standIdx] = {
        ...copy[standIdx],
        turniAssegnazioni: [...attuali, nuovoTurno]
      };
      return copy;
    });

    if (sSel && !volontariIds.includes(sSel.id)) {
      setVolontariIds(prev => [...prev, sSel.id]);
    }

    setTurnoSocioId('');
    setTurnoNomeManuale('');
  };

  const handleRimuoviTurnoInModal = (standIdx: number, turnoId: string) => {
    setStandNumerati(prev => {
      const copy = [...prev];
      const attuali = copy[standIdx].turniAssegnazioni || [];
      copy[standIdx] = {
        ...copy[standIdx],
        turniAssegnazioni: attuali.filter(t => t.id !== turnoId)
      };
      return copy;
    });
  };

  // Calcolo aggregato cifre stand (spese, incassi, margini e differenze)
  const totaliStand = useMemo(() => {
    let totSpesePrev = 0;
    let totSpeseCons = 0;
    let totIncassiPrev = 0;
    let totIncassiCons = 0;
    let totFoodSpesePrev = 0;
    let totFoodSpeseCons = 0;
    let totAltreSpesePrev = 0;
    let totAltreSpeseCons = 0;

    standNumerati.forEach(s => {
      const spP = Number(s.spesaPreventivo) || 0;
      const spC = Number(s.spesaConsuntivo) || 0;
      const inP = Number(s.incassoPrevisto) || 0;
      const inC = Number(s.incassoConsuntivo) || 0;

      totSpesePrev += spP;
      totSpeseCons += spC;
      totIncassiPrev += inP;
      totIncassiCons += inC;

      if (s.riferimentoFood) {
        totFoodSpesePrev += spP;
        totFoodSpeseCons += spC;
      } else {
        totAltreSpesePrev += spP;
        totAltreSpeseCons += spC;
      }
    });

    const diffSpese = totSpeseCons - totSpesePrev;
    const diffIncassi = totIncassiCons - totIncassiPrev;
    const margineCons = totIncassiCons - totSpeseCons;
    const marginePrev = totIncassiPrev - totSpesePrev;

    return {
      totSpesePrev,
      totSpeseCons,
      diffSpese,
      totIncassiPrev,
      totIncassiCons,
      diffIncassi,
      margineCons,
      marginePrev,
      totFoodSpesePrev,
      totFoodSpeseCons,
      totAltreSpesePrev,
      totAltreSpeseCons,
      conteggioFood: standNumerati.filter(s => s.riferimentoFood).length
    };
  }, [standNumerati]);

  const handleAggiornaStand = (index: number, campo: keyof StandEvento, valore: any) => {
    setStandNumerati(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [campo]: valore
      };
      return copy;
    });
  };

  const handleAggiungiStand = () => {
    const maxNum = standNumerati.reduce((max, s) => Math.max(max, Number(s.numero) || 0), 0);
    const nuovoNum = maxNum + 1;
    const nuovoStand: StandEvento = {
      id: `std-${Date.now()}`,
      numero: nuovoNum,
      nome: `Stand #${nuovoNum}`,
      tipologia: 'Food / Gastronomia',
      riferimentoFood: true,
      responsabile: '',
      spesaPreventivo: 0,
      spesaConsuntivo: 0,
      incassoPrevisto: 0,
      incassoConsuntivo: 0,
      descrizione: ''
    };
    setStandNumerati(prev => [...prev, nuovoStand]);
  };

  const handleRimuoviStand = (index: number) => {
    setStandNumerati(prev => prev.filter((_, i) => i !== index));
  };

  const handleOrdinaStandPerNumero = () => {
    setStandNumerati(prev => [...prev].sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0)));
  };

  const handleRipristinaStandPredefiniti = () => {
    setStandNumerati(STAND_SIMULATI_DEFAULT);
  };

  const handleAzzeraStand = () => {
    setStandNumerati([]);
  };

  const handleSincronizzaTotaliStand = () => {
    setSpesePrev(prev => ({
      ...prev,
      food: totaliStand.totFoodSpesePrev > 0 ? totaliStand.totFoodSpesePrev : prev.food,
      altreSpese: totaliStand.totAltreSpesePrev > 0 ? totaliStand.totAltreSpesePrev : prev.altreSpese
    }));
    setSpeseCons(prev => ({
      ...prev,
      food: totaliStand.totFoodSpeseCons > 0 ? totaliStand.totFoodSpeseCons : prev.food,
      altreSpese: totaliStand.totAltreSpeseCons > 0 ? totaliStand.totAltreSpeseCons : prev.altreSpese
    }));
    if (totaliStand.totIncassiPrev > 0) {
      setEntratePreviste(totaliStand.totIncassiPrev);
    }
    if (totaliStand.totIncassiCons > 0) {
      setEntrateRealizzate(totaliStand.totIncassiCons);
    }
  };

  // Calcolo dinamico dell'economia specifica per tipologia evento
  const economiaCalcolata = useMemo(() => {
    const mockEvento: ProLocoEvento = {
      id: evento?.id || 'temp',
      titolo,
      categoria,
      dataInizio,
      dataFine,
      luogo,
      stato,
      descrizione: '',
      volontariIds: [],
      permessoComunale: false,
      licenzaSIAE: false,
      pianoSicurezzaSafety: false,
      aslHaccp: false,
      partecipantiStimati: 0,
      tipoEvento,
      partnerIbridoNome,
      percentualeSpeseProLoco,
      percentualeEntrateProLoco,
      contributoPartner,
      committenteNome,
      tipoAccordoGestione,
      compensoGestione,
      rimborsoSpeseCommittente,
      spesePreventivo: spesePrev,
      speseConsuntivo: speseCons,
      budgetPrevisto: totalePreventivo,
      costiSostenuti: totaleConsuntivo,
      entratePreviste: Number(entratePreviste) || 0,
      entrateRealizzate: Number(entrateRealizzate) || 0,
    };
    return calcolaEconomiaEvento(mockEvento);
  }, [
    evento?.id, titolo, categoria, dataInizio, dataFine, luogo, stato,
    tipoEvento, partnerIbridoNome, percentualeSpeseProLoco, percentualeEntrateProLoco,
    contributoPartner, committenteNome, tipoAccordoGestione, compensoGestione,
    rimborsoSpeseCommittente, spesePrev, speseCons, totalePreventivo,
    totaleConsuntivo, entratePreviste, entrateRealizzate
  ]);

  // Permessi & Burocrazia (azzerati per nuovo evento)
  const [permessoComunale, setPermessoComunale] = useState<boolean>(evento ? evento.permessoComunale : false);
  const [licenzaSIAE, setLicenzaSIAE] = useState<boolean>(evento ? evento.licenzaSIAE : false);
  const [pianoSicurezzaSafety, setPianoSicurezzaSafety] = useState<boolean>(evento ? evento.pianoSicurezzaSafety : false);
  const [aslHaccp, setAslHaccp] = useState<boolean>(evento ? evento.aslHaccp : false);

  const [partecipantiStimati, setPartecipantiStimati] = useState<number>(evento?.partecipantiStimati || 0);
  const [noteOrganizzative, setNoteOrganizzative] = useState(evento?.noteOrganizzative || '');

  const [errore, setErrore] = useState<string | null>(null);

  const STEPS_EVENTO = [
    { num: 1 as const, titolo: '1. Dati, Date & Modello', desc: 'Titolo, date, luogo, locandina e modello (Nativo/Ibrido/Terzi)' },
    { num: 2 as const, titolo: '2. Squadra & Iscrizioni', desc: 'Coordinatore, volontari da Albo 1.1 e capienza soci' },
    { num: 3 as const, titolo: '3. Stand & Turni', desc: 'Stand numerati #1..N, costi/incassi e turni per stand' },
    { num: 4 as const, titolo: '4. Quadro Economico', desc: '4 Voci di spesa, entrate e ripartizione bilancio' },
    { num: 5 as const, titolo: '5. Permessi & Conferma', desc: 'Comune, SIAE, Safety, HACCP e riepilogo finale' },
  ];

  const validaStepCorrente = (stepTarget: number): boolean => {
    if (stepTarget > 1) {
      if (!titolo.trim()) {
        setErrore('Step 1 incompleto: inserisci il Titolo dell\'evento prima di proseguire in sequenza.');
        setStepAttivo(1);
        return false;
      }
      if (!dataInizio) {
        setErrore('Step 1 incompleto: imposta la Data di Inizio prima di proseguire in sequenza.');
        setStepAttivo(1);
        return false;
      }
      if (!luogo.trim()) {
        setErrore('Step 1 incompleto: indica il Luogo / Piazza dell\'evento prima di proseguire in sequenza.');
        setStepAttivo(1);
        return false;
      }
    }
    setErrore(null);
    return true;
  };

  const handleVaiAStep = (target: 1 | 2 | 3 | 4 | 5) => {
    if (validaStepCorrente(target)) {
      setStepAttivo(target);
    }
  };

  const handleStepSuccessivo = () => {
    if (stepAttivo < 5 && validaStepCorrente(stepAttivo + 1)) {
      setStepAttivo((stepAttivo + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleStepPrecedente = () => {
    if (stepAttivo > 1) {
      setErrore(null);
      setStepAttivo((stepAttivo - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleToggleVolontario = (socioId: string) => {
    if (volontariIds.includes(socioId)) {
      setVolontariIds(volontariIds.filter(id => id !== socioId));
    } else {
      setVolontariIds([...volontariIds, socioId]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('L\'immagine è troppo pesante. Scegli un\'immagine inferiore a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocandina(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim()) {
      setErrore('Il titolo dell\'evento è obbligatorio.');
      return;
    }
    if (!dataInizio) {
      setErrore('La data di inizio è obbligatoria.');
      return;
    }
    if (!luogo.trim()) {
      setErrore('Il luogo dell\'evento è obbligatorio.');
      return;
    }

    // Sincronizza automaticamente i soci assegnati nei turni degli stand con la squadra operativa dell'evento
    const sociSet = new Set<string>(volontariIds);
    standNumerati.forEach(st => {
      (st.turniAssegnazioni || []).forEach(t => {
        if (t.socioId) sociSet.add(t.socioId);
      });
    });

    const nuovoEvento: ProLocoEvento = {
      id: evento?.id || `evento-${Date.now()}`,
      titolo: titolo.trim(),
      categoria,
      dataInizio,
      oraInizio,
      dataFine: dataFine || dataInizio,
      oraFine,
      luogo: luogo.trim(),
      stato,
      tipoEvento,
      standNumerati,
      partnerIbridoNome: tipoEvento === 'ibrido' ? partnerIbridoNome.trim() : undefined,
      percentualeSpeseProLoco: tipoEvento === 'ibrido' ? Number(percentualeSpeseProLoco) || 0 : undefined,
      percentualeEntrateProLoco: tipoEvento === 'ibrido' ? Number(percentualeEntrateProLoco) || 0 : undefined,
      contributoPartner: tipoEvento === 'ibrido' ? Number(contributoPartner) || 0 : undefined,
      committenteNome: tipoEvento === 'gestione' ? committenteNome.trim() : undefined,
      tipoAccordoGestione: tipoEvento === 'gestione' ? tipoAccordoGestione : undefined,
      compensoGestione: tipoEvento === 'gestione' ? Number(compensoGestione) || 0 : undefined,
      rimborsoSpeseCommittente: tipoEvento === 'gestione' ? Number(rimborsoSpeseCommittente) || 0 : undefined,
      descrizione: descrizione.trim(),
      locandina,
      budgetPrevisto: totalePreventivo,
      costiSostenuti: totaleConsuntivo,
      entratePreviste: Number(entratePreviste) || 0,
      entrateRealizzate: Number(entrateRealizzate) || 0,
      spesePreventivo: spesePrev,
      speseConsuntivo: speseCons,
      volontariIds: Array.from(sociSet),
      responsabileId,
      permessoComunale,
      licenzaSIAE,
      pianoSicurezzaSafety,
      aslHaccp,
      partecipantiStimati: Number(partecipantiStimati) || 0,
      noteOrganizzative: noteOrganizzative.trim(),
      iscrizioni: evento?.iscrizioni || [],
      iscrizioniAperte,
      postiMassimi: Number(postiMassimi) || 0,
      quotaIscrizioneSocio: Number(quotaIscrizioneSocio) || 0
    };

    onSalva(nuovoEvento);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[94vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Intestazione modale - Fissa in alto */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Calendar className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isModifica ? 'Modifica Evento Pro Loco' : 'Pianifica Nuovo Evento in Programma'}
              </h3>
              <p className="text-xs text-slate-500">
                Programmazione sagra/evento, 4 voci di spesa, volontari e sicurezza
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Assetto Organizzativo Sezionato in 5 Step Sequenziali */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-emerald-700 text-white">
                Inserimento in Sequenza • Step {stepAttivo} di 5
              </span>
              <span className="text-xs font-bold text-slate-800">
                {STEPS_EVENTO[stepAttivo - 1].titolo}
              </span>
              <span className="hidden md:inline text-[11px] text-slate-500">
                — {STEPS_EVENTO[stepAttivo - 1].desc}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setModalitaSequenziale(!modalitaSequenziale)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                modalitaSequenziale
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Passa tra l'inserimento guidato a step in sequenza e la vista completa"
            >
              <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
              <span>{modalitaSequenziale ? 'Modalità a Step in Sequenza (Attiva)' : 'Passa a Step in Sequenza'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {STEPS_EVENTO.map((st) => {
              const isCurrent = modalitaSequenziale && stepAttivo === st.num;
              const isCompleted = stepAttivo > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => {
                    if (modalitaSequenziale) {
                      handleVaiAStep(st.num);
                    } else {
                      const ids = ['sezione-dati-evento', 'sezione-staff-evento', 'sezione-stand-evento', 'sezione-economia-evento', 'sezione-permessi-evento'];
                      document.getElementById(ids[st.num - 1])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                    isCurrent
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500/30'
                      : isCompleted
                      ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:bg-emerald-100/80'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-white text-emerald-900'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCompleted ? '✓' : st.num}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-extrabold truncate ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                      {st.titolo.replace(/^\d+\.\s*/, '')}
                    </div>
                    <div className={`text-[9.5px] truncate ${isCurrent ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Step {st.num}/5
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {errore && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errore}</span>
          </div>
        )}

        {/* Form dati evento con scorrimento interno e footer fisso */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0 text-xs text-slate-700">
          
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-6">
          
            {/* STEP 1: Dati Essenziali, Date, Locandina & Scelta Modello Organizzativo */}
            <div className={modalitaSequenziale && stepAttivo !== 1 ? 'hidden' : 'order-1 space-y-5'}>
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                    Step 1 di 5 • Dati, Date & Modello
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                    Inserimento Anagrafica Manifestazione, Date, Luogo e Modello Organizzativo
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['nativo', 'ibrido', 'gestione'] as TipoEvento[]).map((t, idx) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoEvento(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        tipoEvento === t
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                      }`}
                    >
                      {idx + 1}. {t === 'nativo' ? 'Nativo Pro Loco' : t === 'ibrido' ? 'Ibrido (Partner)' : 'Conto Terzi'}
                    </button>
                  ))}
                </div>
              </div>

            <div id="sezione-dati-evento" className="space-y-4 scroll-mt-2">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">
                  Titolo dell'Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Sagra del Fungo Porcino e della Castagna"
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaEvento)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  {CATEGORIE.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date e Orari */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data Inizio *
                </label>
                <input
                  type="date"
                  required
                  value={dataInizio}
                  onChange={(e) => {
                    setDataInizio(e.target.value);
                    if (!dataFine || dataFine < e.target.value) setDataFine(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ora Inizio
                </label>
                <input
                  type="time"
                  value={oraInizio}
                  onChange={(e) => setOraInizio(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data Fine
                </label>
                <input
                  type="date"
                  value={dataFine}
                  onChange={(e) => setDataFine(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ora Fine
                </label>
                <input
                  type="time"
                  value={oraFine}
                  onChange={(e) => setOraFine(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            {/* Luogo, Stato e Partecipanti */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Luogo / Piazza *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Piazza del Popolo"
                  value={luogo}
                  onChange={(e) => setLuogo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Stato Iniziativa
                </label>
                <select
                  value={stato}
                  onChange={(e) => setStato(e.target.value as StatoEvento)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="in_programma">🟡 In programma</option>
                  <option value="in_corso">🟢 In corso</option>
                  <option value="concluso">⚪ Concluso</option>
                  <option value="annullato">🔴 Annullato</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Presenze Stimate
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="Es. 500"
                  value={partecipantiStimati || ''}
                  onChange={(e) => setPartecipantiStimati(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Descrizione */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Descrizione & Programma dell'Evento
              </label>
              <textarea
                rows={3}
                placeholder="Breve testo illustrativo, menù previsto, ospiti, gruppi musicali..."
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Sezione 2: Immagine / Locandina */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Locandina / Immagine di Copertina</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {locandina ? (
                <img
                  src={locandina}
                  alt="Anteprima locandina"
                  className="w-32 h-20 object-cover rounded-lg border border-slate-300 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-32 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                  Nessuna foto
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 font-medium block w-full">Temi suggeriti:</span>
                  {IMMAGINI_SUGGERITE.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setLocandina(img.url)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] hover:bg-slate-100 transition-colors"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* STEP 4: Quadro Economico (Bilancio Preventivo & Consuntivo Analitico) */}
          <div id="sezione-economia-evento" className={`${modalitaSequenziale && stepAttivo !== 4 ? 'hidden' : 'order-4'} bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4 scroll-mt-2`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded inline-block mb-1">
                  Step 4 di 5 • Quadro Economico
                </span>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Euro className="w-4 h-4 text-emerald-700" />
                  <span>Quadro Economico Preventivo & Consuntivo</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Gestione analitica delle spese (Food, Intrattenimento, Altre, Varie), somme automatiche e scostamenti
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostraGraficoTorta(!mostraGraficoTorta)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>{mostraGraficoTorta ? 'Nascondi Grafico a Torta' : 'Mostra Grafico a Torta'}</span>
              </button>
            </div>

            {/* Tabella / Griglia Voci di Spesa */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2 pr-2">Voce di Spesa</th>
                    <th className="py-2 px-2 w-32">Preventivo (€)</th>
                    <th className="py-2 px-2 w-32">Consuntivo (€)</th>
                    <th className="py-2 pl-2 w-28 text-right">Differenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  {/* 1. Food & Beverage */}
                  <tr className="hover:bg-slate-100/60 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Utensils className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Food & Beverage</span>
                          <span className="text-[10px] text-slate-500 block">Stand gastronomico, alimentari, bevande</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={spesePrev.food}
                        onChange={(e) => setSpesePrev({ ...spesePrev, food: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={speseCons.food}
                        onChange={(e) => setSpeseCons({ ...speseCons, food: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-semibold text-[11px]">
                      {(() => {
                        const prev = spesePrev.food || 0;
                        const cons = speseCons.food || 0;
                        const diffAss = Math.abs(cons - prev);
                        const isRisparm = cons <= prev;
                        if (cons === prev) return <span className="text-slate-400">0 €</span>;
                        return (
                          <span className={isRisparm ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            +{diffAss} € ({isRisparm ? 'risparmio' : 'scostamento'})
                          </span>
                        );
                      })()}
                    </td>
                  </tr>

                  {/* 2. Intrattenimento & Spettacolo */}
                  <tr className="hover:bg-slate-100/60 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                          <Music className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Intrattenimento & Spettacolo</span>
                          <span className="text-[10px] text-slate-500 block">Musica, artisti, SIAE, service audio/luci</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={spesePrev.intrattenimento}
                        onChange={(e) => setSpesePrev({ ...spesePrev, intrattenimento: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={speseCons.intrattenimento}
                        onChange={(e) => setSpeseCons({ ...speseCons, intrattenimento: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-semibold text-[11px]">
                      {(() => {
                        const prev = spesePrev.intrattenimento || 0;
                        const cons = speseCons.intrattenimento || 0;
                        const diffAss = Math.abs(cons - prev);
                        const isRisparm = cons <= prev;
                        if (cons === prev) return <span className="text-slate-400">0 €</span>;
                        return (
                          <span className={isRisparm ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            +{diffAss} € ({isRisparm ? 'risparmio' : 'scostamento'})
                          </span>
                        );
                      })()}
                    </td>
                  </tr>

                  {/* 3. Altre Spese & Logistica */}
                  <tr className="hover:bg-slate-100/60 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Altre Spese & Logistica</span>
                          <span className="text-[10px] text-slate-500 block">Palco, gazebo, noleggi, sicurezza safety</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={spesePrev.altreSpese}
                        onChange={(e) => setSpesePrev({ ...spesePrev, altreSpese: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={speseCons.altreSpese}
                        onChange={(e) => setSpeseCons({ ...speseCons, altreSpese: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-semibold text-[11px]">
                      {(() => {
                        const prev = spesePrev.altreSpese || 0;
                        const cons = speseCons.altreSpese || 0;
                        const diffAss = Math.abs(cons - prev);
                        const isRisparm = cons <= prev;
                        if (cons === prev) return <span className="text-slate-400">0 €</span>;
                        return (
                          <span className={isRisparm ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            +{diffAss} € ({isRisparm ? 'risparmio' : 'scostamento'})
                          </span>
                        );
                      })()}
                    </td>
                  </tr>

                  {/* 4. Varie & Oneri */}
                  <tr className="hover:bg-slate-100/60 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Varie & Oneri Amministrativi</span>
                          <span className="text-[10px] text-slate-500 block">Tipografia, manifesti, permessi, imprevisti</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={spesePrev.varie}
                        onChange={(e) => setSpesePrev({ ...spesePrev, varie: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={speseCons.varie}
                        onChange={(e) => setSpeseCons({ ...speseCons, varie: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-semibold text-[11px]">
                      {(() => {
                        const prev = spesePrev.varie || 0;
                        const cons = speseCons.varie || 0;
                        const diffAss = Math.abs(cons - prev);
                        const isRisparm = cons <= prev;
                        if (cons === prev) return <span className="text-slate-400">0 €</span>;
                        return (
                          <span className={isRisparm ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            +{diffAss} € ({isRisparm ? 'risparmio' : 'scostamento'})
                          </span>
                        );
                      })()}
                    </td>
                  </tr>

                </tbody>

                {/* Riga Somma Automatica dei Costi */}
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-white font-bold">
                    <td className="py-3 pr-2 text-slate-900 font-extrabold">
                      Totale Costi (Somma delle spese):
                    </td>
                    <td className="py-3 px-2 font-mono text-sm text-slate-900 font-black">
                      {(totalePreventivo || 0).toLocaleString('it-IT')} €
                    </td>
                    <td className="py-3 px-2 font-mono text-sm text-slate-900 font-black">
                      {(totaleConsuntivo || 0).toLocaleString('it-IT')} €
                    </td>
                    <td className="py-3 pl-2 text-right font-mono text-xs font-bold">
                      {(() => {
                        const diffTot = Math.abs((totaleConsuntivo || 0) - (totalePreventivo || 0));
                        const isRisparmioTot = (totaleConsuntivo || 0) <= (totalePreventivo || 0);
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            isRisparmioTot ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            +{(diffTot || 0).toLocaleString('it-IT')} € ({isRisparmioTot ? 'Risparmio' : 'Scostamento'})
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Riquadro Entrate & Differenza tra Costi ed Entrate (Risultato Economico) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                  Entrate Previste (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={entratePreviste}
                  onChange={(e) => setEntratePreviste(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Sponsor, stand, offerte stimate</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                  Entrate Realizzate (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={entrateRealizzate}
                  onChange={(e) => setEntrateRealizzate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Incasso effettivo registrato</span>
              </div>

              <div className="flex flex-col justify-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">
                  Risultato Netto Manifestazione (Entrate - Costi):
                </span>
                <span className={`text-base font-black font-mono ${
                  margineConsuntivo >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {margineConsuntivo >= 0 ? `+${(margineConsuntivo || 0).toLocaleString('it-IT')}` : (margineConsuntivo || 0).toLocaleString('it-IT')} €
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {margineConsuntivo >= 0 ? 'Utile dell\'evento' : 'Disavanzo dell\'evento'} (previsto: {marginePreventivo >= 0 ? `+${marginePreventivo}` : marginePreventivo}€)
                </span>
              </div>
            </div>

            {/* Riepilogo Economico dell'Evento */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Riepilogo Economico & Risultato d'Esercizio Evento</span>
                    </h5>
                    <p className="text-[11px] text-emerald-800">
                      Tutti i costi operativi e gli incassi confluiscono integralmente nel bilancio d'esercizio dell'associazione
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300 self-start sm:self-auto">
                  Bilancio Integrale Pro Loco
                </span>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-emerald-200 text-xs">
                  <div>
                    <span className="text-[10.5px] text-slate-500 font-medium block">Costi Sostenuti Pro Loco</span>
                    <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                      {(totaleConsuntivo || 0).toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10px] text-slate-400">100% uscite evento</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 font-medium block">Entrate Realizzate Pro Loco</span>
                    <span className="text-base font-black text-emerald-800 font-mono block mt-0.5">
                      {(entrateRealizzate || 0).toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10px] text-slate-400">100% incassi evento</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 font-medium block">Utile / Risultato a Bilancio</span>
                    <span className={`text-base font-black font-mono block mt-0.5 ${
                      margineConsuntivo >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {margineConsuntivo >= 0 ? `+${(margineConsuntivo || 0).toLocaleString('it-IT')}` : (margineConsuntivo || 0).toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10px] text-slate-400">Quota cassa finale</span>
                  </div>
                </div>
              </div>

            {tipoEvento === 'ibrido' && (
              <div className="bg-violet-50/70 border border-violet-300 rounded-xl p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-violet-950 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Gestione Economica: Evento Ibrido (Ripartizione con Partner)</span>
                      </h5>
                      <p className="text-[11px] text-violet-800">
                        Configura la divisione percentuale di spese ed entrate con l'ente co-organizzatore
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-200/80 text-violet-900 border border-violet-300 self-start sm:self-auto">
                    Co-organizzazione
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-violet-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ente Partner Co-organizzatore *
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Comune, Parrocchia..."
                      value={partnerIbridoNome}
                      onChange={(e) => setPartnerIbridoNome(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      % Spese a carico Pro Loco
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percentualeSpeseProLoco}
                        onChange={(e) => setPercentualeSpeseProLoco(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white"
                      />
                      <span className="text-[10.5px] text-violet-800 font-medium">
                        (Partner: {100 - (Number(percentualeSpeseProLoco) || 0)}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      % Entrate di competenza Pro Loco
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percentualeEntrateProLoco}
                        onChange={(e) => setPercentualeEntrateProLoco(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white"
                      />
                      <span className="text-[10.5px] text-violet-800 font-medium">
                        (Partner: {100 - (Number(percentualeEntrateProLoco) || 0)}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contributo Versato dal Partner (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={contributoPartner}
                      onChange={(e) => setContributoPartner(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white"
                    />
                  </div>
                </div>

                {/* Tabella di Ripartizione Comparativa */}
                <div className="bg-white p-3 rounded-lg border border-violet-200">
                  <span className="text-[11px] font-bold text-violet-950 uppercase tracking-wide block mb-2">
                    Ripartizione Economica per il Bilancio Pro Loco:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10.5px] text-slate-500 font-bold block uppercase">Manifestazione Totale</span>
                      <div className="mt-1 space-y-0.5 font-mono">
                        <div className="flex justify-between"><span>Costi Complessivi:</span><strong>{(totaleConsuntivo || 0).toLocaleString('it-IT')} €</strong></div>
                        <div className="flex justify-between"><span>Entrate Complessive:</span><strong>{(entrateRealizzate || 0).toLocaleString('it-IT')} €</strong></div>
                        <div className="flex justify-between border-t border-slate-200 pt-0.5"><span>Risultato Totale:</span><strong>{margineConsuntivo >= 0 ? `+${(margineConsuntivo || 0)}` : (margineConsuntivo || 0)} €</strong></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-300">
                      <span className="text-[10.5px] text-emerald-900 font-bold block uppercase">Competenza PRO LOCO (Bilancio)</span>
                      <div className="mt-1 space-y-0.5 font-mono">
                        <div className="flex justify-between text-slate-700"><span>Costi a carico Pro Loco:</span><strong className="text-slate-900">{(economiaCalcolata.costiCompetenzaProLoco || 0).toLocaleString('it-IT')} €</strong></div>
                        <div className="flex justify-between text-slate-700"><span>Entrate spettanti Pro Loco:</span><strong className="text-emerald-800">{(economiaCalcolata.entrateCompetenzaProLoco || 0).toLocaleString('it-IT')} €</strong></div>
                        <div className="flex justify-between border-t border-emerald-200 pt-0.5">
                          <span className="font-bold text-emerald-950">Margine Bilancio Pro Loco:</span>
                          <strong className={(economiaCalcolata.margineCompetenzaProLoco || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {(economiaCalcolata.margineCompetenzaProLoco || 0) >= 0 ? `+${(economiaCalcolata.margineCompetenzaProLoco || 0).toLocaleString('it-IT')}` : (economiaCalcolata.margineCompetenzaProLoco || 0).toLocaleString('it-IT')} €
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-violet-50/70 rounded-lg border border-violet-200">
                      <span className="text-[10.5px] text-violet-900 font-bold block uppercase">Quota Ente Partner ({partnerIbridoNome || 'Partner'})</span>
                      <div className="mt-1 space-y-0.5 font-mono text-slate-700">
                        <div className="flex justify-between"><span>Costi a carico Partner:</span><strong>{(economiaCalcolata.costiCompetenzaPartner || 0).toLocaleString('it-IT')} €</strong></div>
                        <div className="flex justify-between"><span>Entrate spettanti Partner:</span><strong>{(economiaCalcolata.entrateCompetenzaPartner || 0).toLocaleString('it-IT')} €</strong></div>
                        <div className="flex justify-between border-t border-violet-200 pt-0.5"><span>Margine Partner:</span><strong>{(economiaCalcolata.margineCompetenzaPartner || 0) >= 0 ? `+${economiaCalcolata.margineCompetenzaPartner}` : economiaCalcolata.margineCompetenzaPartner} €</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tipoEvento === 'gestione' && (
              <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Gestione Economica: Evento in Gestione per Conto Terzi</span>
                      </h5>
                      <p className="text-[11px] text-amber-800">
                        Convenzione di servizio: la Pro Loco gestisce l'evento per conto del committente a fronte di compenso o rimborsi
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300 self-start sm:self-auto">
                    Convenzione Terzi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ente Committente / Affidatario *
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Comune, Parrocchia..."
                      value={committenteNome}
                      onChange={(e) => setCommittenteNome(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tipologia Accordo Economico
                    </label>
                    <select
                      value={tipoAccordoGestione}
                      onChange={(e) => setTipoAccordoGestione(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                    >
                      <option value="compenso_forfettario">Compenso forfettario pattuito</option>
                      <option value="rimborso_piu_fee">Rimborso spese a piè di lista + Fee</option>
                      <option value="incassi_delegati">Incassi cassa delegati / somministrazione</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Compenso di Gestione Concordato (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={compensoGestione}
                      onChange={(e) => setCompensoGestione(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-amber-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rimborso Spese dal Committente (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={rimborsoSpeseCommittente}
                      onChange={(e) => setRimborsoSpeseCommittente(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white"
                    />
                  </div>
                </div>

                {/* Tabella di Gestione Comparativa */}
                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide block mb-2">
                    Riepilogo Economico di Gestione per il Bilancio Pro Loco:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10.5px] text-slate-500 font-bold block uppercase">Spese Operative Gestite</span>
                      <span className="text-base font-black text-slate-900 font-mono block mt-1">
                        {(totaleConsuntivo || 0).toLocaleString('it-IT')} €
                      </span>
                      <span className="text-[10px] text-slate-400">Anticipate per food, spettacolo, logistica</span>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200">
                      <span className="text-[10.5px] text-amber-900 font-bold block uppercase">Entrate da Committente ({committenteNome || 'Committente'})</span>
                      <span className="text-base font-black text-amber-900 font-mono block mt-1">
                        {(economiaCalcolata.entrateCompetenzaProLoco || 0).toLocaleString('it-IT')} €
                      </span>
                      <span className="text-[10px] text-amber-700">
                        Compenso ({compensoGestione} €) + Rimborsi ({rimborsoSpeseCommittente} €)
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-300">
                      <span className="text-[10.5px] text-emerald-900 font-bold block uppercase">Utile Netto Gestione Pro Loco (Bilancio)</span>
                      <span className={`text-base font-black font-mono block mt-1 ${
                        (economiaCalcolata.margineCompetenzaProLoco || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {(economiaCalcolata.margineCompetenzaProLoco || 0) >= 0 ? `+${(economiaCalcolata.margineCompetenzaProLoco || 0).toLocaleString('it-IT')}` : (economiaCalcolata.margineCompetenzaProLoco || 0).toLocaleString('it-IT')} €
                      </span>
                      <span className="text-[10px] text-emerald-700">Margine utile per la cassa associativa</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grafico a Torta Interattivo Integrato */}
            {mostraGraficoTorta && (
              <div className="pt-2">
                <EventBudgetChart
                  spesePreventivo={spesePrev}
                  speseConsuntivo={speseCons}
                  entratePreviste={entratePreviste}
                  entrateRealizzate={entrateRealizzate}
                />
              </div>
            )}

          </div>

          {/* STEP 2: Squadra & Iscrizioni (Collegamento con Anagrafica Soci 1.1 + Iscrizioni Soci) */}
          <div className={modalitaSequenziale && stepAttivo !== 2 ? 'hidden' : 'order-2 space-y-4'}>
          <div id="sezione-staff-evento" className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50 scroll-mt-2">
            <div className="mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded inline-block mb-1">
                Step 2 di 5 • Squadra & Iscrizioni
              </span>
            </div>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Squadra Volontari & Referente (dal Database Soci)</span>
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {volontariIds.length} volontari assegnati
              </span>
            </h4>

            {/* Responsabile */}
            <div className="mb-3">
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                Socio Responsabile / Coordinatore dell'Evento:
              </label>
              <select
                value={responsabileId}
                onChange={(e) => setResponsabileId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">-- Seleziona coordinatore --</option>
                {soci.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.cognome} {s.nome} ({s.numeroTessera} - {s.ruoloDirettivo !== 'Nessuno' ? s.ruoloDirettivo : s.categoria})
                  </option>
                ))}
              </select>
            </div>

            {/* Selezione Rapida Volontari */}
            <div>
              <span className="block text-slate-700 font-semibold mb-1 text-[11px]">
                Soci Volontari Convocati per Turni e Allestimento:
              </span>
              <div className="max-h-36 overflow-y-auto bg-white p-2 rounded-lg border border-slate-200 divide-y divide-slate-100">
                {soci.map(socio => {
                  const isChecked = volontariIds.includes(socio.id);
                  return (
                    <label
                      key={socio.id}
                      onClick={() => handleToggleVolontario(socio.id)}
                      className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                        <span className="font-medium text-slate-800">
                          {socio.cognome} {socio.nome}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {socio.numeroTessera}
                        </span>
                      </div>
                      {socio.competenzeVolontariato && socio.competenzeVolontariato.length > 0 && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {socio.competenzeVolontariato[0]}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sezione 4B: Gestione Iscrizioni Soci & Capienza Evento */}
          <div className="border border-emerald-200 p-3.5 sm:p-4 rounded-xl bg-emerald-50/40 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Iscrizioni Soci & Tracciamento Presenze
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Abilita le registrazioni per i soci, imposta il limite posti e l'eventuale quota di partecipazione.
                  </p>
                </div>
              </div>

              {evento?.iscrizioni && evento.iscrizioni.length > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {evento.iscrizioni.length} Soci Già Iscritti
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Toggle Iscrizioni Aperte */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Iscrizioni Aperte</label>
                  <span className="text-[10px] text-slate-500">
                    {iscrizioniAperte ? 'Accetta adesioni dai soci' : 'Adesioni chiuse o sospese'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={iscrizioniAperte}
                  onChange={(e) => setIscrizioniAperte(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Capienza Massima Posti */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-xs font-bold text-slate-800 block mb-1">Capienza Massima (N° Posti)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={postiMassimi}
                    onChange={(e) => setPostiMassimi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                    placeholder="0 = Illimitata"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">posti</span>
                </div>
              </div>

              {/* Quota Iscrizione Socio */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="text-xs font-bold text-slate-800 block mb-1">Quota di Partecipazione (€)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={quotaIscrizioneSocio}
                    onChange={(e) => setQuotaIscrizioneSocio(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                    placeholder="0 = Gratuito"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">€/socio</span>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* STEP 3: Stand & Turni (Stand Numerati, Bilancio Stand & Turni/Assegnazioni) */}
          <div id="sezione-stand-evento" className={`${modalitaSequenziale && stepAttivo !== 3 ? 'hidden' : 'order-3'} border border-slate-200 p-3.5 sm:p-4 rounded-xl bg-slate-50/80 space-y-3.5 scroll-mt-2`}>
            
            {/* Intestazione Sezione Stand */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded inline-block mb-1">
                  Step 3 di 5 • Stand & Turni
                </span>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Stand & Turni: Numerazione, Preventivo/Consuntivo e Turni Volontari</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Definisci i numeri di stand in base alle esigenze e registra le voci economiche analitiche.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {totaliStand.conteggioFood} Stand Food & Beverage
                </span>
                <span className="text-[10px] font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  {standNumerati.length} Stand Totali
                </span>
              </div>
            </div>

            {/* Riepilogo Analitico Totali Stand */}
            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                
                {/* Spese Stand */}
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Spese Stand (Cons. vs Prev.)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black font-mono text-white">
                      {totaliStand.totSpeseCons.toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      (prev. {totaliStand.totSpesePrev.toLocaleString('it-IT')} €)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono mt-0.5">
                    {totaliStand.diffSpese <= 0 ? (
                      <span className="text-emerald-400 font-bold">
                        Diff: {totaliStand.diffSpese.toLocaleString('it-IT')} € (Risparmio)
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        Diff: +{totaliStand.diffSpese.toLocaleString('it-IT')} € (Scostamento)
                      </span>
                    )}
                  </div>
                </div>

                {/* Incassi Stand */}
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Incassi Stand (Cons. vs Prev.)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black font-mono text-emerald-400">
                      {totaliStand.totIncassiCons.toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      (prev. {totaliStand.totIncassiPrev.toLocaleString('it-IT')} €)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono mt-0.5">
                    {totaliStand.diffIncassi >= 0 ? (
                      <span className="text-emerald-400 font-bold">
                        Diff: +{totaliStand.diffIncassi.toLocaleString('it-IT')} € (Extra ricavi)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold">
                        Diff: {totaliStand.diffIncassi.toLocaleString('it-IT')} € (Minori ricavi)
                      </span>
                    )}
                  </div>
                </div>

                {/* Margine Netto Stand */}
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Margine Operativo Stand
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-base font-black font-mono ${
                      totaliStand.margineCons >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {totaliStand.margineCons >= 0 ? `+${totaliStand.margineCons.toLocaleString('it-IT')}` : totaliStand.margineCons.toLocaleString('it-IT')} €
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      (prev. {totaliStand.marginePrev >= 0 ? `+${totaliStand.marginePrev.toLocaleString('it-IT')}` : totaliStand.marginePrev.toLocaleString('it-IT')} €)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Somma netta incassi meno spese stand
                  </div>
                </div>

              </div>
            </div>

            {/* Barra Operazioni Stand */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAggiungiStand}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Stand</span>
                </button>
                {standNumerati.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleOrdinaStandPerNumero}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs transition-colors cursor-pointer"
                      title="Ordina la lista per numero progressivo"
                    >
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      <span>Ordina per Numero</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAzzeraStand}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs transition-colors cursor-pointer"
                      title="Rimuovi tutti gli stand e azzera la lista"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Azzera Stand</span>
                    </button>
                  </>
                )}
              </div>

              {standNumerati.length > 0 && (
                <button
                  type="button"
                  onClick={handleSincronizzaTotaliStand}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-colors cursor-pointer"
                  title="Copia i totali calcolati degli stand nelle voci Food e Ricavi della Sezione Economica sopra"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Sincronizza Voci Economiche con i Totali Stand</span>
                </button>
              )}
            </div>

            {/* Elenco Schede Stand Editabili */}
            <div className="space-y-3 pt-1">
              {standNumerati.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                  <Store className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Nessuno stand ancora inserito per questo evento
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Clicca su <strong>"+ Aggiungi Stand"</strong> per inserire da zero gli stand numerati, i referenti, il preventivo/consuntivo e i turni volontari.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAggiungiStand}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Inserisci Primo Stand (#1)</span>
                    </button>
                  </div>
                </div>
              ) : standNumerati.map((stand, idx) => {
                const spPrev = Number(stand.spesaPreventivo) || 0;
                const spCons = Number(stand.spesaConsuntivo) || 0;
                const diffSp = spCons - spPrev;
                const isRisparmio = diffSp <= 0;

                const inPrev = Number(stand.incassoPrevisto) || 0;
                const inCons = Number(stand.incassoConsuntivo) || 0;
                const diffIn = inCons - inPrev;
                const isExtra = diffIn >= 0;

                const margine = inCons - spCons;

                return (
                  <div
                    key={stand.id || idx}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-2.5 text-xs"
                  >
                    {/* Header Singolo Stand */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        
                        {/* Numero Stand Editabile */}
                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-1 rounded-md border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            N°
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={stand.numero}
                            onChange={(e) => handleAggiornaStand(idx, 'numero', Math.max(1, Number(e.target.value)))}
                            className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-center text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                            title="Numero dello stand (in base all'esigenza organizzativa)"
                          />
                        </div>

                        {/* Nome Stand */}
                        <div className="flex-1 min-w-[180px]">
                          <input
                            type="text"
                            value={stand.nome}
                            onChange={(e) => handleAggiornaStand(idx, 'nome', e.target.value)}
                            placeholder="Denominazione stand..."
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        {/* Tipologia Stand */}
                        <div className="min-w-[160px]">
                          <select
                            value={stand.tipologia}
                            onChange={(e) => handleAggiornaStand(idx, 'tipologia', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                          >
                            <option value="Food / Gastronomia">Food / Gastronomia</option>
                            <option value="Food / Griglia & Brace">Food / Griglia & Brace</option>
                            <option value="Food / Friggitoria & Dolci">Food / Friggitoria & Dolci</option>
                            <option value="Beverage / Bar & Vini">Beverage / Bar & Vini</option>
                            <option value="Cassa & Ticket">Cassa & Ticket</option>
                            <option value="Mercatino & Artigianato">Mercatino & Artigianato</option>
                            <option value="Info Point & Servizi">Info Point & Servizi</option>
                          </select>
                        </div>

                        {/* Toggle Riferimento Food */}
                        <button
                          type="button"
                          onClick={() => handleAggiornaStand(idx, 'riferimentoFood', !stand.riferimentoFood)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                            stand.riferimentoFood
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Utensils className={`w-3 h-3 ${stand.riferimentoFood ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span>{stand.riferimentoFood ? 'Rif. Food & Beverage' : 'Servizi / No-Food'}</span>
                        </button>

                      </div>

                      {/* Referente & Elimina */}
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={stand.responsabile || ''}
                          onChange={(e) => handleAggiornaStand(idx, 'responsabile', e.target.value)}
                          placeholder="Referente stand..."
                          className="w-32 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 focus:bg-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRimuoviStand(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Elimina stand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Griglia Inserimento Dati Economici: Preventivo, Consuntivo e Differenza */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
                      
                      {/* Spese Stand */}
                      <div className="bg-white p-2 rounded-md border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-slate-700">Spesa Stand</span>
                          <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isRisparmio ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {diffSp <= 0 ? `Diff: ${diffSp} €` : `Diff: +${diffSp} €`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="block text-[9.5px] text-slate-400">Preventivo (€)</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.spesaPreventivo ?? ''}
                              onChange={(e) => handleAggiornaStand(idx, 'spesaPreventivo', Math.max(0, Number(e.target.value)))}
                              className="w-full px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <span className="block text-[9.5px] text-slate-400">Consuntivo (€)</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.spesaConsuntivo ?? ''}
                              onChange={(e) => handleAggiornaStand(idx, 'spesaConsuntivo', Math.max(0, Number(e.target.value)))}
                              className="w-full px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Incassi Stand */}
                      <div className="bg-white p-2 rounded-md border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-slate-700">Incasso Stand</span>
                          <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isExtra ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {diffIn >= 0 ? `Diff: +${diffIn} €` : `Diff: ${diffIn} €`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="block text-[9.5px] text-slate-400">Preventivo (€)</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.incassoPrevisto ?? ''}
                              onChange={(e) => handleAggiornaStand(idx, 'incassoPrevisto', Math.max(0, Number(e.target.value)))}
                              className="w-full px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <span className="block text-[9.5px] text-slate-400">Consuntivo (€)</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={stand.incassoConsuntivo ?? ''}
                              onChange={(e) => handleAggiornaStand(idx, 'incassoConsuntivo', Math.max(0, Number(e.target.value)))}
                              className="w-full px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-emerald-800 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Margine Netto Stand */}
                      <div className="bg-white p-2 rounded-md border border-slate-200 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-slate-700">Margine Stand</span>
                          <span className="text-[9.5px] text-slate-400 font-mono">Consuntivo</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-[10.5px] text-slate-500">Netto:</span>
                          <span className={`text-sm font-black font-mono ${
                            margine >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {margine >= 0 ? `+${margine.toLocaleString('it-IT')}` : margine.toLocaleString('it-IT')} €
                          </span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 font-mono text-right">
                          Previsto: {(inPrev - spPrev) >= 0 ? `+${inPrev - spPrev}` : inPrev - spPrev} €
                        </div>
                      </div>

                    </div>

                    {/* Turni e Assegnazioni Volontari per questo Stand */}
                    <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200/70 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Turni & Assegnazioni Stand #{stand.numero}:</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {(stand.turniAssegnazioni || []).length} / {stand.volontariRichiesti || 3} volontari
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-600">
                            <span>Orario Stand:</span>
                            <input
                              type="text"
                              value={stand.orarioAperturaStand || ''}
                              onChange={(e) => handleAggiornaStand(idx, 'orarioAperturaStand', e.target.value)}
                              placeholder="18:30 - 23:30"
                              className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]"
                            />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-600">
                            <span>Fabbisogno:</span>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={stand.volontariRichiesti ?? 3}
                              onChange={(e) => handleAggiornaStand(idx, 'volontariRichiesti', Math.max(1, Number(e.target.value)))}
                              className="w-10 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-center text-[10px]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStandTurnoApertoIdx(standTurnoApertoIdx === idx ? null : idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{standTurnoApertoIdx === idx ? 'Chiudi Box Turno' : 'Assegna Volontario / Turno'}</span>
                        </button>
                      </div>

                      {/* Form rapido assegnazione turno */}
                      {standTurnoApertoIdx === idx && (
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 p-2 bg-white rounded-md border border-indigo-200">
                          <select
                            value={turnoSocioId}
                            onChange={(e) => {
                              setTurnoSocioId(e.target.value);
                              const found = soci.find(s => s.id === e.target.value);
                              if (found) setTurnoNomeManuale(`${found.nome} ${found.cognome}`);
                            }}
                            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-[11px]"
                          >
                            <option value="">-- Socio da Albo --</option>
                            {soci.filter(s => !s.dataCancellazione).map(s => (
                              <option key={s.id} value={s.id}>{s.cognome} {s.nome} (#{s.numeroTessera})</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={turnoNomeManuale}
                            onChange={(e) => setTurnoNomeManuale(e.target.value)}
                            placeholder="O digita nome..."
                            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-[11px]"
                          />
                          <select
                            value={turnoMansione}
                            onChange={(e) => setTurnoMansione(e.target.value as MansioneStand)}
                            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-[11px]"
                          >
                            {MANSIONI_STAND.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <select
                            value={turnoFascia}
                            onChange={(e) => setTurnoFascia(e.target.value as FasciaOrariaTurno)}
                            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-[11px]"
                          >
                            {FASCE_ORARIE_TURNO.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAggiungiTurnoInModal(idx)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer"
                          >
                            + Aggiungi Turno
                          </button>
                        </div>
                      )}

                      {/* Lista chip volontari assegnati a questo stand */}
                      {(stand.turniAssegnazioni || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(stand.turniAssegnazioni || []).map(t => (
                            <div
                              key={t.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-indigo-200 text-[10.5px] shadow-2xs"
                            >
                              <span className="font-bold text-slate-900">{t.nomeVolontario || t.nominativo || 'Volontario'}</span>
                              <span className="text-indigo-700 font-semibold">({(t.mansione || 'Operatore').split(' / ')[0]})</span>
                              <span className="font-mono text-[9.5px] text-slate-500 bg-slate-100 px-1 rounded">
                                {t.orarioSpecifico || (t.orarioInizio && t.orarioFine ? `${t.orarioInizio}-${t.orarioFine}` : '') || (t.fasciaOraria || '').split(' ')[0]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRimuoviTurnoInModal(idx, t.id)}
                                className="text-rose-500 hover:text-rose-700 font-bold ml-0.5 cursor-pointer"
                                title="Rimuovi turno"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Descrizione opzionale */}
                    <div>
                      <input
                        type="text"
                        value={stand.descrizione || ''}
                        onChange={(e) => handleAggiornaStand(idx, 'descrizione', e.target.value)}
                        placeholder="Note o dettagli per lo stand..."
                        className="w-full px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10.5px] text-slate-600 italic focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* STEP 5: Permessi & Conferma */}
          <div className={modalitaSequenziale && stepAttivo !== 5 ? 'hidden' : 'order-5 space-y-4'}>
          <div id="sezione-permessi-evento" className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 scroll-mt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded inline-block mb-1.5">
              Step 5 di 5 • Permessi & Conferma
            </span>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Pratiche Autorizzative & Burocrazia Obbligatoria</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permessoComunale}
                  onChange={(e) => setPermessoComunale(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Patrocinio & Suolo Pubblico</span>
                  <span className="text-[10px] text-slate-500">Delibera o richiesta Comune</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={licenzaSIAE}
                  onChange={(e) => setLicenzaSIAE(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Permesso SIAE / Diritto d'Autore</span>
                  <span className="text-[10px] text-slate-500">Musica dal vivo, DJ o filodiffusione</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pianoSicurezzaSafety}
                  onChange={(e) => setPianoSicurezzaSafety(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Piano Safety & Sicurezza</span>
                  <span className="text-[10px] text-slate-500">Vie di fuga, estintori, pronto soccorso</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aslHaccp}
                  onChange={(e) => setAslHaccp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Notifica Sanitaria ASL / HACCP</span>
                  <span className="text-[10px] text-slate-500">Cucina sagra o somministrazione alimenti</span>
                </div>
              </label>
            </div>
          </div>

          {/* Note Organizzative */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Note Operative Interne & Logistica
            </label>
            <input
              type="text"
              placeholder="Orari montaggio cucine, noleggio furgone, allaccio luce..."
              value={noteOrganizzative}
              onChange={(e) => setNoteOrganizzative(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Quadro Riepilogativo Finale dei 5 Step Sequenziali */}
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className="font-extrabold text-emerald-950 text-xs sm:text-sm">
                  Riepilogo Finale Inserimento in Sequenza (5 Step Completati)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-200 text-emerald-950">
                Pronto al Salvataggio
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 1 • Dati & Modello</span>
                <span className="font-bold text-slate-900 truncate block">{titolo || 'Da compilare'}</span>
                <span className="text-[10px] text-emerald-700 font-medium">{dataInizio} • {luogo}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 2 • Squadra & Iscr.</span>
                <span className="font-bold text-slate-900 block">{volontariIds.length} Soci Volontari</span>
                <span className="text-[10px] text-emerald-700">{iscrizioniAperte ? `Iscrizioni aperte (${postiMassimi} posti)` : 'Iscrizioni chiuse'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 3 • Stand & Turni</span>
                <span className="font-bold text-slate-900 block">{standNumerati.length} Stand Attivi</span>
                <span className="text-[10px] text-indigo-700 font-semibold">
                  {standNumerati.reduce((acc, s) => acc + (s.turniAssegnazioni?.length || 0), 0)} turni assegnati
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 4 • Quadro Economico</span>
                <span className="font-bold text-slate-900 font-mono block">Costi: €{totalePreventivo.toLocaleString('it-IT')}</span>
                <span className="text-[10px] text-emerald-700 font-mono">Ricavi: €{entratePreviste.toLocaleString('it-IT')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 5 • Permessi & Conf.</span>
                <span className="font-bold text-slate-900 block">
                  {[permessoComunale, licenzaSIAE, pianoSicurezzaSafety, aslHaccp].filter(Boolean).length}/4 Autorizzazioni
                </span>
                <span className="text-[10px] text-emerald-700">Checklist verificata</span>
              </div>
            </div>
          </div>
          </div>

          </div>

          {/* Barra Pulsanti Sequenziali - Fissa in basso sempre visibile su qualunque monitor */}
          <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/95 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 text-[11px] font-semibold">
                Costi Prev: €{(totalePreventivo || 0).toLocaleString('it-IT')}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                Stand: {standNumerati.length} ({standNumerati.reduce((a, s) => a + (s.turniAssegnazioni?.length || 0), 0)} turni)
              </span>
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                (marginePreventivo || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {(marginePreventivo || 0) >= 0 ? 'Margine Prev: +' : 'Disavanzo: '}€{(marginePreventivo || 0).toLocaleString('it-IT')}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              >
                Annulla
              </button>

              {modalitaSequenziale && stepAttivo > 1 && (
                <button
                  type="button"
                  onClick={handleStepPrecedente}
                  className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Step {stepAttivo - 1}</span>
                </button>
              )}

              {modalitaSequenziale && stepAttivo < 5 ? (
                <>
                  {isModifica && (
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Salva Ora</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStepSuccessivo}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Avanti: Step {stepAttivo + 1} di 5</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{isModifica ? 'Completa e Salva Modifiche Evento' : 'Completa Sequenza e Salva Evento'}</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
