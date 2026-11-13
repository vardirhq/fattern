import { useState } from 'react';
import { IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import { useSettings } from '../../hooks/useSettings';

function WipeConfirmModal({ onConfirm, onCancel }) {
  const { t } = useTranslation();
  const CONFIRM_PHRASE = t('settings.general.wipe_modal_phrase');
  const [input, setInput] = useState('');
  const matches = input === CONFIRM_PHRASE;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--scrim)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          width: 440,
          background: 'var(--surface-raised)',
          border: '1px solid var(--danger-line)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 28px 24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)', flexShrink: 0,
            background: 'var(--danger-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconAlertTriangle size={20} style={{ color: 'var(--danger)' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
              {t('settings.general.wipe_modal_title')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 1 }}>
              {t('settings.general.wipe_modal_irreversible')}
            </div>
          </div>
        </div>

        {/* Warning text */}
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('settings.general.wipe_modal_warning')}
        </p>

        {/* Typed confirmation */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 6 }}>
            {t('settings.general.wipe_modal_type_label', { phrase: '' })}
            <strong style={{ color: 'var(--ink)', letterSpacing: '0.04em' }}>{CONFIRM_PHRASE}</strong>
            {t('settings.general.wipe_modal_type_label', { phrase: '' }).split('{{phrase}}')[1] || ':'}
          </label>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && matches) onConfirm(); if (e.key === 'Escape') onCancel(); }}
            placeholder={CONFIRM_PHRASE}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              letterSpacing: '0.05em',
              background: 'var(--surface)',
              border: `1px solid ${matches ? 'var(--danger)' : 'var(--line)'}`,
              color: matches ? 'var(--danger)' : 'var(--ink)',
              outline: 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
              background: 'none', border: '1px solid var(--line)',
              color: 'var(--ink-muted)', cursor: 'pointer',
            }}
          >
            {t('settings.general.wipe_modal_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches}
            style={{
              padding: '8px 20px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
              background: matches ? 'var(--danger-soft)' : 'var(--hover)',
              border: `1px solid ${matches ? 'var(--danger)' : 'var(--line)'}`,
              color: matches ? 'var(--danger)' : 'var(--ink-muted)',
              cursor: matches ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {t('settings.general.wipe_modal_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GeneralSettings({ onRefreshData }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { updateSetting } = useSettings();
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [wiping, setWiping] = useState(false);

  const currentLang = i18n.language?.startsWith('nb') || i18n.language?.startsWith('no')
    ? 'nb'
    : i18n.language?.startsWith('en')
    ? 'en'
    : 'nb';

  const handleLanguageChange = async (lang) => {
    try {
      await updateSetting('app.language', lang);
      i18n.changeLanguage(lang);
    } catch (err) {
      console.error('Could not save language setting', err);
    }
  };

  const handleWipe = async () => {
    setShowSecondConfirm(false);
    setWiping(true);
    try {
      await window.fattern.app.wipeAllData();
      toast.success(t('settings.general.wipe_success'), t('settings.general.wipe_success_desc'));
      onRefreshData?.();
    } catch (err) {
      toast.error(t('settings.general.wipe_error'), err.message);
    } finally {
      setWiping(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            {t('settings.general.title')}
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
            {t('settings.general.description')}
          </p>
        </div>

        {/* ── Language selector ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              {t('settings.general.language_section')}
            </label>
            <p className="text-sm mt-1-5 mb-3" style={{ color: 'var(--ink-muted)' }}>
              {t('settings.general.language_label')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { code: 'nb', label: t('settings.general.language_nb') },
                { code: 'en', label: t('settings.general.language_en') },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.13s',
                    background: currentLang === code
                      ? 'var(--brand-soft)'
                      : 'var(--hover)',
                    border: currentLang === code
                      ? '1px solid var(--brand-line)'
                      : '1px solid var(--line)',
                    color: currentLang === code
                      ? 'var(--brand-ink)'
                      : 'var(--ink-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Danger zone ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--danger-line)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', flexShrink: 0 }}>
              {t('settings.general.danger_zone')}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--danger-line)' }} />
          </div>

          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--danger-line)',
              background: 'var(--danger-soft)',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
                {t('settings.general.wipe_title')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                {t('settings.general.wipe_desc')}
              </div>
            </div>
            <button
              onClick={() => setShowFirstConfirm(true)}
              disabled={wiping}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 'var(--radius-md)',
                fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger-line)',
                color: 'var(--danger)',
                cursor: wiping ? 'not-allowed' : 'pointer',
                opacity: wiping ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.borderColor = 'var(--danger-line)'; }}
            >
              <IconTrash size={13} />
              {wiping ? t('settings.general.wipe_deleting') : t('settings.general.wipe_button')}
            </button>
          </div>
        </div>
      </div>

      {/* First confirmation popover */}
      {showFirstConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'var(--scrim)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFirstConfirm(false); }}
        >
          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--danger-line)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px 20px',
              width: 340,
              boxShadow: '0 12px 32px var(--shadow-color)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              {t('settings.general.first_confirm_title')}
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 18 }}>
              {t('settings.general.first_confirm_desc')}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowFirstConfirm(false)}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500,
                  background: 'none', border: '1px solid var(--line)',
                  color: 'var(--ink-muted)', cursor: 'pointer',
                }}
              >
                {t('settings.general.first_confirm_cancel')}
              </button>
              <button
                onClick={() => { setShowFirstConfirm(false); setShowSecondConfirm(true); }}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600,
                  background: 'var(--danger-soft)',
                  border: '1px solid var(--danger-line)',
                  color: 'var(--danger)', cursor: 'pointer',
                }}
              >
                {t('settings.general.first_confirm_proceed')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second confirmation — typed phrase */}
      {showSecondConfirm && (
        <WipeConfirmModal
          onConfirm={handleWipe}
          onCancel={() => setShowSecondConfirm(false)}
        />
      )}
    </>
  );
}
