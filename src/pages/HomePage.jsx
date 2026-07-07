import { CalendarDays, Clock, ChevronLeft } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { formatDateDisplay, isToday, formatTime } from '../lib/utils';
import TimelineGrid from '../components/booking/TimelineGrid';

export default function HomePage() {
  const { selectedDate, globalSettings, setSelectedSpace } = useBooking();
  
  const startLabel = globalSettings ? formatTime(`${String(globalSettings.startHour).padStart(2, '0')}:00`) : '7:00 AM';
  const endLabel = globalSettings ? formatTime(`${String(globalSettings.endHour).padStart(2, '0')}:00`) : '9:00 PM';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Header */}
      <header className="px-6 py-4 border-b border-surface-100 bg-white shrink-0">
        <button
          onClick={() => setSelectedSpace(null)}
          className="md:hidden flex items-center gap-1.5 text-sm font-semibold text-surface-500 hover:text-surface-900 mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Spaces
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-surface-900">Space Bookings</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <CalendarDays size={14} className="text-surface-400" />
              <span className="text-sm text-surface-500 font-medium">
                {formatDateDisplay(selectedDate)}
              </span>
              {isToday(selectedDate) && (
                <span className="badge bg-brand-50 text-brand-600 border border-brand-200">
                  Today
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <Clock size={14} />
            <span>1-hour slots · {startLabel} – {endLabel}</span>
          </div>
        </div>
      </header>

      {/* Timeline Grid */}
      <TimelineGrid />
    </div>
  );
}
