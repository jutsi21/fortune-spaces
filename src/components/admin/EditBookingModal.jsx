import { useState, useMemo } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatTime } from '../../lib/utils';

export default function EditBookingModal({ isOpen, onClose, booking, spaces, onSave, timeSlots }) {
  const [spaceId, setSpaceId] = useState(booking.spaceId);
  const [slotIndex, setSlotIndex] = useState(booking.slotIndex);
  const [loading, setLoading] = useState(false);

  const [durationBlocks, setDurationBlocks] = useState(booking.durationBlocks || 1);
  const [customDuration, setCustomDuration] = useState('');
  const [error, setError] = useState('');

  const selectedSlot = useMemo(
    () => timeSlots.find((s) => s.index === slotIndex),
    [slotIndex]
  );

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === spaceId),
    [spaceId, spaces]
  );

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const slot = timeSlots.find(s => s.index === slotIndex);
      const actualDuration = durationBlocks > 0 ? durationBlocks : 1;
      
      const [h, m] = slot.start.split(':').map(Number);
      const endH = h + actualDuration;
      const calculatedEndTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      await onSave(booking.id, {
        spaceId,
        slotIndex,
        startTime: slot.start,
        endTime: calculatedEndTime,
        durationBlocks: actualDuration,
      });
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to update booking due to a conflict.');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = spaceId !== booking.spaceId || slotIndex !== booking.slotIndex || durationBlocks !== (booking.durationBlocks || 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Booking" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Booker info (read-only) */}
        <div className="bg-surface-50 rounded-xl p-3 border border-surface-100">
          <p className="text-sm font-bold text-surface-800">{booking.fullName}</p>
          <p className="text-xs text-surface-400">{booking.email} · {booking.phone}</p>
          <p className="text-xs text-surface-500 mt-1">{booking.purpose}</p>
        </div>

        {/* Space Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-surface-700">Space</label>
          <select
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            className="input-field"
          >
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name} ({space.capacity} seats)
              </option>
            ))}
          </select>
        </div>

        {/* Start Time Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-surface-700">Start Time</label>
          <select
            value={slotIndex}
            onChange={(e) => setSlotIndex(Number(e.target.value))}
            className="input-field"
          >
            {timeSlots.map((slot) => (
              <option key={slot.index} value={slot.index}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-surface-700">Duration</label>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4].map(blocks => {
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
                  {blocks} {blocks === 1 ? 'Hour' : 'Hours'}
                </button>
              );
            })}
          </div>

          {/* Custom Duration */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Custom / Beyond 4 Hours</label>
            <input
              type="number"
              min="1"
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

        {/* Date (read-only) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-surface-700">Date</label>
          <input
            type="text"
            value={booking.date}
            disabled
            className="input-field opacity-60 cursor-not-allowed"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-fade-in">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            icon={Save}
            disabled={!hasChanges}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
