/**
 * Connect the user's own Recommand team for sending EHF over Peppol.
 * Fattern stores the key locally (encrypted with the OS keychain where
 * available) and talks to Recommand directly; there is no Fattern server.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCircleCheck, IconAlertCircle, IconExternalLink } from '@tabler/icons-react';
import { useToast } from '../../hooks/useToast';

function getPeppolApi() {
  return typeof window !== 'undefined' ? window.fattern?.peppol ?? null : null;
}

export function PeppolSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const api = getPeppolApi();

  const [config, setConfig] = useState(null);
  const [keyId, setKeyId] = useState('');
  const [secret, setSecret] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!api) return;
    api.getConfig().then((c) => {
      setConfig(c);
      setKeyId(c.keyId || '');
    });
  }, []);

  if (!api) return null;

  const companies = result?.ok ? result.companies : [];

  const handleConnect = async () => {
    setTesting(true);
    setResult(null);
    try {
      const updates = { keyId };
      if (secret) updates.secret = secret;
      const saved = await api.saveConfig(updates);
      setConfig(saved);
      setSecret('');
      const test = await api.test();
      setResult(test);
      if (test.ok && !saved.companyId) {
        const verified = test.companies.filter((c) => c.isVerified);
        if (verified.length === 1) {
          const c = verified[0];
          setConfig(await api.saveConfig({ companyId: c.id, companyName: c.name }));
        }
      }
    } catch (error) {
      setResult({ ok: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handlePickCompany = async (company) => {
    setConfig(await api.saveConfig({ companyId: company.id, companyName: company.name }));
    toast.success(t('peppol.company_selected'), company.name);
  };

  const handleDisconnect = async () => {
    setConfig(await api.saveConfig({ clear: true }));
    setKeyId('');
    setSecret('');
    setResult(null);
  };

  const connected = config?.hasSecret && config?.companyId;

  return (
    <div className="space-y-3 pt-4">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('peppol.title')}</h3>
        <p className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>{t('peppol.desc')}</p>
      </div>

      {connected && (
        <div className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: 'var(--f-success-bg)', border: '1px solid var(--f-success-border)' }}>
          <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--f-text)' }}>
            <IconCircleCheck size={16} stroke={2} style={{ color: 'var(--f-success-text)' }} aria-hidden="true" />
            {t('peppol.connected_as', { name: config.companyName })}
          </span>
          <button type="button" onClick={handleDisconnect} className="f-btn-ghost rounded-lg px-3 text-xs font-medium" style={{ height: 32 }}>
            {t('peppol.disconnect')}
          </button>
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <label className="f-label" htmlFor="peppol-key-id">{t('peppol.key_id')}</label>
          <input
            id="peppol-key-id"
            type="text"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder="key_…"
            autoComplete="off"
            className="f-input w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="f-label" htmlFor="peppol-secret">{t('peppol.secret')}</label>
          <input
            id="peppol-secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={config?.hasSecret ? t('peppol.secret_saved') : 'secret_…'}
            autoComplete="off"
            className="f-input w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>
        {t('peppol.key_hint')}{' '}
        {config && !config.encrypted && <span style={{ color: 'var(--f-warn)' }}>{t('peppol.not_encrypted')}</span>}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleConnect}
          disabled={testing || (!secret && !config?.hasSecret)}
          className="f-btn-primary rounded-lg px-4 text-sm disabled:opacity-50"
          style={{ height: 40 }}
        >
          {testing ? t('common.loading') : t('peppol.connect')}
        </button>
        <a
          href="https://app.recommand.eu"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: 'var(--f-green-text)' }}
        >
          {t('peppol.open_recommand')} <IconExternalLink size={13} aria-hidden="true" />
        </a>
      </div>

      {result && !result.ok && (
        <p role="alert" className="flex items-start gap-2 text-sm" style={{ color: 'var(--f-danger-text)' }}>
          <IconAlertCircle size={16} stroke={2} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          {result.message}
        </p>
      )}

      {companies.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium" style={{ color: 'var(--f-text-soft)' }}>{t('peppol.pick_company')}</span>
          {companies.map((c) => {
            const selected = c.id === config?.companyId;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                disabled={!c.isVerified}
                onClick={() => handlePickCompany(c)}
                className="f-pick-row flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-60"
                style={{
                  border: selected ? '2px solid var(--f-text)' : '1px solid var(--f-border)',
                  background: 'var(--f-surface)',
                  color: 'var(--f-text)',
                  cursor: c.isVerified ? 'pointer' : 'not-allowed',
                }}
              >
                <span>
                  {c.name}
                  {c.enterpriseNumber && <span className="f-num" style={{ color: 'var(--f-text-subtle)' }}> · {c.enterpriseNumber}</span>}
                </span>
                <span className="text-xs" style={{ color: c.isVerified ? 'var(--f-success-text)' : 'var(--f-text-subtle)' }}>
                  {c.isVerified ? t('peppol.verified') : t('peppol.not_verified')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
