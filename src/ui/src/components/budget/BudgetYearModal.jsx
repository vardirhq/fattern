import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { DatePicker } from '../DatePicker';

export function BudgetYearModal({ isOpen, mode = 'create', initialYear, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(initialYear?.label || '');
  const [startDate, setStartDate] = useState(initialYear?.start_date || initialYear?.start || '');
  const [endDate, setEndDate] = useState(initialYear?.end_date || initialYear?.end || '');
  const [isCurrent, setIsCurrent] = useState(Boolean(initialYear?.is_current));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    setLabel(initialYear?.label || '');
    setStartDate(initialYear?.start_date || initialYear?.start || '');
    setEndDate(initialYear?.end_date || initialYear?.end || '');
    setIsCurrent(Boolean(initialYear?.is_current));
    setError('');
    setSaving(false);
  }, [isOpen, initialYear, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!label.trim() || !startDate || !endDate) {
      setError(t('budget_year.form.validation'));
      return;
    }

    const normalizedStart = startDate || null;
    const normalizedEnd = endDate || null;

    setSaving(true);
    try {
      await onSubmit?.({
        id: initialYear?.id,
        label: label.trim(),
        startDate: normalizedStart,
        endDate: normalizedEnd,
        isCurrent,
      });
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke lagre budsjettår', err);
      setError(t('budget_year.form.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('budget_year.form.title_edit') : t('budget_year.form.title_create')}
      description={isEdit ? t('budget_year.form.description_edit') : t('budget_year.form.description_create')}
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
            form="budget-year-form"
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
            disabled={saving}
          >
            {saving ? t('common.saving') : isEdit ? t('budget_year.form.save_button') : t('budget_year.form.create_button')}
          </button>
        </>
      }
    >
      <form id="budget-year-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('budget_year.form.label')}</label>
          <input
            className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('budget_year.form.label_placeholder')}
          />
        </div>

        <div className="grid gap-4 md-grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('budget_year.form.start_date')}</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="dd.mm.yyyy"
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('budget_year.form.end_date')}</label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="dd.mm.yyyy"
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            className="h-4 w-4 r-sm"
            style={{ accentColor: 'var(--brand)' }}
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
          />
          {t('budget_year.form.mark_current')}
        </label>

        {error ? <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p> : null}
      </form>
    </Modal>
  );
}
