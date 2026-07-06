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
import { subscribeToAllBookings, cancelBooking, updateBooking, subscribeToSpaces } from '../../lib/firestore';
import { formatDateDisplay, formatTime } from '../../lib/utils';
import BookingRow from './BookingRow';
import EditBookingModal from './EditBookingModal';
import SpacesManager from './SpacesManager';
import Button from '../ui/Button';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { timeSlots, globalSettings } = useBooking();
  const [activeView, setActiveView] = useState('bookings'); // 'bookings' or 'spaces'
  
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    const unsub1 = subscribeToAllBookings((data) => {
      setBookings(data);
      setLoadingBookings(false);
    });
    const unsub2 = subscribeToSpaces(setSpaces);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Filter by tab
    switch (activeFilter) {
      case 'today':
        result = result.filter((b) => b.date === todayStr && b.status === 'confirmed');
        break;
      case 'upcoming':
        result = result.filter((b) => b.date >= todayStr && b.status === 'confirmed');
        break;
      case 'past':
        result = result.filter((b) => b.date < todayStr && b.status === 'confirmed');
        break;
      case 'cancelled':
        result = result.filter((b) => b.status === 'cancelled');
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

    return result;
  }, [bookings, activeFilter, searchQuery, todayStr]);

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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
              <Zap size={18} className="text-white" />
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
                  value: bookings.filter((b) => b.status === 'confirmed').length,
                  color: 'text-brand-600',
                },
                {
                  label: 'Today',
                  value: bookings.filter((b) => b.date === todayStr && b.status === 'confirmed').length,
                  color: 'text-yours-dark',
                },
                {
                  label: 'Upcoming',
                  value: bookings.filter((b) => b.date > todayStr && b.status === 'confirmed').length,
                  color: 'text-available-dark',
                },
                {
                  label: 'Cancelled',
                  value: bookings.filter((b) => b.status === 'cancelled').length,
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
                  className="input-field pl-10 w-[280px] py-2"
                />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="card overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.6fr_0.6fr] gap-4 px-5 py-3 bg-surface-50 border-b border-surface-100">
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Booker</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Space</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Date</span>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Time</span>
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
                <div className="divide-y divide-surface-100">
                  {filteredBookings.map((booking) => {
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
              )}
            </div>

            {/* Count */}
            <p className="text-xs text-surface-400 mt-3 px-1">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
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
    </div>
  );
}
