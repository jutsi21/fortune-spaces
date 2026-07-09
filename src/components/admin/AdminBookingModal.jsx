import { useState, useMemo, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { createBooking } from '../../lib/firestore';
import { formatDateKey, formatTime } from '../../lib/utils';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AdminBookingModal({ isOpen, onClose }) {
  const { spaces, timeSlots, getBookingsForSpace } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [spaceId, setSpaceId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(formatDateKey(new Date()));
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  
  const [startSlotIndex, setStartSlotIndex] = useState('');
  const [durationBlocks, setDurationBlocks] = useState(1);
  const [customDuration, setCustomDuration] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    purpose: '',
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSpaceId('');
      setIsRecurring(false);
      setDate(formatDateKey(new Date()));
      setDayOfWeek(new Date().getDay());
      setStartSlotIndex('');
      setDurationBlocks(1);
      setCustomDuration('');
      setFormData({ fullName: '', jobTitle: '', email: '', phone: '', purpose: '' });
      setError(null);
    }
  }, [isOpen]);

  const maxAllowedBlocks = startSlotIndex !== '' 
    ? Math.min(8, timeSlots.length - startSlotIndex) 
    : 1;

  const startSlot = useMemo(() => {
    if (startSlotIndex === '') return null;
    return timeSlots.find(s => s.index === Number(startSlotIndex));
  }, [startSlotIndex, timeSlots]);

  const calculatedEndTime = useMemo(() => {
    if (!startSlot) return '';
    const actualDuration = durationBlocks > 0 ? durationBlocks : 1;
    const [h, m] = startSlot.start.split(':').map(Number);
    const endH = h + actualDuration;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, [startSlot, durationBlocks]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!spaceId || startSlotIndex === '') {
      setError('Please select a space and start time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        spaceId,
        startTime: startSlot.start,
        endTime: calculatedEndTime,
        slotIndex: Number(startSlotIndex),
        durationBlocks: durationBlocks,
        ...formData,
      };

      if (isRecurring) {
        payload.isRecurring = true;
        payload.dayOfWeek = Number(dayOfWeek);
      } else {
        payload.isRecurring = false;
        payload.date = date;
      }

      await createBooking(payload);
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Booking (Admin)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-surface-700">Space</label>
          <select
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            className="w-full px-3 py-2 bg-surface-50 border-2 border-transparent rounded-xl text-sm transition-all focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 hover:bg-surface-100"
            required
          >
            <option value="" disabled>Select a space</option>
            {spaces.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded border-surface-300 focus:ring-brand-500"
          />
          <label htmlFor="isRecurring" className="text-sm font-bold text-surface-700 cursor-pointer">
            Recurring Booking (Weekly)
          </label>
        </div>

        {isRecurring ? (
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-surface-700">Day of the Week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 bg-surface-50 border-2 border-transparent rounded-xl text-sm transition-all focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 hover:bg-surface-100"
            >
              {DAYS_OF_WEEK.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-surface-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface-50 border-2 border-transparent rounded-xl text-sm transition-all focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 hover:bg-surface-100"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-surface-700">Start Time</label>
            <select
              value={startSlotIndex}
              onChange={(e) => {
                setStartSlotIndex(e.target.value);
                setDurationBlocks(1);
                setCustomDuration('');
              }}
              className="w-full px-3 py-2 bg-surface-50 border-2 border-transparent rounded-xl text-sm transition-all focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 hover:bg-surface-100"
              required
            >
              <option value="" disabled>Select time</option>
              {timeSlots.map(slot => (
                <option key={slot.index} value={slot.index}>{slot.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
             <label className="block text-sm font-bold text-surface-700">End Time</label>
             <div className="px-3 py-2 bg-surface-100 border-2 border-transparent rounded-xl text-sm font-medium text-surface-700">
               {calculatedEndTime ? formatTime(calculatedEndTime) : '-'}
             </div>
          </div>
        </div>

        {startSlotIndex !== '' && (
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
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-100">
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
            rows={2}
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
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
