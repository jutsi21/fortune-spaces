import { useState } from 'react';
import SoundButton from './SoundButton';
import VolumeSlider from './VolumeSlider';
import {
  Bell,
  Music,
  Wind,
  MicOff,
  Timer,
  Sparkles,
  Volume2,
  Waves,
  VolumeX,
} from 'lucide-react';

const SOUND_PRESETS = [
  { id: 'chimes', label: 'Presentation\nChimes', icon: Bell, color: '#6366F1' },
  { id: 'ambient', label: 'Ambient\nFocus', icon: Music, color: '#8B5CF6' },
  { id: 'white-noise', label: 'White\nNoise', icon: Wind, color: '#06B6D4' },
  { id: 'start-bell', label: 'Meeting\nStart', icon: Sparkles, color: '#F59E0B' },
  { id: 'break-timer', label: 'Break\nTimer', icon: Timer, color: '#10B981' },
  { id: 'mute-all', label: 'Mute All\nMics', icon: MicOff, color: '#EF4444' },
  { id: 'applause', label: 'Applause', icon: Volume2, color: '#EC4899' },
  { id: 'notification', label: 'Notification\nPing', icon: Waves, color: '#14B8A6' },
  { id: 'silence', label: 'Silence', icon: VolumeX, color: '#64748B' },
];

export default function SoundPad() {
  const [activeButtons, setActiveButtons] = useState(new Set());
  const [volume, setVolume] = useState(75);

  const toggleButton = (id) => {
    setActiveButtons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Sound Button Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {SOUND_PRESETS.map((preset) => (
          <SoundButton
            key={preset.id}
            preset={preset}
            isActive={activeButtons.has(preset.id)}
            onToggle={() => toggleButton(preset.id)}
          />
        ))}
      </div>

      {/* Volume Control */}
      <VolumeSlider volume={volume} onChange={setVolume} />

      {/* Active count */}
      {activeButtons.size > 0 && (
        <div className="text-center">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
            {activeButtons.size} active · Master: {volume}%
          </span>
        </div>
      )}
    </div>
  );
}
