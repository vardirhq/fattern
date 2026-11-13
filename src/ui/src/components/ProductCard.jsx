import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function ProductCard({ product, formatCurrency: fmt, onEdit, onDelete, index = 0 }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden r-lg transition"
      style={{ border: '1px solid var(--line)', background: 'var(--surface)', backdropFilter: 'blur(12px)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-line)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      {product.image_path ? (
        <div className="aspect-square w-full overflow-hidden" style={{ background: 'var(--hover)' }}>
          <img
            src={product.image_path}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover-scale-105"
          />
        </div>
      ) : (
        <div className="aspect-square w-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="text-center">
            <svg className="mx-auto h-12 w-12" style={{ color: 'var(--brand-ink)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>{product.name}</h3>
            {product.sku && <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>SKU: {product.sku}</p>}
          </div>
          <span className="ml-2 inline-flex r-full px-2 py-1 text-xs font-semibold" style={product.active ? { background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' } : { background: 'var(--hover)', color: 'var(--ink-muted)' }}>
            {product.active ? t('common.active') : t('common.inactive')}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{fmt(product.unit_price || 0)}</p>
            {product.unit && <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('product_card.per_unit', { unit: product.unit })}</p>}
          </div>
        </div>
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--ink-muted)' }}>{product.description}</p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(product)}
            className="flex-1 r-lg px-3 py-2 text-sm font-medium transition"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {t('common.edit')}
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(product)}
            className="flex-1 r-lg px-3 py-2 text-sm font-medium transition"
            style={{ border: '1px solid var(--line)', color: 'var(--ink-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-line)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
