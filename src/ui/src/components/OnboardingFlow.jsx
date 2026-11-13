import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const defaultCompanyValues = {
  name: '',
  org_number: '',
  address: '',
  post_number: '',
  post_location: '',
  contact_email: '',
  contact_number: '',
  account_number: '',
  vat_rate: 0.25
};

function safeElectron() {
  if (typeof window === 'undefined') return null;
  return window.fattern?.db ?? null;
}

function markComplete() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fattern:onboardingComplete', 'true');
}

export function OnboardingFlow({ initialCompany, onComplete }) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    ...defaultCompanyValues,
    ...initialCompany,
    name:
      !initialCompany || initialCompany.name === 'Default Company' ? '' : initialCompany.name || '',
  }));

  const steps = [
    {
      id: 'intro',
      title: t('onboarding_flow.intro_title'),
      description: t('onboarding_flow.intro_desc'),
      actionLabel: t('onboarding_flow.intro_action'),
    },
    {
      id: 'company',
      title: t('onboarding_flow.company_title'),
      description: t('onboarding_flow.company_desc'),
      actionLabel: t('onboarding_flow.company_action'),
    },
  ];

  const current = steps[stepIndex];

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name?.trim(),
      org_number: form.org_number?.trim() || null,
      address: form.address?.trim() || null,
      post_number: form.post_number?.trim() || null,
      post_location: form.post_location?.trim() || null,
      contact_email: form.contact_email?.trim() || null,
      contact_number: form.contact_number?.trim() || null,
      account_number: form.account_number?.trim() || null,
      vat_rate: Number.isNaN(Number(form.vat_rate)) ? 0.25 : Number(form.vat_rate)
    };

    if (!payload.name) {
      setError(t('onboarding_flow.validation'));
      setSaving(false);
      return;
    }

    try {
      const api = safeElectron();
      let updated = payload;

      if (api?.updateCompany) {
        updated = await api.updateCompany(payload);
      }

      markComplete();
      onComplete?.(updated);
    } catch (err) {
      console.error('Kunne ikke lagre selskap', err);
      setError(t('onboarding_flow.error'));
    } finally {
      setSaving(false);
    }
  }

  if (stepIndex === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-100"
        style={{ background: 'var(--scrim)' }}
      >
        <div className="flex h-full items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="ft-card ft-raised w-full max-w-xl r-lg p-8 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Fattern" className="h-12 w-12" />
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>{t('onboarding_flow.startup')}</p>
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{current.title}</h2>
              </div>
            </div>
            <p className="mt-6" style={{ color: 'var(--ink-muted)' }}>{current.description}</p>
            <div className="mt-10 flex justify-end">
              <button
                className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold"
                onClick={() => setStepIndex(1)}
              >
                {current.actionLabel}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-100"
      style={{ background: 'var(--scrim)' }}
    >
      <div className="flex h-full items-center justify-center px-4">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="ft-card ft-raised w-full max-w-3xl r-lg p-8 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Fattern" className="h-12 w-12" />
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>{t('onboarding_flow.startup')}</p>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{current.title}</h2>
            </div>
          </div>
          <p className="mt-4" style={{ color: 'var(--ink-muted)' }}>{current.description}</p>

          <form className="mt-8 grid gap-4 md-grid-cols-2" onSubmit={handleSubmit}>
            <div className="md-col-span-2">
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.company_name')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Bedrift AS"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.registration_number')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.org_number || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, org_number: e.target.value }))}
                placeholder="999 888 777"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.email')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.contact_email || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                placeholder="hei@studio.no"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.phone')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.contact_number || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, contact_number: e.target.value }))}
                placeholder="+47 98 76 54 32"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.bank_account')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.account_number || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value }))}
                placeholder="1234.56.78901"
              />
            </div>
            <div className="md-col-span-2">
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.address')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.address || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Fatternveien 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.postal_code')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.post_number || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, post_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.city')}</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.post_location || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, post_location: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('onboarding_flow.vat_rate')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={form.vat_rate}
                onChange={(e) => setForm((prev) => ({ ...prev, vat_rate: e.target.value }))}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>{t('onboarding_flow.025_equals_25_vat')}</p>
            </div>

            {error ? (
              <p className="md-col-span-2 text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
            ) : null}

            <div className="md-col-span-2 mt-4 flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-medium transition"
                style={{ color: 'var(--ink-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
                onClick={() => {
                  markComplete();
                  onComplete?.(form);
                }}
              >
                {t('onboarding_flow.skip')}
              </button>
              <button
                type="submit"
                className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
                disabled={saving}
              >
                {saving ? t('common.saving') : current.actionLabel}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
