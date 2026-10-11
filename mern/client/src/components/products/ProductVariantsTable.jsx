import FormField from '../common/FormField.jsx';

const COLUMNS = [
  { field: 'price', label: 'Price', inputMode: 'decimal', placeholder: '0.00' },
  {
    field: 'compareAtPrice',
    label: 'Compare-at price',
    inputMode: 'decimal',
    placeholder: 'Optional',
  },
  { field: 'stock', label: 'Stock', inputMode: 'numeric', placeholder: '0' },
  { field: 'sku', label: 'SKU', placeholder: 'Optional' },
];

// One row per option combination. With options, each row has a "Sell" box so
// combinations the store doesn't carry can be left out.
const ProductVariantsTable = ({ fields, register, errors }) => {
  // Read from the rows, which only change once option values are complete
  const hasOptions = fields.some((field) => field.optionValues.length > 0);
  const listError = errors.variants?.root?.message ?? errors.variants?.message;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-espresso-900">
          {hasOptions ? 'Variants' : 'Price and stock'}
        </h2>
        <p className="mt-1 text-sm text-espresso-700">
          Compare-at price is the original price, shown crossed out when the item is on sale.
        </p>
      </div>

      {listError && <p className="text-sm text-red-700">{listError}</p>}

      {/* relative: the cells' screen-reader labels are absolutely positioned and
          would otherwise escape the scroll box and widen the whole page on phones */}
      <div className="relative overflow-x-auto rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-caramel-300/60 bg-cream-100 text-espresso-700">
            <tr>
              {hasOptions && <th className="px-3 py-2 font-medium">Sell</th>}
              {hasOptions && <th className="px-3 py-2 font-medium">Variant</th>}
              {COLUMNS.map((column) => (
                <th key={column.field} className="px-3 py-2 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-caramel-300/60">
            {fields.map((field, i) => {
              const name = field.optionValues.join(' / ');
              return (
                <tr key={field.id} className="align-top">
                  {hasOptions && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Sell ${name}`}
                        className="size-4 accent-espresso-900"
                        {...register(`variants.${i}.enabled`)}
                      />
                    </td>
                  )}
                  {hasOptions && (
                    <td className="px-3 py-3 font-medium text-espresso-900">{name}</td>
                  )}
                  {COLUMNS.map((column) => (
                    <td key={column.field} className="px-3 py-2">
                      <FormField
                        hideLabel
                        label={hasOptions ? `${column.label} for ${name}` : column.label}
                        inputMode={column.inputMode}
                        placeholder={column.placeholder}
                        error={errors.variants?.[i]?.[column.field]?.message}
                        {...register(`variants.${i}.${column.field}`)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ProductVariantsTable;
