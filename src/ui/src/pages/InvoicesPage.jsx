import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconEdit, IconTrash, IconDownload, IconEye } from '@tabler/icons-react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { SearchBar } from '../components/SearchBar';
import { InvoiceStatusSelector } from '../components/invoices/InvoiceStatusSelector';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { useSettings } from '../hooks/useSettings';
import { useSearch } from '../hooks/useSearch';

export function InvoicesPage({ invoices, formatCurrency: fmt, onCreateInvoice, onEditInvoice, onDeleteInvoice, onViewInvoice, onStatusChange, showStatusModal, showToast, onSendReminder }) {
  const { t } = useTranslation();
  const [generatingPdf, setGeneratingPdf] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { getSetting } = useSettings();

  const { query, setQuery, results: searched } = useSearch(invoices, ['id', 'invoice_number', 'customer']);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return searched;
    return searched.filter((inv) => inv.status === statusFilter);
  }, [searched, statusFilter]);

  const statusTiles = useMemo(() => {
    const all = invoices || [];
    const of = (status) => all.filter((inv) => inv.status === status);
    const sum = (list) => list.reduce((acc, inv) => acc + (inv.amount || 0), 0);
    return [
      { value: 'all', label: t('invoice.all', 'Alle'), count: all.length },
      { value: 'draft', label: t('status.draft'), count: of('draft').length },
      { value: 'sent', label: t('status.sent'), count: of('sent').length, sum: sum(of('sent')) },
      { value: 'overdue', label: t('status.overdue'), count: of('overdue').length, sum: sum(of('overdue')) },
      { value: 'paid', label: t('status.paid'), count: of('paid').length },
    ];
  }, [invoices, t]);

  const handleGeneratePDF = async (invoice) => {
    if (!invoice?.dbId) return;

    setGeneratingPdf(invoice.dbId);
    try {
      const api = typeof window !== 'undefined' ? window.fattern : null;
      if (!api?.pdf?.generateInvoice) {
        throw new Error(t('errors.pdf_unavailable'));
      }

      if (api.template?.createDefault) {
        await api.template.createDefault();
      }

      const defaultTemplateId = getSetting('invoice.defaultTemplate', 'default_invoice');
      const result = await api.pdf.generateInvoice(invoice.dbId, defaultTemplateId);
      if (result?.success && result?.filepath) {
        showToast?.success(t('invoice.pdf_downloaded'));
        if (api.pdf.openFile) {
          await api.pdf.openFile(result.filepath);
        }
      }
    } catch (error) {
      console.error('Kunne ikke generere PDF', error);
      showToast?.error(t('invoice.pdf_error'));
    } finally {
      setGeneratingPdf(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: t('invoice.invoice_number'),
        className: 'font-semibold text-ink',
        render: (id, invoice) => (
          <button
            onClick={() => onViewInvoice?.(invoice)}
            className="cursor-pointer text-left hover:underline hover:[color:var(--f-green-text)]"
          >
            {invoice.invoice_number || id}
          </button>
        ),
      },
      {
        key: 'customer',
        label: t('invoice.customer'),
        className: 'text-ink-soft',
      },
      {
        key: 'status',
        label: t('invoice.status'),
        style: { width: 140, minWidth: 140 },
        render: (status, invoice) => (
          <InvoiceStatusSelector
            invoice={invoice}
            onStatusChange={onStatusChange}
            showModal={showStatusModal}
          />
        ),
        sortFn: (a, b) => {
          const statusOrder = { draft: 0, sent: 1, paid: 2, overdue: 3 };
          return (statusOrder[a] || 99) - (statusOrder[b] || 99);
        },
      },
      {
        key: 'date',
        label: t('invoice.date'),
        render: (date, invoice) => (
          <div className="flex flex-col">
            <span className="text-ink-subtle">{date ? formatDate(date) : '—'}</span>
            {invoice.status === 'paid' && invoice.payment_date && (
              <span className="text-xs font-medium" style={{ color: 'var(--f-success-text)' }}>
                {t('invoice.paid_date')} {formatDate(invoice.payment_date)}
              </span>
            )}
          </div>
        ),
        className: 'text-ink-subtle',
        sortFn: (a, b) => {
          const aDate = a ? new Date(a).getTime() : 0;
          const bDate = b ? new Date(b).getTime() : 0;
          return aDate - bDate;
        },
      },
      {
        key: 'amount',
        label: t('invoice.amount'),
        align: 'right',
        style: { whiteSpace: 'nowrap', width: 1 },
        render: (amount) => (typeof amount === 'number' ? fmt(amount) : '—'),
        className: 'font-medium text-ink',
        sortFn: (a, b) => {
          const aVal = typeof a === 'number' ? a : 0;
          const bVal = typeof b === 'number' ? b : 0;
          return aVal - bVal;
        },
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        style: { whiteSpace: 'nowrap', width: 1 },
        render: (_, invoice) => (
          <div className="flex items-center justify-end gap-2">
            {invoice.status === 'overdue' && onSendReminder && (
              <button
                type="button"
                onClick={() => onSendReminder(invoice)}
                className="f-btn-ghost rounded-lg px-3 text-xs font-medium"
                style={{ height: 30, marginRight: 4 }}
                title={invoice.last_reminder_at ? t('invoice.last_reminded', { date: formatDate(invoice.last_reminder_at) }) : undefined}
              >
                {invoice.reminder_count > 0 ? t('invoice.send_reminder_again') : t('invoice.send_reminder')}
              </button>
            )}
            <button
              onClick={() => onViewInvoice?.(invoice)}
              className="rounded-lg p-1.5 text-ink-subtle hover:[background:var(--f-green-bg)] hover:[color:var(--f-green-text)]"
              aria-label={t('invoice.view_action')}
              title={t('invoice.view_action')}
            >
              <IconEye size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => handleGeneratePDF(invoice)}
              disabled={generatingPdf === invoice.dbId}
              className="rounded-lg p-1.5 text-ink-subtle hover:[background:var(--f-green-bg)] hover:[color:var(--f-green-text)] disabled:opacity-50"
              aria-label={t('invoice.generate_pdf')}
              title={t('invoice.generate_pdf')}
            >
              <IconDownload size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => onEditInvoice?.(invoice)}
              className="rounded-lg p-1.5 text-ink-subtle hover:[background:var(--f-green-bg)] hover:[color:var(--f-green-text)]"
              aria-label={t('invoice.edit')}
              title={t('invoice.edit')}
            >
              <IconEdit size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => onDeleteInvoice?.(invoice)}
              className="rounded-lg p-1.5 text-ink-subtle hover:[background:var(--f-danger-bg)] hover:[color:var(--f-danger-text)]"
              aria-label={t('invoice.delete')}
              title={t('invoice.delete')}
            >
              <IconTrash size={15} stroke={1.8} />
            </button>
          </div>
        ),
      },
    ],
    [t, fmt, onEditInvoice, onDeleteInvoice, onViewInvoice, generatingPdf]
  );

  const emptyMessage = query
    ? t('invoice.no_results', { query })
    : t('invoice.empty');

  return (
    <div className="space-y-6">
      <header style={{ position: 'relative' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'transparent' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{t('invoice.title')}</p>
              <h1 className="mt-1 text-3xl font-semibold" style={{ color: 'var(--f-text)' }}>{t('invoice.all_invoices')}</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--f-text-soft)' }}>{t('invoice.overview')}</p>
            </div>
            <button
              onClick={() => onCreateInvoice?.()}
              className="f-btn-primary rounded-2xl px-5 py-2 text-sm font-semibold"
            >
              {t('invoice.new')}
            </button>
          </div>
        </div>
      </header>

      {/* Status tiles double as filters */}
      <div
        role="group"
        aria-label={t('invoice.status')}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}
      >
        {statusTiles.map((tile) => {
          const isActive = statusFilter === tile.value;
          const isDanger = tile.value === 'overdue' && tile.count > 0;
          return (
            <button
              key={tile.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setStatusFilter(isActive && tile.value !== 'all' ? 'all' : tile.value)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                padding: isActive ? '13px 15px' : '14px 16px',
                borderRadius: 12,
                border: isActive
                  ? '2px solid var(--f-text)'
                  : `1px solid ${isDanger ? 'var(--f-danger-border)' : 'var(--f-border)'}`,
                background: isDanger ? 'var(--f-danger-bg)' : isActive ? 'var(--f-surface)' : 'var(--f-surface-hover)',
                font: 'inherit',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isDanger ? 600 : 500, color: isDanger ? 'var(--f-danger-text)' : 'var(--f-text-soft)' }}>
                {tile.label}
              </span>
              <span className="f-num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--f-text)', whiteSpace: 'nowrap' }}>
                {tile.count}
                {tile.sum != null && tile.count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 500, color: isDanger ? 'var(--f-danger-text)' : 'var(--f-text-subtle)' }}>
                    {'· '}{formatCurrency(tile.sum)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <section>
        {/* Toolbar: search + count */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <span className="whitespace-nowrap text-xs" style={{ color: 'var(--f-text-subtle)' }}>
            {t('invoice.showing', { count: filtered.length, total: (invoices || []).length })}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          defaultSort={{ column: 'date', direction: 'desc' }}
        />
      </section>
    </div>
  );
}
