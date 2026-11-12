import React, { useState, useEffect, useRef } from 'react';
import type { Plant, Language } from '../types';
import { 
  Bot, Send, Sparkles, User, AlertTriangle, ChevronRight, 
  Settings, Key, Copy, Check, Trash2, ExternalLink, 
  Eye, EyeOff, Cpu, Info, CheckCircle2
} from 'lucide-react';
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
  engine?: string;
}

interface AIConfig {
  provider: 'gemini' | 'groq' | 'openai' | 'local';
  apiKey: string;
  model?: string;
}

const STORAGE_KEY = 'dzherba_ai_config';

export const AIAssistant: React.FC<AIAssistantProps> = ({ plants, onOpenPlantModal, currentLang = 'fr' }) => {
  const t = translations[currentLang].assistant;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI configuration from localStorage
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { provider: 'gemini', apiKey: '', model: 'gemini-1.5-flash' };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Temporary state for the modal form
  const [tempProvider, setTempProvider] = useState<'gemini' | 'groq' | 'openai' | 'local'>(aiConfig.provider);
  const [tempApiKey, setTempApiKey] = useState(aiConfig.apiKey);
  const [tempModel, setTempModel] = useState(aiConfig.model || 'gemini-1.5-flash');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: t.welcome,
      timestamp: 'DzHerba IA',
      engine: 'DzHerba Botanical RAG 2.0'
    },
  ]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            id: 'welcome',
            sender: 'assistant',
            text: translations[currentLang].assistant.welcome,
            timestamp: 'DzHerba IA',
            engine: 'DzHerba Botanical RAG 2.0'
          },
        ];
      }
      return prev;
    });
  }, [currentLang]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleQuestions = currentLang === 'ar' ? [
    "ما هي فوائد واستعمالات نبتة الشيح (Artemisia herba-alba)؟",
    "ما الفرق بين المنقوع والمغلي في تحضير الأعشاب الطبية؟",
    "ما هي الأعشاب الموثقة علمياً للمساعدة في خفض السكر بالجزائر؟",
    "ما هي محاذير وتفاعلات الثوم والحرمل الطبية؟",
    "أعشاب مهدئة لمغص المعدة والقولون من التراث الجزائري"
  ] : currentLang === 'en' ? [
    "What are the pharmacological uses of Artemisia herba-alba (Wormwood)?",
    "What is the difference between an infusion, decoction, and maceration?",
    "Which Algerian plants have scientifically proven antidiabetic activity?",
    "What are the contraindications of Peganum harmala and Ruta chalepensis?",
    "Which soothing medicinal herbs are best for stomach cramps?"
  ] : [
    "Quels sont les bienfaits et posologies de l'Artemisia herba-alba (Chih) ?",
    "Quelle est la différence entre une infusion, une décoction et une macération ?",
    "Quelles plantes algériennes sont documentées pour la régulation du diabète ?",
    "Quelles sont les contre-indications de la rue (Fidjel) et du harmel ?",
    "Quelles plantes locales conseiller pour calmer les spasmes gastriques ?"
  ];

  const handleSaveSettings = () => {
    const updated: AIConfig = {
      provider: tempProvider,
      apiKey: tempApiKey.trim(),
      model: tempModel
    };
    setAiConfig(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setIsSettingsOpen(false);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: translations[currentLang].assistant.welcome,
        timestamp: 'DzHerba IA',
        engine: 'DzHerba Botanical RAG 2.0'
      },
    ]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

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
      // Build conversation history for multi-turn context
      const historyContext = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text
        }));

      // Call RAG 2.0 API with selected provider & API key
      const res = await api.askBotanicalAssistant(query, historyContext, {
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        language: currentLang,
        model: aiConfig.model
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.response,
        matchedPlants: res.plants && res.plants.length > 0 ? res.plants : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: res.engine || (aiConfig.provider === 'gemini' ? 'Gemini 1.5 Flash' : 'DzHerba Expert NLP')
      };

      setMessages((prev) => [...prev, botMsg]);

      // Record query in history
      await api.recordHistory({
        userId: 'USR-CIT-03',
        type: 'assistant',
        title: `Question IA: ${query.slice(0, 40)}...`,
        queryText: query,
        plantId: res.plants?.[0]?.id || null,
        metadata: { matchedSpecies: res.plants?.length || 0, engine: res.engine }
      });
    } catch (err: any) {
      console.warn("LLM API error fallback to local keyword matcher:", err);
      const q = query.toLowerCase();
      const matched = plants.filter((p) => {
        const full = (p.scientific_name + ' ' + (p.vernacular_raw || '') + ' ' + (p.traditional_medicine?.uses || '')).toLowerCase();
        return q.split(' ').some(word => word.length > 3 && full.includes(word));
      }).slice(0, 3);

      const reply = currentLang === 'ar'
        ? `بناءً على الأرشيف النباتي الجزائري (DzHerba)، إليك أهم المعلومات المستخرجة بخصوص استفسارك:\n\n` +
          matched.map(p => `• **${p.scientific_name}** (${p.vernacular_raw || 'نبتة طبية'}): ${(p.traditional_medicine?.uses || '').slice(0, 160)}...`).join('\n\n')
        : `D'après les archives scientifiques de flore algérienne DzHerba :\n\n` +
          matched.map(p => `• **${p.scientific_name}** (${p.vernacular_raw || 'Plante locale'}) : ${(p.traditional_medicine?.uses || '').slice(0, 160)}...`).join('\n\n');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply || "Le service de consultation botanique est actuellement en mode sécurisé hors-ligne.",
          matchedPlants: matched.length > 0 ? matched : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          engine: 'Mode Sécurisé Local'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast settings saved */}
      {configSavedToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#426B5F] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#CD9850]" />
          <span className="text-xs font-bold">
            {currentLang === 'ar' ? 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح' : 'Paramètres IA mis à jour avec succès'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#CD9850]/20 text-[#0B0B0B] text-xs font-bold border border-[#CD9850]/40">
          <Sparkles className="w-3.5 h-3.5 text-[#CD9850]" />
          <span>{t.badge}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#0B0B0B] tracking-tight">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#575D5A]">
          {t.subtitle}
        </p>

        {/* Engine status indicator & Settings trigger */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E1D3BE] text-[11px] text-[#575D5A] shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-[#426B5F]" />
            <span>Moteur :</span>
            <span className="font-bold text-[#0B0B0B]">
              {aiConfig.provider === 'gemini' 
                ? (aiConfig.apiKey ? '🟢 Google Gemini 1.5 Flash' : '⚡ Gemini (Clé Cloud / Serveur)') 
                : aiConfig.provider === 'groq'
                ? '🚀 Groq (Llama 3.3 70B)'
                : aiConfig.provider === 'openai'
                ? '🧠 OpenAI GPT-4o-mini'
                : '🌿 Expert Botanique Local (100% Hors-Ligne)'}
            </span>
          </div>

          <button
            onClick={() => {
              setTempProvider(aiConfig.provider);
              setTempApiKey(aiConfig.apiKey);
              setTempModel(aiConfig.model || 'gemini-1.5-flash');
              setIsSettingsOpen(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#426B5F]/10 hover:bg-[#426B5F]/20 text-[#426B5F] text-[11px] font-bold border border-[#426B5F]/30 transition-all cursor-pointer"
            title="Configurer le LLM et la clé API"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'إعدادات LLM' : 'Paramètres IA'}</span>
          </button>

          {messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-[11px] transition-all cursor-pointer"
              title="Effacer la conversation"
            >
              <Trash2 className="w-3 h-3" />
              <span>{currentLang === 'ar' ? 'مسح' : 'Effacer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-[#E1D3BE] shadow-xs flex flex-col h-[620px] overflow-hidden">
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
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
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
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#426B5F] text-white rounded-tr-none'
                    : 'bg-[#F5F3F3] text-[#0B0B0B] border border-[#E1D3BE] rounded-tl-none space-y-3'
                }`}
              >
                {/* Engine tag if assistant */}
                {m.sender === 'assistant' && m.engine && (
                  <div className="flex items-center justify-between pb-1 border-b border-[#E1D3BE]/60 text-[10px] text-[#575D5A]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#426B5F]">
                      <Sparkles className="w-3 h-3 text-[#CD9850]" />
                      {m.engine}
                    </span>
                    <button
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      className="inline-flex items-center gap-1 hover:text-[#0B0B0B] transition-colors cursor-pointer"
                      title="Copier la réponse"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Message text with formatting */}
                <div className="whitespace-pre-line prose-sm">{m.text}</div>

                {/* Safety warning */}
                {m.warning && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{m.warning}</span>
                  </div>
                )}

                {/* Grounded Matched Plants quick links */}
                {m.matchedPlants && m.matchedPlants.length > 0 && (
                  <div className="pt-2 border-t border-[#E1D3BE]/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#575D5A]">
                        {t.relatedPlants} ({m.matchedPlants.length} espèces)
                      </span>
                      <span className="text-[10px] text-[#426B5F] font-semibold">
                        Base 773 DzHerba
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.matchedPlants.map((plant) => (
                        <button
                          key={plant.id}
                          onClick={() => onOpenPlantModal(plant)}
                          className="p-2.5 rounded-xl bg-white border border-[#E1D3BE] hover:border-[#426B5F] hover:shadow-sm text-left flex items-center justify-between text-xs transition-all shadow-xs cursor-pointer group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-serif italic font-bold text-[#0B0B0B] block truncate">
                              {plant.scientific_name}
                            </span>
                            {plant.vernacular_raw && (
                              <span className="font-cairo text-[11px] font-bold text-[#CD9850] block truncate">
                                {plant.vernacular_raw}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#426B5F] group-hover:translate-x-0.5 transition-transform rtl:rotate-180 shrink-0" />
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
              <div className="w-9 h-9 rounded-2xl bg-[#426B5F] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 text-[#CD9850]" />
              </div>
              <div className="bg-[#F5F3F3] p-4 rounded-2xl border border-[#E1D3BE] rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#426B5F] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#426B5F] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#426B5F] animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-[#575D5A] ml-2">
                  {currentLang === 'ar' 
                    ? 'جاري التحليل واسترجاع المعلومات من السجل النباتي...' 
                    : 'Dr. DzHerba analyse le corpus des 773 plantes...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
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
              className="px-3 py-1 rounded-xl bg-white border border-[#E1D3BE] hover:border-[#426B5F] hover:bg-[#426B5F]/5 text-[11px] text-[#0B0B0B] whitespace-nowrap transition-all shadow-xs cursor-pointer"
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
              title="Envoyer le message"
            >
              <Send className="w-5 h-5 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>

      {/* MODAL PARAMÈTRES IA / LLM CONFIGURATION */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E1D3BE] shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E1D3BE] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#426B5F]/10 flex items-center justify-center text-[#426B5F]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0B0B0B]">
                    {currentLang === 'ar' ? 'إعدادات الذكاء الاصطناعي (LLM)' : 'Configuration LLM & IA'}
                  </h3>
                  <p className="text-xs text-[#575D5A]">
                    {currentLang === 'ar' 
                      ? 'اختر مزود الذكاء الاصطناعي أو أدخل مفتاح API الخاص بك' 
                      : 'Sélectionnez le fournisseur ou activez votre clé API'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Provider Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#0B0B0B] uppercase tracking-wider block">
                {currentLang === 'ar' ? 'مزود الخدمة (LLM Provider)' : 'Fournisseur de Modèle (LLM)'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Google Gemini */}
                <button
                  type="button"
                  onClick={() => {
                    setTempProvider('gemini');
                    setTempModel('gemini-1.5-flash');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tempProvider === 'gemini'
                      ? 'border-[#426B5F] bg-[#426B5F]/10 text-[#0B0B0B]'
                      : 'border-[#E1D3BE] bg-white hover:bg-gray-50 text-[#575D5A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Google Gemini</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Gratuit</span>
                  </div>
                  <span className="text-[10px] text-[#575D5A] mt-1">Gemini 1.5 Flash (Rapide & Arabe d'élite)</span>
                </button>

                {/* Groq Llama 3 */}
                <button
                  type="button"
                  onClick={() => {
                    setTempProvider('groq');
                    setTempModel('llama-3.3-70b-versatile');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tempProvider === 'groq'
                      ? 'border-[#426B5F] bg-[#426B5F]/10 text-[#0B0B0B]'
                      : 'border-[#E1D3BE] bg-white hover:bg-gray-50 text-[#575D5A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Groq</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Ultra-Rapide</span>
                  </div>
                  <span className="text-[10px] text-[#575D5A] mt-1">Llama 3.3 70B (Open-Source d'élite)</span>
                </button>

                {/* OpenAI */}
                <button
                  type="button"
                  onClick={() => {
                    setTempProvider('openai');
                    setTempModel('gpt-4o-mini');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tempProvider === 'openai'
                      ? 'border-[#426B5F] bg-[#426B5F]/10 text-[#0B0B0B]'
                      : 'border-[#E1D3BE] bg-white hover:bg-gray-50 text-[#575D5A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">OpenAI</span>
                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">GPT-4o</span>
                  </div>
                  <span className="text-[10px] text-[#575D5A] mt-1">GPT-4o-mini (Haute précision)</span>
                </button>

                {/* Expert Local */}
                <button
                  type="button"
                  onClick={() => {
                    setTempProvider('local');
                    setTempApiKey('');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tempProvider === 'local'
                      ? 'border-[#426B5F] bg-[#426B5F]/10 text-[#0B0B0B]'
                      : 'border-[#E1D3BE] bg-white hover:bg-gray-50 text-[#575D5A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Mode Local</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">100% Hors-Ligne</span>
                  </div>
                  <span className="text-[10px] text-[#575D5A] mt-1">Moteur NLP autonome (Sans clé API)</span>
                </button>
              </div>
            </div>

            {/* API Key Input (if not local) */}
            {tempProvider !== 'local' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0B0B0B] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#CD9850]" />
                    <span>Clé API {tempProvider.toUpperCase()} (Optionnelle si configurée sur le serveur)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-[#575D5A] hover:text-[#0B0B0B] flex items-center gap-1 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? 'Masquer' : 'Afficher'}</span>
                  </button>
                </div>

                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={
                    tempProvider === 'gemini'
                      ? 'AIzaSy...'
                      : tempProvider === 'groq'
                      ? 'gsk_...'
                      : 'sk-...'
                  }
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F3F3] border border-[#E1D3BE] focus:outline-hidden focus:border-[#426B5F] text-xs font-mono text-[#0B0B0B]"
                />

                {/* Helpful link to get free key */}
                <div className="pt-1">
                  {tempProvider === 'gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#426B5F] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Obtenir une clé Google AI Studio gratuite (15 req/min à vie)</span>
                    </a>
                  )}
                  {tempProvider === 'groq' && (
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#426B5F] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Créer une clé d'accès Groq gratuite (Llama 3 70B)</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Architecture Grounding Note */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Grounded RAG Actif :</strong> Quel que soit le modèle choisi, le prompt système injecte automatiquement les fiches de posologie et de toxicité des <strong>773 espèces médicinales d'Algérie</strong> pour des réponses scientifiquement certifiées.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-[#575D5A] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#426B5F] hover:bg-[#2D4A41] text-white transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer & Activer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
