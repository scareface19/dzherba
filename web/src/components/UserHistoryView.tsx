import React, { useState, useEffect } from 'react';
import type { User, UserHistoryItem, Language } from '../types';
import { api } from '../services/api';
import { 
  History, Search, Eye, Camera, Bot, 
  Trash2, ArrowRight, ExternalLink, RefreshCw, 
  Clock 
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface UserHistoryViewProps {
  currentUser: User | null;
  onSelectPlant: (plantId: number) => void;
  onApplySearchQuery: (query: string) => void;
  currentLang?: Language;
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  currentUser,
  onSelectPlant,
  onApplySearchQuery,
  currentLang = 'fr',
}) => {
  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const userId = currentUser ? currentUser.id : 'USR-ADMIN';

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await api.getHistory(userId, filterType === 'all' ? undefined : filterType);
      setHistoryItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId, filterType]);

  const handleClearHistory = () => {
    setIsConfirmClearOpen(true);
  };

  const executeClearHistory = async () => {
    await api.clearHistory(userId);
    setHistoryItems([]);
    setIsConfirmClearOpen(false);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'search':
        return <Search className="w-4 h-4 text-sky-600" />;
      case 'view':
        return <Eye className="w-4 h-4 text-emerald-600" />;
      case 'scan':
        return <Camera className="w-4 h-4 text-amber-600" />;
      case 'assistant':
        return <Bot className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeBadgeLabel = (type: string) => {
    switch (type) {
      case 'search':
        return currentLang === 'ar' ? 'بحث في الفهرس' : 'Recherche';
      case 'view':
        return currentLang === 'ar' ? 'معاينة نبتة' : 'Consultation';
      case 'scan':
        return currentLang === 'ar' ? 'تعرف بالصورة' : 'Scan IA';
      case 'assistant':
        return currentLang === 'ar' ? 'محادثة المساعد' : 'Assistant IA';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E1D3BE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#426B5F]/10 text-[#426B5F] text-xs font-bold border border-[#426B5F]/20">
            <History className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'سجل النشاط والاستخدام' : 'Historique d’Activité'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B0B0B]">
            {currentLang === 'ar' ? 'سجل عمليات البحث والمعاينات' : 'Historique Personnel & Recherches'}
          </h1>
          <p className="text-xs sm:text-sm text-[#575D5A]">
            {currentLang === 'ar'
              ? 'تتبع كامل لعمليات البحث، والأنواع النباتية التي تمت معاينتها، والفحوصات بالذكاء الاصطناعي في حسابك الشخصي.'
              : 'Retrouvez toutes vos recherches de plantes, fiches consultées, scans photos IA et questions posées en direct.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{currentLang === 'ar' ? 'مزامنة مباشرة' : 'Synchronisé en direct'}</span>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'مسح السجل' : 'Effacer l’historique'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterType === 'all'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          {currentLang === 'ar' ? 'الكل' : 'Tous les événements'}
        </button>
        <button
          onClick={() => setFilterType('search')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterType === 'search'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>{currentLang === 'ar' ? 'البحث' : 'Recherches'}</span>
        </button>
        <button
          onClick={() => setFilterType('view')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterType === 'view'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{currentLang === 'ar' ? 'المعاينات' : 'Fiches Consultées'}</span>
        </button>
        <button
          onClick={() => setFilterType('scan')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterType === 'scan'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{currentLang === 'ar' ? 'فحص الصور' : 'Scans IA'}</span>
        </button>
        <button
          onClick={() => setFilterType('assistant')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterType === 'assistant'
              ? 'bg-[#426B5F] text-white shadow-xs'
              : 'bg-white text-[#575D5A] border border-[#E1D3BE] hover:bg-gray-50'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{currentLang === 'ar' ? 'أسئلة المساعد' : 'Assistant LLM'}</span>
        </button>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#575D5A] bg-white rounded-3xl border border-[#E1D3BE]">
          <RefreshCw className="w-6 h-6 text-[#426B5F] animate-spin mx-auto mb-2" />
          <span>{currentLang === 'ar' ? 'جارٍ تحميل السجل...' : 'Chargement de l’historique...'}</span>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#E1D3BE] space-y-2">
          <Clock className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="font-bold text-sm text-[#0B0B0B]">
            {currentLang === 'ar' ? 'لا يوجد أي نشاط مسجل في هذا القسم حتى الآن.' : 'Aucun événement enregistré dans cette catégorie.'}
          </h4>
          <p className="text-xs text-[#575D5A]">
            {currentLang === 'ar' ? 'عند قيامك بالبحث أو تصفح النباتات، ستظهر تفاصيل نشاطك هنا تلقائياً.' : 'Vos actions sur le catalogue, la carte et l’IA s’afficheront automatiquement ici.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E1D3BE] divide-y divide-[#E1D3BE]/60 overflow-hidden shadow-xs">
          {historyItems.map((item) => (
            <div 
              key={item.id}
              className="p-4 sm:p-5 hover:bg-[#F5F3F3]/50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getIconForType(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[#575D5A] text-[10px] font-bold uppercase tracking-wider">
                      {getTypeBadgeLabel(item.type)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0B0B0B]">
                    {item.title}
                  </h4>
                  {item.query_text && (
                    <p className="text-xs text-[#575D5A] mt-0.5 font-mono">
                      Terme : <span className="font-semibold text-[#426B5F]">"{item.query_text}"</span>
                    </p>
                  )}
                  {item.scientific_name && (
                    <p className="text-xs text-[#575D5A] mt-0.5 italic font-serif">
                      Espèce liée : {item.scientific_name} {item.vernacular_raw && `(${item.vernacular_raw})`}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {item.plant_id ? (
                  <button
                    onClick={() => onSelectPlant(item.plant_id!)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#426B5F]/10 hover:bg-[#426B5F] text-[#426B5F] hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{currentLang === 'ar' ? 'عرض النبتة' : 'Voir'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : item.query_text ? (
                  <button
                    onClick={() => onApplySearchQuery(item.query_text!)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#CD9850]/15 hover:bg-[#CD9850] text-[#0B0B0B] text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{currentLang === 'ar' ? 'إعادة البحث' : 'Relancer'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal (No browser confirm alert) */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title={currentLang === 'ar' ? 'مسح سجل النشاط' : "Effacer l'historique"}
        message={
          currentLang === 'ar'
            ? 'هل أنت متأكد من رغبتك في حذف سجل النشاط بالكامل من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Voulez-vous vraiment effacer tout votre historique de navigation et recherche de la base de données ? Cette action est irréversible.'
        }
        confirmText={currentLang === 'ar' ? 'نعم، حذف السجل' : 'Oui, effacer'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
        isDanger={true}
        currentLang={currentLang}
        onConfirm={executeClearHistory}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
