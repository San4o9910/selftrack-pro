/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Flame, Award, TrendingUp, Wallet, CheckCircle2,
  Moon, Heart, Sparkles, Brain, RotateCw, Info, Calendar,
  Activity, ArrowDown, ChevronRight, BarChart2, Star
} from 'lucide-react';
import { Habit, Metric, Expense, DayEvent } from '../types';
import { today, computeStreak, rub, pcolor } from '../utils';
import { getTranslation } from '../lib/translations';
import { safeGetJSON, safeSetJSON } from '../lib/storage';

interface AnalyticsViewProps {
  habits: Habit[];
  metrics: Metric[];
  expenses: Expense[];
  events: DayEvent[];
  language?: string;
  isPremium?: boolean;
  onOpenPremium?: () => void;
}

interface AdviceTip {
  category: 'expense' | 'tasks' | 'habits' | 'wellbeing';
  title: string;
  emoji: string;
  description: string;
  action: string;
}

interface AdviceData {
  summary: string;
  tips: AdviceTip[];
}

/**
 * Runtime guard for the advisor payload. Used both for the localStorage cache
 * and the network response so a malformed body can never reach render (where it
 * would crash the tips `.map`).
 */
function isAdviceData(v: unknown): v is AdviceData {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.summary === 'string' && Array.isArray(o.tips);
}

export default function AnalyticsView({
  habits = [],
  metrics = [],
  expenses = [],
  events = [],
  language = 'ru',
  isPremium = false,
  onOpenPremium
}: AnalyticsViewProps) {
  const isRu = language === 'ru';
  const [showAnalyticsHelp, setShowAnalyticsHelp] = useState(false);

  // State for AI Advisor.
  // Cache reads go through the safe layer so a corrupted entry can never throw
  // (the old inline try/catch only covered JSON.parse, not storage access).
  const [advice, setAdvice] = useState<AdviceData | null>(() =>
    safeGetJSON<AdviceData | null>('selfTrack_ai_advice', null, isAdviceData),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against React 18 StrictMode mounting effects twice in development,
  // which previously fired two identical /api/ai-advisor requests on first paint.
  const didAutoFetch = useRef(false);

  // Auto-generate advice once if there is none cached.
  useEffect(() => {
    if (didAutoFetch.current) return;
    didAutoFetch.current = true;
    if (!advice) {
      fetchAIAdvice();
    }
    // Intentionally run-once on mount; `advice` is only read for the initial gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAIAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits,
          metrics,
          expenses,
          events,
          language
        })
      });
      if (!res.ok) {
        throw new Error(isRu ? 'Ошибка при запросе рекомендаций ИИ' : 'Failed to query AI advisor');
      }
      const data = await res.json();
      if (!isAdviceData(data)) {
        throw new Error(isRu ? 'Некорректный ответ сервера' : 'Malformed advisor response');
      }
      setAdvice(data);
      safeSetJSON('selfTrack_ai_advice', data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (isRu ? 'Произошла ошибка' : 'Error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // 1. Calculations: Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate expenses by category
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    expensesByCategory[e.cat] = (expensesByCategory[e.cat] || 0) + e.amount;
  });
  const sortedExpenseCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1]);

  // Top Stores
  const storeStats: Record<string, { amount: number; count: number }> = {};
  expenses.forEach(e => {
    if (!storeStats[e.store]) storeStats[e.store] = { amount: 0, count: 0 };
    storeStats[e.store].amount += e.amount;
    storeStats[e.store].count += 1;
  });
  const sortedStores = Object.entries(storeStats)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 3);

  // 2. Calculations: Tasks/Events
  const totalTasks = events.length;
  const completedTasks = events.filter(e => e.done).length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityTasks = events.filter(e => e.priority === 'high');
  const completedHighPriority = highPriorityTasks.filter(e => e.done).length;
  const highPriorityRate = highPriorityTasks.length ? Math.round((completedHighPriority / highPriorityTasks.length) * 100) : 0;

  // Task category counts
  const taskCategoryStats: Record<string, { total: number; completed: number }> = {};
  events.forEach(e => {
    const cat = e.category || 'general';
    if (!taskCategoryStats[cat]) taskCategoryStats[cat] = { total: 0, completed: 0 };
    taskCategoryStats[cat].total += 1;
    if (e.done) taskCategoryStats[cat].completed += 1;
  });

  // Translate task categories
  const translateTaskCat = (c: string) => {
    const map: Record<string, string> = {
      general: isRu ? 'Общее' : 'General',
      health: isRu ? 'Здоровье' : 'Health',
      mind: isRu ? 'Разум' : 'Mind',
      work: isRu ? 'Работа' : 'Work',
      study: isRu ? 'Учёба' : 'Study',
    };
    return map[c] || c;
  };

  // 3. Calculations: Well-being (Metrics)
  const validMetrics = metrics.filter(m => m.sleep !== undefined || m.mood !== undefined);
  const sleepMetrics = metrics.filter(m => typeof m.sleep === 'number');
  const avgSleep = sleepMetrics.length
    ? (sleepMetrics.reduce((sum, m) => sum + m.sleep!, 0) / sleepMetrics.length).toFixed(1)
    : '0';

  // Mood Stats
  const moodCounts: Record<string, number> = { awful: 0, bad: 0, neutral: 0, good: 0, great: 0 };
  let totalMoodRecords = 0;
  metrics.forEach(m => {
    if (m.mood && moodCounts[m.mood] !== undefined) {
      moodCounts[m.mood] += 1;
      totalMoodRecords += 1;
    }
  });

  const moodLabels: Record<string, { label: string; emoji: string; color: string }> = {
    awful: { label: isRu ? 'Ужасно' : 'Awful', emoji: '😢', color: 'bg-red-400' },
    bad: { label: isRu ? 'Плохо' : 'Bad', emoji: '😕', color: 'bg-orange-400' },
    neutral: { label: isRu ? 'Обычное' : 'Neutral', emoji: '😐', color: 'bg-amber-400' },
    good: { label: isRu ? 'Хорошо' : 'Good', emoji: '🙂', color: 'bg-emerald-400' },
    great: { label: isRu ? 'Супер' : 'Great', emoji: '😀', color: 'bg-teal-500' },
  };

  // 4. Calculations: Habits
  const maxHabitStreak = habits.length
    ? Math.max(...habits.map(h => computeStreak(h.completedDates)), 0)
    : 0;
  const totalHabitTicks = habits.reduce((sum, h) => sum + h.completedDates.length, 0);

  // Habit Category completions
  const habitCatStats: Record<string, number> = { study: 0, health: 0, mind: 0, work: 0, custom: 0 };
  let grandHabitTotal = 0;
  habits.forEach(h => {
    const count = h.completedDates.length;
    habitCatStats[h.category] = (habitCatStats[h.category] || 0) + count;
    grandHabitTotal += count;
  });

  const habitCategoriesMap: Record<string, { label: string; color: string }> = {
    study: { label: isRu ? 'Учёба' : 'Study', color: '#3B82C4' },
    health: { label: isRu ? 'Здоровье' : 'Health', color: '#1D9E75' },
    mind: { label: isRu ? 'Разум' : 'Mind', color: '#7E5BD0' },
    work: { label: isRu ? 'Работа' : 'Work', color: '#E08A2B' },
    custom: { label: isRu ? 'Другое' : 'Custom', color: '#8A8A86' }
  };

  // Activity Infographic Generation (visually clean, easy to read, human-friendly statistics)
  const renderActivityInfographic = () => {
    // --- 1. Recent 7 Days Timeline ---
    const last7Days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const ymd = d.toISOString().split('T')[0];
      
      const habitChecked = habits.filter(h => h.completedDates.includes(ymd)).length;
      const tasksDone = events.filter(e => e.date === ymd && e.done).length;
      const metricsTracked = metrics.find(m => m.date === ymd) ? 1 : 0;
      const score = habitChecked + tasksDone + metricsTracked;
      
      let statusText = isRu ? 'Отдых' : 'Rest';
      let emoji = '💤';
      let colorClass = 'bg-stone-50 dark:bg-stone-900/60 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 border-stone-150 dark:border-stone-800/80';
      
      if (score >= 4) {
        statusText = isRu ? 'Рекорд!' : 'Boom!';
        emoji = '🏆';
        colorClass = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      } else if (score >= 1) {
        statusText = isRu ? 'Активный' : 'Active';
        emoji = '⚡️';
        colorClass = 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-850 dark:text-indigo-300 border-indigo-200 dark:border-indigo-805/40 dark:border-indigo-800/40';
      }
      
      let label = '';
      const diff = 6 - idx;
      if (diff === 0) {
        label = isRu ? 'Сегодня' : 'Today';
      } else if (diff === 1) {
        label = isRu ? 'Вчера' : 'Yest.';
      } else {
        const weekdaysShort = isRu 
          ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        label = weekdaysShort[d.getDay()];
      }
      
      return {
        ymd,
        label,
        score,
        statusText,
        emoji,
        colorClass,
        details: isRu 
          ? `${habitChecked} прив., ${tasksDone} зад., ${metricsTracked} лог`
          : `${habitChecked} habs, ${tasksDone} tsks, ${metricsTracked} met`
      };
    });

    // --- 2. Weekday Aggregated Performance (mon-sun) ---
    const weekdaysIndex = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
    const weekdaysRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdaysFullRu = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
    const weekdaysFullEn = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

    const weekdayStats = weekdaysIndex.map(idx => ({
      dayIndex: idx,
      label: isRu ? weekdaysRu[idx] : weekdaysEn[idx],
      fullLabel: isRu ? weekdaysFullRu[idx] : weekdaysFullEn[idx],
      score: 0,
      count: 0
    }));

    const totalDaysToAnalyze = 30;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - totalDaysToAnalyze + 1);

    for (let i = 0; i < totalDaysToAnalyze; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const ymd = d.toISOString().split('T')[0];
      const wDay = d.getDay(); // 0-6

      const habitChecked = habits.filter(h => h.completedDates.includes(ymd)).length;
      const tasksDone = events.filter(e => e.date === ymd && e.done).length;
      const metricsTracked = metrics.find(m => m.date === ymd) ? 1 : 0;
      const dailySum = habitChecked + tasksDone + metricsTracked;

      const foundIdx = weekdaysIndex.indexOf(wDay);
      if (foundIdx !== -1) {
        weekdayStats[foundIdx].score += dailySum;
        weekdayStats[foundIdx].count += 1;
      }
    }

    const maxScore = Math.max(...weekdayStats.map(w => w.score), 1);
    const bestDayItem = weekdayStats.reduce((best, current) => {
      return current.score > best.score ? current : best;
    }, weekdayStats[0]);

    const totalActivityScore = weekdayStats.reduce((sum, current) => sum + current.score, 0);

    return (
      <div className="space-y-6">
        {/* SECTION A: Chronology row */}
        <div className="space-y-2.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-stone-400 dark:text-stone-500 block text-left">
            {isRu ? '⚡️ ПОСЛЕДНИЕ 7 ДНЕЙ ПОДРЯД' : '⚡️ LAST 7 DAYS TIMELINE'}
          </span>
          <div className="grid grid-cols-7 gap-1.5">
            {last7Days.map((day, idx) => (
              <div
                key={idx}
                title={`${day.ymd}: ${day.score} ${isRu ? 'действий' : 'actions'} (${day.details})`}
                className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all hover:scale-[1.05] duration-250 cursor-pointer ${day.colorClass}`}
              >
                <span className="text-[9px] font-extrabold uppercase tracking-tight text-stone-400 dark:text-stone-300 leading-none">
                  {day.label}
                </span>
                <span className="text-lg my-1.5 select-none leading-none">
                  {day.emoji}
                </span>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black leading-none block">
                    {day.score > 0 ? `+${day.score}` : '—'}
                  </span>
                  <span className="text-[7px] text-stone-400 dark:text-stone-500 uppercase font-bold tracking-tighter leading-none block">
                    {day.score === 1 ? (isRu ? 'акт.' : 'act') : ''}
                    {day.score > 1 ? (isRu ? 'акт.' : 'acts') : ''}
                    {day.score === 0 ? (isRu ? 'выкл' : 'off') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION B: Mon-Sun distribution with progress lines */}
        <div className="relative pt-3.5 border-t border-stone-100 dark:border-stone-850/60 overflow-hidden rounded-2xl min-h-[300px] flex items-stretch">
          <div className={`grid md:grid-cols-2 gap-5 w-full ${!isPremium ? 'blur-[4px] select-none pointer-events-none' : ''}`}>
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest font-black text-stone-400 dark:text-stone-500 block text-left">
                {isRu ? '📊 АКТИВНОСТЬ ПО ДНЯМ НЕДЕЛИ' : '📊 WEEKDAY INTENSITY'}
              </span>
              <div className="space-y-2.5">
                {weekdayStats.map((item, idx) => {
                  const percent = Math.round((item.score / maxScore) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      <span className="w-6 font-bold text-stone-500 dark:text-stone-400 text-left">
                        {item.label}
                      </span>
                      <div className="flex-1 bg-stone-100 dark:bg-stone-900 rounded-full h-2.5 overflow-hidden relative border border-stone-200/20">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 dark:from-amber-600 dark:to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[10px] font-mono font-bold text-stone-600 dark:text-stone-400">
                        {item.score > 0 ? `${item.score}` : '0'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Insights & Streaks */}
            <div className="flex flex-col justify-between py-0.5 space-y-4">
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase tracking-widest font-black text-stone-400 dark:text-stone-500 block text-left">
                  {isRu ? '💡 УМНЫЙ ИНСАЙТ' : '💡 INSIGHT ANALYSIS'}
                </span>
                <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-150 dark:border-stone-850 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-xs font-semibold leading-relaxed text-stone-600 dark:text-stone-300">
                      {totalActivityScore > 0 ? (
                        isRu ? (
                          <>
                            Ваш абсолютный пик активности наступает в <strong className="text-amber-950 dark:text-amber-400">{bestDayItem.fullLabel}</strong>. В этот день вы закрываете максимум привычек и продвигаете свои цели быстрее всего!
                          </>
                        ) : (
                          <>
                            Your productivity metrics peak heavily on <strong className="text-amber-950 dark:text-indigo-400">{bestDayItem.fullLabel}</strong>. You tend to be the most consistent and finish checklists faster then.
                          </>
                        )
                      ) : (
                        isRu ? (
                          'Начните записывать свой сон, вес, отмечать привычки или выполнять задачи на этой неделе, чтобы получить первый инсайт о вашей личной биоритмике!'
                        ) : (
                          'Log your sleep patterns, list weights, or complete task schedules to activate smart calculations!'
                        )
                      )}
                    </div>
                  </div>

                  <div className="border-t border-stone-200/50 dark:border-stone-800 pt-3 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-stone-400">
                      {isRu ? 'Общее число отметок:' : 'Total tracked logs:'}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded leading-none">
                      {grandHabitTotal + events.filter(e => e.done).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100/10 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-left">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-stone-550 dark:text-stone-300">
                    {isRu ? 'Продуктивность месяца:' : 'Month consistency:'}
                  </span>
                </div>
                <span className="text-indigo-750 dark:text-indigo-300 font-extrabold">
                  {totalActivityScore > 15 ? (isRu ? 'Высокая 🚀' : 'Superb 🚀') : (isRu ? 'Стабильная 👍' : 'Stable 👍')}
                </span>
              </div>
            </div>
          </div>

          {!isPremium && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/40 dark:bg-black/35 backdrop-blur-[2.5px]">
              <div className="bg-white/95 dark:bg-[#1a1917]/95 border border-amber-950/10 dark:border-stone-800 p-5 rounded-3xl shadow-xl max-w-sm text-center space-y-4">
                <span className="inline-flex p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1 mx-auto leading-none items-center">
                  <Sparkles className="w-3.5 h-3.5" />
                  PRO
                </span>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-850 dark:text-stone-100 uppercase tracking-wide">
                    {isRu ? 'Умная Инфографика & Пики' : 'Dynamic Consistency Peak Insights'}
                  </h4>
                  <p className="text-[10.5px] leading-relaxed text-stone-500 dark:text-stone-400 font-semibold">
                    {isRu
                      ? 'Подключите PRO для анализа биоритмов, расчёта лучшего дня недели, рекомендаций ИИ-советника и просмотра полной сводки активности!'
                      : 'Sync your daily routines into visual heatmaps, compute your individual weekly peaks, and unlock custom-written AI advisors!'}
                  </p>
                </div>
                {onOpenPremium && (
                  <button
                    onClick={onOpenPremium}
                    className="w-full bg-amber-950 text-white hover:bg-amber-900 text-[10.5px] font-black uppercase tracking-wider py-2.5 rounded-xl transition duration-200 cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                    <span>{isRu ? 'Активировать PRO' : 'Unlock Lifetime PRO'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left pb-12 font-sans">
      
      {/* 1. Header Banner & Dynamic Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-indigo-950 via-slate-900 to-stone-900 text-white rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
        {/* Abstract background blur shapes */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        
        {/* Help button for Analytics */}
        <button
          onClick={() => setShowAnalyticsHelp(!showAnalyticsHelp)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer z-20"
          title={isRu ? 'О разделе' : 'About section'}
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {showAnalyticsHelp && (
          <div className="absolute right-4 top-14 z-30 w-[92%] sm:w-80 bg-slate-950 text-slate-100 border border-indigo-500/20 rounded-2xl p-4 shadow-2xl text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span className="font-extrabold text-white flex items-center gap-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                {isRu ? 'Панель Аналитики ИИ' : 'AI Analytics Dashboard'}
              </span>
              <button
                onClick={() => setShowAnalyticsHelp(false)}
                className="text-white/40 hover:text-white font-extrabold text-sm hover:bg-white/10 rounded px-1 cursor-pointer"
              >
                ×
              </button>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-300 font-semibold leading-relaxed font-sans">
              <li>
                <strong>{isRu ? 'ИИ Рекомендации:' : 'AI Suggestions:'}</strong> {isRu ? 'Кнопка справа запускает сессию ИИ Gemini, которая оценивает финансовые траты и соблюдение графика привычек.' : 'The action button evaluates cash habits, sleep efficiency indices and recurring timelines via Gemini.'}
              </li>
              <li>
                <strong>{isRu ? 'Календарь активности:' : 'Activity Grid:'}</strong> {isRu ? 'Цветная тепловая карта внизу отражает общие успехи: отметки привычек и завершенные задачи за полгода.' : 'The thermal grid highlights compound successes: completed streaks and checked lists of the last 18 weeks.'}
              </li>
              <li>
                <strong>{isRu ? 'Показатели качества жизни:' : 'Daily Metrics:'}</strong> {isRu ? 'Графики сопоставляют часы сна и выпитую воду, помогая контролировать здоровье.' : 'Interactive charts combine bed hours and water intakes directly, revealing health patterns.'}
              </li>
            </ul>
          </div>
        )}
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-505/20 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-400/20">
              {isRu ? 'Интеллектуальная панель' : 'Intelligent Dashboard'}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1.5">
            {isRu ? 'Аналитика и Баланс Жизни' : 'Life Balance & Analytics'}
          </h2>
          <p className="text-slate-400 text-xs font-semibold max-w-md">
            {isRu 
              ? 'Полный обзор привычек, расходов, задач и физиологического состояния с экспертными рекомендациями искусственного интеллекта.' 
              : 'Full telemetry of your financial discipline, productivity, body states and personal habits.'}
          </p>
        </div>

        <button
          onClick={fetchAIAdvice}
          disabled={loading}
          className="relative shrink-0 overflow-hidden group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95 disabled:pointer-events-none cursor-pointer self-start sm:self-center"
        >
          <RotateCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? 'animate-spin' : 'group-hover:rotate-45 transition-transform'}`} />
          {loading 
            ? (isRu ? 'ИИ думает...' : 'AI thinking...') 
            : (isRu ? 'Обновить советы ИИ' : 'Generate AI Report')}
        </button>
      </div>

      {/* 2. Top-level Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Expenses KPI */}
        <div className="bg-white border border-stone-200/50 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">{isRu ? 'ОБЩИЕ РАСХОДЫ' : 'TOTAL EXPENSES'}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-slate-800 tracking-tight block">
              {rub(totalExpenses)}
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              {expenses.length} {isRu ? 'операций внесено' : 'items logged'}
            </span>
          </div>
        </div>

        {/* Tasks Completion KPI */}
        <div className="bg-white border border-stone-200/50 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">{isRu ? 'ВЫПОЛНЕНИЕ ЗАДАЧ' : 'TASK RESOLUTION'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-slate-800 tracking-tight block">
              {taskCompletionRate}%
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              {completedTasks} {isRu ? 'из' : 'of'} {totalTasks} {isRu ? 'задач закрыто' : 'tasks checked'}
            </span>
          </div>
        </div>

        {/* Well-being Sleep KPI */}
        <div className="bg-white border border-stone-200/50 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">{isRu ? 'СРЕДНИЙ СОН' : 'SLEEP DURATION'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Moon className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-slate-800 tracking-tight block">
              {avgSleep} {isRu ? 'ч' : 'hrs'}
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              {sleepMetrics.length} {isRu ? 'ночей замерено' : 'records logged'}
            </span>
          </div>
        </div>

        {/* Habit Streak KPI */}
        <div className="bg-white border border-stone-200/50 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-stone-400">{isRu ? 'УДАРНЫЙ РЕЖИМ' : 'DAILY STREAK'}</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-650 text-orange-650 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-500 stroke-none" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-slate-800 tracking-tight block">
              {maxHabitStreak} {isRu ? 'дней' : 'days'}
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              {totalHabitTicks} {isRu ? 'привычек выполнено' : 'total habit checks'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. AI Advisor / ИИ Советчик Section (HIGH VALUE ADVISOR CARDS) */}
      <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-stone-50 border border-indigo-100 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-violet-4 stroke-none bg-violet-300/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 fill-white stroke-none" />
            </div>
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">{isRu ? 'Профессиональный ИИ Советчик' : 'Pro AI Coach & Advisor'}</h3>
          </div>
          {advice && (
            <span className="text-[10px] bg-indigo-100 text-indigo-850 font-extrabold px-2 py-0.5 rounded-full">
              {isRu ? 'Анализ готов' : 'Analysis complete'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 relative z-10 gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200/50 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-650 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-500 animate-bounce" />
            </div>
            <div className="text-center space-y-1 mt-2">
              <p className="text-xs font-black text-indigo-950">{isRu ? 'ИИ изучает взаимосвязи ваших данных...' : 'AI is processing patterns...'}</p>
              <p className="text-[10px] text-stone-500 max-w-xs">{isRu ? 'Мы сопоставляем ваши расходы, режим сна, настроение и выполненные задачи для поиска аномалий.' : 'We are analyzing correlation between expenses, habits, sleep schedules and completed goals.'}</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white/85 border border-red-100 rounded-2xl p-4 text-center space-y-3 relative z-10 shadow-sm">
            <Info className="w-6 h-6 text-red-500 mx-auto" />
            <div>
              <p className="text-xs font-black text-red-950">{isRu ? 'Не удалось сгенерировать рекомендации ИИ' : 'Could not generate advice'}</p>
              <p className="text-[10px] text-stone-550 text-stone-500 mt-1 max-w-sm mx-auto">
                {isRu 
                  ? 'Убедитесь, что настроен API-ключ Gemini или попробуйте еще раз. Приложение имеет встроенный резервный алгоритм.' 
                  : 'Ensure Gemini API key is configured or click generate. Built-in smart fallback is also available.'}
              </p>
            </div>
            <button
              onClick={fetchAIAdvice}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              {isRu ? 'Повторить попытку' : 'Retry connection'}
            </button>
          </div>
        ) : advice ? (
          <div className="space-y-4 relative z-10">
            {/* General AI Summary text */}
            <div className="bg-white/80 backdrop-blur border border-indigo-50/50 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed text-slate-800">
                  {advice.summary}
                </p>
              </div>
            </div>

            {/* AI Advisor Tips Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {advice.tips.map((tip, i) => {
                // Determine layout styles based on category
                const designMap: Record<string, { bg: string; border: string; accent: string; iconBg: string }> = {
                  expense: {
                    bg: 'bg-emerald-50/60 hover:bg-emerald-50/90',
                    border: 'border-emerald-100',
                    accent: 'text-emerald-800 bg-emerald-100/70',
                    iconBg: 'bg-emerald-100 text-emerald-800'
                  },
                  tasks: {
                    bg: 'bg-amber-50/60 hover:bg-amber-50/90',
                    border: 'border-amber-100',
                    accent: 'text-amber-800 bg-amber-100/70',
                    iconBg: 'bg-amber-100 text-amber-850 text-amber-800'
                  },
                  wellbeing: {
                    bg: 'bg-purple-50/60 hover:bg-purple-50/90',
                    border: 'border-purple-100',
                    accent: 'text-purple-800 bg-purple-100/70',
                    iconBg: 'bg-purple-100 text-purple-800'
                  },
                  habits: {
                    bg: 'bg-rose-50/60 hover:bg-rose-50/90',
                    border: 'border-rose-100',
                    accent: 'text-rose-800 bg-rose-100/70',
                    iconBg: 'bg-rose-100 text-rose-800'
                  }
                };
                const config = designMap[tip.category] || designMap.wellbeing;
                
                const catLabelMap: Record<string, string> = {
                  expense: isRu ? 'Финансы' : 'Finance',
                  tasks: isRu ? 'Продуктивность' : 'Tasks Focus',
                  wellbeing: isRu ? 'Самочувствие' : 'Wellness',
                  habits: isRu ? 'Рутина и привычки' : 'Habit Routine'
                };

                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 border transition-all duration-300 ${config.bg} ${config.border} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${config.accent}`}>
                          {catLabelMap[tip.category] || tip.category}
                        </span>
                        <span className="text-xl leading-none">{tip.emoji}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1 mb-1">
                        {tip.title}
                      </h4>
                      <p className="text-[10.5px] leading-relaxed text-slate-550 text-stone-500 font-semibold mb-3 mr-1">
                        {tip.description}
                      </p>
                    </div>

                    <div className="border-t border-dashed border-stone-200/50 pt-2.5 mt-auto">
                      <span className="text-[8px] block font-black uppercase tracking-wider text-slate-400 mb-1">
                        {isRu ? 'РЕКОМЕНДОВАННОЕ ДЕЙСТВИЕ' : 'ACTION POINT'}
                      </span>
                      <p className="text-[10px] font-black text-indigo-950 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0 stroke-[3]" />
                        {tip.action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. Bento Grid: Metrics Telemetry Detail Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* FIRST COLUMN GRP: Expenses & Stores */}
        <div className="space-y-6">
          {/* Card: Financial Breakdown */}
          <div className="bg-white border border-stone-200/50 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600 stroke-[2]" />
                {isRu ? 'КАРТА ТРАТ И РАСХОДОВ' : 'FINANCIAL AND EXPENSES'}
              </span>
              <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {isRu ? 'Влияние на бюджет' : 'Budget footprint'}
              </span>
            </div>

            <div className="flex justify-between items-end border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-stone-400 block uppercase tracking-wider">
                  {isRu ? 'ВСЕГО ИЗРАСХОДОВАНО' : 'TOTAL MONEY OUTFLOW'}
                </span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {rub(totalExpenses)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-stone-400 block uppercase tracking-wider">
                  {isRu ? 'СРЕДНИЙ ЧЕК' : 'AVERAGE TRANSACTION'}
                </span>
                <span className="text-xs font-black font-mono text-stone-605">
                  {expenses.length ? rub(totalExpenses / expenses.length) : '0 ₽'}
                </span>
              </div>
            </div>

            {/* Grouped Category Bars */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {isRu ? 'РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ' : 'CATEGORIES SPREAD'}
              </h4>
              {sortedExpenseCategories.map(([catName, amount]) => {
                const pct = totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0;
                const progressColor = pcolor(catName);
                
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-705">
                      <span className="flex items-center gap-1.5 text-stone-700 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: progressColor }} />
                        {catName}
                      </span>
                      <span className="font-mono text-slate-800 font-black">
                        {rub(amount)} <span className="text-[10px] font-bold text-stone-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: progressColor }}
                      />
                    </div>
                  </div>
                );
              })}
              {sortedExpenseCategories.length === 0 && (
                <p className="text-xs font-bold text-stone-400 py-4 text-center">
                  {isRu ? 'Журнал расходов пуст.' : 'No expenses logged yet.'}
                </p>
              )}
            </div>

            {/* Top Shopping hot-spots */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {isRu ? 'ЧАСТЫЕ ТОЧКИ ПОКУПОК' : 'SPENDING HOTSPOTS'}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {sortedStores.map(([storeName, stat]) => (
                  <div key={storeName} className="bg-stone-50 border border-stone-100 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] font-black text-stone-800 block truncate" title={storeName}>
                      {storeName}
                    </span>
                    <span className="text-[11px] font-black text-indigo-900 block mt-0.5">
                      {rub(stat.amount)}
                    </span>
                    <span className="text-[8px] font-bold text-stone-400 block mt-0.5 uppercase tracking-wide">
                      {stat.count} {isRu ? 'раз(а)' : 'buys'}
                    </span>
                  </div>
                ))}
                {sortedStores.length === 0 && (
                  <p className="col-span-3 text-[10px] text-stone-400 py-3 text-center">
                    {isRu ? 'Недостаточно данных по магазинам.' : 'No store statistics.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Well-being Analysis */}
          <div className="bg-white border border-stone-200/50 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500 stroke-none" />
                {isRu ? 'БАЛАНС САМОЧУВСТВИЯ' : 'WELL-BEING & ESSENTIALS'}
              </span>
              <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {isRu ? 'Физиология' : 'Biometrics'}
              </span>
            </div>

            {/* Sleep Summary Details */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-stone-100">
              <div className="bg-purple-50/50 border border-purple-100/50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-purple-600 block leading-none">{isRu ? 'СРЕДНИЙ СОН' : 'SLEEP HOURS'}</span>
                  <span className="text-sm font-black text-purple-950 font-mono tracking-tight mt-0.5 block">{avgSleep} ч</span>
                </div>
              </div>
              <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-600 block leading-none">{isRu ? 'ЗАПИСЕЙ НАСТРОЕНИЯ' : 'REGISTRY COUNT'}</span>
                  <span className="text-sm font-black text-amber-950 font-mono tracking-tight mt-0.5 block">{totalMoodRecords} дн</span>
                </div>
              </div>
            </div>

            {/* Mood Frequency Bars */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {isRu ? 'РАСПРЕДЕЛЕНИЕ НАСТРОЕНИЯ' : 'MOOD DISTRIBUTION'}
              </h4>
              <div className="space-y-1.5">
                {Object.entries(moodLabels).map(([moodKey, cfg]) => {
                  const count = moodCounts[moodKey] || 0;
                  const pct = totalMoodRecords ? Math.round((count / totalMoodRecords) * 100) : 0;
                  
                  return (
                    <div key={moodKey} className="flex items-center gap-2 text-xs">
                      <span className="text-sm leading-none w-4 shrink-0">{cfg.emoji}</span>
                      <span className="w-16 font-bold text-stone-705 truncate">{cfg.label}</span>
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cfg.color}`}
                          style={{ width: `${pct || 1}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-black text-slate-800 w-8 text-right bg-stone-50 px-1 py-0.25 rounded border border-stone-100">
                        {count} {isRu ? 'д' : 'd'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {totalMoodRecords === 0 && (
                <p className="text-xs font-bold text-stone-400 py-3 text-center">
                  {isRu ? 'Нет зарегистрированных оценок настроения.' : 'No mood evaluations stored.'}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* SECOND COLUMN GRP: Tasks & Productivity and Heatmap */}
        <div className="space-y-6">
          {/* Card: Productivity and Tasks */}
          <div className="bg-white border border-stone-200/50 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2]" />
                {isRu ? 'ПРОДУКТИВНОСТЬ И НАГРУЗКА' : 'TASKS & PRODUCTIVITY'}
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {isRu ? 'Эффективность' : 'Execution'}
              </span>
            </div>

            {/* Big progress completion ring */}
            <div className="flex items-center gap-5 bg-stone-50/50 border border-stone-100 rounded-2xl p-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                  <path
                    className="text-stone-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${taskCompletionRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-800 leading-none">{taskCompletionRate}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 leading-tight">
                  {isRu ? 'Коэффициент закрытия задач' : 'Cumulative Success Rate'}
                </h4>
                <p className="text-[10.5px] leading-snug text-stone-550 text-stone-400 font-bold">
                  {isRu
                    ? `Вы успешно завершили ${completedTasks} из ${totalTasks} созданных задач. Фокусируйтесь сначала на высокоприоритетных делах!`
                    : `You completed ${completedTasks} off of ${totalTasks} tasks. Focus on highest priority triggers first.`}
                </p>
              </div>
            </div>

            {/* Priority performance rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-black uppercase text-red-600 tracking-wider block">{isRu ? 'ВАЖНЫЕ ДЕЛА' : 'HIGH PRIORITY'}</span>
                <span className="text-xl font-black text-slate-800 block mt-1 tracking-tight">{highPriorityRate}%</span>
                <span className="text-[8px] font-medium text-stone-400 block mt-0.5">
                  {isRu 
                    ? `закрыто ${completedHighPriority} из ${highPriorityTasks.length}` 
                    : `${completedHighPriority} out of ${highPriorityTasks.length} done`}
                </span>
              </div>
              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-black uppercase text-indigo-650 text-indigo-600 tracking-wider block">{isRu ? 'КАТЕГОРИЙ ЗАДАЧ' : 'TASK SPECIES'}</span>
                <span className="text-xl font-black text-slate-800 block mt-1 tracking-tight">
                  {Object.keys(taskCategoryStats).length}
                </span>
                <span className="text-[8px] font-medium text-stone-400 block mt-0.5">
                  {isRu ? 'задействовано в трекере' : 'active category types'}
                </span>
              </div>
            </div>

            {/* Categorized Performance Detail */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {isRu ? 'АКТИВНОСТЬ ПО НАПРАВЛЕНИЯМ ЗАДАЧ' : 'TASK RESOLUTION BY SPHERE'}
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(taskCategoryStats).map(([catKey, stat]) => {
                  const rate = stat.total ? Math.round((stat.completed / stat.total) * 100) : 0;
                  return (
                    <div key={catKey} className="flex flex-col justify-between p-2 bg-stone-50/50 rounded-xl border border-stone-100">
                      <div className="flex justify-between items-center text-xs font-bold text-stone-705">
                        <span className="text-stone-700 capitalize font-bold leading-none">{translateTaskCat(catKey)}</span>
                        <span className="font-mono text-[10px] bg-emerald-50 text-emerald-850 px-1 py-0.25 rounded leading-none">
                          {rate}%
                        </span>
                      </div>
                      <div className="text-[9px] text-stone-400 font-bold mt-1.5 leading-none">
                        {stat.completed} {isRu ? 'выполнено из' : 'done of'} {stat.total}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(taskCategoryStats).length === 0 && (
                  <p className="col-span-2 text-xs font-bold text-stone-400 py-3 text-center">
                    {isRu ? 'Активных задач нет.' : 'No active tasks logged.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Habits & Activities Infographic - much clearer for final users */}
          <div className="bg-white border border-amber-950/10 dark:border-stone-800/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
                {isRu ? 'ИНФОГРАФИКА ЕЖЕДНЕВНОЙ АКТИВНОСТИ' : 'DAILY LOGS & HABITS INSIGHTS'}
              </span>
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-100 dark:border-transparent">
                {isRu ? '30 дней' : '30-day view'}
              </span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 font-semibold text-left">
              {isRu 
                ? 'Умный дашборд анализирует регулярность ваших записей, привычек и закрытых задач. Всё наглядно, без запутанных матриц!' 
                : 'Smart infographic metrics summarizing your habit consistency, event checklists, and daily physiological logs.'}
            </p>

            {renderActivityInfographic()}
          </div>
        </div>

      </div>

    </div>
  );
}
