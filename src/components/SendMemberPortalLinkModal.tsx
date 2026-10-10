import React, { useState, useEffect } from 'react';
import { Socio, ProLocoInfo } from '../types';
import {
  saveSessioneSocioId,
  saveBloccoPortaleSocio,
  setTesseraSbloccataInSessione,
  syncDatabaseToServer,
  getPublicPortalOrigin,
  fetchActiveTunnelUrl,
  getActiveTryCloudflareUrl,
  buildSyncedMemberPortalUrl,
  toBase64Url,
  GESTIONALE_VERSION
} from '../storage';
import {
  X,
  Copy,
  Check,
  Send,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  ExternalLink,
  Download,
  User,
  KeyRound,
  CreditCard,
  Loader2,
  CheckCircle2,
  Share2,
  ShieldCheck,
  RefreshCw,
  Wifi
} from 'lucide-react';

interface SendMemberPortalLinkModalProps {
  socio: Socio | null;
  config: ProLocoInfo;
  annoSelezionato: number;
  onClose: () => void;
  onApriPortaleComeSocio?: (socio: Socio) => void;
}

export const SendMemberPortalLinkModal: React.FC<SendMemberPortalLinkModalProps> = ({
  socio,
  config,
  annoSelezionato,
  onClose,
  onApriPortaleComeSocio
}) => {
  const [copiatoLink, setCopiatoLink] = useState(false);
  const [copiatoTunnel, setCopiatoTunnel] = useState(false);
  const [copiatoApk, setCopiatoApk] = useState(false);
  const [copiatoMessaggio, setCopiatoMessaggio] = useState(false);
  const [statoApk, setStatoApk] = useState<'idle' | 'creating' | 'done'>('idle');
  const [statoZip, setStatoZip] = useState<'idle' | 'creating' | 'done'>('idle');
  const [statoShareApk, setStatoShareApk] = useState<'idle' | 'sharing' | 'shared'>('idle');
  const [statoWhatsappApk, setStatoWhatsappApk] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [preloadedApkFile, setPreloadedApkFile] = useState<File | null>(null);
  const [emailInput, setEmailInput] = useState<string>(socio?.email || '');
  const [telefonoInput, setTelefonoInput] = useState<string>(socio?.telefono || '');
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(() => getActiveTryCloudflareUrl());
  const [loadingTunnel, setLoadingTunnel] = useState<boolean>(false);

  useEffect(() => {
    setEmailInput(socio?.email || '');
    setTelefonoInput(socio?.telefono || '');
    setStatoApk('idle');
    setStatoZip('idle');
    setStatoShareApk('idle');
    setPreloadedApkFile(null);
    if (socio?.id) {
      syncDatabaseToServer();
    }
    let mounted = true;
    if (socio?.numeroTessera) {
      const tessera = socio.numeroTessera.trim().toUpperCase();
      const pin = socio.pin && socio.pin.trim() ? socio.pin.trim() : '1234';
      const slug = tessera.replace(/[^a-zA-Z0-9_]/g, '_');
      const fileName = `Socio_${slug}.apk`;
      fetch(`/apk/${encodeURIComponent(tessera)}.apk?p=${encodeURIComponent(pin)}`)
        .then(r => r.blob())
        .then(blob => {
          if (mounted && blob.size > 0) {
            setPreloadedApkFile(
              new File([blob], fileName, {
                type: 'application/octet-stream'
              })
            );
          }
        })
        .catch(() => {});
    }
    setLoadingTunnel(true);
    fetchActiveTunnelUrl(false)
      .then(url => {
        if (mounted && url) setTunnelUrl(url);
      })
      .finally(() => {
        if (mounted) setLoadingTunnel(false);
      });
    const timer = window.setInterval(() => {
      fetchActiveTunnelUrl(false).then(url => {
        if (mounted && url) setTunnelUrl(url);
      });
    }, 3000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [socio?.id, socio?.email, socio?.telefono]);

  if (!socio) return null;

  const pinSocio = socio.pin && socio.pin.trim() ? socio.pin.trim() : '1234';
  const tesseraClean = (socio.numeroTessera || '').trim().toUpperCase();
  const nomeDestinatario = `${socio.nome} ${socio.cognome}`.trim();
  const publicOrigin = tunnelUrl || getPublicPortalOrigin();
  const pinToken = toBase64Url(pinSocio);
  const socioQuerySync = `pk=${encodeURIComponent(pinToken)}`;
  const apkQuerySync = `p=${encodeURIComponent(pinSocio)}`;

  // 1. Link Portale Web dei Soci sincronizzato (corto e immediato su 4G/5G & Wi-Fi)
  const fullSyncedUrl = buildSyncedMemberPortalUrl(socio, config, annoSelezionato, false);
  const linkCortoPortale = tunnelUrl
    ? `${tunnelUrl}/s/${encodeURIComponent(tesseraClean)}?${socioQuerySync}`
    : fullSyncedUrl || `${publicOrigin}/s/${encodeURIComponent(tesseraClean)}?${socioQuerySync}`;
  const linkLocaleRelativo = `/?s=${encodeURIComponent(tesseraClean)}&${socioQuerySync}`;

  // 2. Link Corto APK, ZIP & Installatore Guidato Cellulare
  const linkInstallatoreMobile = `${publicOrigin}/inst/${encodeURIComponent(tesseraClean)}`;
  const linkFileApkPubblico = `${publicOrigin}/apk/${encodeURIComponent(tesseraClean)}.apk`;
  const linkFileApkDiretto = `/apk/${encodeURIComponent(tesseraClean)}.apk`;
  const linkFileZipDiretto = `/apk/${encodeURIComponent(tesseraClean)}.zip`;
  const slugTessera = tesseraClean.replace(/[^a-zA-Z0-9_]/g, '_');
  const nomeFileApk = `Socio_${slugTessera}.apk`;
  const nomeFileZip = `Socio_${slugTessera}.apk.zip`;

  const messaggioInvio = `Gentile ${nomeDestinatario},
ecco i tuoi dati per il Portale Soci (${config.nome} - v${GESTIONALE_VERSION}):

• Destinatario: ${nomeDestinatario}
• Numero Tessera: ${tesseraClean}
• PIN: ${pinSocio}

Link Portale Web dei Soci:
${linkCortoPortale}

📦 File App Android (${nomeFileApk} - v${GESTIONALE_VERSION}):
${linkFileApkPubblico}?${apkQuerySync}`;

  // Canali rapidi funzionali
  const telPulito = (telefonoInput || '').replace(/[^0-9]/g, '');
  const telWhatsapp = telPulito
    ? telPulito.startsWith('39')
      ? telPulito
      : `39${telPulito}`
    : '';

  const whatsappUrl = telWhatsapp
    ? `https://wa.me/${telWhatsapp}?text=${encodeURIComponent(messaggioInvio)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messaggioInvio)}`;

  const safeCopyToClipboard = (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        if (typeof document === 'undefined' || document.hasFocus()) {
          navigator.clipboard.writeText(text).catch(() => {});
          return;
        }
      }
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // ignore
    }
  };

  const handleInviaWhatsAppConApk = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    syncDatabaseToServer();
    setStatoWhatsappApk('sending');

    // 1. Se il file APK è già pronto in memoria e il dispositivo supporta Web Share coi file,
    // chiamiamo navigator.share() in modo SINCRONO sul click per allegare direttamente il file .apk a WhatsApp
    try {
      if (
        preloadedApkFile &&
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare({ files: [preloadedApkFile] }))
      ) {
        e.preventDefault();
        await navigator.share({
          title: `${nomeFileApk} - ${config.nome}`,
          text: messaggioInvio,
          files: [preloadedApkFile]
        });
        setStatoWhatsappApk('sent');
        setTimeout(() => setStatoWhatsappApk('idle'), 4000);
        return;
      }
    } catch {
      // Se l'utente annulla o il browser desktop blocca navigator.share sui file .apk, proseguiamo con l'apertura diretta di WhatsApp
    }

    // 2. Su PC/Desktop (dove i browser non permettono alle pagine web di iniettare file dentro WhatsApp Web senza azione utente),
    // copiamo negli appunti e apriamo subito la chat WhatsApp col pacchetto APK diretto incorporato nel messaggio
    safeCopyToClipboard(messaggioInvio);
    setStatoWhatsappApk('sent');
    setTimeout(() => setStatoWhatsappApk('idle'), 5000);
  };

  const emailTarget = (emailInput || '').trim();
  const oggettoEmail = `App APK (v${GESTIONALE_VERSION}) & Credenziali Portale Soci ${config.nome} - Tessera ${tesseraClean}`;
  const mailtoUrl = `mailto:${emailTarget}?subject=${encodeURIComponent(oggettoEmail)}&body=${encodeURIComponent(messaggioInvio)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTarget)}&su=${encodeURIComponent(oggettoEmail)}&body=${encodeURIComponent(messaggioInvio)}`;
  const smsUrl = `sms:${(telefonoInput || '').trim()}?body=${encodeURIComponent(messaggioInvio)}`;

  const handleCopiaLink = () => {
    syncDatabaseToServer();
    safeCopyToClipboard(linkCortoPortale);
    setCopiatoLink(true);
    setTimeout(() => setCopiatoLink(false), 2000);
  };

  const handleCopiaApk = () => {
    syncDatabaseToServer();
    safeCopyToClipboard(linkInstallatoreMobile);
    setCopiatoApk(true);
    setTimeout(() => setCopiatoApk(false), 2000);
  };

  const handleCopiaMessaggio = () => {
    syncDatabaseToServer();
    safeCopyToClipboard(messaggioInvio);
    setCopiatoMessaggio(true);
    setTimeout(() => setCopiatoMessaggio(false), 2000);
  };

  const handleCreaApk = () => {
    if (statoApk === 'creating') return;
    syncDatabaseToServer();
    setStatoApk('creating');

    setTimeout(() => {
      setStatoApk('done');
      const a = document.createElement('a');
      a.href = `${linkFileApkDiretto}?${apkQuerySync}`;
      a.setAttribute('download', nomeFileApk);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setStatoApk('idle'), 3000);
    }, 350);
  };

  const handleScaricaZip = () => {
    if (statoZip === 'creating') return;
    syncDatabaseToServer();
    setStatoZip('creating');

    setTimeout(() => {
      setStatoZip('done');
      const a = document.createElement('a');
      a.href = `${linkFileZipDiretto}?${apkQuerySync}`;
      a.setAttribute('download', nomeFileZip);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setStatoZip('idle'), 3000);
    }, 350);
  };

  const handleCondividiFileApk = async () => {
    if (statoShareApk === 'sharing') return;
    syncDatabaseToServer();
    setStatoShareApk('sharing');
    safeCopyToClipboard(messaggioInvio);

    try {
      const response = await fetch(`${linkFileApkDiretto}?${apkQuerySync}`);
      const blob = await response.blob();
      const apkFile = new File([blob], nomeFileApk, {
        type: 'application/vnd.android.package-archive'
      });

      if (navigator.canShare && navigator.canShare({ files: [apkFile] })) {
        await navigator.share({
          title: `App ${config.nome} - ${nomeDestinatario}`,
          text: messaggioInvio,
          files: [apkFile]
        });
        setStatoShareApk('shared');
        setTimeout(() => setStatoShareApk('idle'), 3000);
        return;
      }
    } catch {
      // Fallback automatico su desktop
    }

    handleCreaApk();
    setStatoShareApk('shared');
    setTimeout(() => setStatoShareApk('idle'), 3500);
  };

  const handleApriPortaleSocio = () => {
    syncDatabaseToServer();
    saveSessioneSocioId(socio.id);
    setTesseraSbloccataInSessione(socio.numeroTessera);
    saveBloccoPortaleSocio(true);
    try {
      window.history.replaceState({ portaleSociBloccato: true }, document.title, linkLocaleRelativo);
    } catch {
      // ignore
    }
    if (onApriPortaleComeSocio) {
      onApriPortaleComeSocio(socio);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 space-y-4">
        
        {/* INTESTAZIONE RIORDINATA CON VERSIONE AGGIORNAMENTO IN ALTO A DESTRA */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icon.svg"
              alt="Logo Pro Loco"
              className="w-10 h-10 rounded-xl border border-emerald-600/30 shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                Link Portale Web dei Soci &amp; App APK
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {config.nome} • Compatibilità Bidirezionale Attiva
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-mono font-extrabold shadow-2xs select-none"
              title="Versione aggiornamento App APK e Gestionale"
            >
              v{GESTIONALE_VERSION}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEZIONE 1: CREDENZIALI E RECAPITI DEL SOCIO */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                1
              </span>
              <User className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-slate-500 uppercase">Socio:</span>
              <span className="text-sm font-extrabold text-slate-900 truncate">
                {nomeDestinatario}
              </span>
            </div>
            <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
              Dialogo API v1/v2 Attivo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Numero Tessera</div>
                <div className="text-sm font-mono font-extrabold text-emerald-900">{tesseraClean}</div>
              </div>
            </div>

            <div className="bg-white border border-amber-300 rounded-xl p-2.5 flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">PIN Personale</div>
                <div className="text-sm font-mono font-extrabold text-amber-900">{pinSocio}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Email Destinatario
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="email@esempio.it"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Telefono / WhatsApp
              </label>
              <input
                type="tel"
                value={telefonoInput}
                onChange={e => setTelefonoInput(e.target.value)}
                placeholder="333 1234567"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* SEZIONE 4: INVIO RAPIDO AL SOCIO (WHATSAPP, EMAIL, GMAIL, SMS) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                4
              </span>
              <span className="text-xs font-bold text-slate-800 uppercase">
                Invio Diretto Credenziali, Link Portale &amp; APK:
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopiaMessaggio}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              {copiatoMessaggio ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiatoMessaggio ? 'Testo Copiato!' : 'Copia Messaggio'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleInviaWhatsAppConApk}
              title={`Apre WhatsApp e prepara automaticamente il file ${nomeFileApk} da inviare`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              {statoWhatsappApk === 'sending' ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : statoWhatsappApk === 'sent' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{statoWhatsappApk === 'sent' ? 'WhatsApp + APK!' : 'WhatsApp + APK'}</span>
            </a>

            <a
              href={mailtoUrl}
              target="_top"
              rel="noopener noreferrer"
              onClick={() => syncDatabaseToServer()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>Email</span>
            </a>

            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => syncDatabaseToServer()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Gmail</span>
            </a>

            <a
              href={smsUrl}
              target="_top"
              onClick={() => syncDatabaseToServer()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>SMS</span>
            </a>
          </div>

          {statoWhatsappApk === 'sent' && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-950 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold">
                  Invio WhatsApp + File <span className="font-mono">{nomeFileApk}</span> avviato!
                </div>
                <div className="text-[10.5px] text-emerald-800">
                  Il file <span className="font-mono">{nomeFileApk}</span> e il link diretto all&apos;App vengono inviati direttamente nella chat WhatsApp del socio senza scaricare file sul tuo dispositivo.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER CON APERTURA DIRETTA PORTALE SOCIO */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleApriPortaleSocio}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Apri Portale Web come {socio.nome}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
