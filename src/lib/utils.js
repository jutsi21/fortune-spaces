/**
 * Time slot and formatting utility functions for the booking grid.
 */

const SLOT_DURATION_MINUTES = 60;
const DAY_START_HOUR = 7;   // 7:00 AM
const DAY_END_HOUR = 21;    // 9:00 PM
const TOTAL_SLOTS = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_DURATION_MINUTES; // 14

/**
 * Generates time slots dynamically based on operating hours.
 * Each slot: { index, start: "HH:mm", end: "HH:mm", label: "7:00 AM" }
 */
export function generateTimeSlots(startHour = 7, endHour = 21) {
  const slots = [];
  // Add +1 so the selected endHour is included as the final bookable slot row.
  const totalSlots = endHour - startHour + 1;
  for (let i = 0; i < totalSlots; i++) {
    const totalMinutes = startHour * 60 + i * SLOT_DURATION_MINUTES;
    const endMinutes = totalMinutes + SLOT_DURATION_MINUTES;

    const startH = Math.floor(totalMinutes / 60);
    const startM = totalMinutes % 60;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const start = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    slots.push({
      index: startH - 7, // Preserve backward compatibility with existing Firestore bookings (7 AM = index 0)
      start,
      end,
      label: formatTime(start),
    });
  }
  return slots;
}

/**
 * Converts 24h time string "14:00" → "2:00 PM"
 */
export function formatTime(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getBookingForSlot(slotIndex, bookings) {
  return bookings.find((b) => {
    if (b.status !== 'confirmed') return false;
    const startIdx = b.slotIndex;
    const duration = b.durationBlocks || 1;
    return slotIndex >= startIdx && slotIndex < startIdx + duration;
  }) || null;
}

/**
 * Returns the status of a slot: "available" | "booked" | "yours"
 */
export function getSlotStatus(slotIndex, bookings, userEmail) {
  const booking = getBookingForSlot(slotIndex, bookings);
  if (!booking) return 'available';
  if (userEmail && booking.email.toLowerCase() === userEmail.toLowerCase()) return 'yours';
  return 'booked';
}

/**
 * Formats a date object to "YYYY-MM-DD" string for Firestore queries.
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns a human-friendly date string: "Mon, Jul 6, 2026"
 */
export function formatDateDisplay(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns true if a date is today.
 */
export function isToday(date) {
  const now = new Date();
  return formatDateKey(date) === formatDateKey(now);
}

/**
 * Returns true if a slot time has already passed for a given date.
 */
export function isSlotPast(slotEnd, date) {
  const now = new Date();
  const [h, m] = slotEnd.split(':').map(Number);
  const slotDate = new Date(date);
  slotDate.setHours(h, m, 0, 0);
  return slotDate < now;
}

export { TOTAL_SLOTS, SLOT_DURATION_MINUTES, DAY_START_HOUR, DAY_END_HOUR };
