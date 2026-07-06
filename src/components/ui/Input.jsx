export default function Input({ label, error, id, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-surface-700">
          {label}
          {props.required && <span className="text-booked ml-0.5">*</span>}
        </label>
      )}
      {props.type === 'textarea' ? (
        <textarea
          id={id}
          className={`input-field resize-none ${error ? 'border-booked focus:border-booked focus:ring-red-50' : ''}`}
          rows={3}
          {...props}
          type={undefined}
        />
      ) : (
        <input
          id={id}
          className={`input-field ${error ? 'border-booked focus:border-booked focus:ring-red-50' : ''}`}
          {...props}
        />
      )}
      {error && <p className="text-xs text-booked font-medium">{error}</p>}
    </div>
  );
}
