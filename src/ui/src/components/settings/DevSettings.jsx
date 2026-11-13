import { IconCode, IconStar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import { useSupporterPack } from '../../hooks/useSupporterPack';
import { TesseractTest } from '../dev/TesseractTest';
import { CreditLedgerViewer } from '../dev/CreditLedgerViewer';

export function DevSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isSupporter, activateSupporterPack, aiCredits } = useSupporterPack();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ft-card relative overflow-hidden r-lg" style={{ border: '2px dashed var(--brand-line)' }}>
        <div className="relative p-6 md-p-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 r-lg p-3" style={{ background: 'var(--brand-soft)' }}>
              <IconCode className="h-6 w-6" style={{ color: 'var(--brand-ink)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>{t('settings.dev.title')}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--ink-muted)' }}>
                {t('settings.dev.description')}
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                <kbd className="px-2-5 py-1 r-md text-xs font-mono" style={{ background: 'var(--hover-strong)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                  Ctrl+Shift+D
                </kbd>
                <span>{t('settings.dev.shortcut_hint')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporter Pack Toggle */}
      <div className="ft-card r-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 r-lg p-3" style={{ background: isSupporter ? 'var(--success-soft)' : 'var(--surface)' }}>
              <IconStar className="h-5 w-5" style={{ color: isSupporter ? 'var(--brand)' : 'var(--brand-ink)' }} />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('settings.dev.supporter_pack')}</h4>
              <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
                {t('settings.dev.supporter_desc')}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 r-md p-3" style={{
                  border: isSupporter ? '1px solid var(--brand-line)' : '1px solid var(--line)',
                  background: isSupporter ? 'var(--brand-soft)' : 'var(--surface-sunken)',
                }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.dev.status')}</p>
                  <p className="text-sm font-semibold" style={{ color: isSupporter ? 'var(--brand-ink)' : 'var(--ink-muted)' }}>
                    {isSupporter ? t('settings.dev.activated') : t('settings.dev.deactivated')}
                  </p>
                </div>
                {isSupporter && (
                  <div className="flex-1 r-md p-3" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.dev.ai_credits')}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{aiCredits.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (isSupporter) {
                    localStorage.removeItem('fattern:supporter');
                    window.location.reload();
                  } else {
                    (async () => {
                      try {
                        await activateSupporterPack({
                          features: ['premium_themes', 'premium_templates', 'ai'],
                          ai_credits: 1000,
                        });
                        toast.success(t('settings.dev.activate_success'), t('settings.dev.activate_success_desc'));
                        setTimeout(() => window.location.reload(), 500);
                      } catch (error) {
                        console.error('Failed to activate supporter pack', error);
                        toast.error(t('settings.dev.activate_error'));
                      }
                    })();
                  }
                }}
                className={`w-full px-4 py-2-5 r-lg text-sm font-semibold transition ${isSupporter ? 'ft-btn ft-btn-secondary' : 'ft-btn ft-btn-primary'}`}
              >
                {isSupporter ? t('settings.dev.deactivate') : t('settings.dev.activate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dev Tools */}
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('settings.dev.dev_tools')}</h4>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('settings.dev.dev_tools_desc')}</p>
        </div>

        <div className="ft-card r-lg overflow-hidden">
          <div className="p-6">
            <TesseractTest />
          </div>
        </div>

        <div className="ft-card r-lg overflow-hidden">
          <div className="p-6">
            <CreditLedgerViewer />
          </div>
        </div>
      </div>
    </div>
  );
}
