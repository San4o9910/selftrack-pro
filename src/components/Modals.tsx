/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Plus, Compass, School, Activity, Briefcase, Sparkles, Heart } from 'lucide-react';
import { DayEvent, Expense, Goal, StoreCatalogItem } from '../types';
import { pcolor, rub, PCATS, today, shift } from '../utils';

interface ModalsProps {
  modal: {
    type: 'day' | 'expPeriod' | 'expStores' | 'expAdd' | 'expDrill' | 'healthDay' | 'goal';
    adding?: boolean; // For task day modal adding state
    store?: string;   // For expense quick fill store name
    cat?: string;     // For expense/drill categories
    id?: string;      // For editing specific workout/goal
    date?: string;    // Selected date for inputs
  } | null;
  onClose: () => void;
  state: {
    selectedDate: string;
    events: DayEvent[];
    stores: StoreCatalogItem[];
    expenses: Expense[];
    goals: Goal[];
  };
  actions: {
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    addTask: (task: Omit<DayEvent, 'id'>) => void;
    applyPeriod: (period: 'day' | 'week' | 'month' | 'year' | 'custom', customFrom?: string, customTo?: string) => void;
    addStore: (name: string, cat: string) => void;
    addExpense: (store: string, amount: number, cat: string, notes?: string) => void;
    saveGoal: (g: Goal) => void;
    deleteGoal: (id: string) => void;
  };
  language?: string;
}

export default function Modals({ modal, onClose, state, actions, language = 'ru' }: ModalsProps) {
  if (!modal) return null;

  // Render centered modal wrap
  const centerWrap = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="fixed inset-0 bg-black/42 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[88vh] overflow-y-auto no-scrollbar shadow-2xl p-4 text-left border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-3.5">
          <div>
            <h3 className="text-[11px] font-black uppercase text-amber-900 tracking-widest leading-none">{title}</h3>
            {subtitle && <span className="text-[10px] text-stone-400 font-bold block mt-1">{subtitle}</span>}
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Render bottom slide sheet wrap
  const sheetWrap = (title: string, children: React.ReactNode) => (
    <div className="fixed inset-0 bg-black/42 flex items-end justify-center z-50 animate-slide-up" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[88vh] overflow-y-auto no-scrollbar shadow-2xl p-5 text-left border-t border-amber-950/10 pt-4" onClick={(e) => e.stopPropagation()}>
        {/* Grab bar indicator */}
        <div className="w-11 h-1.5 bg-stone-200 rounded-full mx-auto mb-3.5" />
        <div className="flex items-center justify-between border-b border-stone-150 pb-2.5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#92590a] leading-none">{title}</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Friendly date title logger
  const getFriendlyDateStr = (ds: string) => {
    const todayYmd = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
    if (ds === todayYmd) return 'Сегодня';
    
    const d = new Date(ds);
    return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // ==========================================
  // 1. DATE CELL TASKS LIST / QUICK-ADD MODAL
  // ==========================================
  if (modal.type === 'day') {
    return (() => {
      const [adding, setAdding] = useState(!!modal.adding);
      const [title, setTitle] = useState('');
      const [start, setStart] = useState('09:00');
      const [end, setEnd] = useState('10:00');
      const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
      const [category, setCategory] = useState<'general' | 'health' | 'mind' | 'work' | 'study'>('general');
      const [notes, setNotes] = useState('');

      const list = state.events.filter(e => e.date === state.selectedDate).sort((a,b) => a.start.localeCompare(b.start));

      const handleAdd = () => {
        if (!title.trim()) return;
        actions.addTask({
          title: title.trim(),
          date: state.selectedDate,
          start,
          end,
          priority,
          category,
          done: false,
          notes: notes.trim() || undefined
        });
        setAdding(false);
        setTitle('');
        setNotes('');
      };

      if (adding) {
        return centerWrap('План задач', getFriendlyDateStr(state.selectedDate), (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Название задачи</label>
              <input
                type="text"
                placeholder="Что запланировано?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs text-slate-800 w-full focus:outline-none focus:border-amber-950 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Начало</label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-2 text-xs font-mono font-bold w-full focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Конец</label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-2 text-xs font-mono font-bold w-full focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-bold w-full"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Обычный</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Сфера</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-bold w-full"
                >
                  <option value="general">Общее</option>
                  <option value="health">Здоровье</option>
                  <option value="mind">Разум</option>
                  <option value="work">Работа</option>
                  <option value="study">Учёба</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Заметка (необязательно)</label>
              <input
                type="text"
                placeholder="Короткий комментарий…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs text-slate-800 w-full focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setAdding(false)}
                className="flex-1 bg-stone-50 border border-stone-200/60 font-black text-stone-500 hover:text-stone-800 rounded-xl py-2.5 text-xs transition-colors"
              >
                Назад
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 bg-amber-950 hover:bg-amber-900 font-black text-white rounded-xl py-2.5 text-xs transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        ));
      }

      return centerWrap('План задач', getFriendlyDateStr(state.selectedDate), (
        <div className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
            {list.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2.5 p-2 bg-stone-50 border border-stone-100 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => actions.toggleTask(e.id)}
                    className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      e.done
                        ? 'border-emerald-600 bg-emerald-650 bg-emerald-650 bg-emerald-600 text-white'
                        : 'border-stone-300 bg-white hover:border-emerald-500'
                    }`}
                  >
                    {e.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div className="min-w-0">
                    <div className={`text-xs font-black truncate leading-tight ${e.done ? 'text-stone-300 line-through' : 'text-slate-800'}`}>
                      {e.title}
                    </div>
                    <div className="text-[10px] text-stone-400 font-bold font-mono">
                      {e.start}–{e.end} · {e.priority === 'high' ? 'высокий' : 'обычный'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => actions.deleteTask(e.id)}
                  className="text-stone-305 text-stone-300 hover:text-red-500 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {list.length === 0 && (
              <div className="text-xs font-semibold text-stone-400 text-center py-6">
                Нет запланированных дел на эту дату.
              </div>
            )}
          </div>

          <button
            onClick={() => setAdding(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-100" />
            <span>Добавить задачу</span>
          </button>
        </div>
      ));
    })();
  }

  // ==========================================
  // 2. SET CLOUD EXPENSES FILTER DURATION PERIOD
  // ==========================================
  if (modal.type === 'expPeriod') {
    return (() => {
      const [customPeriod, setCustomPeriod] = useState(false);
      const [from, setFrom] = useState('');
      const [to, setTo] = useState('');

      const handlePreset = (type: 'day' | 'week' | 'month' | 'year') => {
        actions.applyPeriod(type);
        onClose();
      };

      const handleCustom = () => {
        if (!from || !to) return;
        actions.applyPeriod('custom', from, to);
        onClose();
      };

      return sheetWrap('Интервал трат', (
        <div className="space-y-3.5 pb-2">
          {(!customPeriod) ? (
            <div className="space-y-2">
              <button onClick={() => handlePreset('day')} className="w-full text-left font-black text-xs py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-105 active:scale-99 border border-stone-200/55 hover:border-amber-900 duration-150 inline-flex items-center justify-between">
                <span>За сегодня</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-700">пресет</span>
              </button>
              <button onClick={() => handlePreset('week')} className="w-full text-left font-black text-xs py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-105 active:scale-99 border border-stone-200/55 hover:border-amber-900 duration-150 inline-flex items-center justify-between">
                <span>Последние 7 дней</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-700">пресет</span>
              </button>
              <button onClick={() => handlePreset('month')} className="w-full text-left font-black text-xs py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-105 active:scale-99 border border-stone-200/55 hover:border-amber-900 duration-150 inline-flex items-center justify-between">
                <span>Текущий месяц</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-700">пресет</span>
              </button>
              <button onClick={() => handlePreset('year')} className="w-full text-left font-black text-xs py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-105 active:scale-99 border border-stone-200/55 hover:border-amber-900 duration-150 inline-flex items-center justify-between">
                <span>Текущий год</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-700">пресет</span>
              </button>
              <button onClick={() => setCustomPeriod(true)} className="w-full text-left font-black text-xs py-2.5 px-4 rounded-xl bg-[#faf2e9] text-amber-950 border border-amber-900/20 active:scale-99 duration-150 font-bold block">
                Свой диапазон дат…
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 bg-stone-50 p-4 border border-stone-150 rounded-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">С даты</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-10 border border-stone-200 bg-white rounded-lg px-2 text-xs font-mono font-bold w-full focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">По дату</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-10 border border-stone-200 bg-white rounded-lg px-2 text-xs font-mono font-bold w-full focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomPeriod(false)}
                  className="flex-1 bg-white border border-stone-200/80 font-black text-stone-500 rounded-xl py-2.5 text-xs"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCustom}
                  className="flex-1 bg-amber-950 hover:bg-amber-900 font-black text-white rounded-xl py-2.5 text-xs shadow-sm"
                >
                  Применить
                </button>
              </div>
            </div>
          )}
        </div>
      ));
    })();
  }

  // ==========================================
  // 3. STORE NAMES CATALOG EDIT SHEET
  // ==========================================
  if (modal.type === 'expStores') {
    return (() => {
      const [isAdding, setIsAdding] = useState(false);
      const [name, setName] = useState('');
      const [cat, setCat] = useState('Продукты');

      const handleAdd = () => {
        if (!name.trim()) return;
        actions.addStore(name.trim(), cat);
        setName('');
        setIsAdding(false);
      };

      if (isAdding) {
        return sheetWrap('Новый магазин', (
          <div className="space-y-3 pb-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Название магазина</label>
              <input
                type="text"
                placeholder="напр. Лента, Спортмастер"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-9 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs w-full focus:outline-none font-bold text-slate-700"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Базовая категория</label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-bold w-full"
              >
                {PCATS.map(c => (
                  <option key={c[0]} value={c[0]}>{c[0]}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-stone-50 border border-stone-200/50 font-black text-stone-500 rounded-xl py-2"
              >
                Назад
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-black text-white rounded-xl py-2 shadow-sm"
              >
                Добавить
              </button>
            </div>
          </div>
        ));
      }

      return sheetWrap('Мои магазины', (
        <div className="space-y-3 pb-3">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 font-extrabold flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Создать новый магазин</span>
          </button>

          <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pt-2">
            {state.stores.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 bg-stone-50 border border-stone-150/50 rounded-xl">
                <span className="text-xs font-black text-slate-705 text-slate-800">{s.name}</span>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ color: pcolor(s.cat), backgroundColor: `${pcolor(s.cat)}16` }}
                >
                  {s.cat}
                </span>
              </div>
            ))}
          </div>
        </div>
      ));
    })();
  }

  // ==========================================
  // 4. LOG OUTLAY FINANCIAL TRANSACTION
  // ==========================================
  if (modal.type === 'expAdd') {
    return (() => {
      const [selectedStore, setSelectedStore] = useState('');
      const [sum, setSum] = useState('');
      const [cat, setCat] = useState('Продукты');
      const [notes, setNotes] = useState('');

      const pickStorePill = (name: string, category: string) => {
        setSelectedStore(name);
        setCat(category);
      };

      const handleSubmit = () => {
        const val = parseFloat(sum);
        if (isNaN(val) || val <= 0) return;
        const targetStore = selectedStore.trim() || cat;
        actions.addExpense(targetStore, val, cat, notes.trim() || undefined);
        onClose();
      };

      return sheetWrap('Добавить расходы', (
        <div className="space-y-4 pb-3">
          {/* Favorites selector pills */}
          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1.5 block">
              Быстрый выбор из каталога
            </label>
            <div className="flex flex-wrap gap-1.5">
              {state.stores.map((s, i) => {
                const isPicked = selectedStore === s.name;
                return (
                  <button
                    key={i}
                    onClick={() => pickStorePill(s.name, s.cat)}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      isPicked 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                        : 'border-stone-200/50 bg-stone-50 text-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Сумма (₽)</label>
              <input
                type="number"
                placeholder="0"
                value={sum}
                onChange={(e) => setSum(e.target.value)}
                autoFocus
                className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-mono font-bold w-full"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Категория</label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-bold w-full"
              >
                {PCATS.map(c => (
                  <option key={c[0]} value={c[0]}>{c[0]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Торговая точка (или место)</label>
            <input
              type="text"
              placeholder="напр. Пятёрочка"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs w-full focus:outline-none font-bold text-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Комментарий (необязательно)</label>
            <input
              type="text"
              placeholder="напр. подарки близким"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs w-full focus:outline-none text-slate-700"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-center text-xs shadow-sm cursor-pointer"
          >
            Сохранить расход
          </button>
        </div>
      ));
    })();
  }

  // ==========================================
  // 5. FINANCE DRILL DOWN SHEET DETAILS
  // ==========================================
  if (modal.type === 'expDrill') {
    return (() => {
      const activeCat = modal.cat || 'Продукты';
      const items = state.expenses.filter(x => x.cat === activeCat);
      const total = items.reduce((sum, x) => sum + x.amount, 0);

      return sheetWrap(`${activeCat}`, (
        <div className="space-y-3.5 pb-4">
          <div className="flex justify-between items-center bg-stone-50 border border-stone-150 p-3 rounded-2xl mb-2">
            <span className="text-xs font-black uppercase text-stone-400 text-left">Всего расходов в этой категории:</span>
            <span className="text-sm font-black text-slate-800 font-mono">{rub(total)}</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {items.map((x) => (
              <div key={x.id} className="flex justify-between items-center p-2.5 bg-stone-50 border border-stone-150/50 rounded-xl">
                <div>
                  <div className="text-xs font-black text-slate-800">{x.store}</div>
                  {x.notes && <div className="text-[10px] text-stone-400 font-medium leading-normal mt-0.5">{x.notes}</div>}
                  <div className="text-[9px] text-stone-400 font-bold font-mono mt-0.5">{x.date}</div>
                </div>
                <span className="text-xs font-black text-slate-800 font-mono">-{rub(x.amount)}</span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-xs font-semibold text-stone-400 text-center py-6">Нет записей.</div>
            )}
          </div>
        </div>
      ));
    })();
  }

  // ==========================================
  // 8. ADD/EDIT INTUITIVE OBJECTIVE GOAL
  // ==========================================
  if (modal.type === 'goal') {
    return (() => {
      const existingGoal = modal.id ? state.goals.find(g => g.id === modal.id) : null;

      const [title, setTitle] = useState(existingGoal?.title || '');
      const [desc, setDesc] = useState(existingGoal?.desc || '');
      const [cat, setCat] = useState<Goal['cat']>(existingGoal?.cat || 'learning');
      const [targetDate, setTargetDate] = useState(existingGoal?.target || shift(14));
      const [progress, setProgress] = useState(existingGoal?.progress || 0);

      const categories: { key: Goal['cat']; label: string; icon: any; color: string }[] = [
        { key: 'learning', label: 'Обучение', icon: School, color: '#3B82C4' },
        { key: 'health', label: 'Здоровье', icon: Activity, color: '#1D9E75' },
        { key: 'travel', label: 'Поездки', icon: Compass, color: '#E5709B' },
        { key: 'career', label: 'Работа', icon: Briefcase, color: '#E08A2B' },
        { key: 'creativity', label: 'Творчество', icon: Sparkles, color: '#7E5BD0' },
        { key: 'relationships', label: 'Семья', icon: Heart, color: '#6C6BD0' }
      ];

      const activeColor = categories.find(c => c.key === cat)?.color || '#3d1705';

      const handleSave = () => {
        if (!title.trim()) return;
        actions.saveGoal({
          id: existingGoal?.id || 'g' + Date.now(),
          title: title.trim(),
          desc: desc.trim(),
          cat,
          target: targetDate,
          progress,
          status: progress >= 100 ? 'completed' : 'active'
        });
        onClose();
      };

      return sheetWrap(existingGoal ? 'Редактировать цель' : 'Новое устремление', (
        <div className="space-y-3.5 pb-3 font-sans">
          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Название цели</label>
            <input
              type="text"
              placeholder="напр. Получить оффер, Выучить язык"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs w-full focus:outline-none text-slate-750 font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Заметки и вехи</label>
            <textarea
              rows={2}
              placeholder="Что предстоит сделать и в какие сроки…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 py-2 text-xs w-full focus:outline-none text-slate-750 h-16 resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Life Domain categories options */}
          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1.5 block">Сфера жизни</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = cat === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCat(c.key)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[9.5px] font-black leading-tight cursor-pointer transition-all"
                    style={{
                      borderColor: isSelected ? c.color : 'rgba(230,225,220,0.7)',
                      backgroundColor: isSelected ? `${c.color}15` : '#fbfbfa',
                      color: isSelected ? c.color : '#78716c'
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-stone-400 tracking-wider uppercase mb-1 block">Дедлайн выполнения</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-10 border border-stone-200 bg-[#fbfbfa] rounded-xl px-3 text-xs font-mono font-bold w-full focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-[10px] font-black uppercase">
              <label className="text-stone-400">Прогресс</label>
              <span className="font-mono text-xs font-black" style={{ color: activeColor }}>
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              style={{
                backgroundImage: `linear-gradient(90deg, ${activeColor} ${progress}%, #ece9e3 ${progress}%)`,
              }}
              className="w-full h-1.5 rounded-full cursor-pointer stk-range"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            {existingGoal && (
              <button
                onClick={() => {
                  actions.deleteGoal(existingGoal.id);
                  onClose();
                }}
                className="bg-red-50 hover:bg-red-100 text-red-650 p-3.5 rounded-xl border border-red-200/50 hover:border-red-500 duration-200 shrink-0 cursor-pointer"
                title="Удалить цель"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 text-white font-black py-3 rounded-xl text-center text-xs shadow-sm cursor-pointer"
              style={{ backgroundColor: activeColor }}
            >
              {existingGoal ? 'Сохранить изменения' : 'Создать цель'}
            </button>
          </div>
        </div>
      ));
    })();
  }

  return null;
}
