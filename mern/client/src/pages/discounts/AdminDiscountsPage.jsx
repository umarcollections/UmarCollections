import { useState } from 'react';
import { toast } from 'sonner';
import AdminButton from '../../components/admin/AdminButton.jsx';
import ConfirmButton from '../../components/admin/ConfirmButton.jsx';
import DiscountForm from '../../components/discounts/DiscountForm.jsx';
import useAdminDiscounts, {
  useCreateDiscount,
  useDeleteDiscount,
  useUpdateDiscount,
} from '../../hooks/discounts/useAdminDiscounts.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';

const describe = (discount) => {
  const off =
    discount.type === 'percentage'
      ? `${discount.value}% off`
      : `${formatPrice(discount.value)} off`;
  return discount.minSubtotal
    ? `${off} orders of ${formatPrice(discount.minSubtotal)} or more`
    : off;
};

const stateOf = (discount) => {
  if (!discount.active) return 'Off';
  if (discount.expiresAt && new Date(discount.expiresAt) <= new Date()) return 'Expired';
  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) return 'Used up';
  return 'Active';
};

const AdminDiscountsPage = () => {
  const { data: discounts, error, isPending, refetch } = useAdminDiscounts();
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const [editingId, setEditingId] = useState(null);

  const handleCreate = async (payload) => {
    await createDiscount.mutateAsync(payload);
    toast.success('Discount code added');
  };

  const handleUpdate = async (id, payload) => {
    await updateDiscount.mutateAsync({ id, ...payload });
    toast.success('Discount code saved');
    setEditingId(null);
  };

  const handleDelete = (id) =>
    deleteDiscount.mutate(id, {
      onSuccess: () => toast.success('Discount code deleted'),
      onError: (err) => toast.error(err.message),
    });

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="font-display text-4xl font-semibold text-espresso-900">Discounts</h1>

      <section className="space-y-3 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-5">
        <h2 className="font-semibold text-espresso-900">Add a discount code</h2>
        <DiscountForm onSave={handleCreate} submitLabel="Add code" />
      </section>

      {isPending && <p className="text-sm text-espresso-700">Loading discount codes…</p>}
      {error && !discounts && (
        <div className="space-y-3">
          <p className="text-sm text-red-700">{error.message}</p>
          <AdminButton variant="secondary" onClick={() => refetch()}>
            Try again
          </AdminButton>
        </div>
      )}
      {discounts?.length === 0 && (
        <p className="text-sm text-espresso-700">No discount codes yet.</p>
      )}

      {discounts?.length > 0 && (
        <ul className="divide-y divide-caramel-300/50 overflow-hidden rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm">
          {discounts.map((discount) => (
            <li key={discount._id} className="p-5">
              {editingId === discount._id ? (
                <DiscountForm
                  discount={discount}
                  onSave={(payload) => handleUpdate(discount._id, payload)}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Save"
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-3">
                      <span className="font-mono font-medium text-espresso-900">
                        {discount.code}
                      </span>
                      <span className="rounded-lg border border-caramel-300 px-2 py-0.5 text-xs text-espresso-700">
                        {stateOf(discount)}
                      </span>
                    </p>
                    <p className="text-espresso-800">{describe(discount)}</p>
                    <p className="text-espresso-700">
                      Used {discount.usedCount}
                      {discount.usageLimit != null && ` of ${discount.usageLimit}`}
                      {discount.expiresAt && `, expires ${formatDateTime(discount.expiresAt)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton variant="secondary" onClick={() => setEditingId(discount._id)}>
                      Edit
                    </AdminButton>
                    <ConfirmButton
                      question="Delete this code?"
                      onConfirm={() => handleDelete(discount._id)}
                      pending={
                        deleteDiscount.isPending && deleteDiscount.variables === discount._id
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

export default AdminDiscountsPage;
