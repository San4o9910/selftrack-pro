/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Wallet, Award, Plus, Pencil, Compass, Sparkles, ArrowLeft, ArrowRight, Info
} from 'lucide-react';
import { Expense, Goal, StoreCatalogItem } from '../types';
import { rub, pcolor, today, shift } from '../utils';
import { GOAL_CATEGORIES } from '../data';
import { getTranslation } from '../lib/translations';

interface FinanceGoalsViewProps {
  expenses: Expense[];
  onOpenExpPeriod: () => void;
  onOpenExpAdd: () => void;
  onOpenExpStores: () => void;
  stores: StoreCatalogItem[];
  onOpenDrill: (cat: string) => void;
  selectedPeriodLabel: string;
  selectedPeriodDates: { from: string; to: string; period: string };
  goals: Goal[];
  onSetGoalProgress: (id: string, progress: number) => void;
  onOpenGoalEdit: (id: string) => void;
  onOpenGoalCreate: () => void;
  language?: string;
}

export default function FinanceGoalsView({
  expenses,
  onOpenExpPeriod,
  onOpenExpAdd,
  onOpenExpStores,
  stores,
  onOpenDrill,
  selectedPeriodLabel,
  selectedPeriodDates,
  goals,
  onSetGoalProgress,
  onOpenGoalEdit,
  onOpenGoalCreate,
  language = 'ru'
}: FinanceGoalsViewProps) {
  const t = (k: string) => getTranslation(k, language);
  const [sub, setSub] = useState<'expenses' | 'goals'>('expenses');
  const [showExpensesHelp, setShowExpensesHelp] = useState(false);
  const [showGoalsHelp, setShowGoalsHelp] = useState(false);

  // ---------- helper functions for calculations ----------
  const getFilteredExpenses = () => {
    return expenses.filter(x => {
      const startLimit = selectedPeriodDates.from;
      const endLimit = selectedPeriodDates.to;

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
    <div className="space-y-4">
      {/* Sub-tab Navigation */}
      <div className="sticky -top-4 z-20 bg-white/95 dark:bg-[#1c1a18]/95 backdrop-blur-md border border-amber-950/10 dark:border-stone-800/80 rounded-2xl p-1 flex gap-1 shadow-md">
        <button
          onClick={() => setSub('expenses')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
            sub === 'expenses'
              ? 'bg-amber-950 text-white border-amber-950 dark:bg-amber-900 dark:border-amber-950/20'
              : 'text-stone-500 dark:text-stone-400 border-transparent hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>{language === 'ru' ? 'Расходы' : 'Expenses'}</span>
        </button>
        <button
          onClick={() => setSub('goals')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border ${
            sub === 'goals'
              ? 'bg-amber-950 text-white border-amber-950 dark:bg-amber-900 dark:border-amber-950/20'
              : 'text-stone-500 dark:text-stone-400 border-transparent hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{language === 'ru' ? 'Цели' : 'Goals'}</span>
        </button>
      </div>

      {/* ========== TAB: EXPENSES ========== */}
      {sub === 'expenses' && (
        <div className="space-y-4 text-left relative">
          {/* Info Button */}
          <div className="absolute right-1 -top-11 z-10">
            <button
              onClick={() => setShowExpensesHelp(!showExpensesHelp)}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-amber-100/50 text-stone-500 hover:text-amber-900 border border-stone-200/50 flex items-center justify-center transition-all cursor-pointer"
              title="Инфо"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {showExpensesHelp && (
            <div className="absolute right-0 top-0 z-30 w-[96%] sm:w-80 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xl text-xs space-y-2 animate-in fade-in duration-150 text-stone-600 dark:text-stone-300">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-2">
                <span className="font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-1.5 font-sans">
                  <Info className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
                  Управление Расходами
                </span>
                <button
                  onClick={() => setShowExpensesHelp(false)}
                  className="text-stone-400 hover:text-stone-700 font-extrabold text-sm hover:bg-stone-200 rounded px-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-[11px] font-semibold leading-relaxed font-sans">
                <li>
                  <strong>Диапазон дат:</strong> Нажмите на карточку <em>«Сумма трат за период»</em>, чтобы переключить временной интервал (день, неделя, месяц, другой период).
                </li>
                <li>
                  <strong>Распределение расходов:</strong> Цветная диаграмма-бублик показывает долю категорий. Нажимайте на круговые секторы диаграммы, чтобы включить детальный фильтр!
                </li>
                <li>
                  <strong>Шаблоны магазинов:</strong> Создавайте готовые шаблоны торговых точек с быстрой подгрузкой при добавлении расходов.
                </li>
              </ul>
            </div>
          )}

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
                      <span className="flex items-center gap-1.5 font-extrabold text-stone-705">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                        {r.label}
                      </span>
                      <span className="font-black text-slate-900">{rub(r.amount)} ({r.pct}%)</span>
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
      )}

      {/* ========== TAB: GOALS ========== */}
      {sub === 'goals' && (
        <div className="space-y-4 text-left relative">
          {/* Info Button */}
          <div className="absolute right-1 -top-11 z-10">
            <button
              onClick={() => setShowGoalsHelp(!showGoalsHelp)}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-amber-100/50 text-stone-500 hover:text-amber-900 border border-stone-200/50 flex items-center justify-center transition-all cursor-pointer"
              title="Инфо"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {showGoalsHelp && (
            <div className="absolute right-0 top-0 z-30 w-[96%] sm:w-80 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xl text-xs space-y-2 animate-in fade-in duration-150 text-stone-600 dark:text-stone-300">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-2">
                <span className="font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-1.5 font-sans">
                  <Info className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300 shrink-0" />
                  Управление Целями
                </span>
                <button
                  onClick={() => setShowGoalsHelp(false)}
                  className="text-stone-400 hover:text-stone-700 font-extrabold text-sm hover:bg-stone-200 rounded px-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-[11px] font-semibold leading-relaxed font-sans">
                <li>
                  <strong>Создание целей:</strong> По кнопке «Добавить цель» настройте название, целевое значение, категорию и подробные этапы ее достижения.
                </li>
                <li>
                  <strong>Оценка прогресса:</strong> Прогресс целей можно плавно настраивать прямо на карточках с помощью ползунка ползунком.
                </li>
                <li>
                  <strong>Автоматический архив:</strong> Когда цель заполняется на 100%, она автоматически завершается, переходя в раздел завершенного прогресса.
                </li>
              </ul>
            </div>
          )}

          {/* Header goals panel */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black text-stone-450 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Цели и стремления <span className="bg-amber-100 text-amber-900 rounded-full px-2 py-0.25 text-[10px] font-black">{goals.length}</span>
            </span>
            <button
              onClick={onOpenGoalCreate}
              className="bg-amber-950 hover:bg-stone-800 text-white font-extrabold flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs transition-all active:scale-97 shadow-sm cursor-pointer"
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
                  <span className="text-[9px] text-stone-400 font-medium block mt-1 font-bold">целей</span>
                </div>
                <div className="bg-white border border-amber-950/10 rounded-2xl p-3">
                  <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Активно</span>
                  <div className="text-lg font-black font-sans text-blue-500 mt-0.5 leading-none">{activeG}</div>
                  <span className="text-[9px] text-stone-400 font-medium block mt-1 font-bold">в работе</span>
                </div>
                <div className="bg-white border border-amber-950/10 rounded-2xl p-3">
                  <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Ср. прогресс</span>
                  <div className="text-lg font-black font-sans text-amber-700 mt-0.5 leading-none">{avgProgressG}%</div>
                  <span className="text-[9px] text-stone-400 font-medium block mt-1 font-bold">индекс</span>
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
                      <span className="flex items-center gap-1.5 font-extrabold" style={{ color: c.accent }}>
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-slate-700 font-extrabold">{c.label}</span>
                        <span className="text-[9px] bg-stone-100 text-stone-400 font-black rounded-full px-1.5 py-0.25">
                          {list.length}
                        </span>
                      </span>
                      <span className="text-stone-550 font-black font-mono">{list.length ? `${avgProgress}%` : '—'}</span>
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
                              <span className="text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 font-extrabold">
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
                          className="p-1 text-stone-400 hover:text-amber-900 duration-200 shrink-0 cursor-pointer"
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
    </div>
  );
}
