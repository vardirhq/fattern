import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fileToDataURL, isImageFile, validateImageSize } from '../../utils/imageUpload';

export function ExpenseAttachmentUpload({ value, onChange, maxSizeMB = 10, expenseId }) {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Load preview when value changes
  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    // If it's a data URL, use it directly
    if (value.startsWith('data:')) {
      setPreview(value);
      return;
    }

    // If it's a file path, read it via IPC
    if (window.fattern?.expense?.readAttachment) {
      window.fattern.expense.readAttachment(value).then((dataURL) => {
        setPreview(dataURL);
      }).catch(() => {
        setPreview(null);
      });
    }
  }, [value]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsSaving(true);

    try {
      if (!isImageFile(file)) {
        throw new Error(t('expense.attachment_file_type_error'));
      }

      validateImageSize(file, maxSizeMB);

      // Save to disk via IPC
      if (window.fattern?.expense?.saveAttachment) {
        const dataURL = await fileToDataURL(file);
        const filename = await window.fattern.expense.saveAttachment(expenseId || 'new', dataURL);
        setFileName(file.name);
        onChange?.(filename);
      } else {
        // Fallback to data URL
        const dataURL = await fileToDataURL(file);
        setFileName(file.name);
        onChange?.(dataURL);
      }
    } catch (err) {
      setError(err.message || t('expense.attachment_upload_error'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    setFileName('');
    onChange?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('expense.attachment_label')}</label>
      <div className="mt-2 space-y-2">
        {value ? (
          <div className="space-y-2">
            {preview ? (
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt={t('expense.attachment_preview')}
                  className="h-48 w-full r-lg object-contain"
                  style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -right-2 -top-2 r-full p-1 text-on-brand shadow-lg transition"
                  style={{ background: 'var(--danger)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  title={t('expense.attachment_remove')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between r-md px-3 py-2" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" style={{ color: 'var(--ink-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>
                    {fileName || (value.startsWith('data:') ? t('expense.attachment_selected') : value)}
                  </span>
                  {isSaving && <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>({t('expense.attachment_saving')})</span>}
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="r-sm p-1 transition"
                  style={{ color: 'var(--ink-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; }}
                  title={t('expense.attachment_remove')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center r-md border-2 border-dashed px-4 py-3 transition"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-muted)', background: 'var(--surface-sunken)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-line)'; e.currentTarget.style.color = 'var(--brand-ink)'; e.currentTarget.style.background = 'var(--brand-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.background = 'var(--surface-sunken)'; }}
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">{t('expense.attachment_choose')}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {error && <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>}
        {!value && (
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('expense.attachment_hint', { max: maxSizeMB })}</p>
        )}
      </div>
    </div>
  );
}
