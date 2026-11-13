import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { ExpenseCategoryModal } from './ExpenseCategoryModal';

export function ExpenseCategoryManagementModal({ isOpen, onClose, categories = [], onCreateCategory, onEditCategory, onDeleteCategory }) {
  const { t } = useTranslation();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryModalMode, setCategoryModalMode] = useState('create');

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalMode('create');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryModalMode('edit');
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (payload) => {
    try {
      if (categoryModalMode === 'edit' && payload.id) {
        await onEditCategory?.(payload);
      } else {
        await onCreateCategory?.(payload);
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  // Build category tree
  const categoryTree = categories.reduce((acc, cat) => {
    if (!cat.parent_id) {
      acc.push({ ...cat, children: [] });
    } else {
      const parent = acc.find((p) => p.id === cat.parent_id);
      if (parent) {
        parent.children.push(cat);
      } else {
        acc.push({ ...cat, children: [] });
      }
    }
    return acc;
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('expense_category.management_title')}
        description={t('expense_category.management_desc')}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              className="text-sm font-medium transition"
              style={{ color: 'var(--ink-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
              onClick={onClose}
            >
              {t('common.close')}
            </button>
            <button
              type="button"
              onClick={openCreateCategory}
              className="ft-btn ft-btn-primary r-lg px-5 py-2 text-sm font-semibold"
            >
              {t('expense_category.new_category')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {categoryTree.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{t('expense_category.empty')}</p>
          ) : (
            <div className="space-y-2">
              {categoryTree.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between r-md px-4 py-3" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: category.color || '#888888',
                              flexShrink: 0,
                              display: 'inline-block',
                            }}
                          />
                          {category.name}
                        </span>
                      </p>
                      {category.children.length > 0 && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {t('expense_category.subcategories', { count: category.children.length })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditCategory(category)}
                        className="text-sm font-medium transition"
                        style={{ color: 'var(--brand-ink)' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory?.(category)}
                        className="text-sm font-medium transition"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                  {category.children.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {category.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between r-md px-4 py-2" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
                          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: child.color || '#888888',
                                  flexShrink: 0,
                                  display: 'inline-block',
                                }}
                              />
                              {child.name}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditCategory(child)}
                              className="text-sm font-medium transition"
                              style={{ color: 'var(--brand-ink)' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCategory?.(child)}
                              className="text-sm font-medium transition"
                              style={{ color: 'var(--danger)' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      <ExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        mode={categoryModalMode}
        initialCategory={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        categories={categories}
      />
    </>
  );
}
