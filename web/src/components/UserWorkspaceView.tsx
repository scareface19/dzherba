import React, { useState, useEffect } from 'react';
import type { User, Plant, UserFavoriteItem, FieldObservation, Language } from '../types';
import { api } from '../services/api';
import { 
  Heart, Bookmark, AlertTriangle, 
  CheckCircle2, Send, MapPin, 
  UserCheck, ExternalLink, Stethoscope
} from 'lucide-react';

interface UserWorkspaceViewProps {
  currentUser: User | null;
  allPlants: Plant[];
  onOpenPlantModal: (plant: Plant) => void;
  onUpgradeTier: () => void;
  currentLang?: Language;
}

export const UserWorkspaceView: React.FC<UserWorkspaceViewProps> = ({
  currentUser,
  allPlants,
  onOpenPlantModal,
  onUpgradeTier,
  currentLang = 'fr',
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'interactions' | 'observations'>('favorites');
  const [favorites, setFavorites] = useState<UserFavoriteItem[]>([]);
  const [observations, setObservations] = useState<FieldObservation[]>([]);

  // Interaction checker state
  const [selectedPlantId, setSelectedPlantId] = useState<number>(allPlants[0]?.id || 1);
  const [selectedDrugClass, setSelectedDrugClass] = useState<string>('anticoagulant');

  // New Observation form state
  const [obsPlantName, setObsPlantName] = useState('');
  const [obsWilaya, setObsWilaya] = useState('Djelfa');
  const [obsLocality, setObsLocality] = useState('');
  const [obsNotes, setObsNotes] = useState('');
  const [obsSuccess, setObsSuccess] = useState(false);

  const userId = currentUser ? currentUser.id : 'USR-ADMIN';

  const loadData = async () => {
    try {
      const favs = await api.getFavorites(userId);
      setFavorites(favs);
      const obs = await api.getObservations();
      setObservations(obs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleToggleFavorite = async (plantId: number) => {
    await api.toggleFavorite(userId, plantId);
    loadData();
  };

  const handleSubmitObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsPlantName.trim()) return;

    await api.submitObservation({
      userId,
      userName: currentUser ? currentUser.name : 'Chercheur DzHerba',
      plantName: obsPlantName,
      wilaya: obsWilaya,
      locality: obsLocality,
      notes: obsNotes,
      photoUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600'
    });

    setObsPlantName('');
    setObsLocality('');
    setObsNotes('');
    setObsSuccess(true);
    setTimeout(() => setObsSuccess(false), 4000);
    loadData();
  };

  const selectedPlant = allPlants.find(p => p.id === selectedPlantId) || allPlants[0];

  // Drug classes for interaction simulator
  const drugClasses = [
    { key: 'anticoagulant', label: currentLang === 'ar' ? 'مضادات التخثر ومميعات الدم (مثل: Sintrom, Aspégic)' : 'Anticoagulants & Antiagrégants (ex: Sintrom, Aspirine)' },
    { key: 'antidiabetic', label: currentLang === 'ar' ? 'أدوية السكري (مثل: Metformine, Glimepiride)' : 'Antidiabétiques oraux (ex: Glucophage, Metformine)' },
    { key: 'antihypertensive', label: currentLang === 'ar' ? 'أدوية ضغط الدم والقلب (مثل: Amlor, Coversyl)' : 'Antihypertenseurs & Bêtabloquants (ex: Coversyl, Amlor)' },
    { key: 'sedative', label: currentLang === 'ar' ? 'المهدئات ومضادات القلق (مثل: Lexomil, Valium)' : 'Sédatifs & Benzodiazépines (ex: Lexomil, Valium)' },
    { key: 'nsaid', label: currentLang === 'ar' ? 'مضادات الالتهاب غير الستيرويدية (مثل: Ibuprofène, Voltarene)' : 'Anti-inflammatoires (AINS : Ibuprofène, Voltarene)' }
  ];

  // Determine potential interaction risk
  const getInteractionReport = () => {
    if (!selectedPlant) return null;
    const safety = selectedPlant.safety_profile;
    const contra = (safety.contraindications || '').toLowerCase();
    const drugInt = (safety.drug_interactions || '').toLowerCase();
    const toxic = (safety.toxicity || '').toLowerCase();

    let hasRisk = false;
    let explanation = '';

    if (selectedDrugClass === 'anticoagulant') {
      if (drugInt.includes('anticoagulant') || drugInt.includes('hémorragie') || contra.includes('hémorragie') || selectedPlant.scientific_name.includes('Allium') || selectedPlant.scientific_name.includes('Salvia')) {
        hasRisk = true;
        explanation = currentLang === 'ar' 
          ? 'خطر مرتفع للنزيف: تحتوي هذه النبتة على مركبات تؤثر على الصفائح الدموية أو تزيد من مفعول مميعات الدم.' 
          : 'Risque accru d’hémorragie : synergie pharmacologique avec les antiagrégants ou anticoagulants.';
      }
    } else if (selectedDrugClass === 'antidiabetic') {
      if (drugInt.includes('diabèt') || contra.includes('hypoglycémie') || selectedPlant.traditional_medicine.uses.toLowerCase().includes('diab')) {
        hasRisk = true;
        explanation = currentLang === 'ar'
          ? 'خطر انخفاض حاد في سكر الدم (Hypoglycémie): تمتلك النبتة خواصاً خافضة للسكر تعزز مفعول العلاج الطبي.'
          : 'Risque d’hypoglycémie sévère : effet additif avec les traitements hypoglycémiants oraux.';
      }
    } else if (selectedDrugClass === 'antihypertensive') {
      if (drugInt.includes('tension') || contra.includes('hypotension') || selectedPlant.traditional_medicine.uses.toLowerCase().includes('tension')) {
        hasRisk = true;
        explanation = currentLang === 'ar'
          ? 'خطر هبوط مفرط في الضغط الشرياني: قد تسبب النبتة تآزراً دوائياً يؤدي إلى دوار أو هبوط مفاجئ.'
          : 'Risque de baisse excessive de la pression artérielle : effet hypotenseur cumulatif.';
      }
    }

    if (!hasRisk && (drugInt.length > 5 || contra.length > 5 || toxic.length > 5)) {
      explanation = currentLang === 'ar'
        ? `تنبيه عام مسجل للنبتة: ${safety.drug_interactions || safety.contraindications || safety.toxicity}`
        : `Mise en garde spécifique répertoriée : ${safety.drug_interactions || safety.contraindications || safety.toxicity}`;
    } else if (!hasRisk) {
      explanation = currentLang === 'ar'
        ? 'لا توجد تفاعلات عكسية كبرى مسجلة في البيانات السريرية المتوفرة حتى الآن، مع ضرورة الالتزام بالجرعات التقليدية المعتدلة.'
        : 'Aucune interaction délétère majeure documentée aux doses thérapeutiques usuelles.';
    }

    return { hasRisk, explanation };
  };

  const report = getInteractionReport();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="bg-linear-to-r from-[#2D4A41] via-[#426B5F] to-[#5A8C7E] text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CD9850] text-[#0B0B0B] text-xs font-black uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'فضاء المستخدم المتقدم' : 'Espace Membre & Outils Avancés'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser?.name || 'Dr. Reda Mansouri'}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            {currentUser?.organization || 'Direction Technique & Scientifique DzHerba'} • {currentUser?.email || 'admin@dzherba.dz'}
          </p>
        </div>

        {/* Tier badge & Upgrade shortcut */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-amber-200 font-bold">
            {currentLang === 'ar' ? 'نوع الحساب النشط' : 'Statut du Compte'}
          </div>
          <div className="text-lg font-black text-white uppercase">
            {currentUser?.role || 'admin'}
          </div>
          <button
            onClick={onUpgradeTier}
            className="px-3 py-1.5 rounded-xl bg-[#CD9850] hover:bg-[#b8853e] text-[#0B0B0B] text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            {currentLang === 'ar' ? 'ترقية الباقة' : 'Gérer l’Abonnement'}
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E1D3BE] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'favorites'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{currentLang === 'ar' ? 'معشبتي الرقمية (المفضلة)' : 'Mon Herbier Virtuel'} ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interactions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'interactions'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-emerald-600" />
          <span>PharmaCheck DZ ({currentLang === 'ar' ? 'مدقق الأمان الدوائي' : 'Interactions Médicamenteuses'})</span>
        </button>

        <button
          onClick={() => setActiveTab('observations')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'observations'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4 text-amber-600" />
          <span>{currentLang === 'ar' ? 'الملاحظات الميدانية' : 'Signalements Terrain'} ({observations.length})</span>
        </button>
      </div>

      {/* TAB 1: FAVORITES & HERBARIUM */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-[#0B0B0B]">
                {currentLang === 'ar' ? 'النباتات المحفوظة في المعشبة الشخصية' : 'Monographies Enregistrées'}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {currentLang === 'ar' ? 'قائمة النباتات المفضلة مع ملاحظاتك البحثية والتطبيقية' : 'Accès rapide à vos plantes d’intérêt avec vos notes de recherche.'}
              </p>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#E1D3BE] space-y-2">
              <Bookmark className="w-10 h-10 text-gray-400 mx-auto" />
              <h4 className="font-bold text-sm text-[#0B0B0B]">
                {currentLang === 'ar' ? 'لم تقم بحفظ أي نبتة في المعشبة حتى الآن.' : 'Votre herbier virtuel est vide pour le moment.'}
              </h4>
              <p className="text-xs text-[#575D5A]">
                {currentLang === 'ar' ? 'انقر على أيقونة الحفظ في أي دراسة نباتية لإضافتها هنا.' : 'Explorez le catalogue des 279 plantes pour ajouter vos espèces favorites.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <div 
                  key={fav.fav_id}
                  className="bg-white rounded-2xl border border-[#E1D3BE] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#426B5F] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#426B5F] bg-[#426B5F]/10 px-2 py-0.5 rounded-md">
                        {fav.plant.taxonomy?.family || 'Botanique'}
                      </span>
                      <button
                        onClick={() => handleToggleFavorite(fav.plant.id)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    <h4 className="font-serif italic font-bold text-base text-[#0B0B0B]">
                      {fav.plant.scientific_name}
                    </h4>

                    {fav.plant.vernacular_raw && (
                      <p className="text-sm font-cairo font-bold text-[#CD9850]">
                        {fav.plant.vernacular_raw}
                      </p>
                    )}

                    {fav.personal_notes && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block text-[10px] uppercase">Notes personnelles :</span>
                        {fav.personal_notes}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenPlantModal(fav.plant)}
                    className="w-full py-2 rounded-xl bg-[#426B5F] text-white font-bold text-xs hover:bg-[#2D4A41] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{currentLang === 'ar' ? 'فتح الدراسة الكاملة' : 'Consulter la Monographie'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PHARMACHECK DZ (INTERACTIONS CHECKER) */}
      {activeTab === 'interactions' && (
        <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>PharmaCheck DZ • Sécurité Sanitaire & Pharmacopée</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#0B0B0B]">
              {currentLang === 'ar' ? 'فاحص التفاعلات الدوائية والتداخلات الطبية' : 'Vérificateur d’Interactions Médicament - Plante'}
            </h3>
            <p className="text-xs sm:text-sm text-[#575D5A]">
              {currentLang === 'ar'
                ? 'تحقق فوراً من توافق النبتة الطبية مع العلاجات الدوائية للأمراض المزمنة (القلب، السكري، التخثر) لتفادي التسمم أو النزيف.'
                : 'Sélectionnez une plante médicinale et une classe thérapeutique pour évaluer les risques de toxicité croisée ou de synergie néfaste.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F5F3F3] p-5 rounded-2xl border border-[#E1D3BE]">
            <div>
              <label className="font-bold text-xs text-[#0B0B0B] block mb-1">
                {currentLang === 'ar' ? '1. اختر النبتة الطبية من الموسوعة :' : '1. Choisir la Plante Médicinale :'}
              </label>
              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-white text-xs font-semibold text-[#0B0B0B]"
              >
                {allPlants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.scientific_name} {p.vernacular_raw ? `(${p.vernacular_raw})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-xs text-[#0B0B0B] block mb-1">
                {currentLang === 'ar' ? '2. اختر العلاج الكيميائي المقترن :' : '2. Classe de Médicaments en cours :'}
              </label>
              <select
                value={selectedDrugClass}
                onChange={(e) => setSelectedDrugClass(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-white text-xs font-semibold text-[#0B0B0B]"
              >
                {drugClasses.map(d => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Card */}
          {report && (
            <div className={`p-6 rounded-2xl border ${report.hasRisk ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'} space-y-3`}>
              <div className="flex items-center gap-3">
                {report.hasRisk ? (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    {report.hasRisk 
                      ? (currentLang === 'ar' ? 'تحذير طبي : تفاعل عكسي محتمل !' : 'Alerte Vigilance : Risque d’Interaction Documenté !')
                      : (currentLang === 'ar' ? 'مستوى أمان مقبول (ضمن الجرعات الموصى بها)' : 'Niveau de Sécurité Conforme aux Doses Usuelles')}
                  </h4>
                  <p className="text-xs mt-0.5">
                    {selectedPlant?.scientific_name} ({selectedPlant?.vernacular_raw || '—'})
                  </p>
                </div>
              </div>

              <div className="text-xs leading-relaxed pt-2 border-t border-black/10">
                {report.explanation}
              </div>

              {selectedPlant?.safety_profile?.contraindications && (
                <div className="text-[11px] pt-1 text-black/70 italic">
                  <strong>Contre-indications répertoriées :</strong> {selectedPlant.safety_profile.contraindications}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FIELD OBSERVATIONS */}
      {activeTab === 'observations' && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-[#0B0B0B]">
                {currentLang === 'ar' ? 'إرسال ملاحظة نباتية ميدانية جديدة' : 'Signaler une Station Botanique en Algérie'}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {currentLang === 'ar'
                  ? 'ساهم في إثراء الأطلس النباتي الجزائري بتوثيق مواقع انتشار الأعشاب الطبية في ولايتك.'
                  : 'Participez à la cartographie collaborative de la flore algérienne (Science Participative).'}
              </p>
            </div>

            {obsSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{currentLang === 'ar' ? 'تم تسجيل ملاحظتك بنجاح في قاعدة بيانات MySQL !' : 'Votre observation a été transmise avec succès au comité de validation !'}</span>
              </div>
            )}

            <form onSubmit={handleSubmitObservation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">
                    {currentLang === 'ar' ? 'اسم النبتة الملاحظة *' : 'Nom de la Plante *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Artemisia herba-alba (الشيح)"
                    value={obsPlantName}
                    onChange={(e) => setObsPlantName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">
                    {currentLang === 'ar' ? 'الولاية الجزائرية *' : 'Wilaya de l’Observation *'}
                  </label>
                  <select
                    value={obsWilaya}
                    onChange={(e) => setObsWilaya(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3] text-[#0B0B0B]"
                  >
                    <option value="Djelfa">Djelfa (الجلفة)</option>
                    <option value="Batna">Batna (باتنة)</option>
                    <option value="Sétif">Sétif (سطيف)</option>
                    <option value="Tlemcen">Tlemcen (تلمسان)</option>
                    <option value="Tizi Ouzou">Tizi Ouzou (تيزي وزو)</option>
                    <option value="Biskra">Biskra (بسكرة)</option>
                    <option value="Alger">Alger (الجزائر)</option>
                    <option value="Constantine">Constantine (قسنطينة)</option>
                    <option value="Ghardaïa">Ghardaïa (غرداية)</option>
                    <option value="Tamanrasset">Tamanrasset (تمنراست)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">
                    {currentLang === 'ar' ? 'الموقع الدقيق / البلدية' : 'Localité précise / Forêt / Djebel'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Massif de l’Edough, 850m d’altitude"
                    value={obsLocality}
                    onChange={(e) => setObsLocality(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0B0B0B] block mb-1">
                    {currentLang === 'ar' ? 'ملاحظات حول حالة النبتة والبيئة' : 'Notes écologiques & Floraison'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Floraison abondante, sol calcaire sec"
                    value={obsNotes}
                    onChange={(e) => setObsNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E1D3BE] bg-[#F5F3F3]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'إرسال الملاحظة' : 'Enregistrer le Signalement'}</span>
              </button>
            </form>
          </div>

          {/* Observations List */}
          <div className="bg-white rounded-3xl border border-[#E1D3BE] p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-base text-[#0B0B0B]">
              {currentLang === 'ar' ? 'الملاحظات الميدانية المسجلة حديثاً' : 'Derniers Signalements Validés dans la Base'}
            </h4>

            <div className="divide-y divide-[#E1D3BE]/60">
              {observations.map((obs) => (
                <div key={obs.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#0B0B0B]">{obs.plant_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {obs.wilaya}
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {obs.observation_date}
                      </span>
                    </div>
                    <p className="text-[#575D5A]">
                      {obs.locality ? `${obs.locality} • ` : ''} {obs.notes}
                    </p>
                    <span className="text-[11px] text-[#426B5F] font-semibold mt-0.5 block">
                      Par : {obs.user_name}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-center ${
                    obs.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {obs.status === 'approved' ? '✓ Validé Scientifique' : '⏳ En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
