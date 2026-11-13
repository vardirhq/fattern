import { IconCheck, IconStar, IconBolt, IconShield } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../utils/version';
import { useSupporterPack } from '../../hooks/useSupporterPack';

export function AboutSettings() {
  const { t } = useTranslation();
  const { isSupporter, features, aiCredits } = useSupporterPack();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="ft-card ft-raised relative overflow-hidden r-lg">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'transparent' }} />
        <div className="relative p-8 md-p-12">
          <div className="flex flex-col md-flex-row items-start md-items-center gap-6">
            {/* Logo */}
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 r-lg" style={{ background: 'var(--brand-soft)' }} />
                <div className="relative r-lg p-4" style={{ background: 'var(--hover-strong)', border: '1px solid var(--line)', backdropFilter: 'blur(12px)' }}>
                  <img
                    src="/logo.png"
                    alt="Fattern"
                    className="h-16 w-16 md-h-20 md-w-20"
                  />
                </div>
              </div>
            </div>

            {/* App Info */}
            <div className="flex-1">
              <h3 className="text-2xl md-text-3xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Fattern</h3>
              <p className="text-sm md-text-base mb-4 max-w-2xl" style={{ color: 'var(--ink-muted)' }}>
                {t('settings.about.description')}
              </p>
              <div className="flex flex-wrap gap-4 text-xs md-text-sm" style={{ color: 'var(--ink-muted)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{t('settings.about.version')}</span>
                  <span className="font-mono">{APP_VERSION}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconShield className="h-4 w-4" style={{ color: 'var(--brand-ink)' }} />
                  <span>{t('settings.about.local_first')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{t('settings.about.license')}</span>
                  <span>{t('settings.about.open_source')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporter Pack Status */}
      <div
        className="ft-card r-lg overflow-hidden"
        style={isSupporter ? { borderColor: 'var(--success-line)' } : {}}
      >
        <div className="p-6 md-p-8">
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 r-lg p-3"
              style={{ background: isSupporter ? 'var(--success-soft)' : 'var(--surface)' }}
            >
              <IconStar
                className="h-6 w-6"
                style={{ color: isSupporter ? 'var(--brand)' : 'var(--brand-ink)' }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{t('settings.about.supporter_pack')}</h4>
                {isSupporter && (
                  <span className="inline-flex items-center gap-1 r-full px-2-5 py-1 text-xs font-medium" style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' }}>
                    <IconCheck className="h-3 w-3" />
                    {t('settings.about.supporter_activated')}
                  </span>
                )}
              </div>

              {isSupporter ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>{t('settings.about.active_features')}</p>
                    <div className="grid grid-cols-1 md-grid-cols-2 gap-2">
                      {features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
                          <IconBolt className="h-4 w-4 shrink-0" style={{ color: 'var(--brand)' }} />
                          <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.about.ai_credits')}</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{aiCredits.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>{t('settings.about.status')}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>{t('settings.about.active')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
                    {t('settings.about.supporter_desc')}
                  </p>
                  <a
                    href="https://fattern.no/supporter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-btn ft-btn-primary inline-flex items-center gap-2 r-lg px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    <IconStar className="h-4 w-4" />
                    {t('settings.about.learn_more')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
