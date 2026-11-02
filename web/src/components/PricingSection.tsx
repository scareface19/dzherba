import React, { useState } from 'react';
import type { UserRole, Language, PricingPlan } from '../types';
import { Check, Building2, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { translations } from '../i18n';

interface PricingSectionProps {
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  currentLang?: Language;
  plans?: PricingPlan[];
}

export const PricingSection: React.FC<PricingSectionProps> = ({ 
  userRole, 
  onChangeUserRole,
  currentLang = 'fr',
  plans
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const t = translations[currentLang].pricing;

  const handleSimulatePayment = (role: UserRole, label: string) => {
    onChangeUserRole(role);
    setSuccessMessage(`${t.paymentSuccessTitle} (${label})`);
    setShowPaymentSuccess(true);
    setTimeout(() => setShowPaymentSuccess(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CD9850]/20 text-[#0B0B0B] text-xs font-bold border border-[#CD9850]/40">
          <Sparkles className="w-3.5 h-3.5 text-[#CD9850]" />
          {t.badge}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0B] tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-[#575D5A]">
          {t.subtitle}
        </p>

        {/* Current active plan indicator */}
        <div className="pt-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#E1D3BE] text-xs font-bold text-[#0B0B0B] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t.currentPlan} <span className="text-[#426B5F] uppercase font-extrabold">{userRole}</span>
          </span>
        </div>

        {/* Billing cycle switch */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'bg-white text-[#575D5A] border border-[#E1D3BE]'
            }`}
          >
            {t.monthly}
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'bg-white text-[#575D5A] border border-[#E1D3BE]'
            }`}
          >
            <span>{t.annual}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#CD9850] text-[#0B0B0B] text-[10px] font-extrabold">
              {t.discount}
            </span>
          </button>
        </div>
      </div>

      {showPaymentSuccess && (
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-1 animate-in fade-in duration-300 shadow-md">
          <div className="font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMessage}
          </div>
          <p className="text-xs">
            {t.paymentSuccessDesc}
          </p>
        </div>
      )}

      {/* Dynamic Pricing Cards Grid */}
      <div className={`grid grid-cols-1 ${plans && plans.length > 3 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-8 items-stretch`}>
        {plans && plans.length > 0 ? (
          plans.map((plan) => {
            const isCurrent = userRole === plan.role;
            const isHighlighted = plan.highlighted;
            const displayName = (currentLang === 'ar' && plan.nameAr) ? plan.nameAr : plan.name;
            const displayFeatures = (currentLang === 'ar' && plan.featuresAr && plan.featuresAr.length > 0) ? plan.featuresAr : plan.features;
            
            // Adjust price if monthly selected on researcher
            let finalPrice = plan.priceDZD;
            if (plan.role === 'researcher' && billingCycle === 'monthly') {
              finalPrice = 1200;
            }

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 border shadow-xs flex flex-col justify-between space-y-6 relative transition-all ${
                  isHighlighted
                    ? 'bg-linear-to-b from-[#EBF2F0] via-white to-white border-2 border-[#426B5F] shadow-xl'
                    : isCurrent
                    ? 'bg-white border-[#426B5F] ring-2 ring-[#426B5F]/20'
                    : 'bg-white border-[#E1D3BE]'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#CD9850] text-[#0B0B0B] text-xs font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                    {t.recommendedBadge}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">
                    {plan.badge}
                  </div>
                  <h3 className="text-2xl font-bold text-[#0B0B0B]">{displayName}</h3>
                  
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${isHighlighted ? 'text-[#426B5F]' : 'text-[#0B0B0B]'}`}>
                      {finalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-[#575D5A]">
                      {plan.priceDZD === 0 ? 'DZD' : billingCycle === 'annual' ? 'DZD / an' : 'DZD / mois'}
                    </span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#E1D3BE]/60 text-xs text-[#0B0B0B]">
                    {displayFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-[#CD9850]' : 'text-[#426B5F]'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleSimulatePayment(plan.role, displayName)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : isHighlighted
                        ? 'bg-[#426B5F] text-white hover:bg-[#2D4A41]'
                        : 'bg-white border-2 border-[#CD9850] text-[#0B0B0B] hover:bg-[#CD9850]'
                    }`}
                  >
                    {plan.role === 'institution' ? <Building2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    <span>{isCurrent ? (currentLang === 'ar' ? 'الاشتراك الحالي' : 'Plan Actuel') : t.subscribeBtn}</span>
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#575D5A] text-center">
                    <span>{t.cibEdahabia}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 text-center py-12 text-[#575D5A]">
            <p>Chargement des tarifs en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
};
