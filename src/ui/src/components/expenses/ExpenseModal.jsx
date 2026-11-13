import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { DatePicker } from '../DatePicker';
import { ExpenseAttachmentUpload } from './ExpenseAttachmentUpload';

export function ExpenseModal({ isOpen, mode = 'create', initialExpense, onSubmit, onClose, categories = [] }) {
  const { t } = useTranslation();
  const [vendor, setVendor] = useState(initialExpense?.vendor || '');
  const [categoryId, setCategoryId] = useState(initialExpense?.category_id?.toString() || '');
  const [amount, setAmount] = useState(initialExpense?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initialExpense?.currency || 'NOK');
  // DatePicker expects and returns yyyy-mm-dd — store raw ISO date
  const [date, setDate] = useState(initialExpense?.date || '');
  const [notes, setNotes] = useState(initialExpense?.notes || '');
  const [attachmentPath, setAttachmentPath] = useState(initialExpense?.attachment_path || '');
  const [items, setItems] = useState(initialExpense?.items || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    setVendor(initialExpense?.vendor || '');
    setCategoryId(initialExpense?.category_id?.toString() || '');
    setAmount(initialExpense?.amount?.toString() || '');
    setCurrency(initialExpense?.currency || 'NOK');
    setDate(initialExpense?.date || '');
    setNotes(initialExpense?.notes || '');
    setAttachmentPath(initialExpense?.attachment_path || '');
    setItems(initialExpense?.items || []);
    setError('');
    setSaving(false);
  }, [isOpen, initialExpense, mode]);

  // Calculate totals from items
  const { subtotal, vatTotal, total } = items.reduce(
    (acc, item) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const vatRate = item.vatRate || 0;
      const lineSubtotal = qty * price;
      const lineVat = lineSubtotal * vatRate;
      const lineTotal = lineSubtotal + lineVat;
      return {
        subtotal: acc.subtotal + lineSubtotal,
        vatTotal: acc.vatTotal + lineVat,
        total: acc.total + lineTotal,
      };
    },
    { subtotal: 0, vatTotal: 0, total: 0 }
  );

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `temp-${Math.random()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 0.25,
      },
    ]);
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const handleItemChange = (itemId, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validate items if provided, otherwise validate amount
    if (items.length > 0) {
      const validItems = items.filter((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0);
      if (validItems.length === 0) {
        setError(t('expense.form.validation_items'));
        return;
      }
    } else {
      if (!amount || parseFloat(amount) <= 0) {
        setError(t('expense.form.validation_amount'));
        return;
      }
    }

    if (!date) {
      setError(t('expense.form.validation_date'));
      return;
    }

    setSaving(true);
    try {
      const validItems = items.length > 0
        ? items
            .filter((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0)
            .map((item) => ({
              description: item.description.trim(),
              quantity: parseFloat(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              vatRate: parseFloat(item.vatRate) || 0,
            }))
        : [];

      await onSubmit?.({
        id: initialExpense?.id,
        vendor: vendor.trim() || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        amount: items.length > 0 ? total : parseFloat(amount),
        currency: currency || 'NOK',
        date,
        notes: notes.trim() || null,
        attachmentPath: attachmentPath || null,
        items: validItems,
      });
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke lagre utgift', err);
      const errorMessage = err?.message || t('errors.save_failed');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit ? t('expense.form.title_edit') : t('expense.form.title_create');
  const modalDescription = isEdit
    ? t('expense.form.description_edit', 'Oppdater utgiftsinformasjon.')
    : t('expense.form.description_create', 'Registrer en ny utgift i systemet.');

  // Build category hierarchy for display
  const buildCategoryOptions = (cats, parentId = null, level = 0) => {
    const children = cats.filter((c) => {
      const cParentId = c.parent_id;
      if (cParentId === null || cParentId === undefined || cParentId === 0) {
        return parentId === null;
      }
      return cParentId === parentId;
    });

    const options = [];
    children.forEach((cat) => {
      const indent = '  '.repeat(level);
      const prefix = level > 0 ? '└ ' : '';
      options.push({
        value: cat.id.toString(),
        label: `${indent}${prefix}${cat.name}`,
        level, // Store level for custom rendering if needed
      });
      // Recursively add children
      const childOptions = buildCategoryOptions(cats, cat.id, level + 1);
      options.push(...childOptions);
    });
    return options;
  };

  const categoryOptions = [
    { value: '', label: 'Ingen kategori' },
    ...buildCategoryOptions(categories),
  ];

  const currencyOptions = [
    { value: 'NOK', label: 'NOK' },
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'SEK', label: 'SEK' },
    { value: 'DKK', label: 'DKK' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={modalDescription}
      size="xl"
      footer={
        <>
          <button
            type="button"
            className="text-sm font-medium transition"
            style={{ color: 'var(--ink-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
            onClick={onClose}
            disabled={saving}
          >
            Avbryt
          </button>
          <button
            type="submit"
            form="expense-form"
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
            disabled={saving}
          >
            {saving ? 'Lagrer …' : isEdit ? 'Lagre endringer' : 'Registrer utgift'}
          </button>
        </>
      }
    >
      <form id="expense-form" className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Grunnleggende informasjon</h3>
          <div className="grid gap-4 md-grid-cols-2">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Leverandør</label>
              <input
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Eksempel: Rema 1000"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Kategori</label>
              <Select
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                placeholder="Velg kategori"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Dato *</label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="dd.mm.yyyy"
                required
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Valuta</label>
              <Select
                value={currency}
                onChange={setCurrency}
                options={currencyOptions}
                placeholder="Velg valuta"
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Linjeelementer</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="ft-btn ft-btn-primary r-md px-3 py-1-5 text-xs font-medium transition"
            >
              + Legg til linje
            </button>
          </div>

          {items.length > 0 ? (
            <div className="r-lg overflow-hidden flex flex-col max-h-400" style={{ border: '1px solid var(--line)' }}>
              <div className="shrink-0" style={{ background: 'var(--hover)', borderBottom: '1px solid var(--line)' }}>
                <div className="grid grid-invoice-lines gap-3 px-4 py-2-5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                  <div>Beskrivelse</div>
                  <div className="text-center">Antall</div>
                  <div className="text-right">Enhetspris</div>
                  <div className="text-right">MVA %</div>
                  <div className="text-right">Total</div>
                  <div></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ borderColor: 'var(--line)' }}>
                {items.map((item) => {
                  const lineSubtotal = (item.quantity || 1) * (item.unitPrice || 0);
                  const lineVat = lineSubtotal * (item.vatRate || 0);
                  const lineTotal = lineSubtotal + lineVat;
                  return (
                    <div key={item.id} className="grid grid-invoice-lines gap-3 px-4 py-3 transition" style={{ borderBottom: '1px solid var(--line)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Beskrivelse"
                        className="ft-input w-full r-md px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="ft-input w-full r-md px-2 py-2 text-sm text-center"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="ft-input w-full r-md px-2 py-2 text-sm text-right"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={item.vatRate}
                        onChange={(e) => handleItemChange(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                        className="ft-input w-full r-md px-2 py-2 text-sm text-right"
                      />
                      <div className="flex items-center justify-end text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {lineTotal.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex items-center justify-center transition"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
                        title="Fjern linje"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              {items.length > 0 && (
                <div className="shrink-0 px-4 py-3 space-y-2" style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--line)' }}>
                  <div className="flex justify-between text-sm" style={{ color: 'var(--ink-muted)' }}>
                    <span>Sum eks. MVA:</span>
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: 'var(--ink-muted)' }}>
                    <span>MVA:</span>
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>{vatTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2" style={{ color: 'var(--ink)', borderTop: '1px solid var(--line)' }}>
                    <span>Totalt:</span>
                    <span>{total.toFixed(2)} {currency}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="r-lg border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--line)', background: 'var(--surface-sunken)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--ink-muted)' }}>Legg til linjeelementer for å dele opp utgiften</p>
              <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>eller</p>
              <div className="max-w-xs mx-auto">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--ink)' }}>
                  Beløp direkte *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="ft-input w-full r-lg px-4 py-2 text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Additional Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Tilleggsinformasjon</h3>
          <div className="grid gap-4 md-grid-cols-1-2">
            <div>
              <ExpenseAttachmentUpload
                value={attachmentPath}
                onChange={setAttachmentPath}
                label="Kvittering/bilde"
                expenseId={initialExpense?.id}
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Notater</label>
              <textarea
                className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Valgfrie notater om utgiften"
                rows={6}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="r-md p-3" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-line)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
