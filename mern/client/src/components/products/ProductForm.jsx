import { Link } from 'react-router-dom';
import { useWatch } from 'react-hook-form';
import AdminButton from '../admin/AdminButton.jsx';
import FormField from '../common/FormField.jsx';
import FormAlert from '../common/FormAlert.jsx';
import ProductOptionsEditor from './ProductOptionsEditor.jsx';
import ProductVariantsTable from './ProductVariantsTable.jsx';
import useProductForm, { toPayload } from '../../hooks/products/useProductForm.js';

const STATUS_HINTS = {
  draft: 'Hidden from the store while you prepare it',
  active: 'Visible in the store and can be bought',
  archived: 'Hidden from the store, kept for your records',
};

// Shared by the new and edit pages. onSave receives the request body and
// must resolve to the saved product (or throw with a message to show).
const ProductForm = ({ product, categories, onSave, submitLabel }) => {
  const { form, optionFields, variantFields, resetTo } = useProductForm(product);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const status = useWatch({ control, name: 'status' });

  const onSubmit = async (values) => {
    try {
      resetTo(await onSave(toPayload(values)));
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
      <FormAlert message={errors.root?.message} />

      <section className="space-y-4">
        <FormField label="Title" error={errors.title?.message} {...register('title')} />
        <FormField
          as="textarea"
          rows={6}
          label="Description"
          hint="Fabric, fit, measurements and care instructions help customers choose"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            as="select"
            label="Category"
            hint={
              categories.length === 0 && (
                <>
                  No categories yet.{' '}
                  <Link to="/admin/categories" className="underline">
                    Create one
                  </Link>
                </>
              )
            }
            {...register('category')}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </FormField>
          <FormField as="select" label="Status" hint={STATUS_HINTS[status]} {...register('status')}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </FormField>
        </div>
      </section>

      <ProductOptionsEditor
        fields={optionFields.fields}
        append={optionFields.append}
        remove={optionFields.remove}
        register={register}
        errors={errors}
      />

      <ProductVariantsTable fields={variantFields.fields} register={register} errors={errors} />

      <div className="flex items-center gap-4 border-t border-caramel-300/60 pt-6">
        <AdminButton type="submit" disabled={isSubmitting || (product && !isDirty)}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </AdminButton>
        {product && !isDirty && <p className="text-sm text-espresso-700">No unsaved changes</p>}
      </div>
    </form>
  );
};

export default ProductForm;
