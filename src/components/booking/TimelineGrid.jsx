import { useState } from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { getSlotStatus, getBookingForSlot, formatTime, isSlotPast } from '../../lib/utils';
import BookingModal from './BookingModal';

export default function TimelineGrid() {
  const {
    spaces,
    selectedSpace,
    selectedDate,
    getBookingsForSpace,
    userEmail,
    loadingSpaces,
    timeSlots,
  } = useBooking();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSpaceForBooking, setSelectedSpaceForBooking] = useState(null);

  const handleSlotClick = (space, slot) => {
    const spaceBookings = getBookingsForSpace(space.id);
    const status = getSlotStatus(slot.index, spaceBookings, userEmail);

    if (status !== 'available') return;
    if (isSlotPast(slot.end, selectedDate)) return;

    setSelectedSpaceForBooking(space);
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  if (loadingSpaces) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-surface-500 font-medium">Loading spaces...</p>
        </div>
      </div>
    );
  }

  const spaceBookings = selectedSpace ? getBookingsForSpace(selectedSpace.id) : [];

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          {!selectedSpace ? (
            <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-3xl border-2 border-dashed border-surface-200 shadow-sm">
              <MapPin size={48} className="mx-auto text-surface-300 mb-4" />
              <h2 className="text-xl font-bold text-surface-900 mb-2">No Space Selected</h2>
              <p className="text-surface-500 font-medium">Select a space from the sidebar to view its timeline.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Space Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6 mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: selectedSpace.color || '#6366F1' }} />
                <h2 className="text-2xl font-extrabold text-surface-900 tracking-tight">{selectedSpace.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2 text-surface-500 text-sm font-semibold">
                  <Users size={16} />
                  <span>{selectedSpace.capacity} seats</span>
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="flex bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
                
                {/* Left Column: Time Labels */}
                <div className="w-24 shrink-0 border-r border-surface-100 flex flex-col bg-surface-50/50">
                  {timeSlots.map((slot) => (
                    <div 
                      key={`label-${slot.index}`} 
                      className="h-24 flex items-start justify-end pr-4 pt-3 border-b border-surface-100 last:border-b-0"
                    >
                      <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">{slot.label}</span>
                    </div>
                  ))}
                </div>

                {/* Right Column: Grid and Bookings */}
                <div 
                  className="flex-1 grid relative"
                  style={{ gridTemplateRows: `repeat(${timeSlots.length}, 6rem)` }}
                >
                  {/* Empty Slots */}
                  {timeSlots.map((slot, arrayIndex) => {
                    const isPast = isSlotPast(slot.end, selectedDate);
                    const booking = getBookingForSlot(slot.index, spaceBookings);

                    // If booked, don't render the clickable empty slot background, we'll render the solid booking card on top.
                    if (booking) return null;

                    // Check for space-level availability (e.g. maintenance)
                    const isMaintenance = selectedSpace && selectedSpace.status !== 'active';
                    const notAvailable = isPast || isMaintenance;
                    
                    let reason = '';
                    if (isPast) reason = '(Past Time)';
                    else if (isMaintenance) reason = '(Maintenance)';

                    return (
                      <div
                        key={`slot-${slot.index}`}
                        style={{ 
                          gridRow: arrayIndex + 1, 
                          gridColumn: 1,
                          ...(notAvailable ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)' } : {})
                        }}
                        className={`group border-b border-surface-100 last:border-b-0 transition-colors ${
                          notAvailable 
                            ? 'bg-surface-50/50 cursor-not-allowed' 
                            : 'hover:bg-brand-50/50 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!notAvailable) handleSlotClick(selectedSpace, slot);
                        }}
                      >
                        {!notAvailable ? (
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-bold text-brand-600 bg-white px-4 py-1.5 rounded-full shadow-sm border border-brand-100">
                              Book {slot.label}
                            </span>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-surface-400">Not Available</span>
                            <span className="text-xs font-semibold text-surface-400/80">{reason}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Booking Cards */}
                  {spaceBookings.filter(b => b.status === 'confirmed').map(booking => {
                    const startSlotIndexInArray = timeSlots.findIndex(s => s.index === booking.slotIndex);
                    if (startSlotIndexInArray === -1) return null;
                    
                    const startSlot = timeSlots[startSlotIndexInArray];
                    const duration = booking.durationBlocks || 1;
                    const isYours = userEmail && booking.email.toLowerCase() === userEmail.toLowerCase();
                    
                    // Format the end time label
                    const endSlotIndex = booking.slotIndex + duration - 1;
                    const endSlot = timeSlots.find(s => s.index === endSlotIndex);
                    // endSlot.end is in 24h format, convert to 12h for display
                    const endTimeLabel = endSlot ? formatTime(endSlot.end) : 'Unknown';

                    return (
                      <div
                        key={booking.id}
                        style={{ 
                          gridRow: `${startSlotIndexInArray + 1} / span ${duration}`,
                          gridColumn: 1 
                        }}
                        className={`m-2 rounded-xl p-4 shadow-sm border-2 flex flex-col justify-center overflow-hidden transition-transform hover:scale-[1.01] ${
                          isYours 
                            ? 'bg-brand-50 border-brand-400 text-brand-900' 
                            : 'bg-surface-800 border-surface-900 text-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isYours ? 'text-brand-600' : 'text-surface-400'}`}>
                            <Clock size={12} />
                            <span>{startSlot.label} - {endTimeLabel}</span>
                          </div>
                          
                          <div className={`shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm border ${
                            isYours 
                              ? 'bg-brand-600 border-brand-500 text-white' 
                              : 'bg-white border-surface-700 text-surface-900'
                          }`}>
                            {isYours ? 'Your Booking' : (booking.isRecurring ? 'Reserved (Recurring)' : 'Reserved')}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-base truncate">
                            Booked by: {booking.fullName} <span className="opacity-80 font-medium">({booking.jobTitle})</span>
                          </h3>
                          <p className={`text-sm truncate ${isYours ? 'text-brand-700' : 'text-surface-300'}`}>
                            Purpose: {booking.purpose || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && selectedSpaceForBooking && (
        <BookingModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSlot(null);
            setSelectedSpaceForBooking(null);
          }}
          space={selectedSpaceForBooking}
          slot={selectedSlot}
          date={selectedDate}
        />
      )}
    </>
  );
}
