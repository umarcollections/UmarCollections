import { useId } from 'react';

// Storefront form field: rounded cream control with a small spaced label,
// matching the login and search fields. Spread register('field') into it;
// `as` picks the control ('input', 'textarea' or 'select').
const StoreField = ({
  label,
  error,
  hint,
  as: Control = 'input',
  className = '',
  children,
  ...controlProps
}) => {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;
  const shape = Control === 'textarea' ? 'rounded-3xl py-3' : 'rounded-full py-3';

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-800"
      >
        {label}
      </label>
      <Control
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`w-full border bg-cream-50 px-5 text-sm text-espresso-900 outline-none transition placeholder:text-espresso-700/45 focus:bg-white focus:ring-4 ${shape} ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-caramel-300 focus:border-caramel-500 focus:ring-caramel-400/20'
        }`}
        {...controlProps}
      >
        {children}
      </Control>
      {note && (
        <p
          id={noteId}
          className={`mt-1.5 px-5 text-xs ${error ? 'text-red-700' : 'text-espresso-700'}`}
        >
          {note}
        </p>
      )}
    </div>
  );
};

export default StoreField;
