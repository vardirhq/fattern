import { IconCheck, IconLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useSupporterPack } from '../../hooks/useSupporterPack';
import { useToast } from '../../hooks/useToast';

export function AppearanceSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentTheme, availableThemes, setTheme } = useTheme();
  const { isSupporter } = useSupporterPack();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('settings.appearance.title')}</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>{t('settings.appearance.description')}</p>
      </div>

      <div className="space-y-4">
        <div className="py-3" style={{ borderBottom: '1px solid var(--line)' }}>
          <label className="ft-label uppercase tracking-wider mb-4 block">{t('settings.appearance.theme')}</label>
          <div className="grid grid-cols-1 sm-grid-cols-2 gap-4">
            {availableThemes.map((theme) => {
              const isSelected = currentTheme?.id === theme.id;
              const isLocked = theme.premium && !isSupporter;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    if (isLocked) {
                      toast.info(t('settings.appearance.premium_theme'), t('settings.appearance.premium_theme_desc'));
                      return;
                    }
                    try {
                      setTheme(theme.id);
                      toast.success(t('settings.appearance.theme_changed'), t('settings.appearance.theme_active', { name: theme.name }));
                    } catch (error) {
                      toast.error(t('settings.appearance.theme_error'), error.message);
                    }
                  }}
                  disabled={isLocked}
                  className={`relative r-lg overflow-hidden transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    border: isSelected ? '2px solid var(--brand-line)' : '2px solid var(--line)',
                    boxShadow: isSelected ? 'none' : 'none',
                  }}
                >
                  {/* Theme Preview */}
                  <div 
                    className="h-24 relative"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.cloud} 0%, ${theme.colors.mist} 50%, ${theme.colors.brand[100]} 100%)`
                    }}
                  >
                    {/* Preview Content */}
                    <div className="absolute inset-0 p-3 flex flex-col gap-1-5">
                      {/* Preview Header */}
                      <div 
                        className="h-2 r-full"
                        style={{ backgroundColor: theme.colors.brand[600], width: '60%' }}
                      />
                      {/* Preview Cards */}
                      <div className="flex gap-1-5 mt-1">
                        <div 
                          className="h-8 r-sm flex-1"
                          style={{ backgroundColor: theme.colors.white }}
                        >
                          <div 
                            className="h-full r-sm flex items-center px-2"
                            style={{ backgroundColor: theme.colors.brand[50] }}
                          >
                            <div 
                              className="h-1-5 r-full"
                              style={{ backgroundColor: theme.colors.brand[400], width: '40%' }}
                            />
                          </div>
                        </div>
                        <div 
                          className="h-8 r-sm flex-1"
                          style={{ backgroundColor: theme.colors.white }}
                        >
                          <div 
                            className="h-full r-sm flex items-center px-2"
                            style={{ backgroundColor: theme.colors.mist }}
                          >
                            <div 
                              className="h-1-5 r-full"
                              style={{ backgroundColor: theme.colors.ink, opacity: 0.3, width: '50%' }}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Preview Accent */}
                      <div className="flex gap-1 mt-auto">
                        <div 
                          className="h-1-5 r-full flex-1"
                          style={{ backgroundColor: theme.colors.brand[500] }}
                        />
                        <div 
                          className="h-1-5 r-full flex-1"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                    </div>
                    
                    {/* Lock Icon */}
                    {isLocked && (
                      <div className="absolute top-2 right-2 r-full p-1-5" style={{ background: 'var(--ink)', backdropFilter: 'blur(8px)' }}>
                        <IconLock className="h-3-5 w-3-5" style={{ color: 'var(--ink-muted)' }} />
                      </div>
                    )}

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 r-full p-1-5" style={{ background: 'var(--brand)', boxShadow: 'none' }}>
                        <IconCheck className="h-3-5 w-3-5 text-on-brand" />
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-4" style={{ background: 'var(--surface-raised)', borderTop: '1px solid var(--line)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 r-full shrink-0"
                          style={{ backgroundColor: theme.colors.brand[600], border: '1px solid var(--line)' }}
                        />
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{theme.name}</span>
                      </div>
                      <div className="flex items-center gap-1-5">
                        {theme.accentOptions && !isLocked && (
                          <div className="flex items-center gap-1-5">
                            {isSupporter ? (
                              theme.accentOptions.map((accent, idx) => {
                                const isCurrentAccent = currentTheme?.id === theme.id &&
                                  currentTheme?.colors?.accent === accent.color;
                                return (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      try {
                                        setTheme(theme.id, accent.color);
                                        toast.success(t('settings.appearance.theme_changed'), t('settings.appearance.theme_with_accent', { name: theme.name, accent: accent.name.toLowerCase() }));
                                      } catch (error) {
                                        toast.error(t('settings.appearance.theme_error'), error.message);
                                      }
                                    }}
                                    className={`w-5 h-5 r-md border-2 transition-all hover-scale-110 ${isCurrentAccent ? 'scale-110' : ''}`}
                                    style={{
                                      backgroundColor: accent.color,
                                      borderColor: isCurrentAccent ? 'var(--brand)' : 'var(--line)',
                                    }}
                                    title={accent.name}
                                  />
                                );
                              })
                            ) : (
                              <div className="flex items-center gap-1 opacity-60" title={t('settings.appearance.requires_supporter')}>
                                <IconLock className="h-3-5 w-3-5" style={{ color: 'var(--ink-muted)' }} />
                                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('settings.appearance.accent_colors')}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {theme.premium && (
                          <span className="text-xs font-medium px-2 py-0-5 r-full" style={{ color: 'var(--brand-ink)', background: 'var(--brand-soft)', border: '1px solid var(--brand-line)' }}>
                            {t('settings.appearance.premium')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {!isSupporter && (
            <p className="text-xs mt-4" style={{ color: 'var(--ink-muted)' }}>
              {t('settings.appearance.premium_locked')} <a href="#" className="hover-underline" style={{ color: 'var(--brand-ink)' }}>{t('settings.appearance.premium_locked_link')}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

