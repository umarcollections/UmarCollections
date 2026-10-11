import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminButton from '../admin/AdminButton.jsx';
import FormAlert from '../common/FormAlert.jsx';
import FormField from '../common/FormField.jsx';

// A small form for an order action that needs details (reason, tracking...).
// fields: [{ name, label, hint }]; onSubmit resolves when done or throws.
const OrderActionForm = ({ title, fields, schema, submitLabel, variant, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((field) => [field.name, ''])),
  });

  const submit = async (values) => {
    try {
      await onSubmit(values);
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-3 border border-caramel-300/60 bg-cream-100 p-4"
      noValidate
    >
      <p className="text-sm font-medium text-espresso-900">{title}</p>
      <FormAlert message={errors.root?.message} />
      {fields.map((field) => (
        <FormField
          key={field.name}
          label={field.label}
          hint={field.hint}
          error={errors[field.name]?.message}
          {...register(field.name)}
        />
      ))}
      <div className="flex gap-2">
        <AdminButton type="submit" variant={variant} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </AdminButton>
        <AdminButton variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Back
        </AdminButton>
      </div>
    </form>
  );
};

export default OrderActionForm;
