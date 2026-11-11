import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLock, IconPackage } from '@tabler/icons-react';
import { useToast } from '../../hooks/useToast';
import { useSettings } from '../../hooks/useSettings';
import { useSupporterPack } from '../../hooks/useSupporterPack';
import { getTemplateId, getTemplateName, isTemplatePremium, isTemplateDefault, isTemplateBuiltIn, isTemplateCustom } from '../../utils/templateUtils';
import { TemplateCard } from './TemplateCard';
import { TemplateFilterSidebar } from './TemplateFilterSidebar';

export function TemplatesSettings({ onOpenTemplateEditor, onDeleteTemplate, onSetDefaultTemplate, onImportTemplate }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { getSetting } = useSettings();
  const { isSupporter } = useSupporterPack();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const defaultTemplateId = getSetting('invoice.defaultTemplate', 'default_invoice');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.template : null;
      if (!api) {
        console.error('Template API not available');
        return;
      }

      await api.createDefault();

      try {
        await api.createPresets();
      } catch (error) {
        console.log('Presets may already exist:', error);
      }

      const templateList = await api.list();
      setTemplates(templateList || []);
    } catch (error) {
      console.error('Failed to load templates', error);
      toast.error(t('settings.templates.load_error'), error.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCreatePremiumTemplates = async () => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.template : null;
      if (!api) {
        console.error('Template API not available');
        return;
      }

      await api.createPremium();
      toast.success(t('settings.templates.premium_created'), t('settings.templates.premium_created_desc'));
      await loadTemplates();
    } catch (error) {
      console.error('Failed to create premium templates', error);
      toast.error(t('settings.templates.premium_create_error'), error.message);
    }
  };

  const handleExportTemplate = async (templateId) => {
    try {
      const api = window.fattern?.template;
      const dialogApi = window.fattern?.dialog;
      if (!api || !dialogApi) return;

      const template = templates.find(tmpl => getTemplateId(tmpl) === templateId);
      const templateName = getTemplateName(template) || templateId;
      const filename = `${templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.fattern-template`;

      const result = await dialogApi.showSaveDialog({
        title: t('settings.templates.export_title'),
        defaultPath: filename,
        filters: [
          { name: t('settings_page.import_filter_name'), extensions: ['fattern-template'] },
          { name: t('settings_page.import_all_files'), extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) return;

      await api.exportPackage(templateId, result.filePath);
      toast.success(t('settings.templates.exported'), t('settings.templates.exported_desc', { name: templateName }));
    } catch (error) {
      console.error('Failed to export template', error);
      toast.error(t('settings.templates.export_error'), error.message);
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.template : null;
      if (!api) return;

      const template = templates.find(tmpl => getTemplateId(tmpl) === templateId);
      if (!template) return;

      const newId = `${templateId}_copy_${Date.now()}`;
      const newName = `${getTemplateName(template)} (${t('settings.templates.copy_suffix')})`;

      await api.duplicate(templateId, newId, newName);
      toast.success(t('settings.templates.duplicated'), t('settings.templates.duplicated_desc', { name: newName }));
      await loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template', error);
      toast.error(t('settings.templates.duplicate_error'), error.message);
    }
  };

  const handleCreateNewTemplate = async () => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.template : null;
      if (!api) return;

      const defaultTemplate = templates.find(tmpl => getTemplateId(tmpl) === 'default_invoice') || templates[0];
      if (defaultTemplate) {
        const srcId = getTemplateId(defaultTemplate);
        const newId = `template_${Date.now()}`;
        const newName = t('settings.templates.new_template_name');
        await api.duplicate(srcId, newId, newName);
        toast.success(t('settings.templates.created'), t('settings.templates.created_desc'));
        await loadTemplates();
        onOpenTemplateEditor?.(newId);
      } else {
        onOpenTemplateEditor?.('default_invoice');
      }
    } catch (error) {
      console.error('Failed to create new template', error);
      toast.error(t('settings.templates.create_error'), error.message);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (activeFilter === 'all') return templates;
    if (activeFilter === 'builtin') return templates.filter(tmpl => isTemplateBuiltIn(getTemplateId(tmpl)));
    if (activeFilter === 'premium') return templates.filter(tmpl => isTemplatePremium(tmpl));
    if (activeFilter === 'custom') return templates.filter(tmpl => isTemplateCustom(getTemplateId(tmpl)));
    return templates;
  }, [templates, activeFilter]);

  const premiumTemplates = templates.filter(tmpl => isTemplatePremium(tmpl));
  const hasPremiumTemplates = premiumTemplates.length > 0;

  const filterLabel = (filter) => ({
    all: t('common.all'),
    builtin: t('settings.templates.filter_builtin'),
    premium: t('settings.templates.filter_premium'),
    custom: t('settings.templates.filter_custom'),
  }[filter] || filter);

  return (
    <div className="flex gap-6">
      <TemplateFilterSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.templates.title')}</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.templates.desc')}</p>
        </div>

        {loadingTemplates ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.templates.loading')}</div>
        ) : (
          <>
            {filteredTemplates.length === 0 ? (
              <div className="rounded-lg p-6 text-center" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
                <p className="text-sm" style={{ color: 'var(--f-text-soft)' }}>
                  {templates.length === 0
                    ? t('settings.templates.empty')
                    : t('settings.templates.empty_filter', { filter: filterLabel(activeFilter) })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredTemplates.map((template) => {
                  const templateId = getTemplateId(template);
                  const isDefault = isTemplateDefault(templateId, defaultTemplateId);

                  return (
                    <TemplateCard
                      key={templateId}
                      template={template}
                      isDefault={isDefault}
                      isSupporter={isSupporter}
                      onSetDefault={() => onSetDefaultTemplate?.(templateId)}
                      onEdit={() => onOpenTemplateEditor?.(templateId)}
                      onExport={() => handleExportTemplate(templateId)}
                      onDuplicate={() => handleDuplicateTemplate(templateId)}
                      onDelete={() => onDeleteTemplate?.(templateId)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {!hasPremiumTemplates && isSupporter && (
          <div className="rounded-lg p-4" style={{ border: '1px solid var(--f-border-green)', background: 'var(--f-green-bg)' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-green-text)' }}>{t('settings.templates.premium_title')}</h4>
                <p className="text-xs mb-3" style={{ color: 'var(--f-green-text-dim)' }}>
                  {t('settings.templates.premium_desc')}
                </p>
              </div>
              <button
                onClick={handleCreatePremiumTemplates}
                className="f-btn-primary rounded-lg px-4 py-2 text-xs font-semibold"
              >
                {t('settings.templates.create_premium_button')}
              </button>
            </div>
          </div>
        )}

        {hasPremiumTemplates && !isSupporter && (
          <div className="rounded-lg p-4" style={{ border: '1px solid rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.08)' }}>
            <div className="flex items-start gap-3">
              <IconLock className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.templates.premium_available_title')}</h4>
                <p className="text-xs" style={{ color: 'var(--f-text-soft)' }}>
                  {t('settings.templates.premium_available_desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4" style={{ borderTop: '1px solid var(--f-border-faint)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--f-text-subtle)' }}>
            {t('settings.templates.default_hint')}
          </p>
          <div className="flex gap-2">
            {onImportTemplate && (
              <button
                onClick={onImportTemplate}
                className="f-btn-ghost rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
              >
                <IconPackage className="h-4 w-4" />
                {t('settings.templates.import_button')}
              </button>
            )}
            {onOpenTemplateEditor && (
              <button
                onClick={handleCreateNewTemplate}
                className="f-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
              >
                {t('settings.templates.create_button')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
