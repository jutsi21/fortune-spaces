import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Collection References ───────────────────────────────────────────

const spacesCol = collection(db, 'spaces');
const bookingsCol = collection(db, 'bookings');
const settingsCol = collection(db, 'settings');

// ─── Spaces ───────────────────────────────────────────────────────────

/**
 * Subscribe to all spaces in real-time.
 * @param {function} callback - receives array of space objects
 * @returns {function} unsubscribe function
 */
export function subscribeToSpaces(callback) {
  // Querying all spaces. We'll filter 'active' vs 'archived' on the client
  // so the admin can see everything, and the public view can filter.
  // We can order by 'name' for simple sorting.
  const q = query(spacesCol, orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const spaces = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(spaces);
  });
}

/**
 * Create a new space.
 */
export async function createSpace(spaceData) {
  const docRef = await addDoc(spacesCol, {
    ...spaceData,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing space.
 */
export async function updateSpace(spaceId, updates) {
  const docRef = doc(db, 'spaces', spaceId);
  await updateDoc(docRef, updates);
}

/**
 * Archive a space (sets status to 'archived').
 */
export async function archiveSpace(spaceId) {
  const docRef = doc(db, 'spaces', spaceId);
  await updateDoc(docRef, {
    status: 'archived',
  });
}

// ─── Bookings ────────────────────────────────────────────────────────

/**
 * Subscribe to bookings for a specific space and date in real-time.
 */
export function subscribeToBookings(spaceId, date, callback) {
  const q = query(
    bookingsCol,
    where('spaceId', '==', spaceId),
    where('date', '==', date)
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(bookings);
  });
}

/**
 * Subscribe to ALL bookings for a given date (used by the grid to show all spaces).
 */
export function subscribeToAllBookingsForDate(date, callback) {
  const q = query(
    bookingsCol,
    where('date', '==', date)
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(bookings);
  });
}

/**
 * Subscribe to active recurring bookings.
 */
export function subscribeToRecurringBookings(callback) {
  const q = query(
    bookingsCol,
    where('isRecurring', '==', true),
    where('status', '==', 'confirmed')
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(bookings);
  });
}

/**
 * Create a new booking with `confirmed` status.
 * Enforces minimum 1-hour duration (2 blocks) and checks for conflicts.
 */
export async function createBooking(bookingData) {
  if (!bookingData.durationBlocks || bookingData.durationBlocks < 1) {
    throw new Error('Minimum booking duration is 1 hour.');
  }

  // Validation helper
  const newStart = bookingData.slotIndex;
  const newEnd = bookingData.slotIndex + bookingData.durationBlocks;
  const hasOverlap = (b) => {
    const bStart = b.slotIndex;
    const bEnd = b.slotIndex + (b.durationBlocks || 1);
    return newStart < bEnd && bStart < newEnd;
  };

  const dayOfWeek = bookingData.isRecurring
    ? bookingData.dayOfWeek
    : new Date(bookingData.date + 'T00:00:00').getDay();

  // 1. Check against recurring bookings on this day of week
  const recurringQ = query(
    bookingsCol,
    where('spaceId', '==', bookingData.spaceId),
    where('isRecurring', '==', true),
    where('dayOfWeek', '==', dayOfWeek),
    where('status', '==', 'confirmed')
  );
  const recurringSnap = await getDocs(recurringQ);
  const recurringBookings = recurringSnap.docs.map(doc => doc.data());

  if (recurringBookings.some(hasOverlap)) {
    throw new Error('Time slot conflict with a recurring booking.');
  }

  // 2. Check single bookings
  if (!bookingData.isRecurring) {
    const singleQ = query(
      bookingsCol,
      where('spaceId', '==', bookingData.spaceId),
      where('date', '==', bookingData.date),
      where('status', '==', 'confirmed')
    );
    const singleSnap = await getDocs(singleQ);
    const singleBookings = singleSnap.docs.map((doc) => doc.data());
    
    if (singleBookings.some(hasOverlap)) {
      throw new Error('Time slot conflict detected on the server.');
    }
  } else {
    // If creating a recurring booking, check ALL confirmed single bookings for that space
    const allSingleQ = query(
      bookingsCol,
      where('spaceId', '==', bookingData.spaceId),
      where('status', '==', 'confirmed')
    );
    const allSingleSnap = await getDocs(allSingleQ);
    const singleBookings = allSingleSnap.docs
      .map(doc => doc.data())
      .filter(b => !b.isRecurring && new Date(b.date + 'T00:00:00').getDay() === dayOfWeek);

    if (singleBookings.some(hasOverlap)) {
      throw new Error('Time slot conflict with an existing single booking on this day of the week.');
    }
  }

  const docRef = await addDoc(bookingsCol, {
    ...bookingData,
    status: 'confirmed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a booking with overlap validation.
 */
export async function updateBooking(bookingId, updates) {
  const docRef = doc(db, 'bookings', bookingId);
  const bookingSnap = await getDoc(docRef);
  if (!bookingSnap.exists()) throw new Error('Booking not found');
  const existingData = bookingSnap.data();

  const newSpaceId = updates.spaceId !== undefined ? updates.spaceId : existingData.spaceId;
  const newDate = updates.date !== undefined ? updates.date : existingData.date;
  const newStart = updates.slotIndex !== undefined ? updates.slotIndex : existingData.slotIndex;
  const newDuration = updates.durationBlocks !== undefined ? updates.durationBlocks : existingData.durationBlocks;

  if (newDuration < 1) {
    throw new Error('Minimum booking duration is 1 hour.');
  }

  const newEnd = newStart + newDuration;

  const isRecurring = updates.isRecurring !== undefined ? updates.isRecurring : existingData.isRecurring;
  const newDayOfWeek = updates.dayOfWeek !== undefined ? updates.dayOfWeek : existingData.dayOfWeek;
  const dayOfWeek = isRecurring ? newDayOfWeek : new Date(newDate + 'T00:00:00').getDay();

  const hasOverlap = (b) => {
    const bStart = b.slotIndex;
    const bEnd = b.slotIndex + (b.durationBlocks || 1);
    return newStart < bEnd && bStart < newEnd;
  };

  // 1. Check against recurring bookings
  const recurringQ = query(
    bookingsCol,
    where('spaceId', '==', newSpaceId),
    where('isRecurring', '==', true),
    where('dayOfWeek', '==', dayOfWeek),
    where('status', '==', 'confirmed')
  );
  const recurringSnap = await getDocs(recurringQ);
  const recurringBookings = recurringSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.id !== bookingId);

  if (recurringBookings.some(hasOverlap)) {
    throw new Error('Time slot conflict with a recurring booking.');
  }

  // 2. Check single bookings
  if (!isRecurring) {
    const singleQ = query(
      bookingsCol,
      where('spaceId', '==', newSpaceId),
      where('date', '==', newDate),
      where('status', '==', 'confirmed')
    );
    const singleSnap = await getDocs(singleQ);
    const otherBookings = singleSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.id !== bookingId);
    
    if (otherBookings.some(hasOverlap)) {
      throw new Error('Time slot conflict detected on the server.');
    }
  } else {
    // Check all confirmed single bookings
    const allSingleQ = query(
      bookingsCol,
      where('spaceId', '==', newSpaceId),
      where('status', '==', 'confirmed')
    );
    const allSingleSnap = await getDocs(allSingleQ);
    const singleBookings = allSingleSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.id !== bookingId && !b.isRecurring && new Date(b.date + 'T00:00:00').getDay() === dayOfWeek);

    if (singleBookings.some(hasOverlap)) {
      throw new Error('Time slot conflict with an existing single booking on this day of the week.');
    }
  }

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cancel a booking (sets status to 'cancelled').
 */
export async function cancelBooking(bookingId) {
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch all bookings (admin dashboard) — one-time read with optional filters.
 */
export async function getAllBookings(filters = {}) {
  let q = query(bookingsCol, orderBy('date', 'desc'));

  const snapshot = await getDocs(q);
  let bookings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (filters.status && filters.status !== 'all') {
    bookings = bookings.filter((b) => b.status === filters.status);
  }

  if (filters.date) {
    bookings = bookings.filter((b) => b.date === filters.date);
  }

  return bookings;
}

/**
 * Subscribe to all bookings in real-time (admin dashboard).
 */
export function subscribeToAllBookings(callback) {
  const q = query(bookingsCol, orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(bookings);
  });
}

// ─── Seed Data ───────────────────────────────────────────────────────

const DEFAULT_SPACES = [
  {
    name: 'Main Conference Room',
    type: 'conference_room',
    capacity: 12,
    status: 'active',
    color: '#6366F1',
  },
  {
    name: 'Soundpad Alpha',
    type: 'soundpad',
    capacity: 4,
    status: 'active',
    color: '#10B981',
  },
  {
    name: 'Soundpad Beta',
    type: 'soundpad',
    capacity: 4,
    status: 'active',
    color: '#8B5CF6',
  }
];

// Module-level lock to prevent StrictMode double-invocation race
let _seedingInProgress = false;

// ─── Settings ────────────────────────────────────────────────────────
export async function updateGlobalSettings(settings) {
  const docRef = doc(db, 'settings', 'global_config');
  // Use setDoc with merge instead of updateDoc to handle creation if it doesn't exist
  const { setDoc } = await import('firebase/firestore');
  await setDoc(docRef, settings, { merge: true });
}

export function subscribeToGlobalSettings(callback) {
  const docRef = doc(db, 'settings', 'global_config');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ startHour: 7, endHour: 21 }); // Default fallback
    }
  });
}

/**
 * Seeds the `spaces` collection with default space data.
 */
export async function seedSpaces() {
  if (_seedingInProgress) return;
  _seedingInProgress = true;

  try {
    const snapshot = await getDocs(spacesCol);
    
    // Only seed if the spaces collection is completely empty.
    if (!snapshot.empty) {
      console.log('Spaces already exist. Skipping seed.');
      return;
    }

    console.log('Spaces collection is empty. Seeding default spaces...');
    const insertBatch = writeBatch(db);
    DEFAULT_SPACES.forEach((space) => {
      const docRef = doc(spacesCol);
      insertBatch.set(docRef, {
        ...space,
        createdAt: serverTimestamp(),
      });
    });

    await insertBatch.commit();
    console.log(`Seeded ${DEFAULT_SPACES.length} spaces successfully.`);
  } finally {
    _seedingInProgress = false;
  }
}
