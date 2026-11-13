import {
  IconLayoutDashboard,
  IconFileInvoice,
  IconReceipt,
  IconUsers,
  IconPackage,
  IconCalendarStats,
  IconSettings,
} from '@tabler/icons-react';

export const navItems = [
  { label: 'Oversikt',      icon: <IconLayoutDashboard size={18} stroke={1.6} /> },
  { label: 'Fakturaer',     icon: <IconFileInvoice     size={18} stroke={1.6} /> },
  { label: 'Utgifter',      icon: <IconReceipt         size={18} stroke={1.6} /> },
  { label: 'Kunder',        icon: <IconUsers           size={18} stroke={1.6} /> },
  { label: 'Produkter',     icon: <IconPackage         size={18} stroke={1.6} /> },
  { label: 'Budsjettår',    icon: <IconCalendarStats   size={18} stroke={1.6} /> },
  { label: 'Innstillinger', icon: <IconSettings        size={18} stroke={1.6} /> },
];

export const workflowShortcuts = [
  { label: 'Ny faktura',         helper: '⌘ N' },
  { label: 'Registrer betaling', helper: '⌘ P' },
  { label: 'Legg til utgift',    helper: '⌘ E' },
];

export const statusBadge = {
  paid:    'ft-badge ft-badge-paid',
  sent:    'ft-badge ft-badge-sent',
  draft:   'ft-badge',
  overdue: 'ft-badge ft-badge-overdue',
  cancelled: 'ft-badge ft-badge-credited',
};

export const statusLabel = {
  paid:    'Betalt',
  sent:    'Sendt',
  draft:   'Utkast',
  overdue: 'Forfalt',
};
