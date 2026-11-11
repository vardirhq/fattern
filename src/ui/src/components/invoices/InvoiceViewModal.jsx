import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { StatusBadge } from '../StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { IconEdit, IconDownload, IconX, IconPlus, IconSend, IconFileText, IconMail, IconPencil, IconCircleCheck, IconAlertCircle, IconClockHour4, IconAlertTriangle } from '@tabler/icons-react';
import { SendEmailModal } from './SendEmailModal';
import { EhfPanel } from './EhfPanel';

// ─── Event Log Tab ──────────────────────────────────────────────────────────

// EVENT_CONFIG: labels resolved via t() at render time (see InvoiceEventLog)
const EVENT_CONFIG = {
  created:             { icon: IconFileText,      color: 'var(--f-green-text)', labelKey: 'invoice_log.types.created' },
  updated:             { icon: IconPencil,        color: 'var(--f-text-soft)',  labelKey: 'invoice_log.types.updated' },
  updated_after_send:  { icon: IconAlertTriangle, color: 'var(--f-warn)',       labelKey: 'invoice_log.types.updated_after_send', warn: true },
  status_changed:      { icon: IconCircleCheck,   color: 'var(--f-blue-text)', labelKey: 'invoice_log.types.status_changed' },
  pdf_generated:       { icon: IconDownload,      color: 'var(--f-text-soft)', labelKey: 'invoice_log.types.pdf_generated' },
  email_sent:          { icon: IconMail,          color: 'var(--f-green-text)',labelKey: 'invoice_log.types.email_sent' },
  reminder_sent:       { icon: IconMail,          color: 'var(--f-danger-text)',labelKey: 'invoice_log.types.reminder_sent' },
  ehf_exported:        { icon: IconDownload,      color: 'var(--f-text-soft)', labelKey: 'invoice_log.types.ehf_exported' },
  ehf_sent:            { icon: IconSend,          color: 'var(--f-success-text)', labelKey: 'invoice_log.types.ehf_sent' },
  overdue:             { icon: IconAlertCircle,   color: 'var(--f-warn)',      labelKey: 'invoice_log.types.status_changed' },
};

function InvoiceEventLog({ invoiceId }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;
    const api = typeof window !== 'undefined' ? window.fattern?.db : null;
    if (!api?.getInvoiceEvents) { setLoading(false); return; }
    api.getInvoiceEvents(invoiceId)
      .then((rows) => setEvents(rows || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return <p className="text-sm text-center py-8" style={{ color: 'var(--f-text-subtle)' }}>{t('common.loading')}</p>;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <IconClockHour4 className="h-8 w-8 opacity-20" style={{ color: 'var(--f-text-subtle)' }} />
        <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice_log.empty')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline spine */}
      <div
        className="absolute left-[19px] top-2 bottom-2"
        style={{ width: 1, background: 'var(--f-border-subtle)' }}
      />
      <div className="space-y-1">
        {events.map((event, i) => {
          const cfg = EVENT_CONFIG[event.type] || { icon: IconClockHour4, color: 'var(--f-text-subtle)', labelKey: null };
          const Icon = cfg.icon;
          const ts = event.created_at ? new Date(event.created_at) : null;
          const isLast = i === events.length - 1;
          return (
            <div key={event.id} className={`flex gap-4 ${isLast ? 'pb-0' : 'pb-1'}`}>
              {/* Icon dot */}
              <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: cfg.warn ? 'var(--f-warn-bg)' : 'var(--f-surface-elevated)',
                  border: `1px solid ${cfg.warn ? 'var(--f-warn-border)' : 'var(--f-border)'}`,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>
              {/* Content */}
              <div
                className={`flex-1 min-w-0 pt-2 pb-3 ${cfg.warn ? 'rounded-xl px-3 -mx-3' : ''}`}
                style={cfg.warn ? { background: 'var(--f-warn-bg)', border: '1px solid var(--f-warn-border)', marginTop: 4 } : {}}
              >
                <p className="text-sm font-medium leading-snug" style={{ color: 'var(--f-text-body)' }}>
                  {event.description}
                </p>
                {ts && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--f-text-subtle)' }}>
                    {ts.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}
                    {ts.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {/* Diff table for 'updated' events */}
                {event.type === 'updated' && event.metadata?.changes?.length > 0 && (
                  <div
                    className="mt-2 rounded-lg overflow-hidden text-xs"
                    style={{ border: '1px solid var(--f-border-faint)' }}
                  >
                    {event.metadata.changes.map((change, ci) => (
                      <div
                        key={ci}
                        className="flex items-baseline gap-2 px-3 py-1.5"
                        style={{
                          borderTop: ci > 0 ? '1px solid var(--f-border-faint)' : 'none',
                          background: ci % 2 === 0 ? 'transparent' : 'var(--f-surface-hover)',
                        }}
                      >
                        <span className="flex-shrink-0 font-medium" style={{ color: 'var(--f-text-subtle)', minWidth: 80 }}>
                          {change.field}
                        </span>
                        <span className="truncate px-1.5 py-0.5 rounded" style={{ color: 'var(--f-danger-text)', background: 'var(--f-danger-bg)', maxWidth: 140 }}>
                          {change.from}
                        </span>
                        <span style={{ color: 'var(--f-text-muted)' }}>→</span>
                        <span className="truncate px-1.5 py-0.5 rounded" style={{ color: 'var(--f-green-text)', background: 'var(--f-green-bg)', maxWidth: 140 }}>
                          {change.to}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDbApi() {
  if (typeof window === 'undefined') return null;
  return window.fattern?.db ?? null;
}

// ─── Expense Picker Modal ───────────────────────────────────────────────────

function ExpensePickerModal({ isOpen, invoiceId, budgetYearId, onLink, onClose, formatCurrency: fmt, t }) {
  const [unlinked, setUnlinked] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) { setSelected(new Set()); return; }
    const api = getDbApi();
    if (!api?.getUnlinkedExpenses) return;
    setLoading(true);
    api.getUnlinkedExpenses(budgetYearId)
      .then((rows) => setUnlinked(rows || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, budgetYearId]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    for (const expenseId of selected) {
      await onLink(expenseId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'var(--f-overlay)', backdropFilter: 'blur(6px)' }}>
      <div className="f-glass-hero w-full max-w-lg rounded-3xl shadow-xl">
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--f-border-subtle)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--f-text-body)' }}>{t('invoice.linked_expenses.picker_title')}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition" style={{ color: 'var(--f-text-subtle)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--f-hover-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--f-text-subtle)' }}>{t('common.loading')}</p>
          ) : unlinked.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.linked_expenses.picker_empty')}</p>
          ) : (
            <div className="space-y-2">
              {unlinked.map((exp) => (
                <label key={exp.id} className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition" onMouseEnter={e => e.currentTarget.style.background = 'var(--f-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <input
                    type="checkbox"
                    checked={selected.has(exp.id)}
                    onChange={() => toggle(exp.id)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: 'var(--f-green)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--f-text-body)' }}>{exp.vendor || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>{exp.date ? formatDate(exp.date) : '—'} · {exp.category_name || '—'}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--f-text-body)' }}>{fmt ? fmt(exp.amount) : exp.amount}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-4" style={{ borderTop: '1px solid var(--f-border-subtle)' }}>
          <button type="button" onClick={onClose} className="text-sm font-medium transition" style={{ color: 'var(--f-text-subtle)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--f-text-body)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--f-text-subtle)'}>
            {t('invoice.linked_expenses.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="f-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {t('invoice.linked_expenses.confirm')} ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Linked Expenses Tab ────────────────────────────────────────────────────

function LinkedExpensesTab({ invoiceId, budgetYearId, formatCurrency: fmt }) {
  const { t } = useTranslation();
  const [linked, setLinked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = useCallback(() => {
    const api = getDbApi();
    if (!api?.getExpensesForInvoice || !invoiceId) return;
    setLoading(true);
    api.getExpensesForInvoice(invoiceId)
      .then((rows) => setLinked(rows || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [invoiceId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUnlink = async (expenseId) => {
    const api = getDbApi();
    if (!api?.unlinkExpenseFromInvoice) return;
    await api.unlinkExpenseFromInvoice(invoiceId, expenseId);
    refresh();
  };

  const handleLink = async (expenseId) => {
    const api = getDbApi();
    if (!api?.linkExpenseToInvoice) return;
    await api.linkExpenseToInvoice(invoiceId, expenseId);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>
          {linked.length} {linked.length === 1 ? t('expense.expense_singular') : t('expense.expense_plural')}
        </span>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="f-btn-ghost flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium"
        >
          <IconPlus className="h-4 w-4" />
          {t('invoice.linked_expenses.link')}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-subtle text-center py-6">{t('common.loading')}</p>
      ) : linked.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.linked_expenses.empty')}</p>
      ) : (
        <div className="space-y-2">
          {linked.map((exp) => (
            <div key={exp.id} className="flex items-center gap-3 rounded-xl p-3" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{exp.vendor || '—'}</p>
                <p className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>
                  {exp.date ? formatDate(exp.date) : '—'} · {exp.category_name || t('expense.unknown_category')}
                </p>
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--f-text-body)' }}>
                {fmt ? fmt(exp.amount) : exp.amount}
              </span>
              <button
                type="button"
                onClick={() => handleUnlink(exp.id)}
                className="rounded-lg p-1.5 transition"
                style={{ color: 'var(--f-text-subtle)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--f-danger-bg)'; e.currentTarget.style.color = 'var(--f-danger-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-subtle)'; }}
                title={t('invoice.linked_expenses.unlink')}
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ExpensePickerModal
        isOpen={pickerOpen}
        invoiceId={invoiceId}
        budgetYearId={budgetYearId}
        onLink={handleLink}
        onClose={() => { setPickerOpen(false); refresh(); }}
        formatCurrency={fmt}
        t={t}
      />
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export function InvoiceViewModal({ isOpen, invoice, onClose, onEdit, onGeneratePDF, formatCurrency: fmt, budgetYearId, company, onStatusChange }) {
  const { t } = useTranslation();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [sendEmailOpen, setSendEmailOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGeneratingPdf(false);
      setActiveTab('details');
      setSendEmailOpen(false);
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const calculations = invoice.items?.reduce(
    (acc, item) => {
      const lineSubtotal = (item.quantity || 0) * (item.unitPrice || item.unit_price || 0);
      const lineVat = lineSubtotal * (item.vatRate || item.vat_rate || 0);
      acc.subtotal += lineSubtotal;
      acc.vatTotal += lineVat;
      acc.total += lineSubtotal + lineVat;
      return acc;
    },
    { subtotal: 0, vatTotal: 0, total: 0 }
  ) || { subtotal: 0, vatTotal: 0, total: 0 };

  const handleGeneratePDF = async () => {
    if (!invoice?.id && !invoice?.dbId) return;
    setGeneratingPdf(true);
    try {
      await onGeneratePDF?.(invoice);
    } catch (error) {
      console.error('Kunne ikke generere PDF', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const invoiceId = invoice.dbId || invoice.id;

  const tabs = [
    { id: 'details',  label: t('invoice.view.details_tab') },
    { id: 'ehf',      label: 'EHF' },
    { id: 'expenses', label: t('invoice.linked_expenses.tab') },
    { id: 'log',      label: t('invoice.view.log_tab') },
  ];

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('invoice.view.title', { num: invoice.invoice_number || invoice.id || '' })}
      description={invoice.customer_name ? `${t('invoice.view.customer_label')} ${invoice.customer_name}` : undefined}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status || 'draft'} />
            {invoice.status === 'paid' && invoice.payment_date && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'var(--f-green-bg)', border: '1px solid var(--f-border-green)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--f-green-text)' }}>
                  {t('invoice.paid_date')} {formatDate(invoice.payment_date)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={generatingPdf}
              className="f-btn-ghost rounded-2xl px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <IconDownload className="h-4 w-4" />
              {generatingPdf ? t('common.loading') : t('invoice.generate_pdf')}
            </button>
            <button
              type="button"
              onClick={() => setSendEmailOpen(true)}
              className="f-btn-ghost rounded-2xl px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <IconSend className="h-4 w-4" />
              {t('invoice.view.send')}
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onEdit?.(invoice);
                }}
                className="f-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold flex items-center gap-2"
              >
                <IconEdit className="h-4 w-4" />
                {t('common.edit')}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex mb-6 -mt-2" style={{ borderBottom: '1px solid var(--f-border-subtle)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition"
            style={{
              borderBottomColor: activeTab === tab.id ? 'var(--f-green)' : 'transparent',
              color: activeTab === tab.id ? 'var(--f-green-text)' : 'var(--f-text-subtle)',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--f-text-body)'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--f-text-subtle)'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="f-label uppercase tracking-wide">{t('invoice.view.invoice_date')}</label>
                <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>
                  {invoice.invoice_date ? formatDate(invoice.invoice_date) : '—'}
                </p>
              </div>
              <div>
                <label className="f-label uppercase tracking-wide">{t('invoice.view.due_date')}</label>
                <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>
                  {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                </p>
              </div>
              {invoice.kid && (
                <div>
                  <label className="f-label uppercase tracking-wide">KID</label>
                  <p className="mt-1 text-sm font-medium f-num" style={{ color: 'var(--f-text-body)' }}>{invoice.kid}</p>
                </div>
              )}
              {invoice.status === 'paid' && invoice.payment_date && (
                <div>
                  <label className="f-label uppercase tracking-wide">{t('invoice.view.payment_date')}</label>
                  <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--f-success-text)' }}>
                    {formatDate(invoice.payment_date)}
                  </p>
                </div>
              )}
              {invoice.start_date && invoice.end_date && (
                <div>
                  <label className="f-label uppercase tracking-wide">{t('invoice.view.period')}</label>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>
                    {formatDate(invoice.start_date)} - {formatDate(invoice.end_date)}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {invoice.your_reference && (
                <div>
                  <label className="f-label uppercase tracking-wide">{t('invoice.view.your_reference')}</label>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{invoice.your_reference}</p>
                </div>
              )}
              {invoice.our_reference && (
                <div>
                  <label className="f-label uppercase tracking-wide">{t('invoice.view.our_reference')}</label>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{invoice.our_reference}</p>
                </div>
              )}
              {invoice.delivery_reference && (
                <div>
                  <label className="f-label uppercase tracking-wide">{t('invoice.view.delivery_reference')}</label>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{invoice.delivery_reference}</p>
                </div>
              )}
              {invoice.reference && (
                <div>
                  <label className="f-label uppercase tracking-wide">{t('invoice.view.reference')}</label>
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>{invoice.reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {invoice.items && invoice.items.length > 0 ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--f-border-subtle)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'var(--f-hover)', borderBottom: '1px solid var(--f-border-subtle)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.view.description')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.view.quantity')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.view.unit_price')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.view.vat_pct')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.view.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const unitPrice = item.unitPrice || item.unit_price || 0;
                      const quantity = item.quantity || 0;
                      const vatRate = item.vatRate || item.vat_rate || 0;
                      const lineSubtotal = unitPrice * quantity;
                      const lineVat = lineSubtotal * vatRate;
                      const lineTotal = lineSubtotal + lineVat;

                      return (
                        <tr key={item.id || index} style={{ borderBottom: '1px solid var(--f-border-faint)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--f-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--f-text-body)' }}>{item.description || '—'}</td>
                          <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--f-text-soft)' }}>{quantity}</td>
                          <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--f-text-soft)' }}>{fmt(unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-center" style={{ color: 'var(--f-text-soft)' }}>
                            {vatRate > 0 ? `${(vatRate * 100).toFixed(0)}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: 'var(--f-text-body)' }}>{fmt(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center text-sm" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)', color: 'var(--f-text-subtle)' }}>
              {t('invoice.view.no_items')}
            </div>
          )}

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm" style={{ color: 'var(--f-text-soft)' }}>
                <span>{t('invoice.view.subtotal')}</span>
                <span className="font-medium">{fmt(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: 'var(--f-text-soft)' }}>
                <span>{t('invoice.view.vat')}</span>
                <span className="font-medium">{fmt(calculations.vatTotal)}</span>
              </div>
              {invoice.credited && (
                <div className="pt-2" style={{ borderTop: '1px solid var(--f-border-faint)' }}>
                  <div className="flex justify-between text-sm" style={{ color: 'var(--f-text-soft)' }}>
                    <span>{t('invoice.view.credited')}</span>
                    <span className="font-medium" style={{ color: 'var(--f-danger-text)' }}>{t('invoice.view.credited_yes')}</span>
                  </div>
                </div>
              )}
              <div className="pt-2" style={{ borderTop: '2px solid var(--f-border)' }}>
                <div className="flex justify-between text-base font-semibold" style={{ color: 'var(--f-text-body)' }}>
                  <span>{t('invoice.view.grand_total')}</span>
                  <span>{fmt(calculations.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-2xl p-4" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
              <label className="f-label uppercase tracking-wide">{t('invoice.view.notes')}</label>
              <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: 'var(--f-text-body)' }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ehf' && <EhfPanel invoiceId={invoiceId} onSent={() => onStatusChange?.('sent')} />}

      {activeTab === 'expenses' && (
        <LinkedExpensesTab
          invoiceId={invoiceId}
          budgetYearId={budgetYearId}
          formatCurrency={fmt}
        />
      )}

      {activeTab === 'log' && (
        <InvoiceEventLog invoiceId={invoiceId} />
      )}
    </Modal>

    <SendEmailModal
      isOpen={sendEmailOpen}
      invoice={invoice}
      company={company}
      onClose={() => setSendEmailOpen(false)}
      onStatusChange={onStatusChange}
    />
    </>
  );
}
