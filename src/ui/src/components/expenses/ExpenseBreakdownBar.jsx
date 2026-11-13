// src/ui/src/components/expenses/ExpenseBreakdownBar.jsx
import { useTranslation } from 'react-i18next';

export function ExpenseBreakdownBar({ breakdown = [], activeCategory, onSelectCategory }) {
  const { t } = useTranslation();
  const grandTotal = breakdown.reduce((sum, c) => sum + c.total, 0) || 1;
  const DEFAULT_COLOR = '#555555';

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          height: 12,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--surface-sunken)',
        }}
      >
        {breakdown.map((cat) => (
          <button
            key={cat.id ?? 'uncategorised'}
            type="button"
            title={cat.name}
            aria-label={t('expense.filter_by', { name: cat.name })}
            style={{
              flex: cat.total / grandTotal,
              background: cat.color || DEFAULT_COLOR,
              cursor: 'pointer',
              transition: 'opacity 150ms',
              opacity: activeCategory === null || activeCategory === cat.id ? 1 : 0.35,
              border: 'none',
              padding: 0,
            }}
            onClick={() => onSelectCategory?.(activeCategory === cat.id ? null : cat.id)}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 10 }}>
        {breakdown.map((cat) => {
          const pct = ((cat.total / grandTotal) * 100).toFixed(1);
          const isActive = activeCategory === cat.id;
          const color = cat.color || DEFAULT_COLOR;
          return (
            <button
              key={cat.id ?? 'uncategorised'}
              type="button"
              aria-label={t('expense.filter_by_pct', { name: cat.name, pct })}
              onClick={() => onSelectCategory?.(activeCategory === cat.id ? null : cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                opacity: activeCategory === null || isActive ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                  outline: isActive ? `2px solid ${color}` : 'none',
                  outlineOffset: 2,
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                {cat.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginLeft: 2 }}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
