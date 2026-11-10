import { useTranslation } from 'react-i18next';
import { IconSearch, IconX } from '@tabler/icons-react';

export function SearchBar({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  return (
    <div style={{ position: 'relative' }}>
      <IconSearch
        size={15}
        stroke={1.8}
        style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--f-text-subtle)', pointerEvents: 'none', zIndex: 1,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('common.search')}
        style={{
          width: '100%',
          borderRadius: 10,
          border: '1px solid var(--f-border)',
          background: 'var(--f-surface)',
          backdropFilter: 'blur(12px)',
          color: 'var(--f-text-body)',
          fontSize: 13,
          padding: '7px 34px',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--f-border-green)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--f-border)')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Tøm søk"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--f-text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconX size={14} stroke={2} />
        </button>
      )}
    </div>
  );
}
