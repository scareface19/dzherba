import React, { useState } from 'react';
import { 
  Leaf, MapPin, Camera, Bot, CreditCard, BookOpen, 
  ShieldAlert, LogIn, LogOut, ChevronDown, User as UserIcon, CheckCircle2,
  Globe, History, Bookmark
} from 'lucide-react';
import type { ViewTab, User, Language } from '../types';
import { translations } from '../i18n';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  plantCount: number;
  currentUser: User | null;
  currentLang: Language;
  onChangeLanguage: (lang: Language) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  dbConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  plantCount,
  currentUser,
  currentLang,
  onChangeLanguage,
  onOpenAuthModal,
  onLogout,
  dbConnected = true,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const t = translations[currentLang];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية (Cairo)', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const roleStyles = {
    admin: { label: 'Admin', badge: 'ADMIN', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    researcher: { label: 'Chercheur', badge: 'B2C', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    institution: { label: 'Campus', badge: 'B2B', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    student: { label: 'Étudiant', badge: 'EDU', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    free: { label: 'Membre', badge: 'FREE', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    guest: { label: 'Invité', badge: 'GUEST', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  };

  const activeStyle = currentUser ? roleStyles[currentUser.role] : roleStyles.guest;

  return (
    <header className="sticky top-0 z-40 bg-[#F5F3F3]/95 backdrop-blur-md border-b border-[#E1D3BE]/60 shadow-xs">
      <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-2">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#426B5F] flex items-center justify-center text-[#F5F3F3] shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Leaf className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#CD9850]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0B0B0B]">
                  Dz<span className="text-[#426B5F]">Herba</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#426B5F]/10 text-[#426B5F] border border-[#426B5F]/20 whitespace-nowrap">
                  {plantCount} {t.plantCount}
                </span>
                {dbConnected && (
                  <span 
                    title={currentLang === 'ar' ? 'البيانات متصلة ومحدثة مباشرة' : 'Base de données synchronisée en direct'}
                    className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {currentLang === 'ar' ? 'مباشر' : 'En direct'}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] font-cairo text-[#575D5A] font-semibold tracking-wide truncate max-w-[150px] sm:max-w-none">
                {t.slogan}
              </p>
            </div>
          </div>

          {/* Desktop Navigation links - Clean, uncluttered and professional */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-1 overflow-hidden">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-[#426B5F] text-[#F5F3F3] shadow-xs'
                  : 'text-[#0B0B0B]/80 hover:bg-[#E1D3BE]/40 hover:text-[#0B0B0B]'
              }`}
            >
              {t.nav.home}
            </button>

            <button
              onClick={() => onSelectTab('catalog')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'catalog'
                  ? 'bg-[#426B5F] text-[#F5F3F3] shadow-xs'
                  : 'text-[#0B0B0B]/80 hover:bg-[#E1D3BE]/40 hover:text-[#0B0B0B]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{t.nav.catalog}</span>
            </button>

            <button
              onClick={() => onSelectTab('map')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'map'
                  ? 'bg-[#426B5F] text-[#F5F3F3] shadow-xs'
                  : 'text-[#0B0B0B]/80 hover:bg-[#E1D3BE]/40 hover:text-[#0B0B0B]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{t.nav.map}</span>
            </button>

            <button
              onClick={() => onSelectTab('identify')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'identify'
                  ? 'bg-[#426B5F] text-[#F5F3F3] shadow-xs'
                  : 'text-[#0B0B0B]/80 hover:bg-[#E1D3BE]/40 hover:text-[#0B0B0B]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>{t.nav.identify}</span>
            </button>

            <button
              onClick={() => onSelectTab('assistant')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'assistant'
                  ? 'bg-[#426B5F] text-[#F5F3F3] shadow-xs'
                  : 'text-[#0B0B0B]/80 hover:bg-[#E1D3BE]/40 hover:text-[#0B0B0B]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span>{t.nav.assistant}</span>
            </button>

            <button
              onClick={() => onSelectTab('pricing')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'pricing'
                  ? 'bg-[#CD9850] text-[#0B0B0B] shadow-xs font-black'
                  : 'text-[#0B0B0B]/80 hover:bg-[#E1D3BE]/40 hover:text-[#0B0B0B]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>{t.nav.pricing}</span>
            </button>

            {/* Admin Dedicated Button */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{t.nav.admin}</span>
              </button>
            )}
          </nav>

          {/* Right Section: Language Selector + User Profile (With Dropdown) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Multi-language Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangMenuOpen(!isLangMenuOpen);
                  setIsUserMenuOpen(false);
                }}
                title="Langue / اللغة"
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-[#E1D3BE] bg-white hover:bg-gray-50 text-xs font-bold text-[#0B0B0B] transition-all cursor-pointer shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 text-[#426B5F] shrink-0" />
                <span className="uppercase text-[11px] font-extrabold">{currentLang}</span>
                <ChevronDown className="w-3 h-3 text-[#575D5A] shrink-0" />
              </button>

              {isLangMenuOpen && (
                <div 
                  className="absolute end-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#E1D3BE] p-1.5 space-y-1 z-50 animate-in fade-in duration-150"
                  onClick={() => setIsLangMenuOpen(false)}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => onChangeLanguage(l.code)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        currentLang === l.code ? 'bg-[#EBF2F0] text-[#426B5F]' : 'text-[#0B0B0B] hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span className={l.code === 'ar' ? 'font-cairo' : ''}>{l.label}</span>
                      </span>
                      {currentLang === l.code && <CheckCircle2 className="w-3.5 h-3.5 text-[#426B5F]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Authentication Button or User Avatar Profile Dropdown */}
            {!currentUser ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>{t.auth.login}</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsLangMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border shadow-2xs transition-all cursor-pointer whitespace-nowrap ${activeStyle.color}`}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/90 flex items-center justify-center text-[#0B0B0B] font-black text-xs shrink-0 shadow-2xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="text-left hidden sm:block max-w-[100px] xl:max-w-[130px]">
                    <span className="block text-[11px] font-bold leading-tight truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] uppercase font-extrabold opacity-75">
                      {activeStyle.badge}
                    </span>
                  </div>

                  <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                </button>

                {/* Authenticated Dropdown Menu containing Mon Espace and Historique */}
                {isUserMenuOpen && (
                  <div
                    className="absolute end-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] p-3 space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    {/* User Identity Header */}
                    <div className="p-3 rounded-2xl bg-[#F5F3F3] border border-[#E1D3BE]/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#426B5F] text-white">
                          {currentUser.role.toUpperCase()}
                        </span>
                        {currentUser.subscription && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-[#0B0B0B] pt-1">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-[#575D5A] font-mono truncate">
                        {currentUser.email}
                      </div>
                      {currentUser.organization && (
                        <div className="text-[10px] text-[#426B5F] font-semibold pt-0.5">
                          {currentUser.organization}
                        </div>
                      )}
                    </div>

                    {/* Member Dropdown Links */}
                    <div className="space-y-1 text-xs">
                      {/* Mon Herbier & Espace Personnel */}
                      <button
                        onClick={() => onSelectTab('workspace')}
                        className={`w-full text-start p-2.5 rounded-xl font-bold flex items-center gap-2.5 cursor-pointer transition-colors ${
                          currentTab === 'workspace' ? 'bg-[#EBF2F0] text-[#426B5F]' : 'hover:bg-gray-100 text-[#0B0B0B]'
                        }`}
                      >
                        <Bookmark className="w-4 h-4 text-[#CD9850] shrink-0" />
                        <div className="flex-1">
                          <span className="block leading-tight">
                            {currentLang === 'ar' ? 'معشبتي وأدواتي' : 'Mon Herbier & Favoris'}
                          </span>
                          <span className="text-[10px] text-[#575D5A] font-normal block">
                            {currentLang === 'ar' ? 'النباتات المحفوظة ومدقق الأمان' : 'Notes, favoris & PharmaCheck'}
                          </span>
                        </div>
                      </button>

                      {/* Historique d'Activité MySQL */}
                      <button
                        onClick={() => onSelectTab('history')}
                        className={`w-full text-start p-2.5 rounded-xl font-bold flex items-center gap-2.5 cursor-pointer transition-colors ${
                          currentTab === 'history' ? 'bg-[#EBF2F0] text-[#426B5F]' : 'hover:bg-gray-100 text-[#0B0B0B]'
                        }`}
                      >
                        <History className="w-4 h-4 text-sky-600 shrink-0" />
                        <div className="flex-1">
                          <span className="block leading-tight">
                            {currentLang === 'ar' ? 'سجل النشاط والاستخدام' : 'Mon Historique d’Activité'}
                          </span>
                          <span className="text-[10px] text-[#575D5A] font-normal block">
                            {currentLang === 'ar' ? 'Recherches et scans MySQL' : 'Recherches, vues et scans en BDD'}
                          </span>
                        </div>
                      </button>

                      {/* Admin Panel (If Admin) */}
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => onSelectTab('admin')}
                          className="w-full text-start p-2.5 rounded-xl text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-2.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{t.auth.adminPanel}</span>
                        </button>
                      )}

                      {/* Switch Account */}
                      <button
                        onClick={onOpenAuthModal}
                        className="w-full text-start p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 cursor-pointer font-medium border-t border-gray-100 pt-2"
                      >
                        <UserIcon className="w-4 h-4 text-[#CD9850] shrink-0" />
                        <span>{t.auth.switchAccount}</span>
                      </button>

                      {/* Logout */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-start p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{t.auth.logout}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Secondary Navigation Bar for mobile & tablet (Cleaned) */}
      <div className="lg:hidden flex items-center justify-start gap-1 px-3 py-2 border-t border-[#E1D3BE]/50 bg-white/80 overflow-x-auto text-xs no-scrollbar">
        <button 
          onClick={() => onSelectTab('home')} 
          className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
            currentTab === 'home' ? 'bg-[#426B5F] text-white' : 'text-[#575D5A] hover:bg-gray-100'
          }`}
        >
          {t.nav.home}
        </button>
        <button 
          onClick={() => onSelectTab('catalog')} 
          className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
            currentTab === 'catalog' ? 'bg-[#426B5F] text-white' : 'text-[#575D5A] hover:bg-gray-100'
          }`}
        >
          {t.nav.catalog}
        </button>
        <button 
          onClick={() => onSelectTab('map')} 
          className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
            currentTab === 'map' ? 'bg-[#426B5F] text-white' : 'text-[#575D5A] hover:bg-gray-100'
          }`}
        >
          {t.nav.map}
        </button>
        <button 
          onClick={() => onSelectTab('identify')} 
          className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
            currentTab === 'identify' ? 'bg-[#426B5F] text-white' : 'text-[#575D5A] hover:bg-gray-100'
          }`}
        >
          {t.nav.identify}
        </button>
        <button 
          onClick={() => onSelectTab('assistant')} 
          className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
            currentTab === 'assistant' ? 'bg-[#426B5F] text-white' : 'text-[#575D5A] hover:bg-gray-100'
          }`}
        >
          {t.nav.assistant}
        </button>
        <button 
          onClick={() => onSelectTab('pricing')} 
          className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
            currentTab === 'pricing' ? 'bg-[#CD9850] text-[#0B0B0B]' : 'text-[#575D5A] hover:bg-gray-100'
          }`}
        >
          {t.nav.pricing}
        </button>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => onSelectTab('admin')} 
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
              currentTab === 'admin' ? 'bg-rose-700 text-white' : 'text-rose-700 bg-rose-50'
            }`}
          >
            {t.nav.admin}
          </button>
        )}
      </div>
    </header>
  );
};
