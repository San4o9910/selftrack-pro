/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, User, Mail, Check, X, ShieldAlert } from 'lucide-react';

interface ProfileSetupModalProps {
  onClose: () => void;
  onConfirm: (name: string, email: string, keepTemplates: boolean) => void;
  language: string;
}

export default function ProfileSetupModal({ onClose, onConfirm, language }: ProfileSetupModalProps) {
  const isRu = language === 'ru';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [keepTemplates, setKeepTemplates] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(
      name.trim() || (isRu ? 'Мой Профиль' : 'My Profile'),
      email.trim() || 'me@selftrack.org',
      keepTemplates
    );
  };

  return (
    <div className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1816] text-[#221e1a] dark:text-[#f3efe8] border border-amber-950/15 dark:border-stone-800 rounded-3xl p-6 w-full max-w-[450px] shadow-2xl relative flex flex-col justify-between animate-in fade-in zoom-in duration-200 text-left font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-800 dark:text-stone-300 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 border-b border-stone-100 dark:border-stone-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
              {isRu ? 'Начать Личный Журнал' : 'Start Personal Journal'}
            </h3>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 block">
              {isRu ? 'Создание чистого профиля' : 'New tracking baseline'}
            </span>
          </div>
        </div>

        {/* Informational banner warning about database reset */}
        <div className="mb-4 p-3.5 rounded-xl border border-amber-250 bg-amber-50/20 dark:bg-amber-950/10 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-stone-600 dark:text-stone-350 leading-relaxed font-bold">
            {isRu 
              ? 'Внимание! Подтверждение сотрет все готовые примеры (расходы, цели, события в календаре, графики сна и показатели здоровья), чтобы вы могли вносить свои личные данные с чистого листа.'
              : 'Caution! Activating your live profile clears all dummy transactions, sleep hours, weights, task checklists, and target goals to establish a pure empty journal.'
            }
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
              {isRu ? 'Ваше Имя / Псевдоним' : 'Username / Nickname'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder={isRu ? 'Иван С.' : 'John D.'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 focus:border-amber-950 dark:border-stone-800 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-950"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
              {isRu ? 'Контактный Email (локально)' : 'Private Email (offline)'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="email"
                placeholder="me@selftrack.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={40}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 focus:border-amber-950 dark:border-stone-800 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-950"
              />
            </div>
          </div>

          {/* Toggle Keep Habit Templates */}
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="block text-xs font-extrabold text-stone-800 dark:text-stone-200 leading-tight">
                {isRu ? 'Сохранить шаблоны привычек?' : 'Keep habits templates?'}
              </span>
              <span className="block text-[9px] text-stone-400 font-medium mt-0.5 max-w-[280px] leading-snug">
                {isRu 
                  ? 'Сохранит готовые карточки «Зарядка», «Медитация», очистив историю их завершений.'
                  : 'Preserves the habit cards (Exercise, Meditation) but completely wipes out past ticked dates history.'
                }
              </span>
            </div>
            <button
              type="button"
              onClick={() => setKeepTemplates(!keepTemplates)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none relative shrink-0 ${keepTemplates ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-all transform ${keepTemplates ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-extrabold text-xs rounded-xl duration-200 cursor-pointer"
            >
              {isRu ? 'Продолжить демо' : 'Keep Sandbox'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-950 hover:bg-stone-800 text-white font-extrabold text-xs rounded-xl duration-200 cursor-pointer flex items-center gap-1 shadow-md hover:shadow-lg active:scale-97"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isRu ? 'Очистить и Начать' : 'Reset & Start'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
