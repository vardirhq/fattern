import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { UnitSelect } from '../Select';
import { ImageUpload } from '../ImageUpload';

export function ProductModal({ isOpen, mode = 'create', initialProduct, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [unitPrice, setUnitPrice] = useState(initialProduct?.unit_price || '');
  const [vatRate, setVatRate] = useState(
    initialProduct?.vat_rate != null ? (initialProduct.vat_rate * 100).toFixed(0) : '25'
  );
  const [unit, setUnit] = useState(initialProduct?.unit || '');
  const [active, setActive] = useState(initialProduct?.active !== undefined ? Boolean(initialProduct.active) : true);
  const [imagePath, setImagePath] = useState(initialProduct?.image_path || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    setName(initialProduct?.name || '');
    setSku(initialProduct?.sku || '');
    setDescription(initialProduct?.description || '');
    setUnitPrice(initialProduct?.unit_price || '');
    setVatRate(
      initialProduct?.vat_rate != null ? (initialProduct.vat_rate * 100).toFixed(0) : '25'
    );
    setUnit(initialProduct?.unit || '');
    setActive(initialProduct?.active !== undefined ? Boolean(initialProduct.active) : true);
    setImagePath(initialProduct?.image_path || '');
    setError('');
    setSaving(false);
  }, [isOpen, initialProduct, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('product_modal.name_required'));
      return;
    }

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      setError(t('product_modal.price_invalid'));
      return;
    }

    const vat = parseFloat(vatRate);
    if (isNaN(vat) || vat < 0 || vat > 100) {
      setError(t('product_modal.vat_invalid'));
      return;
    }

    setSaving(true);
    try {
      await onSubmit?.({
        id: initialProduct?.id,
        name: name.trim(),
        sku: sku.trim() || null,
        description: description.trim() || null,
        unitPrice: price,
        vatRate: vat / 100,
        unit: unit.trim() || null,
        active,
        imagePath: imagePath || null,
      });
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke lagre produkt', err);
      setError(t('common.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('product_modal.edit_title') : t('product_modal.create_title')}
      description={isEdit ? t('product_modal.edit_desc') : t('product_modal.create_desc')}
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
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="product-form"
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
            disabled={saving}
          >
            {saving ? t('common.saving') : isEdit ? t('common.save_changes') : t('product_modal.create_button')}
          </button>
        </>
      }
    >
      <form id="product-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('product_modal.name_label')}</label>
          <input
            className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('product_modal.name_placeholder')}
            required
          />
        </div>

        <div className="grid gap-4 md-grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>SKU</label>
            <input
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder={t('product_modal.sku_placeholder')}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('product_modal.unit_label')}</label>
            <UnitSelect value={unit || ''} onChange={setUnit} placeholder={t('product_modal.unit_placeholder')} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('product_modal.description_label')}</label>
          <textarea
            className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('product_modal.description_placeholder')}
            rows={3}
          />
        </div>

        <div>
          <ImageUpload value={imagePath} onChange={setImagePath} label={t('product_modal.image_label')} />
        </div>

        <div className="grid gap-4 md-grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('product_modal.price_label')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('product_modal.vat_label')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              placeholder="25"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>{t('product_modal.vat_hint')}</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            className="h-4 w-4 r-sm"
            style={{ accentColor: 'var(--brand)' }}
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          {t('product_modal.active_label')}
        </label>

        {error ? <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p> : null}
      </form>
    </Modal>
  );
}
