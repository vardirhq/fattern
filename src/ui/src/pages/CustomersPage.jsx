import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../components/DataTable';
import { CustomerCard } from '../components/CustomerCard';
import { SearchBar } from '../components/SearchBar';
import { Select } from '../components/Select';
import { useSettings } from '../hooks/useSettings';
import { useSearch } from '../hooks/useSearch';

const ACTIVE_OPTIONS = [
  { value: 'all', labelKey: 'customer.active_filter' },
  { value: 'active', labelKey: 'customer.active' },
  { value: 'inactive', labelKey: 'customer.inactive' },
];

export function CustomersPage({ customers, onEditCustomer, onDeleteCustomer, onCreateCustomer }) {
  const { t } = useTranslation();
  const { getSetting, updateSetting } = useSettings();
  const defaultView = getSetting('customers.defaultView', 'table');
  const [viewMode, setViewMode] = useState(defaultView);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (defaultView) setViewMode(defaultView);
  }, [defaultView]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    updateSetting('customers.defaultView', mode);
  };

  const { query, setQuery, results: searched } = useSearch(customers, [
    'name', 'contact_name', 'email', 'org_number',
  ]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return searched;
    return searched.filter((c) => activeFilter === 'active' ? c.active : !c.active);
  }, [searched, activeFilter]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: t('customer.name'),
        className: 'font-semibold text-ink',
      },
      {
        key: 'contact_name',
        label: t('customer.contact'),
        className: 'text-muted',
      },
      {
        key: 'email',
        label: t('customer.email'),
        className: 'text-muted',
      },
      {
        key: 'phone',
        label: t('customer.phone'),
        className: 'text-muted',
      },
      {
        key: 'active',
        label: t('customer.status'),
        render: (active) => (
          <span className="inline-flex r-full px-3 py-1 text-xs font-semibold"
            style={active
              ? { background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--success-line)' }
              : { background: 'var(--hover)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }
            }>
            {active ? t('common.active') : t('common.inactive')}
          </span>
        ),
        sortFn: (a, b) => {
          if (a === b) return 0;
          return a ? -1 : 1;
        },
      },
      {
        key: 'actions',
        label: '',
        render: (_, customer) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="text-sm font-medium hover-underline"
              style={{ color: 'var(--brand-ink)' }}
              onClick={() => onEditCustomer?.(customer)}
            >
              {t('customer.edit')}
            </button>
            <button
              type="button"
              className="text-sm font-medium hover-underline"
              style={{ color: 'var(--danger)' }}
              onClick={() => onDeleteCustomer?.(customer)}
            >
              {t('customer.delete')}
            </button>
          </div>
        ),
      },
    ],
    [t, onEditCustomer, onDeleteCustomer]
  );

  const emptyMessage = query
    ? t('customer.no_results', { query })
    : t('customer.empty');

  return (
    <div className="space-y-6">
      <header style={{ position: 'relative' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'transparent' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg-flex-row lg-items-start lg-justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{t('customer.title')}</p>
              <h1 className="mt-1 text-3xl font-semibold" style={{ color: 'var(--ink)' }}>{t('customer.all_customers')}</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>{t('customer.overview')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex r-lg p-1" style={{ background: 'var(--hover)', border: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('table')}
                  className="r-md px-3 py-1-5 text-sm font-medium transition"
                  style={viewMode === 'table' ? { background: 'var(--ink)', color: 'var(--bg)' } : { color: 'var(--ink-muted)' }}
                >
                  {t('common.list')}
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('card')}
                  className="r-md px-3 py-1-5 text-sm font-medium transition"
                  style={viewMode === 'card' ? { background: 'var(--ink)', color: 'var(--bg)' } : { color: 'var(--ink-muted)' }}
                >
                  {t('common.card')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => onCreateCustomer?.()}
                className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold"
              >
                {t('customer.new')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section>
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm-flex-row sm-items-center">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <div style={{ width: 180 }}>
            <Select
              value={activeFilter}
              onChange={setActiveFilter}
              options={ACTIVE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
              noMargin
            />
          </div>
          <span className="whitespace-nowrap text-xs" style={{ color: 'var(--ink-muted)' }}>
            {t('customer.showing', { count: filtered.length, total: (customers || []).length })}
          </span>
        </div>

        {viewMode === 'table' ? (
          <DataTable columns={columns} data={filtered} emptyMessage={emptyMessage} />
        ) : (
          <div className="grid gap-4 sm-grid-cols-2 lg-grid-cols-3 xl-grid-cols-4">
            {filtered && filtered.length > 0 ? (
              filtered.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={onEditCustomer}
                  onDelete={onDeleteCustomer}
                  index={index}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted">{emptyMessage}</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
