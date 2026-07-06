import { useState, useEffect } from 'react';
import { createSpace, updateSpace } from '../../lib/firestore';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function SpaceModal({ isOpen, onClose, space }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'conference_room',
    capacity: 4,
    color: '#6366F1'
  });

  useEffect(() => {
    if (space) {
      setFormData({
        name: space.name || '',
        type: space.type || 'conference_room',
        capacity: space.capacity || 4,
        color: space.color || '#6366F1'
      });
    } else {
      setFormData({
        name: '',
        type: 'conference_room',
        capacity: 4,
        color: '#6366F1'
      });
    }
  }, [space]);

  const handleChange = (e) => {
    const value = e.target.name === 'capacity' ? parseInt(e.target.value, 10) || 0 : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (space) {
        await updateSpace(space.id, formData);
      } else {
        await createSpace(formData);
      }
      onClose();
    } catch (err) {
      console.error('Error saving space:', err);
      setError('Failed to save space. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={space ? 'Edit Space' : 'Add New Space'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <Input
          label="Space Name"
          name="name"
          required
          placeholder="e.g., Board Room Alpha"
          value={formData.name}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-1.5">
              Space Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-surface-50 border-2 border-transparent rounded-xl text-sm font-semibold text-surface-900 transition-all focus:bg-white focus:border-brand-500 outline-none"
            >
              <option value="conference_room">Conference Room</option>
              <option value="soundpad">Sound Pad</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <Input
            label="Capacity (Seats)"
            name="capacity"
            type="number"
            min="1"
            required
            value={formData.capacity}
            onChange={handleChange}
          />
        </div>
        
        <div>
           <label className="block text-sm font-bold text-surface-700 mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-3">
               <input 
                  type="color" 
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent"
               />
               <span className="text-sm font-mono text-surface-500 uppercase">{formData.color}</span>
            </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Saving...' : 'Save Space'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
