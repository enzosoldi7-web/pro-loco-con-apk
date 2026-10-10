import { ProLocoEvento, TipoEvento } from '../types';

export interface EconomiaEventoCalcolata {
  tipo: TipoEvento;
  etichettaTipo: string;
  badgeClasse: string;
  descrizioneTipo: string;

  // 1. COSTI E ENTRATE LORDE TOTALI DELL'INIZIATIVA (condivise da tutte e 3 le tipologie)
  costiTotaliPreventivo: number;
  costiTotaliConsuntivo: number;
  entrateTotaliPreviste: number;
  entrateTotaliRealizzate: number;
  margineTotaleEvento: number;

  // Dettaglio analitico delle 4 voci consuntivo lordo
  food: number;
  intrattenimento: number;
  altreSpese: number;
  varie: number;

  // Dettaglio analitico delle 4 voci preventivo lordo
  foodPrev: number;
  intrattenimentoPrev: number;
  altreSpesePrev: number;
  variePrev: number;

  // 2. GESTIONE ECONOMICA SPECIFICA: COMPETENZA PRO LOCO (IMPATTO DIRETTO SUL BILANCIO)
  costiProLocoPreventivo: number;
  costiProLocoConsuntivo: number;
  entrateProLocoPreviste: number;
  entrateProLocoRealizzate: number;
  margineNettoProLoco: number;

  // Alias compatibilità per riepiloghi e modali
  totaleCostiConsuntivo: number;
  totaleEntrateConsuntivo: number;
  avanzoDisavanzoConsuntivo: number;

  // Stand e Turni operativi
  numeroStands: number;
  numeroTurniAssegnati: number;
  numeroTurniConfermati: number;
  volontariUniciIds: string[];

  // Dettagli specifici per Evento Ibrido
  partnerNome?: string;
  percSpeseProLoco: number;
  percEntrateProLoco: number;
  contributoPartner: number;
  costiPartnerConsuntivo: number;
  entratePartnerRealizzate: number;

  // Dettagli specifici per Evento Gestione
  committenteNome?: string;
  tipoAccordoGestione: 'compenso_forfettario' | 'rimborso_piu_fee' | 'incassi_delegati';
  compensoGestione: number;
  rimborsoCommittente: number;
}

export function getInfoTipoEvento(tipo?: TipoEvento): {
  tipo: TipoEvento;
  etichetta: string;
  etichettaBreve: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  descrizione: string;
} {
  const t: TipoEvento = tipo || 'nativo';
  switch (t) {
    case 'ibrido':
      return {
        tipo: 'ibrido',
        etichetta: 'Evento Ibrido (Co-organizzato)',
        etichettaBreve: 'Ibrido',
        badgeBg: 'bg-violet-50',
        badgeBorder: 'border-violet-200',
        badgeText: 'text-violet-800',
        descrizione: 'In collaborazione con enti, parrocchie o associazioni terze con spese ed entrate ripartite.'
      };
    case 'gestione':
      return {
        tipo: 'gestione',
        etichetta: 'Evento Gestione (Conto Terzi)',
        etichettaBreve: 'Gestione',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-200',
        badgeText: 'text-amber-800',
        descrizione: 'Organizzazione o somministrazione per conto di un committente (Comune o terzi) con compenso o convenzione.'
      };
    case 'nativo':
    default:
      return {
        tipo: 'nativo',
        etichetta: 'Evento Nativo (100% Pro Loco)',
        etichettaBreve: 'Nativo',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-200',
        badgeText: 'text-emerald-800',
        descrizione: 'Ideato, gestito e autofinanziato interamente dalla Pro Loco (100% costi ed entrate a bilancio).'
      };
  }
}

export function calcolaEconomiaEvento(evento: ProLocoEvento): EconomiaEventoCalcolata {
  const tipo: TipoEvento = evento.tipoEvento || 'nativo';
  const infoTipo = getInfoTipoEvento(tipo);

  // 1. Spese consuntivo analitiche
  const food = evento.speseConsuntivo?.food ?? Math.round((evento.costiSostenuti || 0) * 0.50);
  const intrattenimento = evento.speseConsuntivo?.intrattenimento ?? Math.round((evento.costiSostenuti || 0) * 0.25);
  const altreSpese = evento.speseConsuntivo?.altreSpese ?? Math.round((evento.costiSostenuti || 0) * 0.15);
  const varie = evento.speseConsuntivo?.varie ?? Math.round((evento.costiSostenuti || 0) * 0.10);

  const costiTotaliConsuntivo = (food + intrattenimento + altreSpese + varie) || (evento.costiSostenuti || 0);

  // Spese preventivo analitiche
  const foodPrev = evento.spesePreventivo?.food ?? Math.round((evento.budgetPrevisto || 0) * 0.45);
  const intrPrev = evento.spesePreventivo?.intrattenimento ?? Math.round((evento.budgetPrevisto || 0) * 0.25);
  const altrePrev = evento.spesePreventivo?.altreSpese ?? Math.round((evento.budgetPrevisto || 0) * 0.20);
  const variePrev = evento.spesePreventivo?.varie ?? Math.round((evento.budgetPrevisto || 0) * 0.10);

  const costiTotaliPreventivo = (foodPrev + intrPrev + altrePrev + variePrev) || (evento.budgetPrevisto || 0);

  const entrateTotaliPreviste = evento.entratePreviste ?? costiTotaliPreventivo;
  const entrateTotaliRealizzate = evento.entrateRealizzate || 0;
  const margineTotaleEvento = entrateTotaliRealizzate - costiTotaliConsuntivo;

  // Calcolo delle quote in base alla tipologia di gestione economica
  let costiProLocoConsuntivo = costiTotaliConsuntivo;
  let costiProLocoPreventivo = costiTotaliPreventivo;
  let entrateProLocoRealizzate = entrateTotaliRealizzate;
  let entrateProLocoPreviste = entrateTotaliPreviste;

  let costiPartnerConsuntivo = 0;
  let entratePartnerRealizzate = 0;
  const percSpeseProLoco = evento.percentualeSpeseProLoco !== undefined ? evento.percentualeSpeseProLoco : 50;
  const percEntrateProLoco = evento.percentualeEntrateProLoco !== undefined ? evento.percentualeEntrateProLoco : 50;
  const contributoPartner = Number(evento.contributoPartner) || 0;

  const tipoAccordoGestione = evento.tipoAccordoGestione || 'compenso_forfettario';
  const compensoGestione = Number(evento.compensoGestione) || (tipo === 'gestione' ? (evento.entrateRealizzate || 0) : 0);
  const rimborsoCommittente = Number(evento.rimborsoSpeseCommittente) || 0;

  if (tipo === 'nativo') {
    // 100% Pro Loco
    costiProLocoConsuntivo = costiTotaliConsuntivo;
    costiProLocoPreventivo = costiTotaliPreventivo;
    entrateProLocoRealizzate = entrateTotaliRealizzate;
    entrateProLocoPreviste = entrateTotaliPreviste;
  } else if (tipo === 'ibrido') {
    // Co-organizzazione: ripartizione percentuale e contributi partner
    const quotaBaseCosti = Math.round((costiTotaliConsuntivo * percSpeseProLoco) / 100);
    costiProLocoConsuntivo = Math.max(0, quotaBaseCosti - contributoPartner);
    costiPartnerConsuntivo = costiTotaliConsuntivo - costiProLocoConsuntivo;

    const quotaBasePrev = Math.round((costiTotaliPreventivo * percSpeseProLoco) / 100);
    costiProLocoPreventivo = Math.max(0, quotaBasePrev - contributoPartner);

    entrateProLocoRealizzate = Math.round((entrateTotaliRealizzate * percEntrateProLoco) / 100);
    entratePartnerRealizzate = entrateTotaliRealizzate - entrateProLocoRealizzate;
    entrateProLocoPreviste = Math.round((entrateTotaliPreviste * percEntrateProLoco) / 100);
  } else if (tipo === 'gestione') {
    // Gestione conto terzi / committente
    // Le spese vive sostenute dall'associazione
    costiProLocoConsuntivo = costiTotaliConsuntivo;
    costiProLocoPreventivo = costiTotaliPreventivo;

    if (tipoAccordoGestione === 'rimborso_piu_fee') {
      const rimborsoEffettivo = rimborsoCommittente > 0 ? rimborsoCommittente : costiTotaliConsuntivo;
      entrateProLocoRealizzate = compensoGestione + rimborsoEffettivo;
      entrateProLocoPreviste = compensoGestione + costiTotaliPreventivo;
    } else if (tipoAccordoGestione === 'incassi_delegati') {
      entrateProLocoRealizzate = entrateTotaliRealizzate + compensoGestione;
      entrateProLocoPreviste = entrateTotaliPreviste + compensoGestione;
    } else {
      // compenso_forfettario o convenzione
      entrateProLocoRealizzate = compensoGestione > 0 ? compensoGestione : entrateTotaliRealizzate;
      entrateProLocoPreviste = (evento.entratePreviste && evento.entratePreviste > 0) 
        ? evento.entratePreviste 
        : (compensoGestione > 0 ? compensoGestione : entrateTotaliPreviste);
    }
  }

  const margineNettoProLoco = entrateProLocoRealizzate - costiProLocoConsuntivo;

  // Stand, turni e volontari unici (includendo sia volontariIds che soci assegnati agli stand)
  const stands = evento.standNumerati || [];
  const volontariSet = new Set<string>(evento.volontariIds || []);
  let numeroTurniAssegnati = 0;
  let numeroTurniConfermati = 0;

  stands.forEach(st => {
    const turni = st.turniAssegnazioni || [];
    numeroTurniAssegnati += turni.length;
    numeroTurniConfermati += turni.filter(t => t.confermato).length;
    turni.forEach(t => {
      if (t.socioId) volontariSet.add(t.socioId);
    });
  });

  return {
    tipo,
    etichettaTipo: infoTipo.etichetta,
    badgeClasse: `${infoTipo.badgeBg} ${infoTipo.badgeBorder} ${infoTipo.badgeText}`,
    descrizioneTipo: infoTipo.descrizione,

    costiTotaliPreventivo,
    costiTotaliConsuntivo,
    entrateTotaliPreviste,
    entrateTotaliRealizzate,
    margineTotaleEvento,

    food,
    intrattenimento,
    altreSpese,
    varie,

    foodPrev,
    intrattenimentoPrev: intrPrev,
    altreSpesePrev: altrePrev,
    variePrev,

    costiProLocoPreventivo,
    costiProLocoConsuntivo,
    entrateProLocoPreviste,
    entrateProLocoRealizzate,
    margineNettoProLoco,

    totaleCostiConsuntivo: costiProLocoConsuntivo,
    totaleEntrateConsuntivo: entrateProLocoRealizzate,
    avanzoDisavanzoConsuntivo: margineNettoProLoco,

    numeroStands: stands.length,
    numeroTurniAssegnati,
    numeroTurniConfermati,
    volontariUniciIds: Array.from(volontariSet),

    partnerNome: evento.partnerIbridoNome,
    percSpeseProLoco,
    percEntrateProLoco,
    contributoPartner,
    costiPartnerConsuntivo,
    entratePartnerRealizzate,

    committenteNome: evento.committenteNome,
    tipoAccordoGestione,
    compensoGestione,
    rimborsoCommittente
  };
}

export function aggregaEventiPerBilancio(eventi: ProLocoEvento[]) {
  let budgetPrevistoTotale = 0;
  let costiConsuntivoTotali = 0;
  let entratePrevisteTotali = 0;
  let entrateRealizzateTotali = 0;

  // Di competenza effettiva Pro Loco (che aggiornano il bilancio dell'ente)
  let costiProLocoConsuntivo = 0;
  let entrateProLocoRealizzate = 0;
  let budgetProLocoPreventivo = 0;
  let entrateProLocoPreviste = 0;

  let foodTotale = 0;
  let intrattenimentoTotale = 0;
  let altreSpeseTotale = 0;
  let varieTotale = 0;

  let foodPrevTotale = 0;
  let intrattenimentoPrevTotale = 0;
  let altreSpesePrevTotale = 0;
  let variePrevTotale = 0;

  let partecipantiStimati = 0;
  let totaleStands = 0;
  let totaleTurniAssegnati = 0;
  let totaleTurniConfermati = 0;
  const volontariUniciGlobali = new Set<string>();

  // Suddivisione per tipologia
  const nativi = { count: 0, costiLordo: 0, entrateLordo: 0, costiProLoco: 0, entrateProLoco: 0, margineProLoco: 0 };
  const ibridi = { count: 0, costiLordo: 0, entrateLordo: 0, costiProLoco: 0, entrateProLoco: 0, margineProLoco: 0 };
  const gestione = { count: 0, costiLordo: 0, entrateLordo: 0, costiProLoco: 0, entrateProLoco: 0, margineProLoco: 0, compensoTotale: 0 };

  eventi.forEach(e => {
    if (e.stato === 'annullato') return;
    const calc = calcolaEconomiaEvento(e);

    budgetPrevistoTotale += calc.costiTotaliPreventivo;
    costiConsuntivoTotali += calc.costiTotaliConsuntivo;
    entratePrevisteTotali += calc.entrateTotaliPreviste;
    entrateRealizzateTotali += calc.entrateTotaliRealizzate;

    costiProLocoConsuntivo += calc.costiProLocoConsuntivo;
    entrateProLocoRealizzate += calc.entrateProLocoRealizzate;
    budgetProLocoPreventivo += calc.costiProLocoPreventivo;
    entrateProLocoPreviste += calc.entrateProLocoPreviste;

    foodTotale += calc.food;
    intrattenimentoTotale += calc.intrattenimento;
    altreSpeseTotale += calc.altreSpese;
    varieTotale += calc.varie;

    foodPrevTotale += calc.foodPrev;
    intrattenimentoPrevTotale += calc.intrattenimentoPrev;
    altreSpesePrevTotale += calc.altreSpesePrev;
    variePrevTotale += calc.variePrev;

    partecipantiStimati += e.partecipantiStimati || 0;
    totaleStands += calc.numeroStands;
    totaleTurniAssegnati += calc.numeroTurniAssegnati;
    totaleTurniConfermati += calc.numeroTurniConfermati;
    calc.volontariUniciIds.forEach(id => volontariUniciGlobali.add(id));

    if (calc.tipo === 'nativo') {
      nativi.count++;
      nativi.costiLordo += calc.costiTotaliConsuntivo;
      nativi.entrateLordo += calc.entrateTotaliRealizzate;
      nativi.costiProLoco += calc.costiProLocoConsuntivo;
      nativi.entrateProLoco += calc.entrateProLocoRealizzate;
      nativi.margineProLoco += calc.margineNettoProLoco;
    } else if (calc.tipo === 'ibrido') {
      ibridi.count++;
      ibridi.costiLordo += calc.costiTotaliConsuntivo;
      ibridi.entrateLordo += calc.entrateTotaliRealizzate;
      ibridi.costiProLoco += calc.costiProLocoConsuntivo;
      ibridi.entrateProLoco += calc.entrateProLocoRealizzate;
      ibridi.margineProLoco += calc.margineNettoProLoco;
    } else if (calc.tipo === 'gestione') {
      gestione.count++;
      gestione.costiLordo += calc.costiTotaliConsuntivo;
      gestione.entrateLordo += calc.entrateTotaliRealizzate;
      gestione.costiProLoco += calc.costiProLocoConsuntivo;
      gestione.entrateProLoco += calc.entrateProLocoRealizzate;
      gestione.margineProLoco += calc.margineNettoProLoco;
      gestione.compensoTotale += calc.compensoGestione;
    }
  });

  const nativiCompleti = {
    ...nativi,
    costi: nativi.costiProLoco,
    entrate: nativi.entrateProLoco,
    margine: nativi.margineProLoco
  };

  const ibridiCompleti = {
    ...ibridi,
    costi: ibridi.costiProLoco,
    entrate: ibridi.entrateProLoco,
    margine: ibridi.margineProLoco
  };

  const gestioneCompleti = {
    ...gestione,
    costi: gestione.costiProLoco,
    entrate: gestione.entrateProLoco,
    margine: gestione.margineProLoco
  };

  return {
    // Accesso diretto comodo per bilancio generale
    budgetPrevistoProLoco: budgetProLocoPreventivo,
    costiCompetenzaProLoco: costiProLocoConsuntivo,
    entratePrevisteProLoco: entrateProLocoPreviste,
    entrateCompetenzaProLoco: entrateProLocoRealizzate,
    margineCompetenzaProLoco: entrateProLocoRealizzate - costiProLocoConsuntivo,
    differenzaCosti: Math.abs(costiProLocoConsuntivo - budgetProLocoPreventivo),

    costiLordoTotali: costiConsuntivoTotali,
    entrateLordoTotali: entrateRealizzateTotali,
    margineLordoTotale: entrateRealizzateTotali - costiConsuntivoTotali,

    food: foodTotale,
    intrattenimento: intrattenimentoTotale,
    altreSpese: altreSpeseTotale,
    varie: varieTotale,

    foodPrev: foodPrevTotale,
    intrattenimentoPrev: intrattenimentoPrevTotale,
    altreSpesePrev: altreSpesePrevTotale,
    variePrev: variePrevTotale,

    partecipantiStimati,
    totaleStands,
    totaleTurniAssegnati,
    totaleTurniConfermati,
    volontariUniciCount: volontariUniciGlobali.size,

    eventiNativiCount: nativi.count,
    eventiIbridiCount: ibridi.count,
    eventiGestioneCount: gestione.count,

    nativi: nativiCompleti,
    ibridi: ibridiCompleti,
    gestione: gestioneCompleti,

    // Raggruppamenti gerarchici
    totaliManifestazioni: {
      budgetPrevisto: budgetPrevistoTotale,
      costiConsuntivo: costiConsuntivoTotali,
      entratePreviste: entratePrevisteTotali,
      entrateRealizzate: entrateRealizzateTotali,
      margineLordo: entrateRealizzateTotali - costiConsuntivoTotali,
      food: foodTotale,
      intrattenimento: intrattenimentoTotale,
      altreSpese: altreSpeseTotale,
      varie: varieTotale,
      partecipantiStimati
    },
    // VALORI UFFICIALI PER IL BILANCIO GENERALE PRO LOCO
    diCompetenzaProLoco: {
      costiConsuntivo: costiProLocoConsuntivo,
      entrateRealizzate: entrateProLocoRealizzate,
      budgetPreventivo: budgetProLocoPreventivo,
      entratePreviste: entrateProLocoPreviste,
      margineNetto: entrateProLocoRealizzate - costiProLocoConsuntivo
    },
    suddivisionePerTipologia: {
      nativi: nativiCompleti,
      ibridi: ibridiCompleti,
      gestione: gestioneCompleti
    }
  };
}
