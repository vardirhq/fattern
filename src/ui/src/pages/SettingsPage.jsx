import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { ConfirmModal } from '../components/ConfirmModal';
import { TemplateImportModal } from '../components/templates/TemplateImportModal';
import { SETTING_CATEGORIES } from '../utils/settingsConstants';
import { SettingsSidebar } from '../components/settings/SettingsSidebar';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { DefaultsSettings } from '../components/settings/DefaultsSettings';
import { InvoiceSettings } from '../components/settings/InvoiceSettings';
import { CompanySettings } from '../components/settings/CompanySettings';
import { TemplatesSettings } from '../components/settings/TemplatesSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { EmailSettings } from '../components/settings/EmailSettings';
import { ImportSettings } from '../components/settings/ImportSettings';
import { AboutSettings } from '../components/settings/AboutSettings';
import { DevSettings } from '../components/settings/DevSettings';

export function SettingsPage({ company, onCompanyUpdate, onOpenTemplateEditor, onRefreshData }) {
  const { t } = useTranslation();
  const { updateSetting } = useSettings();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('general');
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, templateId: null, templateName: null });
  const [importModal, setImportModal] = useState({ isOpen: false, packagePath: null, templateMeta: null, validationIssues: [], warnings: [] });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDevMenu((prev) => !prev);
        if (!showDevMenu) {
          setActiveCategory('dev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDevMenu]);

  const handleSetDefaultTemplate = async (templateId) => {
    try {
      updateSetting('invoice.defaultTemplate', templateId);
      toast.success(t('settings_page.default_template_updated'), t('settings_page.default_template_updated_desc', { id: templateId }));
    } catch (error) {
      console.error('Failed to set default template', error);
      toast.error(t('settings_page.set_default_error'), error.message);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    if (templateId === 'default_invoice') {
      toast.error(t('settings_page.delete_not_allowed'), t('settings_page.delete_not_allowed_desc'));
      return;
    }

    setDeleteConfirm({
      isOpen: true,
      templateId,
      templateName: templateId,
    });
  };

  const confirmDeleteTemplate = async () => {
    const { templateId } = deleteConfirm;
    if (!templateId) return;

    try {
      const api = typeof window !== 'undefined' ? window.fattern?.template : null;
      if (!api) return;

      await api.delete(templateId);
      toast.success(t('settings_page.template_deleted'), t('settings_page.template_deleted_desc'));
    } catch (error) {
      console.error('Failed to delete template', error);
      toast.error(t('settings_page.delete_template_error'), error.message);
    } finally {
      setDeleteConfirm({ isOpen: false, templateId: null, templateName: null });
    }
  };

  const handleImportTemplate = async () => {
    try {
      const dialogApi = window.fattern?.dialog;
      const api = window.fattern?.template;
      if (!dialogApi || !api) {
        toast.error(t('settings_page.import_not_available'), t('settings_page.import_not_available_desc'));
        return;
      }

      const result = await dialogApi.showOpenDialog({
        title: t('settings_page.import_title'),
        filters: [
          { name: t('settings_page.import_filter_name'), extensions: ['fattern-template'] },
          { name: t('settings_page.import_all_files'), extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) return;

      const packagePath = result.filePaths[0];
      const validationResult = await api.validatePackage(packagePath);

      setImportModal({
        isOpen: true,
        packagePath,
        templateMeta: validationResult.meta,
        validationIssues: validationResult.issues || [],
        warnings: validationResult.warnings || [],
      });
    } catch (error) {
      console.error('Failed to import template', error);
      toast.error(t('settings_page.import_error'), error.message);
    }
  };

  const handleConfirmImport = async () => {
    try {
      const api = window.fattern?.template;
      if (!api) return;

      const result = await api.importPackage(importModal.packagePath);
      const importedAs = result.finalId !== result.meta.id;
      toast.success(
        t('settings_page.template_imported'),
        importedAs
          ? t('settings_page.template_imported_as_desc', { name: result.meta.name, id: result.finalId })
          : t('settings_page.template_imported_desc', { name: result.meta.name })
      );

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning(t('settings_page.import_warning'), warning);
        });
      }

      setImportModal({ isOpen: false, packagePath: null, templateMeta: null, validationIssues: [], warnings: [] });
    } catch (error) {
      console.error('Failed to import template', error);
      toast.error(t('settings_page.import_error'), error.message);
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return <GeneralSettings onRefreshData={onRefreshData} />;
      case 'defaults':
        return <DefaultsSettings />;
      case 'invoice':
        return <InvoiceSettings />;
      case 'company':
        return <CompanySettings company={company} onCompanyUpdate={onCompanyUpdate} />;
      case 'templates':
        return (
          <TemplatesSettings
            onOpenTemplateEditor={onOpenTemplateEditor}
            onDeleteTemplate={handleDeleteTemplate}
            onSetDefaultTemplate={handleSetDefaultTemplate}
            onImportTemplate={handleImportTemplate}
          />
        );
      case 'appearance':
        return <AppearanceSettings />;
      case 'email':
        return <EmailSettings />;
      case 'import':
        return <ImportSettings onRefreshData={onRefreshData} />;
      case 'about':
        return <AboutSettings />;
      case 'dev':
        return <DevSettings />;
      default:
        return <GeneralSettings onRefreshData={onRefreshData} />;
    }
  };

  const activeCategoryObj = SETTING_CATEGORIES.find((c) => c.id === activeCategory);
  const activeCategoryLabel = activeCategoryObj
    ? t(`settings.categories.${activeCategory}`, { defaultValue: activeCategoryObj.label })
    : t('settings.title');
  const activeCategoryDescription = activeCategoryObj
    ? t(`settings.category_descriptions.${activeCategory}`, { defaultValue: activeCategoryObj.description || '' })
    : '';

  return (
    <div className="flex" style={{ height: 'calc(100vh - 126px)' }}>
      <div className="flex w-full gap-6">
        <SettingsSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          showDevMenu={showDevMenu}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="f-glass rounded-2xl overflow-hidden">
            <div className="px-8 py-6" style={{ borderBottom: '1px solid var(--f-border-subtle)', background: 'transparent' }}>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--f-text)' }}>{activeCategoryLabel}</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--f-text-soft)' }}>{activeCategoryDescription}</p>
            </div>

            <div className="p-8">
              <div className={activeCategory === 'templates' ? '' : 'max-w-2xl'}>{renderContent()}</div>
            </div>
          </div>
        </main>
      </div>

      <TemplateImportModal
        isOpen={importModal.isOpen}
        onClose={() => setImportModal({ isOpen: false, packagePath: null, templateMeta: null, validationIssues: [], warnings: [] })}
        onConfirm={handleConfirmImport}
        templateMeta={importModal.templateMeta}
        validationIssues={importModal.validationIssues}
        warnings={importModal.warnings}
      />
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, templateId: null, templateName: null })}
        onConfirm={confirmDeleteTemplate}
        title={t('settings_page.delete_template_title')}
        description={t('settings_page.delete_template_desc', { name: deleteConfirm.templateName })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
