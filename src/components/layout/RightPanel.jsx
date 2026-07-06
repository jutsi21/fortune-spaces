import {
  Users,
  MapPin,
  Wifi,
  Monitor,
  Mic,
  Speaker,
  Tv,
  Presentation,
  Wind,
  Coffee,
  Info
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import SoundPad from '../soundpad/SoundPad';

export default function RightPanel() {
  const { selectedSpace, getUserActiveBooking } = useBooking();

  if (!selectedSpace) {
    return (
      <aside className="w-[320px] h-screen bg-white border-l border-surface-200 flex items-center justify-center shrink-0">
        <p className="text-sm text-surface-400">Select a space to view details</p>
      </aside>
    );
  }

  const activeBooking = getUserActiveBooking(selectedSpace.id);

  // Format type nicely
  const formattedType = selectedSpace.type
    ? selectedSpace.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Space';

  return (
    <aside className="w-[320px] h-screen bg-white border-l border-surface-200 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      {/* Space Header */}
      <div className="px-5 py-5 border-b border-surface-100">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-soft"
            style={{ backgroundColor: selectedSpace.color || '#6366F1' }}
          >
            <Monitor size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900">{selectedSpace.name}</h2>
            <p className="text-xs text-surface-400 font-medium">{formattedType}</p>
          </div>
        </div>

        {/* Capacity Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-surface-50 rounded-lg px-3 py-1.5">
            <Users size={14} className="text-surface-500" />
            <span className="text-sm font-semibold text-surface-700">{selectedSpace.capacity}</span>
            <span className="text-xs text-surface-400">seats</span>
          </div>
        </div>
      </div>

      {/* Sound Pad or Info */}
      {activeBooking && selectedSpace.type === 'soundpad' ? (
        <div className="flex-1 px-5 py-4 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-available animate-pulse" />
            <h3 className="text-sm font-bold text-surface-800">Live Sound Pad</h3>
          </div>
          <p className="text-xs text-surface-400 mb-4">
            Your meeting is active. Control audio below.
          </p>
          <SoundPad />
        </div>
      ) : activeBooking ? (
         <div className="flex-1 px-5 py-4 animate-fade-up">
           <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 rounded-full bg-available animate-pulse" />
             <h3 className="text-sm font-bold text-surface-800">Active Booking</h3>
           </div>
           <p className="text-xs text-surface-400 mb-4">
             You have this space booked right now!
           </p>
         </div>
      ) : (
        <div className="flex-1 px-5 py-4">
          <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">
            Details
          </h3>
          <div className="p-4 rounded-xl bg-gradient-to-br from-surface-50 to-surface-100 border border-surface-200">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-surface-400" />
              <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                {formattedType}
              </h4>
            </div>
            <p className="text-xs text-surface-400 leading-relaxed">
              Book this {formattedType.toLowerCase()} by selecting an available time slot on the grid.
              {selectedSpace.type === 'soundpad' && " This will unlock the Live Sound Pad."}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
