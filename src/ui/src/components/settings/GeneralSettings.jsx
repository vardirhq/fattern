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
        background: 'var(--f-overlay)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          width: 440,
          background: 'var(--f-surface-elevated)',
          border: '1px solid rgba(240,80,70,0.35)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(240,80,70,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconAlertTriangle size={20} style={{ color: '#f05046' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--f-text-body)' }}>
              {t('settings.general.wipe_modal_title')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--f-text-subtle)', marginTop: 1 }}>
              {t('settings.general.wipe_modal_irreversible')}
            </div>
          </div>
        </div>

        {/* Warning text */}
        <p style={{ fontSize: 13, color: 'var(--f-text-soft)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('settings.general.wipe_modal_warning')}
        </p>

        {/* Typed confirmation */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--f-text-subtle)', display: 'block', marginBottom: 6 }}>
            {t('settings.general.wipe_modal_type_label', { phrase: '' })}
            <strong style={{ color: 'var(--f-text-body)', letterSpacing: '0.04em' }}>{CONFIRM_PHRASE}</strong>
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
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              letterSpacing: '0.05em',
              background: 'var(--f-input-bg)',
              border: `1px solid ${matches ? 'rgba(240,80,70,0.6)' : 'var(--f-border-subtle)'}`,
              color: matches ? '#f07060' : 'var(--f-text-body)',
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
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'none', border: '1px solid var(--f-border-subtle)',
              color: 'var(--f-text-soft)', cursor: 'pointer',
            }}
          >
            {t('settings.general.wipe_modal_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: matches ? 'rgba(240,80,70,0.15)' : 'var(--f-hover)',
              border: `1px solid ${matches ? 'rgba(240,80,70,0.5)' : 'var(--f-border-faint)'}`,
              color: matches ? '#f07060' : 'var(--f-text-subtle)',
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
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>
            {t('settings.general.title')}
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--f-text-subtle)' }}>
            {t('settings.general.description')}
          </p>
        </div>

        {/* ── Language selector ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--f-text-subtle)' }}>
              {t('settings.general.language_section')}
            </label>
            <p className="text-sm mt-1.5 mb-3" style={{ color: 'var(--f-text-soft)' }}>
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
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.13s',
                    background: currentLang === code
                      ? 'var(--f-green-bg)'
                      : 'var(--f-hover)',
                    border: currentLang === code
                      ? '1px solid var(--f-border-green)'
                      : '1px solid var(--f-border-subtle)',
                    color: currentLang === code
                      ? 'var(--f-green-text)'
                      : 'var(--f-text-soft)',
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
            <div style={{ flex: 1, height: 1, background: 'rgba(240,80,70,0.2)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,80,70,0.55)', flexShrink: 0 }}>
              {t('settings.general.danger_zone')}
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(240,80,70,0.2)' }} />
          </div>

          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(240,80,70,0.2)',
              background: 'rgba(240,80,70,0.04)',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text-body)', marginBottom: 3 }}>
                {t('settings.general.wipe_title')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--f-text-subtle)', lineHeight: 1.5 }}>
                {t('settings.general.wipe_desc')}
              </div>
            </div>
            <button
              onClick={() => setShowFirstConfirm(true)}
              disabled={wiping}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: 'rgba(240,80,70,0.08)',
                border: '1px solid rgba(240,80,70,0.3)',
                color: '#f07060',
                cursor: wiping ? 'not-allowed' : 'pointer',
                opacity: wiping ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,80,70,0.15)'; e.currentTarget.style.borderColor = 'rgba(240,80,70,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(240,80,70,0.08)'; e.currentTarget.style.borderColor = 'rgba(240,80,70,0.3)'; }}
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
            background: 'var(--f-overlay)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFirstConfirm(false); }}
        >
          <div
            style={{
              background: 'var(--f-surface-elevated)',
              border: '1px solid rgba(240,80,70,0.25)',
              borderRadius: 14,
              padding: '22px 24px 20px',
              width: 340,
              boxShadow: '0 12px 32px var(--f-tooltip-shadow)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--f-text-body)', marginBottom: 8 }}>
              {t('settings.general.first_confirm_title')}
            </div>
            <p style={{ fontSize: 12, color: 'var(--f-text-soft)', lineHeight: 1.6, marginBottom: 18 }}>
              {t('settings.general.first_confirm_desc')}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowFirstConfirm(false)}
                style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  background: 'none', border: '1px solid var(--f-border-subtle)',
                  color: 'var(--f-text-soft)', cursor: 'pointer',
                }}
              >
                {t('settings.general.first_confirm_cancel')}
              </button>
              <button
                onClick={() => { setShowFirstConfirm(false); setShowSecondConfirm(true); }}
                style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: 'rgba(240,80,70,0.12)',
                  border: '1px solid rgba(240,80,70,0.4)',
                  color: '#f07060', cursor: 'pointer',
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
