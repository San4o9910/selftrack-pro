import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, Plus, Smartphone, X, Check, ArrowUp, Compass } from 'lucide-react';

interface IOSInstallGuideProps {
  language: 'ru' | 'en';
  onClose?: () => void;
  forceShow?: boolean;
}

export const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ language, onClose, forceShow = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect if app is running in Standalone (PWA) mode
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Show automatic prompt if we are on iOS and not in standalone PWA mode
    if (forceShow || (isIOSDevice && !standalone)) {
      // Check if user dismissed it in this session to prevent spamming
      const dismissed = sessionStorage.getItem('selftrack_ios_prompt_dismissed');
      if (!dismissed || forceShow) {
        setIsVisible(true);
      }
    }
  }, [forceShow]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('selftrack_ios_prompt_dismissed', 'true');
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div id="ios-pwa-install-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md overflow-hidden bg-stone-50 border border-stone-200/80 rounded-3xl shadow-2xl p-6 font-sans text-left"
        >
          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon and Header */}
          <div className="flex items-center gap-3.5 mb-5 mt-1">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 text-amber-800 shadow-sm shrink-0">
              <Smartphone className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-905 text-stone-900 flex items-center gap-1.5 leading-tight">
                {language === 'ru' ? 'Установка на iPhone / iPad' : 'Install on iOS Device'}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {language === 'ru' ? 'Запуск с экрана "Домой" без Safari' : 'Run fullscreen without browser UI'}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-stone-700 text-xs">
            {/* Step 1 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-stone-200/60 font-bold text-stone-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-bold text-stone-880 text-stone-850">
                  {language === 'ru' ? 'Откройте приложение в Safari' : 'Open in Safari browser'}
                </p>
                <p className="text-stone-500 mt-0.5 leading-relaxed flex items-center gap-1 flex-wrap">
                  {language === 'ru' 
                    ? 'Убедитесь, что вы используете стандартный браузер ' 
                    : 'Make sure you are viewing this page on standard '}
                  <span className="inline-flex items-center gap-0.5 bg-stone-200/40 text-stone-605 px-1.5 py-0.5 rounded text-[10px] font-semibold dark:text-stone-700">
                    <Compass className="w-3 h-3 text-amber-700" /> Safari
                  </span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-stone-200/60 font-bold text-stone-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <p className="font-bold text-stone-850">
                  {language === 'ru' ? 'Нажмите «Поделиться»' : 'Tap the "Share" control'}
                </p>
                <p className="text-stone-500 mt-0.5 leading-relaxed">
                  {language === 'ru' 
                    ? 'Нажмите кнопку «Поделиться» в центральной нижней части экрана (панель Safari).' 
                    : 'Tap the share button on the Safari control panel below.'}
                </p>
                
                {/* Safari Share Button Illustration */}
                <div className="flex items-center justify-center py-2.5 mt-2 bg-stone-100 rounded-2xl border border-stone-200/30">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-stone-250/50 shadow-sm text-stone-600 font-semibold text-[11px] animate-pulse">
                    <Share className="w-4 h-4 text-sky-600" />
                    <span>Поделиться / Share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-stone-200/60 font-bold text-stone-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <p className="font-bold text-stone-850">
                  {language === 'ru' ? 'Выберите «На экран Домой»' : 'Choose "Add to Home Screen"'}
                </p>
                <p className="text-stone-500 mt-0.5 leading-relaxed">
                  {language === 'ru' 
                    ? 'Прокрутите меню вниз и нажмите кнопку действия «На экран «Домой» (в английском iOS — Add to Home Screen).' 
                    : 'Scroll down the list of choices and select action "Add to Home Screen".'}
                </p>

                {/* Home Screen Add Illustration */}
                <div className="flex items-center justify-center py-2.5 mt-2 bg-stone-100 rounded-2xl border border-stone-200/30 text-stone-800">
                  <div className="flex flex-col gap-1 w-full max-w-[260px] bg-white rounded-xl border border-stone-200/40 p-2 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold border-b border-stone-100 pb-1.5 text-stone-500 font-sans px-1 uppercase tracking-wider">
                      <span>Опции / Options</span>
                      <ArrowUp className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                    <div className="flex items-center justify-between px-1.5 py-1 text-[11.5px] font-extrabold hover:bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-stone-700 bg-stone-100 border border-stone-200 p-0.5 rounded-md" />
                        <span>{language === 'ru' ? 'На экран Домой' : 'Add to Home Screen'}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-stone-200/60 font-bold text-stone-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-bold text-stone-850">
                  {language === 'ru' ? 'Подтвердите установку' : 'Confirm addition'}
                </p>
                <p className="text-stone-500 mt-0.5 leading-relaxed">
                  {language === 'ru' 
                    ? 'Нажмите кнопку «Добавить» в правом верхнем углу. Готово! Иконка появится на вашем рабочем столе.' 
                    : 'Tap the "Add" submit button in the top right. Done! SelfTrack is now an icon on your device.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center justify-between">
            <span className="text-[10px] text-stone-450 text-stone-400 font-medium">
              {language === 'ru' ? 'Свободно от App Store' : 'Direct install PWA'}
            </span>
            <button
              onClick={handleDismiss}
              className="px-5 py-2 text-xs font-black tracking-wide rounded-xl bg-amber-950 text-white cursor-pointer hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'Понятно' : 'Got it'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
