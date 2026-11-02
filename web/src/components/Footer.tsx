import React from 'react';
import { Leaf, ShieldCheck, Heart } from 'lucide-react';
import type { ViewTab, Language } from '../types';
import { translations } from '../i18n';

interface FooterProps {
  onSelectTab: (tab: ViewTab) => void;
  currentLang?: Language;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, currentLang = 'fr' }) => {
  const t = translations[currentLang].footer;
  const tNav = translations[currentLang].nav;

  return (
    <footer className="bg-[#2D4A41] text-[#F5F3F3] border-t border-[#426B5F]/40 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Identity */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#426B5F] flex items-center justify-center text-[#CD9850] shadow-md">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-white">DzHerba</span>
                <p className="text-[11px] font-cairo text-amber-200">
                  {currentLang === 'ar' ? 'المرجع الوطني للنباتات الطبية' : 'منصة النباتات الطبية الجزائرية'}
                </p>
              </div>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {t.about}
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CD9850]">
              {t.modules}
            </h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li>
                <button onClick={() => onSelectTab('catalog')} className="hover:text-white transition-colors cursor-pointer text-start">
                  {tNav.catalog} (279)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('map')} className="hover:text-white transition-colors cursor-pointer text-start">
                  {tNav.map}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('identify')} className="hover:text-white transition-colors cursor-pointer text-start">
                  {tNav.identify}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('assistant')} className="hover:text-white transition-colors cursor-pointer text-start">
                  {tNav.assistant}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('pricing')} className="hover:text-white transition-colors cursor-pointer text-start">
                  {tNav.pricing}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Partenariats & Sources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#CD9850]">
              {t.partners}
            </h4>
            <ul className="space-y-2 text-xs text-white/80">
              {t.partnersList.map((partner, idx) => (
                <li key={idx}>{partner}</li>
              ))}
            </ul>
          </div>

          {/* Col 4: Note de sécurité */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {t.warningTitle}
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              {t.warningDesc}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <p>© {new Date().getFullYear()} DzHerba. {t.rights}</p>
          <p className="flex items-center gap-1">
            <span>{t.love}</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
