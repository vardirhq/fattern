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
          color: 'var(--ink-muted)', pointerEvents: 'none', zIndex: 1,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('common.search')}
        style={{
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          backdropFilter: 'blur(12px)',
          color: 'var(--ink)',
          fontSize: 13,
          padding: '7px 34px',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--brand-line)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--line)')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Tøm søk"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconX size={14} stroke={2} />
        </button>
      )}
    </div>
  );
}
