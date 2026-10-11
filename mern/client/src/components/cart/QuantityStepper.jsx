import StoreIcon from '../store/StoreIcon.jsx';

const STEP_BUTTON =
  'grid size-11 place-items-center rounded-full text-espresso-900 transition hover:bg-caramel-300/60 disabled:cursor-not-allowed disabled:text-espresso-700/30 disabled:hover:bg-transparent';

// Minus, the number, plus. Stays between 1 and max; a value already above max
// (stock dropped since it was added) can still be lowered.
const QuantityStepper = ({ value, max, onChange, label = 'Quantity', size = 'md' }) => (
  <div
    role="group"
    aria-label={label}
    className={`inline-flex items-center rounded-full border border-caramel-300 bg-cream-100 p-0.5 ${
      size === 'sm' ? 'scale-90 origin-left' : ''
    }`}
  >
    <button
      type="button"
      onClick={() => onChange(value - 1)}
      disabled={value <= 1}
      aria-label="Decrease quantity"
      className={STEP_BUTTON}
    >
      <StoreIcon name="minus" className="size-4" />
    </button>
    <output aria-live="polite" className="w-8 text-center text-sm font-semibold tabular-nums">
      {value}
    </output>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      disabled={value >= max}
      aria-label="Increase quantity"
      className={STEP_BUTTON}
    >
      <StoreIcon name="plus" className="size-4" />
    </button>
  </div>
);

export default QuantityStepper;
