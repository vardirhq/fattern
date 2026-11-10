/**
 * Labelled navigation sidebar on the paper ground.
 * The active item is an ink chip; overdue invoices show as a count.
 * Icons come from @tabler/icons-react.
 */
import { useTranslation } from 'react-i18next';
import {
  IconLayoutDashboard,
  IconFileInvoice,
  IconReceipt,
  IconUsers,
  IconPackage,
  IconCalendarStats,
  IconSettings,
} from '@tabler/icons-react';
import { FatternLogo } from '../brand/FatternMark';

/* Map nav labels (internal identifiers, always Norwegian) → i18n keys */
const NAV_KEY_MAP = {
  'Oversikt':      'nav.overview',
  'Fakturaer':     'nav.invoices',
  'Utgifter':      'nav.expenses',
  'Kunder':        'nav.customers',
  'Produkter':     'nav.products',
  'Budsjettår':    'nav.budget_years',
  'Innstillinger': 'nav.settings',
};

const ICONS = {
  Oversikt:      IconLayoutDashboard,
  Fakturaer:     IconFileInvoice,
  Utgifter:      IconReceipt,
  Kunder:        IconUsers,
  Produkter:     IconPackage,
  Budsjettår:    IconCalendarStats,
  Innstillinger: IconSettings,
};

const NAV_GROUPS = [
  ['Oversikt', 'Fakturaer', 'Utgifter'],
  ['Kunder', 'Produkter', 'Budsjettår'],
];
const BOTTOM_ITEMS = ['Innstillinger'];

function NavItem({ label, isActive, onClick, badge }) {
  const { t } = useTranslation();
  const Icon = ICONS[label];
  const displayLabel = NAV_KEY_MAP[label] ? t(NAV_KEY_MAP[label]) : label;
  const count = typeof badge === 'number' ? badge : 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(label)}
      aria-current={isActive ? 'page' : undefined}
      className={isActive ? undefined : 'f-nav-item'}
      style={{
        width: '100%',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--f-font-sans)',
        fontSize: 14,
        fontWeight: 500,
        background: isActive ? 'var(--f-inverse-bg)' : 'transparent',
        color: isActive ? 'var(--f-inverse-text)' : 'var(--f-text-soft)',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {Icon && <Icon size={18} stroke={1.7} aria-hidden="true" />}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayLabel}
      </span>
      {count > 0 && (
        <span
          className="f-num"
          style={{
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            background: isActive ? 'var(--f-inverse-text)' : 'var(--f-danger-bg)',
            color: 'var(--f-danger-text)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function Sidebar({ navItems, activeNavItem, onNavigate, badges = {} }) {
  const allLabels = (navItems || []).map(n => n.label);

  const renderGroup = (group) =>
    group
      .filter(label => allLabels.includes(label) || ICONS[label])
      .map(label => (
        <NavItem
          key={label}
          label={label}
          isActive={activeNavItem === label}
          onClick={onNavigate}
          badge={badges[label]}
        />
      ));

  return (
    <nav
      aria-label="Hovedmeny"
      style={{
        width: 'var(--f-rail-w)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: '20px 14px 16px',
        background: 'var(--f-surface-rail)',
        overflowY: 'auto',
      }}
    >
      <style>{`
        .f-nav-item:hover { background: var(--f-hover-elevated) !important; color: var(--f-text) !important; }
      `}</style>

      <div style={{ padding: '0 8px' }}>
        <FatternLogo size={30} />
      </div>

      {NAV_GROUPS.map((group, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderGroup(group)}
        </div>
      ))}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {renderGroup(BOTTOM_ITEMS)}
      </div>
    </nav>
  );
}
