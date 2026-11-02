import React, { useState, useEffect } from 'react';
import type { Plant, SubscriptionRecord, Language, PricingPlan, User, UserRole } from '../types';
import { 
  ShieldCheck, Plus, Trash2, Edit3, Search, 
  CheckCircle2, Download, X, Image as ImageIcon,
  Upload, Loader2, Tag, Users, RefreshCw,
  GraduationCap, Building2, Shield, User as UserIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { translations } from '../i18n';
import { api } from '../services/api';
import { matchPlantMultilingual } from '../utils/multilingualSearch';
import { ConfirmModal } from './ConfirmModal';
import { NoticeModal } from './NoticeModal';
import { DEMO_ACCOUNTS } from './AuthModal';

interface AdminDashboardProps {
  plants: Plant[];
  onAddPlant: (newPlant: Plant) => void;
  onUpdatePlant: (updatedPlant: Plant) => void;
  onDeletePlant: (plantId: number) => void;
  onOpenPlantModal: (plant: Plant) => void;
  pricingPlans?: PricingPlan[];
  onUpdatePricingPlans?: (plans: PricingPlan[]) => void;
  currentLang?: Language;
}

const INITIAL_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: 'SUB-1049',
    userName: 'Dr. Amina Benali',
    userEmail: 'a.benali@univ-alger.dz',
    organization: 'Faculté de Pharmacie - Alger 1',
    plan: 'researcher_annual',
    status: 'active',
    startDate: '2026-09-01',
    endDate: '2027-09-01',
    amountDZD: 9800,
    paymentMethod: 'Edahabia',
    transactionRef: 'EDH-99238472',
  },
  {
    id: 'SUB-1048',
    userName: 'Karim Bouzid',
    userEmail: 'k.bouzid@cerist.dz',
    organization: 'Centre de Recherche Scientifique (CERIST)',
    plan: 'institution',
    status: 'active',
    startDate: '2026-01-15',
    endDate: '2027-01-15',
    amountDZD: 85000,
    paymentMethod: 'Convention_Univ',
    transactionRef: 'CONV-DZ-2026-04',
  },
  {
    id: 'SUB-1047',
    userName: 'Yasmine Mansouri',
    userEmail: 'y.mansouri@univ-setif.dz',
    organization: 'Département de Biologie - Sétif',
    plan: 'researcher_monthly',
    status: 'active',
    startDate: '2026-10-10',
    endDate: '2026-11-10',
    amountDZD: 1200,
    paymentMethod: 'CIB',
    transactionRef: 'CIB-58291044',
  },
  {
    id: 'SUB-1046',
    userName: 'Sofiane Cherif',
    userEmail: 's.cherif@gmail.com',
    organization: 'Herboristerie Traditionnelle Constantine',
    plan: 'researcher_annual',
    status: 'expired',
    startDate: '2025-10-01',
    endDate: '2026-10-01',
    amountDZD: 9800,
    paymentMethod: 'Edahabia',
    transactionRef: 'EDH-88301928',
  },
  {
    id: 'SUB-1045',
    userName: 'Faculté de Médecine Tlemcen',
    userEmail: 'biblio@univ-tlemcen.dz',
    organization: 'Université Abou Bekr Belkaïd',
    plan: 'institution',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2027-03-01',
    amountDZD: 85000,
    paymentMethod: 'Convention_Univ',
    transactionRef: 'CONV-DZ-2026-12',
  },
];

const DEFAULT_PLANS: PricingPlan[] = [
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  plants,
  onAddPlant,
  onUpdatePlant,
  onDeletePlant,
  onOpenPlantModal,
  pricingPlans = DEFAULT_PLANS,
  onUpdatePricingPlans,
  currentLang = 'fr',
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'plants' | 'users' | 'subscriptions' | 'pricing_config'>('plants');
  const [plantSearch, setPlantSearch] = useState('');
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(INITIAL_SUBSCRIPTIONS);
  
  // Plants Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // State for Users Management (MySQL dzherba_db users)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [plantImageFilter, setPlantImageFilter] = useState<'all' | 'with_photos' | 'without_photos'>('all');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEditRole, setUserToEditRole] = useState<User | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<UserRole>('free');

  // Local tariffs list
  const [plansList, setPlansList] = useState<PricingPlan[]>(pricingPlans.length > 0 ? pricingPlans : DEFAULT_PLANS);

  // State for Create / Edit Plant Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<number | null>(null);

  // Form Fields for Plant
  const [formScientificName, setFormScientificName] = useState('');
  const [formVernacularRaw, setFormVernacularRaw] = useState('');
  const [formFamily, setFormFamily] = useState('');
  const [formHabitat, setFormHabitat] = useState('');
  const [formTraditionalUses, setFormTraditionalUses] = useState('');
  const [formPhytochemistry, setFormPhytochemistry] = useState('');
  const [formPharmacology, setFormPharmacology] = useState('');
  const [formToxicity, setFormToxicity] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [pendingNewFiles, setPendingNewFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // State for Create / Edit Tariff Modal
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [editingTariffId, setEditingTariffId] = useState<string | null>(null);
  const [tariffName, setTariffName] = useState('');
  const [tariffNameAr, setTariffNameAr] = useState('');
  const [tariffBadge, setTariffBadge] = useState('');
  const [tariffPrice, setTariffPrice] = useState<number>(0);
  const [tariffPeriod, setTariffPeriod] = useState<'monthly' | 'annual' | 'one_time'>('annual');
  const [tariffRole, setTariffRole] = useState<'free' | 'student' | 'researcher' | 'institution'>('researcher');
  const [tariffFeaturesText, setTariffFeaturesText] = useState('');
  const [tariffHighlighted, setTariffHighlighted] = useState(false);

  // Modal dialog states (No window.confirm or window.alert!)
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const [imageToDelete, setImageToDelete] = useState<{ url: string; index?: number } | null>(null);
  const [tariffToDelete, setTariffToDelete] = useState<PricingPlan | null>(null);

  const [notice, setNotice] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showNotice = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotice({ isOpen: true, type, title, message });
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsersList(data);
          setIsLoadingUsers(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API users unreachable:', e);
    }

    // Fallback: merge DEMO_ACCOUNTS and locally registered users
    try {
      const raw = localStorage.getItem('dzherba_local_users');
      const localUsers: User[] = raw ? JSON.parse(raw) : [];
      const demoUsers = DEMO_ACCOUNTS.map((a) => a.user);
      const combined = [...localUsers, ...demoUsers];
      const unique = combined.filter((u, idx, arr) => arr.findIndex((x) => x.email.toLowerCase() === u.email.toLowerCase()) === idx);
      setUsersList(unique);
    } catch (e) {
      setUsersList(DEMO_ACCOUNTS.map((a) => a.user));
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleConfirmRoleChange = async () => {
    if (!userToEditRole) return;
    try {
      await fetch(`/api/users/${userToEditRole.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRoleForEdit })
      });
    } catch (e) {}

    setUsersList((prev) => prev.map((u) => u.id === userToEditRole.id ? { ...u, role: selectedRoleForEdit } : u));
    
    // Also update in local storage if exists
    try {
      const raw = localStorage.getItem('dzherba_local_users');
      if (raw) {
        const list: User[] = JSON.parse(raw);
        const updated = list.map((u) => u.id === userToEditRole.id ? { ...u, role: selectedRoleForEdit } : u);
        localStorage.setItem('dzherba_local_users', JSON.stringify(updated));
      }
    } catch (e) {}

    showNotice(
      currentLang === 'ar' ? 'تم تحديث الرتبة' : 'Privilèges mis à jour',
      currentLang === 'ar' ? `تم تغيير رتبة ${userToEditRole.name} إلى ${selectedRoleForEdit}.` : `Le rôle de ${userToEditRole.name} a été modifié avec succès en ${selectedRoleForEdit}.`,
      'success'
    );
    setUserToEditRole(null);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
    } catch (e) {}

    setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));

    try {
      const raw = localStorage.getItem('dzherba_local_users');
      if (raw) {
        const list: User[] = JSON.parse(raw);
        const updated = list.filter((u) => u.id !== userToDelete.id);
        localStorage.setItem('dzherba_local_users', JSON.stringify(updated));
      }
    } catch (e) {}

    showNotice(
      currentLang === 'ar' ? 'تم حذف الحساب' : 'Compte supprimé',
      currentLang === 'ar' ? `تم حذف حساب ${userToDelete.name} بنجاح.` : `Le compte de ${userToDelete.name} (${userToDelete.email}) a été supprimé de la base de données.`,
      'info'
    );
    setUserToDelete(null);
  };

  const t = translations[currentLang].adminDashboard;

  const filteredPlants = plants.filter((p) => {
    if (plantImageFilter === 'with_photos' && (!p.images || p.images.length === 0)) return false;
    if (plantImageFilter === 'without_photos' && p.images && p.images.length > 0) return false;
    if (!plantSearch.trim()) return true;
    return matchPlantMultilingual(p, plantSearch);
  });

  const totalPages = Math.max(1, Math.ceil(filteredPlants.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPlants.length);
  const paginatedPlants = filteredPlants.slice(startIndex, endIndex);

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    if (!matchesRole) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.organization || '').toLowerCase().includes(q)
    );
  });

  // --- PLANT CRUD HANDLERS ---
  const [isRetrainingVision, setIsRetrainingVision] = useState(false);

  const handleRetrainVision = async () => {
    setIsRetrainingVision(true);
    try {
      const res = await api.retrainVisionModel();
      showNotice(
        currentLang === 'ar' ? 'تم تحديث نموذج الرؤية IA' : 'Modèle IA Vision réentraîné',
        currentLang === 'ar'
          ? `تم تحديث وفهرسة ${res.count} صورة بنجاح عبر ${res.speciesCount} نبتة طبية.`
          : `Le modèle IA Vision a réindexé avec succès ${res.count} signatures visuelles sur ${res.speciesCount} espèces illustrées.`,
        'success'
      );
    } catch (err: any) {
      showNotice(
        'Erreur',
        err.message || 'Erreur lors du réentraînement du modèle',
        'error'
      );
    } finally {
      setIsRetrainingVision(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingPlantId(null);
    setFormScientificName('');
    setFormVernacularRaw('');
    setFormFamily('');
    setFormHabitat('');
    setFormTraditionalUses('');
    setFormPhytochemistry('');
    setFormPharmacology('');
    setFormToxicity('');
    setFormImages([]);
    setPendingNewFiles([]);
    setPendingPreviews([]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setFormScientificName(plant.scientific_name);
    setFormVernacularRaw(plant.vernacular_raw || '');
    setFormFamily(plant.taxonomy.family || '');
    setFormHabitat(plant.distribution.habitat_description || '');
    setFormTraditionalUses(plant.traditional_medicine.uses || '');
    setFormPhytochemistry(plant.pharmacology.phytochemical_profile || '');
    setFormPharmacology(plant.pharmacology.activities || '');
    setFormToxicity(plant.safety_profile.toxicity || '');
    setFormImages(plant.images || []);
    setPendingNewFiles([]);
    setPendingPreviews([]);
    setIsFormOpen(true);
  };

  const triggerDeleteImage = (imgUrl: string, pendingIndex?: number) => {
    setImageToDelete({ url: imgUrl, index: pendingIndex });
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;

    if (editingPlantId && imageToDelete.url) {
      try {
        const res = await api.deletePlantImage(editingPlantId, imageToDelete.url);
        setFormImages(res.images);
        const existing = plants.find(p => p.id === editingPlantId);
        if (existing) {
          onUpdatePlant({ ...existing, images: res.images });
        }
        showNotice(
          currentLang === 'ar' ? 'تم الحذف' : 'Image supprimée',
          currentLang === 'ar' ? 'تم حذف الصورة من الخادم بنجاح.' : "L'image a été supprimée du serveur.",
          'success'
        );
      } catch (err: any) {
        showNotice(
          currentLang === 'ar' ? 'خطأ' : 'Erreur',
          err.message || "Erreur de suppression d'image",
          'error'
        );
      }
    } else if (imageToDelete.index !== undefined) {
      const idx = imageToDelete.index;
      setPendingNewFiles(prev => prev.filter((_, i) => i !== idx));
      setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
    }
    setImageToDelete(null);
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    if (editingPlantId) {
      setIsUploadingImages(true);
      try {
        const res = await api.uploadPlantImages(editingPlantId, files);
        setFormImages(res.images);
        const existing = plants.find(p => p.id === editingPlantId);
        if (existing) {
          onUpdatePlant({ ...existing, images: res.images });
        }
        showNotice(
          currentLang === 'ar' ? 'تم الرفع' : 'Images téléversées',
          currentLang === 'ar' ? `تمت إضافة ${files.length} صورة بنجاح.` : `${files.length} photo(s) ajoutée(s) avec succès.`,
          'success'
        );
      } catch (err: any) {
        showNotice('Erreur', err.message || "Erreur de téléversement d'image", 'error');
      } finally {
        setIsUploadingImages(false);
        e.target.value = '';
      }
    } else {
      // New plant mode: queue files and generate instant previews
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPendingNewFiles(prev => [...prev, ...files]);
      setPendingPreviews(prev => [...prev, ...newPreviews]);
      e.target.value = '';
    }
  };

  const handleSavePlantForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formScientificName.trim()) {
      showNotice(
        currentLang === 'ar' ? 'تنبيه' : 'Validation',
        currentLang === 'ar' ? 'الاسم العلمي إلزامي.' : 'Le nom scientifique est obligatoire.',
        'error'
      );
      return;
    }

    if (editingPlantId !== null) {
      // Update
      const existing = plants.find((p) => p.id === editingPlantId);
      if (existing) {
        const updated: Plant = {
          ...existing,
          scientific_name: formScientificName,
          vernacular_raw: formVernacularRaw,
          taxonomy: { ...existing.taxonomy, family: formFamily },
          distribution: { ...existing.distribution, habitat_description: formHabitat },
          traditional_medicine: { ...existing.traditional_medicine, uses: formTraditionalUses },
          pharmacology: { activities: formPharmacology, phytochemical_profile: formPhytochemistry },
          safety_profile: { ...existing.safety_profile, toxicity: formToxicity },
          images: formImages,
        };
        onUpdatePlant(updated);
        showNotice(
          currentLang === 'ar' ? 'تم التحديث' : 'Plante mise à jour',
          currentLang === 'ar' ? `تم تحديث بيانات "${formScientificName}" بنجاح في قاعدة البيانات!` : `La fiche "${formScientificName}" a été enregistrée avec succès dans la base de données !`,
          'success'
        );
      }
      setIsFormOpen(false);
    } else {
      // Add new plant
      setIsUploadingImages(true);
      try {
        const nextId = Math.max(...plants.map((p) => p.id), 0) + 1;
        const newPlant: Plant = {
          id: nextId,
          scientific_name: formScientificName,
          vernacular_names: formVernacularRaw ? formVernacularRaw.split(/[,،]+/).map((s) => s.trim()) : [],
          vernacular_raw: formVernacularRaw,
          taxonomy: {
            kingdom: 'Plantae',
            order: '',
            family: formFamily,
            genus: formScientificName.split(' ')[0] || '',
            species: formScientificName.split(' ')[1] || '',
          },
          distribution: {
            habitat_description: formHabitat,
            flowering_harvesting: '',
            regions: [],
          },
          traditional_medicine: {
            uses: formTraditionalUses,
            parts_used: 'Feuilles, sommités fleuries',
            dosage: 'Usage traditionnel standard',
          },
          pharmacology: {
            activities: formPharmacology,
            phytochemical_profile: formPhytochemistry,
          },
          scientific_data: {
            experimental: 'Données expérimentales saisies par l\'administrateur.',
            clinical: '',
          },
          safety_profile: {
            toxicity: formToxicity,
            contraindications: '',
            drug_interactions: '',
            plant_interactions: '',
          },
          references: 'Enregistrement direct - Administration DzHerba',
          images: [],
        };

        await onAddPlant(newPlant);

        // Upload queued photos if any
        if (pendingNewFiles.length > 0) {
          const res = await api.uploadPlantImages(nextId, pendingNewFiles);
          onUpdatePlant({ ...newPlant, images: res.images });
        }

        showNotice(
          currentLang === 'ar' ? 'تمت الإضافة' : 'Nouvelle plante enregistrée',
          currentLang === 'ar' ? `تم تسجيل "${formScientificName}" مع صورها في قاعدة البيانات!` : `La plante "${formScientificName}" et ses photographies ont été créées dans la base de données !`,
          'success'
        );
        setIsFormOpen(false);
      } catch (err: any) {
        showNotice('Erreur', err.message || "Erreur de création de la plante", 'error');
      } finally {
        setIsUploadingImages(false);
      }
    }
  };

  const handleConfirmDeletePlant = () => {
    if (!plantToDelete) return;
    onDeletePlant(plantToDelete.id);
    showNotice(
      currentLang === 'ar' ? 'تم الحذف' : 'Plante supprimée',
      currentLang === 'ar' ? `تم حذف النبتة #${plantToDelete.id} (${plantToDelete.scientific_name}) بنجاح.` : `La plante #${plantToDelete.id} (${plantToDelete.scientific_name}) a été supprimée de la base de données.`,
      'info'
    );
    setPlantToDelete(null);
  };

  // --- TARIFF / PRICING CRUD HANDLERS ---
  const handleOpenAddTariff = () => {
    setEditingTariffId(null);
    setTariffName('');
    setTariffNameAr('');
    setTariffBadge('Nouveau Tarif');
    setTariffPrice(4900);
    setTariffPeriod('annual');
    setTariffRole('researcher');
    setTariffFeaturesText('Accès complet aux monographies\nRecherche phytochimique avancée\nExport des rapports en PDF');
    setTariffHighlighted(false);
    setIsTariffModalOpen(true);
  };

  const handleOpenEditTariff = (plan: PricingPlan) => {
    setEditingTariffId(plan.id);
    setTariffName(plan.name);
    setTariffNameAr(plan.nameAr || '');
    setTariffBadge(plan.badge);
    setTariffPrice(plan.priceDZD);
    setTariffPeriod(plan.period);
    setTariffRole(plan.role);
    setTariffFeaturesText((plan.features || []).join('\n'));
    setTariffHighlighted(Boolean(plan.highlighted));
    setIsTariffModalOpen(true);
  };

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tariffName.trim()) {
      showNotice(
        currentLang === 'ar' ? 'تنبيه' : 'Validation',
        currentLang === 'ar' ? 'اسم الخطة مطلوب.' : 'Le nom du tarif est obligatoire.',
        'error'
      );
      return;
    }

    const feats = tariffFeaturesText.split('\n').map(s => s.trim()).filter(Boolean);

    if (editingTariffId) {
      const updated = plansList.map(p => {
        if (p.id === editingTariffId) {
          return {
            ...p,
            name: tariffName,
            nameAr: tariffNameAr,
            badge: tariffBadge,
            priceDZD: Number(tariffPrice) || 0,
            period: tariffPeriod,
            role: tariffRole,
            features: feats,
            highlighted: tariffHighlighted,
          };
        }
        return p;
      });
      setPlansList(updated);
      if (onUpdatePricingPlans) onUpdatePricingPlans(updated);
      showNotice(
        currentLang === 'ar' ? 'تم الحفظ' : 'Tarif modifié',
        currentLang === 'ar' ? `تم تحديث خطة "${tariffName}" بنجاح.` : `Le plan tarifaire "${tariffName}" a été mis à jour avec succès.`,
        'success'
      );
    } else {
      const newPlan: PricingPlan = {
        id: `plan_${Date.now()}`,
        name: tariffName,
        nameAr: tariffNameAr,
        badge: tariffBadge,
        priceDZD: Number(tariffPrice) || 0,
        period: tariffPeriod,
        role: tariffRole,
        features: feats,
        highlighted: tariffHighlighted,
      };
      const updated = [...plansList, newPlan];
      setPlansList(updated);
      if (onUpdatePricingPlans) onUpdatePricingPlans(updated);
      showNotice(
        currentLang === 'ar' ? 'تمت الإضافة' : 'Nouveau tarif ajouté',
        currentLang === 'ar' ? `تمت إضافة خطة "${tariffName}" بنجاح.` : `Le plan tarifaire "${tariffName}" a été ajouté.`,
        'success'
      );
    }
    setIsTariffModalOpen(false);
  };

  const handleConfirmDeleteTariff = () => {
    if (!tariffToDelete) return;
    const updated = plansList.filter(p => p.id !== tariffToDelete.id);
    setPlansList(updated);
    if (onUpdatePricingPlans) onUpdatePricingPlans(updated);
    showNotice(
      currentLang === 'ar' ? 'تم الحذف' : 'Tarif supprimé',
      currentLang === 'ar' ? `تم حذف خطة "${tariffToDelete.name}".` : `Le plan tarifaire "${tariffToDelete.name}" a été supprimé.`,
      'info'
    );
    setTariffToDelete(null);
  };

  const toggleSubscriptionStatus = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id === subId) {
          const newStatus = sub.status === 'active' ? 'expired' : 'active';
          return { ...sub, status: newStatus };
        }
        return sub;
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Banner */}
      <div className="bg-linear-to-r from-[#0B0B0B] via-[#2D4A41] to-[#426B5F] text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CD9850] text-[#0B0B0B] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            {t.subtitle}
          </p>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-xl font-black text-[#CD9850]">{plants.length}</div>
            <div className="text-[10px] text-white/70 uppercase font-semibold">{t.stats.totalSpecies}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-xl font-black text-[#CD9850]">
              {subscriptions.filter((s) => s.status === 'active').length}
            </div>
            <div className="text-[10px] text-white/70 uppercase font-semibold">{t.stats.activeSubs}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-xl font-black text-[#CD9850]">{usersList.length}</div>
            <div className="text-[10px] text-white/70 uppercase font-semibold">{currentLang === 'ar' ? 'المستخدمين' : 'Comptes'}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-xl font-black text-[#CD9850]">190 800</div>
            <div className="text-[10px] text-white/70 uppercase font-semibold">{t.stats.dzdRevenue}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-xl font-black text-[#CD9850]">{plansList.length}</div>
            <div className="text-[10px] text-white/70 uppercase font-semibold">{currentLang === 'ar' ? 'الخطط' : 'Tarifs'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin */}
      <div className="flex items-center gap-2 border-b border-[#E1D3BE] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('plants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'plants'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          <span>{t.tabs.plants} ({plants.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'users'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{currentLang === 'ar' ? 'حسابات المستخدمين' : 'Comptes Utilisateurs'} ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'subscriptions'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          <span>{t.tabs.subscriptions} ({subscriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('pricing_config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'pricing_config'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          <span>{currentLang === 'ar' ? 'إدارة الأسعار والاشتراكات' : 'Gestion des Tarifs & Accès'} ({plansList.length})</span>
        </button>
      </div>

      {/* TAB 1: PLANTS CATALOG MANAGEMENT */}
      {activeAdminTab === 'plants' && (
        <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-[#0B0B0B]">
                {t.tabs.plants}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {t.plantsTab.searchPlaceholder}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.plantsTab.searchPlaceholder}
                  value={plantSearch}
                  onChange={(e) => {
                    setPlantSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="ps-9 pe-3 py-2 text-xs rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] w-48 sm:w-64 focus:outline-hidden focus:border-[#426B5F]"
                />
              </div>

              {/* Filter by Photo presence */}
              <select
                value={plantImageFilter}
                onChange={(e) => {
                  setPlantImageFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-[#F5F3F3] border border-[#E1D3BE] font-bold text-[#0B0B0B] focus:outline-hidden cursor-pointer"
              >
                <option value="all">{currentLang === 'ar' ? `جميع النباتات (${plants.length})` : `Toutes les plantes (${plants.length})`}</option>
                <option value="with_photos">
                  {currentLang === 'ar' 
                    ? `📷 مع صور حقيقية فقط (${plants.filter(p => p.images && p.images.length > 0).length})` 
                    : `📷 Avec photos uniquement (${plants.filter(p => p.images && p.images.length > 0).length})`}
                </option>
                <option value="without_photos">
                  {currentLang === 'ar' 
                    ? `بدون صور (${plants.filter(p => !p.images || p.images.length === 0).length})` 
                    : `Sans photo (${plants.filter(p => !p.images || p.images.length === 0).length})`}
                </option>
              </select>

              {/* Items per page selector */}
              <div className="flex items-center gap-1.5 text-xs text-[#575D5A] bg-[#F5F3F3] px-2.5 py-1.5 rounded-xl border border-[#E1D3BE]">
                <span>{currentLang === 'ar' ? 'لكل صفحة:' : 'Par page :'}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-[#0B0B0B] focus:outline-hidden cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={1000}>{currentLang === 'ar' ? 'الكل (773)' : 'Tout (773)'}</option>
                </select>
              </div>

              <button
                onClick={handleRetrainVision}
                disabled={isRetrainingVision}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CD9850] hover:bg-[#b8843e] text-[#0B0B0B] text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                title={currentLang === 'ar' ? 'إعادة تدريب وفهرسة جميع الصور' : 'Réentraîner et réindexer toutes les photos'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrainingVision ? 'animate-spin' : ''}`} />
                <span>
                  {isRetrainingVision
                    ? (currentLang === 'ar' ? 'جاري الفهرسة...' : 'Réentraînement en cours...')
                    : (currentLang === 'ar' ? '⚡ إعادة تدريب نموذج الرؤية IA' : '⚡ Réentraîner Modèle IA Vision')}
                </span>
              </button>

              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{t.plantsTab.addBtn}</span>
              </button>
            </div>
          </div>

          {/* Plants Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E1D3BE]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#F5F3F3] border-b border-[#E1D3BE] text-[#575D5A] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">{t.plantsTab.colId}</th>
                  <th className="p-3.5">{currentLang === 'ar' ? 'الصور' : 'Photo'}</th>
                  <th className="p-3.5">{t.plantsTab.colPlant}</th>
                  <th className="p-3.5">{t.plantsTab.colVernacular}</th>
                  <th className="p-3.5">{t.plantsTab.colFamily}</th>
                  <th className="p-3.5 text-end">{t.plantsTab.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1D3BE]/60 text-[#0B0B0B]">
                {paginatedPlants.map((plant) => (
                  <tr key={plant.id} className="hover:bg-[#F5F3F3]/60 transition-colors">
                    <td className="p-3.5 font-mono text-gray-500 font-semibold">#{plant.id}</td>
                    <td className="p-3.5">
                      {plant.images && plant.images.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={plant.images[0].replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, '')}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-[#E1D3BE]"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                          <span className="text-[10px] text-gray-500 font-mono font-bold">({plant.images.length})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-serif italic font-bold">
                      <button
                        onClick={() => onOpenPlantModal(plant)}
                        className="text-[#426B5F] hover:underline cursor-pointer"
                      >
                        {plant.scientific_name}
                      </button>
                    </td>
                    <td className="p-3.5 font-cairo font-bold text-[#CD9850] text-sm">
                      {plant.vernacular_raw || '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#426B5F]/10 text-[#426B5F] font-bold">
                        {plant.taxonomy.family || 'Botanique'}
                      </span>
                    </td>
                    <td className="p-3.5 text-end space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleOpenEditForm(plant)}
                        title={t.plantsTab.editBtn}
                        className="p-1.5 rounded-lg bg-[#EBF2F0] text-[#426B5F] hover:bg-[#426B5F] hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPlantToDelete(plant)}
                        title={t.plantsTab.deleteBtn}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredPlants.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#E1D3BE]/60 text-xs text-[#575D5A]">
              <div className="font-medium">
                {currentLang === 'ar' ? (
                  <>
                    عرض <span className="font-bold text-[#0B0B0B]">{startIndex + 1}</span> إلى{' '}
                    <span className="font-bold text-[#0B0B0B]">{endIndex}</span> من إجمالي{' '}
                    <span className="font-bold text-[#426B5F]">{filteredPlants.length}</span> نبتة
                  </>
                ) : (
                  <>
                    Affichage de <span className="font-bold text-[#0B0B0B]">{startIndex + 1}</span> à{' '}
                    <span className="font-bold text-[#0B0B0B]">{endIndex}</span> sur{' '}
                    <span className="font-bold text-[#426B5F]">{filteredPlants.length}</span> plantes
                  </>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-2 rounded-xl border border-[#E1D3BE] hover:bg-[#F5F3F3] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
                    title={currentLang === 'ar' ? 'الصفحة السابقة' : 'Page précédente'}
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </button>

                  {/* Dynamic page numbers with ellipsis */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-gray-400 font-bold">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            safeCurrentPage === p
                              ? 'bg-[#426B5F] text-white shadow-xs'
                              : 'border border-[#E1D3BE] text-[#0B0B0B] hover:bg-[#F5F3F3]'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-2 rounded-xl border border-[#E1D3BE] hover:bg-[#F5F3F3] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
                    title={currentLang === 'ar' ? 'الصفحة التالية' : 'Page suivante'}
                  >
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: USERS ACCOUNTS MANAGEMENT (LIVE MYSQL) */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#426B5F]" />
                <h3 className="font-extrabold text-lg text-[#0B0B0B]">
                  {currentLang === 'ar' ? 'إدارة حسابات المستخدمين (قاعدة بيانات dzherba_db)' : 'Gestion des Comptes Utilisateurs (MySQL dzherba_db)'}
                </h3>
              </div>
              <p className="text-xs text-[#575D5A]">
                {currentLang === 'ar'
                  ? 'عرض وإدارة جميع الحسابات المسجلة في المنصة وتعديل رتب وصلاحيات الباحثين والمواطنين'
                  : 'Tous les comptes créés sur DzHerba en temps réel avec gestion des rôles et privilèges scientifiques.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                disabled={isLoadingUsers}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E1D3BE] hover:bg-[#F5F3F3] text-xs font-bold text-[#426B5F] cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                <span>{currentLang === 'ar' ? 'تحديث من MySQL' : 'Actualiser (MySQL)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F5F3F3] border border-[#E1D3BE]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#575D5A] uppercase">{currentLang === 'ar' ? 'إجمالي الحسابات' : 'Total Comptes'}</span>
                <Users className="w-4 h-4 text-[#426B5F]" />
              </div>
              <div className="text-2xl font-black text-[#0B0B0B]">{usersList.length}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase">{currentLang === 'ar' ? 'إداريون (Admin)' : 'Administrateurs'}</span>
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900">{usersList.filter(u => u.role === 'admin').length}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">{currentLang === 'ar' ? 'باحثون وجامعيون' : 'Chercheurs & Univ.'}</span>
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900">
                {usersList.filter(u => u.role === 'researcher' || u.role === 'institution').length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-sky-800 uppercase">{currentLang === 'ar' ? 'حسابات عامة' : 'Grand Public'}</span>
                <UserIcon className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-900">{usersList.filter(u => u.role === 'free').length}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#575D5A] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={currentLang === 'ar' ? 'البحث بالاسم، البريد الإلكتروني أو المؤسسة...' : 'Rechercher un compte par nom, email, organisation...'}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-[#E1D3BE] text-xs bg-[#F5F3F3] focus:outline-hidden focus:border-[#426B5F]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#575D5A] shrink-0">{currentLang === 'ar' ? 'تصفية حسب الرتبة:' : 'Filtrer par rôle:'}</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-[#E1D3BE] bg-white font-semibold text-[#0B0B0B]"
              >
                <option value="all">{currentLang === 'ar' ? 'جميع الرتب' : 'Tous les rôles'}</option>
                <option value="admin">{currentLang === 'ar' ? 'إداري (Admin)' : 'Administrateur'}</option>
                <option value="researcher">{currentLang === 'ar' ? 'باحث (Chercheur)' : 'Chercheur'}</option>
                <option value="institution">{currentLang === 'ar' ? 'مؤسسة / جامعة' : 'Institution / Campus'}</option>
                <option value="student">{currentLang === 'ar' ? 'طالب (Étudiant)' : 'Étudiant'}</option>
                <option value="free">{currentLang === 'ar' ? 'مستخدم عام (Freemium)' : 'Grand Public / Gratuit'}</option>
              </select>
            </div>
          </div>

          {/* Table of Registered Users */}
          <div className="overflow-x-auto rounded-2xl border border-[#E1D3BE]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#F5F3F3] text-[#575D5A] font-bold border-b border-[#E1D3BE]">
                <tr>
                  <th className="p-3 text-start">{currentLang === 'ar' ? 'المستخدم' : 'Utilisateur'}</th>
                  <th className="p-3 text-start">{currentLang === 'ar' ? 'البريد والمؤسسة' : 'Email & Organisation'}</th>
                  <th className="p-3 text-start">{currentLang === 'ar' ? 'الرتبة والامتيازات' : 'Rôle & Droits'}</th>
                  <th className="p-3 text-start">{currentLang === 'ar' ? 'تاريخ التسجيل' : 'Date Inscription'}</th>
                  <th className="p-3 text-start">{currentLang === 'ar' ? 'الحالة' : 'Statut'}</th>
                  <th className="p-3 text-center">{currentLang === 'ar' ? 'إجراءات الإداري' : 'Actions Admin'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1D3BE]/60 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {currentLang === 'ar' ? 'لا يوجد حسابات مطابقة للبحث' : 'Aucun compte utilisateur trouvé.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F5F3F3]/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'researcher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'institution'
                              ? 'bg-indigo-100 text-indigo-800'
                              : u.role === 'student'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#0B0B0B]">{u.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-gray-700">{u.email}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-xs">{u.organization || 'Personnel / Non spécifié'}</div>
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : u.role === 'researcher'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : u.role === 'institution'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : u.role === 'student'
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {u.role === 'admin' && <Shield className="w-3 h-3 text-amber-700" />}
                          {u.role === 'researcher' && <GraduationCap className="w-3 h-3 text-emerald-700" />}
                          {u.role === 'institution' && <Building2 className="w-3 h-3 text-indigo-700" />}
                          {u.role === 'student' && <GraduationCap className="w-3 h-3 text-cyan-700" />}
                          {u.role === 'free' && <UserIcon className="w-3 h-3 text-gray-600" />}
                          <span className="capitalize">
                            {u.role === 'admin' ? (currentLang === 'ar' ? 'إداري عام' : 'Administrateur') :
                             u.role === 'researcher' ? (currentLang === 'ar' ? 'باحث علمي' : 'Chercheur') :
                             u.role === 'institution' ? (currentLang === 'ar' ? 'حرم جامعي' : 'Campus Univ.') :
                             u.role === 'student' ? (currentLang === 'ar' ? 'طالب جامعي' : 'Étudiant') :
                             (currentLang === 'ar' ? 'مواطن / عام' : 'Grand Public')}
                          </span>
                        </span>
                      </td>

                      <td className="p-3 text-gray-600">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-DZ' : 'fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : (currentLang === 'ar' ? 'حساب نظام' : 'Compte Système')}
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{currentLang === 'ar' ? 'نشط' : 'Actif'}</span>
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setUserToEditRole(u);
                              setSelectedRoleForEdit(u.role);
                            }}
                            title={currentLang === 'ar' ? 'تعديل الرتبة والامتيازات' : 'Modifier le rôle'}
                            className="px-2.5 py-1 rounded-lg bg-[#EBF2F0] hover:bg-[#426B5F] hover:text-white text-[#426B5F] text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{currentLang === 'ar' ? 'الرتبة' : 'Rôle'}</span>
                          </button>

                          <button
                            onClick={() => setUserToDelete(u)}
                            title={currentLang === 'ar' ? 'حذف الحساب' : 'Supprimer le compte'}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS & TRANSACTIONS */}
      {activeAdminTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-[#0B0B0B]">
                {t.tabs.subscriptions}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {currentLang === 'ar' ? 'سجل العمليات والاشتراكات الموثقة' : 'Transactions & Abonnements Actifs'}
              </p>
            </div>

            <button
              onClick={() => {
                const headers = ['Ref', 'Client', 'Email', 'Structure', 'Plan', 'Montant DZD', 'Date Expiration', 'Statut'];
                const rows = subscriptions.map((s) => [
                  s.transactionRef,
                  s.userName,
                  s.userEmail,
                  s.organization || '',
                  s.plan,
                  s.amountDZD,
                  s.endDate,
                  s.status,
                ]);
                const csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dzherba_transactions_${Date.now()}.csv`;
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E1D3BE] text-xs font-bold text-[#0B0B0B] hover:bg-gray-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.subsTab.exportCsvBtn}</span>
            </button>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E1D3BE]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#F5F3F3] border-b border-[#E1D3BE] text-[#575D5A] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">{t.subsTab.colSubId}</th>
                  <th className="p-3.5">{t.subsTab.colUser}</th>
                  <th className="p-3.5">{t.subsTab.colPlan}</th>
                  <th className="p-3.5">{t.subsTab.colAmount}</th>
                  <th className="p-3.5">{t.subsTab.colMethod}</th>
                  <th className="p-3.5">{t.subsTab.colDate}</th>
                  <th className="p-3.5">{t.subsTab.colStatus}</th>
                  <th className="p-3.5 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1D3BE]/60 text-[#0B0B0B]">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F5F3F3]/60 transition-colors">
                    <td className="p-3.5 font-mono text-gray-500 font-semibold">{sub.transactionRef}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#0B0B0B]">{sub.userName}</div>
                      <div className="text-[11px] text-[#575D5A]">{sub.organization || sub.userEmail}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold">
                        {sub.plan === 'institution' ? 'Licence Université B2B' : sub.plan === 'researcher_annual' ? 'Chercheur Annuel' : 'Chercheur Mensuel'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-[#426B5F]">
                      {sub.amountDZD.toLocaleString()} DZD
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                        {sub.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#575D5A]">
                      {sub.endDate}
                    </td>
                    <td className="p-3.5">
                      {sub.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {t.subsTab.statusActive}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                          {t.subsTab.statusExpired}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-end">
                      <button
                        onClick={() => toggleSubscriptionStatus(sub.id)}
                        className="px-2.5 py-1 rounded-lg border border-[#E1D3BE] text-[11px] font-bold hover:bg-gray-100 transition-all cursor-pointer"
                      >
                        {sub.status === 'active' ? (currentLang === 'ar' ? 'تجميد' : 'Suspendre') : (currentLang === 'ar' ? 'إعادة تفعيل' : 'Réactiver')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC PRICING CONFIGURATION (AJOUTER / MODIFIER / SUPPRIMER) */}
      {activeAdminTab === 'pricing_config' && (
        <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-[#0B0B0B]">
                {currentLang === 'ar' ? 'إدارة الخطط والتعريفات (الأسعار والصلاحيات)' : 'Gestion des Tarifs & Niveaux d\'Accès'}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {currentLang === 'ar' 
                  ? 'يمكنك إضافة خطة جديدة، تعديل الأسعار، تغيير المميزات، أو حذف أي تسعيرة من المنصة.'
                  : 'Ajoutez, modifiez ou supprimez les formules tarifaires et leurs prérogatives associées.'}
              </p>
            </div>

            <button
              onClick={handleOpenAddTariff}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#CD9850] hover:bg-[#b5833e] text-[#0B0B0B] text-xs font-black shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'إضافة تسعيرة جديدة +' : 'Ajouter un tarif +'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            {t.pricingTab.cibNotice}
          </div>

          {/* Dynamic Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansList.map((plan) => (
              <div 
                key={plan.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between space-y-5 relative transition-all ${
                  plan.highlighted 
                    ? 'border-2 border-[#426B5F] bg-[#EBF2F0]/40 shadow-md'
                    : 'border-[#E1D3BE] bg-white'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 start-6 px-3 py-0.5 rounded-full bg-[#CD9850] text-[#0B0B0B] text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Recommandé
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-gray-100 text-[#0B0B0B]">
                      {plan.badge}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#426B5F]/15 text-[#426B5F]">
                      Rôle: {plan.role}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-[#0B0B0B]">
                      {plan.name}
                    </h4>
                    {plan.nameAr && (
                      <p className="text-xs font-cairo font-bold text-[#CD9850]">
                        {plan.nameAr}
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#426B5F]">
                      {plan.priceDZD.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-[#575D5A]">
                      DZD {plan.priceDZD > 0 ? (plan.period === 'annual' ? '/ an' : '/ mois') : ''}
                    </span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#E1D3BE]/60 text-xs text-[#0B0B0B]">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Card Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#E1D3BE]/60">
                  <button
                    onClick={() => handleOpenEditTariff(plan)}
                    className="flex-1 py-2 rounded-xl bg-[#EBF2F0] hover:bg-[#426B5F] text-[#426B5F] hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? 'تعديل' : 'Modifier'}</span>
                  </button>

                  <button
                    onClick={() => setTariffToDelete(plan)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                    title={currentLang === 'ar' ? 'حذف هذا السعر' : 'Supprimer ce tarif'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PLANT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] overflow-hidden p-6 sm:p-8 space-y-6 my-8">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-[#0B0B0B]">
                {editingPlantId ? `${t.modal.titleEdit} #${editingPlantId}` : t.modal.titleAdd}
              </h3>
            </div>

            <form onSubmit={handleSavePlantForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.scName}</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Thymus vulgaris L."
                    value={formScientificName}
                    onChange={(e) => setFormScientificName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.vernacular}</label>
                  <input
                    type="text"
                    placeholder="Ex: زعتر"
                    value={formVernacularRaw}
                    onChange={(e) => setFormVernacularRaw(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] font-cairo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.family}</label>
                  <input
                    type="text"
                    placeholder="Ex: Lamiaceae"
                    value={formFamily}
                    onChange={(e) => setFormFamily(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.habitat}</label>
                  <input
                    type="text"
                    placeholder="Ex: Garrigues, Tell, Sétif, Batna"
                    value={formHabitat}
                    onChange={(e) => setFormHabitat(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.uses}</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Antiseptique respiratoire, digestif, antitussif..."
                  value={formTraditionalUses}
                  onChange={(e) => setFormTraditionalUses(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.phytochem}</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Thymol, carvacrol, flavonoïdes..."
                    value={formPhytochemistry}
                    onChange={(e) => setFormPhytochemistry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">{t.modal.pharma}</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Antimicrobien, antispasmodique..."
                    value={formPharmacology}
                    onChange={(e) => setFormPharmacology(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-amber-900 block mb-1">{t.modal.toxicity}</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Huile essentielle déconseillée aux femmes enceintes..."
                  value={formToxicity}
                  onChange={(e) => setFormToxicity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50"
                />
              </div>

              {/* Photo Gallery & Multiple Upload Section */}
              <div className="p-4 rounded-2xl bg-[#EBF2F0] border border-[#426B5F]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#426B5F] flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4" />
                    {currentLang === 'ar' ? 'الصور الفوتوغرافية للنبات (المعرض والتحميل)' : 'Galerie & Téléversement de photos'}
                  </span>
                  <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white text-xs font-bold cursor-pointer transition-all shadow-xs ${isUploadingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploadingImages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploadingImages ? (currentLang === 'ar' ? 'جاري التحميل...' : 'Envoi...') : (currentLang === 'ar' ? 'إضافة صور +' : 'Ajouter des photos +')}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImages}
                      disabled={isUploadingImages}
                    />
                  </label>
                </div>

                {/* Thumbnail list with Delete trigger modal */}
                {(formImages.length > 0 || pendingPreviews.length > 0) ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                    {formImages.map((imgUrl, idx) => (
                      <div key={`server-${idx}`} className="relative group rounded-xl overflow-hidden border border-[#E1D3BE] aspect-square bg-black/5">
                        <img src={imgUrl} alt={`Plant photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => triggerDeleteImage(imgUrl)}
                          className="absolute top-1 end-1 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {pendingPreviews.map((previewUrl, idx) => (
                      <div key={`pending-${idx}`} className="relative group rounded-xl overflow-hidden border-2 border-[#CD9850] aspect-square bg-black/5">
                        <img src={previewUrl} alt={`New upload preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 start-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                          {currentLang === 'ar' ? 'جديدة' : 'Prête'}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerDeleteImage('', idx)}
                          className="absolute top-1 end-1 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Retirer la photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#575D5A] italic">
                    {currentLang === 'ar' ? 'لا توجد صور مسجلة لهذا النبات حالياً. انقر على "إضافة صور +" لاختيار صور من جهازك.' : 'Aucune photo sélectionnée. Cliquez sur "Ajouter des photos +" pour en charger depuis votre appareil.'}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E1D3BE]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E1D3BE] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {t.modal.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImages}
                  className="px-6 py-2 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isUploadingImages && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t.modal.saveBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TARIFF MODAL */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] overflow-hidden p-6 sm:p-8 space-y-5 my-8">
            <button
              onClick={() => setIsTariffModalOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-[#0B0B0B] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#CD9850]" />
                <span>{editingTariffId ? (currentLang === 'ar' ? 'تعديل خطة الأسعار' : 'Modifier le Tarif') : (currentLang === 'ar' ? 'إضافة خطة أسعار جديدة' : 'Créer un Nouveau Tarif')}</span>
              </h3>
              <p className="text-xs text-[#575D5A] mt-1">
                Configurez le prix en Dinar Algérien (DZD), la périodicité et les droits d'accès.
              </p>
            </div>

            <form onSubmit={handleSaveTariff} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">Nom du tarif (FR)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Chercheur B2C"
                    value={tariffName}
                    onChange={(e) => setTariffName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">Nom du tarif (Arabe)</label>
                  <input
                    type="text"
                    placeholder="مثال: اشتراك الباحثين"
                    value={tariffNameAr}
                    onChange={(e) => setTariffNameAr(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] font-cairo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">Prix (DZD)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={tariffPrice}
                    onChange={(e) => setTariffPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">Période</label>
                  <select
                    value={tariffPeriod}
                    onChange={(e) => setTariffPeriod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  >
                    <option value="annual">Annuel (/ an)</option>
                    <option value="monthly">Mensuel (/ mois)</option>
                    <option value="one_time">Gratuit / Unique</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">Rôle accordé</label>
                  <select
                    value={tariffRole}
                    onChange={(e) => setTariffRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  >
                    <option value="free">free (Public)</option>
                    <option value="student">student (Étudiant)</option>
                    <option value="researcher">researcher (Chercheur)</option>
                    <option value="institution">institution (Campus B2B)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">Badge d'étiquette</label>
                <input
                  type="text"
                  placeholder="Ex: Populaire B2C / Licence Campus"
                  value={tariffBadge}
                  onChange={(e) => setTariffBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0B0B0B] block mb-1">
                  Fonctionnalités & Droits inclus (une ligne par avantage)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Accès complet aux monographies&#10;Phytochimie HPLC/GC-MS&#10;Export PDF scientifique"
                  value={tariffFeaturesText}
                  onChange={(e) => setTariffFeaturesText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tariffHighlighted"
                  checked={tariffHighlighted}
                  onChange={(e) => setTariffHighlighted(e.target.checked)}
                  className="w-4 h-4 accent-[#426B5F] rounded-md cursor-pointer"
                />
                <label htmlFor="tariffHighlighted" className="text-xs font-bold text-[#0B0B0B] cursor-pointer">
                  Mettre en avant ce tarif (Badge "Recommandé")
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E1D3BE]">
                <button
                  type="button"
                  onClick={() => setIsTariffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E1D3BE] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#CD9850] hover:bg-[#b5833e] text-[#0B0B0B] font-black transition-all shadow-md cursor-pointer"
                >
                  Enregistrer le tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: DELETE PLANT */}
      <ConfirmModal
        isOpen={plantToDelete !== null}
        title={currentLang === 'ar' ? 'حذف نبتة من القاعدة' : 'Suppression de la plante'}
        message={
          plantToDelete
            ? currentLang === 'ar'
              ? `هل أنت متأكد من رغبتك في حذف النبتة #${plantToDelete.id} (${plantToDelete.scientific_name}) نهائياً من قاعدة البيانات؟`
              : `Êtes-vous sûr de vouloir supprimer définitivement la plante #${plantToDelete.id} (${plantToDelete.scientific_name}) de la base de données ? Cette action est irréversible.`
            : ''
        }
        confirmText={currentLang === 'ar' ? 'نعم، احذف' : 'Oui, supprimer'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
        isDanger={true}
        currentLang={currentLang}
        onConfirm={handleConfirmDeletePlant}
        onCancel={() => setPlantToDelete(null)}
      />

      {/* CONFIRM MODAL: DELETE IMAGE */}
      <ConfirmModal
        isOpen={imageToDelete !== null}
        title={currentLang === 'ar' ? 'حذف الصورة' : "Suppression de l'image"}
        message={
          currentLang === 'ar'
            ? 'هل أنت متأكد من رغبتك في حذف هذه الصورة من ملفات الخادم؟'
            : 'Voulez-vous vraiment supprimer cette photo du serveur ?'
        }
        confirmText={currentLang === 'ar' ? 'حذف الصورة' : 'Supprimer'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
        isDanger={true}
        currentLang={currentLang}
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setImageToDelete(null)}
      />

      {/* CONFIRM MODAL: DELETE TARIFF */}
      <ConfirmModal
        isOpen={tariffToDelete !== null}
        title={currentLang === 'ar' ? 'حذف خطة الأسعار' : 'Suppression du Tarif'}
        message={
          tariffToDelete
            ? currentLang === 'ar'
              ? `هل أنت متأكد من رغبتك في إزالة تسعيرة "${tariffToDelete.name}" (${tariffToDelete.priceDZD} دج) من المنصة؟`
              : `Voulez-vous vraiment supprimer le tarif "${tariffToDelete.name}" (${tariffToDelete.priceDZD.toLocaleString()} DZD) de la grille tarifaire ?`
            : ''
        }
        confirmText={currentLang === 'ar' ? 'حذف التسعيرة' : 'Supprimer le tarif'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
        isDanger={true}
        currentLang={currentLang}
        onConfirm={handleConfirmDeleteTariff}
        onCancel={() => setTariffToDelete(null)}
      />

      {/* CONFIRM MODAL: DELETE USER ACCOUNT */}
      <ConfirmModal
        isOpen={userToDelete !== null}
        title={currentLang === 'ar' ? 'حذف حساب المستخدم' : 'Suppression du Compte Utilisateur'}
        message={
          userToDelete
            ? currentLang === 'ar'
              ? `هل أنت متأكد من رغبتك في حذف حساب "${userToDelete.name}" (${userToDelete.email}) نهائياً من قاعدة البيانات؟`
              : `Voulez-vous vraiment supprimer définitivement le compte "${userToDelete.name}" (${userToDelete.email}) de la base de données MySQL ? Cette action révoquera immédiatement ses accès.`
            : ''
        }
        confirmText={currentLang === 'ar' ? 'حذف الحساب' : 'Supprimer le compte'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
        isDanger={true}
        currentLang={currentLang}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      {/* MODAL: EDIT USER ROLE / PRIVILEGES */}
      {userToEditRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1D3BE]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#426B5F]" />
                <h3 className="font-extrabold text-base text-[#0B0B0B]">
                  {currentLang === 'ar' ? 'تعديل رتبة وصلاحيات المستخدم' : 'Modifier les Privilèges du Compte'}
                </h3>
              </div>
              <button
                onClick={() => setUserToEditRole(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F5F3F3] border border-[#E1D3BE]/60 text-xs space-y-1">
              <div className="font-bold text-[#0B0B0B]">{userToEditRole.name}</div>
              <div className="font-mono text-[#575D5A]">{userToEditRole.email}</div>
              {userToEditRole.organization && (
                <div className="text-[#426B5F] font-semibold">{userToEditRole.organization}</div>
              )}
            </div>

            <div>
              <label className="font-bold text-xs text-[#0B0B0B] block mb-2">
                {currentLang === 'ar' ? 'اختر الرتبة والامتيازات الجديدة:' : 'Attribuer un nouveau rôle :'}
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { role: 'free' as UserRole, label: 'Grand Public / Freemium', desc: 'Accès au catalogue, 3 scans par jour', icon: '👤' },
                  { role: 'student' as UserRole, label: 'Étudiant Universitaire / Lycéen', desc: 'Accès pédagogique aux monographies floristiques, herbiers et fiches complètes', icon: '🎓' },
                  { role: 'researcher' as UserRole, label: 'Chercheur Scientifique', desc: 'Accès illimité, phytochimie, exports PDF avancés', icon: '🔬' },
                  { role: 'institution' as UserRole, label: 'Institution / Campus Univ.', desc: 'Licence campus, API et monographies complètes', icon: '🏛️' },
                  { role: 'admin' as UserRole, label: 'Administrateur Master', desc: 'Accès complet au dashboard admin, BDD et utilisateurs', icon: '🛡️' }
                ].map((item) => (
                  <label
                    key={item.role}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedRoleForEdit === item.role
                        ? 'border-[#426B5F] bg-[#EBF2F0]'
                        : 'border-[#E1D3BE] hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value={item.role}
                      checked={selectedRoleForEdit === item.role}
                      onChange={() => setSelectedRoleForEdit(item.role)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[#0B0B0B] flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[11px] text-[#575D5A] mt-0.5">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1D3BE]">
              <button
                type="button"
                onClick={() => setUserToEditRole(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E1D3BE] text-xs font-bold text-[#575D5A] hover:bg-gray-50 cursor-pointer"
              >
                {currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                className="px-5 py-2.5 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'حفظ التغييرات' : 'Enregistrer le rôle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE MODAL: REPLACES BROWSER ALERT() */}
      <NoticeModal
        isOpen={notice.isOpen}
        type={notice.type}
        title={notice.title}
        message={notice.message}
        currentLang={currentLang}
        onClose={() => setNotice(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
