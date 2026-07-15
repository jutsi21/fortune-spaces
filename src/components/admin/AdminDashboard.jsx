import { useState, useEffect, useMemo } from 'react';
import {
  LogOut,
  Search,
  Filter,
  CalendarDays,
  RefreshCw,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { subscribeToAllBookings, cancelBooking, updateBooking, subscribeToSpaces, subscribeToRecurringBookings } from '../../lib/firestore';
import { formatDateDisplay, formatTime } from '../../lib/utils';
import BookingRow from './BookingRow';
import EditBookingModal from './EditBookingModal';
import SpacesManager from './SpacesManager';
import AdminBookingModal from './AdminBookingModal';
import Button from '../ui/Button';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'recurring', label: 'Recurring' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { timeSlots, globalSettings } = useBooking();
  const [activeView, setActiveView] = useState('bookings'); // 'bookings' or 'spaces'
  
  const [singleBookings, setSingleBookings] = useState([]);
  const [recurringBookings, setRecurringBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, rowsPerPage]);

  useEffect(() => {
    let loaded1 = false;
    let loaded2 = false;
    
    const checkLoading = () => {
      if (loaded1 && loaded2) setLoadingBookings(false);
    };

    const unsub1 = subscribeToAllBookings((data) => {
      setSingleBookings(data);
      loaded1 = true;
      checkLoading();
    });
    
    const unsub2 = subscribeToRecurringBookings((data) => {
      setRecurringBookings(data);
      loaded2 = true;
      checkLoading();
    });

    const unsub3 = subscribeToSpaces(setSpaces);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const filteredBookings = useMemo(() => {
    const allBookings = [...singleBookings, ...recurringBookings];
    let result = allBookings;
    const todayDayOfWeek = new Date().getDay();

    // Filter by tab
    switch (activeFilter) {
      case 'all':
        result = result.filter((b) => !b.isRecurring);
        break;
      case 'today':
        result = result.filter((b) => 
          (b.date === todayStr && b.status === 'confirmed' && !b.isRecurring) || 
          (b.isRecurring && b.dayOfWeek === todayDayOfWeek && b.status === 'confirmed')
        );
        break;
      case 'upcoming':
        result = result.filter((b) => !b.isRecurring && b.date > todayStr && b.status === 'confirmed');
        break;
      case 'past':
        result = result.filter((b) => !b.isRecurring && b.date < todayStr && b.status === 'confirmed');
        break;
      case 'cancelled':
        result = result.filter((b) => !b.isRecurring && b.status === 'cancelled');
        break;
      case 'recurring':
        result = result.filter((b) => b.isRecurring && b.status === 'confirmed');
        break;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.fullName?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q) ||
          b.purpose?.toLowerCase().includes(q)
      );
    }

    // Sort logic: latest booking at the top
    result.sort((a, b) => {
      if (a.isRecurring && b.isRecurring) {
        return (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime);
      }
      if (a.isRecurring) return -1;
      if (b.isRecurring) return 1;

      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.startTime.localeCompare(a.startTime);
    });

    return result;
  }, [singleBookings, recurringBookings, activeFilter, searchQuery, todayStr]);

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + rowsPerPage);

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? The slot will become available again.')) {
      try {
        await cancelBooking(bookingId);
      } catch (err) {
        console.error('Cancel failed:', err);
        alert('Failed to cancel booking.');
      }
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
  };

  const handleSaveEdit = async (bookingId, updates) => {
    try {
      await updateBooking(bookingId, updates);
      setEditingBooking(null);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update booking.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft overflow-hidden shrink-0">
              <img src="https://res.cloudinary.com/dw9axu7dy/image/upload/v1778062222/Fortune_Builders_LOGO_h4eb55.jpg" alt="Fortune Builders Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-surface-900">Admin Console</h1>
              <p className="text-xs text-surface-400">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center bg-surface-100 rounded-xl p-1 mx-8">
             <button
                onClick={() => setActiveView('bookings')}
                className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeView === 'bookings'
                    ? 'bg-white text-surface-900 shadow-soft'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveView('spaces')}
                className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeView === 'spaces'
                    ? 'bg-white text-surface-900 shadow-soft'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                Spaces
              </button>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="btn-ghost text-sm"
            >
              <LayoutGrid size={16} />
              Public View
            </a>
            <Button variant="secondary" onClick={logout} icon={LogOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {activeView === 'bookings' ? (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: 'Total Bookings',
                  value: singleBookings.filter((b) => b.status === 'confirmed').length,
                  color: 'text-brand-600',
                },
                {
                  label: 'Today',
                  value: singleBookings.filter((b) => b.date === todayStr && b.status === 'confirmed').length,
                  color: 'text-yours-dark',
                },
                {
                  label: 'Upcoming',
                  value: singleBookings.filter((b) => b.date > todayStr && b.status === 'confirmed').length,
                  color: 'text-available-dark',
                },
                {
                  label: 'Cancelled',
                  value: singleBookings.filter((b) => b.status === 'cancelled').length,
                  color: 'text-booked-dark',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4">
                  <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Filter Tabs + Search */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      activeFilter === tab.key
                        ? 'bg-white text-surface-900 shadow-soft'
                        : 'text-surface-500 hover:text-surface-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
                  />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 w-[240px] py-2"
                  />
                </div>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="py-2">
                  Create Booking
                </Button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="card overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_0.6fr] gap-4 px-5 py-3 bg-surface-50 border-b border-surface-100">
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Booker</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Space</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Date</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Time</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Created At</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Status</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider text-right">Actions</span>
              </div>

              {/* Table Body */}
              {loadingBookings ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-surface-500">Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays size={32} className="text-surface-300 mx-auto mb-3" />
                  <p className="text-sm text-surface-500 font-medium">No bookings found</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Bookings will appear here in real-time'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-surface-100">
                    {paginatedBookings.map((booking) => {
                    const space = spaces.find(s => s.id === booking.spaceId);
                    return (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        spaceName={space ? space.name : 'Unknown Space'}
                        onCancel={() => handleCancel(booking.id)}
                        onEdit={() => handleEdit(booking)}
                      />
                    );
                  })}
                </div>
              {/* Pagination Footer */}
              {filteredBookings.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-surface-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-surface-600 font-medium">
                      <span>Rows per page:</span>
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="input-field py-1 px-2 text-sm bg-surface-50 border-surface-200 h-8 rounded-lg"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="text-sm text-surface-400">
                      Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, filteredBookings.length)} of {filteredBookings.length}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-surface-500 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &larr; Prev
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 text-sm font-medium text-surface-500 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </>
        ) : (
          <SpacesManager spaces={spaces} />
        )}
      </div>

      {/* Edit Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          booking={editingBooking}
          spaces={spaces}
          onSave={handleSaveEdit}
          timeSlots={timeSlots}
        />
      )}
      
      {isCreateModalOpen && (
        <AdminBookingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
