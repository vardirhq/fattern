// src/ui/src/components/expenses/ExpenseDetailPanel.jsx
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export function ExpenseDetailPanel({ expense, formatCurrency, onEdit, onDelete, onClose }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [attachmentSrc, setAttachmentSrc] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dialogRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Slide in when expense mounts
  useEffect(() => {
    if (expense) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [expense]);

  // Load attachment image
  useEffect(() => {
    if (!expense?.attachment_path) {
      setAttachmentSrc(null);
      return;
    }
    const api = window.fattern?.expense;
    if (!api?.readAttachment) return;
    api.readAttachment(expense.attachment_path)
      .then((data) => setAttachmentSrc(data))
      .catch(() => setAttachmentSrc(null));
  }, [expense?.attachment_path]);

  // Lightbox
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lightboxOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [lightboxOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    closeTimerRef.current = setTimeout(() => onClose?.(), 220);
  };

  if (!expense) return null;

  const accentColor = expense.category_color || '#555555';

  // Derive VAT from items if present
  let vatAmount = null;
  let baseAmount = null;
  if (expense.items && expense.items.length > 0) {
    baseAmount = expense.items.reduce((s, item) => s + (item.unitPrice || 0) * (item.quantity || 1), 0);
    vatAmount = (expense.amount || 0) - baseAmount;
  }

  return (
    <>
      {/* Panel */}
      <div
        style={{
          width: 380,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          overflowY: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          transform: visible ? 'translateX(0)' : 'translateX(110%)',
          transition: 'transform 220ms ease-out',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-lg)',
                  background: `${accentColor}22`,
                  color: accentColor,
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                {expense.category_name || t('expense.uncategorised')}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', wordBreak: 'break-word' }}>
                {expense.vendor || t('expense.unknown_vendor')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                {expense.date}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-muted)',
                fontSize: 18,
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginTop: 8 }}>
            {formatCurrency ? formatCurrency(expense.amount) : expense.amount}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line)', marginBottom: 16 }} />

        {/* Receipt */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {t('expense.receipt_section')}
          </div>
          {attachmentSrc ? (
            <img
              src={attachmentSrc}
              alt={t('expense.receipt_section')}
              onClick={() => setLightboxOpen(true)}
              style={{
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                cursor: 'zoom-in',
                objectFit: 'cover',
                maxHeight: 180,
                border: '1px solid var(--line)',
              }}
            />
          ) : (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--line)',
                textAlign: 'center',
                color: 'var(--ink-muted)',
                fontSize: 12,
              }}
            >
              {t('expense.no_receipt')}
            </div>
          )}
        </div>

        {/* Amounts (only if items present) */}
        {baseAmount !== null && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('expense.amounts_section')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              {[
                { label: t('expense.base_amount'), value: formatCurrency ? formatCurrency(baseAmount) : baseAmount },
                { label: t('expense.vat'), value: vatAmount !== null ? (formatCurrency ? formatCurrency(vatAmount) : vatAmount) : '—' },
                { label: t('expense.total'), value: formatCurrency ? formatCurrency(expense.amount) : expense.amount },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: label === t('expense.total') ? 700 : 400 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {expense.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('expense.notes_section')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.5 }}>
              {expense.notes}
            </p>
          </div>
        )}

        {/* Linked invoice */}
        {expense.linked_invoice_id && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Lenket faktura
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
              Faktura #{expense.linked_invoice_id}
            </p>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--line)', marginBottom: 16 }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => onEdit?.(expense)}
            className="ft-btn ft-btn-secondary"
            style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 600 }}
          >
            {t('common.edit')}
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(expense.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-lg)',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-line)',
              cursor: 'pointer',
            }}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <dialog
        ref={dialogRef}
        onClick={(e) => e.target === dialogRef.current && setLightboxOpen(false)}
        style={{
          border: 'none',
          background: 'rgba(0,0,0,0.85)',
          padding: 0,
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {attachmentSrc && (
          <img
            src={attachmentSrc}
            alt={t('expense.receipt_fullsize')}
            style={{ display: 'block', maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-lg)' }}
          />
        )}
      </dialog>
    </>
  );
}
