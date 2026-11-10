import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const commonUnits = ['timer', 'stk', 'm²', 'kg', 'l', 'm', 'km', 'dag', 'uke', 'måned', 'år'];

export function Select({ value, onChange, options = [], placeholder = 'Velg...', allowCustom = false, customLabel = 'Tilpasset', noMargin = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const allOptions = allowCustom ? [...options, { value: '__custom__', label: customLabel }] : options;

  const getOptionLabel = (option) => {
    if (typeof option === 'string') return option;
    return option?.label || option?.value || '';
  };

  const getOptionIcon = (option) => {
    if (typeof option === 'string') return null;
    return option?.icon || null;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedButton = buttonRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);
      if (!clickedButton && !clickedDropdown) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => {
    const optValue = typeof opt === 'string' ? opt : opt.value;
    return optValue === value;
  }) || (value && !options.find((opt) => {
    const optValue = typeof opt === 'string' ? opt : opt.value;
    return optValue === value;
  }) ? { label: value, value } : null);

  const handleSelect = (optionValue) => {
    if (optionValue === '__custom__') {
      setShowCustomInput(true);
      const hasValue = options.find((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        return optValue === value;
      });
      setCustomValue(value && !hasValue ? value : '');
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setShowCustomInput(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange?.(customValue.trim());
      setIsOpen(false);
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] rounded-xl overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        background: 'var(--f-surface-elevated)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--f-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {!showCustomInput ? (
        <div className="max-h-60 overflow-y-auto p-1">
          {allOptions.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = getOptionLabel(option);
            const optionIcon = getOptionIcon(option);
            const isSelected = value === optionValue;
            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => handleSelect(optionValue)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition"
                style={{
                  background: isSelected ? 'var(--f-green-bg)' : 'transparent',
                  color: isSelected ? 'var(--f-green-text)' : 'var(--f-text-soft)',
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--f-text-body)'; }}}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--f-text-soft)'; }}}
              >
                {optionIcon && <span className="flex-shrink-0 opacity-70">{optionIcon}</span>}
                {optionLabel}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit(); }
              else if (e.key === 'Escape') { setShowCustomInput(false); setIsOpen(false); }
            }}
            placeholder="Skriv inn enhet"
            className="f-input w-full px-3 py-2 text-sm"
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={handleCustomSubmit} className="f-btn-primary flex-1 rounded-lg px-3 py-1.5 text-sm font-medium">Lagre</button>
            <button type="button" onClick={() => { setShowCustomInput(false); setCustomValue(''); }} className="f-btn-ghost flex-1 rounded-lg px-3 py-1.5 text-sm font-medium">Avbryt</button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${noMargin ? '' : 'mt-2 '}w-full rounded-xl px-4 py-2 text-left text-sm f-input`}
          style={{ cursor: 'pointer' }}
        >
          <span className="flex items-center gap-2" style={{ color: selectedOption ? 'var(--f-text-body)' : 'var(--f-text-subtle)' }}>
            {selectedOption && getOptionIcon(selectedOption) && (
              <span className="flex-shrink-0 opacity-70">{getOptionIcon(selectedOption)}</span>
            )}
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
        </button>
      </div>
      {typeof document !== 'undefined' && isOpen && createPortal(dropdownContent, document.body)}
    </>
  );
}

export function UnitSelect({ value, onChange, placeholder = 'Velg enhet' }) {
  const unitOptions = commonUnits.map((unit) => ({ value: unit, label: unit }));
  return (
    <Select
      value={value}
      onChange={onChange}
      options={unitOptions}
      placeholder={placeholder}
      allowCustom={true}
      customLabel="Tilpasset enhet"
    />
  );
}
