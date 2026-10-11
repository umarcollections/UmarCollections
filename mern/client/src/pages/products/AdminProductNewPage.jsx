import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ProductForm from '../../components/products/ProductForm.jsx';
import useCategories from '../../hooks/categories/useCategories.js';
import { useCreateProduct } from '../../hooks/products/useAdminProducts.js';

const AdminProductNewPage = () => {
  const navigate = useNavigate();
  const { data: categories, error } = useCategories();
  const createProduct = useCreateProduct();

  // Photos need a saved product to attach to, so they are added on the edit page
  const handleSave = async (payload) => {
    const product = await createProduct.mutateAsync(payload);
    toast.success('Product created. You can add photos now.');
    navigate(`/admin/products/${product._id}`, { replace: true });
    return product;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link to="/admin/products" className="text-sm text-espresso-700 hover:text-espresso-900">
          Back to products
        </Link>
        <h1 className="mt-2 font-display text-4xl font-semibold text-espresso-900">Add product</h1>
      </div>

      {error && <p className="text-sm text-red-700">{error.message}</p>}
      {categories && (
        <ProductForm categories={categories} onSave={handleSave} submitLabel="Create product" />
      )}
    </div>
  );
};

export default AdminProductNewPage;
