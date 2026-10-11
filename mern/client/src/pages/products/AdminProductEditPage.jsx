import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmButton from '../../components/admin/ConfirmButton.jsx';
import ProductForm from '../../components/products/ProductForm.jsx';
import ProductImagesManager from '../../components/products/ProductImagesManager.jsx';
import ProductStatusBadge from '../../components/products/ProductStatusBadge.jsx';
import useCategories from '../../hooks/categories/useCategories.js';
import {
  useAdminProduct,
  useDeleteProduct,
  useUpdateProduct,
} from '../../hooks/products/useAdminProducts.js';

const AdminProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: categories, error: categoriesError } = useCategories();
  const updateProduct = useUpdateProduct(id);
  const deleteProduct = useDeleteProduct();
  // Once a delete starts, the page must not ask for the product again (it would 404)
  const { data: product, error } = useAdminProduct(id, {
    enabled: deleteProduct.isIdle || deleteProduct.isError,
  });

  const handleSave = async (payload) => {
    const saved = await updateProduct.mutateAsync(payload);
    toast.success('Product saved');
    return saved;
  };

  const handleDelete = () =>
    deleteProduct.mutate(id, {
      onSuccess: () => {
        toast.success('Product deleted');
        navigate('/admin/products', { replace: true });
      },
      onError: (err) => toast.error(err.message),
    });

  const loadError = error ?? categoriesError;

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <Link to="/admin/products" className="text-sm text-espresso-700 hover:text-espresso-900">
          Back to products
        </Link>
        {product && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-semibold text-espresso-900">
              {product.title}
            </h1>
            <ProductStatusBadge status={product.status} />
          </div>
        )}
      </div>

      {loadError && !product && <p className="text-sm text-red-700">{loadError.message}</p>}
      {!loadError && !(product && categories) && (
        <p className="text-sm text-espresso-700">Loading product…</p>
      )}

      {product && categories && (
        <>
          <ProductImagesManager product={product} />
          <ProductForm
            key={product._id}
            product={product}
            categories={categories}
            onSave={handleSave}
            submitLabel="Save changes"
          />
          <section className="space-y-3 border-t border-caramel-300/60 pt-6">
            <h2 className="font-semibold text-espresso-900">Delete product</h2>
            <p className="text-sm text-espresso-700">
              Removes the product and its photos for good. To hide it but keep it, set the status to
              Archived instead.
            </p>
            <ConfirmButton
              question="Delete this product and its photos?"
              onConfirm={handleDelete}
              pending={deleteProduct.isPending}
            >
              Delete product
            </ConfirmButton>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminProductEditPage;
