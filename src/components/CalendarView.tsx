/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  List, Wallet, Heart, Award, ArrowLeft, ArrowRight, Plus, Check,
  Trash2, Compass, School, Activity, Briefcase, Sparkles, Pencil,
  Trophy, Clock, MapPin, Edit3, Droplet, Moon, Info
} from 'lucide-react';
import { DayEvent, Expense, Metric, Goal, StoreCatalogItem } from '../types';
import {
  MONTHS, WEEKDAYS_SHORT, calGrid, rub, ymd, today, pcolor, shift,
  sleepDuration
} from '../utils';
import { GOAL_CATEGORIES } from '../data';
import { getTranslation } from '../lib/translations';

interface CalendarViewProps {
  events: DayEvent[];
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  onOpenDay: (ymd: string) => void;
  expenses: Expense[];
  onOpenExpPeriod: () => void;
  onOpenExpAdd: () => void;
  onOpenExpStores: () => void;
  stores: StoreCatalogItem[];
  onOpenDrill: (cat: string) => void;
  selectedPeriodLabel: string;
  selectedPeriodDates: { from: string; to: string; period: string };
  onOpenHealthDay: (ymd: string) => void;
  metrics: Metric[];
  saveWeight: (w: number) => void;
  onAddWater: (ml: number) => void;
  onUpdateSleepTimes: (bed: string, wake: string) => void;
  onUpdateSleepHours: (hours: number) => void;
  onSetMood: (mood: 'awful' | 'bad' | 'neutral' | 'good' | 'great') => void;
  goals: Goal[];
  onSetGoalProgress: (id: string, progress: number) => void;
  onOpenGoalEdit: (id: string) => void;
  onOpenGoalCreate: () => void;
  language?: string;
}

export default function CalendarView({
  events,
  toggleTask,
  deleteTask,
  onOpenDay,
  expenses,
  onOpenExpPeriod,
  onOpenExpAdd,
  onOpenExpStores,
  stores,
  onOpenDrill,
  selectedPeriodLabel,
  selectedPeriodDates,
  onOpenHealthDay,
  metrics,
  saveWeight,
  onAddWater,
  onUpdateSleepTimes,
  onUpdateSleepHours,
  onSetMood,
  goals,
  onSetGoalProgress,
  onOpenGoalEdit,
  onOpenGoalCreate,
  language = 'ru'
}: CalendarViewProps) {
  const t = (k: string) => getTranslation(k, language);
  // Sub-navigation bar state
  const [sub, setSub] = useState<string>('tasks');

  // Tasks calendar month selection
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Health calendar month selection
  const [hCalYear, setHCalYear] = useState(new Date().getFullYear());
  const [hCalMonth, setHCalMonth] = useState(new Date().getMonth());

  // Show help overlay state
  const [showHelp, setShowHelp] = useState(false);
  const [showHealthHelp, setShowHealthHelp] = useState(false);


  // Body metrics trend active tab
  const [metricTab, setMetricTab] = useState<'weight' | 'water'>('weight');

  // Weight entry state input
  const [weightInput, setWeightInput] = useState('');

  const todayYmd = today();
  const todayMetric = metrics.find(m => m.date === todayYmd) || { date: todayYmd };
  const todayWater = todayMetric.water || 0;
  const todaySleep = typeof todayMetric.sleep === 'number' ? todayMetric.sleep : null;
  const todayBed = todayMetric.bed || '';
  const todayWake = todayMetric.wake || '';

  // Local state for Sleep and Mood collapses in CalendarView
  const [localBed, setLocalBed] = useState(todayBed || '23:00');
  const [localWake, setLocalWake] = useState(todayWake || '07:05');
  const [sleepCollapsed, setSleepCollapsed] = useState(todaySleep !== null);
  const [editingMood, setEditingMood] = useState(false);

  useEffect(() => {
    if (todayBed) setLocalBed(todayBed);
    if (todayWake) setLocalWake(todayWake);
  }, [todayBed, todayWake]);

  useEffect(() => {
    if (todaySleep !== null) {
      setSleepCollapsed(true);
    } else {
      setSleepCollapsed(false);
    }
  }, [todaySleep]);

  const moodsList: { id: 'awful' | 'bad' | 'neutral' | 'good' | 'great'; emoji: string }[] = [
    { id: 'awful', emoji: '😢' },
    { id: 'bad', emoji: '😕' },
    { id: 'neutral', emoji: '😐' },
    { id: 'good', emoji: '🙂' },
    { id: 'great', emoji: '🤩' }
  ];

  // Selected metric detail modal state
  const [selectedMetricDetail, setSelectedMetricDetail] = useState<'weight' | 'water' | 'sleep' | 'mood' | null>(null);

  // ---------- helper functions for task colors ----------
  const getTasksOn = (ds: string) => events.filter(e => e.date === ds);
  
  const getDayCellShadeClass = (ds: string) => {
    const list = getTasksOn(ds);
    if (!list.length) return {};
    const highCount = list.filter(e => e.priority === 'high').length;
    const normCount = list.length - highCount;

    if (highCount > 0 && normCount === 0) {
      return { background: 'rgba(254, 226, 226, 0.7)', border: '1px solid rgba(248, 113, 113, 0.3)' };
    }
    if (normCount > 0 && highCount === 0) {
      return { background: 'rgba(209, 250, 229, 0.7)', border: '1px solid rgba(52, 211, 153, 0.3)' };
    }
    return {
      background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.7), rgba(209, 250, 229, 0.7))',
      border: '1px solid rgba(248, 113, 113, 0.25)'
    };
  };

  // Month navigation helpers
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const prevHMonth = () => {
    if (hCalMonth === 0) {
      setHCalMonth(11);
      setHCalYear(prev => prev - 1);
    } else {
      setHCalMonth(prev => prev - 1);
    }
  };

  const nextHMonth = () => {
    if (hCalMonth === 11) {
      setHCalMonth(0);
      setHCalYear(prev => prev + 1);
    } else {
      setHCalMonth(prev => prev + 1);
    }
  };

  // Filter expenses matching the selected active filter duration bounds
  const getFilteredExpenses = () => {
    const startLimit = selectedPeriodDates.from;
    const endLimit = selectedPeriodDates.to;
    return expenses.filter(x => {
      if (selectedPeriodDates.period === 'day') return x.date === today();
      if (selectedPeriodDates.period === 'week') return x.date >= shift(-6) && x.date <= today();
      if (selectedPeriodDates.period === 'month') return x.date.slice(0, 7) === today().slice(0, 7);
      if (selectedPeriodDates.period === 'year') return x.date.slice(0, 4) === today().slice(0, 4);
      return x.date >= startLimit && x.date <= endLimit;
    });
  };

  const getGoalStatusDays = (g: Goal) => {
    if (g.status === 'completed') return { t: 'Выполнено', c: 'text-emerald-600' };
    const diff = Math.round((new Date(g.target).getTime() - new Date(today()).getTime()) / 86400000);
    if (diff < 0) return { t: `Просрочено на ${Math.abs(diff)} дн.`, c: 'text-red-500 font-bold' };
    if (diff === 0) return { t: 'Дедлайн сегодня', c: 'text-amber-505 font-black' };
    if (diff === 1) return { t: 'Остался 1 день', c: 'text-amber-500 font-bold' };
    return { t: `Осталось ${diff} дней`, c: 'text-stone-400 font-semibold' };
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="sticky -top-4 z-20 bg-white/95 dark:bg-[#1c1a18]/95 backdrop-blur-md border border-amber-950/10 dark:border-stone-800/80 rounded-2xl p-1 flex gap-1 shadow-md">
        <button
          onClick={() => setSub('tasks')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
            sub === 'tasks'
              ? 'bg-amber-950 text-white border-amber-950 dark:bg-amber-900 dark:border-amber-950/20'
              : 'text-stone-500 dark:text-stone-400 border-transparent hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <List className="w-4 h-4" />
          <span>{language === 'ru' ? 'Задачи' : 'Tasks'}</span>
        </button>
        <button
          onClick={() => setSub('health')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
            sub === 'health'
              ? 'bg-amber-950 text-white border-amber-950 dark:bg-amber-900 dark:border-amber-950/20'
              : 'text-stone-500 dark:text-stone-400 border-transparent hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{language === 'ru' ? 'Здоровье' : 'Health'}</span>
        </button>
      </div>

      {/* ========== TAB: TASKS ========== */}
      {sub === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white border border-amber-950/10 rounded-2xl p-3 sm:p-4 shadow-sm text-left relative">
            <div className="flex items-center justify-between mb-4 pr-8">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest">Календарь задач</span>
              <div className="flex items-center gap-2.5 bg-stone-100 rounded-xl px-2 py-1">
                <button onClick={prevMonth} className="text-stone-550 hover:text-stone-850 p-1">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black font-sans text-slate-800 min-w-[100px] text-center">
                  {MONTHS[calMonth]} {calYear}
                </span>
                <button onClick={nextMonth} className="text-stone-550 hover:text-stone-850 p-1">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-stone-100 hover:bg-amber-100/50 text-stone-550 hover:text-amber-900 border border-stone-200/50 flex items-center justify-center transition-all cursor-pointer z-10"
              title="Как пользоваться"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {showHelp && (
              <div className="absolute right-3 top-12 z-30 w-[92%] sm:w-80 bg-stone-50 dark:bg-stone-900 border border-stone-205 dark:border-stone-850 rounded-2xl p-4 shadow-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 flex-nowrap">
                  <span className="font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300 shrink-0" />
                    Как пользоваться календарем задач:
                  </span>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 font-extrabold text-sm p-1 leading-none hover:bg-stone-200 dark:hover:bg-stone-800 rounded transition-all cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                <ul className="list-disc pl-4 space-y-2 text-[11px] text-stone-600 dark:text-stone-300 font-semibold leading-relaxed">
                  <li>
                    <strong className="text-stone-850 dark:text-stone-200">Выбор дня:</strong> Нажмите на любую ячейку дня в сетке календаря, чтобы мгновенно посмотреть, выполнить или добавить задачи на этот день.
                  </li>
                  <li>
                    <strong className="text-stone-850 dark:text-stone-200">Обозначения на мобильных:</strong> На смартфонах выполненные задачи отображаются серыми точками, а активные — цветными: <span className="text-rose-500 font-extrabold">красный</span> (срочная), <span className="text-amber-500 font-extrabold">оранжевый</span> (средняя) и <span className="text-emerald-500 font-extrabold">зеленая</span> (обычная).
                  </li>
                  <li>
                    <strong className="text-stone-850 dark:text-stone-200">Быстрый переход:</strong> Используйте стрелки для переключения месяцев, а кнопку <strong className="text-stone-850 dark:text-stone-200">«Сегодня»</strong> — для возврата к текущей дате.
                  </li>
                  <li>
                    <strong className="text-stone-850 dark:text-stone-200">Сводный список:</strong> Ниже представлен подробный список всех задач за выбранный месяц.
                  </li>
                </ul>
              </div>
            )}

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS_SHORT.map(w => (
                <div key={w} className="text-[10px] uppercase tracking-widest text-stone-300 font-black">
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calGrid(calYear, calMonth).map((cell, idx) => {
                const cellYmd = ymd(cell.d);
                const isSelected = cellYmd === today();
                const dayTasks = getTasksOn(cellYmd);
                const shadeStyle = dayTasks.length > 0 ? getDayCellShadeClass(cellYmd) : {};
                const baseClass = `min-h-[56px] sm:min-h-[105px] rounded-xl text-xs flex flex-col justify-between p-1 sm:p-1.5 hover:bg-stone-50/80 transition-all text-left relative ${
                  cell.cur ? 'bg-[#fbfbfa]/65 text-slate-800' : 'bg-[#fbfbfa]/25 text-stone-300 opacity-60'
                } ${isSelected ? 'ring-2 ring-amber-950 ring-offset-2 select-none font-bold' : 'border border-stone-105 border-stone-200/40'}`;

                return (
                  <button
                    key={idx}
                    onClick={() => onOpenDay(cellYmd)}
                    style={shadeStyle}
                    className={baseClass}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-black ${cell.cur ? 'text-slate-800' : 'text-stone-400'}`}>
                        {cell.d.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      )}
                    </div>
                    
                    {/* Render up to 3 task snippet badges (Desktop only) */}
                    <div className="hidden sm:flex flex-1 flex-col gap-0.5 mt-1 overflow-hidden w-full">
                      {dayTasks.slice(0, 3).map(e => {
                        return (
                          <div
                            key={e.id}
                            className={`text-[8.5px] leading-tight font-extrabold px-1 py-0.5 rounded truncate ${
                              e.done 
                                ? 'bg-stone-200/40 text-stone-400 line-through'
                                : e.priority === 'high'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100 font-black'
                                  : e.priority === 'medium'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <div className="text-[7.5px] font-black text-stone-400 text-center leading-none mt-0.5">
                          +{dayTasks.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Render visual indicators for mobile (Mobile only) */}
                    <div className="flex sm:hidden items-center justify-center gap-0.5 mt-1.5 flex-wrap w-full">
                      {dayTasks.slice(0, 4).map(e => {
                        return (
                          <span
                            key={e.id}
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              e.done
                                ? 'bg-stone-300'
                                : e.priority === 'high'
                                  ? 'bg-rose-500'
                                  : e.priority === 'medium'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                            }`}
                          />
                        );
                      })}
                      {dayTasks.length > 4 && (
                        <span className="text-[7px] font-black text-stone-400 leading-none">
                          +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend marker list */}
            <div className="flex gap-4 flex-wrap border-t border-stone-100 mt-4 pt-3 text-[10px] font-bold text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-red-400"></span>Срочные
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-400"></span>Обычные
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-gradient-to-r from-red-400 to-emerald-400"></span>Смешанные
              </span>
            </div>
          </div>

          {/* Monthly task list summary */}
          <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm text-left">
            <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest">
                Журнал задач · {MONTHS[calMonth]}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black bg-stone-100 text-stone-500 rounded-full px-2 py-0.5">
                  {events.filter(e => e.date.substring(0, 7) === `${calYear}-${String(calMonth + 1).padStart(2, '0')}`).length}
                </span>
                <button
                  onClick={() => onOpenDay(today())}
                  className="p-1 text-amber-900"
                  title="Быстрая задача сегодня"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar">
              {events
                .filter(e => e.date.substring(0, 7) === `${calYear}-${String(calMonth + 1).padStart(2, '0')}`)
                .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
                .map(e => (
                  <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-stone-50 last:border-0">
                    <button
                      onClick={() => toggleTask(e.id)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        e.done ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300 bg-white'
                      }`}
                    >
                      {e.done && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold leading-tight ${e.done ? 'text-stone-300 line-through' : 'text-slate-700'}`}>
                        {e.title}
                      </div>
                      <div className="text-[9px] text-stone-400 font-bold font-mono mt-0.5">
                        {e.date.split('-')[2]}.{e.date.split('-')[1]} · {e.start} · {e.priority}
                      </div>
                    </div>
                    <button onClick={() => deleteTask(e.id)} className="text-stone-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: EXPENSES ========== */}
      {sub === 'expenses' && (() => {
        const filteredEx = getFilteredExpenses();
        const totalEx = filteredEx.reduce((sum, x) => sum + x.amount, 0);

        // Compute categories
        const catSums: Record<string, number> = {};
        filteredEx.forEach(x => {
          catSums[x.cat] = (catSums[x.cat] || 0) + x.amount;
        });

        // Compute ratios
        const ratios = Object.keys(catSums).map(k => ({
          label: k,
          amount: catSums[k],
          color: pcolor(k),
          pct: totalEx > 0 ? Math.round((catSums[k] / totalEx) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);

        // Grouping items for trend dynamic representation
        const dynamicGrouped: Record<string, number> = {};
        filteredEx.forEach(x => {
          dynamicGrouped[x.date] = (dynamicGrouped[x.date] || 0) + x.amount;
        });
        const groupedDates = Object.keys(dynamicGrouped).sort();

        // Donut attributes math
        const c_radius = 50;
        const c_circum = 2 * Math.PI * c_radius;
        let c_offset = 0;

        return (
          <div className="space-y-4 text-left">
            {/* Range and Spent Card */}
            <div
              onClick={onOpenExpPeriod}
              className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm cursor-pointer hover:bg-stone-50/50 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> Сумма трат за период <span className="text-amber-700 underline font-extrabold ml-1">изм.</span>
                </span>
                <div className="text-3xl font-black text-slate-800 mt-1 leading-none">{rub(totalEx)}</div>
              </div>
              <div className="text-xs font-black text-amber-900 mt-2 font-mono">
                {selectedPeriodLabel}
              </div>
            </div>

            {/* Donut and breakdown metrics */}
            <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-3">Разбивка расходов</span>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Visual SVG Donut Chart */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 130 130" className="transform -rotate-90">
                    <circle cx="65" cy="65" r="50" fill="none" stroke="#f3f4f6" strokeWidth="13" />
                    {ratios.map((r, i) => {
                      if (!r.amount) return null;
                      const segmentLength = (r.amount / totalEx) * c_circum;
                      const dashOffset = -c_offset;
                      c_offset += segmentLength;
                      return (
                        <circle
                          key={i}
                          cx="65"
                          cy="65"
                          r="50"
                          fill="none"
                          stroke={r.color}
                          strokeWidth="13"
                          strokeDasharray={`${segmentLength.toFixed(1)} ${(c_circum - segmentLength).toFixed(1)}`}
                          strokeDashoffset={dashOffset.toFixed(1)}
                          className="cursor-pointer hover:stroke-[15px] transition-all"
                          onClick={() => onOpenDrill(r.label)}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-black">Итого</span>
                    <span className="text-sm font-black text-slate-800 font-sans leading-none mt-0.5">{rub(totalEx)}</span>
                  </div>
                </div>

                {/* Categories legends */}
                <div className="flex-1 w-full space-y-2">
                  {ratios.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => onOpenDrill(r.label)}
                      className="cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          {r.label}
                        </span>
                        <span>{rub(r.amount)} ({r.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: r.color, width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  {ratios.length === 0 && (
                    <div className="text-xs font-semibold text-stone-400 text-center py-4">Нет трат.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenExpAdd}
                className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white flex items-center justify-center gap-2 py-3 rounded-xl text-xs transition-all active:scale-97 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-100" />
                <span>Добавить покупку</span>
              </button>
              <button
                onClick={onOpenExpStores}
                className="bg-stone-50 hover:bg-stone-100 border border-stone-200 font-extrabold text-stone-700 flex items-center justify-center gap-2 py-3 rounded-xl text-xs transition-all active:scale-97 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-stone-400" />
                <span>Мои магазины</span>
              </button>
            </div>

            {/* Recents logs */}
            <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-3">Последние траты</span>
              <div className="space-y-2 divide-y divide-stone-50">
                {filteredEx.slice(0, 6).map(x => (
                  <div key={x.id} className="flex items-center justify-between pt-2 first:pt-0">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 leading-tight truncate">{x.store}</div>
                      <div className="text-[10px] text-stone-400 font-bold font-mono mt-0.5">{x.date}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ color: pcolor(x.cat), backgroundColor: `${pcolor(x.cat)}16` }}
                      >
                        {x.cat}
                      </span>
                      <span className="text-xs font-black text-slate-800 font-mono">-{rub(x.amount)}</span>
                    </div>
                  </div>
                ))}
                {filteredEx.length === 0 && (
                  <div className="text-xs font-semibold text-stone-400 text-center py-6">Список пуст.</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========== TAB: HEALTH ========== */}
      {sub === 'health' && (
        <div className="space-y-4 text-left">
          {/* ========== HEALTH TAB: BODY PROGRESSION ========== */}
          <div className="space-y-4">
            <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm relative">
              <div className="flex items-center justify-between mb-1 pr-6">
                <span className="text-xs font-black text-stone-400 uppercase tracking-widest block">
                  Динамика самочувствия
                </span>
                <button
                  onClick={() => setShowHealthHelp(!showHealthHelp)}
                  className="w-5 h-5 rounded-full bg-stone-100 hover:bg-amber-100/50 text-stone-500 hover:text-amber-900 flex items-center justify-center transition-all cursor-pointer"
                  title="Подсказка"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>

              {showHealthHelp && (
                <div className="absolute right-4 top-10 z-30 w-72 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xl text-xs space-y-2 animate-in fade-in duration-150 text-stone-600 dark:text-stone-300">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-2">
                    <span className="font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
                      Раздел «Здоровье»
                    </span>
                    <button
                      onClick={() => setShowHealthHelp(false)}
                      className="text-stone-400 hover:text-stone-700 font-extrabold text-sm hover:bg-stone-200 rounded px-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] font-semibold leading-relaxed">
                    <li>
                      <strong>Графики трендов:</strong> Нажмите на вкладки <em>«Вес»</em> или <em>«Вода»</em> для просмотра динамики в интерактивной кривой прогресса за последнее время.
                    </li>
                    <li>
                      <strong>Календарь здоровья:</strong> Сетка ниже показывает цветные метки за каждый день. Нажмите на любой день, чтобы зафиксировать выпитую воду, время сна, вес и настроение.
                    </li>
                    <li>
                      <strong>Мгновенное обновление:</strong> Каждая запись тут же обновляет и статистику в разделе аналитики.
                    </li>
                  </ul>
                </div>
              )}

              {(() => {
                const ascMetric = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
                
                const weightSeries = ascMetric.filter(m => typeof m.weight === 'number').map(m => ({ d: m.date, v: m.weight! }));
                const waterSeries = ascMetric.filter(m => typeof m.water === 'number').map(m => ({ d: m.date, v: m.water! }));
                const sleepSeries = ascMetric.filter(m => typeof m.sleep === 'number').map(m => ({ d: m.date, v: m.sleep! }));
                
                const moodValues: Record<string, number> = { awful: 1, bad: 2, neutral: 3, good: 4, great: 5 };
                const moodSeries = ascMetric.filter(m => m.mood).map(m => ({ d: m.date, v: moodValues[m.mood!], label: m.mood! }));

                const getLast = (s: any[]) => s.length ? s[s.length - 1] : null;
                const wl = getLast(weightSeries);
                const watl = getLast(waterSeries);
                const sl = getLast(sleepSeries);
                const ml = getLast(moodSeries);

                const moodEmojis: Record<string, string> = { awful: '😢', bad: '😕', neutral: '😐', good: '🙂', great: '🤩' };

                const renderMiniChart = (series: any[], color: string) => {
                  if (series.length < 2) {
                    return (
                      <div className="h-16 flex items-center justify-center text-[10px] font-bold text-stone-300">
                        надо больше данных
                      </div>
                    );
                  }
                  const W = 170;
                  const H = 58;
                  const padX = 5;
                  const padY = 8;
                  const vals = series.map(s => s.v);
                  const min = Math.min(...vals);
                  const max = Math.max(...vals);
                  const rng = (max - min) || 1;

                  const gx = (i: number) => padX + i * (W - 2 * padX) / (series.length - 1);
                  const gy = (v: number) => H - padY - ((v - min) / rng) * (H - 2 * padY);

                  const path = series.map((s, i) => `${i ? 'L' : 'M'} ${gx(i).toFixed(1)} ${gy(s.v).toFixed(1)}`).join(' ');
                  const area = `M ${padX} ${(H - padY)} ${series.map((s, i) => `L ${gx(i).toFixed(1)} ${gy(s.v).toFixed(1)}`).join(' ')} L ${gx(series.length - 1).toFixed(1)} ${(H - padY)} Z`;
                  const lx = gx(series.length - 1).toFixed(1);
                  const ly = gy(series[series.length - 1].v).toFixed(1);

                  const firstLabel = `${series[0].d.split('-')[2]}.${series[0].d.split('-')[1]}`;
                  const lastLabel = `${series[series.length - 1].d.split('-')[2]}.${series[series.length - 1].d.split('-')[1]}`;

                  return (
                    <svg viewBox={`0 0 ${W} ${H + 12}`} className="w-full overflow-visible mt-2">
                      <path d={area} fill={color} opacity="0.08" />
                      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={lx} cy={ly} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
                      <text x={padX} y={H + 10} fontSize="8" fill="#a8a29e" className="font-mono font-black">{firstLabel}</text>
                      <text x={W - padX} y={H + 10} fontSize="8" fill="#a8a29e" textAnchor="end" className="font-mono font-black">{lastLabel}</text>
                    </svg>
                  );
                };

                return (
                  <div className="grid grid-cols-2 gap-3 mt-3 font-sans">
                    {/* Weight Card */}
                    <button
                      onClick={() => setSelectedMetricDetail('weight')}
                      className="bg-stone-50 border border-stone-100 rounded-2xl p-3 shadow-inner hover:bg-stone-100/70 transition-all text-left cursor-pointer active:scale-97 block w-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-stone-450">Вес тела</span>
                        <span className="text-xs font-black text-rose-500 font-mono">{wl ? `${wl.v} кг` : '—'}</span>
                      </div>
                      {renderMiniChart(weightSeries, '#E5709B')}
                    </button>

                    {/* Water Balance */}
                    <button
                      onClick={() => setSelectedMetricDetail('water')}
                      className="bg-stone-50 border border-stone-100 rounded-2xl p-3 shadow-inner hover:bg-stone-100/70 transition-all text-left cursor-pointer active:scale-97 block w-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-stone-450">Вода</span>
                        <span className="text-xs font-black text-blue-500 font-mono">{watl ? `${watl.v} мл` : '—'}</span>
                      </div>
                      {renderMiniChart(waterSeries, '#3B82C4')}
                    </button>

                    {/* Sleep Quality */}
                    <button
                      onClick={() => setSelectedMetricDetail('sleep')}
                      className="bg-stone-50 border border-stone-100 rounded-2xl p-3 shadow-inner hover:bg-stone-100/70 transition-all text-left cursor-pointer active:scale-97 block w-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-stone-450">Качество сна</span>
                        <span className="text-xs font-black text-purple-600 font-mono">{sl ? `${sl.v} ч` : '—'}</span>
                      </div>
                      {renderMiniChart(sleepSeries, '#7E5BD0')}
                    </button>

                    {/* Mood Card */}
                    <button
                      onClick={() => setSelectedMetricDetail('mood')}
                      className="bg-stone-50 border border-stone-100 rounded-2xl p-3 shadow-inner hover:bg-stone-100/70 transition-all text-left cursor-pointer active:scale-97 block w-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-stone-450">Настроение</span>
                        <span className="text-sm font-black text-amber-600">{ml ? moodEmojis[ml.label] : '—'}</span>
                      </div>
                      {renderMiniChart(moodSeries, '#E08A2B')}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Health metrics quick logger panel */}
            <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm text-left">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-3">
                Ввод показателей здоровья за сегодня
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Weight card */}
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Вес тела
                    </span>
                    <span className="text-xs font-black text-rose-600 font-mono">
                      {todayMetric.weight ? `${todayMetric.weight} кг` : 'не записан'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="78.4"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="h-8 border border-stone-200 bg-white rounded-lg px-2 text-xs font-mono font-bold focus:border-amber-950 focus:outline-none w-full"
                    />
                    <button
                      onClick={() => {
                        const v = parseFloat(weightInput);
                        if (!isNaN(v) && v > 0) {
                          saveWeight(v);
                          setWeightInput('');
                        }
                      }}
                      className="bg-rose-500 hover:bg-rose-650 font-extrabold text-white px-3 h-8 rounded-lg text-[11px] transition-all shrink-0 active:scale-97 cursor-pointer"
                    >
                      ввод
                    </button>
                  </div>
                </div>

                {/* 2. Water Card */}
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                      Баланс воды
                    </span>
                    <span className="text-xs font-black text-blue-600 font-mono">
                      {todayWater} / 2000 мл
                    </span>
                  </div>
                  
                  <div className="h-1.5 bg-blue-100 border border-blue-200 rounded-full overflow-hidden mb-2.5">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min((todayWater / 2000) * 100, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex gap-1.5 mt-auto">
                    <button
                      onClick={() => onAddWater(250)}
                      className="flex-1 text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-650 border border-blue-100 rounded-lg py-1 hover:bg-blue-100 active:scale-95 transition-all text-center cursor-pointer"
                    >
                      +250 мл
                    </button>
                    <button
                      onClick={() => onAddWater(500)}
                      className="flex-1 text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-650 border border-blue-100 rounded-lg py-1 hover:bg-blue-100 active:scale-95 transition-all text-center cursor-pointer"
                    >
                      +500 мл
                    </button>
                  </div>
                </div>

                {/* 3. Sleep Card */}
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      Качество сна
                    </span>
                    <span className="text-xs font-black text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {todaySleep === null ? '—' : `${todaySleep} ч`}
                    </span>
                  </div>

                  {todaySleep !== null && sleepCollapsed ? (
                    <div className="flex flex-col items-center justify-center py-2 flex-1">
                      <span className="text-2xl mb-1">💤</span>
                      <span className="text-xs font-black text-purple-950">
                        {todaySleep} ч
                      </span>
                      {todayBed && todayWake && (
                        <span className="text-[10px] font-bold text-stone-400 font-mono mt-0.5">
                          {todayBed} — {todayWake}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSleepCollapsed(false)}
                        className="mt-3 text-[10px] font-black text-purple-700 hover:text-purple-800 bg-purple-100/50 hover:bg-purple-100 py-1 px-3 rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        {language === 'en' ? 'Edit' : 'Изменить'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between flex-1">
                      {/* Time controls */}
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        <div>
                          <label className="text-[8px] text-stone-450 font-black uppercase mb-0.5 block">
                            {language === 'en' ? 'Bed' : 'Лёг'}
                          </label>
                          <input
                            type="time"
                            value={localBed}
                            onChange={(e) => setLocalBed(e.target.value)}
                            className="h-7 border border-stone-200 bg-white rounded-lg px-2 text-[11px] font-bold font-mono focus:border-amber-950 focus:outline-none w-full text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-stone-450 font-black uppercase mb-0.5 block">
                            {language === 'en' ? 'Awake' : 'Встал'}
                          </label>
                          <input
                            type="time"
                            value={localWake}
                            onChange={(e) => setLocalWake(e.target.value)}
                            className="h-7 border border-stone-200 bg-white rounded-lg px-2 text-[11px] font-bold font-mono focus:border-amber-950 focus:outline-none w-full text-center"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSleepTimes(localBed, localWake);
                          setSleepCollapsed(true);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-1.5 rounded-lg transition-all active:scale-97 cursor-pointer text-center"
                      >
                        {language === 'en' ? 'OK' : 'ОК'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Mood Card */}
                <div className={`border rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 ${
                  todayMetric.mood 
                    ? 'border-amber-200 bg-amber-50/25 shadow-sm' 
                    : 'border-stone-100 bg-stone-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Heart className={`w-3.5 h-3.5 ${todayMetric.mood ? 'text-red-500 fill-red-500 scale-110 animate-pulse' : 'text-stone-400'}`} />
                      Настроение
                    </span>
                    {todayMetric.mood && (
                      <span className="text-[8px] font-black text-amber-800 bg-amber-100/80 rounded-full px-2 py-0.5 uppercase tracking-wide">
                        {language === 'en' ? 'Logged' : 'Отмечено'}
                      </span>
                    )}
                  </div>

                  {todayMetric.mood && !editingMood ? (
                    <div className="flex flex-col items-center justify-center py-1 flex-1">
                      {(() => {
                        const m = moodsList.find(x => x.id === todayMetric.mood);
                        const labels: Record<string, string> = {
                          awful: language === 'en' ? 'Awful' : 'Ужасно',
                          bad: language === 'en' ? 'Bad' : 'Плохо',
                          neutral: language === 'en' ? 'Neutral' : 'Обычное',
                          good: language === 'en' ? 'Good' : 'Хорошо',
                          great: language === 'en' ? 'Great' : 'Прекрасно'
                        };
                        return (
                          <>
                            <span className="text-3xl filter drop-shadow mb-1 animate-pulse">{m?.emoji}</span>
                            <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider mb-2">
                              {labels[todayMetric.mood] || todayMetric.mood}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingMood(true)}
                              className="text-[10px] font-black text-amber-700 hover:text-amber-850 bg-amber-100/60 rounded-lg px-2.5 py-0.5 transition-all active:scale-95 cursor-pointer"
                            >
                              {language === 'en' ? 'Change' : 'Изменить'}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between flex-1">
                      <div className="flex justify-between gap-1 my-1">
                        {moodsList.map((emo) => {
                          const isActive = todayMetric.mood === emo.id;
                          return (
                            <button
                              key={emo.id}
                              type="button"
                              onClick={() => {
                                onSetMood(emo.id);
                                setEditingMood(false);
                              }}
                              className={`flex-1 text-base leading-none py-1.5 rounded-lg border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-amber-100 border-amber-450 text-amber-900 border-amber-400 scale-110 shadow-sm font-bold text-lg'
                                  : 'border-stone-200/50 bg-white hover:bg-stone-100'
                              }`}
                              title={emo.id}
                            >
                              {emo.emoji}
                            </button>
                          );
                        })}
                      </div>
                      {editingMood && (
                        <button
                          type="button"
                          onClick={() => setEditingMood(false)}
                          className="mt-1.5 text-[9px] font-bold text-stone-400 hover:text-stone-605 uppercase tracking-wider text-center w-full"
                        >
                          {language === 'en' ? 'Cancel' : 'Отмена'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: GOALS ========== */}
      {sub === 'goals' && (
        <div className="space-y-4 text-left">
          {/* Header goals panel */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black text-stone-450 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Цели и стремления <span className="bg-amber-100 text-amber-900 rounded-full px-2 py-0.25 text-[10px] font-black">{goals.length}</span>
            </span>
            <button
              onClick={onOpenGoalCreate}
              className="bg-amber-955 hover:bg-amber-900 bg-amber-950 text-white font-extrabold flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs transition-all active:scale-97 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-100" />
              <span>Добавить цель</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          {(() => {
            const completedG = goals.filter(g => g.status === 'completed').length;
            const activeG = goals.filter(g => g.status === 'active').length;
            const avgProgressG = goals.length ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;

            return (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white border border-amber-950/10 rounded-2xl p-3">
                  <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Выполнено</span>
                  <div className="text-lg font-black font-sans text-emerald-600 mt-0.5 leading-none">{completedG}</div>
                  <span className="text-[9px] text-stone-400 font-medium block mt-1">целей</span>
                </div>
                <div className="bg-white border border-amber-950/10 rounded-2xl p-3">
                  <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Активно</span>
                  <div className="text-lg font-black font-sans text-blue-500 mt-0.5 leading-none">{activeG}</div>
                  <span className="text-[9px] text-stone-400 font-medium block mt-1">в работе</span>
                </div>
                <div className="bg-white border border-amber-950/10 rounded-2xl p-3">
                  <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Ср. прогресс</span>
                  <div className="text-lg font-black font-sans text-amber-700 mt-0.5 leading-none">{avgProgressG}%</div>
                  <span className="text-[9px] text-stone-400 font-medium block mt-1">ср. индекс</span>
                </div>
              </div>
            );
          })()}

          {/* Life Domain progressive weights */}
          <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-1">Сферы влияния</span>
            <div className="grid gap-3 sm:grid-cols-2 mt-3.5">
              {Object.keys(GOAL_CATEGORIES).map(k => {
                const c = GOAL_CATEGORIES[k];
                const list = goals.filter(g => g.cat === k);
                const avgProgress = list.length ? Math.round(list.reduce((sum, g) => sum + g.progress, 0) / list.length) : 0;
                return (
                  <div key={k} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-stone-550">
                      <span className="flex items-center gap-1.5" style={{ color: c.accent }}>
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-slate-700 font-extrabold">{c.label}</span>
                        <span className="text-[9px] bg-stone-100 text-stone-400 font-black rounded-full px-1.5 py-0.25">
                          {list.length}
                        </span>
                      </span>
                      <span className="text-stone-500 font-black font-mono">{list.length ? `${avgProgress}%` : '—'}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100/70 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${avgProgress}%`, backgroundColor: c.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals list */}
          <div className="space-y-3">
            {[...goals]
              .sort((a, b) => {
                if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
                return a.target.localeCompare(b.target);
              })
              .map(g => {
                const c = GOAL_CATEGORIES[g.cat];
                const dl = getGoalStatusDays(g);
                const isCompleted = g.status === 'completed';

                return (
                  <div
                    key={g.id}
                    className={`bg-white border border-amber-950/10 rounded-2xl overflow-hidden flex shadow-sm transition-opacity duration-300 ${
                      isCompleted ? 'opacity-80' : ''
                    }`}
                  >
                    <span className="w-1.5 grow-0 shrink-0" style={{ backgroundColor: c.accent }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {/* Top Badges */}
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className="text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase"
                              style={{ color: c.accent, backgroundColor: `${c.accent}14` }}
                            >
                              {c.label}
                            </span>
                            {isCompleted && (
                              <span className="text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700">
                                готово
                              </span>
                            )}
                          </div>

                          <h4 className={`text-xs font-black leading-tight ${
                            isCompleted ? 'text-stone-300 line-through' : 'text-slate-800'
                          }`}>
                            {g.title}
                          </h4>
                          {g.desc && (
                            <p className="text-[11px] text-stone-500 leading-normal mt-1">
                              {g.desc}
                            </p>
                          )}
                        </div>

                        {/* Edit Action trigger */}
                        <button
                          onClick={() => onOpenGoalEdit(g.id)}
                          className="p-1 text-stone-305 text-stone-400 hover:text-amber-900 duration-200 shrink-0"
                          title="Редактировать"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Timeline Slider Progress Indicator */}
                      <div className="flex justify-between items-center mt-3.5 mb-1 text-[10px] font-black uppercase">
                        <span className={dl.c}>{dl.t}</span>
                        <span className="font-mono font-black" style={{ color: c.accent }}>
                          {g.progress}%
                        </span>
                      </div>

                      <div className="w-full flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={g.progress}
                          onChange={(e) => onSetGoalProgress(g.id, parseInt(e.target.value))}
                          style={{
                            backgroundImage: `linear-gradient(90deg, ${c.accent} ${g.progress}%, #ece9e3 ${g.progress}%)`,
                          }}
                          className="w-full h-1.5 rounded-full cursor-pointer stk-range"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Enlarged Metric Detail Modal */}
      {selectedMetricDetail && (() => {
        const ascMetric = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
        const moodValues: Record<string, number> = { awful: 1, bad: 2, neutral: 3, good: 4, great: 5 };
        const moodLabels: Record<string, string> = { awful: 'Ужасно', bad: 'Плохо', neutral: 'Нормально', good: 'Хорошо', great: 'Отлично' };
        const moodEmojis: Record<string, string> = { awful: '😢', bad: '😕', neutral: '😐', good: '🙂', great: '🤩' };

        let title = '';
        let color = '';
        let series: { d: string; v: number; label?: string }[] = [];
        let unit = '';

        if (selectedMetricDetail === 'weight') {
          title = 'Динамика веса тела';
          color = '#E5709B';
          series = ascMetric.filter(m => typeof m.weight === 'number').map(m => ({ d: m.date, v: m.weight! }));
          unit = 'кг';
        } else if (selectedMetricDetail === 'water') {
          title = 'Баланс потребления воды';
          color = '#3B82C4';
          series = ascMetric.filter(m => typeof m.water === 'number').map(m => ({ d: m.date, v: m.water! }));
          unit = 'мл';
        } else if (selectedMetricDetail === 'sleep') {
          title = 'Качество и продолжительность сна';
          color = '#7E5BD0';
          series = ascMetric.filter(m => typeof m.sleep === 'number').map(m => ({ d: m.date, v: m.sleep! }));
          unit = 'ч';
        } else if (selectedMetricDetail === 'mood') {
          title = 'Динамика уровня настроения';
          color = '#E08A2B';
          series = ascMetric.filter(m => m.mood).map(m => ({ d: m.date, v: moodValues[m.mood!], label: m.mood! }));
          unit = 'балл';
        }

        const avgVal = series.length ? (series.reduce((sum, s) => sum + s.v, 0) / series.length).toFixed(1) : '—';
        const rawVals = series.map(s => s.v);
        const maxVal = series.length ? Math.max(...rawVals).toFixed(1) : '—';
        const minVal = series.length ? Math.min(...rawVals).toFixed(1) : '—';

        // An insight/advice for the metric
        let tip = '';
        if (selectedMetricDetail === 'weight') {
          tip = 'Стабильность взвешивания в одно и то же время суток гарантирует точность отслеживания вашего прогресса.';
        } else if (selectedMetricDetail === 'water') {
          tip = 'Регулярное потребление чистой воды улучшает метаболизм и когнитивные функции организма.';
        } else if (selectedMetricDetail === 'sleep') {
          tip = 'Стабильный режим засыпания и подъема до 23:00 увеличивает фазу глубокого сна на 30%.';
        } else if (selectedMetricDetail === 'mood') {
          tip = 'Фиксация эмоций помогает обнаружить внешние триггеры и повысить общую стрессоустойчивость.';
        }

        return (
          <div className="fixed inset-0 bg-stone-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all font-sans">
            <div className="bg-white border border-amber-950/15 rounded-3xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh] overflow-hidden text-left">
              {/* Modal Header */}
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">{title}</h3>
                  <p className="text-[10px] text-stone-400 font-bold mt-0.5 font-mono">История измерений</p>
                </div>
                <button
                  onClick={() => setSelectedMetricDetail(null)}
                  className="rounded-full bg-stone-100 p-1.5 hover:bg-stone-200 text-stone-500 hover:text-stone-850 duration-200 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1">
                {/* Statistics Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-stone-50 border border-stone-100 rounded-xl p-2.5">
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Среднее</span>
                    <div className="text-sm font-black text-slate-800 mt-1 font-mono">{avgVal} <span className="text-[9px] text-stone-450 font-medium">{unit}</span></div>
                  </div>
                  <div className="bg-stone-50 border border-stone-100 rounded-xl p-2.5">
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Макс</span>
                    <div className="text-sm font-black text-emerald-600 mt-1 font-mono">{maxVal} <span className="text-[9px] text-stone-450 font-medium">{unit}</span></div>
                  </div>
                  <div className="bg-stone-50 border border-stone-100 rounded-xl p-2.5">
                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Мин</span>
                    <div className="text-sm font-black text-amber-700 mt-1 font-mono">{minVal} <span className="text-[9px] text-stone-450 font-medium">{unit}</span></div>
                  </div>
                </div>

                {/* Main Beautiful Enlarged Chart */}
                <div className="bg-white border border-stone-150 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">Интерактивный график</span>
                  {series.length >= 2 ? (() => {
                    const W = 360;
                    const H = 140;
                    const padL = 34;
                    const padR = 10;
                    const padT = 16;
                    const padB = 22;
                    const plotW = W - padL - padR;
                    const plotH = H - padT - padB;

                    const vals = series.map(s => s.v);
                    const min = Math.min(...vals);
                    const max = Math.max(...vals);
                    const range = (max - min) || 1;

                    const gx = (i: number) => padL + i * (plotW / (series.length - 1));
                    const gy = (v: number) => padT + (1 - (v - min) / range) * plotH;

                    let pathD = '';
                    let areaD = '';
                    series.forEach((s, i) => {
                      const cx = gx(i);
                      const cy = gy(s.v);
                      if (i === 0) {
                        pathD += `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;
                        areaD += `M ${cx.toFixed(1)} ${(padT + plotH)} L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
                      } else {
                        pathD += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
                        areaD += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
                      }
                      if (i === series.length - 1) {
                        areaD += ` L ${cx.toFixed(1)} ${(padT + plotH)} Z`;
                      }
                    });

                    return (
                      <div className="w-full">
                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                          {/* Grid Lines */}
                          {[0, 1, 2, 3].map(k => {
                            const yVal = padT + (plotH * k) / 3;
                            const labelValue = max - (range * k) / 3;
                            return (
                              <g key={k}>
                                <line x1={padL} y1={yVal} x2={W - padR} y2={yVal} stroke="rgba(44,44,42,0.06)" strokeDasharray="3 3" />
                                <text x={padL - 6} y={yVal + 3} textAnchor="end" fontSize="8" fill="rgba(44,44,42,0.4)" className="font-mono font-bold">
                                  {selectedMetricDetail === 'mood' ? (moodEmojis[Object.keys(moodValues).find(key => moodValues[key] === Math.round(labelValue)) || 'neutral'] || '😐') : labelValue.toFixed(selectedMetricDetail === 'weight' ? 1 : 0)}
                                </text>
                              </g>
                            );
                          })}

                          {/* X labels */}
                          {series.map((s, i) => {
                            const showLabel = series.length <= 7 || i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2);
                            if (!showLabel) return null;
                            return (
                              <text key={i} x={gx(i)} y={H - 5} textAnchor="middle" fontSize="8" fill="rgba(44,44,42,0.4)" className="font-mono font-bold">
                                {s.d.split('-')[2]}.{s.d.split('-')[1]}
                              </text>
                            );
                          })}

                          {/* Paths */}
                          <path d={areaD} fill={color} opacity="0.08" />
                          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Data points */}
                          {series.map((s, i) => (
                            <circle key={i} cx={gx(i)} cy={gy(s.v)} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />
                          ))}
                        </svg>
                      </div>
                    );
                  })() : (
                    <div className="text-xs font-semibold text-stone-400 py-10 text-center">
                      Недостаточно данных для интерактивного графика. Добавьте записи за несколько дней.
                    </div>
                  )}
                </div>

                {/* Insight banner card */}
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 flex gap-2.5 items-start">
                  <span className="text-base select-none">💡</span>
                  <div className="text-[11px] font-bold text-stone-600 leading-relaxed">
                    <span className="text-stone-850 font-extrabold uppercase tracking-widest block mb-0.5">Полезный совет</span>
                    {tip}
                  </div>
                </div>

                {/* Timeline History entries list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Хронология записей</span>
                  <div className="max-h-36 overflow-y-auto border border-stone-100 rounded-xl divide-y divide-stone-50">
                    {[...series].reverse().map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 text-xs">
                        <span className="font-bold text-stone-400 font-mono">{s.d}</span>
                        <div className="flex items-center gap-2">
                          {selectedMetricDetail === 'mood' ? (
                            <span className="font-extrabold text-slate-750">
                              {moodEmojis[s.label || 'neutral']} {moodLabels[s.label || 'neutral']}
                            </span>
                          ) : (
                            <span className="font-black font-mono text-slate-800">
                              {s.v} {unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {series.length === 0 && (
                      <div className="p-4 text-xs font-bold text-stone-400 text-center">История пуста.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
                <button
                  onClick={() => setSelectedMetricDetail(null)}
                  className="bg-amber-950 hover:bg-stone-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl duration-200 cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
