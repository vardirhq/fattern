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
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        {activityFeed && activityFeed.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: 'var(--f-border-subtle)' }} />

            <div className="space-y-6">
              {activityFeed.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div
                    className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={
                      item.status === 'success'
                        ? { background: 'var(--f-green-bg)', border: '1px solid var(--f-border-green)', color: 'var(--f-green-text)' }
                        : item.status === 'warn'
                        ? { background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', color: '#fbbf24' }
                        : { background: 'var(--f-hover)', border: '1px solid var(--f-border)', color: 'var(--f-text-soft)' }
                    }
                  >
                    <span className="text-sm font-semibold">{item.title.charAt(0)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-2xl p-4" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--f-text-body)' }}>{item.title}</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--f-text-soft)' }}>{item.detail}</p>
                        <p className="mt-2 text-xs" style={{ color: 'var(--f-text-subtle)' }}>{item.time}</p>
                      </div>
                      {typeof item.amount === 'number' ? (
                        <p
                          className="text-right text-sm font-semibold"
                          style={{ color: item.amount > 0 ? 'var(--f-green-text)' : 'var(--f-text-subtle)' }}
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
          <div className="rounded-2xl p-12 text-center" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
            <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('timeline.empty')}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--f-text-subtle)' }}>{t('timeline.empty_hint')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
