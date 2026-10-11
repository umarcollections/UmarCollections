const VALUE_STYLES = {
  selected: 'border-espresso-900 bg-espresso-900 text-cream-50',
  available: 'border-espresso-900/20 bg-white text-espresso-900 hover:border-espresso-900',
  soldout:
    'border-espresso-900/10 bg-white/60 text-espresso-700/50 line-through hover:border-espresso-900/40',
  unavailable:
    'border-dashed border-espresso-900/20 bg-transparent text-espresso-700/50 hover:border-espresso-900/40',
};

const VariantPicker = ({ options, selected, choose, valueState }) => (
  <div className="space-y-6">
    {options.map((option, index) => (
      <fieldset key={option.name}>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-800">
          {option.name}: <span className="text-espresso-900">{selected[index]}</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {option.values.map((value) => {
            const isSelected = selected[index] === value;
            const state = valueState(index, value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => choose(index, value)}
                aria-pressed={isSelected}
                aria-label={state === 'soldout' ? `${value}, sold out` : value}
                className={`min-w-14 rounded-full border px-5 py-2.5 text-sm font-medium transition duration-300 ${
                  VALUE_STYLES[isSelected ? 'selected' : state]
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </fieldset>
    ))}
  </div>
);

export default VariantPicker;
