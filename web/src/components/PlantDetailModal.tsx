import React, { useState } from 'react';
import type { Plant, UserRole, Language } from '../types';
import { 
  X, AlertTriangle, MapPin, Calendar, 
  FlaskConical, Lock, BookOpen, Layers, CheckCircle2,
  FileText, Activity, Edit3, Image as ImageIcon,
  ExternalLink, Printer, Leaf, Eye
} from 'lucide-react';
import { translations } from '../i18n';
import { exportPlantToPdf } from '../utils/pdfExport';

export function formatImageUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, '');
}

interface PlantDetailModalProps {
  plant: Plant | null;
  onClose: () => void;
  userRole: UserRole;
  onUpgradeToPremium: () => void;
  onEditPlant?: () => void;
  currentLang?: Language;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  onClose,
  userRole,
  onUpgradeToPremium,
  onEditPlant,
  currentLang = 'fr',
}) => {
  const [activeTab, setActiveTab] = useState<'traditional' | 'photos' | 'safety' | 'distribution' | 'phytochem' | 'experimental' | 'references'>('traditional');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const t = translations[currentLang].modal;

  if (!plant) return null;

  const hasResearchAccess = userRole === 'researcher' || userRole === 'institution' || userRole === 'student' || userRole === 'admin';
  const rawImages = plant.images || [];
  const plantImages = rawImages.filter(Boolean).map(formatImageUrl);

  const handleExportPdf = async () => {
    if (!plant || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportPlantToPdf(plant, currentLang);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF :', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Dz Botanical Banner */}
        <div className="relative bg-linear-to-r from-[#2D4A41] via-[#426B5F] to-[#5A8C7E] text-[#F5F3F3] p-6 sm:p-8">
          <div className="absolute top-5 end-5 flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title={currentLang === 'ar' ? 'طباعة وتصدير PDF في تبويب جديد' : 'Imprimer / Exporter PDF (nouvel onglet)'}
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-amber-200" />
              )}
              <span>
                {isExportingPdf
                  ? (currentLang === 'ar' ? 'جاري التوليد...' : 'Génération...')
                  : (currentLang === 'ar' ? 'طباعة / PDF' : 'Imprimer / PDF')}
              </span>
            </button>

            {userRole === 'admin' && onEditPlant && (
              <button
                onClick={onEditPlant}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier (Admin)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#CD9850] text-[#0B0B0B]">
              {plant.taxonomy.family || 'Famille Botanique'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
              Taxon #{plant.id}
            </span>
            {plant.taxonomy.order && (
              <span className="text-xs text-white/80">
                {t.order} {plant.taxonomy.order}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mt-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold italic tracking-wide">
                {plant.scientific_name}
              </h2>
              {plant.taxonomy.genus && (
                <p className="text-xs text-white/70 mt-1 font-mono">
                  {t.genus} {plant.taxonomy.genus} {plant.taxonomy.species ? `| ${t.species} ${plant.taxonomy.species}` : ''}
                </p>
              )}
            </div>

            {plant.vernacular_raw && (
              <div className="sm:text-right bg-black/20 px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-xs text-amber-200 block">{t.vernacularInDz}</span>
                <span className="text-xl sm:text-2xl font-cairo font-extrabold text-[#CD9850]">
                  {plant.vernacular_raw}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Monograph Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E1D3BE] bg-[#F5F3F3] px-6 py-2">
          <button
            onClick={() => setActiveTab('traditional')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'traditional'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'text-[#575D5A] hover:bg-[#E1D3BE]/50 hover:text-[#0B0B0B]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t.tabs.traditional}
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-[#CD9850] text-[#0B0B0B] shadow-xs'
                : plantImages.length > 0
                  ? 'text-[#CD9850] bg-[#CD9850]/10 hover:bg-[#CD9850]/20'
                  : 'text-[#575D5A] hover:bg-[#E1D3BE]/50 hover:text-[#0B0B0B]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>
              {currentLang === 'ar' ? 'الصور الحقيقية' : currentLang === 'en' ? 'Real Photos' : 'Photos réelles'} ({plantImages.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.tabs.safety}
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'text-[#575D5A] hover:bg-[#E1D3BE]/50 hover:text-[#0B0B0B]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {t.tabs.distribution}
          </button>

          <button
            onClick={() => setActiveTab('phytochem')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'phytochem'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'text-[#575D5A] hover:bg-[#E1D3BE]/50 hover:text-[#0B0B0B]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {t.tabs.phytochem} {!hasResearchAccess && <Lock className="w-3 h-3 text-[#CD9850]" />}
          </button>

          <button
            onClick={() => setActiveTab('experimental')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'experimental'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'text-[#575D5A] hover:bg-[#E1D3BE]/50 hover:text-[#0B0B0B]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t.tabs.experimental} {!hasResearchAccess && <Lock className="w-3 h-3 text-[#CD9850]" />}
          </button>

          <button
            onClick={() => setActiveTab('references')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'references'
                ? 'bg-[#426B5F] text-white shadow-xs'
                : 'text-[#575D5A] hover:bg-[#E1D3BE]/50 hover:text-[#0B0B0B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t.tabs.references}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* TAB 1: Traditional uses */}
          {activeTab === 'traditional' && (
            <div className="space-y-6">
              {/* Highlight Real Photos directly in the first tab */}
              {plantImages.length > 0 && (
                <div className="bg-linear-to-r from-[#2D4A41]/10 via-[#426B5F]/10 to-[#CD9850]/10 p-4 rounded-2xl border border-[#CD9850]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div 
                      onClick={() => setActiveTab('photos')}
                      className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#CD9850] shadow-md shrink-0 cursor-pointer group relative bg-black/5"
                    >
                      <img
                        src={plantImages[0]}
                        alt={plant.scientific_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#CD9850] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {currentLang === 'ar' ? 'توثيق فوتوغرافي ميداني' : 'Iconographie botanique de terrain'}
                      </span>
                      <h4 className="text-sm font-bold text-[#0B0B0B] mt-0.5">
                        {currentLang === 'ar' 
                          ? `${plantImages.length} صور عالية الدقة متوفرة لهذه النبتة` 
                          : `${plantImages.length} cliché${plantImages.length > 1 ? 's' : ''} haute définition disponible${plantImages.length > 1 ? 's' : ''}`}
                      </h4>
                      <p className="text-xs text-[#575D5A] mt-0.5">
                        {currentLang === 'ar' ? 'انقر لمعاينة أوراقها وأزهارها بالحجم الكامل' : 'Morphologie foliaire, floraison et organes thérapeutiques.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('photos')}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#CD9850] hover:bg-[#b8843e] text-[#0B0B0B] font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? 'عرض الصور الكاملة' : 'Voir les photos'}</span>
                  </button>
                </div>
              )}

              <div className="bg-[#EBF2F0] p-5 rounded-2xl border border-[#426B5F]/20">
                <h4 className="text-sm font-bold text-[#426B5F] flex items-center gap-2 mb-2 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.tabs.traditional}
                </h4>
                <p className="text-sm sm:text-base text-[#0B0B0B] leading-relaxed whitespace-pre-line">
                  {plant.traditional_medicine.uses || 'Aucun usage traditionnel documenté enregistré dans cette fiche.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE] shadow-xs">
                  <h4 className="text-xs font-bold text-[#CD9850] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    {t.partsUsed}
                  </h4>
                  <p className="text-sm text-[#0B0B0B]">
                    {plant.traditional_medicine.parts_used || 'Feuilles, sommités fleuries, racines ou graines.'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE] shadow-xs">
                  <h4 className="text-xs font-bold text-[#CD9850] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {t.dosage}
                  </h4>
                  <p className="text-sm text-[#0B0B0B]">
                    {plant.traditional_medicine.dosage || 'Consulter les pharmacopées officielles ou un professionnel de santé agréé.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB PHOTOS: High-Res Real Plant Images */}
          {activeTab === 'photos' && (
            plantImages.length > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center border border-[#E1D3BE] relative shadow-md">
                  <img
                    src={plantImages[selectedImageIndex] || plantImages[0]}
                    alt={`${plant.scientific_name} photo ${selectedImageIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                  <a
                    href={plantImages[selectedImageIndex] || plantImages[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 end-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-xl backdrop-blur-xs flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Plein écran HD</span>
                  </a>
                  <span className="absolute top-3 start-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-mono backdrop-blur-xs">
                    Photo {selectedImageIndex + 1} / {plantImages.length}
                  </span>
                </div>

                {plantImages.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {plantImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-20 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          selectedImageIndex === idx ? 'border-[#CD9850] scale-105 shadow-md ring-2 ring-[#CD9850]/40' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center bg-[#F5F3F3] rounded-3xl border border-[#E1D3BE] p-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#426B5F]/10 text-[#426B5F] flex items-center justify-center">
                  <Leaf className="w-8 h-8 opacity-70" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-bold text-base text-[#0B0B0B]">
                    {currentLang === 'ar' ? 'صورة ميدانية قيد التوثيق' : 'Iconographie en cours de numérisation'}
                  </h4>
                  <p className="text-xs text-[#575D5A] leading-relaxed">
                    {currentLang === 'ar'
                      ? `التوثيق الفوتوغرافي لـ "${plant.scientific_name}" قيد الإدراج من قبل اللجان العلمية الميدانية.`
                      : `Les clichés photographiques réels pour "${plant.scientific_name}" sont en cours de collecte par l'équipe botanique DzHerba.`}
                  </p>
                </div>
              </div>
            )
          )}

          {/* TAB 2: Safety & Toxicity */}
          {activeTab === 'safety' && (
            <div className="space-y-5">
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  {t.safetyTitle}
                </h4>
                <p className="text-sm sm:text-base text-amber-950 leading-relaxed whitespace-pre-line">
                  {plant.safety_profile.toxicity || 'Données toxicologiques standard : respect des doses usuelles recommandé.'}
                </p>
              </div>

              {plant.safety_profile.contraindications && (
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">
                    {t.contraindications}
                  </h4>
                  <p className="text-sm text-rose-950">
                    {plant.safety_profile.contraindications}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE]">
                  <h4 className="text-xs font-bold text-[#426B5F] uppercase tracking-wider mb-2">
                    {t.drugInteractions}
                  </h4>
                  <p className="text-sm text-[#575D5A]">
                    {plant.safety_profile.drug_interactions || 'Aucune interaction néfaste majeure signalée dans les protocoles standard révisés.'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE]">
                  <h4 className="text-xs font-bold text-[#426B5F] uppercase tracking-wider mb-2">
                    {t.plantInteractions}
                  </h4>
                  <p className="text-sm text-[#575D5A]">
                    {plant.safety_profile.plant_interactions || 'Synergies possibles avec d’autres espèces aromatiques algériennes.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Distribution & Harvest */}
          {activeTab === 'distribution' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE]">
                <h4 className="text-xs font-bold text-[#426B5F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#CD9850]" />
                  {t.habitatTitle}
                </h4>
                <p className="text-sm sm:text-base text-[#0B0B0B] leading-relaxed whitespace-pre-line">
                  {plant.distribution.habitat_description || 'Présente dans divers étages bioclimatiques en Algérie.'}
                </p>

                {plant.distribution.regions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E1D3BE]/60">
                    <div className="flex flex-wrap gap-1.5">
                      {plant.distribution.regions.map((reg) => (
                        <span key={reg} className="px-2.5 py-1 rounded-lg bg-[#426B5F]/10 text-[#426B5F] text-xs font-semibold">
                          {reg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {plant.distribution.flowering_harvesting && (
                <div className="bg-[#F4EFE7] p-5 rounded-2xl border border-[#E1D3BE]">
                  <h4 className="text-xs font-bold text-[#CD9850] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {t.harvestTitle}
                  </h4>
                  <p className="text-sm text-[#0B0B0B] whitespace-pre-line">
                    {plant.distribution.flowering_harvesting}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Phytochemistry (Freemium Gate) */}
          {activeTab === 'phytochem' && (
            <div className="space-y-5">
              {!hasResearchAccess ? (
                <div className="bg-linear-to-b from-white to-[#F4EFE7] p-8 rounded-3xl border border-[#CD9850] text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#CD9850]/20 flex items-center justify-center text-[#CD9850]">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#0B0B0B]">
                      {t.phytochemLockedTitle}
                    </h4>
                    <p className="text-sm text-[#575D5A] max-w-lg mx-auto mt-2">
                      {t.phytochemLockedDesc}
                    </p>
                  </div>

                  <div className="p-4 bg-white/80 rounded-xl border border-[#E1D3BE] text-left text-xs text-[#575D5A] filter blur-xs select-none">
                    {plant.pharmacology.phytochemical_profile || 'Benzoxazinoids, flavonoids (luteolin, apigenin), phenolic acids (chlorogenic, caffeic, ferulic)...'}
                  </div>

                  <button
                    onClick={onUpgradeToPremium}
                    className="px-6 py-2.5 rounded-xl bg-[#CD9850] hover:bg-[#A87635] text-[#0B0B0B] font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {t.unlockBtn}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                    <span>{userRole.toUpperCase()} • ACCÈS SCIENTIFIQUE</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="bg-[#EBF2F0] p-5 rounded-2xl border border-[#426B5F]/20">
                    <h4 className="text-xs font-bold text-[#426B5F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      Activités Pharmacologiques Identifiées
                    </h4>
                    <p className="text-sm sm:text-base text-[#0B0B0B] whitespace-pre-line leading-relaxed">
                      {plant.pharmacology.activities || 'Activités antioxydantes, anti-inflammatoires et antimicrobiennes.'}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE]">
                    <h4 className="text-xs font-bold text-[#CD9850] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4" />
                      Profil Phytochimique & Métabolites Secondaires
                    </h4>
                    <p className="text-sm sm:text-base text-[#0B0B0B] whitespace-pre-line leading-relaxed">
                      {plant.pharmacology.phytochemical_profile || 'Composés phénoliques, flavonoïdes, tanins et huiles volatiles répertoriés.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Experimental (Freemium Gate) */}
          {activeTab === 'experimental' && (
            <div className="space-y-5">
              {!hasResearchAccess ? (
                <div className="bg-linear-to-b from-white to-[#F4EFE7] p-8 rounded-3xl border border-[#CD9850] text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#CD9850]/20 flex items-center justify-center text-[#CD9850]">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#0B0B0B]">
                      Données Expérimentales & Essais Cliniques
                    </h4>
                    <p className="text-sm text-[#575D5A] max-w-lg mx-auto mt-2">
                      Accédez aux résultats d'essais in vitro, in vivo sur modèles animaux, concentrations pharmacologiques actives et essais cliniques récents.
                    </p>
                  </div>

                  <button
                    onClick={onUpgradeToPremium}
                    className="px-6 py-2.5 rounded-xl bg-[#CD9850] hover:bg-[#A87635] text-[#0B0B0B] font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {t.unlockBtn}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE]">
                    <h4 className="text-xs font-bold text-[#426B5F] uppercase tracking-wider mb-2">
                      Données Expérimentales (In Vitro & In Vivo)
                    </h4>
                    <p className="text-sm sm:text-base text-[#0B0B0B] whitespace-pre-line leading-relaxed">
                      {plant.scientific_data.experimental || 'Données expérimentales en cours d’indexation dans la base.'}
                    </p>
                  </div>

                  {plant.scientific_data.clinical && (
                    <div className="bg-[#EBF2F0] p-5 rounded-2xl border border-[#426B5F]/20">
                      <h4 className="text-xs font-bold text-[#426B5F] uppercase tracking-wider mb-2">
                        Données et Essais Cliniques
                      </h4>
                      <p className="text-sm sm:text-base text-[#0B0B0B] whitespace-pre-line leading-relaxed">
                        {plant.scientific_data.clinical}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: References */}
          {activeTab === 'references' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#575D5A] uppercase tracking-wider mb-2">
                Articles & Publications Scientifiques de Référence
              </h4>
              <div className="bg-white p-5 rounded-2xl border border-[#E1D3BE] text-xs sm:text-sm text-[#575D5A] leading-relaxed whitespace-pre-line font-mono">
                {plant.references || 'Monographies et études issues des flores et revues d’ethnopharmacologie algériennes et maghrébines (Quézel & Santa, Ozenda, EMA, revues internationales).'}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F5F3F3] border-t border-[#E1D3BE] flex items-center justify-between">
          <div className="text-xs text-[#575D5A]">
            {t.officialSource}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#CD9850] bg-white hover:bg-[#CD9850]/10 text-xs font-bold text-[#0B0B0B] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title={currentLang === 'ar' ? 'توليد وطباعة وثيقة PDF في تبويب جديد' : 'Générer et ouvrir le PDF complet dans un nouvel onglet'}
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-[#426B5F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-[#426B5F]" />
              )}
              <span>
                {isExportingPdf 
                  ? (currentLang === 'ar' ? 'جاري تحضير PDF...' : 'Préparation du PDF...') 
                  : (currentLang === 'ar' ? 'طباعة / تصدير PDF' : currentLang === 'en' ? 'Print / Export PDF' : 'Imprimer / Exporter PDF')}
              </span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#426B5F] text-white text-xs font-bold hover:bg-[#2D4A41] cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
