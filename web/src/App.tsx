import { useState, useMemo, useEffect } from 'react';
import initialPlantsRaw from './data/plants.json';
import type { Plant, ViewTab, User, Language, PricingPlan, LicenseStatus } from './types';
import { translations } from './i18n';
import { api } from './services/api';
import { matchPlantMultilingual, scorePlantMatch, searchPlantsMultilingual } from './utils/multilingualSearch';
import { Navbar } from './components/Navbar';
import { PlantCard, formatImageUrl } from './components/PlantCard';
import { PlantDetailModal } from './components/PlantDetailModal';
import { AlgeriaMap } from './components/AlgeriaMap';
import { PlantIdentifier } from './components/PlantIdentifier';
import { AIAssistant } from './components/AIAssistant';
import { PricingSection } from './components/PricingSection';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { TrialActivationModal, TrialExpiredLockScreen } from './components/TrialModal';
import { UserHistoryView } from './components/UserHistoryView';
import { UserWorkspaceView } from './components/UserWorkspaceView';
import { Footer } from './components/Footer';
import { 
  Search, Sparkles, Camera, 
  BookOpen, ArrowRight, ChevronRight,
  Leaf, ShieldAlert, LogIn, History, Bookmark, X
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [currentLang, setCurrentLang] = useState<Language>('fr');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('dzherba_current_user');
      if (stored) {
        return JSON.parse(stored);
      }
      if (localStorage.getItem('dzherba_logged_out') === 'true') {
        return null;
      }
    } catch (e) {
      console.warn('Error reading currentUser:', e);
    }
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [plantsList, setPlantsList] = useState<Plant[]>(initialPlantsRaw as Plant[]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Dynamic Pricing Plans synced with LocalStorage / Admin
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => {
    try {
      const saved = localStorage.getItem('dzherba_pricing_plans');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'plan_free',
        name: 'Niveau 1 : Freemium Public',
        nameAr: 'المستوى 1 : المجاني (عام)',
        badge: 'Public / Éducation',
        priceDZD: 0,
        period: 'one_time',
        role: 'free',
        highlighted: false,
        features: [
          'Noms latins & noms vernaculaires algériens',
          'Usages traditionnels de base',
          'Alertes de toxicité essentielles',
          'Identification par photo (3 scans / jour)'
        ],
        featuresAr: [
          'الأسماء العلمية والأسماء الشعبية بالدارجة',
          'الاستعمالات الشعبية والتقليدية الأساسية',
          'تنبيهات السمية والسلامة الأولية',
          'التعرف على النباتات بالصور (3 فحوصات/يوم)'
        ]
      },
      {
        id: 'plan_researcher_annual',
        name: 'Niveau 2 : Chercheur & Étudiant',
        nameAr: 'المستوى 2 : الباحثين والطلبة',
        badge: 'Populaire B2C',
        priceDZD: 9800,
        period: 'annual',
        role: 'researcher',
        highlighted: true,
        features: [
          'Tout le contenu gratuit inclus',
          'Phytochimie complète (GC-MS, HPLC, tanins, flavonoïdes)',
          'Résultats expérimentaux in vitro et in vivo',
          'Téléchargement des monographies PDF scientifiques',
          'IA reconnaissance photo & Assistant LLM illimités'
        ],
        featuresAr: [
          'كافة مميزات الحساب المجاني مشمولة',
          'التركيب الكيميائي الدقيق (GC-MS, HPLC, مركبات فعالة)',
          'النتائج الدوائية والتجريبية المخبرية',
          'تصدير وتحميل التقارير العلمية بتنسيق PDF',
          'فحص الصور ومساعد الذكاء الاصطناعي بدون حدود'
        ]
      },
      {
        id: 'plan_institution',
        name: 'Niveau 3 : Campus & Laboratoire',
        nameAr: 'المستوى 3 : الجامعات والمخابر',
        badge: 'Convention Univ B2B',
        priceDZD: 85000,
        period: 'annual',
        role: 'institution',
        highlighted: false,
        features: [
          'Tous les droits de recherche B2C inclus',
          'Accès multipostes simultanés pour étudiants et enseignants',
          'Export massif des données pour thèses de doctorat',
          'Intégration API avec le portail de la bibliothèque universitaire',
          'Support scientifique dédié et mise à jour prioritaire'
        ],
        featuresAr: [
          'كافة صلاحيات الباحثين مشمولة بالكامل',
          'ولوج جماعي متعدد الأجهزة لأساتذة وطلبة الكلية',
          'تصدير كمي للبيانات لإعداد أطروحات الدكتوراه',
          'ربط برمجي مع المكتبة الجامعية الرقمية',
          'مرافقة ودعم علمي وتقني مخصص'
        ]
      }
    ];
  });

  // Search & Filters state for the Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeroSearchFocused, setIsHeroSearchFocused] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [onlyWithImages, setOnlyWithImages] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'photos_first' | 'id_asc' | 'name_asc'>('photos_first');

  const t = translations[currentLang];

  // Suggestions incrémentielles en temps réel pour la barre de recherche Hero
  const heroSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchPlantsMultilingual(plantsList, searchQuery, 6);
  }, [plantsList, searchQuery]);

  // Count illustrated species and total photos
  const totalIllustratedPlants = useMemo(() => {
    return plantsList.filter(p => p.images && p.images.length > 0).length;
  }, [plantsList]);

  const totalPhotosCount = useMemo(() => {
    return plantsList.reduce((acc, p) => acc + (p.images ? p.images.length : 0), 0);
  }, [plantsList]);

  // Fetch real plants directly from MySQL backend on load
  useEffect(() => {
    api.checkHealth().then((health) => {
      setDbConnected(health.status === 'online');
    });

    api.getPlants().then((plants) => {
      if (plants && plants.length >= 700) {
        setPlantsList(plants);
      } else if (plants && plants.length > 0) {
        console.warn(`[DzHerba] Backend returned ${plants.length} plants (< 700). Keeping full catalog of ${initialPlantsRaw.length} medicinal plants.`);
      }
    });
  }, []);

  // Sync RTL and language on document
  useEffect(() => {
    document.documentElement.lang = currentLang;
    if (currentLang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('lang-ar');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('lang-ar');
    }
  }, [currentLang]);

  // Extract distinct botanical families with count
  const familyOptions = useMemo(() => {
    const map = new Map<string, number>();
    plantsList.forEach((p) => {
      const fam = p.taxonomy?.family || 'Autre';
      map.set(fam, (map.get(fam) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [plantsList]);

  // Common therapeutic activities for filter
  const activityKeywords = useMemo(() => [
    { key: 'inflamm', label: currentLang === 'ar' ? 'مضاد للالتهابات' : currentLang === 'en' ? 'Anti-inflammatory' : 'Anti-inflammatoire' },
    { key: 'diabet', label: currentLang === 'ar' ? 'مضاد للسكري' : currentLang === 'en' ? 'Antidiabetic' : 'Antidiabétique' },
    { key: 'antioxid', label: currentLang === 'ar' ? 'مضاد للأكسدة' : currentLang === 'en' ? 'Antioxidant' : 'Antioxydant' },
    { key: 'microb', label: currentLang === 'ar' ? 'مضاد للجراثيم والميكروبات' : currentLang === 'en' ? 'Antimicrobial / Antibacterial' : 'Antimicrobien / Antibactérien' },
    { key: 'digest', label: currentLang === 'ar' ? 'صحة الجهاز الهضمي' : currentLang === 'en' ? 'Digestive / Gastrointestinal' : 'Digestif / Gastro-intestinal' },
    { key: 'wound', label: currentLang === 'ar' ? 'التئام الجروح والحروق' : currentLang === 'en' ? 'Wound healing / Vulnerary' : 'Cicatrisant' },
    { key: 'hyperten', label: currentLang === 'ar' ? 'صحة القلب والضغط' : currentLang === 'en' ? 'Cardiovascular / Hypotensive' : 'Antihypertenseur / Cardiovasculaire' },
    { key: 'fung', label: currentLang === 'ar' ? 'مضاد للفطريات' : currentLang === 'en' ? 'Antifungal' : 'Antifongique' },
  ], [currentLang]);

  // Filtered and sorted plants for catalog
  const filteredPlants = useMemo(() => {
    const list = plantsList.filter((plant) => {
      if (onlyWithImages) {
        if (!plant.images || plant.images.length === 0) return false;
      }

      if (searchQuery.trim()) {
        const matchesQuery = matchPlantMultilingual(plant, searchQuery);
        if (!matchesQuery) return false;
      }

      if (selectedFamily !== 'all') {
        if ((plant.taxonomy?.family || 'Autre') !== selectedFamily) return false;
      }

      if (selectedActivity !== 'all') {
        const fullPharma = ((plant.pharmacology?.activities || '') + ' ' + (plant.traditional_medicine?.uses || '')).toLowerCase();
        if (!fullPharma.includes(selectedActivity.toLowerCase())) return false;
      }

      if (selectedRegion !== 'all') {
        const fullDist = ((plant.distribution?.habitat_description || '') + ' ' + (plant.distribution?.regions || []).join(' ')).toLowerCase();
        if (!fullDist.includes(selectedRegion.toLowerCase())) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      // Si une recherche textuelle est active, trier d'abord par score de pertinence décroissant
      if (searchQuery.trim()) {
        const scoreA = scorePlantMatch(a, searchQuery);
        const scoreB = scorePlantMatch(b, searchQuery);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      if (sortBy === 'photos_first') {
        const aHas = a.images && a.images.length > 0 ? 1 : 0;
        const bHas = b.images && b.images.length > 0 ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas; // Plantes avec photos de terrain en premier !
        return a.id - b.id;
      }
      if (sortBy === 'name_asc') {
        return (a.scientific_name || '').localeCompare(b.scientific_name || '');
      }
      return a.id - b.id;
    });
  }, [plantsList, searchQuery, selectedFamily, selectedActivity, selectedRegion, onlyWithImages, sortBy]);

  // Featured sample plants on homepage with verified real field photos
  const featuredPlants = useMemo(() => {
    const targetNames = [
      'Oxalis pes-caprae',     // ID 191 (3 photos)
      'Ziziphus lotus',        // ID 771 (photos)
      'Peganum harmala',       // ID 195 (4 photos)
      'Eruca vesicaria',       // ID 192 (3 photos)
      'Salix babylonica',      // ID 193 (4 photos)
      'Anacyclus clavatus'     // ID 205 (4 photos)
    ];
    const list: Plant[] = [];
    targetNames.forEach((k) => {
      const found = plantsList.find(
        (p) => p.scientific_name?.toLowerCase().includes(k.toLowerCase()) && p.images && p.images.length > 0
      );
      if (found) list.push(found);
    });

    // Fallback: take the first plants that have real photos
    if (list.length < 6) {
      const withImgs = plantsList.filter((p) => p.images && p.images.length > 0);
      return withImgs.slice(0, 6);
    }
    return list;
  }, [plantsList]);

  // Open modal and persist history to MySQL
  const handleOpenPlantModal = (plant: Plant) => {
    setSelectedPlant(plant);
    if (currentUser) {
      api.recordHistory({
        userId: currentUser.id,
        type: 'view',
        title: `Consultation : ${plant.scientific_name}`,
        plantId: plant.id,
        metadata: { vernacular: plant.vernacular_raw, family: plant.taxonomy?.family }
      });
    }
  };

  // Perform search and persist history to MySQL
  const handlePerformSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentTab('catalog');
    if (q.trim() && currentUser) {
      api.recordHistory({
        userId: currentUser.id,
        type: 'search',
        title: `Recherche : ${q.trim()}`,
        queryText: q.trim()
      });
    }
  };

  // Admin CRUD Handlers synced with MySQL
  const handleAddPlant = async (newPlant: Plant) => {
    try {
      await api.createPlant(newPlant);
    } catch (e) {
      console.warn('Backend offline, adding locally:', e);
    }
    setPlantsList((prev) => [newPlant, ...prev]);
  };

  const handleUpdatePlant = async (updatedPlant: Plant) => {
    try {
      await api.updatePlant(updatedPlant.id, updatedPlant);
    } catch (e) {
      console.warn('Backend offline, updating locally:', e);
    }
    setPlantsList((prev) => prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p)));
    if (selectedPlant?.id === updatedPlant.id) {
      setSelectedPlant(updatedPlant);
    }
  };

  const handleDeletePlant = async (plantId: number) => {
    try {
      await api.deletePlant(plantId);
    } catch (e) {
      console.warn('Backend offline, deleting locally:', e);
    }
    setPlantsList((prev) => prev.filter((p) => p.id !== plantId));
    if (selectedPlant?.id === plantId) {
      setSelectedPlant(null);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('dzherba_current_user', JSON.stringify(user));
      localStorage.removeItem('dzherba_logged_out');
    } catch (e) {}
    if (user.role === 'admin') {
      setCurrentTab('admin');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('dzherba_current_user');
      localStorage.setItem('dzherba_logged_out', 'true');
    } catch (e) {}
    setCurrentUser(null);
    if (currentTab === 'admin' || currentTab === 'workspace') {
      setCurrentTab('home');
    }
  };

  const fetchLicenseStatus = async () => {
    try {
      const res = await fetch('/api/license/status');
      if (res.ok) {
        const data = await res.json();
        setLicense(data);
      }
    } catch (e) {
      console.warn('Backend license check offline:', e);
    }
  };

  useEffect(() => {
    fetchLicenseStatus();
    const timer = setInterval(fetchLicenseStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  const effectiveRole = currentUser ? currentUser.role : 'guest';

  return (
    <div className={`min-h-screen flex flex-col bg-[#F5F3F3] ${currentLang === 'ar' ? 'font-cairo' : ''}`}>
      {/* Top Navbar with Multi-Language & Real MySQL Support */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        plantCount={plantsList.length}
        currentUser={currentUser}
        currentLang={currentLang}
        onChangeLanguage={setCurrentLang}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        dbConnected={dbConnected}
      />

      {/* Main Content Area based on active Tab */}
      <main className="flex-1">
        {/* TAB 1: HOME PAGE */}
        {currentTab === 'home' && (
          <div className="space-y-16 pb-16">
            {/* HERO SECTION WITH TRANSPARENT BOTANICAL BACKGROUND */}
            <section className="relative overflow-hidden text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8">
              {/* Background Representative Botanical Image with Transparency & Gradient Blend */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                {/* Real Botanical Medicinal Flora Image */}
                <img
                  src="/hero-botanical-bg.jpg"
                  onError={(e) => {
                    // Fallback to high-res online botanical imagery
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=2400&q=85";
                  }}
                  alt="Flore Médicinale & Botanique d'Algérie"
                  className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000 ease-out"
                />

                {/* Harmonious botanical emerald gradient with balanced transparency */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#182F27]/80 via-[#244238]/65 to-[#0E1A16]/90 backdrop-blur-[0.5px]" />

                {/* Subtle golden radial aura behind central hero content */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(205,152,80,0.18),transparent_70%)]" />

                {/* Subtle botanical dot matrix watermark */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#CD9850_1px,transparent_1px)] [background-size:24px_24px]" />

                {/* Decorative Botanical Branch Watermarks with Transparency */}
                <svg
                  className="absolute -top-10 -right-16 w-80 h-80 sm:w-96 sm:h-96 text-emerald-300/15 transform rotate-12 pointer-events-none"
                  viewBox="0 0 200 200"
                  fill="currentColor"
                >
                  <path d="M42.7,-72.2C54.6,-66.1,63.1,-53.4,70.5,-40.1C77.8,-26.8,84.1,-13.4,83.4,-0.4C82.7,12.6,75,25.2,67.1,37.3C59.2,49.4,51.1,61,39.9,67.8C28.7,74.6,14.4,76.5,0.2,76.2C-14,75.9,-28,73.4,-39.8,66.8C-51.6,60.2,-61.2,49.5,-68.8,37.1C-76.4,24.7,-82,10.6,-80.4,-2.7C-78.8,-16,-70,-28.5,-60.8,-39.6C-51.6,-50.7,-42,-60.4,-30.7,-66.8C-19.4,-73.2,-6.4,-76.3,4.8,-83.8C16.1,-91.3,30.8,-78.3,42.7,-72.2Z" transform="translate(100 100)" opacity="0.4" />
                </svg>
                <svg
                  className="absolute -bottom-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 text-[#CD9850]/15 transform -rotate-45 pointer-events-none"
                  viewBox="0 0 200 200"
                  fill="currentColor"
                >
                  <path d="M38.1,-64.8C49.9,-58.5,60.5,-49,67.8,-37.2C75.1,-25.4,79.1,-11.3,78.2,2.5C77.3,16.3,71.5,29.8,63.4,41.4C55.3,53,44.9,62.7,32.7,68.2C20.5,73.7,6.5,75,-7.7,74.5C-21.9,74,-36.3,71.7,-48.3,64.8C-60.3,57.9,-69.9,46.4,-75.4,33.1C-80.9,19.8,-82.3,4.7,-79.8,-9.6C-77.3,-23.9,-70.9,-37.4,-61.1,-46.8C-51.3,-56.2,-38.1,-61.5,-25.1,-67C-12.1,-72.5,-0.7,-78.2,11.8,-75.2C24.3,-72.2,26.3,-71.1,38.1,-64.8Z" transform="translate(100 100)" opacity="0.3" />
                </svg>
              </div>
              
              <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-200 shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#CD9850]" />
                  <span>{t.hero.badge}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                  {t.hero.title1} <br className="hidden sm:inline" />
                  <span className="text-[#CD9850] font-serif italic">{t.hero.title2}</span>
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-xs">
                  {t.hero.desc}
                </p>

                {/* Floating Translucent Plant Highlights with Real Photos */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePerformSearch('Artemisia')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-xs text-white/95 shadow-md transition-all cursor-pointer group"
                    title="Découvrir le Chih (Artemisia)"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#CD9850] group-hover:scale-125 transition-transform" />
                    <span className="font-serif italic font-bold">Artemisia</span>
                    <span className="text-amber-200 font-cairo">(الشيح الأبيض)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePerformSearch('Oxalis pes-caprae')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-xs text-white/95 shadow-md transition-all cursor-pointer group"
                    title="Consulter Oxalis pes-caprae"
                  >
                    <img
                      src="/startup/startup/191/62049064.jpg"
                      alt="Oxalis pes-caprae"
                      className="w-5 h-5 rounded-md object-cover border border-[#CD9850]/50"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="font-serif italic font-bold">Oxalis pes-caprae</span>
                    <span className="text-amber-200 font-cairo">(قارصة / حميضة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePerformSearch('Ziziphus')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-xs text-white/95 shadow-md transition-all cursor-pointer group"
                    title="Consulter Ziziphus lotus"
                  >
                    <img
                      src="/startup/startup/771/ziziphus-lotus-sub-saharae-full-640-548.png"
                      alt="Ziziphus lotus"
                      className="w-5 h-5 rounded-md object-cover border border-[#CD9850]/50"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="font-serif italic font-bold">Ziziphus lotus</span>
                    <span className="text-amber-200 font-cairo">(السدرة)</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs text-emerald-100 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{plantsList.length} {currentLang === 'ar' ? 'نوع نباتي جزائري' : currentLang === 'en' ? 'Algerian Species' : 'Espèces Algériennes'}</span>
                  </div>
                </div>

                {/* Instant Hero Search Bar */}
                <div className="max-w-2xl mx-auto pt-4 relative z-30">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsHeroSearchFocused(false);
                      handlePerformSearch(searchQuery);
                    }}
                    className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl border-2 border-[#CD9850]"
                  >
                    <Search className="w-5 h-5 text-[#426B5F] mx-3 shrink-0" />
                    <input
                      type="text"
                      placeholder={t.hero.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsHeroSearchFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setIsHeroSearchFocused(false), 250);
                      }}
                      className="w-full px-2 py-2 text-xs sm:text-sm text-[#0B0B0B] bg-transparent focus:outline-hidden"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer me-2 shrink-0 transition-colors"
                        title={currentLang === 'ar' ? 'مسح' : 'Effacer'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      {t.hero.exploreBtn}
                    </button>
                  </form>

                  {/* Suggestions incrémentielles en direct au fil de la frappe */}
                  {isHeroSearchFocused && searchQuery.trim().length >= 1 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-[#CD9850]/40 overflow-hidden z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2.5 px-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#426B5F] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {currentLang === 'ar' ? 'نتائج فورية أثناء الكتابة' : currentLang === 'en' ? 'Live Instant Results' : 'Résultats instantanés au fil de la frappe'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {heroSuggestions.length} {currentLang === 'ar' ? 'نوع مقترح' : 'espèces suggérées'}
                        </span>
                      </div>

                      {heroSuggestions.length === 0 ? (
                        <div className="p-5 text-center text-xs text-gray-500">
                          {currentLang === 'ar' ? 'لا توجد نتائج مطابقة، جرّب كتابة اسم آخر' : 'Aucune plante trouvée pour cette recherche'}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                          {heroSuggestions.map((plant) => {
                            const hasImg = plant.images && plant.images.length > 0;
                            const imgUrl = hasImg ? formatImageUrl(plant.images[0]) : null;
                            return (
                              <div
                                key={plant.id}
                                onMouseDown={() => {
                                  setIsHeroSearchFocused(false);
                                  handleOpenPlantModal(plant);
                                }}
                                className="p-3 hover:bg-[#F5F3F3] cursor-pointer flex items-center gap-3 transition-colors group"
                              >
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={plant.scientific_name}
                                    className="w-10 h-10 rounded-xl object-cover border border-[#CD9850]/30 shrink-0 group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-[#426B5F]">
                                    <Leaf className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs sm:text-sm text-[#0B0B0B] truncate group-hover:text-[#426B5F] transition-colors">
                                    {plant.scientific_name}
                                  </div>
                                  <div className="text-[11px] text-[#CD9850] truncate font-medium">
                                    {plant.vernacular_raw || (Array.isArray(plant.vernacular_names) ? plant.vernacular_names.join(', ') : '') || 'Plante médicinale'}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold border border-gray-200">
                                    {plant.taxonomy?.family || 'Flore'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div
                        onMouseDown={() => {
                          setIsHeroSearchFocused(false);
                          handlePerformSearch(searchQuery);
                        }}
                        className="p-3 bg-[#426B5F]/10 hover:bg-[#426B5F]/20 text-[#426B5F] text-xs font-bold text-center cursor-pointer transition-colors border-t border-gray-100 flex items-center justify-center gap-2"
                      >
                        <span>{currentLang === 'ar' ? 'عرض جميع النتائج في الفهرس النباتي الكامل' : currentLang === 'en' ? 'Open full results in Botanical Catalog' : 'Voir tous les résultats dans le catalogue complet'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Platform Stats from Database */}
                <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-3xl font-extrabold text-[#CD9850]">{plantsList.length}</div>
                    <div className="text-xs text-white/70 mt-1">{t.hero.stats.plants}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-3xl font-extrabold text-[#CD9850]">{familyOptions.length}</div>
                    <div className="text-xs text-white/70 mt-1">{t.hero.stats.families}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-3xl font-extrabold text-[#CD9850]">58</div>
                    <div className="text-xs text-white/70 mt-1">{t.hero.stats.wilayas}</div>
                  </div>
                  <div 
                    onClick={() => {
                      setCurrentTab('catalog');
                      setOnlyWithImages(true);
                      window.scrollTo({ top: 600, behavior: 'smooth' });
                    }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-[#CD9850]/50 transition-all cursor-pointer group shadow-lg"
                    title={currentLang === 'ar' ? 'انقر لعرض النباتات المزودة بصور حقيقية' : 'Cliquer pour afficher directement les espèces avec photos réelles'}
                  >
                    <div className="text-3xl font-extrabold text-[#CD9850] group-hover:scale-105 transition-transform flex items-center justify-center gap-1.5">
                      <span>{totalPhotosCount > 0 ? totalPhotosCount : '1 661'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CD9850] text-[#0B0B0B] font-bold font-mono">
                        {totalIllustratedPlants} sp.
                      </span>
                    </div>
                    <div className="text-xs text-amber-200 mt-1 font-bold flex items-center justify-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {currentLang === 'ar' ? 'معرض الصور (323 نبتة)' : 'Photothèque (323 espèces)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK FEATURES ACCESS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div 
                  onClick={() => setCurrentTab('catalog')}
                  className="bg-white rounded-3xl p-6 border border-[#E1D3BE] shadow-lg hover:shadow-xl hover:border-[#426B5F] transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#426B5F]/10 text-[#426B5F] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#0B0B0B] group-hover:text-[#426B5F] transition-colors">
                    {t.features.encyclopediaTitle}
                  </h3>
                  <p className="text-xs text-[#575D5A] leading-relaxed">
                    {t.features.encyclopediaDesc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#426B5F]">
                    {t.features.consult} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </span>
                </div>

                <div 
                  onClick={() => setCurrentTab('workspace')}
                  className="bg-white rounded-3xl p-6 border border-[#E1D3BE] shadow-lg hover:shadow-xl hover:border-[#426B5F] transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#CD9850]/15 text-[#CD9850] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#0B0B0B] group-hover:text-[#426B5F] transition-colors">
                    {currentLang === 'ar' ? 'معشبتي الرقمية & PharmaCheck' : 'Mon Herbier Virtuel & Sécurité'}
                  </h3>
                  <p className="text-xs text-[#575D5A] leading-relaxed">
                    {currentLang === 'ar' ? 'فاحص التداخلات الدوائية، وتوثيق النباتات المفضلة والملاحظات الميدانية.' : 'Favoris personnels, vérificateur d’interactions médicamenteuses et signalements.'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#CD9850]">
                    {currentLang === 'ar' ? 'دخول المعشبة' : 'Accéder'} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </span>
                </div>

                <div 
                  onClick={() => setCurrentTab('identify')}
                  className="bg-white rounded-3xl p-6 border border-[#E1D3BE] shadow-lg hover:shadow-xl hover:border-[#426B5F] transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#426B5F]/10 text-[#426B5F] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#0B0B0B] group-hover:text-[#426B5F] transition-colors">
                    {t.features.identifyTitle}
                  </h3>
                  <p className="text-xs text-[#575D5A] leading-relaxed">
                    {t.features.identifyDesc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#426B5F]">
                    {t.features.testIA} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </span>
                </div>

                <div 
                  onClick={() => setCurrentTab('history')}
                  className="bg-white rounded-3xl p-6 border border-[#E1D3BE] shadow-lg hover:shadow-xl hover:border-[#426B5F] transition-all cursor-pointer group space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#0B0B0B] group-hover:text-[#426B5F] transition-colors">
                    {currentLang === 'ar' ? 'سجل النشاط والاستخدام' : 'Historique d’Activité'}
                  </h3>
                  <p className="text-xs text-[#575D5A] leading-relaxed">
                    {currentLang === 'ar' ? 'استرجع كافة عمليات البحث والمعاينات والأسئلة السابقة المحفوظة.' : 'Consultez vos recherches antérieures, fiches ouvertes et scans enregistrés en base.'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600">
                    {currentLang === 'ar' ? 'عرض السجل' : 'Voir l’historique'} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </section>

            {/* FEATURED BOTANICAL SPECIMENS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#CD9850]">
                    {currentLang === 'ar' ? 'التراث النباتي الطبي' : currentLang === 'en' ? 'Medicinal Flora Heritage' : 'Patrimoine Médicinal'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B0B0B]">
                    {currentLang === 'ar' ? 'أهم النباتات الطبية الشائعة في الجزائر' : currentLang === 'en' ? 'Major Medicinal Flora of Algeria' : 'Plantes Médicinales Majeures en Algérie'}
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentTab('catalog')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#426B5F] hover:underline cursor-pointer"
                >
                  <span>{currentLang === 'ar' ? `عرض كافة النباتات (${plantsList.length})` : currentLang === 'en' ? `Browse all ${plantsList.length} species` : `Voir les ${plantsList.length} espèces`}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onOpenModal={handleOpenPlantModal}
                    currentLang={currentLang}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: COMPLETE ENCYCLOPEDIA / CATALOG */}
        {currentTab === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#CD9850]">
                  {t.nav.catalog}
                </span>
                <h1 className="text-3xl font-extrabold text-[#0B0B0B]">
                  {currentLang === 'ar' ? 'فهرس وموسوعة النباتات الطبية' : currentLang === 'en' ? 'Medicinal Flora Directory' : 'Répertoire des Plantes Médicinales'}
                </h1>
                <p className="text-xs sm:text-sm text-[#575D5A]">
                  {filteredPlants.length} / {plantsList.length} {t.plantCount}
                </p>
              </div>

              {(searchQuery || selectedFamily !== 'all' || selectedActivity !== 'all' || selectedRegion !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFamily('all');
                    setSelectedActivity('all');
                    setSelectedRegion('all');
                  }}
                  className="text-xs font-bold text-[#426B5F] hover:underline self-start sm:self-center cursor-pointer"
                >
                  {t.common.resetFilters}
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-[#E1D3BE] shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#575D5A] absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      currentLang === 'ar'
                        ? 'بحث متعدد اللغات بالفرنسية، العربية، الإنجليزية أو اللاتينية (شيح، ثوم، Romarin...)'
                        : currentLang === 'en'
                        ? 'Multilingual Search in English, French, Arabic or Latin (Wormwood, Romarin, شيح...)'
                        : 'Recherche multilingue en Français, Arabe, Anglais, Latin (Thym, Romarin, شيح...)'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePerformSearch(searchQuery);
                    }}
                    className="w-full ps-9 pe-8 py-2 text-xs rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      title={currentLang === 'ar' ? 'مسح' : 'Effacer'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F] text-[#0B0B0B]"
                  >
                    <option value="all">{t.common.allFamilies} ({familyOptions.length})</option>
                    {familyOptions.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name} ({f.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F] text-[#0B0B0B]"
                  >
                    <option value="all">{t.common.allActivities}</option>
                    {activityKeywords.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F] text-[#0B0B0B]"
                  >
                    <option value="all">{t.common.allRegions}</option>
                    <option value="alger">{currentLang === 'ar' ? 'الجزائر والمتيجة' : currentLang === 'en' ? 'Algiers & Mitidja' : 'Alger & Mitidja (الجزائر والمتيجة)'}</option>
                    <option value="kabylie">{currentLang === 'ar' ? 'القبائل (تيزي وزو / بجاية)' : currentLang === 'en' ? 'Kabylie (Tizi Ouzou / Bejaia)' : 'Kabylie (القبائل - تيزي وزو / بجاية)'}</option>
                    <option value="tlemcen">{currentLang === 'ar' ? 'تلمسان والساحل الغربي' : currentLang === 'en' ? 'Tlemcen & Western Coast' : 'Tlemcen & Ouest (تلمسان والساحل الغربي)'}</option>
                    <option value="constantine">{currentLang === 'ar' ? 'قسنطينة وقالمة' : currentLang === 'en' ? 'Constantine & Guelma' : 'Constantine & Guelma (قسنطينة وقالمة)'}</option>
                    <option value="aurès">{currentLang === 'ar' ? 'الأوراس وباتنة' : currentLang === 'en' ? 'Aures & Batna' : 'Aurès & Batna (الأوراس وباتنة)'}</option>
                    <option value="sétif">{currentLang === 'ar' ? 'سطيف والهضاب العليا' : currentLang === 'en' ? 'High Plateaus & Setif' : 'Hauts Plateaux (سطيف والهضاب العليا)'}</option>
                    <option value="sahara">{currentLang === 'ar' ? 'الصحراء والواحات' : currentLang === 'en' ? 'Sahara & Oases' : 'Sahara (الصحراء - بسكرة، غرداية، ورقلة)'}</option>
                  </select>
                </div>
              </div>

              {/* Quick Photothèque Toggle & Sort Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[#E1D3BE]/60 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setOnlyWithImages(false)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      !onlyWithImages
                        ? 'bg-[#426B5F] text-white shadow-xs'
                        : 'bg-[#F5F3F3] text-[#575D5A] hover:bg-[#E1D3BE]/50'
                    }`}
                  >
                    {currentLang === 'ar' ? `كل الأنواع (${plantsList.length})` : `Toutes les espèces (${plantsList.length})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlyWithImages(true)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      onlyWithImages
                        ? 'bg-[#CD9850] text-[#0B0B0B] shadow-xs ring-2 ring-[#CD9850]/50'
                        : 'bg-[#CD9850]/15 text-[#916223] hover:bg-[#CD9850]/25'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {currentLang === 'ar' 
                        ? `📷 صور حقيقية فقط (${totalIllustratedPlants})` 
                        : `📷 Avec photos réelles uniquement (${totalIllustratedPlants})`}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-[#575D5A]">
                  <span className="font-medium">{currentLang === 'ar' ? 'الترتيب:' : 'Trier par :'}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] font-bold text-[#0B0B0B] focus:outline-hidden cursor-pointer"
                  >
                    <option value="photos_first">{currentLang === 'ar' ? 'الصور الحقيقية أولاً (موصى به)' : 'Photos réelles en premier (Recommandé)'}</option>
                    <option value="id_asc">{currentLang === 'ar' ? 'رقم المعرف (#1 - #773)' : 'Numéro d\'index (#1 à #773)'}</option>
                    <option value="name_asc">{currentLang === 'ar' ? 'الاسم اللاتيني (A-Z)' : 'Nom scientifique (A-Z)'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Plants Grid */}
            {filteredPlants.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#E1D3BE] space-y-3">
                <Leaf className="w-12 h-12 text-[#CD9850]/50 mx-auto" />
                <h3 className="text-base font-bold text-[#0B0B0B]">
                  {t.common.noPlantsFound}
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onOpenModal={handleOpenPlantModal}
                    currentLang={currentLang}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER WORKSPACE (HERBARIUM, PHARMACHECK, OBSERVATIONS) */}
        {currentTab === 'workspace' && (
          <UserWorkspaceView
            currentUser={currentUser}
            allPlants={plantsList}
            onOpenPlantModal={handleOpenPlantModal}
            onUpgradeTier={() => setCurrentTab('pricing')}
            currentLang={currentLang}
          />
        )}

        {/* TAB 4: USER HISTORY (LIVE MYSQL) */}
        {currentTab === 'history' && (
          <UserHistoryView
            currentUser={currentUser}
            onSelectPlant={(plantId) => {
              const p = plantsList.find(x => x.id === plantId);
              if (p) handleOpenPlantModal(p);
            }}
            onApplySearchQuery={handlePerformSearch}
            currentLang={currentLang}
          />
        )}

        {/* TAB 5: ALGERIA MAP */}
        {currentTab === 'map' && (
          <AlgeriaMap
            plants={plantsList}
            onOpenPlantModal={handleOpenPlantModal}
            currentLang={currentLang}
          />
        )}

        {/* TAB 6: IDENTIFY VIA AI */}
        {currentTab === 'identify' && (
          <PlantIdentifier
            plants={plantsList}
            onOpenPlantModal={handleOpenPlantModal}
            isPremium={effectiveRole !== 'guest' && effectiveRole !== 'free'}
            onUpgradeToPremium={() => setCurrentTab('pricing')}
            currentLang={currentLang}
          />
        )}

        {/* TAB 7: AI ASSISTANT */}
        {currentTab === 'assistant' && (
          <AIAssistant
            plants={plantsList}
            onOpenPlantModal={handleOpenPlantModal}
            currentLang={currentLang}
          />
        )}

        {/* TAB 8: PRICING & SUBSCRIPTIONS */}
        {currentTab === 'pricing' && (
          <PricingSection
            userRole={effectiveRole}
            plans={pricingPlans}
            onChangeUserRole={(newRole) => {
              if (currentUser) {
                const updatedUser: User = {
                  ...currentUser,
                  role: newRole,
                  subscription: newRole !== 'free' ? {
                    plan: newRole === 'institution' ? 'Licence Campus B2B' : 'Chercheur B2C',
                    expiresAt: '2027-10-24',
                    status: 'active',
                  } : undefined,
                };
                setCurrentUser(updatedUser);
                try {
                  localStorage.setItem('dzherba_current_user', JSON.stringify(updatedUser));
                } catch (e) {}
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            currentLang={currentLang}
          />
        )}

        {/* TAB 9: ADMIN DASHBOARD (PROTECTED) */}
        {currentTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              plants={plantsList}
              onAddPlant={handleAddPlant}
              onUpdatePlant={handleUpdatePlant}
              onDeletePlant={handleDeletePlant}
              onOpenPlantModal={handleOpenPlantModal}
              pricingPlans={pricingPlans}
              onUpdatePricingPlans={(newPlans) => {
                setPricingPlans(newPlans);
                try {
                  localStorage.setItem('dzherba_pricing_plans', JSON.stringify(newPlans));
                } catch (e) {}
              }}
              currentLang={currentLang}
            />
          ) : (
            <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-md">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B0B0B]">
                {currentLang === 'ar' ? 'منطقة خاصة بإدارة المنصة' : currentLang === 'en' ? 'Restricted Administrator Area' : 'Accès Restreint aux Administrateurs'}
              </h2>
              <p className="text-xs sm:text-sm text-[#575D5A] leading-relaxed">
                {currentLang === 'ar'
                  ? 'هذه اللوحة مخصصة فقط لفريق إدارة DzHerba واللجان العلمية. يرجى تسجيل الدخول بحساب المشرف.'
                  : currentLang === 'en'
                  ? 'This dashboard is strictly reserved for the DzHerba administration team and scientific committees. Please log in with administrator credentials.'
                  : "Cette section est strictement réservée à l'équipe d'administration et aux comités scientifiques de DzHerba. Veuillez vous authentifier avec vos identifiants administrateur."}
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'تسجيل دخول المشرف' : currentLang === 'en' ? 'Administrator Login' : 'Connexion Administrateur'}</span>
              </button>
            </div>
          )
        )}
      </main>

      {/* Full Plant Monograph Modal with Access Control according to User */}
      <PlantDetailModal
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
        userRole={effectiveRole}
        onUpgradeToPremium={() => {
          setSelectedPlant(null);
          setCurrentTab('pricing');
        }}
        onEditPlant={() => {
          setSelectedPlant(null);
          setCurrentTab('admin');
        }}
        currentLang={currentLang}
      />

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentLang={currentLang}
      />

      {/* 15-Day Trial Activation Modal */}
      <TrialActivationModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        license={license}
        onLicenseUpdated={(newLic) => setLicense(newLic)}
        currentLang={currentLang}
      />

      {/* 15-Day Trial Expired Blocking Lock Screen */}
      {license?.isExpired && (
        <TrialExpiredLockScreen
          license={license}
          onLicenseUpdated={(newLic) => setLicense(newLic)}
          currentLang={currentLang}
        />
      )}

      {/* Footer */}
      <Footer onSelectTab={setCurrentTab} currentLang={currentLang} />
    </div>
  );
}

export default App;
