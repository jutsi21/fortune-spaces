import { formatTime } from '../../lib/utils';
import { Pencil, Trash2, User, Mail, Briefcase } from 'lucide-react';

export default function BookingRow({ booking, spaceName, onCancel, onEdit }) {
  const isCancelled = booking.status === 'cancelled';
  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateDisplay = booking.isRecurring ? `Every ${DAYS_OF_WEEK[booking.dayOfWeek]}` : booking.date;

  return (
    <div
      className={`grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_0.6fr] gap-4 px-5 py-3.5 items-center hover:bg-surface-50 transition-colors ${
        isCancelled ? 'opacity-60' : ''
      }`}
    >
      {/* Booker */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-surface-800 truncate">{booking.fullName}</p>
        <div className="flex items-center gap-1 text-xs text-surface-400 truncate">
          <Mail size={10} />
          <span className="truncate">{booking.email}</span>
        </div>
      </div>

      {/* Space */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-surface-700 truncate">{spaceName}</p>
      </div>

      {/* Date */}
      <div>
        <p className="text-sm text-surface-700">{dateDisplay}</p>
      </div>

      {/* Time */}
      <div>
        <p className="text-sm text-surface-700">
          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
        </p>
      </div>

      {/* Created At */}
      <div>
        <p className="text-sm text-surface-500">
          {booking.createdAt ? new Date(booking.createdAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
        </p>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1 items-start">
        <span className={isCancelled ? 'badge-cancelled' : 'badge-confirmed'}>
          {booking.status}
        </span>
        {booking.isRecurring && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
            Recurring
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        {!isCancelled && (
          <>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Edit booking"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-surface-400 hover:text-booked hover:bg-booked-light transition-colors"
              title="Cancel booking"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
