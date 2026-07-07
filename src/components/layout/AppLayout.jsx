import { Outlet, Link } from 'react-router-dom';
import { Zap, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import { useBooking } from '../../context/BookingContext';

export default function AppLayout() {
  const { selectedSpace } = useBooking();
  const isDetailViewActive = selectedSpace !== null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-50">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-surface-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-surface-900 tracking-tight">Fortune Spaces</span>
        </div>
        <Link to="/admin" className="p-2 -mr-2 text-surface-500 hover:text-surface-900 transition-colors">
          <ShieldCheck size={20} />
        </Link>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Master List) */}
        <div className={`${isDetailViewActive ? 'hidden md:flex' : 'flex'} w-full md:w-auto shrink-0 h-full`}>
          <Sidebar />
        </div>

        {/* Detail View (Main Content + Right Panel) */}
        <div className={`${!isDetailViewActive ? 'hidden md:flex' : 'flex'} flex-1 overflow-hidden flex-col lg:flex-row`}>
          <main className="flex-1 overflow-hidden flex flex-col min-w-0 bg-surface-50">
            <Outlet />
          </main>
          
          <div className="hidden lg:flex shrink-0">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
