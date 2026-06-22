/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Sparkles, Star, ShieldAlert, Award, Zap, HelpCircle, Mail, Globe, Milestone } from 'lucide-react';

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  isPremium: boolean;
  onActivatePremium: () => void;
}

export default function PremiumPaywallModal({
  isOpen,
  onClose,
  language,
  isPremium,
  onActivatePremium
}: PremiumPaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'lifetime'>('lifetime');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  if (!isOpen) return null;

  const isRu = language === 'ru';

  const handleSubscribe = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onActivatePremium();
    }, 1800);
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'FIRST10' || couponCode.toUpperCase() === 'PROMO') {
      setCouponSuccess(true);
    } else {
      alert(isRu ? 'Неверный промокод' : 'Invalid promo code');
    }
  };

  const planPriceWeekly = isRu ? '149 ₽ / неделя' : '$1.99 / week';
  const planPriceMonthly = isRu ? '399 ₽ / месяц' : '$4.99 / month';
  const planPriceLifetime = isRu ? '1490 ₽' : '$19.99';
  const planPriceLifetimeDiscounted = isRu ? '990 ₽' : '$14.99';

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#1a1917] border border-amber-950/10 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-left relative">
        
        {/* Absolute Background Glow */}
        <div className="absolute top-0 left-12 right-12 h-36 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-850 flex items-center justify-between shrink-0 bg-stone-50/25 dark:bg-[#201f1d]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-widest block font-mono">
                {isRu ? 'ТАРИФ PREMIUM' : 'PREMIUM SUBSCRIPTION'}
              </span>
              <h3 className="text-xs font-black text-slate-850 dark:text-stone-100 uppercase tracking-wide mt-0.5">
                {isRu ? 'Прокачай свои привычки и цели' : 'Unchain your habit & milestone trackers'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-stone-100 dark:bg-stone-880 p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 select-none no-scrollbar">
          
          {success ? (
            <div className="text-center py-8 space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                🎉
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-black text-stone-850 dark:text-stone-100">
                  {isRu ? 'Добро пожаловать в Pro-клуб!' : 'Welcome to Pro Member Club!'}
                </h4>
                <p className="text-xs text-stone-550 dark:text-stone-300 max-w-sm mx-auto leading-relaxed">
                  {isRu 
                    ? 'Ваша пожизненная подписка успешно активирована. Все продвинутые функции теперь разблокированы навечно!'
                    : 'Your membership is now active! All in-app analytic features and lifetime data synchronic operations are unlocked.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="bg-amber-950 dark:bg-amber-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
                >
                  {isRu ? 'Начать пользоваться' : 'Start tracking as Premium'}
                </button>
              </div>
            </div>
          ) : isPremium ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                <Star className="w-7 h-7 fill-amber-500 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-stone-850 dark:text-stone-100">
                  {isRu ? 'Ваш аккаунт имеет PRO статус' : 'You are currently a PRO member'}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                  {isRu 
                    ? 'Спасибо, что поддержали продукт! Ограничения сняты, расширенные инсайты работают.'
                    : 'Thank you for supporting this localized product! Active subscriptions enjoy persistent cloud-like backups.'}
                </p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded-2xl p-4 text-xs font-bold text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-400">{isRu ? 'План:' : 'Plan:'}</span>
                  <span className="text-amber-800 dark:text-amber-400">{isRu ? 'Пожизненный безлимит (Lifetime)' : 'Lifetime Unlimited Access'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">{isRu ? 'Статус:' : 'Status:'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{isRu ? 'Активен навсегда' : 'Active permanently'}</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  {isRu ? 'Отлично' : 'Perfect'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Feature Benefits List */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-black text-stone-400 dark:text-stone-500 block">
                  {isRu ? '★ ЧТО ВКЛЮЧЕНО В ПОДПИСКУ' : '★ WHAT IS UNLOCKED'}
                </span>
                
                <div className="grid gap-2.5">
                  <div className="flex items-start gap-2.5 text-xs text-left">
                    <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div>
                      <span className="font-extrabold text-stone-850 dark:text-stone-200 block">
                        {isRu ? 'Полный безлимит замеров и привычек' : 'No tracking limits on logs'}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-stone-550 block mt-0.5">
                        {isRu 
                          ? 'Убирайте ограничения на число привычек, дел и рассчетов дневного веса.' 
                          : 'Create infinite custom routines, task calendars, and record health variables perfectly.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-left">
                    <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-stone-850 dark:text-stone-200 block">
                        {isRu ? 'Продвинутая Инфографика & Пики' : 'Elite Cognitive Peak Analytics'}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-stone-550 block mt-0.5">
                        {isRu 
                          ? 'Доступ к тепловой карте с подробной статистикой продуктивности по лучшим дням.' 
                          : 'Activate smart calculation on peak productivity days, averages, and behavioral trends.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-left">
                    <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                      <Milestone className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div>
                      <span className="font-extrabold text-stone-850 dark:text-stone-200 block">
                        {isRu ? 'Интеграция с Apple & Google календарями' : 'Full External Calendars (.ICS) Sync'}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-stone-550 block mt-0.5">
                        {isRu 
                          ? 'Экспорт дел в формат iCal для синхронизации расписания со смартфона.' 
                          : 'Sync checklists and sleep logs across external platforms via fully formatted .ics export schedules.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plans Comparison Section with App Store Insight */}
              <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded-2xl p-3 text-center text-xs text-stone-500 space-y-2 italic">
                <p className="text-[10px] font-semibold text-slate-700 dark:text-stone-300">
                  {isRu 
                    ? '📢 В отличие от других систем трекинга в Google Play и App Store, которые заставляют вас платить ежемесячно, мы убрали рекламу и предлагаем ПОЖИЗНЕННЫЙ доступ за цену одной чашки кофе!'
                    : '📢 Unlike cluttered alternatives on standard markets forcing repetitive weekly charges, we offer local data privacy and an accessible LIFETIME pack.'}
                </p>
              </div>

              {/* Subscription Plans Selection Card-boxes */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-black text-stone-400 dark:text-stone-500 block">
                  {isRu ? '★ ВЫБЕРИТЕ УДОБНЫЙ ТАРИФ' : '★ SELECT SUBSCRIPTION PLAN'}
                </span>

                <div className="grid gap-2.5">
                  {[
                    {
                      id: 'weekly',
                      title: isRu ? 'Недельный пакет' : 'Weekly Pass',
                      desc: isRu ? '3 дня бесплатно, затем отмена в любой момент' : '3-day trial period, then cancel anytime',
                      price: planPriceWeekly,
                    },
                    {
                      id: 'monthly',
                      title: isRu ? 'Месячная подписка' : 'Monthly Premium',
                      desc: isRu ? 'Экономия 40% на стабильное планирование' : 'Save 40% on personal routine calendars',
                      price: planPriceMonthly,
                      badge: isRu ? 'Популярный' : 'Popular'
                    },
                    {
                      id: 'lifetime',
                      title: isRu ? 'Пожизненный безлимит' : 'Lifetime Access',
                      desc: isRu ? 'Единоразовый платеж, все обновления включены' : 'No recurrent bills. Major updates free.',
                      price: couponSuccess ? planPriceLifetimeDiscounted : planPriceLifetime,
                      badge: isRu ? 'Лучший выбор' : 'Best Deal',
                      oldPrice: couponSuccess ? planPriceLifetime : null
                    }
                  ].map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id as any)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/5 dark:bg-amber-900/10 border-amber-500 ring-2 ring-amber-500/20'
                            : 'bg-stone-50/20 dark:bg-[#201f1d]/30 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 right-4 text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                            {plan.badge}
                          </span>
                        )}
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs font-black text-slate-800 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wide">
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-amber-500 text-amber-500 bg-amber-500' : 'border-stone-300 dark:border-stone-700'
                              }`}>
                                {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </span>
                              {plan.title}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold block mt-1 leading-normal">
                              {plan.desc}
                            </span>
                          </div>
                          <div className="text-right">
                            {plan.oldPrice && (
                              <span className="text-[9px] line-through text-stone-400 block font-mono font-bold leading-none mb-0.5">
                                {plan.oldPrice}
                              </span>
                            )}
                            <span className="text-xs font-black text-slate-900 dark:text-stone-200 font-mono">
                              {plan.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coupon input field */}
              <div className="flex gap-2 items-center bg-stone-50 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 p-2.5 rounded-2xl">
                <input
                  type="text"
                  placeholder={isRu ? 'Промокод (н-р: FIRST10)' : 'Promo Code (e.g., FIRST10)'}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponSuccess}
                  className="bg-transparent text-xs font-bold w-full uppercase focus:outline-none placeholder-stone-400 dark:placeholder-stone-600 disabled:opacity-60"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponSuccess}
                  className="shrink-0 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:bg-emerald-50 disabled:dark:bg-emerald-950/20 disabled:text-emerald-700 transition font-bold"
                >
                  {couponSuccess ? (isRu ? 'Применен' : 'Applied') : (isRu ? 'Применить' : 'Apply')}
                </button>
              </div>

              {/* Checkout buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 dark:from-amber-600 dark:to-amber-700 text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer disabled:opacity-40"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white hover:animate-spin" />
                  )}
                  <span>
                    {loading 
                      ? (isRu ? 'Обработка платежа...' : 'Processing...') 
                      : (isRu ? 'Активировать аккаунт PRO' : 'Unlock Professional Mode')}
                  </span>
                </button>
                <span className="text-[9px] text-stone-400 dark:text-stone-500 font-medium block text-center leading-relaxed">
                  {isRu 
                    ? 'Ваша покупка защищена. Вы всегда сможете отменить продление в настройках или восстановить эту бессрочную лицензию.'
                    : 'Secured purchase. Restore purchases, read license terms at anytime.'}
                </span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
