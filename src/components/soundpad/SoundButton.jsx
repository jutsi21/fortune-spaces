export default function SoundButton({ preset, isActive, onToggle }) {
  const { label, icon: Icon, color } = preset;

  return (
    <button
      onClick={onToggle}
      className={`sound-btn aspect-square ${isActive ? 'sound-btn-active' : ''}`}
      style={
        isActive
          ? {
              borderColor: color,
              backgroundColor: `${color}10`,
              boxShadow: `0 0 16px ${color}25`,
            }
          : {}
      }
    >
      <Icon
        size={20}
        style={{ color: isActive ? color : undefined }}
        className={isActive ? '' : 'text-surface-400'}
      />
      <span
        className={`text-[10px] font-bold leading-tight text-center whitespace-pre-line ${
          isActive ? '' : 'text-surface-500'
        }`}
        style={isActive ? { color } : {}}
      >
        {label}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}
