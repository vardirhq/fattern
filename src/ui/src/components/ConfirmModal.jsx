import { Modal } from './Modal';
import { useTranslation } from 'react-i18next';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onDeactivate,
  title,
  description,
  confirmLabel,
  deactivateLabel,
  cancelLabel,
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
  showDeactivate = false,
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('common.confirm');
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const resolvedDeactivateLabel = deactivateLabel ?? t('common.deactivate');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const variantStyles = {
    danger: { button: 'ft-btn ft-btn-danger' },
    warning: { button: '' }, // inline amber styling
    info: { button: 'ft-btn ft-btn-primary' },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  const handleConfirm = async () => {
    try {
      await onConfirm?.();
      onClose?.();
    } catch (error) {
      console.error('Bekreftelse feilet', error);
    }
  };

  const handleDeactivate = async () => {
    try {
      await onDeactivate?.();
      onClose?.();
    } catch (error) {
      console.error('Deaktivering feilet', error);
      // Don't close on error so user can see what went wrong
      throw error;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      description={description}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            className="text-sm font-medium transition"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
            onClick={onClose}
            disabled={isLoading}
          >
            {resolvedCancelLabel}
          </button>
          <div className="flex gap-2">
            {showDeactivate && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isLoading}
                className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold transition disabled-dim"
              >
                {isLoading ? t('common.processing') : resolvedDeactivateLabel}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`r-lg px-5 py-2 text-sm font-semibold transition disabled-dim ${styles.button}`}
              style={variant === 'warning' ? { background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid var(--warning-line)' } : {}}
            >
              {isLoading ? t('common.processing') : resolvedConfirmLabel}
            </button>
          </div>
        </div>
      }
    />
  );
}

