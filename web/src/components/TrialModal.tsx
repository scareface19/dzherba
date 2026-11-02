import React, { useState } from 'react';
import type { LicenseStatus, Language } from '../types';
import { 
  Clock, ShieldAlert, KeyRound, CheckCircle2, 
  Sparkles, Lock, X, AlertTriangle, Building2, Mail
} from 'lucide-react';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: LicenseStatus | null;
  onLicenseUpdated: (newLicense: LicenseStatus) => void;
  currentLang?: Language;
}

export const TrialActivationModal: React.FC<TrialModalProps> = ({
  isOpen,
  onClose,
  license,
  onLicenseUpdated,
  currentLang = 'fr'
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success && data.status) {
        setSuccessMsg(currentLang === 'ar' ? 'تم تفعيل ترخيص المنصة بنجاح!' : 'Licence DzHerba activée avec succès !');
        onLicenseUpdated(data.status);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || (currentLang === 'ar' ? 'مفتاح التفعيل غير صحيح.' : 'Clé d\'activation invalide ou expirée.'));
      }
    } catch (err) {
      setErrorMsg(currentLang === 'ar' ? 'تعذر الاتصال بالخادم لتأكيد الترخيص.' : 'Impossible de vérifier la clé avec le serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2D4A41] to-[#426B5F] text-white p-6 relative">
          {!license?.isExpired && (
            <button
              onClick={onClose}
              className="absolute top-5 end-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <Clock className="w-6 h-6 text-[#CD9850]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {currentLang === 'ar' ? 'إدارة ترخيص منصة DzHerba' : 'Licence & Période d’Évaluation'}
              </h3>
              <p className="text-xs text-white/80">
                {currentLang === 'ar' ? 'نسخة تجريبية لمدة 15 يوماً' : 'Version d’essai limitée à 15 jours'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-[#F5F3F3] border border-[#E1D3BE] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#575D5A] uppercase text-[10px]">
                {currentLang === 'ar' ? 'حالة الترخيص' : 'Statut actuel'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                license?.isActivated
                  ? 'bg-emerald-100 text-emerald-800'
                  : license?.isExpired
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {license?.isActivated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? 'مفعل نهائياً' : 'Licence Permanente'}</span>
                  </>
                ) : license?.isExpired ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? 'منتهي الصلاحية' : 'Période Expirée'}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? `متبقي ${license?.daysRemaining} يوم` : `${license?.daysRemaining} jour(s) restant(s)`}</span>
                  </>
                )}
              </span>
            </div>

            <div className="text-xs text-[#0B0B0B] leading-relaxed">
              {license?.isActivated
                ? (currentLang === 'ar' ? 'المنصة مفعلة بترخيص كامل ودائم.' : 'Votre plateforme DzHerba est pleinement activée avec licence commerciale.')
                : license?.isExpired
                ? (currentLang === 'ar' ? 'لقد انتهت فترة الـ 15 يوماً التجريبية. يرجى إدخال مفتاح التفعيل الرسمي للاستمرار.' : 'La période d\'évaluation de 15 jours est terminée. Veuillez saisir votre clé d\'activation.')
                : (currentLang === 'ar' ? `يمكنك استخدام المنصة بكامل خصائصها. متبقي لديك ${license?.daysRemaining} يوماً في الفترة التجريبية.` : `Vous disposez d'un accès complet à DzHerba pour tester l'ensemble du catalogue des 773 plantes médicinales. Il vous reste ${license?.daysRemaining} jour(s).`)}
            </div>

            {license?.expiresAt && (
              <div className="pt-2 border-t border-[#E1D3BE]/60 text-[11px] text-[#575D5A] flex justify-between">
                <span>{currentLang === 'ar' ? 'تاريخ نهاية التجربة:' : 'Date d\'expiration :'}</span>
                <span className="font-mono font-bold text-[#0B0B0B]">
                  {new Date(license.expiresAt).toLocaleDateString(currentLang === 'ar' ? 'ar-DZ' : 'fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <label className="font-bold text-[#0B0B0B] block">
              {currentLang === 'ar' ? 'أدخل مفتاح التفعيل الرسمي (Licence Key):' : 'Saisir la clé d’activation officielle :'}
            </label>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#CD9850] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: DZHERBA-2026-COMMERCIAL-PRO"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#E1D3BE] font-mono uppercase font-bold text-[#0B0B0B] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !keyInput.trim()}
              className="w-full py-3 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? (currentLang === 'ar' ? 'جاري التحقق...' : 'Vérification...') : (currentLang === 'ar' ? 'تفعيل الترخيص الدائم' : 'Activer la Licence')}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>

          {/* Contact help */}
          <div className="pt-3 border-t border-[#E1D3BE]/60 text-[11px] text-[#575D5A] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#CD9850]" />
              <span>Direction Scientifique DzHerba</span>
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>contact@dzherba.dz</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrialExpiredLockScreen: React.FC<{
  license: LicenseStatus;
  onLicenseUpdated: (newLicense: LicenseStatus) => void;
  currentLang?: Language;
}> = ({ license, onLicenseUpdated, currentLang = 'fr' }) => {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-linear-to-br from-[#1E322C] via-[#2D4A41] to-[#121E1A] overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 my-auto text-center">
        {/* Emblem */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center border-2 border-rose-300 shadow-lg">
          <Lock className="w-8 h-8 text-rose-600" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'انتهت الفترة التجريبية (15 يوماً)' : 'Période d\'Évaluation Expirée (15 jours)'}</span>
          </div>
          <h2 className="text-2xl font-black text-[#0B0B0B]">
            {currentLang === 'ar' ? 'انتهت صلاحية استخدام النسخة التجريبية' : 'Accès DzHerba Verrouillé'}
          </h2>
          <p className="text-xs text-[#575D5A] max-w-md mx-auto leading-relaxed">
            {currentLang === 'ar'
              ? 'لقد انقضت فترة الـ 15 يوماً المخصصة لتقييم منصة DzHerba على هذا الجهاز. لمواصلة استكشاف 773 نبتة طبية جزائرية وميزات الذكاء الاصطناعي، يرجى تفعيل مفتاح الترخيص.'
              : 'La période d\'essai gratuite de 15 jours sur cet ordinateur est arrivée à échéance. Pour réactiver l\'accès aux 773 plantes médicinales et à l\'assistance phytochimique, veuillez entrer votre clé d\'activation.'}
          </p>
        </div>

        {/* Embedded Activation Form */}
        <div className="text-start">
          <TrialActivationModal
            isOpen={true}
            onClose={() => {}}
            license={license}
            onLicenseUpdated={onLicenseUpdated}
            currentLang={currentLang}
          />
        </div>
      </div>
    </div>
  );
};
