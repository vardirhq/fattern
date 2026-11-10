import { IconCheck } from '@tabler/icons-react';

export function Checkbox({ checked, onChange, label, description, disabled = false, className = '' }) {
  return (
    <label
      className={`group flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className="relative flex h-5 w-5 items-center justify-center rounded-md transition-all duration-200"
          style={{
            background: checked ? 'var(--f-green-bg)' : 'rgba(255,255,255,0.06)',
            border: checked ? '1.5px solid var(--f-border-green)' : '1.5px solid var(--f-border)',
            color: checked ? 'var(--f-green-text)' : 'transparent',
            boxShadow: checked ? 'none' : 'none',
          }}
        >
          {checked && <IconCheck size={12} stroke={2.8} />}
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {label && (
          <span
            className="block text-sm font-medium transition-colors"
            style={{ color: checked ? 'var(--f-text-body)' : 'var(--f-text-soft)' }}
          >
            {label}
          </span>
        )}
        {description && (
          <span className="mt-0.5 block text-xs" style={{ color: 'var(--f-text-subtle)' }}>{description}</span>
        )}
      </div>
    </label>
  );
}
