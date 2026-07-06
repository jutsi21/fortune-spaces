import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';

export default function VolumeSlider({ volume, onChange }) {
  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 33) return Volume;
    if (volume < 66) return Volume1;
    return Volume2;
  };

  const Icon = getVolumeIcon();

  return (
    <div className="bg-surface-50 rounded-xl p-3 border border-surface-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(volume === 0 ? 75 : 0)}
          className="p-1 rounded-lg hover:bg-surface-200 text-surface-500 transition-colors"
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
        >
          <Icon size={18} />
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onChange(Number(e.target.value))}
          className="volume-slider flex-1"
          aria-label="Master volume"
          style={{
            background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${volume}%, #E2E8F0 ${volume}%, #E2E8F0 100%)`,
          }}
        />
        <span className="text-xs font-bold text-surface-600 w-8 text-right tabular-nums">
          {volume}%
        </span>
      </div>
    </div>
  );
}
