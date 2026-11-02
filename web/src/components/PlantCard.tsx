import React, { useState } from 'react';
import type { Plant, Language } from '../types';
import { AlertTriangle, MapPin, Sparkles, ChevronRight, Activity, Leaf, Image as ImageIcon } from 'lucide-react';
import { translations } from '../i18n';

interface PlantCardProps {
  plant: Plant;
  onOpenModal: (plant: Plant) => void;
  currentLang?: Language;
}

export function formatImageUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, '');
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onOpenModal, currentLang = 'fr' }) => {
  const [imgError, setImgError] = useState(false);
  const t = translations[currentLang].card;

  const hasSafetyAlert = Boolean(
    (plant.safety_profile.toxicity && plant.safety_profile.toxicity.length > 15) ||
    (plant.safety_profile.contraindications && plant.safety_profile.contraindications.length > 5) ||
    (plant.safety_profile.drug_interactions && plant.safety_profile.drug_interactions.length > 5)
  );

  const hasPhotos = plant.images && plant.images.length > 0 && !imgError;
  const primaryImgUrl = plant.images && plant.images.length > 0 ? formatImageUrl(plant.images[0]) : '';

  return (
    <div 
      onClick={() => onOpenModal(plant)}
      className="group bg-white rounded-2xl border border-[#E1D3BE]/70 hover:border-[#426B5F] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative"
    >
      {/* Top Banner accent */}
      <div className="h-2 w-full bg-linear-to-r from-[#426B5F] via-[#5A8C7E] to-[#CD9850] opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Real Plant Image Thumbnail if available */}
      {hasPhotos ? (
        <div className="relative w-full h-44 overflow-hidden bg-[#EBF2F0]">
          <img
            src={primaryImgUrl}
            alt={plant.scientific_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {(plant.images?.length || 0) > 1 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium tracking-wide">
              +{(plant.images?.length || 1) - 1} photos
            </span>
          )}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#2D4A41]/80 backdrop-blur-xs text-amber-200 text-[10px] font-bold flex items-center gap-1">
            <ImageIcon className="w-2.5 h-2.5" />
            <span>Photo réelle</span>
          </span>
        </div>
      ) : (
        <div className="w-full h-24 bg-linear-to-br from-[#EBF2F0] to-[#F5F3F3] flex items-center justify-between px-5 border-b border-[#E1D3BE]/40 text-[#426B5F]/40 group-hover:text-[#426B5F] transition-colors">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 opacity-70" />
            <span className="text-[11px] font-serif italic text-[#575D5A]">
              {plant.taxonomy.family || 'Spécimen médicinal'}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E1D3BE] text-[#575D5A] font-mono">
            #{plant.id}
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Family badge and ID */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#426B5F]/10 text-[#426B5F] border border-[#426B5F]/20">
            {plant.taxonomy.family || 'Botanique'}
          </span>
          <span className="text-[11px] font-mono text-[#575D5A]/70 font-semibold">
            #{plant.id}
          </span>
        </div>

        {/* Scientific Name */}
        <h3 className="font-serif italic font-bold text-lg text-[#0B0B0B] group-hover:text-[#426B5F] transition-colors leading-snug">
          {plant.scientific_name}
        </h3>

        {/* Vernacular Arabic / Local Name */}
        {plant.vernacular_raw && (
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs text-[#575D5A] font-medium">{t.vernacularLabel}</span>
            <span className="text-base font-cairo font-bold text-[#CD9850]">
              {plant.vernacular_raw}
            </span>
          </div>
        )}

        {/* Traditional Uses Preview */}
        {plant.traditional_medicine.uses && (
          <div className="mt-3 text-xs text-[#575D5A] line-clamp-3 leading-relaxed">
            <span className="font-semibold text-[#0B0B0B]">{t.usesLabel} </span>
            {plant.traditional_medicine.uses.replace(/^Traditional uses:\s*/i, '')}
          </div>
        )}

        {/* Pharmacology preview if available */}
        {plant.pharmacology.activities && (
          <div className="mt-2.5 flex items-start gap-1.5 text-xs text-[#426B5F] bg-[#EBF2F0] p-2 rounded-lg line-clamp-2">
            <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#426B5F]" />
            <span className="line-clamp-2 font-medium">
              {plant.pharmacology.activities.replace(/^Pharmacological activities:\s*/i, '')}
            </span>
          </div>
        )}

        {/* Geographic Wilayas badges */}
        {plant.distribution.regions && plant.distribution.regions.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-[#575D5A] shrink-0" />
            <span className="text-[11px] text-[#575D5A]">
              {plant.distribution.regions.slice(0, 3).join(', ')}
              {plant.distribution.regions.length > 3 && ` +${plant.distribution.regions.length - 3}`}
            </span>
          </div>
        )}

        {/* Safety Alert Flag */}
        {hasSafetyAlert && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t.safetyAlert}</span>
          </div>
        )}
      </div>

      {/* Footer info & CTA */}
      <div className="px-5 py-3 bg-[#F5F3F3]/60 border-t border-[#E1D3BE]/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[#CD9850] font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.scientificMonograph}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-[#426B5F] group-hover:translate-x-0.5 transition-transform">
          <span>{t.consult}</span>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </div>
      </div>
    </div>
  );
};
