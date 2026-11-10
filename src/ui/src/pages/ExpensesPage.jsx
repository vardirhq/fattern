// src/ui/src/pages/ExpensesPage.jsx
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpenseBreakdownBar } from '../components/expenses/ExpenseBreakdownBar';
import { ExpenseCategoryChips } from '../components/expenses/ExpenseCategoryChips';
import { ExpenseTimeline } from '../components/expenses/ExpenseTimeline';
import { ExpenseDetailPanel } from '../components/expenses/ExpenseDetailPanel';

export function ExpensesPage({
  expenses = [],
  breakdown = [],
  formatCurrency: fmt,
  onCreateExpense,
  onEditExpense,
  onDeleteExpense,
  onManageCategories,
}) {
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const panelOpen = selectedExpenseId !== null;

  // Replace null id for uncategorised row with a sentinel so it can be selected/deselected
  const UNCATEGORISED_SENTINEL = '__uncategorised__';
  const breakdownForUI = breakdown.map((c) =>
    c.id === null ? { ...c, id: UNCATEGORISED_SENTINEL } : c
  );

  // Filter by category then search
  const filteredExpenses = useMemo(() => {
    let list = expenses;
    if (activeCategoryId !== null) {
      if (activeCategoryId === UNCATEGORISED_SENTINEL) {
        list = list.filter((e) => e.category_id == null);
      } else {
        list = list.filter((e) => e.category_id === activeCategoryId);
      }
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          (e.vendor || '').toLowerCase().includes(q) ||
          (e.notes || '').toLowerCase().includes(q) ||
          (e.category_name || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [expenses, activeCategoryId, query]);

  const totalAmount = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);

  const selectedExpense = useMemo(
    () => (selectedExpenseId ? expenses.find((e) => e.id === selectedExpenseId) || null : null),
    [selectedExpenseId, expenses],
  );

  const handleSelectCategory = (id) => {
    setActiveCategoryId((prev) => (prev === id ? null : id));
  };

  const handleDeleteExpense = async (expenseId) => {
    await onDeleteExpense?.(expenseId);
    setSelectedExpenseId(null);
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <header style={{ position: 'relative' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'transparent' }} />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>
                {t('expense.title')}
              </p>
              <h1 className="mt-2 text-3xl font-semibold" style={{ color: 'var(--f-text)' }}>
                {fmt ? fmt(totalAmount) : totalAmount}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--f-text-soft)' }}>
                {filteredExpenses.length}{' '}
                {filteredExpenses.length === 1 ? t('expense.expense_singular') : t('expense.expense_plural')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onCreateExpense?.()}
                className="f-btn-primary rounded-2xl px-5 py-2 text-sm font-semibold"
              >
                {t('expense.new')}
              </button>
              <button
                type="button"
                onClick={() => onManageCategories?.()}
                className="f-btn-ghost rounded-2xl px-5 py-2 text-sm font-semibold"
              >
                {t('expense.manage_categories')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content + detail panel */}
      <div style={{ display: 'flex', gap: 16, position: 'relative', alignItems: 'flex-start' }}>
        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="f-glass rounded-3xl p-6 space-y-4">
            {breakdownForUI.length > 0 && (
              <ExpenseBreakdownBar
                breakdown={breakdownForUI}
                activeCategory={activeCategoryId}
                onSelectCategory={handleSelectCategory}
              />
            )}

            <ExpenseCategoryChips
              breakdown={breakdownForUI}
              activeCategory={activeCategoryId}
              onSelectCategory={handleSelectCategory}
              query={query}
              onQueryChange={setQuery}
            />

            <ExpenseTimeline
              expenses={filteredExpenses}
              formatCurrency={fmt}
              onSelectExpense={setSelectedExpenseId}
              selectedExpenseId={selectedExpenseId}
            />
          </div>
        </div>

        {/* Detail panel */}
        {panelOpen && (
          <ExpenseDetailPanel
            expense={selectedExpense}
            formatCurrency={fmt}
            onEdit={(expense) => onEditExpense?.(expense)}
            onDelete={handleDeleteExpense}
            onClose={() => setSelectedExpenseId(null)}
          />
        )}
      </div>
    </div>
  );
}
