// src/ui/src/components/expenses/ExpenseCategoryChips.jsx
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../SearchBar';

export function ExpenseCategoryChips({ breakdown = [], activeCategory, onSelectCategory, query = '', onQueryChange }) {
  const { t } = useTranslation();

  const chipBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 'var(--radius-lg)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  };

  const chipActive = {
    background: 'var(--ink)',
    color: 'var(--bg)',
    borderColor: 'var(--ink)',
  };

  const chipInactive = {
    background: 'var(--surface-sunken)',
    color: 'var(--ink-muted)',
    borderColor: 'var(--line)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 260px', minWidth: 200, order: -1, marginRight: 8 }}>
        <SearchBar value={query} onChange={(v) => onQueryChange?.(v)} />
      </div>
      {/* "Alle" chip */}
      <button
        type="button"
        style={{ ...chipBase, ...(activeCategory === null ? chipActive : chipInactive) }}
        onClick={() => onSelectCategory?.(null)}
      >
        {t('expense.all_expenses_label', 'Alle')}
      </button>

      {/* Category chips */}
      {breakdown.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id ?? 'uncategorised'}
            type="button"
            style={{
              ...chipBase,
              ...(isActive ? chipActive : chipInactive),
            }}
            onClick={() => onSelectCategory?.(isActive ? null : cat.id)}
          >
            {(
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: cat.color || 'var(--ink-subtle)',
                  flexShrink: 0,
                }}
              />
            )}
            {cat.name}
          </button>
        );
      })}

    </div>
  );
}
