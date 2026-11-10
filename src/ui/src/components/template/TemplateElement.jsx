import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Component to load images from file paths or data URLs
function ImageLoader({ src, elementId, templateId }) {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      return;
    }

    // If it's a data URL, use it directly
    if (src.startsWith('data:')) {
      setImageSrc(src);
      return;
    }

    // If it's a file path, read the file via IPC and convert to data URL
    if (window.fattern?.template?.readImage && templateId) {
      window.fattern.template.readImage(templateId, src).then((dataURL) => {
        setImageSrc(dataURL);
      }).catch(() => {
        setError(true);
      });
    } else {
      // Fallback: try to use the path as-is
      setImageSrc(src);
    }
  }, [src, templateId]);

  if (error || !imageSrc) {
    return <span className="text-xs" style={{ color: '#9ca3af' }}>{t('template_editor.element_image')}</span>;
  }

  return (
    <img 
      key={`canvas-img-${elementId}`}
      src={imageSrc} 
      alt="" 
      className="max-h-full max-w-full object-contain"
      style={{ display: 'block', contain: 'layout style paint' }}
      onError={() => setError(true)}
    />
  );
}

export function TemplateElement({
  element,
  zoom = 1,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateId,
}) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const elementRef = useRef(null);

  const snapToGrid = (value) => {
    return Math.round(value / 10) * 10;
  };

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height,
      });
    } else {
      setIsDragging(true);
      const rect = elementRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      onSelect();
    }
    e.stopPropagation();
  }, [element, onSelect]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const rect = elementRef.current.parentElement.getBoundingClientRect();
      const newX = (e.clientX - rect.left - dragStart.x) / zoom;
      const newY = (e.clientY - rect.top - dragStart.y) / zoom;
      onUpdate({
        x: snapToGrid(newX),
        y: snapToGrid(newY),
      });
    } else if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / zoom;
      const deltaY = (e.clientY - resizeStart.y) / zoom;
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(20, resizeStart.height + deltaY);
      onUpdate({
        width: snapToGrid(newWidth),
        height: snapToGrid(newHeight),
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, zoom, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              fontFamily: element.fontFamily || 'Inter',
              fontSize: `${element.fontSize || 14}px`,
              fontWeight: element.fontWeight || 400,
              color: element.color || '#0d3e51',
              textAlign: element.align || 'left',
              lineHeight: element.lineHeight || 1.5,
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : '0px',
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.textDecoration || 'none',
              textTransform: element.textTransform || 'none',
              backgroundColor: element.backgroundColor || 'transparent',
              opacity: element.opacity !== undefined ? element.opacity : 1,
              borderWidth: element.borderWidth ? `${element.borderWidth}px` : '0px',
              borderColor: element.borderColor || 'transparent',
              borderStyle: element.borderStyle || 'solid',
              borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0px',
              paddingTop: element.paddingTop ? `${element.paddingTop}px` : '0px',
              paddingRight: element.paddingRight ? `${element.paddingRight}px` : '0px',
              paddingBottom: element.paddingBottom ? `${element.paddingBottom}px` : '0px',
              paddingLeft: element.paddingLeft ? `${element.paddingLeft}px` : '0px',
              boxShadow: (element.boxShadowX || element.boxShadowY || element.boxShadowBlur)
                ? `${element.boxShadowX || 0}px ${element.boxShadowY || 0}px ${element.boxShadowBlur || 0}px ${element.boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`
                : 'none',
            }}
          >
            {element.content || ''}
          </div>
        );
      case 'field':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              fontFamily: element.fontFamily || 'Inter',
              fontSize: `${element.fontSize || 14}px`,
              fontWeight: element.fontWeight || 400,
              color: element.color || '#0d3e51',
              textAlign: element.align || 'left',
              lineHeight: element.lineHeight || 1.5,
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : '0px',
              fontStyle: element.fontStyle || 'italic',
              textDecoration: element.textDecoration || 'none',
              textTransform: element.textTransform || 'none',
              backgroundColor: element.backgroundColor || 'transparent',
              opacity: element.opacity !== undefined ? element.opacity : 1,
              borderWidth: element.borderWidth ? `${element.borderWidth}px` : '0px',
              borderColor: element.borderColor || 'transparent',
              borderStyle: element.borderStyle || 'solid',
              borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0px',
              paddingTop: element.paddingTop ? `${element.paddingTop}px` : '0px',
              paddingRight: element.paddingRight ? `${element.paddingRight}px` : '0px',
              paddingBottom: element.paddingBottom ? `${element.paddingBottom}px` : '0px',
              paddingLeft: element.paddingLeft ? `${element.paddingLeft}px` : '0px',
              boxShadow: (element.boxShadowX || element.boxShadowY || element.boxShadowBlur)
                ? `${element.boxShadowX || 0}px ${element.boxShadowY || 0}px ${element.boxShadowBlur || 0}px ${element.boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`
                : 'none',
            }}
          >
            {element.binding || '{{field}}'}
          </div>
        );
      case 'image':
        return (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed" style={{ contain: 'layout style paint', borderColor: 'rgba(0,0,0,0.15)', background: 'rgba(0,0,0,0.04)' }}>
            {element.src ? (
              <ImageLoader src={element.src} elementId={element.id} templateId={templateId} />
            ) : (
              <span className="text-xs" style={{ color: '#9ca3af' }}>{t('template_editor.element_image')}</span>
            )}
          </div>
        );
      case 'table':
        return (
          <div
            className="h-full w-full"
            style={{
              backgroundColor: element.backgroundColor || 'transparent',
              opacity: element.opacity !== undefined ? element.opacity : 1,
              borderWidth: element.borderWidth ? `${element.borderWidth}px` : '1px',
              borderColor: element.borderColor || '#d5e7e6',
              borderStyle: element.borderStyle || 'solid',
              borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0px',
              paddingTop: element.paddingTop ? `${element.paddingTop}px` : '0px',
              paddingRight: element.paddingRight ? `${element.paddingRight}px` : '0px',
              paddingBottom: element.paddingBottom ? `${element.paddingBottom}px` : '0px',
              paddingLeft: element.paddingLeft ? `${element.paddingLeft}px` : '0px',
              boxShadow: (element.boxShadowX || element.boxShadowY || element.boxShadowBlur)
                ? `${element.boxShadowX || 0}px ${element.boxShadowY || 0}px ${element.boxShadowBlur || 0}px ${element.boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`
                : 'none',
            }}
          >
            <div className="p-1 text-xs font-semibold" style={{ borderBottom: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.04)', color: '#374151' }}>
              {t('template_editor.element_table')}: {element.binding || 'invoice.items'}
            </div>
            <div className="p-2 text-xs" style={{ color: '#9ca3af' }}>
              {t('template_editor.columns_count', { count: element.columns?.length || 0 })}
            </div>
          </div>
        );
      case 'shape':
        const shapeType = element.shapeType || 'rectangle';
        if (shapeType === 'line') {
          // Horizontal or vertical line
          const isHorizontal = element.width > element.height;
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: element.backgroundColor || 'transparent',
                opacity: element.opacity !== undefined ? element.opacity : 1,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  [isHorizontal ? 'top' : 'left']: '50%',
                  [isHorizontal ? 'left' : 'top']: 0,
                  [isHorizontal ? 'width' : 'height']: '100%',
                  [isHorizontal ? 'height' : 'width']: `${element.borderWidth || 1}px`,
                  transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
                  backgroundColor: element.borderColor || element.backgroundColor || '#0d3e51',
                  opacity: element.opacity !== undefined ? element.opacity : 1,
                }}
              />
            </div>
          );
        } else if (shapeType === 'circle') {
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: element.backgroundColor || '#f0f8f5',
                borderWidth: element.borderWidth ? `${element.borderWidth}px` : '1px',
                borderColor: element.borderColor || '#d5e7e6',
                borderStyle: element.borderStyle || 'solid',
                opacity: element.opacity !== undefined ? element.opacity : 1,
                boxShadow: (element.boxShadowX || element.boxShadowY || element.boxShadowBlur)
                  ? `${element.boxShadowX || 0}px ${element.boxShadowY || 0}px ${element.boxShadowBlur || 0}px ${element.boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`
                  : 'none',
              }}
            />
          );
        } else {
          // rectangle (default)
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: element.backgroundColor || '#f0f8f5',
                borderWidth: element.borderWidth ? `${element.borderWidth}px` : '1px',
                borderColor: element.borderColor || '#d5e7e6',
                borderStyle: element.borderStyle || 'solid',
                borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0px',
                opacity: element.opacity !== undefined ? element.opacity : 1,
                boxShadow: (element.boxShadowX || element.boxShadowY || element.boxShadowBlur)
                  ? `${element.boxShadowX || 0}px ${element.boxShadowY || 0}px ${element.boxShadowBlur || 0}px ${element.boxShadowColor || 'rgba(0, 0, 0, 0.1)'}`
                  : 'none',
              }}
            />
          );
        }
      default:
        return <div className="text-xs" style={{ color: '#9ca3af' }}>{t('template_editor.unknown_element')}</div>;
    }
  };

  return (
    <div
      ref={elementRef}
      className="absolute cursor-move"
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: element.zIndex ?? 1,
        outline: isSelected ? '2px solid #2F4BD8' : '1px solid transparent',
      }}
      onMouseDown={handleMouseDown}
    >
      {renderElement()}
      {isSelected && (
        <>
          {/* Resize handles */}
          <div className="resize-handle absolute -right-1 -top-1 h-3 w-3 cursor-nwse-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -right-1 -bottom-1 h-3 w-3 cursor-nesw-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -left-1 -top-1 h-3 w-3 cursor-nesw-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -left-1 -bottom-1 h-3 w-3 cursor-nwse-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-ew-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-ns-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-ew-resize rounded-full" style={{ background: '#2F4BD8' }} />
          <div className="resize-handle absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-ns-resize rounded-full" style={{ background: '#2F4BD8' }} />
        </>
      )}
    </div>
  );
}
