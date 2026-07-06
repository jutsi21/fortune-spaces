import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { seedSpaces } from './lib/firestore';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  // Auto-seed spaces on first load (safe to call multiple times — skips if spaces exist)
  useEffect(() => {
    seedSpaces().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <Routes>
            {/* Public routes with 3-column layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
            </Route>

            {/* Admin route — full-page (no sidebar/right panel) */}
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
