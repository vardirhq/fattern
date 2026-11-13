import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconDeviceFloppy, IconTag, IconUser, IconLink, IconInfoCircle, IconFileText } from '@tabler/icons-react';
import { Modal } from '../Modal';

export function TemplateSettingsModal({ isOpen, onClose, template, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    author: '',
    authorUrl: '',
    version: '',
    tags: [],
    license: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (template && template.meta) {
      setFormData({
        name: template.meta.name || '',
        description: template.meta.description || '',
        author: template.meta.author || '',
        authorUrl: template.meta.authorUrl || '',
        version: template.meta.version || '1.0.0',
        tags: template.meta.tags || [],
        license: template.meta.license || '',
      });
    }
  }, [template, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!template || !template.meta) return;

    // Update template metadata
    const updatedTemplate = {
      ...template,
      meta: {
        ...template.meta,
        ...formData,
        // Ensure required fields
        id: template.meta.id,
        updatedAt: new Date().toISOString(),
      },
    };

    onSave(updatedTemplate);
    onClose();
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmed],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen || !template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('template_settings.title')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <IconFileText className="h-4 w-4" />
            {t('template_settings.basic_info')}
          </h3>

          <div>
            <label className="block text-xs font-medium mb-1-5" style={{ color: 'var(--ink-muted)' }}>
              {t('template_settings.name_label')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="ft-input w-full r-md px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1-5" style={{ color: 'var(--ink-muted)' }}>
              {t('template_settings.description_label')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="ft-input w-full r-md px-3 py-2 text-sm resize-none"
              placeholder={t('template_settings.description_placeholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1-5" style={{ color: 'var(--ink-muted)' }}>
              {t('template_settings.version_label')}
            </label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="ft-input w-full r-md px-3 py-2 text-sm font-mono"
              placeholder="1.0.0"
              required
              pattern="^\d+\.\d+\.\d+(-.+)?$"
              title={t('template_settings.version_pattern_hint')}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>{t('template_settings.version_hint')}</p>
          </div>
        </div>

        {/* Author Information */}
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <IconUser className="h-4 w-4" />
            {t('template_settings.author_section')}
          </h3>

          <div>
            <label className="block text-xs font-medium mb-1-5" style={{ color: 'var(--ink-muted)' }}>
              {t('template_settings.author_label')}
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="ft-input w-full r-md px-3 py-2 text-sm"
              placeholder={t('template_settings.author_placeholder')}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>{t('template_settings.author_hint')}</p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-medium mb-1-5" style={{ color: 'var(--ink-muted)' }}>
              <IconLink className="h-3 w-3" />
              {t('template_settings.author_url_label')}
            </label>
            <input
              type="url"
              value={formData.authorUrl}
              onChange={(e) => setFormData({ ...formData, authorUrl: e.target.value })}
              className="ft-input w-full r-md px-3 py-2 text-sm"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <IconTag className="h-4 w-4" />
            {t('template_settings.tags_section')}
          </h3>

          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="ft-input flex-1 r-md px-3 py-2 text-sm"
                placeholder={t('template_settings.tag_placeholder')}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="ft-btn ft-btn-secondary r-md px-4 py-2 text-sm font-medium transition"
              >
                {t('template_settings.add_tag')}
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1-5 r-full px-2-5 py-1 text-xs font-medium"
                    style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="transition"
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* License */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--line)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--ink)' }}>
            <IconInfoCircle className="h-4 w-4" />
            {t('template_settings.license_section')}
          </h3>

          <div>
            <label className="block text-xs font-medium mb-1-5" style={{ color: 'var(--ink-muted)' }}>
              {t('template_settings.license_label')}
            </label>
            <input
              type="text"
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
              className="ft-input w-full r-md px-3 py-2 text-sm"
              placeholder={t('template_settings.license_placeholder')}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>{t('template_settings.license_hint')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
          <button
            type="button"
            onClick={onClose}
            className="ft-btn ft-btn-secondary r-md px-4 py-2 text-sm font-medium transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="ft-btn ft-btn-primary r-md px-4 py-2 text-sm font-medium transition flex items-center gap-2"
          >
            <IconDeviceFloppy className="h-4 w-4" />
            {t('template_settings.save_button')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
