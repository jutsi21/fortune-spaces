import { useState, useMemo, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { createBooking } from '../../lib/firestore';
import { formatTime, formatDateKey, getSlotStatus } from '../../lib/utils';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function BookingModal({ isOpen, onClose, space, slot, date }) {
  const { updateUserEmail, getBookingsForSpace, userEmail, timeSlots } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [durationBlocks, setDurationBlocks] = useState(1);
  const [customDuration, setCustomDuration] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    purpose: '',
  });

  const spaceBookings = useMemo(() => {
    return space ? getBookingsForSpace(space.id) : [];
  }, [space, getBookingsForSpace]);

  // Determine maximum blocks allowed (up to 8 blocks = 4 hours, bounded by end of day)
  const maxAllowedBlocks = slot ? Math.min(8, timeSlots.length - slot.index) : 1;

  // Check for conflicts
  const hasConflict = useMemo(() => {
    if (!slot) return false;
    const actualDuration = durationBlocks > 0 ? durationBlocks : 1;
    const newStart = slot.index;
    const newEnd = slot.index + actualDuration;

    for (const b of spaceBookings.filter(bk => bk.status === 'confirmed')) {
      const bStart = b.slotIndex;
      const bEnd = b.slotIndex + (b.durationBlocks || 1);
      if (newStart < bEnd && bStart < newEnd) {
        return true;
      }
    }
    return false;
  }, [slot, durationBlocks, spaceBookings]);

  const calculatedEndTime = useMemo(() => {
    if (!slot) return '';
    const actualDuration = durationBlocks > 0 ? durationBlocks : 1;
    const [h, m] = slot.start.split(':').map(Number);
    const endH = h + actualDuration;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, [slot, durationBlocks]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasConflict) return;

    setLoading(true);
    setError(null);

    try {
      await createBooking({
        spaceId: space.id,
        date: formatDateKey(date),
        startTime: slot.start,
        endTime: calculatedEndTime,
        slotIndex: slot.index,
        durationBlocks: durationBlocks,
        ...formData,
      });

      // Save email to localStorage for tracking 'My Bookings'
      updateUserEmail(formData.email);
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  if (!space || !slot) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book ${space.name}`}>
      <div className="mb-6 pb-4 border-b border-surface-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500 font-medium">Start Time</p>
          <p className="text-surface-900 font-bold">
            {formatTime(slot.start)}
          </p>
        </div>
        <div>
          <p className="text-sm text-surface-500 font-medium">End Time</p>
          <p className="text-surface-900 font-bold">
            {formatTime(calculatedEndTime)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-surface-500 font-medium">Date</p>
          <p className="text-surface-900 font-bold">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-surface-700">
            Duration
          </label>
          {maxAllowedBlocks < 1 ? (
            <div className="p-3 rounded-xl bg-surface-100 text-surface-500 text-sm font-medium border border-surface-200">
              Insufficient time before end of day.
            </div>
          ) : (
            <div className="flex gap-2">
              {[1, 2, 3, 4].filter(b => b <= maxAllowedBlocks).map(blocks => {
                const hours = blocks;
                const isSelected = durationBlocks === blocks && customDuration === '';
                return (
                  <button
                    key={blocks}
                    type="button"
                    onClick={() => {
                      setDurationBlocks(blocks);
                      setCustomDuration('');
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-soft border-brand-600'
                        : 'bg-surface-50 text-surface-700 hover:bg-surface-100 border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    {hours} {hours === 1 ? 'Hour' : 'Hours'}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs font-bold text-surface-500 mb-1">
              Custom / Beyond 4 Hours
            </label>
            <input
              type="number"
              min="5"
              placeholder="e.g. 5"
              value={customDuration}
              onChange={(e) => {
                const val = e.target.value;
                setCustomDuration(val);
                if (val && !isNaN(val)) {
                  setDurationBlocks(Number(val));
                }
              }}
              className="input-field"
            />
          </div>
        </div>

        {hasConflict && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-fade-in">
            Time slot conflict: Part of this duration overlaps an existing booking.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Input
            label="Full Name"
            name="fullName"
            required
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
          />
          <Input
            label="Job Title"
            name="jobTitle"
            required
            placeholder="Product Manager"
            value={formData.jobTitle}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="john@company.com"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            required
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-surface-700 mb-1.5">
            Purpose of Meeting
          </label>
          <textarea
            name="purpose"
            required
            rows={3}
            placeholder="e.g., Q3 Planning and Strategy Review"
            className="w-full px-3 py-2 bg-surface-50 border-2 border-transparent rounded-xl text-sm transition-all focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 hover:bg-surface-100 resize-none"
            value={formData.purpose}
            onChange={handleChange}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading || hasConflict}>
            {loading ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
