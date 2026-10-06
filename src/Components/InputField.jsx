const InputField = ({ id, label, icon, error, hint, optional = false, trailing, ...inputProps }) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-base-content/50">Optional</span>}
      </label>
      <label
        className={`input w-full bg-gray-100 shadow-none focus-within:bg-gray-100 focus-within:outline-gray-300 [&>input]:bg-transparent ${
          error ? "input-error" : "border-gray-200 focus-within:border-gray-300"
        }`}
      >
        {icon && (
          <svg
            className="h-4 w-4 shrink-0 opacity-50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icon}
          </svg>
        )}
        <input id={id} aria-invalid={!!error} aria-describedby={describedBy} {...inputProps} />
        {trailing}
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-base-content/50">
            {hint}
          </p>
        )
      )}
    </div>
  );
};

export default InputField;
