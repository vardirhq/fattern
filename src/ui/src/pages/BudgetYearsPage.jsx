import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  IconCalendar, IconEdit, IconTrash, IconCheck, IconPlus,
  IconTrendingUp, IconTrendingDown,
  IconAlertCircle, IconCoin, IconReceipt,
} from '@tabler/icons-react';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

function getDbApi() {
  return typeof window !== 'undefined' ? window.fattern?.db : null;
}

export function BudgetYearsPage({
  budgetYears,
  selectedYearId,
  onSelectYear,
  onCreateYear,
  onEditYear,
  onDeleteYear,
  formatCurrency: formatCurrencyProp,
}) {
  const { t } = useTranslation();
  const [yearSummaries, setYearSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState({});

  const formatCurrencyFn = formatCurrencyProp || formatCurrency;

  useEffect(() => {
    const loadSummaries = async () => {
      const api = getDbApi();
      if (!api?.getIncomeExpenseSummary) return;

      const summaries = {};
      const loading = {};

      for (const year of budgetYears) {
        loading[year.id] = true;
        try {
          const summary = await api.getIncomeExpenseSummary(year.id);
          summaries[year.id] = {
            income: summary?.income ?? 0,
            expenses: summary?.expenses ?? 0,
            net: summary?.net ?? 0,
            paid: summary?.paid ?? 0,
            unpaid: summary?.unpaid ?? 0,
            overdue: summary?.overdue ?? 0,
          };
        } catch (error) {
          console.error(`Failed to load summary for year ${year.id}`, error);
          summaries[year.id] = { income: 0, expenses: 0, net: 0, paid: 0, unpaid: 0, overdue: 0 };
        } finally {
          loading[year.id] = false;
        }
      }

      setYearSummaries(summaries);
      setLoadingSummaries(loading);
    };

    if (budgetYears.length > 0) {
      loadSummaries();
    }
  }, [budgetYears]);

  const handleSetActive = (yearId) => {
    onSelectYear?.(yearId);
  };

  const getYearProgress = (year) => {
    const start = year.start ?? year.start_date;
    const end = year.end ?? year.end_date;
    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

    return {
      totalDays,
      daysElapsed,
      daysRemaining,
      progress,
      isActive: today >= startDate && today <= endDate,
      isFuture: today < startDate,
      isPast: today > endDate,
    };
  };

  const sortedYears = useMemo(() => {
    return [...budgetYears].sort((a, b) => {
      const aStart = a.start ?? a.start_date;
      const bStart = b.start ?? b.start_date;
      if (!aStart || !bStart) return 0;
      return new Date(bStart) - new Date(aStart);
    });
  }, [budgetYears]);

  return (
    <div className="space-y-6">
      <header style={{ position: 'relative' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'transparent' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg-flex-row lg-items-start lg-justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.subtitle')}</p>
              <h1 className="mt-1 text-3xl font-semibold" style={{ color: 'var(--ink)' }}>{t('budget_years_page.title')}</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
                {t('budget_years_page.desc')}
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateYear}
              className="ft-btn ft-btn-primary flex items-center gap-2 r-lg px-5 py-3 text-sm font-semibold transition"
            >
              <IconPlus size={15} stroke={1.8} />
              {t('budget_years_page.new_button')}
            </button>
          </div>
        </div>
      </header>

      {budgetYears.length === 0 ? (
        <div className="ft-card r-lg p-12 text-center">
          <IconCalendar size={48} stroke={1.4} style={{ color: 'var(--ink-muted)', margin: '0 auto 16px' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--ink)' }}>{t('budget_years_page.empty_title')}</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            {t('budget_years_page.empty_desc')}
          </p>
          <button
            type="button"
            onClick={onCreateYear}
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold transition"
          >
            {t('budget_years_page.create_button')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedYears.map((year) => {
            const isActive = selectedYearId === year.id;
            const start = year.start ?? year.start_date;
            const end = year.end ?? year.end_date;
            const summary = yearSummaries[year.id] || { income: 0, expenses: 0, net: 0, paid: 0, unpaid: 0, overdue: 0 };
            const isLoading = loadingSummaries[year.id];
            const progress = getYearProgress(year);

            return (
              <motion.div
                key={year.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: sortedYears.indexOf(year) * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="ft-card r-lg overflow-hidden transition"
                style={isActive ? { borderColor: 'var(--brand-line)', boxShadow: 'none' } : {}}
              >
                {/* Header */}
                <div className="relative overflow-hidden p-6" style={{ borderBottom: '1px solid var(--line)', background: 'transparent' }}>
                  <div className="relative z-10 flex flex-col gap-4 lg-flex-row lg-items-start lg-justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{year.label}</h2>
                        {isActive && (
                          <div className="flex items-center gap-1-5 r-full px-3 py-1" style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-line)' }}>
                            <IconCheck size={14} stroke={2} style={{ color: 'var(--brand-ink)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--brand-ink)' }}>{t('budget_years_page.active_badge')}</span>
                          </div>
                        )}
                        {progress?.isFuture && (
                          <span className="r-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--hover)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}>
                            {t('budget_years_page.future_badge')}
                          </span>
                        )}
                        {progress?.isPast && (
                          <span className="r-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--hover)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}>
                            {t('budget_years_page.past_badge')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--ink-muted)' }}>
                        <div className="flex items-center gap-1-5">
                          <IconCalendar size={15} stroke={1.8} />
                          <span>
                            {start ? formatDate(start) : '—'} → {end ? formatDate(end) : '—'}
                          </span>
                        </div>
                        {progress && (
                          <>
                            {progress.isActive && (
                              <div className="flex items-center gap-1-5">
                                <span className="text-xs">
                                  {t('budget_years_page.progress', { pct: Math.round(progress.progress), days: progress.daysRemaining })}
                                </span>
                              </div>
                            )}
                            {progress.isFuture && (
                              <span className="text-xs">{t('budget_years_page.starts_in', { days: progress.daysRemaining })}</span>
                            )}
                            {progress.isPast && (
                              <span className="text-xs">{t('budget_years_page.ended_ago', { days: Math.abs(progress.daysRemaining) })}</span>
                            )}
                          </>
                        )}
                      </div>
                      {progress?.isActive && progress.progress > 0 && (
                        <div className="mt-3 h-2 w-full r-full overflow-hidden relative" style={{ background: 'var(--hover-strong)' }}>
                          <motion.div
                            className="h-full relative overflow-hidden"
                            style={{ background: 'var(--brand)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          >
                            <motion.div
                              className="absolute top-0 bottom-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, var(--hover-strong) 50%, transparent 100%)',
                                width: '50%',
                              }}
                              animate={{ x: ['-50%', '150%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0 }}
                            />
                          </motion.div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleSetActive(year.id)}
                          className="ft-btn ft-btn-primary r-lg px-4 py-2 text-sm font-medium transition"
                        >
                          {t('budget_years_page.set_active')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditYear?.(year)}
                        className="ft-btn ft-btn-secondary r-lg px-4 py-2 text-sm font-medium transition flex items-center gap-1-5"
                      >
                        <IconEdit size={15} stroke={1.8} />
                        {t('common.edit')}
                      </button>
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => onDeleteYear?.(year)}
                          className="ft-btn ft-btn-danger r-lg px-4 py-2 text-sm font-medium transition flex items-center gap-1-5"
                        >
                          <IconTrash size={15} stroke={1.8} />
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="p-6">
                  {isLoading ? (
                    <div className="py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.loading_stats')}</div>
                  ) : (
                    <div className="grid gap-4 md-grid-cols-2 lg-grid-cols-3">
                      {/* Income */}
                      <div className="r-lg p-4" style={{ background: 'var(--hover)', border: '1px solid var(--line)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="r-md p-2" style={{ background: 'var(--brand-soft)' }}>
                            <IconCoin size={18} stroke={1.6} style={{ color: 'var(--brand-ink)' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.income')}</p>
                            <p className="text-xl font-semibold mt-0-5" style={{ color: 'var(--ink)' }}>
                              {formatCurrencyFn(summary.income)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 space-y-1-5 text-xs" style={{ borderTop: '1px solid var(--line)' }}>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.paid')}</span>
                            <span className="font-medium" style={{ color: 'var(--success)' }}>{formatCurrencyFn(summary.paid)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.unpaid')}</span>
                            <span className="font-medium" style={{ color: 'var(--ink)' }}>{formatCurrencyFn(summary.unpaid)}</span>
                          </div>
                          {summary.overdue > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
                                <IconAlertCircle size={12} stroke={2} />
                                {t('budget_years_page.overdue')}
                              </span>
                              <span className="font-medium" style={{ color: 'var(--danger)' }}>{formatCurrencyFn(summary.overdue)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expenses */}
                      <div className="r-lg p-4" style={{ background: 'var(--hover)', border: '1px solid var(--line)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="r-md p-2" style={{ background: 'var(--danger-soft)' }}>
                            <IconReceipt size={18} stroke={1.6} style={{ color: 'var(--danger)' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.expenses')}</p>
                            <p className="text-xl font-semibold mt-0-5" style={{ color: 'var(--ink)' }}>
                              {formatCurrencyFn(summary.expenses)}
                            </p>
                          </div>
                        </div>
                        {summary.income > 0 && (
                          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.expense_ratio')}</span>
                              <span className="font-medium" style={{ color: 'var(--ink)' }}>
                                {Math.round((summary.expenses / summary.income) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Net */}
                      <div className="r-lg p-4" style={{
                        background: summary.net >= 0 ? 'var(--brand-soft)' : 'var(--danger-soft)',
                        border: summary.net >= 0 ? '1px solid var(--brand-line)' : '1px solid var(--danger-line)',
                      }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="r-md p-2" style={{ background: summary.net >= 0 ? 'var(--brand-soft)' : 'var(--danger-soft)' }}>
                            {summary.net >= 0 ? (
                              <IconTrendingUp size={18} stroke={1.6} style={{ color: 'var(--brand-ink)' }} />
                            ) : (
                              <IconTrendingDown size={18} stroke={1.6} style={{ color: 'var(--danger)' }} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.net')}</p>
                            <p className="text-xl font-semibold mt-0-5" style={{ color: summary.net >= 0 ? 'var(--ink)' : 'var(--danger)' }}>
                              {formatCurrencyFn(summary.net)}
                            </p>
                          </div>
                        </div>
                        {summary.income > 0 && (
                          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: 'var(--ink-muted)' }}>{t('budget_years_page.margin')}</span>
                              <span className="font-medium" style={{ color: summary.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {summary.net >= 0 ? '+' : ''}{Math.round((summary.net / summary.income) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
