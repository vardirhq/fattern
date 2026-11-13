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

      const defaultTemplateId = getSetting('invoice.defaultTemplate', 'preset_nordisk_pro');
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
        className: 'ft-mono font-medium text-ink',
        render: (id, invoice) => (
          <button
            onClick={() => onViewInvoice?.(invoice)}
            className="cursor-pointer text-left hover-underline hover-text-brand"
          >
            {invoice.invoice_number || id}
          </button>
        ),
      },
      {
        key: 'customer',
        label: t('invoice.customer'),
        className: 'text-muted',
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
            <span className="text-muted">{date ? formatDate(date) : '—'}</span>
            {invoice.status === 'paid' && invoice.payment_date && (
              <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                {t('invoice.paid_date')} {formatDate(invoice.payment_date)}
              </span>
            )}
          </div>
        ),
        className: 'ft-mono text-muted',
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
        className: 'ft-mono font-medium text-ink',
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
                className="ft-btn ft-btn-secondary r-md px-3 text-xs font-medium"
                style={{ height: 30, marginRight: 4 }}
                title={invoice.last_reminder_at ? t('invoice.last_reminded', { date: formatDate(invoice.last_reminder_at) }) : undefined}
              >
                {invoice.reminder_count > 0 ? t('invoice.send_reminder_again') : t('invoice.send_reminder')}
              </button>
            )}
            <button
              onClick={() => onViewInvoice?.(invoice)}
              className="r-md p-1-5 text-muted hover-bg-brand hover-text-brand"
              aria-label={t('invoice.view_action')}
              title={t('invoice.view_action')}
            >
              <IconEye size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => handleGeneratePDF(invoice)}
              disabled={generatingPdf === invoice.dbId}
              className="r-md p-1-5 text-muted hover-bg-brand hover-text-brand disabled-dim"
              aria-label={t('invoice.generate_pdf')}
              title={t('invoice.generate_pdf')}
            >
              <IconDownload size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => onEditInvoice?.(invoice)}
              className="r-md p-1-5 text-muted hover-bg-brand hover-text-brand"
              aria-label={t('invoice.edit')}
              title={t('invoice.edit')}
            >
              <IconEdit size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => onDeleteInvoice?.(invoice)}
              className="r-md p-1-5 text-muted hover-bg-danger hover-text-danger"
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
          <div className="flex flex-col gap-6 lg-flex-row lg-items-start lg-justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{t('invoice.title')}</p>
              <h1 className="mt-1 text-3xl font-semibold" style={{ color: 'var(--ink)' }}>{t('invoice.all_invoices')}</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>{t('invoice.overview')}</p>
            </div>
            <button
              onClick={() => onCreateInvoice?.()}
              className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold"
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
                borderRadius: 'var(--radius-lg)',
                border: isActive
                  ? '2px solid var(--ink)'
                  : `1px solid ${isDanger ? 'var(--danger-line)' : 'var(--line)'}`,
                background: isDanger ? 'var(--danger-soft)' : isActive ? 'var(--surface)' : 'var(--surface-sunken)',
                font: 'inherit',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isDanger ? 600 : 500, color: isDanger ? 'var(--danger)' : 'var(--ink-muted)' }}>
                {tile.label}
              </span>
              <span className="ft-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                {tile.count}
                {tile.sum != null && tile.count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 500, color: isDanger ? 'var(--danger)' : 'var(--ink-muted)' }}>
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
        <div className="mb-4 flex flex-col gap-3 sm-flex-row sm-items-center">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <span className="whitespace-nowrap text-xs" style={{ color: 'var(--ink-muted)' }}>
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
