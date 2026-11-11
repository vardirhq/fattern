import { useState, useRef, useCallback, useEffect } from 'react';
import { TemplateElement } from './TemplateElement';

const A4_WIDTH = 794; // A4 at 96 DPI
const A4_HEIGHT = 1123;
const GRID_SIZE = 10;

export function TemplateCanvas({
  template,
  zoom = 100,
  pan = { x: 0, y: 0 },
  onPanChange,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}) {
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const zoomFactor = zoom / 100;
  // Keep A4 dimensions constant - scale is applied via transform
  const canvasWidth = A4_WIDTH;
  const canvasHeight = A4_HEIGHT;
  
  // Snap pan to grid to keep canvas aligned
  const snapToGrid = (value, gridSize, zoom) => {
    return Math.round(value / (gridSize * zoom)) * (gridSize * zoom);
  };
  
  const snappedPan = {
    x: snapToGrid(pan.x, GRID_SIZE, zoomFactor),
    y: snapToGrid(pan.y, GRID_SIZE, zoomFactor),
  };
  
  // Calculate grid alignment offset to ensure canvas edges align with grid
  // When centered, we want the canvas edges to fall on grid lines
  // We calculate the offset needed to align the canvas to the nearest grid intersection
  const getGridAlignmentOffset = (dimension, gridSize, zoom) => {
    // The offset needed to align the dimension to the grid
    // We want the center to be at a position where edges align
    const halfDimension = dimension / 2;
    const gridSizeScaled = gridSize * zoom;
    // Find the offset that makes the edges align with grid
    const remainder = halfDimension % gridSizeScaled;
    // If remainder is close to 0 or gridSizeScaled, we're already aligned
    // Otherwise, adjust by the remainder
    return remainder < gridSizeScaled / 2 ? -remainder : gridSizeScaled - remainder;
  };
  
  const gridOffsetX = getGridAlignmentOffset(canvasWidth, GRID_SIZE, zoomFactor);
  const gridOffsetY = getGridAlignmentOffset(canvasHeight, GRID_SIZE, zoomFactor);

  // Track space key state for panning
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Handle panning
  const handleMouseDown = useCallback((e) => {
    // Allow panning with:
    // - Middle mouse button
    // - Right mouse button
    // - Space + left click
    // - Shift + left click
    // - Left click on background (when no element is selected)
    const isBackgroundClick = e.target === containerRef.current || e.target === canvasRef.current;
    const canPan = e.button === 1 || // Middle mouse
                   e.button === 2 || // Right mouse
                   (e.button === 0 && (isSpacePressed || e.shiftKey)) || // Space/Shift + left click
                   (e.button === 0 && isBackgroundClick && !selectedElementId); // Left click on background when nothing selected
    
    if (canPan) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
      e.stopPropagation();
    } else if (e.button === 0 && isBackgroundClick) {
      // Click on canvas background - deselect
      onSelectElement(null);
    }
  }, [pan, onSelectElement, selectedElementId, isSpacePressed, onPanChange]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      if (onPanChange) {
        onPanChange({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    }
  }, [isPanning, panStart, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Keyboard shortcuts and space key tracking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !e.target.matches('input, textarea')) {
        // Space bar for panning - prevent default scrolling
        setIsSpacePressed(true);
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !e.target.matches('input, textarea')) {
          onDeleteElement(selectedElementId);
        }
      } else if (e.key.startsWith('Arrow')) {
        if (selectedElementId && !e.target.matches('input, textarea')) {
          e.preventDefault();
          const delta = e.shiftKey ? 10 : 1;
          const updates = {};
          if (e.key === 'ArrowLeft') updates.x = -delta;
          if (e.key === 'ArrowRight') updates.x = delta;
          if (e.key === 'ArrowUp') updates.y = -delta;
          if (e.key === 'ArrowDown') updates.y = delta;
          const currentElement = template.elements.find((el) => el.id === selectedElementId);
          if (currentElement) {
            onUpdateElement(selectedElementId, {
              x: (currentElement.x || 0) + (updates.x || 0),
              y: (currentElement.y || 0) + (updates.y || 0),
            });
          }
        }
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
  }, [selectedElementId, template, onDeleteElement, onUpdateElement]);

  // Prevent context menu only when panning
  const handleContextMenu = useCallback((e) => {
    if (isPanning) {
      e.preventDefault();
    }
  }, [isPanning]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'var(--f-overlay)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Grid background - extended to cover panning area */}
      <div
        className="absolute"
        style={{
          left: '-5000px',
          top: '-5000px',
          width: '10000px',
          height: '10000px',
          backgroundImage: `linear-gradient(to right, rgba(47,75,216,0.07) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(47,75,216,0.07) 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE * zoomFactor}px ${GRID_SIZE * zoomFactor}px`,
          backgroundPosition: `${snappedPan.x % (GRID_SIZE * zoomFactor)}px ${snappedPan.y % (GRID_SIZE * zoomFactor)}px`,
        }}
      />

      {/* Canvas (A4 artboard) — explicit #ffffff, never inherits theme's --color-white */}
      <div
        ref={canvasRef}
        className="absolute shadow-2xl"
        style={{
          background: '#ffffff',
          left: '50%',
          top: '50%',
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `translate(calc(-50% + ${snappedPan.x + gridOffsetX}px), calc(-50% + ${snappedPan.y + gridOffsetY}px)) scale(${zoomFactor})`,
          transformOrigin: 'center',
        }}
      >
        {/* Elements - sorted by z-index (lower z-index renders first/behind) */}
        {[...template.elements]
          .sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1))
          .map((element) => (
            <TemplateElement
              key={element.id}
              element={element}
              zoom={zoomFactor}
              isSelected={selectedElementId === element.id}
              onSelect={() => onSelectElement(element.id)}
              onUpdate={(updates) => onUpdateElement(element.id, updates)}
              onDelete={() => onDeleteElement(element.id)}
              templateId={template?.meta?.id || template?.id}
            />
          ))}
      </div>
    </div>
  );
}

