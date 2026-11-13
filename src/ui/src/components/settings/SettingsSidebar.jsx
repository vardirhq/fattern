import { useTranslation } from 'react-i18next';
import { SETTING_CATEGORIES } from '../../utils/settingsConstants';

export function SettingsSidebar({ activeCategory, onCategoryChange, showDevMenu }) {
  const { t } = useTranslation();

  return (
    <aside className="w-64 shrink-0">
      <div className="ft-card r-lg p-3">
        <div className="mb-2 px-2 py-1-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
            {t('settings.sidebar_categories')}
          </p>
        </div>
        <nav className="space-y-1">
          {SETTING_CATEGORIES.filter((category) => {
            if (category.hidden && !showDevMenu) return false;
            return true;
          }).map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const label = t(`settings.categories.${category.id}`, { defaultValue: category.label });
            const description = t(`settings.category_descriptions.${category.id}`, { defaultValue: category.description });
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className="group relative w-full flex items-start gap-3 r-lg px-3 py-3 text-left transition"
                style={{
                  background: isActive ? 'var(--brand-soft)' : 'transparent',
                  border: isActive ? '1px solid var(--brand-line)' : '1px solid transparent',
                  color: isActive ? 'var(--brand-ink)' : 'var(--ink-muted)',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--ink)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; }}}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center r-md transition"
                  style={{
                    background: isActive ? 'var(--brand-soft)' : 'var(--hover)',
                    color: isActive ? 'var(--brand-ink)' : 'var(--ink-muted)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs mt-0-5" style={{ color: isActive ? 'var(--brand-ink)' : 'var(--ink-muted)' }}>
                    {description}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute left-0 top-half -translate-y-half h-6 w-1 r-right-full" style={{ background: 'var(--brand)' }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
