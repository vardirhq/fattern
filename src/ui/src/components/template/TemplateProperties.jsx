import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../Select';
import { ImageUpload } from '../ImageUpload';
import { IconStack, IconTypography, IconPhoto, IconTable, IconSettings } from '@tabler/icons-react';

export function TemplateProperties({ element, onUpdate, template }) {
  const { t } = useTranslation();
  const [localUpdates, setLocalUpdates] = useState({});
  const [activeTab, setActiveTab] = useState('position');

  // Field bindings defined inside component to use t()
  const FIELD_BINDINGS = [
    { value: 'invoice.invoice_number', label: t('template_props.binding_invoice_number') },
    { value: 'invoice.invoice_date', label: t('template_props.binding_invoice_date') },
    { value: 'invoice.due_date', label: t('template_props.binding_due_date') },
    { value: 'invoice.kid', label: t('template_props.binding_kid') },
    { value: 'invoice.status', label: t('template_props.binding_status') },
    { value: 'invoice.total', label: t('template_props.binding_total') },
    { value: 'invoice.subtotal', label: t('template_props.binding_subtotal') },
    { value: 'invoice.vat_total', label: t('template_props.binding_vat') },
    { value: 'customer.name', label: t('template_props.binding_customer_name') },
    { value: 'customer.org_number', label: t('template_props.binding_customer_org') },
    { value: 'customer.address', label: t('template_props.binding_customer_address') },
    { value: 'company.name', label: t('template_props.binding_company_name') },
    { value: 'company.org_number', label: t('template_props.binding_company_org') },
    { value: 'company.address', label: t('template_props.binding_company_address') },
    { value: 'company.account_number', label: t('template_props.binding_account_number') },
  ];

  useEffect(() => {
    setLocalUpdates({});
    setActiveTab('position'); // Reset to position tab when element changes
  }, [element?.id]);

  if (!element) {
    return (
      <div className="w-80 flex flex-col h-full" style={{ borderLeft: '1px solid var(--line)', background: 'rgba(8,16,12,0.6)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{t('template_props.title')}</h2>
        </div>
        <div className="p-4">
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{t('template_props.no_selection')}</p>
        </div>
      </div>
    );
  }

  const applyUpdate = (updates) => {
    // Apply updates immediately and clear localUpdates
    // This prevents accumulated updates from being applied incorrectly
    const combined = { ...localUpdates, ...updates };
    setLocalUpdates({});
    onUpdate(combined);
  };

  // Determine available tabs based on element type
  const tabs = [
    { id: 'position', label: t('template_props.tab_position'), icon: IconStack },
    ...(element.type === 'text' || element.type === 'field'
      ? [{ id: 'content', label: t('template_props.tab_content'), icon: IconTypography }]
      : []),
    ...(element.type === 'text' || element.type === 'field'
      ? [{ id: 'typography', label: t('template_props.tab_typography'), icon: IconTypography }]
      : []),
    ...(element.type === 'image'
      ? [{ id: 'image', label: t('template_props.tab_image'), icon: IconPhoto }]
      : []),
    ...(element.type === 'table'
      ? [{ id: 'table', label: t('template_props.tab_table'), icon: IconTable }]
      : []),
    ...(element.type === 'shape'
      ? [{ id: 'shape', label: t('template_props.tab_shape'), icon: IconSettings }]
      : []),
    { id: 'style', label: t('template_props.tab_style'), icon: IconSettings },
  ];
  const elementTypeLabel = {
    text: t('template_editor.element_text'),
    field: t('template_editor.element_field'),
    image: t('template_editor.element_image'),
    table: t('template_editor.element_table'),
    shape: t('template_editor.element_shape'),
  }[element.type] || element.type;

  return (
    <div className="w-80 flex flex-col h-full" style={{ borderLeft: '1px solid var(--line)', background: 'rgba(8,16,12,0.6)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--line)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{t('template_props.title')}</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>{elementTypeLabel}</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--line)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1-5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: isActive ? 'var(--brand)' : 'transparent',
                color: isActive ? 'var(--brand-ink)' : 'var(--ink-muted)',
                background: isActive ? 'rgba(47,75,216,0.06)' : 'transparent',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.background = 'var(--hover)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.background = 'transparent'; } }}
            >
              <Icon className="h-3-5 w-3-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Position Tab */}
        {activeTab === 'position' && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
              {t('template_props.tab_position')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>X</label>
                <input
                  type="number"
                  value={element.x}
                  onChange={(e) => applyUpdate({ x: parseFloat(e.target.value) || 0 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>Y</label>
                <input
                  type="number"
                  value={element.y}
                  onChange={(e) => applyUpdate({ y: parseFloat(e.target.value) || 0 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.width')}</label>
                <input
                  type="number"
                  value={element.width}
                  onChange={(e) => applyUpdate({ width: parseFloat(e.target.value) || 0 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.height')}</label>
                <input
                  type="number"
                  value={element.height}
                  onChange={(e) => applyUpdate({ height: parseFloat(e.target.value) || 0 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.z_index')}</label>
                <input
                  type="number"
                  value={element.zIndex ?? 1}
                  onChange={(e) => applyUpdate({ zIndex: parseInt(e.target.value) || 1 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {t('template_props.z_index_hint')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab (Text/Field) */}
        {activeTab === 'content' && (element.type === 'text' || element.type === 'field') && (
          <div>
            {element.type === 'text' && (
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.content')}</label>
                <textarea
                  value={element.content || ''}
                  onChange={(e) => applyUpdate({ content: e.target.value })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                  rows={6}
                />
              </div>
            )}

            {element.type === 'field' && (
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.field_binding')}</label>
                <Select
                  value={element.binding || ''}
                  onChange={(value) => applyUpdate({ binding: value })}
                  options={FIELD_BINDINGS}
                />
              </div>
            )}
          </div>
        )}

        {/* Typography Tab (Text/Field) */}
        {activeTab === 'typography' && (element.type === 'text' || element.type === 'field') && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
              {t('template_props.tab_typography')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.font')}</label>
                <select
                  value={element.fontFamily || 'Inter'}
                  onChange={(e) => applyUpdate({ fontFamily: e.target.value })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                >
                  <option value="Inter">Inter</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.font_size')}</label>
                <input
                  type="number"
                  value={element.fontSize || 14}
                  onChange={(e) => applyUpdate({ fontSize: parseFloat(e.target.value) || 14 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.font_weight')}</label>
                <select
                  value={element.fontWeight || 400}
                  onChange={(e) => applyUpdate({ fontWeight: parseInt(e.target.value) || 400 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                >
                  <option value={300}>{t('template_props.weight_light')} (300)</option>
                  <option value={400}>{t('template_props.weight_normal')} (400)</option>
                  <option value={500}>{t('template_props.weight_medium')} (500)</option>
                  <option value={600}>{t('template_props.weight_semibold')} (600)</option>
                  <option value={700}>{t('template_props.weight_bold')} (700)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.color')}</label>
                <input
                  type="color"
                  value={element.color || '#0d3e51'}
                  onChange={(e) => applyUpdate({ color: e.target.value })}
                  className="h-10 w-full r-md" style={{ border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.align')}</label>
                <select
                  value={element.align || 'left'}
                  onChange={(e) => applyUpdate({ align: e.target.value })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                >
                  <option value="left">{t('template_props.align_left')}</option>
                  <option value="center">{t('template_props.align_center')}</option>
                  <option value="right">{t('template_props.align_right')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.line_height')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={element.lineHeight || 1.5}
                  onChange={(e) => applyUpdate({ lineHeight: parseFloat(e.target.value) || 1.5 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.letter_spacing')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={element.letterSpacing || 0}
                  onChange={(e) => applyUpdate({ letterSpacing: parseFloat(e.target.value) || 0 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.text_style')}</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1-5">
                    <input
                      type="checkbox"
                      checked={element.fontStyle === 'italic'}
                      onChange={(e) => applyUpdate({ fontStyle: e.target.checked ? 'italic' : 'normal' })}
                      className="r-sm"
                    />
                    <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.italic')}</span>
                  </label>
                  <label className="flex items-center gap-1-5">
                    <input
                      type="checkbox"
                      checked={element.textDecoration === 'underline'}
                      onChange={(e) => applyUpdate({ textDecoration: e.target.checked ? 'underline' : 'none' })}
                      className="r-sm"
                    />
                    <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.underline')}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.text_transform')}</label>
                <select
                  value={element.textTransform || 'none'}
                  onChange={(e) => applyUpdate({ textTransform: e.target.value })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                >
                  <option value="none">{t('template_props.transform_none')}</option>
                  <option value="uppercase">{t('template_props.transform_uppercase')}</option>
                  <option value="lowercase">{t('template_props.transform_lowercase')}</option>
                  <option value="capitalize">{t('template_props.transform_capitalize')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Image Tab */}
        {activeTab === 'image' && element.type === 'image' && (
          <div className="space-y-4">
            <div>
              <ImageUpload
                value={element.src || ''}
                onChange={async (imagePath) => {
                  // Only update if the value actually changed
                  if (imagePath !== (element.src || '')) {
                    applyUpdate({ src: imagePath });
                  }
                }}
                templateId={template?.meta?.id || template?.id}
                elementId={element.id}
                label={t('template_props.tab_image')}
                maxSizeMB={10}
              />
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--line)' }}>
              <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.image_url_label')}</label>
              <input
                type="text"
                value={element.src || ''}
                onChange={(e) => applyUpdate({ src: e.target.value })}
                placeholder={t('template_props.image_url_placeholder')}
                className="ft-input w-full r-md px-3 py-2 text-sm"
              />
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--line)' }}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={element.preserveAspectRatio !== false}
                  onChange={(e) => applyUpdate({ preserveAspectRatio: e.target.checked })}
                  className="r-sm"
                />
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.preserve_aspect')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Table Tab */}
        {activeTab === 'table' && element.type === 'table' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.binding')}</label>
              <Select
                value={element.binding || 'invoice.items'}
                onChange={(value) => applyUpdate({ binding: value })}
                options={[{ value: 'invoice.items', label: t('template_props.binding_invoice_items') }]}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.row_height')}</label>
              <input
                type="number"
                value={element.rowHeight || 18}
                onChange={(e) => applyUpdate({ rowHeight: parseFloat(e.target.value) || 18 })}
                className="ft-input w-full r-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.max_rows')}</label>
              <input
                type="number"
                value={element.maxRows || 15}
                onChange={(e) => applyUpdate({ maxRows: parseInt(e.target.value) || 15 })}
                className="ft-input w-full r-md px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid var(--line)' }}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                {t('template_props.table_header')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.background_color')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={element.headerBackgroundColor || '#0d3e51'}
                      onChange={(e) => applyUpdate({ headerBackgroundColor: e.target.value })}
                      className="h-10 w-20 r-md" style={{ border: '1px solid var(--line)' }}
                    />
                    <input
                      type="text"
                      value={element.headerBackgroundColor || '#0d3e51'}
                      onChange={(e) => applyUpdate({ headerBackgroundColor: e.target.value })}
                      placeholder="#0d3e51"
                      className="ft-input flex-1 r-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.text_color')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={element.headerTextColor || '#ffffff'}
                      onChange={(e) => applyUpdate({ headerTextColor: e.target.value })}
                      className="h-10 w-20 r-md" style={{ border: '1px solid var(--line)' }}
                    />
                    <input
                      type="text"
                      value={element.headerTextColor || '#ffffff'}
                      onChange={(e) => applyUpdate({ headerTextColor: e.target.value })}
                      placeholder="#ffffff"
                      className="ft-input flex-1 r-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid var(--line)' }}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                {t('template_props.table_body')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.text_color')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={element.rowTextColor || '#0d3e51'}
                      onChange={(e) => applyUpdate({ rowTextColor: e.target.value })}
                      className="h-10 w-20 r-md" style={{ border: '1px solid var(--line)' }}
                    />
                    <input
                      type="text"
                      value={element.rowTextColor || '#0d3e51'}
                      onChange={(e) => applyUpdate({ rowTextColor: e.target.value })}
                      placeholder="#0d3e51"
                      className="ft-input flex-1 r-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shape Tab */}
        {activeTab === 'shape' && element.type === 'shape' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.shape_type')}</label>
              <select
                value={element.shapeType || 'rectangle'}
                onChange={(e) => applyUpdate({ shapeType: e.target.value })}
                className="ft-input w-full r-md px-3 py-2 text-sm"
              >
                <option value="rectangle">{t('template_props.shape_rectangle')}</option>
                <option value="circle">{t('template_props.shape_circle')}</option>
                <option value="line">{t('template_props.shape_line')}</option>
              </select>
            </div>
            {element.shapeType === 'line' && (
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {t('template_props.shape_line_hint')}
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {t('template_props.shape_style_hint')}
                </p>
              </div>
            )}
            {element.shapeType !== 'line' && (
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {t('template_props.shape_rect_hint')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Style Tab - All elements */}
        {activeTab === 'style' && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
              {t('template_props.tab_style')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.background_color')}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) => applyUpdate({ backgroundColor: e.target.value })}
                    className="h-10 w-20 r-md" style={{ border: '1px solid var(--line)' }}
                  />
                  <input
                    type="text"
                    value={element.backgroundColor || '#ffffff'}
                    onChange={(e) => applyUpdate({ backgroundColor: e.target.value })}
                    placeholder="#ffffff"
                    className="ft-input flex-1 r-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.opacity')}</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={element.opacity !== undefined ? element.opacity : 1}
                  onChange={(e) => applyUpdate({ opacity: parseFloat(e.target.value) || 1 })}
                  className="ft-input w-full r-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.border')}</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.width')}</label>
                      <input
                        type="number"
                        value={element.borderWidth || 0}
                        onChange={(e) => applyUpdate({ borderWidth: parseFloat(e.target.value) || 0 })}
                        className="ft-input w-full r-md px-2 py-1-5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.color')}</label>
                      <input
                        type="color"
                        value={element.borderColor || '#000000'}
                        onChange={(e) => applyUpdate({ borderColor: e.target.value })}
                        className="h-8 w-full r-md" style={{ border: '1px solid var(--line)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.border_style')}</label>
                    <select
                      value={element.borderStyle || 'solid'}
                      onChange={(e) => applyUpdate({ borderStyle: e.target.value })}
                      className="ft-input w-full r-md px-2 py-1-5 text-sm"
                    >
                      <option value="solid">{t('template_props.border_solid')}</option>
                      <option value="dashed">{t('template_props.border_dashed')}</option>
                      <option value="dotted">{t('template_props.border_dotted')}</option>
                      <option value="none">{t('template_props.none')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.border_radius')}</label>
                    <input
                      type="number"
                      value={element.borderRadius || 0}
                      onChange={(e) => applyUpdate({ borderRadius: parseFloat(e.target.value) || 0 })}
                      className="ft-input w-full r-md px-2 py-1-5 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.padding')}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.padding_top')}</label>
                    <input
                      type="number"
                      value={element.paddingTop || 0}
                      onChange={(e) => applyUpdate({ paddingTop: parseFloat(e.target.value) || 0 })}
                      className="ft-input w-full r-md px-2 py-1-5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.padding_right')}</label>
                    <input
                      type="number"
                      value={element.paddingRight || 0}
                      onChange={(e) => applyUpdate({ paddingRight: parseFloat(e.target.value) || 0 })}
                      className="ft-input w-full r-md px-2 py-1-5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.padding_bottom')}</label>
                    <input
                      type="number"
                      value={element.paddingBottom || 0}
                      onChange={(e) => applyUpdate({ paddingBottom: parseFloat(e.target.value) || 0 })}
                      className="ft-input w-full r-md px-2 py-1-5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.padding_left')}</label>
                    <input
                      type="number"
                      value={element.paddingLeft || 0}
                      onChange={(e) => applyUpdate({ paddingLeft: parseFloat(e.target.value) || 0 })}
                      className="ft-input w-full r-md px-2 py-1-5 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{t('template_props.shadow')}</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>X</label>
                      <input
                        type="number"
                        value={element.boxShadowX || 0}
                        onChange={(e) => applyUpdate({ boxShadowX: parseFloat(e.target.value) || 0 })}
                        className="ft-input w-full r-md px-2 py-1-5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>Y</label>
                      <input
                        type="number"
                        value={element.boxShadowY || 0}
                        onChange={(e) => applyUpdate({ boxShadowY: parseFloat(e.target.value) || 0 })}
                        className="ft-input w-full r-md px-2 py-1-5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.shadow_blur')}</label>
                      <input
                        type="number"
                        value={element.boxShadowBlur || 0}
                        onChange={(e) => applyUpdate({ boxShadowBlur: parseFloat(e.target.value) || 0 })}
                        className="ft-input w-full r-md px-2 py-1-5 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_props.color')}</label>
                    <input
                      type="color"
                      value={element.boxShadowColor || '#000000'}
                      onChange={(e) => applyUpdate({ boxShadowColor: e.target.value })}
                      className="h-8 w-full r-md" style={{ border: '1px solid var(--line)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
