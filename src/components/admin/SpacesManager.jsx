import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, CheckCircle2, Save, Clock } from 'lucide-react';
import { updateSpace, archiveSpace, updateGlobalSettings } from '../../lib/firestore';
import { useBooking } from '../../context/BookingContext';
import { formatTime } from '../../lib/utils';
import Button from '../ui/Button';
import SpaceModal from './SpaceModal';

export default function SpacesManager({ spaces }) {
  const { globalSettings } = useBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [opSettings, setOpSettings] = useState(globalSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setOpSettings(globalSettings);
  }, [globalSettings]);

  const handleEdit = (space) => {
    setEditingSpace(space);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (space) => {
    try {
      if (space.status === 'active') {
        if (window.confirm(`Are you sure you want to archive ${space.name}? It will no longer appear on the public booking grid.`)) {
          await archiveSpace(space.id);
        }
      } else {
        await updateSpace(space.id, { status: 'active' });
      }
    } catch (err) {
      console.error('Failed to toggle space status:', err);
      alert('Failed to update space status.');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateGlobalSettings(opSettings);
      alert('Operation settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save operation settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const formattedType = (type) => 
    type ? type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';

  const hourOptions = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

  return (
    <div className="space-y-6">
      {/* Operation Settings Card */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 bg-surface-50 flex items-center gap-2">
          <Clock size={18} className="text-brand-600" />
          <h2 className="text-sm font-bold text-surface-900">Operation Settings</h2>
        </div>
        <div className="p-5 flex items-end gap-6">
          <div className="space-y-1.5 flex-1 max-w-[200px]">
            <label className="block text-sm font-semibold text-surface-700">Global Start Hour</label>
            <select
              value={opSettings.startHour}
              onChange={(e) => setOpSettings({ ...opSettings, startHour: Number(e.target.value) })}
              className="input-field"
            >
              {hourOptions.map(h => (
                <option key={h} value={h}>{formatTime(`${String(h).padStart(2, '0')}:00`)}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1.5 flex-1 max-w-[200px]">
            <label className="block text-sm font-semibold text-surface-700">Global End Hour</label>
            <select
              value={opSettings.endHour}
              onChange={(e) => setOpSettings({ ...opSettings, endHour: Number(e.target.value) })}
              className="input-field"
            >
              {hourOptions.map(h => (
                <option key={h} value={h}>{formatTime(`${String(h).padStart(2, '0')}:00`)}</option>
              ))}
            </select>
          </div>

          <Button 
            onClick={handleSaveSettings} 
            loading={savingSettings} 
            icon={Save}
            disabled={opSettings.startHour >= opSettings.endHour}
          >
            Save Settings
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 bg-surface-50">
          <h2 className="text-sm font-bold text-surface-900">Manage Spaces</h2>
          <Button size="sm" onClick={() => { setEditingSpace(null); setIsModalOpen(true); }} icon={Plus}>
            Add Space
          </Button>
        </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 bg-surface-50 border-b border-surface-100">
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Name</span>
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Type</span>
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Capacity</span>
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Status</span>
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider text-right">Actions</span>
      </div>

      {/* Table Body */}
      {spaces.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-surface-500 font-medium">No spaces found.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-100">
          {spaces.map((space) => (
            <div key={space.id} className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 items-center hover:bg-surface-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: space.color || '#6366F1' }} />
                <p className="text-sm font-bold text-surface-900 truncate">{space.name}</p>
              </div>
              
              <div className="text-sm text-surface-600 truncate">
                {formattedType(space.type)}
              </div>
              
              <div className="text-sm text-surface-600">
                {space.capacity} seats
              </div>
              
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  space.status === 'active' 
                    ? 'bg-available-light text-available-dark border border-available-border'
                    : 'bg-surface-100 text-surface-500 border border-surface-200'
                }`}>
                  {space.status}
                </span>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEdit(space)}
                  className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                  title="Edit Space"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleStatus(space)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    space.status === 'active'
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-available-dark hover:bg-available-light'
                  }`}
                  title={space.status === 'active' ? 'Archive Space' : 'Activate Space'}
                >
                  {space.status === 'active' ? <Archive size={16} /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {isModalOpen && (
        <SpaceModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          space={editingSpace} 
        />
      )}
    </div>
  );
}
