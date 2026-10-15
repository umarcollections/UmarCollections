import { Link, useSearchParams } from 'react-router-dom';
import AdminButton from '../../components/admin/AdminButton.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import ProductStatusBadge from '../../components/products/ProductStatusBadge.jsx';
import useAdminProducts from '../../hooks/products/useAdminProducts.js';
import { formatPriceRange } from '../../lib/format.js';
import { PRODUCT_STATUSES } from '../../validators/products/product.schema.js';

const totalStock = (product) => product.variants.reduce((sum, variant) => sum + variant.stock, 0);

const capitalize = (text) => text[0].toUpperCase() + text.slice(1);

const AdminProductsPage = () => {
  // Filters live in the URL so the back button and shared links keep them
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page')) || 1;

  const { data, error, isPending, isFetching, refetch } = useAdminProducts({ q, status, page });

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key)
    );
    setSearchParams(next);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ q: event.currentTarget.elements.q.value.trim(), page: '' });
  };

  const products = data?.data ?? [];
  const filtered = Boolean(q || status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold text-espresso-900">Products</h1>
        <AdminButton to="/admin/products/new">Add product</AdminButton>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} role="search" className="flex min-w-[16rem] flex-1 gap-2">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            name="q"
            type="search"
            defaultValue={q}
            key={q}
            placeholder="Search by title"
            className="w-full min-w-0 rounded-lg border border-caramel-300 bg-white px-3 py-2 text-sm outline-none focus:border-caramel-500 focus:ring-1 focus:ring-caramel-500"
          />
          <AdminButton type="submit" variant="secondary">
            Search
          </AdminButton>
        </form>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(event) => updateParams({ status: event.target.value, page: '' })}
          className="min-w-36 rounded-lg border border-caramel-300 bg-white px-3 py-2 text-sm outline-none focus:border-caramel-500 focus:ring-1 focus:ring-caramel-500"
        >
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {capitalize(value)}
            </option>
          ))}
        </select>
      </div>

      {isPending && <p className="text-sm text-espresso-700">Loading products…</p>}

      {error && !data && (
        <div className="space-y-3">
          <p className="text-sm text-red-700">{error.message}</p>
          <AdminButton variant="secondary" onClick={() => refetch()}>
            Try again
          </AdminButton>
        </div>
      )}

      {data && products.length === 0 && (
        <div className="border border-dashed border-caramel-300 px-6 py-12 text-center">
          <p className="text-espresso-800">
            {filtered ? 'No products match these filters.' : 'No products yet.'}
          </p>
          {!filtered && (
            <AdminButton to="/admin/products/new" className="mt-4">
              Add your first product
            </AdminButton>
          )}
        </div>
      )}

      {products.length > 0 && (
        <div
          className={`relative overflow-x-auto rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm ${isFetching ? 'opacity-70' : ''}`}
        >
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-caramel-300/60 bg-cream-100 text-espresso-700">
              <tr>
                <th className="w-16 px-3 py-2 font-medium">
                  <span className="sr-only">Photo</span>
                </th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-caramel-300/60">
              {products.map((product) => {
                const stock = totalStock(product);
                return (
                  <tr key={product._id} className="hover:bg-cream-100">
                    <td className="px-3 py-2">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          className="size-12 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-12 bg-cream-100" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/admin/products/${product._id}`}
                        className="font-medium text-espresso-900 hover:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="text-xs text-espresso-700">
                        {product.variants.length}{' '}
                        {product.variants.length === 1 ? 'variant' : 'variants'}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <ProductStatusBadge status={product.status} />
                    </td>
                    <td className="px-3 py-2 text-espresso-700">
                      {product.category?.name ?? 'None'}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-espresso-900">
                      {formatPriceRange(product.priceMin, product.priceMax)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${stock === 0 ? 'text-red-700' : 'text-espresso-900'}`}
                    >
                      {stock === 0 ? 'Out of stock' : stock}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <Pagination
          {...data.pagination}
          onChange={(next) => updateParams({ page: next > 1 ? String(next) : '' })}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
