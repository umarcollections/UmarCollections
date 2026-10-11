import { useState } from 'react';
import { toast } from 'sonner';
import AdminButton from '../admin/AdminButton.jsx';
import ConfirmButton from '../admin/ConfirmButton.jsx';
import OrderActionForm from './OrderActionForm.jsx';
import { useOrderAction } from '../../hooks/orders/useAdminOrders.js';
import { formatPrice } from '../../lib/format.js';
import {
  cancelOrderSchema,
  rejectPaymentSchema,
  shipOrderSchema,
} from '../../validators/orders/adminOrder.schema.js';

// Mirrors ALLOWED_FROM in backend/src/controllers/orders/adminOrder.controller.js
const ALLOWED_FROM = {
  confirm_payment: ['awaiting_payment', 'payment_submitted'],
  reject_payment: ['payment_submitted'],
  ship: ['confirmed'],
  deliver: ['shipped'],
  cancel: ['awaiting_payment', 'payment_submitted', 'confirmed'],
};

const NEXT_STEP = {
  awaiting_payment:
    'Waiting for the customer to pay. Confirm only if the money is in your account.',
  payment_submitted:
    'The customer says they have paid. Check your bank account for the amount and reference.',
  confirmed: 'Paid. Pack the order and mark it as shipped when it leaves.',
  shipped: 'On its way. Mark it delivered once the customer has it.',
  delivered: 'Done. Nothing left to do.',
  cancelled: 'Cancelled. The stock has been returned.',
};

const OrderActions = ({ order }) => {
  const action = useOrderAction(order._id);
  const [form, setForm] = useState(null);
  const can = (name) => ALLOWED_FROM[name].includes(order.status);

  // For the forms: errors are shown inside the form
  const submit = async (body, message) => {
    await action.mutateAsync(body);
    toast.success(message);
    setForm(null);
  };

  // For one-click actions: errors become a toast
  const run = (body, message) =>
    action.mutate(body, {
      onSuccess: () => toast.success(message),
      onError: (err) => toast.error(err.message),
    });

  const forms = {
    reject: (
      <OrderActionForm
        title="Reject payment"
        fields={[
          {
            name: 'note',
            label: 'Reason',
            hint: 'The customer sees this and gets a new deadline to pay',
          },
        ]}
        schema={rejectPaymentSchema}
        submitLabel="Reject payment"
        variant="danger"
        onSubmit={({ note }) => submit({ action: 'reject_payment', note }, 'Payment rejected')}
        onCancel={() => setForm(null)}
      />
    ),
    ship: (
      <OrderActionForm
        title="Mark as shipped"
        fields={[
          { name: 'courier', label: 'Courier (optional)', hint: 'e.g. TCS, Leopards, M&P' },
          { name: 'trackingNumber', label: 'Tracking number (optional)' },
        ]}
        schema={shipOrderSchema}
        submitLabel="Mark as shipped"
        onSubmit={(details) => submit({ action: 'ship', ...details }, 'Marked as shipped')}
        onCancel={() => setForm(null)}
      />
    ),
    cancel: (
      <OrderActionForm
        title="Cancel order"
        fields={[
          {
            name: 'note',
            label: 'Reason (optional)',
            hint: 'The customer sees this. The items go back on sale.',
          },
        ]}
        schema={cancelOrderSchema}
        submitLabel="Cancel order"
        variant="danger"
        onSubmit={({ note }) => submit({ action: 'cancel', note }, 'Order cancelled')}
        onCancel={() => setForm(null)}
      />
    ),
  };

  return (
    <section className="space-y-4 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-5">
      <p className="text-sm text-espresso-800">{NEXT_STEP[order.status]}</p>

      {form ? (
        forms[form]
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {can('confirm_payment') && (
            <ConfirmButton
              variant="primary"
              question={`Received ${formatPrice(order.total)}?`}
              onConfirm={() => run({ action: 'confirm_payment' }, 'Payment confirmed')}
              pending={action.isPending}
            >
              Confirm payment
            </ConfirmButton>
          )}
          {can('reject_payment') && (
            <AdminButton variant="secondary" onClick={() => setForm('reject')}>
              Reject payment
            </AdminButton>
          )}
          {can('ship') && (
            <AdminButton onClick={() => setForm('ship')}>Mark as shipped</AdminButton>
          )}
          {can('deliver') && (
            <ConfirmButton
              variant="primary"
              question="Mark as delivered?"
              onConfirm={() => run({ action: 'deliver' }, 'Marked as delivered')}
              pending={action.isPending}
            >
              Mark as delivered
            </ConfirmButton>
          )}
          {can('cancel') && (
            <AdminButton variant="danger" onClick={() => setForm('cancel')}>
              Cancel order
            </AdminButton>
          )}
        </div>
      )}
    </section>
  );
};

export default OrderActions;
