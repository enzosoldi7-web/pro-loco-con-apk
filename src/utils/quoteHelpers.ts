import { Socio, ProLocoInfo, StatoQuota } from '../types';
import { getStatoQuotaSocio } from '../storage';

export interface InfoScadenzaQuota {
  dataScadenzaEsercizio: string; // es. "31/12/2026"
  dataScadenzaISO: string; // "2026-12-31"
  dataLimiteAssemblea: string; // "31/03/2027" (limite statutario per diritto di voto)
  giorniRimanenti: number; // differenza giorni rispetto a oggi (negativa se scaduta)
  isScaduta: boolean;
  isScadenzaImminente: boolean; // entro 30 giorni
  etichettaTempo: string; // es. "Scadenza 31/12/2026 (mancano 107 giorni)"
  dataUltimaQuota?: string;
  annoUltimaQuota?: number;
  giorniDallaScadenzaPrecedente?: number;
}

export interface DettaglioSocioRinnovo {
  socio: Socio;
  stato: StatoQuota;
  importoDovuto: number;
  scadenza: InfoScadenzaQuota;
  haEmail: boolean;
  haTelefono: boolean;
}

/**
 * Calcola la quota standard dovuta dal socio in base alla sua categoria.
 */
export function getImportoQuotaPerSocio(socio: Socio, config: ProLocoInfo): number {
  if (socio.categoria === 'Onorario') return 0;
  if (socio.categoria === 'Sostenitore') return Number(config.quotaStandardSostenitore) || 30;
  if (socio.categoria === 'Giovane') return Number(config.quotaStandardGiovane) || 10;
  return Number(config.quotaStandardOrdinario) || 15;
}

/**
 * Calcola le informazioni dettagliate sulla scadenza della quota associativa per un determinato anno.
 */
export function calcolaScadenzaQuota(anno: number, socio?: Socio, dataRiferimento: Date = new Date()): InfoScadenzaQuota {
  const dataScadenzaISO = `${anno}-12-31`;
  const dataScadenzaEsercizio = `31/12/${anno}`;
  const dataLimiteAssemblea = `31/03/${anno + 1}`;

  const targetDate = new Date(anno, 11, 31, 23, 59, 59);
  const oggi = new Date(dataRiferimento.getFullYear(), dataRiferimento.getMonth(), dataRiferimento.getDate());
  const diffMs = targetDate.getTime() - oggi.getTime();
  const giorniRimanenti = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isScaduta = giorniRimanenti < 0;
  const isScadenzaImminente = !isScaduta && giorniRimanenti <= 30;

  let etichettaTempo = '';
  if (isScaduta) {
    const ritardo = Math.abs(giorniRimanenti);
    etichettaTempo = `Scaduta da ${ritardo} ${ritardo === 1 ? 'giorno' : 'giorni'} (${dataScadenzaEsercizio})`;
  } else if (giorniRimanenti === 0) {
    etichettaTempo = `Scade oggi (${dataScadenzaEsercizio})`;
  } else {
    etichettaTempo = `Scadenza ${dataScadenzaEsercizio} (mancano ${giorniRimanenti} ${giorniRimanenti === 1 ? 'giorno' : 'giorni'})`;
  }

  let dataUltimaQuota: string | undefined;
  let annoUltimaQuota: number | undefined;
  let giorniDallaScadenzaPrecedente: number | undefined;

  if (socio && socio.quote && socio.quote.length > 0) {
    const quoteOrdinate = [...socio.quote].sort((a, b) => {
      if (b.anno !== a.anno) return b.anno - a.anno;
      return (b.dataPagamento || '').localeCompare(a.dataPagamento || '');
    });
    const ultima = quoteOrdinate[0];
    annoUltimaQuota = ultima.anno;
    dataUltimaQuota = ultima.dataPagamento;

    if (ultima.anno < anno) {
      const scadenzaPrecedente = new Date(ultima.anno, 11, 31, 23, 59, 59);
      const diffMsPrec = oggi.getTime() - scadenzaPrecedente.getTime();
      giorniDallaScadenzaPrecedente = Math.max(0, Math.ceil(diffMsPrec / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    dataScadenzaEsercizio,
    dataScadenzaISO,
    dataLimiteAssemblea,
    giorniRimanenti,
    isScaduta,
    isScadenzaImminente,
    etichettaTempo,
    dataUltimaQuota,
    annoUltimaQuota,
    giorniDallaScadenzaPrecedente
  };
}

/**
 * Estrae e calcola l'elenco dei soci che non hanno ancora rinnovato la quota per l'anno specificato.
 */
export function getSociNonRinnovati(soci: Socio[], anno: number, config: ProLocoInfo): DettaglioSocioRinnovo[] {
  return soci
    .filter(s => {
      if (s.dataCancellazione) return false;
      if (s.attivo === false) return false;
      if (s.categoria === 'Onorario') return false; // Onorari esenti
      const stato = getStatoQuotaSocio(s, anno);
      return stato !== 'in_regola';
    })
    .map(s => {
      const stato = getStatoQuotaSocio(s, anno);
      const importoDovuto = getImportoQuotaPerSocio(s, config);
      const scadenza = calcolaScadenzaQuota(anno, s);
      const haEmail = Boolean(s.email && s.email.includes('@'));
      const haTelefono = Boolean(s.telefono && s.telefono.trim().length >= 6);

      return {
        socio: s,
        stato,
        importoDovuto,
        scadenza,
        haEmail,
        haTelefono
      };
    });
}

export type TipoTemplatePromemoria = 'istituzionale' | 'caloroso' | 'sollecito';

export interface TemplatePromemoria {
  id: TipoTemplatePromemoria;
  titolo: string;
  descrizione: string;
  oggetto: string;
  testo: string;
}

export const TEMPLATE_PROMEMORIA_PREDEFINITI: TemplatePromemoria[] = [
  {
    id: 'istituzionale',
    titolo: 'Istituzionale & Cortese',
    descrizione: 'Promemoria formale e cordiale con dettagli statutari e scadenza',
    oggetto: 'Promemoria Rinnovo Quota Associativa {ANNO} - Pro Loco {COMUNE}',
    testo: `Gentile {NOME} {COGNOME},

ti ricordiamo che è in corso la campagna di rinnovo del tesseramento alla Pro Loco {COMUNE} per l'anno {ANNO}.

In base alla tua anagrafica (Tessera N. {NUMERO_TESSERA}, Categoria: {CATEGORIA}), la quota associativa annuale prevista è di € {IMPORTO},00.

La scadenza statutaria del tesseramento è fissata al {DATA_SCADENZA} (termine ultimo per esercizio diritto di voto: {DATA_LIMITE_ASSEMBLEA}).

Puoi regolarizzare la quota:
- Di persona presso la nostra sede in {INDIRIZZO} ({COMUNE})
- Tramite bonifico bancario / Satispay concordando con la Segreteria

Il tuo sostegno costante è prezioso per dare vita a manifestazioni, iniziative culturali e progetti per la comunità.

Per qualsiasi informazione o chiarimento puoi scriverci a {EMAIL} o contattare il numero {TELEFONO}.

Cordiali saluti,
Il Consiglio Direttivo
Pro Loco {COMUNE}`
  },
  {
    id: 'caloroso',
    titolo: 'Caloroso & Comunitario',
    descrizione: 'Tono amichevole ed entusiasta incentrato sul supporto alle tradizioni del paese',
    oggetto: 'Rinnova la tua tessera {ANNO}! Continuiamo a far vivere la Pro Loco {COMUNE} 🌟',
    testo: `Ciao {NOME}! 🌟

Il nuovo anno associativo {ANNO} è iniziato e abbiamo tantissimi eventi, sagre e iniziative in cantiere per rendere il nostro territorio sempre più vivo ed accogliente!

La tua partecipazione e il tuo affetto sono fondamentali per noi. Ti aspettiamo per rinnovare la tessera socio Pro Loco {COMUNE} (quota per la tua categoria: € {IMPORTO},00) entro il {DATA_SCADENZA}.

Passa a trovarci in sede o contattaci al {TELEFONO} per rinnovare con comodità!

Grazie di cuore per essere parte della nostra grande famiglia!

Un caro saluto,
La Pro Loco {COMUNE}`
  },
  {
    id: 'sollecito',
    titolo: 'Sollecito Ufficiale & Scadenza Imminente',
    descrizione: 'Comunicazione puntuale di sollecito con richiamo al mantenimento dello status di socio',
    oggetto: 'AVVISO: Regolarizzazione Quota Sociale {ANNO} - Socio N. {NUMERO_TESSERA}',
    testo: `Gentile Socio {NOME} {COGNOME},

dalle registrazioni del nostro Libro Soci risulta che la quota associativa per l'anno {ANNO} (pari a € {IMPORTO},00) non è stata ancora saldata.

Ti ricordiamo che il rinnovo entro il {DATA_SCADENZA} è indispensabile per mantenere l'anzianità di iscrizione all'albo, la copertura assicurativa UNPLI e il diritto di voto in assemblea ({DATA_LIMITE_ASSEMBLEA}).

Ti preghiamo di provvedere quanto prima al versamento contattando la segreteria ({EMAIL} - Tel. {TELEFONO}) o passando direttamente in sede.

Se hai già provveduto al versamento negli ultimissimi giorni, ti chiediamo di considerare nullo il presente promemoria.

Ringraziandoti per la consueta collaborazione,
Pro Loco {COMUNE}`
  }
];

/**
 * Sostituisce i placeholder dinamici con i valori effettivi del socio e dell'associazione.
 */
export function compilaTemplatePromemoria(
  testoTemplate: string,
  dettaglio: DettaglioSocioRinnovo,
  anno: number,
  config: ProLocoInfo
): string {
  const { socio, scadenza, importoDovuto } = dettaglio;

  return testoTemplate
    .replace(/\{NOME\}/g, socio.nome || '')
    .replace(/\{COGNOME\}/g, socio.cognome || '')
    .replace(/\{NUMERO_TESSERA\}/g, socio.numeroTessera || 'In assegnazione')
    .replace(/\{CATEGORIA\}/g, socio.categoria || 'Ordinario')
    .replace(/\{ANNO\}/g, anno.toString())
    .replace(/\{IMPORTO\}/g, importoDovuto.toString())
    .replace(/\{DATA_SCADENZA\}/g, scadenza.dataScadenzaEsercizio)
    .replace(/\{DATA_LIMITE_ASSEMBLEA\}/g, scadenza.dataLimiteAssemblea)
    .replace(/\{COMUNE\}/g, config.comune || 'Locale')
    .replace(/\{NOME_PROLOCO\}/g, config.nome || 'Pro Loco')
    .replace(/\{INDIRIZZO\}/g, config.indirizzo || 'Via Roma')
    .replace(/\{EMAIL\}/g, config.email || '')
    .replace(/\{TELEFONO\}/g, config.telefono || '')
    .replace(/\{NOME_PRESIDENTE\}/g, config.nomePresidente || 'Il Presidente');
}

export interface RiepilogoQuoteSoci {
  totaleSociAttivi: number;
  sociInRegolaCount: number;
  sociDaRinnovareCount: number;
  sociScadutiCount: number;
  incassoTotaleAnno: number;
  incassoPotenzialeMancante: number;
}

export function calcolaRiepilogoQuoteSoci(
  soci: Socio[],
  anno: number,
  config: ProLocoInfo
): RiepilogoQuoteSoci {
  const sociAttivi = soci.filter(s => !s.dataCancellazione);
  let sociInRegolaCount = 0;
  let sociDaRinnovareCount = 0;
  let sociScadutiCount = 0;
  let incassoTotaleAnno = 0;

  sociAttivi.forEach(s => {
    const stato = getStatoQuotaSocio(s, anno);
    if (stato === 'in_regola') sociInRegolaCount++;
    else if (stato === 'da_rinnovare') sociDaRinnovareCount++;
    else sociScadutiCount++;

    (s.quote || []).forEach(q => {
      if (q.anno === anno) {
        incassoTotaleAnno += Number(q.importo) || 0;
      }
    });
  });

  const nonRinnovati = getSociNonRinnovati(sociAttivi, anno, config);
  const incassoPotenzialeMancante = nonRinnovati.reduce((sum, d) => sum + d.importoDovuto, 0);

  return {
    totaleSociAttivi: sociAttivi.length,
    sociInRegolaCount,
    sociDaRinnovareCount,
    sociScadutiCount,
    incassoTotaleAnno,
    incassoPotenzialeMancante
  };
}

