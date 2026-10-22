import React, { useState, useMemo, useEffect } from 'react';
import { Socio, ProLocoInfo } from '../types';
import {
  getPublicPortalOrigin,
  getActiveTryCloudflareUrl,
  fetchActiveTunnelUrl,
  syncDatabaseToServer
} from '../storage';
import { 
  DettaglioSocioRinnovo, 
  getSociNonRinnovati, 
  calcolaScadenzaQuota, 
  TEMPLATE_PROMEMORIA_PREDEFINITI, 
  TipoTemplatePromemoria, 
  compilaTemplatePromemoria 
} from '../utils/quoteHelpers';
import { 
  X, 
  Bell, 
  Mail, 
  MessageSquare, 
  Copy, 
  Check, 
  Calendar, 
  Euro, 
  Users, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone,
  CreditCard,
  Send,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface PromemoriaRinnovoModalProps {
  soci: Socio[];
  annoSelezionato: number;
  config: ProLocoInfo;
  onClose: () => void;
  onRegistraPagamento?: (socio: Socio) => void;
}

export const PromemoriaRinnovoModal: React.FC<PromemoriaRinnovoModalProps> = ({
  soci,
  annoSelezionato,
  config,
  onClose,
  onRegistraPagamento
}) => {
  // Calcolo dati soci non rinnovati
  const sociNonRinnovati = useMemo(() => {
    return getSociNonRinnovati(soci, annoSelezionato, config);
  }, [soci, annoSelezionato, config]);

  const scadenzaGlobale = useMemo(() => {
    return calcolaScadenzaQuota(annoSelezionato);
  }, [annoSelezionato]);

  const totaleImportoStimato = useMemo(() => {
    return sociNonRinnovati.reduce((acc, curr) => acc + curr.importoDovuto, 0);
  }, [sociNonRinnovati]);

  // Stati locali di filtro e selezione
  const [ricerca, setRicerca] = useState<string>('');
  const [filtroCanale, setFiltroCanale] = useState<'tutti' | 'email' | 'telefono' | 'da_rinnovare' | 'scaduta'>('tutti');
  const [sociSelezionatiIds, setSociSelezionatiIds] = useState<string[]>(() => sociNonRinnovati.map(s => s.socio.id));
  const [socioInAnteprimaId, setSocioInAnteprimaId] = useState<string>(() => sociNonRinnovati[0]?.socio.id || '');

  // Template di notifica
  const [tipoTemplate, setTipoTemplate] = useState<TipoTemplatePromemoria>('istituzionale');
  const [oggettoCustom, setOggettoCustom] = useState<string>(() => {
    return TEMPLATE_PROMEMORIA_PREDEFINITI[0].oggetto;
  });
  const [testoCustom, setTestoCustom] = useState<string>(() => {
    return TEMPLATE_PROMEMORIA_PREDEFINITI[0].testo;
  });

  // Feedback di copia
  const [copiatoId, setCopiatoId] = useState<string | null>(null);
  const [copiatoTutti, setCopiatoTutti] = useState<boolean>(false);
  const [copiatoEmailList, setCopiatoEmailList] = useState<boolean>(false);
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

  // Cambio template
  const handleCambiaTemplate = (tipo: TipoTemplatePromemoria) => {
    setTipoTemplate(tipo);
    const templ = TEMPLATE_PROMEMORIA_PREDEFINITI.find(t => t.id === tipo);
    if (templ) {
      setOggettoCustom(templ.oggetto);
      setTestoCustom(templ.testo);
    }
  };

  // Filtraggio soci nella lista
  const sociFiltrati = useMemo(() => {
    return sociNonRinnovati.filter(item => {
      const q = ricerca.toLowerCase().trim();
      if (q) {
        const matchNome = (item.socio.nome || '').toLowerCase().includes(q);
        const matchCognome = (item.socio.cognome || '').toLowerCase().includes(q);
        const matchTessera = (item.socio.numeroTessera || '').toLowerCase().includes(q);
        const matchEmail = (item.socio.email || '').toLowerCase().includes(q);
        if (!matchNome && !matchCognome && !matchTessera && !matchEmail) return false;
      }

      if (filtroCanale === 'email' && !item.haEmail) return false;
      if (filtroCanale === 'telefono' && !item.haTelefono) return false;
      if (filtroCanale === 'da_rinnovare' && item.stato !== 'da_rinnovare') return false;
      if (filtroCanale === 'scaduta' && item.stato !== 'scaduta') return false;

      return true;
    });
  }, [sociNonRinnovati, ricerca, filtroCanale]);

  // Socio attualmente in anteprima
  const dettaglioSocioAnteprima = useMemo(() => {
    return sociNonRinnovati.find(s => s.socio.id === socioInAnteprimaId) || sociFiltrati[0] || sociNonRinnovati[0];
  }, [sociNonRinnovati, socioInAnteprimaId, sociFiltrati]);

  // Testo compilato per l'anteprima
  const anteprimaCompilata = useMemo(() => {
    if (!dettaglioSocioAnteprima) return { oggetto: '', testo: '' };
    return {
      oggetto: compilaTemplatePromemoria(oggettoCustom, dettaglioSocioAnteprima, annoSelezionato, config),
      testo: compilaTemplatePromemoria(testoCustom, dettaglioSocioAnteprima, annoSelezionato, config)
    };
  }, [dettaglioSocioAnteprima, oggettoCustom, testoCustom, annoSelezionato, config]);

  // Gestione selezione checkbox
  const handleToggleSelezione = (id: string) => {
    setSociSelezionatiIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleTutti = () => {
    const tuttiIdsFiltrati = sociFiltrati.map(s => s.socio.id);
    const tuttiSelezionati = tuttiIdsFiltrati.every(id => sociSelezionatiIds.includes(id));
    if (tuttiSelezionati) {
      setSociSelezionatiIds(prev => prev.filter(id => !tuttiIdsFiltrati.includes(id)));
    } else {
      setSociSelezionatiIds(prev => Array.from(new Set([...prev, ...tuttiIdsFiltrati])));
    }
  };

  // Azioni canali
  const pulisciTelefono = (tel: string) => {
    const digits = (tel || '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    return digits.startsWith('39') ? digits : `39${digits}`;
  };

  const apriWhatsApp = (dettaglio: DettaglioSocioRinnovo) => {
    syncDatabaseToServer();
    const tel = pulisciTelefono(dettaglio.socio.telefono);
    const publicOrigin = (tunnelUrl && tunnelUrl.includes('.trycloudflare.com')) ? tunnelUrl : getPublicPortalOrigin();
    const tesseraClean = (dettaglio.socio.numeroTessera || 'SOCIO').trim().toUpperCase();
    const slugTessera = tesseraClean.replace(/[^a-zA-Z0-9_]/g, '_');
    const nomeFileApk = `Socio_${slugTessera}.apk`;
    const pinSocio = (dettaglio.socio.pin && dettaglio.socio.pin.trim()) ? dettaglio.socio.pin.trim() : '1234';
    const socioQuery = `?p=${encodeURIComponent(pinSocio)}&n=${encodeURIComponent(dettaglio.socio.nome || '')}&c=${encodeURIComponent(dettaglio.socio.cognome || '')}`;
    const linkFileApkPubblico = `${publicOrigin}/apk/${encodeURIComponent(tesseraClean)}.apk${socioQuery}`;
    const linkInstallatore = `${publicOrigin}/inst/${encodeURIComponent(tesseraClean)}${socioQuery}`;

    const testoBase = compilaTemplatePromemoria(testoCustom, dettaglio, annoSelezionato, config);
    const testoCompleto = `${testoBase}\n\n📲 *Scarica File APK App Socio (${nomeFileApk}):*\n${linkFileApkPubblico}\n🔗 *Installazione Rapida:* ${linkInstallatore}\n🎫 *Tessera:* ${tesseraClean} | 🔑 *PIN:* ${pinSocio}`;

    const url = tel
      ? `https://wa.me/${tel}?text=${encodeURIComponent(testoCompleto)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(testoCompleto)}`;

    const waLink = document.createElement('a');
    waLink.href = url;
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    document.body.appendChild(waLink);
    waLink.click();
    document.body.removeChild(waLink);
  };

  const apriEmailSingola = (dettaglio: DettaglioSocioRinnovo) => {
    const email = (dettaglio.socio.email || '').trim();
    const oggetto = compilaTemplatePromemoria(oggettoCustom, dettaglio, annoSelezionato, config);
    const testo = compilaTemplatePromemoria(testoCustom, dettaglio, annoSelezionato, config);
    const mailto = `mailto:${email}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`;
    const link = document.createElement('a');
    link.href = mailto;
    link.target = '_top';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const apriEmailCumulativaCCN = () => {
    const sociSelezionati = sociNonRinnovati.filter(s => sociSelezionatiIds.includes(s.socio.id) && s.haEmail);
    if (sociSelezionati.length === 0) return;
    const bcc = sociSelezionati.map(s => (s.socio.email || '').trim()).filter(Boolean).join(',');
    const oggetto = compilaTemplatePromemoria(oggettoCustom, sociSelezionati[0], annoSelezionato, config);
    
    // Versione generica per invio cumulativo
    const testoGenerico = testoCustom
      .replace(/\{NOME\}/g, 'Socio/a')
      .replace(/\{COGNOME\}/g, '')
      .replace(/\{NUMERO_TESSERA\}/g, '[Tua Tessera]')
      .replace(/\{CATEGORIA\}/g, 'associativa')
      .replace(/\{ANNO\}/g, annoSelezionato.toString())
      .replace(/\{IMPORTO\}/g, config.quotaStandardOrdinario.toString())
      .replace(/\{DATA_SCADENZA\}/g, scadenzaGlobale.dataScadenzaEsercizio)
      .replace(/\{DATA_LIMITE_ASSEMBLEA\}/g, scadenzaGlobale.dataLimiteAssemblea)
      .replace(/\{COMUNE\}/g, config.comune || 'Locale')
      .replace(/\{NOME_PROLOCO\}/g, config.nome || 'Pro Loco')
      .replace(/\{INDIRIZZO\}/g, config.indirizzo || 'Via Roma')
      .replace(/\{EMAIL\}/g, config.email || '')
      .replace(/\{TELEFONO\}/g, config.telefono || '')
      .replace(/\{NOME_PRESIDENTE\}/g, config.nomePresidente || 'Il Presidente');

    const mailto = `mailto:${(config.email || '').trim()}?bcc=${bcc}&subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testoGenerico)}`;
    const link = document.createElement('a');
    link.href = mailto;
    link.target = '_top';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copiaMessaggioSocio = (dettaglio: DettaglioSocioRinnovo) => {
    const testo = compilaTemplatePromemoria(testoCustom, dettaglio, annoSelezionato, config);
    navigator.clipboard.writeText(testo);
    setCopiatoId(dettaglio.socio.id);
    setTimeout(() => setCopiatoId(null), 2500);
  };

  const copiaListaEmail = () => {
    const emails = sociNonRinnovati
      .filter(s => sociSelezionatiIds.includes(s.socio.id) && s.haEmail)
      .map(s => s.socio.email)
      .join('; ');
    navigator.clipboard.writeText(emails);
    setCopiatoEmailList(true);
    setTimeout(() => setCopiatoEmailList(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* HEADER MODALE */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-5 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-200 border border-white/20 shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  Promemoria & Notifiche Rinnovo Tessere {annoSelezionato}
                </h2>
                <span className="bg-amber-500/40 text-amber-100 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-400/30">
                  {sociNonRinnovati.length} soci in attesa
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-1 max-w-2xl leading-relaxed">
                Strumento di sollecito e comunicazione per regolarizzare le quote associative della Pro Loco. Seleziona i soci, personalizza il messaggio e invia promemoria via Email, WhatsApp o appunti.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA INDICATORI SCADENZA E QUOTE DA INCASSARE */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          
          {/* Box 1: Soci da rinnovare */}
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Soci Non Rinnovati</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {sociNonRinnovati.length} <span className="text-xs text-slate-500 font-normal">su {soci.length} totali</span>
              </span>
            </div>
          </div>

          {/* Box 2: Quote da Incassare Totali */}
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Euro className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Quote da Incassare</span>
              <span className="text-lg font-black text-emerald-800 font-mono">
                {(totaleImportoStimato || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* Box 3: Data Scadenza Statutaria Calcolata */}
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              scadenzaGlobale.isScaduta ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Data Scadenza Quota</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-slate-900 font-mono">
                  {scadenzaGlobale.dataScadenzaEsercizio}
                </span>
                <span className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded ${
                  scadenzaGlobale.isScaduta ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {scadenzaGlobale.isScaduta 
                    ? `Scaduta da ${Math.abs(scadenzaGlobale.giorniRimanenti)} gg`
                    : `Tra ${scadenzaGlobale.giorniRimanenti} gg`}
                </span>
              </div>
            </div>
          </div>

          {/* Box 4: Termine Assembleare UNPLI */}
          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Diritto Voto Assemblea</span>
              <span className="text-sm font-black text-blue-900 font-mono block">
                Entro {scadenzaGlobale.dataLimiteAssemblea}
              </span>
              <span className="text-[10px] text-slate-400">Termine tolleranza Statuto UNPLI</span>
            </div>
          </div>

        </div>

        {/* CORPO MODALE: 2 COLONNE (SINISTRA: LISTA SOCI, DESTRA: EDITOR TEMPLATE & ANTEPRIMA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* COLONNA SINISTRA: SELEZIONE E LISTA SOCI (7 COL) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden p-4 space-y-3 bg-slate-50/50">
            
            {/* Toolbar di Ricerca e Filtri Canale */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cerca per nome, cognome, tessera, email..."
                    value={ricerca}
                    onChange={(e) => setRicerca(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600"
                  />
                  {ricerca && (
                    <button
                      onClick={() => setRicerca('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  onClick={copiaListaEmail}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Copia tutti gli indirizzi email separati da punto e virgola"
                >
                  {copiatoEmailList ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiatoEmailList ? 'Copiato!' : 'Copia Email'}</span>
                </button>
              </div>

              {/* Filtri pillola */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setFiltroCanale('tutti')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCanale === 'tutti' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Tutti ({sociNonRinnovati.length})
                  </button>
                  <button
                    onClick={() => setFiltroCanale('email')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCanale === 'email' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    ✉️ Con Email ({sociNonRinnovati.filter(s => s.haEmail).length})
                  </button>
                  <button
                    onClick={() => setFiltroCanale('telefono')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCanale === 'telefono' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    💬 WhatsApp/Tel ({sociNonRinnovati.filter(s => s.haTelefono).length})
                  </button>
                  <button
                    onClick={() => setFiltroCanale('da_rinnovare')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCanale === 'da_rinnovare' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Da Rinnovare ({sociNonRinnovati.filter(s => s.stato === 'da_rinnovare').length})
                  </button>
                  <button
                    onClick={() => setFiltroCanale('scaduta')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filtroCanale === 'scaduta' ? 'bg-rose-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Scaduta ({sociNonRinnovati.filter(s => s.stato === 'scaduta').length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleTutti}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                  >
                    {sociFiltrati.every(s => sociSelezionatiIds.includes(s.socio.id)) ? 'Deseleziona tutti' : 'Seleziona tutti'}
                  </button>
                </div>
              </div>
            </div>

            {/* TABELLA / LISTA SOCI */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {sociFiltrati.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-sm text-slate-700">Nessun socio trovato</p>
                  <p className="text-xs text-slate-400">Tutti i soci corrispondono ai criteri o sono in regola con la quota.</p>
                </div>
              ) : (
                sociFiltrati.map(item => {
                  const isSelezionato = sociSelezionatiIds.includes(item.socio.id);
                  const isAttivoAnteprima = socioInAnteprimaId === item.socio.id;

                  return (
                    <div
                      key={item.socio.id}
                      onClick={() => setSocioInAnteprimaId(item.socio.id)}
                      className={`p-3 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isAttivoAnteprima ? 'bg-amber-50/80 border-l-4 border-l-amber-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox e Dati Anagrafici */}
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelezionato}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelezione(item.socio.id);
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {item.socio.cognome} {item.socio.nome}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.socio.numeroTessera || 'S/N'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              item.stato === 'da_rinnovare' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.stato === 'da_rinnovare' ? 'Da Rinnovare' : 'Scaduta'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>{item.socio.categoria}</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-emerald-700">Quota: {item.importoDovuto} €</span>
                            {item.scadenza.annoUltimaQuota && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">Ultima tessera: {item.scadenza.annoUltimaQuota}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Azioni Rapide Singole */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* WhatsApp */}
                        {item.haTelefono ? (
                          <button
                            onClick={() => apriWhatsApp(item)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title={`Invia messaggio WhatsApp a ${item.socio.telefono}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-300" title="Nessun numero di telefono">
                            <Phone className="w-4 h-4" />
                          </span>
                        )}

                        {/* Email */}
                        {item.haEmail ? (
                          <button
                            onClick={() => apriEmailSingola(item)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={`Invia Email a ${item.socio.email}`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-300" title="Nessuna email registrata">
                            <Mail className="w-4 h-4" />
                          </span>
                        )}

                        {/* Copia Testo */}
                        <button
                          onClick={() => copiaMessaggioSocio(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Copia testo sollecito per questo socio"
                        >
                          {copiatoId === item.socio.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Registra Quota con un click se fornito */}
                        {onRegistraPagamento && (
                          <button
                            onClick={() => {
                              onRegistraPagamento(item.socio);
                              onClose();
                            }}
                            className="p-1.5 text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Registra pagamento quota adesso"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Barra Inferiore Selezione Massiva */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">
                Selezionati: <strong>{sociSelezionatiIds.length}</strong> su {sociNonRinnovati.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={apriEmailCumulativaCCN}
                  disabled={sociSelezionatiIds.length === 0}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Invia email a tutti i soci selezionati in copia nascosta (CCN)"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Email Cumulativa (CCN)</span>
                </button>
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: TEMPLATE DI NOTIFICA & ANTEPRIMA IN TEMPO REALE (5 COL) */}
          <div className="lg:col-span-5 flex flex-col overflow-hidden p-4 space-y-3 bg-white">
            
            {/* Scelta Template Predefinito */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Template Promemoria</span>
                </label>
                <span className="text-[11px] text-slate-400">Modificabile e personalizzabile</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {TEMPLATE_PROMEMORIA_PREDEFINITI.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleCambiaTemplate(t.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      tipoTemplate === t.id
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 text-xs'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate">{t.titolo.split('&')[0]}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{t.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Oggetto & Corpo */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Oggetto Email / Titolo</label>
                <input
                  type="text"
                  value={oggettoCustom}
                  onChange={(e) => setOggettoCustom(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-amber-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] font-bold text-slate-600">Corpo del Messaggio</label>
                  <span className="text-[10px] text-slate-400">Variabili: {'{NOME}'}, {'{IMPORTO}'}, {'{DATA_SCADENZA}'}</span>
                </div>
                <textarea
                  rows={6}
                  value={testoCustom}
                  onChange={(e) => setTestoCustom(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-amber-600 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* BOX ANTEPRIMA REALE DEL SOCIO EVIDENZIATO */}
            <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  <span>Anteprima per: {dettaglioSocioAnteprima?.socio.nome} {dettaglioSocioAnteprima?.socio.cognome}</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Quota: {dettaglioSocioAnteprima?.importoDovuto} €
                </span>
              </div>

              {/* Contenuto formattato */}
              <div className="flex-1 overflow-y-auto bg-white p-3 rounded-lg border border-amber-200/80 text-xs text-slate-800 font-sans space-y-2 whitespace-pre-wrap leading-relaxed">
                <div className="font-bold text-slate-900 pb-1 border-b border-slate-100">
                  {anteprimaCompilata.oggetto}
                </div>
                <div>{anteprimaCompilata.testo}</div>
              </div>

              {/* Pulsanti Rapidi per il Socio in Anteprima */}
              {dettaglioSocioAnteprima && (
                <div className="flex items-center gap-2 pt-1">
                  {dettaglioSocioAnteprima.haTelefono && (
                    <button
                      onClick={() => apriWhatsApp(dettaglioSocioAnteprima)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Invia WhatsApp</span>
                    </button>
                  )}

                  {dettaglioSocioAnteprima.haEmail && (
                    <button
                      onClick={() => apriEmailSingola(dettaglioSocioAnteprima)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Invia Email</span>
                    </button>
                  )}

                  <button
                    onClick={() => copiaMessaggioSocio(dettaglioSocioAnteprima)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Copia negli appunti"
                  >
                    {copiatoId === dettaglioSocioAnteprima.socio.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span>{copiatoId === dettaglioSocioAnteprima.socio.id ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* FOOTER MODALE */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span>
              Termine statutario: <strong>{scadenzaGlobale.dataScadenzaEsercizio}</strong> (Esercizio {annoSelezionato})
            </span>
            <span className="text-slate-400">•</span>
            <span>
              Quote da riscuotere stimate: <strong className="text-emerald-700">{(totaleImportoStimato || 0).toLocaleString('it-IT')} €</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
