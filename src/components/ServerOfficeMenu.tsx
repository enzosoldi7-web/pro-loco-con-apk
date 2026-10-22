import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Globe,
  Copy,
  ExternalLink,
  Check,
  Radio,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  getActiveTryCloudflareUrl,
  setActiveTryCloudflareUrl,
  fetchActiveTunnelUrl
} from '../storage';

interface ServerOfficeMenuProps {
  className?: string;
}

export const ServerOfficeMenu: React.FC<ServerOfficeMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tunnelAttivo, setTunnelAttivo] = useState<string>(() => getActiveTryCloudflareUrl());
  const [customTunnelInput, setCustomTunnelInput] = useState<string>('');
  const [isCaricamentoTunnel, setIsCaricamentoTunnel] = useState(false);
  const [feedbackCopiato, setFeedbackCopiato] = useState(false);
  const [notificaServerAzione, setNotificaServerAzione] = useState<{ tipo: 'success' | 'info' | 'error'; testo: string } | null>(null);
  const [pingStatus, setPingStatus] = useState<{ ms?: number; ok?: boolean; inCorso?: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchActiveTunnelUrl(false).then(url => {
      if (mounted && url) {
        setTunnelAttivo(url);
        setCustomTunnelInput(prev => prev || url);
      }
    });

    const handleTunnelUpdate = (e: Event) => {
      const customEv = e as CustomEvent<{ url?: string }>;
      const newUrl = customEv.detail?.url || getActiveTryCloudflareUrl();
      if (mounted && newUrl) {
        setTunnelAttivo(newUrl);
        setCustomTunnelInput(prev => prev || newUrl);
      }
    };

    window.addEventListener('proloco-tunnel-updated', handleTunnelUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('proloco-tunnel-updated', handleTunnelUpdate);
    };
  }, []);

  const handleRiavviaTunnel = async () => {
    setIsCaricamentoTunnel(true);
    setNotificaServerAzione({ tipo: 'info', testo: 'Generazione nuovo tunnel Cloudflare in corso... attendi qualche istante.' });
    try {
      const nuovoUrl = await fetchActiveTunnelUrl(true);
      if (nuovoUrl) {
        setTunnelAttivo(nuovoUrl);
        setCustomTunnelInput(nuovoUrl);
        setNotificaServerAzione({ tipo: 'success', testo: `Nuovo tunnel generato (${nuovoUrl}) e trasmesso con successo a tutti gli APK!` });
      } else {
        setNotificaServerAzione({ tipo: 'error', testo: 'Impossibile rigenerare il tunnel. Verifica la connessione a Internet del server.' });
      }
    } catch {
      setNotificaServerAzione({ tipo: 'error', testo: 'Errore di comunicazione con il backend.' });
    } finally {
      setIsCaricamentoTunnel(false);
      setTimeout(() => setNotificaServerAzione(null), 6000);
    }
  };

  const handleSalvaEInviaTunnelCustom = async () => {
    const urlPulito = customTunnelInput.trim().replace(/\/+$/, '');
    if (!urlPulito) {
      setNotificaServerAzione({ tipo: 'error', testo: 'Inserisci un indirizzo URL valido (es. https://tuodominio.trycloudflare.com)' });
      return;
    }
    setIsCaricamentoTunnel(true);
    try {
      const res = await fetch('/api/tunnel/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunnelUrl: urlPulito, forceSync: true })
      });
      if (res.ok) {
        setActiveTryCloudflareUrl(urlPulito);
        setTunnelAttivo(urlPulito);
        setNotificaServerAzione({ tipo: 'success', testo: 'Indirizzo tunnel memorizzato e inviato immediatamente a tutti gli APK cellulari!' });
      } else {
        setNotificaServerAzione({ tipo: 'error', testo: 'Il server ha restituito un codice di errore durante l\'annuncio del tunnel.' });
      }
    } catch {
      setNotificaServerAzione({ tipo: 'error', testo: 'Errore di rete durante la trasmissione dell\'indirizzo al server.' });
    } finally {
      setIsCaricamentoTunnel(false);
      setTimeout(() => setNotificaServerAzione(null), 6000);
    }
  };

  const handleTestPing = async () => {
    setPingStatus({ inCorso: true });
    const t0 = performance.now();
    try {
      const res = await fetch('/api/v2/version', { cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      if (res.ok) {
        setPingStatus({ ok: true, ms });
      } else {
        setPingStatus({ ok: false, ms });
      }
    } catch {
      setPingStatus({ ok: false });
    }
  };

  const handleCopiaTunnel = () => {
    if (!tunnelAttivo) return;
    navigator.clipboard.writeText(tunnelAttivo).then(() => {
      setFeedbackCopiato(true);
      setTimeout(() => setFeedbackCopiato(false), 2000);
    });
  };

  const handleInviaNotificaCambioTunnel = async () => {
    setIsCaricamentoTunnel(true);
    setNotificaServerAzione({ tipo: 'info', testo: 'Invio notifica cambio tunnel a tutti i canali univoci delle tessere...' });
    try {
      const res = await fetch('/api/tunnel/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunnelUrl: tunnelAttivo })
      });
      if (res.ok) {
        setNotificaServerAzione({
          tipo: 'success',
          testo: 'Notifica cambio tunnel trasmessa con successo a tutti i canali univoci degli APK!'
        });
      } else {
        setNotificaServerAzione({
          tipo: 'error',
          testo: 'Errore durante la trasmissione della notifica broadcast.'
        });
      }
    } catch {
      setNotificaServerAzione({
        tipo: 'error',
        testo: 'Errore di connessione durante l\'invio della notifica.'
      });
    } finally {
      setIsCaricamentoTunnel(false);
      setTimeout(() => setNotificaServerAzione(null), 6000);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Tasto Server Stile Office */}
      <button
        id="btn-server-office-menu"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="Configurazione Server, Tunnel di Uscita Cloudflare e Sincronizzazione APK"
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-150 shadow-2xs cursor-pointer select-none ${
          isOpen
            ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-500/30'
            : 'bg-blue-50/90 hover:bg-blue-100 text-blue-900 border-blue-200 hover:border-blue-300'
        }`}
      >
        <Server className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-blue-700'}`} />
        <span className="font-bold tracking-tight">Server</span>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tunnelAttivo ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${tunnelAttivo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </span>
        <span className={`${isOpen ? 'text-blue-200' : 'text-blue-500'} text-[10px]`}>▾</span>
      </button>

      {/* Flyout Menu a Scomparsa Stile Office */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-[92vw] max-w-[490px] sm:w-[490px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans text-slate-800 text-left">
            {/* Header Ribbon Blu Stile Microsoft Office */}
            <div className="bg-gradient-to-r from-[#0f4c81] via-[#005a9e] to-[#0078d4] px-4 py-3 text-white flex items-center justify-between border-b border-blue-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
                  <Server className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                    <span>Configurazione Server & Rete</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-bold tracking-wide uppercase">
                      Attivo
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-100/90">
                    Stato locale, tunnel di uscita Cloudflare e sincronizzazione APK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/15 text-blue-100 hover:text-white transition-colors cursor-pointer"
                title="Chiudi menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Banner Notifica Operazione Rapida */}
            {notificaServerAzione && (
              <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
                notificaServerAzione.tipo === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : notificaServerAzione.tipo === 'info'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {notificaServerAzione.tipo === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : notificaServerAzione.tipo === 'info' ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{notificaServerAzione.testo}</span>
              </div>
            )}

            <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {/* Sezione 1: Parametri Server Locale */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-600" />
                    Stato Server Locale
                  </span>
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={pingStatus?.inCorso}
                    className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    {pingStatus?.inCorso ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Verifica...</span>
                      </>
                    ) : pingStatus?.ok ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">{pingStatus.ms} ms • OK</span>
                      </>
                    ) : (
                      <span>Verifica Risposta (Ping)</span>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Indirizzo Locale</div>
                    <div className="font-mono font-bold text-slate-800 text-[11px] truncate">
                      http://localhost:3000
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Canale Push Live</div>
                    <div className="font-bold text-emerald-700 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      SSE (/api/v2/stream)
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Internet Watcher</div>
                    <div className="font-bold text-slate-700 text-[11px]">
                      Attivo ogni 10s
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Auto-Sync APK</div>
                    <div className="font-bold text-blue-700 text-[11px]">
                      Invio automatico attivo
                    </div>
                  </div>
                </div>
              </div>

              {/* Sezione 2: Tunnel di Uscita Cloudflare Attivo */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/40 rounded-xl p-3 border border-blue-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Tunnel di Uscita Cloudflare (Accesso Remoto)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    {tunnelAttivo ? 'Operativo' : 'In attesa'}
                  </span>
                </div>

                {/* Box Indirizzo Tunnel */}
                <div className="bg-white rounded-lg p-2.5 border border-blue-200 flex items-center justify-between gap-2 shadow-2xs mt-2">
                  <div className="font-mono text-xs text-slate-800 font-bold truncate select-all">
                    {tunnelAttivo || 'Generazione indirizzo tunnel in corso...'}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopiaTunnel}
                      title="Copia negli appunti"
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {feedbackCopiato ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copiato!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copia</span>
                        </>
                      )}
                    </button>
                    {tunnelAttivo && (
                      <a
                        href={tunnelAttivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Apri nel browser"
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-blue-900/80 mt-2 leading-relaxed">
                  Tutti i telefoni dei soci con l'APK installato ricevono questo tunnel non appena il server si connette ad Internet, permettendo la sincronizzazione anche su rete cellulare (4G/5G).
                </p>
              </div>

              {/* Sezione 3: Modifica e Personalizzazione del Tunnel */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    Modifica o Imposta Indirizzo Tunnel:
                  </label>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customTunnelInput}
                    onChange={(e) => setCustomTunnelInput(e.target.value)}
                    placeholder="https://nome-tunnel.trycloudflare.com"
                    className="flex-1 text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={handleSalvaEInviaTunnelCustom}
                    disabled={isCaricamentoTunnel || !customTunnelInput.trim()}
                    title="Salva e trasmetti subito a tutti gli APK"
                    className="px-3 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Salva & Invia</span>
                  </button>
                </div>

                {/* Pulsanti Rapidi di Riavvio */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRiavviaTunnel}
                    disabled={isCaricamentoTunnel}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isCaricamentoTunnel ? 'animate-spin' : ''}`} />
                    <span>Rigenera Nuovo Tunnel</span>
                  </button>
                </div>
              </div>

              {/* Sezione: Canali Univoci di Ricezione Notifiche Tessera (ntfy.sh Relay Permanente) */}
              <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-sky-700" />
                    Canali Univoci Ricezione Notifiche (ntfy.sh)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-900 font-bold">
                    Permanente
                  </span>
                </div>
                <p className="text-[11.5px] text-sky-900 leading-relaxed">
                  Ogni file APK possiede un <strong>Canale Univoco di Ricezione associato alla Tessera</strong> che resta sempre attivo su Internet anche quando il vecchio tunnel Cloudflare scade o il server locale si riavvia.
                </p>
                <div className="bg-white p-2 rounded-lg border border-sky-200 text-xs font-mono text-sky-950 flex items-center justify-between">
                  <span className="truncate">proloco_tunnel_..._[NUMERO_TESSERA]</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded ml-2 shrink-0">
                    Sempre Attivo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleInviaNotificaCambioTunnel}
                  disabled={isCaricamentoTunnel || !tunnelAttivo}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 active:bg-sky-900 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Notifica Cambio Tunnel a tutti i Cellulari</span>
                </button>
              </div>

              {/* Sezione 4: Regola di Sincronizzazione Bidirezionale */}
              <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
                <div className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scambio Dati Sempre Garantito</span>
                </div>
                Il gestionale e gli APK scambiano modifiche salvate offline con risoluzione automatica basata su timestamp. Anche versioni differenti di APK e server comunicano senza errori di incompatibilità o blocchi.
              </div>
            </div>

            {/* Footer Stile Office */}
            <div className="bg-slate-100/90 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Server Pro Loco • Porta 3000</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
