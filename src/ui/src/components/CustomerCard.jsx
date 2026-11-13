import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function CustomerCard({ customer, onEdit, onDelete, index = 0 }) {
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
      {customer.image_path ? (
        <div className="aspect-square w-full overflow-hidden" style={{ background: 'var(--hover)' }}>
          <img
            src={customer.image_path}
            alt={customer.name}
            className="h-full w-full object-cover transition group-hover-scale-105"
          />
        </div>
      ) : (
        <div className="aspect-square w-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center r-full text-2xl font-semibold" style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' }}>
              {customer.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>{customer.name}</h3>
            {customer.contact_name && <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>{customer.contact_name}</p>}
          </div>
          <span className="ml-2 inline-flex r-full px-2 py-1 text-xs font-semibold" style={customer.active ? { background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' } : { background: 'var(--hover)', color: 'var(--ink-muted)' }}>
            {customer.active ? t('common.active') : t('common.inactive')}
          </span>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          {customer.email && (
            <p style={{ color: 'var(--ink-muted)' }}>
              <span style={{ color: 'var(--ink-muted)' }}>{t('customer_card.email_label')}:</span> {customer.email}
            </p>
          )}
          {customer.phone && (
            <p style={{ color: 'var(--ink-muted)' }}>
              <span style={{ color: 'var(--ink-muted)' }}>{t('customer_card.phone_label')}:</span> {customer.phone}
            </p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(customer)}
            className="flex-1 r-lg px-3 py-2 text-sm font-medium transition"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {t('common.edit')}
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(customer)}
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
