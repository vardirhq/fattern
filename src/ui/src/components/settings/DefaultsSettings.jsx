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

  const segmentActive = { background: 'var(--f-green-bg)', color: 'var(--f-green-text)', border: '1px solid var(--f-border-green)' };
  const segmentInactive = { color: 'var(--f-text-soft)' };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.defaults.title')}</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.defaults.desc')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
          <div className="flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{t('settings.defaults.products_label')}</label>
            <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.defaults.products_desc')}</p>
          </div>
          <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--f-border)', background: 'var(--f-hover)' }}>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('products', 'table')}
              disabled={isLoading}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
              style={productsDefaultView === 'table' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (productsDefaultView !== 'table') { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; } }}
              onMouseLeave={e => { if (productsDefaultView !== 'table') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; } }}
            >
              {t('common.list')}
            </button>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('products', 'card')}
              disabled={isLoading}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
              style={productsDefaultView === 'card' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (productsDefaultView !== 'card') { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; } }}
              onMouseLeave={e => { if (productsDefaultView !== 'card') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; } }}
            >
              {t('common.card')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--f-border-faint)' }}>
          <div className="flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{t('settings.defaults.customers_label')}</label>
            <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.defaults.customers_desc')}</p>
          </div>
          <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--f-border)', background: 'var(--f-hover)' }}>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('customers', 'table')}
              disabled={isLoading}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
              style={customersDefaultView === 'table' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (customersDefaultView !== 'table') { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; } }}
              onMouseLeave={e => { if (customersDefaultView !== 'table') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; } }}
            >
              {t('common.list')}
            </button>
            <button
              type="button"
              onClick={() => handleDefaultViewChange('customers', 'card')}
              disabled={isLoading}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-60"
              style={customersDefaultView === 'card' ? segmentActive : segmentInactive}
              onMouseEnter={e => { if (customersDefaultView !== 'card') { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; } }}
              onMouseLeave={e => { if (customersDefaultView !== 'card') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; } }}
            >
              {t('common.card')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
