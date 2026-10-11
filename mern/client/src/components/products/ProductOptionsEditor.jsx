import AdminButton from '../admin/AdminButton.jsx';
import FormField from '../common/FormField.jsx';
import { MAX_OPTIONS } from '../../validators/products/product.schema.js';

const ProductOptionsEditor = ({ fields, append, remove, register, errors }) => (
  <section className="space-y-4">
    <div>
      <h2 className="font-semibold text-espresso-900">Options</h2>
      <p className="mt-1 text-sm text-espresso-700">
        Add options like Size or Colour if the product comes in more than one version. Leave this
        empty for a product sold in one version only.
      </p>
    </div>

    {fields.map((field, i) => (
      <div key={field.id} className="grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
        <FormField
          label="Option name"
          placeholder="Size"
          error={errors.options?.[i]?.name?.message}
          {...register(`options.${i}.name`)}
        />
        <FormField
          label="Values"
          placeholder="S, M, L, XL"
          hint="Separate values with commas"
          error={errors.options?.[i]?.values?.message}
          {...register(`options.${i}.values`)}
        />
        <AdminButton variant="secondary" className="sm:mt-6" onClick={() => remove(i)}>
          Remove
        </AdminButton>
      </div>
    ))}

    {fields.length < MAX_OPTIONS && (
      <AdminButton variant="secondary" onClick={() => append({ name: '', values: '' })}>
        Add option
      </AdminButton>
    )}
  </section>
);

export default ProductOptionsEditor;
