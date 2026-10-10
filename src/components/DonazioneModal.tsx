import React, { useState } from 'react';
import { DonazioneTerzi, TipoDonatore, TipoErogazione, CampagnaRaccoltaFondi } from '../types';
import { 
  HeartHandshake, 
  X, 
  Check, 
  FileText, 
  AlertCircle, 
  Building, 
  User, 
  Landmark, 
  ShieldCheck, 
  CreditCard, 
  Target,
  Sparkles,
  MapPin,
  Mail
} from 'lucide-react';

interface DonazioneModalProps {
  donazione?: DonazioneTerzi | null;
  donazioneIniziale?: DonazioneTerzi | null;
  annoSelezionato?: number;
  annoRiferimento?: number;
  prossimoNumeroRicevuta?: string;
  campagne?: CampagnaRaccoltaFondi[];
  onSalva: (donazione: DonazioneTerzi) => void;
  onClose?: () => void;
  onChiudi?: () => void;
}

export const DonazioneModal: React.FC<DonazioneModalProps> = ({
  donazione: donazioneProp,
  donazioneIniziale,
  annoSelezionato: annoSelProp,
  annoRiferimento,
  prossimoNumeroRicevuta: prossimoNumProp,
  campagne = [],
  onSalva,
  onClose: onCloseProp,
  onChiudi
}) => {
  const donazione = donazioneProp ?? donazioneIniziale ?? null;
  const annoSelezionato = annoSelProp ?? annoRiferimento ?? new Date().getFullYear();
  const onClose = onCloseProp || onChiudi || (() => {});
  const prossimoNumeroRicevuta = prossimoNumProp || `DON-${annoSelezionato}/001`;

  const isModifica = Boolean(donazione);

  const [data, setData] = useState<string>(() => {
    if (donazione?.data) return donazione.data;
    const now = new Date();
    return `${annoSelezionato}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [donatore, setDonatore] = useState<string>(donazione?.donatore || '');
  const [tipoDonatore, setTipoDonatore] = useState<TipoDonatore>(donazione?.tipoDonatore || 'privato');
  const [codiceFiscalePartitaIva, setCodiceFiscalePartitaIva] = useState<string>(donazione?.codiceFiscalePartitaIva || '');
  const [indirizzoDonatore, setIndirizzoDonatore] = useState<string>(donazione?.indirizzoDonatore || '');
  const [cittaDonatore, setCittaDonatore] = useState<string>(donazione?.cittaDonatore || '');
  const [capDonatore, setCapDonatore] = useState<string>(donazione?.capDonatore || '');
  const [emailDonatore, setEmailDonatore] = useState<string>(donazione?.emailDonatore || '');

  const [tipoErogazione, setTipoErogazione] = useState<TipoErogazione>(
    donazione?.tipoErogazione || 'erogazione_liberale_denaro'
  );
  const [campagnaId, setCampagnaId] = useState<string>(donazione?.campagnaId || '');

  const [importo, setImporto] = useState<string>(donazione ? donazione.importo.toString() : '');
  const [causale, setCausale] = useState<string>(donazione?.causale || 'Erogazione liberale per sostegno attività istituzionali');
  const [destinazione, setDestinazione] = useState<string>(donazione?.destinazione || 'Attività Statutarie Generali');
  const [destinazioneVincolata, setDestinazioneVincolata] = useState<boolean>(donazione?.destinazioneVincolata || Boolean(donazione?.campagnaId));
  const [spesaEffettuataProgetto, setSpesaEffettuataProgetto] = useState<string>(donazione?.spesaEffettuataProgetto ? donazione.spesaEffettuataProgetto.toString() : '');
  const [oneriCorrelati, setOneriCorrelati] = useState<string>(donazione?.oneriCorrelati ? donazione.oneriCorrelati.toString() : '');
  const [opposizione730, setOpposizione730] = useState<boolean>(donazione?.opposizione730 || false);
  const [metodo, setMetodo] = useState<string>(donazione?.metodo || 'Bonifico Bancario');
  const [estremiTracciabilita, setEstremiTracciabilita] = useState<string>(donazione?.estremiTracciabilita || '');
  const [deliberaConsiglio, setDeliberaConsiglio] = useState<string>(donazione?.deliberaConsiglio || '');
  const [detraibileFiscale, setDetraibileFiscale] = useState<boolean>(donazione ? donazione.detraibileFiscale : true);
  const [ricevutaNumero, setRicevutaNumero] = useState<string>(donazione?.ricevutaNumero || prossimoNumeroRicevuta);
  const [note, setNote] = useState<string>(donazione?.note || '');
  const [errore, setErrore] = useState<string | null>(null);

  const handleMetodoChange = (nuovoMetodo: string) => {
    setMetodo(nuovoMetodo);
    if (nuovoMetodo === 'Contanti') {
      setDetraibileFiscale(false);
    } else {
      setDetraibileFiscale(true);
    }
  };

  const handleCampagnaChange = (cId: string) => {
    setCampagnaId(cId);
    if (cId) {
      const camp = campagne.find(c => c.id === cId);
      if (camp) {
        setDestinazione(camp.titolo);
        setCausale(`Erogazione liberale vincolata a: ${camp.titolo}`);
        setTipoErogazione('progetto_vincolato');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);

    if (!donatore.trim()) {
      setErrore('Inserisci il nome o la ragione sociale del donatore.');
      return;
    }

    const impNum = parseFloat(importo);
    if (isNaN(impNum) || impNum <= 0) {
      setErrore('Inserisci un importo valido maggiore di 0 €.');
      return;
    }

    const annoCalcolato = data ? parseInt(data.substring(0, 4), 10) : annoSelezionato;

    const donazioneDaSalvare: DonazioneTerzi = {
      id: donazione?.id || `don-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data,
      anno: isNaN(annoCalcolato) ? annoSelezionato : annoCalcolato,
      donatore: donatore.trim(),
      tipoDonatore,
      codiceFiscalePartitaIva: codiceFiscalePartitaIva.trim().toUpperCase() || undefined,
      indirizzoDonatore: indirizzoDonatore.trim() || undefined,
      cittaDonatore: cittaDonatore.trim() || undefined,
      capDonatore: capDonatore.trim() || undefined,
      emailDonatore: emailDonatore.trim() || undefined,
      tipoErogazione,
      campagnaId: campagnaId || undefined,
      importo: Math.round(impNum * 100) / 100,
      causale: causale.trim(),
      destinazione: destinazione.trim() || undefined,
      destinazioneVincolata,
      spesaEffettuataProgetto: spesaEffettuataProgetto ? parseFloat(spesaEffettuataProgetto) : 0,
      oneriCorrelati: oneriCorrelati ? parseFloat(oneriCorrelati) : 0,
      opposizione730,
      metodo: metodo as any,
      estremiTracciabilita: estremiTracciabilita.trim() || undefined,
      deliberaConsiglio: deliberaConsiglio.trim() || undefined,
      detraibileFiscale,
      ricevutaNumero: ricevutaNumero.trim() || prossimoNumeroRicevuta,
      note: note.trim() || undefined
    };

    onSalva(donazioneDaSalvare);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-6 flex flex-col max-h-[92vh]">
        
        {/* Header Modale */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <HeartHandshake className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                {isModifica ? 'Modifica Erogazione Liberale' : 'Registra Nuova Erogazione Liberale'}
              </h3>
              <p className="text-xs text-emerald-200">
                Gestione professionale conforme RUNTS ed ex Art. 83 Codice del Terzo Settore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form con scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {errore && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errore}</span>
            </div>
          )}

          {/* Dati Ricevuta e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data Ricezione Donazione *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numero Ricevuta / Protocollo Ufficiale
              </label>
              <input
                type="text"
                value={ricevutaNumero}
                onChange={(e) => setRicevutaNumero(e.target.value)}
                placeholder="Es. DON-2026/001"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold text-emerald-950"
              />
            </div>
          </div>

          {/* Dati Anagrafici Donatore */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Anagrafica Donatore / Ente Erogatore</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nome Cognome o Ragione Sociale *
              </label>
              <input
                type="text"
                required
                value={donatore}
                onChange={(e) => setDonatore(e.target.value)}
                placeholder="Es. Famiglia Rossi, Banca del Territorio S.p.A., Fondazione CRT..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipologia Soggetto Erogante
                </label>
                <select
                  value={tipoDonatore}
                  onChange={(e) => setTipoDonatore(e.target.value as TipoDonatore)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="privato">Persona Fisica (Cittadino / Sostenitore)</option>
                  <option value="azienda">Impresa / Società Commerciale</option>
                  <option value="fondazione">Fondazione Bancaria / Filantropica</option>
                  <option value="ente_benefico">Ente Terzo Settore / Onlus</option>
                  <option value="associazione">Associazione / Pro Loco Consorella</option>
                  <option value="anonimo">Anonimo / Offerte spontanee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Codice Fiscale o P.IVA (per 730 / Deduzione)
                </label>
                <input
                  type="text"
                  value={codiceFiscalePartitaIva}
                  onChange={(e) => setCodiceFiscalePartitaIva(e.target.value)}
                  placeholder="C.F. o Partita IVA"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase font-mono bg-white"
                />
              </div>
            </div>

            {/* Indirizzo e recapiti donatore per ricevuta e attestazioni */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Indirizzo (Via/Piazza e Civico)
                </label>
                <input
                  type="text"
                  value={indirizzoDonatore}
                  onChange={(e) => setIndirizzoDonatore(e.target.value)}
                  placeholder="Es. Via Roma, 12"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Comune e CAP
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={capDonatore}
                    onChange={(e) => setCapDonatore(e.target.value)}
                    placeholder="CAP"
                    className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                  <input
                    type="text"
                    value={cittaDonatore}
                    onChange={(e) => setCittaDonatore(e.target.value)}
                    placeholder="Città"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Email / PEC Donatore (per invio quietanza in un clic)
              </label>
              <input
                type="email"
                value={emailDonatore}
                onChange={(e) => setEmailDonatore(e.target.value)}
                placeholder="Es. amministrazione@azienda.it"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Tipologia Erogazione e Campagna Fondi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Natura dell'Erogazione *
              </label>
              <select
                value={tipoErogazione}
                onChange={(e) => setTipoErogazione(e.target.value as TipoErogazione)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
              >
                <option value="erogazione_liberale_denaro">Erogazione Liberale in Denaro (Art. 83 CTS)</option>
                <option value="progetto_vincolato">Donazione Vincolata a Scopo Statutario</option>
                <option value="in_memoria">Donazione "In Memoria"</option>
                <option value="cinque_per_mille">Quota 5x1000 Ministero Finanze</option>
                <option value="raccolta_fondi_pubblica">Raccolta Fondi Pubblica Occasionale</option>
                <option value="lascito_testamentario">Lascito Testamentario</option>
                <option value="sponsorizzazione_sociale">Contributo di Sostegno Istituzionale</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campagna Raccolta Fondi Collegata
              </label>
              <select
                value={campagnaId}
                onChange={(e) => handleCampagnaChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Nessuna campagna (Fondo Generale)</option>
                {campagne.map(c => (
                  <option key={c.id} value={c.id}>
                    🎯 {c.titolo} (Obiettivo: € {c.obiettivoImporto.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Importo e Metodo di Pagamento con Tracciabilità */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Importo Donazione (€) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={importo}
                    onChange={(e) => setImporto(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pl-7 bg-white text-emerald-950"
                  />
                  <span className="absolute left-2.5 top-2.5 text-sm font-bold text-slate-400">€</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Metodo di Pagamento
                </label>
                <select
                  value={metodo}
                  onChange={(e) => handleMetodoChange(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-semibold"
                >
                  <option value="Bonifico Bancario">Bonifico Bancario (Tracciabile - Consigliato)</option>
                  <option value="Carta / POS">Carta di Credito / Bancomat / POS (Tracciabile)</option>
                  <option value="Assegno Circolare / Bancario">Assegno Bancario / Circolare (Tracciabile)</option>
                  <option value="Contanti">Contanti (Non detraibile ai fini fiscali)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Estremi di Tracciabilità Bancaria (CRO / TRN / N. Assegno / Banca di Appoggio)
              </label>
              <input
                type="text"
                value={estremiTracciabilita}
                onChange={(e) => setEstremiTracciabilita(e.target.value)}
                placeholder="Es. CRO/TRN 0481920391823 - Banca MPS"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Causale e Destinazione */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Causale Contabile Ufficiale
              </label>
              <input
                type="text"
                value={causale}
                onChange={(e) => setCausale(e.target.value)}
                placeholder="Es. Erogazione liberale a sostegno attività"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destinazione / Progetto di Bilancio
              </label>
              <input
                type="text"
                value={destinazione}
                onChange={(e) => setDestinazione(e.target.value)}
                placeholder="Es. Attività Statutarie, Restauro Fontana, Sagre..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Delibera Consiglio Direttivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delibera Consiglio Direttivo per Accettazione (Opzionale per donazioni di rilievo)
            </label>
            <input
              type="text"
              value={deliberaConsiglio}
              onChange={(e) => setDeliberaConsiglio(e.target.value)}
              placeholder="Es. Delibera C.D. Verbale n. 2 del 20/01/2026"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Riquadro Contabile Avanzato: Vincolo Patrimoniale & Spese Progetto */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={destinazioneVincolata}
                  onChange={(e) => setDestinazioneVincolata(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                />
                <span>Fondo Vincolato per Scopo Statutario Deliberato (DM 39/2020)</span>
              </label>
              <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
                {destinazioneVincolata ? 'Somma Intoccabile' : 'Fondo Ordinario'}
              </span>
            </div>

            {destinazioneVincolata && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Quota Già Spesa/Impiegata per il Progetto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={spesaEffettuataProgetto}
                    onChange={(e) => setSpesaEffettuataProgetto(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Giustificata da fatture o quietanze</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Commissioni Bancarie / Oneri Correlati (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={oneriCorrelati}
                    onChange={(e) => setOneriCorrelati(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Oneri di gestione Sezione C</span>
                </div>
              </div>
            )}
          </div>

          {/* Detraibilità Fiscale Art. 83 CTS e Opposizione 730 */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="chk-detraibile"
                checked={detraibileFiscale}
                onChange={(e) => setDetraibileFiscale(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="chk-detraibile" className="text-xs text-slate-700 cursor-pointer select-none">
                <span className="font-bold text-slate-900 block">
                  Erogazione liberale detraibile/deducibile (Art. 83 D.Lgs. 117/2017)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Spuntare se il pagamento è avvenuto con metodo tracciabile. Consente al donatore la detrazione IRPEF del 30% (fino a 30.000 € annui) o la deduzione IRES del 10% del reddito dichiarato.
                </span>
              </label>
            </div>

            {detraibileFiscale && tipoDonatore === 'privato' && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="chk-opposizione"
                  checked={opposizione730}
                  onChange={(e) => setOpposizione730(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="chk-opposizione" className="text-xs text-slate-700 cursor-pointer select-none">
                  <span className="font-bold text-amber-950 block">
                    Il Donatore ha esercitato il Diritto di Opposizione al 730 Precompilato
                  </span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    Decreto MEF 3/2/2021: i dati NON saranno inviati all'Agenzia delle Entrate nel flusso annuale telematico.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Note Amministrative */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note Contabili Aggiuntive (Opzionali)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Annotazioni interne per il Tesoriere, accordi di sostegno, contatti di riferimento..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Bottoni Azione */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isModifica ? 'Salva Modifiche Erogazione' : 'Registra Erogazione Liberale'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
