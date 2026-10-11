import { useState } from 'react';
import { toast } from 'sonner';
import AdminButton from '../../components/admin/AdminButton.jsx';
import ConfirmButton from '../../components/admin/ConfirmButton.jsx';
import SingleImageField from '../../components/admin/SingleImageField.jsx';
import CategoryForm from '../../components/categories/CategoryForm.jsx';
import useCategories, {
  useCreateCategory,
  useDeleteCategory,
  useRemoveCategoryImage,
  useUpdateCategory,
  useUploadCategoryImage,
} from '../../hooks/categories/useCategories.js';
import useSettings from '../../hooks/settings/useSettings.js';

const AdminCategoriesPage = () => {
  const { data: categories, error, isPending, refetch } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const uploadImage = useUploadCategoryImage();
  const removeImage = useRemoveCategoryImage();
  const { data: settings } = useSettings();
  const [editingId, setEditingId] = useState(null);

  // Only the category whose photo is changing shows as busy
  const imageBusy = (id) =>
    (uploadImage.isPending && uploadImage.variables?.id === id) ||
    (removeImage.isPending && removeImage.variables === id);

  const handleCreate = async (values) => {
    await createCategory.mutateAsync(values);
    toast.success('Category added');
  };

  const handleUpdate = async (id, values) => {
    await updateCategory.mutateAsync({ id, ...values });
    toast.success('Category saved');
    setEditingId(null);
  };

  const handleDelete = (id) =>
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success('Category deleted'),
      onError: (err) => toast.error(err.message),
    });

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="font-display text-4xl font-semibold text-espresso-900">Categories</h1>

      <section className="space-y-3 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-5">
        <h2 className="font-semibold text-espresso-900">Add a category</h2>
        <CategoryForm onSave={handleCreate} submitLabel="Add category" />
      </section>

      {isPending && <p className="text-sm text-espresso-700">Loading categories…</p>}

      {error && !categories && (
        <div className="space-y-3">
          <p className="text-sm text-red-700">{error.message}</p>
          <AdminButton variant="secondary" onClick={() => refetch()}>
            Try again
          </AdminButton>
        </div>
      )}

      {categories?.length === 0 && (
        <p className="text-sm text-espresso-700">
          No categories yet. Customers browse the store by category, so add one for each kind of
          product you sell.
        </p>
      )}

      {categories?.length > 0 && (
        <ul className="divide-y divide-caramel-300/50 overflow-hidden rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm">
          {categories.map((category) => (
            <li key={category._id} className="p-5">
              {editingId === category._id ? (
                <CategoryForm
                  category={category}
                  onSave={(values) => handleUpdate(category._id, values)}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Save"
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-espresso-900">{category.name}</p>
                      {category.description && (
                        <p className="mt-1 text-sm text-espresso-700">{category.description}</p>
                      )}
                    </div>
                    <SingleImageField
                      label="Photo"
                      hint="Shown on the home page category card. A portrait photo works best."
                      imageUrl={category.image?.url}
                      uploadsEnabled={Boolean(settings?.uploadsEnabled)}
                      busy={imageBusy(category._id)}
                      onUpload={(file) => uploadImage.mutateAsync({ id: category._id, file })}
                      onRemove={() => removeImage.mutateAsync(category._id)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton variant="secondary" onClick={() => setEditingId(category._id)}>
                      Edit
                    </AdminButton>
                    <ConfirmButton
                      question="Delete this category?"
                      onConfirm={() => handleDelete(category._id)}
                      pending={
                        deleteCategory.isPending && deleteCategory.variables === category._id
                      }
                    >
                      Delete
                    </ConfirmButton>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
