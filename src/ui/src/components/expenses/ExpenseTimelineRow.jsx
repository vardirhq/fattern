// src/ui/src/components/expenses/ExpenseTimelineRow.jsx
import { useTranslation } from 'react-i18next';
import { IconPaperclip } from '@tabler/icons-react';
import { formatDate } from '../../utils/formatDate';

export function ExpenseTimelineRow({ expense, formatCurrency, isSelected, onClick }) {
  const { t } = useTranslation();
  const accentColor = expense.category_color || 'var(--f-text-muted)';

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
        borderRadius: 12,
        cursor: 'pointer',
        border: isSelected ? '2px solid var(--f-text)' : '1px solid var(--f-border)',
        padding: isSelected ? '9px 13px' : '10px 14px',
        background: 'var(--f-surface)',
        transition: 'border-color 150ms, background 150ms',
        marginBottom: 6,
      }}
    >
      {/* Category dot */}
      <span
        aria-hidden="true"
        style={{ width: 10, height: 10, borderRadius: 5, background: accentColor, flexShrink: 0 }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--f-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {expense.vendor || t('expense.unknown_vendor')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--f-text-subtle)', marginTop: 2 }}>
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
          <IconPaperclip size={14} stroke={1.5} title={t('expense.has_receipt')} aria-label={t('expense.has_receipt')} style={{ color: 'var(--f-text-subtle)', flexShrink: 0 }} />
        )}
        <span className="f-num" style={{ fontWeight: 600, fontSize: 14, color: 'var(--f-text)', whiteSpace: 'nowrap' }}>
          {formatCurrency ? formatCurrency(expense.amount) : expense.amount}
        </span>
      </div>
    </div>
  );
}
