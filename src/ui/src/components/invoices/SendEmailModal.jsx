/**
 * SendEmailModal
 *
 * Compose and send an invoice email.
 * Primary path:  SMTP (configured in Innstillinger → E-post)
 * Fallback path: saves PDF to Downloads + opens mailto: link in system mail app
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconMail, IconExternalLink, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useToast } from '../../hooks/useToast';

function getEmailApi() {
  return typeof window !== 'undefined' ? window.fattern?.email ?? null : null;
}

export function SendEmailModal({ isOpen, invoice, company, onClose, onStatusChange }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  const [form, setForm] = useState({ to: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [openingMailto, setOpeningMailto] = useState(false);
  const [sent, setSent] = useState(false);

  // Build default values when invoice changes
  useEffect(() => {
    if (!isOpen || !invoice) return;

    const invoiceNum = invoice.invoice_number || invoice.id || '';
    const companyName = company?.name || 'Fattern';
    const customerEmail = invoice.customer_email || '';
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('nb-NO')
      : '';
    const customerName = invoice.customer_name ? ' ' + invoice.customer_name : '';
    const dueStr = dueDate ? t('send_email.default_body_due', { date: dueDate }) : '';

    setForm({
      to: customerEmail,
      subject: t('send_email.default_subject', { num: invoiceNum, company: companyName }),
      message: [
        t('send_email.default_body_greeting', { name: customerName }),
        '',
        t('send_email.default_body_content', { num: invoiceNum, due: dueStr }),
        '',
        t('send_email.default_body_contact'),
        '',
        t('send_email.default_body_regards'),
        companyName,
      ].join('\n'),
    });

    setSent(false);

    // Check SMTP config
    const api = getEmailApi();
    if (!api) { setCheckingConfig(false); return; }
    setCheckingConfig(true);
    api.getConfig()
      .then((cfg) => setSmtpConfigured(!!(cfg.host && cfg.user && cfg.hasPassword)))
      .catch(() => setSmtpConfigured(false))
      .finally(() => setCheckingConfig(false));
  }, [isOpen, invoice, company, t]);

  if (!isOpen || !invoice) return null;

  const invoiceId = invoice.dbId || invoice.id;

  const handleSendSMTP = async () => {
    const api = getEmailApi();
    if (!api) return;
    setSending(true);
    try {
      await api.sendInvoice({
        invoiceId,
        to:      form.to,
        subject: form.subject,
        message: form.message,
      });

      // Mark invoice as sent (only if it's still draft)
      const dbApi = typeof window !== 'undefined' ? window.fattern?.db : null;
      if (dbApi && invoice.status === 'draft') {
        await dbApi.updateInvoiceStatus(invoiceId, 'sent', null);
        onStatusChange?.('sent');
      }

      setSent(true);
      toast.success(t('send_email.sent_success'), t('send_email.sent_success_desc', { to: form.to }));
      setTimeout(onClose, 1200);
    } catch (err) {
      toast.error(t('send_email.send_error'), err.message);
    } finally {
      setSending(false);
    }
  };

  const handleOpenMailto = async () => {
    const api = getEmailApi();
    if (!api) return;
    setOpeningMailto(true);
    try {
      const result = await api.openMailto({
        invoiceId,
        to:      form.to,
        subject: form.subject,
        message: form.message,
      });
      toast.info(t('send_email.mailto_opened'), t('send_email.mailto_desc'));
      if (result?.pdfPath) {
        console.info('PDF saved to:', result.pdfPath);
      }
    } catch (err) {
      toast.error(t('send_email.mailto_error'), err.message);
    } finally {
      setOpeningMailto(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'var(--f-overlay)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="f-glass-hero w-full max-w-lg rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--f-border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--f-green-bg)', border: '1px solid var(--f-border-green)' }}
            >
              <IconMail className="h-4 w-4" style={{ color: 'var(--f-green-text)' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--f-text-body)' }}>
                {t('send_email.title')}
              </h3>
              <p className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>
                {invoice.invoice_number || invoice.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition"
            style={{ color: 'var(--f-text-subtle)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--f-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* SMTP warning */}
          {!checkingConfig && !smtpConfigured && (
            <div
              className="flex items-start gap-2 rounded-xl p-3 text-xs"
              style={{
                background: 'var(--f-warn-bg)',
                border: '1px solid var(--f-warn-border)',
                color: 'var(--f-warn)',
              }}
            >
              <IconAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{t('send_email.smtp_not_configured')}</span>
            </div>
          )}

          {/* Success banner */}
          {sent && (
            <div
              className="flex items-center gap-2 rounded-xl p-3 text-xs"
              style={{
                background: 'var(--f-green-bg)',
                border: '1px solid var(--f-border-green)',
                color: 'var(--f-green-text)',
              }}
            >
              <IconCheck className="h-4 w-4 flex-shrink-0" />
              {t('send_email.sent_success')}
            </div>
          )}

          {/* To */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--f-text-subtle)' }}>
              {t('send_email.to_label')}
            </label>
            <input
              className="f-input w-full text-sm rounded-xl px-3 py-2"
              type="email"
              placeholder={t('send_email.to_placeholder')}
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              style={{ color: 'var(--f-text-body)' }}
              autoFocus
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--f-text-subtle)' }}>
              {t('send_email.subject_label')}
            </label>
            <input
              className="f-input w-full text-sm rounded-xl px-3 py-2"
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              style={{ color: 'var(--f-text-body)' }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--f-text-subtle)' }}>
              {t('send_email.message_label')}
            </label>
            <textarea
              className="f-input w-full text-sm rounded-xl px-3 py-2 resize-none"
              rows={8}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              style={{ color: 'var(--f-text-body)', fontFamily: 'var(--f-font-sans)' }}
            />
          </div>

          {/* Attachment note */}
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--f-text-muted)' }}>
            <IconMail className="h-3.5 w-3.5 flex-shrink-0" />
            {t('send_email.attachment_note')}
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 p-5 flex-shrink-0"
          style={{ borderTop: '1px solid var(--f-border-subtle)' }}
        >
          {/* Mailto fallback */}
          <button
            type="button"
            onClick={handleOpenMailto}
            disabled={openingMailto || !form.to}
            className="flex items-center gap-2 text-sm font-medium rounded-2xl px-4 py-2 transition-all disabled:opacity-40"
            style={{
              background: 'var(--f-btn-ghost-bg)',
              border: '1px solid var(--f-border)',
              color: 'var(--f-text-soft)',
            }}
            onMouseEnter={e => { if (!openingMailto) e.currentTarget.style.background = 'var(--f-btn-ghost-hover)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--f-btn-ghost-bg)'}
            title={t('send_email.mailto_title')}
          >
            <IconExternalLink className="h-4 w-4" />
            {openingMailto ? t('send_email.opening') : t('send_email.mailto_button')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium transition px-3 py-2"
              style={{ color: 'var(--f-text-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--f-text-body)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--f-text-subtle)'}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSendSMTP}
              disabled={sending || !form.to || !smtpConfigured || checkingConfig}
              className="flex items-center gap-2 text-sm font-semibold rounded-2xl px-5 py-2 transition-all disabled:opacity-40"
              style={{
                background: smtpConfigured ? 'var(--f-green)' : 'var(--f-surface)',
                border: `1px solid ${smtpConfigured ? 'var(--f-border-green)' : 'var(--f-border)'}`,
                color: smtpConfigured ? '#fff' : 'var(--f-text-muted)',
              }}
              title={!smtpConfigured ? t('send_email.smtp_configure_hint') : undefined}
            >
              <IconMail className="h-4 w-4" />
              {sending ? t('send_email.sending') : t('send_email.send_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
