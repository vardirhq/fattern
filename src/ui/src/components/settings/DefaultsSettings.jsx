import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';

export function DefaultsSettings() {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isLoading } = useSettings();
  const productsDefaultView = getSetting('products.defaultView', 'table');
  const customersDefaultView = getSetting('customers.defaultView', 'table');

  const handleDefaultViewChange = (type, value) => {
    updateSetting(`${type}.defaultView`, value);
  };

  const segmentActive = { background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' };
  const segmentInactive = { color: 'var(--ink-muted)' };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('settings.defaults.title')}</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>{t('settings.defaults.desc')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('settings.defaults.products_label')}</label>
            <p className="text-xs mt-0-5" style={{ color: 'var(--ink-muted)' }}>{t('settings.defaults.products_desc')}</p>
          </div>
          <div className="flex r-md p-0-5" style={{ border: '1px solid var(--line)', background: 'var(--hover)' }}>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('products', 'table')}
              disabled={isLoading}
              className="r-md px-3 py-1-5 text-xs font-medium transition disabled-dim"
              style={productsDefaultView === 'table' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (productsDefaultView !== 'table') { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--ink)'; } }}
              onMouseLeave={e => { if (productsDefaultView !== 'table') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
            >
              {t('common.list')}
            </button>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('products', 'card')}
              disabled={isLoading}
              className="r-md px-3 py-1-5 text-xs font-medium transition disabled-dim"
              style={productsDefaultView === 'card' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (productsDefaultView !== 'card') { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--ink)'; } }}
              onMouseLeave={e => { if (productsDefaultView !== 'card') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
            >
              {t('common.card')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('settings.defaults.customers_label')}</label>
            <p className="text-xs mt-0-5" style={{ color: 'var(--ink-muted)' }}>{t('settings.defaults.customers_desc')}</p>
          </div>
          <div className="flex r-md p-0-5" style={{ border: '1px solid var(--line)', background: 'var(--hover)' }}>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('customers', 'table')}
              disabled={isLoading}
              className="r-md px-3 py-1-5 text-xs font-medium transition disabled-dim"
              style={customersDefaultView === 'table' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (customersDefaultView !== 'table') { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--ink)'; } }}
              onMouseLeave={e => { if (customersDefaultView !== 'table') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
            >
              {t('common.list')}
            </button>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('customers', 'card')}
              disabled={isLoading}
              className="r-md px-3 py-1-5 text-xs font-medium transition disabled-dim"
              style={customersDefaultView === 'card' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (customersDefaultView !== 'card') { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--ink)'; } }}
              onMouseLeave={e => { if (customersDefaultView !== 'card') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
            >
              {t('common.card')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
