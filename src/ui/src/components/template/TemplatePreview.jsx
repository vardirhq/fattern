import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';
import { renderTemplateToHTML } from '../../utils/templateRenderer';

// Mock data for preview
const mockData = {
  invoice: {
    invoice_number: '2025-001',
    invoice_date: '2025-01-15',
    due_date: '2025-02-15',
    status: 'sent',
    total: 12500.00,
    subtotal: 10000.00,
    vat_total: 2500.00,
    items: [
      {
        description: 'Konsulenttjenester',
        quantity: 10,
        unit_price: 1000.00,
        vat_rate: 0.25,
        line_total: 12500.00,
      },
    ],
  },
  customer: {
    name: 'Eksempel Kunde AS',
    org_number: '123 456 789',
    address: 'Gateveien 123',
    post_number: '0001',
    post_location: 'Oslo',
    email: 'kunde@example.com',
    phone: '+47 123 45 678',
  },
  company: {
    name: 'Mitt Selskap AS',
    org_number: '987 654 321 MVA',
    address: 'Firmaveien 456',
    post_number: '0002',
    post_location: 'Oslo',
    contact_email: 'kontakt@mittselskap.no',
    contact_number: '+47 987 65 432',
    account_number: '1234 56 78901',
  },
};

export function TemplatePreview({ template, zoom = 100, pan = { x: 0, y: 0 }, onPanChange, onClose }) {
  const { t } = useTranslation();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [html, setHtml] = useState('');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    if (!template) return;
    
    // Process template to convert file paths to data URLs
    const processTemplate = async () => {
      const processedElements = await Promise.all(
        template.elements.map(async (element) => {
          if (element.type === 'image' && element.src && !element.src.startsWith('data:') && !element.src.startsWith('http')) {
            // Convert file path to data URL
            if (window.fattern?.template?.readImage && template.meta?.id) {
              try {
                const dataURL = await window.fattern.template.readImage(template.meta.id, element.src);
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
      const rendered = renderTemplateToHTML(processedTemplate, mockData);
      setHtml(rendered);
    };
    
    processTemplate();
  }, [template]);

  useEffect(() => {
    if (!iframeRef.current || !html) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: 'var(--surface-sunken)' }}>
        <p style={{ color: 'var(--ink-muted)' }}>{t('template_editor.no_preview')}</p>
      </div>
    );
  }

  // Handle panning
  const handleMouseDown = useCallback((e) => {
    // Allow panning with middle mouse, right mouse, space + left click, or shift + left click
    if (e.button === 1 || e.button === 2 || (e.button === 0 && (isSpacePressed || e.shiftKey))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [pan, isSpacePressed]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning && onPanChange) {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Keyboard shortcuts and space key tracking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !e.target.matches('input, textarea')) {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Prevent context menu when panning
  const handleContextMenu = useCallback((e) => {
    if (isPanning) {
      e.preventDefault();
    }
  }, [isPanning]);

  // A4 dimensions at 96 DPI (matching editor)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  
  // Use the same zoom as the editor
  const zoomFactor = zoom / 100;

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'rgba(6,12,9,0.8)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 r-md p-2 shadow-lg transition"
          style={{ background: 'rgba(12,22,18,0.9)', border: '1px solid var(--line)', color: 'var(--ink-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-strong)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(12,22,18,0.9)'}
          title={t('template_editor.close_preview')}
        >
          <IconX className="h-5 w-5" />
        </button>
      )}
      <div className="relative h-full w-full overflow-auto">
        <div
          className="absolute shadow-lg"
          style={{
            background: '#ffffff',
            left: '50%',
            top: '50%',
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoomFactor})`,
            transformOrigin: 'center',
          }}
        >
          <iframe
            ref={iframeRef}
            className="border-0 pointer-events-none"
            title={t('template_editor.preview_title')}
            style={{
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}
