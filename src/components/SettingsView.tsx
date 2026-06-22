/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  User, Globe, Bell, Scale, RotateCcw, ArrowLeft, Check, Shield, ChevronRight, X, Sparkles, Moon, Sun, Info, Smartphone
} from 'lucide-react';
import { getTranslation } from '../lib/translations';

interface SettingsViewProps {
  onBack: () => void;
  onClearAllData: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  units: {
    weight: 'kg' | 'lbs';
    water: 'ml' | 'oz';
    distance: 'km' | 'miles';
  };
  setUnits: (units: { weight: 'kg' | 'lbs'; water: 'ml' | 'oz'; distance: 'km' | 'miles' }) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onRestartOnboarding?: () => void;
  appMode?: 'demo' | 'personal';
  onChangeAppMode?: (mode: 'demo' | 'personal') => void;
  isPremium?: boolean;
  onOpenPremium?: () => void;
}

export default function SettingsView({
  onBack,
  onClearAllData,
  userName,
  setUserName,
  userEmail,
  setUserEmail,
  language,
  setLanguage,
  units,
  setUnits,
  theme,
  setTheme,
  onRestartOnboarding,
  appMode = 'demo',
  onChangeAppMode,
  isPremium = false,
  onOpenPremium
}: SettingsViewProps) {
  // Overlay modal state for chosen category
  const [openedPanel, setOpenedPanel] = useState<'profile' | 'language' | 'notifications' | 'units' | 'appearance' | 'danger' | null>(null);

  // Local state edit fields for profile section
  const [nameField, setNameField] = useState(userName);
  const [emailField, setEmailField] = useState(userEmail);
  const [isSaved, setIsSaved] = useState(false);

  // Notification toggles state
  const [notifs, setNotifs] = useState({
    dailyRecap: true,
    weeklyDigest: false,
    soundOn: true,
    activityReminders: true
  });

  const t = (key: string) => getTranslation(key, language);

  const saveProfile = () => {
    setUserName(nameField.trim());
    setUserEmail(emailField.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setOpenedPanel(null); // Auto-close modal after saving
    }, 1200);
  };

  const handleReset = () => {
    if (confirm(t('confirmReset'))) {
      onClearAllData();
      alert(t('resetSuccess'));
      setOpenedPanel(null);
      onBack();
    }
  };

  return (
    <div className="space-y-4 text-left font-sans animate-fade-in">
      {/* Header with Back button */}
      <div className="flex items-center gap-2.5 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 rounded-xl text-stone-550 hover:text-stone-850 duration-200 cursor-pointer border border-stone-200/40"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{t('settingsTitle')}</h2>
          <p className="text-[10px] text-stone-400 font-bold font-mono">{t('settingsSub')}</p>
        </div>
      </div>

      <div className="bg-amber-950/5 border border-amber-950/10 rounded-2xl p-5 mb-4">
        <p className="text-xs text-stone-600 font-bold leading-relaxed">
          {t('settingsDesc')}
        </p>
      </div>

      {/* Premium monetization banner block */}
      <div className={`p-4.5 rounded-2xl border transition-all ${
        isPremium
          ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-900/10'
          : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
      } flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4`}>
        <div className="flex gap-3 text-left">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPremium ? 'bg-amber-500 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-800 dark:text-stone-105 uppercase tracking-widest leading-none">
                {language === 'ru' ? 'SelfTrack PREMIUM' : 'SelfTrack PREMIUM'}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isPremium
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-stone-200 text-stone-550 dark:bg-stone-800 dark:text-stone-400 shadow-sm border border-stone-300/30'
              }`}>
                {isPremium ? (language === 'ru' ? 'АКТИВЕН' : 'ACTIVE') : (language === 'ru' ? 'ВЫКЛЮЧЕН' : 'INACTIVE')}
              </span>
            </div>
            <p className="text-[10px] text-stone-450 dark:text-stone-400 font-bold mt-1 max-w-sm leading-normal">
              {isPremium
                ? (language === 'ru' ? 'Ваш статус PRO активен навсегда. Наслаждайтесь полным безлимитом функций.' : 'Your Lifetime PRO status is permanently active. Enjoy unlimited access to everything.')
                : (language === 'ru' ? 'Снимите лимиты на замеры, откройте умную инфографику и iCal синхронизацию.' : 'Unlock rich cognitive peak metrics, unlimited tracking logs & direct calendar sync.')
              }
            </p>
          </div>
        </div>
        {onOpenPremium && (
          <button
            onClick={onOpenPremium}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center select-none ${
              isPremium
                ? 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200'
                : 'bg-amber-950 text-white hover:bg-amber-900 active:scale-95 shadow-sm'
            }`}
          >
            {isPremium
              ? (language === 'ru' ? 'Просмотр лиценизи' : 'View License')
              : (language === 'ru' ? 'Подключить PRO' : 'Go Premium')}
          </button>
        )}
      </div>

      {/* Main Settings List (macOS/iOS style interactive rows list) */}
      <div className="bg-white border border-amber-950/10 rounded-2xl overflow-hidden shadow-sm divide-y divide-stone-100">
        {/* Profile Card Trigger */}
        <button
          onClick={() => setOpenedPanel('profile')}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50/50 transition-all text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">{t('profileTab')}</span>
              <span className="block text-[10px] text-stone-400 font-bold font-mono mt-0.5">{userName} • {userEmail}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Language Selection Trigger */}
        <button
          onClick={() => setOpenedPanel('language')}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50/50 transition-all text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">{t('langTab')}</span>
              <span className="block text-[10px] text-stone-400 font-bold font-mono mt-0.5">
                {language === 'ru' ? t('ruOption') : t('enOption')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Notifications Trigger */}
        <button
          onClick={() => setOpenedPanel('notifications')}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50/50 transition-all text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">{t('notifTab')}</span>
              <span className="block text-[10px] text-stone-400 font-bold mt-0.5">{t('notifDesc')}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Metric Units Trigger */}
        <button
          onClick={() => setOpenedPanel('units')}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50/50 transition-all text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">{t('unitsTab')}</span>
              <span className="block text-[10px] text-stone-400 font-bold mt-0.5">
                {units.weight} • {units.water} • {units.distance}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Appearance (Theme) Trigger */}
        <button
          onClick={() => setOpenedPanel('appearance')}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50/50 transition-all text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">{t('appearanceTab')}</span>
              <span className="block text-[10px] text-stone-400 font-bold mt-0.5">
                {theme === 'dark' ? t('darkTheme') : t('lightTheme')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Onboarding Walkthrough Guide */}
        {onRestartOnboarding && (
          <button
            onClick={onRestartOnboarding}
            className="w-full flex items-center justify-between p-4 hover:bg-stone-50/50 transition-all text-left cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">
                  {language === 'en' ? 'App Walkthrough' : 'Обучение по приложению'}
                </span>
                <span className="block text-[10px] text-stone-400 font-bold mt-0.5">
                  {language === 'en' ? 'Take the interactive step-by-step introduction' : 'Запустить интерактивный мини-гид'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        )}



        {/* Danger Data Reset Trigger */}
        <button
          onClick={() => setOpenedPanel('danger')}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50/10 transition-all text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-650 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-red-650 uppercase tracking-widest">{t('dangerTab')}</span>
              <span className="block text-[10px] text-red-400 mt-0.5 font-bold font-mono">{t('dangerDesc')}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Security Credentials status footer details */}
      <div className="p-4 bg-stone-50 border border-stone-150/50 rounded-xl flex items-center gap-2 text-xs text-stone-500 font-bold">
        <Shield className="w-4 h-4 text-stone-400" />
        <span>{t('securityStatus')}</span>
      </div>


      {/* ================================================== */}
      {/* OVERLAY MODAL WINDOWS (открываются в новом окне) */}
      {/* ================================================== */}
      {openedPanel && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-stone-200/80 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left transform scale-100 transition-all duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/45">
              <div>
                <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest block font-mono">
                  {t('settingsTitle')}
                </span>
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-wide mt-0.5">
                  {openedPanel === 'profile' && t('profileTitle')}
                  {openedPanel === 'language' && t('langTitle')}
                  {openedPanel === 'notifications' && t('notifTitle')}
                  {openedPanel === 'units' && t('unitsTitle')}
                  {openedPanel === 'appearance' && t('appearanceTitle')}
                  {openedPanel === 'danger' && t('dangerTitle')}
                </h3>
              </div>
              <button
                onClick={() => setOpenedPanel(null)}
                className="rounded-full bg-stone-100 p-1.5 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Profile Config */}
              {openedPanel === 'profile' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-stone-400 font-bold leading-normal">{t('profileDesc')}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-450 mb-1 font-mono">
                        {t('profileNameLabel')}
                      </label>
                      <input
                        type="text"
                        value={nameField}
                        onChange={(e) => setNameField(e.target.value)}
                        className="h-9.5 w-full border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-bold focus:border-amber-950 focus:outline-none"
                        placeholder="Ваше имя"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-450 mb-1 font-mono">
                        {t('profileEmailLabel')}
                      </label>
                      <input
                        type="email"
                        value={emailField}
                        onChange={(e) => setEmailField(e.target.value)}
                        className="h-9.5 w-full border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-bold font-mono focus:border-amber-950 focus:outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Language Selection Config (ru and en only) */}
              {openedPanel === 'language' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-stone-400 font-bold leading-normal">{t('langDesc')}</p>
                  <div className="grid gap-2 pt-1">
                    {[
                      { id: 'ru', label: t('ruOption'), active: language === 'ru' },
                      { id: 'en', label: t('enOption'), active: language === 'en' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setLanguage(item.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                          item.active
                            ? 'bg-amber-50/50 text-amber-950 border-amber-950 shadow-sm'
                            : 'border-stone-100 bg-stone-50/30 text-stone-600 hover:bg-stone-50/60'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.active && <Check className="w-4 h-4 text-amber-950 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Config */}
              {openedPanel === 'notifications' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-stone-400 font-bold leading-normal">{t('notifDesc')}</p>
                  <div className="space-y-3.5 pt-1">
                    {[
                      {
                        key: 'dailyRecap',
                        title: t('notif1Title'),
                        desc: t('notif1Desc')
                      },
                      {
                        key: 'weeklyDigest',
                        title: t('notif2Title'),
                        desc: t('notif2Desc')
                      },
                      {
                        key: 'activityReminders',
                        title: t('notif3Title'),
                        desc: t('notif3Desc')
                      },
                      {
                        key: 'soundOn',
                        title: t('notif4Title'),
                        desc: t('notif4Desc')
                      }
                    ].map((item) => {
                      const val = notifs[item.key as keyof typeof notifs];
                      return (
                        <div key={item.key} className="flex items-start justify-between gap-4 py-1.5 border-b border-stone-50 last:border-0">
                          <div className="min-w-0">
                            <span className="block text-xs font-black text-slate-800 leading-tight">{item.title}</span>
                            <span className="block text-[10px] text-stone-400 mt-0.5 leading-normal font-medium">{item.desc}</span>
                          </div>
                          <button
                            onClick={() => setNotifs(p => ({ ...p, [item.key]: !val }))}
                            className={`w-10 h-6.0 shrink-0 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                              val ? 'bg-amber-950' : 'bg-stone-200'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                                val ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metric Units Config */}
              {openedPanel === 'units' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-stone-400 font-bold leading-normal">{t('unitsDesc')}</p>
                  <div className="space-y-4 pt-1">
                    {/* Weight units */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-450 mb-1.5 font-mono">
                        {t('unitWeight')}
                      </label>
                      <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => setUnits({ ...units, weight: 'kg' })}
                          className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            units.weight === 'kg' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {t('unitWeightKg')}
                        </button>
                        <button
                          onClick={() => setUnits({ ...units, weight: 'lbs' })}
                          className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            units.weight === 'lbs' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {t('unitWeightLbs')}
                        </button>
                      </div>
                    </div>

                    {/* Water Volume units */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-450 mb-1.5 font-mono">
                        {t('unitWater')}
                      </label>
                      <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => setUnits({ ...units, water: 'ml' })}
                          className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            units.water === 'ml' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {t('unitWaterMl')}
                        </button>
                        <button
                          onClick={() => setUnits({ ...units, water: 'oz' })}
                          className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            units.water === 'oz' ? 'bg-white text-slate-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {t('unitWaterOz')}
                        </button>
                      </div>
                    </div>

                    {/* No other metric units */}
                  </div>
                </div>
              )}

              {/* Appearance Config */}
              {openedPanel === 'appearance' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-stone-400 font-bold leading-normal">{t('appearanceDesc')}</p>
                  <div className="grid gap-3 pt-1">
                    {[
                      { id: 'light', label: t('lightTheme'), icon: <Sun className="w-4 h-4 text-amber-600" /> },
                      { id: 'dark', label: t('darkTheme'), icon: <Moon className="w-4 h-4 text-purple-600" /> }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setTheme(item.id as 'light' | 'dark')}
                        className={`flex items-center justify-between p-4 rounded-xl border text-xs font-extrabold cursor-pointer transition-all text-left ${
                          theme === item.id
                            ? 'bg-amber-50/50 text-amber-950 border-amber-950 shadow-sm dark:bg-stone-800 dark:border-stone-100 dark:text-stone-105'
                            : 'border-stone-100 bg-stone-50/30 text-stone-600 hover:bg-stone-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-stone-200/50 shadow-xs shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <span className="block font-extrabold text-xs text-slate-850">{item.label}</span>
                            <span className="block text-[10px] text-stone-400 mt-0.5">{item.id === 'light' ? 'Яркие мягкие оттенки' : 'Комфортный ночной стиль'}</span>
                          </div>
                        </div>
                        {theme === item.id && <Check className="w-4 h-4 text-amber-950 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}



              {/* Danger Zone */}
              {openedPanel === 'danger' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-red-250 bg-red-50/20 space-y-3">
                    <span className="text-xs font-black text-red-700 uppercase tracking-wide block">
                      {t('dangerWarning')}
                    </span>
                    <p className="text-[11px] text-stone-650 leading-relaxed font-bold">
                      {t('dangerText')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setOpenedPanel(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-extrabold text-xs px-4 py-2 rounded-xl duration-200 cursor-pointer"
              >
                {t('cancel')}
              </button>
              {openedPanel === 'profile' && (
                <button
                  onClick={saveProfile}
                  className="bg-amber-950 hover:bg-stone-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl duration-200 cursor-pointer"
                >
                  {isSaved ? t('profileSaved') : t('save')}
                </button>
              )}
              {openedPanel === 'danger' && (
                <button
                  onClick={handleReset}
                  className="bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl duration-200 cursor-pointer"
                >
                  {t('dangerButton')}
                </button>
              )}
              {openedPanel !== 'profile' && openedPanel !== 'danger' && (
                <button
                  onClick={() => setOpenedPanel(null)}
                  className="bg-amber-950 hover:bg-stone-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl duration-200 cursor-pointer"
                >
                  {t('close')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
