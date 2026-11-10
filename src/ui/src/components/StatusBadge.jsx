import { useTranslation } from 'react-i18next';
import {
  IconCircleCheck,
  IconSend,
  IconFile,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react';
import { statusBadge } from '../data/mockData.jsx';

const statusIcons = {
  paid:      IconCircleCheck,
  sent:      IconSend,
  draft:     IconFile,
  overdue:   IconAlertCircle,
  cancelled: IconX,
};

export function StatusBadge({ status, className = '' }) {
  const { t } = useTranslation();
  const Icon = statusIcons[status] || IconFile;
  const badgeClass = statusBadge[status] || 'f-pill-draft';
  const label = t(`status.${status}`, { defaultValue: status || t('errors.not_available') });

  return (
    <span
      className={badgeClass}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        padding: '3px 10px',
        fontFamily: 'var(--f-font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} stroke={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}
