import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { 
  Socio, 
  ProLocoInfo, 
  QuotaAssociativa, 
  ProLocoEvento, 
  ComunicazioneSocio,
  CategoriaComunicazioneSocio,
  IscrizioneEvento,
  EdizioneGiornalino
} from '../types';
import { 
  getStatoQuotaSocio, 
  loadComunicazioniSoci, 
  saveComunicazioniSoci,
  loadSessioneSocioId,
  saveSessioneSocioId,
  saveBloccoPortaleSocio,
  isTesseraSbloccataInSessione,
  setTesseraSbloccataInSessione,
  loadSoci,
  applyUrlPortalSync,
  getPinFromUrlParams,
  fetchDatabaseFromServer,
  buildSyncedMemberPortalUrl,
  loadArchivioGiornalini,
  getServerReachability,
  hasPendingServerSync,
  syncDatabaseToServer
} from '../storage';
import { ReceiptModal } from './ReceiptModal';
import { DigitalCardModal } from './DigitalCardModal';
import { GiornalinoPrintModal } from './GiornalinoPrintModal';
import { 
  User, 
  Lock, 
  LogOut, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  FileText, 
  Bell, 
  Award, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Download, 
  Printer, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  PartyPopper, 
  Search, 
  Filter, 
  ShieldCheck, 
  Info, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Tag, 
  Send,
  Ticket,
  Check,
  Percent,
  Megaphone,
  UserCheck,
  Eye,
  EyeOff,
  Newspaper,
  BookOpen
} from 'lucide-react';

interface MemberPortalViewProps {
  config: ProLocoInfo;
  soci: Socio[];
  eventi: ProLocoEvento[];
  annoSelezionato: number;
  onAggiornaSocio: (socioAggiornato: Socio) => void;
  onAggiornaEvento?: (eventoAggiornato: ProLocoEvento) => void;
  onTornaAlSito: () => void;
  onVaiAlGestionale?: () => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  config,
  soci,
  eventi,
  annoSelezionato,
  onAggiornaSocio,
  onAggiornaEvento,
  onTornaAlSito,
  onVaiAlGestionale
}) => {
  // Sessione Socio Loggato: preserva sempre la tessera aperta in sessione o sbloccata
  const [socioIdAttivo, setSocioIdAttivo] = useState<string | null>(() => {
    const savedSessionId = loadSessioneSocioId();
    if (savedSessionId) {
      return savedSessionId;
    }
    const params = new URLSearchParams(window.location.search);
    const tesseraUrl = params.get('s') || params.get('tessera') || params.get('cf') || params.get('barcode');
    const pinUrl = params.get('pin') || params.get('p') || params.get('pk');
    if (tesseraUrl && (pinUrl || isTesseraSbloccataInSessione(tesseraUrl))) {
      const sociInit = loadSoci();
      const normUrl = tesseraUrl.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const trovato = sociInit.find(
        s => s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === normUrl
      );
      if (trovato) {
        saveSessioneSocioId(trovato.id);
        setTesseraSbloccataInSessione(trovato.numeroTessera);
        return trovato.id;
      }
    }
    return null;
  });
  
  // Campi form login (Numero Tessera precompilato se proviene dal link inviato al socio)
  const [inputIdentificativo, setInputIdentificativo] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('s') || params.get('tessera') || params.get('cf') || params.get('barcode') || '').trim().toUpperCase();
  });
  const [inputPin, setInputPin] = useState<string>('');
  const [mostraPin, setMostraPin] = useState<boolean>(false);
  const [erroreLogin, setErroreLogin] = useState<string | null>(null);
  
  // Tab attiva nel portale del socio
  const [tabAttiva, setTabAttiva] = useState<'anagrafica' | 'tessera' | 'pagamenti' | 'comunicazioni' | 'eventi'>('tessera');
  
  // Comunicazioni dedicate
  const [comunicazioni, setComunicazioni] = useState<ComunicazioneSocio[]>(() => loadComunicazioniSoci());
  const [filtroCategoriaCom, setFiltroCategoriaCom] = useState<string>('tutte');
  const [mostraModaleNuovaCom, setMostraModaleNuovaCom] = useState<boolean>(false);
  
  // Modali ricevuta, tessera e lettura uscita giornalino
  const [ricevutaSelezionata, setRicevutaSelezionata] = useState<{ socio: Socio; quota: QuotaAssociativa } | null>(null);
  const [mostraModalTesseraDigitale, setMostraModalTesseraDigitale] = useState<boolean>(false);
  const [giornalinoDaLeggere, setGiornalinoDaLeggere] = useState<EdizioneGiornalino | null>(null);
  
  // Modifica rapida recapiti
  const [inModificaRecapiti, setInModificaRecapiti] = useState<boolean>(false);
  const [telefonoModifica, setTelefonoModifica] = useState<string>('');
  const [emailModifica, setEmailModifica] = useState<string>('');
  const [indirizzoModifica, setIndirizzoModifica] = useState<string>('');
  const [salvataggioNotifica, setSalvataggioNotifica] = useState<boolean>(false);

  // QR Code data URL per la tessera rapida
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [serverOnline, setServerOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  );
  const [inCodaSync, setInCodaSync] = useState<boolean>(() => hasPendingServerSync());
  const ultimoSocioAttivoRef = useRef<Socio | null>(null);

  // Trova il socio attivo (cercando per ID, per Numero Tessera sbloccata o dai parametri URL sincronizzati)
  // Mantiene sempre il riferimento in memoria (ultimoSocioAttivoRef) così la tessera aperta non si chiude mai durante il polling
  const socioAttivo = useMemo(() => {
    if (!socioIdAttivo) {
      ultimoSocioAttivoRef.current = null;
      return null;
    }

    const sociStorage = loadSoci();
    const tuttiSoci: Socio[] = [...soci];
    sociStorage.forEach(s => {
      if (!tuttiSoci.some(e => e.id === s.id || e.numeroTessera.trim().toUpperCase() === s.numeroTessera.trim().toUpperCase())) {
        tuttiSoci.push(s);
      }
    });

    const perId = tuttiSoci.find(s => s.id === socioIdAttivo);
    if (perId) {
      ultimoSocioAttivoRef.current = perId;
      return perId;
    }

    // Se l'ID era sintetico (es. socio-url-PL-2026-001) o è cambiato dopo la sincronizzazione locale/server, cerca per numero tessera
    const tesseraDaId = socioIdAttivo.startsWith('socio-url-')
      ? socioIdAttivo.replace(/^socio-url-/i, '').trim().toUpperCase()
      : '';
    if (tesseraDaId) {
      const perTesseraId = tuttiSoci.find(
        s =>
          s.numeroTessera.trim().toUpperCase() === tesseraDaId ||
          s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === tesseraDaId.replace(/[^A-Z0-9]/g, '')
      );
      if (perTesseraId) {
        ultimoSocioAttivoRef.current = perTesseraId;
        return perTesseraId;
      }
    }

    // Se avevamo già la tessera aperta in questa sessione, cerca per numeroTessera dell'ultimo socio attivo
    if (ultimoSocioAttivoRef.current) {
      const normPrev = ultimoSocioAttivoRef.current.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const aggiornato = tuttiSoci.find(
        s => s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === normPrev
      );
      if (aggiornato) {
        ultimoSocioAttivoRef.current = aggiornato;
        return aggiornato;
      }
      return ultimoSocioAttivoRef.current;
    }

    // Fallback: controlla URL o sessione sbloccata
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tesseraUrl = (params.get('s') || params.get('tessera') || '').trim().toUpperCase();
      if (tesseraUrl) {
        const perTesseraUrl = tuttiSoci.find(
          s =>
            s.numeroTessera.trim().toUpperCase() === tesseraUrl ||
            s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === tesseraUrl.replace(/[^A-Z0-9]/g, '')
        );
        if (perTesseraUrl) {
          ultimoSocioAttivoRef.current = perTesseraUrl;
          return perTesseraUrl;
        }
      }
      const urlSync = applyUrlPortalSync();
      if (urlSync.socioSincronizzato) {
        ultimoSocioAttivoRef.current = urlSync.socioSincronizzato;
        return urlSync.socioSincronizzato;
      }
    }

    return ultimoSocioAttivoRef.current;
  }, [socioIdAttivo, soci]);

  // Sincronizzazione automatica continua con backoff esponenziale (5s, 10s, 30s) in caso di server spento/in riavvio e riallineamento automatico
  useEffect(() => {
    let mounted = true;
    let retryAttempt = 0;
    const backoffStepsMs = [5000, 10000, 30000];
    let syncTimerId: number | null = null;
    let sse: EventSource | null = null;

    const aggiornaComunicazioni = () => {
      if (!mounted) return;
      const nuoveCom = loadComunicazioniSoci();
      setComunicazioni(prev => (JSON.stringify(prev) === JSON.stringify(nuoveCom) ? prev : nuoveCom));
    };

    const scheduleNextCycle = (wasReachable: boolean) => {
      if (!mounted) return;
      if (syncTimerId !== null) {
        window.clearTimeout(syncTimerId);
        syncTimerId = null;
      }
      let delayMs = 3000;
      if (wasReachable) {
        retryAttempt = 0;
        delayMs = 3000;
      } else {
        const idx = Math.min(retryAttempt, backoffStepsMs.length - 1);
        delayMs = backoffStepsMs[idx];
        retryAttempt++;
      }
      syncTimerId = window.setTimeout(() => {
        syncCycle();
      }, delayMs);
    };

    const connectSse = () => {
      if (!mounted || typeof EventSource === 'undefined') return;
      if (sse && sse.readyState !== EventSource.CLOSED) return;
      try {
        sse = new EventSource('/api/v2/stream');
        sse.onmessage = ev => {
          try {
            const payload = JSON.parse(ev.data || '{}');
            if (payload && (payload.type === 'db_update' || payload.type === 'connected')) {
              retryAttempt = 0;
              syncCycle();
            }
          } catch {
            // ignore
          }
        };
        sse.onerror = () => {
          try {
            sse?.close();
          } catch {
            // ignore
          }
          sse = null;
        };
      } catch {
        // ignore
      }
    };

    applyUrlPortalSync();
    aggiornaComunicazioni();

    const syncCycle = () => {
      if (!mounted) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setServerOnline(false);
        setInCodaSync(hasPendingServerSync());
        scheduleNextCycle(false);
        return;
      }
      fetchDatabaseFromServer().then(db => {
        if (!mounted) return;
        const reachable = getServerReachability();
        setServerOnline(reachable);
        setInCodaSync(hasPendingServerSync());
        if (db && db.azzerato !== true) {
          applyUrlPortalSync();
        }
        aggiornaComunicazioni();
        if (reachable) {
          connectSse();
        }
        scheduleNextCycle(reachable);
      });
    };

    syncCycle();
    connectSse();

    const handleOnlineOrFocus = () => {
      retryAttempt = 0;
      if (hasPendingServerSync()) {
        syncDatabaseToServer();
      }
      syncCycle();
    };
    const handleOffline = () => {
      setServerOnline(false);
      setInCodaSync(hasPendingServerSync());
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleOnlineOrFocus();
      }
    };

    window.addEventListener('storage', aggiornaComunicazioni);
    window.addEventListener('online', handleOnlineOrFocus);
    window.addEventListener('focus', handleOnlineOrFocus);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      mounted = false;
      if (syncTimerId !== null) {
        window.clearTimeout(syncTimerId);
      }
      if (sse) {
        try {
          sse.close();
        } catch {
          // ignore
        }
      }
      window.removeEventListener('storage', aggiornaComunicazioni);
      window.removeEventListener('online', handleOnlineOrFocus);
      window.removeEventListener('focus', handleOnlineOrFocus);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Genera QR code se socio loggato (con link diretto blindato e sincronizzato al portale socio)
  useEffect(() => {
    if (!socioAttivo) return;
    let cancelled = false;
    const linkBlindato = buildSyncedMemberPortalUrl(socioAttivo, config, annoSelezionato, true);
    QRCode.toDataURL(linkBlindato, {
      width: 180,
      margin: 1,
      color: { dark: '#064e3b', light: '#ffffff' }
    })
      .then(url => {
        if (!cancelled) setQrCodeDataUrl(url);
      })
      .catch(err => console.error('Errore generazione QR:', err));
    return () => {
      cancelled = true;
    };
  }, [socioAttivo?.id, socioAttivo?.numeroTessera, socioAttivo?.pin, config.nome, annoSelezionato]);

  // Blocco permanente sul Portale Web dei Soci senza cronologia di navigazione indietro né ritorno alla dashboard
  useEffect(() => {
    saveBloccoPortaleSocio(true);
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('area_soci')) {
        params.set('area_soci', '1');
        params.set('blocco_socio', '1');
      }
      const lockedUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ portaleSociBloccato: true }, document.title, lockedUrl);
      window.history.pushState({ portaleSociBloccato: true }, document.title, lockedUrl);

      const handlePopState = () => {
        try {
          window.history.pushState({ portaleSociBloccato: true }, document.title, window.location.href);
        } catch {
          // ignore
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } catch {
      return undefined;
    }
  }, []);

  // Prepara campi per modifica recapiti
  useEffect(() => {
    if (socioAttivo) {
      setTelefonoModifica(socioAttivo.telefono || '');
      setEmailModifica(socioAttivo.email || '');
      setIndirizzoModifica(socioAttivo.indirizzo || '');
    }
  }, [socioAttivo]);

  // Funzione universale per interpretare codice tessera, CF, URL o JSON letto da lettore Barcode / QR / Link Email
  const trovaSocioDaCodiceOBarcode = (rawInput: string): Socio | undefined => {
    const pulito = rawInput.trim();
    if (!pulito) return undefined;

    // Sincronizza sempre eventuali parametri presenti nell'URL corrente dell'invito email
    const currentUrlSync = applyUrlPortalSync();

    // Se l'input stesso contiene il payload sync_socio o pk, applicalo subito
    if (pulito.includes('sync_socio=') || pulito.includes('pk=')) {
      const syncRes = applyUrlPortalSync(pulito);
      if (syncRes.socioSincronizzato) {
        return syncRes.socioSincronizzato;
      }
    }

    // Combina i soci dal database locale aggiornato, dal link sincronizzato e dallo stato React
    const sociFreschi = loadSoci();
    const elencoSoci: Socio[] = [];
    if (currentUrlSync.socioSincronizzato) {
      elencoSoci.push(currentUrlSync.socioSincronizzato);
    }
    sociFreschi.forEach(s => {
      if (!elencoSoci.some(e => e.id === s.id || e.numeroTessera.trim().toUpperCase() === s.numeroTessera.trim().toUpperCase())) {
        elencoSoci.push(s);
      }
    });
    soci.forEach(s => {
      if (!elencoSoci.some(e => e.id === s.id || e.numeroTessera.trim().toUpperCase() === s.numeroTessera.trim().toUpperCase())) {
        elencoSoci.push(s);
      }
    });

    // 1. Se il barcode/QR contiene un URL con ?s=... o ?tessera=... o ?cf=...
    if (pulito.includes('s=') || pulito.includes('tessera=') || pulito.includes('cf=')) {
      try {
        const queryPart = pulito.includes('?') ? pulito.split('?')[1] : pulito;
        const p = new URLSearchParams(queryPart);
        const t = p.get('s') || p.get('tessera') || p.get('cf');
        if (t) {
          const upperT = t.trim().toUpperCase();
          const matchUrl = elencoSoci.find(
            s =>
              s.numeroTessera.trim().toUpperCase() === upperT ||
              s.codiceFiscale.trim().toUpperCase() === upperT
          );
          if (matchUrl) return matchUrl;
        }
      } catch {
        // fallback
      }
    }

    // 2. Se il barcode/QR contiene un payload JSON {"tessera":"..."}
    if (pulito.startsWith('{') && pulito.endsWith('}')) {
      try {
        const parsed = JSON.parse(pulito);
        const t = (parsed.tessera || parsed.cf || '').toString().trim().toUpperCase();
        if (t) {
          const matchJson = elencoSoci.find(
            s =>
              s.numeroTessera.trim().toUpperCase() === t ||
              s.codiceFiscale.trim().toUpperCase() === t
          );
          if (matchJson) return matchJson;
        }
      } catch {
        // fallback
      }
    }

    // 3. Ricerca diretta per Numero Tessera (anche normalizzato senza trattini/spazi), Codice Fiscale o Email
    const query = pulito.toUpperCase();
    const queryNorm = query.replace(/[^A-Z0-9]/g, '');
    return elencoSoci.find(
      s =>
        s.numeroTessera.trim().toUpperCase() === query ||
        (queryNorm.length > 0 && s.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === queryNorm) ||
        (s.codiceFiscale && s.codiceFiscale.trim().toUpperCase() === query) ||
        (s.email && s.email.trim().toUpperCase() === query)
    );
  };

  // Controllo parametri URL per associazione Numero Tessera dal link inviato al socio e verifica combinazione col PIN
  useEffect(() => {
    // Se il socio ha già sbloccato e aperto la tessera, non rieseguire mai il controllo né chiudere la sessione
    if (socioIdAttivo || ultimoSocioAttivoRef.current) {
      return;
    }

    const urlSync = applyUrlPortalSync();
    const params = new URLSearchParams(window.location.search);
    const tesseraUrl =
      params.get('s') ||
      params.get('tessera') ||
      params.get('cf') ||
      params.get('barcode') ||
      urlSync.socioSincronizzato?.numeroTessera;
    const pinEsplicitoUrl = params.get('pin') || params.get('p');

    if (tesseraUrl) {
      const trovato = urlSync.socioSincronizzato || trovaSocioDaCodiceOBarcode(tesseraUrl);
      if (trovato) {
        setInputIdentificativo(prev => prev || trovato.numeroTessera);
        if (pinEsplicitoUrl) {
          const pinAtteso = (trovato.pin || getPinFromUrlParams() || '1234').trim();
          if (pinEsplicitoUrl.trim().toUpperCase() === pinAtteso.toUpperCase()) {
            ultimoSocioAttivoRef.current = trovato;
            setSocioIdAttivo(trovato.id);
            saveSessioneSocioId(trovato.id);
            setTesseraSbloccataInSessione(trovato.numeroTessera);
            saveBloccoPortaleSocio(true);
            setErroreLogin(null);
          } else {
            setSocioIdAttivo(null);
            saveSessioneSocioId(null);
            setTesseraSbloccataInSessione(null);
            setErroreLogin('Errore di sblocco: il Numero della Tessera e il PIN non corrispondono. Verifica il PIN e riprova.');
          }
        }
      } else {
        setInputIdentificativo(prev => prev || tesseraUrl.trim().toUpperCase());
      }
    }
  }, [soci, socioIdAttivo]);

  // Gestione Sblocco Area Riservata Soci: verifica combinazione tra Numero Tessera e PIN personale registrato in Anagrafe o nell'invito Email
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErroreLogin(null);

    const query = inputIdentificativo.trim();
    const pinInserito = inputPin.trim();

    if (!query) {
      setErroreLogin('Inserisci il Numero della Tessera associato al tuo profilo socio.');
      return;
    }

    if (!pinInserito) {
      setErroreLogin('Inserisci il PIN personale per sbloccare l\'Area Riservata Soci associata al numero della tessera.');
      return;
    }

    const verificaCredenziali = (): Socio | null => {
      const urlSync = applyUrlPortalSync();
      const trovato = trovaSocioDaCodiceOBarcode(query);
      if (!trovato) return null;

      const pinsValidi = new Set<string>();
      if (trovato.pin && trovato.pin.trim()) {
        pinsValidi.add(trovato.pin.trim().toUpperCase());
      } else {
        pinsValidi.add('1234');
      }

      // Aggiunge eventuale PIN sincronizzato nel link di invito email per questa tessera
      if (
        urlSync.socioSincronizzato &&
        urlSync.socioSincronizzato.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ===
          trovato.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() &&
        urlSync.socioSincronizzato.pin
      ) {
        pinsValidi.add(urlSync.socioSincronizzato.pin.trim().toUpperCase());
      }

      const params = new URLSearchParams(window.location.search);
      const tesseraInUrl = (params.get('s') || params.get('tessera') || '').trim().toUpperCase();
      const pinDaUrl = getPinFromUrlParams();
      if (
        pinDaUrl &&
        (!tesseraInUrl ||
          tesseraInUrl.replace(/[^A-Z0-9]/g, '') === trovato.numeroTessera.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
      ) {
        pinsValidi.add(pinDaUrl.trim().toUpperCase());
      }

      // Controlla anche nel database locale aggiornato
      const daStorage = loadSoci().find(
        s => s.numeroTessera.trim().toUpperCase() === trovato.numeroTessera.trim().toUpperCase()
      );
      if (daStorage?.pin && daStorage.pin.trim()) {
        pinsValidi.add(daStorage.pin.trim().toUpperCase());
      }

      if (pinsValidi.has(pinInserito.toUpperCase())) {
        return daStorage || trovato;
      }
      return null;
    };

    let socioAutenticato = verificaCredenziali();

    // Se non trovato o PIN aggiornato di recente sul gestionale, sincronizza dal database server e riprova
    if (!socioAutenticato) {
      await fetchDatabaseFromServer();
      socioAutenticato = verificaCredenziali();
    }

    if (!socioAutenticato) {
      setErroreLogin('Accesso negato: il Numero della Tessera e il PIN inseriti non corrispondono. Verifica il PIN ricevuto nell\'invito email e riprova.');
      return;
    }

    // Combinazione Numero Tessera + PIN verificata con successo: sblocca l'Area Riservata Soci
    ultimoSocioAttivoRef.current = socioAutenticato;
    setSocioIdAttivo(socioAutenticato.id);
    saveSessioneSocioId(socioAutenticato.id);
    setTesseraSbloccataInSessione(socioAutenticato.numeroTessera);
    saveBloccoPortaleSocio(true);
    setInputPin('');
  };

  // Login Rapido Demo (1-Click)
  const handleLoginRapido = (socioTarget: Socio) => {
    ultimoSocioAttivoRef.current = socioTarget;
    setSocioIdAttivo(socioTarget.id);
    saveSessioneSocioId(socioTarget.id);
    setTesseraSbloccataInSessione(socioTarget.numeroTessera);
    setErroreLogin(null);
  };

  // Logout
  const handleLogout = () => {
    ultimoSocioAttivoRef.current = null;
    setSocioIdAttivo(null);
    saveSessioneSocioId(null);
    setTesseraSbloccataInSessione(null);
    setInModificaRecapiti(false);
  };

  // Salvataggio aggiornamento recapiti
  const handleSalvaRecapiti = () => {
    if (!socioAttivo) return;
    const aggiornato: Socio = {
      ...socioAttivo,
      telefono: telefonoModifica.trim(),
      email: emailModifica.trim(),
      indirizzo: indirizzoModifica.trim()
    };
    onAggiornaSocio(aggiornato);
    setInModificaRecapiti(false);
    setSalvataggioNotifica(true);
    setTimeout(() => setSalvataggioNotifica(false), 2500);
  };

  // Calcolo stato quota e scadenza
  const statoQuota = socioAttivo ? getStatoQuotaSocio(socioAttivo, annoSelezionato) : 'da_rinnovare';
  
  // Data di scadenza ufficiale
  const dataScadenzaCalcolata = useMemo(() => {
    if (!socioAttivo) return '31 Dicembre 2026';
    const quotaAnno = socioAttivo.quote?.find(q => q.anno === annoSelezionato);
    if (quotaAnno && quotaAnno.dataScadenza) {
      return new Date(quotaAnno.dataScadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    return `31 Dicembre ${annoSelezionato}`;
  }, [socioAttivo, annoSelezionato]);

  // Cronologia pagamenti ordinata per data discendente
  const cronologiaPagamenti = useMemo(() => {
    if (!socioAttivo || !socioAttivo.quote) return [];
    return [...socioAttivo.quote].sort((a, b) => {
      const dateA = a.dataPagamento ? new Date(a.dataPagamento).getTime() : 0;
      const dateB = b.dataPagamento ? new Date(b.dataPagamento).getTime() : 0;
      return dateB - dateA;
    });
  }, [socioAttivo]);

  const totaleVersatoStoria = useMemo(() => {
    return cronologiaPagamenti.reduce((acc, q) => acc + (Number(q.importo) || 0), 0);
  }, [cronologiaPagamenti]);

  // Comunicazioni dedicate al socio (filtrate per Numero Tessera del socio loggato o generali)
  const comunicazioniDelSocio = useMemo(() => {
    const tesseraSocio = (socioAttivo?.numeroTessera || '').trim().toUpperCase();
    const normSocio = tesseraSocio.replace(/[^A-Z0-9]/g, '');

    return comunicazioni.filter(c => {
      if (!c.numeroTesseraRiferimento || c.numeroTesseraRiferimento === 'TUTTI') {
        return true;
      }
      if (!tesseraSocio) return true;
      const rifUpper = c.numeroTesseraRiferimento.trim().toUpperCase();
      const rifNorm = rifUpper.replace(/[^A-Z0-9]/g, '');
      return rifUpper === tesseraSocio || (normSocio.length > 0 && rifNorm === normSocio);
    });
  }, [comunicazioni, socioAttivo?.numeroTessera]);

  const comunicazioniFiltrate = useMemo(() => {
    if (filtroCategoriaCom === 'tutte') return comunicazioniDelSocio;
    return comunicazioniDelSocio.filter(c => c.categoria === filtroCategoriaCom);
  }, [comunicazioniDelSocio, filtroCategoriaCom]);

  // Iscrizione rapida a un evento per il socio loggato
  const handleIscrizioneEventoRapida = (evento: ProLocoEvento) => {
    if (!socioAttivo || !onAggiornaEvento) return;

    const giaIscritto = evento.iscrizioni?.some(i => i.socioId === socioAttivo.id);
    if (giaIscritto) {
      alert('Sei già iscritto a questo evento!');
      return;
    }

    const nuovaIscrizione: IscrizioneEvento = {
      id: `iscr-${evento.id}-${socioAttivo.id}-${Date.now()}`,
      socioId: socioAttivo.id,
      dataIscrizione: new Date().toISOString().split('T')[0],
      oraIscrizione: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      ruolo: 'partecipante',
      statoPresenza: 'da_verificare',
      quotaVersata: evento.quotaIscrizioneSocio || 0,
      note: `Iscrizione autonoma effettuata da ${socioAttivo.nome} ${socioAttivo.cognome} tramite Portale Soci`
    };

    const eventoAggiornato: ProLocoEvento = {
      ...evento,
      iscrizioni: [...(evento.iscrizioni || []), nuovaIscrizione]
    };

    onAggiornaEvento(eventoAggiornato);
    alert(`Iscrizione confermata con successo per "${evento.titolo}"! Ti aspettiamo al desk accoglienza.`);
  };

  // Creazione nuova comunicazione da parte di un membro direttivo
  const [nuovaComForm, setNuovaComForm] = useState({
    titolo: '',
    oggetto: '',
    categoria: 'avviso' as CategoriaComunicazioneSocio,
    contenuto: '',
    inEvidenza: true
  });

  const handleSalvaNuovaComunicazione = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovaComForm.titolo || !nuovaComForm.contenuto) {
      alert('Compila il titolo e il testo della comunicazione.');
      return;
    }

    const nuova: ComunicazioneSocio = {
      id: `com-${Date.now()}`,
      titolo: nuovaComForm.titolo,
      oggetto: nuovaComForm.oggetto || undefined,
      categoria: nuovaComForm.categoria,
      dataPubblicazione: new Date().toISOString().split('T')[0],
      oraPubblicazione: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      autore: socioAttivo?.nome ? `${socioAttivo.nome} ${socioAttivo.cognome} (${socioAttivo.ruoloDirettivo || 'Direttivo'})` : 'Consiglio Direttivo',
      contenuto: nuovaComForm.contenuto,
      inEvidenza: nuovaComForm.inEvidenza,
      destinatari: 'tutti'
    };

    const listaAggiornata = [nuova, ...comunicazioni];
    setComunicazioni(listaAggiornata);
    saveComunicazioniSoci(listaAggiornata);
    setMostraModaleNuovaCom(false);
    setNuovaComForm({
      titolo: '',
      oggetto: '',
      categoria: 'avviso',
      contenuto: '',
      inEvidenza: true
    });
  };

  // Se nessun socio è loggato, mostra la schermata di Autenticazione / Login
  if (!socioAttivo) {
    return (
      <div className="min-h-screen bg-[#f6f4ee] text-stone-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        
        {/* Header di navigazione blindato (nessun tasto per tornare indietro) */}
        <header className="bg-[#fdfcf9]/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-stone-900 tracking-tight leading-none">
                  {config.nome}
                </h1>
                <span className="text-[11px] text-stone-500 font-medium">Portale Web Ufficiale del Socio</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono font-extrabold text-emerald-950 bg-emerald-100/90 border border-emerald-300 rounded-xl select-none"
                title="Versione aggiornamento applicazione"
              >
                <span>v2.0.0</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl select-none">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Area Riservata Soci</span>
              </div>
            </div>
          </div>
        </header>

        {/* Corpo Centrale di Login */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col items-center justify-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_-6px_rgba(45,38,30,0.06)] p-6 sm:p-8"
          >
            {/* Intestazione dello Sblocco Area Riservata Soci */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center mx-auto shadow-sm ring-4 ring-emerald-50">
                <KeyRound className="w-7 h-7 text-emerald-100" />
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Sblocco Area Riservata Soci
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                Per sbloccare l&apos;area riservata inviata tramite link, verifica il tuo <strong>Numero Tessera</strong> e inserisci il <strong>PIN personale</strong> abbinato in anagrafe.
              </p>
            </div>

            {/* Messaggio Errore se Numero Tessera e PIN non si combinano */}
            {erroreLogin && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{erroreLogin}</span>
              </div>
            )}

            {/* Form di Sblocco Area Riservata (Numero Tessera + PIN) */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    Numero della Tessera Socio *
                  </label>
                  {inputIdentificativo && (
                    <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Associato dal link
                    </span>
                  )}
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoFocus={!inputIdentificativo}
                    value={inputIdentificativo}
                    onChange={(e) => setInputIdentificativo(e.target.value.toUpperCase())}
                    placeholder="Es. PL-2025-001 (o scansiona Barcode)"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                  />
                </div>
                <span className="text-[10.5px] text-stone-400 mt-1 block">
                  Numero tessera associato al link personale o letto da Barcode / QR Code.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    PIN di Sblocco Area Riservata *
                  </label>
                  <span className="text-[10.5px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Obbligatorio
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={mostraPin ? 'text' : 'password'}
                    required
                    autoFocus={Boolean(inputIdentificativo)}
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    placeholder="Inserisci il PIN ricevuto nell'email"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setMostraPin(!mostraPin)}
                    title={mostraPin ? 'Nascondi PIN' : 'Mostra PIN'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                  >
                    {mostraPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10.5px] text-stone-400 mt-1 block">
                  L&apos;accesso viene concesso solo se Numero Tessera e PIN corrispondono.
                </span>
              </div>

              <button
                type="submit"
                id="btn-login-socio"
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sblocca e Accedi all&apos;Area Riservata</span>
              </button>
            </form>

            {/* Recapiti assistenza segreteria */}
            <div className="mt-6 pt-4 border-t border-stone-100 text-center text-[11px] text-stone-500 space-y-1">
              <p>Problemi ad accedere con la tua tessera?</p>
              <p className="font-semibold text-stone-700">
                Contatta la Segreteria: {config.telefono || '333 1234567'} • {config.email || 'info@proloco.it'}
              </p>
            </div>

          </motion.div>

        </main>

      </div>
    );
  }

  // Socio Loggato: Dashboard Personale Blindata (Nessuna possibilità di tornare indietro)
  return (
    <div className="min-h-screen bg-[#f6f4ee] text-stone-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. HEADER PERSONALE DEL SOCIO (BLINDATO - SENZA TASTI INDIETRO O USCITA AL GESTIONALE) */}
      <header className="bg-[#fdfcf9]/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 shadow-2xs no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center font-extrabold text-sm shadow-xs ring-1 ring-emerald-600/20">
                {socioAttivo.foto ? (
                  <img src={socioAttivo.foto} alt="Socio" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span>{socioAttivo.nome.charAt(0)}{socioAttivo.cognome.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold text-stone-900 tracking-tight leading-none">
                    {socioAttivo.nome} {socioAttivo.cognome}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                    statoQuota === 'in_regola'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : statoQuota === 'da_rinnovare'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {statoQuota === 'in_regola' ? 'Tessera Attiva' : statoQuota === 'da_rinnovare' ? 'Da Rinnovare' : 'Scaduta'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-stone-700">{socioAttivo.numeroTessera}</span>
                  <span>•</span>
                  <span>{socioAttivo.categoria}</span>
                  {socioAttivo.ruoloDirettivo !== 'Nessuno' && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-emerald-800">{socioAttivo.ruoloDirettivo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => {
                syncDatabaseToServer();
                fetchDatabaseFromServer();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                serverOnline
                  ? 'text-emerald-900 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  : 'text-amber-900 bg-amber-50 border-amber-300 hover:bg-amber-100'
              }`}
              title={
                serverOnline
                  ? 'Server acceso: scambio dati in tempo reale attivo'
                  : 'Server spento: consultazione offline attiva. I dati verranno scambiati appena il server sarà acceso.'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>
                {serverOnline
                  ? 'Server Acceso (Sincronizzato)'
                  : inCodaSync
                  ? 'Server Spento • Consultabile (Modifiche in coda)'
                  : 'Server Spento • Consultabile Offline'}
              </span>
            </button>
            <div
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono font-extrabold text-emerald-950 bg-emerald-100/90 border border-emerald-300 rounded-xl select-none"
              title="Versione aggiornamento applicazione"
            >
              <span>v2.0.0</span>
            </div>
            <div
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl select-none"
              title="Accesso personale protetto tramite Tessera e PIN"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Area Socio Protetta • {config.nome}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition cursor-pointer shadow-2xs"
              title="Chiudi sessione socio o cambia numero tessera"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-600" />
              <span>Cambia Socio / Esci</span>
            </button>
          </div>

        </div>

        {/* Schede di Navigazione del Portale del Socio */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setTabAttiva('tessera')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition shrink-0 cursor-pointer ${
              tabAttiva === 'tessera'
                ? 'border-emerald-700 text-emerald-900 bg-emerald-50/80 rounded-t-xl font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-t-xl'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tessera & Stato Validità</span>
          </button>

          <button
            onClick={() => setTabAttiva('anagrafica')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition shrink-0 cursor-pointer ${
              tabAttiva === 'anagrafica'
                ? 'border-emerald-700 text-emerald-900 bg-emerald-50/80 rounded-t-xl font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-t-xl'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dati Anagrafici</span>
          </button>

          <button
            onClick={() => setTabAttiva('pagamenti')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition shrink-0 cursor-pointer ${
              tabAttiva === 'pagamenti'
                ? 'border-emerald-700 text-emerald-900 bg-emerald-50/80 rounded-t-xl font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-t-xl'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Cronologia Quote & Ricevute</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
              {cronologiaPagamenti.length}
            </span>
          </button>

          <button
            onClick={() => setTabAttiva('comunicazioni')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition shrink-0 cursor-pointer ${
              tabAttiva === 'comunicazioni'
                ? 'border-emerald-700 text-emerald-900 bg-emerald-50/80 rounded-t-xl font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-t-xl'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Comunicazioni Dedicate</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
              {comunicazioniDelSocio.length}
            </span>
          </button>

          <button
            onClick={() => setTabAttiva('eventi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition shrink-0 cursor-pointer ${
              tabAttiva === 'eventi'
                ? 'border-emerald-700 text-emerald-900 bg-emerald-50/80 rounded-t-xl font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50 rounded-t-xl'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            <span>Eventi & Partecipazione</span>
          </button>
        </div>
      </header>

      {/* 2. CORPO PRINCIPALE DEI CONTENUTI */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={tabAttiva}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            
            {/* ======================================================== */}
            {/* TAB 1: TESSERA & STATO VALIDITÀ */}
            {/* ======================================================== */}
            {tabAttiva === 'tessera' && (
              <div className="space-y-6">
                
                {/* Banner di Sintesi Stato Quota */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Stato del Tesseramento
                    </span>
                    <div className="flex items-center gap-2 pt-1">
                      {statoQuota === 'in_regola' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-xl font-extrabold text-emerald-800">In Regola</span>
                        </>
                      ) : statoQuota === 'da_rinnovare' ? (
                        <>
                          <Clock className="w-5 h-5 text-amber-600" />
                          <span className="text-xl font-extrabold text-amber-700">Da Rinnovare</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                          <span className="text-xl font-extrabold text-rose-700">Scaduta</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">
                      Anno Sociale di Competenza: <strong>{annoSelezionato}</strong>
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Data di Scadenza Ufficiale
                    </span>
                    <div className="flex items-center gap-2 pt-1">
                      <Calendar className="w-5 h-5 text-stone-600" />
                      <span className="text-xl font-extrabold text-stone-900">{dataScadenzaCalcolata}</span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Include la proroga statutaria per l'assemblea generale.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Fedeltà Associativa
                    </span>
                    <div className="flex items-center gap-2 pt-1">
                      <Award className="w-5 h-5 text-amber-600" />
                      <span className="text-xl font-extrabold text-stone-900">{cronologiaPagamenti.length} Anni</span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Socio iscritto dal <strong>{new Date(socioAttivo.dataIscrizione).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </p>
                  </div>

                </div>

                {/* Render Tessera Digitale Fronte con Azioni */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
                  
                  {/* Anteprima Visiva della Tessera Digitale (Card Grafica) */}
                  <div className="w-full max-w-md bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden shrink-0">
                    <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/20">
                          <Building2 className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black tracking-tight text-white uppercase">{config.nome}</h3>
                          <p className="text-[10px] text-emerald-200/80 font-medium">Tessera Ufficiale Socio • Anno {annoSelezionato}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 uppercase">
                        UNPLI CTS
                      </span>
                    </div>

                    {/* Dati del Socio al Centro */}
                    <div className="my-6 space-y-1 relative z-10">
                      <span className="text-[10.5px] uppercase tracking-wider text-emerald-300/80 font-semibold block">
                        Intestatario della Tessera
                      </span>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        {socioAttivo.nome} {socioAttivo.cognome}
                      </h2>
                      <p className="text-xs font-mono text-emerald-100/90 font-medium">
                        C.F. {socioAttivo.codiceFiscale}
                      </p>
                    </div>

                    {/* Riga Inferiore con QR Code e Dettagli */}
                    <div className="flex items-end justify-between pt-2 border-t border-emerald-700/50 relative z-10">
                      <div className="space-y-0.5">
                        <span className="text-[9.5px] text-emerald-300/70 uppercase font-bold block">Numero Tessera</span>
                        <span className="text-sm font-mono font-extrabold text-white tracking-wider block">
                          {socioAttivo.numeroTessera}
                        </span>
                        <span className="text-[10px] text-emerald-200/80 block">
                          {socioAttivo.categoria} {socioAttivo.ruoloDirettivo !== 'Nessuno' ? `• ${socioAttivo.ruoloDirettivo}` : ''}
                        </span>
                      </div>

                      {qrCodeDataUrl && (
                        <div className="bg-white p-1 rounded-xl shadow-xs shrink-0">
                          <img src={qrCodeDataUrl} alt="QR Code Tessera" className="w-16 h-16 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informazioni e Azioni sulla Tessera */}
                  <div className="flex-1 space-y-4 max-w-lg">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block">
                        Certificato di Tesseramento Digitale
                      </span>
                      <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                        La tua tessera sempre a portata di mano
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Esibisci questa tessera dallo smartphone per accedere agli sconti nelle convenzioni locali, votare durante le assemblee ordinarie e straordinarie e confermare la tua presenza agli eventi sociali.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button
                        type="button"
                        id="btn-apri-modale-tessera"
                        onClick={() => setMostraModalTesseraDigitale(true)}
                        className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Visualizza Tessera Fronte / Retro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMostraModalTesseraDigitale(true)}
                        className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Stampa / Salva PDF</span>
                      </button>
                    </div>

                    {/* Avviso in caso di quota da rinnovare */}
                    {statoQuota !== 'in_regola' && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-700" />
                          <span>Rinnovo della Quota Sociale {annoSelezionato}</span>
                        </p>
                        <p className="text-[11.5px] leading-relaxed">
                          La quota per l'anno sociale {annoSelezionato} per la categoria <strong>{socioAttivo.categoria}</strong> è di <strong>{config.quotaStandardOrdinario || 15} €</strong>. Puoi versarla direttamente tramite Bonifico Bancario ({config.iban ? `IBAN: ${config.iban}` : 'coordinate disponibili in segreteria'}) o presso il desk accoglienza della sede.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: DATI ANAGRAFICI */}
            {/* ======================================================== */}
            {tabAttiva === 'anagrafica' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
                      Scheda Anagrafica del Socio
                    </h2>
                    <p className="text-xs text-stone-500">
                      Dati ufficiali registrati nell'Albo dei Soci della Pro Loco conformemente al Regolamento Generale e al CTS.
                    </p>
                  </div>

                  <div>
                    {!inModificaRecapiti ? (
                      <button
                        type="button"
                        onClick={() => setInModificaRecapiti(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Aggiorna Recapiti (Telefono / Email)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInModificaRecapiti(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={handleSalvaRecapiti}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salva Modifiche</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {salvataggioNotifica && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>I tuoi recapiti sono stati aggiornati con successo nel registro soci!</span>
                  </div>
                )}

                {/* Griglia Dati Anagrafici */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  
                  {/* 1. Dati Personali */}
                  <div className="space-y-4 bg-stone-50/60 p-5 rounded-2xl border border-stone-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block border-b border-stone-200/60 pb-1">
                      Identità & Nascita
                    </span>
                    
                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Nome e Cognome</span>
                      <strong className="text-sm text-stone-900">{socioAttivo.nome} {socioAttivo.cognome}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Codice Fiscale</span>
                      <strong className="font-mono text-stone-900 font-bold">{socioAttivo.codiceFiscale}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Data e Luogo di Nascita</span>
                      <span className="text-stone-800 font-medium">
                        {socioAttivo.dataNascita ? new Date(socioAttivo.dataNascita).toLocaleDateString('it-IT') : '-'} a {socioAttivo.luogoNascita || '-'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Recapiti & Residenza */}
                  <div className="space-y-4 bg-stone-50/60 p-5 rounded-2xl border border-stone-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block border-b border-stone-200/60 pb-1">
                      Recapiti & Residenza
                    </span>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Indirizzo</span>
                      {!inModificaRecapiti ? (
                        <span className="text-stone-800 font-medium block">
                          {socioAttivo.indirizzo}, {socioAttivo.cap} {socioAttivo.citta} ({socioAttivo.provincia})
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={indirizzoModifica}
                          onChange={(e) => setIndirizzoModifica(e.target.value)}
                          className="w-full mt-1 p-2 bg-white border border-stone-300 rounded-lg text-xs"
                          placeholder="Via / Piazza e civico"
                        />
                      )}
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Telefono / Cellulare</span>
                      {!inModificaRecapiti ? (
                        <span className="text-stone-800 font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-500" />
                          <span>{socioAttivo.telefono || 'Non specificato'}</span>
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={telefonoModifica}
                          onChange={(e) => setTelefonoModifica(e.target.value)}
                          className="w-full mt-1 p-2 bg-white border border-stone-300 rounded-lg text-xs"
                          placeholder="Cellulare per avvisi"
                        />
                      )}
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Indirizzo Email</span>
                      {!inModificaRecapiti ? (
                        <span className="text-stone-800 font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-500" />
                          <span>{socioAttivo.email || 'Non specificata'}</span>
                        </span>
                      ) : (
                        <input
                          type="email"
                          value={emailModifica}
                          onChange={(e) => setEmailModifica(e.target.value)}
                          className="w-full mt-1 p-2 bg-white border border-stone-300 rounded-lg text-xs"
                          placeholder="Email per convocazioni assemblea"
                        />
                      )}
                    </div>
                  </div>

                  {/* 3. Inquadramento Associativo */}
                  <div className="space-y-4 bg-stone-50/60 p-5 rounded-2xl border border-stone-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block border-b border-stone-200/60 pb-1">
                      Albo Soci & Privacy
                    </span>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Categoria Socio</span>
                      <strong className="text-stone-900 font-bold">{socioAttivo.categoria}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Ruolo Istituzionale nel Direttivo</span>
                      <span className={`font-bold ${socioAttivo.ruoloDirettivo !== 'Nessuno' ? 'text-emerald-800' : 'text-stone-600'}`}>
                        {socioAttivo.ruoloDirettivo || 'Nessuno'}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10.5px]">Consenso Trattamento Dati (GDPR)</span>
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Acquisito e Valido</span>
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: CRONOLOGIA PAGAMENTI QUOTE & RICEVUTE */}
            {/* ======================================================== */}
            {tabAttiva === 'pagamenti' && (
              <div className="space-y-6">
                
                {/* KPI Pagamenti */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Totale Versato Negli Anni</span>
                    <p className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
                      {totaleVersatoStoria.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    <span className="text-[11px] text-stone-500">Quote associative a sostegno della Pro Loco</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Ricevute Emesse</span>
                    <p className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
                      {cronologiaPagamenti.length}
                    </p>
                    <span className="text-[11px] text-stone-500">Tutte registrate e consultabili</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Ultimo Rinnovo Registrato</span>
                    <p className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
                      {cronologiaPagamenti[0]?.anno || '-'}
                    </p>
                    <span className="text-[11px] text-stone-500">
                      Quietanza {cronologiaPagamenti[0]?.ricevutaNumero || '-'}
                    </span>
                  </div>
                </div>

                {/* Tabella Ricevute */}
                <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                        Registro Storico dei Pagamenti
                      </h3>
                      <p className="text-xs text-stone-500">
                        Visualizza e scarica le ricevute con timbro e firma del Presidente valide ai fini amministrativi.
                      </p>
                    </div>
                  </div>

                  {cronologiaPagamenti.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 text-xs">
                      Nessuna quota registrata nello storico.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10.5px]">
                            <th className="py-3 px-3">Ricevuta N°</th>
                            <th className="py-3 px-3">Anno Sociale</th>
                            <th className="py-3 px-3">Data Pagamento</th>
                            <th className="py-3 px-3">Importo</th>
                            <th className="py-3 px-3">Metodo</th>
                            <th className="py-3 px-3">Note</th>
                            <th className="py-3 px-3 text-right">Azione</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {cronologiaPagamenti.map(q => (
                            <tr key={q.id} className="hover:bg-stone-50/80 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-stone-900">
                                {q.ricevutaNumero || '-'}
                              </td>
                              <td className="py-3 px-3 font-bold text-emerald-900">
                                Anno {q.anno}
                              </td>
                              <td className="py-3 px-3 text-stone-600">
                                {q.dataPagamento ? new Date(q.dataPagamento).toLocaleDateString('it-IT') : '-'}
                              </td>
                              <td className="py-3 px-3 font-bold text-stone-900 tabular-nums">
                                {Number(q.importo || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </td>
                              <td className="py-3 px-3 text-stone-600">
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                                  {q.metodo}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-stone-500 italic max-w-xs truncate">
                                {q.note || 'Quota associativa annuale'}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setRicevutaSelezionata({ socio: socioAttivo, quota: q })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition cursor-pointer text-xs"
                                  title="Visualizza e stampa la ricevuta"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Visualizza Ricevuta</span>
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
            {/* TAB 4: COMUNICAZIONI DEDICATE AI SOCI */}
            {/* ======================================================== */}
            {tabAttiva === 'comunicazioni' && (
              <div className="space-y-6">
                
                {/* Header Bacheca e Filtri */}
                <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
                        Bacheca Ufficiale delle Comunicazioni
                      </h2>
                    </div>
                    <p className="text-xs text-stone-500">
                      Circolari del Consiglio Direttivo, convocazioni assembleari, sconti convenzioni e aggiornamenti per i soci.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filtro per categoria */}
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl text-xs">
                      {['tutte', 'giornalino', 'assemblea', 'convenzione', 'avviso', 'evento'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFiltroCategoriaCom(cat)}
                          className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer ${
                            filtroCategoriaCom === cat
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          {cat === 'giornalino' ? '📰 Giornalino' : cat}
                        </button>
                      ))}
                    </div>

                    {/* Se l'utente fa parte del direttivo (o se admin), può pubblicare */}
                    {(socioAttivo.ruoloDirettivo !== 'Nessuno' || socioAttivo.categoria === 'Membro Direttivo') && (
                      <button
                        type="button"
                        onClick={() => setMostraModaleNuovaCom(true)}
                        className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nuovo Avviso</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Archivio Edizioni Giornalino Pro Loco Rintracciabile */}
                {loadArchivioGiornalini().length > 0 && (filtroCategoriaCom === 'tutte' || filtroCategoriaCom === 'giornalino') && (
                  <div className="bg-indigo-50/70 rounded-3xl p-5 sm:p-6 border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-700" />
                        <span>Archivio Edizioni Giornalino Pro Loco ({loadArchivioGiornalini().length})</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-indigo-800 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                        Consultabile Sempre
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {loadArchivioGiornalini().map((ed) => (
                        <div
                          key={ed.id}
                          className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-2xs flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-900 text-white uppercase">
                                Edizione #{ed.numeroEdizione} • {ed.anno}
                              </span>
                              <span className="text-[10.5px] font-semibold text-stone-500">
                                {ed.mesePeriodo}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-stone-900">
                              {ed.titoloTestata}
                            </h4>
                            <p className="text-[11px] text-stone-500 line-clamp-1">
                              {ed.sottotitoloTestata} • {ed.articoli?.length || 0} articoli
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGiornalinoDaLeggere(ed)}
                            className="w-full py-2 px-3 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Sfoglia Edizione #{ed.numeroEdizione}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elenco Comunicazioni */}
                <div className="space-y-4">
                  {comunicazioniFiltrate.map(c => {
                    const isGiornalino = c.categoria === 'giornalino' || Boolean(c.edizioneGiornalinoId) || Boolean(c.edizioneGiornalinoSnapshot);
                    const apriLetturaGiornalino = () => {
                      if (c.edizioneGiornalinoSnapshot) {
                        setGiornalinoDaLeggere(c.edizioneGiornalinoSnapshot);
                        return;
                      }
                      if (c.edizioneGiornalinoId) {
                        const daArchivio = loadArchivioGiornalini().find(e => e.id === c.edizioneGiornalinoId);
                        if (daArchivio) {
                          setGiornalinoDaLeggere(daArchivio);
                        }
                      }
                    };

                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-sm ${
                          isGiornalino
                            ? 'border-indigo-300 ring-1 ring-indigo-100'
                            : c.inEvidenza 
                            ? 'border-emerald-300 ring-1 ring-emerald-100' 
                            : 'border-stone-200/90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${
                                c.categoria === 'giornalino'
                                  ? 'bg-indigo-900 text-white'
                                  : c.categoria === 'assemblea'
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : c.categoria === 'convenzione'
                                  ? 'bg-amber-100 text-amber-900'
                                  : c.categoria === 'evento'
                                  ? 'bg-teal-100 text-teal-900'
                                  : 'bg-stone-100 text-stone-800'
                              }`}>
                                {c.categoria === 'giornalino' ? 'Giornalino Pro Loco' : c.categoria}
                              </span>
                              {c.numeroTesseraRiferimento && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                                  <CreditCard className="w-3 h-3 text-emerald-700" />
                                  <span>Rif. Tessera: {c.numeroTesseraRiferimento}</span>
                                </span>
                              )}
                              {c.inEvidenza && (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  In Evidenza
                                </span>
                              )}
                              <span className="text-xs text-stone-400 font-medium">
                                Pubblicato il {new Date(c.dataPubblicazione).toLocaleDateString('it-IT')} {c.oraPubblicazione ? `alle ${c.oraPubblicazione}` : ''}
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
                              {c.titolo}
                            </h3>
                            {c.oggetto && (
                              <p className="text-xs font-semibold text-emerald-800">
                                {c.oggetto}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-2">
                            <span className="text-[11px] font-semibold text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60 inline-block">
                              Da: {c.autore}
                            </span>
                            {isGiornalino && (
                              <button
                                type="button"
                                onClick={apriLetturaGiornalino}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                                <span>Sfoglia e Leggi Uscita Giornalino</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Contenuto Testuale Formattato */}
                        <div className="text-xs text-stone-700 leading-relaxed whitespace-pre-line bg-[#fbfaf7] p-4.5 rounded-2xl border border-stone-200/60">
                          {c.contenuto}
                        </div>

                      </motion.div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: EVENTI & PARTECIPAZIONE */}
            {/* ======================================================== */}
            {tabAttiva === 'eventi' && (
              <div className="space-y-6">
                
                <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-1">
                  <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
                    Iniziative, Feste & Partecipazione Soci
                  </h2>
                  <p className="text-xs text-stone-500">
                    Come socio della Pro Loco hai diritto a quote agevolate, posti riservati e puoi offrirti come volontario durante le manifestazioni.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {eventi.filter(e => e.stato !== 'annullato').map(ev => {
                    const iscritto = ev.iscrizioni?.some(i => i.socioId === socioAttivo.id);
                    const miaIscrizione = ev.iscrizioni?.find(i => i.socioId === socioAttivo.id);

                    return (
                      <div 
                        key={ev.id}
                        className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {ev.categoria}
                            </span>
                            {iscritto ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Iscritto</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-stone-500">
                                {ev.postiMassimi ? `${(ev.iscrizioni || []).length} / ${ev.postiMassimi} iscritti` : 'Aperto a tutti'}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                            {ev.titolo}
                          </h3>

                          <div className="space-y-1 text-xs text-stone-600">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              <span>Dal {new Date(ev.dataInizio).toLocaleDateString('it-IT')} al {new Date(ev.dataFine).toLocaleDateString('it-IT')}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              <span>{ev.luogo}</span>
                            </p>
                          </div>

                          <p className="text-xs text-stone-500 line-clamp-2 pt-1">
                            {ev.descrizione}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Quota Partecipazione</span>
                            <span className="text-sm font-extrabold text-stone-900">
                              {ev.quotaIscrizioneSocio && ev.quotaIscrizioneSocio > 0 ? `${ev.quotaIscrizioneSocio} € (Socio)` : 'Gratuito per Soci'}
                            </span>
                          </div>

                          {!iscritto ? (
                            <button
                              type="button"
                              onClick={() => handleIscrizioneEventoRapida(ev)}
                              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Iscriviti con 1 Clic</span>
                            </button>
                          ) : (
                            <div className="text-right">
                              <span className="text-[10.5px] font-bold text-emerald-800 block">
                                Stato: {miaIscrizione?.statoPresenza === 'presente' ? 'Registrato al Desk' : 'Iscrizione Attiva'}
                              </span>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* ======================================================== */}
      {/* MODALI: Ricevuta Ufficiale Quota Sociale */}
      {/* ======================================================== */}
      {ricevutaSelezionata && (
        <ReceiptModal
          socio={ricevutaSelezionata.socio}
          quota={ricevutaSelezionata.quota}
          config={config}
          onClose={() => setRicevutaSelezionata(null)}
        />
      )}

      {/* MODALI: Tessera Digitale Fronte/Retro Ufficiale */}
      {mostraModalTesseraDigitale && (
        <DigitalCardModal
          socio={socioAttivo}
          config={config}
          annoSelezionato={annoSelezionato}
          onClose={() => setMostraModalTesseraDigitale(false)}
          onRinnovaQuota={() => {}}
          solaLetturaSocio={true}
        />
      )}

      {/* MODALI: Lettura Completa Uscita Giornalino inviata nella sezione Comunicazioni */}
      {giornalinoDaLeggere && (
        <GiornalinoPrintModal
          giornalino={giornalinoDaLeggere}
          config={config}
          eventi={eventi}
          onChiudi={() => setGiornalinoDaLeggere(null)}
        />
      )}

      {/* MODALE: Nuova Comunicazione (per amministratori o membri direttivo) */}
      {mostraModaleNuovaCom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-700" />
                <span>Pubblica Comunicazione per i Soci</span>
              </h3>
              <button
                onClick={() => setMostraModaleNuovaCom(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvaNuovaComunicazione} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Titolo dell'Avviso *</label>
                <input
                  type="text"
                  required
                  value={nuovaComForm.titolo}
                  onChange={(e) => setNuovaComForm({ ...nuovaComForm, titolo: e.target.value })}
                  placeholder="Es. Convocazione Assemblea Straordinaria o Nuova Convenzione"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Oggetto Sintetico</label>
                <input
                  type="text"
                  value={nuovaComForm.oggetto}
                  onChange={(e) => setNuovaComForm({ ...nuovaComForm, oggetto: e.target.value })}
                  placeholder="Es. Ordine del Giorno o Termini e Condizioni Sconto"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Categoria</label>
                  <select
                    value={nuovaComForm.categoria}
                    onChange={(e) => setNuovaComForm({ ...nuovaComForm, categoria: e.target.value as CategoriaComunicazioneSocio })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-semibold"
                  >
                    <option value="avviso">Avviso Istituzionale</option>
                    <option value="assemblea">Convocazione Assemblea</option>
                    <option value="convenzione">Convenzione & Sconto</option>
                    <option value="evento">Evento & Volontariato</option>
                    <option value="generale">Generale</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chk-evidenza"
                    checked={nuovaComForm.inEvidenza}
                    onChange={(e) => setNuovaComForm({ ...nuovaComForm, inEvidenza: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded"
                  />
                  <label htmlFor="chk-evidenza" className="font-bold text-stone-700">Metti in Evidenza</label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Testo del Messaggio *</label>
                <textarea
                  required
                  rows={6}
                  value={nuovaComForm.contenuto}
                  onChange={(e) => setNuovaComForm({ ...nuovaComForm, contenuto: e.target.value })}
                  placeholder="Scrivi qui il comunicato ufficiale per i soci..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostraModaleNuovaCom(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Pubblica sulla Bacheca Soci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Istituzionale */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12 text-center text-xs text-stone-500 space-y-1">
        <p className="font-semibold text-stone-700">
          {config.nome} • Portale Web del Socio
        </p>
        <p className="text-[11px] text-stone-400">
          Albo Ufficiale Soci • C.F. {config.codiceFiscale} {config.codiceUnpli ? `• UNPLI ${config.codiceUnpli}` : ''}
        </p>
      </footer>

    </div>
  );
};
