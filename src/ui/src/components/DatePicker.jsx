import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

// Auto-format date input to dd.mm.yyyy
function formatDateInput(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
}

// Convert dd.mm.yyyy to yyyy-mm-dd
function parseDateInput(value) {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  let [day, month, year] = parts;
  if (!day || !month || !year) return null;
  
  // Handle 2-digit years: convert to 4-digit
  if (year.length === 2) {
    const yearNum = parseInt(year, 10);
    if (yearNum <= 50) {
      year = `20${year.padStart(2, '0')}`;
    } else {
      year = `19${year.padStart(2, '0')}`;
    }
  }
  
  // Validate year is reasonable (1900-2100)
  const yearNum = parseInt(year, 10);
  if (yearNum < 1900 || yearNum > 2100) {
    return null;
  }
  
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Convert yyyy-mm-dd to Date object
function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

// Format Date to dd.mm.yyyy
function formatDateDisplay(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Get month name in Norwegian
const monthNames = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
];

const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export function DatePicker({ value, onChange, placeholder = 'dd.mm.yyyy', required = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const inputRef = useRef(null);
  const calendarRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Initialize input value from prop
  useEffect(() => {
    if (value) {
      const date = parseDate(value);
      setInputValue(date ? formatDateDisplay(date) : '');
      if (date) setCalendarDate(date);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleInputChange = (e) => {
    const formatted = formatDateInput(e.target.value);
    setInputValue(formatted);
    
    const parsed = parseDateInput(formatted);
    if (parsed) {
      onChange(parsed);
      const date = parseDate(parsed);
      if (date) setCalendarDate(date);
    } else if (formatted.length === 0) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If input has a valid date, use it for calendar
    const parsed = parseDateInput(inputValue);
    if (parsed) {
      const date = parseDate(parsed);
      if (date) setCalendarDate(date);
    }
  };

  const handleCalendarSelect = (date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onChange(dateString);
    setInputValue(formatDateDisplay(date));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    // Convert to Monday = 0 (instead of Sunday = 0)
    return (firstDay.getDay() + 6) % 7;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const currentDate = parseDate(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const isToday = date.getTime() === today.getTime();
      const isSelected = currentDate && date.getTime() === currentDate.getTime();
      const isCurrentMonth = date.getMonth() === calendarDate.getMonth();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleCalendarSelect(date)}
          className="h-8 w-8 rounded-lg text-sm transition-colors"
          style={{
            background: isSelected ? 'var(--f-green-bg)' : isToday ? 'rgba(47,75,216,0.1)' : 'transparent',
            color: isSelected ? 'var(--f-green-text)' : isToday ? 'var(--f-green-text-dim)' : 'var(--f-text-body)',
            fontWeight: isSelected || isToday ? 600 : 400,
            opacity: !isCurrentMonth ? 0.3 : 1,
          }}
          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--f-hover)'; }}
          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(47,75,216,0.1)' : 'transparent'; }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const calendarContent = isOpen ? (
    <div
      ref={calendarRef}
      className="absolute z-[9999] mt-1 rounded-2xl overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${Math.max(dropdownPosition.width, 280)}px`,
        background: 'var(--f-surface-elevated)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--f-border)',
        boxShadow: '0 12px 32px var(--f-tooltip-shadow)',
      }}
    >
      <div className="p-4">
        {/* Calendar Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-1.5 transition"
            style={{ color: 'var(--f-text-subtle)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--f-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconChevronLeft size={15} stroke={1.8} />
          </button>
          <div className="text-sm font-semibold" style={{ color: 'var(--f-text)' }}>
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-1.5 transition"
            style={{ color: 'var(--f-text-subtle)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--f-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconChevronRight size={15} stroke={1.8} />
          </button>
        </div>

        {/* Day names */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-medium py-1" style={{ color: 'var(--f-text-label)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>

        {/* Today button */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--f-border-subtle)' }}>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              handleCalendarSelect(today);
            }}
            className="f-btn-ghost w-full rounded-lg px-3 py-2 text-sm font-medium"
          >
            Velg i dag
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          inputMode="numeric"
          required={required}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition"
          style={{ color: 'var(--f-text-subtle)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--f-text-soft)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--f-text-subtle)'}
        >
          <IconCalendar size={15} stroke={1.8} />
        </button>
      </div>
      {isOpen && createPortal(calendarContent, document.body)}
    </div>
  );
}

