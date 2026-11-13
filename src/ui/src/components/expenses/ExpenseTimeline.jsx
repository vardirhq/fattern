// src/ui/src/components/expenses/ExpenseTimeline.jsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpenseTimelineRow } from './ExpenseTimelineRow';

function monthLabel(yyyyMm, lng, unknownLabel) {
  if (yyyyMm === 'ukjent') return unknownLabel;
  const [year, month] = yyyyMm.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return new Intl.DateTimeFormat(lng, { month: 'long', year: 'numeric' }).format(date);
}

export function ExpenseTimeline({ expenses = [], formatCurrency, onSelectExpense, selectedExpenseId }) {
  const { t, i18n } = useTranslation();

  const groups = useMemo(() => {
    const map = new Map();
    for (const expense of expenses) {
      const key = expense.date ? expense.date.slice(0, 7) : 'ukjent';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(expense);
    }
    // Sort groups descending
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);

  if (groups.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
        {t('expense.no_expenses')}
      </div>
    );
  }

  return (
    <div>
      {groups.map(([monthKey, rows]) => {
        const groupTotal = rows.reduce((sum, e) => sum + (e.amount || 0), 0);
        return (
          <div key={monthKey} style={{ marginBottom: 24 }}>
            {/* Month divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ink-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                {monthLabel(monthKey, i18n.language, t('expense.unknown_date'))}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                {formatCurrency ? formatCurrency(groupTotal) : groupTotal}
              </span>
            </div>

            {/* Rows */}
            {rows.map((expense) => (
              <ExpenseTimelineRow
                key={expense.id}
                expense={expense}
                formatCurrency={formatCurrency}
                isSelected={selectedExpenseId === expense.id}
                onClick={() => onSelectExpense?.(expense.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
