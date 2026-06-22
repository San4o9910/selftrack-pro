/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Check, Plus, Droplet, Moon, Heart, Trash2, Wallet, Info, X } from 'lucide-react';
import { DayEvent, Expense, Metric, Habit } from '../types';
import { rub, WEEKDAYS, MONTHS_GENITIVE } from '../utils';
import { getTranslation } from '../lib/translations';

interface TodayViewProps {
  events: DayEvent[];
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  onOpenDay: (date: string, adding?: boolean) => void;
  expenses: Expense[];
  onOpenExpAdd: () => void;
  metric: Metric;
  onAddWater: (ml: number) => void;
  onUpdateSleepTimes: (bed: string, wake: string) => void;
  onUpdateSleepHours: (hours: number) => void;
  onSetMood: (mood: 'awful' | 'bad' | 'neutral' | 'good' | 'great') => void;
  language?: string;
}

export default function TodayView({
  events,
  toggleTask,
  deleteTask,
  onOpenDay,
  expenses,
  onOpenExpAdd,
  metric,
  onAddWater,
  onUpdateSleepTimes,
  onUpdateSleepHours,
  onSetMood,
  language = 'ru'
}: TodayViewProps) {
  const tToday = (key: string) => getTranslation(key, language);
  const [showHelp, setShowHelp] = useState(false);
  const t = new Date();
  const dateStr = `${WEEKDAYS[t.getDay()].toUpperCase()}, ${t.getDate()} ${MONTHS_GENITIVE[t.getMonth()].toUpperCase()}`;
  const todayYmd = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

  // Filter events scheduled for today
  const todayEvents = events.filter(e => e.date === todayYmd);
  const doneCount = todayEvents.filter(e => e.done).length;
  const totalCount = todayEvents.length;

  const evInc = todayEvents.filter(e => !e.done);
  const evDone = todayEvents.filter(e => e.done);

  // Filter today's expenses
  const todayExpenses = expenses.filter(x => x.date === todayYmd);
  const totalSpent = todayExpenses.reduce((sum, x) => sum + x.amount, 0);

  // Well-being state mapping
  const water = metric.water || 0;
  const sleep = typeof metric.sleep === 'number' ? metric.sleep : null;
  const bed = metric.bed || '';
  const wake = metric.wake || '';

  // Local state for Sleep inputs and card collapses
  const [localBed, setLocalBed] = useState(bed || '23:00');
  const [localWake, setLocalWake] = useState(wake || '07:00');
  const [sleepCollapsed, setSleepCollapsed] = useState(sleep !== null);
  const [editingMood, setEditingMood] = useState(false);

  useEffect(() => {
    if (bed) setLocalBed(bed);
    if (wake) setLocalWake(wake);
  }, [bed, wake]);

  useEffect(() => {
    if (sleep !== null) {
      setSleepCollapsed(true);
    } else {
      setSleepCollapsed(false);
    }
  }, [sleep]);

  const moods: { id: 'awful' | 'bad' | 'neutral' | 'good' | 'great'; emoji: string }[] = [
    { id: 'awful', emoji: '😢' },
    { id: 'bad', emoji: '😕' },
    { id: 'neutral', emoji: '😐' },
    { id: 'good', emoji: '🙂' },
    { id: 'great', emoji: '🤩' }
  ];

  const getPriorityInfo = (pri: string) => {
    switch (pri) {
      case 'high':
        return { label: 'СРОЧНО', color: 'text-red-500 bg-red-50' };
      case 'low':
        return { label: 'НИЗКИЙ', color: 'text-stone-400 bg-stone-50' };
      default:
        return { label: 'ОБЫЧНО', color: 'text-amber-600 bg-amber-50' };
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 pb-3 pr-10 relative">
        <div>
          <span className="text-[10px] tracking-widest font-black uppercase text-stone-400">
            {dateStr}
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{tToday('today')}</h2>
        </div>
        <div className="text-[11px] font-extrabold text-stone-500 bg-stone-200/60 rounded-full px-3 py-1 self-start sm:self-auto">
          {doneCount} / {totalCount} {language === 'en' ? 'tasks completed' : 'задач выполнено'}
        </div>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="absolute top-2 right-1 w-7 h-7 rounded-full bg-stone-100 hover:bg-amber-100/50 text-stone-550 hover:text-amber-900 border border-stone-200/50 flex items-center justify-center transition-all cursor-pointer z-10"
          title={language === 'en' ? 'How to use' : 'Как пользоваться'}
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {showHelp && (
          <div className="absolute right-0 top-12 z-30 w-[96%] sm:w-80 bg-stone-50 dark:bg-stone-900 border border-stone-205 dark:border-stone-850 rounded-2xl p-4 shadow-xl text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
              <span className="font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-1.5 flex-nowrap shrink-0">
                <Info className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300 shrink-0" />
                {language === 'en' ? 'Today Section Help:' : 'Продуктивность на сегодня:'}
              </span>
              <button
                onClick={() => setShowHelp(false)}
                className="text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 font-extrabold text-sm p-1 leading-none hover:bg-stone-200 dark:hover:bg-stone-800 rounded transition-all cursor-pointer"
              >
                ×
              </button>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-stone-600 dark:text-stone-300 font-semibold leading-relaxed">
              <li>
                <strong>{language === 'en' ? 'Add tasks:' : 'Добавление задач:'}</strong> {language === 'en' ? 'Tap "+" next to Schedule to add events or tasks onto todays layout.' : 'Нажмите на кнопку «+», чтобы быстро спланировать новую задачу на сегодня.'}
              </li>
              <li>
                <strong>{language === 'en' ? 'Well-being diaries:' : 'Дневник здоровья:'}</strong> {language === 'en' ? 'Record water volume, sleep logs, or check off current mood emoji.' : 'Записывайте количество выпитой воды, показатели сна и фиксируйте текущее настроение.'}
              </li>
              <li>
                <strong>{language === 'en' ? 'Check off tasks:' : 'Выполнение дел:'}</strong> {language === 'en' ? 'Click completion icons to advance todays general progress status.' : 'Отмечайте выполненные задачи кликом по круглому значку, продвигая прогресс дня.'}
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Tasks Block */}
      {todayEvents.length > 0 ? (
        <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{tToday('taskScheduleLabel')}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-red-50 text-red-600 rounded-full px-2.5 py-0.5">
                {totalCount - doneCount} {language === 'en' ? 'active' : 'актив.'}
              </span>
              <button
                onClick={() => onOpenDay(todayYmd, true)}
                className="w-7 h-7 rounded-lg bg-amber-950 hover:bg-amber-900 text-white flex items-center justify-center transition-all active:scale-95"
                title={language === 'en' ? 'Add Task' : 'Добавить задачу'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Incomplete Tasks */}
            {evInc.map(e => {
              const pr = getPriorityInfo(e.priority);
              return (
                <div key={e.id} className="flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-100 rounded-xl">
                  <button
                    onClick={() => toggleTask(e.id)}
                    className="w-6 h-6 rounded-full border-2 border-stone-300 bg-white flex items-center justify-center hover:border-emerald-500 transition-all shrink-0"
                    aria-label="Выполнить"
                  >
                    {e.done && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-slate-700 truncate">{e.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-stone-400 font-bold font-mono">{e.start}–{e.end}</span>
                      <span className={`text-[9px] font-black rounded px-1 py-0.25 ${pr.color}`}>{pr.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(e.id)}
                    className="text-stone-300 hover:text-red-500 p-1 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Separator if done exists */}
            {evDone.length > 0 && evInc.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <span className="text-[9px] font-black tracking-widest text-stone-300 uppercase shrink-0">Выполнено</span>
                <hr className="w-full border-stone-100" />
              </div>
            )}

            {/* Completed Tasks */}
            {evDone.map(e => {
              const pr = getPriorityInfo(e.priority);
              return (
                <div key={e.id} className="flex items-center gap-3 p-2.5 bg-stone-100/50 border border-stone-100 rounded-xl opacity-65">
                  <button
                    onClick={() => toggleTask(e.id)}
                    className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center transition-all shrink-0"
                    aria-label="Отменить"
                  >
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-stone-400 line-through truncate">{e.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-stone-400 font-bold font-mono">{e.start}–{e.end}</span>
                      <span className="text-[9px] font-black text-stone-400 bg-stone-100 rounded px-1 py-0.25">ГОТОВО</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(e.id)}
                    className="text-stone-300 hover:text-red-500 p-1 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => onOpenDay(todayYmd, true)}
          className="w-full bg-white border-2 border-dashed border-amber-950/20 hover:border-amber-950/40 text-stone-500 font-bold flex items-center justify-center gap-2 py-4 rounded-2xl text-xs transition-all active:scale-98"
        >
          <Plus className="w-4 h-4 text-amber-950/40" />
          <span>{language === 'en' ? 'Add a task for today' : 'Добавить задачу на сегодня'}</span>
        </button>
      )}

      {/* Bottom Grid for Expenses */}
      {todayExpenses.length > 0 && (
        <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-700" /> {language === 'en' ? 'Purchases' : 'Покупки'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5">
                {rub(totalSpent)}
              </span>
              <button
                onClick={onOpenExpAdd}
                className="w-7 h-7 rounded-lg bg-amber-950 hover:bg-amber-900 text-white flex items-center justify-center transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {todayExpenses.map(x => (
              <div key={x.id} className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-100 rounded-xl">
                <span className="text-xs font-bold text-slate-700 truncate pr-2">{x.store}</span>
                <span className="text-xs font-black text-slate-800 shrink-0 font-mono">-{rub(x.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Pill shortcuts if empty */}
      {todayExpenses.length === 0 && (
        <button
          onClick={onOpenExpAdd}
          className="w-full bg-white border-2 border-dashed border-amber-950/20 hover:border-amber-950/40 text-stone-500 font-bold flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs transition-all active:scale-98"
        >
          <Plus className="w-3.5 h-3.5 text-amber-950/40" />
          <span>{language === 'en' ? 'Add purchase' : 'Добавить покупку'}</span>
        </button>
      )}

      {/* Well-being Panel */}
      <div className="bg-white border border-amber-950/10 rounded-2xl p-4 shadow-sm space-y-3">
        <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase">
          {language === 'en' ? 'WELL-BEING TODAY' : 'Самочувствие сегодня'}
        </span>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Water card */}
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                {tToday('unitWater')}
              </span>
              <span className="text-xs font-black text-blue-600 font-mono">
                {water}/2000
              </span>
            </div>
            
            <div className="h-2 bg-blue-100 border border-blue-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min((water / 2000) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onAddWater(250)}
                className="flex-1 text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 rounded-xl py-1 px-2 hover:bg-blue-100 active:scale-95 transition-all text-center"
              >
                +250 {language === 'en' ? 'ml' : 'мл'}
              </button>
              <button
                onClick={() => onAddWater(500)}
                className="flex-1 text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 rounded-xl py-1 px-2 hover:bg-blue-100 active:scale-95 transition-all text-center"
              >
                +500 {language === 'en' ? 'ml' : 'мл'}
              </button>
            </div>
          </div>

          {/* Sleep Card */}
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                {tToday('sleepLabel')}
              </span>
              <span className="text-xs font-black text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                {sleep === null ? '—' : `${sleep} ${tToday('sleepHours')}`}
              </span>
            </div>

            {sleep !== null && sleepCollapsed ? (
              <div className="flex flex-col items-center justify-center py-2 flex-1">
                <span className="text-2xl mb-1">💤</span>
                <span className="text-xs font-black text-purple-950">
                  {sleep} {tToday('sleepHours')}
                </span>
                {bed && wake && (
                  <span className="text-[10px] font-bold text-stone-400 font-mono mt-0.5">
                    {bed} — {wake}
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

          {/* Mood Card */}
          <div className={`border rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 ${
            metric.mood 
              ? 'border-amber-200 bg-amber-50/25 shadow-sm' 
              : 'border-stone-100 bg-stone-50'
          }`}>
            <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Heart className={`w-3.5 h-3.5 ${metric.mood ? 'text-red-500 fill-red-500 scale-110 animate-pulse' : 'text-stone-400'}`} />
                {tToday('moodLabel')}
              </span>
              {metric.mood && (
                <span className="text-[8px] font-black text-amber-800 bg-amber-100/80 rounded-full px-2 py-0.5 uppercase tracking-wide">
                  {language === 'en' ? 'Logged' : 'Отмечено'}
                </span>
              )}
            </div>
            
            {metric.mood && !editingMood ? (
              <div className="flex flex-col items-center justify-center py-1 flex-1">
                {(() => {
                  const m = moods.find(x => x.id === metric.mood);
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
                        {labels[metric.mood] || metric.mood}
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
                  {moods.map((emo) => {
                    const isActive = metric.mood === emo.id;
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
  );
}
