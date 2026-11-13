import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IconCheck, IconEdit, IconDownload, IconLock, IconCopy, IconTrash, IconDotsVertical } from '@tabler/icons-react';
import { renderTemplateToHTML } from '../../utils/templateRenderer';
import { getTemplateId, getTemplateName, getTemplateMeta, isTemplatePremium, isTemplateLocked, isTemplatePreset } from '../../utils/templateUtils';

// Mock data for preview
const mockData = {
  invoice: {
    invoice_number: '2024-001',
    invoice_date: '2024-01-20',
    due_date: '2024-02-20',
    subtotal: 1000.00,
    vat_total: 250.00,
    total: 1250.00,
    items: [
      { description: 'Tjeneste', quantity: 1, unit_price: 750.00, vat_rate: 0.25, line_total: 937.50 },
      { description: 'Produkt', quantity: 1, unit_price: 250.00, vat_rate: 0.25, line_total: 312.50 },
    ],
  },
  customer: {
    name: 'Eksempel Kunde AS',
    address: 'Gateadresse 123',
    post_number: '0123',
    post_location: 'Oslo',
  },
  company: {
    name: 'Ditt Selskap AS',
    org_number: 'NO 999 888 777',
    address: 'Firmaveien 1',
    post_number: '1234',
    post_location: 'Bedriftsby',
    account_number: '1234.56.78901',
  },
};

export function TemplateCard({
  template,
  isDefault,
  isSupporter,
  onSetDefault,
  onEdit,
  onExport,
  onDuplicate,
  onDelete,
}) {
  const { t } = useTranslation();
  const [previewHtml, setPreviewHtml] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iframeRef = useRef(null);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const templateId = getTemplateId(template);
  const templateName = getTemplateName(template);
  const templateMeta = getTemplateMeta(template);
  const isPremium = isTemplatePremium(template);
  const isLocked = isTemplateLocked(template, isSupporter);
  const isPreset = isTemplatePreset(templateId);

  useEffect(() => {
    if (!template) return;

    const processTemplate = async () => {
      try {
        const currentTemplateId = template.meta?.id || template.id;
        const processedElements = await Promise.all(
          template.elements.map(async (element) => {
            if (element.type === 'image' && element.src && !element.src.startsWith('data:') && !element.src.startsWith('http')) {
              if (window.fattern?.template?.readImage) {
                try {
                  const dataURL = await window.fattern.template.readImage(currentTemplateId, element.src);
                  return { ...element, src: dataURL };
                } catch (error) {
                  console.error('Failed to read image:', error);
                  return element;
                }
              }
            }
            return element;
          })
        );

        const processedTemplate = { ...template, elements: processedElements };
        const html = renderTemplateToHTML(processedTemplate, mockData);
        setPreviewHtml(html);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    };

    processTemplate();
  }, [template]);

  useEffect(() => {
    if (!iframeRef.current || !previewHtml) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(previewHtml);
    doc.close();
  }, [previewHtml]);

  useEffect(() => {
    const updatePosition = () => {
      if (showActions && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    };

    const handleClickOutside = (event) => {
      const clickedButton = buttonRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedButton && !clickedMenu) {
        setShowActions(false);
      }
    };

    if (showActions) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActions]);

  return (
    <div
      ref={cardRef}
      className="group relative r-lg overflow-hidden transition-all ft-card"
      style={isLocked
        ? { opacity: 0.7 }
        : isDefault
        ? { borderColor: 'var(--brand-line)', boxShadow: 'none' }
        : {}
      }
    >
      {/* Preview */}
      <div className="relative h-48 overflow-hidden flex items-center justify-center" style={{ background: 'var(--hover)' }}>
        {previewHtml ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <iframe
              ref={iframeRef}
              className="absolute border-0 pointer-events-none"
              style={{
                width: '794px',
                height: '1123px',
                transform: 'scale(0.18)',
                transformOrigin: 'center center',
                left: '50%',
                top: '50%',
                marginLeft: '-397px',
                marginTop: '-561.5px',
              }}
              title={t('settings.templates.preview_aria', { name: templateName })}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--ink-muted)' }}>
            {t('settings.templates.loading_preview')}
          </div>
        )}

        <div className="absolute inset-0 fade-up pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          {isDefault && (
            <span className="inline-flex items-center gap-1 r-full px-2 py-1 text-xs font-semibold" style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)', border: '1px solid var(--brand-line)' }}>
              <IconCheck className="h-3 w-3" />
              {t('settings.templates.badge_default')}
            </span>
          )}
          {isPremium && (
            <span className="inline-flex items-center gap-1 r-full px-2 py-1 text-xs font-semibold" style={{ background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid var(--warning-line)' }}>
              {isLocked && <IconLock className="h-3 w-3" />}
              Premium
            </span>
          )}
          {isPreset && !isPremium && !isDefault && (
            <span className="inline-flex items-center r-full px-2 py-1 text-xs font-medium" style={{ background: 'var(--hover)', color: 'var(--ink-muted)' }}>
              {t('settings.templates.badge_preset')}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate" style={{ color: isLocked ? 'var(--ink-muted)' : 'var(--ink)' }}>
              {templateName}
            </h4>
            {templateMeta.description && (
              <p className="text-xs mt-0-5 line-clamp-2" style={{ color: 'var(--ink-muted)' }}>
                {templateMeta.description}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative ml-2 shrink-0">
            <button
              ref={buttonRef}
              onClick={() => setShowActions(!showActions)}
              className="r-md p-1-5 transition"
              style={{ color: 'var(--ink-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover-strong)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; }}
              title={t('settings.templates.more_actions')}
            >
              <IconDotsVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {templateMeta.tags && templateMeta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1-5 mt-2">
            {templateMeta.tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center r-full px-2 py-0-5 text-xs font-medium" style={{ background: 'var(--hover)', color: 'var(--ink-muted)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {templateMeta.version && (
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>v{templateMeta.version}</span>
          )}
          {templateMeta.author && (
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t('settings.templates.by_author', { author: templateMeta.author })}</span>
          )}
        </div>

        {isLocked && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--line)' }}>
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--warning)' }}>
              <IconLock className="h-3 w-3" />
              {t('settings.templates.requires_supporter')}
            </p>
          </div>
        )}
      </div>

      {/* Actions Menu Portal */}
      {typeof document !== 'undefined' && showActions && createPortal(
        <div
          ref={menuRef}
          className="fixed z-9999 w-48 r-md py-1"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--line)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 32px var(--shadow-color)',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          {!isDefault && !isLocked && (
            <button
              onClick={() => { onSetDefault?.(); setShowActions(false); }}
              className="w-full px-3 py-2 text-left text-xs transition flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <IconCheck className="h-3-5 w-3-5" />
              {t('settings.templates.set_default')}
            </button>
          )}
          {onEdit && !isLocked && (
            <button
              onClick={() => { onEdit?.(); setShowActions(false); }}
              className="w-full px-3 py-2 text-left text-xs transition flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <IconEdit className="h-3-5 w-3-5" />
              {t('common.edit')}
            </button>
          )}
          {onExport && !isLocked && (
            <button
              onClick={() => { onExport?.(); setShowActions(false); }}
              className="w-full px-3 py-2 text-left text-xs transition flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <IconDownload className="h-3-5 w-3-5" />
              {t('settings.templates.export')}
            </button>
          )}
          {onDuplicate && !isLocked && (
            <button
              onClick={() => { onDuplicate?.(); setShowActions(false); }}
              className="w-full px-3 py-2 text-left text-xs transition flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <IconCopy className="h-3-5 w-3-5" />
              {t('settings.templates.duplicate')}
            </button>
          )}
          {onDelete && templateId !== 'default_invoice' && !isLocked && (
            <button
              onClick={() => { onDelete?.(); setShowActions(false); }}
              className="w-full px-3 py-2 text-left text-xs transition flex items-center gap-2"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <IconTrash className="h-3-5 w-3-5" />
              {t('common.delete')}
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
