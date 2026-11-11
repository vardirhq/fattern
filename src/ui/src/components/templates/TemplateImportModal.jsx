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
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--f-text-body)' }}>{t('template_import.info_title')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--f-text-subtle)' }}>{t('template_import.name_label')}</span>
                  <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>{templateMeta.name}</span>
                </div>
                {templateMeta.author && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--f-text-subtle)' }}>{t('template_import.author_label')}</span>
                    <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>{templateMeta.author}</span>
                  </div>
                )}
                {templateMeta.version && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--f-text-subtle)' }}>{t('template_import.version_label')}</span>
                    <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>{templateMeta.version}</span>
                  </div>
                )}
                {templateMeta.tags && templateMeta.tags.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span style={{ color: 'var(--f-text-subtle)' }}>{t('template_import.tags_label')}</span>
                    <div className="flex flex-wrap gap-1">
                      {templateMeta.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--f-hover)', color: 'var(--f-text-subtle)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {templateMeta.description && (
                  <div className="pt-2" style={{ borderTop: '1px solid var(--f-border-faint)' }}>
                    <p className="text-xs" style={{ color: 'var(--f-text-soft)' }}>{templateMeta.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {hasErrors && (
          <div className="rounded-lg p-3" style={{ background: 'var(--f-danger-bg)', border: '1px solid var(--f-danger-border)' }}>
            <div className="flex items-start gap-2">
              <IconAlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--f-danger-text)' }} />
              <div className="flex-1">
                <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--f-danger-text)' }}>{t('template_import.validation_errors')}</h5>
                <ul className="text-xs space-y-1" style={{ color: 'var(--f-danger-text)' }}>
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
          <div className="rounded-lg p-3" style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)' }}>
            <div className="flex items-start gap-2">
              <IconInfoCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              <div className="flex-1">
                <h5 className="text-sm font-semibold mb-1" style={{ color: '#fbbf24' }}>{t('template_import.warnings')}</h5>
                <ul className="text-xs space-y-1" style={{ color: '#fcd34d' }}>
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
          <div className="rounded-lg p-3" style={{ background: 'var(--f-green-bg)', border: '1px solid var(--f-border-green)' }}>
            <div className="flex items-start gap-2">
              <IconCircleCheck className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--f-green-text)' }} />
              <p className="text-sm" style={{ color: 'var(--f-green-text)' }}>{t('template_import.valid_desc')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--f-border-faint)' }}>
        <button
          onClick={onClose}
          className="f-btn-ghost rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={hasErrors}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${hasErrors ? 'cursor-not-allowed opacity-40' : 'f-btn-primary'}`}
          style={hasErrors ? { background: 'var(--f-hover)', color: 'var(--f-text-subtle)' } : {}}
        >
          {t('template_import.import_button')}
        </button>
      </div>
    </Modal>
  );
}
