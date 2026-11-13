import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { ImageUpload } from '../ImageUpload';

export function CustomerModal({ isOpen, mode = 'create', initialCustomer, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialCustomer?.name || '');
  const [contactName, setContactName] = useState(initialCustomer?.contact_name || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [address, setAddress] = useState(initialCustomer?.address || '');
  const [orgNumber, setOrgNumber] = useState(initialCustomer?.org_number || '');
  const [postNumber, setPostNumber] = useState(initialCustomer?.post_number || '');
  const [postLocation, setPostLocation] = useState(initialCustomer?.post_location || '');
  const [vatExempt, setVatExempt] = useState(Boolean(initialCustomer?.vat_exempt));
  const [active, setActive] = useState(initialCustomer?.active !== undefined ? Boolean(initialCustomer.active) : true);
  const [imagePath, setImagePath] = useState(initialCustomer?.image_path || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    setName(initialCustomer?.name || '');
    setContactName(initialCustomer?.contact_name || '');
    setEmail(initialCustomer?.email || '');
    setPhone(initialCustomer?.phone || '');
    setAddress(initialCustomer?.address || '');
    setOrgNumber(initialCustomer?.org_number || '');
    setPostNumber(initialCustomer?.post_number || '');
    setPostLocation(initialCustomer?.post_location || '');
    setVatExempt(Boolean(initialCustomer?.vat_exempt));
    setActive(initialCustomer?.active !== undefined ? Boolean(initialCustomer.active) : true);
    setImagePath(initialCustomer?.image_path || '');
    setError('');
    setSaving(false);
  }, [isOpen, initialCustomer, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('customer_modal.name_required'));
      return;
    }

    setSaving(true);
    try {
      await onSubmit?.({
        id: initialCustomer?.id,
        name: name.trim(),
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        orgNumber: orgNumber.trim() || null,
        postNumber: postNumber.trim() || null,
        postLocation: postLocation.trim() || null,
        vatExempt,
        active,
        imagePath: imagePath || null,
      });
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke lagre kunde', err);
      setError(t('common.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('customer_modal.edit_title') : t('customer_modal.create_title')}
      description={isEdit ? t('customer_modal.edit_desc') : t('customer_modal.create_desc')}
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
            form="customer-form"
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
            disabled={saving}
          >
            {saving ? t('common.saving') : isEdit ? t('common.save_changes') : t('customer_modal.create_button')}
          </button>
        </>
      }
    >
      <form id="customer-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.name_label')}</label>
          <input
            className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('customer_modal.name_placeholder')}
            required
          />
        </div>

        <div className="grid gap-4 md-grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.contact_label')}</label>
            <input
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={t('customer_modal.contact_placeholder')}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.org_number_label')}</label>
            <input
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={orgNumber}
              onChange={(e) => setOrgNumber(e.target.value)}
              placeholder="123 456 789"
            />
          </div>
        </div>

        <div className="grid gap-4 md-grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.email_label')}</label>
            <input
              type="email"
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kunde@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.phone_label')}</label>
            <input
              type="tel"
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+47 123 45 678"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.address_label')}</label>
          <input
            className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('customer_modal.address_placeholder')}
          />
        </div>

        <div className="grid gap-4 md-grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.post_number_label')}</label>
            <input
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={postNumber}
              onChange={(e) => setPostNumber(e.target.value)}
              placeholder="0001"
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('customer_modal.post_location_label')}</label>
            <input
              className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              placeholder="Oslo"
            />
          </div>
        </div>

        <div>
          <ImageUpload value={imagePath} onChange={setImagePath} label={t('customer_modal.image_label')} />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
            <input
              type="checkbox"
              className="h-4 w-4 r-sm" style={{ accentColor: 'var(--brand)' }}
              checked={vatExempt}
              onChange={(e) => setVatExempt(e.target.checked)}
            />
            {t('customer_modal.vat_exempt_label')}
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
            <input
              type="checkbox"
              className="h-4 w-4 r-sm" style={{ accentColor: 'var(--brand)' }}
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            {t('customer_modal.active_label')}
          </label>
        </div>

        {error ? <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p> : null}
      </form>
    </Modal>
  );
}
