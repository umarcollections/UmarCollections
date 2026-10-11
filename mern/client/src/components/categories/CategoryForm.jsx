import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminButton from '../admin/AdminButton.jsx';
import FormField from '../common/FormField.jsx';
import FormAlert from '../common/FormAlert.jsx';
import { categoryFormSchema } from '../../validators/categories/category.schema.js';

// Used to add a category and to edit one in place. onSave must resolve when
// saved or throw with a message; a new category clears the form afterwards.
const CategoryForm = ({ category, onSave, onCancel, submitLabel }) => {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: category?.name ?? '', description: category?.description ?? '' },
  });

  const onSubmit = async (values) => {
    try {
      await onSave(values);
      if (!category) reset();
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormAlert message={errors.root?.message} />
      <div className="grid gap-3 sm:grid-cols-[16rem_1fr]">
        <FormField label="Name" error={errors.name?.message} {...register('name')} />
        <FormField
          label="Description"
          hint="Optional"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>
      <div className="flex gap-2">
        <AdminButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </AdminButton>
        {onCancel && (
          <AdminButton variant="secondary" onClick={onCancel}>
            Cancel
          </AdminButton>
        )}
      </div>
    </form>
  );
};

export default CategoryForm;
