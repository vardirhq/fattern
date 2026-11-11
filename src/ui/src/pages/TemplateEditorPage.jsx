import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconDeviceFloppy, IconZoomIn, IconZoomOut, IconEye, IconSettings } from '@tabler/icons-react';
import { TemplateCanvas } from '../components/template/TemplateCanvas';
import { TemplatePalette } from '../components/template/TemplatePalette';
import { TemplateProperties } from '../components/template/TemplateProperties';
import { TemplatePreview } from '../components/template/TemplatePreview';
import { TemplateSettingsModal } from '../components/template/TemplateSettingsModal';
import { useTemplateHistory } from '../hooks/useTemplateHistory';

export function TemplateEditorPage({ templateId, onClose }) {
  const { t } = useTranslation();
  const [template, setTemplate] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoom, setZoom] = useState(() => {
    const viewportHeight = window.innerHeight - 40 - 56;
    const A4_HEIGHT = 1123;
    const fitZoom = Math.floor((viewportHeight / A4_HEIGHT) * 100);
    return Math.min(100, Math.max(50, fitZoom));
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(() => {
    return templateId?.includes('?preview=true') || false;
  });
  const [showSettings, setShowSettings] = useState(false);
  const { pushToHistory, undo, redo, canUndo, canRedo } = useTemplateHistory();

  const actualTemplateId = templateId?.split('?')[0] || templateId;

  useEffect(() => {
    loadTemplate();
  }, [actualTemplateId]);

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      const api = window.fattern?.template;
      if (!api) {
        console.error('Template API not available');
        return;
      }

      let loadedTemplate = await api.load(actualTemplateId);
      if (!loadedTemplate) {
        loadedTemplate = await api.createDefault();
      }

      setTemplate(loadedTemplate);
      pushToHistory(loadedTemplate);
    } catch (error) {
      console.error('Failed to load template', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;
    try {
      const api = window.fattern?.template;
      if (!api) return;
      await api.save(template);
    } catch (error) {
      console.error('Failed to save template', error);
    }
  };

  const handleSaveSettings = (updatedTemplate) => {
    setTemplate(updatedTemplate);
    pushToHistory(updatedTemplate);
    handleSave();
  };

  const handleUpdateTemplate = useCallback((updater) => {
    setTemplate((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      pushToHistory(updated);
      return updated;
    });
  }, [pushToHistory]);

  const handleAddElement = (elementType) => {
    if (!template) return;

    const newElement = createElement(elementType);
    handleUpdateTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementId(newElement.id);
  };

  const handleUpdateElement = (elementId, updates) => {
    handleUpdateTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    }));
  };

  const handleDeleteElement = (elementId) => {
    handleUpdateTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== elementId),
    }));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const handleUndo = () => {
    const previous = undo();
    if (previous) {
      setTemplate(previous);
    }
  };

  const handleRedo = () => {
    const next = redo();
    if (next) {
      setTemplate(next);
    }
  };

  const selectedElement = useMemo(() => {
    if (!template || !selectedElementId) return null;
    return template.elements.find((el) => el.id === selectedElementId);
  }, [template, selectedElementId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--f-bg-base)' }}>
        <p style={{ color: 'var(--f-text-subtle)' }}>{t('template_editor.loading')}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--f-bg-base)' }}>
        <p style={{ color: 'var(--f-text-subtle)' }}>{t('template_editor.load_error')}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ top: 'var(--f-topbar-h)', background: 'var(--f-bg-base)' }}>
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between px-5" style={{ background: 'rgba(8,16,12,0.8)', borderBottom: '1px solid var(--f-border-subtle)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-5">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition"
            style={{ color: 'var(--f-text-soft)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; }}
          >
            <IconArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
          <div className="h-6 w-px" style={{ background: 'var(--f-border)' }} />
          <h1 className="text-sm font-semibold" style={{ color: 'var(--f-text-body)' }}>{template.meta?.name || template.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--f-text-soft)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--f-hover)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {t('template_editor.undo')}
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--f-text-soft)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--f-hover)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {t('template_editor.redo')}
          </button>

          <div className="h-6 w-px" style={{ background: 'var(--f-border)' }} />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="rounded-lg p-1.5 transition disabled:opacity-40"
              style={{ color: 'var(--f-text-soft)' }}
              disabled={zoom <= 50}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--f-hover)'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <IconZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[4rem] text-center text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="rounded-lg p-1.5 transition disabled:opacity-40"
              style={{ color: 'var(--f-text-soft)' }}
              disabled={zoom >= 200}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--f-hover)'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <IconZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const viewportHeight = window.innerHeight - 32 - 48;
                const A4_HEIGHT = 1123;
                const fitZoom = Math.floor((viewportHeight / A4_HEIGHT) * 100);
                setZoom(Math.min(100, Math.max(50, fitZoom)));
              }}
              className="ml-2 rounded-lg px-3 py-1.5 text-xs font-medium transition"
              style={{ color: 'var(--f-text-soft)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--f-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {t('template_editor.fit')}
            </button>
          </div>

          <div className="h-6 w-px" style={{ background: 'var(--f-border)' }} />

          {/* Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition"
            style={{ color: 'var(--f-text-soft)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; }}
          >
            <IconEye className="mr-2 inline h-4 w-4" />
            {showPreview ? t('template_editor.edit_mode') : t('template_editor.preview')}
          </button>

          <div className="h-6 w-px" style={{ background: 'var(--f-border)' }} />

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition"
            style={{ color: 'var(--f-text-soft)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--f-hover)'; e.currentTarget.style.color = 'var(--f-text-body)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; }}
            title={t('template_editor.settings_title')}
          >
            <IconSettings className="mr-2 inline h-4 w-4" />
            {t('template_editor.settings')}
          </button>

          <div className="h-6 w-px" style={{ background: 'var(--f-border)' }} />

          {/* Save */}
          <button
            onClick={handleSave}
            className="f-btn-primary rounded-lg px-4 py-1.5 text-sm font-medium"
          >
            <IconDeviceFloppy className="mr-2 inline h-4 w-4" />
            {t('template_editor.save')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {showPreview ? (
        <div className="flex-1 overflow-hidden">
          <TemplatePreview template={template} zoom={zoom} pan={pan} onPanChange={setPan} onClose={() => setShowPreview(false)} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <TemplatePalette onAddElement={handleAddElement} />

          <div className="flex-1 overflow-hidden">
            <TemplateCanvas
              template={template}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
            />
          </div>

          <TemplateProperties
            element={selectedElement}
            template={template}
            onUpdate={(updates) => selectedElementId && handleUpdateElement(selectedElementId, updates)}
          />
        </div>
      )}

      <TemplateSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        template={template}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

// Helper function to create new elements
// Note: column headers are invoice document content, kept in Norwegian
function createElement(type) {
  const baseId = `element_${Date.now()}`;
  const baseElement = {
    id: baseId,
    x: 100,
    y: 100,
    width: 200,
    height: 30,
  };

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        content: 'Ny tekst',
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 400,
        color: '#0d3e51',
        align: 'left',
        zIndex: 1,
      };
    case 'field':
      return {
        ...baseElement,
        type: 'field',
        binding: 'invoice.invoice_number',
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 400,
        color: '#0d3e51',
        align: 'left',
        zIndex: 1,
      };
    case 'image':
      return {
        ...baseElement,
        type: 'image',
        src: '',
        width: 200,
        height: 100,
        preserveAspectRatio: true,
        zIndex: 1,
      };
    case 'table':
      return {
        ...baseElement,
        type: 'table',
        binding: 'invoice.items',
        width: 500,
        height: 300,
        columns: [
          { header: 'Beskrivelse', field: 'description', width: 250, align: 'left' },
          { header: 'Antall', field: 'quantity', width: 50, align: 'right' },
          { header: 'Pris', field: 'unit_price', width: 80, align: 'right' },
          { header: 'Total', field: 'line_total', width: 80, align: 'right' },
        ],
        rowHeight: 18,
        maxRows: 15,
        zIndex: 1,
      };
    case 'shape':
      return {
        ...baseElement,
        type: 'shape',
        shapeType: 'rectangle',
        width: 200,
        height: 100,
        backgroundColor: '#f0f8f5',
        borderWidth: 1,
        borderColor: '#d5e7e6',
        borderStyle: 'solid',
        borderRadius: 0,
        zIndex: 0,
      };
    default:
      return baseElement;
  }
}
