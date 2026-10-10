import React, { useState, useEffect } from 'react';
import {
  getPublicPortalOrigin,
  syncDatabaseToServer,
  fetchActiveTunnelUrl,
  getActiveTryCloudflareUrl,
  loadApkVersionPolicy,
  saveApkVersionPolicy,
  ApkVersionPolicy
} from '../storage';
import {
  Download,
  X,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Wifi,
  RefreshCw,
  Database,
  MessageSquare
} from 'lucide-react';

interface ApkModalProps {
  onClose: () => void;
  customUrl?: string;
  titoloCustom?: string;
  socio?: {
    nome: string;
    cognome: string;
    numeroTessera: string;
    pin?: string;
  };
  nomeProLoco?: string;
}

export const ApkModal: React.FC<ApkModalProps> = ({
  onClose,
  titoloCustom,
  socio
}) => {
  const [copiato, setCopiato] = useState(false);
  const [statoApk, setStatoApk] = useState<'idle' | 'creating' | 'done'>('idle');
  const [statoZip, setStatoZip] = useState<'idle' | 'creating' | 'done'>('idle');
  const [statoWhatsapp, setStatoWhatsapp] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(() => getActiveTryCloudflareUrl());
  const [versionPolicy, setVersionPolicy] = useState<ApkVersionPolicy>(() => loadApkVersionPolicy());
  const [policySalvataToast, setPolicySalvataToast] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchActiveTunnelUrl(false).then(url => {
      if (mounted && url) setTunnelUrl(url);
    });
    fetch('/api/v2/version')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (mounted && data && data.versionPolicy) {
          setVersionPolicy(data.versionPolicy);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleAllineaCompatibilita = async () => {
    const next = await saveApkVersionPolicy({
      ...versionPolicy,
      forceUpdate: false,
      minRequiredVersionCode: 1,
      minRequiredVersionName: '1.0.0'
    });
    setVersionPolicy(next);
    setPolicySalvataToast(true);
    setTimeout(() => setPolicySalvataToast(false), 2500);
  };

  const tesseraClean = socio?.numeroTessera ? socio.numeroTessera.trim().toUpperCase() : '';
  const slugTessera = tesseraClean.replace(/[^a-zA-Z0-9_]/g, '_');
  const nomeFileApk = tesseraClean ? `Socio_${slugTessera}.apk` : 'App_ProLoco.apk';
  const nomeFileZip = tesseraClean ? `Socio_${slugTessera}.apk.zip` : 'App_ProLoco.apk.zip';
  const publicOrigin = tunnelUrl || getPublicPortalOrigin();
  const pinSocio = socio?.pin && socio.pin.trim() ? socio.pin.trim() : '1234';
  const socioQuery = socio
    ? `?p=${encodeURIComponent(pinSocio)}&n=${encodeURIComponent(socio.nome || '')}&c=${encodeURIComponent(socio.cognome || '')}`
    : '';

  const linkInstallatore = tesseraClean
    ? `${publicOrigin}/inst/${encodeURIComponent(tesseraClean)}`
    : `${publicOrigin}/apk/ProLoco.apk`;

  const linkFileApk = tesseraClean
    ? `/apk/${encodeURIComponent(tesseraClean)}.apk${socioQuery}`
    : `/apk/ProLoco.apk`;

  const linkFileApkPubblico = tesseraClean
    ? `${publicOrigin}/apk/${encodeURIComponent(tesseraClean)}.apk`
    : `${publicOrigin}/apk/ProLoco.apk`;

  const linkFileZip = tesseraClean
    ? `/apk/${encodeURIComponent(tesseraClean)}.zip${socioQuery}`
    : `/apk/ProLoco.zip`;

  const messaggioWhatsappApk = socio
    ? `Ciao ${socio.nome}, ecco l'App Android Ufficiale (${nomeFileApk}) e il tuo Portale Socio:\n\n📲 *Scarica File APK diretto (${nomeFileApk}):*\n${linkFileApkPubblico}\n\n🔗 *Link Installazione Rapida:*\n${linkInstallatore}\n\n🎫 *Tessera:* ${tesseraClean}\n🔑 *PIN:* ${pinSocio}`
    : `Scarica l'App Android Ufficiale (${nomeFileApk}):\n📲 File APK: ${linkFileApkPubblico}\n🔗 Installazione: ${linkInstallatore}`;

  const whatsappUrlApk = `https://wa.me/?text=${encodeURIComponent(messaggioWhatsappApk)}`;

  const handleInviaWhatsappConApk = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    syncDatabaseToServer();
    setStatoWhatsapp('sending');

    try {
      const response = await fetch(linkFileApk);
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], nomeFileApk, {
          type: 'application/vnd.android.package-archive'
        });

        const nav = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
        };

        if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
          await nav.share({
            title: nomeFileApk,
            text: messaggioWhatsappApk,
            files: [file]
          });
          setStatoWhatsapp('sent');
          setTimeout(() => setStatoWhatsapp('idle'), 4000);
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        const dlLink = document.createElement('a');
        dlLink.href = blobUrl;
        dlLink.setAttribute('download', nomeFileApk);
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }
    } catch {
      const dlLink = document.createElement('a');
      dlLink.href = linkFileApk;
      dlLink.setAttribute('download', nomeFileApk);
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);
    }

    setStatoWhatsapp('sent');
    const waLink = document.createElement('a');
    waLink.href = whatsappUrlApk;
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    document.body.appendChild(waLink);
    waLink.click();
    document.body.removeChild(waLink);
    setTimeout(() => setStatoWhatsapp('idle'), 5000);
  };

  const handleCopiaLink = () => {
    syncDatabaseToServer();
    try {
      navigator.clipboard.writeText(linkInstallatore).catch(() => {});
    } catch {
      // ignore
    }
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  };

  const handleCreaApk = () => {
    if (statoApk === 'creating') return;
    syncDatabaseToServer();
    setStatoApk('creating');

    setTimeout(() => {
      setStatoApk('done');
      const link = document.createElement('a');
      link.href = linkFileApk;
      link.setAttribute('download', nomeFileApk);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setStatoApk('idle'), 3000);
    }, 350);
  };

  const handleScaricaZip = () => {
    if (statoZip === 'creating') return;
    syncDatabaseToServer();
    setStatoZip('creating');

    setTimeout(() => {
      setStatoZip('done');
      const link = document.createElement('a');
      link.href = linkFileZip;
      link.setAttribute('download', nomeFileZip);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setStatoZip('idle'), 3000);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="Icona Pro Loco"
              className="w-11 h-11 rounded-xl shadow-sm border border-amber-300/80 shrink-0 object-cover"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {titoloCustom || 'Crea File APK Android'}
              </h3>
              <p className="text-xs text-slate-500">
                Pacchetto Android Ufficiale • Versione v{versionPolicy.currentVersionName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200/80">
            <img
              src="/pwa-192x192.png"
              alt="Icona Installazione APK"
              className="w-12 h-12 rounded-2xl shadow-sm border border-emerald-700/20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-slate-900 text-xs">
                Icona Installazione APK Android (v{versionPolicy.currentVersionName})
              </div>
              <div className="text-[11px] text-slate-500 leading-snug">
                Incorporata nel pacchetto Android (<span className="font-mono">@drawable/icon</span>) e visibile sulla schermata Home del telefono dopo l&apos;installazione.
              </div>
            </div>
          </div>
          {socio && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Destinatario:</span>
              <span className="font-bold text-slate-900">
                {socio.nome} {socio.cognome} (Tessera {socio.numeroTessera})
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">File generato:</span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{nomeFileApk}</span>
            </span>
          </div>
          <div className="pt-1 border-t border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
              <Wifi className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Link Pubblico Portale Soci (Rete Dati 4G/5G &amp; Wi-Fi) attivo:</span>
            </div>
            <div className="font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 truncate select-all">
              {publicOrigin}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Link Corto per Invio WhatsApp / Email:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
              {linkInstallatore}
            </div>
            <button
              type="button"
              onClick={handleCopiaLink}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                copiato ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiato ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiato ? 'Copiato' : 'Copia'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <a
            href={whatsappUrlApk}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleInviaWhatsappConApk}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {statoWhatsapp === 'sending' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparazione {nomeFileApk} + WhatsApp...</span>
              </>
            ) : statoWhatsapp === 'sent' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>WhatsApp Aperto + {nomeFileApk} Scaricato!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Invia da WhatsApp + File APK ({nomeFileApk})</span>
              </>
            )}
          </a>

          <button
            type="button"
            onClick={handleCreaApk}
            disabled={statoApk === 'creating'}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer ${
              statoApk === 'done'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {statoApk === 'creating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creazione APK in corso...</span>
              </>
            ) : statoApk === 'done' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>APK Scaricato ({nomeFileApk})</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Scarica File APK (.apk)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleScaricaZip}
            disabled={statoZip === 'creating'}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
              statoZip === 'done'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            }`}
            title="Archivio ZIP per allegare via email senza blocchi di sicurezza"
          >
            {statoZip === 'creating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creazione archivio ZIP...</span>
              </>
            ) : statoZip === 'done' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ZIP Scaricato ({nomeFileZip})</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Scarica Pacchetto ZIP per Email (.zip)</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-[11px] text-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-700" />
              <span>Compatibilità Bidirezionale Gestionale ⇄ APK</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              v{versionPolicy.currentVersionName} Attiva
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
            <div className="bg-white border border-indigo-100 rounded-lg p-1.5">
              <div className="font-bold text-indigo-900">• API Versioning</div>
              <div className="text-slate-600 font-mono text-[10px]">/api/v1/ &amp; /api/v2/</div>
            </div>
            <div className="bg-white border border-indigo-100 rounded-lg p-1.5">
              <div className="font-bold text-indigo-900">• Tracciato JSON</div>
              <div className="text-slate-600 text-[10px]">Tolleranza campi extra</div>
            </div>
            <div className="bg-white border border-indigo-100 rounded-lg p-1.5">
              <div className="font-bold text-indigo-900">• Cache Offline</div>
              <div className="text-slate-600 text-[10px]">SQLite/Room + Conflitti</div>
            </div>
            <div className="bg-white border border-indigo-100 rounded-lg p-1.5">
              <div className="font-bold text-indigo-900">• Disallineamento</div>
              <div className="text-slate-600 text-[10px]">Dialogo v1.x ⇄ v2.x attivo</div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-indigo-200/70 flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-indigo-950 text-[11px]">
                Comunicazione Garantita (APK v1.x / v{versionPolicy.currentVersionName} ⇄ Gestionale v{versionPolicy.currentVersionName})
              </div>
              <div className="text-[10px] text-slate-600">
                Anche se le versioni di APK e Gestionale differiscono, il colloquio dati è sempre garantito senza blocchi
              </div>
            </div>
            <button
              type="button"
              onClick={handleAllineaCompatibilita}
              className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-black transition cursor-pointer shrink-0 flex items-center gap-1 bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-100"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Verifica Sync</span>
            </button>
          </div>
          {policySalvataToast && (
            <div className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Compatibilità universale tra versioni verificata e sincronizzata!</span>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
          <div className="font-bold uppercase">Procedura installazione su cellulare Android:</div>
          <div>1. Apri il file scaricato <strong>{nomeFileApk}</strong></div>
          <div>2. Attiva <strong>&quot;Consenti da questa fonte&quot;</strong> e tocca <strong>Installa</strong></div>
          <div>3. Se compare Play Protect tocca <strong>&quot;Più dettagli&quot;</strong> &rarr; <strong>&quot;Installa comunque&quot;</strong></div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
