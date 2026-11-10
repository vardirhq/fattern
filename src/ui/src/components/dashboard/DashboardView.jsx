import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// (tabler icons available if individual sections need them)
import { InvoiceStatusSelector } from '../invoices/InvoiceStatusSelector';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { formatDate } from '../../utils/formatDate';

/* ── Helpers ─────────────────────────────────────────────────────────── */

function GlassSection({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--f-surface-elevated)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--f-border)',
        borderRadius: 'var(--f-radius-md)',
        boxShadow: 'none',
        padding: '20px 22px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, link, onLink }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--f-text-subtle)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
      {link && (
        <button
          onClick={onLink}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11.5, color: 'var(--f-green-text)', fontWeight: 500,
          }}
        >
          {link}
        </button>
      )}
    </div>
  );
}


/* ── Hero Sparkline ───────────────────────────────────────────────────── */
const MONTH_LABELS_NO = ['JAN','FEB','MAR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DES'];

function Sparkline({ monthlyBreakdown }) {
  const bars = useMemo(() => {
    if (!monthlyBreakdown?.length) {
      return [34, 26, 46, 30, 50, 40].map((h, i) => ({ h, label: MONTH_LABELS_NO[i], isNow: i === 5 }));
    }
    // Prefer months that contain data; fall back to last 6 if all are empty.
    const withData = monthlyBreakdown.filter(m => (m.income || 0) + (m.expenses || 0) > 0);
    const source = withData.length >= 2
      ? monthlyBreakdown.slice(
          Math.max(0, monthlyBreakdown.indexOf(withData[0])),
          monthlyBreakdown.indexOf(withData[withData.length - 1]) + 1
        ).slice(-6)
      : monthlyBreakdown.slice(-6);
    const max = Math.max(...source.map(m => m.income || 0), 1);
    return source.map((m, i) => ({
      h: Math.max(4, Math.round(((m.income || 0) / max) * 40)),
      label: m.label || MONTH_LABELS_NO[i],
      isNow: i === source.length - 1,
    }));
  }, [monthlyBreakdown]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 42 }}>
        {bars.map(({ h, label, isNow }) => (
          <div
            key={label}
            style={{
              flex: 1,
              height: h,
              borderRadius: '2px 2px 0 0',
              background: isNow ? 'rgba(47,75,216,0.9)' : 'rgba(47,75,216,0.32)',
              boxShadow: isNow ? 'none' : 'none',
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          borderTop: '1px solid var(--f-border-subtle)',
          paddingTop: 6, paddingBottom: 14,
        }}
      >
        {bars.map(({ label }) => (
          <div
            key={label}
            style={{
              flex: 1,
              fontSize: 9,
              color: 'var(--f-text-muted)',
              textAlign: 'center',
              fontFamily: 'var(--f-font-mono)',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Stat cards ───────────────────────────────────────────────────────── */
const CARD_TONES = [
  { valueColor: 'var(--f-text)', metaColor: 'var(--f-text-soft)', bg: 'var(--f-surface)' },
  { valueColor: 'var(--f-text)', metaColor: 'var(--f-text-soft)', bg: 'var(--f-surface)' },
  { valueColor: 'var(--f-text)', metaColor: 'var(--f-danger-text)', bg: 'var(--f-warn-bg)' },
];

function StatCard({ label, value, meta, toneIndex = 0 }) {
  const tone = CARD_TONES[toneIndex] || CARD_TONES[0];
  return (
    <div
      style={{
        borderRadius: 'var(--f-radius-lg)',
        padding: '18px 20px',
        background: tone.bg,
        border: '1px solid var(--f-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--f-text-soft)' }}>
        {label}
      </div>
      <div
        className="f-num"
        style={{
          fontSize: 26, fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: tone.valueColor,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: tone.metaColor }}>
        {meta}
      </div>
    </div>
  );
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
}) {
  const { t } = useTranslation();
  const fmt = (v) => (typeof formatCurrency === 'function' ? formatCurrency(v) : v);

  const activeBudgetYear = budgetYears?.find(y => y.id === selectedYear);
  const yearLabel = activeBudgetYear?.label || '—';

  // Show the current month when viewing the current year; otherwise show the year label.
  const now = new Date();
  const budgetYearNum = activeBudgetYear
    ? new Date(activeBudgetYear.start_date).getFullYear()
    : null;
  const isCurrentYear = budgetYearNum === now.getFullYear();
  const heroLabel = isCurrentYear
    ? (() => {
        const monthName = now.toLocaleString('nb-NO', { month: 'long' });
        return `Nettoinntekt · ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${now.getFullYear()}`;
      })()
    : `Nettoinntekt · ${yearLabel}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Hero glass card ─────────────────────────────────────────── */}
      <div
        className="f-glass-hero"
        style={{ borderRadius: 'var(--f-radius-xl)', padding: '20px 22px 0', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--f-text-label)',
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                fontFamily: 'var(--f-font-mono)',
                marginBottom: 6,
              }}
            >
              {heroLabel}
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmt(summaries?.net ?? 0)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--f-green-text-dim)', marginTop: 5, fontFamily: 'var(--f-font-mono)' }}>
              Aktivt år · {yearLabel}
            </div>
          </div>

          {/* Right stats */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--f-warn)', letterSpacing: '-0.02em' }}>
                {fmt(summaries?.unpaid ?? 0)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--f-text-subtle)', fontFamily: 'var(--f-font-mono)', marginTop: 1 }}>
                ubetalt
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--f-danger)', letterSpacing: '-0.02em' }}>
                {fmt(summaries?.overdue ?? 0)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--f-text-subtle)', fontFamily: 'var(--f-font-mono)', marginTop: 1 }}>
                forfalt
              </div>
            </div>
          </div>
        </div>

        <Sparkline monthlyBreakdown={monthlyBreakdown} />
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCard
          label="Inntekter"
          value={fmt(summaries?.income ?? 0)}
          meta={`${utilization}% kapasitetsbruk`}
          toneIndex={0}
        />
        <StatCard
          label="Utgifter"
          value={fmt(summaries?.expenses ?? 0)}
          meta="Registrerte kostnader"
          toneIndex={1}
        />
        <StatCard
          label="Innkrevingstakt"
          value={`${collectionRate}%`}
          meta="av fakturert beløp"
          toneIndex={2}
        />
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
            borderRadius: 'var(--f-radius-md)',
            overflow: 'hidden',
            background: 'var(--f-surface-elevated)',
            backdropFilter: 'blur(20px)',
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

      {/* ── Income vs Expenses chart ─────────────────────────────────── */}
      <GlassSection>
        <SectionHead title={t('dashboard_view.income_vs_expenses')} />
        <IncomeExpenseChart data={monthlyBreakdown || []} />
      </GlassSection>

      {/* ── Activity feed + Client highlights ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

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
