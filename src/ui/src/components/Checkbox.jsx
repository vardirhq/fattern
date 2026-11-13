import { IconCheck } from '@tabler/icons-react';

export function Checkbox({ checked, onChange, label, description, disabled = false, className = '' }) {
  return (
    <label
      className={`group flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <div className="relative shrink-0 mt-0-5 pt-0-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className="ft-checkbox-box relative flex h-4 w-4 items-center justify-center transition-all"
          style={{
            borderRadius: 'var(--radius-xs)',
            background: checked ? 'var(--brand)' : 'var(--surface)',
            border: checked ? '1px solid var(--brand)' : '1px solid var(--line-strong)',
            color: checked ? 'var(--on-brand)' : 'transparent',
          }}
        >
          {checked && <IconCheck size={12} stroke={2.8} />}
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-0-5">
        {label && (
          <span
            className="block text-sm font-medium transition-colors"
            style={{ color: 'var(--ink)' }}
          >
            {label}
          </span>
        )}
        {description && (
          <span className="mt-0-5 block text-xs" style={{ color: 'var(--ink-muted)' }}>{description}</span>
        )}
      </div>
    </label>
  );
}
