import React, { useState, useMemo, useEffect } from 'react';
import {
  Socio,
  ProLocoInfo,
  ComunicazioneSocio,
  CategoriaComunicazioneSocio,
  EdizioneGiornalino
} from '../types';
import {
  getStatoQuotaSocio,
  loadComunicazioniSoci,
  saveComunicazioniSoci,
  syncDatabaseToServer,
  getPublicPortalOrigin,
  getActiveTryCloudflareUrl,
  fetchActiveTunnelUrl,
  PERMANENT_BRIDGE_URL
} from '../storage';
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Sparkles,
  FileText,
  Trash2,
  Copy,
  Check,
  Bell,
  Newspaper,
  Megaphone,
  Filter,
  UserCheck,
  Eye,
  Plus,
  Edit3,
  MessageSquare,
  Globe,
  ShieldCheck,
  Tag,
  Calendar,
  Award,
  RefreshCw,
  Download
} from 'lucide-react';

interface ComunicazioniNewsletterViewProps {
  soci: Socio[];
  config: ProLocoInfo;
  annoSelezionato: number;
  archivioGiornalini?: EdizioneGiornalino[];
  onVaiASocio?: (socio: Socio) => void;
}

type GruppoDestinatari =
  | 'tutti'
  | 'in_regola'
  | 'da_rinnovare'
  | 'scaduta'
  | 'direttivo'
  | 'volontari'
  | 'ordinari'
  | 'sostenitori'
  | 'giovani'
  | 'onorari';

interface TemplateComunicazione {
  id: string;
  nome: string;
  categoria: CategoriaComunicazioneSocio;
  gruppoConsigliato: GruppoDestinatari;
  titolo: string;
  oggetto: string;
  contenuto: string;
}

const TEMPLATES_COMUNICAZIONI: TemplateComunicazione[] = [
  {
    id: 'newsletter_mensile',
    nome: 'Newsletter Mensile & Attività',
    categoria: 'newsletter',
    gruppoConsigliato: 'tutti',
    titolo: 'Newsletter Mensile Soci {NOME_PROLOCO} — Aggiornamenti & Prossimi Eventi',
    oggetto: '[{NOME_PROLOCO}] Newsletter Ufficiale dei Soci • Iniziative {ANNO}',
    contenuto: `Gentile {NOME} {COGNOME} (Tessera N° {NUMERO_TESSERA}),

siamo felici di condividere con te gli aggiornamenti sulle attività e sulle prossime iniziative della nostra Associazione {NOME_PROLOCO} di {COMUNE}.

📌 IN PRIMO PIANO QUESTO MESE:
• Preparazione e coordinamento del calendario manifestazioni {ANNO};
• Nuove agevolazioni e convenzioni attive presentando la tua Tessera Socio UNPLI;
• Incontri operativi dei gruppi di volontariato culturale ed enogastronomico.

📲 PORTALE WEB & APP ANDROID DEL SOCIO:
Ti ricordiamo che puoi consultare in qualsiasi momento la tua Tessera Digitale, le ricevute delle quote, gli avvisi e sfogliare il Giornalino della Pro Loco dal tuo Portale Personale:
{LINK_PORTALE_SOCIO}
(Credenziali: Tessera {NUMERO_TESSERA} • PIN {PIN_SOCIO})

Per qualsiasi proposta o per dare disponibilità come volontario, rispondi pure a questa email o contattaci al {TELEFONO_PROLOCO}.

Un cordiale saluto associativo,
{NOME_PRESIDENTE}
Presidente {NOME_PROLOCO}
Sede: {INDIRIZZO_PROLOCO} - {COMUNE}`
  },
  {
    id: 'convocazione_assemblea',
    nome: 'Convocazione Assemblea Soci',
    categoria: 'assemblea',
    gruppoConsigliato: 'in_regola',
    titolo: 'Convocazione Ufficiale Assemblea Ordinaria dei Soci {ANNO}',
    oggetto: '[{NOME_PROLOCO}] Convocazione Assemblea Ordinaria dei Soci — Anno {ANNO}',
    contenuto: `Gentile Socio/a {NOME} {COGNOME} (Tessera N° {NUMERO_TESSERA}),

ai sensi dello Statuto Sociale, è convocata l'Assemblea Ordinaria dei Soci dell'Associazione {NOME_PROLOCO} presso la sede sociale in {INDIRIZZO_PROLOCO}, {COMUNE}.

ORDINE DEL GIORNO:
1. Relazione morale e illustrazione delle attività svolte dal Consiglio Direttivo;
2. Approvazione del Rendiconto Economico-Finanziario (Bilancio Terzo Settore RUNTS);
3. Presentazione del programma manifestazioni ed eventi {ANNO};
4. Varie ed eventuali.

Hanno diritto di voto tutti i soci in regola con il versamento della quota associativa per l'anno {ANNO} (Stato tua quota: {STATO_QUOTA}).

Puoi scaricare la documentazione e verificare la tua posizione dal tuo Portale Socio:
{LINK_PORTALE_SOCIO}

Confidando nella tua preziosa partecipazione, porgiamo cordiali saluti.

Il Presidente
{NOME_PRESIDENTE}
{NOME_PROLOCO}`
  },
  {
    id: 'ringraziamento_in_regola',
    nome: 'Ringraziamento Soci in Regola',
    categoria: 'avviso',
    gruppoConsigliato: 'in_regola',
    titolo: 'Conferma Regolarità Quota {ANNO} e Benefici Tessera Socio',
    oggetto: '[{NOME_PROLOCO}] Grazie per il tuo sostegno! Tessera {NUMERO_TESSERA} Attiva ({ANNO})',
    contenuto: `Caro/a {NOME} {COGNOME},

a nome di tutto il Consiglio Direttivo di {NOME_PROLOCO}, desideriamo ringraziarti per aver rinnovato la tua adesione per l'Anno Sociale {ANNO}.

✅ RIEPILOGO TUA ISCRIZIONE:
• Intestatario: {NOME} {COGNOME}
• Numero Tessera: {NUMERO_TESSERA}
• Qualifica: Socio {CATEGORIA}
• Stato Quota {ANNO}: {STATO_QUOTA}

La tua tessera digitale e le ricevute ufficiali di pagamento sono sempre disponibili sul tuo Portale Socio e sull'App Android:
{LINK_PORTALE_SOCIO}

Grazie per contribuire concretamente alla valorizzazione e alle tradizioni di {COMUNE}!

Un caro saluto,
{NOME_PRESIDENTE}
{NOME_PROLOCO}`
  },
  {
    id: 'promemoria_rinnovo_quota',
    nome: 'Invito Rinnovo Quota Sociale',
    categoria: 'avviso',
    gruppoConsigliato: 'da_rinnovare',
    titolo: 'Promemoria Rinnovo Tessera e Quota Associativa {ANNO}',
    oggetto: '[{NOME_PROLOCO}] Invito al Rinnovo della Quota Associativa {ANNO} (Tessera {NUMERO_TESSERA})',
    contenuto: `Gentile {NOME} {COGNOME} (Tessera N° {NUMERO_TESSERA}),

ti scriviamo per ricordarti che è aperta la campagna di tesseramento e rinnovo delle quote associative per l'anno {ANNO} della {NOME_PROLOCO}.

Il tuo contributo è fondamentale per sostenere le sagre, gli eventi culturali e la tutela del nostro borgo di {COMUNE}.

📋 RIEPILOGO:
• Socio: {NOME} {COGNOME} ({CATEGORIA})
• Numero Tessera: {NUMERO_TESSERA}
• Quota associativa standard: € {QUOTA_STANDARD}
• Stato attuale {ANNO}: {STATO_QUOTA}

Puoi versare la quota presso la nostra sede in {INDIRIZZO_PROLOCO} oppure tramite bonifico bancario{IBAN_INFO}.

Accedi in ogni momento al tuo Portale Socio:
{LINK_PORTALE_SOCIO}

Ti aspettiamo!
{NOME_PRESIDENTE} — {NOME_PROLOCO}`
  },
  {
    id: 'chiamata_volontari_evento',
    nome: 'Invito Eventi & Turni Volontari',
    categoria: 'evento',
    gruppoConsigliato: 'volontari',
    titolo: 'Organizzazione Squadre Volontari e Stand Prossima Manifestazione',
    oggetto: '[{NOME_PROLOCO}] Invito Operativo Soci & Volontari — Prossimi Eventi a {COMUNE}',
    contenuto: `Caro/a {NOME} {COGNOME} (Tessera N° {NUMERO_TESSERA}),

stiamo entrando nel vivo dell'organizzazione delle prossime manifestazioni della {NOME_PROLOCO}!
Invitiamo tutti i soci e i volontari che desiderano dare una mano (stand gastronomici, accoglienza, cassa ticket, allestimento e logistica) a confermare la propria disponibilità.

👉 Puoi iscriverti direttamente agli eventi in programma dal tuo Portale Socio o dall'App APK:
{LINK_PORTALE_SOCIO}

Oppure rispondi a questa email indicando i giorni e le fasce orarie (mattina, pranzo, pomeriggio, cena) in cui preferisci partecipare.

Grazie per il tuo entusiasmo e spirito di squadra!

Il Comitato Eventi & {NOME_PRESIDENTE}
{NOME_PROLOCO}`
  },
  {
    id: 'convenzioni_tesserati',
    nome: 'Nuove Convenzioni & Sconti Soci',
    categoria: 'convenzione',
    gruppoConsigliato: 'in_regola',
    titolo: 'Nuove Convenzioni ed Esercizi Aderenti per i Tesserati {ANNO}',
    oggetto: '[{NOME_PROLOCO}] Nuove Convenzioni e Agevolazioni per la tua Tessera {NUMERO_TESSERA}',
    contenuto: `Gentile {NOME} {COGNOME},

siamo lieti di informarti che sono attive nuove convenzioni riservate ai soci di {NOME_PROLOCO} in regola con il tesseramento {ANNO}.

Esibendo la tua Tessera Socio N° {NUMERO_TESSERA} (anche in formato digitale con QR Code dal tuo smartphone) potrai usufruire di sconti dedicati presso le attività convenzionate del territorio di {COMUNE} e delle agevolazioni nazionali UNPLI.

Visualizza subito la tua Tessera Digitale:
{LINK_PORTALE_SOCIO}

Cordiali saluti,
La Segreteria di {NOME_PROLOCO}`
  }
];

export const ComunicazioniNewsletterView: React.FC<ComunicazioniNewsletterViewProps> = ({
  soci,
  config,
  annoSelezionato,
  archivioGiornalini = [],
  onVaiASocio
}) => {
  // Soci attivi (non cancellati dall'albo)
  const sociAttivi = useMemo(() => soci.filter(s => !s.dataCancellazione), [soci]);

  // Stato filtro gruppo destinatari
  const [gruppoDestinatari, setGruppoDestinatari] = useState<GruppoDestinatari>('tutti');
  const [soloConEmail, setSoloConEmail] = useState<boolean>(false);
  const [ricercaSocio, setRicercaSocio] = useState<string>('');

  // Stato selezione manuale soci
  const [sociSelezionatiIds, setSociSelezionatiIds] = useState<string[]>(() =>
    soci.filter(s => !s.dataCancellazione).map(s => s.id)
  );
  const [socioAnteprimaId, setSocioAnteprimaId] = useState<string>(() =>
    soci.find(s => !s.dataCancellazione)?.id || ''
  );

  // Stato editor messaggio / newsletter
  const [templateAttivoId, setTemplateAttivoId] = useState<string>('newsletter_mensile');
  const [categoriaMessaggio, setCategoriaMessaggio] = useState<CategoriaComunicazioneSocio>('newsletter');
  const [titoloBacheca, setTitoloBacheca] = useState<string>(TEMPLATES_COMUNICAZIONI[0].titolo);
  const [oggettoEmail, setOggettoEmail] = useState<string>(TEMPLATES_COMUNICAZIONI[0].oggetto);
  const [corpoMessaggio, setCorpoMessaggio] = useState<string>(TEMPLATES_COMUNICAZIONI[0].contenuto);
  const [autoreMessaggio, setAutoreMessaggio] = useState<string>(
    config.nomePresidente ? `Presidenza • ${config.nomePresidente}` : 'Consiglio Direttivo & Segreteria'
  );
  const [inEvidenza, setInEvidenza] = useState<boolean>(true);
  const [pubblicaAncheInBachecaApk, setPubblicaAncheInBachecaApk] = useState<boolean>(true);
  const [includiLinkApkNelMessaggio, setIncludiLinkApkNelMessaggio] = useState<boolean>(false);

  // Storico comunicazioni inviate / pubblicate
  const [comunicazioniStorico, setComunicazioniStorico] = useState<ComunicazioneSocio[]>(() =>
    loadComunicazioniSoci()
  );
  const [filtroStoricoCategoria, setFiltroStoricoCategoria] = useState<string>('tutte');

  // Feedback UI
  const [notificaBanner, setNotificaBanner] = useState<{ tipo: 'success' | 'info'; testo: string } | null>(null);
  const [copiatoEmailList, setCopiatoEmailList] = useState<boolean>(false);
  const [copiatoTesto, setCopiatoTesto] = useState<boolean>(false);
  const [inviatiIndividualiIds, setInviatiIndividualiIds] = useState<string[]>([]);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(() => getActiveTryCloudflareUrl());

  useEffect(() => {
    let mounted = true;
    fetchActiveTunnelUrl(false).then(url => {
      if (mounted && url) setTunnelUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncStorico = () => {
      setComunicazioniStorico(loadComunicazioniSoci());
    };
    window.addEventListener('storage', syncStorico);
    return () => window.removeEventListener('storage', syncStorico);
  }, []);

  const mostraNotifica = (testo: string, tipo: 'success' | 'info' = 'success') => {
    setNotificaBanner({ tipo, testo });
    setTimeout(() => {
      setNotificaBanner(prev => (prev?.testo === testo ? null : prev));
    }, 5000);
  };

  // Funzione che verifica se un socio appartiene al gruppo selezionato
  const appartieneAlGruppo = (socio: Socio, gruppo: GruppoDestinatari): boolean => {
    const statoQuota = getStatoQuotaSocio(socio, annoSelezionato);
    switch (gruppo) {
      case 'tutti':
        return true;
      case 'in_regola':
        return statoQuota === 'in_regola';
      case 'da_rinnovare':
        return statoQuota === 'da_rinnovare' || statoQuota === 'scaduta';
      case 'scaduta':
        return statoQuota === 'scaduta';
      case 'direttivo':
        return Boolean(socio.ruoloDirettivo && socio.ruoloDirettivo !== 'Nessuno') || socio.categoria === 'Membro Direttivo';
      case 'volontari':
        return socio.categoria === 'Volontario Attivo' || Boolean(socio.competenzeVolontariato && socio.competenzeVolontariato.length > 0);
      case 'ordinari':
        return socio.categoria === 'Ordinario';
      case 'sostenitori':
        return socio.categoria === 'Sostenitore';
      case 'giovani':
        return socio.categoria === 'Giovane';
      case 'onorari':
        return socio.categoria === 'Onorario';
      default:
        return true;
    }
  };

  // Conteggi per ciascun segmento di destinatari
  const conteggiSegmenti = useMemo(() => {
    return {
      tutti: sociAttivi.length,
      in_regola: sociAttivi.filter(s => appartieneAlGruppo(s, 'in_regola')).length,
      da_rinnovare: sociAttivi.filter(s => appartieneAlGruppo(s, 'da_rinnovare')).length,
      direttivo: sociAttivi.filter(s => appartieneAlGruppo(s, 'direttivo')).length,
      volontari: sociAttivi.filter(s => appartieneAlGruppo(s, 'volontari')).length,
      ordinari: sociAttivi.filter(s => appartieneAlGruppo(s, 'ordinari')).length,
      sostenitori: sociAttivi.filter(s => appartieneAlGruppo(s, 'sostenitori')).length,
      giovani: sociAttivi.filter(s => appartieneAlGruppo(s, 'giovani')).length
    };
  }, [sociAttivi, annoSelezionato]);

  // Quando l'utente cambia il gruppo preimpostato, seleziona automaticamente tutti i soci di quel gruppo
  const handleSelezionaGruppo = (nuovoGruppo: GruppoDestinatari) => {
    setGruppoDestinatari(nuovoGruppo);
    const matching = sociAttivi
      .filter(s => appartieneAlGruppo(s, nuovoGruppo))
      .filter(s => (!soloConEmail ? true : Boolean(s.email && s.email.trim())));
    setSociSelezionatiIds(matching.map(s => s.id));
    if (matching.length > 0) {
      setSocioAnteprimaId(matching[0].id);
    }
  };

  // Filtra la lista visibile a sinistra in base al gruppo, al filtro email e alla barra di ricerca
  const sociFiltratiLista = useMemo(() => {
    return sociAttivi.filter(s => {
      if (!appartieneAlGruppo(s, gruppoDestinatari)) return false;
      if (soloConEmail && !(s.email && s.email.trim())) return false;
      if (ricercaSocio.trim()) {
        const q = ricercaSocio.toLowerCase().trim();
        const matchNome = (s.nome || '').toLowerCase().includes(q);
        const matchCognome = (s.cognome || '').toLowerCase().includes(q);
        const matchTessera = (s.numeroTessera || '').toLowerCase().includes(q);
        const matchEmail = (s.email || '').toLowerCase().includes(q);
        const matchCategoria = (s.categoria || '').toLowerCase().includes(q);
        if (!matchNome && !matchCognome && !matchTessera && !matchEmail && !matchCategoria) {
          return false;
        }
      }
      return true;
    });
  }, [sociAttivi, gruppoDestinatari, soloConEmail, ricercaSocio, annoSelezionato]);

  // Soci effettivamente spuntati
  const sociDestinatariSelezionati = useMemo(() => {
    return sociAttivi.filter(s => sociSelezionatiIds.includes(s.id));
  }, [sociAttivi, sociSelezionatiIds]);

  const sociSelezionatiConEmail = useMemo(() => {
    return sociDestinatariSelezionati.filter(s => Boolean(s.email && s.email.trim().includes('@')));
  }, [sociDestinatariSelezionati]);

  const sociSelezionatiConTelefono = useMemo(() => {
    return sociDestinatariSelezionati.filter(s => Boolean(s.telefono && s.telefono.replace(/[^0-9]/g, '').length >= 6));
  }, [sociDestinatariSelezionati]);

  // Socio usato per l'anteprima personalizzata in tempo reale
  const socioAnteprima = useMemo(() => {
    return (
      sociAttivi.find(s => s.id === socioAnteprimaId) ||
      sociDestinatariSelezionati[0] ||
      sociFiltratiLista[0] ||
      sociAttivi[0] ||
      null
    );
  }, [sociAttivi, socioAnteprimaId, sociDestinatariSelezionati, sociFiltratiLista]);

  // Sostituzione variabili dinamiche per un singolo socio o in modalità cumulativa
  const compilaTestoPerSocio = (templateStr: string, socioTarget?: Socio | null, modalitaCumulativa: boolean = false): string => {
    const publicOrigin = (tunnelUrl && tunnelUrl.includes('.trycloudflare.com')) ? tunnelUrl : getPublicPortalOrigin();
    const s = socioTarget;
    const statoQuotaRaw = s ? getStatoQuotaSocio(s, annoSelezionato) : 'in_regola';
    const statoQuotaLabel =
      statoQuotaRaw === 'in_regola'
        ? `In regola (${annoSelezionato})`
        : statoQuotaRaw === 'scaduta'
        ? `Scaduta (${annoSelezionato})`
        : `Da rinnovare (${annoSelezionato})`;

    const tesseraClean = s && !modalitaCumulativa ? (s.numeroTessera || '').trim().toUpperCase() : 'PL-' + annoSelezionato;
    const pinSocio = s && !modalitaCumulativa ? (s.pin && s.pin.trim() ? s.pin.trim() : '1234') : '[Il tuo PIN]';
    const linkPortale =
      s && !modalitaCumulativa
        ? `${publicOrigin}/s/${encodeURIComponent(tesseraClean)}`
        : `${publicOrigin}/?portale=soci`;

    const quotaStd =
      s?.categoria === 'Sostenitore'
        ? config.quotaStandardSostenitore || 30
        : s?.categoria === 'Giovane'
        ? config.quotaStandardGiovane || 10
        : config.quotaStandardOrdinario || 15;

    let compilato = templateStr
      .replace(/\{NOME\}/g, modalitaCumulativa || !s ? 'Socio/a' : s.nome || 'Socio')
      .replace(/\{COGNOME\}/g, modalitaCumulativa || !s ? '' : s.cognome || '')
      .replace(/\{NUMERO_TESSERA\}/g, modalitaCumulativa || !s ? '[Tua Tessera]' : tesseraClean)
      .replace(/\{PIN_SOCIO\}/g, pinSocio)
      .replace(/\{CATEGORIA\}/g, modalitaCumulativa || !s ? 'Ordinario' : s.categoria || 'Ordinario')
      .replace(/\{RUOLO_DIRETTIVO\}/g, modalitaCumulativa || !s ? '' : s.ruoloDirettivo || 'Nessuno')
      .replace(/\{STATO_QUOTA\}/g, modalitaCumulativa ? `Verifica sul Portale Soci` : statoQuotaLabel)
      .replace(/\{QUOTA_STANDARD\}/g, quotaStd.toFixed(2))
      .replace(/\{ANNO\}/g, String(annoSelezionato))
      .replace(/\{NOME_PROLOCO\}/g, config.nome || 'Pro Loco')
      .replace(/\{COMUNE\}/g, config.comune || '')
      .replace(/\{INDIRIZZO_PROLOCO\}/g, config.indirizzo || '')
      .replace(/\{EMAIL_PROLOCO\}/g, config.email || '')
      .replace(/\{TELEFONO_PROLOCO\}/g, config.telefono || '')
      .replace(/\{NOME_PRESIDENTE\}/g, config.nomePresidente || 'Il Presidente')
      .replace(/\{IBAN_INFO\}/g, config.iban ? ` (IBAN: ${config.iban})` : '')
      .replace(/\{LINK_PORTALE_SOCIO\}/g, linkPortale);

    if (includiLinkApkNelMessaggio) {
      const slug = tesseraClean.replace(/[^a-zA-Z0-9_]/g, '_');
      const nomeApk = s && !modalitaCumulativa ? `Socio_${slug}.apk` : 'App_ProLoco.apk';
      const linkDownloadDiretto =
        s && !modalitaCumulativa
          ? `${publicOrigin}/apk/${encodeURIComponent(tesseraClean)}.apk?p=${encodeURIComponent(pinSocio)}`
          : `${publicOrigin}/api/apk/download`;
      const linkInst =
        s && !modalitaCumulativa
          ? `${publicOrigin}/inst/${encodeURIComponent(tesseraClean)}?p=${encodeURIComponent(pinSocio)}`
          : `${publicOrigin}/inst`;

      compilato += `\n\n📱 Scarica l'App Android Ufficiale (${nomeApk}):\n• Download Diretto (.APK):\n${linkDownloadDiretto}\n• Pagina di Installazione Guidata:\n${linkInst}`;
      if (publicOrigin !== PERMANENT_BRIDGE_URL) {
        compilato += `\n• Ponte Permanente Cloudflare:\n${PERMANENT_BRIDGE_URL}/apk/${encodeURIComponent(tesseraClean)}.apk`;
      }
    }

    return compilato.replace(/  +/g, ' ').trim();
  };

  // Applichiamo un template predefinito
  const handleApplicaTemplate = (tpl: TemplateComunicazione) => {
    setTemplateAttivoId(tpl.id);
    setCategoriaMessaggio(tpl.categoria);
    setTitoloBacheca(tpl.titolo);
    setOggettoEmail(tpl.oggetto);
    setCorpoMessaggio(tpl.contenuto);
    handleSelezionaGruppo(tpl.gruppoConsigliato);
  };

  // Inserimento rapido variabile nel corpo
  const inserisciVariabile = (placeholder: string) => {
    setCorpoMessaggio(prev => `${prev} ${placeholder}`);
  };

  // Toggle selezione singolo socio
  const handleToggleSocio = (id: string) => {
    setSociSelezionatiIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Seleziona / Deseleziona tutti i soci attualmente filtrati
  const handleToggleTuttiFiltrati = () => {
    const idsFiltrati = sociFiltratiLista.map(s => s.id);
    const tuttiGiaSelezionati = idsFiltrati.length > 0 && idsFiltrati.every(id => sociSelezionatiIds.includes(id));
    if (tuttiGiaSelezionati) {
      setSociSelezionatiIds(prev => prev.filter(id => !idsFiltrati.includes(id)));
    } else {
      setSociSelezionatiIds(prev => Array.from(new Set([...prev, ...idsFiltrati])));
    }
  };

  // Registra la comunicazione nello storico e la sincronizza con Portale Soci e App APK
  const salvaComunicazioneInArchivio = (
    inviataEmail: boolean,
    socioSingolo?: Socio
  ): ComunicazioneSocio[] => {
    const oggi = new Date().toISOString().split('T')[0];
    const ora = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const esistenti = loadComunicazioniSoci();

    const titoloCompilato = compilaTestoPerSocio(titoloBacheca || oggettoEmail, socioSingolo || null, !socioSingolo);
    const oggettoCompilato = compilaTestoPerSocio(oggettoEmail || titoloBacheca, socioSingolo || null, !socioSingolo);
    const contenutoCompilato = compilaTestoPerSocio(corpoMessaggio, socioSingolo || null, !socioSingolo);

    const nuovaCom: ComunicazioneSocio = {
      id: `com-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      titolo: titoloCompilato,
      oggetto: oggettoCompilato,
      categoria: categoriaMessaggio,
      dataPubblicazione: oggi,
      oraPubblicazione: ora,
      autore: autoreMessaggio || config.nomePresidente || 'Segreteria Pro Loco',
      contenuto: contenutoCompilato,
      inEvidenza,
      destinatari:
        gruppoDestinatari === 'in_regola'
          ? 'in_regola'
          : gruppoDestinatari === 'da_rinnovare' || gruppoDestinatari === 'scaduta'
          ? 'da_rinnovare'
          : gruppoDestinatari === 'direttivo'
          ? 'direttivo'
          : gruppoDestinatari === 'volontari'
          ? 'volontari'
          : gruppoDestinatari === 'ordinari'
          ? 'ordinari'
          : 'tutti',
      destinatariCount: socioSingolo ? 1 : sociDestinatariSelezionati.length,
      inviataViaEmail: inviataEmail,
      numeroTesseraRiferimento: socioSingolo
        ? socioSingolo.numeroTessera.trim().toUpperCase()
        : 'TUTTI',
      socioDestinatarioId: socioSingolo?.id,
      socioDestinatarioNome: socioSingolo ? `${socioSingolo.nome} ${socioSingolo.cognome}` : undefined
    };

    const aggiornate = [nuovaCom, ...esistenti];
    saveComunicazioniSoci(aggiornate);
    setComunicazioniStorico(aggiornate);
    syncDatabaseToServer({ comunicazioni: aggiornate });
    return aggiornate;
  };

  // 1. Invio Email Cumulativa (CCN / BCC) a tutti i destinatari selezionati con indirizzo email
  const handleInviaEmailCumulativaCCN = () => {
    if (sociSelezionatiConEmail.length === 0) {
      mostraNotifica('Nessuno dei soci selezionati dispone di un indirizzo email registrato in anagrafica.', 'info');
      return;
    }

    if (pubblicaAncheInBachecaApk) {
      salvaComunicazioneInArchivio(true);
    }

    const bccList = sociSelezionatiConEmail
      .map(s => (s.email || '').trim())
      .filter(Boolean)
      .join(',');

    const oggettoFinale = compilaTestoPerSocio(oggettoEmail || titoloBacheca, null, true);
    const corpoFinale = compilaTestoPerSocio(corpoMessaggio, null, true);
    const destinatarioPrincipale = (config.email || '').trim();

    const mailtoUrl = `mailto:${destinatarioPrincipale}?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(oggettoFinale)}&body=${encodeURIComponent(corpoFinale)}`;
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_top';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostraNotifica(
      `Client Email aperto con ${sociSelezionatiConEmail.length} destinatari in CCN (copia nascosta)${
        pubblicaAncheInBachecaApk ? ' e comunicazione sincronizzata su Portale Soci & App APK!' : '!'
      }`,
      'success'
    );
  };

  // 2. Invio Email Personalizzata 1-a-1 ad un singolo socio (con nome, numero tessera e PIN precompilati)
  const handleInviaEmailSingoloSocio = (socio: Socio) => {
    const email = (socio.email || '').trim();
    if (!email) {
      mostraNotifica(`Il socio ${socio.nome} ${socio.cognome} non ha un indirizzo email in anagrafica.`, 'info');
      return;
    }

    const oggettoPersonalizzato = compilaTestoPerSocio(oggettoEmail || titoloBacheca, socio, false);
    const corpoPersonalizzato = compilaTestoPerSocio(corpoMessaggio, socio, false);

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(oggettoPersonalizzato)}&body=${encodeURIComponent(corpoPersonalizzato)}`;
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_top';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setInviatiIndividualiIds(prev => (prev.includes(socio.id) ? prev : [...prev, socio.id]));
  };

  // 3. Invio WhatsApp Personalizzato 1-a-1 ad un singolo socio
  const handleInviaWhatsAppSingoloSocio = (socio: Socio) => {
    const tel = (socio.telefono || '').replace(/[^0-9+]/g, '');
    if (!tel) {
      mostraNotifica(`Il socio ${socio.nome} ${socio.cognome} non ha un numero di telefono in anagrafica.`, 'info');
      return;
    }
    const testoPersonalizzato = `*${compilaTestoPerSocio(oggettoEmail || titoloBacheca, socio, false)}*\n\n${compilaTestoPerSocio(corpoMessaggio, socio, false)}`;
    const waUrl = `https://wa.me/${tel}?text=${encodeURIComponent(testoPersonalizzato)}`;
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setInviatiIndividualiIds(prev => (prev.includes(socio.id) ? prev : [...prev, socio.id]));
  };

  // 4. Pubblica solo in Bacheca Portale Soci & App APK (senza aprire il client email)
  const handlePubblicaBachecaEApk = () => {
    if (!titoloBacheca.trim() && !oggettoEmail.trim()) {
      mostraNotifica('Inserisci almeno un titolo o oggetto per la comunicazione.', 'info');
      return;
    }
    salvaComunicazioneInArchivio(false);
    mostraNotifica(
      `Comunicazione pubblicata e sincronizzata in tempo reale sul Portale Soci e sull'App APK per ${sociDestinatariSelezionati.length} soci!`,
      'success'
    );
  };

  // 5. Copia lista indirizzi email separati da punto e virgola
  const handleCopiaIndirizziEmail = () => {
    const lista = sociSelezionatiConEmail.map(s => s.email.trim()).join('; ');
    if (!lista) {
      mostraNotifica('Nessun indirizzo email presente tra i soci selezionati.', 'info');
      return;
    }
    navigator.clipboard.writeText(lista);
    setCopiatoEmailList(true);
    setTimeout(() => setCopiatoEmailList(false), 2500);
    mostraNotifica(`${sociSelezionatiConEmail.length} indirizzi email copiati negli appunti!`, 'success');
  };

  // 6. Copia testo messaggio compilato
  const handleCopiaTestoMessaggio = () => {
    const testo = `${compilaTestoPerSocio(oggettoEmail, socioAnteprima, false)}\n\n${compilaTestoPerSocio(corpoMessaggio, socioAnteprima, false)}`;
    navigator.clipboard.writeText(testo);
    setCopiatoTesto(true);
    setTimeout(() => setCopiatoTesto(false), 2500);
  };

  // 7. Esporta CSV destinatari selezionati con messaggio personalizzato (per Mail Merge / Newsletter esterne)
  const handleEsportaListaDestinatariCSV = () => {
    const intestazioni = [
      'Numero Tessera',
      'Cognome',
      'Nome',
      'Email',
      'Telefono',
      'Categoria Socio',
      'Ruolo Direttivo',
      'Stato Quota ' + annoSelezionato,
      'Oggetto Email Personalizzato',
      'Link Diretto Portale Socio'
    ];
    const publicOrigin = getActiveTryCloudflareUrl() || getPublicPortalOrigin();
    const righe = sociDestinatariSelezionati.map(s => {
      const stato = getStatoQuotaSocio(s, annoSelezionato);
      const ogg = compilaTestoPerSocio(oggettoEmail || titoloBacheca, s, false).replace(/"/g, '""');
      const linkSocio = `${publicOrigin}/s/${encodeURIComponent(s.numeroTessera.trim().toUpperCase())}`;
      return [
        `"${s.numeroTessera}"`,
        `"${(s.cognome || '').replace(/"/g, '""')}"`,
        `"${(s.nome || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.telefono || '').replace(/"/g, '""')}"`,
        `"${s.categoria}"`,
        `"${s.ruoloDirettivo || 'Nessuno'}"`,
        `"${stato.toUpperCase()}"`,
        `"${ogg}"`,
        `"${linkSocio}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [intestazioni.join(';'), ...righe].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lista_Destinatari_Newsletter_${config.comune.replace(/[^a-zA-Z0-9]/g, '_')}_${annoSelezionato}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Elimina una comunicazione dallo storico
  const handleEliminaComunicazioneStorico = (id: string) => {
    const filtrate = comunicazioniStorico.filter(c => c.id !== id);
    saveComunicazioniSoci(filtrate);
    setComunicazioniStorico(filtrate);
    syncDatabaseToServer({ comunicazioni: filtrate });
    mostraNotifica('Comunicazione rimossa dallo storico e dalla bacheca soci.', 'info');
  };

  const storicoFiltrato = useMemo(() => {
    if (filtroStoricoCategoria === 'tutte') return comunicazioniStorico;
    return comunicazioniStorico.filter(c => c.categoria === filtroStoricoCategoria);
  }, [comunicazioniStorico, filtroStoricoCategoria]);

  return (
    <div className="space-y-6 no-print">
      {/* BANNER ISTITUZIONALE MODULO COMUNICAZIONI & NEWSLETTER */}
      <div className="bg-gradient-to-r from-indigo-950 via-emerald-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
              1.5 Comunicazioni, Circolari & Newsletter Soci
            </span>
            <span className="text-xs text-emerald-200/90 font-medium">
              Anno Sociale {annoSelezionato} • Sincronizzato con Email, Portale Soci & App APK
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Centro Invio Comunicazioni, Convocazioni & Newsletter ai Soci</span>
          </h2>
          <p className="text-xs text-emerald-100/85 max-w-3xl leading-relaxed">
            Crea messaggi personalizzati, filtra i destinatari per stato di pagamento della quota ({annoSelezionato}) o ruolo associativo, e inviali via <strong>Email Cumulativa (CCN)</strong>, <strong>Email Singola Personalizzata</strong>, <strong>WhatsApp</strong> e <strong>Bacheca App APK</strong>.
          </p>
        </div>

        {/* Statistiche rapide destinatari */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0 relative z-10">
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold block">Selezionati</span>
            <span className="text-lg font-black text-white tabular-nums">{sociDestinatariSelezionati.length}</span>
            <span className="text-[10px] text-emerald-200/80 block">su {sociAttivi.length} soci</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] uppercase tracking-wider text-sky-200 font-bold block">Con Email</span>
            <span className="text-lg font-black text-sky-300 tabular-nums">{sociSelezionatiConEmail.length}</span>
            <span className="text-[10px] text-sky-200/80 block">pronti all'invio</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-200 font-bold block">In Archivio</span>
            <span className="text-lg font-black text-amber-300 tabular-nums">{comunicazioniStorico.length}</span>
            <span className="text-[10px] text-amber-200/80 block">circolari inviate</span>
          </div>
        </div>
      </div>

      {/* NOTIFICA DI FEEDBACK */}
      {notificaBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold shadow-xs animate-in fade-in duration-200 ${
            notificaBanner.tipo === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-sky-50 border-sky-300 text-sky-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificaBanner.testo}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificaBanner(null)}
            className="text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* BARRA SEGMENTAZIONE DESTINATARI (STEP 1: SCEGLI CHI RICEVE LA COMUNICAZIONE) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase bg-emerald-800 text-white">
              Step 1 • Destinatari
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Seleziona il Gruppo di Soci Destinatari
              </h3>
              <p className="text-[11px] text-slate-500">
                Filtra automaticamente i soci per regolarità di pagamento della quota {annoSelezionato}, carica nel Consiglio Direttivo o categoria associativa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloConEmail}
                onChange={e => {
                  const checked = e.target.checked;
                  setSoloConEmail(checked);
                  if (checked) {
                    setSociSelezionatiIds(prev =>
                      prev.filter(id => {
                        const s = sociAttivi.find(x => x.id === id);
                        return Boolean(s && s.email && s.email.trim());
                      })
                    );
                  }
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Mail className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mostra solo soci con Email</span>
            </label>

            <button
              type="button"
              onClick={handleEsportaListaDestinatariCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Esporta elenco destinatari selezionati in formato CSV (Excel / Mailchimp / Brevo)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Esporta Destinatari (CSV)</span>
            </button>
          </div>
        </div>

        {/* Pulsanti rapidi di segmentazione */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            type="button"
            onClick={() => handleSelezionaGruppo('tutti')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'tutti'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-slate-50/80 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Users className={`w-4 h-4 ${gruppoDestinatari === 'tutti' ? 'text-emerald-200' : 'text-slate-500'}`} />
              <span className={`text-xs font-black font-mono ${gruppoDestinatari === 'tutti' ? 'text-white' : 'text-slate-900'}`}>
                {conteggiSegmenti.tutti}
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Tutti i Soci</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'tutti' ? 'text-emerald-200' : 'text-slate-500'}`}>
                Albo attivo completo
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelezionaGruppo('in_regola')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'in_regola'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <CheckCircle2 className={`w-4 h-4 ${gruppoDestinatari === 'in_regola' ? 'text-emerald-100' : 'text-emerald-600'}`} />
              <span className="text-xs font-black font-mono">{conteggiSegmenti.in_regola}</span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Soci in Regola</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'in_regola' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                Quota {annoSelezionato} pagata
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelezionaGruppo('da_rinnovare')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'da_rinnovare'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Clock className={`w-4 h-4 ${gruppoDestinatari === 'da_rinnovare' ? 'text-amber-100' : 'text-amber-600'}`} />
              <span className="text-xs font-black font-mono">{conteggiSegmenti.da_rinnovare}</span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Da Rinnovare</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'da_rinnovare' ? 'text-amber-100' : 'text-amber-700'}`}>
                Quota {annoSelezionato} mancante
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelezionaGruppo('direttivo')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'direttivo'
                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                : 'bg-purple-50/60 hover:bg-purple-100/70 text-purple-950 border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Award className={`w-4 h-4 ${gruppoDestinatari === 'direttivo' ? 'text-purple-200' : 'text-purple-600'}`} />
              <span className="text-xs font-black font-mono">{conteggiSegmenti.direttivo}</span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Consiglio Direttivo</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'direttivo' ? 'text-purple-200' : 'text-purple-700'}`}>
                Cariche & Consiglieri
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelezionaGruppo('volontari')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'volontari'
                ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                : 'bg-teal-50/60 hover:bg-teal-100/70 text-teal-950 border-teal-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <UserCheck className={`w-4 h-4 ${gruppoDestinatari === 'volontari' ? 'text-teal-200' : 'text-teal-600'}`} />
              <span className="text-xs font-black font-mono">{conteggiSegmenti.volontari}</span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Volontari Attivi</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'volontari' ? 'text-teal-200' : 'text-teal-700'}`}>
                Squadre & Stand Eventi
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelezionaGruppo('ordinari')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'ordinari'
                ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Users className={`w-4 h-4 ${gruppoDestinatari === 'ordinari' ? 'text-slate-300' : 'text-slate-500'}`} />
              <span className="text-xs font-black font-mono">{conteggiSegmenti.ordinari}</span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Soci Ordinari</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'ordinari' ? 'text-slate-300' : 'text-slate-500'}`}>
                Categoria Ordinaria
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelezionaGruppo('sostenitori')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              gruppoDestinatari === 'sostenitori'
                ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                : 'bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-950 border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sparkles className={`w-4 h-4 ${gruppoDestinatari === 'sostenitori' ? 'text-indigo-200' : 'text-indigo-600'}`} />
              <span className="text-xs font-black font-mono">{conteggiSegmenti.sostenitori}</span>
            </div>
            <div className="mt-1.5">
              <span className="text-[11px] font-extrabold block leading-tight">Soci Sostenitori</span>
              <span className={`text-[10px] ${gruppoDestinatari === 'sostenitori' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                Benemeriti & Sostenitori
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* GRIGLIA PRINCIPALE: SINISTRA ELENCO DESTINATARI (5 COL) | DESTRA COMPOSITORE NEWSLETTER & INVIO (7 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLONNA SINISTRA: LISTA INTERATTIVA SOCI DESTINATARI */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden max-h-[820px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Elenco Soci Destinatari ({sociFiltratiLista.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Spunta i soci da includere o clicca su un socio per l'anteprima e l'invio singolo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleTuttiFiltrati}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 transition cursor-pointer shadow-2xs"
              >
                {sociFiltratiLista.length > 0 && sociFiltratiLista.every(s => sociSelezionatiIds.includes(s.id))
                  ? 'Deseleziona Tutti'
                  : 'Seleziona Tutti'}
              </button>
            </div>

            {/* Ricerca rapida */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={ricercaSocio}
                onChange={e => setRicercaSocio(e.target.value)}
                placeholder="Cerca socio per nome, tessera o email..."
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {ricercaSocio && (
                <button
                  type="button"
                  onClick={() => setRicercaSocio('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Lista scrollabile dei soci */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {sociFiltratiLista.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Nessun socio trovato per questo filtro.</p>
                <p className="text-[11px] text-slate-400">Prova a cambiare segmento di destinatari o criterio di ricerca.</p>
              </div>
            ) : (
              sociFiltratiLista.map(socio => {
                const isSelected = sociSelezionatiIds.includes(socio.id);
                const isPreview = socioAnteprima?.id === socio.id;
                const statoQuota = getStatoQuotaSocio(socio, annoSelezionato);
                const haEmail = Boolean(socio.email && socio.email.trim().includes('@'));
                const haTel = Boolean(socio.telefono && socio.telefono.replace(/[^0-9]/g, '').length >= 6);
                const giaInviatoSingolo = inviatiIndividualiIds.includes(socio.id);

                return (
                  <div
                    key={socio.id}
                    onClick={() => setSocioAnteprimaId(socio.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isPreview
                        ? 'bg-emerald-50/90 border-emerald-400 shadow-2xs'
                        : isSelected
                        ? 'bg-white hover:bg-slate-50 border-slate-200/90'
                        : 'bg-slate-50/40 border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          e.stopPropagation();
                          handleToggleSocio(socio.id);
                        }}
                        onClick={e => e.stopPropagation()}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {socio.cognome} {socio.nome}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {socio.numeroTessera}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                              statoQuota === 'in_regola'
                                ? 'bg-emerald-100 text-emerald-800'
                                : statoQuota === 'scaduta'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {statoQuota === 'in_regola' ? 'In Regola' : statoQuota === 'scaduta' ? 'Scaduta' : 'Da Rinnovare'}
                          </span>
                          {giaInviatoSingolo && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9.5px] font-bold">
                              ✓ Inviato
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 truncate">
                          {haEmail ? (
                            <span className="inline-flex items-center gap-1 text-slate-600 truncate">
                              <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{socio.email}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Nessuna email</span>
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-[10.5px] text-slate-400">{socio.categoria}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pulsanti invio rapido 1-a-1 per il singolo socio */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={!haEmail}
                        onClick={() => handleInviaEmailSingoloSocio(socio)}
                        title={
                          haEmail
                            ? `Invia email personalizzata a ${socio.nome} ${socio.cognome} (${socio.email})`
                            : 'Indirizzo email non presente'
                        }
                        className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                          haEmail
                            ? 'bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border-sky-200 cursor-pointer'
                            : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={!haTel}
                        onClick={() => handleInviaWhatsAppSingoloSocio(socio)}
                        title={
                          haTel
                            ? `Invia su WhatsApp a ${socio.nome} ${socio.cognome} (${socio.telefono})`
                            : 'Numero di telefono non presente'
                        }
                        className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                          haTel
                            ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200 cursor-pointer'
                            : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer colonna sinistra con riepilogo e copia indirizzi */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-600">
              Selezionati: <strong className="text-slate-900">{sociDestinatariSelezionati.length}</strong> soci (
              <strong className="text-emerald-700">{sociSelezionatiConEmail.length} con email</strong>)
            </div>
            <button
              type="button"
              onClick={handleCopiaIndirizziEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] transition cursor-pointer shadow-2xs"
            >
              {copiatoEmailList ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Email Copiate!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copia Indirizzi Email</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* COLONNA DESTRA: COMPOSITORE MESSAGGIO / NEWSLETTER, ANTEPRIMA E INVIO */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* BOX COMPOSIZIONE MESSAGGIO */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase bg-indigo-700 text-white">
                  Step 2 • Messaggio & Modelli
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Componi la Comunicazione o Scegli un Modello Preimpostato
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Personalizza oggetto e testo usando i segnaposto automatici per ciascun socio.
                  </p>
                </div>
              </div>
            </div>

            {/* Selettore Modelli Rapidi */}
            <div>
              <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                Modelli Pronti per la Pro Loco:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATES_COMUNICAZIONI.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplicaTemplate(tpl)}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      templateAttivoId === tpl.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-2xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${templateAttivoId === tpl.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{tpl.nome}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campi Categoria, Autore e Opzioni */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Categoria Comunicazione
                </label>
                <select
                  value={categoriaMessaggio}
                  onChange={e => setCategoriaMessaggio(e.target.value as CategoriaComunicazioneSocio)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="newsletter">📬 Newsletter Periodica</option>
                  <option value="assemblea">🏛️ Convocazione Assemblea</option>
                  <option value="avviso">📢 Avviso & Tesseramento</option>
                  <option value="evento">🎉 Evento & Volontariato</option>
                  <option value="convenzione">🏷️ Convenzioni & Sconti Soci</option>
                  <option value="generale">📄 Circolare Generale</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Mittente / Firmatario
                </label>
                <input
                  type="text"
                  value={autoreMessaggio}
                  onChange={e => setAutoreMessaggio(e.target.value)}
                  placeholder="Es. Il Presidente / Consiglio Direttivo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex flex-col justify-end gap-1.5">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50/70 border border-amber-200 px-3 py-2 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inEvidenza}
                    onChange={e => setInEvidenza(e.target.checked)}
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Metti in evidenza in Bacheca</span>
                </label>
              </div>
            </div>

            {/* Oggetto Email e Titolo Bacheca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Oggetto dell'Email (Subject)
                </label>
                <input
                  type="text"
                  value={oggettoEmail}
                  onChange={e => setOggettoEmail(e.target.value)}
                  placeholder="Oggetto dell'email..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Titolo in Bacheca Soci & App APK
                </label>
                <input
                  type="text"
                  value={titoloBacheca}
                  onChange={e => setTitoloBacheca(e.target.value)}
                  placeholder="Titolo visibile nel Portale Soci e App APK..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Pulsanti variabili dinamiche */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] font-bold text-slate-500">
                  Inserisci Variabile Dinamica (sostituita automaticamente per ciascun socio):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Nome Socio', code: '{NOME}' },
                  { label: 'Cognome', code: '{COGNOME}' },
                  { label: 'N° Tessera', code: '{NUMERO_TESSERA}' },
                  { label: 'PIN Socio', code: '{PIN_SOCIO}' },
                  { label: 'Stato Quota', code: '{STATO_QUOTA}' },
                  { label: 'Categoria', code: '{CATEGORIA}' },
                  { label: 'Link Portale Socio', code: '{LINK_PORTALE_SOCIO}' },
                  { label: 'Anno', code: '{ANNO}' },
                  { label: 'Presidente', code: '{NOME_PRESIDENTE}' }
                ].map(v => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => inserisciVariabile(v.code)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10.5px] font-mono font-bold transition cursor-pointer"
                  >
                    + {v.label} ({v.code})
                  </button>
                ))}
              </div>
            </div>

            {/* Corpo del messaggio */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Testo del Messaggio / Newsletter
              </label>
              <textarea
                rows={9}
                value={corpoMessaggio}
                onChange={e => setCorpoMessaggio(e.target.value)}
                placeholder="Scrivi qui il contenuto della comunicazione o newsletter..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
              />
            </div>

            {/* Opzioni aggiuntive di invio e sincronizzazione */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pubblicaAncheInBachecaApk}
                    onChange={e => setPubblicaAncheInBachecaApk(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sincronizza automaticamente anche su Bacheca Portale Soci & App APK</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includiLinkApkNelMessaggio}
                    onChange={e => setIncludiLinkApkNelMessaggio(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Allega in calce il link di installazione App Android (.APK)</span>
                </label>
              </div>
            </div>

            {/* PULSANTI PRINCIPALI DI INVIO EMAIL & PUBBLICAZIONE */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleInviaEmailCumulativaCCN}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-black shadow-sm transition cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Invia via Email ai Selezionati ({sociSelezionatiConEmail.length} in CCN)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePubblicaBachecaEApk}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Pubblica su Portale Soci & App APK</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopiaTestoMessaggio}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {copiatoTesto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Testo Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia Testo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ANTEPRIMA IN TEMPO REALE SUL SOCIO SELEZIONATO */}
          {socioAnteprima && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                    Anteprima Email Personalizzata per: {socioAnteprima.nome} {socioAnteprima.cognome} ({socioAnteprima.numeroTessera})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {socioAnteprima.email && (
                    <button
                      type="button"
                      onClick={() => handleInviaEmailSingoloSocio(socioAnteprima)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Invia Email a {socioAnteprima.nome}</span>
                    </button>
                  )}
                  {socioAnteprima.telefono && (
                    <button
                      type="button"
                      onClick={() => handleInviaWhatsAppSingoloSocio(socioAnteprima)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400">
                  <strong className="text-slate-200">A:</strong> {socioAnteprima.email || 'Nessun indirizzo email registrato'}
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-200">Oggetto:</strong>{' '}
                  <span className="text-white font-bold">
                    {compilaTestoPerSocio(oggettoEmail || titoloBacheca, socioAnteprima, false)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-slate-200 whitespace-pre-line leading-relaxed font-sans text-[11.5px]">
                  {compilaTestoPerSocio(corpoMessaggio, socioAnteprima, false)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEZIONE STORICO COMUNICAZIONI & NEWSLETTER INVIATE (SINCRONIZZATE CON BACHECA SOCI & APK) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-700" />
              <span>Registro Storico Comunicazioni, Newsletter & Bacheca Soci ({comunicazioniStorico.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Tutte le comunicazioni elencate qui sono consultabili dai soci sul Portale Web e sull'applicazione Android (.APK) anche offline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['tutte', 'newsletter', 'assemblea', 'avviso', 'evento', 'convenzione', 'giornalino'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFiltroStoricoCategoria(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                  filtroStoricoCategoria === cat
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat === 'tutte' ? 'Tutte' : cat}
              </button>
            ))}
          </div>
        </div>

        {storicoFiltrato.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nessuna comunicazione registrata in questa categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {storicoFiltrato.map(com => (
              <div
                key={com.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {com.categoria}
                      </span>
                      {com.inEvidenza && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          ★ In Evidenza
                        </span>
                      )}
                      {com.inviataViaEmail && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900">
                          ✉️ Inviata via Email
                        </span>
                      )}
                      {com.numeroTesseraRiferimento && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                          Rif: {com.numeroTesseraRiferimento}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {com.dataPubblicazione} {com.oraPubblicazione ? `• ${com.oraPubblicazione}` : ''}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {com.titolo}
                  </h4>
                  {com.oggetto && com.oggetto !== com.titolo && (
                    <p className="text-[11px] font-semibold text-emerald-800">
                      Oggetto: {com.oggetto}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/80">
                    {com.contenuto}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>
                    Mittente: <strong className="text-slate-700">{com.autore}</strong>
                    {com.destinatariCount ? ` • ${com.destinatariCount} destinatari` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoriaMessaggio(com.categoria);
                        setTitoloBacheca(com.titolo);
                        setOggettoEmail(com.oggetto || com.titolo);
                        setCorpoMessaggio(com.contenuto);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-indigo-700 hover:text-indigo-900 font-bold cursor-pointer"
                    >
                      Riutilizza Testo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminaComunicazioneStorico(com.id)}
                      className="text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Elimina</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
