import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  IconFile,
  IconSend,
  IconCircleCheck,
  IconAlertCircle,
  IconX,
  IconChevronDown,
} from '@tabler/icons-react';
import { statusBadge } from '../../data/mockData.jsx';

const STATUS_OPTION_DEFS = [
  { value: 'draft',     labelKey: 'status.draft',     Icon: IconFile         },
  { value: 'sent',      labelKey: 'status.sent',       Icon: IconSend         },
  { value: 'paid',      labelKey: 'status.paid',       Icon: IconCircleCheck  },
  { value: 'overdue',   labelKey: 'status.overdue',    Icon: IconAlertCircle  },
  { value: 'cancelled', labelKey: 'status.cancelled',  Icon: IconX            },
];

export function InvoiceStatusSelector({ invoice, onStatusChange, showModal }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  const currentDef = STATUS_OPTION_DEFS.find((o) => o.value === invoice.status) || STATUS_OPTION_DEFS[0];
  const badgeClass = statusBadge[invoice.status] || 'f-pill-draft';

  // Position dropdown below the badge
  const open = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = async (newStatus) => {
    setIsOpen(false);
    if (newStatus === invoice.status) return;
    if (newStatus === 'paid') {
      showModal?.(invoice, newStatus);
    } else {
      try {
        await onStatusChange?.(invoice, newStatus, null);
      } catch (err) {
        console.error('Kunne ikke oppdatere status', err);
      }
    }
  };

  const dropdown = isOpen ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        minWidth: 150,
        background: 'var(--f-surface-elevated)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--f-border)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        padding: 4,
      }}
    >
      {STATUS_OPTION_DEFS.map(({ value, labelKey, Icon }) => {
        const isActive = value === invoice.status;
        return (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 10px',
              borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--f-green-bg)' : 'transparent',
              color: isActive ? 'var(--f-green-text)' : 'var(--f-text-soft)',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--f-hover-elevated)'; e.currentTarget.style.color = 'var(--f-text-body)'; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; }}}
          >
            <Icon size={13} stroke={1.8} />
            {t(labelKey)}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={open}
        title={t('invoice.status')}
        className={badgeClass}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600,
          borderRadius: 999,
          padding: '3px 8px 3px 10px',
          fontFamily: 'var(--f-font-sans)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        <currentDef.Icon size={12} stroke={2} />
        {t(currentDef.labelKey)}
        <IconChevronDown size={10} stroke={2} style={{ opacity: 0.5, marginLeft: 1 }} />
      </button>
      {dropdown}
    </>
  );
}
