import React, { useState } from 'react';
import { ProLocoInfo, Socio, ProLocoEvento, CategoriaEvento, SitoWebConfig, IscrizioneEvento } from '../types';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  PartyPopper, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Clock, 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  Share2, 
  Download, 
  LayoutDashboard, 
  Search, 
  Filter, 
  Compass, 
  BookOpen, 
  Check, 
  ExternalLink,
  Info,
  CalendarPlus,
  Send,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  X,
  UserCheck,
  User
} from 'lucide-react';

import { esportaCodiceSitoHTML } from '../storage';

interface PublicWebsitePortalProps {
  config: ProLocoInfo;
  soci: Socio[];
  eventi: ProLocoEvento[];
  sitoConfig?: SitoWebConfig;
  isEditorPreview?: boolean;
  onTornaAlGestionale?: () => void;
  onApriEditor?: () => void;
  onSbloccaAdmin?: (pin: string) => boolean;
  onNuovoSocioIscritto: (nuovoSocio: Socio) => void;
  onAggiornaEvento?: (evento: ProLocoEvento) => void;
  onApriPortaleSoci?: () => void;
}

export const PublicWebsitePortal: React.FC<PublicWebsitePortalProps> = ({
  config,
  soci,
  eventi,
  sitoConfig,
  isEditorPreview = false,
  onTornaAlGestionale,
  onApriEditor,
  onSbloccaAdmin,
  onNuovoSocioIscritto,
  onAggiornaEvento,
  onApriPortaleSoci
}) => {
  const [sezioneAttiva, setSezioneAttiva] = useState<'home' | 'eventi' | 'tesseramento' | 'territorio' | 'contatti'>('home');
  const [ricercaEvento, setRicercaEvento] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('tutte');
  const [copiatoLink, setCopiatoLink] = useState(false);
  const [moduloInviato, setModuloInviato] = useState(false);
  const [mostraPinModal, setMostraPinModal] = useState(false);
  const [pinInserito, setPinInserito] = useState('');
  const [pinErrore, setPinErrore] = useState(false);

  // Stato per l'iscrizione a un evento da parte di un socio
  const [eventoIscrizionePubblica, setEventoIscrizionePubblica] = useState<ProLocoEvento | null>(null);
  const [iscrizioneSocioId, setIscrizioneSocioId] = useState<string>('');
  const [iscrizioneNome, setIscrizioneNome] = useState<string>('');
  const [iscrizioneCognome, setIscrizioneCognome] = useState<string>('');
  const [iscrizioneTessera, setIscrizioneTessera] = useState<string>('');
  const [iscrizioneEmail, setIscrizioneEmail] = useState<string>('');
  const [iscrizioneTelefono, setIscrizioneTelefono] = useState<string>('');
  const [iscrizioneNote, setIscrizioneNote] = useState<string>('');
  const [iscrizioneSuccesso, setIscrizioneSuccesso] = useState<boolean>(false);

  const handleVerificaPin = (e: React.FormEvent) => {
    e.preventDefault();
    const pinCorretto = sitoConfig?.pinSbloccoAdmin || '1234';
    if (pinInserito.trim() === pinCorretto.trim()) {
      setPinErrore(false);
      setMostraPinModal(false);
      if (onSbloccaAdmin) {
        onSbloccaAdmin(pinInserito);
      } else if (onTornaAlGestionale) {
        onTornaAlGestionale();
      }
    } else {
      setPinErrore(true);
    }
  };

  // Stato per il modulo di tesseramento online
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    dataNascita: '',
    luogoNascita: '',
    indirizzo: '',
    cap: config.cap || '',
    citta: config.comune || '',
    provincia: config.provincia || '',
    telefono: '',
    email: '',
    categoria: 'Ordinario' as 'Ordinario' | 'Sostenitore' | 'Giovane',
    competenze: [] as string[],
    consensoPrivacy: false,
  });

  // Filtro eventi pubblici (esclude annullati se desiderato)
  const eventiPubblici = eventi.filter(e => {
    const matchRicerca = e.titolo.toLowerCase().includes(ricercaEvento.toLowerCase()) ||
                         e.descrizione.toLowerCase().includes(ricercaEvento.toLowerCase()) ||
                         e.luogo.toLowerCase().includes(ricercaEvento.toLowerCase());
    const matchCategoria = categoriaFiltro === 'tutte' || e.categoria === categoriaFiltro;
    return matchRicerca && matchCategoria;
  }).sort((a, b) => new Date(a.dataInizio).getTime() - new Date(b.dataInizio).getTime());

  // Prossimi 3 eventi in evidenza per la Home
  const eventiInEvidenza = eventi
    .filter(e => e.stato !== 'annullato')
    .sort((a, b) => new Date(a.dataInizio).getTime() - new Date(b.dataInizio).getTime())
    .slice(0, 3);

  const direttivo = soci.filter(s => s.ruoloDirettivo && s.ruoloDirettivo !== 'Nessuno');

  const handleCopiaLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiatoLink(true);
    setTimeout(() => setCopiatoLink(false), 2500);
  };

  const toggleCompetenza = (comp: string) => {
    setFormData(prev => ({
      ...prev,
      competenze: prev.competenze.includes(comp)
        ? prev.competenze.filter(c => c !== comp)
        : [...prev.competenze, comp]
    }));
  };

  const handleSubmitTesseramento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.cognome || !formData.codiceFiscale || !formData.email || !formData.telefono) {
      alert('Per favore compila tutti i campi anagrafici obbligatori.');
      return;
    }
    if (!formData.consensoPrivacy) {
      alert('È necessario accettare l\'informativa sul trattamento dei dati personali.');
      return;
    }

    const annoAttuale = new Date().getFullYear();
    const nuovoId = `socio-web-${Date.now()}`;
    const nuovoNumeroTessera = `PL-${annoAttuale}-${String(soci.length + 1).padStart(3, '0')}`;

    const nuovoSocio: Socio = {
      id: nuovoId,
      numeroTessera: nuovoNumeroTessera,
      nome: formData.nome.trim(),
      cognome: formData.cognome.trim(),
      codiceFiscale: formData.codiceFiscale.toUpperCase().trim(),
      dataNascita: formData.dataNascita,
      luogoNascita: formData.luogoNascita.trim(),
      indirizzo: formData.indirizzo.trim(),
      cap: formData.cap.trim(),
      citta: formData.citta.trim(),
      provincia: formData.provincia.toUpperCase().trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      categoria: formData.categoria,
      ruoloDirettivo: 'Nessuno',
      dataIscrizione: new Date().toISOString().split('T')[0],
      attivo: true,
      consensoPrivacy: true,
      competenzeVolontariato: formData.competenze,
      note: 'Richiesta di tesseramento registrata tramite il portale web pubblico.',
      quote: [] // Quota da perfezionare presso la segreteria
    };

    onNuovoSocioIscritto(nuovoSocio);
    setModuloInviato(true);
  };

  // Funzione per esportare il sito pubblico come file HTML autonomo
  const handleEsportaCodiceSito = () => {
    esportaCodiceSitoHTML(config, eventi, soci, sitoConfig);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* BARRA SUPERIORE DI CONTROLLO AMMINISTRATIVO (Nascosta se il sito è blindato per visitatori) */}
      {!sitoConfig?.blindatoVisitatori && !isEditorPreview && (
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Vista Sito Web Pubblico (Bozza / Non ancora blindato)
            </span>
            <span className="hidden md:inline text-slate-400">
              I contenuti sono sincronizzati con il gestionale
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pulsante Apri Editor */}
            {onApriEditor && (
              <button
                id="btn-apri-editor-dalla-vista"
                onClick={onApriEditor}
                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow-xs cursor-pointer text-[11.5px]"
                title="Apri l'editor dedicato per modificare testi, copertina o blindare il sito"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apri Editor Sito</span>
              </button>
            )}

            {/* Esporta Sito Autonomo */}
            <button
              id="btn-esporta-sito-html"
              onClick={handleEsportaCodiceSito}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer text-[11.5px] font-medium"
              title="Scarica il sito web come file HTML autonomo pronto da caricare su qualsiasi hosting (Aruba, Vercel, ecc.)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Esporta Sito HTML</span>
            </button>

            {/* Copia Link */}
            <button
              id="btn-copia-link-portale"
              onClick={handleCopiaLink}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer text-[11.5px] font-medium"
              title="Copia l'indirizzo web da condividere con il pubblico"
            >
              {copiatoLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiatoLink ? 'Link Copiato!' : 'Condividi'}</span>
            </button>

            {/* Ritorno alla Dashboard */}
            {onTornaAlGestionale && (
              <button
                id="btn-torna-gestionale"
                onClick={onTornaAlGestionale}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-colors shadow-xs cursor-pointer text-[11.5px]"
                title="Torna alla Dashboard Generale"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>← Dashboard</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* BANNER AVVISO UFFICIALE CITTADINI */}
      {sitoConfig?.mostraAvviso && sitoConfig?.avvisoImportante && (
        <div className={`py-2 px-4 text-center text-xs font-bold border-b flex items-center justify-center gap-2 ${
          sitoConfig.tipoAvviso === 'warning'
            ? 'bg-amber-100 text-amber-900 border-amber-300'
            : sitoConfig.tipoAvviso === 'evento'
            ? 'bg-purple-100 text-purple-900 border-purple-300'
            : sitoConfig.tipoAvviso === 'info'
            ? 'bg-sky-100 text-sky-900 border-sky-300'
            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
        }`}>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-white/70 font-black shadow-2xs">
            Comunicazione Ufficiale
          </span>
          <span>{sitoConfig.avvisoImportante}</span>
        </div>
      )}

      {/* HEADER DEL SITO PUBBLICO */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Logo e Nome */}
            <div 
              onClick={() => setSezioneAttiva('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight tracking-tight block group-hover:text-emerald-800 transition-colors">
                  {config.nome}
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {config.comune} ({config.provincia}) • Terzo Settore
                </span>
              </div>
            </div>

            {/* Menu Navigazione Desktop */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => setSezioneAttiva('home')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  sezioneAttiva === 'home' ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setSezioneAttiva('eventi')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  sezioneAttiva === 'eventi' ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Eventi & Sagre</span>
                <span className="px-1.5 py-0.2 bg-emerald-700 text-white rounded-full text-[10px]">
                  {eventi.length}
                </span>
              </button>
              <button
                onClick={() => setSezioneAttiva('tesseramento')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  sezioneAttiva === 'tesseramento' ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Diventa Socio</span>
              </button>
              <button
                onClick={() => setSezioneAttiva('territorio')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  sezioneAttiva === 'territorio' ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Territorio & Tradizioni
              </button>
              <button
                onClick={() => setSezioneAttiva('contatti')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  sezioneAttiva === 'contatti' ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Contatti & Trasparenza
              </button>
            </nav>

            {/* Pulsante CTA Tesseramento Rapido & Area Soci */}
            <div className="flex items-center gap-2">
              {onApriPortaleSoci && (
                <button
                  type="button"
                  id="btn-nav-area-soci"
                  onClick={onApriPortaleSoci}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                  title="Accedi all'Area Riservata Soci per consultare tessera digitale, stato quote e avvisi"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Area Soci</span>
                </button>
              )}

              <button
                onClick={() => setSezioneAttiva('tesseramento')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tesseramento {config.annoCorrente || new Date().getFullYear()}</span>
              </button>
            </div>

          </div>

          {/* Menu Mobile */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <button 
              onClick={() => setSezioneAttiva('home')} 
              className={`py-1 px-2 rounded-lg ${sezioneAttiva === 'home' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => setSezioneAttiva('eventi')} 
              className={`py-1 px-2 rounded-lg ${sezioneAttiva === 'eventi' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
            >
              Eventi
            </button>
            <button 
              onClick={() => setSezioneAttiva('tesseramento')} 
              className={`py-1 px-2 rounded-lg ${sezioneAttiva === 'tesseramento' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
            >
              Iscriviti
            </button>
            {onApriPortaleSoci && (
              <button 
                onClick={onApriPortaleSoci}
                className="py-1 px-2 rounded-lg text-emerald-900 font-bold bg-emerald-50"
              >
                Area Soci
              </button>
            )}
            <button 
              onClick={() => setSezioneAttiva('territorio')} 
              className={`py-1 px-2 rounded-lg ${sezioneAttiva === 'territorio' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
            >
              Territorio
            </button>
            <button 
              onClick={() => setSezioneAttiva('contatti')} 
              className={`py-1 px-2 rounded-lg ${sezioneAttiva === 'contatti' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
            >
              Contatti
            </button>
          </div>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE DEL SITO */}
      <main className="flex-1">

        {/* 1. SEZIONE HOME */}
        {sezioneAttiva === 'home' && (
          <div className="space-y-12 pb-16">
            
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
              {sitoConfig?.immagineCopertina && (
                <img
                  src={sitoConfig.immagineCopertina}
                  alt="Copertina"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-emerald-950/85 to-slate-950"></div>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative max-w-4xl mx-auto text-center space-y-6">
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Associazione Turistica di Promozione Sociale • Terzo Settore RUNTS
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  {sitoConfig?.titoloHero ? (
                    sitoConfig.titoloHero
                  ) : (
                    <>
                      Vivi le tradizioni e la bellezza di <br />
                      <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy">
                        {config.comune}
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-base sm:text-lg text-emerald-100/90 font-normal max-w-2xl mx-auto leading-relaxed italic">
                  «{sitoConfig?.sottotitoloHero || sitoConfig?.mottoPersonalizzato || config.motto || 'Custodi delle tradizioni popolari, promotori del territorio e del patrimonio culturale.'}»
                </p>

                {/* Pulsanti Rapidi Hero */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setSezioneAttiva('eventi')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm rounded-xl transition-transform hover:scale-102 shadow-lg cursor-pointer flex items-center gap-2"
                  >
                    <PartyPopper className="w-4 h-4" />
                    <span>Esplora il Calendario Eventi</span>
                  </button>

                  <button
                    onClick={() => setSezioneAttiva('tesseramento')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Richiedi la Tessera Socio</span>
                  </button>
                </div>

                {/* Box Statistiche Territorio */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-emerald-800/60 max-w-3xl mx-auto text-left">
                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-700/30">
                    <span className="text-[11px] text-emerald-300 font-medium block">Soci Iscritti</span>
                    <span className="text-xl sm:text-2xl font-black text-white">{soci.length}</span>
                  </div>
                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-700/30">
                    <span className="text-[11px] text-emerald-300 font-medium block">Eventi in Calendario</span>
                    <span className="text-xl sm:text-2xl font-black text-white">{eventi.length}</span>
                  </div>
                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-700/30">
                    <span className="text-[11px] text-emerald-300 font-medium block">Riconoscimento</span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-1 block truncate">UNPLI & RUNTS</span>
                  </div>
                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-700/30">
                    <span className="text-[11px] text-emerald-300 font-medium block">Anno Sociale</span>
                    <span className="text-xl sm:text-2xl font-black text-white">{config.annoCorrente}</span>
                  </div>
                </div>

              </div>
            </section>

            {/* Messaggio di Benvenuto personalizzato */}
            {sitoConfig?.testoBenvenuto && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs text-center space-y-2">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Messaggio dalla Pro Loco
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl mx-auto font-medium">
                    «{sitoConfig.testoBenvenuto}»
                  </p>
                  <p className="text-xs text-slate-500 font-semibold pt-1">
                    Il Presidente <span className="text-slate-900 font-bold">{config.nomePresidente}</span> & il Consiglio Direttivo
                  </p>
                </div>
              </div>
            )}

            {/* Eventi in Evidenza */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    In primo piano
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Prossime Manifestazioni & Sagre
                  </h2>
                </div>
                <button
                  onClick={() => setSezioneAttiva('eventi')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Tutti gli eventi ({eventi.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {eventiInEvidenza.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {eventiInEvidenza.map((ev) => (
                    <div 
                      key={ev.id}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                    >
                      {/* Badge Categoria */}
                      <div className="h-3 bg-emerald-700"></div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {ev.categoria}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-emerald-800 transition-colors">
                            {ev.titolo}
                          </h3>
                          <div className="space-y-1 text-xs text-slate-600 pt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold">{ev.dataInizio}</span>
                              {ev.oraInizio && <span>• ore {ev.oraInizio}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="truncate">{ev.luogo}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-3 pt-2 leading-relaxed">
                            {ev.descrizione || 'Partecipa alla nostra iniziativa nel cuore del territorio!'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setSezioneAttiva('eventi')}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Dettagli evento</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {ev.iscrizioniAperte !== false && (
                            <button
                              type="button"
                              onClick={() => {
                                setEventoIscrizionePubblica(ev);
                                setIscrizioneSuccesso(false);
                                setIscrizioneSocioId('');
                                setIscrizioneNome('');
                                setIscrizioneCognome('');
                                setIscrizioneTessera('');
                                setIscrizioneNote('');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Iscriviti</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Nessun evento al momento in calendario.</p>
                </div>
              )}
            </section>

            {/* Banner Campagna Tesseramento */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-10 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-white/20 text-emerald-100 uppercase tracking-wide">
                    Campagna Adesioni {config.annoCorrente}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Sostieni {config.comune}, diventa socio Pro Loco!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-light">
                    Essere socio Pro Loco significa amare il proprio paese, sostenere le feste, la cultura e far parte di una grande comunità attiva di volontari.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSezioneAttiva('tesseramento')}
                    className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>Iscriviti Online Adesso</span>
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* 2. SEZIONE CALENDARIO COMPLETO EVENTI */}
        {sezioneAttiva === 'eventi' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Intestazione Sezione */}
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Iniziative & Territorio
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Calendario Ufficiale Eventi & Sagre
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                Tutte le manifestazioni, fiere gastronomiche, rassegne musicali e visite guidate organizzate dalla Pro Loco a {config.comune}.
              </p>
            </div>

            {/* Barra Ricerca e Filtro Categorie */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca evento per titolo, luogo o parola chiave..."
                  value={ricercaEvento}
                  onChange={(e) => setRicercaEvento(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="w-full md:w-auto text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="tutte">Tutte le Categorie</option>
                  <option value="Enogastronomia & Sagra">Enogastronomia & Sagra</option>
                  <option value="Festa Tradizionale & Patronale">Festa Patronale & Tradizionale</option>
                  <option value="Musica, Spettacolo & Teatro">Musica, Spettacolo & Teatro</option>
                  <option value="Cultura, Arte & Mostre">Cultura, Arte & Mostre</option>
                  <option value="Visita Guidata & Escursione">Visita Guidata & Escursione</option>
                  <option value="Mercatino & Fiera Tipica">Mercatino & Fiera Tipica</option>
                  <option value="Sport & Tempo Libero">Sport & Tempo Libero</option>
                </select>
              </div>
            </div>

            {/* Griglia Eventi */}
            {eventiPubblici.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventiPubblici.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                  >
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-lg">
                            {ev.categoria}
                          </span>
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                            ev.stato === 'in_corso' ? 'bg-emerald-100 text-emerald-800' :
                            ev.stato === 'concluso' ? 'bg-slate-100 text-slate-600' :
                            'bg-teal-50 text-teal-800'
                          }`}>
                            {ev.stato === 'in_corso' ? '● In Corso' :
                             ev.stato === 'concluso' ? 'Concluso' : 'In Programma'}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                          {ev.titolo}
                        </h3>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span><strong>Data:</strong> {ev.dataInizio} {ev.dataFine && ev.dataFine !== ev.dataInizio ? `fino al ${ev.dataFine}` : ''}</span>
                          </div>
                          {ev.oraInizio && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span><strong>Orario:</strong> dalle {ev.oraInizio} {ev.oraFine ? `alle ${ev.oraFine}` : ''}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span><strong>Luogo:</strong> {ev.luogo}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {ev.descrizione || 'Informazioni e programma dettagliato a cura della Pro Loco.'}
                        </p>

                        {/* Sezione Adesione e Iscrizione Evento */}
                        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-emerald-950 block text-[11px] flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                              {ev.iscrizioniAperte !== false ? 'Iscrizioni Aperte per i Soci' : 'Iscrizioni Chiuse'}
                            </span>
                            <span className="text-[10.5px] text-emerald-700 block mt-0.5">
                              {ev.quotaIscrizioneSocio ? `Quota: ${ev.quotaIscrizioneSocio} €` : 'Partecipazione Gratuita'}
                              {ev.postiMassimi ? ` • Posti rimasti: ${Math.max(0, ev.postiMassimi - (ev.iscrizioni?.length || 0))}` : ''}
                            </span>
                          </div>

                          {ev.iscrizioniAperte !== false && (
                            <button
                              type="button"
                              onClick={() => {
                                setEventoIscrizionePubblica(ev);
                                setIscrizioneSuccesso(false);
                                setIscrizioneSocioId('');
                                setIscrizioneNome('');
                                setIscrizioneCognome('');
                                setIscrizioneTessera('');
                                setIscrizioneNote('');
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              Iscriviti
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Ingresso libero</span>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: ev.titolo,
                                text: `${ev.titolo} a ${ev.luogo} (${ev.dataInizio}) - Pro Loco ${config.comune}`,
                                url: window.location.href,
                              }).catch(() => {});
                            } else {
                              handleCopiaLink();
                            }
                          }}
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Condividi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Nessun evento trovato</h3>
                <p className="text-xs text-slate-500">Prova a modificare i filtri di ricerca o la categoria.</p>
              </div>
            )}

          </div>
        )}

        {/* 3. SEZIONE TESSERAMENTO & PRE-ISCRIZIONE ONLINE */}
        {sezioneAttiva === 'tesseramento' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Intestazione */}
            <div className="text-center space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Tesseramento Ufficiale {config.annoCorrente}
              </span>
              <h2 className="text-3xl font-black text-slate-900">
                Diventa Socio della {config.nome}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Unisciti alla nostra associazione di promozione sociale. Compilando il modulo sottostante, la tua richiesta verrà registrata e inviata direttamente alla segreteria della Pro Loco.
              </p>
            </div>

            {/* Piani Quote Associative */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                formData.categoria === 'Ordinario' ? 'border-emerald-700 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
                onClick={() => setFormData(prev => ({ ...prev, categoria: 'Ordinario' }))}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase text-slate-500">Socio Ordinario</span>
                  {formData.categoria === 'Ordinario' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">{config.quotaStandardOrdinario} €</span>
                  <span className="text-xs text-slate-500"> / anno</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-tight">
                  Diritto di voto in assemblea, tessera del socio e sconti convenzioni territoriali.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                formData.categoria === 'Sostenitore' ? 'border-emerald-700 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
                onClick={() => setFormData(prev => ({ ...prev, categoria: 'Sostenitore' }))}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase text-slate-500">Socio Sostenitore</span>
                  {formData.categoria === 'Sostenitore' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-emerald-800">{config.quotaStandardSostenitore} €</span>
                  <span className="text-xs text-slate-500"> / anno</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-tight">
                  Per chi desidera dare un contributo speciale al finanziamento delle manifestazioni.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                formData.categoria === 'Giovane' ? 'border-emerald-700 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
                onClick={() => setFormData(prev => ({ ...prev, categoria: 'Giovane' }))}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase text-slate-500">Socio Giovane (Under 25)</span>
                  {formData.categoria === 'Giovane' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-teal-800">{config.quotaStandardGiovane} €</span>
                  <span className="text-xs text-slate-500"> / anno</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-tight">
                  Tariffa agevolata riservata a ragazzi e studenti per avvicinarsi al volontariato.
                </p>
              </div>
            </div>

            {/* Messaggio Conferma Invio Modulo */}
            {moduloInviato ? (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-950">
                  Richiesta di Iscrizione Inviata con Successo!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Grazie <strong>{formData.nome} {formData.cognome}</strong>! I tuoi dati sono stati registrati nella segreteria della Pro Loco.
                </p>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 max-w-md mx-auto">
                  Potrai perfezionare la quota sociale di <strong>
                    {formData.categoria === 'Ordinario' ? config.quotaStandardOrdinario :
                     formData.categoria === 'Sostenitore' ? config.quotaStandardSostenitore : config.quotaStandardGiovane} €
                  </strong> direttamente presso la sede in <strong>{config.indirizzo}</strong> o tramite bonifico.
                </div>
                <button
                  onClick={() => {
                    setModuloInviato(false);
                    setFormData({
                      nome: '',
                      cognome: '',
                      codiceFiscale: '',
                      dataNascita: '',
                      luogoNascita: '',
                      indirizzo: '',
                      cap: config.cap,
                      citta: config.comune,
                      provincia: config.provincia,
                      telefono: '',
                      email: '',
                      categoria: 'Ordinario',
                      competenze: [],
                      consensoPrivacy: false,
                    });
                  }}
                  className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
                >
                  Invia un'altra domanda
                </button>
              </div>
            ) : (
              /* Modulo Interattivo Domanda di Iscrizione */
              <form onSubmit={handleSubmitTesseramento} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Modulo Anagrafico di Adesione
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mario"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cognome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Rossi"
                      value={formData.cognome}
                      onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Codice Fiscale *</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="RSSMRA80A01F205X"
                      value={formData.codiceFiscale}
                      onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Data di Nascita</label>
                    <input
                      type="date"
                      value={formData.dataNascita}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataNascita: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Luogo di Nascita</label>
                    <input
                      type="text"
                      placeholder="Comune o Stato estero"
                      value={formData.luogoNascita}
                      onChange={(e) => setFormData(prev => ({ ...prev, luogoNascita: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Indirizzo di Residenza</label>
                    <input
                      type="text"
                      placeholder="Via / Piazza e N. Civico"
                      value={formData.indirizzo}
                      onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Comune</label>
                      <input
                        type="text"
                        value={formData.citta}
                        onChange={(e) => setFormData(prev => ({ ...prev, citta: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Prov.</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.provincia}
                        onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Telefono / Cellulare *</label>
                    <input
                      type="tel"
                      required
                      placeholder="333 1234567"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Indirizzo Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="mario.rossi@email.it"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Disponibilità Volontariato */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800">
                    Vuoi dare una mano come volontario attivo? (Seleziona le tue preferenze)
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      'Cucina & Stand Gastronomico',
                      'Allestimento & Logistica',
                      'Accoglienza & Info Point Turistico',
                      'Comunicazione & Social Media',
                      'Fotografia & Riprese Video',
                      'Servizio Bar & Cassa'
                    ].map(comp => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => toggleCompetenza(comp)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          formData.competenze.includes(comp)
                            ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {formData.competenze.includes(comp) ? '✓ ' : '+ '} {comp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dichiarazione Privacy */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed">
                    <input
                      type="checkbox"
                      required
                      checked={formData.consensoPrivacy}
                      onChange={(e) => setFormData(prev => ({ ...prev, consensoPrivacy: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>
                      Dichiaro di condividere le finalità istituzionali dell'Associazione Pro Loco, di rispettare lo Statuto sociale e autorizzo il trattamento dei miei dati personali ai sensi del GDPR UE 2016/679 per le finalità associative.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Invia Domanda di Tesseramento</span>
                </button>

              </form>
            )}

          </div>
        )}

        {/* 4. SEZIONE TERRITORIO & TRADIZIONI */}
        {sezioneAttiva === 'territorio' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            <div className="space-y-2 border-b border-slate-200 pb-4 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Patrimonio & Cultura
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Scopri {config.comune} e le sue Eccellenze
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                La Pro Loco è impegnata ogni giorno nella riscoperta dei sentieri storici, delle ricette della tradizione e dei tesori artistici del nostro borgo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sitoConfig.schedeTerritorio && sitoConfig.schedeTerritorio.length > 0 ? (
                sitoConfig.schedeTerritorio.map((sch) => (
                  <div key={sch.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col">
                    {sch.immagine && (
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                        <img 
                          src={sch.immagine} 
                          alt={sch.titolo} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                          {sch.categoria || 'monumento'}
                        </span>
                      </div>
                    )}
                    <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{sch.titolo}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mt-2">{sch.descrizione}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      🏰
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Borgo Storico & Monumenti</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Passeggia tra i vicoli del centro medievale, ammira le piazze panoramiche e visita gli edifici di valore storico guidato dalle tabelle informative e dalle visite guidate curate dai volontari.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      🍷
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Enogastronomia & Piatti Tipici</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Le sagre popolari sono l'occasione perfetta per gustare le autentiche ricette della nostra cucina contadina, accompagnate dai vini e dai prodotti a km zero delle aziende locali.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                      🌿
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Natura & Sentieri Escursionistici</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Itinerari per trekking e mountain bike che attraversano le colline e i boschi circostanti, adatti a famiglie e appassionati dell'outdoor e del turismo lento e sostenibile.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Info Point */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-slate-900 text-base">Punto Informazioni Turistiche</h4>
                <p className="text-xs text-slate-600">
                  Passa a trovarci in sede per mappe, depliant illustrativi e consigli personalizzati per visitare la zona.
                </p>
              </div>
              <button
                onClick={() => setSezioneAttiva('contatti')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition cursor-pointer shrink-0"
              >
                Orari e Recapiti Sede
              </button>
            </div>

          </div>
        )}

        {/* 5. SEZIONE CONTATTI, TRASPARENZA & DIRETTIVO */}
        {sezioneAttiva === 'contatti' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            <div className="space-y-2 border-b border-slate-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Istituzione & Contatti
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Sede, Organi Sociali & Trasparenza
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Tutti i riferimenti legali e i contatti diretti dell'Associazione Pro Loco.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box Contatti Diretti */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <h3 className="font-extrabold text-slate-900 text-base">Recapiti Istituzionali</h3>
                
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900">Sede Sociale:</span>
                      <span>{config.indirizzo}, {config.cap} {config.comune} ({config.provincia})</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900">Telefono & WhatsApp:</span>
                      <span>{config.telefono}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900">Posta Elettronica:</span>
                      <span>{config.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900">Sito Web & Social:</span>
                      <span>{config.sitoWeb || 'proloco.online'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <p>Codice Fiscale: <strong className="font-mono text-slate-800">{config.codiceFiscale}</strong></p>
                  {config.partitaIva && <p>Partita IVA: <strong className="font-mono text-slate-800">{config.partitaIva}</strong></p>}
                  {config.codiceUnpli && <p>Iscrizione UNPLI: <strong className="text-emerald-800">{config.codiceUnpli}</strong></p>}
                  {config.numeroRunts && <p>Registro Unico Terzo Settore: <strong className="text-emerald-800">{config.numeroRunts}</strong></p>}
                </div>
              </div>

              {/* Consiglio Direttivo */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Consiglio Direttivo in Carica</h3>
                  <span className="text-xs text-slate-400">Anno {config.annoCorrente}</span>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                    {config.nomePresidente.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Presidente Legale Rappresentante</span>
                    <span className="text-sm font-black text-slate-900">{config.nomePresidente}</span>
                  </div>
                </div>

                {direttivo.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-600 block">Altri Componenti del Direttivo:</span>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {direttivo.map(membro => (
                        <div key={membro.id} className="p-2.5 flex items-center justify-between text-xs bg-slate-50/50">
                          <span className="font-bold text-slate-800">{membro.cognome} {membro.nome}</span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-emerald-800 rounded-md text-[10.5px] font-semibold">
                            {membro.ruoloDirettivo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Membri del direttivo registrati a sistema.</p>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER DEL SITO PUBBLICO */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-black text-lg text-white">{config.nome}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Associazione Turistica di Promozione Sociale operante nel Terzo Settore per la salvaguardia delle tradizioni e lo sviluppo della comunità locale.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white text-sm block">Sede e Contatti</span>
              <p>📍 {config.indirizzo}, {config.comune} ({config.provincia})</p>
              <p>📞 Tel: {config.telefono}</p>
              <p>✉️ Email: {config.email}</p>
            </div>

            {/* Colonna 3: Se NON blindato mostra accesso amministratore, se blindato mostra orari e social */}
            {!sitoConfig?.blindatoVisitatori ? (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-white text-sm block">Accesso Amministratori</span>
                <p className="text-slate-400">
                  Se fai parte del consiglio direttivo o della segreteria, accedi al gestionale per registrare quote o modificare eventi.
                </p>
                {onTornaAlGestionale && (
                  <button
                    id="btn-footer-torna-gestionale"
                    onClick={onTornaAlGestionale}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl border border-slate-700 transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Pannello Gestionale Pro Loco</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <span className="font-bold text-white text-sm block">Orari & Canali Ufficiali</span>
                <p>🕒 {sitoConfig?.orariAperturaSede || 'Orari Sede: Lun - Ven 09:30 - 12:30'}</p>
                <div className="flex flex-col gap-1 text-slate-400">
                  {sitoConfig?.linkWhatsApp && <span>💬 Info WhatsApp: {sitoConfig.linkWhatsApp}</span>}
                  {sitoConfig?.linkFacebook && <span>🌐 Pagina Facebook Attiva</span>}
                  {sitoConfig?.linkInstagram && <span>📸 Canale Instagram Attivo</span>}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} {config.nome} • C.F. {config.codiceFiscale}
            </div>
            <div className="flex items-center gap-4">
              <span>UNPLI Nazionale</span>
              <span>•</span>
              <span>RUNTS</span>
              <span>•</span>
              <button
                onClick={handleEsportaCodiceSito}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Scarica Sito HTML
              </button>
              
              {/* Pulsante discreto di sblocco per il direttivo */}
              <span>•</span>
              <button
                id="btn-sblocca-admin-discreto"
                onClick={() => {
                  setPinInserito('');
                  setPinErrore(false);
                  setMostraPinModal(true);
                }}
                className="text-slate-600 hover:text-slate-400 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Accesso riservato membri del direttivo (Richiede PIN)"
              >
                <Lock className="w-3 h-3" />
                <span>Area Riservata</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* MODALE INSERIMENTO PIN PER SBLOCCO AMMINISTRATIVO */}
      {mostraPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Accesso Direttivo</h3>
                  <p className="text-[11px] text-slate-500">Sblocco Gestionale & Editor</p>
                </div>
              </div>
              <button
                onClick={() => setMostraPinModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Il sito è blindato in modalità visitatori. Inserisci il PIN di sblocco impostato nell'editor (predefinito: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">1234</code>) per tornare alla gestione.
            </p>

            <form onSubmit={handleVerificaPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  maxLength={10}
                  value={pinInserito}
                  onChange={(e) => {
                    setPinInserito(e.target.value);
                    setPinErrore(false);
                  }}
                  placeholder="Inserisci PIN (es. 1234)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-widest text-lg font-bold font-mono focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                {pinErrore && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1.5 justify-center">
                    <AlertCircle className="w-3.5 h-3.5" />
                    PIN non corretto. Riprova.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMostraPinModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Sblocca</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modale Iscrizione Evento per il Pubblico / Soci */}
      {eventoIscrizionePubblica && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Header Modale */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500 text-slate-950">
                  {eventoIscrizionePubblica.categoria}
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  Iscrizione Partecipante all'Evento
                </h3>
                <p className="text-xs text-slate-300">
                  {eventoIscrizionePubblica.titolo} • {eventoIscrizionePubblica.dataInizio}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEventoIscrizionePubblica(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {iscrizioneSuccesso ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Iscrizione Registrata con Successo!</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    La tua adesione per l'evento <strong>{eventoIscrizionePubblica.titolo}</strong> è stata acquisita e inserita nel registro presenze della Pro Loco.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1">
                  <div><strong>Data Evento:</strong> {eventoIscrizionePubblica.dataInizio} {eventoIscrizionePubblica.oraInizio ? `alle ${eventoIscrizionePubblica.oraInizio}` : ''}</div>
                  <div><strong>Luogo:</strong> {eventoIscrizionePubblica.luogo}</div>
                  <div><strong>Quota dovuta:</strong> {eventoIscrizionePubblica.quotaIscrizioneSocio ? `${eventoIscrizionePubblica.quotaIscrizioneSocio} €` : 'Gratuito per i Soci'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEventoIscrizionePubblica(null)}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Chiudi e Torna al Portale
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  let socioTarget = soci.find(s => s.id === iscrizioneSocioId);
                  if (!socioTarget && iscrizioneTessera.trim()) {
                    socioTarget = soci.find(s => s.numeroTessera.toLowerCase() === iscrizioneTessera.trim().toLowerCase());
                  }

                  const socioIdFinale = socioTarget ? socioTarget.id : (iscrizioneSocioId || `socio-online-${Date.now()}`);
                  
                  const nuovaIscrizione: IscrizioneEvento = {
                    id: `iscr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    socioId: socioIdFinale,
                    dataIscrizione: new Date().toISOString().split('T')[0],
                    statoPresenza: 'da_verificare',
                    ruolo: 'partecipante',
                    quotaVersata: eventoIscrizionePubblica.quotaIscrizioneSocio || 0,
                    note: iscrizioneNote ? `${iscrizioneNote} (Online da portale web)` : 'Online da portale web'
                  };

                  const eventoAggiornato: ProLocoEvento = {
                    ...eventoIscrizionePubblica,
                    iscrizioni: [...(eventoIscrizionePubblica.iscrizioni || []), nuovaIscrizione]
                  };

                  if (onAggiornaEvento) {
                    onAggiornaEvento(eventoAggiornato);
                  }

                  setIscrizioneSuccesso(true);
                }}
                className="p-5 space-y-4"
              >
                {/* Selezione se è un socio registrato o nuovo socio/ospite */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Sei già nell'anagrafica soci della Pro Loco?
                  </label>
                  <select
                    value={iscrizioneSocioId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setIscrizioneSocioId(id);
                      const s = soci.find(item => item.id === id);
                      if (s) {
                        setIscrizioneNome(s.nome);
                        setIscrizioneCognome(s.cognome);
                        setIscrizioneTessera(s.numeroTessera);
                        setIscrizioneEmail(s.email || '');
                        setIscrizioneTelefono(s.telefono || '');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="">-- Seleziona il tuo nominativo dall'elenco soci --</option>
                    {soci.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.cognome} {s.nome} (Tessera: {s.numeroTessera})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-bold uppercase">oppure compila i tuoi dati</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Cognome *</label>
                    <input
                      type="text"
                      required
                      value={iscrizioneCognome}
                      onChange={(e) => setIscrizioneCognome(e.target.value)}
                      placeholder="es. Rossi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Nome *</label>
                    <input
                      type="text"
                      required
                      value={iscrizioneNome}
                      onChange={(e) => setIscrizioneNome(e.target.value)}
                      placeholder="es. Mario"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">N° Tessera Socio</label>
                    <input
                      type="text"
                      value={iscrizioneTessera}
                      onChange={(e) => setIscrizioneTessera(e.target.value)}
                      placeholder="es. 2026-042 (se posseduta)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">Telefono / Cellulare</label>
                    <input
                      type="tel"
                      value={iscrizioneTelefono}
                      onChange={(e) => setIscrizioneTelefono(e.target.value)}
                      placeholder="es. 333 1234567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">Note speciali (intolleranze, accompagnatori...)</label>
                  <textarea
                    rows={2}
                    value={iscrizioneNote}
                    onChange={(e) => setIscrizioneNote(e.target.value)}
                    placeholder="Eventuali segnalazioni per gli organizzatori..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span>Quota Iscrizione Prevista:</span>
                  <span className="font-bold font-mono text-sm">
                    {eventoIscrizionePubblica.quotaIscrizioneSocio ? `${eventoIscrizionePubblica.quotaIscrizioneSocio} €` : 'Gratuito'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEventoIscrizionePubblica(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferma Iscrizione</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
