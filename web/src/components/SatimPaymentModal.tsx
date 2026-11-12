import React, { useState } from 'react';
import type { Language, PricingPlan, User, UserRole } from '../types';
import { 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, X, 
  ArrowRight, Lock, RefreshCw, Smartphone, Printer, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface SatimPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  billingCycle: 'monthly' | 'annual';
  currentUser?: User | null;
  onSuccess: (role: UserRole) => void;
  currentLang?: Language;
}

export const SatimPaymentModal: React.FC<SatimPaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  currentUser,
  onSuccess,
  currentLang = 'fr'
}) => {
  if (!isOpen || !plan) return null;

  // Step 1: Card Input, Step 2: SATIM OTP SMS, Step 3: Receipt & Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(currentUser?.name?.toUpperCase() || 'MOHAMED TALEB');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('28');
  const [cvv, setCvv] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [transactionRef] = useState(`SATIM-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [authCode] = useState(`AUTH-${Math.floor(100000 + Math.random() * 900000)}`);

  // Detect card type: Edahabia (starts with 6280) vs CIB (other interbank)
  const isEdahabia = cardNumber.replace(/\s+/g, '').startsWith('6280');

  // Format price
  let finalPrice = plan.priceDZD;
  if (plan.role === 'researcher' && billingCycle === 'monthly') {
    finalPrice = 1200;
  }

  // Card input formatter (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleFillDemoCard = () => {
    setCardNumber('6280 5000 1234 5678');
    setCardHolder(currentUser?.name?.toUpperCase() || 'MOHAMED TALEB');
    setExpiryMonth('12');
    setExpiryYear('28');
    setCvv('789');
    setErrorMsg(null);
  };

  const handleGoToSatimOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length !== 16) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى إدخال 16 رقماً للبطاقة الذهبية أو البنكية CIB.' : 'Veuillez saisir les 16 chiffres de votre carte Edahabia ou CIB.');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى كتابة اسم ولقب حامل البطاقة.' : 'Veuillez indiquer le nom et prénom du porteur.');
      return;
    }
    if (cvv.length !== 3) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى إدخال رمز الأمان CVV2 (3 أرقام).' : 'Veuillez saisir le code de sécurité CVV2 (3 chiffres).');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    // Simulate connection to SATIM gateway
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
      setCountdown(60);
    }, 900);
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى إدخال رمز التحقق OTP المرسل عبر SMS.' : 'Veuillez saisir le code de validation reçu par SMS.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Record subscription in backend SQLite
      await api.createSubscription({
        userId: currentUser?.id || 'USR-CIT-03',
        userName: currentUser?.name || cardHolder,
        userEmail: currentUser?.email || 'abonne@dzherba.dz',
        organization: currentUser?.organization || 'DzHerba Pro',
        plan: `${plan.role}_${billingCycle}`,
        amountDZD: finalPrice,
        paymentMethod: isEdahabia ? 'Edahabia (Algérie Poste)' : 'CIB (SATIM)'
      });

      setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
        onSuccess(plan.role);
      }, 1200);
    } catch {
      // Graceful success fallback
      setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
        onSuccess(plan.role);
      }, 1200);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Official SATIM & DzHerba Header */}
        <div className="bg-linear-to-r from-[#2D4A41] via-[#426B5F] to-[#1E332D] text-white p-5 flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide">SATIM</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-amber-400 text-black font-black">
                  GIE Monétique
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                {currentLang === 'ar' ? 'بوابة الدفع الإلكتروني الوطني الآمن' : 'Passerelle Nationale de Paiement Sécurisé CIB / Edahabia'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper progress */}
        <div className="grid grid-cols-3 bg-[#F5F3F3] border-b border-[#E1D3BE]/60 text-[11px] font-bold">
          <div className={`py-2 text-center flex items-center justify-center gap-1.5 ${step === 1 ? 'bg-[#EBF2F0] text-[#426B5F] border-b-2 border-[#426B5F]' : 'text-gray-500'}`}>
            <CreditCard className="w-3.5 h-3.5" />
            <span>1. {currentLang === 'ar' ? 'معلومات البطاقة' : 'Carte'}</span>
          </div>
          <div className={`py-2 text-center flex items-center justify-center gap-1.5 ${step === 2 ? 'bg-[#EBF2F0] text-[#426B5F] border-b-2 border-[#426B5F]' : 'text-gray-500'}`}>
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. {currentLang === 'ar' ? 'رمز SATIM SMS' : 'Code SATIM'}</span>
          </div>
          <div className={`py-2 text-center flex items-center justify-center gap-1.5 ${step === 3 ? 'bg-[#EBF2F0] text-emerald-700 border-b-2 border-emerald-600' : 'text-gray-500'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3. {currentLang === 'ar' ? 'التأكيد والوصل' : 'Reçu validé'}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Order Summary Pill */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-[#EBF2F0] to-[#F5F3F3] border border-[#E1D3BE]/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#575D5A]">
                {currentLang === 'ar' ? 'الخطة المختارة' : 'Abonnement sélectionné'}
              </span>
              <h4 className="font-bold text-sm text-[#0B0B0B]">
                {plan.name} ({billingCycle === 'annual' ? (currentLang === 'ar' ? 'سنوي - 12 شهراً' : '1 an') : (currentLang === 'ar' ? 'شهري' : '1 mois')})
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[#575D5A]">
                {currentLang === 'ar' ? 'المبلغ الإجمالي' : 'Montant à débiter'}
              </span>
              <p className="text-lg font-extrabold text-[#426B5F]">
                {finalPrice.toLocaleString()} <span className="text-xs">DZD</span>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: CARD INPUT ================= */}
          {step === 1 && (
            <form onSubmit={handleGoToSatimOtp} className="space-y-4">
              {/* Card visual mockup */}
              <div className={`p-4 rounded-2xl text-white shadow-lg relative overflow-hidden transition-all duration-300 ${
                isEdahabia 
                  ? 'bg-linear-to-r from-[#B8860B] via-[#DAA520] to-[#8B6508] border border-amber-300' 
                  : 'bg-linear-to-r from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8] border border-blue-400'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-widest uppercase">
                      {isEdahabia ? 'الذهبية EDAHABIA' : 'CARTE CIB'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-black/30 backdrop-blur-xs font-mono">
                      {isEdahabia ? 'Algérie Poste' : 'SATIM'}
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-white/80" />
                </div>

                <div className="font-mono text-lg sm:text-xl font-bold tracking-wider mb-3 text-center drop-shadow-xs">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-white/20">
                  <div>
                    <span className="text-[9px] text-white/70 block uppercase">Titulaire</span>
                    <span className="font-bold tracking-wide truncate max-w-[170px] inline-block">
                      {cardHolder || 'NOM ET PRENOM'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-white/70 block uppercase">Expire</span>
                    <span className="font-bold">
                      {expiryMonth}/{expiryYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Number Input */}
              <div>
                <label className="block text-xs font-bold text-[#0B0B0B] mb-1">
                  {currentLang === 'ar' ? 'رقم البطاقة (16 رقماً) :' : 'Numéro de Carte (16 chiffres) :'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="6280 5000 0000 0000"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E1D3BE] focus:border-[#426B5F] focus:ring-2 focus:ring-[#426B5F]/20 text-sm font-mono tracking-wider text-[#0B0B0B] bg-white"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {isEdahabia ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                        الذهبية
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-300">
                        CIB
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Holder */}
              <div>
                <label className="block text-xs font-bold text-[#0B0B0B] mb-1">
                  {currentLang === 'ar' ? 'اسم ولقب حامل البطاقة :' : 'Nom et Prénom du Porteur :'}
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="NOM PRENOM"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E1D3BE] focus:border-[#426B5F] focus:ring-2 focus:ring-[#426B5F]/20 text-sm font-bold uppercase text-[#0B0B0B] bg-white"
                  required
                />
              </div>

              {/* Expiry & CVV2 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B0B0B] mb-1">
                    {currentLang === 'ar' ? 'تاريخ انتهاء الصلاحية :' : "Date d'expiration :"}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      className="w-1/2 px-2 py-2.5 rounded-xl border border-[#E1D3BE] text-xs font-bold bg-white text-[#0B0B0B]"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      className="w-1/2 px-2 py-2.5 rounded-xl border border-[#E1D3BE] text-xs font-bold bg-white text-[#0B0B0B]"
                    >
                      {['26', '27', '28', '29', '30', '31'].map(y => (
                        <option key={y} value={y}>20{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B0B0B] mb-1">
                    {currentLang === 'ar' ? 'رمز الأمان (CVV2) :' : 'Code CVV2 (3 chiffres) :'}
                  </label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E1D3BE] focus:border-[#426B5F] focus:ring-2 focus:ring-[#426B5F]/20 text-sm font-mono tracking-widest text-[#0B0B0B] bg-white"
                    required
                  />
                </div>
              </div>

              {/* Demo autofill button */}
              <button
                type="button"
                onClick={handleFillDemoCard}
                className="w-full py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#575D5A] text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{currentLang === 'ar' ? 'ملء تجريبي ببطاقة ذهبية صالحة (للتجربة)' : 'Remplir automatiquement avec une carte Edahabia de test'}</span>
              </button>

              {/* Submit to SATIM button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{currentLang === 'ar' ? 'الاتصال بخادم SATIM...' : 'Connexion à la passerelle SATIM...'}</span>
                  </>
                ) : (
                  <>
                    <span>{currentLang === 'ar' ? `المتابعة لدفع ${finalPrice.toLocaleString()} دج عبر SATIM` : `Valider et payer ${finalPrice.toLocaleString()} DZD`}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: SATIM 3D-SECURE OTP ================= */}
          {step === 2 && (
            <form onSubmit={handleConfirmOtp} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>{currentLang === 'ar' ? 'التحقق الأمني 3D-Secure SATIM' : 'Authentification 3D-Secure SATIM'}</span>
                  </span>
                  <span className="font-mono text-[10px] text-amber-800">{transactionRef}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900/90 pt-1">
                  <div>Marchand : <b className="text-black">DZHERBA BOTANIQUE</b></div>
                  <div>Montant : <b className="text-[#426B5F]">{finalPrice.toLocaleString()} DZD</b></div>
                  <div>Carte : <b>{cardNumber.substring(0, 7)}** **** {cardNumber.slice(-4)}</b></div>
                  <div>Date : <b>{new Date().toLocaleDateString('fr-FR')}</b></div>
                </div>
              </div>

              <div className="text-center space-y-2 py-1">
                <p className="text-xs text-[#575D5A] leading-relaxed">
                  {currentLang === 'ar'
                    ? 'تم إرسال رمز أمان مؤقت (OTP) في رسالة قصيرة SMS إلى هاتفك النقال المسجل لدى بريد الجزائر / البنك.'
                    : 'Un code de confirmation temporaire (OTP) a été envoyé par SMS à votre numéro de téléphone mobile lié à la carte.'}
                </p>

                <div className="max-w-[200px] mx-auto pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="482910"
                    className="w-full py-2.5 text-center text-2xl font-mono font-black tracking-widest rounded-xl border-2 border-[#426B5F] text-[#426B5F] focus:outline-hidden bg-white shadow-xs"
                    autoFocus
                    required
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {currentLang === 'ar' ? 'رمز مكون من 6 أرقام' : 'Code à 6 chiffres'}
                  </span>
                </div>
              </div>

              {/* Demo test helper */}
              <button
                type="button"
                onClick={() => setOtpCode('482910')}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentLang === 'ar' ? 'إدخال الرمز التجريبي التلقائي (482910)' : 'Insérer le code SMS de test (482910)'}</span>
              </button>

              <div className="flex items-center justify-between text-xs text-[#575D5A] pt-1">
                <span>{currentLang === 'ar' ? `إعادة الإرسال بعد ${countdown} ثانية` : `Renvoyer le code (${countdown}s)`}</span>
                <button
                  type="button"
                  onClick={() => { setCountdown(60); setErrorMsg(null); }}
                  className="font-bold text-[#426B5F] hover:underline cursor-pointer"
                >
                  {currentLang === 'ar' ? 'إعادة إرسال SMS' : 'Renvoyer SMS'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-xl border border-[#E1D3BE] text-xs font-bold text-[#575D5A] hover:bg-gray-100 cursor-pointer"
                >
                  {currentLang === 'ar' ? 'رجوع' : 'Retour'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-2/3 py-3 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{currentLang === 'ar' ? 'معالجة الدفع...' : 'Débit en cours...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{currentLang === 'ar' ? 'تأكيد ودفع المبلغ' : 'Confirmer le débit'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: OFFICIAL SATIM RECEIPT ================= */}
          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-4 border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0B0B0B]">
                  {currentLang === 'ar' ? 'تم الدفع بنجاح عبر SATIM !' : 'Paiement validé avec succès !'}
                </h3>
                <p className="text-xs text-[#575D5A] mt-1">
                  {currentLang === 'ar'
                    ? 'تم تفعيل اشتراكك المهني فوراً على منصة DzHerba.'
                    : 'Votre abonnement DzHerba est maintenant actif avec tous vos privilèges débloqués.'}
                </p>
              </div>

              {/* Printable Official SATIM Receipt */}
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-[#426B5F]/40 text-left space-y-2 text-xs font-mono shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#426B5F]">REÇU DE PAIEMENT SATIM</span>
                  <span className="text-[10px] text-gray-500">ALGERIE MONETIQUE</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-[#0B0B0B] pt-1">
                  <div>Réf. Transaction :</div>
                  <div className="font-bold text-right">{transactionRef}</div>
                  <div>Code Autorisation :</div>
                  <div className="font-bold text-right text-emerald-600">{authCode}</div>
                  <div>Mode de règlement :</div>
                  <div className="text-right">{isEdahabia ? 'Carte Edahabia' : 'Carte CIB'}</div>
                  <div>Montant débité :</div>
                  <div className="font-extrabold text-[#426B5F] text-right">{finalPrice.toLocaleString()} DZD</div>
                  <div>Plan souscrit :</div>
                  <div className="font-bold text-right">{plan.name}</div>
                  <div>Statut :</div>
                  <div className="font-black text-emerald-700 text-right">PAYÉ & ACTIF ✓</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-1/2 py-3 rounded-xl border border-[#426B5F] text-xs font-bold text-[#426B5F] hover:bg-[#EBF2F0] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'طباعة الوصل' : 'Imprimer le Reçu'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-3 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {currentLang === 'ar' ? 'بدء الاستخدام الآن' : 'Accéder à mes accès Pro'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
