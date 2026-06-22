/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Calendar as CalendarIcon, TrendingUp, Award, Coins, Sparkles, Moon, Droplet, Star, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

// Imports types and seeded arrays
import { DayEvent, Habit, Metric, Expense, Goal, StoreCatalogItem, SyncConfig } from './types';
import {
  INITIAL_HABITS, INITIAL_EVENTS, INITIAL_METRICS, INITIAL_STORES,
  INITIAL_EXPENSES, INITIAL_GOALS
} from './data';
import { today, ymd, shift, sleepDuration, MONTHS } from './utils';

// Imports modular views
import Header from './components/Header';
import TodayView from './components/TodayView';
import CalendarView from './components/CalendarView';
import AnalyticsView from './components/AnalyticsView';
import FinanceGoalsView from './components/FinanceGoalsView';
import SettingsView from './components/SettingsView';
import Modals from './components/Modals';
import ProfileSetupModal from './components/ProfileSetupModal';
import PremiumPaywallModal from './components/PremiumPaywallModal';
import { getTranslation } from './lib/translations';
import { IOSInstallGuide } from './components/IOSInstallGuide';
import { triggerHapticFeedback } from './lib/haptics';
import { safeGetString, safeSetString, safeGetJSON, safeSetJSON, isArray } from './lib/storage';

export default function App() {
  // Active Main Tab state: 'today' | 'calendar' | 'financeGoals' | 'analytics'
  const [tab, setTabInternal] = useState<'today' | 'calendar' | 'financeGoals' | 'analytics'>('today');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');

  const setTab = (newTab: 'today' | 'calendar' | 'financeGoals' | 'analytics') => {
    const TABS: ('today' | 'calendar' | 'financeGoals' | 'analytics')[] = ['today', 'calendar', 'financeGoals', 'analytics'];
    const oldIndex = TABS.indexOf(tab);
    const newIndex = TABS.indexOf(newTab);
    if (newIndex > oldIndex) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection('right');
    }
    triggerHapticFeedback('light');
    setTabInternal(newTab);
  };

  // App settings page visibility & values
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Mode selection: default to 'personal' permanently
  const [appMode, setAppMode] = useState<'demo' | 'personal'>('personal');

  const [userName, setUserNameInternal] = useState<string>(() => {
    return safeGetString('selfTrack_user_name', '');
  });

  const [userEmail, setUserEmailInternal] = useState<string>(() => {
    return safeGetString('selfTrack_user_email', '');
  });

  const setUserName = (name: string) => {
    setUserNameInternal(name);
    safeSetString('selfTrack_user_name', name);
  };

  const setUserEmail = (email: string) => {
    setUserEmailInternal(email);
    safeSetString('selfTrack_user_email', email);
  };

  const [showModeSetup, setShowModeSetup] = useState<boolean>(false);

  const [appLanguage, setAppLanguageInternal] = useState<string>(() => {
    return safeGetString('appLanguage', 'ru');
  });
  const setAppLanguage = (lang: string) => {
    setAppLanguageInternal(lang);
    safeSetString('appLanguage', lang);
  };

  // Theme configuration state
  const [theme, setThemeInternal] = useState<'light' | 'dark'>(() => {
    return safeGetString('appTheme', 'light') === 'dark' ? 'dark' : 'light';
  });
  const setTheme = (t: 'light' | 'dark') => {
    setThemeInternal(t);
    safeSetString('appTheme', t);
  };

  // Onboarding walkthrough guide states
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return safeGetString('selfTrack_onboarding_done', '') !== 'true';
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  // Subscription premium states (SaaS monetization support)
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return safeGetString('selfTrack_is_premium', '') === 'true';
  });
  const [showPremiumPaywall, setShowPremiumPaywall] = useState<boolean>(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState<boolean>(false);

  // Swipe-to-change screen gesture handlers
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only intercept gestures on the main workspace tabs when not in settings or overlay modals
    if (showSettings || showOnboarding || showModeSetup || showPremiumPaywall || showIOSInstallGuide) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const timeElapsed = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Minimum distance of 60px, maximum duration of 450ms, and angle condition (horizontal ratio > 1.5)
    if (timeElapsed > 450) return;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const TABS: ('today' | 'calendar' | 'financeGoals' | 'analytics')[] = ['today', 'calendar', 'financeGoals', 'analytics'];
    const currentIndex = TABS.indexOf(tab);

    if (dx > 0) {
      // Swiped from Left to Right (swiped right) -> go to previous screen
      if (currentIndex > 0) {
        setTab(TABS[currentIndex - 1]);
      }
    } else {
      // Swiped from Right to Left (swiped left) -> go to next screen
      if (currentIndex < TABS.length - 1) {
        setTab(TABS[currentIndex + 1]);
      }
    }
  };

  const handleActivatePremium = () => {
    setIsPremium(true);
    safeSetString('selfTrack_is_premium', 'true');
    pushConsoleLog('Активирован неограниченный доступ PRO. Лимиты сняты.');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [metricUnits, setMetricUnits] = useState({
    weight: 'kg' as 'kg' | 'lbs',
    water: 'ml' as 'ml' | 'oz',
    distance: 'km' as 'km' | 'miles'
  });

  // Core application reactive databases.
  // safeGetJSON validates the decoded shape (must be an array) and self-heals a
  // corrupted entry instead of throwing during render — which previously left
  // the entire app stuck on a permanent white screen across reloads.
  const [habits, setHabits] = useState<Habit[]>(() =>
    safeGetJSON<Habit[]>('selfTrack_habits', [], isArray),
  );

  const [events, setEvents] = useState<DayEvent[]>(() =>
    safeGetJSON<DayEvent[]>('selfTrack_events', [], isArray),
  );

  const [metrics, setMetrics] = useState<Metric[]>(() =>
    safeGetJSON<Metric[]>('selfTrack_metrics', [], isArray),
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    safeGetJSON<Expense[]>('selfTrack_expenses', [], isArray),
  );

  const [stores, setStores] = useState<StoreCatalogItem[]>(() =>
    safeGetJSON<StoreCatalogItem[]>('selfTrack_stores', INITIAL_STORES, isArray),
  );

  const [goals, setGoals] = useState<Goal[]>(() =>
    safeGetJSON<Goal[]>('selfTrack_goals', [], isArray),
  );

  // Focus properties
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [sound, setSound] = useState<'bell' | 'digital' | 'gong'>('bell');
  const [push, setPush] = useState<boolean>(false);

  // Financial Filter configurations
  const [expenseFilter, setExpenseFilter] = useState<{
    period: 'day' | 'week' | 'month' | 'year' | 'custom';
    from: string;
    to: string;
    label: string;
  }>({
    period: 'week',
    from: shift(-6),
    to: today(),
    label: 'Последние 7 дней'
  });

  // Simulated Google Calendar Synchronizations
  const [sync, setSync] = useState<SyncConfig>({
    connected: false,
    last: null,
    logs: [
      `[${new Date().toLocaleTimeString('ru-RU')}] Ожидание подключения аккаунта…`
    ]
  });

  // Modal Sheet State manager
  const [modal, setModal] = useState<{
    type: 'day' | 'expPeriod' | 'expStores' | 'expAdd' | 'expDrill' | 'healthDay' | 'goal';
    adding?: boolean;
    store?: string;
    cat?: string;
    id?: string;
    date?: string;
  } | null>(null);

  // ---------- Action Handlers: Day Tasks ----------
  const toggleTask = (id: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        triggerHapticFeedback(!e.done ? 'success' : 'light');
        return { ...e, done: !e.done };
      }
      return e;
    }));
  };

  const deleteTask = (id: string) => {
    triggerHapticFeedback('heavy');
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addTask = (task: Omit<DayEvent, 'id'>) => {
    triggerHapticFeedback('success');
    setEvents(prev => [
      { id: 'e' + Date.now(), ...task },
      ...prev
    ]);
  };

  // ---------- Action Handlers: Finances ----------
  const applyPeriod = (period: 'day' | 'week' | 'month' | 'year' | 'custom', customFrom?: string, customTo?: string) => {
    let lbl = '';
    let from = today();
    let to = today();

    if (period === 'day') {
      lbl = 'Сегодня';
    } else if (period === 'week') {
      lbl = 'Последние 7 дней';
      from = shift(-6);
    } else if (period === 'month') {
      const now = new Date();
      lbl = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
      from = ymd(new Date(now.getFullYear(), now.getMonth(), 1)); // true start of month
    } else if (period === 'year') {
      const now = new Date();
      lbl = `${now.getFullYear()} год`;
      from = ymd(new Date(now.getFullYear(), 0, 1)); // true start of year
    } else if (period === 'custom' && customFrom && customTo) {
      lbl = `${customFrom.split('-').reverse().join('.')} – ${customTo.split('-').reverse().join('.')}`;
      from = customFrom;
      to = customTo;
    }

    setExpenseFilter({ period, from, to, label: lbl });
  };

  const addStore = (name: string, cat: string) => {
    setStores(prev => [...prev, { name, cat }]);
  };

  const addExpense = (store: string, amount: number, cat: string, notes?: string) => {
    triggerHapticFeedback('success');
    setExpenses(prev => [
      { id: 'x' + Date.now(), store, amount, date: today(), cat, notes },
      ...prev
    ]);
  };

  // ---------- Action Handlers: Well-being Indicators ----------
  const addWater = (ml: number) => {
    triggerHapticFeedback('medium');
    const todayYmd = today();
    setMetrics(prev => {
      const exists = prev.find(m => m.date === todayYmd);
      if (exists) {
        return prev.map(m => m.date === todayYmd ? { ...m, water: (m.water || 0) + ml } : m);
      }
      return [{ date: todayYmd, water: ml }, ...prev];
    });
  };

  const updateSleepTimes = (bed: string, wake: string) => {
    const todayYmd = today();
    setMetrics(prev => {
      const exists = prev.find(m => m.date === todayYmd);
      const duration = sleepDuration(bed, wake);
      const updated = {
        date: todayYmd,
        bed,
        wake,
        ...(duration !== null ? { sleep: duration } : {})
      };
      if (exists) {
        return prev.map(m => m.date === todayYmd ? { ...m, ...updated } : m);
      }
      return [updated, ...prev];
    });
  };

  const updateSleepHours = (hours: number) => {
    const todayYmd = today();
    setMetrics(prev => {
      const exists = prev.find(m => m.date === todayYmd);
      if (exists) {
        return prev.map(m => m.date === todayYmd ? { ...m, sleep: hours, bed: '', wake: '' } : m);
      }
      return [{ date: todayYmd, sleep: hours, bed: '', wake: '' }, ...prev];
    });
  };

  const setMood = (mo: 'awful' | 'bad' | 'neutral' | 'good' | 'great') => {
    triggerHapticFeedback('medium');
    const todayYmd = today();
    setMetrics(prev => {
      const exists = prev.find(m => m.date === todayYmd);
      if (exists) {
        return prev.map(m => m.date === todayYmd ? { ...m, mood: mo } : m);
      }
      return [{ date: todayYmd, mood: mo }, ...prev];
    });
  };

  const handleSaveWeight = (w: number) => {
    const todayYmd = today();
    setMetrics(prev => {
      const exists = prev.find(m => m.date === todayYmd);
      if (exists) {
        return prev.map(m => m.date === todayYmd ? { ...m, weight: w } : m);
      }
      return [{ date: todayYmd, weight: w }, ...prev];
    });
  };

  // ---------- Action Handlers: Target Goals ----------
  const setGoalProgress = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? {
      ...g,
      progress,
      status: progress >= 100 ? 'completed' : 'active'
    } : g));
  };

  const saveGoal = (g: Goal) => {
    setGoals(prev => {
      const exists = prev.some(x => x.id === g.id);
      if (exists) return prev.map(x => x.id === g.id ? g : x);
      return [g, ...prev];
    });
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // ---------- Action Handlers: Habits Ticking ----------
  const toggleHabit = (id: string) => {
    const todayYmd = today();
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompleted = h.completedDates.includes(todayYmd);
        triggerHapticFeedback(!isCompleted ? 'success' : 'light');
        const nextDates = isCompleted
          ? h.completedDates.filter(d => d !== todayYmd)
          : [...h.completedDates, todayYmd];
        return { ...h, completedDates: nextDates };
      }
      return h;
    }));
  };

  const editReminderTime = (id: string, time: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, time } : h));
  };

  // ---------- Action Handlers: Google Calendar Sync Emulator ----------
  const pushConsoleLog = (text: string) => {
    const timeText = new Date().toLocaleTimeString('ru-RU');
    setSync(prev => ({
      ...prev,
      logs: [`[${timeText}] ${text}`, ...prev.logs]
    }));
  };

  const handleConnectSync = () => {
    pushConsoleLog('Запуск авторизации Google Calendar...');
    setTimeout(() => {
      setSync(prev => ({
        ...prev,
        connected: true,
        last: new Date().toLocaleString('ru-RU')
      }));
      pushConsoleLog('Успешно авторизовано! (Демо-токен получен)');
      pushConsoleLog(`Синхронизировано ${events.length} событий.`);
    }, 700);
  };

  const handleDisconnectSync = () => {
    setSync(prev => ({
      ...prev,
      connected: false,
      last: null
    }));
    pushConsoleLog('Календарь отключён. Локальный режим.');
  };

  const handleRefreshSync = () => {
    pushConsoleLog('Принудительное сканирование календаря...');
    setTimeout(() => {
      setSync(prev => ({
        ...prev,
        last: new Date().toLocaleString('ru-RU')
      }));
      pushConsoleLog(`Успешный экспорт: синхронизировано ${events.length} событий.`);
    }, 450);
  };

  // Assembles and triggers native browser .ics download
  const handleExportIcal = () => {
    if (!isPremium) {
      setShowPremiumPaywall(true);
      return;
    }
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SelfTrack PRO//Universal Life Organizer//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(e => {
      const dStr = e.date.replace(/-/g, '');
      const sStr = e.start.replace(/:/g, '') + '00';
      const eStr = e.end.replace(/:/g, '') + '00';

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:event-${e.id}@selftrackpro.app`);
      icsContent.push(`DTSTAMP:${dStr}T${sStr}`);
      icsContent.push(`DTSTART:${dStr}T${sStr}`);
      icsContent.push(`DTEND:${dStr}T${eStr}`);
      icsContent.push(`SUMMARY:${e.title}`);
      if (e.notes) {
        icsContent.push(`DESCRIPTION:${e.notes.replace(/,/g, '\\,')}`);
      }
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `selftrack-calendar-${today()}.ics`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    pushConsoleLog('Сгенерирован валидный RFC-5545 .ics-календарь.');
  };

  // Synchronize data states to localStorage in Personal Mode.
  // safeSetJSON swallows QuotaExceededError (common on iOS standalone / Safari
  // Private) so a full disk degrades gracefully instead of throwing in an effect.
  useEffect(() => {
    if (appMode === 'personal') safeSetJSON('selfTrack_habits', habits);
  }, [habits, appMode]);

  useEffect(() => {
    if (appMode === 'personal') safeSetJSON('selfTrack_events', events);
  }, [events, appMode]);

  useEffect(() => {
    if (appMode === 'personal') safeSetJSON('selfTrack_metrics', metrics);
  }, [metrics, appMode]);

  useEffect(() => {
    if (appMode === 'personal') safeSetJSON('selfTrack_expenses', expenses);
  }, [expenses, appMode]);

  useEffect(() => {
    if (appMode === 'personal') safeSetJSON('selfTrack_goals', goals);
  }, [goals, appMode]);

  useEffect(() => {
    if (appMode === 'personal') safeSetJSON('selfTrack_stores', stores);
  }, [stores, appMode]);

  const handleStartPersonalMode = (customName?: string, customEmail?: string, keepHabitTemplates: boolean = true) => {
    setAppMode('personal');
    safeSetString('selfTrack_app_mode', 'personal');
    
    if (customName) {
      setUserName(customName);
    } else {
      setUserName('Личный Журнал');
    }
    
    if (customEmail) {
      setUserEmail(customEmail);
    } else {
      setUserEmail('my-diary@selftrack.app');
    }

    setEvents([]);
    setMetrics([]);
    setExpenses([]);
    setGoals([]);
    
    if (keepHabitTemplates) {
      const cleanedHabits = INITIAL_HABITS.map(h => ({
        ...h,
        completedDates: []
      }));
      setHabits(cleanedHabits);
    } else {
      setHabits([]);
    }

    pushConsoleLog('Инициализирован чистый профиль личного журнала.');
  };

  const handleClearAllData = () => {
    if (appMode === 'personal') {
      setEvents([]);
      setMetrics([]);
      setExpenses([]);
      setGoals([]);
      setHabits(INITIAL_HABITS.map(h => ({ ...h, completedDates: [] })));
      pushConsoleLog('Данные личного журнала успешно очищены до нуля.');
    } else {
      setHabits(INITIAL_HABITS);
      setEvents(INITIAL_EVENTS);
      setMetrics(INITIAL_METRICS);
      setExpenses(INITIAL_EXPENSES);
      setGoals(INITIAL_GOALS);
      setUserName('');
      setUserEmail('');
      pushConsoleLog('Данные демонстрационных слайдов перезапущены.');
    }
  };

  // Helper getters
  const todayMetric = metrics.find(m => m.date === today()) || {};

  return (
    <div className={`w-full min-h-screen md:py-6 md:px-4 flex flex-col items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'bg-[#121110] text-[#eceae6]' : 'bg-[#e7e4dd] text-[#3f3a34]'}`}>
      {/* Main framed simulator device wrapper */}
      <div
        className={`w-full h-screen md:h-[820px] max-h-screen md:max-h-[92vh] md:border md:rounded-3xl overflow-hidden flex flex-col max-w-[1080px] transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-[#1c1a18] md:border-stone-800/80 md:shadow-2xl md:shadow-stone-950/50'
            : 'bg-[#fbfbfa] md:border-amber-950/12 md:shadow-2xl'
        }`}
      >
        {/* App Logo and Profile Header */}
        <Header
          onExportIcal={handleExportIcal}
          onOpenSettings={() => setShowSettings(true)}
          userName={userName}
          userEmail={userEmail}
          appMode={appMode}
          onStartPersonalMode={() => setShowModeSetup(true)}
          isPremium={isPremium}
          onOpenPremium={() => setShowPremiumPaywall(true)}
        />

        {/* Middle contents columns wrapper */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          {/* Left / Central major workspace tab */}
          <main 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4"
          >
            {showSettings ? (
              <SettingsView
                onBack={() => setShowSettings(false)}
                onClearAllData={handleClearAllData}
                userName={userName}
                setUserName={setUserName}
                userEmail={userEmail}
                setUserEmail={setUserEmail}
                language={appLanguage}
                setLanguage={setAppLanguage}
                units={metricUnits}
                setUnits={setMetricUnits}
                theme={theme}
                setTheme={setTheme}
                onRestartOnboarding={() => {
                  setShowOnboarding(true);
                  setOnboardingStep(0);
                  setShowSettings(false);
                }}
                isPremium={isPremium}
                onOpenPremium={() => setShowPremiumPaywall(true)}
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: swipeDirection === 'left' ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: swipeDirection === 'left' ? -40 : 40 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="w-full flex-1 flex flex-col"
                >
                  {tab === 'today' && (
                    <TodayView
                      events={events}
                      toggleTask={toggleTask}
                      deleteTask={deleteTask}
                      onOpenDay={(date, addingCode) => {
                        setSelectedDate(date);
                        setModal({ type: 'day', adding: addingCode });
                      }}
                      expenses={expenses}
                      onOpenExpAdd={() => setModal({ type: 'expAdd' })}
                      metric={todayMetric}
                      onAddWater={addWater}
                      onUpdateSleepTimes={updateSleepTimes}
                      onUpdateSleepHours={updateSleepHours}
                      onSetMood={setMood}
                      language={appLanguage}
                    />
                  )}

                  {tab === 'calendar' && (
                    <CalendarView
                      events={events}
                      toggleTask={toggleTask}
                      deleteTask={deleteTask}
                      onOpenDay={(date) => {
                        setSelectedDate(date);
                        setModal({ type: 'day' });
                      }}
                      expenses={expenses}
                      onOpenExpPeriod={() => setModal({ type: 'expPeriod' })}
                      onOpenExpAdd={() => setModal({ type: 'expAdd' })}
                      onOpenExpStores={() => setModal({ type: 'expStores' })}
                      stores={stores}
                      onOpenDrill={(category) => setModal({ type: 'expDrill', cat: category })}
                      selectedPeriodLabel={expenseFilter.label}
                      selectedPeriodDates={expenseFilter}
                      onOpenHealthDay={(date) => {
                        setSelectedDate(date);
                        setModal({ type: 'healthDay' });
                      }}
                      metrics={metrics}
                      saveWeight={handleSaveWeight}
                      onAddWater={addWater}
                      onUpdateSleepTimes={updateSleepTimes}
                      onUpdateSleepHours={updateSleepHours}
                      onSetMood={setMood}
                      goals={goals}
                      onSetGoalProgress={setGoalProgress}
                      onOpenGoalEdit={(id) => setModal({ type: 'goal', id })}
                      onOpenGoalCreate={() => setModal({ type: 'goal' })}
                      language={appLanguage}
                    />
                  )}

                  {tab === 'financeGoals' && (
                    <FinanceGoalsView
                      expenses={expenses}
                      onOpenExpPeriod={() => setModal({ type: 'expPeriod' })}
                      onOpenExpAdd={() => setModal({ type: 'expAdd' })}
                      onOpenExpStores={() => setModal({ type: 'expStores' })}
                      stores={stores}
                      onOpenDrill={(category) => setModal({ type: 'expDrill', cat: category })}
                      selectedPeriodLabel={expenseFilter.label}
                      selectedPeriodDates={expenseFilter}
                      goals={goals}
                      onSetGoalProgress={setGoalProgress}
                      onOpenGoalEdit={(id) => setModal({ type: 'goal', id })}
                      onOpenGoalCreate={() => setModal({ type: 'goal' })}
                      language={appLanguage}
                    />
                  )}

                  {tab === 'analytics' && (
                    <AnalyticsView
                      habits={habits}
                      metrics={metrics}
                      expenses={expenses}
                      events={events}
                      language={appLanguage}
                      isPremium={isPremium}
                      onOpenPremium={() => setShowPremiumPaywall(true)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>

        {/* Global sticky Bottom navigation tabs tabbar */}
        <nav className="bg-white dark:bg-[#1c1a18] border-t border-stone-200/80 dark:border-stone-850 pt-2.5 pb-[calc(11px+env(safe-area-inset-bottom,0px))] px-4 flex gap-1 justify-around shrink-0 font-sans transition-colors duration-300">
          <button
            onClick={() => { setTab('today'); setShowSettings(false); }}
            className={`flex-1 max-w-[110px] py-1 text-center flex flex-col items-center gap-1 rounded-xl text-[11px] font-black tracking-wide cursor-pointer transition-all active:scale-95 ${
              tab === 'today' && !showSettings
                ? 'bg-amber-950 dark:bg-amber-100 text-white dark:text-amber-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-900/45'
            }`}
          >
            <CheckCircle className="w-4.5 h-4.5" />
            <span>{getTranslation('today', appLanguage)}</span>
          </button>
          <button
            onClick={() => { setTab('calendar'); setShowSettings(false); }}
            className={`flex-1 max-w-[110px] py-1 text-center flex flex-col items-center gap-1 rounded-xl text-[11px] font-black tracking-wide cursor-pointer transition-all active:scale-95 ${
              tab === 'calendar' && !showSettings
                ? 'bg-amber-950 dark:bg-amber-100 text-white dark:text-amber-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-900/45'
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5" />
            <span>{getTranslation('calendar', appLanguage)}</span>
          </button>
          <button
            onClick={() => { setTab('financeGoals'); setShowSettings(false); }}
            className={`flex-1 max-w-[110px] py-1 text-center flex flex-col items-center gap-1 rounded-xl text-[11px] font-black tracking-wide cursor-pointer transition-all active:scale-95 ${
              tab === 'financeGoals' && !showSettings
                ? 'bg-amber-950 dark:bg-amber-100 text-white dark:text-amber-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-900/45'
            }`}
          >
            <Coins className="w-4.5 h-4.5" />
            <span>{getTranslation('financeGoals', appLanguage)}</span>
          </button>
          <button
            onClick={() => { setTab('analytics'); setShowSettings(false); }}
            className={`flex-1 max-w-[110px] py-1 text-center flex flex-col items-center gap-1 rounded-xl text-[11px] font-black tracking-wide cursor-pointer transition-all active:scale-95 ${
              tab === 'analytics' && !showSettings
                ? 'bg-amber-950 dark:bg-amber-100 text-white dark:text-amber-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-900/45'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5" />
            <span>{getTranslation('analytics', appLanguage)}</span>
          </button>
        </nav>
      </div>

      {/* Global Modals Manager Drawer Overlay */}
      <Modals
        modal={modal}
        onClose={() => setModal(null)}
        state={{
          selectedDate,
          events,
          stores,
          expenses,
          goals
        }}
        actions={{
          toggleTask,
          deleteTask,
          addTask,
          applyPeriod,
          addStore,
          addExpense,
          saveGoal,
          deleteGoal
        }}
        language={appLanguage}
      />

      {/* Onboarding Walkthrough Dialog Overlay */}
      {showOnboarding && (() => {
        const onboardingSlides = [
          {
            title: appLanguage === 'en' ? 'Welcome to SelfTrack! 🌟' : 'Добро пожаловать в SelfTrack! 🌟',
            desc: appLanguage === 'en'
              ? 'Your ultimate personal command center. Track your habits, schedule tasks, monitor health indicators, control budgets, and view intelligent AI advisor recommendations.'
              : 'Ваш умный центр управления жизнью. Планируйте дела, ведите дневник показателей сна и веса, контролируйте расходы и улучшайте привычки с советами от искусственного интеллекта.',
            icon: <Sparkles className="w-12 h-12 text-amber-500 animate-bounce" />,
            color: 'from-amber-200 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/10',
          },
          {
            title: appLanguage === 'en' ? 'Calendar & Task Scheduler 📅' : 'Календарь и Задачи 📅',
            desc: appLanguage === 'en'
              ? 'Schedule goals and daily tasks. Pick high/medium/low urgencies and complete items directly. On smartphones, tasks appear as interactive color-coded status circles.'
              : 'Планируйте дела на любой день. Устанавливайте уровни срочности и отмечайте выполненное. На смартфонах выполненные и активные задачи обозначаются удобными цветными точками.',
            icon: <CalendarIcon className="w-12 h-12 text-indigo-600 shrink-0" />,
            color: 'from-indigo-200/60 to-indigo-100/30 dark:from-indigo-950/40 dark:to-indigo-900/10',
          },
          {
            title: appLanguage === 'en' ? 'Durable Health Indicator 🩺' : 'Контроль Самочувствия 🩺',
            desc: appLanguage === 'en'
              ? 'Log body weight records, monitor bedtime and wake routines, adjust water balances, and rate your overall mood state with custom interactive emojis.'
              : 'Записывайте вес, отмечайте время засыпания и пробуждения, ведите баланс за воду и оценивайте настроение. Приложение автоматически строит красивые графики ваших трендов.',
            icon: <Droplet className="w-12 h-12 text-blue-500 shrink-0" />,
            color: 'from-blue-200/60 to-blue-100/30 dark:from-blue-950/40 dark:to-blue-900/10',
          },
          {
            title: appLanguage === 'en' ? 'Budgets & Smart Goals 💰' : 'Финансы и Цели 💰',
            desc: appLanguage === 'en'
              ? 'Capture daily purchases or recurring cash flows. Track spending categorizations, explore analytics by shops/stores, and define custom goals with progress sliders.'
              : 'Следите за расходами по категориям и конкретным магазинам. Ставьте амбициозные личные цели, задавайте ключевые этапы и отмечайте прогресс удобным ползунком.',
            icon: <Coins className="w-12 h-12 text-emerald-500 shrink-0" />,
            color: 'from-emerald-200/60 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-900/10',
          },
          {
            title: appLanguage === 'en' ? 'Smart Gemini AI Advisor 🤖' : 'ИИ-Советник от Gemini 🤖',
            desc: appLanguage === 'en'
              ? 'Unlock deep analysis in the Analytics section! Our integrated server-side Gemini server studies your habits, spots daily correlations, and drafts clear actionable steps.'
              : 'Загляните во вкладку Аналитика! Встроенный серверный модуль ИИ Gemini изучит ваши привычки, режим сна и траты, выявит слепые зоны и сформирует четкие рекомендации по привычкам.',
            icon: <Sparkles className="w-12 h-12 text-purple-500 animate-pulse shrink-0" />,
            color: 'from-purple-200/60 to-purple-100/30 dark:from-purple-950/40 dark:to-purple-900/10',
          }
        ];

        const slide = onboardingSlides[onboardingStep];
        const isLastSub = onboardingStep === onboardingSlides.length - 1;

        return (
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1a1816] text-[#221e1a] dark:text-[#f3efe8] border border-amber-950/15 dark:border-stone-800 rounded-3xl p-6 w-full max-w-[460px] shadow-2xl relative flex flex-col justify-between animate-in fade-in zoom-in duration-200 text-left">
              <button
                onClick={() => {
                  safeSetString('selfTrack_onboarding_done', 'true');
                  setShowOnboarding(false);
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-205 flex items-center justify-center transition-all cursor-pointer z-10"
                title={appLanguage === 'en' ? 'Skip' : 'Пропустить'}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Upper Illustration Stage */}
              <div className={`mt-2 mb-6 rounded-2xl bg-gradient-to-br ${slide.color} h-28 flex items-center justify-center border border-amber-950/5 relative overflow-hidden shrink-0`}>
                <div className="absolute top-0 left-0 text-[10px] font-black text-amber-950/30 uppercase tracking-widest p-3">
                  SelfTrack Tutorial
                </div>
                {slide.icon}
              </div>

              {/* Slide content */}
              <div className="space-y-2 mb-6 min-h-[140px] flex flex-col justify-start">
                <h3 className="text-lg font-black text-slate-850 dark:text-[#eceae6] tracking-tight leading-snug">
                  {slide.title}
                </h3>
                <p className="text-xs font-bold text-stone-550 dark:text-stone-300 leading-relaxed font-sans">
                  {slide.desc}
                </p>
              </div>

              {/* Bottom Control Actions & Dots progress */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800 shrink-0">
                <div className="flex gap-1">
                  {onboardingSlides.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${onboardingStep === i ? 'w-5 bg-amber-950 dark:bg-amber-300' : 'w-1.5 bg-stone-200 dark:bg-stone-800'}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {onboardingStep > 0 && (
                    <button
                      onClick={() => setOnboardingStep(prev => prev - 1)}
                      className="px-3 h-8 rounded-xl border border-stone-200/80 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900 text-stone-550 dark:text-stone-300 font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isLastSub ? (
                    <button
                      onClick={() => {
                        safeSetString('selfTrack_onboarding_done', 'true');
                        setShowOnboarding(false);
                      }}
                      className="px-4 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{appLanguage === 'en' ? "Get Started" : "Начать"}</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      className="px-4 h-8 rounded-xl bg-amber-950 hover:bg-stone-800 dark:bg-amber-300 dark:hover:bg-amber-400 dark:text-stone-950 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{appLanguage === 'en' ? 'Next' : 'Далее'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profile Setup Modal for transition to Personal Mode */}
      {showModeSetup && (
        <ProfileSetupModal
          onClose={() => setShowModeSetup(false)}
          onConfirm={(name, email, keepTemplates) => {
            handleStartPersonalMode(name, email, keepTemplates);
            setShowModeSetup(false);
            setShowSettings(false);
          }}
          language={appLanguage}
        />
      )}

      {/* Premium Paywall Modal for subscriptions and upgrades */}
      <PremiumPaywallModal
        isOpen={showPremiumPaywall}
        onClose={() => setShowPremiumPaywall(false)}
        language={appLanguage}
        isPremium={isPremium}
        onActivatePremium={handleActivatePremium}
      />

      {/* iOS App Installation Walkthrough */}
      <IOSInstallGuide
        language={appLanguage === 'en' ? 'en' : 'ru'}
        onClose={() => setShowIOSInstallGuide(false)}
        forceShow={showIOSInstallGuide}
      />
    </div>
  );
}

