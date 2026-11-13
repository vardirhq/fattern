import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { DatePicker } from '../DatePicker';

export function InvoiceStatusModal({ isOpen, invoice, onClose, onSubmit, initialStatus = null }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(initialStatus || invoice?.status || 'draft');
  const [paymentDate, setPaymentDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const statusesRequiringDate = ['paid'];

  useEffect(() => {
    if (!isOpen) return;
    const newStatus = initialStatus || invoice?.status || 'draft';
    setStatus(newStatus);

    if (invoice?.payment_date) {
      setPaymentDate(invoice.payment_date);
    } else if (statusesRequiringDate.includes(newStatus)) {
      const today = new Date();
      setPaymentDate(today.toISOString().split('T')[0]);
    } else {
      setPaymentDate('');
    }
    setError('');
    setSaving(false);
  }, [isOpen, invoice, initialStatus]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (statusesRequiringDate.includes(status)) {
      if (!paymentDate) {
        setError(t('invoice_status.date_required'));
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit?.({
        status,
        paymentDate: statusesRequiringDate.includes(status) ? paymentDate : null,
      });
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke oppdatere status', err);
      const errorMessage = err?.message || t('errors.generic');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: t('status.draft') },
    { value: 'sent', label: t('status.sent') },
    { value: 'paid', label: t('status.paid') },
    { value: 'overdue', label: t('status.overdue') },
    { value: 'cancelled', label: t('status.cancelled') },
  ];

  const requiresDate = statusesRequiringDate.includes(status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('invoice_status.title')}
      description={t('invoice_status.description', { num: invoice?.invoice_number || invoice?.id || '' })}
      footer={
        <>
          <button
            type="button"
            className="text-sm font-medium transition"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="status-form"
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
            disabled={saving}
          >
            {saving ? t('common.saving') : t('invoice_status.update_button')}
          </button>
        </>
      }
    >
      <form id="status-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('invoice_status.status_label')}</label>
          <Select
            value={status}
            onChange={setStatus}
            options={statusOptions}
            placeholder={t('invoice_status.status_placeholder')}
          />
        </div>

        {requiresDate && (
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {status === 'paid' ? t('invoice_status.payment_date_label') : t('invoice_status.date_label')} *
            </label>
            <DatePicker
              value={paymentDate}
              onChange={setPaymentDate}
              placeholder="dd.mm.yyyy"
              required
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
              {status === 'paid' ? t('invoice_status.paid_question') : t('invoice_status.date_question')}
            </p>
          </div>
        )}

        {error ? (
          <div className="r-md p-3" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-line)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
