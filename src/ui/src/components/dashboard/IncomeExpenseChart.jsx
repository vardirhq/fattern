import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function formatCurrencyShort(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
}

const CustomTooltip = ({ active, payload, label, incomeLabel, expensesLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-lg text-sm" style={{ background: 'var(--f-surface-elevated)', border: '1px solid var(--f-border)' }}>
      <p className="font-semibold mb-2" style={{ color: 'var(--f-text-body)' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name === 'income' ? incomeLabel : expensesLabel}:{' '}
          {new Intl.NumberFormat('nb-NO', {
            style: 'currency',
            currency: 'NOK',
            maximumFractionDigits: 0,
          }).format(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function IncomeExpenseChart({ data = [] }) {
  const { t } = useTranslation();
  const incomeLabel = t('dashboard_view.income');
  const expensesLabel = t('dashboard_view.expenses_label');

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm" style={{ color: 'var(--f-text-subtle)' }}>
        {t('dashboard_view.no_data_for_period')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--f-border-faint)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--f-text-subtle)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyShort}
          tick={{ fontSize: 11, fill: 'var(--f-text-subtle)' }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          content={<CustomTooltip incomeLabel={incomeLabel} expensesLabel={expensesLabel} />}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8, color: 'var(--f-text-soft)' }}
          formatter={(value) => (value === 'income' ? incomeLabel : expensesLabel)}
        />
        <Bar dataKey="income" name="income" fill="var(--f-green)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="expenses" fill="var(--f-chart-muted, #C9C3B4)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
