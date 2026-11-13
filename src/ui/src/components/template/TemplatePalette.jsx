import { useTranslation } from 'react-i18next';
import { IconTypography, IconPhoto, IconDatabase, IconLayoutGrid, IconSquare } from '@tabler/icons-react';

export function TemplatePalette({ onAddElement }) {
  const { t } = useTranslation();

  const paletteItems = [
    { type: 'text', label: t('template_editor.element_text'), icon: IconTypography },
    { type: 'field', label: t('template_editor.element_field'), icon: IconDatabase },
    { type: 'image', label: t('template_editor.element_image'), icon: IconPhoto },
    { type: 'table', label: t('template_editor.element_table'), icon: IconLayoutGrid },
    { type: 'shape', label: t('template_editor.element_shape'), icon: IconSquare },
  ];

  return (
    <div className="w-64" style={{ borderRight: '1px solid var(--line)', background: 'rgba(8,16,12,0.6)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--line)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{t('template_editor.palette_title')}</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>{t('template_editor.palette_desc')}</p>
      </div>
      <div className="p-4 space-y-2">
        {paletteItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddElement(item.type)}
              className="flex w-full items-center gap-3 r-md px-4 py-3 text-left transition"
              style={{ border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-soft)'; e.currentTarget.style.borderColor = 'var(--brand-line)'; e.currentTarget.style.color = 'var(--brand-ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)'; }}
            >
              <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--ink-muted)' }} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
