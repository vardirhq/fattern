import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconMail, IconLock, IconCheck, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useToast } from '../../hooks/useToast';

function getEmailApi() {
  return typeof window !== 'undefined' ? window.fattern?.email ?? null : null;
}

export function EmailSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    host: '',
    port: '587',
    secure: false,
    user: '',
    password: '',
  });
  const [hasStoredPassword, setHasStoredPassword] = useState(false);
  const [encryptionAvailable, setEncryptionAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'ok' | 'error'
  const [testError, setTestError] = useState('');

  useEffect(() => {
    const api = getEmailApi();
    if (!api) { setLoading(false); return; }
    api.getConfig().then((cfg) => {
      setForm((f) => ({
        ...f,
        host:   cfg.host   || '',
        port:   cfg.port   || '587',
        secure: cfg.secure || false,
        user:   cfg.user   || '',
        password: '',
      }));
      setHasStoredPassword(cfg.hasPassword);
      setEncryptionAvailable(cfg.encryptionAvailable);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setTestStatus(null);
  };

  const handleSave = async () => {
    const api = getEmailApi();
    if (!api) return;
    setSaving(true);
    try {
      await api.saveConfig(form);
      setHasStoredPassword(hasStoredPassword || Boolean(form.password));
      setForm((f) => ({ ...f, password: '' }));
      toast.success(t('settings.email.saved'), t('settings.email.saved_desc'));
    } catch (err) {
      toast.error(t('settings.email.save_error'), err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const api = getEmailApi();
    if (!api) return;
    setTesting(true);
    setTestStatus(null);
    setTestError('');
    try {
      await api.testConnection(form);
      setTestStatus('ok');
      toast.success(t('settings.email.test_success'), t('settings.email.test_connected', { host: form.host, port: form.port }));
    } catch (err) {
      setTestStatus('error');
      setTestError(err.message || t('settings.email.test_fail'));
      toast.error(t('settings.email.test_error'), err.message);
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = form.host && form.user && (hasStoredPassword || form.password);

  if (loading) {
    return <div className="text-sm py-4" style={{ color: 'var(--ink-muted)' }}>{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('settings.email.title')}</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
          {t('settings.email.connect_to_desc')}
        </p>
      </div>

      {!encryptionAvailable && (
        <div
          className="flex items-start gap-2 r-lg p-3 text-xs"
          style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning-line)', color: 'var(--warning)' }}
        >
          <IconAlertCircle className="h-4 w-4 shrink-0 mt-0-5" />
          <span>{t('settings.email.encryption_unavailable')}</span>
        </div>
      )}

      <div className="space-y-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <label className="ft-label uppercase tracking-wider block">{t('settings.email.smtp_server')}</label>

        {/* Host + Port */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.email.server_label')}</label>
            <input
              className="ft-input w-full text-sm r-md px-3 py-2"
              placeholder="smtp.gmail.com"
              value={form.host}
              onChange={(e) => handleChange('host', e.target.value)}
              style={{ color: 'var(--ink)' }}
            />
          </div>
          <div style={{ width: 100 }}>
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.email.port_label')}</label>
            <input
              className="ft-input w-full text-sm r-md px-3 py-2"
              placeholder="587"
              value={form.port}
              onChange={(e) => handleChange('port', e.target.value)}
              style={{ color: 'var(--ink)' }}
            />
          </div>
        </div>

        {/* SSL toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleChange('secure', !form.secure)}
            className="relative shrink-0 r-full transition-colors"
            style={{
              width: 36, height: 20,
              background: form.secure ? 'var(--brand)' : 'var(--line-strong)',
            }}
          >
            <span
              className="absolute r-full transition-transform"
              style={{
                background: form.secure ? 'var(--on-brand)' : 'var(--surface)',
                width: 14, height: 14,
                top: 3,
                left: form.secure ? 19 : 3,
              }}
            />
          </button>
          <span className="text-sm" style={{ color: 'var(--ink)' }}>{t('settings.email.ssl_label')}</span>
        </div>

        {/* User + Password */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.email.username_short')}</label>
          <input
            className="ft-input w-full text-sm r-md px-3 py-2"
            type="email"
            placeholder="deg@eksempel.no"
            value={form.user}
            onChange={(e) => handleChange('user', e.target.value)}
            style={{ color: 'var(--ink)' }}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>
            {t('settings.email.password')}
            {hasStoredPassword && !form.password && (
              <span className="ml-2 opacity-60">{t('settings.email.password_stored_hint')}</span>
            )}
          </label>
          <div className="relative">
            <IconLock
              className="absolute left-3 top-half -translate-y-half h-3-5 w-3-5 pointer-events-none"
              style={{ color: 'var(--ink-subtle)' }}
            />
            <input
              className="ft-input w-full text-sm r-md pl-9 pr-3 py-2"
              type="password"
              placeholder={hasStoredPassword ? '••••••••' : t('settings.email.password_placeholder')}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              style={{ color: 'var(--ink)' }}
              autoComplete="current-password"
            />
          </div>
          <p className="text-xs mt-1-5" style={{ color: 'var(--ink-muted)' }}>
            {t('settings.email.gmail_tip').split(t('settings.email.gmail_app_password'))[0]}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); }}
              className="underline hover-opacity-80"
              style={{ color: 'var(--brand-ink)' }}
            >{t('settings.email.gmail_app_password')}</a>
            {t('settings.email.gmail_tip').split(t('settings.email.gmail_app_password'))[1] || ''}
          </p>
        </div>
      </div>

      {/* Test status banner */}
      {testStatus && (
        <div
          className="flex items-center gap-2 r-lg p-3 text-xs"
          style={{
            background: testStatus === 'ok' ? 'var(--brand-soft)' : 'var(--danger-soft)',
            border: `1px solid ${testStatus === 'ok' ? 'var(--brand-line)' : 'var(--danger-line)'}`,
            color: testStatus === 'ok' ? 'var(--brand-ink)' : 'var(--danger)',
          }}
        >
          {testStatus === 'ok'
            ? <IconCheck className="h-4 w-4 shrink-0" />
            : <IconAlertCircle className="h-4 w-4 shrink-0" />
          }
          {testStatus === 'ok' ? t('settings.email.connection_ok') : testError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleTest}
          disabled={testing || !form.host || !form.user}
          className="flex items-center gap-2 text-sm font-medium r-lg px-4 py-2 transition-all disabled-dim"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
          onMouseEnter={e => { if (!testing) e.currentTarget.style.background = 'var(--surface-sunken)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          <IconRefresh className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
          {testing ? t('settings.email.testing') : t('settings.email.test_button')}
        </button>

        <button
          onClick={handleSave}
          disabled={saving || (!form.host && !form.user)}
          className="flex items-center gap-2 text-sm font-semibold r-lg px-4 py-2 transition-all disabled-dim"
          style={{
            background: isConfigured ? 'var(--brand)' : 'var(--surface)',
            border: `1px solid ${isConfigured ? 'var(--brand-line)' : 'var(--line)'}`,
            color: isConfigured ? '#fff' : 'var(--ink-muted)',
          }}
        >
          <IconMail className="h-4 w-4" />
          {saving ? t('settings.email.saving') : t('settings.email.save_button')}
        </button>
      </div>

      {/* Quick-reference presets */}
      <div className="pt-2">
        <label className="ft-label uppercase tracking-wider block mb-3">{t('settings.email.quick_fill')}</label>
        <div className="grid grid-cols-2 sm-grid-cols-3 gap-2">
          {[
            { name: 'Gmail',    host: 'smtp.gmail.com',    port: '587' },
            { name: 'Outlook',  host: 'smtp.office365.com', port: '587' },
            { name: 'Yahoo',    host: 'smtp.mail.yahoo.com', port: '587' },
            { name: 'iCloud',   host: 'smtp.mail.me.com',  port: '587' },
            { name: 'Telenor',  host: 'smtp.online.no',    port: '587' },
            { name: 'Epost.no', host: 'smtp.epost.no',     port: '587' },
          ].map(({ name, host, port }) => (
            <button
              key={name}
              type="button"
              onClick={() => { handleChange('host', host); handleChange('port', port); }}
              className="text-xs r-md px-3 py-2 text-left transition-all"
              style={{
                background: form.host === host ? 'var(--brand-soft)' : 'var(--surface)',
                border: `1px solid ${form.host === host ? 'var(--brand-line)' : 'var(--line)'}`,
                color: form.host === host ? 'var(--brand-ink)' : 'var(--ink-muted)',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
