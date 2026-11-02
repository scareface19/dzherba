import React, { useState, useEffect, useRef } from 'react';
import type { Plant, Language } from '../types';
import { MapPin, Search, Calendar, ChevronRight, Sparkles, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { translations } from '../i18n';
import L from 'leaflet';

interface AlgeriaMapProps {
  plants: Plant[];
  onOpenPlantModal: (plant: Plant) => void;
  currentLang?: Language;
}

interface RegionData {
  id: string;
  name: string;
  arabicName: string;
  zone: 'tell' | 'plateaux' | 'sahara';
  lat: number;
  lng: number;
  description: string;
}

const DZ_REGIONS: RegionData[] = [
  // Tell & Littoral
  { id: 'Alger', name: 'Alger & Mitidja', arabicName: 'الجزائر والمتيجة', zone: 'tell', lat: 36.7538, lng: 3.0588, description: 'Plaine côtière fertile, climat méditerranéen subhumide.' },
  { id: 'Tizi Ouzou', name: 'Grande Kabylie (Djurdjura)', arabicName: 'تيزي وزو والقبائل الكبرى', zone: 'tell', lat: 36.7118, lng: 4.0459, description: 'Reliefs montagneux humides et forêts de chênes et cèdres.' },
  { id: 'Béjaïa', name: 'Béjaïa & Babors', arabicName: 'بجاية وجبال البابور', zone: 'tell', lat: 36.7559, lng: 5.0843, description: 'Forêts denses, ravins humides et biodiversité remarquable.' },
  { id: 'Oran', name: 'Oranie & Dahra', arabicName: 'وهران والساحل الغربي', zone: 'tell', lat: 35.6987, lng: -0.6349, description: 'Matorrals côtiers, garrigues et collines calcaires.' },
  { id: 'Annaba', name: 'Annaba & El Tarf', arabicName: 'عنابة والقالة', zone: 'tell', lat: 36.9000, lng: 7.7667, description: 'Zones humides côtières, Parc National d’El Kala, forêts de chêne-liège.' },
  { id: 'Jijel', name: 'Jijel (Corniche kabyle)', arabicName: 'جيجل', zone: 'tell', lat: 36.8206, lng: 5.7667, description: 'Corniche rocheuse boisée et microclimat très pluvieux.' },
  { id: 'Tlemcen', name: 'Monts de Tlemcen', arabicName: 'تلمسان', zone: 'tell', lat: 34.8783, lng: -1.3150, description: 'Montagnes calcaires, sources et riche tradition de pharmacopée andalouse.' },
  { id: 'Blida', name: 'Atlas Blidéen (Chréa)', arabicName: 'البليدة والأطلس البليدي', zone: 'tell', lat: 36.4700, lng: 2.8300, description: 'Forêts de cèdres, ravins humides et coteaux frais.' },
  { id: 'Médéa', name: 'Médéa & Titteri', arabicName: 'المدية والتيطري', zone: 'tell', lat: 36.2642, lng: 2.7539, description: 'Collines agricoles et forêts méditerranéennes intérieures.' },
  { id: 'Constantine', name: 'Constantine & Guelma', arabicName: 'قسنطينة وقالمة', zone: 'tell', lat: 36.3650, lng: 6.6147, description: 'Gorges rocheuses, plateaux fertiles et vallées thermales.' },

  // Hauts Plateaux & Atlas Saharien
  { id: 'Sétif', name: 'Hauts Plateaux de Sétif', arabicName: 'سطيف والهضاب العليا', zone: 'plateaux', lat: 36.1911, lng: 5.4137, description: 'Climat continental semi-aride, steppes et céréaliculture.' },
  { id: 'Batna', name: 'Aurès & Monts du Belezma', arabicName: 'باتنة والأوراس', zone: 'plateaux', lat: 35.5559, lng: 6.1741, description: 'Massif montagneux imposant, forêts de cèdres et remèdes traditionnels chaouis.' },
  { id: 'Tiaret', name: 'Sersou & Tiaret', arabicName: 'تيارت والسر سو', zone: 'plateaux', lat: 35.3710, lng: 1.3170, description: 'Vastes plaines steppiques et transition vers le semi-aride.' },
  { id: 'Djelfa', name: 'Ouled Naïl (Djelfa)', arabicName: 'الجلفة وأولاد نايل', zone: 'plateaux', lat: 34.6728, lng: 3.2630, description: 'Zone steppique à armoise blanche (Chih), alfa et sparte.' },
  { id: 'Tébessa', name: 'Tébessa (Confins orientaux)', arabicName: 'تبسة', zone: 'plateaux', lat: 35.4042, lng: 8.1242, description: 'Hauts plateaux orientaux et maquis pré-sahariens.' },

  // Sahara & Oasis
  { id: 'Biskra', name: 'Porte du Sahara (Biskra & Zibans)', arabicName: 'بسكرة والزيبان', zone: 'sahara', lat: 34.8504, lng: 5.7281, description: 'Palmeraies renommées, oueds et pharmacopée saharienne millénaire.' },
  { id: 'Ghardaïa', name: 'M’Zab & Ghardaïa', arabicName: 'غرداية ووادي ميزاب', zone: 'sahara', lat: 32.4909, lng: 3.6735, description: 'Plateau désertique de la Chebka, oasis traditionnelles préservées.' },
  { id: 'Ouargla', name: 'Bas-Sahara (Ouargla & Oued Righ)', arabicName: 'ورقلة ووادي ريغ', zone: 'sahara', lat: 31.9493, lng: 5.3250, description: 'Chotts, ergs sahariens et palmeraies.' },
  { id: 'Béchar', name: 'Saoura & Béchar', arabicName: 'بشار والساورة', zone: 'sahara', lat: 31.6167, lng: -2.2167, description: 'Vallée de la Saoura, ergs occidentaux et oueds temporaires.' },
  { id: 'Tamanrasset', name: 'Hoggar & Grand Sud', arabicName: 'تمنراست والهقار', zone: 'sahara', lat: 22.7850, lng: 5.5228, description: 'Montagnes volcaniques du Hoggar, microclimats d’altitude et plantes endémiques.' },
  { id: 'Djanet', name: 'Tassili n’Ajjer', arabicName: 'جانت والطاسيلي', zone: 'sahara', lat: 24.5534, lng: 9.4853, description: 'Plateaux gréseux sahariens, cyprès du Tassili et flore relictuelle.' },
  { id: 'Adrar', name: 'Gourara & Touat', arabicName: 'أدرار وقورارة', zone: 'sahara', lat: 27.8743, lng: -0.2939, description: 'Système des foggaras, ksours et flore médicinale hyper-aride.' }
];

export const AlgeriaMap: React.FC<AlgeriaMapProps> = ({ plants, onOpenPlantModal, currentLang = 'fr' }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionData>(DZ_REGIONS[0]);
  const [zoneFilter, setZoneFilter] = useState<'all' | 'tell' | 'plateaux' | 'sahara'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const t = translations[currentLang].map;

  // Filtered plants for the active selected region
  const matchingPlants = plants.filter((p) => {
    const rawDistrib = (p.distribution.habitat_description + ' ' + (p.distribution.regions || []).join(' ')).toLowerCase();
    const regKeyword = selectedRegion.id.toLowerCase();
    const isMatched = rawDistrib.includes(regKeyword) || (p.distribution.regions || []).some(r => r.toLowerCase().includes(regKeyword));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.scientific_name.toLowerCase().includes(q) || (p.vernacular_raw || '').toLowerCase().includes(q);
      return isMatched && nameMatch;
    }
    return isMatched;
  });

  const filteredRegions = DZ_REGIONS.filter(
    (r) => zoneFilter === 'all' || r.zone === zoneFilter
  );

  // Initialize Real Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent duplicate init

    const map = L.map(mapContainerRef.current, {
      center: [28.0339, 2.6596],
      zoom: 5,
      minZoom: 4,
      maxZoom: 12,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    // Add crisp OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | DzHerba Flora DZ',
      maxZoom: 18,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Leaflet Markers whenever filteredRegions or selectedRegion changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredRegions.forEach((reg) => {
      const isSelected = selectedRegion.id === reg.id;
      const count = plants.filter((p) => {
        const txt = (p.distribution.habitat_description + ' ' + (p.distribution.regions || []).join(' ')).toLowerCase();
        return txt.includes(reg.id.toLowerCase());
      }).length;

      const bgColor = isSelected ? '#CD9850' : reg.zone === 'sahara' ? '#A87635' : reg.zone === 'plateaux' ? '#5A8C7E' : '#426B5F';
      const labelText = currentLang === 'ar' ? reg.arabicName.split(' ')[0] : reg.name.split(' ')[0];

      const html = `
        <div style="position: relative; display: flex; align-items: center; cursor: pointer;">
          <div style="
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            border-radius: 50%;
            background: ${bgColor};
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            transition: transform 0.2s;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          ">
            <span>${count}</span>
          </div>
          <div style="
            margin-left: 6px;
            padding: 2px 6px;
            background: rgba(11, 11, 11, 0.85);
            color: #ffffff;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            pointer-events: none;
          ">
            ${labelText}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'dz-custom-marker',
        html: html,
        iconSize: [120, 30],
        iconAnchor: [12, 15]
      });

      const marker = L.marker([reg.lat, reg.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedRegion(reg);
        map.flyTo([reg.lat, reg.lng], 7, { duration: 1.2 });
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 180px;">
          <b style="color: #426B5F; font-size: 14px;">${currentLang === 'ar' ? reg.arabicName : reg.name}</b>
          <div style="color: #CD9850; font-weight: bold; margin: 4px 0;">${count} espèces inventoriées</div>
          <p style="color: #555; margin: 0;">${reg.description}</p>
        </div>
      `);

      markersGroup.addLayer(marker);
    });
  }, [filteredRegions, selectedRegion, plants, currentLang]);

  const handleSelectRegionFromList = (reg: RegionData) => {
    setSelectedRegion(reg);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([reg.lat, reg.lng], 7, { duration: 1.2 });
    }
  };

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([28.0339, 2.6596], 5, { duration: 1.2 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CD9850]/15 text-[#0B0B0B] text-xs font-bold border border-[#CD9850]/30">
          <MapPin className="w-3.5 h-3.5 text-[#CD9850]" />
          {t.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B0B0B] tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-[#575D5A]">
          {t.subtitle}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setZoneFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            zoneFilter === 'all'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          {t.allRegions} ({DZ_REGIONS.length})
        </button>
        <button
          onClick={() => setZoneFilter('tell')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            zoneFilter === 'tell'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          {t.tell}
        </button>
        <button
          onClick={() => setZoneFilter('plateaux')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            zoneFilter === 'plateaux'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          {t.plateaux}
        </button>
        <button
          onClick={() => setZoneFilter('sahara')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            zoneFilter === 'sahara'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-[#E1D3BE]/30'
          }`}
        >
          {t.sahara}
        </button>
      </div>

      {/* Main Grid: Real Leaflet Map + Results list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Real Geographic Leaflet Map */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E1D3BE] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1D3BE]/60 pb-3">
            <div>
              <h3 className="font-bold text-base text-[#0B0B0B] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#426B5F]" />
                {currentLang === 'ar' ? 'الخريطة الجغرافية الحقيقية للجزائر (GPS OpenStreetMap)' : 'Carte Géographique Réelle d’Algérie'}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {t.clickMarker}
              </p>
            </div>
            <button
              onClick={handleResetMap}
              className="text-xs px-2.5 py-1 rounded-full bg-[#426B5F]/10 hover:bg-[#426B5F]/20 text-[#426B5F] font-semibold transition-colors cursor-pointer"
              title="Recentrer sur l'Algérie"
            >
              Recentrer 🇩🇿
            </button>
          </div>

          {/* Leaflet container */}
          <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-[#E1D3BE] shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Quick Map Controls Overlay */}
            <div className="absolute top-3 end-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl border border-[#E1D3BE] shadow-md">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#0B0B0B] transition-colors"
                title="Zoom Avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#0B0B0B] transition-colors"
                title="Zoom Arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Region info bar */}
          <div className="bg-[#F5F3F3] p-4 rounded-2xl border border-[#E1D3BE] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#CD9850] tracking-wider block">
                {t.selectedRegion}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h4 className="font-extrabold text-sm sm:text-base text-[#0B0B0B]">
                  {currentLang === 'ar' ? selectedRegion.arabicName : selectedRegion.name}
                </h4>
                <span className="text-xs font-cairo text-[#426B5F] font-bold">
                  ({currentLang === 'ar' ? selectedRegion.name : selectedRegion.arabicName})
                </span>
              </div>
              <p className="text-xs text-[#575D5A] mt-1 italic">
                {selectedRegion.description}
              </p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-[#426B5F] text-white font-bold whitespace-nowrap shadow-xs">
              {matchingPlants.length} {t.taxaCount}
            </span>
          </div>

          {/* Quick Region Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-bold text-[#575D5A] uppercase tracking-wider me-1">
              {currentLang === 'ar' ? 'المناطق:' : 'Wilayas:'}
            </span>
            {filteredRegions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => handleSelectRegionFromList(reg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedRegion.id === reg.id
                    ? 'bg-[#CD9850] text-[#0B0B0B] font-bold shadow-xs'
                    : 'bg-gray-100 text-[#0B0B0B] hover:bg-gray-200'
                }`}
              >
                {currentLang === 'ar' ? reg.arabicName.split(' ')[0] : reg.id}
              </button>
            ))}
          </div>
        </div>

        {/* Plants List for Selected Region */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E1D3BE] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1D3BE]/60 pb-3">
            <div>
              <h3 className="font-bold text-base text-[#0B0B0B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#CD9850]" />
                {t.speciesInArea} {currentLang === 'ar' ? selectedRegion.arabicName : selectedRegion.name}
              </h3>
              <p className="text-xs text-[#575D5A]">
                {matchingPlants.length} {t.taxaCount}
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#575D5A]" />
              <input
                type="text"
                placeholder={t.searchInRegion}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F] w-full sm:w-48 bg-[#F5F3F3]"
              />
            </div>
          </div>

          {/* Matching plants list */}
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {matchingPlants.length === 0 ? (
              <div className="text-center py-12 text-[#575D5A] space-y-2">
                <p className="text-sm font-semibold">{t.noPlantsInFilter}</p>
              </div>
            ) : (
              matchingPlants.map((plant) => (
                <div
                  key={plant.id}
                  onClick={() => onOpenPlantModal(plant)}
                  className="group p-3.5 rounded-2xl border border-[#E1D3BE]/80 hover:border-[#426B5F] hover:bg-[#F5F3F3]/50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {plant.images && plant.images.length > 0 && (
                      <img
                        src={plant.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E1D3BE] group-hover:scale-105 transition-transform"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-[#426B5F]/10 text-[#426B5F]">
                          {plant.taxonomy.family || 'Botanique'}
                        </span>
                        <h4 className="font-serif italic font-bold text-sm text-[#0B0B0B] group-hover:text-[#426B5F] transition-colors">
                          {plant.scientific_name}
                        </h4>
                      </div>

                      {plant.vernacular_raw && (
                        <p className="text-xs font-cairo font-bold text-[#CD9850]">
                          {plant.vernacular_raw}
                        </p>
                      )}

                      <p className="text-xs text-[#575D5A] line-clamp-1">
                        {plant.traditional_medicine.uses || plant.distribution.habitat_description}
                      </p>

                      {plant.distribution.flowering_harvesting && (
                        <div className="flex items-center gap-1 text-[11px] text-[#426B5F] font-medium pt-0.5">
                          <Calendar className="w-3 h-3 text-[#CD9850]" />
                          <span className="line-clamp-1">{plant.distribution.flowering_harvesting}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 p-2 rounded-xl bg-[#EBF2F0] text-[#426B5F] group-hover:bg-[#426B5F] group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
