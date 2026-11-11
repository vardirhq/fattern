import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QuantityInput } from '../QuantityInput';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { DatePicker } from '../DatePicker';
import { formatDate, parseDateInput } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSettings } from '../../hooks/useSettings';
import { buildInvoicePayload, validInvoiceItems } from './invoicePayload.mjs';
import { IconPlus, IconTrash, IconCheck, IconCircleCheck, IconSend, IconFile, IconAlertCircle, IconX, IconChevronLeft } from '@tabler/icons-react';

export function InvoiceModal({ isOpen, mode = 'create', initialInvoice, onSubmit, onClose, customers = [], products = [], company }) {
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
  const [pickingCustomer, setPickingCustomer] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

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
    setPickingCustomer(false);
    setShowProducts(false);
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

  const handleAddBlankItem = () => {
    setItems([
      ...items,
      { id: `temp-${Math.random()}`, productId: '', description: '', quantity: 1, unitPrice: 0, vatRate: company?.vat_rate != null ? company.vat_rate : 0.25 },
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

    const validItems = validInvoiceItems(items);
    if (validItems.length === 0) {
      setError('Faktura må ha minst én gyldig linje med beskrivelse, antall og pris.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildInvoicePayload({
        customerId, invoiceDate, dueDate, status, notes, yourReference, ourReference,
        startDate, endDate, deliveryReference, reference, credited, items: validItems,
      });
      
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

  const invoiceNumber = initialInvoice?.invoice_number || null;
  const statusLabel = t(`status.${status}`, { defaultValue: status });
  const statusPill = { draft: 'f-pill-draft', sent: 'f-pill-sent', paid: 'f-pill-paid', overdue: 'f-pill-overdue' }[status] || 'f-pill-draft';
  const num = (v) => new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const hasExtraFields = Boolean(startDate || endDate || ourReference || deliveryReference || reference || credited);
  const showCustomerList = !selectedCustomer || pickingCustomer;
  const companyLine = [
    [company?.address, [company?.post_number, company?.post_location].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    company?.org_number ? `Org.nr. ${company.org_number}` : null,
  ].filter(Boolean).join(' · ');
  const customerAddress = [
    selectedCustomer?.address,
    [selectedCustomer?.post_number, selectedCustomer?.post_location].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');

  const card = { background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 'var(--f-radius-lg)', padding: '20px 22px' };
  const cardTitle = { margin: 0, fontSize: 15, fontWeight: 600, fontFamily: 'var(--f-font-sans)', letterSpacing: 0, color: 'var(--f-text)' };
  const lineCols = 'minmax(0,1fr) 72px 100px 64px 110px 36px';
  const cap = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#62666E' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Rediger faktura' : 'Ny faktura'}
      className="fixed inset-0 z-40 flex flex-col"
      style={{ background: 'var(--f-bg-base)', top: 'var(--f-topbar-h)', bottom: 'var(--f-bottom-h)' }}
    >
      {/* Top bar */}
      <header
        className="flex flex-wrap items-center"
        style={{ gap: '12px 16px', padding: '14px 28px', borderBottom: '1px solid var(--f-border)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tilbake"
          className="f-btn-ghost flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 10, cursor: 'pointer' }}
        >
          <IconChevronLeft size={18} stroke={2} aria-hidden="true" />
        </button>
        <div className="flex flex-col" style={{ gap: 2, flexGrow: 1, minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--f-text)' }}>
              {isEdit ? 'Rediger faktura' : 'Ny faktura'}
              {invoiceNumber && <span className="f-num"> {invoiceNumber}</span>}
            </h1>
            <span className={statusPill} style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
              {statusLabel}
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--f-text-subtle)' }}>
            {isEdit ? t('invoice.form.description_edit') : t('invoice.form.description_create')}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="f-btn-ghost"
          style={{ height: 44, padding: '0 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          Avbryt
        </button>
        <button
          type="submit"
          form="invoice-form"
          disabled={saving}
          className="f-btn-primary"
          style={{ height: 44, padding: '0 18px', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}
        >
          {saving ? 'Lagrer...' : isEdit ? 'Oppdater' : 'Opprett'}
        </button>
      </header>

      <div className="flex flex-wrap" style={{ flex: 1, minHeight: 0, overflowY: 'auto', gap: 24, padding: '24px 28px 40px', alignContent: 'flex-start' }}>

        {/* Form */}
        <form id="invoice-form" onSubmit={handleSubmit} className="flex flex-col" style={{ flex: '1 1 520px', minWidth: 0, gap: 20 }}>
          {isEdit && ['sent', 'paid', 'overdue'].includes(initialInvoice?.status) && (
            <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{ background: 'var(--f-warn-bg)', border: '1px solid var(--f-warn-border)', color: 'var(--f-warn)' }}>
              <IconAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: t('invoice.form.edit_warning', { status: t(`status.${initialInvoice.status}`) }) }} />
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--f-danger-bg)', border: '1px solid var(--f-danger-border)', color: 'var(--f-danger-text)' }}>
              {error}
            </div>
          )}

          {/* Customer */}
          <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={cardTitle}>Kunde</h2>
            {selectedCustomer && !pickingCustomer && (
              <div className="flex items-center" style={{ gap: 14, padding: 14, border: '1px solid var(--f-border)', borderRadius: 12, background: 'var(--f-surface-hover)' }}>
                {selectedCustomer.image_path ? (
                  <img src={selectedCustomer.image_path} alt="" className="object-cover" style={{ width: 44, height: 44, borderRadius: 10 }} />
                ) : (
                  <span className="flex items-center justify-center f-num" style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--f-inverse-bg)', color: 'var(--f-inverse-text)', fontWeight: 600 }}>
                    {selectedCustomer.name?.slice(0, 2)?.toUpperCase() || '?'}
                  </span>
                )}
                <div className="flex flex-col" style={{ flexGrow: 1, minWidth: 0, gap: 2 }}>
                  <span className="truncate" style={{ fontWeight: 600, color: 'var(--f-text)' }}>{selectedCustomer.name}</span>
                  <span className="truncate" style={{ fontSize: 13, color: 'var(--f-text-soft)' }}>
                    {[selectedCustomer.org_number && `Org.nr. ${selectedCustomer.org_number}`, selectedCustomer.email].filter(Boolean).join(' · ') || selectedCustomer.contact_name || ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickingCustomer(true)}
                  className="f-btn-ghost"
                  style={{ height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Bytt
                </button>
              </div>
            )}
            {showCustomerList && (
              customers.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--f-text-subtle)' }}>Ingen kunder tilgjengelig</p>
              ) : (
                <div className="flex flex-col" style={{ gap: 6, maxHeight: 232, overflowY: 'auto' }}>
                  {customers.map((customer) => {
                    const isSelected = customerId === customer.id.toString();
                    return (
                      <button
                        key={customer.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => { handleSelectCustomer(customer); setPickingCustomer(false); }}
                        className="f-pick-row flex items-center text-left"
                        style={{
                          gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', font: 'inherit',
                          border: isSelected ? '2px solid var(--f-text)' : '1px solid var(--f-border)',
                          background: 'var(--f-surface)', color: 'var(--f-text)',
                        }}
                      >
                        <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--f-hover-elevated)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                          {customer.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <span className="flex flex-col" style={{ minWidth: 0, flexGrow: 1 }}>
                          <span className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{customer.name}</span>
                          {customer.contact_name && <span className="truncate" style={{ fontSize: 12, color: 'var(--f-text-subtle)' }}>{customer.contact_name}</span>}
                        </span>
                        {isSelected && <IconCheck size={18} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )
            )}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <div>
                <label className="f-label">Fakturadato *</label>
                <DatePicker value={invoiceDate} onChange={setInvoiceDate} placeholder="dd.mm.yyyy" required className="f-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="f-label">Forfallsdato *</label>
                <DatePicker value={dueDate} onChange={setDueDate} placeholder="dd.mm.yyyy" required className="f-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="f-label">Status</label>
                <Select
                  value={status}
                  onChange={setStatus}
                  noMargin
                  options={[
                    { value: 'draft', label: t('status.draft'), icon: <IconFile className="h-4 w-4" /> },
                    { value: 'sent', label: t('status.sent'), icon: <IconSend className="h-4 w-4" /> },
                    { value: 'paid', label: t('status.paid'), icon: <IconCircleCheck className="h-4 w-4" /> },
                    { value: 'overdue', label: t('status.overdue'), icon: <IconAlertCircle className="h-4 w-4" /> },
                    { value: 'cancelled', label: t('status.cancelled'), icon: <IconX className="h-4 w-4" /> },
                  ]}
                />
              </div>
              <div>
                <label className="f-label" htmlFor="inv-your-ref">Deres referanse</label>
                <input id="inv-your-ref" type="text" value={yourReference} onChange={(e) => setYourReference(e.target.value)} className="f-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>

            <details open={hasExtraFields || undefined}>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--f-text-soft)' }}>Flere felt</summary>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 12 }}>
                <div>
                  <label className="f-label">Startdato</label>
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="dd.mm.yyyy" className="f-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="f-label">Sluttdato</label>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="dd.mm.yyyy" className="f-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="f-label" htmlFor="inv-our-ref">Vår referanse</label>
                  <input id="inv-our-ref" type="text" value={ourReference} onChange={(e) => setOurReference(e.target.value)} className="f-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="f-label" htmlFor="inv-del-ref">Leveringsreferanse</label>
                  <input id="inv-del-ref" type="text" value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} className="f-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="f-label" htmlFor="inv-ref">Referanse</label>
                  <input id="inv-ref" type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="f-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end" style={{ paddingBottom: 8 }}>
                  <Checkbox checked={credited} onChange={setCredited} label="Kreditert" />
                </div>
              </div>
            </details>
          </section>

          {/* Lines */}
          <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={cardTitle}>Linjer *</h2>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 560 }}>
                <div className="grid" style={{ gridTemplateColumns: lineCols, gap: 8, padding: '8px 0', borderBottom: '1px solid var(--f-border)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--f-text-subtle)' }}>
                  <span style={{ paddingLeft: 10 }}>Beskrivelse</span>
                  <span>Antall</span>
                  <span>Pris</span>
                  <span>MVA %</span>
                  <span style={{ textAlign: 'right' }}>Sum</span>
                  <span />
                </div>
                {items.length === 0 && (
                  <p style={{ margin: 0, padding: '18px 10px', fontSize: 14, color: 'var(--f-text-subtle)' }}>
                    Ingen linjer ennå. Legg til en ny linje eller velg fra produkter.
                  </p>
                )}
                {items.map((item, index) => (
                  <div key={item.id} className="grid items-center" style={{ gridTemplateColumns: lineCols, gap: 8, padding: '6px 0', borderBottom: '1px solid var(--f-border-faint)' }}>
                    <input
                      type="text"
                      aria-label={`Beskrivelse, linje ${index + 1}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Beskrivelse"
                      className="f-input w-full rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" min="0"
                      aria-label={`Antall, linje ${index + 1}`}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="f-input f-num w-full rounded-lg px-2 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" min="0"
                      aria-label={`Pris, linje ${index + 1}`}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="f-input f-num w-full rounded-lg px-2 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" min="0" max="100"
                      aria-label={`MVA prosent, linje ${index + 1}`}
                      value={(item.vatRate * 100).toFixed(0)}
                      onChange={(e) => handleItemChange(item.id, 'vatRate', (parseFloat(e.target.value) || 0) / 100)}
                      className="f-input f-num w-full rounded-lg px-2 py-2 text-sm"
                    />
                    <span className="f-num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--f-text)', whiteSpace: 'nowrap' }}>
                      {num(item.quantity * item.unitPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Fjern linje ${index + 1}`}
                      className="f-line-remove flex items-center justify-center"
                      style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--f-text-subtle)', cursor: 'pointer' }}
                    >
                      <IconTrash size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap" style={{ gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                onClick={handleAddBlankItem}
                className="flex items-center"
                style={{ height: 40, padding: '0 14px', gap: 8, borderRadius: 10, border: '1px dashed var(--f-border-strong)', background: 'var(--f-surface)', color: 'var(--f-text)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                <IconPlus size={14} stroke={2.4} aria-hidden="true" />
                Ny linje
              </button>
              <button
                type="button"
                aria-expanded={showProducts}
                onClick={() => setShowProducts((v) => !v)}
                className="f-btn-ghost"
                style={{ height: 40, padding: '0 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                Fra produkter{activeProducts.length ? ` (${activeProducts.length})` : ''}
              </button>
            </div>
            {showProducts && (
              activeProducts.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--f-text-subtle)' }}>Ingen produkter tilgjengelig</p>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {activeProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="f-pick-row flex items-center text-left"
                      style={{ gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--f-border)', background: 'var(--f-surface)', color: 'var(--f-text)', cursor: 'pointer', font: 'inherit' }}
                    >
                      <span className="flex flex-col" style={{ minWidth: 0, flexGrow: 1 }}>
                        <span className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{product.name}</span>
                        <span className="f-num" style={{ fontSize: 12, color: 'var(--f-text-soft)' }}>
                          {formatCurrency(product.unit_price || 0)}{product.unit ? ` / ${product.unit}` : ''}
                        </span>
                      </span>
                      <IconPlus size={16} aria-hidden="true" style={{ color: 'var(--f-text-subtle)', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )
            )}
          </section>

          {/* Notes + totals */}
          <section className="flex flex-wrap" style={{ ...card, gap: 24, justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 260px' }}>
              <label className="f-label" htmlFor="inv-notes">Notater</label>
              <textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Valgfrie notater..."
                className="f-input w-full rounded-xl px-3 py-2 text-sm"
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="flex flex-col" style={{ flex: '0 1 280px', gap: 8, fontSize: 14 }}>
              <div className="flex justify-between" style={{ color: 'var(--f-text-soft)' }}>
                <span>Netto</span>
                <span className="f-num" style={{ color: 'var(--f-text)' }}>{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--f-text-soft)' }}>
                <span>MVA</span>
                <span className="f-num" style={{ color: 'var(--f-text)' }}>{formatCurrency(calculations.vatTotal)}</span>
              </div>
              <div className="flex justify-between items-baseline" style={{ borderTop: '1px solid var(--f-border)', paddingTop: 10 }}>
                <span style={{ fontWeight: 600, color: 'var(--f-text)' }}>Å betale</span>
                <span className="f-num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--f-text)' }}>{formatCurrency(calculations.total)}</span>
              </div>
            </div>
          </section>
        </form>

        {/* Live preview — always drawn as paper, in both themes */}
        <aside aria-label="Forhåndsvisning" className="flex flex-col" style={{ flex: '1 1 420px', minWidth: 0, gap: 10 }}>
          <div className="flex items-baseline justify-between" style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--f-text)' }}>Forhåndsvisning</span>
            <span style={{ color: 'var(--f-text-subtle)' }}>Ferdig PDF følger valgt mal</span>
          </div>
          <div
            className="flex flex-col"
            style={{
              background: '#FFFFFF', color: '#15171A', borderRadius: 6, padding: '36px 36px 28px', gap: 26, fontSize: 12,
              boxShadow: '0 1px 2px rgba(21,23,26,0.06), 0 12px 32px rgba(21,23,26,0.08)',
            }}
          >
            <div className="flex justify-between items-start" style={{ gap: 16 }}>
              <div className="flex flex-col" style={{ gap: 4, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--f-font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
                  {company?.name || 'Ditt firma'}
                </span>
                {companyLine && <span style={{ color: '#4A4F57' }}>{companyLine}</span>}
              </div>
              <div className="flex flex-col" style={{ gap: 4, textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--f-font-display)', fontWeight: 600, fontSize: 22 }}>{credited ? 'Kreditnota' : 'Faktura'}</span>
                <span className="f-num" style={{ color: '#4A4F57' }}>{invoiceNumber ? `Nr. ${invoiceNumber}` : 'Nummer tildeles ved lagring'}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between" style={{ gap: 16 }}>
              <div className="flex flex-col" style={{ gap: 3, minWidth: 0 }}>
                <span style={cap}>Til</span>
                {selectedCustomer ? (
                  <>
                    <span style={{ fontWeight: 600 }}>{selectedCustomer.name}</span>
                    {yourReference && <span style={{ color: '#4A4F57' }}>Att: {yourReference}</span>}
                    {customerAddress && <span style={{ color: '#4A4F57' }}>{customerAddress}</span>}
                  </>
                ) : (
                  <span style={{ color: '#62666E' }}>Velg en kunde</span>
                )}
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'auto auto', gap: '3px 16px', alignContent: 'start' }}>
                <span style={{ color: '#62666E' }}>Fakturadato</span>
                <span className="f-num" style={{ textAlign: 'right' }}>{invoiceDate ? formatDate(invoiceDate) : '—'}</span>
                <span style={{ color: '#62666E' }}>Forfall</span>
                <span className="f-num" style={{ textAlign: 'right', fontWeight: 600 }}>{dueDate ? formatDate(dueDate) : '—'}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 50px 80px 90px', gap: 8, paddingBottom: 6, borderBottom: '1.5px solid #15171A', ...cap }}>
                <span>Beskrivelse</span>
                <span style={{ textAlign: 'right' }}>Ant.</span>
                <span style={{ textAlign: 'right' }}>Pris</span>
                <span style={{ textAlign: 'right' }}>Sum</span>
              </div>
              {items.length === 0 ? (
                <div style={{ padding: '14px 0', color: '#62666E', borderBottom: '1px solid #EFECE5' }}>Ingen linjer ennå</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 50px 80px 90px', gap: 8, padding: '8px 0', borderBottom: '1px solid #EFECE5' }}>
                    <span style={{ overflowWrap: 'anywhere' }}>{item.description || '—'}</span>
                    <span className="f-num" style={{ textAlign: 'right' }}>{item.quantity}</span>
                    <span className="f-num" style={{ textAlign: 'right' }}>{num(item.unitPrice)}</span>
                    <span className="f-num" style={{ textAlign: 'right' }}>{num(item.quantity * item.unitPrice)}</span>
                  </div>
                ))
              )}
              <div className="flex flex-col" style={{ alignSelf: 'flex-end', width: 210, gap: 4, paddingTop: 12 }}>
                <div className="flex justify-between" style={{ color: '#4A4F57' }}><span>Netto</span><span className="f-num">{num(calculations.subtotal)}</span></div>
                <div className="flex justify-between" style={{ color: '#4A4F57' }}><span>MVA</span><span className="f-num">{num(calculations.vatTotal)}</span></div>
                <div className="flex justify-between" style={{ paddingTop: 6, borderTop: '1.5px solid #15171A', fontWeight: 600, fontSize: 14 }}>
                  <span>Å betale NOK</span><span className="f-num">{num(calculations.total)}</span>
                </div>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, padding: '14px 16px', background: '#F4F2EC', borderRadius: 6 }}>
              <div className="flex flex-col" style={{ gap: 3 }}>
                <span style={cap}>Kontonr.</span>
                <span className="f-num">{company?.account_number || '—'}</span>
              </div>
              <div className="flex flex-col" style={{ gap: 3 }}>
                <span style={cap}>Forfall</span>
                <span className="f-num" style={{ fontWeight: 600 }}>{dueDate ? formatDate(dueDate) : '—'}</span>
              </div>
            </div>
            {notes.trim() && <span style={{ color: '#4A4F57', whiteSpace: 'pre-wrap' }}>{notes}</span>}
          </div>
        </aside>
      </div>
    </div>
  );
}
