import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../components/DataTable';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { useSettings } from '../hooks/useSettings';
import { useSearch } from '../hooks/useSearch';

const ACTIVE_OPTIONS = [
  { value: 'all', labelKey: 'product.active_filter' },
  { value: 'active', labelKey: 'product.active' },
  { value: 'inactive', labelKey: 'product.inactive' },
];

export function ProductsPage({ products, formatCurrency: fmt, onEditProduct, onDeleteProduct, onCreateProduct }) {
  const { t } = useTranslation();
  const { getSetting, updateSetting } = useSettings();
  const defaultView = getSetting('products.defaultView', 'table');
  const [viewMode, setViewMode] = useState(defaultView);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (defaultView) setViewMode(defaultView);
  }, [defaultView]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    updateSetting('products.defaultView', mode);
  };

  const { query, setQuery, results: searched } = useSearch(products, ['name', 'sku', 'description']);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return searched;
    return searched.filter((p) => activeFilter === 'active' ? p.active : !p.active);
  }, [searched, activeFilter]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: t('product.name'),
        className: 'font-semibold text-ink',
      },
      {
        key: 'sku',
        label: t('product.sku'),
        className: 'text-ink-soft',
      },
      {
        key: 'unit_price',
        label: t('product.price'),
        align: 'right',
        render: (price) => (typeof price === 'number' ? fmt(price) : '—'),
        className: 'font-medium text-ink',
        sortFn: (a, b) => {
          const aVal = typeof a === 'number' ? a : 0;
          const bVal = typeof b === 'number' ? b : 0;
          return aVal - bVal;
        },
      },
      {
        key: 'vat_rate',
        label: t('product.vat'),
        align: 'right',
        render: (rate) => (rate != null ? `${(rate * 100).toFixed(0)}%` : '—'),
        className: 'text-ink-subtle',
        sortFn: (a, b) => {
          const aVal = a != null ? a : 0;
          const bVal = b != null ? b : 0;
          return aVal - bVal;
        },
      },
      {
        key: 'unit',
        label: t('product.unit'),
        className: 'text-ink-subtle',
      },
      {
        key: 'active',
        label: t('product.status'),
        render: (active) => (
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={active
              ? { background: 'var(--f-green-bg-pill)', color: 'var(--f-green-text)', border: '1px solid var(--f-border-green-pill)' }
              : { background: 'rgba(255,255,255,0.06)', color: 'var(--f-text-subtle)', border: '1px solid var(--f-border)' }
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
        render: (_, product) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--f-green-text)' }}
              onClick={() => onEditProduct?.(product)}
            >
              {t('product.edit')}
            </button>
            <button
              type="button"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--f-danger-text)' }}
              onClick={() => onDeleteProduct?.(product)}
            >
              {t('product.delete')}
            </button>
          </div>
        ),
      },
    ],
    [t, fmt, onEditProduct, onDeleteProduct]
  );

  const emptyMessage = query
    ? t('product.no_results', { query })
    : t('product.empty');

  return (
    <div className="space-y-6">
      <header style={{ position: 'relative' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'transparent' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('product.title')}</p>
              <h1 className="mt-1 text-3xl font-semibold" style={{ color: 'var(--f-text)' }}>{t('product.all_products')}</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--f-text-soft)' }}>{t('product.overview')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--f-border)' }}>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('table')}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                  style={viewMode === 'table' ? { background: 'var(--f-green-bg)', color: 'var(--f-green-text)' } : { color: 'var(--f-text-soft)' }}
                >
                  {t('common.list')}
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('card')}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                  style={viewMode === 'card' ? { background: 'var(--f-green-bg)', color: 'var(--f-green-text)' } : { color: 'var(--f-text-soft)' }}
                >
                  {t('common.card')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => onCreateProduct?.()}
                className="f-btn-primary rounded-2xl px-5 py-2 text-sm font-semibold"
              >
                {t('product.new')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="f-glass rounded-3xl p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="f-input rounded-xl px-4 py-2 text-sm"
          >
            {ACTIVE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
          <span className="whitespace-nowrap text-xs" style={{ color: 'var(--f-text-subtle)' }}>
            {t('product.showing', { count: filtered.length, total: (products || []).length })}
          </span>
        </div>

        {viewMode === 'table' ? (
          <DataTable columns={columns} data={filtered} emptyMessage={emptyMessage} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered && filtered.length > 0 ? (
              filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  formatCurrency={fmt}
                  onEdit={onEditProduct}
                  onDelete={onDeleteProduct}
                  index={index}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-ink-subtle">{emptyMessage}</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
