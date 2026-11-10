import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconCheck } from '@tabler/icons-react';
import { InvoiceStatusSelector } from '../invoices/InvoiceStatusSelector';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { formatDate } from '../../utils/formatDate';

/* ── Helpers ─────────────────────────────────────────────────────────── */

function GlassSection({ children, style }) {
  return (
    <section
      style={{
        background: 'var(--f-surface)',
        border: '1px solid var(--f-border)',
        borderRadius: 'var(--f-radius-lg)',
        padding: '20px 22px',
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function SectionHead({ title, link, onLink }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, fontFamily: 'var(--f-font-sans)', letterSpacing: 0, color: 'var(--f-text)' }}>
        {title}
      </h2>
      {link && (
        <button
          type="button"
          onClick={onLink}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 13, color: 'var(--f-green-text)', fontWeight: 500,
          }}
        >
          {link}
        </button>
      )}
    </div>
  );
}

/* ── KPI strip ────────────────────────────────────────────────────────── */
function Kpi({ label, value, children, tint, isLast }) {
  return (
    <div
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
        background: tint ? 'var(--f-warn-bg)' : 'transparent',
        borderRight: isLast ? 'none' : '1px solid var(--f-border)',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--f-text-soft)' }}>{label}</span>
      <span
        className="f-num"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--f-text)', whiteSpace: 'nowrap' }}
      >
        {value}
      </span>
      <div style={{ fontSize: 13, color: 'var(--f-text-soft)', minHeight: 18 }}>{children}</div>
    </div>
  );
}

function daysOverdue(invoice) {
  if (!invoice?.due_date) return null;
  const due = new Date(invoice.due_date);
  if (Number.isNaN(due.getTime())) return null;
  const days = Math.floor((Date.now() - due.getTime()) / 86400000);
  return days > 0 ? days : null;
}

/* ── Invoice table row ────────────────────────────────────────────────── */
const COL_TEMPLATE = '86px 1fr 88px 74px 96px';

function TableHead() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COL_TEMPLATE,
        gap: 10,
        padding: '8px 16px',
        background: 'var(--f-surface-hover)',
        borderBottom: '1px solid var(--f-border-subtle)',
      }}
    >
      {['Nummer', 'Kunde', 'Status', 'Dato', 'Beløp'].map((h, i) => (
        <div
          key={h}
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: 'var(--f-text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'var(--f-font-mono)',
            textAlign: i === 4 ? 'right' : 'left',
          }}
        >
          {h}
        </div>
      ))}
    </div>
  );
}

function TableRow({ invoice, formatCurrency, onViewInvoice, onStatusChange, showStatusModal, isLast }) {
  const fmt = (v) => (typeof formatCurrency === 'function' ? formatCurrency(v) : v);

  return (
    <div
      onClick={() => onViewInvoice?.(invoice)}
      style={{
        display: 'grid',
        gridTemplateColumns: COL_TEMPLATE,
        gap: 10,
        padding: '10px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--f-border-faint)',
        cursor: 'pointer',
        alignItems: 'center',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--f-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: 11, color: 'var(--f-text-subtle)', fontFamily: 'var(--f-font-mono)' }}>
        {invoice.invoice_number || invoice.id}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--f-text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {invoice.customer}
      </div>
      <div onClick={e => e.stopPropagation()}>
        <InvoiceStatusSelector
          invoice={invoice}
          onStatusChange={onStatusChange}
          showModal={showStatusModal}
        />
      </div>
      <div style={{ fontSize: 11, color: 'var(--f-text-subtle)', fontFamily: 'var(--f-font-mono)' }}>
        {invoice.date ? formatDate(invoice.date) : '—'}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--f-text-body)', textAlign: 'right', fontFamily: 'var(--f-font-mono)' }}>
        {fmt(invoice.amount)}
      </div>
    </div>
  );
}

/* ── Budget year card ─────────────────────────────────────────────────── */
function BudgetYearCard({ year, isActive, onEdit, onDelete, onSelect }) {
  const start = year.start ?? year.start_date;
  const end   = year.end   ?? year.end_date;
  return (
    <div
      style={{
        borderRadius: 'var(--f-radius-md)',
        padding: '14px 16px',
        border: isActive ? '1px solid var(--f-border-green)' : '1px solid var(--f-border)',
        background: isActive ? 'var(--f-green-bg)' : 'var(--f-surface)',
        cursor: isActive ? 'default' : 'pointer',
        transition: 'all 0.15s',
      }}
      onClick={() => !isActive && onSelect?.(year.id)}
    >
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text)' }}>{year.label}</p>
      <p style={{ fontSize: 11, color: 'var(--f-text-subtle)', marginTop: 3, fontFamily: 'var(--f-font-mono)' }}>
        {start ? formatDate(start) : '—'} → {end ? formatDate(end) : '—'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: isActive ? 'var(--f-green)' : 'var(--f-hover-elevated)',
            color: isActive ? 'var(--f-on-accent)' : 'var(--f-text-soft)',
          }}
        >
          {isActive ? 'Aktiv' : 'Tilgjengelig'}
        </span>
        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit?.(year); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-green-text)', fontWeight: 500 }}
          >
            Rediger
          </button>
          {!isActive && (
            <button
              onClick={e => { e.stopPropagation(); onDelete?.(year); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-danger)', fontWeight: 500 }}
            >
              Slett
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  Main DashboardView                                                   */
/* ══════════════════════════════════════════════════════════════════════ */

export function DashboardView({
  budgetYears,
  selectedYear,
  onSelectYear,
  statHighlights,
  invoices,
  expenses,
  activityFeed,
  clientHighlights,
  summaries,
  utilization,
  collectionRate,
  formatCurrency,
  monthlyBreakdown,
  onOpenBudgetYearModal,
  onEditBudgetYear,
  onDeleteBudgetYear,
  onCreateInvoice,
  onCreateExpense,
  onNavigate,
  onOpenTimeline,
  onInvoiceStatusChange,
  showInvoiceStatusModal,
  onViewInvoice,
  overdueInvoices,
}) {
  const { t, i18n } = useTranslation();
  const fmt = (v) => (typeof formatCurrency === 'function' ? formatCurrency(v) : v);

  const activeBudgetYear = budgetYears?.find(y => y.id === selectedYear);
  const yearLabel = activeBudgetYear?.label || '—';

  const today = new Date().toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  const outstanding = (summaries?.unpaid ?? 0) + (summaries?.overdue ?? 0);
  const overdueList = (overdueInvoices || [])
    .slice()
    .sort((a, b) => (daysOverdue(b) ?? 0) - (daysOverdue(a) ?? 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--f-text-subtle)' }}>
            {todayLabel} · {t('dashboard_view.budget_year')} {yearLabel}
          </p>
          <h1 style={{ margin: '6px 0 0', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--f-text)' }}>
            {t('nav.overview')}
          </h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => onCreateExpense?.()}
            className="f-btn-ghost"
            style={{ height: 44, padding: '0 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            {t('dashboard_view.log_expense')}
          </button>
          <button
            type="button"
            onClick={() => onCreateInvoice?.()}
            className="f-btn-primary"
            style={{ height: 44, padding: '0 18px', borderRadius: 10, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <IconPlus size={16} stroke={2.2} aria-hidden="true" />
            {t('dashboard_view.new_invoice')}
          </button>
        </div>
      </header>

      {/* ── KPI strip ───────────────────────────────────────────────── */}
      <section
        aria-label={t('dashboard_view.key_figures', 'Nøkkeltall')}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          border: '1px solid var(--f-border)',
          borderRadius: 'var(--f-radius-lg)',
          overflow: 'hidden',
        }}
      >
        <Kpi label={t('dashboard_view.invoiced_ytd', 'Fakturert i perioden')} value={fmt(summaries?.income ?? 0)}>
          {t('dashboard_view.active_year')} {yearLabel}
        </Kpi>
        <Kpi label={t('dashboard_view.paid_in', 'Innbetalt')} value={fmt(summaries?.paid ?? 0)}>
          <div
            role="img"
            aria-label={`${collectionRate}${t('dashboard_view.invoices_collected')}`}
            title={`${collectionRate}${t('dashboard_view.invoices_collected')}`}
            style={{ height: 6, borderRadius: 3, background: 'var(--f-border)', overflow: 'hidden', marginTop: 6 }}
          >
            <div style={{ width: `${Math.max(0, Math.min(100, collectionRate))}%`, height: 6, background: 'var(--f-text)' }} />
          </div>
        </Kpi>
        <Kpi label={t('dashboard_view.outstanding', 'Utestående')} value={fmt(outstanding)} tint={(summaries?.overdue ?? 0) > 0}>
          {(summaries?.overdue ?? 0) > 0 ? (
            <span style={{ color: 'var(--f-danger-text)', fontWeight: 600 }}>
              {fmt(summaries.overdue)} {t('dashboard_view.overdue')}
            </span>
          ) : (
            t('dashboard_view.nothing_overdue', 'Ingenting forfalt')
          )}
        </Kpi>
        <Kpi label={t('dashboard_view.expenses')} value={fmt(summaries?.expenses ?? 0)} isLast>
          {t('dashboard_view.result', 'Resultat')}{' '}
          <span className="f-num" style={{ fontWeight: 600, color: 'var(--f-text)' }}>{fmt(summaries?.net ?? 0)}</span>
        </Kpi>
      </section>

      {/* ── Chart + needs attention ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <GlassSection style={{ flex: '2 1 520px' }}>
          <SectionHead title={t('dashboard_view.income_vs_expenses')} />
          <IncomeExpenseChart data={monthlyBreakdown || []} />
        </GlassSection>

        <GlassSection style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
          <SectionHead
            title={t('dashboard_view.needs_attention', 'Krever oppmerksomhet')}
            link={t('dashboard_view.see_all', 'Se alle')}
            onLink={() => onNavigate?.('Fakturaer')}
          />
          {overdueList.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 8px', textAlign: 'center' }}>
              <span
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--f-success-bg)', color: 'var(--f-success-text)',
                }}
              >
                <IconCheck size={18} stroke={2.2} aria-hidden="true" />
              </span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--f-text)' }}>
                {t('dashboard_view.all_in_order', 'Alt i orden')}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--f-text-soft)' }}>
                {t('dashboard_view.no_overdue_invoices', 'Ingen forfalte fakturaer.')}
              </p>
            </div>
          ) : (
            overdueList.slice(0, 4).map(invoice => {
              const days = daysOverdue(invoice);
              return (
                <button
                  key={invoice.dbId ?? invoice.id}
                  type="button"
                  onClick={() => onViewInvoice?.(invoice)}
                  className="f-attn-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '12px 0', background: 'none', border: 'none',
                    borderTop: '1px solid var(--f-border-faint)',
                    cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--f-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {invoice.customer}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--f-danger-text)' }}>
                      {invoice.id}
                      {days != null && ` · ${t('dashboard_view.days_overdue', '{{count}} dager forfalt', { count: days })}`}
                    </span>
                  </span>
                  <span className="f-num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--f-text)', whiteSpace: 'nowrap' }}>
                    {fmt(invoice.amount)}
                  </span>
                </button>
              );
            })
          )}
          {overdueList.length > 4 && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--f-text-soft)' }}>
              {t('dashboard_view.and_more', '+ {{count}} til', { count: overdueList.length - 4 })}
            </p>
          )}
        </GlassSection>
      </div>

      {/* ── Invoice table ───────────────────────────────────────────── */}
      <div>
        <SectionHead
          title="Siste fakturaer"
          link="Vis alle →"
          onLink={() => onNavigate?.('Fakturaer')}
        />
        <div
          style={{
            borderRadius: 'var(--f-radius-lg)',
            overflow: 'hidden',
            background: 'var(--f-surface)',
            border: '1px solid var(--f-border)',
            boxShadow: 'none',
          }}
        >
          <TableHead />
          {invoices.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--f-text-subtle)' }}>
              Ingen fakturaer i denne perioden
            </div>
          ) : (
            invoices.map((invoice, i) => (
              <TableRow
                key={invoice.id}
                invoice={invoice}
                formatCurrency={formatCurrency}
                onViewInvoice={onViewInvoice}
                onStatusChange={onInvoiceStatusChange}
                showStatusModal={showInvoiceStatusModal}
                isLast={i === invoices.length - 1}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Activity feed + Client highlights ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

        {/* Activity feed */}
        <GlassSection>
          <SectionHead
            title="Siste hendelser"
            link="Tidslinje →"
            onLink={onOpenTimeline}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activityFeed.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--f-text-subtle)' }}>
                Ingen aktivitet å vise
              </div>
            ) : (
              activityFeed.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px',
                    borderRadius: 'var(--f-radius)',
                    background: 'var(--f-surface-hover)',
                    border: '1px solid var(--f-border-faint)',
                  }}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: item.status === 'success' ? 'var(--f-green-bg)'
                                : item.status === 'warn'    ? 'rgba(240,184,64,0.15)'
                                : 'var(--f-border)',
                      border: `1px solid ${
                        item.status === 'success' ? 'var(--f-border-green)'
                        : item.status === 'warn'  ? 'var(--f-warn-border)'
                        : 'var(--f-border-subtle)'
                      }`,
                      color: item.status === 'success' ? 'var(--f-green-text)'
                           : item.status === 'warn'    ? 'var(--f-warn)'
                           : 'var(--f-text-soft)',
                      fontSize: 13, fontWeight: 600,
                    }}
                  >
                    {item.title.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--f-text-body)', lineHeight: 1.3 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--f-text-subtle)', marginTop: 2 }}>{item.detail}</p>
                    <p style={{ fontSize: 10, color: 'var(--f-text-muted)', marginTop: 3, fontFamily: 'var(--f-font-mono)' }}>
                      {item.time}
                    </p>
                  </div>
                  {typeof item.amount === 'number' && (
                    <p style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'var(--f-font-mono)',
                      color: item.amount > 0 ? 'var(--f-green-text)' : 'var(--f-text-subtle)',
                      flexShrink: 0,
                    }}>
                      {item.amount > 0 ? '+' : '-'}{fmt(Math.abs(item.amount))}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassSection>

        {/* Client highlights */}
        <GlassSection>
          <SectionHead
            title="Kunderelasjoner"
            link="Se alle →"
            onLink={() => onNavigate?.('Kunder')}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clientHighlights.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--f-text-subtle)' }}>
                Ingen kunder med fakturaer
              </div>
            ) : (
              clientHighlights.map(client => (
                <div
                  key={client.name}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--f-radius)',
                    background: 'var(--f-surface-hover)',
                    border: '1px solid var(--f-border-faint)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--f-text-body)' }}>{client.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--f-text-subtle)', marginTop: 2 }}>{client.meta}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-green-text)', fontFamily: 'var(--f-font-mono)' }}>
                    {fmt(client.value)}
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassSection>
      </div>

      {/* ── Expenses summary ────────────────────────────────────────── */}
      <GlassSection>
        <SectionHead
          title="Utgifter"
          link="Registrer utgift →"
          onLink={() => onNavigate?.('Utgifter')}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--f-text-subtle)' }}>
              Ingen utgifter registrert
            </div>
          ) : (
            expenses.slice(0, 5).map(expense => (
              <div
                key={expense.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--f-radius)',
                  background: 'var(--f-surface-hover)',
                  border: '1px solid var(--f-border-faint)',
                }}
              >
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--f-text-body)' }}>{expense.vendor}</p>
                  <p style={{ fontSize: 11, color: 'var(--f-text-subtle)', marginTop: 2 }}>{expense.category}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text-body)', fontFamily: 'var(--f-font-mono)' }}>
                    {fmt(expense.amount)}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--f-text-muted)', marginTop: 2, fontFamily: 'var(--f-font-mono)' }}>
                    {expense.date ? formatDate(expense.date) : '—'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassSection>

      {/* ── Budget years ────────────────────────────────────────────── */}
      <div>
        <SectionHead
          title="Budsjettår"
          link="Administrer →"
          onLink={onOpenBudgetYearModal}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {budgetYears.map(year => (
            <BudgetYearCard
              key={year.id}
              year={year}
              isActive={selectedYear === year.id}
              onEdit={onEditBudgetYear}
              onDelete={onDeleteBudgetYear}
              onSelect={onSelectYear}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
