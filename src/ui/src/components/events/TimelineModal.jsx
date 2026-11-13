import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';

export function TimelineModal({ isOpen, onClose, activityFeed, formatCurrency: fmt }) {
  const { t } = useTranslation();
  const formatValue = (value) => (typeof fmt === 'function' ? fmt(value) : value);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('timeline.title')}
      description={t('timeline.description')}
    >
      <div className="max-h-70vh space-y-4 overflow-y-auto">
        {activityFeed && activityFeed.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0-5" style={{ background: 'var(--line)' }} />

            <div className="space-y-6">
              {activityFeed.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center r-lg"
                    style={
                      item.status === 'success'
                        ? { background: 'var(--brand-soft)', border: '1px solid var(--brand-line)', color: 'var(--brand-ink)' }
                        : item.status === 'warn'
                        ? { background: 'var(--warning-soft)', border: '1px solid var(--warning-line)', color: 'var(--warning)' }
                        : { background: 'var(--hover)', border: '1px solid var(--line)', color: 'var(--ink-muted)' }
                    }
                  >
                    <span className="text-sm font-semibold">{item.title.charAt(0)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 r-lg p-4" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--ink)' }}>{item.title}</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>{item.detail}</p>
                        <p className="mt-2 text-xs" style={{ color: 'var(--ink-muted)' }}>{item.time}</p>
                      </div>
                      {typeof item.amount === 'number' ? (
                        <p
                          className="text-right text-sm font-semibold"
                          style={{ color: item.amount > 0 ? 'var(--brand-ink)' : 'var(--ink-muted)' }}
                        >
                          {item.amount > 0 ? '+' : ''}
                          {formatValue(Math.abs(item.amount))}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="r-lg p-12 text-center" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{t('timeline.empty')}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>{t('timeline.empty_hint')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
