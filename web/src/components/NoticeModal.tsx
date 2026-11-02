import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { Language } from '../types';

interface NoticeModalProps {
  isOpen: boolean;
  type?: 'success' | 'error' | 'info';
  title: string;
  message: string;
  buttonText?: string;
  currentLang?: Language;
  onClose: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  buttonText,
  currentLang = 'fr',
  onClose,
}) => {
  if (!isOpen) return null;

  const defaultBtn = buttonText || (currentLang === 'ar' ? 'حسناً' : 'D\'accord');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] p-6 space-y-4 animate-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-xs">
          {type === 'success' && (
            <div className="w-full h-full rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}
          {type === 'error' && (
            <div className="w-full h-full rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
          {type === 'info' && (
            <div className="w-full h-full rounded-2xl bg-[#EBF2F0] text-[#426B5F] flex items-center justify-center">
              <Info className="w-8 h-8" />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-base font-extrabold text-[#0B0B0B]">
            {title}
          </h3>
          <p className="text-xs text-[#575D5A] mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#426B5F] hover:bg-[#2D4A41] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            {defaultBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
