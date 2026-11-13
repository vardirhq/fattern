import { useTranslation } from 'react-i18next';
import {
  IconCheck,
  IconSend,
  IconPencil,
  IconAlertCircle,
  IconArrowBackUp,
} from '@tabler/icons-react';
import { statusBadge } from '../data/mockData.jsx';

const statusIcons = {
  paid:      IconCheck,
  sent:      IconSend,
  draft:     IconPencil,
  overdue:   IconAlertCircle,
  cancelled: IconArrowBackUp,
};

export function StatusBadge({ status, className = '' }) {
  const { t } = useTranslation();
  const Icon = statusIcons[status] || IconPencil;
  const badgeClass = statusBadge[status] || 'ft-badge';
  const label = t(`status.${status}`, { defaultValue: status || t('errors.not_available') });

  return (
    <span className={`${badgeClass} ${className}`.trim()}>
      <Icon size={12} stroke={2} aria-hidden="true" />
      {label}
    </span>
  );
}
