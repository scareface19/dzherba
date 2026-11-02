import React, { useState } from 'react';
import type { User, UserRole, Language } from '../types';
import { 
  X, Lock, Mail, User as UserIcon, ShieldAlert, 
  CheckCircle2, ArrowRight, KeyRound 
} from 'lucide-react';
import { translations } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialRoleHint?: UserRole;
  currentLang?: Language;
}

export const DEMO_ACCOUNTS: { email: string; pass: string; user: User }[] = [
  {
    email: 'admin@dzherba.dz',
    pass: 'admin123',
    user: {
      id: 'USR-ADMIN',
      name: 'Dr. Reda Mansouri (Admin Master)',
      email: 'admin@dzherba.dz',
      role: 'admin',
      organization: 'Direction Technique & Scientifique DzHerba',
    },
  },
  {
    email: 'chercheur@univ-alger.dz',
    pass: 'chercheur123',
    user: {
      id: 'USR-RES-01',
      name: 'Pr. Amina Benali',
      email: 'chercheur@univ-alger.dz',
      role: 'researcher',
      organization: 'Faculté de Pharmacie - Université Alger 1',
      subscription: {
        plan: 'Abonnement Chercheur Annuel',
        expiresAt: '2027-09-01',
        status: 'active',
      },
    },
  },
  {
    email: 'campus@univ-setif.dz',
    pass: 'campus123',
    user: {
      id: 'USR-UNIV-02',
      name: 'Département de Biologie & Pharmacie',
      email: 'campus@univ-setif.dz',
      role: 'institution',
      organization: 'Université Ferhat Abbas Sétif 1',
      subscription: {
        plan: 'Convention Campus Universitaire B2B',
        expiresAt: '2027-06-30',
        status: 'active',
      },
    },
  },
  {
    email: 'citoyen@dzherba.dz',
    pass: 'citoyen123',
    user: {
      id: 'USR-CIT-03',
      name: 'Sofiane Cherif',
      email: 'citoyen@dzherba.dz',
      role: 'free',
      organization: 'Grand Public & Herboristerie',
    },
  },
  {
    email: 'etudiant@univ-alger.dz',
    pass: 'etudiant123',
    user: {
      id: 'USR-STU-04',
      name: 'Yacine Amrani (Étudiant Biologie)',
      email: 'etudiant@univ-alger.dz',
      role: 'student',
      organization: 'Faculté des Sciences Biologiques - USTHB',
      subscription: {
        plan: 'Accès Étudiant Académique',
        expiresAt: '2027-06-30',
        status: 'active',
      },
    },
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentLang = 'fr',
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [desiredRole, setDesiredRole] = useState<UserRole>('free');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[currentLang].auth;

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try server login (MySQL dzherba_db)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setIsSubmitting(false);
          onLoginSuccess(data.user);
          onClose();
          return;
        }
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.error && res.status !== 404) {
          // If server explicitly returned an error message like wrong password
          setIsSubmitting(false);
          setErrorMsg(errData.error);
          return;
        }
      }
    } catch (err) {
      console.warn('API login check offline, checking demo/local accounts:', err);
    }

    // 2. Check against demo accounts
    const matched = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail && acc.pass === password
    );

    if (matched) {
      setIsSubmitting(false);
      onLoginSuccess(matched.user);
      onClose();
      return;
    }

    // 3. Check locally registered users in localStorage
    try {
      const raw = localStorage.getItem('dzherba_local_users');
      if (raw) {
        const list: User[] = JSON.parse(raw);
        const found = list.find((u) => u.email.toLowerCase() === cleanEmail);
        if (found) {
          setIsSubmitting(false);
          onLoginSuccess(found);
          onClose();
          return;
        }
      }
    } catch (e) {}

    // If admin domain is requested without correct pass
    if (cleanEmail.includes('admin') && password !== 'admin123') {
      setIsSubmitting(false);
      setErrorMsg(t.errAdminPass);
      return;
    }

    // Default dynamic login
    const dynamicUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('univ') ? 'researcher' : 'free',
    };
    setIsSubmitting(false);
    onLoginSuccess(dynamicUser);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg(t.errMissingFields);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try registering in MySQL via server API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          role: desiredRole,
          organization: organization.trim() || (desiredRole === 'researcher' ? 'Centre de Recherche' : desiredRole === 'institution' ? 'Université' : desiredRole === 'student' ? 'Faculté / Université' : 'Grand Public')
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          // Also save in local fallback list so admin dashboard can always see it
          try {
            const raw = localStorage.getItem('dzherba_local_users');
            const list: User[] = raw ? JSON.parse(raw) : [];
            list.unshift(data.user);
            localStorage.setItem('dzherba_local_users', JSON.stringify(list));
          } catch (e) {}

          setIsSubmitting(false);
          onLoginSuccess(data.user);
          onClose();
          return;
        }
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.error) {
          setIsSubmitting(false);
          setErrorMsg(errData.error);
          return;
        }
      }
    } catch (err) {
      console.warn('API register unreachable, falling back to local creation:', err);
    }

    // 2. Fallback local creation
    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: cleanEmail,
      role: desiredRole,
      organization: organization.trim() || (desiredRole === 'researcher' ? 'Centre de Recherche' : desiredRole === 'institution' ? 'Université' : desiredRole === 'student' ? 'Faculté / Université' : 'Grand Public'),
      created_at: new Date().toISOString(),
      status: 'active',
      subscription: desiredRole === 'researcher' ? {
        plan: 'Chercheur B2C',
        expiresAt: '2027-10-24',
        status: 'active',
      } : desiredRole === 'student' ? {
        plan: 'Étudiant Académique',
        expiresAt: '2027-06-30',
        status: 'active',
      } : undefined,
    };

    try {
      const raw = localStorage.getItem('dzherba_local_users');
      const list: User[] = raw ? JSON.parse(raw) : [];
      list.unshift(newUser);
      localStorage.setItem('dzherba_local_users', JSON.stringify(list));
    } catch (e) {}

    setIsSubmitting(false);
    onLoginSuccess(newUser);
    onClose();
  };

  const handleQuickDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.pass);
    onLoginSuccess(account.user);
    onClose();
  };

  const getRoleBadgeLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return `🛡️ ${t.adminBadge}`;
      case 'researcher':
        return `🔬 ${t.researcherBadge}`;
      case 'institution':
        return `🏛️ ${t.campusBadge}`;
      case 'student':
        return `🎓 ${t.studentBadge}`;
      default:
        return `👤 ${t.citizenBadge}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with DzHerba Branding */}
        <div className="bg-linear-to-r from-[#2D4A41] via-[#426B5F] to-[#5A8C7E] text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-5 end-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#CD9850] text-[#0B0B0B]">
              {t.secureBadge}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {t.authTitle}
          </h2>
          <p className="text-xs text-white/80 mt-1 font-cairo">
            {t.authSubtitle}
          </p>

          {/* Tab switch */}
          <div className="flex items-center gap-2 mt-6 bg-black/20 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-[#0B0B0B] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {t.loginTab}
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-[#0B0B0B] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {t.registerTab}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.emailLabel}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@dzherba.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.passwordLabel}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.loginActionBtn}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.fullNameLabel}</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Dr. Karim Mansouri"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.emailLabel}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="chercheur@univ-alger.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.passwordLabel}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">
                  {currentLang === 'ar' ? 'المؤسسة / الهيئة (اختياري)' : 'Organisation / Établissement (Optionnel)'}
                </label>
                <input
                  type="text"
                  placeholder="ex: Université Alger 1, Laboratoire Pharmaceutique, Pharmacie Centrale..."
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.roleLabel}</label>
                <select
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] font-semibold text-[#0B0B0B]"
                >
                  <option value="free">{t.roleFree}</option>
                  <option value="student">{t.roleStudent}</option>
                  <option value="researcher">{t.roleResearcher}</option>
                  <option value="institution">{t.roleInstitution}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#CD9850] hover:bg-[#A87635] text-[#0B0B0B] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? (currentLang === 'ar' ? 'جاري التسجيل...' : 'Création en cours...') : t.registerActionBtn}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick 1-Click Login Accounts for Demonstration */}
          <div className="pt-4 border-t border-[#E1D3BE]/70 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#575D5A] uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-[#CD9850]" />
              <span>{t.testAccountsTitle}</span>
            </div>
            <p className="text-[11px] text-[#575D5A]">
              {t.testAccountsSub}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="p-2.5 rounded-xl border border-[#E1D3BE] hover:border-[#426B5F] hover:bg-[#F5F3F3] text-start transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B0B0B] group-hover:text-[#426B5F]">
                      {getRoleBadgeLabel(acc.user.role)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">1-clic</span>
                  </div>
                  <span className="text-[10px] text-[#575D5A] font-mono truncate block mt-0.5" dir="ltr">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
