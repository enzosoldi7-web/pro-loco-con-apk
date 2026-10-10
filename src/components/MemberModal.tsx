import React, { useState, useEffect, useRef } from 'react';
import { Socio, SocioCategoria, SocioRuoloDirettivo, ProLocoInfo, MetodoPagamento, QuotaAssociativa } from '../types';
import { generaNumeroTessera, generaNumeroRicevuta } from '../storage';
import { 
  X, 
  User, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  Check, 
  ShieldCheck, 
  Euro,
  Camera,
  Upload,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ListChecks,
  Layers,
  KeyRound,
  Lock,
  AlertCircle
} from 'lucide-react';

// Espressioni regolari (Regex) specifiche per il formato italiano di Codice Fiscale e Partita IVA
// 1. Codice Fiscale Persona Fisica (16 caratteri alfanumerici omocodia inclusa):
//    6 lettere (cognome/nome) + 2 cifre/omocodia anno + 1 lettera mese (A,B,C,D,E,H,L,M,P,R,S,T) + 2 cifre/omocodia giorno + 1 lettera e 3 cifre/omocodia catastale + 1 lettera controllo
const REGEX_CODICE_FISCALE_PERSONA_IT = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1}$/i;
// 2. Codice Fiscale Temporaneo / Ente / Persona Giuridica o Partita IVA Italiana (11 cifre numeriche):
const REGEX_PARTITA_IVA_IT = /^[0-9]{11}$/;

interface EsitoValidazioneFiscale {
  stato: 'vuoto' | 'incompleto' | 'valido' | 'errore';
  tipoRilevato?: 'CF_16' | 'PIVA_11';
  messaggio: string;
}

const validaCodiceFiscaleItaliano = (valore: string): EsitoValidazioneFiscale => {
  const pulito = valore.trim().toUpperCase();
  if (!pulito) {
    return {
      stato: 'vuoto',
      messaggio: 'Inserisci 16 caratteri (es. RSSMRA80A01H501U) o 11 cifre per CF Ente/P.IVA'
    };
  }

  // Caso 11 caratteri solo numerici (CF numerico / Partita IVA)
  if (/^[0-9]+$/.test(pulito)) {
    if (pulito.length < 11) {
      return {
        stato: 'incompleto',
        messaggio: `Digitazione numerica in corso (${pulito.length}/11 cifre)...`
      };
    }
    if (pulito.length === 11 && REGEX_PARTITA_IVA_IT.test(pulito)) {
      if (/^0{11}$/.test(pulito)) {
        return {
          stato: 'errore',
          messaggio: 'Formato non valido: le 11 cifre non possono essere tutte zero.'
        };
      }
      return {
        stato: 'valido',
        tipoRilevato: 'PIVA_11',
        messaggio: 'Formato P.IVA / C.F. Numerico italiano valido (11 cifre)'
      };
    }
    return {
      stato: 'errore',
      messaggio: 'Il Codice Fiscale numerico o Partita IVA deve contenere esattamente 11 cifre.'
    };
  }

  // Caso Codice Fiscale alfanumerico 16 caratteri
  if (!/^[A-Z0-9]+$/i.test(pulito)) {
    return {
      stato: 'errore',
      messaggio: 'Caratteri non ammessi: usa solo lettere e numeri senza spazi o simboli.'
    };
  }

  // Controllo progressivo mentre l'utente digita per feedback immediato
  const parzialeValido =
    (pulito.length <= 6 && /^[A-Z]+$/.test(pulito)) ||
    (pulito.length > 6 && pulito.length <= 8 && /^[A-Z]{6}[0-9LMNPQRSTUV]{1,2}$/.test(pulito)) ||
    (pulito.length === 9 && /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}$/.test(pulito)) ||
    (pulito.length > 9 && pulito.length <= 11 && /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{1,2}$/.test(pulito)) ||
    (pulito.length === 12 && /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}$/.test(pulito)) ||
    (pulito.length > 12 && pulito.length <= 15 && /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{1,3}$/.test(pulito));

  if (pulito.length < 16) {
    if (!parzialeValido) {
      return {
        stato: 'errore',
        messaggio: `Sequenza non conforme al formato italiano (pos. ${pulito.length}/16: atteso schema LLLLLLNNLNNLNNNL)`
      };
    }
    return {
      stato: 'incompleto',
      messaggio: `Digitazione C.F. in corso (${pulito.length}/16 caratteri conformi)...`
    };
  }

  if (pulito.length === 16 && REGEX_CODICE_FISCALE_PERSONA_IT.test(pulito)) {
    return {
      stato: 'valido',
      tipoRilevato: 'CF_16',
      messaggio: 'Codice Fiscale italiano formalmente valido (16 caratteri)'
    };
  }

  return {
    stato: 'errore',
    messaggio: 'Formato Codice Fiscale non valido (schema: 6 lettere, 2 cifre anno, 1 lettera mese, 2 cifre giorno, 4 cod. catastale, 1 controllo).'
  };
};

const validaPartitaIvaItaliana = (valore: string): EsitoValidazioneFiscale => {
  const pulito = valore.trim().toUpperCase().replace(/^IT/i, '');
  if (!pulito) {
    return {
      stato: 'vuoto',
      messaggio: 'Opzionale (11 cifre numeriche per Soci Sostenitori, Ditte o Enti)'
    };
  }

  if (!/^[0-9]+$/.test(pulito)) {
    return {
      stato: 'errore',
      messaggio: 'La Partita IVA italiana deve contenere solo 11 cifre numeriche.'
    };
  }

  if (pulito.length < 11) {
    return {
      stato: 'incompleto',
      messaggio: `Digitazione P.IVA in corso (${pulito.length}/11 cifre)...`
    };
  }

  if (pulito.length === 11 && REGEX_PARTITA_IVA_IT.test(pulito)) {
    if (/^0{11}$/.test(pulito)) {
      return {
        stato: 'errore',
        messaggio: 'Partita IVA non valida (non può essere composta da soli zeri).'
      };
    }
    return {
      stato: 'valido',
      tipoRilevato: 'PIVA_11',
      messaggio: 'Partita IVA italiana formalmente valida (11 cifre)'
    };
  }

  return {
    stato: 'errore',
    messaggio: 'La Partita IVA italiana deve essere composta da esattamente 11 cifre.'
  };
};

interface MemberModalProps {
  socio: Socio | null; // null se nuovo socio
  soci: Socio[];
  config: ProLocoInfo;
  annoSelezionato: number;
  onClose: () => void;
  onSalva: (socio: Socio) => void;
}

const COMPETENZE_DISPONIBILI = [
  'Eventi e Sagre',
  'Accoglienza e Info Point',
  'Visite Guidate e Storia',
  'Logistica e Montaggio',
  'Cucina Tradizionale',
  'Comunicazione e Social',
  'Amministrazione e Segreteria',
  'Allestimenti e Grafica'
];

const STEPS_SOCIO = [
  { num: 1, titolo: 'Anagrafica & Foto', sottotitolo: 'Identità, C.F. e fototessera' },
  { num: 2, titolo: 'Residenza & Contatti', sottotitolo: 'Indirizzo, telefono ed email' },
  { num: 3, titolo: 'Tessera & Ruolo', sottotitolo: 'Categoria, incarico e competenze' },
  { num: 4, titolo: 'Quota & Conferma', sottotitolo: 'Versamento annuale e riepilogo' }
];

export const MemberModal: React.FC<MemberModalProps> = ({
  socio,
  soci,
  config,
  annoSelezionato,
  onClose,
  onSalva
}) => {
  const isModifica = !!socio;

  // Gestione Step Sequenziale (1..4) oppure Vista Unica
  const [stepCorrente, setStepCorrente] = useState<number>(1);
  const [vistaTuttiStep, setVistaTuttiStep] = useState<boolean>(false);
  const [erroreStep, setErroreStep] = useState<string | null>(null);

  const [nome, setNome] = useState(socio?.nome || '');
  const [cognome, setCognome] = useState(socio?.cognome || '');
  const [codiceFiscale, setCodiceFiscale] = useState(socio?.codiceFiscale || '');
  const [partitaIva, setPartitaIva] = useState(socio?.partitaIva || '');
  const [dataNascita, setDataNascita] = useState(socio?.dataNascita || '');

  // Validazione in tempo reale tramite Regex per Codice Fiscale e Partita IVA
  const esitoValidazioneCF = validaCodiceFiscaleItaliano(codiceFiscale);
  const esitoValidazionePIVA = validaPartitaIvaItaliana(partitaIva);
  const [luogoNascita, setLuogoNascita] = useState(socio?.luogoNascita || '');
  const [indirizzo, setIndirizzo] = useState(socio?.indirizzo || '');
  const [cap, setCap] = useState(socio?.cap || config.cap);
  const [citta, setCitta] = useState(socio?.citta || config.comune);
  const [provincia, setProvincia] = useState(socio?.provincia || config.provincia);
  const [telefono, setTelefono] = useState(socio?.telefono || '');
  const [email, setEmail] = useState(socio?.email || '');
  const [categoria, setCategoria] = useState<SocioCategoria>(socio?.categoria || 'Ordinario');
  const [ruoloDirettivo, setRuoloDirettivo] = useState<SocioRuoloDirettivo>(socio?.ruoloDirettivo || 'Nessuno');
  const [dataIscrizione, setDataIscrizione] = useState(socio?.dataIscrizione || new Date().toISOString().slice(0, 10));
  const [numeroTessera, setNumeroTessera] = useState(socio?.numeroTessera || '');
  const [pin, setPin] = useState(socio?.pin || '');
  const [attivo, setAttivo] = useState(socio ? socio.attivo : true);
  const [consensoPrivacy, setConsensoPrivacy] = useState(socio ? socio.consensoPrivacy : true);
  const [foto, setFoto] = useState<string>(socio?.foto || '');
  const [note, setNote] = useState(socio?.note || '');
  const [competenze, setCompetenze] = useState<string[]>(socio?.competenzeVolontariato || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestione caricamento e compressione fototessera
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErroreStep('Seleziona un file immagine valido (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFoto(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Per nuovo socio: registrazione opzionale quota immediata
  const [registraQuotaSubito, setRegistraQuotaSubito] = useState(!isModifica);
  const [importoQuota, setImportoQuota] = useState<number>(config.quotaStandardOrdinario);
  const [metodoQuota, setMetodoQuota] = useState<MetodoPagamento>('Contanti');
  const [dataScadenzaQuota, setDataScadenzaQuota] = useState<string>(`${annoSelezionato}-12-31`);

  useEffect(() => {
    if (!isModifica && !numeroTessera) {
      setNumeroTessera(generaNumeroTessera(soci, annoSelezionato));
    }
  }, [isModifica, soci, annoSelezionato, numeroTessera]);

  useEffect(() => {
    if (categoria === 'Onorario') setImportoQuota(0);
    else if (categoria === 'Sostenitore') setImportoQuota(config.quotaStandardSostenitore);
    else if (categoria === 'Giovane') setImportoQuota(config.quotaStandardGiovane);
    else setImportoQuota(config.quotaStandardOrdinario);
  }, [categoria, config]);

  const toggleCompetenza = (comp: string) => {
    if (competenze.includes(comp)) {
      setCompetenze(competenze.filter(c => c !== comp));
    } else {
      setCompetenze([...competenze, comp]);
    }
  };

  const validaStepCorrente = (targetStep?: number): boolean => {
    setErroreStep(null);
    const stepCheck = targetStep ?? stepCorrente;
    if (stepCheck >= 1) {
      if (!nome.trim() || !cognome.trim()) {
        setErroreStep('Compila Nome e Cognome del socio prima di proseguire allo step successivo.');
        setStepCorrente(1);
        return false;
      }
      if (!codiceFiscale.trim()) {
        setErroreStep('Inserisci il Codice Fiscale (o P.IVA) del socio nello Step 1.');
        setStepCorrente(1);
        return false;
      }
      if (esitoValidazioneCF.stato !== 'valido') {
        setErroreStep(`Codice Fiscale non valido: ${esitoValidazioneCF.messaggio}`);
        setStepCorrente(1);
        return false;
      }
      if (partitaIva.trim() && esitoValidazionePIVA.stato !== 'valido') {
        setErroreStep(`Partita IVA non valida: ${esitoValidazionePIVA.messaggio}`);
        setStepCorrente(1);
        return false;
      }
      if (!pin.trim()) {
        setErroreStep('Inserisci il PIN personale nell\'Anagrafe (Step 1) necessario per sbloccare l\'Area Riservata Soci.');
        setStepCorrente(1);
        return false;
      }
    }
    if (stepCheck >= 3) {
      if (!numeroTessera.trim()) {
        setErroreStep('Verifica il Numero Tessera assegnato nello Step 3.');
        setStepCorrente(3);
        return false;
      }
    }
    return true;
  };

  const handleAvantiStep = () => {
    if (!validaStepCorrente(stepCorrente)) return;
    if (stepCorrente < 4) {
      setStepCorrente(stepCorrente + 1);
    }
  };

  const handleIndietroStep = () => {
    setErroreStep(null);
    if (stepCorrente > 1) {
      setStepCorrente(stepCorrente - 1);
    }
  };

  const handleSalvaDefinitivo = () => {
    if (!validaStepCorrente(4)) return;

    const socioId = socio?.id || `socio-${Date.now()}`;
    let quoteEsistenti = socio?.quote || [];

    if (!isModifica && registraQuotaSubito) {
      const ricevutaNum = generaNumeroRicevuta(soci, annoSelezionato);
      const quotaIniziale: QuotaAssociativa = {
        id: `quota-${Date.now()}`,
        socioId: socioId,
        anno: annoSelezionato,
        importo: Number(importoQuota),
        dataPagamento: new Date().toISOString().slice(0, 10),
        dataScadenza: dataScadenzaQuota || `${annoSelezionato}-12-31`,
        metodo: metodoQuota,
        ricevutaNumero: ricevutaNum,
        note: 'Quota prima iscrizione'
      };
      quoteEsistenti = [quotaIniziale];
    }

    const socioAggiornato: Socio = {
      id: socioId,
      numeroTessera: numeroTessera.trim().toUpperCase(),
      pin: pin.trim(),
      nome: nome.trim(),
      cognome: cognome.trim(),
      codiceFiscale: codiceFiscale.trim().toUpperCase(),
      partitaIva: partitaIva.trim().replace(/^IT/i, '') || undefined,
      dataNascita,
      luogoNascita: luogoNascita.trim(),
      indirizzo: indirizzo.trim(),
      cap: cap.trim(),
      citta: citta.trim(),
      provincia: provincia.trim().toUpperCase(),
      telefono: telefono.trim(),
      email: email.trim(),
      categoria,
      ruoloDirettivo,
      dataIscrizione,
      attivo,
      consensoPrivacy,
      foto: foto || undefined,
      note: note.trim() || undefined,
      competenzeVolontariato: competenze,
      quote: quoteEsistenti
    };

    onSalva(socioAggiornato);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vistaTuttiStep && stepCorrente < 4) {
      handleAvantiStep();
      return;
    }
    handleSalvaDefinitivo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Intestazione Modale - Fissa in alto */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {isModifica ? 'Modifica Scheda Socio (Percorso a Step)' : 'Iscrizione Sequenziale Nuovo Socio (Punto 1.1)'}
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700">
                  · Passo {stepCorrente} di 4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isModifica
                  ? `Aggiornamento ordinato scheda socio ${socio.numeroTessera}`
                  : 'Inserimento guidato in 4 step sequenziali nel Libro Soci e rilascio tessera'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVistaTuttiStep(!vistaTuttiStep)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                vistaTuttiStep
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Passa dalla compilazione guidata a step alla vista unica completa"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{vistaTuttiStep ? 'Torna a Step Guidati' : 'Mostra Tutti gli Step'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra Stepper Sequenziale 1 → 2 → 3 → 4 */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STEPS_SOCIO.map((st) => {
              const isCurrent = !vistaTuttiStep && stepCorrente === st.num;
              const isCompleted = !vistaTuttiStep && stepCorrente > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => {
                    setVistaTuttiStep(false);
                    setErroreStep(null);
                    setStepCorrente(st.num);
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : isCompleted
                        ? 'bg-emerald-50/90 text-emerald-950 border-emerald-200 hover:bg-emerald-100/80'
                        : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-white text-emerald-800'
                      : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.num}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-bold truncate leading-tight ${
                      isCurrent ? 'text-white' : 'text-slate-900'
                    }`}>
                      {st.titolo}
                    </div>
                    <div className={`text-[9.5px] truncate ${
                      isCurrent ? 'text-emerald-100' : 'text-slate-500'
                    }`}>
                      {st.sottotitolo}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {erroreStep && (
          <div className="mx-5 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between shrink-0">
            <span>{erroreStep}</span>
            <button type="button" onClick={() => setErroreStep(null)} className="text-rose-600 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Formulario con Body a scorrimento interno e Footer fisso */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
            
            {/* STEP 1: Dati Anagrafici Primari e Fototessera */}
            {(vistaTuttiStep || stepCorrente === 1) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-mono text-[11px] inline-flex items-center justify-center">1</span>
                    <span>Step 1 · Dati Anagrafici & Fototessera Ufficiale</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Campi obbligatori contrassegnati con *</span>
                </div>

                {/* Fototessera del Socio */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    {foto ? (
                      <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-emerald-600 shadow-xs relative group bg-white">
                        <img 
                          src={foto} 
                          alt="Fototessera Socio" 
                          className="w-full h-full object-cover object-center" 
                        />
                        <button
                          type="button"
                          onClick={() => setFoto('')}
                          title="Rimuovi foto"
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs font-bold gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                        <Camera className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[9px] font-bold leading-tight">Foto Tessera</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-bold text-slate-800">Fototessera del Socio</span>
                      <span className="text-[11px] text-slate-500">
                        · {foto ? 'Fotografia caricata' : 'Opzionale per stampa tessera'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      La foto verrà stampata sulla tessera digitale e cartacea del socio. Formato consigliato: primo piano frontale (JPG, PNG).
                    </p>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{foto ? 'Cambia Fototessera' : 'Carica Fototessera'}</span>
                      </button>

                      {foto && (
                        <button
                          type="button"
                          onClick={() => setFoto('')}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors font-medium"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Mario"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Rossi"
                      value={cognome}
                      onChange={(e) => setCognome(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Validatore in Tempo Reale: Codice Fiscale e Partita IVA (Regex Formato Italiano) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Codice Fiscale (16 car. o 11 cifre) *
                      </label>
                      {esitoValidazioneCF.stato === 'valido' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          {esitoValidazioneCF.tipoRilevato === 'CF_16' ? 'CF Valido' : 'CF/P.IVA 11 cifre'}
                        </span>
                      )}
                      {esitoValidazioneCF.stato === 'errore' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                          <AlertCircle className="w-3 h-3" />
                          Formato errato
                        </span>
                      )}
                      {esitoValidazioneCF.stato === 'incompleto' && (
                        <span className="text-[10px] font-mono font-semibold text-amber-700">
                          {codiceFiscale.trim().length}/{/^[0-9]+$/.test(codiceFiscale.trim()) ? 11 : 16}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={16}
                        placeholder="Es. RSSMRA80A01H501U"
                        value={codiceFiscale}
                        onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        className={`w-full rounded-lg px-2.5 py-2 pr-8 text-xs font-mono font-bold uppercase transition-colors focus:outline-none focus:ring-2 ${
                          esitoValidazioneCF.stato === 'valido'
                            ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 focus:bg-white focus:ring-emerald-500'
                            : esitoValidazioneCF.stato === 'errore'
                              ? 'bg-rose-50/70 border border-rose-400 text-rose-900 focus:bg-white focus:ring-rose-500'
                              : esitoValidazioneCF.stato === 'incompleto'
                                ? 'bg-amber-50/50 border border-amber-300 text-slate-900 focus:bg-white focus:ring-amber-500'
                                : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-emerald-500'
                        }`}
                      />
                      {esitoValidazioneCF.stato === 'valido' && (
                        <Check className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                      {esitoValidazioneCF.stato === 'errore' && (
                        <AlertCircle className="w-4 h-4 text-rose-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <p
                      className={`mt-1 text-[10px] leading-tight ${
                        esitoValidazioneCF.stato === 'valido'
                          ? 'text-emerald-700 font-medium'
                          : esitoValidazioneCF.stato === 'errore'
                            ? 'text-rose-600 font-medium'
                            : esitoValidazioneCF.stato === 'incompleto'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                      }`}
                    >
                      {esitoValidazioneCF.messaggio}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Partita IVA (opzionale · 11 cifre)
                      </label>
                      {esitoValidazionePIVA.stato === 'valido' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          P.IVA Valida
                        </span>
                      )}
                      {esitoValidazionePIVA.stato === 'errore' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                          <AlertCircle className="w-3 h-3" />
                          Formato errato
                        </span>
                      )}
                      {esitoValidazionePIVA.stato === 'incompleto' && (
                        <span className="text-[10px] font-mono font-semibold text-amber-700">
                          {partitaIva.trim().replace(/^IT/i, '').length}/11
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={13}
                        placeholder="Es. 01234567890"
                        value={partitaIva}
                        onChange={(e) => setPartitaIva(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        className={`w-full rounded-lg px-2.5 py-2 pr-8 text-xs font-mono font-bold uppercase transition-colors focus:outline-none focus:ring-2 ${
                          esitoValidazionePIVA.stato === 'valido'
                            ? 'bg-emerald-50/60 border border-emerald-400 text-emerald-950 focus:bg-white focus:ring-emerald-500'
                            : esitoValidazionePIVA.stato === 'errore'
                              ? 'bg-rose-50/70 border border-rose-400 text-rose-900 focus:bg-white focus:ring-rose-500'
                              : esitoValidazionePIVA.stato === 'incompleto'
                                ? 'bg-amber-50/50 border border-amber-300 text-slate-900 focus:bg-white focus:ring-amber-500'
                                : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-emerald-500'
                        }`}
                      />
                      {esitoValidazionePIVA.stato === 'valido' && (
                        <Check className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                      {esitoValidazionePIVA.stato === 'errore' && (
                        <AlertCircle className="w-4 h-4 text-rose-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <p
                      className={`mt-1 text-[10px] leading-tight ${
                        esitoValidazionePIVA.stato === 'valido'
                          ? 'text-emerald-700 font-medium'
                          : esitoValidazionePIVA.stato === 'errore'
                            ? 'text-rose-600 font-medium'
                            : esitoValidazionePIVA.stato === 'incompleto'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                      }`}
                    >
                      {esitoValidazionePIVA.messaggio}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Data di Nascita
                    </label>
                    <input
                      type="date"
                      value={dataNascita}
                      onChange={(e) => setDataNascita(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Luogo di Nascita
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Siena (SI)"
                      value={luogoNascita}
                      onChange={(e) => setLuogoNascita(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Blocco Credenziali Sblocco Area Riservata Soci (PIN + Numero Tessera associato) */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-950">
                        PIN di Sblocco Area Riservata Soci (associato al N° Tessera)
                      </span>
                    </div>
                    <span className="text-[10.5px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      Obbligatorio per accesso tramite link
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Questo <strong>PIN personale</strong> è abbinato al Numero Tessera del socio e verrà richiesto per sbloccare l&apos;Area Riservata Soci aperta tramite il link inviato al socio.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                        Numero Tessera Associato *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Es. PL-2025-010"
                        value={numeroTessera}
                        onChange={(e) => setNumeroTessera(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                        PIN Sblocco Area Riservata *
                      </label>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Lock className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            maxLength={12}
                            placeholder="Es. 12345"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.trim())}
                            className="w-full bg-white border border-emerald-300 rounded-lg pl-8 pr-2.5 py-2 text-xs font-mono font-extrabold text-emerald-900 tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPin(String(Math.floor(1000 + Math.random() * 9000)))}
                          title="Genera un nuovo PIN casuale a 4 cifre"
                          className="px-2.5 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Genera PIN
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Residenza e Recapiti */}
            {(vistaTuttiStep || stepCorrente === 2) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-mono text-[11px] inline-flex items-center justify-center">2</span>
                    <span>Step 2 · Domicilio, Residenza e Recapiti Telefonici/Email</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Utili per invio link portale e avvisi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Indirizzo e N° Civico
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Via Roma, 14"
                      value={indirizzo}
                      onChange={(e) => setIndirizzo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Comune / Città
                    </label>
                    <input
                      type="text"
                      value={citta}
                      onChange={(e) => setCitta(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      CAP / Prov.
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="CAP"
                        value={cap}
                        onChange={(e) => setCap(e.target.value)}
                        className="w-2/3 bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="PR"
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value.toUpperCase())}
                        className="w-1/3 bg-slate-50 border border-slate-300 rounded-lg px-1 text-center py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Telefono / Cellulare (per WhatsApp e SMS)
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Es. 338 1234567"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Indirizzo Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="Es. nome@email.it"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Categoria, Ruolo, Tessera e Competenze */}
            {(vistaTuttiStep || stepCorrente === 3) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-mono text-[11px] inline-flex items-center justify-center">3</span>
                    <span>Step 3 · Inquadramento Associativo, Tessera & Competenze</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Qualifica Albo Soci e disponibilità</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Categoria Socio *
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as SocioCategoria)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Ordinario">Ordinario</option>
                      <option value="Sostenitore">Sostenitore</option>
                      <option value="Onorario">Onorario</option>
                      <option value="Giovane">Giovane (Under 25)</option>
                      <option value="Volontario Attivo">Volontario Attivo</option>
                      <option value="Membro Direttivo">Membro Direttivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ruolo nel Consiglio Direttivo
                    </label>
                    <select
                      value={ruoloDirettivo}
                      onChange={(e) => setRuoloDirettivo(e.target.value as SocioRuoloDirettivo)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Nessuno">Nessun incarico</option>
                      <option value="Presidente">Presidente</option>
                      <option value="Vicepresidente">Vicepresidente</option>
                      <option value="Segretario">Segretario</option>
                      <option value="Tesoriere">Tesoriere</option>
                      <option value="Consigliere">Consigliere</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Numero Tessera *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. PL-2025-010"
                      value={numeroTessera}
                      onChange={(e) => setNumeroTessera(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Data Prima Iscrizione
                    </label>
                    <input
                      type="date"
                      value={dataIscrizione}
                      onChange={(e) => setDataIscrizione(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={attivo}
                        onChange={(e) => setAttivo(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Socio Attivo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={consensoPrivacy}
                        onChange={(e) => setConsensoPrivacy(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Consenso Privacy GDPR</span>
                    </label>
                  </div>
                </div>

                {/* Competenze Volontariato */}
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-2">
                    Disponibilità e Competenze per gli Stand e le Attività Pro Loco (Punto 1.2 Eventi):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPETENZE_DISPONIBILI.map(comp => {
                      const selezionato = competenze.includes(comp);
                      return (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => toggleCompetenza(comp)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                            selezionato 
                              ? 'bg-emerald-700 text-white border-emerald-700' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {selezionato ? '✓ ' : '+ '}{comp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Quota Associativa, Note & Riepilogo Finale */}
            {(vistaTuttiStep || stepCorrente === 4) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-mono text-[11px] inline-flex items-center justify-center">4</span>
                    <span>Step 4 · Quota Associativa {annoSelezionato}, Note & Riepilogo Finale</span>
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-semibold">Ultimo passaggio prima della registrazione</span>
                </div>

                {!isModifica && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={registraQuotaSubito}
                        onChange={(e) => setRegistraQuotaSubito(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Registra contestualmente il pagamento della quota associativa per l'anno {annoSelezionato}</span>
                    </label>

                    {registraQuotaSubito && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/80">
                        <div>
                          <label className="block text-[10.5px] font-semibold text-emerald-900 mb-1">
                            Importo Quota (€)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={importoQuota}
                            onChange={(e) => setImportoQuota(Number(e.target.value))}
                            className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-semibold text-emerald-900 mb-1">
                            Metodo di Pagamento
                          </label>
                          <select
                            value={metodoQuota}
                            onChange={(e) => setMetodoQuota(e.target.value as MetodoPagamento)}
                            className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900"
                          >
                            <option value="Contanti">Contanti</option>
                            <option value="Bonifico Bancario">Bonifico Bancario</option>
                            <option value="POS / Carta">POS / Carta</option>
                            <option value="Satispay">Satispay</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-semibold text-emerald-900 mb-1">
                            Data Scadenza Quota
                          </label>
                          <input
                            type="date"
                            value={dataScadenzaQuota}
                            onChange={(e) => setDataScadenzaQuota(e.target.value)}
                            className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-emerald-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Note Interne / Osservazioni Segreteria
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Eventuali note su convenzioni, deleghe, allergie o turni preferiti..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Riepilogo Sintetico pre-salvataggio */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Riepilogo Scheda Socio pronta per il salvataggio:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400">Nominativo:</span>{' '}
                      <strong className="text-slate-900">{cognome || '—'} {nome || '—'}</strong> ({codiceFiscale || 'C.F. mancante'}{partitaIva.trim() ? ` · P.IVA ${partitaIva.trim()}` : ''})
                    </div>
                    <div>
                      <span className="text-slate-400">Tessera, PIN & Qualifica:</span>{' '}
                      <strong className="font-mono text-emerald-800">{numeroTessera}</strong> (PIN: <strong className="font-mono text-emerald-900">{pin || '—'}</strong>) · {categoria}
                    </div>
                    <div>
                      <span className="text-slate-400">Recapiti:</span>{' '}
                      {telefono || 'Nessun tel.'} · {email || 'Nessuna email'}
                    </div>
                    <div>
                      <span className="text-slate-400">Competenze selezionate:</span>{' '}
                      <strong>{competenze.length}</strong> ambiti operativi
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Pulsanti Azione Sequenziali - Fissi in basso */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 shrink-0">
            <div className="flex items-center gap-2">
              {!vistaTuttiStep && stepCorrente > 1 ? (
                <button
                  type="button"
                  onClick={handleIndietroStep}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Step Precedente</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Libro Soci · Anno Sociale {annoSelezionato}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              >
                Annulla
              </button>

              {!vistaTuttiStep && stepCorrente < 4 ? (
                <button
                  type="button"
                  onClick={handleAvantiStep}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <span>Avanti: Step {stepCorrente + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSalvaDefinitivo}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isModifica ? 'Salva Modifiche Socio' : 'Conferma e Registra Socio'}</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
