import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { subscribeToSpaces, subscribeToAllBookingsForDate, subscribeToGlobalSettings } from '../lib/firestore';
import { formatDateKey, generateTimeSlots } from '../lib/utils';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ startHour: 7, endHour: 21 });
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [userEmail, setUserEmail] = useState(() => {
    try {
      return localStorage.getItem('fortunespaces_user_email') || '';
    } catch {
      return '';
    }
  });

  const updateUserEmail = useCallback((email) => {
    setUserEmail(email);
    try {
      localStorage.setItem('fortunespaces_user_email', email);
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    setLoadingSpaces(true);
    const unsubscribe = subscribeToSpaces((fetchedSpaces) => {
      // Public grid only shows active spaces. Admin dashboard will need all of them, 
      // but they can be passed down there if needed. For now we expose all to context 
      // so Admin can use them, but we'll filter active ones for public UI.
      setSpaces(fetchedSpaces);
      
      const activeSpaces = fetchedSpaces.filter(s => s.status === 'active');
      
      // Auto-selection removed to support mobile master-list view.
      if (activeSpaces.length === 0) {
        setSelectedSpace(null);
      }
      setLoadingSpaces(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setLoadingBookings(true);
    const dateKey = formatDateKey(selectedDate);
    const unsubscribe = subscribeToAllBookingsForDate(dateKey, (fetchedBookings) => {
      setBookings(fetchedBookings);
      setLoadingBookings(false);
    });
    return unsubscribe;
  }, [selectedDate]);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((settings) => {
      setGlobalSettings(settings);
    });
    return unsubscribe;
  }, []);

  const timeSlots = useMemo(() => {
    return generateTimeSlots(globalSettings.startHour, globalSettings.endHour);
  }, [globalSettings]);

  const getBookingsForSpace = useCallback(
    (spaceId) => {
      return bookings.filter((b) => b.spaceId === spaceId);
    },
    [bookings]
  );

  const getUserActiveBooking = useCallback(
    (spaceId) => {
      if (!userEmail) return null;
      const now = new Date();
      return bookings.find((b) => {
        if (b.spaceId !== spaceId || b.status !== 'confirmed') return false;
        if (b.email.toLowerCase() !== userEmail.toLowerCase()) return false;
        
        const [startH, startM] = b.startTime.split(':').map(Number);
        const [endH, endM] = b.endTime.split(':').map(Number);
        const bookingDate = new Date(b.date + 'T00:00:00');
        const start = new Date(bookingDate);
        start.setHours(startH, startM, 0, 0);
        const end = new Date(bookingDate);
        end.setHours(endH, endM, 0, 0);
        return now >= start && now <= end;
      }) || null;
    },
    [bookings, userEmail]
  );

  return (
    <BookingContext.Provider
      value={{
        spaces,
        selectedSpace,
        setSelectedSpace,
        selectedDate,
        setSelectedDate,
        bookings,
        getBookingsForSpace,
        getUserActiveBooking,
        userEmail,
        updateUserEmail,
        loadingSpaces,
        loadingBookings,
        globalSettings,
        timeSlots,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
