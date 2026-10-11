import { useId } from 'react';

// Label, control and error for forms. Spread register('field') into it;
// `as` picks the control ('input', 'textarea' or 'select'), and hideLabel keeps
// the label for screen readers only (used inside tables with column headings).
const FormField = ({
  label,
  error,
  hint,
  as: Control = 'input',
  hideLabel = false,
  className = '',
  children,
  ...controlProps
}) => {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-medium text-espresso-800'}
      >
        {label}
      </label>
      <Control
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-espresso-900 outline-none placeholder:text-espresso-700/50 focus:border-caramel-500 focus:ring-1 focus:ring-caramel-500 ${
          error ? 'border-red-600' : 'border-caramel-300'
        }`}
        {...controlProps}
      >
        {children}
      </Control>
      {note && (
        <p id={noteId} className={`mt-1 text-xs ${error ? 'text-red-700' : 'text-espresso-700'}`}>
          {note}
        </p>
      )}
    </div>
  );
};

export default FormField;
