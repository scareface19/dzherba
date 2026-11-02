import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Language } from '../types';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  currentLang?: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
  currentLang = 'fr',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const defaultConfirm = confirmText || (currentLang === 'ar' ? 'تأكيد الحذف' : 'Confirmer la suppression');
  const defaultCancel = cancelText || (currentLang === 'ar' ? 'إلغاء' : 'Annuler');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E1D3BE] p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 end-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0B0B0B] leading-tight">
              {title}
            </h3>
            <p className="text-xs text-[#575D5A] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1D3BE]/60">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#E1D3BE] text-xs font-bold text-[#575D5A] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {defaultCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                : 'bg-[#426B5F] hover:bg-[#2D4A41] shadow-[#426B5F]/20'
            }`}
          >
            {defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};
