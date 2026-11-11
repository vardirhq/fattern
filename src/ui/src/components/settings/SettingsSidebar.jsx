import { useTranslation } from 'react-i18next';
import { SETTING_CATEGORIES } from '../../utils/settingsConstants';

export function SettingsSidebar({ activeCategory, onCategoryChange, showDevMenu }) {
  const { t } = useTranslation();

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="f-glass rounded-2xl p-3">
        <div className="mb-2 px-2 py-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--f-text-subtle)' }}>
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
                className="group relative w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition"
                style={{
                  background: isActive ? 'var(--f-green-bg)' : 'transparent',
                  border: isActive ? '1px solid var(--f-border-green)' : '1px solid transparent',
                  color: isActive ? 'var(--f-green-text)' : 'var(--f-text-soft)',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; }}}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition"
                  style={{
                    background: isActive ? 'rgba(47,75,216,0.15)' : 'var(--f-hover)',
                    color: isActive ? 'var(--f-green-text)' : 'var(--f-text-subtle)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: isActive ? 'var(--f-green-text-dim)' : 'var(--f-text-subtle)' }}>
                    {description}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full" style={{ background: 'var(--f-green)' }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
