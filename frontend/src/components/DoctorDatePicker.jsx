import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const isDoctorWorkingOnDay = (workingHoursStr, selectedDayShort) => {
  if (!selectedDayShort) return true;
  if (!workingHoursStr || !workingHoursStr.trim()) return true;
  const str = workingHoursStr.toLowerCase();

  if (str.includes('everyday') || str.includes('daily') || str.includes('all days') || str.includes('7 days')) {
    return true;
  }

  const dayObj = DAYS_SHORT.find((d) => d === selectedDayShort);
  if (!dayObj) return true;

  if (str.includes(selectedDayShort.toLowerCase()) || str.includes(DAYS_FULL[DAYS_SHORT.indexOf(selectedDayShort)].toLowerCase())) {
    return true;
  }

  // Check ranges e.g. Mon-Fri or Sun-Thu
  const dayIndex = DAYS_SHORT.indexOf(selectedDayShort);
  for (let startIdx = 0; startIdx < 7; startIdx++) {
    for (let endIdx = 0; endIdx < 7; endIdx++) {
      if (startIdx === endIdx) continue;
      const sShort = DAYS_SHORT[startIdx].toLowerCase();
      const sFull = DAYS_FULL[startIdx].toLowerCase();
      const eShort = DAYS_SHORT[endIdx].toLowerCase();
      const eFull = DAYS_FULL[endIdx].toLowerCase();

      const rangeRegex = new RegExp(`(${sShort}|${sFull})\\s*-\\s*(${eShort}|${eFull})`, 'i');
      if (rangeRegex.test(str)) {
        let i = startIdx;
        while (true) {
          if (i === dayIndex) return true;
          if (i === endIdx) break;
          i = (i + 1) % 7;
        }
      }
    }
  }

  return false;
};

export const DoctorDatePicker = ({ value, onChange, doctor, placeholder = 'Select Date', required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedValue = value ? new Date(value + 'T00:00:00') : null;
  const [viewDate, setViewDate] = useState(parsedValue || new Date());

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const isDateSelectable = (dateObj) => {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);

    // 1. Unselectable if past date
    if (d < today) return false;

    // 2. Unselectable if doctor does not work on this day of week
    if (doctor && doctor.workingHours) {
      const dayShort = DAYS_SHORT[d.getDay()];
      if (!isDoctorWorkingOnDay(doctor.workingHours, dayShort)) {
        return false;
      }
    }

    return true;
  };

  const handleSelectDay = (dayNum) => {
    const selected = new Date(currentYear, currentMonth, dayNum);
    if (!isDateSelectable(selected)) return;

    // Format YYYY-MM-DD
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDisplayValue = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return `${DAYS_SHORT[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input Display Trigger */}
      <div
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: 'var(--bg-card)',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border-color)',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: value ? 600 : 400 }}>
          {value ? formatDisplayValue(value) : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <X size={14} />
            </button>
          )}
          <CalendarIcon size={16} color="var(--primary)" />
        </div>
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 1100,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            padding: '14px',
            width: '310px',
            color: 'var(--text-main)',
          }}
        >
          {/* Header Month / Year */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px' }}
              onClick={prevMonth}
            >
              <ChevronLeft size={16} />
            </button>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </strong>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px' }}
              onClick={nextMonth}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '6px' }}>
            {DAYS_SHORT.map((day) => (
              <span key={day} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {/* Empty slots for month start offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDate = new Date(currentYear, currentMonth, dayNum);
              cellDate.setHours(0, 0, 0, 0);

              const selectable = isDateSelectable(cellDate);
              const isSelected = value && parsedValue &&
                parsedValue.getFullYear() === currentYear &&
                parsedValue.getMonth() === currentMonth &&
                parsedValue.getDate() === dayNum;

              const isToday = cellDate.getTime() === today.getTime();

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={!selectable}
                  style={{
                    padding: '6px 0',
                    fontSize: '0.82rem',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--primary)' : isToday ? '1px solid var(--primary-light)' : 'none',
                    backgroundColor: isSelected
                      ? 'var(--primary)'
                      : !selectable
                      ? 'rgba(156, 163, 175, 0.12)'
                      : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : !selectable
                      ? 'var(--text-muted)'
                      : 'var(--text-main)',
                    cursor: selectable ? 'pointer' : 'not-allowed',
                    opacity: selectable ? 1 : 0.35,
                    textDecoration: !selectable ? 'line-through' : 'none',
                    fontWeight: isSelected || isToday ? 700 : 500,
                  }}
                  onClick={() => handleSelectDay(dayNum)}
                  title={
                    !selectable
                      ? cellDate < today
                        ? 'Past Date'
                        : `${doctor?.fullName || 'Doctor'} does not consult on this day`
                      : `Select ${MONTH_NAMES[currentMonth]} ${dayNum}`
                  }
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Legend */}
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span><span style={{ color: 'var(--primary)', fontWeight: 700 }}>●</span> Available Slot</span>
            <span style={{ textDecoration: 'line-through' }}>Unselectable</span>
          </div>
        </div>
      )}
    </div>
  );
};
