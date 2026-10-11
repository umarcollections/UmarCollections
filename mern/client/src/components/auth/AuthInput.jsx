import { useId, useState } from 'react';

// Works with react-hook-form: spread register('field') into it and pass
// the field's error message as `error`. Password fields get a Show/Hide toggle.
const AuthInput = ({ label, type = 'text', error, ...inputProps }) => {
  const id = useId();
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-800"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-full border bg-cream-100 px-5 py-3 text-sm text-espresso-900 outline-none transition placeholder:text-espresso-700/45 focus:bg-cream-50 focus:ring-4 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
              : 'border-caramel-300 focus:border-caramel-500 focus:ring-caramel-400/20'
          } ${isPassword ? 'pr-20' : ''}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-caramel-700 hover:text-espresso-900"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 pl-5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
