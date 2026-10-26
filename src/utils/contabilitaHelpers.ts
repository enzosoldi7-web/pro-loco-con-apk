import { MovimentoContabile } from '../types';

/**
 * Verifica se un movimento di prima nota è generato da o duplicato di un altro modulo:
 * - Quote: riferimentoId inizia con 'quota-'
 * - Donazioni: riferimentoId inizia con 'donazione-'
 * - Eventi: riferimentoId inizia con 'evento-'
 */
export function isMovimentoCollegatoAQuote(m: MovimentoContabile): boolean {
  return Boolean(m.riferimentoId && m.riferimentoId.startsWith('quota-'));
}

export function isMovimentoCollegatoADonazioni(m: MovimentoContabile): boolean {
  return Boolean(m.riferimentoId && m.riferimentoId.startsWith('donazione-'));
}

export function isMovimentoCollegatoAEventi(m: MovimentoContabile): boolean {
  return Boolean(m.riferimentoId && m.riferimentoId.startsWith('evento-'));
}

export interface AnalisiMovimentiContabiliBilancio {
  /** Movimenti dell'anno filtrato */
  movimentiAnno: MovimentoContabile[];
  
  /** Spese autonome di struttura e funzionamento (utenze, assicurazioni, affitti, rimborsi, ecc.) */
  usciteAutonome: MovimentoContabile[];
  totaleUsciteAutonome: number;
  
  /** Dettaglio voci di spesa autonome per Rendiconto Cassa Modello D RUNTS */
  speseUtenzeSede: number;
  speseAffittiLocali: number;
  speseAssicurazioni: number;
  speseCancelleriaTipografia: number;
  speseServiziConsulenze: number;
  speseRimborsiVolontari: number;
  speseMaterialiAttrezzatureAutonome: number;
  speseAltreAutonome: number;
  
  /** Entrate autonome da Prima Nota (contributi pubblici, sponsor istituzionali, altre entrate) */
  entrateAutonome: MovimentoContabile[];
  totaleEntrateAutonome: number;
  
  /** Dettaglio entrate autonome */
  entrateContributiPubblici: number;
  entrateSponsorIstituzionali: number;
  entrateAltreAutonome: number;
}

export function analizzaMovimentiPerBilancio(
  movimenti: MovimentoContabile[], 
  annoFiltro: number | 'tutti'
): AnalisiMovimentiContabiliBilancio {
  const movimentiAnno = movimenti.filter(m => {
    if (annoFiltro === 'tutti') return true;
    const year = m.anno || parseInt((m.data || '').substring(0, 4), 10);
    return year === annoFiltro;
  });

  // Uscite autonome: esclude uscite già imputate a manifestazioni/eventi ('evento-')
  // per prevenire tassativamente il doppio conteggio rispetto ai costi consuntivo eventi
  const usciteAutonome = movimentiAnno.filter(m => 
    m.tipo === 'uscita' && !isMovimentoCollegatoAEventi(m)
  );

  let speseUtenzeSede = 0;
  let speseAffittiLocali = 0;
  let speseAssicurazioni = 0;
  let speseCancelleriaTipografia = 0;
  let speseServiziConsulenze = 0;
  let speseRimborsiVolontari = 0;
  let speseMaterialiAttrezzatureAutonome = 0;
  let speseAltreAutonome = 0;

  usciteAutonome.forEach(m => {
    const val = Number(m.importo) || 0;
    switch (m.categoria) {
      case 'utenze_sede':
        speseUtenzeSede += val;
        break;
      case 'affitti_locali':
        speseAffittiLocali += val;
        break;
      case 'assicurazioni':
        speseAssicurazioni += val;
        break;
      case 'cancelleria_tipografia':
        speseCancelleriaTipografia += val;
        break;
      case 'servizi_consulenze':
        speseServiziConsulenze += val;
        break;
      case 'rimborsi_volontari':
        speseRimborsiVolontari += val;
        break;
      case 'materiali_attrezzature':
        speseMaterialiAttrezzatureAutonome += val;
        break;
      default:
        speseAltreAutonome += val;
        break;
    }
  });

  const totaleUsciteAutonome = usciteAutonome.reduce((sum, m) => sum + (Number(m.importo) || 0), 0);

  // Entrate autonome: esclude entrate collegate a Quote Sociali, Donazioni Terzi o Eventi
  const entrateAutonome = movimentiAnno.filter(m => {
    if (m.tipo !== 'entrata') return false;
    if (isMovimentoCollegatoAQuote(m)) return false;
    if (isMovimentoCollegatoADonazioni(m)) return false;
    if (isMovimentoCollegatoAEventi(m)) return false;
    // Se la categoria è quote_associative o donazioni_liberalita ma priva di ref,
    // evitiamo comunque di duplicare i totali ufficiali dei moduli soci/donazioni
    if (m.categoria === 'quote_associative' || m.categoria === 'donazioni_liberalita') return false;
    return true;
  });

  let entrateContributiPubblici = 0;
  let entrateSponsorIstituzionali = 0;
  let entrateAltreAutonome = 0;

  entrateAutonome.forEach(m => {
    const val = Number(m.importo) || 0;
    switch (m.categoria) {
      case 'contributi_pubblici':
        entrateContributiPubblici += val;
        break;
      case 'sponsor_partner':
        entrateSponsorIstituzionali += val;
        break;
      default:
        entrateAltreAutonome += val;
        break;
    }
  });

  const totaleEntrateAutonome = entrateAutonome.reduce((sum, m) => sum + (Number(m.importo) || 0), 0);

  return {
    movimentiAnno,
    usciteAutonome,
    totaleUsciteAutonome,
    speseUtenzeSede,
    speseAffittiLocali,
    speseAssicurazioni,
    speseCancelleriaTipografia,
    speseServiziConsulenze,
    speseRimborsiVolontari,
    speseMaterialiAttrezzatureAutonome,
    speseAltreAutonome,
    entrateAutonome,
    totaleEntrateAutonome,
    entrateContributiPubblici,
    entrateSponsorIstituzionali,
    entrateAltreAutonome
  };
}
