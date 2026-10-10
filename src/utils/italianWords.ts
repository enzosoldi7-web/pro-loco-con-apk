/**
 * Utility per convertire importi monetari in lettere secondo lo standard contabile italiano
 * Es: 1500.00 -> "millecinquecento/00"
 * Es: 350.50 -> "trecentocinquanta/50"
 */

const UNITA = ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];
const DIECI_DICIANNOVE = [
  'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 
  'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'
];
const DECINE = [
  '', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 
  'sessanta', 'settanta', 'ottanta', 'novanta'
];

function convertiMinoreDiMille(n: number): string {
  if (n === 0) return '';
  let res = '';

  // Centinaia
  const centinaia = Math.floor(n / 100);
  const restoCent = n % 100;
  if (centinaia > 0) {
    if (centinaia === 1) {
      res += 'cento';
    } else {
      res += UNITA[centinaia] + 'cento';
    }
  }

  // Decine e unità
  if (restoCent >= 10 && restoCent <= 19) {
    res += DIECI_DICIANNOVE[restoCent - 10];
  } else if (restoCent >= 20) {
    const d = Math.floor(restoCent / 10);
    const u = restoCent % 10;
    let decinaStr = DECINE[d];
    
    // Troncamento fonetico italiano (es. ventuno non ventiuno, ventotto non ventiotto)
    if (u === 1 || u === 8) {
      decinaStr = decinaStr.slice(0, -1);
    }
    res += decinaStr + UNITA[u];
  } else if (restoCent > 0) {
    res += UNITA[restoCent];
  }

  return res;
}

export function numeroInLettere(valore: number): string {
  const parteIntera = Math.floor(Math.abs(valore));
  const centesimi = Math.round((Math.abs(valore) - parteIntera) * 100);
  const centesimiStr = centesimi.toString().padStart(2, '0');

  if (parteIntera === 0) {
    return `zero/${centesimiStr}`;
  }

  let parole = '';

  // Milioni
  const milioni = Math.floor(parteIntera / 1000000);
  const restoMilioni = parteIntera % 1000000;
  if (milioni > 0) {
    if (milioni === 1) {
      parole += 'unmilione';
    } else {
      parole += convertiMinoreDiMille(milioni) + 'milioni';
    }
  }

  // Migliaia
  const migliaia = Math.floor(restoMilioni / 1000);
  const restoMigliaia = restoMilioni % 1000;
  if (migliaia > 0) {
    if (migliaia === 1) {
      parole += 'mille';
    } else {
      parole += convertiMinoreDiMille(migliaia) + 'mila';
    }
  }

  // Unità / Centinaia
  if (restoMigliaia > 0) {
    parole += convertiMinoreDiMille(restoMigliaia);
  }

  return `${parole}/${centesimiStr}`;
}
