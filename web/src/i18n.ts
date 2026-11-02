import type { Language } from './types';

export interface Translations {
  slogan: string;
  plantCount: string;
  nav: {
    home: string;
    catalog: string;
    map: string;
    identify: string;
    assistant: string;
    pricing: string;
    admin: string;
  };
  auth: {
    login: string;
    logout: string;
    switchAccount: string;
    adminPanel: string;
    createAccount: string;
    authTitle: string;
    authSubtitle: string;
    secureBadge: string;
    loginTab: string;
    registerTab: string;
    emailLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    roleLabel: string;
    roleFree: string;
    roleStudent: string;
    roleResearcher: string;
    roleInstitution: string;
    loginActionBtn: string;
    registerActionBtn: string;
    testAccountsTitle: string;
    testAccountsSub: string;
    adminBadge: string;
    researcherBadge: string;
    studentBadge: string;
    campusBadge: string;
    citizenBadge: string;
    errMissingFields: string;
    errAdminPass: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    desc: string;
    searchPlaceholder: string;
    exploreBtn: string;
    stats: {
      plants: string;
      families: string;
      wilayas: string;
      studies: string;
    };
  };
  features: {
    encyclopediaTitle: string;
    encyclopediaDesc: string;
    mapTitle: string;
    mapDesc: string;
    identifyTitle: string;
    identifyDesc: string;
    assistantTitle: string;
    assistantDesc: string;
    consult: string;
    viewMap: string;
    testIA: string;
    chat: string;
  };
  card: {
    vernacularLabel: string;
    usesLabel: string;
    safetyAlert: string;
    consult: string;
    scientificMonograph: string;
  };
  modal: {
    tabs: {
      traditional: string;
      safety: string;
      distribution: string;
      phytochem: string;
      experimental: string;
      references: string;
    };
    partsUsed: string;
    dosage: string;
    safetyTitle: string;
    contraindications: string;
    drugInteractions: string;
    plantInteractions: string;
    habitatTitle: string;
    harvestTitle: string;
    phytochemLockedTitle: string;
    phytochemLockedDesc: string;
    unlockBtn: string;
    printPdf: string;
    close: string;
    officialSource: string;
    genus: string;
    species: string;
    order: string;
    vernacularInDz: string;
  };
  map: {
    badge: string;
    title: string;
    subtitle: string;
    allRegions: string;
    tell: string;
    plateaux: string;
    sahara: string;
    clickMarker: string;
    selectedRegion: string;
    taxaCount: string;
    searchInRegion: string;
    ecology: string;
    speciesInArea: string;
    noPlantsInFilter: string;
  };
  identify: {
    badge: string;
    title: string;
    subtitle: string;
    dragDrop: string;
    formats: string;
    orTestSamples: string;
    scanning: string;
    scanningSub: string;
    resultTitle: string;
    topMatch: string;
    otherMatches: string;
    noPhoto: string;
    noPhotoSub: string;
    dailyQuota: string;
    unlimitedQuota: string;
    goUnlimited: string;
    openMonograph: string;
    changeImg: string;
  };
  assistant: {
    badge: string;
    title: string;
    subtitle: string;
    welcome: string;
    promptPlaceholder: string;
    examples: string;
    searching: string;
    relatedPlants: string;
  };
  pricing: {
    badge: string;
    title: string;
    subtitle: string;
    currentPlan: string;
    monthly: string;
    annual: string;
    discount: string;
    freeTitle: string;
    freeSubtitle: string;
    freePrice: string;
    freeDesc: string;
    researcherTitle: string;
    researcherSubtitle: string;
    researcherPriceAnnual: string;
    researcherPriceMonthly: string;
    researcherDesc: string;
    campusTitle: string;
    campusSubtitle: string;
    campusPrice: string;
    campusDesc: string;
    cibEdahabia: string;
    subscribeBtn: string;
    subscribedBadge: string;
    campusBtn: string;
    activeBadge: string;
    freeFeatures: string[];
    researcherFeatures: string[];
    campusFeatures: string[];
    freeCurrentBtn: string;
    freeSwitchBtn: string;
    recommendedBadge: string;
    paymentSuccessTitle: string;
    paymentSuccessDesc: string;
  };
  adminDashboard: {
    badge: string;
    title: string;
    subtitle: string;
    stats: {
      totalSpecies: string;
      activeSubs: string;
      dzdRevenue: string;
      b2bPartners: string;
    };
    tabs: {
      plants: string;
      subscriptions: string;
      pricing: string;
    };
    plantsTab: {
      searchPlaceholder: string;
      addBtn: string;
      colId: string;
      colPlant: string;
      colFamily: string;
      colVernacular: string;
      colActions: string;
      viewBtn: string;
      editBtn: string;
      deleteBtn: string;
      confirmDelete: string;
    };
    subsTab: {
      searchPlaceholder: string;
      exportCsvBtn: string;
      colSubId: string;
      colUser: string;
      colOrg: string;
      colPlan: string;
      colStatus: string;
      colAmount: string;
      colMethod: string;
      colDate: string;
      statusActive: string;
      statusExpired: string;
    };
    pricingTab: {
      title: string;
      desc: string;
      saveBtn: string;
      cibNotice: string;
      fieldAnnual: string;
      fieldMonthly: string;
      fieldCampus: string;
    };
    modal: {
      titleAdd: string;
      titleEdit: string;
      scName: string;
      family: string;
      order: string;
      vernacular: string;
      habitat: string;
      uses: string;
      dosage: string;
      toxicity: string;
      contraindications: string;
      drugInteractions: string;
      phytochem: string;
      pharma: string;
      references: string;
      cancelBtn: string;
      saveBtn: string;
    };
  };
  footer: {
    about: string;
    modules: string;
    partners: string;
    partnersList: string[];
    warningTitle: string;
    warningDesc: string;
    rights: string;
    love: string;
  };
  common: {
    scientificMonograph: string;
    vernacularName: string;
    usages: string;
    consultBtn: string;
    allFamilies: string;
    allActivities: string;
    allRegions: string;
    resetFilters: string;
    noPlantsFound: string;
    readMonograph: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    slogan: 'منصة النباتات الطبية الجزائرية',
    plantCount: 'plantes',
    nav: {
      home: 'Accueil',
      catalog: 'Encyclopédie',
      map: "Carte d'Algérie",
      identify: 'IA Vision',
      assistant: 'Assistant IA',
      pricing: 'Tarifs',
      admin: 'Console Admin',
    },
    auth: {
      login: 'Se connecter',
      logout: 'Se déconnecter',
      switchAccount: 'Changer de compte',
      adminPanel: "Console d'Administration",
      createAccount: 'Créer un compte',
      authTitle: 'Espace Membres DzHerba',
      authSubtitle: 'منصة النباتات الطبية الجزائرية - تسجيل الدخول والتحقق',
      secureBadge: 'Authentification Sécurisée',
      loginTab: 'Se Connecter',
      registerTab: 'Créer un Compte',
      emailLabel: 'Adresse Email Institutionnelle ou Personnelle',
      passwordLabel: 'Mot de Passe',
      fullNameLabel: 'Nom et Prénom',
      roleLabel: 'Type de Compte Souhaité',
      roleFree: 'Citoyen & Grand Public (Gratuit)',
      roleStudent: 'Étudiant Universitaire / Lycéen',
      roleResearcher: 'Chercheur / Spécialiste (B2C)',
      roleInstitution: 'Université / Laboratoire (B2B)',
      loginActionBtn: 'Se Connecter à DzHerba',
      registerActionBtn: 'Créer Mon Compte',
      testAccountsTitle: 'Comptes de Test 1-Clic (Évaluation)',
      testAccountsSub: 'Sélectionnez un rôle pour tester immédiatement les permissions',
      adminBadge: 'Admin Master',
      researcherBadge: 'Chercheur',
      studentBadge: 'Étudiant',
      campusBadge: 'Campus B2B',
      citizenBadge: 'Citoyen',
      errMissingFields: 'Veuillez renseigner tous les champs obligatoires.',
      errAdminPass: 'Mot de passe administrateur incorrect (Démo: admin123)',
    },
    hero: {
      badge: 'Le Référentiel Scientifique de la Flore Médicinale en Algérie',
      title1: "La Richesse des Plantes d'Algérie,",
      title2: 'Validée par la Science',
      desc: 'Explorez plus de 270 monographies complètes : profils phytochimiques (GC-MS, HPLC), activités pharmacologiques prouvées, répartition géographique par wilaya et alertes de sécurité sanitaire.',
      searchPlaceholder: 'Rechercher en Français, Arabe, Anglais ou Latin (ex: Romarin, شيح, Thyme, Artemisia)...',
      exploreBtn: 'Explorer',
      stats: {
        plants: 'Plantes documentées',
        families: 'Familles botaniques',
        wilayas: 'Wilayas couvertes',
        studies: 'Études scientifiques',
      },
    },
    features: {
      encyclopediaTitle: 'Encyclopédie Complète',
      encyclopediaDesc: '279 monographies détaillées avec usages, posologies et profils phytochimiques.',
      mapTitle: "Atlas & Carte d'Algérie",
      mapDesc: 'Explorez la répartition par wilaya, du littoral du Tell aux oasis du Sahara.',
      identifyTitle: 'Reconnaissance par Photo',
      identifyDesc: 'Prenez une photo sur le terrain et identifiez immédiatement le taxon et sa sécurité.',
      assistantTitle: 'Assistant IA Spécialisé',
      assistantDesc: 'Posez vos questions sur la toxicité, synergies et bienfaits en langage naturel.',
      consult: 'Consulter',
      viewMap: 'Voir la carte',
      testIA: "Tester l'IA",
      chat: 'Discuter',
    },
    card: {
      vernacularLabel: 'Nom vernaculaire :',
      usesLabel: 'Usages :',
      safetyAlert: 'Mises en garde & sécurité documentées',
      consult: 'Consulter',
      scientificMonograph: 'Monographie scientifique',
    },
    modal: {
      tabs: {
        traditional: 'Usages & Posologie',
        safety: 'Sécurité & Toxicité',
        distribution: 'Distribution & Récolte',
        phytochem: 'Phytochimie',
        experimental: 'Données de Recherche',
        references: 'Références',
      },
      partsUsed: 'Parties de la plante utilisées',
      dosage: 'Posologie et Recommandations',
      safetyTitle: 'Profil de Sécurité et Données Toxicologiques',
      contraindications: 'Contre-indications Spécifiques',
      drugInteractions: 'Interactions Plante - Médicaments',
      plantInteractions: 'Interactions Plante - Plante (Synergies)',
      habitatTitle: 'Répartition Géographique & Habitat en Algérie',
      harvestTitle: 'Période de Floraison & Calendrier de Récolte',
      phytochemLockedTitle: 'Profil Phytochimique Approfondi (Contenu Chercheur)',
      phytochemLockedDesc: 'Le détail des fractions chimiques (GC-MS, HPLC), polyphénols, flavonoïdes et activités pharmacologiques est réservé aux abonnements Chercheur et Campus.',
      unlockBtn: "Débloquer l'accès Chercheur / Université",
      printPdf: 'Imprimer / Export PDF',
      close: 'Fermer',
      officialSource: 'Base de données officielle DzHerba • République Algérienne',
      genus: 'Genre :',
      species: 'Espèce :',
      order: 'Ordre :',
      vernacularInDz: 'Nom vernaculaire en Algérie',
    },
    map: {
      badge: "Atlas Géobotanique de l'Algérie",
      title: 'Répartition des Plantes Médicinales par Wilaya',
      subtitle: "Explorez le patrimoine floristique algérien à travers ses 3 grands biomes : le littoral (Tell), les steppes des Hauts Plateaux et les oasis du Sahara.",
      allRegions: 'Toutes les régions',
      tell: 'Littoral & Tell (Humide / Forêts)',
      plateaux: 'Hauts Plateaux & Aurès (Steppes)',
      sahara: 'Sahara & Oasis (Aride)',
      clickMarker: 'Cliquez sur un marqueur géographique pour charger les espèces recensées',
      selectedRegion: 'Wilaya / Région sélectionnée :',
      taxaCount: 'taxons répertoriés',
      searchInRegion: 'Filtrer dans la région...',
      ecology: 'Écologie locale :',
      speciesInArea: 'Plantes médicinales de',
      noPlantsInFilter: 'Aucune plante spécifiquement indexée avec ce filtre.',
    },
    identify: {
      badge: 'Vision par Ordinateur & IA Botanique',
      title: 'Identifier une Plante Médicinale en Algérie',
      subtitle: "Téléchargez une photo prise sur le terrain ou sélectionnez un échantillon pour identifier l'espèce botanique.",
      dragDrop: 'Déposez une photo ou cliquez pour parcourir',
      formats: 'Feuille, fleur, tige ou sommité (JPG, PNG)',
      orTestSamples: 'Ou tester avec un spécimen botanique algérien :',
      scanning: 'Analyse des caractéristiques foliaires & florales...',
      scanningSub: 'Comparaison avec la taxonomie botanique algérienne',
      resultTitle: 'Résultat de la Détection IA',
      topMatch: 'Meilleure correspondance',
      otherMatches: 'Autres correspondances probables :',
      noPhoto: 'Aucune photo chargée pour le moment.',
      noPhotoSub: 'Sélectionnez un échantillon ci-contre ou téléchargez votre propre photo.',
      dailyQuota: '5 reconnaissances gratuites / jour',
      unlimitedQuota: 'Reconnaissances illimitées (Chercheur)',
      goUnlimited: 'Passer en illimité',
      openMonograph: 'Ouvrir la Monographie Complète',
      changeImg: "Changer d'image",
    },
    assistant: {
      badge: "Modèle d'Intelligence Artificielle LLM",
      title: 'Assistant Scientifique DzHerba',
      subtitle: 'Interrogez directement le corpus des plantes médicinales algériennes en langage naturel.',
      welcome: "Bonjour ! Je suis l'assistant intelligent de **DzHerba**. Je réponds à vos questions sur la flore médicinale d'Algérie en me basant exclusivement sur les données scientifiques et monographies validées de notre plateforme (pharmacologie, usages traditionnels, posologies et toxicité).\n\nPosez votre question en français ou en arabe !",
      promptPlaceholder: "Posez votre question (ex: usages de l'Artemisia, plantes pour la toux, toxicité...)",
      examples: 'Exemples :',
      searching: 'Recherche dans les 279 monographies...',
      relatedPlants: 'Fiches botaniques associées :',
    },
    pricing: {
      badge: 'Modèle Économique & Souscriptions',
      title: 'Accédez à la Connaissance Botanique Algérienne',
      subtitle: 'Informations de base gratuites pour tous les citoyens. Données phytochimiques, pharmacologiques et protocoles de recherche avancés pour les étudiants, chercheurs et universités.',
      currentPlan: 'Votre formule actuelle :',
      monthly: 'Facturation Mensuelle',
      annual: 'Facturation Annuelle',
      discount: '-25% Réduction',
      freeTitle: 'Accès Gratuit',
      freeSubtitle: 'Grand Public & Citoyens',
      freePrice: '0 DZD / toujours',
      freeDesc: 'Pour découvrir la richesse végétale de l’Algérie et vérifier les usages traditionnels en toute sécurité.',
      researcherTitle: 'Accès Scientifique',
      researcherSubtitle: 'Étudiants & Chercheurs (B2C)',
      researcherPriceAnnual: '9 800 DZD / an',
      researcherPriceMonthly: '1 200 DZD / mois',
      researcherDesc: 'Monographies phytochimiques complètes, résultats expérimentaux in vitro/in vivo et export PDF des données.',
      campusTitle: 'Licence Campus',
      campusSubtitle: 'Universités & Laboratoires (B2B)',
      campusPrice: 'Sur Devis (dès 85 000 DZD/an)',
      campusDesc: 'Pour les facultés de Pharmacie, Médecine, Biologie, agronomie et centres de recherche nationaux.',
      cibEdahabia: 'Paiement sécurisé en Algérie via CIB / Edahabia',
      subscribeBtn: 'Souscrire par CIB / Edahabia',
      subscribedBadge: 'Abonnement B2C Actif ✓',
      campusBtn: 'Activer Convention Campus B2B',
      activeBadge: 'Licence Campus Active ✓',
      freeFeatures: [
        'Noms scientifiques et vernaculaires (Arabe / Tamazight)',
        'Description botanique et répartition générale',
        'Usages traditionnels populaires validés',
        'Alertes de toxicité et sécurité essentielles',
        '5 identifications IA par photo / jour',
      ],
      researcherFeatures: [
        "Tout le contenu de l'accès Gratuit",
        'Profils phytochimiques détaillés (GC-MS, HPLC, tanins, flavonoïdes)',
        "Données expérimentales d'activités biologiques",
        'Filtres de recherche avancés multicritères',
        'Reconnaissance IA et Assistant LLM illimités',
        'Exportation des monographies au format PDF',
      ],
      campusFeatures: [
        'Accès collectif illimité pour tous les étudiants et enseignants',
        'Intégration comme référence officielle de la bibliothèque numérique',
        'Export massif de données pour mémoires et thèses de doctorat',
        'API de connexion et conventions universitaires',
      ],
      freeCurrentBtn: 'Formule Actuelle',
      freeSwitchBtn: 'Basculer en mode Gratuit',
      recommendedBadge: 'Recommandé pour Chercheurs',
      paymentSuccessTitle: 'Paiement CIB / Edahabia confirmé !',
      paymentSuccessDesc: 'Tous les droits associés à votre nouveau statut ont été instantanément débloqués.',
    },
    adminDashboard: {
      badge: 'Direction Scientifique & Technique',
      title: "Console d'Administration Globale",
      subtitle: 'Gestion du catalogue des 279 espèces, suivi des abonnements CIB/Edahabia et tarification.',
      stats: {
        totalSpecies: 'Espèces Répertoriées',
        activeSubs: 'Abonnements Actifs',
        dzdRevenue: 'Revenus Collectés',
        b2bPartners: 'Conventions Campus B2B',
      },
      tabs: {
        plants: 'Catalogue Botanique (CRUD)',
        subscriptions: 'Souscriptions & Paiements CIB/Edahabia',
        pricing: 'Gestion des Tarifs & Quotas',
      },
      plantsTab: {
        searchPlaceholder: 'Rechercher par nom scientifique, famille ou nom vernaculaire...',
        addBtn: 'Ajouter une Espèce',
        colId: 'ID',
        colPlant: 'Plante & Nom Scientifique',
        colFamily: 'Famille & Ordre',
        colVernacular: 'Nom Vernaculaire',
        colActions: 'Actions',
        viewBtn: 'Voir',
        editBtn: 'Modifier',
        deleteBtn: 'Supprimer',
        confirmDelete: 'Êtes-vous certain de vouloir supprimer cette plante ?',
      },
      subsTab: {
        searchPlaceholder: 'Rechercher par utilisateur, email ou organisme...',
        exportCsvBtn: 'Exporter CSV (Comptabilité)',
        colSubId: 'Réf. / ID',
        colUser: 'Utilisateur',
        colOrg: 'Organisme / Faculté',
        colPlan: 'Formule',
        colStatus: 'Statut',
        colAmount: 'Montant DZD',
        colMethod: 'Mode de Paiement',
        colDate: 'Échéance',
        statusActive: 'Actif',
        statusExpired: 'Expiré',
      },
      pricingTab: {
        title: 'Configuration de la Grille Tarifaire',
        desc: 'Mise à jour des tarifs des abonnements en dinars algériens (DZD) pour les étudiants, chercheurs et universités.',
        saveBtn: 'Enregistrer les Nouveaux Tarifs',
        cibNotice: 'Les transactions sont traitées via le réseau monétique national SATIM (CIB & Edahabia).',
        fieldAnnual: 'Chercheur Annuel (DZD / an)',
        fieldMonthly: 'Chercheur Mensuel (DZD / mois)',
        fieldCampus: 'Licence Campus B2B Annuelle (DZD / an)',
      },
      modal: {
        titleAdd: 'Ajouter une Nouvelle Plante Médicinale',
        titleEdit: 'Modifier la Monographie Botanique',
        scName: 'Nom Scientifique *',
        family: 'Famille Botanique *',
        order: 'Ordre',
        vernacular: 'Noms Vernaculaires (Arabe / Local)',
        habitat: 'Habitat & Répartition en Algérie',
        uses: 'Usages Traditionnels Documentés',
        dosage: 'Posologie & Préparation',
        toxicity: 'Profil de Toxicité & Sécurité',
        contraindications: 'Contre-indications',
        drugInteractions: 'Interactions Médicamenteuses',
        phytochem: 'Phytochimie (GC-MS / HPLC / Composés)',
        pharma: 'Pharmacologie & Activités Prouvées',
        references: 'Références Bibliographiques',
        cancelBtn: 'Annuler',
        saveBtn: 'Enregistrer la Monographie',
      },
    },
    footer: {
      about: 'Première plateforme scientifique et collaborative dédiée au recensement, à la phytochimie et à la pharmacologie des plantes médicinales en Algérie.',
      modules: 'Modules de la Plateforme',
      partners: 'Références & Partenariats',
      partnersList: [
        'Institutions de conservation des forêts (Algérie)',
        'Facultés de Pharmacie, Médecine & Biologie',
        'Recherche ethnobotanique & herboristerie traditionnelle',
        "Flores d'Algérie (Quézel & Santa, Ozenda)",
        'Agence Européenne des Médicaments (EMA)'
      ],
      warningTitle: 'Avertissement Médical',
      warningDesc: "Les données publiées sur DzHerba sont destinées à des fins d'information et de recherche académique. Elles ne remplacent en aucun cas l'avis, le diagnostic ou la prescription d'un médecin ou pharmacien.",
      rights: 'Tous droits réservés.',
      love: 'Développé pour valoriser la biodiversité algérienne',
    },
    common: {
      scientificMonograph: 'Monographie scientifique',
      vernacularName: 'Nom vernaculaire',
      usages: 'Usages',
      consultBtn: 'Consulter',
      allFamilies: 'Toutes les familles',
      allActivities: 'Toutes activités pharmacologiques',
      allRegions: 'Toutes les régions / wilayas',
      resetFilters: 'Réinitialiser tous les filtres',
      noPlantsFound: 'Aucune plante ne correspond à vos critères',
      readMonograph: 'Ouvrir la Monographie Complète',
    },
  },
  ar: {
    slogan: 'منصة النباتات الطبية الجزائرية',
    plantCount: 'نبتة',
    nav: {
      home: 'الرئيسية',
      catalog: 'الموسوعة الطبية',
      map: 'خريطة الجزائر',
      identify: 'التعرف الذكي',
      assistant: 'المساعد الذكي',
      pricing: 'الاشتراكات',
      admin: 'لوحة الإدارة',
    },
    auth: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      switchAccount: 'تبديل الحساب',
      adminPanel: 'لوحة التحكم الإدارية',
      createAccount: 'إنشاء حساب جديد',
      authTitle: 'فضاء الأعضاء DzHerba',
      authSubtitle: 'منصة النباتات الطبية الجزائرية - تسجيل الدخول والتحقق',
      secureBadge: 'مصادقة آمنة ومحمية',
      loginTab: 'تسجيل الدخول',
      registerTab: 'إنشاء حساب جديد',
      emailLabel: 'البريد الإلكتروني المؤسساتي أو الشخصي',
      passwordLabel: 'كلمة المرور',
      fullNameLabel: 'الاسم واللقب',
      roleLabel: 'نوع الحساب المطلوب',
      roleFree: 'مواطن / عامة الجمهور (مجاني)',
      roleStudent: 'طالب جامعي / مدرسي',
      roleResearcher: 'باحث علمي / أكاديمي (B2C)',
      roleInstitution: 'جامعة / مخبر بحث (B2B)',
      loginActionBtn: 'تسجيل الدخول إلى المنصة',
      registerActionBtn: 'إنشاء حسابي الجديد',
      testAccountsTitle: 'حسابات تجريبية بنقرة واحدة (للاختبار)',
      testAccountsSub: 'اختر دوراً لاختبار الصلاحيات والوصول للمحتوى فوراً',
      adminBadge: 'مشرف عام',
      researcherBadge: 'باحث',
      studentBadge: 'طالب',
      campusBadge: 'جامعة B2B',
      citizenBadge: 'مواطن',
      errMissingFields: 'يرجى ملء جميع الحقول الإلزامية.',
      errAdminPass: 'كلمة مرور المشرف غير صحيحة (التجريبية: admin123)',
    },
    hero: {
      badge: 'المرجع العلمي المعتمد للنباتات الطبية في الجزائر',
      title1: 'كنوز النباتات الطبية الجزائرية،',
      title2: 'موثقة بالبحث العلمي',
      desc: 'استكشف أكثر من 270 دراسة علمية متكاملة: المركبات الكيميائية الفعالة (GC-MS, HPLC)، الأنشطة الدوائية، التوزيع الجغرافي عبر ولايات الجزائر، وتحذيرات السلامة والسمية.',
      searchPlaceholder: 'ابحث بالعربية أو الفرنسية أو الإنجليزية أو اللاتينية (مثل: الشيح، Romarin، Thyme، Artemisia)...',
      exploreBtn: 'استكشاف',
      stats: {
        plants: 'نبتة موثقة علمياً',
        families: 'عائلة نباتية',
        wilayas: 'ولاية مغطاة',
        studies: 'دراسات موثقة',
      },
    },
    features: {
      encyclopediaTitle: 'الموسوعة الشاملة',
      encyclopediaDesc: '279 دراسة نباتية مفصلة تشمل الاستعمالات التقليدية والجرعات والتركيب الكيميائي.',
      mapTitle: 'الأطلس الجغرافي للجزائر',
      mapDesc: 'استكشف انتشار النباتات الطبية عبر مختلف الولايات والمناطق البيئية من الساحل إلى الصحراء.',
      identifyTitle: 'التعرف على النبات بالصورة',
      identifyDesc: 'التقط صورة للنبتة في الميدان وتعرف فوراً على تصنيفها العلمي وسلامة استخدامها.',
      assistantTitle: 'المساعد الذكي المتخصص',
      assistantDesc: 'اطرح أسئلتك حول فوائد النباتات والجرعات والتفاعلات الدوائية بلغة واضحة.',
      consult: 'تصفح الفهرس',
      viewMap: 'عرض الخريطة',
      testIA: 'تجربة التعرف',
      chat: 'بدء المحادثة',
    },
    card: {
      vernacularLabel: 'الاسم الشائع :',
      usesLabel: 'الاستعمالات :',
      safetyAlert: 'تحذيرات السلامة والسمية موثقة',
      consult: 'عرض التفاصيل',
      scientificMonograph: 'دراسة علمية موثقة',
    },
    modal: {
      tabs: {
        traditional: 'الاستعمالات والجرعات',
        safety: 'السلامة والسمية',
        distribution: 'الانتشار وموسم الجني',
        phytochem: 'التركيب الكيميائي',
        experimental: 'النتائج التجريبية',
        references: 'المراجع العلمية',
      },
      partsUsed: 'الأجزاء المستعملة من النبتة',
      dosage: 'الجرعات الموصى بها طبياً',
      safetyTitle: 'بيانات السلامة والسمية الموثقة علمياً',
      contraindications: 'موانع الاستعمال الدقيقة',
      drugInteractions: 'التفاعلات مع الأدوية الكيميائية',
      plantInteractions: 'التفاعلات بين النباتات (تآزر)',
      habitatTitle: 'التوزيع الجغرافي والبيئة الطبيعية في الجزائر',
      harvestTitle: 'فترات الإزهار ومواعيد الحصاد والجني',
      phytochemLockedTitle: 'التحليل الكيميائي المفصل (محتوى مخصص للباحثين)',
      phytochemLockedDesc: 'تفاصيل المركبات الكيميائية الفعالة (GC-MS, HPLC) والبوليفينول والأنشطة الدوائية مخصصة للمشتركين والباحثين والجامعات.',
      unlockBtn: 'ترقية الاشتراك للباحثين والجامعات',
      printPdf: 'طباعة / تصدير بصيغة PDF',
      close: 'إغلاق',
      officialSource: 'قاعدة البيانات الرسمية لمنصة DzHerba • الجمهورية الجزائرية',
      genus: 'الجنس :',
      species: 'النوع :',
      order: 'الرتبة :',
      vernacularInDz: 'الاسم الشائع في الجزائر',
    },
    map: {
      badge: 'الأطلس النباتي الطبي للجزائر',
      title: 'توزيع النباتات الطبية حسب الولايات والأقاليم البيئية',
      subtitle: 'استكشف التنوع النباتي عبر الأقاليم البيئية الثلاثة: الساحل والتل، الهضاب العليا والأوراس، والصحراء والواحات.',
      allRegions: 'جميع المناطق',
      tell: 'الشريط التلي والساحلي (غابات ومناخ رطب)',
      plateaux: 'الهضاب العليا والأوراس (سهوب ومناخ شبه جاف)',
      sahara: 'الصحراء والواحات (مناخ جاف وصحراوي)',
      clickMarker: 'انقر على أي ولاية أو نقطة في الخريطة لعرض النباتات المتواجدة بها',
      selectedRegion: 'الولاية / المنطقة المحددة :',
      taxaCount: 'نبتة موثقة في هذه المنطقة',
      searchInRegion: 'تصفية داخل المنطقة...',
      ecology: 'البيئة الطبيعية المحلية :',
      speciesInArea: 'النباتات الطبية المتواجدة في',
      noPlantsInFilter: 'لا توجد نباتات مسجلة تطابق هذه التصفية حالياً.',
    },
    identify: {
      badge: 'الرؤية الحاسوبية والذكاء الاصطناعي النباتي',
      title: 'التعرف الفوري على النباتات الطبية بالصورة',
      subtitle: 'التقط صورة للنبتة في الطبيعة أو ارفع صورة محفوظة للتعرف على نوعها وتصنيفها وسلامتها.',
      dragDrop: 'اسحب الصورة إلى هنا أو انقر للاختيار من جهازك',
      formats: 'أوراق، أزهار، ثمار أو جذور (JPG, PNG)',
      orTestSamples: 'أو جرب التعرف على عينة من النباتات الطبية الجزائرية :',
      scanning: 'جارٍ تحليل الخصائص المورفولوجية والزهرية بالذكاء الاصطناعي...',
      scanningSub: 'مقارنة الملامح مع الأطلس النباتي للجزائر',
      resultTitle: 'نتيجة التعرف الآلي',
      topMatch: 'أعلى نسبة تطابق',
      otherMatches: 'نتائج أخرى محتملة :',
      noPhoto: 'لم يتم تحميل أي صورة حتى الآن.',
      noPhotoSub: 'اختر إحدى العينات الجاهزة أو قم برفع صورتك الخاصة للبدء.',
      dailyQuota: '5 عمليات فحص مجانية يومياً',
      unlimitedQuota: 'فحص غير محدود (باقة الباحثين)',
      goUnlimited: 'الترقية للفحص غير المحدود',
      openMonograph: 'فتح الدراسة العلمية الكاملة',
      changeImg: 'تغيير الصورة',
    },
    assistant: {
      badge: 'نموذج لغوي ذكي مخصص للطب النباتي (LLM)',
      title: 'المساعد العلمي الذكي DzHerba',
      subtitle: 'اطرح أسئلتك حول النباتات الطبية وفوائدها وسميتها بلغة بسيطة وموثوقة.',
      welcome: 'مرحباً بكم! أنا المساعد الذكي لمنصة **DzHerba**. أجيب عن كافة استفساراتكم حول النباتات الطبية الجزائرية بالاعتماد حصرياً على الدراسات والبيانات الموثقة في المنصة (الاستعمالات، الجرعات، التفاعلات الدوائية والسلامة).\n\nتفضلوا بطرح سؤالكم بالعربية أو الفرنسية!',
      promptPlaceholder: 'اكتب سؤالك هنا (مثل: فوائد الشيح، أعشاب للسكري، موانع استعمال الثوم...)...',
      examples: 'أمثلة شائعة :',
      searching: 'جارٍ البحث في 279 دراسة علمية معتمدة...',
      relatedPlants: 'النباتات ذات الصلة في الموسوعة :',
    },
    pricing: {
      badge: 'باقات الاشتراك ونموذج العمل (BMC)',
      title: 'اشترك للوصول إلى كافة الأبحاث والدراسات المتقدمة',
      subtitle: 'المعلومات الأساسية متاحة مجاناً لجميع المواطنين. الدراسات التفصيلية والتركيب الكيميائي متاحة عبر اشتراكات رمزية للطلبة والباحثين والجامعات.',
      currentPlan: 'نوع حسابك الحالي :',
      monthly: 'اشتراك شهري',
      annual: 'اشتراك سنوي',
      discount: 'خصم 25%',
      freeTitle: 'النسخة المجانية',
      freeSubtitle: 'المستهلك العادي والمهتمون',
      freePrice: '0 دج / دائماً',
      freeDesc: 'للتعرف على ثروة النباتات الطبية في الجزائر والتحقق من الاستخدامات الشعبية الآمنة.',
      researcherTitle: 'باقة الباحثين والطلبة',
      researcherSubtitle: 'طلبة الصيدلة والبيولوجيا والباحثون (B2C)',
      researcherPriceAnnual: '9,800 دج / سنوياً',
      researcherPriceMonthly: '1,200 دج / شهرياً',
      researcherDesc: 'دراسات كيميائية كاملة، نتائج مخبرية وتجارب سريرية مع إمكانية تحميل وطباعة ملفات PDF.',
      campusTitle: 'اشتراك الجامعات والمؤسسات',
      campusSubtitle: 'الكليات والأقسام العلمية (B2B)',
      campusPrice: 'وفق اتفاقية (ابتداءً من 85,000 دج/سنوياً)',
      campusDesc: 'لكليات الصيدلة والطب والبيولوجيا والفلاحة ومراكز البحث العلمي الوطنية.',
      cibEdahabia: 'دفع إلكتروني آمن عبر بطاقة الذهبية وبطاقة CIB (ساتيم / شارجيلي)',
      subscribeBtn: 'الدفع بالذهبية / CIB',
      subscribedBadge: 'اشتراك الباحث نشط ✓',
      campusBtn: 'تفعيل اتفاقية الجامعة (B2B)',
      activeBadge: 'اشتراك الجامعة نشط ✓',
      freeFeatures: [
        'الأسماء العلمية والشائعة (بالعربية والأمازيغية)',
        'الوصف النباتي ومناطق الانتشار العامة',
        'الاستعمالات الشعبية الموثقة علمياً',
        'تنبيهات السمية والسلامة الأساسية',
        '5 عمليات فحص ذكي بالصورة يومياً',
      ],
      researcherFeatures: [
        'كافة مميزات الحساب المجاني',
        'التحليل الكيميائي المفصل (GC-MS, HPLC, البوليفينول)',
        'النتائج المخبرية للأنشطة البيولوجية والدوائية',
        'محرك بحث متقدم متعدد المعايير',
        'فحص غير محدود بالذكاء الاصطناعي والمساعد الذكي',
        'تحميل وتصدير الدراسات بصيغة PDF',
      ],
      campusFeatures: [
        'ولوج جماعي غير محدود لجميع الطلبة والأساتذة',
        'إدراج المنصة كمرجع رسمي بالمكتبة الرقمية للجامعة',
        'تصدير جماعي للبيانات لمذكرات التخرج وأطروحات الدكتوراه',
        'واجهة برمجية API واتفاقيات تعاون جامعية معتمدة',
      ],
      freeCurrentBtn: 'باقتك الحالية',
      freeSwitchBtn: 'التحويل إلى الوضع المجاني',
      recommendedBadge: 'موصى به للباحثين والطلبة',
      paymentSuccessTitle: 'تم تأكيد الدفع عبر بطاقة الذهبية / CIB بنجاح !',
      paymentSuccessDesc: 'تم تفعيل كافة الصلاحيات المرتبطة باشتراكك الجديد فوراً.',
    },
    adminDashboard: {
      badge: 'الإدارة العلمية والتقنية',
      title: 'لوحة التحكم الإدارية الشاملة',
      subtitle: 'إدارة وتحديث دراسات 279 نبتة طبية، ومتابعة اشتراكات ومعاملات CIB/الذهبية.',
      stats: {
        totalSpecies: 'نبتة موثقة',
        activeSubs: 'اشتراكاً نشطاً',
        dzdRevenue: 'الإيرادات المحصلة',
        b2bPartners: 'اتفاقيات جامعية B2B',
      },
      tabs: {
        plants: 'فهرس النباتات (إضافة وتعديل)',
        subscriptions: 'الاشتراكات والمعاملات (الذهبية/CIB)',
        pricing: 'إدارة الأسعار والباقات',
      },
      plantsTab: {
        searchPlaceholder: 'ابحث بالاسم اللاتيني أو العائلة أو الاسم الشائع...',
        addBtn: 'إضافة نبتة جديدة',
        colId: 'الرقم',
        colPlant: 'الاسم العلمي والنوع',
        colFamily: 'العائلة والرتبة',
        colVernacular: 'الاسم الشائع محلياً',
        colActions: 'إجراءات',
        viewBtn: 'معاينة',
        editBtn: 'تعديل',
        deleteBtn: 'حذف',
        confirmDelete: 'هل أنت متأكد من رغبتك في حذف هذه النبتة من المنصة ؟',
      },
      subsTab: {
        searchPlaceholder: 'ابحث باسم المستخدم أو البريد أو المؤسسة...',
        exportCsvBtn: 'تصدير كشف المعاملات (CSV)',
        colSubId: 'المرجع',
        colUser: 'المشترك',
        colOrg: 'المؤسسة / الكلية',
        colPlan: 'نوع الباقة',
        colStatus: 'الحالة',
        colAmount: 'المبلغ (دج)',
        colMethod: 'طريقة الدفع',
        colDate: 'تاريخ الانتهاء',
        statusActive: 'نشط',
        statusExpired: 'منتهي الصلاحية',
      },
      pricingTab: {
        title: 'إعدادات شبكة الأسعار والاشتراكات',
        desc: 'تحديث تعريفات الاشتراكات بالدينار الجزائري (DZD) للطلبة والباحثين والجامعات.',
        saveBtn: 'حفظ الأسعار الجديدة',
        cibNotice: 'تتم المعالجة المالية عبر الشبكة النقدية الوطنية ساتيم (بطاقة الذهبية و CIB).',
        fieldAnnual: 'اشتراك الباحثين السنوي (دج / سنوياً)',
        fieldMonthly: 'اشتراك الباحثين الشهري (دج / شهرياً)',
        fieldCampus: 'اشتراك الجامعات السنوي B2B (دج / سنوياً)',
      },
      modal: {
        titleAdd: 'إضافة نبتة طبية جديدة إلى الموسوعة',
        titleEdit: 'تعديل الدراسة العلمية للنبتة',
        scName: 'الاسم العلمي اللاتيني *',
        family: 'العائلة النباتية *',
        order: 'الرتبة النباتية',
        vernacular: 'الأسماء الشائعة (بالعربية واللهجات المحلية)',
        habitat: 'البيئة والانتشار الجغرافي في الجزائر',
        uses: 'الاستعمالات الطبية التقليدية الموثقة',
        dosage: 'طرق التحضير والجرعات الموصى بها',
        toxicity: 'بيانات السمية والمحاذير الصحية',
        contraindications: 'موانع الاستعمال',
        drugInteractions: 'التفاعلات الدوائية',
        phytochem: 'التركيب الكيميائي (GC-MS / HPLC / المركبات)',
        pharma: 'الأنشطة الدوائية المثبتة تجريبياً',
        references: 'المراجع العلمية المنشورة',
        cancelBtn: 'إلغاء',
        saveBtn: 'حفظ النبتة في قاعدة البيانات',
      },
    },
    footer: {
      about: 'أول منصة رقمية علمية متكاملة لجمع وتوثيق النباتات الطبية في الجزائر وتوزيعها الجغرافي ومركباتها وسلامتها.',
      modules: 'أقسام المنصة',
      partners: 'المراجع والشراكات الأكاديمية',
      partnersList: [
        'مؤسسات حماية الغابات والمحافظات الوطنية (الجزائر)',
        'كليات الصيدلة والطب والعلوم البيولوجية',
        'مخابر أبحاث التثمين البيولوجي والعشابون المعتمدون',
        'الأطالس النباتية الكلاسيكية (Quézel & Santa, Ozenda)',
        'وكالة الأدوية الأوروبية (EMA) ودساتير الأدوية'
      ],
      warningTitle: 'تنبيه طبي وقانوني هام',
      warningDesc: 'المعلومات الواردة في منصة DzHerba مخصصة لأغراض البحث الأكاديمي والتثقيف الصحي، ولا تغني بأي حال من الأحوال عن استشارة الطبيب أو الصيدلي المؤهل.',
      rights: 'جميع الحقوق محفوظة.',
      love: 'طُوّر بعناية للمحافظة على التنوع البيولوجي في الجزائر وتثمينه',
    },
    common: {
      scientificMonograph: 'دراسة علمية موثقة',
      vernacularName: 'الاسم الشائع محلياً',
      usages: 'الاستعمالات',
      consultBtn: 'تفاصيل النبتة',
      allFamilies: 'جميع العائلات النباتية',
      allActivities: 'جميع الأنشطة الدوائية',
      allRegions: 'جميع الولايات والمناطق',
      resetFilters: 'إعادة ضبط عوامل التصفية',
      noPlantsFound: 'لم يتم العثور على أي نبتة تطابق معايير البحث',
      readMonograph: 'عرض الدراسة الكاملة للنبتة',
    },
  },
  en: {
    slogan: 'Algerian Medicinal Plants Platform',
    plantCount: 'plants',
    nav: {
      home: 'Home',
      catalog: 'Encyclopedia',
      map: 'Algeria Map',
      identify: 'AI Vision',
      assistant: 'AI Assistant',
      pricing: 'Pricing',
      admin: 'Admin Console',
    },
    auth: {
      login: 'Log in',
      logout: 'Log out',
      switchAccount: 'Switch Account',
      adminPanel: 'Admin Dashboard',
      createAccount: 'Sign Up',
      authTitle: 'DzHerba Members Area',
      authSubtitle: 'Algerian Medicinal Plants Platform - Authentication & Access',
      secureBadge: 'Secure Authentication',
      loginTab: 'Log In',
      registerTab: 'Create Account',
      emailLabel: 'Institutional or Personal Email Address',
      passwordLabel: 'Password',
      fullNameLabel: 'Full Name',
      roleLabel: 'Desired Account Role',
      roleFree: 'Citizen & General Public (Free)',
      roleStudent: 'University / College Student',
      roleResearcher: 'Researcher / Academic (B2C)',
      roleInstitution: 'University / Laboratory (B2B)',
      loginActionBtn: 'Sign In to DzHerba',
      registerActionBtn: 'Create My Account',
      testAccountsTitle: '1-Click Test Accounts (Demo)',
      testAccountsSub: 'Select a role to immediately test role-based permissions',
      adminBadge: 'Master Admin',
      researcherBadge: 'Researcher',
      studentBadge: 'Student',
      campusBadge: 'Campus B2B',
      citizenBadge: 'Citizen',
      errMissingFields: 'Please fill in all required fields.',
      errAdminPass: 'Incorrect admin password (Demo: admin123)',
    },
    hero: {
      badge: 'The Scientific Reference for Algerian Medicinal Flora',
      title1: 'The Rich Medicinal Flora of Algeria,',
      title2: 'Validated by Science',
      desc: 'Explore over 270 comprehensive monographs: phytochemical profiles (GC-MS, HPLC), proven pharmacological activities, geographic distribution across Algeria, and safety warnings.',
      searchPlaceholder: 'Search in English, French, Arabic or Latin (e.g. Thyme, Romarin, شيح, Artemisia)...',
      exploreBtn: 'Explore',
      stats: {
        plants: 'Documented Plants',
        families: 'Botanical Families',
        wilayas: 'Wilayas Covered',
        studies: 'Scientific Studies',
      },
    },
    features: {
      encyclopediaTitle: 'Complete Encyclopedia',
      encyclopediaDesc: '279 detailed monographs with traditional uses, dosages, and phytochemical profiles.',
      mapTitle: 'Algerian Geobotanical Atlas',
      mapDesc: 'Explore medicinal species distribution across wilayas and bioclimatic regions.',
      identifyTitle: 'Photo Plant Identifier',
      identifyDesc: 'Upload a field photo to instantly identify plant species and safety profile.',
      assistantTitle: 'Specialized AI Assistant',
      assistantDesc: 'Ask questions about bioactivity, safety, and traditional uses in natural language.',
      consult: 'Browse',
      viewMap: 'Open Map',
      testIA: 'Test AI',
      chat: 'Start Chat',
    },
    card: {
      vernacularLabel: 'Vernacular name:',
      usesLabel: 'Uses:',
      safetyAlert: 'Safety warnings documented',
      consult: 'View Details',
      scientificMonograph: 'Scientific Monograph',
    },
    modal: {
      tabs: {
        traditional: 'Uses & Dosage',
        safety: 'Safety & Toxicity',
        distribution: 'Distribution & Harvest',
        phytochem: 'Phytochemistry',
        experimental: 'Research Data',
        references: 'References',
      },
      partsUsed: 'Plant parts used',
      dosage: 'Dosage & Recommendations',
      safetyTitle: 'Safety Profile & Toxicology Data',
      contraindications: 'Specific Contraindications',
      drugInteractions: 'Drug-Plant Interactions',
      plantInteractions: 'Plant-Plant Interactions (Synergies)',
      habitatTitle: 'Geographic Distribution & Habitat in Algeria',
      harvestTitle: 'Flowering Stage & Harvesting Calendar',
      phytochemLockedTitle: 'Detailed Phytochemical Profile (Researcher Tier)',
      phytochemLockedDesc: 'Detailed chemical fractions (GC-MS, HPLC), polyphenols, flavonoids and pharmacology are restricted to Researcher and Campus tiers.',
      unlockBtn: 'Unlock Researcher / Campus Access',
      printPdf: 'Print / Export PDF',
      close: 'Close',
      officialSource: 'DzHerba Official Scientific Database • Republic of Algeria',
      genus: 'Genus:',
      species: 'Species:',
      order: 'Order:',
      vernacularInDz: 'Vernacular name in Algeria',
    },
    map: {
      badge: 'Algerian Geobotanical Atlas',
      title: 'Medicinal Plant Distribution by Wilaya',
      subtitle: 'Explore Algerian medicinal flora across 3 biomes: Tell coastal plain, High Plateaus steppes, and Saharan oases.',
      allRegions: 'All Regions',
      tell: 'Coastal & Tell (Subhumid / Forests)',
      plateaux: 'High Plateaus & Aurès (Steppes)',
      sahara: 'Sahara & Oases (Arid)',
      clickMarker: 'Click a map marker to load recorded local species',
      selectedRegion: 'Selected Wilaya / Region:',
      taxaCount: 'recorded taxa',
      searchInRegion: 'Filter in region...',
      ecology: 'Local Ecology:',
      speciesInArea: 'Medicinal plants in',
      noPlantsInFilter: 'No plants specifically indexed with this filter.',
    },
    identify: {
      badge: 'Computer Vision & Botanical AI',
      title: 'Identify an Algerian Medicinal Plant',
      subtitle: 'Upload a field photo or select a test specimen to identify the botanical species and safety data.',
      dragDrop: 'Drop a photo here or click to browse',
      formats: 'Leaf, flower, stem or root (JPG, PNG)',
      orTestSamples: 'Or test with an Algerian botanical specimen:',
      scanning: 'Analyzing leaf & floral morphology with AI...',
      scanningSub: 'Matching against Algerian flora taxonomy',
      resultTitle: 'AI Detection Result',
      topMatch: 'Top Match',
      otherMatches: 'Other probable matches:',
      noPhoto: 'No photo loaded yet.',
      noPhotoSub: 'Select a sample specimen on the left or upload your photo.',
      dailyQuota: '5 free recognitions / day',
      unlimitedQuota: 'Unlimited recognitions (Researcher)',
      goUnlimited: 'Upgrade to Unlimited',
      openMonograph: 'Open Full Monograph',
      changeImg: 'Change image',
    },
    assistant: {
      badge: 'Specialized Botanical LLM Model',
      title: 'DzHerba Scientific AI Assistant',
      subtitle: 'Query the Algerian medicinal flora database in natural language.',
      welcome: "Hello! I am the **DzHerba** AI Assistant. I answer your questions on Algerian medicinal plants based strictly on verified scientific monographs from our platform.\n\nFeel free to ask your questions in Arabic, French, or English!",
      promptPlaceholder: 'Type your question here (e.g. Artemisia benefits, diabetes plants, garlic safety...)...',
      examples: 'Common Examples:',
      searching: 'Searching across 279 verified monographs...',
      relatedPlants: 'Related Botanical Records:',
    },
    pricing: {
      badge: 'Business Model Canvas & Subscriptions',
      title: 'Access Full Algerian Botanical Knowledge',
      subtitle: 'Basic public information is free for all citizens. In-depth phytochemical, experimental, and clinical research data for students, researchers, and universities.',
      currentPlan: 'Your current tier:',
      monthly: 'Monthly Billing',
      annual: 'Annual Billing',
      discount: '25% Discount',
      freeTitle: 'Free Public Access',
      freeSubtitle: 'Citizens & General Public',
      freePrice: '0 DZD / forever',
      freeDesc: 'To discover Algerian flora and verify safe traditional remedies.',
      researcherTitle: 'Scientific Researcher Plan',
      researcherSubtitle: 'Pharmacy & Biology Researchers (B2C)',
      researcherPriceAnnual: '9,800 DZD / year',
      researcherPriceMonthly: '1,200 DZD / month',
      researcherDesc: 'Complete phytochemical monographs, in vitro/in vivo research data, and PDF downloads.',
      campusTitle: 'Campus License',
      campusSubtitle: 'Universities & Research Labs (B2B)',
      campusPrice: 'Custom quote (from 85,000 DZD/year)',
      campusDesc: 'For faculties of Pharmacy, Medicine, Biology, and national scientific institutes.',
      cibEdahabia: 'Secure electronic payment in Algeria via CIB / Edahabia',
      subscribeBtn: 'Pay with CIB / Edahabia',
      subscribedBadge: 'Researcher Tier Active ✓',
      campusBtn: 'Activate Campus B2B License',
      activeBadge: 'Campus License Active ✓',
      freeFeatures: [
        'Scientific and vernacular names (Arabic / Tamazight)',
        'Botanical description and general distribution',
        'Scientifically verified traditional uses',
        'Essential toxicity and safety alerts',
        '5 AI photo identifications / day',
      ],
      researcherFeatures: [
        'All features of the Free Public tier',
        'Detailed phytochemical profiles (GC-MS, HPLC, polyphenols)',
        'Experimental pharmacological bioactivity data',
        'Advanced multi-criteria search and filters',
        'Unlimited AI Photo recognition & LLM Assistant',
        'Full PDF monograph download & export',
      ],
      campusFeatures: [
        'Unlimited institutional access for all students and faculty',
        'Official integration with university digital library',
        'Bulk dataset exports for master’s and PhD research theses',
        'Dedicated API access & signed university conventions',
      ],
      freeCurrentBtn: 'Current Plan',
      freeSwitchBtn: 'Switch to Free Tier',
      recommendedBadge: 'Recommended for Researchers',
      paymentSuccessTitle: 'CIB / Edahabia Payment Confirmed!',
      paymentSuccessDesc: 'All permissions associated with your new tier have been instantly unlocked.',
    },
    adminDashboard: {
      badge: 'Scientific & Technical Direction',
      title: 'Global Administration Console',
      subtitle: 'Manage the 279 botanical monographs, track CIB/Edahabia subscriptions, and configure pricing.',
      stats: {
        totalSpecies: 'Documented Species',
        activeSubs: 'Active Subscriptions',
        dzdRevenue: 'Collected Revenue',
        b2bPartners: 'Campus B2B Agreements',
      },
      tabs: {
        plants: 'Botanical Catalogue (CRUD)',
        subscriptions: 'Subscriptions & Payments (CIB/Edahabia)',
        pricing: 'Pricing Matrix & Quotas',
      },
      plantsTab: {
        searchPlaceholder: 'Search by scientific name, family or vernacular name...',
        addBtn: 'Add New Species',
        colId: 'ID',
        colPlant: 'Plant & Scientific Name',
        colFamily: 'Family & Order',
        colVernacular: 'Vernacular Name',
        colActions: 'Actions',
        viewBtn: 'View',
        editBtn: 'Edit',
        deleteBtn: 'Delete',
        confirmDelete: 'Are you sure you want to delete this plant record?',
      },
      subsTab: {
        searchPlaceholder: 'Search by user, email or institution...',
        exportCsvBtn: 'Export CSV (Accounting)',
        colSubId: 'Ref. / ID',
        colUser: 'User',
        colOrg: 'Institution / Faculty',
        colPlan: 'Plan Tier',
        colStatus: 'Status',
        colAmount: 'Amount (DZD)',
        colMethod: 'Payment Method',
        colDate: 'Expiry Date',
        statusActive: 'Active',
        statusExpired: 'Expired',
      },
      pricingTab: {
        title: 'Pricing Matrix Configuration',
        desc: 'Update Algerian Dinar (DZD) subscription fees for students, researchers, and universities.',
        saveBtn: 'Save New Pricing',
        cibNotice: 'Transactions are processed through the Algerian SATIM interbank network (CIB & Edahabia).',
        fieldAnnual: 'Researcher Annual (DZD / year)',
        fieldMonthly: 'Researcher Monthly (DZD / month)',
        fieldCampus: 'Campus B2B Annual License (DZD / year)',
      },
      modal: {
        titleAdd: 'Add New Medicinal Plant',
        titleEdit: 'Edit Botanical Monograph',
        scName: 'Scientific Name *',
        family: 'Botanical Family *',
        order: 'Order',
        vernacular: 'Vernacular Names (Arabic / Local)',
        habitat: 'Habitat & Distribution in Algeria',
        uses: 'Documented Traditional Uses',
        dosage: 'Dosage & Preparation',
        toxicity: 'Toxicity & Safety Profile',
        contraindications: 'Contraindications',
        drugInteractions: 'Drug Interactions',
        phytochem: 'Phytochemistry (GC-MS / HPLC / Compounds)',
        pharma: 'Pharmacology & Verified Bioactivities',
        references: 'Bibliographic References',
        cancelBtn: 'Cancel',
        saveBtn: 'Save Monograph',
      },
    },
    footer: {
      about: 'The premier scientific platform dedicated to the documentation, phytochemistry, and pharmacology of Algerian medicinal plants.',
      modules: 'Platform Modules',
      partners: 'Academic References & Partnerships',
      partnersList: [
        'Algerian Forest Conservation Institutes',
        'Faculties of Pharmacy, Medicine & Biology',
        'Ethnobotanical research labs & certified herbalists',
        'Classic Algerian floras (Quézel & Santa, Ozenda)',
        'European Medicines Agency (EMA) herbal monographs'
      ],
      warningTitle: 'Important Medical Disclaimer',
      warningDesc: 'Information on DzHerba is intended for educational and academic research purposes and does not substitute professional medical advice.',
      rights: 'All rights reserved.',
      love: 'Developed with care to preserve and value Algerian biodiversity',
    },
    common: {
      scientificMonograph: 'Scientific Monograph',
      vernacularName: 'Vernacular name',
      usages: 'Uses',
      consultBtn: 'View Details',
      allFamilies: 'All Botanical Families',
      allActivities: 'All Pharmacological Activities',
      allRegions: 'All Wilayas & Regions',
      resetFilters: 'Reset all filters',
      noPlantsFound: 'No plants matched your criteria',
      readMonograph: 'Open Full Monograph',
    },
  },
};
