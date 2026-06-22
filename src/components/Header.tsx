/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Sparkles } from 'lucide-react';
import portalLogo from '../assets/images/selftrack_logo_portal_1782058987413.jpg';

interface HeaderProps {
  onExportIcal?: () => void;
  onOpenSettings?: () => void;
  userName?: string;
  userEmail?: string;
  appMode?: 'demo' | 'personal';
  onStartPersonalMode?: () => void;
  isPremium?: boolean;
  onOpenPremium?: () => void;
}

export default function Header({ 
  onExportIcal, 
  onOpenSettings, 
  userName = 'Профиль', 
  userEmail = '',
  appMode = 'demo',
  onStartPersonalMode,
  isPremium = false,
  onOpenPremium
}: HeaderProps) {
  // Get initials for profile badge
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'ST';
  };

  return (
    <header className="bg-white dark:bg-[#1c1a18] border-b border-amber-950/10 dark:border-stone-850 px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between shrink-0 font-sans transition-colors duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-950/10 shadow-sm shrink-0 bg-stone-50 select-none">
          <img 
            src={portalLogo} 
            alt="SelfTrack Portal Logo" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-sm font-black text-slate-800 dark:text-[#eceae6] leading-tight">SelfTrack {isPremium ? 'PREMIUM' : 'PRO'}</h1>
            {isPremium && (
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm uppercase tracking-widest leading-none">
                PRO
              </span>
            )}
            <span className="bg-emerald-50 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-200/40 uppercase tracking-wider">
              My Journal
            </span>
          </div>
          <div className="text-[9px] tracking-widest uppercase text-stone-400 font-bold block text-left">
            universal life organizer
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2.5">
        {!isPremium && onOpenPremium && (
          <button
            onClick={onOpenPremium}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] uppercase font-black tracking-wide text-amber-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-500 hover:to-amber-400 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow shrink-0 border border-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
            <span>Подключить PRO</span>
          </button>
        )}

        {onExportIcal && (
          <button
            onClick={onExportIcal}
            title={isPremium ? "Экспорт iCal (.ics)" : "Требуется подписка PRO"}
            className={`p-2 rounded-lg border border-stone-200/40 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold mr-1 ${
              isPremium 
                ? 'hover:bg-stone-100 text-stone-605 text-stone-600' 
                : 'hover:bg-amber-50/30 text-amber-700/80 border-amber-500/10'
            }`}
          >
            <Download className="w-4 h-4 text-current" />
            <span className="hidden sm:inline">Экспорт .ics</span>
            {!isPremium && <span className="text-[8px] bg-amber-500 text-white rounded px-1 uppercase tracking-widest font-black leading-none py-0.5">PRO</span>}
          </button>
        )}
        <button
          onClick={onOpenSettings}
          title="Открыть Настройки"
          className="flex items-center gap-2.5 hover:opacity-85 active:scale-97 cursor-pointer text-left focus:outline-none transition-all relative border border-transparent p-0.5 rounded-xl"
        >
          <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-950 flex items-center justify-center text-xs font-black shadow-inner ring-2 ring-transparent hover:ring-amber-950/20">
            {getInitials(userName)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs text-slate-800 dark:text-[#eceae6] leading-none font-bold">{userName}</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">{userEmail}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
