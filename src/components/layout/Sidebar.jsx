import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  LayoutGrid,
  ShieldCheck,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { formatDateDisplay, isToday } from '../../lib/utils';

export default function Sidebar() {
  const location = useLocation();
  const {
    spaces,
    selectedSpace,
    setSelectedSpace,
    selectedDate,
    setSelectedDate,
    loadingSpaces,
  } = useBooking();

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Only show active spaces in the sidebar
  const activeSpaces = spaces.filter((s) => s.status === 'active');

  return (
    <aside className="w-full md:w-[320px] h-full bg-white md:border-r border-surface-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="hidden md:block px-5 py-5 border-b border-surface-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft overflow-hidden shrink-0">
            <img src="https://res.cloudinary.com/dw9axu7dy/image/upload/v1778062222/Fortune_Builders_LOGO_h4eb55.jpg" alt="Fortune Builders Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-surface-900 tracking-tight">Fortune Spaces</h1>
            <p className="text-[11px] text-surface-400 font-medium -mt-0.5">Booking System</p>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="px-4 py-4 border-b border-surface-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Date</span>
          {!isToday(selectedDate) && (
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center justify-between bg-surface-50 rounded-xl p-2">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1 rounded-lg hover:bg-surface-200 text-surface-500 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-surface-800">
              {formatDateDisplay(selectedDate)}
            </p>
            {isToday(selectedDate) && (
              <span className="text-[10px] font-bold text-brand-600 uppercase">Today</span>
            )}
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-1 rounded-lg hover:bg-surface-200 text-surface-500 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Space List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider px-2 mb-2 block">
          Spaces
        </span>
        <nav className="space-y-1">
          {loadingSpaces ? (
            <div className="space-y-2 px-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            activeSpaces.map((space) => {
              const isActive = selectedSpace?.id === space.id;
              return (
                <button
                  key={space.id}
                  onClick={() => setSelectedSpace(space)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-50 border border-brand-200 shadow-soft'
                      : 'hover:bg-surface-50 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500 group-hover:bg-surface-200'
                    }`}
                    style={isActive ? { backgroundColor: space.color || '#6366F1' } : {}}
                  >
                    <LayoutGrid size={14} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-surface-900' : 'text-surface-700'
                      }`}
                    >
                      {space.name}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-surface-400">
                      <Users size={10} />
                      <span>{space.capacity}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Admin Link */}
      <div className="hidden md:block px-3 py-3 border-t border-surface-100">
        <Link
          to="/admin"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            location.pathname.startsWith('/admin')
              ? 'bg-surface-800 text-white'
              : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
          }`}
        >
          <ShieldCheck size={18} />
          Admin Console
        </Link>
      </div>
    </aside>
  );
}
