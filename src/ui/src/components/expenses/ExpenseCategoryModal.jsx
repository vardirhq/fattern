import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Select } from '../Select';

export function ExpenseCategoryModal({ isOpen, mode = 'create', initialCategory, onSubmit, onClose, categories = [] }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialCategory?.name || '');
  const [parentId, setParentId] = useState(initialCategory?.parent_id?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    setName(initialCategory?.name || '');
    setParentId(initialCategory?.parent_id?.toString() || '');
    setError('');
    setSaving(false);
  }, [isOpen, initialCategory, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('expense_category.name_required'));
      return;
    }

    setSaving(true);
    try {
      await onSubmit?.({
        id: initialCategory?.id,
        name: name.trim(),
        parentId: parentId ? parseInt(parentId) : null,
      });
      onClose?.();
    } catch (err) {
      console.error('Kunne ikke lagre kategori', err);
      const errorMessage = err?.message || t('expense_category.save_error');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit ? t('expense_category.edit_title') : t('expense_category.create_title');
  const modalDescription = isEdit
    ? t('expense_category.edit_desc')
    : t('expense_category.create_desc');

  // Build category hierarchy for display
  const buildCategoryOptions = (cats, parentId = null, level = 0, excludeId = null) => {
    const children = cats.filter((c) => {
      const cParentId = c.parent_id;
      if (cParentId === null || cParentId === undefined || cParentId === 0) {
        return parentId === null;
      }
      return cParentId === parentId;
    });

    const options = [];
    children.forEach((cat) => {
      if (cat.id === excludeId) return; // Skip the category being edited
      const indent = '  '.repeat(level);
      const prefix = level > 0 ? '└ ' : '';
      options.push({
        value: cat.id.toString(),
        label: `${indent}${prefix}${cat.name}`,
        level, // Store level for custom rendering if needed
      });
      // Recursively add children
      const childOptions = buildCategoryOptions(cats, cat.id, level + 1, excludeId);
      options.push(...childOptions);
    });
    return options;
  };

  // Filter out the current category and its children from parent options (to prevent circular references)
  const availableParentOptions = buildCategoryOptions(
    categories,
    null,
    0,
    isEdit ? initialCategory?.id : null
  );

  const parentOptions = [
    { value: '', label: t('expense_category.no_parent') },
    ...availableParentOptions,
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={modalDescription}
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
            form="expense-category-form"
            className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold disabled-dim"
            disabled={saving}
          >
            {saving ? t('expense_category.saving') : isEdit ? t('expense_category.save_changes') : t('expense_category.create_button')}
          </button>
        </>
      }
    >
      <form id="expense-category-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('expense_category.name_label')}</label>
          <input
            className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('expense_category.name_placeholder')}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('expense_category.parent_label')}</label>
          <Select
            value={parentId}
            onChange={setParentId}
            options={parentOptions}
            placeholder={t('expense_category.parent_placeholder')}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
            {t('expense_category.parent_hint')}
          </p>
        </div>

        {error ? <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p> : null}
      </form>
    </Modal>
  );
}
