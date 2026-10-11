import { Link, useSearchParams } from 'react-router-dom';
import AdminButton from '../../components/admin/AdminButton.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import useAdminCustomers from '../../hooks/customers/useAdminCustomers.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';

const AdminCustomersPage = () => {
  // Search and page live in the URL so the back button keeps them
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page')) || 1;

  const { data, error, isPending, isFetching, refetch } = useAdminCustomers({ q, page });
  const customers = data?.data ?? [];

  const handleSearch = (event) => {
    event.preventDefault();
    const value = event.currentTarget.elements.q.value.trim();
    setSearchParams(value ? { q: value } : {});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-espresso-900">Customers</h1>
        <p className="mt-1 text-sm text-espresso-700">
          Everyone who has placed an order, grouped by email. Paid counts confirmed orders only.
        </p>
      </div>

      <form onSubmit={handleSearch} role="search" className="flex gap-2">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          name="q"
          type="search"
          defaultValue={q}
          key={q}
          placeholder="Name, email or phone"
          className="w-full min-w-0 rounded-lg border border-caramel-300 bg-white px-3 py-2 text-sm outline-none focus:border-caramel-500 focus:ring-1 focus:ring-caramel-500"
        />
        <AdminButton type="submit" variant="secondary">
          Search
        </AdminButton>
      </form>

      {isPending && <p className="text-sm text-espresso-700">Loading customers…</p>}
      {error && !data && (
        <div className="space-y-3">
          <p className="text-sm text-red-700">{error.message}</p>
          <AdminButton variant="secondary" onClick={() => refetch()}>
            Try again
          </AdminButton>
        </div>
      )}
      {data && customers.length === 0 && (
        <p className="border border-dashed border-caramel-300 px-6 py-12 text-center text-espresso-800">
          {q
            ? 'No customers match this search.'
            : 'No customers yet. They appear here after their first order.'}
        </p>
      )}

      {customers.length > 0 && (
        <div
          className={`relative overflow-x-auto rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm ${isFetching ? 'opacity-70' : ''}`}
        >
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-caramel-300/60 bg-cream-100 text-espresso-700">
              <tr>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Paid</th>
                <th className="px-3 py-2 font-medium">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-caramel-300/60">
              {customers.map((customer) => (
                <tr key={customer.email} className="hover:bg-cream-100">
                  <td className="px-3 py-2">
                    <Link
                      to={`/admin/customers/${encodeURIComponent(customer.email)}`}
                      className="font-medium text-espresso-900 hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <p className="text-xs text-espresso-700">
                      {customer.email}
                      {customer.registered && ' (has an account)'}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-espresso-800">{customer.phone}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{customer.orders}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatPrice(customer.paid)}
                  </td>
                  <td className="px-3 py-2 text-espresso-700">
                    {formatDateTime(customer.lastOrderAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <Pagination
          {...data.pagination}
          onChange={(next) =>
            setSearchParams({ ...(q && { q }), ...(next > 1 && { page: String(next) }) })
          }
        />
      )}
    </div>
  );
};

export default AdminCustomersPage;
