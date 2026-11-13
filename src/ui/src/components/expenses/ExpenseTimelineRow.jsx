// src/ui/src/components/expenses/ExpenseTimelineRow.jsx
import { useTranslation } from 'react-i18next';
import { IconPaperclip } from '@tabler/icons-react';
import { formatDate } from '../../utils/formatDate';

export function ExpenseTimelineRow({ expense, formatCurrency, isSelected, onClick }) {
  const { t } = useTranslation();
  const accentColor = expense.category_color || 'var(--ink-subtle)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        border: isSelected ? '2px solid var(--ink)' : '1px solid var(--line)',
        padding: isSelected ? '9px 13px' : '10px 14px',
        background: 'var(--surface)',
        transition: 'border-color 150ms, background 150ms',
        marginBottom: 6,
      }}
    >
      {/* Category dot */}
      <span
        aria-hidden="true"
        style={{ width: 10, height: 10, borderRadius: 'var(--radius-md)', background: accentColor, flexShrink: 0 }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {expense.vendor || t('expense.unknown_vendor')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
          <span>{expense.date ? formatDate(expense.date) : '—'}</span>
          {expense.category_name && (
            <>
              {' · '}
              <span>{expense.category_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: amount + attachment indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {expense.attachment_path && (
          <IconPaperclip size={14} stroke={1.5} title={t('expense.has_receipt')} aria-label={t('expense.has_receipt')} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
        )}
        <span className="ft-mono" style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          {formatCurrency ? formatCurrency(expense.amount) : expense.amount}
        </span>
      </div>
    </div>
  );
}
