import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60"
      style={{ background: checked ? 'var(--f-green)' : 'var(--f-hover-elevated)' }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        style={{ background: checked ? 'var(--f-on-accent)' : 'var(--f-surface)' }}
      />
    </button>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <span className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{label}</span>
          {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{desc}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function InvoiceSettings() {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isLoading } = useSettings();
  const { toast } = useToast();

  const defaultPaymentTerms = parseInt(getSetting('invoice.defaultPaymentTerms', '14'), 10);
  const autoCalculateDueDate = getSetting('invoice.autoCalculateDueDate', 'true') === 'true';
  const defaultStatus = getSetting('invoice.defaultStatus', 'draft');
  const autoIncrementNumbers = getSetting('invoice.autoIncrementNumbers', 'true') === 'true';

  const kidEnabled = getSetting('invoice.kid.enabled', 'false') === 'true';
  const kidAlgorithm = getSetting('invoice.kid.algorithm', 'mod10');
  const kidLength = getSetting('invoice.kid.length', '');
  const vatRegistered = getSetting('company.vatRegistered', 'true') === 'true';
  const foretaksregisteret = getSetting('company.foretaksregisteret', 'auto');

  const save = (key, value, title) => {
    updateSetting(key, String(value));
    if (title) toast.success(title);
  };

  const handlePaymentTermsChange = (days) => {
    updateSetting('invoice.defaultPaymentTerms', days.toString());
    toast.success(t('settings.invoice.payment_terms_updated'), `${days} ${t('settings.invoice.days_unit')}`);
  };

  const handleAutoCalculateDueDate = (enabled) => {
    updateSetting('invoice.autoCalculateDueDate', enabled.toString());
    toast.success(t('settings.invoice.auto_due_label'), enabled ? t('settings.invoice.enabled') : t('settings.invoice.disabled'));
  };

  const handleDefaultStatusChange = (status) => {
    updateSetting('invoice.defaultStatus', status);
    toast.success(t('settings.invoice.default_status_updated'), t(`status.${status}`));
  };

  const handleAutoIncrementChange = (enabled) => {
    updateSetting('invoice.autoIncrementNumbers', enabled.toString());
    toast.success(t('settings.invoice.auto_increment_label'), enabled ? t('settings.invoice.enabled') : t('settings.invoice.disabled'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.title')}</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.desc')}</p>
      </div>

      <div className="space-y-4">
        {/* Payment Terms */}
        <div className="py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.payment_terms_label')}</label>
              <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.payment_terms_desc')}</p>
            </div>
            <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--f-border)', background: 'var(--f-hover)' }}>
              {[14, 21, 30, 45, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handlePaymentTermsChange(days)}
                  disabled={isLoading}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
                  style={defaultPaymentTerms === days
                    ? { background: 'var(--f-green-bg)', color: 'var(--f-green-text)', border: '1px solid var(--f-border-green)' }
                    : { color: 'var(--f-text-soft)' }}
                  onMouseEnter={e => { if (defaultPaymentTerms !== days) { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; } }}
                  onMouseLeave={e => { if (defaultPaymentTerms !== days) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; } }}
                >
                  {days} {t('settings.invoice.days_unit')}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <input
              type="number"
              min="1"
              max="365"
              value={defaultPaymentTerms}
              onChange={(e) => {
                const days = parseInt(e.target.value, 10);
                if (days >= 1 && days <= 365) {
                  handlePaymentTermsChange(days);
                }
              }}
              className="f-input w-24 rounded-lg px-2 py-1 text-sm"
              placeholder={t('settings.invoice.custom_placeholder')}
            />
            <span className="ml-2 text-xs" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.days_unit')}</span>
          </div>
        </div>

        {/* Auto-calculate Due Date */}
        <div className="py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.auto_due_label')}</label>
              <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.auto_due_desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleAutoCalculateDueDate(!autoCalculateDueDate)}
              disabled={isLoading}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60"
              style={{ background: autoCalculateDueDate ? 'var(--f-green)' : 'var(--f-hover-elevated)' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoCalculateDueDate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Default Status */}
        <div className="py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.default_status_label')}</label>
              <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.default_status_desc')}</p>
            </div>
            <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--f-border)', background: 'var(--f-hover)' }}>
              {['draft', 'sent'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleDefaultStatusChange(s)}
                  disabled={isLoading}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
                  style={defaultStatus === s ? { background: 'var(--f-green-bg)', color: 'var(--f-green-text)', border: '1px solid var(--f-border-green)' } : { color: 'var(--f-text-soft)' }}
                  onMouseEnter={e => { if (defaultStatus !== s) { e.currentTarget.style.background = 'var(--f-hover)'; } }}
                  onMouseLeave={e => { if (defaultStatus !== s) { e.currentTarget.style.background = 'transparent'; } }}
                >
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-increment Invoice Numbers */}
        <div className="py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.auto_increment_label')}</label>
              <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.auto_increment_desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleAutoIncrementChange(!autoIncrementNumbers)}
              disabled={isLoading}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60"
              style={{ background: autoIncrementNumbers ? 'var(--f-green)' : 'var(--f-hover-elevated)' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoIncrementNumbers ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Payment reference and EHF */}
        <div className="pt-4">
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.payment_title')}</h3>
          <p className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.invoice.payment_desc')}</p>
        </div>

        <SettingRow label={t('settings.invoice.kid_label')} desc={t('settings.invoice.kid_desc')}>
          <Toggle
            checked={kidEnabled}
            disabled={isLoading}
            label={t('settings.invoice.kid_label')}
            onChange={(v) => save('invoice.kid.enabled', v, t('settings.invoice.kid_label'))}
          />
        </SettingRow>

        {kidEnabled && (
          <SettingRow label={t('settings.invoice.kid_format_label')} desc={t('settings.invoice.kid_format_desc')}>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg p-0.5" role="group" aria-label={t('settings.invoice.kid_format_label')} style={{ border: '1px solid var(--f-border)', background: 'var(--f-hover)' }}>
                {['mod10', 'mod11'].map((alg) => (
                  <button
                    key={alg}
                    type="button"
                    aria-pressed={kidAlgorithm === alg}
                    onClick={() => save('invoice.kid.algorithm', alg)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium"
                    style={kidAlgorithm === alg ? { background: 'var(--f-inverse-bg)', color: 'var(--f-inverse-text)' } : { color: 'var(--f-text-soft)' }}
                  >
                    {alg.toUpperCase()}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--f-text-soft)' }}>
                {t('settings.invoice.kid_length')}
                <input
                  type="number"
                  min="2"
                  max="25"
                  placeholder={t('settings.invoice.kid_length_auto')}
                  defaultValue={kidLength}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10);
                    save('invoice.kid.length', n >= 2 && n <= 25 ? n : '');
                  }}
                  className="f-input rounded-lg px-2 py-1 text-xs"
                  style={{ width: 72 }}
                />
              </label>
            </div>
          </SettingRow>
        )}

        <SettingRow label={t('settings.invoice.vat_registered_label')} desc={t('settings.invoice.vat_registered_desc')}>
          <Toggle
            checked={vatRegistered}
            disabled={isLoading}
            label={t('settings.invoice.vat_registered_label')}
            onChange={(v) => save('company.vatRegistered', v, t('settings.invoice.vat_registered_label'))}
          />
        </SettingRow>

        <SettingRow label={t('settings.invoice.foretak_label')} desc={t('settings.invoice.foretak_desc')}>
          <div className="flex rounded-lg p-0.5" role="group" aria-label={t('settings.invoice.foretak_label')} style={{ border: '1px solid var(--f-border)', background: 'var(--f-hover)' }}>
            {['auto', 'true', 'false'].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={foretaksregisteret === v}
                onClick={() => save('company.foretaksregisteret', v)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={foretaksregisteret === v ? { background: 'var(--f-inverse-bg)', color: 'var(--f-inverse-text)' } : { color: 'var(--f-text-soft)' }}
              >
                {t(`settings.invoice.foretak_${v}`)}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Info Box */}
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
          <p className="text-xs" style={{ color: 'var(--f-text-soft)' }}>
            <strong style={{ color: 'var(--f-text-body)' }}>{t('settings.invoice.note_title')}</strong>{' '}
            {t('settings.invoice.note')}
          </p>
        </div>
      </div>
    </div>
  );
}
