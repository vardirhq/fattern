import { useTranslation } from 'react-i18next';
import { IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';
import { Modal } from '../Modal';

export function TemplateImportModal({ isOpen, onClose, onConfirm, templateMeta, validationIssues, warnings }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const hasErrors = validationIssues?.some(issue => issue.level === 'error') || false;
  const hasWarnings = warnings?.length > 0 || validationIssues?.some(issue => issue.level === 'warning') || false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('template_import.title')}
      size="md"
    >
      <div className="space-y-4">
        {templateMeta && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>{t('template_import.info_title')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--ink-muted)' }}>{t('template_import.name_label')}</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{templateMeta.name}</span>
                </div>
                {templateMeta.author && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ink-muted)' }}>{t('template_import.author_label')}</span>
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>{templateMeta.author}</span>
                  </div>
                )}
                {templateMeta.version && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ink-muted)' }}>{t('template_import.version_label')}</span>
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>{templateMeta.version}</span>
                  </div>
                )}
                {templateMeta.tags && templateMeta.tags.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span style={{ color: 'var(--ink-muted)' }}>{t('template_import.tags_label')}</span>
                    <div className="flex flex-wrap gap-1">
                      {templateMeta.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center r-full px-2 py-0-5 text-xs font-medium" style={{ background: 'var(--hover)', color: 'var(--ink-muted)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {templateMeta.description && (
                  <div className="pt-2" style={{ borderTop: '1px solid var(--line)' }}>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{templateMeta.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {hasErrors && (
          <div className="r-md p-3" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-line)' }}>
            <div className="flex items-start gap-2">
              <IconAlertCircle className="h-5 w-5 shrink-0 mt-0-5" style={{ color: 'var(--danger)' }} />
              <div className="flex-1">
                <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--danger)' }}>{t('template_import.validation_errors')}</h5>
                <ul className="text-xs space-y-1" style={{ color: 'var(--danger)' }}>
                  {validationIssues
                    .filter(issue => issue.level === 'error')
                    .map((issue, idx) => (
                      <li key={idx}>• {issue.path}: {issue.message}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {hasWarnings && !hasErrors && (
          <div className="r-md p-3" style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning-line)' }}>
            <div className="flex items-start gap-2">
              <IconInfoCircle className="h-5 w-5 shrink-0 mt-0-5" style={{ color: 'var(--warning)' }} />
              <div className="flex-1">
                <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--warning)' }}>{t('template_import.warnings')}</h5>
                <ul className="text-xs space-y-1" style={{ color: 'var(--warning)' }}>
                  {warnings?.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                  {validationIssues
                    ?.filter(issue => issue.level === 'warning')
                    .map((issue, idx) => (
                      <li key={idx}>• {issue.path}: {issue.message}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {!hasErrors && !hasWarnings && (
          <div className="r-md p-3" style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-line)' }}>
            <div className="flex items-start gap-2">
              <IconCircleCheck className="h-5 w-5 shrink-0 mt-0-5" style={{ color: 'var(--brand-ink)' }} />
              <p className="text-sm" style={{ color: 'var(--brand-ink)' }}>{t('template_import.valid_desc')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
        <button
          onClick={onClose}
          className="ft-btn ft-btn-secondary r-md px-4 py-2 text-sm font-medium transition"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={hasErrors}
          className={`r-md px-4 py-2 text-sm font-medium transition ${hasErrors ? 'cursor-not-allowed opacity-40' : 'ft-btn ft-btn-primary'}`}
          style={hasErrors ? { background: 'var(--hover)', color: 'var(--ink-muted)' } : {}}
        >
          {t('template_import.import_button')}
        </button>
      </div>
    </Modal>
  );
}
