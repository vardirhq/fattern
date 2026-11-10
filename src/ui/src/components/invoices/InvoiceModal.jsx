import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QuantityInput } from '../QuantityInput';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { DatePicker } from '../DatePicker';
import { formatDate, parseDateInput } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSettings } from '../../hooks/useSettings';
import { IconPlus, IconTrash, IconCheck, IconCircleCheck, IconSend, IconFile, IconAlertCircle, IconX } from '@tabler/icons-react';

export function InvoiceModal({ isOpen, mode = 'create', initialInvoice, onSubmit, onClose, customers = [], products = [] }) {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const isEdit = mode === 'edit';

  // Get default settings
  const defaultPaymentTerms = parseInt(getSetting('invoice.defaultPaymentTerms', '14'), 10);
  const autoCalculateDueDate = getSetting('invoice.autoCalculateDueDate', 'true') === 'true';
  const defaultStatus = getSetting('invoice.defaultStatus', 'draft');

  // Calculate default due date if auto-calculate is enabled
  const getDefaultDueDate = (invoiceDateStr) => {
    if (!invoiceDateStr || !autoCalculateDueDate) return '';
    try {
      const invoiceDate = new Date(invoiceDateStr);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + defaultPaymentTerms);
      return dueDate.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Get default invoice date (today)
  const getDefaultInvoiceDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [customerId, setCustomerId] = useState(initialInvoice?.customer_id || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoice?.invoice_date || (isEdit ? '' : getDefaultInvoiceDate())
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.due_date || (isEdit ? '' : getDefaultDueDate(getDefaultInvoiceDate()))
  );
  const [status, setStatus] = useState(initialInvoice?.status || (isEdit ? 'draft' : defaultStatus));
  const [notes, setNotes] = useState(initialInvoice?.notes || '');
  const [yourReference, setYourReference] = useState(initialInvoice?.your_reference || '');
  const [ourReference, setOurReference] = useState(initialInvoice?.our_reference || '');
  const [startDate, setStartDate] = useState(
    initialInvoice?.start_date || ''
  );
  const [endDate, setEndDate] = useState(
    initialInvoice?.end_date || ''
  );
  const [deliveryReference, setDeliveryReference] = useState(initialInvoice?.delivery_reference || '');
  const [reference, setReference] = useState(initialInvoice?.reference || '');
  const [credited, setCredited] = useState(initialInvoice?.credited === 1 || initialInvoice?.credited === true);
  const [items, setItems] = useState(
    initialInvoice?.items?.map((item) => ({
      id: item.id || `temp-${Math.random()}`,
      productId: item.productId || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.unit_price || 0,
      vatRate: item.vatRate != null ? item.vatRate : item.vat_rate != null ? item.vat_rate : 0.25,
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-calculate due date when invoice date changes (if enabled)
  useEffect(() => {
    if (!isOpen || isEdit || !autoCalculateDueDate || !invoiceDate) return;
    const calculatedDueDate = getDefaultDueDate(invoiceDate);
    if (calculatedDueDate) {
      setDueDate(calculatedDueDate);
    }
  }, [invoiceDate, isOpen, isEdit, autoCalculateDueDate, defaultPaymentTerms]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (isEdit && initialInvoice) {
      // Edit mode: use existing invoice values
      setCustomerId(initialInvoice?.customer_id || '');
      setInvoiceDate(initialInvoice?.invoice_date || '');
      setDueDate(initialInvoice?.due_date || '');
      setStatus(initialInvoice?.status || 'draft');
    } else {
      // Create mode: use defaults from settings
      const defaultInvDate = getDefaultInvoiceDate();
      setCustomerId('');
      setInvoiceDate(defaultInvDate);
      setDueDate(getDefaultDueDate(defaultInvDate));
      setStatus(defaultStatus);
    }
    setNotes(initialInvoice?.notes || '');
    setYourReference(initialInvoice?.your_reference || '');
    setOurReference(initialInvoice?.our_reference || '');
    setStartDate(initialInvoice?.start_date || '');
    setEndDate(initialInvoice?.end_date || '');
    setDeliveryReference(initialInvoice?.delivery_reference || '');
    setReference(initialInvoice?.reference || '');
    setCredited(initialInvoice?.credited === 1 || initialInvoice?.credited === true);
    setItems(
      initialInvoice?.items?.length
        ? initialInvoice.items.map((item) => ({
            id: item.id || `temp-${Math.random()}`,
            productId: item.productId || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.unit_price || 0,
            vatRate: item.vatRate != null ? item.vatRate : item.vat_rate != null ? item.vat_rate : 0.25,
          }))
        : []
    );
    setError('');
    setSaving(false);
  }, [isOpen, initialInvoice, mode]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.active !== 0),
    [products]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === parseInt(customerId)),
    [customers, customerId]
  );

  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const vatTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.vatRate, 0);
    const total = subtotal + vatTotal;
    return { subtotal, vatTotal, total };
  }, [items]);

  const handleSelectCustomer = (customer) => {
    setCustomerId(customer.id.toString());
  };

  const handleAddProduct = (product) => {
    setItems([
      ...items,
      {
        id: `temp-${Math.random()}`,
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.unit_price || 0,
        vatRate: product.vat_rate != null ? product.vat_rate : 0.25,
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

    if (!customerId) {
      setError('Kunde må velges.');
      return;
    }

    if (!invoiceDate) {
      setError('Fakturadato må fylles ut.');
      return;
    }

    if (!dueDate) {
      setError('Forfallsdato må fylles ut.');
      return;
    }

    const validItems = items.filter((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      setError('Faktura må ha minst én gyldig linje med beskrivelse, antall og pris.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: parseInt(customerId),
        invoiceDate,
        dueDate,
        status,
        notes: notes.trim() || null,
        yourReference: yourReference.trim() || null,
        ourReference: ourReference.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        deliveryReference: deliveryReference.trim() || null,
        reference: reference.trim() || null,
        credited: credited,
        items: validItems.map((item) => ({
          productId: item.productId ? parseInt(item.productId) : null,
          description: item.description.trim(),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          vatRate: parseFloat(item.vatRate),
        })),
      };
      
      // Include ID only for edit mode
      if (isEdit && initialInvoice?.id) {
        payload.id = initialInvoice.id;
      }
      
      await onSubmit?.(payload);
      // Only close if submission was successful
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke lagre faktura', err);
      const errorMessage = err?.message || 'Noe gikk galt under lagring. Prøv igjen.';
      setError(errorMessage);
      setSaving(false);
      // Don't close modal on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8" style={{ background: 'rgba(4,10,8,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="relative flex h-full max-h-[90vh] w-full max-w-7xl rounded-3xl overflow-hidden f-glass-hero">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full px-2 py-0.5 text-xs font-medium transition"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--f-border)', color: 'var(--f-text-subtle)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--f-text-body)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--f-text-subtle)'}
        >
          Lukk
        </button>

        <div className="flex h-full w-full">
          {/* Left Panel: Customers */}
          <div className="w-80 flex flex-col" style={{ borderRight: '1px solid var(--f-border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--f-border-subtle)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--f-text)' }}>Velg kunde</h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--f-text-soft)' }}>Klikk på en kunde for å velge</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {customers.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--f-text-subtle)' }}>Ingen kunder tilgjengelig</div>
              ) : (
                customers.map((customer) => {
                  const isSelected = customerId === customer.id.toString();
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full rounded-xl p-3 text-left transition"
                      style={{
                        border: isSelected ? '1px solid var(--f-border-green)' : '1px solid var(--f-border-subtle)',
                        background: isSelected ? 'var(--f-green-bg)' : 'rgba(255,255,255,0.03)',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      <div className="flex items-center gap-3">
                        {customer.image_path ? (
                          <img
                            src={customer.image_path}
                            alt={customer.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: 'var(--f-green-bg)', color: 'var(--f-green-text)' }}>
                            {customer.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" style={{ color: 'var(--f-text-body)' }}>{customer.name}</div>
                          {customer.contact_name && (
                            <div className="text-xs truncate" style={{ color: 'var(--f-text-subtle)' }}>{customer.contact_name}</div>
                          )}
                        </div>
                        {isSelected && (
                          <IconCheck className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--f-green-text)' }} />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Middle Panel: Invoice Form */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6" style={{ borderBottom: '1px solid var(--f-border-subtle)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--f-text)' }}>{isEdit ? 'Rediger faktura' : 'Ny faktura'}</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--f-text-soft)' }}>{isEdit ? t('invoice.form.description_edit') : t('invoice.form.description_create')}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
                {isEdit && ['sent', 'paid', 'overdue'].includes(initialInvoice?.status) && (
                  <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{ background: 'var(--f-warn-bg)', border: '1px solid var(--f-warn-border)', color: 'var(--f-warn)' }}>
                    <IconAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: t('invoice.form.edit_warning', { status: t(`status.${initialInvoice.status}`) }) }} />
                  </div>
                )}

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--f-danger-bg)', border: '1px solid var(--f-danger-border)', color: 'var(--f-danger-text)' }}>
                    {error}
                  </div>
                )}

                {selectedCustomer && (
                  <div className="rounded-xl p-4" style={{ background: 'var(--f-green-bg)', border: '1px solid var(--f-border-green)' }}>
                    <div className="flex items-center gap-3">
                      {selectedCustomer.image_path ? (
                        <img
                          src={selectedCustomer.image_path}
                          alt={selectedCustomer.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold" style={{ background: 'var(--f-green-bg)', color: 'var(--f-green-text)' }}>
                          {selectedCustomer.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--f-text-body)' }}>{selectedCustomer.name}</div>
                        {selectedCustomer.email && (
                          <div className="text-sm" style={{ color: 'var(--f-text-soft)' }}>{selectedCustomer.email}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="f-label block text-sm">Fakturadato *</label>
                    <DatePicker
                      value={invoiceDate}
                      onChange={setInvoiceDate}
                      placeholder="dd.mm.yyyy"
                      required
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Forfallsdato *</label>
                    <DatePicker
                      value={dueDate}
                      onChange={setDueDate}
                      placeholder="dd.mm.yyyy"
                      required
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Startdato</label>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="dd.mm.yyyy"
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Sluttdato</label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="dd.mm.yyyy"
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Status</label>
                    <Select
                      value={status}
                      onChange={setStatus}
                      options={[
                        { value: 'draft', label: 'Kladd', icon: <IconFile className="h-4 w-4" /> },
                        { value: 'sent', label: 'Sendt', icon: <IconSend className="h-4 w-4" /> },
                        { value: 'paid', label: 'Betalt', icon: <IconCircleCheck className="h-4 w-4" /> },
                        { value: 'overdue', label: 'Forfalt', icon: <IconAlertCircle className="h-4 w-4" /> },
                        { value: 'cancelled', label: 'Kansellert', icon: <IconX className="h-4 w-4" /> },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="f-label block text-sm">Deres referanse</label>
                    <input
                      type="text"
                      value={yourReference}
                      onChange={(e) => setYourReference(e.target.value)}
                      placeholder="Deres referanse"
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Vår referanse</label>
                    <input
                      type="text"
                      value={ourReference}
                      onChange={(e) => setOurReference(e.target.value)}
                      placeholder="Vår referanse"
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Leveringsreferanse</label>
                    <input
                      type="text"
                      value={deliveryReference}
                      onChange={(e) => setDeliveryReference(e.target.value)}
                      placeholder="Leveringsreferanse"
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="f-label block text-sm">Referanse</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Referanse"
                      className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Checkbox
                    checked={credited}
                    onChange={setCredited}
                    label="Kreditert"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="f-label block text-sm">Linjeelementer *</label>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-xl p-8 text-center" style={{ border: '2px dashed var(--f-border)', background: 'rgba(255,255,255,0.02)' }}>
                      <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>Klikk på produkter til høyre for å legge dem til</p>
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--f-border-subtle)' }}>
                      {/* Table Header */}
                      <div className="grid grid-cols-[1fr_80px_96px_64px_96px_40px] gap-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--f-border-subtle)' }}>
                        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--f-text-subtle)' }}>Beskrivelse</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-center" style={{ color: 'var(--f-text-subtle)' }}>Antall</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--f-text-subtle)' }}>Pris</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-center" style={{ color: 'var(--f-text-subtle)' }}>MVA %</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-right" style={{ color: 'var(--f-text-subtle)' }}>Total</div>
                        <div></div>
                      </div>

                      {/* Table Rows */}
                      <div>
                        {items.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_80px_96px_64px_96px_40px] gap-2 px-3 py-2 transition" style={{ borderBottom: '1px solid var(--f-border-faint)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div className="flex items-center min-w-0">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                placeholder="Beskrivelse *"
                                className="f-input w-full rounded-lg px-3 py-1.5 text-sm"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="f-input w-full rounded-lg px-2 py-1.5 text-sm text-center"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="f-input w-full rounded-lg px-2 py-1.5 text-sm text-right"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={(item.vatRate * 100).toFixed(0)}
                                onChange={(e) => handleItemChange(item.id, 'vatRate', (parseFloat(e.target.value) || 0) / 100)}
                                className="f-input w-full rounded-lg px-2 py-1.5 text-sm text-center"
                              />
                            </div>
                            <div className="flex items-center justify-end">
                              <div className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>
                                {formatCurrency(item.quantity * item.unitPrice * (1 + item.vatRate))}
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="rounded-lg p-1.5 transition"
                                style={{ color: 'var(--f-text-subtle)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--f-danger-bg)'; e.currentTarget.style.color = 'var(--f-danger-text)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-subtle)'; }}
                                aria-label="Fjern linje"
                              >
                                <IconTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--f-border-subtle)' }}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between" style={{ color: 'var(--f-text-soft)' }}>
                      <span>Delsum:</span>
                      <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>{formatCurrency(calculations.subtotal)}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: 'var(--f-text-soft)' }}>
                      <span>MVA:</span>
                      <span className="font-medium" style={{ color: 'var(--f-text-body)' }}>{formatCurrency(calculations.vatTotal)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-base font-semibold" style={{ borderTop: '1px solid var(--f-border-subtle)', color: 'var(--f-text)' }}>
                      <span>Total:</span>
                      <span>{formatCurrency(calculations.total)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="f-label">Notater</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Valgfrie notater..."
                    className="f-input mt-2 w-full rounded-xl px-4 py-2 text-sm"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </form>
            </div>

            <div className="p-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
              <button
                type="button"
                onClick={onClose}
                className="f-btn-ghost rounded-xl px-4 py-2 text-sm font-medium"
              >
                Avbryt
              </button>
              <button
                type="submit"
                form="invoice-form"
                disabled={saving}
                className="f-btn-primary rounded-xl px-4 py-2 text-sm font-medium"
              >
                {saving ? 'Lagrer...' : isEdit ? 'Oppdater' : 'Opprett'}
              </button>
            </div>
          </div>

          {/* Right Panel: Products */}
          <div className="w-80 flex flex-col" style={{ borderLeft: '1px solid var(--f-border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--f-border-subtle)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--f-text)' }}>Produkter</h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--f-text-soft)' }}>Klikk for å legge til</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeProducts.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--f-text-subtle)' }}>Ingen produkter tilgjengelig</div>
              ) : (
                activeProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full rounded-xl p-3 text-left transition"
                    style={{ border: '1px solid var(--f-border-subtle)', background: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--f-border-green)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--f-border-subtle)'; }}
                  >
                    <div className="flex items-start gap-3">
                      {product.image_path ? (
                        <img
                          src={product.image_path}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <svg className="h-6 w-6" style={{ color: 'var(--f-text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate" style={{ color: 'var(--f-text-body)' }}>{product.name}</div>
                        <div className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--f-green-text-dim)' }}>
                          {formatCurrency(product.unit_price || 0)}
                          {product.unit && <span className="font-normal" style={{ color: 'var(--f-text-subtle)' }}> / {product.unit}</span>}
                        </div>
                        {product.sku && (
                          <div className="mt-0.5 text-xs" style={{ color: 'var(--f-text-subtle)' }}>SKU: {product.sku}</div>
                        )}
                      </div>
                      <IconPlus className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: 'var(--f-text-subtle)' }} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
