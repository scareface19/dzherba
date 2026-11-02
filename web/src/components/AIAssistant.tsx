import React, { useState, useEffect } from 'react';
import type { Plant, Language } from '../types';
import { Bot, Send, Sparkles, User, AlertTriangle, ChevronRight } from 'lucide-react';
import { translations } from '../i18n';
import { api } from '../services/api';

interface AIAssistantProps {
  plants: Plant[];
  onOpenPlantModal: (plant: Plant) => void;
  currentLang?: Language;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedPlants?: Plant[];
  warning?: string;
  timestamp: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ plants, onOpenPlantModal, currentLang = 'fr' }) => {
  const t = translations[currentLang].assistant;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: t.welcome,
      timestamp: 'DzHerba IA',
    },
  ]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: translations[currentLang].assistant.welcome,
        timestamp: 'DzHerba IA',
      },
    ]);
  }, [currentLang]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleQuestions = currentLang === 'ar' ? [
    "ما هي فوائد واستعمالات نبتة الشيح (Artemisia herba-alba)؟",
    "ما هي الأعشاب الموثقة علمياً للمساعدة في خفض السكر؟",
    "ما هي محاذير وتفاعلات الثوم (Allium sativum) الطبية؟",
    "ما هي النباتات الطبية المتواجدة في الأوراس وجبال جرجرة؟",
  ] : currentLang === 'en' ? [
    "What are the pharmacological uses of Artemisia herba-alba?",
    "Which Algerian plants have scientifically proven antidiabetic activity?",
    "What are the contraindications of Allium sativum (garlic)?",
    "Which medicinal species grow in the Aurès and Kabylie mountains?",
  ] : [
    "Quelles plantes algériennes sont documentées pour le diabète ?",
    "Quelles sont les contre-indications d'Allium sativum (l'ail) ?",
    "Quels sont les bienfaits et usages de l'Artemisia herba-alba (Chih) ?",
    "Quelles plantes poussent dans les Aurès et la Kabylie ?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Query the real Botanical LLM engine grounded on 773 Algerian species
      const res = await api.askBotanicalAssistant(query);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.response,
        matchedPlants: res.plants && res.plants.length > 0 ? res.plants : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Record history in MySQL
      await api.recordHistory({
        userId: 'USR-CIT-03',
        type: 'assistant',
        title: `Question IA: ${query.slice(0, 40)}...`,
        queryText: query,
        plantId: res.plants?.[0]?.id || null,
        metadata: { matchedSpecies: res.plants?.length || 0 }
      });
    } catch (err: any) {
      console.warn("LLM API fallback to fast keyword search:", err);
      const q = query.toLowerCase();
      const matched = plants.filter((p) => {
        const full = (p.scientific_name + ' ' + (p.vernacular_raw || '') + ' ' + (p.traditional_medicine.uses || '')).toLowerCase();
        return q.split(' ').some(word => word.length > 3 && full.includes(word));
      }).slice(0, 3);

      const reply = currentLang === 'ar'
        ? `بناءً على سجلات الفلورا الجزائرية (DzHerba)، تم العثور على معلومات تخص استفسارك:\n\n` +
          matched.map(p => `• **${p.scientific_name}** (${p.vernacular_raw || 'نبتة طبية'}): ${p.traditional_medicine.uses.slice(0, 150)}...`).join('\n\n')
        : `D'après les archives de flore algérienne DzHerba :\n\n` +
          matched.map(p => `• **${p.scientific_name}** (${p.vernacular_raw || 'Plante locale'}) : ${p.traditional_medicine.uses.slice(0, 150)}...`).join('\n\n');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          matchedPlants: matched.length > 0 ? matched : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CD9850]/20 text-[#0B0B0B] text-xs font-bold border border-[#CD9850]/40">
          <Sparkles className="w-3.5 h-3.5 text-[#CD9850]" />
          {t.badge}
        </span>
        <h1 className="text-3xl font-extrabold text-[#0B0B0B] tracking-tight">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#575D5A]">
          {t.subtitle}
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-[#E1D3BE] shadow-xs flex flex-col h-[600px] overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-[#CD9850] text-[#0B0B0B]'
                    : 'bg-[#426B5F] text-white'
                }`}
              >
                {m.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-[#CD9850]" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#426B5F] text-white rounded-tr-none'
                    : 'bg-[#F5F3F3] text-[#0B0B0B] border border-[#E1D3BE] rounded-tl-none space-y-3'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Safety warning if applicable */}
                {m.warning && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{m.warning}</span>
                  </div>
                )}

                {/* Matched Plants quick links */}
                {m.matchedPlants && m.matchedPlants.length > 0 && (
                  <div className="pt-2 border-t border-[#E1D3BE]/80 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#575D5A] block">
                      {t.relatedPlants}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.matchedPlants.map((plant) => (
                        <button
                          key={plant.id}
                          onClick={() => onOpenPlantModal(plant)}
                          className="p-2.5 rounded-xl bg-white border border-[#E1D3BE] hover:border-[#426B5F] text-left flex items-center justify-between text-xs transition-all shadow-xs cursor-pointer group"
                        >
                          <div>
                            <span className="font-serif italic font-bold text-[#0B0B0B] block">
                              {plant.scientific_name}
                            </span>
                            {plant.vernacular_raw && (
                              <span className="font-cairo text-[11px] font-bold text-[#CD9850]">
                                {plant.vernacular_raw}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#426B5F] group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] text-right ${
                    m.sender === 'user' ? 'text-white/70' : 'text-[#575D5A]'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#426B5F] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#CD9850]" />
              </div>
              <div className="bg-[#F5F3F3] p-4 rounded-2xl border border-[#E1D3BE] rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#426B5F] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#426B5F] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#426B5F] animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-[#575D5A] ml-2">{t.searching}</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 bg-[#F4EFE7]/60 border-t border-[#E1D3BE] overflow-x-auto flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#575D5A] whitespace-nowrap pl-2">
            {t.examples}
          </span>
          {sampleQuestions.map((sq) => (
            <button
              key={sq}
              onClick={() => handleSendMessage(sq)}
              className="px-3 py-1 rounded-xl bg-white border border-[#E1D3BE] hover:border-[#426B5F] text-[11px] text-[#0B0B0B] whitespace-nowrap transition-all shadow-xs cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E1D3BE]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={t.promptPlaceholder}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#F5F3F3] border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F] text-sm text-[#0B0B0B]"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="p-3 rounded-2xl bg-[#426B5F] hover:bg-[#2D4A41] disabled:opacity-50 text-white transition-all shadow-md cursor-pointer shrink-0"
            >
              <Send className="w-5 h-5 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
