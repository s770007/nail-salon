interface Props {
  calDate: Date;
  onChangeMonth: (d: Date) => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  isDisabled: (dateStr: string) => boolean;
  showLegend?: boolean;
  scheduleSlots?: Record<string, string[]>;
  markedDates?: string[];
}

export default function Calendar({ calDate, onChangeMonth, onSelectDate, selectedDate, isDisabled, showLegend, scheduleSlots, markedDates }: Props) {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' }).format(calDate);

  const prevMonth = () => { const d = new Date(calDate); d.setMonth(d.getMonth() - 1); onChangeMonth(d); };
  const nextMonth = () => { const d = new Date(calDate); d.setMonth(d.getMonth() + 1); onChangeMonth(d); };

  return (
    <div className={`calendar-container${scheduleSlots ? ' schedule-mode' : ''}`}>
      <div className="calendar-header">
        <div className="calendar-month">{monthName}</div>
        <div className="calendar-nav">
          <button className="calendar-btn" onClick={prevMonth}>&lt;</button>
          <button className="calendar-btn" onClick={nextMonth}>&gt;</button>
        </div>
      </div>
      <div className="calendar-grid">
        {['日','一','二','三','四','五','六'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
        {Array(firstDay).fill(0).map((_, i) => <div key={`e-${i}`} className="calendar-day disabled"></div>)}
        {Array(daysInMonth).fill(0).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const disabled = isDisabled(dateStr);
          const slots = scheduleSlots?.[dateStr];
          const hasSlots = slots && slots.length > 0;
          const isMarked = markedDates?.includes(dateStr);
          return (
            <div key={dateStr}
              className={`calendar-day ${disabled ? 'disabled' : ''} ${selectedDate === dateStr ? 'selected' : ''} ${hasSlots ? 'has-schedule' : ''}`}
              onClick={() => !disabled && onSelectDate(dateStr)}
            >
              <span className="calendar-day-num">{day}</span>
              {hasSlots && (
                <div className="schedule-slots-preview">
                  {slots.map(t => <span key={t} className="schedule-slot-chip">{t}</span>)}
                </div>
              )}
              {isMarked && <span className="calendar-dot"></span>}
            </div>
          );
        })}
      </div>
      {showLegend && (
        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-dot" style={{background:"var(--primary-dark)"}}></div><span>已選擇</span></div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#eee"}}></div><span>未開放</span></div>
        </div>
      )}
    </div>
  );
}
