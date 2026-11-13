import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconBuilding,
  IconCalendarStats,
  IconChevronUp,
  IconCheck,
  IconCirclePlus,
  IconFileInvoice,
  IconPackage,
  IconReceipt,
  IconStatusChange,
  IconUsers,
} from '@tabler/icons-react';
import { APP_VERSION } from '../../utils/version';

/**
 * Persistent command/status bar at the bottom of the shell.
 * Shows the active company, quick actions, and local/version status.
 */
export function BottomBar({
  company,
  actions = [],
  budgetYears = [],
  selectedBudgetYearId,
  status = {},
  onBudgetYearChange,
  onCompanyClick,
  onCreateBudgetYear,
}) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const actionsRef = useRef([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isBudgetYearOpen, setIsBudgetYearOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const displayName = company?.name && company.name !== 'Default Company'
    ? company.name
    : 'Fattern';

  /* Derive initials from first two words */
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const iconMap = {
    invoice: IconFileInvoice,
    payment: IconStatusChange,
    expense: IconReceipt,
    customer: IconUsers,
    product: IconPackage,
    budgetYear: IconCalendarStats,
  };

  const commandActions = actions.length ? actions : [];
  const primaryShortcut = '⌘ K';
  actionsRef.current = commandActions;
  const activeBudgetYear = budgetYears.find((year) => year.id === selectedBudgetYearId);
  const activeBudgetYearLabel = activeBudgetYear?.label || activeBudgetYear?.name || status.budgetYear;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsCommandOpen(false);
        setIsBudgetYearOpen(false);
        setIsStatusOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen((open) => !open);
        setIsBudgetYearOpen(false);
        setIsStatusOpen(false);
        return;
      }

      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        setIsBudgetYearOpen(false);
        setIsStatusOpen(false);
        return;
      }

      const target = event.target;
      const isEditableTarget = target?.isContentEditable
        || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

      if ((event.metaKey || event.ctrlKey) && !isEditableTarget) {
        const shortcutAction = actionsRef.current.find((action) =>
          action.shortcut?.split(/\s+/).pop()?.toLowerCase() === event.key.toLowerCase()
        );

        if (shortcutAction && !shortcutAction.disabled) {
          event.preventDefault();
          shortcutAction.onSelect?.();
          setIsCommandOpen(false);
          setIsBudgetYearOpen(false);
          setIsStatusOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const statusItems = [
    { label: t('layout.bottom_bar.storage'), value: t('layout.bottom_bar.local_storage') },
    { label: t('layout.bottom_bar.version'), value: `v${APP_VERSION}` },
    activeBudgetYearLabel
      ? { label: t('layout.bottom_bar.budget_year'), value: activeBudgetYearLabel }
      : null,
    status.currentPage
      ? { label: t('layout.bottom_bar.current_page'), value: status.currentPage }
      : null,
  ];

  return (
    <div
      ref={rootRef}
      style={{
        height: 'var(--bottombar-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 18px',
        flexShrink: 0,
        background: 'var(--bg)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--line)',
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* Company pill */}
      <button
        type="button"
        onClick={onCompanyClick}
        title={t('layout.bottom_bar.company_settings')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px 12px 4px 6px',
          marginRight: 10,
          flexShrink: 0,
          cursor: onCompanyClick ? 'pointer' : 'default',
          transition: 'background 0.12s, border-color 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--hover)';
          e.currentTarget.style.borderColor = 'var(--brand-line)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--surface)';
          e.currentTarget.style.borderColor = 'var(--line)';
        }}
      >
        <span
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--brand-line)',
            border: '1px solid var(--brand-line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: 'var(--brand)',
          }}
        >
          {initials}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-muted)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>
      </button>

      {/* Command hub */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setIsCommandOpen((open) => !open);
            setIsBudgetYearOpen(false);
            setIsStatusOpen(false);
          }}
          aria-expanded={isCommandOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            background: isCommandOpen ? 'var(--hover)' : 'none',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'background 0.1s, border-color 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--hover)';
            e.currentTarget.style.borderColor = 'var(--line)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isCommandOpen ? 'var(--hover)' : 'none';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <IconCirclePlus size={14} stroke={1.8} style={{ color: 'var(--brand-ink)' }} />
          <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontWeight: 600 }}>
            {t('layout.bottom_bar.quick_actions')}
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--ink-subtle)',
              background: 'var(--hover-strong)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              padding: '1px 5px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {primaryShortcut}
          </span>
          <IconChevronUp size={13} stroke={1.8} style={{ color: 'var(--ink-subtle)' }} />
        </button>

        {isCommandOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: 0,
              width: 300,
              padding: 8,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--line)',
              boxShadow: '0 12px 32px var(--shadow-color)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                padding: '6px 8px 8px',
                fontSize: 10,
                color: 'var(--ink-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              {t('layout.bottom_bar.quick_actions')}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {commandActions.map((action) => {
                const Icon = iconMap[action.icon] || IconCirclePlus;
                return (
                  <button
                    type="button"
                    key={action.id}
                    disabled={action.disabled}
                    onClick={() => {
                      if (action.disabled) return;
                      action.onSelect?.();
                      setIsCommandOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      background: 'transparent',
                      color: action.disabled ? 'var(--ink-subtle)' : 'var(--ink)',
                      cursor: action.disabled ? 'not-allowed' : 'pointer',
                      opacity: action.disabled ? 0.55 : 1,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      if (!action.disabled) e.currentTarget.style.background = 'var(--hover)';
                    }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--brand-soft)',
                        color: 'var(--brand-ink)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} stroke={1.8} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>
                        {t(action.labelKey)}
                      </span>
                      {action.disabled && action.disabledReasonKey ? (
                        <span
                          style={{
                            display: 'block',
                            marginTop: 2,
                            fontSize: 10,
                            color: 'var(--ink-subtle)',
                            lineHeight: 1.2,
                          }}
                        >
                          {t(action.disabledReasonKey)}
                        </span>
                      ) : null}
                    </span>
                    {action.shortcut ? (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--ink-subtle)',
                          fontFamily: 'var(--font-mono)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1px 5px',
                        }}
                      >
                        {action.shortcut}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Budget year switcher */}
      <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setIsBudgetYearOpen((open) => !open);
            setIsCommandOpen(false);
            setIsStatusOpen(false);
          }}
          aria-expanded={isBudgetYearOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            background: isBudgetYearOpen ? 'var(--hover)' : 'none',
            border: '1px solid transparent',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            transition: 'background 0.1s, border-color 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--hover)';
            e.currentTarget.style.borderColor = 'var(--line)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isBudgetYearOpen ? 'var(--hover)' : 'none';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <IconCalendarStats size={14} stroke={1.8} style={{ color: 'var(--brand-ink)' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {activeBudgetYearLabel || t('layout.bottom_bar.no_budget_year')}
          </span>
          <IconChevronUp size={13} stroke={1.8} style={{ color: 'var(--ink-subtle)' }} />
        </button>

        {isBudgetYearOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              right: 0,
              width: 280,
              padding: 8,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--line)',
              boxShadow: '0 12px 32px var(--shadow-color)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                padding: '6px 8px 8px',
                fontSize: 10,
                color: 'var(--ink-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              {t('layout.bottom_bar.switch_budget_year')}
            </div>
            <div style={{ display: 'grid', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {budgetYears.length ? budgetYears.map((year) => {
                const isActive = year.id === selectedBudgetYearId;
                const label = year.label || year.name || t('layout.bottom_bar.unnamed_budget_year');
                return (
                  <button
                    type="button"
                    key={year.id}
                    disabled={isActive}
                    onClick={() => {
                      onBudgetYearChange?.(year.id);
                      setIsBudgetYearOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      background: isActive ? 'var(--brand-soft)' : 'transparent',
                      color: isActive ? 'var(--brand-ink)' : 'var(--ink)',
                      cursor: isActive ? 'default' : 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'var(--hover)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isActive ? 'var(--brand-soft)' : 'transparent';
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 650 }}>
                        {label}
                      </span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: 10, color: 'var(--ink-subtle)' }}>
                        {isActive ? t('layout.bottom_bar.active_budget_year') : t('layout.bottom_bar.switch_to_budget_year')}
                      </span>
                    </span>
                    {isActive ? <IconCheck size={15} stroke={2} /> : null}
                  </button>
                );
              }) : (
                <div style={{ padding: '9px 10px', fontSize: 12, color: 'var(--ink-subtle)' }}>
                  {t('layout.bottom_bar.no_budget_years')}
                </div>
              )}
            </div>

            {onCreateBudgetYear ? (
              <button
                type="button"
                onClick={() => {
                  onCreateBudgetYear();
                  setIsBudgetYearOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  marginTop: 6,
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--brand-line)',
                  background: 'transparent',
                  color: 'var(--brand-ink)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 650,
                  textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-soft)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <IconCirclePlus size={15} stroke={1.8} />
                {t('layout.bottom_bar.create_budget_year')}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Right: status indicator */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setIsStatusOpen((open) => !open);
            setIsCommandOpen(false);
            setIsBudgetYearOpen(false);
          }}
          aria-expanded={isStatusOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10.5,
            color: 'var(--ink-subtle)',
            fontFamily: 'var(--font-mono)',
            background: isStatusOpen ? 'var(--hover)' : 'none',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-md)',
            padding: '4px 8px',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--hover)';
            e.currentTarget.style.borderColor = 'var(--line)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isStatusOpen ? 'var(--hover)' : 'none';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--brand)',
              boxShadow: 'none',
              flexShrink: 0,
            }}
          />
          {t('layout.local')} · v{APP_VERSION}
        </button>

        {isStatusOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              right: 0,
              width: 260,
              padding: 12,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--line)',
              boxShadow: '0 12px 32px var(--shadow-color)',
              backdropFilter: 'blur(20px)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand-ink)',
                }}
              >
                <IconBuilding size={14} stroke={1.8} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                {t('layout.bottom_bar.status_title')}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {statusItems.filter(Boolean).map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: 'var(--ink-subtle)' }}>{item.label}</span>
                  <span style={{ color: 'var(--ink-muted)', fontWeight: 600, textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
