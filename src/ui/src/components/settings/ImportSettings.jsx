import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CSVImportModal } from '../import/CSVImportModal';
import { useToast } from '../../hooks/useToast';

export function ImportSettings({ onRefreshData }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [csvImportModal, setCsvImportModal] = useState({ isOpen: false, type: 'customer' });

  // SAF-T state
  const [saftImporting, setSaftImporting] = useState(false);
  const [saftPreview, setSaftPreview] = useState(null);
  const [saftFilePath, setSaftFilePath] = useState(null);
  const [saftOptions, setSaftOptions] = useState({
    importCustomers: true,
    importInvoices: true,
    importExpenses: true,
    skipDuplicates: true,
  });

  const handleCSVImport = async (data, type) => {
    try {
      const api = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (!api) throw new Error('Database API ikke tilgjengelig');

      if (type === 'customer') {
        await api.bulkCreateCustomers(data);
        toast.success(`Importert ${data.length} kunder`, 'Kundene er nå tilgjengelige i systemet');
      } else if (type === 'product') {
        await api.bulkCreateProducts(data);
        toast.success(`Importert ${data.length} produkter`, 'Produktene er nå tilgjengelige i systemet');
      }

      onRefreshData?.();
    } catch (error) {
      console.error('Import feilet:', error);
      toast.error('Import feilet', error.message || 'Kunne ikke importere data');
      throw error;
    }
  };

  const handleSAFTSelect = async () => {
    const dialogApi = window.fattern?.dialog;
    if (!dialogApi) return;

    const result = await dialogApi.showOpenDialog({
      title: 'Velg SAF-T fil',
      filters: [
        { name: 'SAF-T XML', extensions: ['xml'] },
        { name: 'Alle filer', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || !result.filePaths?.length) return;

    const filepath = result.filePaths[0];
    setSaftFilePath(filepath);

    try {
      const preview = await window.fattern.saft.parsePreview(filepath);
      setSaftPreview(preview);
    } catch (error) {
      toast.error(t('settings.import.parse_error') + ': ' + error.message);
      setSaftFilePath(null);
    }
  };

  const handleSAFTImport = async () => {
    if (!saftFilePath) return;
    setSaftImporting(true);
    try {
      const results = await window.fattern.saft.import(saftFilePath, saftOptions);

      const messages = [];
      if (results.budgetYears?.created?.length > 0)
        messages.push(`Budsjettår opprettet: ${results.budgetYears.created.join(', ')}`);
      if (results.customers.imported > 0)
        messages.push(`${results.customers.imported} kunder importert`);
      if (results.customers.skipped > 0)
        messages.push(`${results.customers.skipped} kunder hoppet over (duplikater)`);
      if (results.invoices?.imported > 0)
        messages.push(`${results.invoices.imported} fakturaer importert`);
      if (results.invoices?.skipped > 0)
        messages.push(`${results.invoices.skipped} fakturaer hoppet over`);
      if (results.expenses.imported > 0)
        messages.push(`${results.expenses.imported} utgifter importert`);

      toast.success(messages.join(' · ') || t('settings.import.success'));
      setSaftPreview(null);
      setSaftFilePath(null);
      onRefreshData?.();
    } catch (error) {
      toast.error(t('settings.import.error') + ': ' + error.message);
    } finally {
      setSaftImporting(false);
    }
  };

  const handleSAFTCancel = () => {
    setSaftPreview(null);
    setSaftFilePath(null);
  };

  const saftFileName = saftFilePath ? saftFilePath.split('/').pop() : null;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.import.title')}</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--f-text-subtle)' }}>Importer kunder, produkter og fakturaer fra CSV eller SAF-T</p>
        </div>

        <div className="space-y-4">
          {/* CSV-import */}
          <div className="rounded-lg p-6" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--f-text-body)' }}>CSV-import</h4>
            <p className="text-xs mb-4" style={{ color: 'var(--f-text-subtle)' }}>
              Importer kunder eller produkter fra CSV-filer. Du kan mappe kolonner manuelt eller bruke automatisk AI-kolonnemapping (Supporter-pakken).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCsvImportModal({ isOpen: true, type: 'customer' })}
                className="f-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
              >
                Importer kunder
              </button>
              <button
                onClick={() => setCsvImportModal({ isOpen: true, type: 'product' })}
                className="f-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
              >
                Importer produkter
              </button>
            </div>
          </div>

          {/* SAF-T-import */}
          <div className="rounded-lg p-6" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-text-body)' }}>{t('settings.import.saft_title')}</h4>
            <p className="text-xs mb-1" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.import.saft_description')}</p>
            <p className="text-xs mb-4 italic" style={{ color: 'var(--f-text-subtle)' }}>{t('settings.import.saft_systems')}</p>

            {!saftPreview ? (
              /* Steg 1: Velg fil */
              <button
                onClick={handleSAFTSelect}
                className="f-btn-primary rounded-lg px-4 py-2 text-sm font-medium"
              >
                {t('settings.import.select_file')}
              </button>
            ) : (
              /* Steg 2: Forhåndsvisning og valg */
              <div className="space-y-4">
                <div className="rounded-xl p-4 space-y-2 text-sm" style={{ border: '1px solid var(--f-border-green)', background: 'var(--f-green-bg)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--f-text-subtle)' }}>{t('settings.import.preview_file')}:</span>
                    <span className="font-medium truncate max-w-[240px]" style={{ color: 'var(--f-text-body)' }}>{saftFileName}</span>
                  </div>
                  {saftPreview.dateRange?.start && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--f-text-subtle)' }}>{t('settings.import.preview_period')}:</span>
                      <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>
                        {saftPreview.dateRange.start} → {saftPreview.dateRange.end}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--f-text-subtle)' }}>{t('settings.import.preview_customers')}:</span>
                    <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>{saftPreview.customerCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--f-text-subtle)' }}>Fakturaer:</span>
                    <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>
                      {(saftPreview.invoiceCount ?? saftPreview.transactionCount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--f-text-subtle)' }}>{t('settings.import.preview_expenses')}:</span>
                    <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>
                      {(saftPreview.expenseCount ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Valg */}
                <div className="space-y-2">
                  {[
                    { key: 'importCustomers', label: t('settings.import.import_customers') },
                    { key: 'importInvoices',  label: t('settings.import.import_invoices') },
                    { key: 'importExpenses',  label: t('settings.import.import_expenses') },
                    { key: 'skipDuplicates',  label: t('settings.import.skip_duplicates') },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--f-text-body)' }}>
                      <input
                        type="checkbox"
                        checked={saftOptions[key]}
                        onChange={(e) => setSaftOptions((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: 'var(--f-green)' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSAFTImport}
                    disabled={saftImporting}
                    className="f-btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {saftImporting ? t('settings.import.importing') : t('settings.import.import_button')}
                  </button>
                  <button
                    onClick={handleSAFTCancel}
                    disabled={saftImporting}
                    className="f-btn-ghost rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {t('settings.import.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CSVImportModal
        isOpen={csvImportModal.isOpen}
        type={csvImportModal.type}
        onClose={() => setCsvImportModal({ isOpen: false, type: 'customer' })}
        onImport={(data) => handleCSVImport(data, csvImportModal.type)}
      />
    </>
  );
}
