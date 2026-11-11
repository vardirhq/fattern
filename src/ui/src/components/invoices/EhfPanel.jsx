/**
 * EHF tab in the invoice view: can the customer receive EHF, is the
 * invoice complete enough to become a valid EHF file, and save it.
 * Building and checking happen offline; only the receiver lookup goes
 * online (public Peppol Directory, no account needed).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconDownload, IconWorldOff } from '@tabler/icons-react';
import { useToast } from '../../hooks/useToast';

function getEhfApi() {
  return typeof window !== 'undefined' ? window.fattern?.ehf ?? null : null;
}

const RECEIVER_TONE = {
  accepts_invoice: { bg: 'var(--f-success-bg)', border: 'var(--f-success-border)', color: 'var(--f-success-text)', Icon: IconCircleCheck },
  not_registered: { bg: 'var(--f-hover)', border: 'var(--f-border)', color: 'var(--f-text-soft)', Icon: IconAlertCircle },
  registered_other: { bg: 'var(--f-warn-bg)', border: 'var(--f-warn-border)', color: 'var(--f-warn)', Icon: IconAlertTriangle },
  unknown: { bg: 'var(--f-hover)', border: 'var(--f-border)', color: 'var(--f-text-soft)', Icon: IconWorldOff },
  invalid: { bg: 'var(--f-hover)', border: 'var(--f-border)', color: 'var(--f-text-soft)', Icon: IconAlertCircle },
};

export function EhfPanel({ invoiceId }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [check, setCheck] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const api = getEhfApi();
    if (!api || !invoiceId) return;
    let cancelled = false;
    setCheck(null);
    setReceiver(null);
    api.check(invoiceId)
      .then(async (result) => {
        if (cancelled) return;
        setCheck(result);
        if (result.receiverId) {
          const org = result.receiverId.split(':')[1];
          const lookup = await api.lookup(org);
          if (!cancelled) setReceiver(lookup);
        } else {
          setReceiver({ status: 'invalid' });
        }
      })
      .catch((error) => {
        if (!cancelled) setCheck({ ok: false, problems: [{ level: 'error', message: error.message }] });
      });
    return () => { cancelled = true; };
  }, [invoiceId]);

  const api = getEhfApi();
  if (!api) {
    return <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('ehf.unavailable')}</p>;
  }
  if (!check) {
    return <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('common.loading')}</p>;
  }

  const errors = check.problems.filter((p) => p.level === 'error');
  const warnings = check.problems.filter((p) => p.level === 'warning');
  const tone = RECEIVER_TONE[receiver?.status] || RECEIVER_TONE.unknown;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.save(invoiceId);
      if (result.saved) toast.success(t('ehf.saved'), result.filePath);
    } catch (error) {
      toast.error(t('ehf.save_error'), error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Can the customer receive EHF? */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
      >
        <tone.Icon size={18} stroke={2} style={{ color: tone.color, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--f-text)' }}>
            {receiver ? t(`ehf.receiver.${receiver.status}`) : t('ehf.receiver.checking')}
          </p>
          <p className="text-xs" style={{ color: 'var(--f-text-soft)' }}>
            {receiver ? t(`ehf.receiver.${receiver.status}_desc`) : t('ehf.receiver.checking_desc')}
          </p>
        </div>
      </div>

      {/* Is the invoice complete? */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--f-text)' }}>
          {errors.length ? t('ehf.fix_title') : t('ehf.ready_title')}
        </h4>
        {errors.length === 0 && warnings.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--f-text-soft)' }}>{t('ehf.ready_desc')}</p>
        )}
        <ul className="space-y-1.5">
          {[...errors, ...warnings].map((problem, index) => (
            <li key={index} className="flex items-start gap-2 text-sm" style={{ color: 'var(--f-text-body)' }}>
              {problem.level === 'error'
                ? <IconAlertCircle size={16} stroke={2} style={{ color: 'var(--f-danger-text)', flexShrink: 0, marginTop: 2 }} aria-label={t('ehf.error')} />
                : <IconAlertTriangle size={16} stroke={2} style={{ color: 'var(--f-warn)', flexShrink: 0, marginTop: 2 }} aria-label={t('ehf.warning')} />}
              <span>{problem.message}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || errors.length > 0}
          className="f-btn-primary rounded-xl px-4 text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ height: 40, cursor: errors.length ? 'not-allowed' : 'pointer' }}
        >
          <IconDownload size={16} aria-hidden="true" />
          {t('ehf.save_button')}
        </button>
        <span className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>{t('ehf.send_hint')}</span>
      </div>
    </div>
  );
}
